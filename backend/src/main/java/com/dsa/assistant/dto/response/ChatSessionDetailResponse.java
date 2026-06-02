package com.dsa.assistant.dto.response;

import com.dsa.assistant.entity.ChatMessage;
import com.dsa.assistant.entity.ChatSession;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatSessionDetailResponse {

    private Long id;

    private String title;

    private Boolean isPinned;

    private Integer messageCount;

    private List<ChatMessageResponse> messages;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public static ChatSessionDetailResponse fromEntity(
            ChatSession session,
            List<ChatMessage> messages
    ) {

        return ChatSessionDetailResponse.builder()
                .id(session.getId())
                .title(session.getTitle())
                .isPinned(session.getIsPinned())
                .messageCount(session.getMessageCount())
                .messages(
                        messages.stream()
                                .map(ChatMessageResponse::fromEntity)
                                .collect(Collectors.toList())
                )
                .createdAt(session.getCreatedAt())
                .updatedAt(session.getUpdatedAt())
                .build();
    }
}