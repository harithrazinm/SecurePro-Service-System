const crypto = require("crypto");
const pool = require("../config/db");

// ======================================================
// GENERATE QUOTATION NUMBER
// ======================================================

async function generateQuotationNumber(connection) {

    const year = new Date().getFullYear();

    const [rows] = await connection.query(
        `
        SELECT quotation_number
        FROM quotations
        WHERE quotation_number LIKE ?
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [`Q-${year}-%`]
    );

    let nextNumber = 1;

    if (rows.length > 0) {

        const lastNumber =
            parseInt(
                rows[0].quotation_number
                    .split("-")
                    .pop()
            );

        if (!isNaN(lastNumber)) {
            nextNumber = lastNumber + 1;
        }
    }

    return `Q-${year}-${String(nextNumber).padStart(4, "0")}`;
}


// ======================================================
// CALCULATE TOTAL
// ======================================================

function calculateTotals(
    items,
    discount = 0,
    tax = 0,
    deliveryCharge = 0
) {

    let subtotal = 0;

    for (const item of items) {

        const quantity =
            Number(item.quantity);

        const unitPrice =
            Number(item.unit_price);

        if (
            !Number.isFinite(quantity) ||
            quantity <= 0
        ) {
            throw new Error(
                "Invalid quotation item quantity."
            );
        }

        if (
            !Number.isFinite(unitPrice) ||
            unitPrice < 0
        ) {
            throw new Error(
                "Invalid quotation item price."
            );
        }

        subtotal += quantity * unitPrice;
    }

    discount = Number(discount) || 0;
    tax = Number(tax) || 0;
    deliveryCharge =
        Number(deliveryCharge) || 0;

    if (discount < 0) {
        throw new Error(
            "Discount cannot be negative."
        );
    }

    if (tax < 0) {
        throw new Error(
            "Tax cannot be negative."
        );
    }

    if (deliveryCharge < 0) {
        throw new Error(
            "Delivery charge cannot be negative."
        );
    }

    const total =
        subtotal -
        discount +
        tax +
        deliveryCharge;

    if (total < 0) {
        throw new Error(
            "Quotation total cannot be negative."
        );
    }

    return {
        subtotal: Number(subtotal.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        tax: Number(tax.toFixed(2)),
        delivery_charge:
            Number(deliveryCharge.toFixed(2)),
        total: Number(total.toFixed(2))
    };
}


// ======================================================
// CREATE QUOTATION
// ======================================================

async function createQuotation(req, res) {

    const connection =
        await pool.getConnection();

    try {

        let {
    request_id,
    items,
    discount = 0,
    tax = 0,
    delivery_charge = 0,
    validity_days = 30,
    notes = null,
    terms = null
} = req.body;

        // --------------------------------------------------
        // VALIDATE REQUEST ID
        // --------------------------------------------------

        if (!request_id) {

            return res.status(400).json({
                success: false,
                message:
                    "Request ID is required."
            });
        }

        // --------------------------------------------------
        // VALIDATE ITEMS
        // --------------------------------------------------

        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "At least one quotation item is required."
            });
        }

        // --------------------------------------------------
        // VALIDATE VALIDITY
        // --------------------------------------------------

        validity_days =
            Number(validity_days);

        if (
            !Number.isInteger(validity_days) ||
            validity_days <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Validity days must be a positive number."
            });
        }

        // --------------------------------------------------
        // CHECK REQUEST
        // --------------------------------------------------

        const [requests] =
            await connection.query(
                `
                SELECT
                    id,
                    request_code,
                    customer_name,
                    customer_phone,
                    customer_email,
                    service_id,
                    status
                FROM service_requests
                WHERE id = ?
                LIMIT 1
                `,
                [request_id]
            );

        if (requests.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Service request not found."
            });
        }

        // --------------------------------------------------
        // CALCULATE
        // --------------------------------------------------

        const totals =
            calculateTotals(
                items,
                discount,
                tax,
                delivery_charge
            );

        // --------------------------------------------------
        // START TRANSACTION
        // --------------------------------------------------

        await connection.beginTransaction();

        const quotationId =
            crypto.randomUUID();

        const quotationNumber =
            await generateQuotationNumber(
                connection
            );

        // --------------------------------------------------
        // INSERT QUOTATION
        // --------------------------------------------------

        await connection.query(
            `
            INSERT INTO quotations (
                id,
                quotation_number,
                request_id,
                subtotal,
                discount,
                tax,
                delivery_charge,
                total,
                validity_days,
                notes,
                terms,
                status,
                created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)
            `,
            [
                quotationId,
                quotationNumber,
                request_id,
                totals.subtotal,
                totals.discount,
                totals.tax,
                totals.delivery_charge,
                totals.total,
                validity_days,
                notes,
                terms,
                req.user.id
            ]
        );

        // --------------------------------------------------
        // INSERT ITEMS
        // --------------------------------------------------

        for (const item of items) {

            const quantity =
                Number(item.quantity);

            const unitPrice =
                Number(item.unit_price);

            const amount =
                quantity * unitPrice;

            await connection.query(
                `
                INSERT INTO quotation_items (
                    id,
                    quotation_id,
                    description,
                    quantity,
                    unit_price,
                    amount
                )
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    crypto.randomUUID(),
                    quotationId,
                    String(
                        item.description || ""
                    ).trim(),
                    quantity,
                    unitPrice,
                    Number(
                        amount.toFixed(2)
                    )
                ]
            );
        }

        await connection.commit();

        return res.status(201).json({
            success: true,
            message:
                "Quotation created successfully.",
            data: {
                id: quotationId,
                quotation_number:
                    quotationNumber,
                request_id,
                ...totals,
                validity_days,
                status: "draft"
            }
        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "Create quotation error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to create quotation."
        });

    } finally {

        connection.release();
    }
}


// ======================================================
// GET QUOTATION BY ID
// ======================================================

async function getQuotationById(req, res) {

    try {

        const {
            id
        } = req.params;

        const [quotations] =
            await pool.query(
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

        if (quotations.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Quotation not found."
            });
        }

        const quotation =
            quotations[0];

        const [items] =
            await pool.query(
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

        return res.json({
            success: true,
            data: quotation
        });

    } catch (error) {

        console.error(
            "Get quotation error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to retrieve quotation."
        });
    }
}


// ======================================================
// GET QUOTATIONS
// ======================================================

async function getQuotations(req, res) {

    try {

        const [rows] =
            await pool.query(
                `
                SELECT
                    q.id,
                    q.quotation_number,
                    q.request_id,
                    q.subtotal,
                    q.discount,
                    q.tax,
                    q.delivery_charge,
                    q.total,
                    q.validity_days,
                    q.status,
                    q.created_at,
                    q.updated_at,

                    r.request_code,
                    r.customer_name,
                    r.customer_phone,
                    r.customer_email,

                    s.name_en AS service_name

                FROM quotations q

                INNER JOIN service_requests r
                    ON r.id = q.request_id

                INNER JOIN services s
                    ON s.id = r.service_id

                ORDER BY q.created_at DESC
                `
            );

        return res.json({
            success: true,
            data: rows
        });

    } catch (error) {

        console.error(
            "Get quotations error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to retrieve quotations."
        });
    }
}


// ======================================================
// GET QUOTATIONS FOR REQUEST
// ======================================================

async function getQuotationsByRequest(
    req,
    res
) {

    try {

        const {
            requestId
        } = req.params;

        const [rows] =
            await pool.query(
                `
                SELECT
                    id,
                    quotation_number,
                    subtotal,
                    discount,
                    tax,
                    delivery_charge,
                    total,
                    validity_days,
                    status,
                    sent_at,
                    created_at,
                    updated_at

                FROM quotations

                WHERE request_id = ?

                ORDER BY created_at DESC
                `,
                [requestId]
            );

        return res.json({
            success: true,
            data: rows
        });

    } catch (error) {

        console.error(
            "Get request quotations error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to retrieve request quotations."
        });
    }
}


// ======================================================
// UPDATE QUOTATION
// ======================================================

async function updateQuotation(req, res) {

    const connection =
        await pool.getConnection();

    try {

        const {
            id
        } = req.params;

        const {
            items,
            discount = 0,
            tax = 0,
            delivery_charge = 0,
            validity_days = 30,
            notes = null,
            terms = null
        } = req.body;

        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "At least one quotation item is required."
            });
        }

        // --------------------------------------------------
        // CHECK QUOTATION
        // --------------------------------------------------

        const [existing] =
            await connection.query(
                `
                SELECT
                    id,
                    status
                FROM quotations
                WHERE id = ?
                LIMIT 1
                `,
                [id]
            );

        if (existing.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Quotation not found."
            });
        }

        if (
            existing[0].status !== "draft"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Only draft quotations can be updated."
            });
        }

        const totals =
            calculateTotals(
                items,
                discount,
                tax,
                delivery_charge
            );

        await connection.beginTransaction();

        // --------------------------------------------------
        // UPDATE QUOTATION
        // --------------------------------------------------

        await connection.query(
            `
            UPDATE quotations

            SET
                subtotal = ?,
                discount = ?,
                tax = ?,
                delivery_charge = ?,
                total = ?,
                validity_days = ?,
                notes = ?,
                terms = ?

            WHERE id = ?
            `,
            [
                totals.subtotal,
                totals.discount,
                totals.tax,
                totals.delivery_charge,
                totals.total,
                validity_days,
                notes,
                terms,
                id
            ]
        );

        // --------------------------------------------------
        // DELETE OLD ITEMS
        // --------------------------------------------------

        await connection.query(
            `
            DELETE FROM quotation_items
            WHERE quotation_id = ?
            `,
            [id]
        );

        // --------------------------------------------------
        // INSERT NEW ITEMS
        // --------------------------------------------------

        for (const item of items) {

            const quantity =
                Number(item.quantity);

            const unitPrice =
                Number(item.unit_price);

            const amount =
                quantity * unitPrice;

            await connection.query(
                `
                INSERT INTO quotation_items (
                    id,
                    quotation_id,
                    description,
                    quantity,
                    unit_price,
                    amount
                )
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    crypto.randomUUID(),
                    id,
                    String(
                        item.description || ""
                    ).trim(),
                    quantity,
                    unitPrice,
                    Number(
                        amount.toFixed(2)
                    )
                ]
            );
        }

        await connection.commit();

        return res.json({
            success: true,
            message:
                "Quotation updated successfully.",
            data: totals
        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "Update quotation error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to update quotation."
        });

    } finally {

        connection.release();
    }
}


// ======================================================
// SEND QUOTATION
// ======================================================

async function sendQuotation(req, res) {

    try {

        const {
            id
        } = req.params;

        const [rows] =
            await pool.query(
                `
                SELECT
                    id,
                    quotation_number,
                    status
                FROM quotations
                WHERE id = ?
                LIMIT 1
                `,
                [id]
            );

        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Quotation not found."
            });
        }

        if (
            rows[0].status !== "draft"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Only draft quotations can be sent."
            });
        }

        await pool.query(
            `
            UPDATE quotations

            SET
                status = 'sent',
                sent_at = CURRENT_TIMESTAMP

            WHERE id = ?
            `,
            [id]
        );

        return res.json({
            success: true,
            message:
                "Quotation marked as sent.",
            data: {
                quotation_number:
                    rows[0].quotation_number,
                status: "sent"
            }
        });

    } catch (error) {

        console.error(
            "Send quotation error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to send quotation."
        });
    }
}


// ======================================================
// DELETE DRAFT QUOTATION
// ======================================================

async function deleteQuotation(req, res) {

    try {

        const {
            id
        } = req.params;

        const [rows] =
            await pool.query(
                `
                SELECT
                    id,
                    status
                FROM quotations
                WHERE id = ?
                LIMIT 1
                `,
                [id]
            );

        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Quotation not found."
            });
        }

        if (
            rows[0].status !== "draft"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Only draft quotations can be deleted."
            });
        }

        await pool.query(
            `
            DELETE FROM quotations
            WHERE id = ?
            `,
            [id]
        );

        return res.json({
            success: true,
            message:
                "Quotation deleted successfully."
        });

    } catch (error) {

        console.error(
            "Delete quotation error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to delete quotation."
        });
    }
}


// ======================================================
// EXPORTS
// ======================================================

module.exports = {

    createQuotation,

    getQuotationById,

    getQuotations,

    getQuotationsByRequest,

    updateQuotation,

    sendQuotation,

    deleteQuotation

};