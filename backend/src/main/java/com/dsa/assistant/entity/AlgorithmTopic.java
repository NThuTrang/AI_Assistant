package com.dsa.assistant.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "algorithm_topics")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AlgorithmTopic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    @Column(nullable = false, length = 150)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Difficulty difficulty;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "order_index")
    @Builder.Default
    private Integer orderIndex = 0;

    @Column(length = 100)
    private String icon;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public enum Category {
        DATA_STRUCTURE, SORTING, SEARCHING, GRAPH,
        DYNAMIC_PROGRAMMING, GREEDY, BACKTRACKING, DIVIDE_CONQUER
    }

    public enum Difficulty {
        BEGINNER, INTERMEDIATE, ADVANCED
    }
}