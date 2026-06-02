-- ============================================================
-- V1__init_schema.sql
-- DSA AI Assistant - Database Schema
-- ============================================================

-- Users & Roles
CREATE TABLE roles (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
    username             VARCHAR(50)  NOT NULL UNIQUE,
    email                VARCHAR(150) NOT NULL UNIQUE,
    password_hash        VARCHAR(255) NOT NULL,
    full_name            VARCHAR(100),
    avatar_url           VARCHAR(500),
    role_id              BIGINT NOT NULL DEFAULT 1,
    is_active            BOOLEAN      DEFAULT TRUE,
    email_verified       BOOLEAN      DEFAULT FALSE,
    reset_token          VARCHAR(255),
    reset_token_expires  TIMESTAMP,
    last_login_at        TIMESTAMP,
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles (id)
);

-- Refresh Tokens
CREATE TABLE refresh_tokens (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT       NOT NULL,
    token      VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP    NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Algorithm Topics (curriculum)
CREATE TABLE algorithm_topics (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    name        VARCHAR(150) NOT NULL,
    category    ENUM('DATA_STRUCTURE','SORTING','SEARCHING','GRAPH','DYNAMIC_PROGRAMMING','GREEDY','BACKTRACKING','DIVIDE_CONQUER') NOT NULL,
    difficulty  ENUM('BEGINNER','INTERMEDIATE','ADVANCED') NOT NULL DEFAULT 'BEGINNER',
    description TEXT,
    order_index INT          NOT NULL DEFAULT 0,
    icon        VARCHAR(100),
    is_active   BOOLEAN      DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat Sessions
CREATE TABLE chat_sessions (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT       NOT NULL,
    title         VARCHAR(300) NOT NULL DEFAULT 'New Chat',
    topic_id      BIGINT,
    is_pinned     BOOLEAN      DEFAULT FALSE,
    is_archived   BOOLEAN      DEFAULT FALSE,
    message_count INT          DEFAULT 0,
    last_message  TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES algorithm_topics (id) ON DELETE SET NULL,
    INDEX idx_chat_user (user_id),
    INDEX idx_chat_updated (updated_at)
);

-- Chat Messages
CREATE TABLE chat_messages (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id      BIGINT NOT NULL,
    role            ENUM('USER','ASSISTANT','SYSTEM') NOT NULL,
    content         LONGTEXT NOT NULL,
    tokens_used     INT,
    is_bookmarked   BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions (id) ON DELETE CASCADE,
    INDEX idx_msg_session (session_id),
    INDEX idx_msg_created (created_at)
);

-- Quiz System
CREATE TABLE quizzes (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(300) NOT NULL,
    topic_id     BIGINT,
    difficulty   ENUM('EASY','MEDIUM','HARD') NOT NULL DEFAULT 'MEDIUM',
    quiz_type    ENUM('AI_GENERATED','MANUAL') DEFAULT 'AI_GENERATED',
    time_limit   INT,  -- seconds, NULL = unlimited
    is_published BOOLEAN DEFAULT FALSE,
    created_by   BIGINT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES algorithm_topics (id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE quiz_questions (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    quiz_id          BIGINT NOT NULL,
    question_text    TEXT NOT NULL,
    question_type    ENUM('MULTIPLE_CHOICE','TRUE_FALSE','FILL_BLANK') NOT NULL,
    options          JSON,      -- array of option strings
    correct_answer   TEXT NOT NULL,
    explanation      TEXT,
    points           INT DEFAULT 1,
    order_index      INT DEFAULT 0,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE
);

CREATE TABLE quiz_attempts (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    quiz_id       BIGINT NOT NULL,
    user_id       BIGINT NOT NULL,
    score         FLOAT DEFAULT 0,
    total_points  INT DEFAULT 0,
    answers       JSON,   -- {questionId: userAnswer}
    time_spent    INT,    -- seconds
    completed_at  TIMESTAMP,
    started_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_attempt_user (user_id)
);

-- Practice Problems
CREATE TABLE practice_problems (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    title          VARCHAR(300) NOT NULL,
    topic_id       BIGINT,
    difficulty     ENUM('EASY','MEDIUM','HARD') NOT NULL DEFAULT 'MEDIUM',
    description    LONGTEXT NOT NULL,
    constraints    TEXT,
    examples       JSON,   -- [{input, output, explanation}]
    hints          JSON,   -- [hint strings]
    solution_code  LONGTEXT,
    solution_lang  VARCHAR(20) DEFAULT 'python',
    time_complexity   VARCHAR(50),
    space_complexity  VARCHAR(50),
    is_published   BOOLEAN DEFAULT FALSE,
    created_by     BIGINT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES algorithm_topics (id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
);

-- Uploaded Files (for code analysis)
CREATE TABLE uploaded_files (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT NOT NULL,
    session_id   BIGINT,
    filename     VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    file_path    VARCHAR(500) NOT NULL,
    file_size    BIGINT,
    mime_type    VARCHAR(100),
    language     VARCHAR(50),
    content      LONGTEXT,   -- extracted code content
    ai_analysis  LONGTEXT,   -- stored AI analysis
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES chat_sessions (id) ON DELETE SET NULL
);

-- Bookmarks
CREATE TABLE bookmarks (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    message_id  BIGINT,
    problem_id  BIGINT,
    note        VARCHAR(500),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (message_id) REFERENCES chat_messages (id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES practice_problems (id) ON DELETE CASCADE,
    INDEX idx_bookmark_user (user_id)
);

-- User Progress
CREATE TABLE user_progress (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT NOT NULL,
    topic_id      BIGINT NOT NULL,
    status        ENUM('NOT_STARTED','IN_PROGRESS','COMPLETED') DEFAULT 'NOT_STARTED',
    completion_pct FLOAT DEFAULT 0,
    last_activity TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_topic (user_id, topic_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES algorithm_topics (id) ON DELETE CASCADE
);

-- User Statistics
CREATE TABLE user_statistics (
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id              BIGINT NOT NULL UNIQUE,
    total_chats          INT DEFAULT 0,
    total_messages       INT DEFAULT 0,
    total_quiz_attempts  INT DEFAULT 0,
    total_quiz_correct   INT DEFAULT 0,
    total_problems_solved INT DEFAULT 0,
    total_code_analyses  INT DEFAULT 0,
    streak_days          INT DEFAULT 0,
    last_activity_date   DATE,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- ============================================================
-- Seed Data
-- ============================================================

INSERT INTO roles (name, description) VALUES
    ('ROLE_USER', 'Standard user role'),
    ('ROLE_ADMIN', 'Administrator role');

INSERT INTO algorithm_topics (slug, name, category, difficulty, description, order_index) VALUES
-- Data Structures
('array',        'Array',           'DATA_STRUCTURE', 'BEGINNER',     'Mảng - cấu trúc dữ liệu cơ bản nhất', 1),
('linked-list',  'Linked List',     'DATA_STRUCTURE', 'BEGINNER',     'Danh sách liên kết đơn và đôi',        2),
('stack',        'Stack',           'DATA_STRUCTURE', 'BEGINNER',     'Ngăn xếp - LIFO',                      3),
('queue',        'Queue',           'DATA_STRUCTURE', 'BEGINNER',     'Hàng đợi - FIFO',                      4),
('hash-table',   'Hash Table',      'DATA_STRUCTURE', 'INTERMEDIATE', 'Bảng băm và hàm băm',                  5),
('binary-tree',  'Binary Tree',     'DATA_STRUCTURE', 'INTERMEDIATE', 'Cây nhị phân',                         6),
('bst',          'BST',             'DATA_STRUCTURE', 'INTERMEDIATE', 'Cây tìm kiếm nhị phân',                7),
('avl-tree',     'AVL Tree',        'DATA_STRUCTURE', 'ADVANCED',     'Cây AVL tự cân bằng',                  8),
('heap',         'Heap',            'DATA_STRUCTURE', 'INTERMEDIATE', 'Heap min/max',                         9),
('graph',        'Graph',           'DATA_STRUCTURE', 'INTERMEDIATE', 'Đồ thị - vô hướng và có hướng',        10),
('trie',         'Trie',            'DATA_STRUCTURE', 'ADVANCED',     'Cây tiền tố',                          11),
-- Sorting
('bubble-sort',     'Bubble Sort',     'SORTING',        'BEGINNER',     'Sắp xếp nổi bọt', 12),
('selection-sort',  'Selection Sort',  'SORTING',        'BEGINNER',     'Sắp xếp chọn',     13),
('insertion-sort',  'Insertion Sort',  'SORTING',        'BEGINNER',     'Sắp xếp chèn',     14),
('merge-sort',      'Merge Sort',      'SORTING',        'INTERMEDIATE', 'Sắp xếp trộn',     15),
('quick-sort',      'Quick Sort',      'SORTING',        'INTERMEDIATE', 'Sắp xếp nhanh',    16),
('heap-sort',       'Heap Sort',       'SORTING',        'INTERMEDIATE', 'Sắp xếp vun đống', 17),
-- Searching
('binary-search',  'Binary Search',   'SEARCHING',      'BEGINNER',     'Tìm kiếm nhị phân', 18),
('bfs',            'BFS',             'GRAPH',          'INTERMEDIATE', 'Duyệt theo chiều rộng', 19),
('dfs',            'DFS',             'GRAPH',          'INTERMEDIATE', 'Duyệt theo chiều sâu',  20),
('dijkstra',       'Dijkstra',        'GRAPH',          'ADVANCED',     'Đường đi ngắn nhất Dijkstra', 21),
('bellman-ford',   'Bellman-Ford',    'GRAPH',          'ADVANCED',     'Đường đi ngắn nhất Bellman-Ford', 22),
('floyd-warshall', 'Floyd-Warshall',  'GRAPH',          'ADVANCED',     'Đường đi ngắn nhất mọi cặp đỉnh', 23),
-- Algorithm paradigms
('dynamic-programming', 'Dynamic Programming', 'DYNAMIC_PROGRAMMING', 'ADVANCED', 'Quy hoạch động', 24),
('greedy',              'Greedy',              'GREEDY',               'INTERMEDIATE', 'Thuật toán tham lam', 25),
('backtracking',        'Backtracking',        'BACKTRACKING',         'ADVANCED', 'Quay lui', 26),
('divide-conquer',      'Divide and Conquer',  'DIVIDE_CONQUER',       'INTERMEDIATE', 'Chia để trị', 27);