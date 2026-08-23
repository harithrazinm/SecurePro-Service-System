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

                    sr.assigned_at,

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

                    sr.assigned_at,

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
           RETURN COMPLETE REQUEST
        ================================================== */

        return res.json({

            success: true,

            data: {

                ...request,

                photos,

                answers

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
           RESUBMIT REJECTED REPORT
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
                    `/uploads/technician/reports/${file.filename}`;


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
                'submitted',
                NOW()

            )
            `,
            [

                reportId,

                requestId,

                technicianId,

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
                `/uploads/technician/reports/${file.filename}`;


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
            `,
            [
                requestId
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
                                `/uploads/technician/reports/${file.filename}`,

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

    getAssignedRequests,

    getAssignedRequestById,

    submitWorkReport

};