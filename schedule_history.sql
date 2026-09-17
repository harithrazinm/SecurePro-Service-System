CREATE TABLE IF NOT EXISTS schedule_history (
    id CHAR(36) NOT NULL,
    request_id CHAR(36) NOT NULL,

    old_technician_id CHAR(36) DEFAULT NULL,
    old_scheduled_date DATE DEFAULT NULL,
    old_scheduled_time TIME DEFAULT NULL,

    new_technician_id CHAR(36) DEFAULT NULL,
    new_scheduled_date DATE DEFAULT NULL,
    new_scheduled_time TIME DEFAULT NULL,

    change_reason TEXT,

    changed_by CHAR(36) NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    INDEX idx_schedule_history_request (request_id),
    INDEX idx_schedule_history_changed_at (changed_at),

    CONSTRAINT fk_schedule_history_request
        FOREIGN KEY (request_id)
        REFERENCES service_requests(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_schedule_history_old_technician
        FOREIGN KEY (old_technician_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_schedule_history_new_technician
        FOREIGN KEY (new_technician_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_schedule_history_changed_by
        FOREIGN KEY (changed_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);
