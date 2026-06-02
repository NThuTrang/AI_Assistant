package com.dsa.assistant.dto.response;

import com.dsa.assistant.entity.ChatSession;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatSessionResponse {

    private Long id;

    private String title;

    private Boolean isPinned;

    private Boolean isArchived;

    private Integer messageCount;

    private String lastMessage;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public static ChatSessionResponse fromEntity(ChatSession session) {

        return ChatSessionResponse.builder()
                .id(session.getId())
                .title(session.getTitle())
                .isPinned(session.getIsPinned())
                .isArchived(session.getIsArchived())
                .messageCount(session.getMessageCount())
                .lastMessage(session.getLastMessage())
                .createdAt(session.getCreatedAt())
                .updatedAt(session.getUpdatedAt())
                .build();
    }
}