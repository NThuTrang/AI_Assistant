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
    private final com.dsa.assistant.repository.AlgorithmTopicRepository algorithmTopicRepository;
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

            long completedTopicsCount = userProgressRepository.countCompletedByUserId(user.getId());

            Map<String, Object> realStats = Map.of(
                    "totalChats", stats.getTotalChats() != null ? stats.getTotalChats() : 0,
                    "totalMessages", stats.getTotalMessages() != null ? stats.getTotalMessages() : 0,
                    "totalQuizAttempts", stats.getTotalQuizAttempts() != null ? stats.getTotalQuizAttempts() : 0,
                    "quizAvgScore", avgScore,
                    "totalCodeAnalyses", stats.getTotalCodeAnalyses() != null ? stats.getTotalCodeAnalyses() : 0,
                    "topicsStudied", completedTopicsCount, 
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
        try {
            if (principal == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            String username = principal.getName();
            User user = userRepository.findByUsername(username).orElseThrow();
            
            java.util.List<com.dsa.assistant.entity.AlgorithmTopic> allTopics = algorithmTopicRepository.findAll();
            java.util.List<com.dsa.assistant.entity.UserProgress> userProgressList = userProgressRepository.findByUserIdOrderByUpdatedAtDesc(user.getId());
            
            java.util.Map<Long, com.dsa.assistant.entity.UserProgress> progressMap = new java.util.HashMap<>();
            for (com.dsa.assistant.entity.UserProgress p : userProgressList) {
                progressMap.put(p.getTopic().getId(), p);
            }
                
            java.util.Map<com.dsa.assistant.entity.AlgorithmTopic.Category, java.util.List<com.dsa.assistant.entity.AlgorithmTopic>> topicsByCategory = new java.util.HashMap<>();
            for (com.dsa.assistant.entity.AlgorithmTopic t : allTopics) {
                topicsByCategory.computeIfAbsent(t.getCategory(), k -> new java.util.ArrayList<>()).add(t);
            }
                
            java.util.List<Map<String, Object>> responseList = new java.util.ArrayList<>();
            
            java.util.Map<com.dsa.assistant.entity.AlgorithmTopic.Category, String> CATEGORY_LABELS = Map.of(
                com.dsa.assistant.entity.AlgorithmTopic.Category.DATA_STRUCTURE, "🗂️ Cấu trúc dữ liệu",
                com.dsa.assistant.entity.AlgorithmTopic.Category.SORTING, "📊 Thuật toán sắp xếp",
                com.dsa.assistant.entity.AlgorithmTopic.Category.SEARCHING, "🔍 Tìm kiếm",
                com.dsa.assistant.entity.AlgorithmTopic.Category.GRAPH, "🕸️ Đồ thị",
                com.dsa.assistant.entity.AlgorithmTopic.Category.DYNAMIC_PROGRAMMING, "⚡ Quy hoạch động",
                com.dsa.assistant.entity.AlgorithmTopic.Category.GREEDY, "💡 Tham lam",
                com.dsa.assistant.entity.AlgorithmTopic.Category.BACKTRACKING, "↩️ Quay lui",
                com.dsa.assistant.entity.AlgorithmTopic.Category.DIVIDE_CONQUER, "✂️ Chia để trị"
            );

            com.dsa.assistant.entity.AlgorithmTopic.Category[] orderedCategories = {
                com.dsa.assistant.entity.AlgorithmTopic.Category.DATA_STRUCTURE,
                com.dsa.assistant.entity.AlgorithmTopic.Category.SORTING,
                com.dsa.assistant.entity.AlgorithmTopic.Category.SEARCHING,
                com.dsa.assistant.entity.AlgorithmTopic.Category.GRAPH,
                com.dsa.assistant.entity.AlgorithmTopic.Category.DYNAMIC_PROGRAMMING,
                com.dsa.assistant.entity.AlgorithmTopic.Category.GREEDY,
                com.dsa.assistant.entity.AlgorithmTopic.Category.BACKTRACKING,
                com.dsa.assistant.entity.AlgorithmTopic.Category.DIVIDE_CONQUER
            };

            for (com.dsa.assistant.entity.AlgorithmTopic.Category category : orderedCategories) {
                java.util.List<com.dsa.assistant.entity.AlgorithmTopic> topicsInCat = topicsByCategory.getOrDefault(category, java.util.Collections.emptyList());
                if (topicsInCat.isEmpty()) continue;
                
                int total = topicsInCat.size();
                int completed = 0;
                boolean inProgress = false;
                
                for (com.dsa.assistant.entity.AlgorithmTopic t : topicsInCat) {
                    com.dsa.assistant.entity.UserProgress p = progressMap.get(t.getId());
                    if (p != null) {
                        if (p.getStatus() == com.dsa.assistant.entity.UserProgress.Status.COMPLETED) {
                            completed++;
                        } else if (p.getStatus() == com.dsa.assistant.entity.UserProgress.Status.IN_PROGRESS) {
                            inProgress = true;
                        }
                    }
                }
                
                int pct = Math.round(((float) completed / total) * 100);
                String status = pct == 100 ? "COMPLETED" : (pct > 0 || inProgress ? "IN_PROGRESS" : "NOT_STARTED");
                
                responseList.add(Map.of(
                    "name", CATEGORY_LABELS.getOrDefault(category, category.name()),
                    "pct", pct,
                    "status", status
                ));
            }

            return ResponseEntity.ok(Map.of("data", responseList));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @org.springframework.web.bind.annotation.PostMapping("/progress/learn")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> markTopicLearned(Principal principal, @org.springframework.web.bind.annotation.RequestBody Map<String, Object> request) {
        try {
            if (principal == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            String username = principal.getName();
            User user = userRepository.findByUsername(username).orElseThrow();
            
            Object topicIdObj = request.get("topicId");
            if (topicIdObj == null) return ResponseEntity.badRequest().body(Map.of("error", "Missing topicId"));
            
            Long topicId = Long.valueOf(topicIdObj.toString());
            
            com.dsa.assistant.entity.AlgorithmTopic topic = algorithmTopicRepository.findById(topicId)
                .orElseThrow(() -> new RuntimeException("Topic not found"));
            
            com.dsa.assistant.entity.UserProgress progress = userProgressRepository.findByUserIdAndTopicId(user.getId(), topicId)
                .orElseGet(() -> com.dsa.assistant.entity.UserProgress.builder()
                        .user(user)
                        .topic(topic)
                        .build());
                        
            progress.setStatus(com.dsa.assistant.entity.UserProgress.Status.COMPLETED);
            progress.setCompletionPct(100f);
            progress.setLastActivity(java.time.LocalDateTime.now());
            userProgressRepository.save(progress);
            
            return ResponseEntity.ok(Map.of("message", "Đã lưu tiến độ học tập"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}