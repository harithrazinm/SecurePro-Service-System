const fs = require("fs");
const pool = require("../config/db");
const {
    resolveReference,
    verifySignedMediaUrl,
    getReferenceMime,
    sanitizeDownloadName,
    parseLocalReference,
    deleteLocalMediaFile
} = require("./mediaStorage");

async function findMediaReferences(reference, database = pool) {
    const [rows] = await database.query(
        `
        SELECT request_id, file_name, 'customer_photo' AS media_kind
        FROM customer_photos WHERE file_path = ?
        UNION ALL
        SELECT request_id, file_name, 'service_report_media' AS media_kind
        FROM service_report_media WHERE file_path = ?
        UNION ALL
        SELECT tr.request_id, tp.file_name, 'technician_photo' AS media_kind
        FROM technician_photos tp
        INNER JOIN technician_reports tr ON tr.id = tp.report_id
        WHERE tp.file_path = ?
        UNION ALL
        SELECT request_id, NULL AS file_name, 'service_report' AS media_kind
        FROM service_reports WHERE report_file_path = ?
        UNION ALL
        SELECT request_id, quotation_file_name AS file_name, 'quotation' AS media_kind
        FROM quotations WHERE quotation_file_url = ?
        UNION ALL
        SELECT request_id, payment_proof_name AS file_name, 'quotation_payment' AS media_kind
        FROM quotations WHERE payment_proof_url = ?
        UNION ALL
        SELECT request_id, invoice_file_name AS file_name, 'invoice' AS media_kind
        FROM invoices WHERE invoice_file_url = ?
        UNION ALL
        SELECT i.request_id, ip.payment_proof_name AS file_name, 'invoice_payment' AS media_kind
        FROM invoice_payments ip
        INNER JOIN invoices i ON i.id = ip.invoice_id
        WHERE ip.payment_proof_url = ?
        `,
        Array(8).fill(reference)
    );

    return rows;
}

async function deleteLocalMediaIfUnreferenced(reference, database = pool) {
    if (!parseLocalReference(reference)) return false;
    const remainingReferences = await findMediaReferences(reference, database);
    if (remainingReferences.length) return false;
    return deleteLocalMediaFile(reference);
}

async function canReadMedia(user, mediaRows) {
    if (!user || !mediaRows.length) return false;
    if (user.role === "admin" || user.role === "super_admin") return true;
    if (user.role === "customer") {
        return mediaRows.some(media =>
            media.media_kind === "customer_photo" && String(media.request_id) === String(user.id)
        );
    }
    if (user.role !== "technician") return false;

    for (const media of mediaRows) {
        if (!["customer_photo", "service_report_media", "technician_photo", "service_report"].includes(media.media_kind)) {
            continue;
        }

        const [assigned] = await pool.query(
            "SELECT id FROM service_requests WHERE id = ? AND technician_id = ? LIMIT 1",
            [media.request_id, user.id]
        );
        if (assigned.length) return true;
    }

    return false;
}

async function streamAuthorizedMedia(req, res) {
    const reference = String(req.query.ref || "");

    const user = verifySignedMediaUrl(
        reference,
        req.query.exp,
        req.query.sub,
        req.query.role,
        req.query.sig
    );
    if (!user) {
        return res.status(403).json({ success: false, message: "Media link is invalid or expired." });
    }

    const resolved = resolveReference(reference);
    if (!resolved) {
        return res.status(404).json({ success: false, message: "Media file was not found." });
    }

    let mediaRows;
    try {
        mediaRows = await findMediaReferences(reference);
    } catch (error) {
        console.error("Media record lookup failed:", error.message);
        return res.status(500).json({ success: false, message: "Unable to verify media access." });
    }

    if (!await canReadMedia(user, mediaRows)) {
        return res.status(403).json({ success: false, message: "You are not allowed to view this media." });
    }

    try {
        await fs.promises.access(resolved.absolutePath, fs.constants.R_OK);
    } catch {
        return res.status(404).json({ success: false, message: "Media file is missing from storage." });
    }

    const fileName = sanitizeDownloadName(
        mediaRows.find(row => row.file_name)?.file_name ||
        resolved.absolutePath.split(/[\\/]/).pop()
    );

    res.set({
        "Content-Type": getReferenceMime(reference),
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
        "Accept-Ranges": "bytes"
    });

    return res.sendFile(resolved.absolutePath, {
        acceptRanges: true,
        dotfiles: "deny"
    }, error => {
        if (error && !res.headersSent) {
            console.error("Media stream failed:", error.message);
            res.status(error.statusCode || 500).json({
                success: false,
                message: "Unable to load media file."
            });
        }
    });
}

module.exports = {
    streamAuthorizedMedia,
    deleteLocalMediaIfUnreferenced,
    canReadMedia
};
