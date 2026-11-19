-- Persist Super Admin dashboard alerts and read state across browsers/devices.
-- Apply once to the SecurePro production database before deploying the API changes.
CREATE TABLE IF NOT EXISTS super_admin_notifications (
    id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    notification_key VARCHAR(191) NOT NULL,
    type VARCHAR(40) NOT NULL,
    source_id CHAR(36) NULL,
    title VARCHAR(190) NOT NULL,
    message VARCHAR(500) NOT NULL,
    link VARCHAR(500) NOT NULL,
    read_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_super_admin_notification (user_id, notification_key),
    KEY idx_super_admin_notifications_unread (user_id, read_at, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
