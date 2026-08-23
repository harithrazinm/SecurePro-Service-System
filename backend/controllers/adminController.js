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


        /*
         * ==================================================
         * REQUEST
         * ==================================================
         */

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


        /*
         * REQUEST NOT FOUND
         */

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


        /*
         * ==================================================
         * QUESTIONS / ANSWERS
         * ==================================================
         */

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


        /*
         * ==================================================
         * MULTI / SINGLE OPTIONS
         * ==================================================
         */

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


        /*
         * ==================================================
         * CUSTOMER PHOTOS
         * ==================================================
         */

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


        /*
         * ==================================================
         * TECHNICIAN WORK REPORT
         * ==================================================
         */

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


        /*
         * ==================================================
         * TECHNICIAN COMPLETION MEDIA
         *
         * Photos and videos uploaded by technician
         * after finishing the work.
         * ==================================================
         */

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


        /*
         * ==================================================
         * TECHNICIAN
         * ==================================================
         */

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


        /*
         * ==================================================
         * FINAL RESPONSE
         * ==================================================
         */

        return res.json({

            success: true,

            data: {

                /*
                 * REQUEST
                 */

                id:
                    request.id,

                request_code:
                    request.request_code,


                /*
                 * SERVICE
                 */

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


                /*
                 * CUSTOMER
                 */

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


                /*
                 * STATUS
                 */

                status:
                    request.status,


                /*
                 * TECHNICIAN
                 */

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


                /*
                 * CUSTOMER QUESTIONS / ANSWERS
                 */

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


                /*
                 * CUSTOMER PHOTOS
                 */

                photos:
                    photos,


                /*
                 * ==================================================
                 * TECHNICIAN WORK REPORT
                 * ==================================================
                 */

                report:
                    report,


                /*
                 * ==================================================
                 * TECHNICIAN COMPLETION MEDIA
                 * ==================================================
                 */

                completion_media:
                    completionMedia,


                /*
                 * DATES
                 */

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
 * ======================================================
 */

async function updateRequest(req, res) {

    const connection =
        await pool.getConnection();

    try {

        const requestId =
            req.params.id;
            const id = req.params.id;


        const {
            status,
            technician_id,
            scheduled_date,
            scheduled_time,
            admin_notes
        } = req.body;

console.log("================================");
console.log("UPDATE REQUEST BODY:");
console.log(req.body);
console.log("REQUEST ID:", id);
console.log("================================");

        /*
         * ==========================================
         * CHECK REQUEST EXISTS
         * ==========================================
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
                [requestId]
            );


        if (requests.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Service request not found."
            });

        }


        const request =
            requests[0];


        /*
         * ==========================================
         * VALIDATE TECHNICIAN
         * ==========================================
         */

        if (technician_id) {

            const [technicians] =
                await connection.query(
                    `
                    SELECT
                        id,
                        name
                    FROM users
                    WHERE id = ?
                    AND role = 'technician'
                    AND status = 'active'
                    LIMIT 1
                    `,
                    [technician_id]
                );


            if (technicians.length === 0) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Selected technician is not valid or inactive."
                });

            }

        }


        /*
         * ==========================================
         * DETERMINE FINAL STATUS
         *
         * If technician is assigned,
         * automatically change pending to assigned.
         * ==========================================
         */

        let finalStatus =
            status ||
            request.status;


        if (
            technician_id &&
            (
                !status ||
                status === "pending"
            )
        ) {

            finalStatus =
                "assigned";

        }


        /*
         * ==========================================
         * VALIDATE STATUS
         * ==========================================
         */

        const allowedStatuses = [

            "pending",

            "assigned",

            "in_progress",

            "waiting_parts",

            "completed",

            "cancelled"

        ];


        if (
            !allowedStatuses.includes(
                finalStatus
            )
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid request status."
            });

        }


        /*
         * ==========================================
         * ASSIGNMENT VALIDATION
         * ==========================================
         */

        if (
            technician_id &&
            !scheduled_date
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Scheduled date is required when assigning a technician."
            });

        }


        /*
         * ==========================================
         * START TRANSACTION
         * ==========================================
         */

        await connection.beginTransaction();


        /*
         * ==========================================
         * UPDATE REQUEST
         * ==========================================
         */

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
                        THEN NOW()
                        ELSE assigned_at
                    END,

                admin_notes = ?,

                admin_notes_updated_at =
                    CASE
                        WHEN ? IS NOT NULL
                        THEN NOW()
                        ELSE admin_notes_updated_at
                    END,

                admin_notes_updated_by =
                    CASE
                        WHEN ? IS NOT NULL
                        THEN ?
                        ELSE admin_notes_updated_by
                    END

            WHERE id = ?
            `,
            [

                finalStatus,

                technician_id || null,

                scheduled_date || null,

                scheduled_time || null,

                technician_id || null,

                admin_notes || null,

                admin_notes || null,

                admin_notes || null,

                req.user.id,

                requestId

            ]
        );


        /*
         * ==========================================
         * SAVE STATUS HISTORY
         * Only create history when status changed.
         * ==========================================
         */

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

                    admin_notes ||
                    "Request updated by administrator."

                ]
            );

        }


        /*
         * ==========================================
         * COMMIT
         * ==========================================
         */

        await connection.commit();


        /*
         * ==========================================
         * GET UPDATED REQUEST
         * ==========================================
         */

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
                [requestId]
            );


        return res.json({

            success: true,

            message:
                "Service request updated successfully.",

            data:
                updatedRequests[0]

        });


    } catch (error) {

        await connection.rollback();

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
 * POST /api/admin/requests/:id/report/review
 *
 * Body:
 *
 * {
 *     "action": "approve"
 * }
 *
 * OR
 *
 * {
 *     "action": "reject",
 *     "reason": "Please upload clearer completion photos."
 * }
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
                req.body.action || ""
            )
            .trim()
            .toLowerCase();

        const reason =
            String(
                req.body.reason || ""
            )
            .trim();


        // ==================================================
        // VALIDATE ACTION
        // ==================================================

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


        // ==================================================
        // REJECTION REASON REQUIRED
        // ==================================================

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


        // ==================================================
        // FIND REQUEST
        // ==================================================

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


        if (!requests.length) {

            return res.status(404).json({

                success: false,

                message:
                    "Service request not found."

            });

        }


        const request =
            requests[0];


        // ==================================================
        // FIND LATEST TECHNICIAN REPORT
        // ==================================================

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
                ORDER BY created_at DESC
                LIMIT 1
                `,
                [
                    requestId,
                    request.technician_id
                ]
            );


        if (!reports.length) {

            return res.status(404).json({

                success: false,

                message:
                    "No technician work report was found."

            });

        }


        const report =
            reports[0];


        // ==================================================
        // PREVENT REVIEWING ALREADY APPROVED REPORT
        // ==================================================

        if (
            report.status ===
            "approved"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "This technician report has already been approved."

            });

        }


        // ==================================================
        // PREVENT REVIEWING ALREADY REJECTED REPORT
        // ==================================================

        if (
            report.status ===
            "rejected"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "This technician report has already been rejected and can be resubmitted by the technician."

            });

        }


        // ==================================================
        // START TRANSACTION
        // ==================================================

        await connection.beginTransaction();


        // ==================================================
        // APPROVE
        // ==================================================

        if (
            action ===
            "approve"
        ) {

            await connection.query(
                `
                UPDATE service_reports

                SET
                    status = 'approved',

                    reviewed_at = NOW(),

                    reviewed_by = ?,

                    review_remarks = NULL

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
                    status = 'completed',

                    completed_at = NOW(),

                    updated_at = NOW()

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
                    "Technician work report approved successfully.",

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


        // ==================================================
        // REJECT
        // ==================================================

        await connection.query(
            `
            UPDATE service_reports

            SET
                status = 'rejected',

                reviewed_at = NOW(),

                reviewed_by = ?,

                review_remarks = ?

            WHERE id = ?
            `,
            [
                adminId,
                reason,
                report.id
            ]
        );


        await connection.query(
            `
            UPDATE service_requests

            SET
                status = 'in_progress',

                updated_at = NOW()

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
                "Technician work report rejected.",

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

        await connection.rollback();

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

    getRequests,

    getRequestById,

    getDashboardSummary,

    getTechnicians,

    updateRequest,

    reviewTechnicianReport

};