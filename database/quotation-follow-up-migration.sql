ALTER TABLE quotations
    ADD COLUMN follow_up_1_sent_at TIMESTAMP NULL AFTER sent_at,
    ADD COLUMN follow_up_2_sent_at TIMESTAMP NULL AFTER follow_up_1_sent_at;