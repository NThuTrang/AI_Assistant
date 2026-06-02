package com.dsa.assistant.repository;

import com.dsa.assistant.entity.AlgorithmTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlgorithmTopicRepository extends JpaRepository<AlgorithmTopic, Long> {

    Optional<AlgorithmTopic> findBySlug(String slug);

    List<AlgorithmTopic> findByIsActiveTrueOrderByOrderIndexAsc();

    List<AlgorithmTopic> findByCategoryOrderByOrderIndexAsc(
            AlgorithmTopic.Category category
    );

    List<AlgorithmTopic> findByDifficultyOrderByOrderIndexAsc(
            AlgorithmTopic.Difficulty difficulty
    );
}