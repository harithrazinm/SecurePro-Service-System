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


/*
 * ======================================================
 * GET JOB PENDING REQUESTS
 *
 * JOB PENDING means:
 *
 * - Payment proof uploaded
 * - Job is not completed
 * - Job is not cancelled
 * - Technician report is NOT approved
 *
 * Therefore:
 *
 * NEW JOB
 * ASSIGNED JOB
 * IN PROGRESS
 * WAITING PARTS
 * REPORT SUBMITTED
 * REPORT REJECTED
 *
 * all remain in Job Pending.
 *
 * Once admin approves the technician report:
 *
 * service_report.status = approved
 * service_request.status = completed
 *
 * and the job disappears from Job Pending.
 * ======================================================
 */

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

                    sr.scheduled_date,

                    sr.scheduled_time,

                    u.name AS technician_name,

                    s.name_en AS service_name_en,

                    s.name_ms AS service_name_ms,

                    (
                        SELECT
                            MAX(q2.payment_proof_uploaded_at)

                        FROM quotations q2

                        WHERE
                            q2.request_id = sr.id

                            AND q2.payment_status =
                                'proof_uploaded'

                            AND q2.payment_proof_url IS NOT NULL

                    ) AS payment_proof_uploaded_at,


                    (
                        SELECT
                            r2.status

                        FROM service_reports r2

                        WHERE
                            r2.request_id = sr.id

                        ORDER BY
                            r2.created_at DESC

                        LIMIT 1

                    ) AS latest_report_status,


                    (
                        SELECT
                            r2.submitted_at

                        FROM service_reports r2

                        WHERE
                            r2.request_id = sr.id

                        ORDER BY
                            r2.created_at DESC

                        LIMIT 1

                    ) AS latest_report_submitted_at


                FROM service_requests sr


                INNER JOIN services s
                    ON s.id = sr.service_id


                LEFT JOIN users u
                    ON u.id = sr.technician_id


                WHERE

                    /*
                     * Job must have payment proof.
                     */

                    EXISTS (

                        SELECT 1

                        FROM quotations q

                        WHERE
                            q.request_id = sr.id

                            AND q.payment_status =
                                'proof_uploaded'

                            AND q.payment_proof_url IS NOT NULL

                    )


                    /*
                     * Completed jobs are no longer pending.
                     */

                    AND sr.status != 'completed'


                    /*
                     * Cancelled jobs are no longer pending.
                     */

                    AND sr.status != 'cancelled'


                    /*
                     * If a report exists,
                     * it must NOT be approved.
                     *
                     * No report:
                     *     still pending
                     *
                     * Submitted:
                     *     still pending
                     *
                     * Rejected:
                     *     still pending
                     *
                     * Approved:
                     *     disappears
                     */

                    AND NOT EXISTS (

                        SELECT 1

                        FROM service_reports approved_report

                        WHERE
                            approved_report.request_id =
                                sr.id

                            AND approved_report.status =
                                'approved'

                    )


                ORDER BY

                    payment_proof_uploaded_at DESC,

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


                        latest_report_status:
                            request.latest_report_status,


                        latest_report_submitted_at:
                            request.latest_report_submitted_at,


                        created_at:
                            request.created_at

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


        const [answers] =
            await pool.query(
                `
                SELECT

                    ra.id,
                    ra.question_id,
                    ra.question_type,
                    ra.text_value,
                    ra.number_value,
                    ra.unit,

                    sq.question_code,
                    sq.title_en,
                    sq.title_ms,
                    sq.description_en,
                    sq.description_ms

                FROM request_answers ra

                INNER JOIN service_questions sq
                    ON ra.question_id = sq.id

                WHERE ra.request_id = ?

                ORDER BY
                    sq.display_order ASC
                `,
                [id]
            );


        const answerIds =
            answers.map(
                answer =>
                    answer.id
            );


        let selectedOptions = [];


        if (
            answerIds.length > 0
        ) {

            const placeholders =
                answerIds
                    .map(
                        () => "?"
                    )
                    .join(",");


            const [options] =
                await pool.query(
                    `
                    SELECT

                        answer_id,
                        option_id,
                        option_value,
                        option_label_en,
                        option_label_ms

                    FROM request_answer_options

                    WHERE answer_id IN
                    (${placeholders})

                    ORDER BY id ASC
                    `,
                    answerIds
                );


            selectedOptions =
                options;

        }


        const [photos] =
            await pool.query(
                `
                SELECT

                    id,
                    file_name,
                    file_path,
                    uploaded_at

                FROM customer_photos

                WHERE request_id = ?

                ORDER BY uploaded_at ASC
                `,
                [id]
            );


        const [reports] =
            await pool.query(
                `
                SELECT

                    sr.id,
                    sr.request_id,
                    sr.technician_id,

                    sr.work_performed,
                    sr.findings,
                    sr.materials_used,
                    sr.technician_notes,

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

                    WHERE
                        report_id = ?

                        AND request_id = ?

                    ORDER BY
                        uploaded_at ASC
                    `,
                    [
                        report.id,
                        id
                    ]
                );


            completionMedia =
                media;

        }


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

                    WHERE
                        id = ?

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
 * Assigning a technician does NOT automatically
 * complete or remove the job from Job Pending.
 *
 * The job remains visible until the technician
 * report is approved.
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


        const allowedStatuses = [

            "pending",

            "assigned",

            "in_progress",

            "waiting_parts",

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


        /*
         * Keep the supplied status if one was
         * explicitly sent.
         *
         * Otherwise keep the current status.
         *
         * IMPORTANT:
         *
         * The admin frontend currently sends
         * selectedStatus.
         *
         * Therefore, when assigning a technician,
         * the frontend should keep selectedStatus
         * as "pending".
         */

        const finalStatus =
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

                        THEN
                            ?

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
 * REVIEW TECHNICIAN WORK REPORT
 *
 * APPROVE:
 *
 * report = approved
 * request = completed
 *
 * REJECT:
 *
 * report = rejected
 * request = pending
 *
 * Therefore rejected jobs remain in Job Pending.
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


        /*
         * VALIDATE ACTION
         */

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


        /*
         * REJECTION REASON REQUIRED
         */

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


        /*
         * FIND REQUEST
         */

        const [requests] =
            await connection.query(
                `
                SELECT

                    id,
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


        /*
         * REQUEST MUST HAVE TECHNICIAN
         */

        if (
            !request.technician_id
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "This request has no assigned technician."

            });

        }


        /*
         * FIND LATEST REPORT
         */

        const [reports] =
            await connection.query(
                `
                SELECT

                    id,
                    request_id,
                    technician_id,
                    status,
                    work_performed,
                    findings,
                    materials_used,
                    technician_notes

                FROM service_reports

                WHERE
                    request_id = ?

                    AND technician_id = ?

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
                    "No technician work report was found."

            });

        }


        const report =
            reports[0];


        /*
         * ONLY SUBMITTED REPORTS CAN BE REVIEWED
         */

        if (
            report.status !==
            "submitted"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    `This technician report cannot be reviewed because its current status is "${report.status}".`

            });

        }


        /*
         * START TRANSACTION
         */

        await connection.beginTransaction();


        /*
         * ==========================================
         * APPROVE
         * ==========================================
         */

        if (
            action === "approve"
        ) {

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
                `,
                [
                    adminId,
                    report.id
                ]
            );


            await connection.query(
                `
                UPDATE service_requests

                SET

                    status =
                        'completed',

                    completed_at =
                        NOW(),

                    updated_at =
                        NOW()

                WHERE id = ?
                `,
                [
                    requestId
                ]
            );


            await connection.commit();


            return res.json({

                success: true,

                message:
                    "Technician work report approved successfully. The job is now completed.",

                data: {

                    request_id:
                        requestId,

                    report_id:
                        report.id,

                    report_status:
                        "approved",

                    request_status:
                        "completed"

                }

            });

        }


        /*
         * ==========================================
         * REJECT
         * ==========================================
         */

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
            `,
            [
                adminId,
                reason,
                report.id
            ]
        );


        /*
         * IMPORTANT:
         *
         * Rejected report returns the request
         * to pending.
         *
         * It remains visible in Job Pending.
         *
         * The technician can submit a new report.
         */

        await connection.query(
            `
            UPDATE service_requests

            SET

                status =
                    'pending',

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


        await connection.commit();


        return res.json({

            success: true,

            message:
                "Technician work report rejected. The job remains in Job Pending and the technician can resubmit the report.",

            data: {

                request_id:
                    requestId,

                report_id:
                    report.id,

                report_status:
                    "rejected",

                request_status:
                    "pending",

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