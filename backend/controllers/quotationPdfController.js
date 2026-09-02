const PDFDocument = require("pdfkit");
const pool = require("../config/db");

/*
=========================================================
 SECUREPRO QUOTATION PDF CONTROLLER
=========================================================

 - Professional SecurePro quotation design
 - A4
 - Compact one-page layout for normal quotations
 - Automatic page break for long item lists
 - Customer information
 - Service information
 - Quotation items
 - Totals
 - Notes
 - Terms
 - Prepared by
 - Footer / page number
 - Used by browser PDF and email attachment

 Exports:
 generateQuotationPDF
 createQuotationPDFBuffer
 getQuotationData
*/


// ======================================================
// COLORS
// ======================================================

const COLORS = {
    navy: "#101828",
    blue: "#2563EB",
    blueDark: "#1D4ED8",
    blueSoft: "#EFF6FF",

    text: "#172033",
    textSecondary: "#475467",
    muted: "#667085",

    border: "#D0D5DD",
    borderLight: "#E4E7EC",

    background: "#F8FAFC",
    white: "#FFFFFF",

    green: "#12B76A",
    greenSoft: "#ECFDF3",

    yellow: "#F79009",
    yellowSoft: "#FFFAEB",

    red: "#D92D20",
    redSoft: "#FEF3F2"
};


// ======================================================
// PAGE
// ======================================================

const PAGE = {
    width: 595.28,
    height: 841.89,

    marginLeft: 42,
    marginRight: 42,

    marginTop: 36,
    marginBottom: 42
};


const CONTENT_WIDTH =
    PAGE.width -
    PAGE.marginLeft -
    PAGE.marginRight;


// ======================================================
// GET QUOTATION DATA
// ======================================================

async function getQuotationData(id) {

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

            s.service_code,
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


    if (!quotations.length) {
        return null;
    }


    const quotation = quotations[0];


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

        ORDER BY id ASC
        `,
        [id]
    );


    quotation.items = items;


    return quotation;
}


// ======================================================
// ENSURE ITEMS
// ======================================================

async function ensureQuotationItems(quotation) {

    if (Array.isArray(quotation.items)) {
        return quotation.items;
    }


    if (!quotation.id) {
        quotation.items = [];
        return quotation.items;
    }


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

        ORDER BY id ASC
        `,
        [quotation.id]
    );


    quotation.items = items;

    return items;
}


// ======================================================
// CREATE PDF BUFFER
// ======================================================

async function createQuotationPDFBuffer(quotation) {

    const items =
        await ensureQuotationItems(quotation);

    return new Promise((resolve, reject) => {

        try {

            const doc = new PDFDocument({
                size: "A4",

                margins: {
                    top: PAGE.marginTop,
                    bottom: PAGE.marginBottom,
                    left: PAGE.marginLeft,
                    right: PAGE.marginRight
                },

                bufferPages: true,

                info: {
                    Title:
                        `Quotation ${quotation.quotation_number || ""}`,

                    Author:
                        "SecurePro System Solutions",

                    Subject:
                        "Customer Quotation"
                }
            });

            const chunks = [];

            doc.on("data", chunk => {
                chunks.push(chunk);
            });

            doc.on("end", () => {
                resolve(
                    Buffer.concat(chunks)
                );
            });

            doc.on("error", error => {
                reject(error);
            });


            // ==================================================
            // HEADER
            // ==================================================

            drawHeader(
                doc,
                quotation
            );


            let y =
                drawQuotationMeta(
                    doc,
                    quotation
                );


            // ==================================================
            // CUSTOMER / SERVICE
            // ==================================================

            y += 14;

            y =
                drawCustomerServiceCards(
                    doc,
                    quotation,
                    y
                );


            // ==================================================
            // ITEMS
            // ==================================================

            y += 15;

            y =
                drawItemsTable(
                    doc,
                    quotation,
                    items,
                    y
                );


            // ==================================================
            // TOTALS
            // ==================================================

            y += 12;

            y =
                drawTotals(
                    doc,
                    quotation,
                    y
                );


            // ==================================================
            // NOTES / TERMS
            // ==================================================

            y += 14;

            y =
                drawNotesAndTerms(
                    doc,
                    quotation,
                    y
                );


            // ==================================================
            // SIGNATURE
            // ==================================================

            y += 12;

            drawSignature(
                doc,
                quotation,
                y
            );


            // ==================================================
            // FOOTER
            // ==================================================

            addFooters(doc);


            // ==================================================
            // FINISH
            // ==================================================

            doc.end();

        } catch (error) {

            reject(error);

        }

    });
}


// ======================================================
// HEADER
// ======================================================

function drawHeader(
    doc,
    quotation
) {

    const x =
        PAGE.marginLeft;

    const y =
        36;


    // ------------------------------------------
    // LEFT BLUE BAR
    // ------------------------------------------

    doc
        .roundedRect(
            x,
            y,
            6,
            54,
            3
        )
        .fill(
            COLORS.blue
        );


    // ------------------------------------------
    // LOGO MARK
    // ------------------------------------------

    doc
        .roundedRect(
            x + 17,
            y + 1,
            40,
            40,
            9
        )
        .fill(
            COLORS.navy
        );


    doc
        .font("Helvetica-Bold")
        .fontSize(19)
        .fillColor(COLORS.white)
        .text(
            "S",
            x + 17,
            y + 9,
            {
                width: 40,
                align: "center"
            }
        );


    // ------------------------------------------
    // COMPANY NAME
    // ------------------------------------------

    doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor(COLORS.navy)
        .text(
            "SECUREPRO",
            x + 68,
            y + 2
        );


    doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(COLORS.muted)
        .text(
            "SYSTEM SOLUTIONS",
            x + 68,
            y + 20
        );


    doc
        .font("Helvetica")
        .fontSize(7)
        .fillColor(COLORS.muted)
        .text(
            "Professional Security & System Solutions",
            x + 68,
            y + 34
        );


    // ------------------------------------------
    // QUOTATION
    // ------------------------------------------

    const rightX = 340;
    const rightWidth = 213;


    doc
        .font("Helvetica-Bold")
        .fontSize(24)
        .fillColor(COLORS.navy)
        .text(
            "QUOTATION",
            rightX,
            y,
            {
                width: rightWidth,
                align: "right"
            }
        );


    doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(COLORS.blue)
        .text(
            quotation.quotation_number || "-",
            rightX,
            y + 31,
            {
                width: rightWidth,
                align: "right"
            }
        );


    drawStatusBadge(
        doc,
        quotation.status,
        rightX,
        y + 46,
        rightWidth
    );


    // ------------------------------------------
    // DIVIDER
    // ------------------------------------------

    doc
        .moveTo(
            x,
            102
        )
        .lineTo(
            PAGE.width -
                PAGE.marginRight,
            102
        )
        .lineWidth(1)
        .strokeColor(
            COLORS.border
        )
        .stroke();
}


// ======================================================
// QUOTATION META
// ======================================================

function drawQuotationMeta(
    doc,
    quotation
) {

    const x =
        PAGE.marginLeft;

    const y =
        117;


    drawMetaBlock(
        doc,
        "DATE",
        formatDate(
            quotation.created_at
        ),
        x,
        y,
        120
    );


    drawMetaBlock(
        doc,
        "VALID FOR",
        `${Number(
            quotation.validity_days || 0
        )} DAYS`,
        x + 140,
        y,
        100
    );


    drawMetaBlock(
        doc,
        "REQUEST CODE",
        quotation.request_code || "-",
        x + 265,
        y,
        175
    );


    return y + 31;
}


// ======================================================
// META BLOCK
// ======================================================

function drawMetaBlock(
    doc,
    label,
    value,
    x,
    y,
    width
) {

    doc
        .font("Helvetica-Bold")
        .fontSize(6.5)
        .fillColor(COLORS.muted)
        .text(
            label,
            x,
            y,
            {
                width
            }
        );


    doc
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .fillColor(COLORS.text)
        .text(
            value,
            x,
            y + 11,
            {
                width
            }
        );
}


// ======================================================
// CUSTOMER / SERVICE CARDS
// ======================================================

function drawCustomerServiceCards(
    doc,
    quotation,
    y
) {

    const x =
        PAGE.marginLeft;

    const gap =
        12;

    const width =
        (
            CONTENT_WIDTH -
            gap
        ) / 2;

    const height =
        86;


    drawInfoCard(
        doc,
        {
            title: "BILL TO",

            x,

            y,

            width,

            height,

            lines: [
                {
                    value:
                        quotation.customer_name ||
                        "-",

                    bold: true,

                    size: 10
                },

                {
                    value:
                        quotation.customer_phone ||
                        "-",

                    size: 7.5
                },

                {
                    value:
                        quotation.customer_email ||
                        "-",

                    size: 7.5
                },

                {
                    value:
                        quotation.customer_address ||
                        "",

                    size: 7,

                    color:
                        COLORS.muted
                }
            ]
        }
    );


    drawInfoCard(
        doc,
        {
            title:
                "SERVICE DETAILS",

            x:
                x +
                width +
                gap,

            y,

            width,

            height,

            lines: [
                {
                    value:
                        quotation.service_name_en ||
                        quotation.service_name ||
                        "-",

                    bold: true,

                    size: 10
                },

                {
                    value:
                        `Request: ${
                            quotation.request_code ||
                            "-"
                        }`,

                    size: 7.5
                },

                {
                    value:
                        quotation.service_code
                            ? `Code: ${quotation.service_code}`
                            : "",

                    size: 7.5
                },

                {
                    value:
                        quotation.customer_notes ||
                        "",

                    size: 7,

                    color:
                        COLORS.muted
                }
            ]
        }
    );


    return y + height;
}


// ======================================================
// INFO CARD
// ======================================================

function drawInfoCard(
    doc,
    options
) {

    const {
        title,
        x,
        y,
        width,
        height,
        lines
    } = options;


    doc
        .roundedRect(
            x,
            y,
            width,
            height,
            7
        )
        .fillColor(COLORS.white)
        .strokeColor(COLORS.border)
        .lineWidth(0.7)
        .fillAndStroke(
            COLORS.white,
            COLORS.border
        );


    doc
        .font("Helvetica-Bold")
        .fontSize(6.5)
        .fillColor(COLORS.blue)
        .text(
            title,
            x + 12,
            y + 10
        );


    doc
        .moveTo(
            x + 12,
            y + 25
        )
        .lineTo(
            x + width - 12,
            y + 25
        )
        .lineWidth(0.6)
        .strokeColor(COLORS.borderLight)
        .stroke();


    let currentY =
        y + 35;


    lines.forEach(line => {

        if (!line.value) {
            return;
        }


        doc
            .font(
                line.bold
                    ? "Helvetica-Bold"
                    : "Helvetica"
            )
            .fontSize(
                line.size || 7.5
            )
            .fillColor(
                line.color ||
                COLORS.textSecondary
            )
            .text(
                String(line.value),
                x + 12,
                currentY,
                {
                    width:
                        width - 24,

                    height: 16,

                    ellipsis: true
                }
            );


        currentY +=
            line.bold
                ? 16
                : 13;

    });
}


// ======================================================
// ITEMS TABLE
// ======================================================

function drawItemsTable(
    doc,
    quotation,
    items,
    startY
) {

    const x =
        PAGE.marginLeft;

    const tableWidth =
        CONTENT_WIDTH;


    const descriptionWidth =
        270;

    const qtyWidth =
        50;

    const unitWidth =
        82;

    const amountWidth =
        tableWidth -
        descriptionWidth -
        qtyWidth -
        unitWidth;


    const headerHeight =
        23;


    let y =
        startY;


    // ------------------------------------------
    // TITLE
    // ------------------------------------------

    doc
        .font("Helvetica-Bold")
        .fontSize(7)
        .fillColor(COLORS.blue)
        .text(
            "QUOTATION ITEMS",
            x,
            y
        );


    y += 13;


    // ------------------------------------------
    // HEADER
    // ------------------------------------------

    drawItemsHeader(
        doc,
        x,
        y,
        tableWidth,
        descriptionWidth,
        qtyWidth,
        unitWidth,
        amountWidth,
        headerHeight
    );


    y +=
        headerHeight;


    // ------------------------------------------
    // EMPTY
    // ------------------------------------------

    if (!items.length) {

        drawTableRow(
            doc,
            {
                x,
                y,
                tableWidth,
                descriptionWidth,
                qtyWidth,
                unitWidth,
                amountWidth,

                description:
                    "No quotation items",

                quantity:
                    "-",

                unitPrice:
                    "-",

                amount:
                    "-"
            }
        );


        return y + 32;
    }


    // ------------------------------------------
    // ITEMS
    // ------------------------------------------

    items.forEach(
        (item, index) => {

            const description =
                String(
                    item.description ||
                    "Service Item"
                );


            const quantity =
                Number(
                    item.quantity || 0
                );


            const unitPrice =
                Number(
                    item.unit_price || 0
                );


            const amount =
                Number(
                    item.amount ??
                    quantity *
                    unitPrice
                );


            const textHeight =
                doc.heightOfString(
                    description,
                    {
                        width:
                            descriptionWidth -
                            20
                    }
                );


            const rowHeight =
                Math.max(
                    30,
                    textHeight + 14
                );


           




            drawTableRow(
                doc,
                {
                    x,
                    y,
                    tableWidth,
                    descriptionWidth,
                    qtyWidth,
                    unitWidth,
                    amountWidth,

                    description,

                    quantity:
                        formatNumber(
                            quantity
                        ),

                    unitPrice:
                        money(
                            unitPrice
                        ),

                    amount:
                        money(
                            amount
                        ),

                    alternate:
                        index % 2 === 1
                }
            );


            y +=
                rowHeight;

        }
    );


    return y;
}


// ======================================================
// ITEMS HEADER
// ======================================================

function drawItemsHeader(
    doc,
    x,
    y,
    tableWidth,
    descriptionWidth,
    qtyWidth,
    unitWidth,
    amountWidth,
    headerHeight
) {

    doc
        .rect(
            x,
            y,
            tableWidth,
            headerHeight
        )
        .fill(
            COLORS.navy
        );


    doc
        .font("Helvetica-Bold")
        .fontSize(6.8)
        .fillColor(COLORS.white);


    doc.text(
        "DESCRIPTION",
        x + 9,
        y + 7,
        {
            width:
                descriptionWidth - 18
        }
    );


    doc.text(
        "QTY",
        x + descriptionWidth,
        y + 7,
        {
            width:
                qtyWidth,
            align:
                "center"
        }
    );


    doc.text(
        "UNIT PRICE",
        x +
        descriptionWidth +
        qtyWidth,
        y + 7,
        {
            width:
                unitWidth,
            align:
                "right"
        }
    );


    doc.text(
        "AMOUNT",
        x +
        descriptionWidth +
        qtyWidth +
        unitWidth,
        y + 7,
        {
            width:
                amountWidth - 9,
            align:
                "right"
        }
    );
}


// ======================================================
// TABLE ROW
// ======================================================

function drawTableRow(
    doc,
    options
) {

    const {
        x,
        y,
        tableWidth,
        descriptionWidth,
        qtyWidth,
        unitWidth,
        amountWidth,

        description,
        quantity,
        unitPrice,
        amount,

        alternate = false
    } = options;


    const textHeight =
        doc.heightOfString(
            description,
            {
                width:
                    descriptionWidth -
                    18
            }
        );


    const rowHeight =
        Math.max(
            30,
            textHeight + 14
        );


    // ------------------------------------------
    // BACKGROUND
    // ------------------------------------------

    if (alternate) {

        doc
            .rect(
                x,
                y,
                tableWidth,
                rowHeight
            )
            .fill(
                "#F9FAFB"
            );
    }


    // ------------------------------------------
    // BOTTOM LINE
    // ------------------------------------------

    doc
        .moveTo(
            x,
            y + rowHeight
        )
        .lineTo(
            x + tableWidth,
            y + rowHeight
        )
        .lineWidth(0.8)
        .strokeColor(
            COLORS.border
        )
        .stroke();


    // ------------------------------------------
    // DESCRIPTION
    // ------------------------------------------

    doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(COLORS.text)
        .text(
            description,
            x + 9,
            y + 8,
            {
                width:
                    descriptionWidth - 18
            }
        );


    // ------------------------------------------
    // QTY
    // ------------------------------------------

    doc
        .fontSize(8)
        .fillColor(
            COLORS.textSecondary
        )
        .text(
            quantity,
            x + descriptionWidth,
            y + 8,
            {
                width:
                    qtyWidth,

                align:
                    "center"
            }
        );


    // ------------------------------------------
    // UNIT
    // ------------------------------------------

    doc
        .text(
            unitPrice,
            x +
            descriptionWidth +
            qtyWidth,
            y + 8,
            {
                width:
                    unitWidth,

                align:
                    "right"
            }
        );


    // ------------------------------------------
    // AMOUNT
    // ------------------------------------------

    doc
        .font("Helvetica-Bold")
        .fillColor(COLORS.text)
        .text(
            amount,
            x +
            descriptionWidth +
            qtyWidth +
            unitWidth,
            y + 8,
            {
                width:
                    amountWidth - 9,

                align:
                    "right"
            }
        );
}


// ======================================================
// TOTALS
// ======================================================

function drawTotals(
    doc,
    quotation,
    y
) {

    const boxWidth =
        220;

    const boxHeight =
        116;

    const boxX =
        PAGE.width -
        PAGE.marginRight -
        boxWidth;


    doc
        .roundedRect(
            boxX,
            y,
            boxWidth,
            boxHeight,
            8
        )
        .fillColor(
            COLORS.background
        )
        .strokeColor(
            COLORS.border
        )
        .lineWidth(0.7)
        .fillAndStroke(
            COLORS.background,
            COLORS.border
        );


    let currentY =
        y + 13;


    drawTotalLine(
        doc,
        "Subtotal",
        quotation.subtotal,
        boxX + 14,
        currentY,
        boxWidth - 28
    );


    currentY += 18;


    drawTotalLine(
        doc,
        "Discount",
        quotation.discount,
        boxX + 14,
        currentY,
        boxWidth - 28
    );


    currentY += 18;


    drawTotalLine(
        doc,
        "Tax",
        quotation.tax,
        boxX + 14,
        currentY,
        boxWidth - 28
    );


    currentY += 18;


    drawTotalLine(
        doc,
        "Delivery",
        quotation.delivery_charge,
        boxX + 14,
        currentY,
        boxWidth - 28
    );


    currentY += 15;


    // ------------------------------------------
    // DIVIDER
    // ------------------------------------------

    doc
        .moveTo(
            boxX + 14,
            currentY
        )
        .lineTo(
            boxX +
            boxWidth -
            14,
            currentY
        )
        .lineWidth(0.9)
        .strokeColor(
            COLORS.border
        )
        .stroke();


    currentY += 11;


    // ------------------------------------------
    // TOTAL
    // ------------------------------------------

    doc
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor(COLORS.navy)
        .text(
            "TOTAL",
            boxX + 14,
            currentY
        );


    doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor(COLORS.blue)
        .text(
            money(
                quotation.total
            ),
            boxX + 14,
            currentY - 2,
            {
                width:
                    boxWidth - 28,

                align:
                    "right"
            }
        );


    return y + boxHeight;
}


// ======================================================
// TOTAL LINE
// ======================================================

function drawTotalLine(
    doc,
    label,
    value,
    x,
    y,
    width
) {

    doc
        .font("Helvetica")
        .fontSize(7.8)
        .fillColor(
            COLORS.textSecondary
        )
        .text(
            label,
            x,
            y
        );


    doc
        .font("Helvetica-Bold")
        .fontSize(7.8)
        .fillColor(
            COLORS.text
        )
        .text(
            money(value),
            x,
            y,
            {
                width,
                align:
                    "right"
            }
        );
}


// ======================================================
// NOTES / TERMS
// ======================================================

function drawNotesAndTerms(
    doc,
    quotation,
    y
) {

    const gap =
        14;

    const columnWidth =
        (
            CONTENT_WIDTH -
            gap
        ) / 2;


    const x =
        PAGE.marginLeft;


    const notesHeight =
        drawTextSection(
            doc,
            {
                title:
                    "NOTES",

                text:
                    quotation.notes ||
                    "No additional notes.",

                x,

                y,

                width:
                    columnWidth
            }
        );


    const termsHeight =
        drawTextSection(
            doc,
            {
                title:
                    "TERMS & CONDITIONS",

                text:
                    quotation.terms ||
                    "No additional terms and conditions.",

                x:
                    x +
                    columnWidth +
                    gap,

                y,

                width:
                    columnWidth
            }
        );


    return y +
        Math.max(
            notesHeight,
            termsHeight
        );
}


// ======================================================
// TEXT SECTION
// ======================================================

function drawTextSection(
    doc,
    options
) {

    const {
        title,
        text,
        x,
        y,
        width
    } = options;


    const padding =
        11;


    const body =
        String(
            text || "-"
        );


    const bodyHeight =
        doc.heightOfString(
            body,
            {
                width:
                    width -
                    padding * 2
            }
        );


    const height =
        Math.max(
            62,
            bodyHeight + 37
        );


    doc
        .roundedRect(
            x,
            y,
            width,
            height,
            7
        )
        .fillColor(COLORS.white)
        .strokeColor(COLORS.border)
        .lineWidth(0.7)
        .fillAndStroke(
            COLORS.white,
            COLORS.border
        );


    // ------------------------------------------
    // TITLE
    // ------------------------------------------

    doc
        .font("Helvetica-Bold")
        .fontSize(6.5)
        .fillColor(COLORS.blue)
        .text(
            title,
            x + padding,
            y + 10
        );


    // ------------------------------------------
    // DIVIDER
    // ------------------------------------------

    doc
        .moveTo(
            x + padding,
            y + 24
        )
        .lineTo(
            x +
            width -
            padding,
            y + 24
        )
        .lineWidth(0.6)
        .strokeColor(
            COLORS.borderLight
        )
        .stroke();


    // ------------------------------------------
    // BODY
    // ------------------------------------------

    doc
        .font("Helvetica")
        .fontSize(7.2)
        .fillColor(
            COLORS.textSecondary
        )
        .text(
            body,
            x + padding,
            y + 32,
            {
                width:
                    width -
                    padding * 2,

                lineGap: 1
            }
        );


    return height;
}


// ======================================================
// SIGNATURE
// ======================================================

function drawSignature(
    doc,
    quotation,
    y
) {

    const x =
        PAGE.marginLeft;


    doc
        .font("Helvetica-Bold")
        .fontSize(6.5)
        .fillColor(COLORS.muted)
        .text(
            "PREPARED BY",
            x,
            y
        );


    doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(COLORS.text)
        .text(
            quotation.created_by_name ||
            "SecurePro Admin",
            x,
            y + 11
        );


    doc
        .moveTo(
            x,
            y + 31
        )
        .lineTo(
            x + 190,
            y + 31
        )
        .lineWidth(0.7)
        .strokeColor(
            COLORS.border
        )
        .stroke();


    doc
        .font("Helvetica")
        .fontSize(6.5)
        .fillColor(COLORS.muted)
        .text(
            "Authorised Representative",
            x,
            y + 36
        );


    // ------------------------------------------
    // THANK YOU
    // ------------------------------------------

    doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(COLORS.blue)
        .text(
            "Thank you for choosing SecurePro.",
            330,
            y + 2,
            {
                width: 210,
                align: "right"
            }
        );


    doc
        .font("Helvetica")
        .fontSize(6.8)
        .fillColor(COLORS.muted)
        .text(
            "We appreciate your business.",
            330,
            y + 16,
            {
                width: 210,
                align: "right"
            }
        );
}


// ======================================================
// STATUS BADGE
// ======================================================

function drawStatusBadge(
    doc,
    status,
    x,
    y,
    width
) {

    const value =
        String(
            status || "draft"
        ).toLowerCase();


    let background =
        COLORS.yellowSoft;

    let foreground =
        COLORS.yellow;


    if (value === "sent") {

        background =
            COLORS.greenSoft;

        foreground =
            COLORS.green;

    } else if (
        value === "cancelled" ||
        value === "rejected"
    ) {

        background =
            COLORS.redSoft;

        foreground =
            COLORS.red;
    }


    const badgeWidth =
        60;

    const badgeHeight =
        16;


    const badgeX =
        x +
        width -
        badgeWidth;


    doc
        .roundedRect(
            badgeX,
            y,
            badgeWidth,
            badgeHeight,
            8
        )
        .fill(
            background
        );


    doc
        .font("Helvetica-Bold")
        .fontSize(5.8)
        .fillColor(foreground)
        .text(
            value.toUpperCase(),
            badgeX,
            y + 5,
            {
                width:
                    badgeWidth,

                align:
                    "center"
            }
        );
}


// ======================================================
// FOOTER
// ======================================================

function addFooters(doc) {

    const range =
        doc.bufferedPageRange();


    for (
        let i = range.start;
        i <
        range.start +
        range.count;
        i++
    ) {

        doc.switchToPage(i);


        const pageNumber =
            i -
            range.start +
            1;


        const y =
            PAGE.height -
            30;


        // ------------------------------------------
        // LINE
        // ------------------------------------------

        doc
            .moveTo(
                PAGE.marginLeft,
                y
            )
            .lineTo(
                PAGE.width -
                PAGE.marginRight,
                y
            )
            .lineWidth(0.7)
            .strokeColor(
                COLORS.borderLight
            )
            .stroke();


        // ------------------------------------------
        // LEFT
        // ------------------------------------------

        doc
            .font("Helvetica")
            .fontSize(6)
            .fillColor(COLORS.muted)
            .text(
                "SecurePro System Solutions",
                PAGE.marginLeft,
                y + 8
            );


        // ------------------------------------------
        // CENTER
        // ------------------------------------------

        doc
            .text(
                "Quotation generated by SecurePro Service Management System",
                175,
                y + 8,
                {
                    width: 245,
                    align: "center"
                }
            );


        // ------------------------------------------
        // RIGHT
        // ------------------------------------------

        doc
            .text(
                `Page ${pageNumber} of ${range.count}`,
                PAGE.width -
                PAGE.marginRight -
                70,
                y + 8,
                {
                    width: 70,
                    align: "right"
                }
            );
    }
}


// ======================================================
// DATE
// ======================================================

function formatDate(date) {

    if (!date) {
        return "-";
    }


    const parsed =
        new Date(date);


    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {

        return "-";
    }


    return parsed.toLocaleDateString(
        "en-MY",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


// ======================================================
// NUMBER
// ======================================================

function formatNumber(value) {

    const number =
        Number(value);


    if (
        !Number.isFinite(number)
    ) {

        return "0";
    }


    return number.toLocaleString(
        "en-MY",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    );
}


// ======================================================
// MONEY
// ======================================================

function money(value) {

    const number =
        Number(value);


    if (
        !Number.isFinite(number)
    ) {

        return "RM 0.00";
    }


    return `RM ${number.toLocaleString(
        "en-MY",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    )}`;
}


// ======================================================
// SAFE FILENAME
// ======================================================

function safeFilename(value) {

    return String(
        value || "quotation"
    )
        .replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        );
}


// ======================================================
// GENERATE PDF
// ======================================================

const generateQuotationPDF =
    async (req, res) => {

        try {

            const {
                id
            } = req.params;


            const quotation =
                await getQuotationData(id);


            if (!quotation) {

                return res
                    .status(404)
                    .json({
                        success: false,

                        message:
                            "Quotation not found."
                    });
            }


            const pdfBuffer =
                await createQuotationPDFBuffer(
                    quotation
                );


            res.setHeader(
                "Content-Type",
                "application/pdf"
            );


            res.setHeader(
                "Content-Disposition",
                `inline; filename="${safeFilename(
                    quotation.quotation_number
                )}.pdf"`
            );


            res.setHeader(
                "Content-Length",
                pdfBuffer.length
            );


            return res.send(
                pdfBuffer
            );

        } catch (error) {

            console.error(
                "Generate quotation PDF error:",
                error
            );


            return res
                .status(500)
                .json({
                    success: false,

                    message:
                        "Unable to generate quotation PDF."
                });
        }
    };


// ======================================================
// EXPORT
// ======================================================

module.exports = {
    generateQuotationPDF,
    createQuotationPDFBuffer,
    getQuotationData
};