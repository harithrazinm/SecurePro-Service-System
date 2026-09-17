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
console.log("==========================================");
console.log("REPORT CONTROLLER VERSION: 2026-09-17-FIX");
console.log(
    "reported_by RECEIVED:",
    JSON.stringify(req.body.reported_by)
);
console.log("==========================================");

const rawReportedBy = String(req.body.reported_by || "")
    .trim()
    .replace(/\s+/g, " ");

const reportWriterMap = {
    "head technician": "Head Technician",
    "technician 1": "Technician 1"
};

const reportWriterKey = rawReportedBy.toLowerCase();
const reportWriter = reportWriterMap[reportWriterKey] || "";

console.log("=== REPORT WRITER DEBUG ===");
console.log("Raw reported_by:", JSON.stringify(req.body.reported_by));
console.log("Normalized:", reportWriter);

if (!reportWriter) {
    console.error(
        "Invalid reported_by received:",
        JSON.stringify(req.body.reported_by)
    );

    await connection.rollback();

    return res.status(400).json({
        success: false,
        message: "Please select who wrote the report."
    });
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