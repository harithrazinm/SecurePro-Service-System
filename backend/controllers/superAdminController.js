const pool = require("../config/db");

/*
 * ======================================================
 * SUPER ADMIN MONITORING CONTROLLER
 * ======================================================
 *
 * Super Admin is READ-ONLY.
 *
 * Can monitor:
 * - Quotations
 * - Quotation sent status
 * - Payment proof
 * - Technician assignment
 * - Technician started status
 * - Technician reports
 * - Admin report approval
 * - Project completion
 *
 * No UPDATE / DELETE operations are performed here.
 * ======================================================
 */


/*
 * ======================================================
 * LATEST QUOTATION
 * ======================================================
 *
 * Get the latest quotation belonging to each request.
 */

const latestQuotationJoin = `
    LEFT JOIN quotations q
        ON q.request_id = sr.id
        AND q.created_at = (
            SELECT MAX(q2.created_at)
            FROM quotations q2
            WHERE q2.request_id = sr.id
        )
`;


/*
 * ======================================================
 * LATEST TECHNICIAN REPORT
 * ======================================================
 *
 * Get the latest report belonging to each request.
 */

const latestReportJoin = `
    LEFT JOIN service_reports rpt
        ON rpt.id = (
            SELECT sr2.id
            FROM service_reports sr2
            WHERE sr2.request_id = sr.id
            ORDER BY sr2.created_at DESC
            LIMIT 1
        )
`;


/*
 * ======================================================
 * SUPER ADMIN DASHBOARD
 * ======================================================
 */

async function getDashboard(req, res) {

    try {

        /*
         * --------------------------------------------------
         * SUMMARY
         * --------------------------------------------------
         */

        const [rows] = await pool.query(`
            SELECT

                COUNT(*) AS total_projects,

                COALESCE(
                    SUM(
                        q.quotation_file_url IS NOT NULL
                    ),
                    0
                ) AS quotations_uploaded,

                COALESCE(
                    SUM(
                        q.sent_at IS NOT NULL
                    ),
                    0
                ) AS quotations_sent,

                COALESCE(
                    SUM(
                        q.payment_proof_url IS NOT NULL
                    ),
                    0
                ) AS payment_proofs,

                COALESCE(
                    SUM(
                        sr.technician_id IS NOT NULL
                    ),
                    0
                ) AS technicians_assigned,

                /*
                 * Your current system uses request status.
                 *
                 * When a job is in_progress, we treat it
                 * as technician started.
                 */
                COALESCE(
                    SUM(
                        sr.status = 'in_progress'
                    ),
                    0
                ) AS technicians_started,

                COALESCE(
                    SUM(
                        rpt.status = 'submitted'
                    ),
                    0
                ) AS reports_submitted,

                COALESCE(
                    SUM(
                        rpt.status = 'approved'
                    ),
                    0
                ) AS reports_approved,

                COALESCE(
                    SUM(
                        sr.status = 'completed'
                    ),
                    0
                ) AS projects_completed

            FROM service_requests sr

            ${latestQuotationJoin}

            ${latestReportJoin}

            WHERE sr.status <> 'cancelled'
        `);


        /*
         * --------------------------------------------------
         * RECENT PROJECTS
         * --------------------------------------------------
         */

        const [recent] = await pool.query(`
            SELECT

                sr.id,
                sr.request_code,
                sr.customer_name,
                sr.customer_phone,

                sr.status,

                /*
                 * The database does not have
                 * technician_started_at.
                 *
                 * Use updated_at as the monitoring time
                 * when the project is currently in_progress.
                 */
                CASE
                    WHEN sr.status = 'in_progress'
                    THEN sr.updated_at
                    ELSE NULL
                END AS technician_started_at,

                sr.completed_at,

                s.name_en AS service_name,

                q.id AS quotation_id,
                q.quotation_number,

                q.quotation_file_url,
                q.quotation_file_name,

                q.status AS quotation_status,

                q.created_at AS quotation_created_at,
                q.sent_at AS quotation_sent_at,

                q.payment_proof_url,
                q.payment_proof_name,
                q.payment_proof_uploaded_at,

                q.payment_status,

                t.name AS technician_name,

                rpt.status AS report_status,
                rpt.submitted_at AS report_submitted_at,
                rpt.reviewed_at AS report_reviewed_at

            FROM service_requests sr

            INNER JOIN services s
                ON s.id = sr.service_id

            ${latestQuotationJoin}

            ${latestReportJoin}

            LEFT JOIN users t
                ON t.id = sr.technician_id
                AND t.role = 'technician'

            WHERE sr.status <> 'cancelled'

            ORDER BY sr.updated_at DESC

            LIMIT 12
        `);


        return res.json({

            success: true,

            data: {

                summary: rows[0],

                recent

            }

        });

    } catch (error) {

        console.error(
            "Super admin dashboard error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to retrieve monitoring dashboard."

        });

    }

}


/*
 * ======================================================
 * GET ALL PROJECTS
 * ======================================================
 */

async function getProjects(req, res) {

    try {

        const [rows] = await pool.query(`

            SELECT

                sr.id,
                sr.request_code,

                sr.customer_name,
                sr.customer_phone,
                sr.customer_email,

                sr.status,

                sr.technician_id,

                /*
                 * Your database does not use
                 * technician_started_at.
                 *
                 * We therefore expose a calculated value.
                 */
                CASE
                    WHEN sr.status = 'in_progress'
                    THEN sr.updated_at
                    ELSE NULL
                END AS technician_started_at,

                /*
                 * Use updated_at as assignment monitoring
                 * information when a technician exists.
                 */
                CASE
                    WHEN sr.technician_id IS NOT NULL
                    THEN sr.updated_at
                    ELSE NULL
                END AS assigned_at,

                sr.created_at,
                sr.updated_at,
                sr.completed_at,

                s.name_en AS service_name,
                s.name_ms AS service_name_ms,

                t.name AS technician_name,

                q.id AS quotation_id,
                q.quotation_number,

                q.status AS quotation_status,

                q.quotation_file_url,
                q.quotation_file_name,

                q.created_at AS quotation_uploaded_at,

                q.sent_at AS quotation_sent_at,

                q.payment_status,

                q.payment_proof_url,
                q.payment_proof_name,

                q.payment_proof_uploaded_at,

                rpt.id AS report_id,

                rpt.status AS report_status,

                rpt.submitted_at AS report_submitted_at,

                rpt.reviewed_at AS report_reviewed_at,

                rpt.review_remarks

            FROM service_requests sr

            INNER JOIN services s
                ON s.id = sr.service_id

            ${latestQuotationJoin}

            ${latestReportJoin}

            LEFT JOIN users t
                ON t.id = sr.technician_id
                AND t.role = 'technician'

            WHERE sr.status <> 'cancelled'

            ORDER BY sr.updated_at DESC

        `);


        return res.json({

            success: true,

            data: rows

        });

    } catch (error) {

        console.error(
            "Super admin projects error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to retrieve projects."

        });

    }

}


/*
 * ======================================================
 * GET PROJECT BY ID
 * ======================================================
 */

async function getProjectById(req, res) {

    try {

        /*
         * --------------------------------------------------
         * PROJECT INFORMATION
         * --------------------------------------------------
         */

        const [requests] = await pool.query(`

            SELECT

                sr.*,

                s.name_en AS service_name,
                s.name_ms AS service_name_ms,

                t.id AS technician_user_id,
                t.name AS technician_name,
                t.email AS technician_email,

                q.id AS quotation_id,
                q.quotation_number,

                q.status AS quotation_status,

                q.notes AS quotation_notes,

                q.quotation_file_url,
                q.quotation_file_name,

                q.created_at AS quotation_uploaded_at,

                q.sent_at AS quotation_sent_at,

                q.follow_up_1_sent_at,
                q.follow_up_2_sent_at,

                q.payment_status,

                q.payment_proof_url,
                q.payment_proof_name,

                q.payment_proof_uploaded_at

            FROM service_requests sr

            INNER JOIN services s
                ON s.id = sr.service_id

            LEFT JOIN users t
                ON t.id = sr.technician_id
                AND t.role = 'technician'

            ${latestQuotationJoin}

            WHERE sr.id = ?

            LIMIT 1

        `, [
            req.params.id
        ]);


        /*
         * --------------------------------------------------
         * PROJECT NOT FOUND
         * --------------------------------------------------
         */

        if (!requests.length) {

            return res.status(404).json({

                success: false,

                message:
                    "Project not found."

            });

        }


        const project =
            requests[0];


        /*
         * --------------------------------------------------
         * TECHNICIAN REPORTS
         * --------------------------------------------------
         */

        const [reports] = await pool.query(`

            SELECT

                rpt.id,
                rpt.request_id,
                rpt.technician_id,

                t.name AS technician_name,

                rpt.work_performed,
                rpt.findings,
                rpt.materials_used,
                rpt.technician_notes,

                rpt.report_file_path,

                rpt.status,

                rpt.submitted_at,
                rpt.reviewed_at,

                reviewer.name AS reviewed_by_name,

                rpt.review_remarks,

                rpt.created_at,
                rpt.updated_at

            FROM service_reports rpt

            LEFT JOIN users t
                ON t.id = rpt.technician_id

            LEFT JOIN users reviewer
                ON reviewer.id = rpt.reviewed_by

            WHERE rpt.request_id = ?

            ORDER BY rpt.created_at DESC

        `, [
            req.params.id
        ]);


        /*
         * --------------------------------------------------
         * TECHNICIAN REPORT MEDIA
         * --------------------------------------------------
         */

        const [media] = await pool.query(`

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

            WHERE request_id = ?

            ORDER BY uploaded_at ASC

        `, [
            req.params.id
        ]);


        /*
         * --------------------------------------------------
         * CUSTOMER PHOTOS
         * --------------------------------------------------
         */

        const [photos] = await pool.query(`

            SELECT

                id,
                file_name,
                file_path,
                uploaded_at

            FROM customer_photos

            WHERE request_id = ?

            ORDER BY uploaded_at ASC

        `, [
            req.params.id
        ]);


        /*
         * --------------------------------------------------
         * PROJECT RESPONSE
         * --------------------------------------------------
         */

        return res.json({

            success: true,

            data: {

                project,

                reports,

                media,

                customer_photos:
                    photos

            }

        });

    } catch (error) {

        console.error(
            "Super admin project detail error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to retrieve project details."

        });

    }

}


/*
 * ======================================================
 * EXPORTS
 * ======================================================
 */

module.exports = {

    getDashboard,

    getProjects,

    getProjectById

};