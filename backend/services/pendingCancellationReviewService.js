const pool = require("../config/db");

const PENDING_REQUEST_AGE_DAYS = 30;
const REVIEW_REASON = "Pending without technician assignment for 30 days.";

async function queueStalePendingCancellations() {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [staleRequests] = await connection.query(
            `
            SELECT
                sr.id AS request_id,
                review.id AS review_id,
                review.review_status
            FROM service_requests sr
            LEFT JOIN request_cancellation_reviews review
                ON BINARY review.request_id = BINARY sr.id
            WHERE sr.status = 'pending'
              AND sr.technician_id IS NULL
              AND COALESCE(
                    (
                        SELECT MAX(history.changed_at)
                        FROM request_status_history history
                        WHERE BINARY history.request_id = BINARY sr.id
                          AND history.new_status = 'pending'
                    ),
                    sr.created_at
                  ) <= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL ${PENDING_REQUEST_AGE_DAYS} DAY)
              AND NOT EXISTS (
                    SELECT 1
                    FROM quotations quotation
                    WHERE BINARY quotation.request_id = BINARY sr.id
                      AND quotation.approval_status = 'pending_approval'
              )
              AND (review.id IS NULL OR review.review_status = 'rejected')
            FOR UPDATE
            `
        );

        let queuedCount = 0;
        for (const request of staleRequests) {
            if (request.review_id) {
                const [result] = await connection.query(
                    `
                    UPDATE request_cancellation_reviews
                    SET review_status = 'pending',
                        requested_at = CURRENT_TIMESTAMP,
                        reviewed_by = NULL,
                        reviewed_at = NULL,
                        review_remarks = NULL,
                        reason = ?
                    WHERE id = ? AND review_status = 'rejected'
                    `,
                    [REVIEW_REASON, request.review_id]
                );
                if (result.affectedRows) queuedCount += 1;
                continue;
            }

            await connection.query(
                `
                INSERT INTO request_cancellation_reviews
                    (id, request_id, review_status, reason)
                VALUES (UUID(), ?, 'pending', ?)
                `,
                [request.request_id, REVIEW_REASON]
            );
            queuedCount += 1;
        }

        await connection.commit();
        return queuedCount;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = { queueStalePendingCancellations };
