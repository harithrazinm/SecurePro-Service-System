-- Additive schema change for explicitly marked SecurePro test requests.
-- Apply to the intended local/test database before deploying code that uses it.
-- Existing requests remain real requests (is_test = 0 by default).

ALTER TABLE service_requests
    ADD COLUMN is_test TINYINT(1) NOT NULL DEFAULT 0;
