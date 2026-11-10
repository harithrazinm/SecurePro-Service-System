-- Optional bookkeeping table for the explicit Cloudinary-to-local migration.
-- Apply manually after reviewing and backing up the production database.
-- The application does not create or modify this table automatically.

CREATE TABLE IF NOT EXISTS media_migration_history (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    source_table VARCHAR(64) NOT NULL,
    source_column VARCHAR(64) NOT NULL,
    source_id VARCHAR(64) NOT NULL,
    cloudinary_url TEXT NOT NULL,
    local_reference VARCHAR(500) NOT NULL,
    migrated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    rolled_back_at DATETIME NULL,
    PRIMARY KEY (id),
    KEY idx_media_migration_source (source_table, source_column, source_id),
    KEY idx_media_migration_pending_rollback (rolled_back_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
