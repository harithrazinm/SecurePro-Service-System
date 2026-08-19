-- ============================================================
-- SECUREPRO SERVICE MANAGEMENT SYSTEM
-- MySQL 8.0
-- ============================================================

CREATE DATABASE IF NOT EXISTS securepro;

USE securepro;

-- ============================================================
-- 1. USERS
-- Admin and Technician accounts
-- ============================================================

CREATE TABLE users (
    id CHAR(36) NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password VARCHAR(255) NOT NULL,

    role ENUM('admin', 'technician') NOT NULL,

    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
);

-- ============================================================
-- 2. SERVICES
-- Main service catalogue
-- ============================================================

CREATE TABLE services (
    id CHAR(36) NOT NULL,

    service_code VARCHAR(50) NOT NULL,

    name_en VARCHAR(150) NOT NULL,
    name_ms VARCHAR(150) NOT NULL,

    description_en TEXT,
    description_ms TEXT,

    category ENUM('installation', 'support') NOT NULL,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    display_order INT NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_services_code (service_code)
);

-- ============================================================
-- 3. SERVICE QUESTIONS
-- Flexible question engine
-- ============================================================

CREATE TABLE service_questions (
    id CHAR(36) NOT NULL,

    service_id CHAR(36) NOT NULL,

    question_code VARCHAR(100) NOT NULL,

    question_type ENUM(
        'single',
        'multi',
        'number',
        'measurement',
        'counter',
        'text',
        'textarea',
        'file'
    ) NOT NULL,

    title_en TEXT NOT NULL,
    title_ms TEXT NOT NULL,

    description_en TEXT,
    description_ms TEXT,

    placeholder_en VARCHAR(255),
    placeholder_ms VARCHAR(255),

    unit VARCHAR(30),

    min_value DECIMAL(12,3),
    max_value DECIMAL(12,3),
    step_value DECIMAL(12,3),

    required BOOLEAN NOT NULL DEFAULT TRUE,

    display_order INT NOT NULL DEFAULT 0,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_service_question_code (
        service_id,
        question_code
    ),

    CONSTRAINT fk_questions_service
        FOREIGN KEY (service_id)
        REFERENCES services(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ============================================================
-- 4. QUESTION OPTIONS
-- Used by single / multi questions
-- ============================================================

CREATE TABLE question_options (
    id CHAR(36) NOT NULL,

    question_id CHAR(36) NOT NULL,

    option_value VARCHAR(150) NOT NULL,

    label_en VARCHAR(255) NOT NULL,
    label_ms VARCHAR(255) NOT NULL,

    description_en TEXT,
    description_ms TEXT,

    display_order INT NOT NULL DEFAULT 0,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_options_question
        FOREIGN KEY (question_id)
        REFERENCES service_questions(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ============================================================
-- 5. QUESTION CONDITIONS
-- Conditional questions
--
-- Example:
-- If customer selects "CCTV",
-- show CCTV troubleshooting questions.
-- ============================================================

CREATE TABLE question_conditions (
    id CHAR(36) NOT NULL,

    question_id CHAR(36) NOT NULL,

    depends_on_question_id CHAR(36) NOT NULL,

    operator ENUM(
        'equals',
        'not_equals',
        'contains',
        'not_contains'
    ) NOT NULL DEFAULT 'equals',

    expected_value VARCHAR(255) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_condition_question
        FOREIGN KEY (question_id)
        REFERENCES service_questions(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_condition_parent
        FOREIGN KEY (depends_on_question_id)
        REFERENCES service_questions(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ============================================================
-- 6. SERVICE REQUESTS
-- Main customer requests
-- ============================================================

CREATE TABLE service_requests (
    id CHAR(36) NOT NULL,

    request_code VARCHAR(50) NOT NULL,

    service_id CHAR(36) NOT NULL,

    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(150),

    customer_address TEXT,

    customer_notes TEXT,

    status ENUM(
        'pending',
        'assigned',
        'in_progress',
        'waiting_parts',
        'completed',
        'cancelled'
    ) NOT NULL DEFAULT 'pending',

    technician_id CHAR(36),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    completed_at TIMESTAMP NULL,

    PRIMARY KEY (id),

    UNIQUE KEY uq_request_code (request_code),

    CONSTRAINT fk_request_service
        FOREIGN KEY (service_id)
        REFERENCES services(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_request_technician
        FOREIGN KEY (technician_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- ============================================================
-- 7. REQUEST ANSWERS
-- Stores answers dynamically
-- ============================================================

CREATE TABLE request_answers (
    id CHAR(36) NOT NULL,

    request_id CHAR(36) NOT NULL,

    question_id CHAR(36) NOT NULL,

    question_type VARCHAR(30) NOT NULL,

    text_value TEXT,

    number_value DECIMAL(12,3),

    unit VARCHAR(30),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_answer_request
        FOREIGN KEY (request_id)
        REFERENCES service_requests(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_answer_question
        FOREIGN KEY (question_id)
        REFERENCES service_questions(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- ============================================================
-- 8. REQUEST ANSWER OPTIONS
-- Used when answer is single / multiple choice
-- ============================================================

CREATE TABLE request_answer_options (
    id CHAR(36) NOT NULL,

    answer_id CHAR(36) NOT NULL,

    option_id CHAR(36) NOT NULL,

    option_value VARCHAR(150) NOT NULL,

    option_label_en VARCHAR(255) NOT NULL,
    option_label_ms VARCHAR(255) NOT NULL,

    PRIMARY KEY (id),

    CONSTRAINT fk_answer_option_answer
        FOREIGN KEY (answer_id)
        REFERENCES request_answers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_answer_option_option
        FOREIGN KEY (option_id)
        REFERENCES question_options(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- ============================================================
-- 9. CUSTOMER PHOTOS
-- ============================================================

CREATE TABLE customer_photos (
    id CHAR(36) NOT NULL,

    request_id CHAR(36) NOT NULL,

    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,

    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_customer_photo_request
        FOREIGN KEY (request_id)
        REFERENCES service_requests(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ============================================================
-- 10. TECHNICIAN REPORTS
-- ============================================================

CREATE TABLE technician_reports (
    id CHAR(36) NOT NULL,

    request_id CHAR(36) NOT NULL,

    technician_id CHAR(36) NOT NULL,

    diagnosis TEXT,

    problem_found TEXT,

    work_performed TEXT,

    parts_used TEXT,

    recommendations TEXT,

    technician_notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_report_request
        FOREIGN KEY (request_id)
        REFERENCES service_requests(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_report_technician
        FOREIGN KEY (technician_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- ============================================================
-- 11. TECHNICIAN PHOTOS
-- ============================================================

CREATE TABLE technician_photos (
    id CHAR(36) NOT NULL,

    report_id CHAR(36) NOT NULL,

    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,

    photo_type ENUM(
        'before',
        'during',
        'after',
        'other'
    ) NOT NULL DEFAULT 'other',

    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_technician_photo_report
        FOREIGN KEY (report_id)
        REFERENCES technician_reports(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ============================================================
-- 12. REQUEST STATUS HISTORY
-- ============================================================

CREATE TABLE request_status_history (
    id CHAR(36) NOT NULL,

    request_id CHAR(36) NOT NULL,

    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,

    changed_by CHAR(36) NOT NULL,

    remarks TEXT,

    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_status_request
        FOREIGN KEY (request_id)
        REFERENCES service_requests(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_status_user
        FOREIGN KEY (changed_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- ============================================================
-- 13. INDEXES
-- ============================================================

CREATE INDEX idx_requests_status
ON service_requests(status);

CREATE INDEX idx_requests_service
ON service_requests(service_id);

CREATE INDEX idx_requests_technician
ON service_requests(technician_id);

CREATE INDEX idx_requests_created
ON service_requests(created_at);

CREATE INDEX idx_answers_request
ON request_answers(request_id);

CREATE INDEX idx_customer_photos_request
ON customer_photos(request_id);

CREATE INDEX idx_reports_request
ON technician_reports(request_id);

CREATE INDEX idx_reports_technician
ON technician_reports(technician_id);

CREATE INDEX idx_status_history_request
ON request_status_history(request_id);

-- ============================================================
-- END
-- ============================================================