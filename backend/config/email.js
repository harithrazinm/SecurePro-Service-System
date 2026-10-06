const nodemailer = require("nodemailer");

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
    secure: process.env.SMTP_SECURE === "true",
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
    quotationFileName
}) {
    if (!process.env.SMTP_HOST) {
        throw new Error("SMTP_HOST is not configured.");
    }

    if (!process.env.SMTP_USER) {
        throw new Error("SMTP_USER is not configured.");
    }

    if (!process.env.SMTP_PASSWORD) {
        throw new Error("SMTP_PASSWORD is not configured.");
    }

    if (!process.env.MAIL_FROM) {
        throw new Error("MAIL_FROM is not configured.");
    }

    if (!customerEmail) {
        throw new Error("Customer email is required.");
    }

    const safeName = escapeHtml(customerName || "Customer");
    const safeNumber = escapeHtml(quotationNumber);

    const senderName =
        process.env.MAIL_FROM_NAME ||
        "SecurePro System Solutions";

    const fileUrl = quotationPdfUrl(quotationFileUrl);

    let attachment = [];

    /*
     * Download the quotation PDF from its URL
     * and attach it to the email.
     */
    if (fileUrl) {
        const pdfResponse = await fetch(fileUrl);

        if (!pdfResponse.ok) {
            throw new Error(
                `Unable to download quotation PDF. HTTP ${pdfResponse.status}`
            );
        }

        const pdfBuffer = Buffer.from(
            await pdfResponse.arrayBuffer()
        );

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
        from: `"${senderName}" <${process.env.MAIL_FROM}>`,

        replyTo: process.env.MAIL_FROM,

        to: [
            {
                email: customerEmail,
                name: customerName || "Customer"
            }
        ],

        subject:
            `SecurePro Quotation ${quotationNumber}`,

        text:
`Dear ${customerName || "Customer"},

Please find attached quotation ${quotationNumber} from SecurePro System Solutions.

You can also view it here:
${fileUrl}

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

module.exports = {
    sendQuotationEmail
};