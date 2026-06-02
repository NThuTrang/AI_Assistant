package com.dsa.assistant;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * DSA AI Assistant — Spring Boot Application Entry Point
 */
@SpringBootApplication
@EnableJpaRepositories
public class DsaAiAssistantApplication {

    public static void main(String[] args) {
        SpringApplication.run(DsaAiAssistantApplication.class, args);
        System.out.println("""
                ╔══════════════════════════════════════════╗
                ║   DSA AI Assistant — Server Started      ║
                ║   API: http://localhost:8080/api         ║
                ║   Swagger: http://localhost:8080/api/    ║
                ║           swagger-ui.html                ║
                ╚══════════════════════════════════════════╝
                """);
    }
}