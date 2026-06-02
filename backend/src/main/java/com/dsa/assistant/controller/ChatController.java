package com.dsa.assistant.controller;

import com.dsa.assistant.dto.request.ChatMessageRequest;
import com.dsa.assistant.dto.response.*;
import com.dsa.assistant.entity.ChatMessage;
import com.dsa.assistant.entity.ChatSession;
import com.dsa.assistant.entity.User;
import com.dsa.assistant.exception.AppException;
import com.dsa.assistant.repository.ChatMessageRepository;
import com.dsa.assistant.repository.ChatSessionRepository;
import com.dsa.assistant.service.ai.AiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.springframework.security.core.Authentication;
import com.dsa.assistant.repository.UserRepository;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Chat", description = "Chat sessions and AI messaging")
@SecurityRequirement(name = "bearerAuth")
public class ChatController {
    private final UserRepository userRepository;
    private final ChatSessionRepository sessionRepository;
    private final ChatMessageRepository messageRepository;
    private final AiService aiService;
    private final ExecutorService executorService = Executors.newVirtualThreadPerTaskExecutor();

    // ---- Sessions ----
    @GetMapping("/sessions")
        @Operation(summary = "List all chat sessions for current user")
        public ResponseEntity<ApiResponse<Page<ChatSessionResponse>>> getSessions(
                Authentication authentication,
                @RequestParam(defaultValue = "0") int page,
                @RequestParam(defaultValue = "20") int size,
                @RequestParam(required = false) String search) {

        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Pageable pageable = PageRequest.of(page, size);

        Page<ChatSession> sessions;

        if (search != null && !search.isBlank()) {
                sessions = sessionRepository.searchByUserIdAndQuery(
                        user.getId(),
                        search,
                        pageable
                );
        } else {
                sessions = sessionRepository
                        .findByUserIdAndIsArchivedFalseOrderByUpdatedAtDesc(
                                user.getId(),
                                pageable
                        );
        }
        // THÊM ĐOẠN NÀY
        Page<ChatSessionResponse> response =
                sessions.map(ChatSessionResponse::fromEntity);

        return ResponseEntity.ok(
                ApiResponse.success("Fetch sessions successfully", response)
        );
        }
    

    @PostMapping("/sessions")
public ResponseEntity<ApiResponse<ChatSessionResponse>> createSession(
        Authentication authentication,
        @RequestParam(required = false) String title) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new RuntimeException("User not found"));
        ChatSession session = ChatSession.builder()
                .user(user)
                .title(title != null ? title : "Chat mới")
                .build();

        session = sessionRepository.save(session);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo phiên chat thành công", ChatSessionResponse.fromEntity(session)));
    }

    @GetMapping("/sessions/{sessionId}")
    @Operation(summary = "Get session with all messages")
    public ResponseEntity<ApiResponse<ChatSessionDetailResponse>> getSession(
            Authentication authentication,
            @PathVariable Long sessionId) {
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new RuntimeException("User not found"));
        ChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new AppException("Phiên chat không tồn tại", HttpStatus.NOT_FOUND));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new AppException("Không có quyền truy cập", HttpStatus.FORBIDDEN);
        }

        List<ChatMessage> messages = messageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);

        return ResponseEntity.ok(ApiResponse.success("OK",
                ChatSessionDetailResponse.fromEntity(session, messages)));
    }

    @DeleteMapping("/sessions/{sessionId}")
    @Operation(summary = "Delete a chat session")
    public ResponseEntity<ApiResponse<Void>> deleteSession(
            Authentication authentication,
            @PathVariable Long sessionId) {
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new RuntimeException("User not found"));
        ChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new AppException("Phiên chat không tồn tại", HttpStatus.NOT_FOUND));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new AppException("Không có quyền xóa", HttpStatus.FORBIDDEN);
        }

        sessionRepository.delete(session);
        return ResponseEntity.ok(ApiResponse.success("Xóa phiên chat thành công", null));
    }

    @PatchMapping("/sessions/{sessionId}/pin")
    @Operation(summary = "Toggle pin status of a session")
    public ResponseEntity<ApiResponse<ChatSessionResponse>> togglePin(
            Authentication authentication,
            @PathVariable Long sessionId) {
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new RuntimeException("User not found"));
        ChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new AppException("Phiên chat không tồn tại", HttpStatus.NOT_FOUND));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new AppException("Không có quyền", HttpStatus.FORBIDDEN);
        }

        session.setIsPinned(!session.getIsPinned());
        sessionRepository.save(session);

        return ResponseEntity.ok(ApiResponse.success("OK", ChatSessionResponse.fromEntity(session)));
    }

    // ---- Messages ----

    @PostMapping("/sessions/{sessionId}/messages")
    @Operation(summary = "Send a message and get AI response (sync)")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            Authentication authentication,
            @PathVariable Long sessionId,
            @Valid @RequestBody ChatMessageRequest request) {
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new RuntimeException("User not found"));
        ChatSession session = getSessionForUser(sessionId, user);

        // Save user message
        ChatMessage userMessage = ChatMessage.builder()
                .session(session)
                .role(ChatMessage.MessageRole.USER)
                .content(request.getContent())
                .build();
        messageRepository.save(userMessage);

        // Get recent history for context
        List<ChatMessage> history =
        messageRepository.findTop10BySessionIdOrderByCreatedAtDesc(sessionId);

        // Generate AI response
        String aiResponse = aiService.generateResponse(request.getContent(), history);

        // Save AI message
        ChatMessage assistantMessage = ChatMessage.builder()
                .session(session)
                .role(ChatMessage.MessageRole.ASSISTANT)
                .content(aiResponse)
                .build();
        assistantMessage = messageRepository.save(assistantMessage);

        // Update session metadata
        sessionRepository.incrementMessageCount(sessionId,
                request.getContent().substring(0, Math.min(100, request.getContent().length())));

        // Auto-generate title from first message
        if (session.getMessageCount() == 0) {
            String autoTitle = request.getContent().length() > 50
                    ? request.getContent().substring(0, 50) + "..."
                    : request.getContent();
            session.setTitle(autoTitle);
            sessionRepository.save(session);
        }

        return ResponseEntity.ok(ApiResponse.success("OK",
                ChatMessageResponse.fromEntity(assistantMessage)));
    }
    /**
     * Server-Sent Events endpoint for streaming AI responses.
     * Frontend connects and receives token-by-token response.
     */
    @GetMapping(value = "/sessions/{sessionId}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Stream AI response via SSE (Server-Sent Events)")
    
    public SseEmitter streamMessage(
            Authentication authentication,
            @PathVariable Long sessionId,
            @RequestParam String message) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new RuntimeException("User not found"));
        log.info("STREAM USER = {}", user);

        SseEmitter emitter = new SseEmitter(120_000L); // 2 minute timeout

        executorService.submit(() -> {
            try {
                ChatSession session = getSessionForUser(sessionId, user);

                // Save user message
                ChatMessage userMessage = ChatMessage.builder()
                        .session(session)
                        .role(ChatMessage.MessageRole.USER)
                        .content(message)
                        .build();
                messageRepository.save(userMessage);

                // Get context history
                List<ChatMessage> history =
        messageRepository.findTop10BySessionIdOrderByCreatedAtDesc(sessionId);

                // Generate response (would be chunked in real streaming)
                String aiResponse = aiService.generateResponse(message, history);

                // Simulate streaming by sending words
                String[] words = aiResponse.split("(?<=\\s)");
                StringBuilder accumulated = new StringBuilder();

                for (String word : words) {
                    accumulated.append(word);
                    emitter.send(SseEmitter.event()
                            .name("token")
                            .data(word));
                    Thread.sleep(20); // 20ms delay between tokens
                }

                // Save complete AI message
                ChatMessage assistantMessage = ChatMessage.builder()
                        .session(session)
                        .role(ChatMessage.MessageRole.ASSISTANT)
                        .content(accumulated.toString())
                        .build();
                messageRepository.save(assistantMessage);
                sessionRepository.incrementMessageCount(sessionId,
                        message.substring(0, Math.min(100, message.length())));

                // Send completion event
                emitter.send(SseEmitter.event().name("done").data("[DONE]"));
                emitter.complete();

            } catch (IOException | InterruptedException e) {
                log.error("SSE streaming error for session {}", sessionId, e);
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    @PatchMapping("/messages/{messageId}/bookmark")
    @Operation(summary = "Toggle bookmark on a message")
    public ResponseEntity<ApiResponse<Void>> toggleBookmark(
            Authentication authentication,
            @PathVariable Long messageId) {
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new RuntimeException("User not found"));
        ChatMessage message = messageRepository.findById(messageId)
                .orElseThrow(() -> new AppException("Tin nhắn không tồn tại", HttpStatus.NOT_FOUND));

        if (!message.getSession().getUser().getId().equals(user.getId())) {
            throw new AppException("Không có quyền", HttpStatus.FORBIDDEN);
        }

        message.setIsBookmarked(!message.getIsBookmarked());
        messageRepository.save(message);

        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }

    private ChatSession getSessionForUser(Long sessionId, User user) {
        ChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new AppException("Phiên chat không tồn tại", HttpStatus.NOT_FOUND));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new AppException("Không có quyền truy cập", HttpStatus.FORBIDDEN);
        }

        return session;
    }
}