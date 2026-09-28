const crypto = require("crypto");
const pool = require("../config/db");

function invoiceNumber() {
    const d = new Date();
    const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    return `INV-${date}-${Date.now().toString().slice(-6)}`;
}

function escapeHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function pdfUrl(url) {
    if (!url) return "";
    const [path, query] = String(url).split("?");
    const normalized = path.toLowerCase().endsWith(".pdf") ? path : `${path}.pdf`;
    return query ? `${normalized}?${query}` : normalized;
}

async function getInvoices(req, res) {
    try {
        const [rows] = await pool.query(`
            SELECT
                i.id,
                i.invoice_number,
                i.request_id,
                i.invoice_file_url,
                i.invoice_file_name,
                i.status,
                i.created_at,
                i.updated_at,
                r.request_code,
                r.customer_name,
                r.customer_phone,
                r.customer_email,
                r.status AS request_status,
                u.name AS created_by_name,

                /* Referral belongs to this exact service request. */
                (
                    SELECT ru.id
                    FROM referral_usages ru
                    WHERE ru.request_id = i.request_id
                    ORDER BY ru.used_at DESC
                    LIMIT 1
                ) AS referral_usage_id,
                (
                    SELECT rc.code
                    FROM referral_usages ru
                    INNER JOIN referral_codes rc ON rc.id = ru.referral_code_id
                    WHERE ru.request_id = i.request_id
                    ORDER BY ru.used_at DESC
                    LIMIT 1
                ) AS referral_code,
                (
                    SELECT ru.reward_type
                    FROM referral_usages ru
                    WHERE ru.request_id = i.request_id
                    ORDER BY ru.used_at DESC
                    LIMIT 1
                ) AS referral_reward_type,
                (
                    SELECT ru.reward_value
                    FROM referral_usages ru
                    WHERE ru.request_id = i.request_id
                    ORDER BY ru.used_at DESC
                    LIMIT 1
                ) AS referral_reward_value,
                (
                    SELECT ru.reward_amount
                    FROM referral_usages ru
                    WHERE ru.request_id = i.request_id
                    ORDER BY ru.used_at DESC
                    LIMIT 1
                ) AS referral_reward_amount,
                (
                    SELECT ru.status
                    FROM referral_usages ru
                    WHERE ru.request_id = i.request_id
                    ORDER BY ru.used_at DESC
                    LIMIT 1
                ) AS referral_status,

                (
                    SELECT COUNT(*)
                    FROM invoice_payments ip
                    WHERE ip.invoice_id = i.id AND ip.status = 'pending'
                ) AS pending_payment_proofs
            FROM invoices i
            INNER JOIN service_requests r ON r.id = i.request_id
            LEFT JOIN users u ON u.id = i.created_by
            ORDER BY i.created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Get invoices error:", error);
        res.status(500).json({ success: false, message: "Unable to load invoices." });
    }
}

async function getInvoiceForRequest(req, res) {
    try {
        const [rows] = await pool.query(`
            SELECT i.*, r.request_code, r.customer_name, r.customer_phone, r.customer_email, r.status AS request_status
            FROM invoices i
            INNER JOIN service_requests r ON r.id = i.request_id
            WHERE i.request_id = ?
            ORDER BY i.created_at DESC
        `, [req.params.requestId]);

        for (const invoice of rows) {
            const [payments] = await pool.query(`
                SELECT id, payment_proof_url, payment_proof_name, payment_proof_type,
                       status, submitted_at, verified_by, verified_at, remarks
                FROM invoice_payments
                WHERE invoice_id = ?
                ORDER BY submitted_at DESC
            `, [invoice.id]);
            invoice.payments = payments;
        }

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Get invoice for request error:", error);
        res.status(500).json({ success: false, message: "Unable to load invoice." });
    }
}

async function createInvoice(req, res) {
    const connection = await pool.getConnection();

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Invoice PDF is required."
            });
        }

        const requestId = req.params.requestId;

        const [requests] = await connection.query(`
            SELECT
                id,
                request_code,
                customer_name,
                customer_email,
                status
            FROM service_requests
            WHERE id = ?
            LIMIT 1
        `, [requestId]);

        if (!requests.length) {
            return res.status(404).json({
                success: false,
                message: "Service request not found."
            });
        }

        const request = requests[0];

        if (request.status !== "awaiting_payment") {
            return res.status(400).json({
                success: false,
                message:
                    "Invoice can only be uploaded when the service request is awaiting payment."
            });
        }

        const id = crypto.randomUUID();
        const number = invoiceNumber();

        await connection.query(`
            INSERT INTO invoices (
                id,
                invoice_number,
                request_id,
                invoice_file_url,
                invoice_file_name,
                status,
                created_by
            )
            VALUES (?, ?, ?, ?, ?, 'sent', ?)
        `, [
            id,
            number,
            requestId,
            req.file.path,
            req.file.originalname,
            req.user.id
        ]);

        return res.status(201).json({
            success: true,
            message:
                "Invoice PDF uploaded successfully.",
            data: {
                id,
                invoice_number: number,
                request_id: requestId,
                invoice_file_url: req.file.path,
                invoice_file_name: req.file.originalname,
                status: "sent"
            }
        });

    } catch (error) {

        console.error(
            "Create invoice error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to upload invoice."
        });

    } finally {
        connection.release();
    }
}

async function sendInvoiceByEmail(req, res) {
    try {
        const [rows] = await pool.query(`
            SELECT i.id, i.invoice_number, i.invoice_file_url, i.invoice_file_name,
                   r.customer_name, r.customer_email
            FROM invoices i
            INNER JOIN service_requests r ON r.id = i.request_id
            WHERE i.id = ? LIMIT 1
        `, [req.params.id]);

        if (!rows.length) return res.status(404).json({ success: false, message: "Invoice not found." });
        const invoice = rows[0];
        if (!invoice.customer_email) return res.status(400).json({ success: false, message: "Customer does not have an email address." });
        if (!invoice.invoice_file_url) return res.status(400).json({ success: false, message: "Invoice PDF has not been uploaded." });
        if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
            return res.status(500).json({ success: false, message: "Brevo email settings are not configured." });
        }

        const fileUrl = pdfUrl(invoice.invoice_file_url);
        const safeName = escapeHtml(invoice.customer_name || "Customer");
        const safeNumber = escapeHtml(invoice.invoice_number);

        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "api-key": process.env.BREVO_API_KEY,
                accept: "application/json",
                "content-type": "application/json"
            },
            body: JSON.stringify({
                sender: { name: process.env.BREVO_SENDER_NAME || "SecurePro System Solutions", email: process.env.BREVO_SENDER_EMAIL },
                replyTo: { email: process.env.BREVO_SENDER_EMAIL },
                to: [{ email: invoice.customer_email, name: invoice.customer_name || "Customer" }],
                subject: `SecurePro Final Invoice ${invoice.invoice_number}`,
                textContent: `Dear ${invoice.customer_name || "Customer"},\n\nPlease find attached your final invoice ${invoice.invoice_number} from SecurePro System Solutions.\n\nInvoice: ${fileUrl}\n\nThank you for choosing SecurePro System Solutions.`,
                htmlContent: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033"><h2>SecurePro System Solutions</h2><p>Dear ${safeName},</p><p>Please find attached your final invoice <strong>${safeNumber}</strong>.</p><p><a href="${fileUrl}">View Invoice PDF</a></p><p>Thank you for choosing SecurePro System Solutions.</p></div>`,
                attachment: [{ url: fileUrl, name: invoice.invoice_file_name || `${invoice.invoice_number}.pdf` }]
            })
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || result.code || "Brevo could not send the invoice email.");

        await pool.query(`UPDATE invoices SET status = 'sent', updated_at = NOW() WHERE id = ?`, [invoice.id]);
        res.json({ success: true, message: "Invoice sent by email successfully." });
    } catch (error) {
        console.error("Send invoice email error:", error);
        res.status(500).json({ success: false, message: error.message || "Unable to send invoice email." });
    }
}

async function uploadPaymentProof(req, res) {

    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message:
                    "Payment proof is required."
            });
        }

        const [invoices] = await pool.query(`
            SELECT
                id,
                status
            FROM invoices
            WHERE id = ?
            LIMIT 1
        `, [req.params.id]);

        if (!invoices.length) {
            return res.status(404).json({
                success: false,
                message:
                    "Invoice not found."
            });
        }

        const invoice = invoices[0];

        if (invoice.status === "paid") {
            return res.status(400).json({
                success: false,
                message:
                    "This invoice is already marked as paid."
            });
        }

        const paymentId =
            crypto.randomUUID();

        /*
         * No payment amount.
         * No payment method required.
         *
         * Admin only uploads the customer's
         * payment receipt/proof.
         */

        await pool.query(`
            INSERT INTO invoice_payments (
                id,
                invoice_id,
                amount,
                payment_proof_url,
                payment_proof_name,
                payment_proof_type,
                status,
                submitted_at
            )
            VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
        `, [
            paymentId,
            invoice.id,
            0,
            req.file.path,
            req.file.originalname,
            req.file.mimetype
        ]);

        await pool.query(`
            UPDATE invoices
            SET
                status = 'payment_submitted',
                updated_at = NOW()
            WHERE id = ?
        `, [
            invoice.id
        ]);

        return res.status(201).json({
            success: true,
            message:
                "Payment proof uploaded successfully.",
            data: {
                payment_id: paymentId
            }
        });

    } catch (error) {

        console.error(
            "Upload payment proof error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to upload payment proof."
        });
    }
}


async function getPaymentProofs(req, res) {
    try {
        const [rows] = await pool.query(`
            SELECT
                ip.id,
                ip.invoice_id,
                ip.amount,
                ip.payment_method,
                ip.payment_proof_url,
                ip.payment_proof_name,
                ip.payment_proof_type,
                ip.status,
                ip.submitted_at,
                ip.verified_by,
                ip.verified_at,
                ip.remarks,

                i.invoice_number,
                i.request_id,
                i.total_amount,
                i.amount_paid,
                i.balance_due,
                i.status AS invoice_status,

                r.request_code,
                r.customer_name,
                r.customer_phone,
                r.customer_email,
                r.status AS request_status

            FROM invoice_payments ip

            INNER JOIN invoices i
                ON i.id = ip.invoice_id

            INNER JOIN service_requests r
                ON r.id = i.request_id

            ORDER BY ip.submitted_at DESC
        `);

        return res.json({
            success: true,
            data: rows
        });

    } catch (error) {

        console.error(
            "Get payment proofs error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load payment proofs."
        });
    }
}


async function verifyPayment(req, res) {

    const connection =
        await pool.getConnection();

    try {

        const action =
            String(
                req.body.action || ""
            )
            .trim()
            .toLowerCase();

        const remarks =
            String(
                req.body.remarks || ""
            )
            .trim() || null;


        if (
            !["approve", "reject"]
                .includes(action)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Action must be approve or reject."
            });
        }


        if (
            action === "reject" &&
            !remarks
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "A rejection remark is required."
            });
        }


        /*
         * ==============================================
         * FIND PAYMENT PROOF
         * ==============================================
         */

        const [rows] =
            await connection.query(`

                SELECT
                    ip.id,
                    ip.invoice_id,
                    ip.status AS payment_status,

                    i.request_id,
                    i.status AS invoice_status

                FROM invoice_payments ip

                INNER JOIN invoices i
                    ON i.id = ip.invoice_id

                WHERE ip.id = ?

                LIMIT 1

            `, [
                req.params.paymentId
            ]);


        if (!rows.length) {

            return res.status(404).json({
                success: false,
                message:
                    "Payment proof not found."
            });
        }


        const payment =
            rows[0];


        if (
            payment.payment_status !==
            "pending"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    `This payment proof is already ${payment.payment_status}.`
            });
        }


        await connection.beginTransaction();


        /*
         * ==============================================
         * REJECT
         * ==============================================
         */

        if (
            action === "reject"
        ) {

            await connection.query(`

                UPDATE invoice_payments

                SET
                    status = 'rejected',
                    verified_by = ?,
                    verified_at = NOW(),
                    remarks = ?

                WHERE id = ?

            `, [
                req.user.id,
                remarks,
                payment.id
            ]);


            await connection.query(`

                UPDATE invoices

                SET
                    status = 'sent',
                    updated_at = NOW()

                WHERE id = ?

            `, [
                payment.invoice_id
            ]);


            await connection.commit();


            return res.json({

                success: true,

                message:
                    "Payment proof rejected. The invoice has been returned to sent status."

            });

        }


        /*
         * ==============================================
         * APPROVE PAYMENT
         * ==============================================
         */

        await connection.query(`

            UPDATE invoice_payments

            SET
                status = 'verified',
                verified_by = ?,
                verified_at = NOW(),
                remarks = ?

            WHERE id = ?

        `, [
            req.user.id,
            remarks,
            payment.id
        ]);


        /*
         * ==============================================
         * MARK INVOICE PAID
         * ==============================================
         */

        await connection.query(`

            UPDATE invoices

            SET
                status = 'paid',
                updated_at = NOW()

            WHERE id = ?

        `, [
            payment.invoice_id
        ]);


        /*
         * ==============================================
         * GET REQUEST STATUS
         * ==============================================
         */

        const [requestRows] =
            await connection.query(`

                SELECT
                    status

                FROM service_requests

                WHERE id = ?

                LIMIT 1

            `, [
                payment.request_id
            ]);


        if (!requestRows.length) {

            throw new Error(
                "Service request associated with this invoice was not found."
            );
        }


        const oldStatus =
            requestRows[0].status;


        /*
         * ==============================================
         * COMPLETE REQUEST
         * ==============================================
         */

        await connection.query(`

            UPDATE service_requests

            SET
                status = 'completed',
                completed_at = NOW(),
                updated_at = NOW()

            WHERE id = ?

        `, [
            payment.request_id
        ]);


        /*
         * ==============================================
         * STATUS HISTORY
         * ==============================================
         */

        if (
            oldStatus !==
            "completed"
        ) {

            await connection.query(`

                INSERT INTO request_status_history (
                    id,
                    request_id,
                    old_status,
                    new_status,
                    changed_by,
                    remarks
                )

                VALUES (
                    ?,
                    ?,
                    ?,
                    'completed',
                    ?,
                    ?
                )

            `, [
                crypto.randomUUID(),
                payment.request_id,
                oldStatus,
                req.user.id,
                "Final payment proof verified. Service request completed."
            ]);
        }


        await connection.commit();


        return res.json({

            success: true,

            message:
                "Payment proof verified. The invoice is now paid and the service request is completed.",

            data: {

                payment_id:
                    payment.id,

                invoice_id:
                    payment.invoice_id,

                invoice_status:
                    "paid",

                request_status:
                    "completed"

            }

        });


    } catch (error) {

        try {
            await connection.rollback();
        } catch (_) {}


        console.error(
            "Verify payment error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to verify payment."

        });


    } finally {

        connection.release();

    }
}

async function markReferralRewardApplied(req, res) {
    try {
        const invoiceId = req.params.id;

        const [rows] = await pool.query(`
            SELECT
                i.id AS invoice_id,
                i.request_id,
                ru.id AS referral_usage_id,
                ru.status AS referral_status
            FROM invoices i
            INNER JOIN referral_usages ru
                ON ru.request_id = i.request_id
            WHERE i.id = ?
            ORDER BY ru.used_at DESC
            LIMIT 1
        `, [invoiceId]);

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "No referral reward is linked to this invoice."
            });
        }

        const referral = rows[0];

        if (referral.referral_status === "rewarded") {
            return res.json({
                success: true,
                message: "Referral reward has already been marked as applied.",
                data: { status: "rewarded" }
            });
        }

        if (!["pending", "qualified"].includes(referral.referral_status)) {
            return res.status(400).json({
                success: false,
                message: `Referral reward cannot be marked as applied from status '${referral.referral_status}'.`
            });
        }

        await pool.query(`
            UPDATE referral_usages
            SET
                status = 'rewarded',
                rewarded_at = NOW(),
                remarks = COALESCE(NULLIF(remarks, ''), 'Referral reward applied during final invoice preparation.')
            WHERE id = ?
        `, [referral.referral_usage_id]);

        return res.json({
            success: true,
            message: "Referral reward marked as applied.",
            data: {
                referral_usage_id: referral.referral_usage_id,
                status: "rewarded"
            }
        });
    } catch (error) {
        console.error("Mark referral reward applied error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to mark referral reward as applied."
        });
    }
}

module.exports = {
    getInvoices,
    getInvoiceForRequest,
    createInvoice,
    sendInvoiceByEmail,
    uploadPaymentProof,
    getPaymentProofs,
    verifyPayment,
    markReferralRewardApplied
};
