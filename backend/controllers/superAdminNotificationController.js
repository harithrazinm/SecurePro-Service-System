const pool = require("../config/db");

const latestQuotationJoin = `
    LEFT JOIN quotations q
        ON q.id = (
            SELECT q2.id
            FROM quotations q2
            WHERE q2.request_id = sr.id
            ORDER BY q2.created_at DESC
            LIMIT 1
        )
`;

const latestReportJoin = `
    LEFT JOIN service_reports rpt
        ON rpt.id = (
            SELECT rpt2.id
            FROM service_reports rpt2
            WHERE rpt2.request_id = sr.id
            ORDER BY rpt2.created_at DESC
            LIMIT 1
        )
`;

const latestInvoiceJoin = `
    LEFT JOIN invoices i
        ON i.id = (
            SELECT i2.id
            FROM invoices i2
            WHERE i2.request_id = sr.id
            ORDER BY i2.created_at DESC
            LIMIT 1
        )
`;

const latestInvoicePaymentJoin = `
    LEFT JOIN invoice_payments ip
        ON ip.id = (
            SELECT ip2.id
            FROM invoice_payments ip2
            WHERE ip2.invoice_id = i.id
            ORDER BY ip2.submitted_at DESC
            LIMIT 1
        )
`;

function projectLink(id) {
    return `project.html?id=${encodeURIComponent(id)}`;
}

function timestampKey(value) {
    if (!value) return "current";
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? String(parsed) : String(value).replace(/[^a-zA-Z0-9_-]/g, "-");
}

function makeNotifications(projects, userId) {
    const notifications = [];

    projects.forEach(project => {
        const requestId = String(project.request_id);
        const summary = [project.request_code, project.customer_name].filter(Boolean).join(" · ") || "Service request";
        const add = (key, type, title, link, sourceId = requestId) => notifications.push({
            userId,
            key,
            type,
            sourceId,
            title,
            message: summary,
            link
        });

        if (String(project.request_status || "").toLowerCase() === "pending") {
            add(`request:${requestId}`, "request", "New job request pending", projectLink(requestId));
        }

        const approvalStatus = String(project.quotation_approval_status || "").toLowerCase();
        if (["pending_approval", "revision_required"].includes(approvalStatus)) {
            add(
                `quotation:${project.quotation_id}:${approvalStatus}`,
                "quotation",
                approvalStatus === "revision_required" ? "Quotation revision required" : "Quotation requires review",
                "quotation-approval.html",
                project.quotation_id
            );
        }

        if (String(project.report_status || "").toLowerCase() === "submitted") {
            add(`report:${project.report_id}`, "report", "Technician report submitted", projectLink(requestId), project.report_id);
        }

        if (project.quotation_payment_proof_url && !["verified", "approved", "paid"].includes(String(project.quotation_payment_status || "").toLowerCase())) {
            add(
                `quotation-payment:${project.quotation_id}:${timestampKey(project.quotation_payment_proof_uploaded_at)}`,
                "quotation_payment",
                "Quotation payment proof needs review",
                projectLink(requestId),
                project.quotation_id
            );
        }

        if (project.invoice_payment_proof_url && !["verified", "approved", "paid"].includes(String(project.invoice_payment_status || "").toLowerCase())) {
            add(
                `invoice-payment:${project.invoice_payment_id || project.invoice_id}:${timestampKey(project.invoice_payment_submitted_at)}`,
                "invoice_payment",
                "Invoice payment proof needs review",
                projectLink(requestId),
                project.invoice_payment_id || project.invoice_id
            );
        }
    });

    return notifications;
}

async function getNotifications(req, res) {
    const userId = req.user.id;

    try {
        const [projects] = await pool.query(`
            SELECT
                sr.id AS request_id,
                sr.request_code,
                sr.customer_name,
                sr.status AS request_status,
                q.id AS quotation_id,
                q.approval_status AS quotation_approval_status,
                q.payment_proof_url AS quotation_payment_proof_url,
                q.payment_proof_uploaded_at AS quotation_payment_proof_uploaded_at,
                q.payment_status AS quotation_payment_status,
                rpt.id AS report_id,
                rpt.status AS report_status,
                ip.id AS invoice_payment_id,
                i.id AS invoice_id,
                ip.payment_proof_url AS invoice_payment_proof_url,
                ip.submitted_at AS invoice_payment_submitted_at,
                ip.status AS invoice_payment_status
            FROM service_requests sr
            ${latestQuotationJoin}
            ${latestReportJoin}
            ${latestInvoiceJoin}
            ${latestInvoicePaymentJoin}
            WHERE sr.status <> 'cancelled'
            ORDER BY sr.updated_at DESC
        `);

        const notifications = makeNotifications(projects, userId);
        for (const notification of notifications) {
            await pool.query(
                `INSERT INTO super_admin_notifications
                    (id, user_id, notification_key, type, source_id, title, message, link)
                 VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    title = VALUES(title),
                    message = VALUES(message),
                    link = VALUES(link)`,
                [
                    notification.userId,
                    notification.key,
                    notification.type,
                    notification.sourceId || null,
                    notification.title,
                    notification.message,
                    notification.link
                ]
            );
        }

        const [[{ unread_count: unreadCount }]] = await pool.query(
            "SELECT COUNT(*) AS unread_count FROM super_admin_notifications WHERE user_id = ? AND read_at IS NULL",
            [userId]
        );
        const [rows] = await pool.query(
            `SELECT id, notification_key, type, title, message, link, read_at,
                    DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') AS created_at
             FROM super_admin_notifications
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT 100`,
            [userId]
        );

        return res.json({
            success: true,
            data: {
                notifications: rows,
                unread_count: Number(unreadCount || 0)
            }
        });
    } catch (error) {
        console.error("Unable to load Super Admin notifications:", error.message);
        return res.status(500).json({ success: false, message: "Unable to load Super Admin notifications." });
    }
}

async function markNotificationRead(req, res) {
    const { id } = req.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
        return res.status(400).json({ success: false, message: "A valid notification ID is required." });
    }

    try {
        await pool.query(
            `UPDATE super_admin_notifications
             SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
             WHERE id = ? AND user_id = ?`,
            [id, req.user.id]
        );

        const [rows] = await pool.query(
            "SELECT id, read_at FROM super_admin_notifications WHERE id = ? AND user_id = ? LIMIT 1",
            [id, req.user.id]
        );
        if (!rows.length) {
            return res.status(404).json({ success: false, message: "Notification not found." });
        }

        return res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("Unable to mark Super Admin notification as read:", error.message);
        return res.status(500).json({ success: false, message: "Unable to mark notification as read." });
    }
}

module.exports = { getNotifications, markNotificationRead };
