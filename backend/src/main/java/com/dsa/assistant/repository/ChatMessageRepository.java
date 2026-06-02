package com.dsa.assistant.repository;

import com.dsa.assistant.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findBySessionIdOrderByCreatedAtAsc(Long sessionId);

    List<ChatMessage> findTop10BySessionIdOrderByCreatedAtDesc(Long sessionId);

    List<ChatMessage> findBySessionIdAndIsBookmarkedTrue(Long sessionId);
}