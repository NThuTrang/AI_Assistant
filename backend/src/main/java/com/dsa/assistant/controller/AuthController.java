package com.dsa.assistant.controller;

import com.dsa.assistant.dto.request.*;
import com.dsa.assistant.dto.response.*;
import com.dsa.assistant.entity.Role;
import com.dsa.assistant.entity.User;
import com.dsa.assistant.entity.UserStatistics;
import com.dsa.assistant.exception.AppException;
import com.dsa.assistant.repository.RoleRepository;
import com.dsa.assistant.repository.UserRepository;
import com.dsa.assistant.repository.UserStatisticsRepository;
import com.dsa.assistant.security.JwtTokenProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Auth endpoints: register, login, refresh token")
public class AuthController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserStatisticsRepository statisticsRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    @PostMapping("/register")
    @Operation(summary = "Register new user")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {

        // Check duplicates
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException("Username đã tồn tại: " + request.getUsername(), HttpStatus.CONFLICT);
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException("Email đã được đăng ký: " + request.getEmail(), HttpStatus.CONFLICT);
        }

        // Assign default role
        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new AppException("Không tìm thấy role USER", HttpStatus.INTERNAL_SERVER_ERROR));

        // Create user
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(userRole)
                .build();

        user = userRepository.save(user);

        // Initialize statistics
        UserStatistics stats = UserStatistics.builder().user(user).build();
        statisticsRepository.save(stats);

        // Generate tokens
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String accessToken = jwtTokenProvider.generateAccessToken(userDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        log.info("New user registered: {}", user.getUsername());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng ký thành công!",
                        buildAuthResponse(user, accessToken, refreshToken)));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with username/email and password")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {

        // Find user by username or email
        User user = userRepository.findByUsername(request.getUsernameOrEmail())
                .orElseGet(() -> userRepository.findByEmail(request.getUsernameOrEmail())
                        .orElseThrow(() -> new AppException("Tài khoản không tồn tại", HttpStatus.UNAUTHORIZED)));

        // Authenticate
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(user.getUsername(), request.getPassword()));
        } catch (BadCredentialsException e) {
            throw new AppException("Mật khẩu không đúng", HttpStatus.UNAUTHORIZED);
        } catch (DisabledException e) {
            throw new AppException("Tài khoản đã bị vô hiệu hóa", HttpStatus.FORBIDDEN);
        }

        // Update last login
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // Update UserStatistics streak
        UserStatistics stats = statisticsRepository.findByUserId(user.getId())
                .orElseGet(() -> UserStatistics.builder().user(user).build());

        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDate lastActivity = stats.getLastActivityDate();

        if (lastActivity == null || lastActivity.isBefore(today.minusDays(1))) {
            stats.setStreakDays(1);
        } else if (lastActivity.equals(today.minusDays(1))) {
            stats.setStreakDays((stats.getStreakDays() != null ? stats.getStreakDays() : 0) + 1);
        }
        stats.setLastActivityDate(today);
        statisticsRepository.save(stats);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String accessToken = jwtTokenProvider.generateAccessToken(userDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        log.info("User logged in: {}", user.getUsername());

        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công!",
                buildAuthResponse(user, accessToken, refreshToken)));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token using refresh token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @RequestBody RefreshTokenRequest request) {

        String refreshToken = request.getRefreshToken();

        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new AppException("Refresh token không hợp lệ hoặc đã hết hạn", HttpStatus.UNAUTHORIZED);
        }

        String username = jwtTokenProvider.extractUsername(refreshToken);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException("Người dùng không tồn tại", HttpStatus.NOT_FOUND));

        String newAccessToken = jwtTokenProvider.generateAccessToken(userDetails);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        return ResponseEntity.ok(ApiResponse.success("Token đã được làm mới",
                buildAuthResponse(user, newAccessToken, newRefreshToken)));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
            @org.springframework.security.core.annotation.AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success("OK", UserResponse.fromUser(user)));
    }

    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .user(UserResponse.fromUser(user))
                .build();
    }
}