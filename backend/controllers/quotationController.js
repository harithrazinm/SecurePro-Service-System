const crypto = require("crypto");
const pool = require("../config/db");
const {
    sendQuotationEmail
} = require("../config/email");


/* =========================================================
   GENERATE QUOTATION NUMBER
========================================================= */

async function generateQuotationNumber(connection) {

    const year =
        new Date().getFullYear();

    const [rows] =
        await connection.query(
            `
            SELECT quotation_number
            FROM quotations
            WHERE quotation_number LIKE ?
            ORDER BY created_at DESC
            LIMIT 1
            `,
            [
                `Q-${year}-%`
            ]
        );

    const lastNumber =
        rows[0]
            ? Number(
                rows[0]
                    .quotation_number
                    .split("-")
                    .pop()
            )
            : 0;

    return (
        `Q-${year}-` +
        String(lastNumber + 1)
            .padStart(4, "0")
    );
}


/* =========================================================
   GENERATE FINAL QUOTATION NUMBER
========================================================= */

async function generateFinalQuotationNumber(connection) {

    const year =
        new Date().getFullYear();

    const [rows] =
        await connection.query(
            `
            SELECT quotation_number
            FROM quotations
            WHERE quotation_number LIKE ?
            ORDER BY created_at DESC
            LIMIT 1
            `,
            [`FQ-${year}-%`]
        );

    const lastNumber =
        rows[0]
            ? Number(rows[0].quotation_number.split("-").pop())
            : 0;

    return (
        `FQ-${year}-` +
        String(lastNumber + 1).padStart(4, "0")
    );
}


/* =========================================================
   QUOTATION SELECT
========================================================= */

const quotationSelect = `
    SELECT
        q.*,

        r.request_code,
        r.customer_name,
        r.customer_phone,
        r.customer_email,
        r.customer_address,

        s.name_en AS service_name,

        u.name AS created_by_name

    FROM quotations q

    INNER JOIN service_requests r
        ON r.id = q.request_id

    INNER JOIN services s
        ON s.id = r.service_id

    INNER JOIN users u
        ON u.id = q.created_by
`;


/* =========================================================
   FILE DETAILS
========================================================= */

function uploadDetails(file) {

    return {

        url:
            file.path,

        name:
            file.originalname

    };

}


/* =========================================================
   CREATE QUOTATION
 *
 * ONE ORIGINAL QUOTATION PER REQUEST
========================================================= */

async function createQuotation(req, res) {

    const connection =
        await pool.getConnection();

    try {

        const body =
            req.body || {};

        const requestId =
            body.request_id ||
            req.query.request_id;

        const notes =
            body.notes ??
            req.query.notes ??
            null;


        if (!requestId) {

            return res.status(400).json({

                success: false,

                message:
                    "Service request is required."

            });

        }


        if (!req.file) {

            return res.status(400).json({

                success: false,

                message:
                    "Upload the quotation PDF first."

            });

        }


        /* ================================================
           CHECK REQUEST
        ================================================= */

        const [requests] =
            await connection.query(
                `
                SELECT
                    id,
                    request_code,
                    customer_name
                FROM service_requests
                WHERE id = ?
                LIMIT 1
                `,
                [
                    requestId
                ]
            );


        if (!requests.length) {

            return res.status(404).json({

                success: false,

                message:
                    "Service request not found."

            });

        }


        /* ================================================
           CHECK EXISTING ORIGINAL QUOTATION
        ================================================= */

        const [existing] =
            await connection.query(
                `
                SELECT
                    id,
                    quotation_number,
                    status
                FROM quotations
                WHERE request_id = ?
                  AND (
                        quotation_type = 'original'
                        OR quotation_type IS NULL
                      )
                LIMIT 1
                `,
                [
                    requestId
                ]
            );


        if (existing.length) {

            return res.status(409).json({

                success: false,

                message:
                    `This request already has quotation ${existing[0].quotation_number}. ` +
                    `Use Edit to replace or update the existing quotation.`,

                data: {

                    quotation_id:
                        existing[0].id,

                    quotation_number:
                        existing[0].quotation_number

                }

            });

        }


        /* ================================================
           UPLOAD
        ================================================= */

        const file =
            uploadDetails(
                req.file
            );


        const id =
            crypto.randomUUID();


        const quotationNumber =
            await generateQuotationNumber(
                connection
            );


        /* ================================================
           INSERT
        ================================================= */

        await connection.query(
            `
            INSERT INTO quotations (

                id,

                quotation_number,

                quotation_type,

                request_id,

                notes,

                status,

                created_by,

                quotation_file_url,

                quotation_file_name

            )

            VALUES (

                ?,
                ?,
                'original',
                ?,
                ?,
                'draft',
                ?,
                ?,
                ?

            )
            `,
            [

                id,

                quotationNumber,

                requestId,

                notes || null,

                req.user.id,

                file.url,

                file.name

            ]
        );


        return res.status(201).json({

            success: true,

            message:
                "Quotation created successfully.",

            data: {

                id,

                quotation_number:
                    quotationNumber,

                quotation_type:
                    "original",

                status:
                    "draft",

                quotation_file_url:
                    file.url,

                quotation_file_name:
                    file.name

            }

        });

    } catch (error) {

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


/* =========================================================
   GET QUOTATION
========================================================= */

async function getQuotationById(
    req,
    res
) {

    try {

        const [rows] =
            await pool.query(
                `
                ${quotationSelect}

                WHERE q.id = ?

                LIMIT 1
                `,
                [
                    req.params.id
                ]
            );


        if (!rows.length) {

            return res.status(404).json({

                success: false,

                message:
                    "Quotation not found."

            });

        }


        return res.json({

            success: true,

            data:
                rows[0]

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


/* =========================================================
   GET ALL QUOTATIONS
========================================================= */

async function getQuotations(
    req,
    res
) {

    try {

        const [rows] =
            await pool.query(
                `
                ${quotationSelect}

                WHERE
                    q.quotation_type = 'original'
                    OR q.quotation_type IS NULL

                ORDER BY
                    q.created_at DESC
                `
            );


        return res.json({

            success: true,

            data:
                rows

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


/* =========================================================
   UPDATE QUOTATION
 *
 * Admin can replace the PDF and/or update notes.
 * The quotation number stays the same.
========================================================= */

async function updateQuotation(
    req,
    res
) {

    const connection =
        await pool.getConnection();

    try {

        const quotationId =
            req.params.id;


        const notes =
            req.body?.notes ??
            null;


        const [rows] =
            await connection.query(
                `
                SELECT
                    id,
                    quotation_number,
                    quotation_type,
                    quotation_file_url,
                    quotation_file_name
                FROM quotations
                WHERE id = ?
                LIMIT 1
                `,
                [
                    quotationId
                ]
            );


        if (!rows.length) {

            return res.status(404).json({

                success: false,

                message:
                    "Quotation not found."

            });

        }


        const quotation =
            rows[0];


        if (
            quotation.quotation_type &&
            quotation.quotation_type !== "original"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Only original quotations can be updated."

            });

        }


        let fileUrl =
            quotation.quotation_file_url;

        let fileName =
            quotation.quotation_file_name;


        if (req.file) {

            const file =
                uploadDetails(
                    req.file
                );

            fileUrl =
                file.url;

            fileName =
                file.name;

        }


        await connection.query(
            `
            UPDATE quotations

            SET

                quotation_file_url = ?,

                quotation_file_name = ?,

                notes = ?,

                updated_at =
                    CURRENT_TIMESTAMP

            WHERE id = ?

            `,
            [

                fileUrl,

                fileName,

                notes,

                quotationId

            ]
        );


        return res.json({

            success: true,

            message:
                "Quotation updated successfully.",

            data: {

                id:
                    quotationId,

                quotation_number:
                    quotation.quotation_number,

                quotation_file_url:
                    fileUrl,

                quotation_file_name:
                    fileName,

                notes

            }

        });

    } catch (error) {

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


/* =========================================================
   DELETE QUOTATION
========================================================= */

async function deleteQuotation(
    req,
    res
) {

    const connection =
        await pool.getConnection();

    try {

        const quotationId =
            req.params.id;


        const [rows] =
            await connection.query(
                `
                SELECT
                    id,
                    quotation_number,
                    quotation_type
                FROM quotations
                WHERE id = ?
                LIMIT 1
                `,
                [
                    quotationId
                ]
            );


        if (!rows.length) {

            return res.status(404).json({

                success: false,

                message:
                    "Quotation not found."

            });

        }


        const quotation =
            rows[0];


        if (
            quotation.quotation_type &&
            quotation.quotation_type !== "original"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Only original quotations can be deleted."

            });

        }


        await connection.query(
            `
            DELETE FROM quotations

            WHERE id = ?

            `,
            [
                quotationId
            ]
        );


        return res.json({

            success: true,

            message:
                `${quotation.quotation_number} deleted successfully.`

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

    } finally {

        connection.release();

    }

}


/* =========================================================
   SEND QUOTATION
========================================================= */

async function sendQuotation(
    req,
    res
) {

    try {

        const [rows] =
            await pool.query(
                `
                SELECT
                    id,
                    quotation_number,
                    status,
                    quotation_file_url
                FROM quotations
                WHERE id = ?
                LIMIT 1
                `,
                [
                    req.params.id
                ]
            );


        if (!rows.length) {

            return res.status(404).json({

                success: false,

                message:
                    "Quotation not found."

            });

        }


        if (!rows[0].quotation_file_url) {

            return res.status(400).json({

                success: false,

                message:
                    "This quotation does not have an uploaded file."

            });

        }


        await pool.query(
            `
            UPDATE quotations

            SET

                status =
                    IF(
                        status = 'draft',
                        'sent',
                        status
                    ),

                sent_at =
                    COALESCE(
                        sent_at,
                        CURRENT_TIMESTAMP
                    )

            WHERE id = ?

            `,
            [
                req.params.id
            ]
        );


        return res.json({

            success: true,

            message:
                "Quotation marked as sent.",

            data: {

                quotation_number:
                    rows[0].quotation_number,

                status:
                    "sent"

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
                "Unable to mark quotation as sent."

        });

    }

}


/* =========================================================
   SEND QUOTATION BY EMAIL
========================================================= */

async function sendQuotationByEmail(
    req,
    res
) {

    try {

        const [rows] =
            await pool.query(
                `
                ${quotationSelect}

                WHERE q.id = ?

                LIMIT 1
                `,
                [
                    req.params.id
                ]
            );


        if (!rows.length) {

            return res.status(404).json({

                success: false,

                message:
                    "Quotation not found."

            });

        }


        const quotation =
            rows[0];


        if (!quotation.customer_email) {

            return res.status(400).json({

                success: false,

                message:
                    "Customer does not have an email address."

            });

        }


        if (!quotation.quotation_file_url) {

            return res.status(400).json({

                success: false,

                message:
                    "This quotation does not have an uploaded file."

            });

        }


        await sendQuotationEmail({

            customerEmail:
                quotation.customer_email,

            customerName:
                quotation.customer_name,

            quotationNumber:
                quotation.quotation_number,

            quotationFileUrl:
                quotation.quotation_file_url,

            quotationFileName:
                quotation.quotation_file_name

        });


        await pool.query(
            `
            UPDATE quotations

            SET

                status =
                    IF(
                        status = 'draft',
                        'sent',
                        status
                    ),

                sent_at =
                    COALESCE(
                        sent_at,
                        CURRENT_TIMESTAMP
                    )

            WHERE id = ?

            `,
            [
                quotation.id
            ]
        );


        return res.json({

            success: true,

            message:
                "Quotation sent by email."

        });

    } catch (error) {

        console.error(
            "Send quotation email error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to send quotation by email."

        });

    }

}


/* =========================================================
   PAYMENT PROOF
========================================================= */

async function uploadPaymentProof(
    req,
    res
) {

    const connection =
        await pool.getConnection();

    try {

        if (!req.file) {

            return res.status(400).json({

                success: false,

                message:
                    "Upload a payment proof image or PDF."

            });

        }


        const file =
            uploadDetails(
                req.file
            );


        await connection.beginTransaction();


        const [quotationRows] =
            await connection.query(
                `
                SELECT
                    id,
                    request_id
                FROM quotations
                WHERE id = ?
                LIMIT 1
                `,
                [
                    req.params.id
                ]
            );


        if (!quotationRows.length) {

            await connection.rollback();

            return res.status(404).json({

                success: false,

                message:
                    "Quotation not found."

            });

        }


        const requestId =
            quotationRows[0].request_id;


        await connection.query(
            `
            UPDATE quotations

            SET

                payment_proof_url = ?,

                payment_proof_name = ?,

                payment_proof_uploaded_at =
                    CURRENT_TIMESTAMP,

                payment_status =
                    'proof_uploaded'

            WHERE id = ?

            `,
            [

                file.url,

                file.name,

                req.params.id

            ]
        );


        /*
         * Payment proof moves an unassigned
         * request into Job Pending.
         */
        await connection.query(
            `
            UPDATE service_requests

            SET

                status = 'pending',

                updated_at = NOW()

            WHERE id = ?

              AND technician_id IS NULL

            `,
            [
                requestId
            ]
        );


        await connection.commit();


        return res.json({

            success: true,

            message:
                "Payment proof uploaded. The job is now ready for technician assignment.",

            data: {

                ...file,

                request_id:
                    requestId

            }

        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "Upload payment proof error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to upload payment proof."

        });

    } finally {

        connection.release();

    }

}


/* =========================================================
   FOLLOW-UP
 *
 * FU1 = 12 hours after quotation sent
 * FU2 = 48 hours after FU1
========================================================= */

async function recordFollowUp(
    req,
    res
) {

    try {

        const followUpNumber =
            Number(
                req.params.number
            );


        if (
            ![1, 2]
                .includes(
                    followUpNumber
                )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid follow-up number."

            });

        }


        const [rows] =
            await pool.query(
                `
                SELECT

                    id,

                    sent_at,

                    follow_up_1_sent_at,

                    follow_up_2_sent_at

                FROM quotations

                WHERE id = ?

                LIMIT 1
                `,
                [
                    req.params.id
                ]
            );


        if (!rows.length) {

            return res.status(404).json({

                success: false,

                message:
                    "Quotation not found."

            });

        }


        const quotation =
            rows[0];


        if (!quotation.sent_at) {

            return res.status(400).json({

                success: false,

                message:
                    "Mark the quotation as sent before sending a follow-up."

            });

        }


        const field =
            followUpNumber === 1
                ? "follow_up_1_sent_at"
                : "follow_up_2_sent_at";


        if (quotation[field]) {

            return res.status(400).json({

                success: false,

                message:
                    `Follow-up ${followUpNumber} has already been recorded.`

            });

        }


        let dueAt;


        if (
            followUpNumber === 1
        ) {

            dueAt =
                new Date(
                    new Date(
                        quotation.sent_at
                    ).getTime()
                    +
                    (
                        12 *
                        60 *
                        60 *
                        1000
                    )
                );

        } else {

            if (
                !quotation.follow_up_1_sent_at
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Follow-up 1 must be sent before Follow-up 2."

                });

            }


            dueAt =
                new Date(
                    new Date(
                        quotation.follow_up_1_sent_at
                    ).getTime()
                    +
                    (
                        48 *
                        60 *
                        60 *
                        1000
                    )
                );

        }


        const now =
            new Date();


        if (
            now < dueAt
        ) {

            const remainingMs =
                dueAt.getTime() -
                now.getTime();


            const remainingHours =
                Math.floor(
                    remainingMs /
                    (
                        1000 *
                        60 *
                        60
                    )
                );


            const remainingMinutes =
                Math.floor(
                    (
                        remainingMs %
                        (
                            1000 *
                            60 *
                            60
                        )
                    ) /
                    (
                        1000 *
                        60
                    )
                );


            return res.status(400).json({

                success: false,

                message:
                    `Follow-up ${followUpNumber} is not available yet. ` +
                    `It will be available on ${dueAt.toLocaleString("en-MY")}. ` +
                    `Time remaining: ${remainingHours} hour(s) ${remainingMinutes} minute(s).`,

                data: {

                    due_at:
                        dueAt.toISOString(),

                    remaining_hours:
                        remainingHours,

                    remaining_minutes:
                        remainingMinutes

                }

            });

        }


        await pool.query(
            `
            UPDATE quotations

            SET
                ${field} =
                    CURRENT_TIMESTAMP

            WHERE id = ?

            `,
            [
                quotation.id
            ]
        );


        return res.json({

            success: true,

            message:
                `Follow-up ${followUpNumber} recorded.`

        });

    } catch (error) {

        console.error(
            "Record follow-up error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to record follow-up."

        });

    }

}


/* =========================================================
   UPLOAD / REPLACE FINAL QUOTATION
 *
 * POST /api/quotations/:requestId/final-quotation
========================================================= */

async function uploadFinalQuotation(req, res) {

    const connection =
        await pool.getConnection();

    try {

        const requestId = req.params.requestId;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Upload the final quotation PDF first."
            });
        }

        const [requests] =
            await connection.query(
                `
                SELECT id, status
                FROM service_requests
                WHERE id = ?
                LIMIT 1
                `,
                [requestId]
            );

        if (!requests.length) {
            return res.status(404).json({
                success: false,
                message: "Service request not found."
            });
        }

        if (requests[0].status !== "completed") {
            return res.status(400).json({
                success: false,
                message: "Final quotation can only be uploaded after the request is completed."
            });
        }

        const file = uploadDetails(req.file);

        const [existing] =
            await connection.query(
                `
                SELECT id, quotation_number
                FROM quotations
                WHERE request_id = ?
                  AND quotation_type = 'final'
                ORDER BY created_at DESC
                LIMIT 1
                `,
                [requestId]
            );

        if (existing.length) {

            await connection.query(
                `
                UPDATE quotations
                SET quotation_file_url = ?,
                    quotation_file_name = ?,
                    status = 'sent',
                    sent_at = COALESCE(sent_at, CURRENT_TIMESTAMP),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                `,
                [file.url, file.name, existing[0].id]
            );

            return res.json({
                success: true,
                message: "Final quotation replaced successfully.",
                data: {
                    id: existing[0].id,
                    quotation_number: existing[0].quotation_number,
                    quotation_type: "final",
                    quotation_file_url: file.url,
                    quotation_file_name: file.name,
                    status: "sent"
                }
            });
        }

        const quotationNumber =
            await generateFinalQuotationNumber(connection);

        const id = crypto.randomUUID();

        await connection.query(
            `
            INSERT INTO quotations (
                id,
                quotation_number,
                quotation_type,
                request_id,
                notes,
                status,
                created_by,
                quotation_file_url,
                quotation_file_name,
                sent_at
            )
            VALUES (?, ?, 'final', ?, NULL, 'sent', ?, ?, ?, CURRENT_TIMESTAMP)
            `,
            [
                id,
                quotationNumber,
                requestId,
                req.user.id,
                file.url,
                file.name
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Final quotation uploaded successfully.",
            data: {
                id,
                quotation_number: quotationNumber,
                quotation_type: "final",
                quotation_file_url: file.url,
                quotation_file_name: file.name,
                status: "sent"
            }
        });

    } catch (error) {

        console.error("Upload final quotation error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to upload final quotation."
        });

    } finally {
        connection.release();
    }

}


/* =========================================================
   GET QUOTATIONS BY REQUEST
 *
 * Useful for Request Details.
========================================================= */

async function getQuotationsByRequest(
    req,
    res
) {

    try {

        const [rows] =
            await pool.query(
                `
                ${quotationSelect}

                WHERE
                    q.request_id = ?

                    AND (
                        q.quotation_type = 'original'
                        OR q.quotation_type IS NULL
                    )

                ORDER BY
                    q.created_at DESC
                `,
                [
                    req.params.requestId
                ]
            );


        return res.json({

            success: true,

            data:
                rows

        });

    } catch (error) {

        console.error(
            "Get quotations by request error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to retrieve quotations."

        });

    }

}


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {

    createQuotation,

    getQuotationById,

    getQuotations,

    getQuotationsByRequest,

    updateQuotation,

    sendQuotation,

    sendQuotationByEmail,

    uploadPaymentProof,

    recordFollowUp,

    uploadFinalQuotation,

    deleteQuotation

};