const PDFDocument = require("pdfkit");
const pool = require("../config/db");

const generateQuotationPDF = async (req, res) => {

    try {

        const { id } = req.params;

        // ==================================================
        // GET QUOTATION
        // ==================================================

        const [quotations] = await pool.query(
            `
            SELECT
                q.*,

                r.request_code,
                r.customer_name,
                r.customer_phone,
                r.customer_email,
                r.customer_address,
                r.customer_notes,

                s.name_en AS service_name_en,
                s.name_ms AS service_name_ms,

                u.name AS created_by_name

            FROM quotations q

            INNER JOIN service_requests r
                ON r.id = q.request_id

            INNER JOIN services s
                ON s.id = r.service_id

            INNER JOIN users u
                ON u.id = q.created_by

            WHERE q.id = ?

            LIMIT 1
            `,
            [id]
        );

        if (quotations.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Quotation not found."
            });

        }

        const quotation = quotations[0];

        // ==================================================
        // GET ITEMS
        // ==================================================

        const [items] = await pool.query(
            `
            SELECT
                id,
                description,
                quantity,
                unit_price,
                amount

            FROM quotation_items

            WHERE quotation_id = ?

            ORDER BY id
            `,
            [id]
        );

        // ==================================================
        // CREATE PDF
        // ==================================================

        const doc = new PDFDocument({
            size: "A4",
            margin: 50
        });

        // ==================================================
        // RESPONSE HEADERS
        // ==================================================

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            `inline; filename="${quotation.quotation_number}.pdf"`
        );

        // Pipe PDF to browser
        doc.pipe(res);

        // ==================================================
        // HEADER
        // ==================================================

        doc
            .fontSize(22)
            .font("Helvetica-Bold")
            .text("SECUREPRO SYSTEM SOLUTION");

        doc
            .fontSize(10)
            .font("Helvetica")
            .text("Service Management System");

        doc.moveDown();

        doc
            .fontSize(20)
            .font("Helvetica-Bold")
            .text("QUOTATION");

        doc.moveDown();

        // ==================================================
        // QUOTATION INFORMATION
        // ==================================================

        doc
            .fontSize(10)
            .font("Helvetica");

        doc.text(
            `Quotation No: ${quotation.quotation_number}`
        );

        doc.text(
            `Date: ${formatDate(quotation.created_at)}`
        );

        doc.text(
            `Valid For: ${quotation.validity_days} days`
        );

        doc.moveDown();

        // ==================================================
        // CUSTOMER
        // ==================================================

        doc
            .fontSize(12)
            .font("Helvetica-Bold")
            .text("CUSTOMER");

        doc.moveDown(0.3);

        doc
            .fontSize(10)
            .font("Helvetica");

        doc.text(
            quotation.customer_name || "-"
        );

        doc.text(
            quotation.customer_phone || "-"
        );

        doc.text(
            quotation.customer_email || "-"
        );

        doc.text(
            quotation.customer_address || "-"
        );

        doc.moveDown();

        // ==================================================
        // SERVICE
        // ==================================================

        doc
            .fontSize(12)
            .font("Helvetica-Bold")
            .text("SERVICE");

        doc.moveDown(0.3);

        doc
            .fontSize(10)
            .font("Helvetica")
            .text(
                quotation.service_name_en || "-"
            );

        doc.text(
            `Request Code: ${quotation.request_code}`
        );

        doc.moveDown();

        // ==================================================
        // ITEMS TABLE HEADER
        // ==================================================

        const tableTop = doc.y;

        doc
            .font("Helvetica-Bold")
            .fontSize(10);

        doc.text(
            "Description",
            50,
            tableTop,
            {
                width: 280
            }
        );

        doc.text(
            "Qty",
            340,
            tableTop,
            {
                width: 50,
                align: "center"
            }
        );

        doc.text(
            "Unit Price",
            390,
            tableTop,
            {
                width: 75,
                align: "right"
            }
        );

        doc.text(
            "Amount",
            470,
            tableTop,
            {
                width: 75,
                align: "right"
            }
        );

        doc.moveTo(50, tableTop + 18)
            .lineTo(545, tableTop + 18)
            .stroke();

        let currentY = tableTop + 28;

        // ==================================================
        // ITEMS
        // ==================================================

        doc.font("Helvetica");

        for (const item of items) {

            doc.text(
                item.description,
                50,
                currentY,
                {
                    width: 280
                }
            );

            doc.text(
                Number(item.quantity).toFixed(2),
                340,
                currentY,
                {
                    width: 50,
                    align: "center"
                }
            );

            doc.text(
                `RM ${Number(item.unit_price).toFixed(2)}`,
                390,
                currentY,
                {
                    width: 75,
                    align: "right"
                }
            );

            doc.text(
                `RM ${Number(item.amount).toFixed(2)}`,
                470,
                currentY,
                {
                    width: 75,
                    align: "right"
                }
            );

            currentY += 25;
        }

        doc.moveTo(50, currentY)
            .lineTo(545, currentY)
            .stroke();

        currentY += 15;

        // ==================================================
        // TOTALS
        // ==================================================

        doc.font("Helvetica");

        addTotal(
            doc,
            "Subtotal",
            quotation.subtotal,
            currentY
        );

        currentY += 20;

        addTotal(
            doc,
            "Discount",
            quotation.discount,
            currentY
        );

        currentY += 20;

        addTotal(
            doc,
            "Tax",
            quotation.tax,
            currentY
        );

        currentY += 20;

        addTotal(
            doc,
            "Delivery Charge",
            quotation.delivery_charge,
            currentY
        );

        currentY += 25;

        doc
            .font("Helvetica-Bold")
            .fontSize(13);

        doc.text(
            "TOTAL",
            380,
            currentY
        );

        doc.text(
            `RM ${Number(quotation.total).toFixed(2)}`,
            470,
            currentY,
            {
                width: 75,
                align: "right"
            }
        );

        currentY += 40;

        // ==================================================
        // NOTES
        // ==================================================

        doc
            .fontSize(11)
            .font("Helvetica-Bold")
            .text("Notes");

        doc
            .fontSize(10)
            .font("Helvetica")
            .text(
                quotation.notes || "-"
            );

        currentY = doc.y + 20;

        // ==================================================
        // TERMS
        // ==================================================

        doc
            .fontSize(11)
            .font("Helvetica-Bold")
            .text("Terms & Conditions");

        doc
            .fontSize(10)
            .font("Helvetica")
            .text(
                quotation.terms || "-"
            );

        // ==================================================
        // FOOTER
        // ==================================================

        doc
            .fontSize(8)
            .fillColor("gray")
            .text(
                "This quotation was generated by SecurePro Service Management System.",
                50,
                760,
                {
                    width: 495,
                    align: "center"
                }
            );

        // ==================================================
        // FINISH
        // ==================================================

        doc.end();

    } catch (error) {

        console.error(
            "Generate quotation PDF error:",
            error
        );

        if (!res.headersSent) {

            return res.status(500).json({
                success: false,
                message:
                    "Unable to generate quotation PDF."
            });

        }

    }

};


// ======================================================
// HELPERS
// ======================================================

function formatDate(date) {

    if (!date) {
        return "-";
    }

    return new Date(date).toLocaleDateString(
        "en-MY",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

}


function addTotal(
    doc,
    label,
    value,
    y
) {

    doc
        .fontSize(10)
        .font("Helvetica");

    doc.text(
        label,
        390,
        y,
        {
            width: 75
        }
    );

    doc.text(
        `RM ${Number(value).toFixed(2)}`,
        470,
        y,
        {
            width: 75,
            align: "right"
        }
    );

}


module.exports = {
    generateQuotationPDF
};