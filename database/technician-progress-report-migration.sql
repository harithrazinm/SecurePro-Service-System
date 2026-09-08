-- SecurePro: technician multiple progress reports
-- Run this once on the existing SecurePro database.

ALTER TABLE service_reports
    ADD COLUMN report_type ENUM('progress','final') NOT NULL DEFAULT 'final' AFTER technician_id,
    ADD COLUMN progress_number INT NULL AFTER report_type,
    ADD COLUMN report_title VARCHAR(150) NULL AFTER progress_number;

UPDATE service_reports
SET report_type = 'final',
    progress_number = NULL,
    report_title = COALESCE(NULLIF(report_title, ''), 'Final Work Report')
WHERE report_type IS NULL OR report_type = 'final';

CREATE INDEX idx_service_reports_type ON service_reports(request_id, technician_id, report_type, created_at);
