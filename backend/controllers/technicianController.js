const crypto = require("crypto");
const pool = require("../config/db");


function uuid() {
    return crypto.randomUUID();
}


/* ==========================================================
   START ASSIGNED JOB

   POST /api/technician/requests/:id/start
========================================================== */

async function startAssignedRequest(req, res) {

    try {

        const [requests] = await pool.query(
            `
            SELECT
                id,
                status,
                technician_id,
                technician_started_at,
                updated_at
            FROM service_requests
            WHERE id = ?
              AND technician_id = ?
            LIMIT 1
            `,
            [
                req.params.id,
                req.user.id
            ]
        );


        if (!requests.length) {

            return res.status(404).json({
                success: false,
                message:
                    "Request not found or is not assigned to you."
            });

        }


        const request = requests[0];


        /* ======================================================
           ONLY ASSIGNED JOBS CAN BE STARTED
        ====================================================== */

        if (request.status !== "assigned") {

            return res.status(400).json({
                success: false,
                message:
                    request.status === "in_progress"
                        ? "This job has already been started."
                        : "Only assigned jobs can be started."
            });

        }


        /* ======================================================
           START JOB
        ====================================================== */

        await pool.query(
            `
            UPDATE service_requests
            SET
                status = 'in_progress',
                technician_started_at =
                    COALESCE(technician_started_at, NOW()),
                updated_at = NOW()
            WHERE id = ?
              AND technician_id = ?
            `,
            [
                req.params.id,
                req.user.id
            ]
        );


        /* ======================================================
           GET UPDATED REQUEST
        ====================================================== */

        const [rows] = await pool.query(
            `
            SELECT
                id,
                status,
                technician_started_at,
                updated_at
            FROM service_requests
            WHERE id = ?
            LIMIT 1
            `,
            [
                req.params.id
            ]
        );


        return res.json({

            success: true,

            message:
                "Job started successfully.",

            data: {

                request_id:
                    req.params.id,

                status:
                    rows[0]?.status || "in_progress",

                technician_started_at:
                    rows[0]?.technician_started_at || null

            }

        });


    } catch (error) {

        console.error(
            "Start assigned request error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to start the job."

        });

    }

}


/* ==========================================================
   GET ASSIGNED REQUESTS

   GET /api/technician/requests
========================================================== */

async function getAssignedRequests(req, res) {

    try {

        console.log(
            "TECHNICIAN TOKEN USER:",
            req.user
        );

        console.log(
            "TECHNICIAN ID USED:",
            req.user.id
        );


        const technicianId =
            req.user.id;


        const [requests] =
            await pool.query(
                `
                SELECT

                    sr.id,

                    sr.request_code,

                    sr.customer_name,

                    sr.customer_phone,

                    sr.customer_email,

                    sr.customer_address,

                    sr.status,

                    sr.admin_notes,

                    sr.scheduled_date,

                    sr.scheduled_time,

                    CASE
                        WHEN sr.technician_id IS NOT NULL
                        THEN sr.updated_at
                        ELSE NULL
                    END AS assigned_at,

                    CASE
                        WHEN sr.status = 'in_progress'
                        THEN sr.updated_at
                        ELSE NULL
                    END AS technician_started_at,

                    sr.created_at,

                    sr.updated_at,

                    s.name_en AS service_name

                FROM service_requests sr

                LEFT JOIN services s
                    ON s.id = sr.service_id

                WHERE sr.technician_id = ?

                ORDER BY

                    CASE
                        WHEN sr.scheduled_date IS NULL
                        THEN 1
                        ELSE 0
                    END ASC,

                    sr.scheduled_date ASC,

                    sr.scheduled_time ASC,

                    sr.created_at DESC
                `,
                [
                    technicianId
                ]
            );


        return res.json({

            success: true,

            data: requests

        });


    } catch (error) {

        console.error(
            "Get assigned requests error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to retrieve assigned requests."

        });

    }

}


/* ==========================================================
   GET ASSIGNED REQUEST DETAILS

   GET /api/technician/requests/:id
========================================================== */

async function getAssignedRequestById(req, res) {

    try {

        const requestId =
            req.params.id;


        const technicianId =
            req.user.id;


        /* ==================================================
           GET REQUEST DETAILS
        ================================================== */

        const [requests] =
            await pool.query(
                `
                SELECT

                    sr.id,

                    sr.request_code,

                    sr.service_id,

                    sr.customer_name,

                    sr.customer_phone,

                    sr.customer_email,

                    sr.customer_address,

                    sr.customer_notes,

                    sr.admin_notes,

                    sr.status,

                    sr.scheduled_date,

                    sr.scheduled_time,

                    CASE
                        WHEN sr.technician_id IS NOT NULL
                        THEN sr.updated_at
                        ELSE NULL
                    END AS assigned_at,

                    CASE
                        WHEN sr.status = 'in_progress'
                        THEN sr.updated_at
                        ELSE NULL
                    END AS technician_started_at,

                    sr.created_at,

                    sr.updated_at,

                    s.name_en AS service_name

                FROM service_requests sr

                LEFT JOIN services s
                    ON s.id = sr.service_id

                WHERE sr.id = ?

                  AND sr.technician_id = ?

                LIMIT 1
                `,
                [
                    requestId,
                    technicianId
                ]
            );


        console.log(
            "REQUEST DETAILS RESULT:"
        );

        console.log(
            requests[0]
        );


        /* ==================================================
           CHECK REQUEST
        ================================================== */

        if (requests.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "Request not found or is not assigned to you."

            });

        }


        const request =
            requests[0];


        /* ==================================================
           GET CUSTOMER PHOTOS
        ================================================== */

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
                [
                    requestId
                ]
            );


        /* ==================================================
           GET REQUEST ANSWERS
        ================================================== */

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

                    ra.created_at,

                    ra.updated_at,

                    sq.title_en AS question_en,

                    sq.title_ms AS question_ms

                FROM request_answers ra

                LEFT JOIN service_questions sq
                    ON sq.id = ra.question_id

                WHERE ra.request_id = ?

                ORDER BY ra.created_at ASC
                `,
                [
                    requestId
                ]
            );


        /* ==================================================
           GET SELECTED OPTIONS
        ================================================== */

        for (
            const answer of answers
        ) {

            const [options] =
                await pool.query(
                    `
                    SELECT

                        id,

                        option_id,

                        option_value,

                        option_label_en,

                        option_label_ms

                    FROM request_answer_options

                    WHERE answer_id = ?
                    `,
                    [
                        answer.id
                    ]
                );


            answer.options =
                options;

        }


        /* ==================================================
           GET TECHNICIAN REPORT TIMELINE
        ================================================== */

        const [reports] =
            await pool.query(
                `
                SELECT

                    id,

                    request_id,

                    technician_id,

                    report_type,

                    progress_number,

                    report_title,

                    work_performed,

                    findings,

                    materials_used,

                    technician_notes,

                    reported_by,

                    status,

                    submitted_at,

                    reviewed_at,

                    reviewed_by,

                    review_remarks,

                    created_at,

                    updated_at

                FROM service_reports

                WHERE request_id = ?

                  AND technician_id = ?

                ORDER BY created_at DESC
                `,
                [
                    requestId,
                    technicianId
                ]
            );


        /* ==================================================
           GET REPORT MEDIA
        ================================================== */

        const reportIds =
            reports.map(
                report => report.id
            );


        let reportMedia = [];


        if (reportIds.length) {

            const placeholders =
                reportIds
                    .map(() => "?")
                    .join(",");


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

                    WHERE report_id IN (${placeholders})

                    ORDER BY uploaded_at ASC
                    `,
                    reportIds
                );


            reportMedia =
                media;

        }


        /* ==================================================
           ATTACH MEDIA TO REPORTS
        ================================================== */

        const reportMap =
            new Map();


        reports.forEach(
            report => {

                report.media = [];

                reportMap.set(
                    report.id,
                    report
                );

            }
        );


        reportMedia.forEach(
            media => {

                const report =
                    reportMap.get(
                        media.report_id
                    );


                if (report) {

                    report.media.push(
                        media
                    );

                }

            }
        );


        const latestReport =
            reports[0] || null;


        /* ==================================================
           RETURN COMPLETE REQUEST
        ================================================== */

        return res.json({

            success: true,

            data: {

                ...request,

                photos,

                answers,

                reports,

                report:
                    latestReport

            }

        });


    } catch (error) {

        console.error(
            "Get assigned request details error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to retrieve request details."

        });

    }

}


/* ==========================================================
   SUBMIT WORK REPORT

   POST /api/technician/requests/:id/report
========================================================== */

async function submitWorkReport(req, res) {

    let connection;


    try {

        connection =
            await pool.getConnection();


        await connection.beginTransaction();


        const requestId =
            req.params.id;


        const technicianId =
            req.user.id;


        const workPerformed =
            String(
                req.body.work_performed || ""
            ).trim();


        const findings =
            String(
                req.body.findings || ""
            ).trim();


        const materialsUsed =
            String(
                req.body.materials_used || ""
            ).trim();


        const technicianNotes =
            String(
                req.body.technician_notes || ""
            ).trim();


        /*
         * HTML uses:
         *
         * value="Man"
         * value="Izz"
         */
        const reportedBy =
            String(
                req.body.reported_by || ""
            ).trim();


        const reportType =
            req.body.report_type === "progress"
                ? "progress"
                : "final";


        const reportTitle =
            String(
                req.body.report_title || ""
            ).trim();


        /* ======================================================
           VALIDATION
        ====================================================== */

        if (!workPerformed) {

            await connection.rollback();

            return res.status(400).json({

                success: false,

                message:
                    "Work performed is required."

            });

        }


        /* ======================================================
           VALIDATE REPORT WRITER
        ====================================================== */

        const allowedReportWriters = [
            "HEAD TECHNICIAN",
            "TECHNICIAN 1",
        ];


        if (
            !allowedReportWriters.includes(
                reportedBy
            )
        ) {

            await connection.rollback();

            return res.status(400).json({

                success: false,

                message:
                    "Please select who wrote the report."

            });

        }


        /* ======================================================
           VERIFY ASSIGNMENT
        ====================================================== */

        const [requests] =
            await connection.query(
                `
                SELECT

                    id,

                    status,

                    technician_id

                FROM service_requests

                WHERE id = ?

                  AND technician_id = ?

                LIMIT 1
                `,
                [
                    requestId,
                    technicianId
                ]
            );


        if (!requests.length) {

            await connection.rollback();

            return res.status(403).json({

                success: false,

                message:
                    "This request is not assigned to you."

            });

        }


        const request =
            requests[0];


        /* ======================================================
           CANCELLED REQUEST
        ====================================================== */

        if (
            request.status ===
            "cancelled"
        ) {

            await connection.rollback();

            return res.status(400).json({

                success: false,

                message:
                    "A report cannot be submitted for a cancelled request."

            });

        }


        /* ======================================================
           AWAITING PAYMENT / COMPLETED
        ====================================================== */

        if (
            request.status === "awaiting_payment" ||
            request.status === "completed"
        ) {

            await connection.rollback();

            return res.status(400).json({

                success: false,

                message:
                    "This service request is no longer available for technician updates."

            });

        }


        /* ======================================================
           CHECK EXISTING FINAL REPORT
        ====================================================== */

        const [existingReports] =
            await connection.query(
                `
                SELECT

                    id,

                    status

                FROM service_reports

                WHERE request_id = ?

                  AND technician_id = ?

                  AND report_type = 'final'

                ORDER BY created_at DESC

                LIMIT 1
                `,
                [
                    requestId,
                    technicianId
                ]
            );


        const existingFinalReport =
            existingReports[0] || null;


        /* ======================================================
           BLOCK ACTION AFTER FINAL REPORT
        ====================================================== */

        if (
            existingFinalReport &&
            existingFinalReport.status !== "rejected"
        ) {

            await connection.rollback();

            return res.status(400).json({

                success: false,

                message:
                    existingFinalReport.status === "approved"

                        ? "The final report has already been approved."

                        : "The final report has already been submitted and is waiting for Admin review."

            });

        }


        /* ======================================================
           PROGRESS UPDATE
        ====================================================== */

        if (
            reportType === "progress"
        ) {

            /*
             * Technician must be in progress.
             */
            if (
                request.status !==
                "in_progress"
            ) {

                await connection.rollback();

                return res.status(400).json({

                    success: false,

                    message:
                        "Start the assigned job before submitting a progress update."

                });

            }


            const [countRows] =
                await connection.query(
                    `
                    SELECT
                        COUNT(*) AS total

                    FROM service_reports

                    WHERE request_id = ?

                      AND technician_id = ?

                      AND report_type = 'progress'
                    `,
                    [
                        requestId,
                        technicianId
                    ]
                );


            const progressNumber =
                Number(
                    countRows[0]?.total || 0
                ) + 1;


            const progressReportId =
                uuid();


            await connection.query(
                `
                INSERT INTO service_reports (

                    id,

                    request_id,

                    technician_id,

                    report_type,

                    progress_number,

                    report_title,

                    work_performed,

                    findings,

                    materials_used,

                    technician_notes,

                    reported_by,

                    status,

                    submitted_at

                )

                VALUES (

                    ?,
                    ?,
                    ?,
                    'progress',
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    'approved',
                    NOW()

                )
                `,
                [

                    progressReportId,

                    requestId,

                    technicianId,

                    progressNumber,

                    reportTitle ||
                        `Progress Update ${progressNumber}`,

                    workPerformed,

                    findings,

                    materialsUsed,

                    technicianNotes,

                    reportedBy

                ]
            );


            /* ==================================================
               SAVE PROGRESS MEDIA
            ================================================== */

            const uploadedMedia =
                Array.isArray(req.files)
                    ? req.files
                    : [];


            for (
                const file of uploadedMedia
            ) {

                const mediaType =
                    file.mimetype.startsWith(
                        "image/"
                    )
                        ? "image"
                        : "video";


                await connection.query(
                    `
                    INSERT INTO service_report_media (

                        id,

                        report_id,

                        request_id,

                        technician_id,

                        media_type,

                        file_name,

                        file_path,

                        mime_type,

                        file_size

                    )

                    VALUES (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?
                    )
                    `,
                    [

                        uuid(),

                        progressReportId,

                        requestId,

                        technicianId,

                        mediaType,

                        file.originalname,

                        file.path,

                        file.mimetype,

                        file.size

                    ]
                );

            }


            /* ==================================================
               KEEP REQUEST IN PROGRESS
            ================================================== */

            await connection.query(
                `
                UPDATE service_requests

                SET

                    status = 'in_progress',

                    updated_at = NOW()

                WHERE id = ?

                  AND technician_id = ?
                `,
                [
                    requestId,
                    technicianId
                ]
            );


            await connection.commit();


            return res.status(201).json({

                success: true,

                message:
                    `Progress update ${progressNumber} submitted successfully.`,

                data: {

                    id:
                        progressReportId,

                    request_id:
                        requestId,

                    report_type:
                        "progress",

                    progress_number:
                        progressNumber,

                    status:
                        "approved"

                }

            });

        }


        /* ======================================================
           RESUBMIT REJECTED FINAL REPORT
        ====================================================== */

        if (
            existingFinalReport &&
            existingFinalReport.status === "rejected"
        ) {

            /*
             * Request must be in progress.
             */
            if (
                request.status !==
                "in_progress"
            ) {

                await connection.rollback();

                return res.status(400).json({

                    success: false,

                    message:
                        "The job must be in progress before resubmitting the final report."

                });

            }


            const reportId =
                existingFinalReport.id;


            await connection.query(
                `
                UPDATE service_reports

                SET

                    work_performed = ?,

                    findings = ?,

                    materials_used = ?,

                    technician_notes = ?,

                    reported_by = ?,

                    report_type = 'final',

                    progress_number = NULL,

                    report_title = ?,

                    status = 'submitted',

                    submitted_at = NOW(),

                    reviewed_at = NULL,

                    reviewed_by = NULL,

                    review_remarks = NULL

                WHERE id = ?

                  AND request_id = ?

                  AND technician_id = ?
                `,
                [

                    workPerformed,

                    findings,

                    materialsUsed,

                    technicianNotes,

                    reportedBy,

                    reportTitle ||
                        "Final Work Report",

                    reportId,

                    requestId,

                    technicianId

                ]
            );


            /* ==================================================
               SAVE NEW MEDIA
            ================================================== */

            const uploadedMedia =
                Array.isArray(req.files)
                    ? req.files
                    : [];


            for (
                const file of uploadedMedia
            ) {

                const mediaType =
                    file.mimetype.startsWith(
                        "image/"
                    )
                        ? "image"
                        : "video";


                await connection.query(
                    `
                    INSERT INTO service_report_media (

                        id,

                        report_id,

                        request_id,

                        technician_id,

                        media_type,

                        file_name,

                        file_path,

                        mime_type,

                        file_size

                    )

                    VALUES (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?
                    )
                    `,
                    [

                        uuid(),

                        reportId,

                        requestId,

                        technicianId,

                        mediaType,

                        file.originalname,

                        file.path,

                        file.mimetype,

                        file.size

                    ]
                );

            }


            /* ==================================================
               KEEP REQUEST IN PROGRESS
            ================================================== */

            await connection.query(
                `
                UPDATE service_requests

                SET

                    status = 'in_progress',

                    updated_at = NOW()

                WHERE id = ?

                  AND technician_id = ?
                `,
                [
                    requestId,
                    technicianId
                ]
            );


            await connection.commit();


            return res.json({

                success: true,

                message:
                    "Final work report resubmitted successfully.",

                data: {

                    id:
                        reportId,

                    request_id:
                        requestId,

                    status:
                        "submitted"

                }

            });

        }


        /* ======================================================
           ONLY IN-PROGRESS JOB CAN SUBMIT FINAL REPORT
        ====================================================== */

        if (
            request.status !==
            "in_progress"
        ) {

            await connection.rollback();

            return res.status(400).json({

                success: false,

                message:
                    "Start the assigned job before submitting a work report."

            });

        }


        /* ======================================================
           PREVENT DUPLICATE FINAL REPORT
        ====================================================== */

        if (
            existingFinalReport
        ) {

            await connection.rollback();

            return res.status(409).json({

                success: false,

                message:
                    "A final work report has already been submitted for this request."

            });

        }


        /* ======================================================
           CREATE FINAL REPORT
        ====================================================== */

        const reportId =
            uuid();


        await connection.query(
            `
            INSERT INTO service_reports (

                id,

                request_id,

                technician_id,

                report_type,

                progress_number,

                report_title,

                work_performed,

                findings,

                materials_used,

                technician_notes,

                reported_by,

                status,

                submitted_at

            )

            VALUES (

                ?,

                ?,

                ?,

                'final',

                NULL,

                ?,

                ?,

                ?,

                ?,

                ?,

                ?,

                'submitted',

                NOW()

            )
            `,
            [

                reportId,

                requestId,

                technicianId,

                reportTitle ||
                    "Final Work Report",

                workPerformed,

                findings,

                materialsUsed,

                technicianNotes,

                reportedBy

            ]
        );


        /* ======================================================
           SAVE COMPLETION PHOTOS / VIDEOS
        ====================================================== */

        const uploadedMedia =
            Array.isArray(req.files)
                ? req.files
                : [];


        for (
            const file of uploadedMedia
        ) {

            const mediaType =
                file.mimetype.startsWith(
                    "image/"
                )
                    ? "image"
                    : "video";


            await connection.query(
                `
                INSERT INTO service_report_media (

                    id,

                    report_id,

                    request_id,

                    technician_id,

                    media_type,

                    file_name,

                    file_path,

                    mime_type,

                    file_size

                )

                VALUES (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?
                )
                `,
                [

                    uuid(),

                    reportId,

                    requestId,

                    technicianId,

                    mediaType,

                    file.originalname,

                    file.path,

                    file.mimetype,

                    file.size

                ]
            );

        }


        /* ======================================================
           KEEP REQUEST IN PROGRESS
           
           IMPORTANT:
           Technician final report does NOT complete the job.
           Admin must approve the report first.
        ====================================================== */

        await connection.query(
            `
            UPDATE service_requests

            SET

                status = 'in_progress',

                updated_at = NOW()

            WHERE id = ?

              AND technician_id = ?
            `,
            [
                requestId,
                technicianId
            ]
        );


        await connection.commit();


        /* ======================================================
           RESPONSE
        ====================================================== */

        return res.status(201).json({

            success: true,

            message:
                "Final work report submitted successfully. It is now waiting for Admin review.",

            data: {

                id:
                    reportId,

                request_id:
                    requestId,

                status:
                    "submitted",

                report_type:
                    "final",

                reported_by:
                    reportedBy,

                media:
                    uploadedMedia.map(
                        file => ({

                            id:
                                null,

                            file_name:
                                file.originalname,

                            file_path:
                                file.path,

                            media_type:
                                file.mimetype.startsWith(
                                    "image/"
                                )
                                    ? "image"
                                    : "video",

                            mime_type:
                                file.mimetype,

                            file_size:
                                file.size

                        })
                    )

            }

        });


    } catch (error) {

        if (connection) {

            try {

                await connection.rollback();

            } catch {

                // Ignore rollback errors.

            }

        }


        console.error(
            "Submit work report error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to submit work report."

        });

    } finally {

        if (connection) {

            connection.release();

        }

    }

}


/* ==========================================================
   EXPORTS
========================================================== */

module.exports = {

    startAssignedRequest,

    getAssignedRequests,

    getAssignedRequestById,

    submitWorkReport

};