package com.dsa.assistant.repository;

import com.dsa.assistant.entity.Quiz;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {

    Page<Quiz> findByIsPublishedTrue(Pageable pageable);

    Page<Quiz> findByTopicIdAndIsPublishedTrue(
            Long topicId,
            Pageable pageable
    );

    Page<Quiz> findByDifficultyAndIsPublishedTrue(
            Quiz.Difficulty difficulty,
            Pageable pageable
    );
}