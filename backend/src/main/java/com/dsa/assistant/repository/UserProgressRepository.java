package com.dsa.assistant.repository;

import com.dsa.assistant.entity.UserProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserProgressRepository extends JpaRepository<UserProgress, Long> {

    List<UserProgress> findByUserIdOrderByUpdatedAtDesc(Long userId);

    Optional<UserProgress> findByUserIdAndTopicId(Long userId, Long topicId);

    @Query("""
        SELECT COUNT(p)
        FROM UserProgress p
        WHERE p.user.id = :userId
        AND p.status = 'COMPLETED'
    """)
    long countCompletedByUserId(@Param("userId") Long userId);
}