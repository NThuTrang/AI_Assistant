package com.dsa.assistant.repository;

import com.dsa.assistant.entity.User;
import com.dsa.assistant.entity.UserStatistics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserStatisticsRepository extends JpaRepository<UserStatistics, Long> {

    // Hàm cũ của bạn (giữ nguyên để không ảnh hưởng các phần khác nếu có)
    Optional<UserStatistics> findByUserId(Long userId);

    // Hàm mới thêm vào để dùng trong UserController
    Optional<UserStatistics> findByUser(User user);
}