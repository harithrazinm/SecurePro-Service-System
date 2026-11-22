const pool = require("../config/db");

async function getPendingCancellationReviews(req, res) {
    try {
        const [reviews] = await pool.query(
            `
            SELECT
                review.id,
                sr.id AS request_id,
                sr.request_code,
                sr.customer_name,
                sr.customer_phone,
                sr.customer_email,
                s.service_code,
                s.name_en AS service_name,
                review.reason,
                DATE_FORMAT(review.requested_at, '%Y-%m-%d %H:%i:%s') AS requested_at,
                DATE_FORMAT(
                    COALESCE(
                        (
                            SELECT MAX(history.changed_at)
                            FROM request_status_history history
                            WHERE BINARY history.request_id = BINARY sr.id
                              AND history.new_status = 'pending'
                        ),
                        sr.created_at
                    ),
                    '%Y-%m-%d %H:%i:%s'
                ) AS pending_since
            FROM request_cancellation_reviews review
            INNER JOIN service_requests sr
                ON BINARY sr.id = BINARY review.request_id
            INNER JOIN services s
                ON s.id = sr.service_id
            WHERE review.review_status = 'pending'
            ORDER BY review.requested_at ASC
            `
        );

        return res.json({ success: true, data: reviews });
    } catch (error) {
        console.error("Get cancellation review queue error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to load cancellation reviews."
        });
    }
}

async function approveCancellationReview(req, res) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.query(
            `
            SELECT review.id, review.request_id, review.review_status,
                   sr.status AS request_status, sr.technician_id
            FROM request_cancellation_reviews review
            INNER JOIN service_requests sr
                ON BINARY sr.id = BINARY review.request_id
            WHERE review.id = ?
            FOR UPDATE
            `,
            [req.params.id]
        );

        if (!rows.length) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: "Cancellation review not found." });
        }

        const review = rows[0];
        if (review.review_status !== "pending" || review.request_status !== "pending" || review.technician_id) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                message: "This request is no longer eligible for cancellation approval. Refresh the queue."
            });
        }

        const [update] = await connection.query(
            `UPDATE service_requests
             SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND status = 'pending' AND technician_id IS NULL`,
            [review.request_id]
        );
        if (!update.affectedRows) {
            await connection.rollback();
            return res.status(409).json({ success: false, message: "The request changed before it could be cancelled." });
        }

        const remarks = String(req.body?.remarks || "").trim() || "Cancellation approved by Admin after 30-day pending review.";
        await connection.query(
            `INSERT INTO request_status_history
                (id, request_id, old_status, new_status, changed_by, remarks)
             VALUES (UUID(), ?, 'pending', 'cancelled', ?, ?)`,
            [review.request_id, req.user.id, remarks]
        );
        await connection.query(
            `UPDATE request_cancellation_reviews
             SET review_status = 'approved', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP,
                 review_remarks = ?
             WHERE id = ? AND review_status = 'pending'`,
            [req.user.id, remarks, review.id]
        );

        await connection.commit();
        return res.json({ success: true, message: "Cancellation approved. The service request is now cancelled." });
    } catch (error) {
        await connection.rollback();
        console.error("Approve cancellation review error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to approve this cancellation." });
    } finally {
        connection.release();
    }
}

async function rejectCancellationReview(req, res) {
    const reason = String(req.body?.reason || "").trim();
    if (!reason) {
        return res.status(400).json({ success: false, message: "Enter a reason for rejecting the cancellation." });
    }
    if (reason.length > 2000) {
        return res.status(400).json({ success: false, message: "The rejection reason must be 2,000 characters or fewer." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.query(
            `
            SELECT review.id, review.request_id, review.review_status,
                   sr.status AS request_status, sr.technician_id
            FROM request_cancellation_reviews review
            INNER JOIN service_requests sr
                ON BINARY sr.id = BINARY review.request_id
            WHERE review.id = ?
            FOR UPDATE
            `,
            [req.params.id]
        );

        if (!rows.length) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: "Cancellation review not found." });
        }

        const review = rows[0];
        if (review.review_status !== "pending" || review.request_status !== "pending" || review.technician_id) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                message: "This request is no longer eligible for cancellation review. Refresh the queue."
            });
        }

        await connection.query(
            `UPDATE request_cancellation_reviews
             SET review_status = 'rejected', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP,
                 review_remarks = ?
             WHERE id = ? AND review_status = 'pending'`,
            [req.user.id, reason, review.id]
        );
        await connection.query(
            `UPDATE service_requests SET updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'`,
            [review.request_id]
        );
        await connection.query(
            `INSERT INTO request_status_history
                (id, request_id, old_status, new_status, changed_by, remarks)
             VALUES (UUID(), ?, 'pending', 'pending', ?, ?)`,
            [review.request_id, req.user.id, `Cancellation rejected; pending period restarted. Reason: ${reason}`]
        );

        await connection.commit();
        return res.json({ success: true, message: "Cancellation rejected. The request remains pending and its 30-day period has restarted." });
    } catch (error) {
        await connection.rollback();
        console.error("Reject cancellation review error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to reject this cancellation." });
    } finally {
        connection.release();
    }
}

module.exports = {
    getPendingCancellationReviews,
    approveCancellationReview,
    rejectCancellationReview
};
