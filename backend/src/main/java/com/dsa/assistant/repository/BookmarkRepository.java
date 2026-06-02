package com.dsa.assistant.repository;

import com.dsa.assistant.entity.Bookmark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {

    List<Bookmark> findByUserIdOrderByCreatedAtDesc(Long userId);

    void deleteByUserIdAndMessageId(Long userId, Long messageId);

    boolean existsByUserIdAndMessageId(Long userId, Long messageId);
}