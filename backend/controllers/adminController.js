const pool = require("../config/db");
const crypto = require("crypto");


/*
 * ======================================================
 * GET ALL SERVICE REQUESTS
 * ======================================================
 */

async function getRequests(req, res) {

    try {

        const {
            status,
            service,
            search
        } = req.query;


        let sql = `
            SELECT
                sr.id,
                sr.request_code,
                sr.customer_name,
                sr.customer_phone,
                sr.customer_email,
                sr.customer_address,
                sr.admin_notes,
                sr.status,
                sr.technician_id,

                sr.scheduled_date,
                sr.scheduled_time,
                sr.assigned_at,

                sr.created_at,
                sr.updated_at,

                s.service_code,
                s.name_en AS service_name_en,
                s.name_ms AS service_name_ms,

                u.name AS technician_name

            FROM service_requests sr

            INNER JOIN services s
                ON sr.service_id = s.id

            LEFT JOIN users u
                ON sr.technician_id = u.id
        `;


        const conditions = [];
        const params = [];


        if (status) {

            conditions.push(
                "sr.status = ?"
            );

            params.push(status);

        }


        if (service) {

            conditions.push(
                "s.service_code = ?"
            );

            params.push(service);

        }


        if (search) {

            conditions.push(`
                (
                    sr.request_code LIKE ?
                    OR sr.customer_name LIKE ?
                    OR sr.customer_phone LIKE ?
                    OR sr.customer_email LIKE ?
                )
            `);

            const searchValue =
                `%${search}%`;

            params.push(
                searchValue,
                searchValue,
                searchValue,
                searchValue
            );

        }


        if (conditions.length > 0) {

            sql +=
                " WHERE " +
                conditions.join(" AND ");

        }


        sql += `
            ORDER BY
                sr.scheduled_date IS NULL ASC,
                sr.scheduled_date ASC,
                sr.scheduled_time ASC,
                sr.created_at DESC
        `;


        const [requests] =
            await pool.query(
                sql,
                params
            );


        return res.json({

            success: true,

            data:
                requests.map(
                    request => ({

                        id:
                            request.id,

                        request_code:
                            request.request_code,

                        service: {

                            code:
                                request.service_code,

                            name: {

                                en:
                                    request.service_name_en,

                                ms:
                                    request.service_name_ms

                            }

                        },

                        customer: {

                            name:
                                request.customer_name,

                            phone:
                                request.customer_phone,

                            email:
                                request.customer_email,

                            address:
                                request.customer_address

                        },

                        status:
                            request.status,

                        admin_notes:
                            request.admin_notes,

                        technician:
                            request.technician_id
                                ? {

                                    id:
                                        request.technician_id,

                                    name:
                                        request.technician_name

                                }
                                : null,

                        schedule: {

                            date:
                                request.scheduled_date,

                            time:
                                request.scheduled_time

                        },

                        assigned_at:
                            request.assigned_at,

                        created_at:
                            request.created_at,

                        updated_at:
                            request.updated_at

                    })
                )

        });

    } catch (error) {

        console.error(
            "Get admin requests error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to retrieve service requests."

        });

    }

}


// ======================================================
// GET JOB PENDING REQUESTS
// ======================================================

async function getJobPendingRequests(req, res) {

    try {

        const [requests] =
            await pool.query(
                `
                SELECT

                    sr.id,
                    sr.request_code,
                    sr.customer_name,
                    sr.customer_phone,
                    sr.customer_email,
                    sr.status,
                    sr.technician_id,
                    sr.created_at,
                    sr.updated_at,
                    sr.scheduled_date,
                    sr.scheduled_time,

                    u.name AS technician_name,

                    s.service_code,
                    s.name_en AS service_name_en,
                    s.name_ms AS service_name_ms,

                    q.payment_proof_uploaded_at

                FROM service_requests sr

                INNER JOIN services s
                    ON s.id = sr.service_id

                LEFT JOIN users u
                    ON u.id = sr.technician_id

                LEFT JOIN quotations q
                    ON q.request_id = sr.id

                WHERE

                    /*
                     * Only active jobs remain in Job Pending.
                     */
                    sr.status NOT IN (
                        'completed',
                        'cancelled'
                    )

                    /*
                     * Troubleshooting & Repair enters Job Pending
                     * before any quotation/payment exists.
                     * Other services keep the existing payment-proof gate.
                     */
                    AND (
                        s.service_code = 'troubleshoot_repair'
                        OR (
                            q.payment_status = 'proof_uploaded'
                            AND q.payment_proof_url IS NOT NULL
                            AND TRIM(q.payment_proof_url) <> ''
                        )
                    )

                ORDER BY

                    CASE sr.status

                        WHEN 'pending'
                            THEN 1

                        WHEN 'assigned'
                            THEN 2

                        WHEN 'in_progress'
                            THEN 3

                        WHEN 'waiting_parts'
                            THEN 4

                        WHEN 'quotation_required'
                            THEN 5

                        WHEN 'awaiting_payment'
                            THEN 6

                        ELSE 7

                    END ASC,

                    q.payment_proof_uploaded_at DESC,

                    sr.created_at DESC
                `
            );


        return res.json({

            success: true,

            data:
                requests.map(
                    request => ({

                        id:
                            request.id,

                        request_code:
                            request.request_code,


                        customer: {

                            name:
                                request.customer_name,

                            phone:
                                request.customer_phone,

                            email:
                                request.customer_email

                        },


                        service: {

                            code:
                                request.service_code ||
                                null,

                            name:
                                request.service_name_en ||
                                request.service_name_ms ||
                                "Service"

                        },


                        status:
                            request.status,


                        technician:
                            request.technician_id
                                ? {

                                    id:
                                        request.technician_id,

                                    name:
                                        request.technician_name

                                }
                                : null,


                        scheduled_date:
                            request.scheduled_date,


                        scheduled_time:
                            request.scheduled_time,


                        payment_proof_uploaded_at:
                            request.payment_proof_uploaded_at,


                        created_at:
                            request.created_at,


                        updated_at:
                            request.updated_at

                    })
                )

        });

    } catch (error) {

        console.error(
            "Get job pending requests error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to retrieve job pending requests."

        });

    }

}

/*
 * ======================================================
 * GET REQUEST DETAILS
 *
 * GET /api/admin/requests/:id
 * ======================================================
 */

async function getRequestById(req, res) {

    try {

        const {
            id
        } = req.params;


        /* ==================================================
           REQUEST
        ================================================== */

        const [requests] =
            await pool.query(
                `
                SELECT
                    sr.*,

                    s.service_code,
                    s.name_en AS service_name_en,
                    s.name_ms AS service_name_ms

                FROM service_requests sr

                INNER JOIN services s
                    ON sr.service_id = s.id

                WHERE sr.id = ?

                LIMIT 1
                `,
                [id]
            );


        if (requests.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "Service request not found."

            });

        }


        const request =
            requests[0];


        /* ==================================================
           ANSWERS
        ================================================== */

        const [answers] =
            await pool.query(
                `
                SELECT

                    ra.id,
                    ra.question_id,

                    ra.text_value,
                    ra.number_value,
                    ra.unit,

                    sq.question_code,
                    sq.title_en,
                    sq.title_ms,

                    sq.description_en,
                    sq.description_ms,

                    sq.question_type

                FROM request_answers ra

                INNER JOIN service_questions sq
                    ON ra.question_id = sq.id

                WHERE ra.request_id = ?

                ORDER BY ra.id ASC
                `,
                [id]
            );


        const [selectedOptions] =
            await pool.query(
                `
                SELECT

                    sao.answer_id,
                    sao.option_id,

                    qo.option_value,
                    qo.label_en,
                    qo.label_ms

                FROM request_answer_options sao

                INNER JOIN question_options qo
                    ON sao.option_id = qo.id

                INNER JOIN request_answers ra
                    ON sao.answer_id = ra.id

                WHERE ra.request_id = ?

                ORDER BY sao.answer_id ASC
                `,
                [id]
            );


        /* ==================================================
           CUSTOMER PHOTOS
        ================================================== */

        const [photos] =
            await pool.query(
                `
                SELECT

                    id,
                    request_id,
                    file_name,
                    file_path,
                    uploaded_at

                FROM customer_photos

                WHERE request_id = ?

                ORDER BY uploaded_at ASC
                `,
                [id]
            );


        /* ==================================================
           LATEST FINAL TECHNICIAN REPORT
        ================================================== */

        const [reports] =
            await pool.query(
                `
                SELECT

                    sr.id,
                    sr.request_id,
                    sr.technician_id,

                    sr.report_type,
                    sr.progress_number,
                    sr.report_title,

                    sr.work_performed,
                    sr.findings,
                    sr.materials_used,
                    sr.technician_notes,

                    sr.reported_by,

                    sr.report_file_path,

                    sr.status,

                    sr.submitted_at,
                    sr.reviewed_at,
                    sr.reviewed_by,

                    sr.review_remarks,

                    sr.created_at,
                    sr.updated_at

                FROM service_reports sr

                WHERE sr.request_id = ?

                  AND sr.report_type = 'final'

                ORDER BY
                    sr.created_at DESC

                LIMIT 1
                `,
                [id]
            );


        const report =
            reports.length > 0
                ? reports[0]
                : null;


        /* ==================================================
           COMPLETION MEDIA
        ================================================== */

        let completionMedia = [];


        if (report) {

            const [media] =
                await pool.query(
                    `
                    SELECT

                        id,
                        report_id,
                        request_id,
                        technician_id,

                        media_type,

                        file_name,
                        file_path,

                        mime_type,
                        file_size,

                        uploaded_at

                    FROM service_report_media

                    WHERE report_id = ?

                      AND request_id = ?

                    ORDER BY uploaded_at ASC
                    `,
                    [
                        report.id,
                        id
                    ]
                );


            completionMedia =
                media;

        }


        /* ==================================================
           SERVICE REPORT TIMELINE
        ================================================== */

        const [progressReports] =
            await pool.query(
                `
                SELECT

                    sr.id,
                    sr.request_id,
                    sr.technician_id,

                    sr.reported_by,

                    sr.report_type,
                    sr.progress_number,
                    sr.report_title,

                    sr.work_performed,
                    sr.findings,
                    sr.materials_used,
                    sr.technician_notes,

                    sr.status,

                    sr.submitted_at,
                    sr.reviewed_at,
                    sr.reviewed_by,
                    sr.review_remarks,

                    sr.created_at,
                    sr.updated_at

                FROM service_reports sr

                WHERE sr.request_id = ?

                ORDER BY
                    sr.created_at ASC
                `,
                [id]
            );


        const progressReportIds =
            progressReports.map(
                report => report.id
            );


        let progressMedia = [];


        if (
            progressReportIds.length
        ) {

            const placeholders =
                progressReportIds
                    .map(() => "?")
                    .join(",");


            const [mediaRows] =
                await pool.query(
                    `
                    SELECT

                        id,
                        report_id,
                        request_id,
                        technician_id,

                        media_type,

                        file_name,
                        file_path,

                        mime_type,
                        file_size,

                        uploaded_at

                    FROM service_report_media

                    WHERE report_id IN (${placeholders})

                    ORDER BY uploaded_at ASC
                    `,
                    progressReportIds
                );


            progressMedia =
                mediaRows;

        }


        const progressMediaMap =
            new Map();


        progressReports.forEach(
            report => {

                progressMediaMap.set(
                    report.id,
                    []
                );

            }
        );


        progressMedia.forEach(
            media => {

                const items =
                    progressMediaMap.get(
                        media.report_id
                    );


                if (items) {

                    items.push(
                        media
                    );

                }

            }
        );


        progressReports.forEach(
            report => {

                report.media =
                    progressMediaMap.get(
                        report.id
                    ) || [];

            }
        );


        /* ==================================================
           TECHNICIAN
        ================================================== */

        let technician = null;


        if (
            request.technician_id
        ) {

            const [technicians] =
                await pool.query(
                    `
                    SELECT

                        id,
                        name,
                        email,
                        status

                    FROM users

                    WHERE id = ?

                      AND role = 'technician'

                    LIMIT 1
                    `,
                    [
                        request.technician_id
                    ]
                );


            if (
                technicians.length > 0
            ) {

                technician =
                    technicians[0];

            }

        }


        /* ==================================================
           QUOTATIONS
        ================================================== */

        const [quotations] =
            await pool.query(
                `
                SELECT

                    id,
                    quotation_number,
                    quotation_type,

                    subtotal,
                    discount,
                    tax,
                    delivery_charge,
                    total,

                    validity_days,

                    notes,
                    terms,

                    quotation_file_url,
                    quotation_file_name,

                    payment_status,
                    payment_proof_url,
                    payment_proof_name,
                    payment_proof_uploaded_at,

                    status,
                    sent_at,

                    follow_up_1_sent_at,
                    follow_up_2_sent_at,

                    created_at,
                    updated_at

                FROM quotations

                WHERE request_id = ?

                ORDER BY
                    created_at DESC
                `,
                [id]
            );


        const originalQuotation =
            quotations.find(
                quotation =>
                    quotation.quotation_type ===
                    "original"
            ) || null;


        const finalQuotation =
            quotations.find(
                quotation =>
                    quotation.quotation_type ===
                    "final"
            ) || null;


        /* ==================================================
           FINAL INVOICES + PAYMENT PROOFS
        ================================================== */

        const [invoices] =
            await pool.query(
                `
                SELECT

                    i.*,

                    u.name AS created_by_name

                FROM invoices i

                LEFT JOIN users u
                    ON u.id = i.created_by

                WHERE i.request_id = ?

                ORDER BY
                    i.created_at DESC
                `,
                [id]
            );


        for (
            const invoice of invoices
        ) {

            const [payments] =
                await pool.query(
                    `
                    SELECT

                        ip.*,

                        u.name AS verified_by_name

                    FROM invoice_payments ip

                    LEFT JOIN users u
                        ON u.id = ip.verified_by

                    WHERE ip.invoice_id = ?

                    ORDER BY ip.submitted_at DESC
                    `,
                    [
                        invoice.id
                    ]
                );


            invoice.payments =
                payments;

        }


        /* ==================================================
           RESPONSE
        ================================================== */

        return res.json({

            success: true,

            data: {

                id:
                    request.id,

                request_code:
                    request.request_code,


                service: {

                    id:
                        request.service_id,

                    code:
                        request.service_code,

                    name: {

                        en:
                            request.service_name_en,

                        ms:
                            request.service_name_ms

                    }

                },


                customer: {

                    name:
                        request.customer_name,

                    phone:
                        request.customer_phone,

                    email:
                        request.customer_email,

                    address:
                        request.customer_address,

                    notes:
                        request.customer_notes

                },


                status:
                    request.status,


                technician:
                    technician,


                schedule: {

                    date:
                        request.scheduled_date,

                    time:
                        request.scheduled_time

                },


                assigned_at:
                    request.assigned_at,


                admin_notes:
                    request.admin_notes,


                admin_notes_updated_at:
                    request.admin_notes_updated_at,


                quotations: {

                    original:
                        originalQuotation,

                    final:
                        finalQuotation

                },


                invoices:
                    invoices,


                answers:
                    answers.map(
                        answer => ({

                            id:
                                answer.id,

                            question_id:
                                answer.question_id,

                            question_code:
                                answer.question_code,

                            question: {

                                en:
                                    answer.title_en,

                                ms:
                                    answer.title_ms

                            },

                            description: {

                                en:
                                    answer.description_en,

                                ms:
                                    answer.description_ms

                            },

                            type:
                                answer.question_type,

                            text_value:
                                answer.text_value,

                            number_value:
                                answer.number_value,

                            unit:
                                answer.unit,

                            options:
                                selectedOptions.filter(
                                    option =>
                                        option.answer_id ===
                                        answer.id
                                )

                        })
                    ),


                photos:
                    photos,


                report:
                    report,


                progress_reports:
                    progressReports,


                completion_media:
                    completionMedia,


                created_at:
                    request.created_at,

                updated_at:
                    request.updated_at,

                completed_at:
                    request.completed_at

            }

        });

    } catch (error) {

        console.error(
            "Get request details error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to retrieve request details."

        });

    }

}


/*
 * ======================================================
 * GET DASHBOARD SUMMARY
 * ======================================================
 */

async function getDashboardSummary(req, res) {

    try {

        const [rows] =
            await pool.query(
                `
                SELECT

                    COUNT(*) AS total,

                    SUM(
                        status = 'pending'
                    ) AS pending,

                    SUM(
                        status = 'assigned'
                    ) AS assigned,

                    SUM(
                        status = 'in_progress'
                    ) AS in_progress,

                    SUM(
                        status = 'waiting_parts'
                    ) AS waiting_parts,

                    SUM(
                        status = 'awaiting_payment'
                    ) AS awaiting_payment,

                    SUM(
                        status = 'completed'
                    ) AS completed,

                    SUM(
                        status = 'cancelled'
                    ) AS cancelled

                FROM service_requests
                `
            );


        return res.json({

            success: true,

            data:
                rows[0]

        });

    } catch (error) {

        console.error(
            "Dashboard summary error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to retrieve dashboard summary."

        });

    }

}


/*
 * ======================================================
 * GET ACTIVE TECHNICIANS
 * ======================================================
 */

async function getTechnicians(req, res) {

    try {

        const [technicians] =
            await pool.query(
                `
                SELECT

                    id,
                    name,
                    email,
                    status

                FROM users

                WHERE
                    role = 'technician'

                    AND status = 'active'

                ORDER BY
                    name ASC
                `
            );


        return res.json({

            success: true,

            data:
                technicians

        });

    } catch (error) {

        console.error(
            "Get technicians error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to retrieve technicians."

        });

    }

}


/*
 * ======================================================
 * UPDATE SERVICE REQUEST
 *
 * PUT /api/admin/requests/:id
 *
 * IMPORTANT:
 *
 * completed is ONLY allowed after payment verification.
 * ======================================================
 */

async function updateRequest(req, res) {

    const connection =
        await pool.getConnection();


    try {

        const requestId =
            req.params.id;


        const {
            status,
            technician_id,
            scheduled_date,
            scheduled_time,
            admin_notes
        } = req.body;


        const [requests] =
            await connection.query(
                `
                SELECT

                    id,
                    service_id,
                    status,
                    technician_id,
                    scheduled_date,
                    scheduled_time,
                    admin_notes

                FROM service_requests

                WHERE id = ?

                LIMIT 1
                `,
                [
                    requestId
                ]
            );


        if (
            requests.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Service request not found."

            });

        }


        const request =
            requests[0];


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


        const allowedStatuses = [

            "pending",

            "assigned",

            "in_progress",

            "waiting_parts",

            "awaiting_payment",

            "quotation_required",

            "completed",

            "cancelled"

        ];


        if (
            status &&
            !allowedStatuses.includes(status)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid request status."

            });

        }


      if (technician_id) {

    /*
     * Troubleshooting & Repair is technician-first.
     * It does NOT require a quotation/payment proof before
     * the initial site inspection. All other services keep
     * the existing payment-proof requirement.
     */

    if (serviceCode !== 'troubleshoot_repair') {

        const [paymentProofRows] =
            await connection.query(
                `
                SELECT
                    id,
                    payment_proof_url,
                    payment_status,
                    payment_proof_uploaded_at

                FROM quotations

                WHERE
                    request_id = ?

                    AND payment_proof_url IS NOT NULL

                    AND TRIM(payment_proof_url) <> ''

                    AND payment_status = 'proof_uploaded'

                ORDER BY
                    payment_proof_uploaded_at DESC

                LIMIT 1
                `,
                [requestId]
            );


        if (!paymentProofRows.length) {

            return res.status(400).json({

                success: false,

                message:
                    "Technician cannot be assigned yet. Please upload the customer's quotation payment proof first."

            });

        }

    }


    /*
     * =====================================================
     * TECHNICIAN VALIDATION
     * =====================================================
     */

    const [technicians] =
        await connection.query(
            `
            SELECT
                id,
                name,
                email

            FROM users

            WHERE
                id = ?

                AND role = 'technician'

                AND status = 'active'

            LIMIT 1
            `,
            [
                technician_id
            ]
        );


    if (
        technicians.length === 0
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Selected technician is not valid or inactive."

        });

    }

}

        let finalStatus =
            status !== undefined &&
            status !== null &&
            status !== ""
                ? status
                : request.status;


        const finalTechnician =
            technician_id !== undefined
                ? (
                    technician_id ||
                    null
                )
                : request.technician_id;


        /* ==================================================
           COMPLETED PROTECTION
        ================================================== */

        if (
            finalStatus === "completed"
        ) {

            const [paidInvoices] =
                await connection.query(
                    `
                    SELECT
                        id

                    FROM invoices

                    WHERE request_id = ?

                      AND status = 'paid'

                    LIMIT 1
                    `,
                    [
                        requestId
                    ]
                );


            if (
                !paidInvoices.length
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "This service request cannot be marked completed until the final invoice payment is verified."

                });

            }

        }


        const finalScheduledDate =
            scheduled_date !== undefined
                ? (
                    scheduled_date ||
                    null
                )
                : request.scheduled_date;


        const finalScheduledTime =
            scheduled_time !== undefined
                ? (
                    scheduled_time ||
                    null
                )
                : request.scheduled_time;


        const finalAdminNotes =
            admin_notes !== undefined
                ? (
                    admin_notes ||
                    null
                )
                : request.admin_notes;


        if (
            finalTechnician &&
            !finalScheduledDate
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Scheduled date is required when assigning a technician."

            });

        }


        await connection.beginTransaction();


        await connection.query(
            `
            UPDATE service_requests

            SET

                status = ?,

                technician_id = ?,

                scheduled_date = ?,

                scheduled_time = ?,

                assigned_at =
                    CASE

                        WHEN ? IS NOT NULL

                        THEN
                            COALESCE(
                                assigned_at,
                                NOW()
                            )

                        ELSE
                            assigned_at

                    END,

                admin_notes = ?,

                admin_notes_updated_at =
                    CASE

                        WHEN ? IS NOT NULL

                        THEN
                            NOW()

                        ELSE
                            admin_notes_updated_at

                    END,

                admin_notes_updated_by =
                    CASE

                        WHEN ? IS NOT NULL
                        THEN ?

                        ELSE
                            admin_notes_updated_by

                    END,

                updated_at = NOW()

            WHERE id = ?
            `,
            [

                finalStatus,

                finalTechnician,

                finalScheduledDate,

                finalScheduledTime,

                finalTechnician,

                finalAdminNotes,

                admin_notes !== undefined
                    ? finalAdminNotes
                    : null,

                admin_notes !== undefined
                    ? finalAdminNotes
                    : null,

                req.user.id,

                requestId

            ]
        );


        if (
            request.status !==
            finalStatus
        ) {

            await connection.query(
                `
                INSERT INTO request_status_history
                (
                    id,
                    request_id,
                    old_status,
                    new_status,
                    changed_by,
                    remarks
                )

                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [

                    crypto.randomUUID(),

                    requestId,

                    request.status,

                    finalStatus,

                    req.user.id,

                    finalAdminNotes ||
                    "Request updated by administrator."

                ]
            );

        }


        await connection.commit();


        const [updatedRequests] =
            await connection.query(
                `
                SELECT

                    sr.*,

                    u.id AS technician_user_id,

                    u.name AS technician_name,

                    u.email AS technician_email

                FROM service_requests sr

                LEFT JOIN users u
                    ON sr.technician_id = u.id

                WHERE sr.id = ?

                LIMIT 1
                `,
                [
                    requestId
                ]
            );


        const updated =
            updatedRequests[0];


        return res.json({

            success: true,

            message:
                "Service request updated successfully.",

            data: {

                id:
                    updated.id,

                request_code:
                    updated.request_code,

                status:
                    updated.status,

                technician:
                    updated.technician_user_id
                        ? {

                            id:
                                updated.technician_user_id,

                            name:
                                updated.technician_name,

                            email:
                                updated.technician_email

                        }
                        : null,

                scheduled_date:
                    updated.scheduled_date,

                scheduled_time:
                    updated.scheduled_time,

                admin_notes:
                    updated.admin_notes,

                updated_at:
                    updated.updated_at

            }

        });


    } catch (error) {

        try {

            await connection.rollback();

        } catch (
            rollbackError
        ) {

            console.error(
                "Rollback error:",
                rollbackError
            );

        }


        console.error(
            "Update request error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to update service request."

        });

    } finally {

        connection.release();

    }

}


/*
 * ======================================================
 * REVIEW TECHNICIAN FINAL WORK REPORT
 *
 * POST /api/admin/requests/:id/review-report
 *
 * APPROVE:
 *
 * report = approved
 * request = awaiting_payment
 *
 * REJECT:
 *
 * report = rejected
 * request = in_progress
 *
 * This allows technician to revise and resubmit.
 * ======================================================
 */

async function reviewTechnicianReport(req, res) {

    const connection =
        await pool.getConnection();


    try {

        const requestId =
            req.params.id;


        const adminId =
            req.user.id;


        const action =
            String(
                req.body.action ||
                ""
            )
            .trim()
            .toLowerCase();


        const reason =
            String(
                req.body.reason ||
                ""
            )
            .trim();


        /* ==================================================
           VALIDATE ACTION
        ================================================== */

        if (
            action !== "approve" &&
            action !== "reject"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Action must be either approve or reject."

            });

        }


        /* ==================================================
           REJECTION REASON REQUIRED
        ================================================== */

        if (
            action === "reject" &&
            !reason
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "A rejection reason is required."

            });

        }


        /* ==================================================
           GET REQUEST
        ================================================== */

        const [requests] =
            await connection.query(
                `
                SELECT

                    id,
                    service_id,
                    status,
                    technician_id

                FROM service_requests

                WHERE id = ?

                LIMIT 1
                `,
                [
                    requestId
                ]
            );


        if (
            !requests.length
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Service request not found."

            });

        }


        const request =
            requests[0];


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


        /* ==================================================
           REQUEST MUST HAVE TECHNICIAN
        ================================================== */

        if (
            !request.technician_id
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "This request has no assigned technician."

            });

        }


        /* ==================================================
           GET LATEST FINAL REPORT ONLY
        ================================================== */

        const [reports] =
            await connection.query(
                `
                SELECT

                    id,

                    request_id,

                    technician_id,

                    report_type,

                    status,

                    work_performed,

                    findings,

                    materials_used,

                    technician_notes,

                    reported_by,

                    submitted_at

                FROM service_reports

                WHERE request_id = ?

                  AND technician_id = ?

                  AND report_type = 'final'

                ORDER BY
                    created_at DESC

                LIMIT 1
                `,
                [
                    requestId,
                    request.technician_id
                ]
            );


        if (
            !reports.length
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "No final technician work report was found."

            });

        }


        const report =
            reports[0];


        /* ==================================================
           ONLY SUBMITTED REPORTS CAN BE REVIEWED
        ================================================== */

        if (
            report.status !==
            "submitted"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    `This final technician report cannot be reviewed because its current status is "${report.status}".`

            });

        }


        /* ==================================================
           START TRANSACTION
        ================================================== */

        await connection.beginTransaction();


        /* ==================================================
           APPROVE FINAL REPORT
        ================================================== */

        if (
            action === "approve"
        ) {

            /* ----------------------------------------------
               APPROVE REPORT
            ---------------------------------------------- */

            await connection.query(
                `
                UPDATE service_reports

                SET

                    status =
                        'approved',

                    reviewed_at =
                        NOW(),

                    reviewed_by =
                        ?,

                    review_remarks =
                        NULL

                WHERE id = ?

                  AND request_id = ?

                  AND report_type = 'final'
                `,
                [
                    adminId,

                    report.id,

                    requestId
                ]
            );


            /* ----------------------------------------------
               MOVE REQUEST TO THE NEXT WORKFLOW STAGE
            ---------------------------------------------- */

            /*
             * Troubleshooting & Repair skips quotation completely.
             * Once Admin approves the technician's final inspection
             * report, the request goes directly to the final invoice
             * stage.
             */
            const nextStatus = 'awaiting_payment';

            const statusRemark =
                serviceCode === 'troubleshoot_repair'
                    ? 'Technician inspection report approved. Troubleshooting & Repair skips quotation and is ready for final invoice.'
                    : 'Technician final report approved. Awaiting final payment.';

            await connection.query(
                `
                UPDATE service_requests

                SET

                    status = ?,

                    completed_at =
                        NULL,

                    updated_at =
                        NOW()

                WHERE id = ?
                `,
                [
                    nextStatus,
                    requestId
                ]
            );


            /* ----------------------------------------------
               STATUS HISTORY
            ---------------------------------------------- */

            await connection.query(
                `
                INSERT INTO request_status_history
                (
                    id,
                    request_id,
                    old_status,
                    new_status,
                    changed_by,
                    remarks
                )

                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [

                    crypto.randomUUID(),

                    requestId,

                    request.status,

                    nextStatus,

                    adminId,

                    statusRemark

                ]
            );


            await connection.commit();


            return res.json({

                success: true,

                message:
                    serviceCode === 'troubleshoot_repair'
                        ? "Technician inspection report approved successfully. Troubleshooting & Repair skips quotation and is now ready for final invoice upload."
                        : "Technician final report approved successfully. The service request is now awaiting payment.",

                data: {

                    request_id:
                        requestId,

                    report_id:
                        report.id,

                    report_status:
                        "approved",

                    request_status:
                        nextStatus

                }

            });

        }


        /* ==================================================
           REJECT FINAL REPORT
        ================================================== */

        await connection.query(
            `
            UPDATE service_reports

            SET

                status =
                    'rejected',

                reviewed_at =
                    NOW(),

                reviewed_by =
                    ?,

                review_remarks =
                    ?

            WHERE id = ?

              AND request_id = ?

              AND report_type = 'final'
            `,
            [
                adminId,

                reason,

                report.id,

                requestId
            ]
        );


        /* ==================================================
           RETURN REQUEST TO IN PROGRESS
           
           IMPORTANT:
           
           DO NOT USE "pending" HERE.
           
           Technician resubmission requires the request
           to remain in_progress.
        ================================================== */

        await connection.query(
            `
            UPDATE service_requests

            SET

                status =
                    'in_progress',

                completed_at =
                    NULL,

                updated_at =
                    NOW()

            WHERE id = ?
            `,
            [
                requestId
            ]
        );


        /* ==================================================
           STATUS HISTORY
        ================================================== */

        await connection.query(
            `
            INSERT INTO request_status_history
            (
                id,
                request_id,
                old_status,
                new_status,
                changed_by,
                remarks
            )

            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [

                crypto.randomUUID(),

                requestId,

                request.status,

                "in_progress",

                adminId,

                `Technician final report rejected. Reason: ${reason}`

            ]
        );


        await connection.commit();


        return res.json({

            success: true,

            message:
                "Technician final report rejected. The technician can revise and resubmit the report.",

            data: {

                request_id:
                    requestId,

                report_id:
                    report.id,

                report_status:
                    "rejected",

                request_status:
                    "in_progress",

                review_remarks:
                    reason

            }

        });


    } catch (error) {

        try {

            await connection.rollback();

        } catch (
            rollbackError
        ) {

            console.error(
                "Rollback error:",
                rollbackError
            );

        }


        console.error(
            "Review technician report error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to review technician report."

        });

    } finally {

        connection.release();

    }

}


/*
 * ======================================================
 * EXPORTS
 * ======================================================
 */

module.exports = {

    getJobPendingRequests,

    getRequests,

    getRequestById,

    getDashboardSummary,

    getTechnicians,

    updateRequest,

    reviewTechnicianReport

};