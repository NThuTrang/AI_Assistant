package com.dsa.assistant.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

/**
 * WebSocket config using STOMP protocol over SockJS.
 * Frontend connects to /ws, subscribes to /topic/chat/{sessionId}
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Simple in-memory broker for topic subscriptions
        registry.enableSimpleBroker("/topic", "/queue");
        // Client sends to /app/... endpoints
        registry.setApplicationDestinationPrefixes("/app");
        // User-specific queues: /user/{userId}/queue/...
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS(); // fallback for browsers without native WebSocket
    }
}