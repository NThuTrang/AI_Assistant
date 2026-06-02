package com.dsa.assistant.repository;

import com.dsa.assistant.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    List<QuizAttempt> findByUserIdOrderByStartedAtDesc(Long userId);

    List<QuizAttempt> findByUserIdAndQuizId(Long userId, Long quizId);

    @Query("""
        SELECT AVG(a.score)
        FROM QuizAttempt a
        WHERE a.user.id = :userId
    """)
    Double findAvgScoreByUserId(@Param("userId") Long userId);
}