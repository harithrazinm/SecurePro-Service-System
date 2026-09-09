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
                rpt.report_type,
                rpt.progress_number,
                rpt.report_title,
                rpt.reported_by,

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
 * GET DASHBOARD CATEGORY FILES
 * ======================================================
 *
 * Read-only file browser for the Super Admin dashboard.
 * Categories are derived from the monitoring cards:
 * - quotation_uploaded
 * - quotation_sent
 * - payment_proof
 * - report_submitted
 * - report_approved
 * - completed
 * - all
 */
async function getDashboardCategoryFiles(req, res) {
    try {
        const category = String(req.query.category || "all").toLowerCase();

        const allowed = new Set([
            "all",
            "quotation_uploaded",
            "quotation_sent",
            "payment_proof",
            "report_submitted",
            "report_approved",
            "completed"
        ]);

        if (!allowed.has(category)) {
            return res.status(400).json({
                success: false,
                message: "Invalid file category."
            });
        }

        const files = [];

        // Latest quotation for each request, matching the dashboard/project view.
        if (category === "all" || category === "quotation_uploaded" || category === "quotation_sent") {
            const [quotations] = await pool.query(`
                SELECT
                    q.id,
                    q.request_id,
                    sr.request_code,
                    sr.customer_name,
                    s.name_en AS service_name,
                    q.quotation_number,
                    q.quotation_file_name AS file_name,
                    q.quotation_file_url AS file_path,
                    q.created_at AS uploaded_at,
                    q.sent_at
                FROM quotations q
                INNER JOIN service_requests sr ON sr.id = q.request_id
                INNER JOIN services s ON s.id = sr.service_id
                WHERE q.quotation_file_url IS NOT NULL
                  AND sr.status <> 'cancelled'
                  AND q.id = (
                      SELECT q2.id
                      FROM quotations q2
                      WHERE q2.request_id = q.request_id
                      ORDER BY q2.created_at DESC
                      LIMIT 1
                  )
                  ${category === "quotation_sent" ? "AND q.sent_at IS NOT NULL" : ""}
                ORDER BY COALESCE(q.sent_at, q.created_at) DESC
            `);

            quotations.forEach(q => files.push({
                id: `quotation-${q.id}`,
                request_id: q.request_id,
                category: category === "quotation_sent" ? "Quotation Sent" : "Quotation Uploaded",
                file_name: q.file_name || `Quotation ${q.quotation_number || "PDF"}`,
                file_path: q.file_path,
                file_type: "PDF",
                request_code: q.request_code,
                customer_name: q.customer_name,
                service_name: q.service_name,
                quotation_number: q.quotation_number,
                uploaded_at: q.uploaded_at,
                sent_at: q.sent_at,
                source: "Admin Quotation"
            }));
        }

        // Payment proof is uploaded by the customer, but is included because it is a dashboard file category.
        if (category === "all" || category === "payment_proof") {
            const [payments] = await pool.query(`
                SELECT
                    q.id,
                    q.request_id,
                    sr.request_code,
                    sr.customer_name,
                    s.name_en AS service_name,
                    q.payment_proof_name AS file_name,
                    q.payment_proof_url AS file_path,
                    q.payment_proof_uploaded_at AS uploaded_at
                FROM quotations q
                INNER JOIN service_requests sr ON sr.id = q.request_id
                INNER JOIN services s ON s.id = sr.service_id
                WHERE q.payment_proof_url IS NOT NULL
                  AND sr.status <> 'cancelled'
                  AND q.id = (
                      SELECT q2.id
                      FROM quotations q2
                      WHERE q2.request_id = q.request_id
                      ORDER BY q2.created_at DESC
                      LIMIT 1
                  )
                ORDER BY q.payment_proof_uploaded_at DESC
            `);

            payments.forEach(q => files.push({
                id: `payment-${q.id}`,
                request_id: q.request_id,
                category: "Payment Proof",
                file_name: q.file_name || "Payment Proof",
                file_path: q.file_path,
                file_type: "Payment Proof",
                request_code: q.request_code,
                customer_name: q.customer_name,
                service_name: q.service_name,
                uploaded_at: q.uploaded_at,
                source: "Customer Payment Proof"
            }));
        }

        // Technician reports may contain a report document and multiple photos/videos.
        if (category === "all" || category === "report_submitted" || category === "report_approved" || category === "completed") {
            const reportStatus = category === "report_submitted" ? "submitted" : category === "report_approved" ? "approved" : null;

            if (category !== "completed") {
                const [reports] = await pool.query(`
                    SELECT
                        rpt.id,
                        rpt.request_id,
                        sr.request_code,
                        sr.customer_name,
                        s.name_en AS service_name,
                        rpt.report_file_path,
                        rpt.status,
                        rpt.submitted_at,
                        rpt.reviewed_at,
                        t.name AS technician_name
                    FROM service_reports rpt
                    INNER JOIN service_requests sr ON sr.id = rpt.request_id
                    INNER JOIN services s ON s.id = sr.service_id
                    LEFT JOIN users t ON t.id = rpt.technician_id
                    WHERE sr.status <> 'cancelled'
                      AND rpt.status ${category === "all" ? "IN ('submitted', 'approved')" : "= '" + reportStatus + "'"}
                    ORDER BY rpt.submitted_at DESC
                `);

                reports.forEach(r => {
                    if (r.report_file_path) {
                        files.push({
                            id: `report-${r.id}`,
                            request_id: r.request_id,
                            category: r.status === "approved" ? "Report Approved" : "Report Submitted",
                            file_name: "Technician Report",
                            file_path: r.report_file_path,
                            file_type: "Report",
                            request_code: r.request_code,
                            customer_name: r.customer_name,
                            service_name: r.service_name,
                            technician_name: r.technician_name,
                            uploaded_at: r.submitted_at,
                            reviewed_at: r.reviewed_at,
                            source: "Technician Report"
                        });
                    }
                });

                const reportIds = reports.map(r => r.id);
                if (reportIds.length) {
                    const [media] = await pool.query(`
                        SELECT
                            m.id,
                            m.report_id,
                            m.file_name,
                            m.file_path,
                            m.mime_type,
                            m.uploaded_at,
                            sr.request_code,
                            sr.customer_name,
                            s.name_en AS service_name,
                            rpt.status,
                            t.name AS technician_name
                        FROM service_report_media m
                        INNER JOIN service_reports rpt ON rpt.id = m.report_id
                        INNER JOIN service_requests sr ON sr.id = m.request_id
                        INNER JOIN services s ON s.id = sr.service_id
                        LEFT JOIN users t ON t.id = m.technician_id
                        WHERE m.report_id IN (${reportIds.map(() => "?").join(",")})
                        ORDER BY m.uploaded_at DESC
                    `, reportIds);

                    media.forEach(m => files.push({
                        id: `media-${m.id}`,
                        request_id: m.request_id,
                        category: m.status === "approved" ? "Report Approved" : "Report Submitted",
                        file_name: m.file_name || "Report Media",
                        file_path: m.file_path,
                        file_type: m.mime_type || "Media",
                        request_code: m.request_code,
                        customer_name: m.customer_name,
                        service_name: m.service_name,
                        technician_name: m.technician_name,
                        uploaded_at: m.uploaded_at,
                        source: "Technician Report Media"
                    }));
                }
            }

            if (category === "all" || category === "completed") {
                const [media] = await pool.query(`
                    SELECT
                        m.id,
                        m.file_name,
                        m.file_path,
                        m.mime_type,
                        m.uploaded_at,
                        sr.request_code,
                        sr.customer_name,
                        s.name_en AS service_name,
                        t.name AS technician_name
                    FROM service_report_media m
                    INNER JOIN service_requests sr ON sr.id = m.request_id
                    INNER JOIN services s ON s.id = sr.service_id
                    LEFT JOIN users t ON t.id = m.technician_id
                    WHERE sr.status = 'completed'
                    ORDER BY m.uploaded_at DESC
                `);

                media.forEach(m => files.push({
                    id: `completion-media-${m.id}`,
                    request_id: m.request_id,
                    category: "Completed",
                    file_name: m.file_name || "Completion Media",
                    file_path: m.file_path,
                    file_type: m.mime_type || "Media",
                    request_code: m.request_code,
                    customer_name: m.customer_name,
                    service_name: m.service_name,
                    technician_name: m.technician_name,
                    uploaded_at: m.uploaded_at,
                    source: "Service Completion Media"
                }));

                const [photos] = await pool.query(`
                    SELECT
                        cp.id,
                        cp.request_id,
                        cp.file_name,
                        cp.file_path,
                        cp.uploaded_at,
                        sr.request_code,
                        sr.customer_name,
                        s.name_en AS service_name
                    FROM customer_photos cp
                    INNER JOIN service_requests sr ON sr.id = cp.request_id
                    INNER JOIN services s ON s.id = sr.service_id
                    WHERE sr.status = 'completed'
                    ORDER BY cp.uploaded_at DESC
                `);

                photos.forEach(p => files.push({
                    id: `completion-photo-${p.id}`,
                    request_id: p.request_id,
                    category: "Completed",
                    file_name: p.file_name || "Project Photo",
                    file_path: p.file_path,
                    file_type: "Photo",
                    request_code: p.request_code,
                    customer_name: p.customer_name,
                    service_name: p.service_name,
                    uploaded_at: p.uploaded_at,
                    source: "Customer Project Photo"
                }));
            }
        }

        files.sort((a, b) => new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0));

        return res.json({
            success: true,
            data: {
                category,
                files,
                count: files.length
            }
        });
    } catch (error) {
        console.error("Super admin category files error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to retrieve category files."
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

    getProjectById,

    getDashboardCategoryFiles

};