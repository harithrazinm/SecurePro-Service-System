-- Keep replaced quotation PDFs available in the Super Admin review screen.
-- Apply once to the SecurePro database before deploying the backend changes.
CREATE TABLE IF NOT EXISTS quotation_revision_files (
    id CHAR(36) NOT NULL,
    quotation_id CHAR(36) NOT NULL,
    revision_number INT UNSIGNED NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    archived_by CHAR(36) NULL,
    archived_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_quotation_revision_file (quotation_id, revision_number),
    KEY idx_quotation_revision_archive (quotation_id, archived_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
