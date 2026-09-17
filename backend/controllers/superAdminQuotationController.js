const pool = require("../config/db");


/*
 * ======================================================
 * SUPER ADMIN QUOTATION APPROVAL
 * ======================================================
 *
 * Flow:
 * Admin uploads quotation
 *        ↓
 * Pending approval
 *        ↓
 * Super Admin approves OR requests revision
 *
 * This controller is intentionally separate from the
 * normal quotation controller so approval permissions
 * remain isolated.
 * ======================================================
 */


/*
 * ======================================================
 * GET QUOTATION APPROVAL QUEUE
 * ======================================================
 */

async function getQuotationApprovalQueue(req, res) {

    try {

        const [rows] = await pool.query(`
            SELECT
                q.id,
                q.quotation_number,
                q.request_id,
                q.quotation_file_url,
                q.quotation_file_name,
                q.status,
                q.approval_status,
                q.approval_remarks,
                q.approved_by,
                q.approved_at,
                q.revision_number,
                q.revised_at,
                q.created_at,
                q.updated_at,

                r.request_code,
                r.customer_name,
                r.customer_phone,
                r.customer_email,

                s.name_en AS service_name,

                creator.name AS created_by_name,

                approver.name AS approved_by_name

            FROM quotations q

            INNER JOIN service_requests r
                ON r.id = q.request_id

            INNER JOIN services s
                ON s.id = r.service_id

            LEFT JOIN users creator
                ON creator.id = q.created_by

            LEFT JOIN users approver
                ON approver.id = q.approved_by

            WHERE
                (
                    q.quotation_type = 'original'
                    OR q.quotation_type IS NULL
                )

            ORDER BY
                CASE
                    WHEN q.approval_status = 'pending_approval'
                    THEN 1
                    WHEN q.approval_status = 'revision_required'
                    THEN 2
                    WHEN q.approval_status = 'approved'
                    THEN 3
                    ELSE 4
                END,
                COALESCE(q.updated_at, q.created_at) DESC
        `);


        return res.json({
            success: true,
            data: rows
        });

    } catch (error) {

        console.error(
            "Get quotation approval queue error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve quotation approvals."
        });

    }

}


/*
 * ======================================================
 * GET QUOTATION REVIEW DETAIL
 * ======================================================
 */

async function getQuotationReview(req, res) {

    try {

        const [quotations] = await pool.query(`
            SELECT
                q.*,

                r.request_code,
                r.customer_name,
                r.customer_phone,
                r.customer_email,
                r.customer_address,

                s.name_en AS service_name,

                creator.name AS created_by_name,

                approver.name AS approved_by_name

            FROM quotations q

            INNER JOIN service_requests r
                ON r.id = q.request_id

            INNER JOIN services s
                ON s.id = r.service_id

            LEFT JOIN users creator
                ON creator.id = q.created_by

            LEFT JOIN users approver
                ON approver.id = q.approved_by

            WHERE q.id = ?

            LIMIT 1
        `, [req.params.id]);


        if (!quotations.length) {

            return res.status(404).json({
                success: false,
                message: "Quotation not found."
            });

        }


        const quotation = quotations[0];


        let reviews = [];

        try {

            const [reviewRows] = await pool.query(`
                SELECT
                    qr.id,
                    qr.quotation_id,
                    qr.revision_number,
                    qr.decision,
                    qr.remarks,
                    qr.reviewed_by,
                    qr.created_at,

                    reviewer.name AS reviewer_name

                FROM quotation_reviews qr

                LEFT JOIN users reviewer
                    ON reviewer.id = qr.reviewed_by

                WHERE qr.quotation_id = ?

                ORDER BY qr.created_at DESC
            `, [quotation.id]);

            reviews = reviewRows;

        } catch (historyError) {

            /*
             * The approval itself does not depend on history.
             * If an older database does not yet contain the
             * optional history table, return an empty history.
             */
            console.warn(
                "Quotation review history unavailable:",
                historyError.message
            );

        }


        return res.json({
            success: true,
            data: {
                quotation,
                reviews
            }
        });

    } catch (error) {

        console.error(
            "Get quotation review error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve quotation review."
        });

    }

}


/*
 * ======================================================
 * APPROVE QUOTATION
 * ======================================================
 */

async function approveQuotation(req, res) {

    const connection =
        await pool.getConnection();

    try {

        await connection.beginTransaction();


        const [rows] =
            await connection.query(`
                SELECT
                    id,
                    quotation_number,
                    quotation_file_url,
                    approval_status,
                    revision_number
                FROM quotations
                WHERE id = ?
                LIMIT 1
            `, [req.params.id]);


        if (!rows.length) {

            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Quotation not found."
            });

        }


        const quotation =
            rows[0];


        if (!quotation.quotation_file_url) {

            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "This quotation does not have an uploaded PDF."
            });

        }


        if (
            ![
                "pending_approval",
                "revision_required"
            ].includes(
                quotation.approval_status
            )
        ) {

            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    `This quotation is already ${quotation.approval_status}.`
            });

        }


        await connection.query(`
            UPDATE quotations
            SET
                approval_status = 'approved',
                approval_remarks = NULL,
                approved_by = ?,
                approved_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            req.user.id,
            quotation.id
        ]);


        try {

            await connection.query(`
                INSERT INTO quotation_reviews (
                    id,
                    quotation_id,
                    revision_number,
                    decision,
                    remarks,
                    reviewed_by,
                    created_at
                )
                VALUES (
                    UUID(),
                    ?,
                    ?,
                    'approved',
                    NULL,
                    ?,
                    CURRENT_TIMESTAMP
                )
            `, [
                quotation.id,
                quotation.revision_number || 1,
                req.user.id
            ]);

        } catch (historyError) {

            console.warn(
                "Unable to save quotation approval history:",
                historyError.message
            );

        }


        await connection.commit();


        return res.json({
            success: true,
            message:
                `${quotation.quotation_number} approved successfully. ` +
                `Admin can now send the quotation to the customer.`,
            data: {
                id: quotation.id,
                quotation_number: quotation.quotation_number,
                approval_status: "approved"
            }
        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "Approve quotation error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to approve quotation."
        });

    } finally {

        connection.release();

    }

}


/*
 * ======================================================
 * REQUEST REVISION
 * ======================================================
 */

async function requestQuotationRevision(req, res) {

    const connection =
        await pool.getConnection();

    try {

        const remarks =
            String(
                req.body?.remarks ||
                ""
            ).trim();


        if (!remarks) {

            return res.status(400).json({
                success: false,
                message:
                    "Revision remarks are required."
            });

        }


        if (remarks.length > 2000) {

            return res.status(400).json({
                success: false,
                message:
                    "Revision remarks must not exceed 2000 characters."
            });

        }


        await connection.beginTransaction();


        const [rows] =
            await connection.query(`
                SELECT
                    id,
                    quotation_number,
                    approval_status,
                    revision_number
                FROM quotations
                WHERE id = ?
                LIMIT 1
            `, [req.params.id]);


        if (!rows.length) {

            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Quotation not found."
            });

        }


        const quotation =
            rows[0];


        if (
            ![
                "pending_approval",
                "revision_required"
            ].includes(
                quotation.approval_status
            )
        ) {

            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    "Only quotations waiting for approval can be returned for revision."
            });

        }


        await connection.query(`
            UPDATE quotations
            SET
                approval_status = 'revision_required',
                approval_remarks = ?,
                approved_by = NULL,
                approved_at = NULL,
                revised_at = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            remarks,
            quotation.id
        ]);


        try {

            await connection.query(`
                INSERT INTO quotation_reviews (
                    id,
                    quotation_id,
                    revision_number,
                    decision,
                    remarks,
                    reviewed_by,
                    created_at
                )
                VALUES (
                    UUID(),
                    ?,
                    ?,
                    'revision_required',
                    ?,
                    ?,
                    CURRENT_TIMESTAMP
                )
            `, [
                quotation.id,
                quotation.revision_number || 1,
                remarks,
                req.user.id
            ]);

        } catch (historyError) {

            console.warn(
                "Unable to save quotation revision history:",
                historyError.message
            );

        }


        await connection.commit();


        return res.json({
            success: true,
            message:
                `${quotation.quotation_number} has been returned to Admin for revision.`,
            data: {
                id: quotation.id,
                quotation_number: quotation.quotation_number,
                approval_status: "revision_required",
                approval_remarks: remarks
            }
        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "Request quotation revision error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to request quotation revision."
        });

    } finally {

        connection.release();

    }

}


module.exports = {
    getQuotationApprovalQueue,
    getQuotationReview,
    approveQuotation,
    requestQuotationRevision
};
