-- ============================================================
-- SECUREPRO QUOTATION SYSTEM
-- Database: defaultdb
-- ============================================================


-- ============================================================
-- 1. QUOTATIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS quotations (

    id CHAR(36) NOT NULL,

    quotation_number VARCHAR(50) NOT NULL,

    request_id CHAR(36) NOT NULL,

    subtotal DECIMAL(12,2)
        NOT NULL DEFAULT 0.00,

    discount DECIMAL(12,2)
        NOT NULL DEFAULT 0.00,

    tax DECIMAL(12,2)
        NOT NULL DEFAULT 0.00,

    delivery_charge DECIMAL(12,2)
        NOT NULL DEFAULT 0.00,

    total DECIMAL(12,2)
        NOT NULL DEFAULT 0.00,

    validity_days INT
        NOT NULL DEFAULT 30,

    notes TEXT,

    terms TEXT,

    status ENUM(
        'draft',
        'sent',
        'accepted',
        'rejected',
        'expired'
    )
        NOT NULL DEFAULT 'draft',

    created_by CHAR(36) NOT NULL,

    sent_at TIMESTAMP NULL,

    created_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_quotation_number (
        quotation_number
    ),

    CONSTRAINT fk_quotation_request
        FOREIGN KEY (request_id)
        REFERENCES service_requests(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_quotation_creator
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE

);


-- ============================================================
-- 2. QUOTATION ITEMS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS quotation_items (

    id CHAR(36) NOT NULL,

    quotation_id CHAR(36) NOT NULL,

    description VARCHAR(255) NOT NULL,

    quantity DECIMAL(10,2)
        NOT NULL DEFAULT 1.00,

    unit_price DECIMAL(12,2)
        NOT NULL DEFAULT 0.00,

    amount DECIMAL(12,2)
        NOT NULL DEFAULT 0.00,

    PRIMARY KEY (id),

    CONSTRAINT fk_quotation_item_quotation
        FOREIGN KEY (quotation_id)
        REFERENCES quotations(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE

);


-- ============================================================
-- 3. QUOTATIONS INDEXES
-- ============================================================

CREATE INDEX idx_quotations_request
ON quotations(request_id);


CREATE INDEX idx_quotations_created_by
ON quotations(created_by);


CREATE INDEX idx_quotations_status
ON quotations(status);


-- ============================================================
-- 4. QUOTATION ITEMS INDEX
-- ============================================================

CREATE INDEX idx_quotation_items_quotation
ON quotation_items(quotation_id);


-- ============================================================
-- 5. VERIFY QUOTATION TABLES
-- ============================================================

SHOW TABLES LIKE 'quotation%';


-- ============================================================
-- 6. VERIFY QUOTATIONS TABLE
-- ============================================================

DESCRIBE quotations;


-- ============================================================
-- 7. VERIFY QUOTATION ITEMS TABLE
-- ============================================================

DESCRIBE quotation_items;