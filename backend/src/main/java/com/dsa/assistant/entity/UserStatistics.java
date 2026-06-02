package com.dsa.assistant.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_statistics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserStatistics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Builder.Default
    private Integer totalChats = 0;

    @Builder.Default
    private Integer totalMessages = 0;

    @Builder.Default
    private Integer totalQuizAttempts = 0;

    @Builder.Default
    private Integer totalQuizCorrect = 0;

    @Builder.Default
    private Integer totalProblemsSolved = 0;

    @Builder.Default
    private Integer totalCodeAnalyses = 0;

    @Builder.Default
    private Integer streakDays = 0;

    @Column(name = "last_activity_date")
    private LocalDate lastActivityDate;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}