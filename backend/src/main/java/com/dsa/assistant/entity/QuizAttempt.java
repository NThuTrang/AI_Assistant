package com.dsa.assistant.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "quiz_attempts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Builder.Default
    private Float score = 0f;

    @Column(name = "total_points")
    @Builder.Default
    private Integer totalPoints = 0;

    @Column(columnDefinition = "JSON")
    private String answers;

    @Column(name = "time_spent")
    private Integer timeSpent;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "started_at", updatable = false)
    private LocalDateTime startedAt;

    @PrePersist
    protected void onCreate() {
        startedAt = LocalDateTime.now();
    }
}