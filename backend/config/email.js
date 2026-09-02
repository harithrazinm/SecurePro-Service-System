const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",

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

    if (!customerEmail) {
        throw new Error("Customer email is required.");
    }

    const mailOptions = {

        from:
            process.env.SMTP_FROM ||
            process.env.SMTP_USER,

        to: customerEmail,

        subject:
            `SecurePro Quotation ${quotationNumber}`,

        text:
`Dear ${customerName || "Customer"},

Please find attached your quotation ${quotationNumber} from SecurePro System Solution.

Thank you for choosing SecurePro System Solution.

Regards,
SecurePro System Solution`,

        html:
`
<div style="font-family: Arial, sans-serif; line-height: 1.6;">

    <h2 style="margin-bottom: 20px;">
        SecurePro System Solution
    </h2>

    <p>
        Dear ${customerName || "Customer"},
    </p>

    <p>
        Please find attached your quotation
        <strong>${quotationNumber}</strong>
        from SecurePro System Solution.
    </p>

    <p>
        If you have any questions regarding this quotation,
        please contact us.
    </p>

    <p>
        Thank you for choosing SecurePro System Solution.
    </p>

    <p>
        Regards,<br>
        <strong>SecurePro System Solution</strong>
    </p>

</div>
`,

        attachments: [

            {
                filename:
                    quotationFileName ||
                    `${quotationNumber}.pdf`,

                href:
                    quotationFileUrl
            }

        ]

    };

    return transporter.sendMail(mailOptions);
}


module.exports = {
    sendQuotationEmail
};
