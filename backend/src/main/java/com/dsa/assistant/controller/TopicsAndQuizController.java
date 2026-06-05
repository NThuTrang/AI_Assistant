package com.dsa.assistant.controller;

import com.dsa.assistant.dto.response.*;
import com.dsa.assistant.entity.AlgorithmTopic;
import com.dsa.assistant.entity.User;
import com.dsa.assistant.repository.AlgorithmTopicRepository;
import com.dsa.assistant.service.ai.AiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.dsa.assistant.repository.UserStatisticsRepository;
import java.util.List;
import java.util.Map;

// ===================== Topics Controller =====================
@RestController
@RequestMapping("/topics")
@RequiredArgsConstructor
@Tag(name = "Topics", description = "Algorithm topics and curriculum")
class TopicsController {

    private final AlgorithmTopicRepository topicRepository;

    @GetMapping
    @Operation(summary = "Get all algorithm topics grouped by category")
    public ResponseEntity<ApiResponse<List<AlgorithmTopic>>> getAllTopics() {
        List<AlgorithmTopic> topics = topicRepository.findByIsActiveTrueOrderByOrderIndexAsc();
        return ResponseEntity.ok(ApiResponse.success("OK", topics));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Get topic by slug")
    public ResponseEntity<ApiResponse<AlgorithmTopic>> getTopicBySlug(@PathVariable String slug) {
        AlgorithmTopic topic = topicRepository.findBySlug(slug)
                .orElseThrow(() -> new com.dsa.assistant.exception.AppException(
                        "Topic không tồn tại: " + slug, org.springframework.http.HttpStatus.NOT_FOUND));
        return ResponseEntity.ok(ApiResponse.success("OK", topic));
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Get topics by category")
    public ResponseEntity<ApiResponse<List<AlgorithmTopic>>> getByCategory(
            @PathVariable AlgorithmTopic.Category category) {
        List<AlgorithmTopic> topics = topicRepository.findByCategoryOrderByOrderIndexAsc(category);
        return ResponseEntity.ok(ApiResponse.success("OK", topics));
    }
}

// ===================== Quiz Controller =====================
@RestController
@RequestMapping("/quiz")
@RequiredArgsConstructor
@Tag(name = "Quiz", description = "AI-generated quizzes")
class QuizController {

    private final AiService aiService;
    private final com.dsa.assistant.repository.UserStatisticsRepository userStatisticsRepository;
    
    // THÊM DÒNG NÀY ĐỂ TỰ TÌM USER TRONG DATABASE
    private final com.dsa.assistant.repository.UserRepository userRepository;

    @PostMapping("/generate")
    @Operation(summary = "AI generate quiz for a topic")
    public ResponseEntity<ApiResponse<String>> generateQuiz(
            @AuthenticationPrincipal User user,
            @RequestParam String topic,
            @RequestParam(defaultValue = "MEDIUM") String difficulty,
            @RequestParam(defaultValue = "5") int questionCount) {

        String quizJson = aiService.generateQuiz(topic, difficulty, questionCount);
        return ResponseEntity.ok(ApiResponse.success("Quiz đã được tạo!", quizJson));
    }

    @PostMapping("/ask")
    @Operation(summary = "Ask AI a question about algorithms (no session needed)")
    public ResponseEntity<ApiResponse<Map<String, String>>> askQuestion(
            @RequestBody Map<String, String> request) {

        String question = request.get("question");
        if (question == null || question.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Câu hỏi không được để trống"));
        }

        String answer = aiService.generateResponse(question, List.of());
        return ResponseEntity.ok(ApiResponse.success("OK", Map.of("answer", answer)));
    }

    // ========================================================
    // HÀM NHẬN ĐIỂM (ĐÃ NÂNG CẤP BỎ QUA @AuthenticationPrincipal)
    // ========================================================
    @PostMapping("/submit")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> submitQuizResult(
            java.security.Principal principal, // ĐỔI CÁCH LẤY THÔNG TIN ĐĂNG NHẬP Ở ĐÂY
            @RequestBody Map<String, Integer> resultData) {
        
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body(ApiResponse.error("Không tìm thấy thông tin đăng nhập!"));
            }

            // 1. Lấy tên "Trang" từ Token, sau đó chui vào Database móc đối tượng User ra
            String username = principal.getName();
            com.dsa.assistant.entity.User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản trong DB"));

            // 2. Xử lý lưu điểm
            int correctAnswers = resultData.getOrDefault("correctAnswers", 0);

            com.dsa.assistant.entity.UserStatistics stats = userStatisticsRepository.findByUserId(user.getId())
                    .orElseGet(() -> com.dsa.assistant.entity.UserStatistics.builder().user(user).build());

            int currentAttempts = stats.getTotalQuizAttempts() != null ? stats.getTotalQuizAttempts() : 0;
            int currentCorrect = stats.getTotalQuizCorrect() != null ? stats.getTotalQuizCorrect() : 0;

            stats.setTotalQuizAttempts(currentAttempts + 1);
            stats.setTotalQuizCorrect(currentCorrect + correctAnswers);
            stats.setLastActivityDate(java.time.LocalDate.now());

            userStatisticsRepository.save(stats);

            return ResponseEntity.ok(ApiResponse.success("Đã lưu điểm thành công!", null));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Chi tiết lỗi Backend: " + e.toString()));
        }
    }
}

// ===================== Code Analysis Controller =====================
@RestController
@RequestMapping("/code")
@RequiredArgsConstructor
@Tag(name = "Code Analysis", description = "AI code analysis and review")
class CodeAnalysisController {

    private final AiService aiService;
    private final com.dsa.assistant.repository.UserRepository userRepository;
    private final com.dsa.assistant.repository.UserStatisticsRepository userStatisticsRepository;

    @PostMapping("/analyze")
    @org.springframework.transaction.annotation.Transactional
    @Operation(summary = "Analyze code for bugs and complexity")
    public ResponseEntity<ApiResponse<Map<String, String>>> analyzeCode(
            java.security.Principal principal,
            @RequestBody Map<String, String> request) {

        String code = request.get("code");
        String language = request.getOrDefault("language", "python");

        if (code == null || code.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Code không được để trống"));
        }

        String analysis = aiService.analyzeCode(code, language);

        // Cập nhật thống kê nếu người dùng đã đăng nhập
        if (principal != null) {
            try {
                String username = principal.getName();
                com.dsa.assistant.entity.User user = userRepository.findByUsername(username).orElse(null);
                if (user != null) {
                    com.dsa.assistant.entity.UserStatistics stats = userStatisticsRepository.findByUserId(user.getId())
                            .orElseGet(() -> com.dsa.assistant.entity.UserStatistics.builder().user(user).build());

                    int currentAnalyses = stats.getTotalCodeAnalyses() != null ? stats.getTotalCodeAnalyses() : 0;
                    stats.setTotalCodeAnalyses(currentAnalyses + 1);
                    stats.setLastActivityDate(java.time.LocalDate.now());

                    userStatisticsRepository.save(stats);
                }
            } catch (Exception e) {
                // Log lỗi nhưng không làm gián đoạn response trả về
                e.printStackTrace();
            }
        }

        return ResponseEntity.ok(ApiResponse.success("Phân tích hoàn thành", Map.of("analysis", analysis)));
    }

    @PostMapping("/generate")
    @Operation(summary = "Generate code example for an algorithm")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateCode(
            @RequestBody Map<String, String> request) {

        String algorithm = request.get("algorithm");
        String language = request.getOrDefault("language", "python");

        String prompt = String.format(
                "Viết code %s triển khai thuật toán/CTDL '%s'. " +
                        "Có comment giải thích, test case, và phân tích độ phức tạp.",
                language, algorithm);

        String code = aiService.generateResponse(prompt, List.of());
        return ResponseEntity.ok(ApiResponse.success("OK", Map.of("code", code)));
    }
}

// ===================== Practice Problems Controller =====================
@RestController
@RequestMapping("/problems")
@RequiredArgsConstructor
@Tag(name = "Practice", description = "Practice problems and exercises")
class PracticeController {

    private final AiService aiService;

    @PostMapping("/generate")
    @Operation(summary = "AI generate practice problems")
    public ResponseEntity<ApiResponse<String>> generateProblems(
            @RequestParam String topic,
            @RequestParam(defaultValue = "MEDIUM") String difficulty,
            @RequestParam(defaultValue = "3") int count) {

        String problems = aiService.generatePracticeProblems(topic, difficulty, count);
        return ResponseEntity.ok(ApiResponse.success("OK", problems));
    }
}