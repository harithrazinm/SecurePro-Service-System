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

        const [requests] =
            await pool.query(
                `
                SELECT

                    sr.id,
                    sr.request_code,
                    sr.status,
                    sr.created_at,
                    sr.updated_at,

                    s.id AS service_id,
                    s.service_code AS service_code,
                    s.name_en AS service_name_en,
                    s.name_ms AS service_name_ms

                FROM service_requests sr

                LEFT JOIN services s
                    ON s.id = sr.service_id

                WHERE
                    sr.technician_id = ?

                ORDER BY
                    sr.created_at DESC
                `,
                [
                    req.user.id
                ]
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

                        status:
                            request.status,

                        created_at:
                            request.created_at,

                        updated_at:
                            request.updated_at,

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

                        }

                    })
                )

        });

    } catch (error) {

        console.error(
            "Get technician requests error:",
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


        /*
         * ==================================================
         * REQUEST + CUSTOMER + SERVICE
         * ==================================================
         */

        const [requests] =
            await pool.query(
                `
                SELECT

                    sr.id,
                    sr.request_code,
                    sr.status,

                    sr.customer_name,
                    sr.customer_phone,
                    sr.customer_email,
                    sr.customer_address,
                    sr.customer_notes,

                    sr.technician_id,

                    sr.created_at,
                    sr.updated_at,
                    sr.completed_at,

                    s.id AS service_id,
                    s.service_code AS service_code,
                    s.name_en AS service_name_en,
                    s.name_ms AS service_name_ms,

                    u.name AS technician_name,
                    u.email AS technician_email

                FROM service_requests sr

                LEFT JOIN services s
                    ON s.id = sr.service_id

                LEFT JOIN users u
                    ON u.id = sr.technician_id

                WHERE
                    sr.id = ?
                    AND sr.technician_id = ?

                LIMIT 1
                `,
                [
                    requestId,
                    req.user.id
                ]
            );


        if (!requests.length) {

            return res.status(404).json({

                success: false,

                message:
                    "Request not found or not assigned to you."

            });

        }


        const request =
            requests[0];


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
                [
                    requestId
                ]
            );


        /*
         * ==================================================
         * CUSTOMER SERVICE ANSWERS
         * ==================================================
         *
         * These are the answers the customer gave
         * when creating the service request.
         */

        const [answers] =
            await pool.query(
                `
                SELECT

                    ra.id AS answer_id,

                    ra.question_id,

                    ra.question_type,

                    ra.text_value,

                    ra.number_value,

                    ra.unit,

                    sq.question_code,

                    sq.title_en,

                    sq.title_ms,

                    sq.description_en,

                    sq.description_ms,

                    sq.display_order

                FROM request_answers ra

                LEFT JOIN service_questions sq
                    ON sq.id = ra.question_id

                WHERE
                    ra.request_id = ?

                ORDER BY
                    sq.display_order ASC,
                    ra.created_at ASC
                `,
                [
                    requestId
                ]
            );


        /*
         * ==================================================
         * ANSWER OPTIONS
         * ==================================================
         *
         * Used for single/multi selection answers.
         */

        const [answerOptions] =
            await pool.query(
                `
                SELECT

                    rao.answer_id,

                    rao.option_id,

                    rao.option_value,

                    rao.option_label_en,

                    rao.option_label_ms

                FROM request_answer_options rao

                INNER JOIN request_answers ra
                    ON ra.id = rao.answer_id

                WHERE
                    ra.request_id = ?

                ORDER BY
                    rao.id ASC
                `,
                [
                    requestId
                ]
            );


        /*
         * ==================================================
         * FORMAT CUSTOMER ANSWERS
         * ==================================================
         */

        const formattedAnswers =
            answers.map(
                answer => {

                    const options =
                        answerOptions.filter(
                            option =>
                                option.answer_id ===
                                answer.answer_id
                        );


                    let answerValue =
                        null;


                    /*
                     * --------------------------------------
                     * OPTION ANSWER
                     * --------------------------------------
                     */

                    if (options.length) {

                        answerValue =
                            options
                                .map(
                                    option =>
                                        option.option_label_en
                                )
                                .join(", ");

                    }


                    /*
                     * --------------------------------------
                     * TEXT ANSWER
                     * --------------------------------------
                     */

                    else if (
                        answer.text_value !== null &&
                        answer.text_value !== undefined &&
                        String(
                            answer.text_value
                        ).trim() !== ""
                    ) {

                        answerValue =
                            answer.text_value;

                    }


                    /*
                     * --------------------------------------
                     * NUMBER ANSWER
                     * --------------------------------------
                     */

                    else if (
                        answer.number_value !== null &&
                        answer.number_value !== undefined
                    ) {

                        answerValue =
                            answer.number_value;

                    }


                    /*
                     * --------------------------------------
                     * EMPTY ANSWER
                     * --------------------------------------
                     */

                    if (
                        answerValue === null ||
                        answerValue === undefined ||
                        String(
                            answerValue
                        ).trim() === ""
                    ) {

                        answerValue =
                            "Not specified";

                    }


                    return {

                        id:
                            answer.answer_id,

                        question_id:
                            answer.question_id,

                        question_code:
                            answer.question_code,

                        question_type:
                            answer.question_type,

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

                        answer:
                            answerValue,

                        text_value:
                            answer.text_value,

                        number_value:
                            answer.number_value,

                        unit:
                            answer.unit,

                        options:
                            options.map(
                                option => ({

                                    id:
                                        option.option_id,

                                    value:
                                        option.option_value,

                                    label: {

                                        en:
                                            option.option_label_en,

                                        ms:
                                            option.option_label_ms

                                    }

                                })
                            )

                    };

                }
            );


        /*
         * ==================================================
         * SERVICE REPORT
         * ==================================================
         */

        const [reports] =
            await pool.query(
                `
                SELECT

                    id,

                    work_performed,
                    findings,
                    materials_used,
                    technician_notes,

                    report_file_path,

                    status,

                    submitted_at,
                    reviewed_at,
                    reviewed_by,

                    created_at,
                    updated_at

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
                    req.user.id
                ]
            );


        /*
         * ==================================================
         * FINAL RESPONSE
         * ==================================================
         */

        return res.json({

            success: true,

            data: {

                id:
                    request.id,

                request_code:
                    request.request_code,

                status:
                    request.status,

                technician_id:
                    request.technician_id,


                /*
                 * ------------------------------------------
                 * TECHNICIAN
                 * ------------------------------------------
                 */

                technician: {

                    id:
                        request.technician_id,

                    name:
                        request.technician_name,

                    email:
                        request.technician_email

                },


                /*
                 * ------------------------------------------
                 * SERVICE
                 * ------------------------------------------
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
                 * ------------------------------------------
                 * CUSTOMER
                 * ------------------------------------------
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
                 * ------------------------------------------
                 * WHAT CUSTOMER REQUESTED
                 * ------------------------------------------
                 */

                answers:
                    formattedAnswers,


                /*
                 * ------------------------------------------
                 * CUSTOMER PHOTOS
                 * ------------------------------------------
                 */

                photos:
                    photos,


                /*
                 * ------------------------------------------
                 * TECHNICIAN REPORT
                 * ------------------------------------------
                 */

                report:
                    reports[0] || null,


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
            "Get technician request error:",
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

    const connection =
        await pool.getConnection();


    try {

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
            existingReports.length &&
            existingReports[0].status ===
                "rejected"
        ) {

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

                    reviewed_by = NULL
                    
                    review_remarks = NULL,

                WHERE
                    id = ?
                `,
                [

                    workPerformed,

                    findings,

                    materialsUsed,

                    technicianNotes,

                    existingReports[0].id

                ]
            );

            /* ==================================================
               SAVE NEW COMPLETION MEDIA
            ================================================== */

            const uploadedMedia =
                Array.isArray(req.files)
                    ? req.files
                    : [];


            for (
                const file of uploadedMedia
            ) {

                const mediaType =
                    file.mimetype.startsWith("image/")
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

                        existingReports[0].id,

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
            await connection.commit();


            return res.json({

                success: true,

                message:
                    "Work report resubmitted successfully.",

                data: {

                    id:
                        existingReports[0].id,

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

        if (existingReports.length) {

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
                file.mimetype.startsWith("image/")
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

            WHERE
                id = ?
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
                                file.mimetype.startsWith("image/")
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

        try {

            await connection.rollback();

        } catch {

            // Ignore rollback errors.
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

        connection.release();

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