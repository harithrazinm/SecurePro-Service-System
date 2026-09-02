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
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Upload a payment proof image or PDF." });
        }
        const file = uploadDetails(req.file);
        const [result] = await pool.query(
            `UPDATE quotations
             SET payment_proof_url = ?, payment_proof_name = ?,
                 payment_proof_uploaded_at = CURRENT_TIMESTAMP,
                 payment_status = 'proof_uploaded'
             WHERE id = ?`,
            [file.url, file.name, req.params.id]
        );
        if (!result.affectedRows) {
            return res.status(404).json({ success: false, message: "Quotation not found." });
        }
        return res.json({ success: true, message: "Payment proof uploaded successfully.", data: file });
    } catch (error) {
        console.error("Upload payment proof error:", error);
        return res.status(500).json({ success: false, message: "Unable to upload payment proof." });
    }
}

async function recordFollowUp(req, res) {
    try {
        const followUpNumber = Number(req.params.number);
        if (![1, 2].includes(followUpNumber)) {
            return res.status(400).json({ success: false, message: "Invalid follow-up number." });
        }

        const [rows] = await pool.query(
            `SELECT id, sent_at, follow_up_1_sent_at, follow_up_2_sent_at
             FROM quotations WHERE id = ? LIMIT 1`,
            [req.params.id]
        );
        if (!rows.length) {
            return res.status(404).json({ success: false, message: "Quotation not found." });
        }

        const quotation = rows[0];
        if (!quotation.sent_at) {
            return res.status(400).json({ success: false, message: "Mark the quotation as sent before sending a follow-up." });
        }

        const field = followUpNumber === 1 ? "follow_up_1_sent_at" : "follow_up_2_sent_at";
        if (quotation[field]) {
            return res.status(400).json({ success: false, message: `Follow-up ${followUpNumber} has already been recorded.` });
        }

        const dueAt = new Date(quotation.sent_at);
        dueAt.setDate(dueAt.getDate() + (followUpNumber === 1 ? 2 : 5));
        if (new Date() < dueAt) {
            return res.status(400).json({
                success: false,
                message: `Follow-up ${followUpNumber} is available on ${dueAt.toLocaleDateString("en-MY")}.`
            });
        }

        await pool.query(`UPDATE quotations SET ${field} = CURRENT_TIMESTAMP WHERE id = ?`, [quotation.id]);
        return res.json({ success: true, message: `Follow-up ${followUpNumber} recorded.` });
    } catch (error) {
        console.error("Record follow-up error:", error);
        return res.status(500).json({ success: false, message: "Unable to record follow-up." });
    }
}

module.exports = {
    createQuotation,
    getQuotationById,
    getQuotations,
    sendQuotation,
    sendQuotationByEmail,
    uploadPaymentProof,
    recordFollowUp
};
