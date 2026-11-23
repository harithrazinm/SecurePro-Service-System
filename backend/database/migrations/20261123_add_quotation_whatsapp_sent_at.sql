-- Track the Admin's confirmation that an approved quotation was sent via WhatsApp.
-- Apply once to the SecurePro database before deploying the New System workflow changes.
ALTER TABLE quotations
    ADD COLUMN whatsapp_sent_at TIMESTAMP NULL DEFAULT NULL AFTER sent_at;
