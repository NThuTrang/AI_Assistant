package com.dsa.assistant.controller;

import com.dsa.assistant.entity.User;
import com.dsa.assistant.entity.UserStatistics;
import com.dsa.assistant.repository.UserProgressRepository;
import com.dsa.assistant.repository.UserRepository;
import com.dsa.assistant.repository.UserStatisticsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserStatisticsRepository userStatisticsRepository;
    private final UserProgressRepository userProgressRepository;
    // Thêm UserRepository để tìm tài khoản y như bên Quiz
    private final UserRepository userRepository;

    @GetMapping("/statistics")
    public ResponseEntity<?> getUserStatistics(Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Không tìm thấy thông tin đăng nhập!"));
            }

            // Tự tìm user từ DB an toàn tuyệt đối
            String username = principal.getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản trong DB"));

            UserStatistics stats = userStatisticsRepository.findByUserId(user.getId()).orElse(null);

            if (stats == null) {
                Map<String, Object> emptyStats = Map.of(
                        "totalChats", 0, "totalMessages", 0, "totalQuizAttempts", 0,
                        "quizAvgScore", 0, "totalCodeAnalyses", 0, "topicsStudied", 0,
                        "streakDays", 0, "totalProblemsSolved", 0
                );
                return ResponseEntity.ok(Map.of("data", emptyStats));
            }

            // Tính điểm trung bình
            int avgScore = 0;
            if (stats.getTotalQuizAttempts() != null && stats.getTotalQuizAttempts() > 0) {
                avgScore = Math.round(((float) stats.getTotalQuizCorrect() / stats.getTotalQuizAttempts()) * 10);
                if (avgScore > 100) avgScore = 100;
            }

            Map<String, Object> realStats = Map.of(
                    "totalChats", stats.getTotalChats() != null ? stats.getTotalChats() : 0,
                    "totalMessages", stats.getTotalMessages() != null ? stats.getTotalMessages() : 0,
                    "totalQuizAttempts", stats.getTotalQuizAttempts() != null ? stats.getTotalQuizAttempts() : 0,
                    "quizAvgScore", avgScore,
                    "totalCodeAnalyses", stats.getTotalCodeAnalyses() != null ? stats.getTotalCodeAnalyses() : 0,
                    "topicsStudied", 0, 
                    "streakDays", stats.getStreakDays() != null ? stats.getStreakDays() : 0,
                    "totalProblemsSolved", stats.getTotalProblemsSolved() != null ? stats.getTotalProblemsSolved() : 0
            );

            return ResponseEntity.ok(Map.of("data", realStats));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/progress")
    public ResponseEntity<?> getUserProgress(Principal principal) {
        return ResponseEntity.ok(Map.of("data", Collections.emptyList()));
    }
}