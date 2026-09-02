-- Run this once on the existing SecurePro database.
ALTER TABLE quotations
    ADD COLUMN quotation_file_url TEXT NULL AFTER terms,
    ADD COLUMN quotation_file_name VARCHAR(255) NULL AFTER quotation_file_url,
    ADD COLUMN payment_proof_url TEXT NULL AFTER quotation_file_name,
    ADD COLUMN payment_proof_name VARCHAR(255) NULL AFTER payment_proof_url,
    ADD COLUMN payment_proof_uploaded_at TIMESTAMP NULL AFTER payment_proof_name,
    ADD COLUMN payment_status ENUM('not_received', 'proof_uploaded', 'verified')
        NOT NULL DEFAULT 'not_received' AFTER payment_proof_uploaded_at;


