-- Stores browser FCM registration tokens for active Admin users.
-- Apply to the target database before deploying the Admin push endpoints.
CREATE TABLE IF NOT EXISTS admin_push_subscriptions (
    id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    token TEXT NOT NULL,
    token_hash CHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_admin_push_token (token_hash),
    KEY idx_admin_push_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
