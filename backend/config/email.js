const nodemailer = require("nodemailer");
const fs = require("fs");
const { resolveReference } = require("../services/mediaStorage");

function escapeHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function quotationPdfUrl(url) {
    if (!url) return "";

    const [path, query] = String(url).split("?");

    const normalizedPath = path.toLowerCase().endsWith(".pdf")
        ? path
        : `${path}.pdf`;

    return query
        ? `${normalizedPath}?${query}`
        : normalizedPath;
}

function getMailFromAddress() {
    return process.env.MAIL_FROM || process.env.SMTP_FROM || "";
}

function isSmtpSecure() {
    if (process.env.SMTP_SECURE !== undefined) {
        return process.env.SMTP_SECURE === "true";
    }

    return Number(process.env.SMTP_PORT || 465) === 465;
}

/*
 * GB Network SMTP
 *
 * SMTP Host: mail.sopro.my
 * SMTP Port: 465
 * SSL/TLS: true
 */
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: isSmtpSecure(),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

async function sendQuotationEmail({
    customerEmail,
    customerName,
    quotationNumber,
    quotationFileUrl,
    quotationFileAccessUrl,
    quotationFileName
}) {
    const mailFrom = getMailFromAddress();

    if (!process.env.SMTP_HOST) {
        throw new Error("SMTP_HOST is not configured.");
    }

    if (!process.env.SMTP_USER) {
        throw new Error("SMTP_USER is not configured.");
    }

    if (!process.env.SMTP_PASSWORD) {
        throw new Error("SMTP_PASSWORD is not configured.");
    }

    if (!mailFrom) {
        throw new Error("MAIL_FROM or SMTP_FROM is not configured.");
    }

    if (!customerEmail) {
        throw new Error("Customer email is required.");
    }

    const safeName = escapeHtml(customerName || "Customer");
    const safeNumber = escapeHtml(quotationNumber);

    const senderName =
        process.env.MAIL_FROM_NAME ||
        "SecurePro System Solutions";

    const storedFile = resolveReference(quotationFileUrl);
    const configuredAppUrl = String(process.env.PUBLIC_APP_URL || "").replace(/\/$/, "");
    const fileUrl = storedFile
        ? (configuredAppUrl && quotationFileAccessUrl
            ? `${configuredAppUrl}${quotationFileAccessUrl}`
            : "")
        : quotationPdfUrl(quotationFileUrl);

    let attachment = [];

    /*
     * Download the quotation PDF from its URL
     * and attach it to the email.
     */
    if (quotationFileUrl) {
        let pdfBuffer;

        if (storedFile) {
            pdfBuffer = await fs.promises.readFile(storedFile.absolutePath);
        } else {
            const pdfResponse = await fetch(fileUrl);
            if (!pdfResponse.ok) {
                throw new Error(`Unable to download quotation PDF. HTTP ${pdfResponse.status}`);
            }
            pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
        }

        attachment = [
            {
                filename:
                    quotationFileName ||
                    `${quotationNumber}.pdf`,
                content: pdfBuffer,
                contentType: "application/pdf"
            }
        ];
    }

    const mailOptions = {
        from: `"${senderName}" <${mailFrom}>`,

        replyTo: mailFrom,

        to: [
            {
                address: customerEmail,
                name: customerName || "Customer"
            }
        ],

        subject:
            `SecurePro Quotation ${quotationNumber}`,

        text:
`Dear ${customerName || "Customer"},

Please find attached quotation ${quotationNumber} from SecurePro System Solutions.

${fileUrl ? `You can also view it here:\n${fileUrl}\n` : ""}

Thank you for choosing SecurePro System Solutions.`,

        html:
`<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033">

    <h2 style="color:#1d4ed8">
        SecurePro System Solutions
    </h2>

    <p>
        Dear ${safeName},
    </p>

    <p>
        Please find attached quotation
        <strong>${safeNumber}</strong>.
    </p>

    ${
        fileUrl
            ? `
            <p>
                <a
                    href="${fileUrl}"
                    style="
                        display:inline-block;
                        padding:10px 16px;
                        background:#2563eb;
                        color:#fff;
                        text-decoration:none;
                        border-radius:6px;
                    "
                >
                    View quotation
                </a>
            </p>
            `
            : ""
    }

    <p>
        Thank you for choosing SecurePro System Solutions.
    </p>

</div>`,

        attachments: attachment
    };

    const result = await transporter.sendMail(
        mailOptions
    );

    return result;
}

async function sendQuotationReviewEmail({
    recipientEmail,
    recipientName,
    quotationNumber,
    requestCode,
    customerName,
    serviceName,
    revisionNumber,
    reviewUrl
}) {
    const mailFrom = getMailFromAddress();

    const missingSettings = [
        !process.env.SMTP_HOST && "SMTP_HOST",
        !process.env.SMTP_USER && "SMTP_USER",
        !process.env.SMTP_PASSWORD && "SMTP_PASSWORD",
        !mailFrom && "MAIL_FROM or SMTP_FROM"
    ].filter(Boolean);

    if (missingSettings.length) {
        throw new Error(`SMTP email settings are incomplete: ${missingSettings.join(", ")}.`);
    }

    if (!recipientEmail) {
        throw new Error("Super Admin email address is missing.");
    }

    const safeRecipientName = escapeHtml(recipientName || "Super Admin");
    const safeQuotationNumber = escapeHtml(quotationNumber || "Quotation");
    const safeRequestCode = escapeHtml(requestCode || "Service request");
    const safeCustomerName = escapeHtml(customerName || "Customer");
    const safeServiceName = escapeHtml(serviceName || "Service");
    const revision = Math.max(1, Number(revisionNumber) || 1);
    const reviewLabel = revision > 1
        ? `Revision ${revision} submitted for review`
        : "New quotation submitted for review";
    const safeReviewUrl = escapeHtml(reviewUrl);

    const result = await transporter.sendMail({
        from: `"${process.env.MAIL_FROM_NAME || "SecurePro System Solutions"}" <${mailFrom}>`,
        replyTo: mailFrom,
        to: [{ address: recipientEmail, name: recipientName || "Super Admin" }],
        subject: `Review required: ${quotationNumber} — ${requestCode}`,
        text: `Dear ${recipientName || "Super Admin"},\n\n${reviewLabel}: ${quotationNumber}\nRequest: ${requestCode}\nCustomer: ${customerName || "Customer"}\nService: ${serviceName || "Service"}\n\nSign in to SecurePro to review the quotation: ${reviewUrl}\n\nThis is an automated notification from SecurePro System Solutions.`,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033;max-width:600px">
            <h2 style="color:#1d4ed8">Quotation review required</h2>
            <p>Dear ${safeRecipientName},</p>
            <p>${escapeHtml(reviewLabel)}: <strong>${safeQuotationNumber}</strong></p>
            <table style="border-collapse:collapse;width:100%;margin:16px 0">
                <tr><td style="padding:7px 0;color:#64748b">Request</td><td style="padding:7px 0"><strong>${safeRequestCode}</strong></td></tr>
                <tr><td style="padding:7px 0;color:#64748b">Customer</td><td style="padding:7px 0">${safeCustomerName}</td></tr>
                <tr><td style="padding:7px 0;color:#64748b">Service</td><td style="padding:7px 0">${safeServiceName}</td></tr>
            </table>
            <p><a href="${safeReviewUrl}" style="display:inline-block;padding:11px 18px;background:#2563eb;color:#fff;text-decoration:none;border-radius:7px;font-weight:700">Review quotation</a></p>
            <p style="font-size:13px;color:#64748b">Sign in to the SecurePro Super Admin account to view and review the quotation. This is an automated notification.</p>
        </div>`
    });

    if (result.rejected?.some(address => String(address).toLowerCase() === String(recipientEmail).toLowerCase()) || result.accepted?.length === 0) {
        throw new Error("SMTP server did not accept the Super Admin recipient address.");
    }

    return result;
}

module.exports = {
    sendQuotationEmail,
    sendQuotationReviewEmail
};
