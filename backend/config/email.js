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
    if (!process.env.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY is not configured.");
    }
    if (!process.env.EMAIL_FROM) {
        throw new Error("EMAIL_FROM is not configured.");
    }
    if (!customerEmail) {
        throw new Error("Customer email is required.");
    }

    const safeName = escapeHtml(customerName || "Customer");
    const safeNumber = escapeHtml(quotationNumber);

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            from: process.env.EMAIL_FROM,
            to: [customerEmail],
            subject: `SecurePro Quotation ${quotationNumber}`,
            text:
`Dear ${customerName || "Customer"},

Please find attached quotation ${quotationNumber} from SecurePro System Solutions.

You can also view it here: ${quotationFileUrl}

Thank you for choosing SecurePro System Solutions.`,
            html:
`<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033">
    <h2 style="color:#1d4ed8">SecurePro System Solutions</h2>
    <p>Dear ${safeName},</p>
    <p>Please find attached quotation <strong>${safeNumber}</strong>.</p>
    <p><a href="${quotationFileUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">View quotation</a></p>
    <p>Thank you for choosing SecurePro System Solutions.</p>
</div>`,
            attachments: quotationFileUrl
                ? [{
                    path: quotationFileUrl,
                    filename: quotationFileName || `${quotationNumber}.pdf`
                }]
                : []
        })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(result.message || result.name || "Resend could not send the email.");
    }

    return result;
}

module.exports = { sendQuotationEmail };
