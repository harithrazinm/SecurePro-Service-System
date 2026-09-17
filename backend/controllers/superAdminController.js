const pool = require("../config/db");

/*
 * ======================================================
 * SUPER ADMIN MONITORING CONTROLLER
 * ======================================================
 *
 * READ-ONLY
 *
 * Super Admin can monitor:
 *
 * - Projects
 * - Quotations
 * - Quotation payment proofs
 * - Invoices
 * - Invoice payment proofs
 * - Technician assignment
 * - Technician progress
 * - Technician reports
 * - Report media
 * - Customer photos
 * - Project completion
 *
 * No UPDATE / DELETE operations.
 * ======================================================
 */


/*
 * ======================================================
 * LATEST QUOTATION
 * ======================================================
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


                /* QUOTATIONS UPLOADED */

                COALESCE(
                    SUM(
                        q.quotation_file_url IS NOT NULL
                    ),
                    0
                ) AS quotations_uploaded,


                /* QUOTATIONS SENT */

                COALESCE(
                    SUM(
                        q.sent_at IS NOT NULL
                    ),
                    0
                ) AS quotations_sent,


                /* FINAL INVOICES */

                COALESCE(
                    (
                        SELECT COUNT(*)

                        FROM invoices i

                        INNER JOIN service_requests sr2
                            ON sr2.id = i.request_id

                        WHERE
                            i.invoice_file_url IS NOT NULL
                            AND sr2.status <> 'cancelled'

                    ),
                    0
                ) AS invoices_uploaded,


                /*
                 * QUOTATION PAYMENT PROOFS
                 */

                COALESCE(
                    (
                        SELECT COUNT(*)

                        FROM quotations q2

                        INNER JOIN service_requests sr3
                            ON sr3.id = q2.request_id

                        WHERE
                            q2.payment_proof_url IS NOT NULL
                            AND sr3.status <> 'cancelled'

                    ),
                    0
                ) AS quotation_payment_proofs,


                /*
                 * INVOICE PAYMENT PROOFS
                 */

                COALESCE(
                    (
                        SELECT COUNT(*)

                        FROM invoice_payments ip

                        INNER JOIN invoices i2
                            ON i2.id = ip.invoice_id

                        INNER JOIN service_requests sr4
                            ON sr4.id = i2.request_id

                        WHERE
                            ip.payment_proof_url IS NOT NULL
                            AND sr4.status <> 'cancelled'

                    ),
                    0
                ) AS invoice_payment_proofs,


                /*
                 * TOTAL PAYMENT PROOFS
                 *
                 * Keeps compatibility with existing dashboard.
                 */

                COALESCE(
                    (
                        SELECT COUNT(*)

                        FROM (

                            SELECT
                                q3.id AS proof_id

                            FROM quotations q3

                            INNER JOIN service_requests sr5
                                ON sr5.id = q3.request_id

                            WHERE
                                q3.payment_proof_url IS NOT NULL
                                AND sr5.status <> 'cancelled'


                            UNION ALL


                            SELECT
                                ip2.id AS proof_id

                            FROM invoice_payments ip2

                            INNER JOIN invoices i3
                                ON i3.id = ip2.invoice_id

                            INNER JOIN service_requests sr6
                                ON sr6.id = i3.request_id

                            WHERE
                                ip2.payment_proof_url IS NOT NULL
                                AND sr6.status <> 'cancelled'

                        ) combined_payment_proofs

                    ),
                    0
                ) AS payment_proofs,


                /* TECHNICIANS ASSIGNED */

                COALESCE(
                    SUM(
                        sr.technician_id IS NOT NULL
                    ),
                    0
                ) AS technicians_assigned,


                /* TECHNICIANS STARTED */

                COALESCE(
                    SUM(
                        sr.status = 'in_progress'
                    ),
                    0
                ) AS technicians_started,


                /* REPORTS SUBMITTED */

                COALESCE(
                    SUM(
                        rpt.status = 'submitted'
                    ),
                    0
                ) AS reports_submitted,


                /* REPORTS APPROVED */

                COALESCE(
                    SUM(
                        rpt.status = 'approved'
                    ),
                    0
                ) AS reports_approved,


                /* COMPLETED PROJECTS */

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
                sr.customer_email,

                sr.status,

                sr.technician_started_at,
                sr.completed_at,

                s.name_en AS service_name,
                s.name_ms AS service_name_ms,


                /* QUOTATION */

                q.id AS quotation_id,
                q.quotation_number,

                q.quotation_file_url,
                q.quotation_file_name,

                q.status AS quotation_status,

                q.created_at AS quotation_created_at,
                q.sent_at AS quotation_sent_at,

                q.payment_proof_url
                    AS quotation_payment_proof_url,

                q.payment_proof_name
                    AS quotation_payment_proof_name,

                q.payment_proof_uploaded_at
                    AS quotation_payment_proof_uploaded_at,

                q.payment_status
                    AS quotation_payment_status,


                /* TECHNICIAN */

                t.name AS technician_name,


                /* REPORT */

                rpt.status AS report_status,

                rpt.submitted_at AS report_submitted_at,

                rpt.reviewed_at AS report_reviewed_at,


                /* INVOICE */

                i.id AS invoice_id,

                i.invoice_number,

                i.invoice_file_url,
                i.invoice_file_name,

                i.status AS invoice_status,

                i.created_at AS invoice_created_at,


                /* INVOICE PAYMENT */

                ip.payment_proof_url
                    AS invoice_payment_proof_url,

                ip.payment_proof_name
                    AS invoice_payment_proof_name,

                ip.status
                    AS invoice_payment_status,

                ip.submitted_at
                    AS invoice_payment_submitted_at


            FROM service_requests sr

            INNER JOIN services s
                ON s.id = sr.service_id

            ${latestQuotationJoin}

            ${latestReportJoin}

            LEFT JOIN users t
                ON t.id = sr.technician_id
                AND t.role = 'technician'

            LEFT JOIN invoices i
                ON i.request_id = sr.id


            LEFT JOIN invoice_payments ip
                ON ip.invoice_id = i.id

                AND ip.submitted_at = (
                    SELECT MAX(ip2.submitted_at)
                    FROM invoice_payments ip2
                    WHERE ip2.invoice_id = i.id
                )


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

                sr.technician_started_at,

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


                /* QUOTATION */

                q.id AS quotation_id,
                q.quotation_number,

                q.status AS quotation_status,

                q.quotation_file_url,
                q.quotation_file_name,

                q.created_at AS quotation_uploaded_at,

                q.sent_at AS quotation_sent_at,


                /*
                 * QUOTATION PAYMENT
                 */

                q.payment_proof_url
                    AS quotation_payment_proof_url,

                q.payment_proof_name
                    AS quotation_payment_proof_name,

                q.payment_proof_uploaded_at
                    AS quotation_payment_proof_uploaded_at,

                q.payment_status
                    AS quotation_payment_status,


                /* REPORT */

                rpt.id AS report_id,

                rpt.status AS report_status,

                rpt.submitted_at AS report_submitted_at,

                rpt.reviewed_at AS report_reviewed_at,

                rpt.review_remarks,


                /* INVOICE */

                i.id AS invoice_id,

                i.invoice_number,

                i.invoice_file_url,
                i.invoice_file_name,

                i.status AS invoice_status,

                i.created_at AS invoice_uploaded_at,


                /*
                 * INVOICE PAYMENT
                 */

                ip.id AS invoice_payment_id,

                ip.payment_proof_url
                    AS invoice_payment_proof_url,

                ip.payment_proof_name
                    AS invoice_payment_proof_name,

                ip.payment_proof_type
                    AS invoice_payment_proof_type,

                ip.status
                    AS invoice_payment_status,

                ip.submitted_at
                    AS invoice_payment_submitted_at,

                ip.verified_at
                    AS invoice_payment_verified_at


            FROM service_requests sr

            INNER JOIN services s
                ON s.id = sr.service_id

            ${latestQuotationJoin}

            ${latestReportJoin}

            LEFT JOIN users t
                ON t.id = sr.technician_id
                AND t.role = 'technician'

            LEFT JOIN invoices i
                ON i.request_id = sr.id


            LEFT JOIN invoice_payments ip
                ON ip.invoice_id = i.id

                AND ip.submitted_at = (
                    SELECT MAX(ip2.submitted_at)
                    FROM invoice_payments ip2
                    WHERE ip2.invoice_id = i.id
                )


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
 *
 * Returns ALL files related to the project.
 *
 * PAYMENT PROOFS ARE SEPARATED:
 *
 * 1. quotation_payment_proofs
 * 2. invoice_payment_proofs
 *
 * ======================================================
 */

async function getProjectById(req, res) {

    try {

        /*
         * --------------------------------------------------
         * PROJECT
         * --------------------------------------------------
         */

        const [requests] = await pool.query(`

            SELECT

                sr.*,

                s.name_en AS service_name,
                s.name_ms AS service_name_ms,


                /* TECHNICIAN */

                t.id AS technician_user_id,

                t.name AS technician_name,

                t.email AS technician_email,


                /* QUOTATION */

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


                /*
                 * QUOTATION PAYMENT
                 */

                q.payment_proof_url
                    AS quotation_payment_proof_url,

                q.payment_proof_name
                    AS quotation_payment_proof_name,

                q.payment_proof_uploaded_at
                    AS quotation_payment_proof_uploaded_at,

                q.payment_status
                    AS quotation_payment_status


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
         * INVOICES
         * --------------------------------------------------
         */

        const [invoices] = await pool.query(`

            SELECT

                id,
                invoice_number,
                request_id,

                subtotal,
                discount,
                tax,
                additional_charge,

                total_amount,

                amount_paid,
                balance_due,

                invoice_file_url,
                invoice_file_name,

                status,

                created_by,

                created_at,
                updated_at

            FROM invoices

            WHERE request_id = ?

            ORDER BY created_at DESC

        `, [
            req.params.id
        ]);


        /*
         * --------------------------------------------------
         * QUOTATION PAYMENT PROOFS
         * --------------------------------------------------
         *
         * These belong to the quotation stage.
         *
         */

        const [quotationPaymentProofs] =
            await pool.query(`

                SELECT

                    q.id AS quotation_id,

                    q.request_id,

                    q.quotation_number,

                    q.payment_proof_url,

                    q.payment_proof_name,

                    q.payment_proof_uploaded_at,

                    q.payment_status,

                    q.status AS quotation_status


                FROM quotations q


                WHERE

                    q.request_id = ?

                    AND q.payment_proof_url IS NOT NULL


                ORDER BY
                    q.payment_proof_uploaded_at DESC

            `, [
                req.params.id
            ]);


        /*
         * --------------------------------------------------
         * INVOICE PAYMENT PROOFS
         * --------------------------------------------------
         *
         * These belong to the final invoice.
         *
         */

        const [invoicePaymentProofs] =
            await pool.query(`

                SELECT

                    ip.id,

                    ip.invoice_id,

                    i.invoice_number,

                    i.request_id,

                    ip.amount,

                    ip.payment_method,

                    ip.payment_proof_url,

                    ip.payment_proof_name,

                    ip.payment_proof_type,

                    ip.status,

                    ip.submitted_at,

                    ip.verified_by,

                    ip.verified_at,

                    ip.remarks,

                    verifier.name AS verified_by_name


                FROM invoice_payments ip

                INNER JOIN invoices i
                    ON i.id = ip.invoice_id

                LEFT JOIN users verifier
                    ON verifier.id = ip.verified_by


                WHERE i.request_id = ?


                ORDER BY ip.submitted_at DESC

            `, [
                req.params.id
            ]);


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


            ORDER BY

                CASE

                    WHEN rpt.report_type = 'progress'

                    THEN rpt.progress_number

                    ELSE 999999

                END ASC,

                rpt.created_at ASC

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
         * RESPONSE
         * --------------------------------------------------
         */

        return res.json({

            success: true,

            data: {

                project,

                invoices,

                /*
                 * SEPARATED PAYMENT PROOFS
                 */

                quotation_payment_proofs:
                    quotationPaymentProofs,

                invoice_payment_proofs:
                    invoicePaymentProofs,


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
 * DASHBOARD CATEGORY FILES
 * ======================================================
 */

async function getDashboardCategoryFiles(req, res) {

    try {

        const category =
            req.query.category || "all";


        /*
         * --------------------------------------------------
         * ALL PROJECTS
         * --------------------------------------------------
         */

        if (category === "all") {

            const [projects] = await pool.query(`

                SELECT

                    sr.id AS request_id,

                    sr.request_code,

                    sr.customer_name,

                    sr.customer_phone,

                    sr.status,

                    sr.created_at,

                    sr.updated_at,

                    s.name_en AS service_name,

                    t.name AS technician_name


                FROM service_requests sr

                INNER JOIN services s
                    ON s.id = sr.service_id

                LEFT JOIN users t
                    ON t.id = sr.technician_id
                    AND t.role = 'technician'


                WHERE sr.status <> 'cancelled'


                ORDER BY sr.updated_at DESC

            `);


            return res.json({

                success: true,

                data: {

                    files:
                        projects.map(
                            project => ({

                                type:
                                    "project",

                                request_id:
                                    project.request_id,

                                request_code:
                                    project.request_code,

                                customer_name:
                                    project.customer_name,

                                customer_phone:
                                    project.customer_phone,

                                service_name:
                                    project.service_name,

                                technician_name:
                                    project.technician_name,

                                status:
                                    project.status,

                                created_at:
                                    project.created_at,

                                updated_at:
                                    project.updated_at

                            })
                        )

                }

            });

        }


        /*
         * --------------------------------------------------
         * QUOTATION UPLOADED
         * --------------------------------------------------
         */

        if (
            category ===
            "quotation_uploaded"
        ) {

            const [files] =
                await pool.query(`

                    SELECT

                        q.id,

                        q.request_id,

                        q.quotation_number,

                        q.quotation_file_url,

                        q.quotation_file_name,

                        q.created_at,

                        sr.request_code,

                        sr.customer_name,

                        s.name_en AS service_name


                    FROM quotations q

                    INNER JOIN service_requests sr
                        ON sr.id = q.request_id

                    INNER JOIN services s
                        ON s.id = sr.service_id


                    WHERE

                        q.quotation_file_url IS NOT NULL

                        AND sr.status <> 'cancelled'


                    ORDER BY q.created_at DESC

                `);


            return res.json({

                success: true,

                data: {

                    files:
                        files.map(
                            file => ({

                                type:
                                    "quotation",

                                id:
                                    file.id,

                                request_id:
                                    file.request_id,

                                file_name:
                                    file.quotation_file_name,

                                file_type:
                                    "pdf",

                                file_path:
                                    file.quotation_file_url,

                                source:
                                    `Quotation ${file.quotation_number || ""}`.trim(),

                                uploaded_at:
                                    file.created_at,

                                request_code:
                                    file.request_code,

                                customer_name:
                                    file.customer_name,

                                service_name:
                                    file.service_name

                            })
                        )

                }

            });

        }


        /*
         * --------------------------------------------------
         * QUOTATION SENT
         * --------------------------------------------------
         */

        if (
            category ===
            "quotation_sent"
        ) {

            const [files] =
                await pool.query(`

                    SELECT

                        q.id,

                        q.request_id,

                        q.quotation_number,

                        q.quotation_file_url,

                        q.quotation_file_name,

                        q.sent_at,

                        q.created_at,

                        sr.request_code,

                        sr.customer_name,

                        s.name_en AS service_name


                    FROM quotations q

                    INNER JOIN service_requests sr
                        ON sr.id = q.request_id

                    INNER JOIN services s
                        ON s.id = sr.service_id


                    WHERE

                        q.sent_at IS NOT NULL

                        AND sr.status <> 'cancelled'


                    ORDER BY q.sent_at DESC

                `);


            return res.json({

                success: true,

                data: {

                    files:
                        files.map(
                            file => ({

                                type:
                                    "quotation",

                                id:
                                    file.id,

                                request_id:
                                    file.request_id,

                                file_name:
                                    file.quotation_file_name,

                                file_type:
                                    "pdf",

                                file_path:
                                    file.quotation_file_url,

                                source:
                                    `Quotation ${file.quotation_number || ""}`.trim(),

                                uploaded_at:
                                    file.sent_at ||
                                    file.created_at,

                                request_code:
                                    file.request_code,

                                customer_name:
                                    file.customer_name,

                                service_name:
                                    file.service_name

                            })
                        )

                }

            });

        }


        /*
         * --------------------------------------------------
         * FINAL INVOICE
         * --------------------------------------------------
         */

        if (
            category ===
            "invoice_uploaded"
        ) {

            const [files] =
                await pool.query(`

                    SELECT

                        i.id,

                        i.request_id,

                        i.invoice_number,

                        i.invoice_file_url,

                        i.invoice_file_name,

                        i.status,

                        i.created_at,

                        i.updated_at,

                        sr.request_code,

                        sr.customer_name,

                        s.name_en AS service_name


                    FROM invoices i

                    INNER JOIN service_requests sr
                        ON sr.id = i.request_id

                    INNER JOIN services s
                        ON s.id = sr.service_id


                    WHERE

                        i.invoice_file_url IS NOT NULL

                        AND sr.status <> 'cancelled'


                    ORDER BY i.created_at DESC

                `);


            return res.json({

                success: true,

                data: {

                    files:
                        files.map(
                            file => ({

                                type:
                                    "invoice",

                                id:
                                    file.id,

                                request_id:
                                    file.request_id,

                                file_name:
                                    file.invoice_file_name,

                                file_type:
                                    "pdf",

                                file_path:
                                    file.invoice_file_url,

                                source:
                                    `Invoice ${file.invoice_number || ""}`.trim(),

                                status:
                                    file.status,

                                uploaded_at:
                                    file.created_at,

                                request_code:
                                    file.request_code,

                                customer_name:
                                    file.customer_name,

                                service_name:
                                    file.service_name

                            })
                        )

                }

            });

        }


        /*
         * --------------------------------------------------
         * PAYMENT PROOF
         * --------------------------------------------------
         *
         * Includes BOTH:
         *
         * - Quotation payment proofs
         * - Invoice payment proofs
         *
         * Each file is labelled with its source.
         *
         */

        if (
            category ===
            "payment_proof"
        ) {

            const [quotationPayments] =
                await pool.query(`

                    SELECT

                        q.id,

                        q.request_id,

                        q.quotation_number,

                        q.payment_proof_url,

                        q.payment_proof_name,

                        q.payment_status,

                        q.payment_proof_uploaded_at,

                        sr.request_code,

                        sr.customer_name,

                        s.name_en AS service_name


                    FROM quotations q

                    INNER JOIN service_requests sr
                        ON sr.id = q.request_id

                    INNER JOIN services s
                        ON s.id = sr.service_id


                    WHERE

                        q.payment_proof_url IS NOT NULL

                        AND sr.status <> 'cancelled'


                    ORDER BY
                        q.payment_proof_uploaded_at DESC

                `);


            const [invoicePayments] =
                await pool.query(`

                    SELECT

                        ip.id,

                        ip.invoice_id,

                        i.invoice_number,

                        i.request_id,

                        ip.payment_proof_url,

                        ip.payment_proof_name,

                        ip.payment_proof_type,

                        ip.status AS payment_status,

                        ip.submitted_at,

                        ip.verified_at,

                        ip.remarks,

                        sr.request_code,

                        sr.customer_name,

                        s.name_en AS service_name


                    FROM invoice_payments ip

                    INNER JOIN invoices i
                        ON i.id = ip.invoice_id

                    INNER JOIN service_requests sr
                        ON sr.id = i.request_id

                    INNER JOIN services s
                        ON s.id = sr.service_id


                    WHERE

                        ip.payment_proof_url IS NOT NULL

                        AND sr.status <> 'cancelled'


                    ORDER BY
                        ip.submitted_at DESC

                `);


            const quotationFiles =
                quotationPayments.map(
                    file => ({

                        type:
                            "quotation_payment",

                        id:
                            file.id,

                        request_id:
                            file.request_id,

                        quotation_number:
                            file.quotation_number,

                        file_name:
                            file.payment_proof_name,

                        file_type:
                            "payment_proof",

                        file_path:
                            file.payment_proof_url,

                        source:
                            "Quotation Payment Proof",

                        status:
                            file.payment_status,

                        payment_status:
                            file.payment_status,

                        uploaded_at:
                            file.payment_proof_uploaded_at,

                        request_code:
                            file.request_code,

                        customer_name:
                            file.customer_name,

                        service_name:
                            file.service_name

                    })
                );


            const invoiceFiles =
                invoicePayments.map(
                    file => ({

                        type:
                            "invoice_payment",

                        id:
                            file.id,

                        invoice_id:
                            file.invoice_id,

                        request_id:
                            file.request_id,

                        invoice_number:
                            file.invoice_number,

                        file_name:
                            file.payment_proof_name,

                        file_type:
                            file.payment_proof_type,

                        file_path:
                            file.payment_proof_url,

                        source:
                            "Final Invoice Payment Proof",

                        status:
                            file.payment_status,

                        payment_status:
                            file.payment_status,

                        uploaded_at:
                            file.submitted_at,

                        verified_at:
                            file.verified_at,

                        remarks:
                            file.remarks,

                        request_code:
                            file.request_code,

                        customer_name:
                            file.customer_name,

                        service_name:
                            file.service_name

                    })
                );


            const files = [
                ...quotationFiles,
                ...invoiceFiles
            ].sort(
                (a, b) =>
                    new Date(
                        b.uploaded_at || 0
                    ) -
                    new Date(
                        a.uploaded_at || 0
                    )
            );


            return res.json({

                success: true,

                data: {

                    files

                }

            });

        }


        /*
         * --------------------------------------------------
         * COMPLETED PROJECTS
         * --------------------------------------------------
         */

        if (
            category ===
            "completed"
        ) {

            const [projects] =
                await pool.query(`

                    SELECT

                        sr.id AS request_id,

                        sr.request_code,

                        sr.customer_name,

                        sr.customer_phone,

                        sr.status,

                        sr.completed_at,

                        sr.updated_at,

                        s.name_en AS service_name,

                        t.name AS technician_name


                    FROM service_requests sr

                    INNER JOIN services s
                        ON s.id = sr.service_id

                    LEFT JOIN users t
                        ON t.id = sr.technician_id
                        AND t.role = 'technician'


                    WHERE sr.status = 'completed'


                    ORDER BY

                        sr.completed_at DESC,

                        sr.updated_at DESC

                `);


            return res.json({

                success: true,

                data: {

                    files:
                        projects.map(
                            project => ({

                                type:
                                    "project",

                                request_id:
                                    project.request_id,

                                request_code:
                                    project.request_code,

                                customer_name:
                                    project.customer_name,

                                customer_phone:
                                    project.customer_phone,

                                service_name:
                                    project.service_name,

                                technician_name:
                                    project.technician_name,

                                status:
                                    project.status,

                                completed_at:
                                    project.completed_at,

                                updated_at:
                                    project.updated_at

                            })
                        )

                }

            });

        }


        /*
         * --------------------------------------------------
         * INVALID CATEGORY
         * --------------------------------------------------
         */

        return res.status(400).json({

            success: false,

            message:
                "Invalid dashboard category."

        });


    } catch (error) {

        console.error(
            "Super admin dashboard category files error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to retrieve dashboard category."

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