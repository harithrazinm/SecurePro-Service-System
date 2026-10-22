-- Track whether a request was filled by a customer or an admin.
-- Shared form submissions default to customer; admins can classify a request
-- from the admin request details page.
ALTER TABLE service_requests
    ADD COLUMN filled_by ENUM('customer', 'admin') NOT NULL DEFAULT 'customer'
    AFTER customer_notes;

CREATE INDEX idx_service_requests_filled_by_created_at
    ON service_requests (filled_by, created_at);
