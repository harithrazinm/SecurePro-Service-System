
/* ==========================================================
   START ASSIGNED JOB

   POST /api/technician/requests/:id/start
========================================================== */

async function startAssignedRequest(req, res) {
    try {

        const [requests] = await pool.query(
            `SELECT
                id,
                status,
                technician_id,
                technician_started_at,
                updated_at
             FROM service_requests
             WHERE id = ?
               AND technician_id = ?
             LIMIT 1`,
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

        if (request.status !== "assigned") {
            return res.status(400).json({
                success: false,
                message:
                    request.status === "in_progress"
                        ? "This job has already been started."
                        : "Only assigned jobs can be started."
            });
        }

        /*
         * Starting the job changes the request status
         * from assigned/pending to in_progress.
         *
         * updated_at acts as the latest workflow timestamp.
         */
        await pool.query(
            `UPDATE service_requests
             SET
                 status = 'in_progress',
                 technician_started_at = COALESCE(technician_started_at, NOW()),
                 updated_at = NOW()
             WHERE id = ?
               AND technician_id = ?`,
            [
                req.params.id,
                req.user.id
            ]
        );

        /*
         * Get the updated request.
         */
        const [rows] = await pool.query(
            `SELECT
                id,
                status,
                technician_started_at,
                updated_at
             FROM service_requests
             WHERE id = ?
             LIMIT 1`,
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

const crypto = require("crypto");
const pool = require("../config/db");


function uuid() {
    return crypto.randomUUID();
}


/* ==========================================================
   GET ASSIGNED REQUESTS

   GET /api/technician/requests
========================================================== */

async function getAssignedRequests(req, res) {

    try {
console.log("TECHNICIAN TOKEN USER:", req.user);
console.log("TECHNICIAN ID USED:", req.user.id);
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

console.log("REQUEST DETAILS RESULT:");
console.log(requests[0]);
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
                    status,
                    submitted_at,
                    reviewed_at,
                    review_remarks,
                    created_at,
                    updated_at
                FROM service_reports
                WHERE request_id = ?
                  AND technician_id = ?
                ORDER BY created_at DESC
                `,
                [requestId, technicianId]
            );

        const reportIds = reports.map(report => report.id);
        let reportMedia = [];

        if (reportIds.length) {
            const placeholders = reportIds.map(() => '?').join(',');
            const [media] = await pool.query(
                `
                SELECT
                    id, report_id, request_id, technician_id,
                    media_type, file_name, file_path, mime_type,
                    file_size, uploaded_at
                FROM service_report_media
                WHERE report_id IN (${placeholders})
                ORDER BY uploaded_at ASC
                `,
                reportIds
            );
            reportMedia = media;
        }

        const reportMap = new Map();
        reports.forEach(report => {
            report.media = [];
            reportMap.set(report.id, report);
        });
        reportMedia.forEach(media => {
            const report = reportMap.get(media.report_id);
            if (report) report.media.push(media);
        });

        const latestReport = reports[0] || null;

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
                report: latestReport

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

        const reportType =
            req.body.report_type === "progress"
                ? "progress"
                : "final";

        const reportTitle =
            String(req.body.report_title || "").trim();


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

                WHERE
                    id = ?
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
           CHECK EXISTING REPORT
        ====================================================== */

        const [existingReports] =
            await connection.query(
                `
                SELECT

                    id,
                    status

                FROM service_reports

                WHERE
                    request_id = ?
                    AND technician_id = ?
                    AND report_type = 'final'

                ORDER BY
                    created_at DESC

                LIMIT 1
                `,
                [
                    requestId,
                    technicianId
                ]
            );


        /* ======================================================
           PROGRESS UPDATE
        ====================================================== */

        if (reportType === "progress") {

            const [countRows] = await connection.query(
                `
                SELECT COUNT(*) AS total
                FROM service_reports
                WHERE request_id = ?
                  AND technician_id = ?
                  AND report_type = 'progress'
                `,
                [requestId, technicianId]
            );

            const progressNumber =
                Number(countRows[0]?.total || 0) + 1;

            const progressReportId = uuid();

            await connection.query(
                `
                INSERT INTO service_reports (
                    id, request_id, technician_id,
                    report_type, progress_number, report_title,
                    work_performed, findings, materials_used,
                    technician_notes, status, submitted_at
                )
                VALUES (?, ?, ?, 'progress', ?, ?, ?, ?, ?, ?, 'approved', NOW())
                `,
                [
                    progressReportId, requestId, technicianId,
                    progressNumber, reportTitle || `Progress Update ${progressNumber}`,
                    workPerformed, findings, materialsUsed, technicianNotes
                ]
            );

            const uploadedMedia = Array.isArray(req.files) ? req.files : [];

            for (const file of uploadedMedia) {
                const mediaType = file.mimetype.startsWith("image/") ? "image" : "video";
                await connection.query(
                    `
                    INSERT INTO service_report_media (
                        id, report_id, request_id, technician_id,
                        media_type, file_name, file_path, mime_type, file_size
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    [uuid(), progressReportId, requestId, technicianId, mediaType,
                     file.originalname, file.path, file.mimetype, file.size]
                );
            }

            await connection.query(
                `
                UPDATE service_requests
                SET status = 'in_progress', updated_at = NOW()
                WHERE id = ? AND technician_id = ?
                `,
                [requestId, technicianId]
            );

            await connection.commit();

            return res.status(201).json({
                success: true,
                message: `Progress update ${progressNumber} submitted successfully.`,
                data: {
                    id: progressReportId,
                    request_id: requestId,
                    report_type: "progress",
                    progress_number: progressNumber,
                    status: "approved"
                }
            });
        }

        /* ======================================================
           RESUBMIT REJECTED FINAL REPORT
        ====================================================== */

        if (
            existingReports.length > 0 &&
            existingReports[0].status ===
            "rejected"
        ) {

            const reportId =
                existingReports[0].id;


            await connection.query(
                `
                UPDATE service_reports

                SET

                    work_performed = ?,

                    findings = ?,

                    materials_used = ?,

                    technician_notes = ?,

                    report_type = 'final',

                    progress_number = NULL,

                    report_title = ?,

                    status = 'submitted',

                    submitted_at = NOW(),

                    reviewed_at = NULL,

                    reviewed_by = NULL,

                    review_remarks = NULL

                WHERE
                    id = ?
                `,
                [

                    workPerformed,

                    findings,

                    materialsUsed,

                    technicianNotes,

                    reportTitle || "Final Work Report",

                    reportId

                ]
            );


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


                const filePath =
    file.path;


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

                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    [

                        uuid(),

                        reportId,

                        requestId,

                        technicianId,

                        mediaType,

                        file.originalname,

                        filePath,

                        file.mimetype,

                        file.size

                    ]
                );

            }


            await connection.query(
    `
    UPDATE service_requests
    SET
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
                    "Work report resubmitted successfully.",

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


        if (request.status !== "in_progress") {

            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    "Start the assigned job before submitting a work report."
            });

        }


        /* ======================================================
           PREVENT DUPLICATE REPORT
        ====================================================== */

        if (existingReports.length > 0) {

            await connection.rollback();


            return res.status(409).json({

                success: false,

                message:
                    "A work report has already been submitted for this request."

            });

        }


        /* ======================================================
           CREATE REPORT
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
                status,
                submitted_at

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

                "final",

                null,

                reportTitle || "Final Work Report",

                workPerformed,

                findings,

                materialsUsed,

                technicianNotes

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


            const filePath =
    file.path;


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

                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [

                    uuid(),

                    reportId,

                    requestId,

                    technicianId,

                    mediaType,

                    file.originalname,

                    filePath,

                    file.mimetype,

                    file.size

                ]
            );

        }


      /* ======================================================
   UPDATE REQUEST STATUS
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


        return res.status(201).json({

            success: true,

            message:
                "Work report submitted successfully.",

            data: {

                id:
                    reportId,

                request_id:
                    requestId,

                status:
                    "submitted",

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