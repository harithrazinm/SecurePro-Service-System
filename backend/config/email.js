function escapeHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function sendQuotationEmail({
    customerEmail,
    customerName,
    quotationNumber,
    quotationFileUrl,
    quotationFileName
}) {
    if (!process.env.BREVO_API_KEY) {
        throw new Error("BREVO_API_KEY is not configured.");
    }
    if (!process.env.BREVO_SENDER_EMAIL) {
        throw new Error("BREVO_SENDER_EMAIL is not configured.");
    }
    if (!customerEmail) {
        throw new Error("Customer email is required.");
    }

    const safeName = escapeHtml(customerName || "Customer");
    const safeNumber = escapeHtml(quotationNumber);
    const senderName = process.env.BREVO_SENDER_NAME || "SecurePro System Solutions";

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "api-key": process.env.BREVO_API_KEY,
            accept: "application/json",
            "content-type": "application/json"
        },
        body: JSON.stringify({
            sender: {
                name: senderName,
                email: process.env.BREVO_SENDER_EMAIL
            },
            replyTo: { email: process.env.BREVO_SENDER_EMAIL },
            to: [{ email: customerEmail, name: customerName || "Customer" }],
            subject: `SecurePro Quotation ${quotationNumber}`,
            textContent:
`Dear ${customerName || "Customer"},

Please find attached quotation ${quotationNumber} from SecurePro System Solutions.

You can also view it here: ${quotationFileUrl}

Thank you for choosing SecurePro System Solutions.`,
            htmlContent:
`<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033">
    <h2 style="color:#1d4ed8">SecurePro System Solutions</h2>
    <p>Dear ${safeName},</p>
    <p>Please find attached quotation <strong>${safeNumber}</strong>.</p>
    <p><a href="${quotationFileUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">View quotation</a></p>
    <p>Thank you for choosing SecurePro System Solutions.</p>
</div>`,
            attachment: quotationFileUrl
                ? [{
                    url: quotationFileUrl,
                    name: quotationFileName || `${quotationNumber}.pdf`
                }]
                : []
        })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(result.message || result.code || "Brevo could not send the email.");
    }

    return result;
}

module.exports = { sendQuotationEmail };
