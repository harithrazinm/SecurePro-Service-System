const crypto = require("crypto");
const pool = require("../config/db");
const { sendQuotationEmail } = require("../config/email");

async function generateQuotationNumber(connection) {
    const year = new Date().getFullYear();
    const [rows] = await connection.query(
        `SELECT quotation_number FROM quotations
         WHERE quotation_number LIKE ?
         ORDER BY created_at DESC LIMIT 1`,
        [`Q-${year}-%`]
    );

    const lastNumber = rows[0]
        ? Number(rows[0].quotation_number.split("-").pop())
        : 0;

    return `Q-${year}-${String(lastNumber + 1).padStart(4, "0")}`;
}

const quotationSelect = `
    SELECT q.*, r.request_code, r.customer_name, r.customer_phone,
           r.customer_email, r.customer_address,
           s.name_en AS service_name, u.name AS created_by_name
    FROM quotations q
    INNER JOIN service_requests r ON r.id = q.request_id
    INNER JOIN services s ON s.id = r.service_id
    INNER JOIN users u ON u.id = q.created_by
`;

function uploadDetails(file) {
    return {
        url: file.path,
        name: file.originalname
    };
}

async function createQuotation(req, res) {
    const connection = await pool.getConnection();

    try {
        /*
         * Multer normally provides the multipart fields in req.body. Some
         * Cloudinary/Multer deployments can finish the file stream without
         * populating it, so the browser also supplies these values as query
         * parameters. This keeps uploads working in both cases.
         */
        const body = req.body || {};
        const requestId = body.request_id || req.query.request_id;
        const notes = body.notes ?? req.query.notes ?? null;

        if (!requestId) {
            return res.status(400).json({ success: false, message: "Service request is required." });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: "Upload the quotation PDF first." });
        }

        const [requests] = await connection.query(
            "SELECT id FROM service_requests WHERE id = ? LIMIT 1",
            [requestId]
        );

        if (!requests.length) {
            return res.status(404).json({ success: false, message: "Service request not found." });
        }

        const id = crypto.randomUUID();
        const quotationNumber = await generateQuotationNumber(connection);
        const file = uploadDetails(req.file);

        await connection.query(
            `INSERT INTO quotations (
                id, quotation_number, request_id, notes, status, created_by,
                quotation_file_url, quotation_file_name
            ) VALUES (?, ?, ?, ?, 'draft', ?, ?, ?)`,
            [id, quotationNumber, requestId, notes || null, req.user.id, file.url, file.name]
        );

        return res.status(201).json({
            success: true,
            message: "Quotation uploaded successfully.",
            data: { id, quotation_number: quotationNumber, status: "draft" }
        });
    } catch (error) {
        console.error("Create quotation error:", error);
        return res.status(500).json({ success: false, message: "Unable to upload quotation." });
    } finally {
        connection.release();
    }
}

async function getQuotationById(req, res) {
    try {
        const [rows] = await pool.query(`${quotationSelect} WHERE q.id = ? LIMIT 1`, [req.params.id]);
        if (!rows.length) {
            return res.status(404).json({ success: false, message: "Quotation not found." });
        }
        return res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("Get quotation error:", error);
        return res.status(500).json({ success: false, message: "Unable to retrieve quotation." });
    }
}

async function getQuotations(req, res) {
    try {
        const [rows] = await pool.query(`${quotationSelect} ORDER BY q.created_at DESC`);
        return res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Get quotations error:", error);
        return res.status(500).json({ success: false, message: "Unable to retrieve quotations." });
    }
}

async function sendQuotation(req, res) {
    try {
        const [rows] = await pool.query(
            "SELECT id, quotation_number, status, quotation_file_url FROM quotations WHERE id = ? LIMIT 1",
            [req.params.id]
        );
        if (!rows.length) {
            return res.status(404).json({ success: false, message: "Quotation not found." });
        }
        if (!rows[0].quotation_file_url) {
            return res.status(400).json({ success: false, message: "This quotation does not have an uploaded file." });
        }

        await pool.query(
            `UPDATE quotations
             SET status = IF(status = 'draft', 'sent', status),
                 sent_at = COALESCE(sent_at, CURRENT_TIMESTAMP)
             WHERE id = ?`,
            [req.params.id]
        );

        return res.json({
            success: true,
            message: "Quotation marked as sent.",
            data: { quotation_number: rows[0].quotation_number, status: "sent" }
        });
    } catch (error) {
        console.error("Send quotation error:", error);
        return res.status(500).json({ success: false, message: "Unable to mark quotation as sent." });
    }
}

async function sendQuotationByEmail(req, res) {
    try {
        const [rows] = await pool.query(`${quotationSelect} WHERE q.id = ? LIMIT 1`, [req.params.id]);
        if (!rows.length) {
            return res.status(404).json({ success: false, message: "Quotation not found." });
        }

        const quotation = rows[0];
        if (!quotation.customer_email) {
            return res.status(400).json({ success: false, message: "Customer does not have an email address." });
        }
        if (!quotation.quotation_file_url) {
            return res.status(400).json({ success: false, message: "This quotation does not have an uploaded file." });
        }

        await sendQuotationEmail({
            customerEmail: quotation.customer_email,
            customerName: quotation.customer_name,
            quotationNumber: quotation.quotation_number,
            quotationFileUrl: quotation.quotation_file_url,
            quotationFileName: quotation.quotation_file_name
        });
        await pool.query(
            `UPDATE quotations
             SET status = IF(status = 'draft', 'sent', status),
                 sent_at = COALESCE(sent_at, CURRENT_TIMESTAMP)
             WHERE id = ?`,
            [quotation.id]
        );

        return res.json({ success: true, message: "Quotation sent by email." });
    } catch (error) {
        console.error("Send quotation email error:", error);
        return res.status(500).json({ success: false, message: "Unable to send quotation by email." });
    }
}

async function uploadPaymentProof(req, res) {
    const connection = await pool.getConnection();
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Upload a payment proof image or PDF." });
        }
        const file = uploadDetails(req.file);
        await connection.beginTransaction();
        const [quotationRows] = await connection.query(
            "SELECT request_id FROM quotations WHERE id = ? LIMIT 1",
            [req.params.id]
        );
        if (!quotationRows.length) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: "Quotation not found." });
        }

        const [result] = await connection.query(
            `UPDATE quotations
             SET payment_proof_url = ?, payment_proof_name = ?,
                 payment_proof_uploaded_at = CURRENT_TIMESTAMP,
                 payment_status = 'proof_uploaded'
             WHERE id = ?`,
            [file.url, file.name, req.params.id]
        );
        if (!result.affectedRows) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: "Quotation not found." });
        }

        /*
         * A request is only listed in the Job Pending queue when a payment
         * proof exists. Keep an unassigned request in its pending state; do
         * not overwrite an assignment if a proof is re-uploaded later.
         */
        await connection.query(
    `UPDATE service_requests
     SET status = 'pending'
     WHERE id = ?
       AND technician_id IS NULL`,
    [quotationRows[0].request_id]
);

        await connection.commit();
        return res.json({
            success: true,
            message: "Payment proof uploaded. The job is now ready for technician assignment.",
            data: { ...file, request_id: quotationRows[0].request_id }
        });
    } catch (error) {
        await connection.rollback();
        console.error("Upload payment proof error:", error);
        return res.status(500).json({ success: false, message: "Unable to upload payment proof." });
    } finally {
        connection.release();
    }
}

async function recordFollowUp(req, res) {
    try {
        const followUpNumber = Number(req.params.number);

        if (![1, 2].includes(followUpNumber)) {
            return res.status(400).json({
                success: false,
                message: "Invalid follow-up number."
            });
        }

        const [rows] = await pool.query(
            `SELECT 
                id,
                sent_at,
                follow_up_1_sent_at,
                follow_up_2_sent_at
             FROM quotations
             WHERE id = ?
             LIMIT 1`,
            [req.params.id]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Quotation not found."
            });
        }

        const quotation = rows[0];

        // Quotation must be sent first
        if (!quotation.sent_at) {
            return res.status(400).json({
                success: false,
                message: "Mark the quotation as sent before sending a follow-up."
            });
        }

        // Prevent duplicate follow-up
        const field =
            followUpNumber === 1
                ? "follow_up_1_sent_at"
                : "follow_up_2_sent_at";

        if (quotation[field]) {
            return res.status(400).json({
                success: false,
                message: `Follow-up ${followUpNumber} has already been recorded.`
            });
        }

        let dueAt;

        if (followUpNumber === 1) {

            /*
             * FOLLOW-UP 1
             * Available 12 hours after quotation was sent.
             */
            dueAt = new Date(
                new Date(quotation.sent_at).getTime()
                + (12 * 60 * 60 * 1000)
            );

        } else {

            /*
             * FOLLOW-UP 2
             * FU1 must already have been sent.
             */
            if (!quotation.follow_up_1_sent_at) {
                return res.status(400).json({
                    success: false,
                    message: "Follow-up 1 must be sent before Follow-up 2."
                });
            }

            /*
             * Available 48 hours after FU1 was sent.
             */
            dueAt = new Date(
                new Date(quotation.follow_up_1_sent_at).getTime()
                + (48 * 60 * 60 * 1000)
            );
        }

        const now = new Date();

        if (now < dueAt) {
            const remainingMs = dueAt.getTime() - now.getTime();

            const remainingHours = Math.floor(
                remainingMs / (1000 * 60 * 60)
            );

            const remainingMinutes = Math.floor(
                (remainingMs % (1000 * 60 * 60))
                / (1000 * 60)
            );

            return res.status(400).json({
                success: false,
                message:
                    `Follow-up ${followUpNumber} is not available yet. ` +
                    `It will be available on ${dueAt.toLocaleString("en-MY")}. ` +
                    `Time remaining: ${remainingHours} hour(s) ${remainingMinutes} minute(s).`,
                data: {
                    due_at: dueAt.toISOString(),
                    remaining_hours: remainingHours,
                    remaining_minutes: remainingMinutes
                }
            });
        }

        await pool.query(
            `UPDATE quotations
             SET ${field} = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [quotation.id]
        );

        return res.json({
            success: true,
            message: `Follow-up ${followUpNumber} recorded.`,
            data: {
                follow_up: followUpNumber,
                sent_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error("Record follow-up error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to record follow-up."
        });
    }
}

async function uploadFinalQuotation(req, res) {
    const connection = await pool.getConnection();

    try {
        const requestId = req.params.requestId;

        if (!requestId) {
            return res.status(400).json({
                success: false,
                message: "Service request is required."
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Upload the final quotation PDF."
            });
        }

        // --------------------------------------------------
        // CHECK JOB
        // --------------------------------------------------

        const [requests] = await connection.query(
            `
            SELECT
                id,
                request_code,
                status
            FROM service_requests
            WHERE id = ?
            LIMIT 1
            `,
            [requestId]
        );

        if (!requests.length) {
            return res.status(404).json({
                success: false,
                message: "Service request not found."
            });
        }

        const request = requests[0];

        if (request.status !== "completed") {
            return res.status(400).json({
                success: false,
                message:
                    "Final quotation can only be uploaded after the job is completed."
            });
        }

        const file = uploadDetails(req.file);

        await connection.beginTransaction();

        // --------------------------------------------------
        // REMOVE PREVIOUS FINAL QUOTATION
        // --------------------------------------------------

        await connection.query(
            `
            DELETE FROM quotations
            WHERE request_id = ?
              AND quotation_type = 'final'
            `,
            [requestId]
        );

        // --------------------------------------------------
        // CREATE FINAL QUOTATION
        // --------------------------------------------------

        const id = crypto.randomUUID();

        const quotationNumber =
            await generateQuotationNumber(connection);

        await connection.query(
            `
            INSERT INTO quotations (
                id,
                quotation_number,
                quotation_type,
                request_id,
                status,
                created_by,
                quotation_file_url,
                quotation_file_name
            )
            VALUES (
                ?,
                ?,
                'final',
                ?,
                'sent',
                ?,
                ?,
                ?
            )
            `,
            [
                id,
                quotationNumber,
                requestId,
                req.user.id,
                file.url,
                file.name
            ]
        );

        await connection.commit();

        return res.status(201).json({
            success: true,
            message: "Final quotation uploaded successfully.",
            data: {
                id,
                quotation_number: quotationNumber,
                quotation_type: "final",
                quotation_file_url: file.url,
                quotation_file_name: file.name
            }
        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "Upload final quotation error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to upload final quotation."
        });

    } finally {

        connection.release();

    }
}


module.exports = {
    createQuotation,
    getQuotationById,
    getQuotations,
    sendQuotation,
    sendQuotationByEmail,
    uploadPaymentProof,
    recordFollowUp,
    uploadFinalQuotation
};
