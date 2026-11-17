-- Stores browser Web Push subscriptions owned by authenticated Super Admins.
-- Apply once to the SecurePro database before enabling notifications.
CREATE TABLE IF NOT EXISTS super_admin_webpush_subscriptions (
    id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    endpoint TEXT NOT NULL,
    endpoint_hash CHAR(64) NOT NULL,
    p256dh VARCHAR(512) NOT NULL,
    auth VARCHAR(512) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_super_admin_webpush_endpoint (endpoint_hash),
    KEY idx_super_admin_webpush_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
