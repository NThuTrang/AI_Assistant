package com.dsa.assistant.repository;

import com.dsa.assistant.entity.ChatSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {

    Page<ChatSession> findByUserIdAndIsArchivedFalseOrderByUpdatedAtDesc(
            Long userId,
            Pageable pageable
    );

    List<ChatSession> findByUserIdAndIsPinnedTrueOrderByUpdatedAtDesc(
            Long userId
    );

    @Query("""
        SELECT s FROM ChatSession s
        WHERE s.user.id = :userId
        AND (
            LOWER(s.title) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(s.lastMessage) LIKE LOWER(CONCAT('%', :q, '%'))
        )
    """)
    Page<ChatSession> searchByUserIdAndQuery(
            @Param("userId") Long userId,
            @Param("q") String query,
            Pageable pageable
    );

    @Modifying
    @Transactional
    @Query("""
        UPDATE ChatSession s
        SET s.messageCount = s.messageCount + 1,
            s.lastMessage = :lastMsg,
            s.updatedAt = CURRENT_TIMESTAMP
        WHERE s.id = :id
    """)
    void incrementMessageCount(
            @Param("id") Long sessionId,
            @Param("lastMsg") String lastMessage
    );
}