package com.dsa.assistant.dto.response;

import com.dsa.assistant.entity.ChatMessage;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageResponse {

    private Long id;

    private String role;

    private String content;

    private Boolean isBookmarked;

    private LocalDateTime createdAt;

    public static ChatMessageResponse fromEntity(ChatMessage message) {

        return ChatMessageResponse.builder()
                .id(message.getId())
                .role(message.getRole().name())
                .content(message.getContent())
                .isBookmarked(message.getIsBookmarked())
                .createdAt(message.getCreatedAt())
                .build();
    }
}