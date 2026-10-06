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
                    customer_name,
                    service_id,
                    status
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


        const request =
            requests[0];


        /* ================================================
           TROUBLESHOOTING & REPAIR GATE

           This service is technician-first. Admin may only
           create its quotation after the technician's final
           inspection report has been approved.
        ================================================= */

        const [serviceRows] =
            await connection.query(
                `
                SELECT service_code
                FROM services
                WHERE id = ?
                LIMIT 1
                `,
                [request.service_id]
            );


        const serviceCode =
            serviceRows[0]?.service_code ||
            null;


        if (serviceCode === 'troubleshoot_repair') {

            if (request.status !== 'quotation_required') {

                return res.status(400).json({

                    success: false,

                    message:
                        "Troubleshooting & Repair does not require a quotation. After the technician final report is approved, upload the final invoice instead."

                });

            }


            const [approvedReports] =
                await connection.query(
                    `
                    SELECT id
                    FROM service_reports
                    WHERE request_id = ?
                      AND report_type = 'final'
                      AND status = 'approved'
                    ORDER BY reviewed_at DESC, created_at DESC
                    LIMIT 1
                    `,
                    [requestId]
                );


            if (!approvedReports.length) {

                return res.status(400).json({

                    success: false,

                    message:
                        "The technician inspection report must be approved before creating a Troubleshooting & Repair quotation."

                });

            }

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
    `INSERT INTO quotations (
        id,
        quotation_number,
        request_id,
        notes,
        status,
        approval_status,
        approval_remarks,
        approved_by,
        approved_at,
        revision_number,
        revised_at,
        created_by,
        quotation_file_url,
        quotation_file_name
    )
    VALUES (
        ?,
        ?,
        ?,
        ?,
        'draft',
        'pending_approval',
        NULL,
        NULL,
        NULL,
        1,
        NULL,
        ?,
        ?,
        ?
    )`,
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
        "Quotation uploaded successfully and submitted for Super Admin approval.",
    data: {
        id,
        quotation_number: quotationNumber,
        status: "draft",
        approval_status: "pending_approval",
        revision_number: 1
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



async function updateQuotation(req, res) {

    const connection = await pool.getConnection();

    try {

        const quotationId = req.params.id;
        const notes = req.body?.notes ?? null;

        const [rows] = await connection.query(`
            SELECT
                id,
                quotation_number,
                quotation_type,
                quotation_file_url,
                quotation_file_name,
                approval_status,
                revision_number
            FROM quotations
            WHERE id = ?
            LIMIT 1
        `, [quotationId]);

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Quotation not found."
            });
        }

        const quotation = rows[0];

        if (
            quotation.quotation_type &&
            quotation.quotation_type !== "original"
        ) {
            return res.status(400).json({
                success: false,
                message: "Only original quotations can be updated."
            });
        }

        let fileUrl = quotation.quotation_file_url;
        let fileName = quotation.quotation_file_name;
        const replacingPdf = Boolean(req.file);

        let nextRevision =
            Number(quotation.revision_number || 1);

        if (replacingPdf) {

            const file = uploadDetails(req.file);

            fileUrl = file.url;
            fileName = file.name;
            nextRevision += 1;

            await connection.query(`
                UPDATE quotations
                SET
                    quotation_file_url = ?,
                    quotation_file_name = ?,
                    notes = ?,
                    approval_status = 'pending_approval',
                    approval_remarks = NULL,
                    approved_by = NULL,
                    approved_at = NULL,
                    revision_number = ?,
                    revised_at = CURRENT_TIMESTAMP,
                    status = 'draft',
                    sent_at = NULL,
                    follow_up_1_sent_at = NULL,
                    follow_up_2_sent_at = NULL,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [
                fileUrl,
                fileName,
                notes,
                nextRevision,
                quotationId
            ]);

        } else {

            await connection.query(`
                UPDATE quotations
                SET
                    notes = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [notes, quotationId]);

        }

        return res.json({
            success: true,
            message: replacingPdf
                ? "Revised quotation uploaded and submitted for Super Admin approval."
                : "Quotation updated successfully.",
            data: {
                id: quotationId,
                quotation_number: quotation.quotation_number,
                quotation_file_url: fileUrl,
                quotation_file_name: fileName,
                notes,
                approval_status: replacingPdf
                    ? "pending_approval"
                    : quotation.approval_status,
                revision_number: replacingPdf
                    ? nextRevision
                    : quotation.revision_number
            }
        });

    } catch (error) {

        console.error("Update quotation error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update quotation."
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

async function sendQuotation(req, res) {

    try {

        const [rows] =
            await pool.query(
                `
                SELECT
                    id,
                    quotation_number,
                    status,
                    approval_status,
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


        const quotation =
            rows[0];


        if (!quotation.quotation_file_url) {

            return res.status(400).json({

                success: false,

                message:
                    "This quotation does not have an uploaded file."

            });

        }


        /*
         * SUPER ADMIN APPROVAL REQUIRED
         */

        if (
            quotation.approval_status !==
            "approved"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Quotation must be approved by Super Admin before it can be sent."

            });

        }


        await pool.query(
            `
            UPDATE quotations

            SET
                status = 'sent',
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
                    quotation.quotation_number,

                status:
                    "sent",

                approval_status:
                    "approved"

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
if (
    quotation.approval_status !==
    "approved"
) {

    return res.status(403).json({

        success: false,

        message:
            "Quotation must be approved by Super Admin before it can be sent by email."

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
    request_id,
    approval_status
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

        if (
    quotationRows[0].approval_status !==
    "approved"
) {

    await connection.rollback();

    return res.status(403).json({

        success: false,

        message:
            "Payment proof can only be uploaded after Super Admin approves the quotation."

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
         * Payment proof completes the quotation/payment gate.
         *
         * Troubleshooting & Repair is different from normal services:
         * the technician was assigned earlier for the inspection. After
         * the customer pays, keep that assignment and return the request
         * to `assigned` so the technician can continue the actual repair.
         * Do NOT move it directly to `in_progress`; the technician still
         * has to explicitly start the job.
         *
         * Normal services keep the existing behaviour: an unassigned
         * request becomes Job Pending (`pending`).
         */
        await connection.query(
            `
            UPDATE service_requests sr
            INNER JOIN services s ON s.id = sr.service_id
            SET
                sr.status = CASE
                    WHEN s.service_code = 'troubleshoot_repair'
                         AND sr.technician_id IS NOT NULL
                    THEN 'assigned'
                    WHEN sr.technician_id IS NULL
                    THEN 'pending'
                    ELSE sr.status
                END,
                sr.updated_at = NOW()
            WHERE sr.id = ?
            `,
            [requestId]
        );


        await connection.commit();


        return res.json({

            success: true,

            message:
                "Payment proof uploaded successfully. The job can now continue.",

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