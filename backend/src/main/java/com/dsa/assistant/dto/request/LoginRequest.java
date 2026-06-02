package com.dsa.assistant.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class LoginRequest {
    @NotBlank(message = "Username/Email không được trống")
    private String usernameOrEmail;

    @NotBlank(message = "Mật khẩu không được trống")
    private String password;
}