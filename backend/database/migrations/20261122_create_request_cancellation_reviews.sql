-- Requests pending for 30 days are queued for Admin review, not cancelled automatically.
CREATE TABLE IF NOT EXISTS request_cancellation_reviews (
    id CHAR(36) NOT NULL,
    request_id CHAR(36) NOT NULL,
    review_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    reason VARCHAR(255) NOT NULL,
    review_remarks TEXT NULL,
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by CHAR(36) NULL,
    reviewed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_request_cancellation_review (request_id),
    KEY idx_cancellation_review_status (review_status, requested_at),
    KEY idx_cancellation_reviewed_by (reviewed_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
