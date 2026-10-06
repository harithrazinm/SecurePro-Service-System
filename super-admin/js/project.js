/*
 * ======================================================
 * SECUREPRO SUPER ADMIN
 * PROJECT MONITORING
 * ======================================================
 *
 * READ-ONLY
 *
 * Displays:
 *
 * - Project information
 * - Project timeline
 * - Quotation
 * - Quotation payment proof
 * - Final invoice
 * - Invoice payment proof
 * - Technician reports
 * - Report media
 * - Customer photos
 * - Project media
 *
 * ======================================================
 */


/* ======================================================
   API
====================================================== */

const API_BASE =
    /^(localhost|127\.0\.0\.1)$/.test(
        location.hostname
    )

        ? "http://localhost:5001/api"

        : "/api";


const TOKEN_KEY =
    "securepro_super_admin_token";


const USER_KEY =
    "securepro_super_admin_user";


/* ======================================================
   HELPERS
====================================================== */

const $ = selector =>
    document.querySelector(selector);


function esc(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function date(value) {

    if (!value) {
        return "—";
    }

    const d =
        new Date(value);

    if (Number.isNaN(d.getTime())) {
        return "—";
    }

    return d.toLocaleString(
        "en-MY",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );

}


/* ======================================================
   PROJECT STATUS
====================================================== */

function status(value) {

    const labels = {

        pending:
            "Pending",

        assigned:
            "Assigned",

        in_progress:
            "In Progress",

        waiting_parts:
            "Waiting Parts",

        awaiting_payment:
            "Awaiting Payment",

        completed:
            "Completed",

        cancelled:
            "Cancelled"

    };

    return (
        labels[value] ||
        value ||
        "Unknown"
    );

}


/* ======================================================
   PAYMENT STATUS
====================================================== */

function paymentStatus(value) {

    const labels = {

        pending:
            "Pending Verification",

        verified:
            "Verified",

        rejected:
            "Rejected"

    };

    return (
        labels[value] ||
        value ||
        "—"
    );

}


/* ======================================================
   FILE URL
====================================================== */

const API_ORIGIN =
    API_BASE.replace(
        /\/api\/?$/,
        ""
    );


function fileUrl(path) {

    if (!path) {
        return "";
    }

    if (
        /^https?:\/\//i.test(path)
    ) {
        return path;
    }

    return (
        API_ORIGIN +
        (
            path.startsWith("/")
                ? path
                : `/${path}`
        )
    );

}


/* ======================================================
   DOCUMENT LINK
====================================================== */

function documentLink(
    url,
    label
) {

    if (!url) {

        return `
            <span class="muted">
                Not available
            </span>
        `;

    }

    return `
        <a
            class="doc"
            href="${esc(
                fileUrl(url)
            )}"
            target="_blank"
            rel="noopener"
        >
            ${esc(label)} ↗
        </a>
    `;

}


/* ======================================================
   AUTH
====================================================== */

function token() {

    return localStorage.getItem(
        TOKEN_KEY
    );

}


function setup() {

    try {

        const user =
            JSON.parse(
                localStorage.getItem(
                    USER_KEY
                ) || "{}"
            );

        $("#adminName").textContent =
            user.name ||
            "Super Admin";

        $("#topName").textContent =
            user.name ||
            "Super Admin";

    } catch {

        $("#adminName").textContent =
            "Super Admin";

        $("#topName").textContent =
            "Super Admin";

    }


    $("#logoutButton").onclick = () => {

        localStorage.removeItem(
            TOKEN_KEY
        );

        localStorage.removeItem(
            USER_KEY
        );

        window.location.href =
            "login.html";

    };

}


/* ======================================================
   TIMELINE
====================================================== */

function milestone(
    label,
    time,
    done,
    extra = ""
) {

    const displayTime =
        done

            ? (
                time
                    ? date(time)
                    : "Completed"
            )

            : "Waiting";


    return `

        <div
            class="
                timeline-item
                ${done ? "done" : "waiting"}
            "
        >

            <div class="timeline-dot">

                ${done ? "✓" : "○"}

            </div>


            <div>

                <strong>
                    ${esc(label)}
                </strong>


                <small>
                    ${esc(displayTime)}
                </small>


                ${extra}

            </div>

        </div>

    `;

}


/* ======================================================
   LOAD PROJECT
====================================================== */

async function load() {

    const id =
        new URLSearchParams(
            location.search
        ).get("id");


    if (!id) {

        showError(
            "No project ID was provided."
        );

        return;

    }


    try {

        const response =
            await fetch(
                `${API_BASE}/super-admin/projects/${encodeURIComponent(id)}`,
                {
                    method:
                        "GET",

                    headers: {

                        Authorization:
                            `Bearer ${token()}`

                    }

                }
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Unable to load project."
            );

        }


        render(
            result.data
        );


    } catch (error) {

        console.error(
            "Super Admin project error:",
            error
        );

        showError(
            error.message ||
            "Unable to load project."
        );

    }

}


/* ======================================================
   ERROR
====================================================== */

function showError(message) {

    const box =
        $("#errorBox");


    box.textContent =
        message ||
        "Unable to load project.";


    box.hidden = false;


    $("#projectContent").innerHTML =
        "";

}


/* ======================================================
   REPORT MEDIA
====================================================== */

function renderReportMedia(
    media,
    reportId
) {

    const items =
        media.filter(
            item =>
                String(
                    item.report_id
                ) ===
                String(
                    reportId
                )
        );


    if (!items.length) {

        return `
            <div class="report-media-empty">
                No attachments uploaded.
            </div>
        `;

    }


    return `

        <div class="report-media">

            <h4>
                Attachments
            </h4>


            <div class="report-file-list">

                ${items.map(item => {

                    const type =
                        String(
                            item.media_type ||
                            item.mime_type ||
                            ""
                        ).toLowerCase();


                    let icon =
                        "📄";


                    if (
                        type.includes(
                            "image"
                        )
                    ) {

                        icon =
                            "📷";

                    }
                    else if (
                        type.includes(
                            "video"
                        )
                    ) {

                        icon =
                            "🎥";

                    }
                    else if (
                        type.includes(
                            "pdf"
                        )
                    ) {

                        icon =
                            "📕";

                    }


                    return `

                        <div class="media-file">

                            <span class="media-file-icon">

                                ${icon}

                            </span>


                            <div class="media-file-info">

                                <strong>

                                    ${esc(
                                        item.file_name ||
                                        "Attachment"
                                    )}

                                </strong>


                                <small>

                                    ${esc(
                                        item.mime_type ||
                                        "File"
                                    )}

                                </small>

                            </div>


                            <a
                                class="doc"
                                href="${esc(
                                    fileUrl(
                                        item.file_path
                                    )
                                )}"
                                target="_blank"
                                rel="noopener"
                            >

                                View File ↗

                            </a>

                        </div>

                    `;

                }).join("")}

            </div>

        </div>

    `;

}


/* ======================================================
   REPORT
====================================================== */

function renderReport(
    report,
    index,
    media
) {

    const isFinal =
        (
            report.report_type ||
            "final"
        ) === "final";


    const reportNumber =
        report.progress_number ||
        index + 1;


    const title =
        isFinal
            ? "Final Report"
            : `Progress #${reportNumber}`;


    const reportTitle =
        report.report_title

            ? `
                <p class="report-title">

                    ${esc(
                        report.report_title
                    )}

                </p>
            `

            : "";


    function statusReport(value) {

        const labels = {

            submitted:
                "Submitted",

            approved:
                "Approved",

            rejected:
                "Rejected"

        };

        return (
            labels[value] ||
            value ||
            "—"
        );

    }


    const reportStatus =
        isFinal
            ? statusReport(
                report.status
            )
            : "Submitted";


    const reviewer =
        isFinal &&
        report.reviewed_by_name

            ? `
                <div class="report-reviewer">

                    Reviewed by
                    ${esc(
                        report.reviewed_by_name
                    )}

                </div>
            `

            : "";


    const remarks =
        isFinal &&
        report.review_remarks

            ? `
                <div class="remarks">

                    <strong>
                        Admin Remarks
                    </strong>

                    <p>

                        ${esc(
                            report.review_remarks
                        )}

                    </p>

                </div>
            `

            : "";


    return `

        <article
            class="
                report-history-item
                ${
                    isFinal
                        ? "final-report"
                        : "progress-report"
                }
            "
        >


            <!-- REPORT HEADER -->

            <div class="report-history-head">

                <div>

                    <span class="report-type-badge">

                        ${esc(title)}

                    </span>


                    ${reportTitle}

                </div>


                <span
                    class="
                        report-status-badge
                        ${esc(
                            isFinal
                                ? report.status || ""
                                : "submitted"
                        )}
                    "
                >

                    ${esc(
                        reportStatus
                    )}

                </span>

            </div>



            <!-- REPORT META -->

            <div class="report-history-meta">


                ${
                    report.reported_by

                        ? `
                            <div>

                                <span>
                                    Written By
                                </span>

                                <strong>

                                    ${esc(
                                        report.reported_by
                                    )}

                                </strong>

                            </div>
                        `

                        : ""
                }


                <div>

                    <span>
                        Submitted
                    </span>

                    <strong>

                        ${esc(
                            date(
                                report.submitted_at
                            )
                        )}

                    </strong>

                </div>


                ${
                    isFinal

                        ? `
                            <div>

                                <span>
                                    Reviewed
                                </span>

                                <strong>

                                    ${esc(
                                        date(
                                            report.reviewed_at
                                        )
                                    )}

                                </strong>

                            </div>
                        `

                        : ""
                }


                <div>

                    <span>
                        Technician
                    </span>

                    <strong>

                        ${esc(
                            report.technician_name ||
                            "—"
                        )}

                    </strong>

                </div>

            </div>



            <!-- REPORT CONTENT -->

            <div class="report-copy-grid">


                <div>

                    <h4>
                        Work Performed
                    </h4>

                    <p>

                        ${esc(
                            report.work_performed ||
                            "—"
                        )}

                    </p>

                </div>


                <div>

                    <h4>
                        Findings
                    </h4>

                    <p>

                        ${esc(
                            report.findings ||
                            "—"
                        )}

                    </p>

                </div>


                <div>

                    <h4>
                        Materials Used
                    </h4>

                    <p>

                        ${esc(
                            report.materials_used ||
                            "—"
                        )}

                    </p>

                </div>


                <div>

                    <h4>
                        Technician Notes
                    </h4>

                    <p>

                        ${esc(
                            report.technician_notes ||
                            "—"
                        )}

                    </p>

                </div>

            </div>



            <!-- MAIN REPORT FILE -->

            ${
                report.report_file_path

                    ? `
                        <div class="report-main-file">

                            ${documentLink(
                                report.report_file_path,
                                "View Report File"
                            )}

                        </div>
                    `

                    : ""
            }



            <!-- REPORT ATTACHMENTS -->

            ${renderReportMedia(
                media,
                report.id
            )}



            <!-- REVIEWER -->

            ${reviewer}



            <!-- REMARKS -->

            ${remarks}

        </article>

    `;

}


/* ======================================================
   RENDER PROJECT
====================================================== */

function render(data) {

    const p =
        data.project || {};


    const reports =
        Array.isArray(
            data.reports
        )
            ? data.reports
            : [];


    const media =
        Array.isArray(
            data.media
        )
            ? data.media
            : [];


    const customerPhotos =
        Array.isArray(
            data.customer_photos
        )
            ? data.customer_photos
            : [];


    const invoices =
        Array.isArray(
            data.invoices
        )
            ? data.invoices
            : [];


    /*
     * ==================================================
     * QUOTATION PAYMENT PROOFS
     * ==================================================
     *
     * Comes from quotations table.
     */

    const quotationPaymentProofs =
        Array.isArray(
            data.quotation_payment_proofs
        )
            ? data.quotation_payment_proofs
            : [];


    /*
     * ==================================================
     * INVOICE PAYMENT PROOFS
     * ==================================================
     *
     * Comes from invoice_payments table.
     */

    const invoicePaymentProofs =
        Array.isArray(
            data.invoice_payment_proofs
        )
            ? data.invoice_payment_proofs
            : [];


    /*
     * Latest quotation payment
     */

    const latestQuotationPayment =
        quotationPaymentProofs.length
            ? quotationPaymentProofs[0]
            : null;


    /*
     * Latest invoice
     */

    const latestInvoice =
        invoices.length
            ? invoices[0]
            : null;


    /*
     * Latest invoice payment
     */

    const latestInvoicePayment =
        invoicePaymentProofs.length
            ? invoicePaymentProofs[0]
            : null;


    /* ==================================================
       REPORT GROUPING
    ================================================== */

    const progressReports =
        reports
            .filter(
                report =>
                    (
                        report.report_type ||
                        "final"
                    ) === "progress"
            )
            .sort(
                (a, b) =>
                    Number(
                        a.progress_number || 0
                    ) -
                    Number(
                        b.progress_number || 0
                    )
            );


    const finalReports =
        reports
            .filter(
                report =>
                    (
                        report.report_type ||
                        "final"
                    ) === "final"
            )
            .sort(
                (a, b) =>
                    new Date(
                        b.created_at || 0
                    ) -
                    new Date(
                        a.created_at || 0
                    )
            );


    const finalReport =
        finalReports[0] ||
        null;


    const latestReport =
        reports.length

            ? [...reports].sort(
                (a, b) =>
                    new Date(
                        b.created_at || 0
                    ) -
                    new Date(
                        a.created_at || 0
                    )
            )[0]

            : null;


    /* ==================================================
       QUOTATION STATUS
    ================================================== */

    const quotationUploaded =
        Boolean(
            p.quotation_file_url
        );


    const quotationSent =
        Boolean(
            p.quotation_sent_at
        );


    /* ==================================================
       PAYMENT STATUS
    ================================================== */

    const quotationPaymentSubmitted =
        Boolean(
            latestQuotationPayment &&
            latestQuotationPayment.payment_proof_url
        );


    const invoicePaymentSubmitted =
        Boolean(
            latestInvoicePayment &&
            latestInvoicePayment.payment_proof_url
        );


    /* ==================================================
       TECHNICIAN STATUS
    ================================================== */

    const assigned =
        Boolean(
            p.technician_id
        );


    const submitted =
        reports.length > 0;


    const started =
        Boolean(
            p.technician_started_at
        ) ||
        p.status === "in_progress" ||
        p.status === "awaiting_payment" ||
        p.status === "completed" ||
        submitted;


    const approved =
        Boolean(
            finalReport &&
            finalReport.status === "approved"
        );


    const completed =
        p.status === "completed" &&
        Boolean(
            p.completed_at
        );


    /* ==================================================
       REPORT HISTORY
    ================================================== */

    const progressHistory =
        progressReports
            .map(
                (report, index) =>
                    renderReport(
                        report,
                        index,
                        media
                    )
            )
            .join("");


    const finalHistory =
        finalReport

            ? renderReport(
                finalReport,
                0,
                media
            )

            : "";


    const reportHistory =
        progressHistory +
        finalHistory;


    /* ==================================================
       INVOICE HISTORY
    ================================================== */

    const invoiceHtml =
        invoices.length

            ? invoices.map(
                invoice => `

                    <div class="document-item">

                        <div>

                            <span>
                                Invoice
                            </span>

                            <strong>

                                ${esc(
                                    invoice.invoice_number ||
                                    "Invoice"
                                )}

                            </strong>

                        </div>


                        <div>

                            <span>
                                Status
                            </span>

                            <strong>

                                ${esc(
                                    String(
                                        invoice.status ||
                                        "—"
                                    ).replaceAll(
                                        "_",
                                        " "
                                    )
                                )}

                            </strong>

                        </div>


                        <div>

                            <span>
                                Uploaded
                            </span>

                            <strong>

                                ${esc(
                                    date(
                                        invoice.created_at
                                    )
                                )}

                            </strong>

                        </div>


                        <div>

                            ${documentLink(
                                invoice.invoice_file_url,
                                "View Invoice PDF"
                            )}

                        </div>

                    </div>

                `
            ).join("")

            : `

                <div class="empty">

                    No final invoice uploaded yet.

                </div>

            `;


    /* ==================================================
       INVOICE PAYMENT HISTORY
    ================================================== */

    const invoicePaymentHtml =
        invoicePaymentProofs.length

            ? invoicePaymentProofs.map(
                proof => `

                    <div class="document-item">

                        <div>

                            <span>
                                Invoice Payment
                            </span>

                            <strong>

                                ${esc(
                                    proof.invoice_number ||
                                    "Invoice"
                                )}

                            </strong>

                        </div>


                        <div>

                            <span>
                                Status
                            </span>

                            <strong>

                                ${esc(
                                    paymentStatus(
                                        proof.status
                                    )
                                )}

                            </strong>

                        </div>


                        <div>

                            <span>
                                Submitted
                            </span>

                            <strong>

                                ${esc(
                                    date(
                                        proof.submitted_at
                                    )
                                )}

                            </strong>

                        </div>


                        <div>

                            ${documentLink(
                                proof.payment_proof_url,
                                "View Invoice Payment Proof"
                            )}

                        </div>

                    </div>

                `
            ).join("")

            : `

                <div class="empty">

                    No invoice payment proof uploaded yet.

                </div>

            `;


    /* ==================================================
       QUOTATION PAYMENT HISTORY
    ================================================== */

    const quotationPaymentHtml =
        quotationPaymentProofs.length

            ? quotationPaymentProofs.map(
                proof => `

                    <div class="document-item">

                        <div>

                            <span>
                                Quotation Payment
                            </span>

                            <strong>

                                ${esc(
                                    proof.quotation_number ||
                                    "Quotation"
                                )}

                            </strong>

                        </div>


                        <div>

                            <span>
                                Status
                            </span>

                            <strong>

                                ${esc(
                                    paymentStatus(
                                        proof.payment_status
                                    )
                                )}

                            </strong>

                        </div>


                        <div>

                            <span>
                                Uploaded
                            </span>

                            <strong>

                                ${esc(
                                    date(
                                        proof.payment_proof_uploaded_at
                                    )
                                )}

                            </strong>

                        </div>


                        <div>

                            ${documentLink(
                                proof.payment_proof_url,
                                "View Quotation Payment Proof"
                            )}

                        </div>

                    </div>

                `
            ).join("")

            : `

                <div class="empty">

                    No quotation payment proof uploaded yet.

                </div>

            `;


    /* ==================================================
       CUSTOMER PHOTOS
    ================================================== */

    const customerPhotosHtml =
        customerPhotos.length

            ? `

                <section class="panel">

                    <div class="panel-head">

                        <div>

                            <span class="eyebrow">
                                CUSTOMER FILES
                            </span>

                            <h2>
                                Customer Photos
                            </h2>

                        </div>

                    </div>


                    <div class="media-list">

                        ${customerPhotos.map(
                            photo => `

                                <a
                                    class="media-item"
                                    href="${esc(
                                        fileUrl(
                                            photo.file_path
                                        )
                                    )}"
                                    target="_blank"
                                    rel="noopener"
                                >

                                    📷

                                    ${esc(
                                        photo.file_name ||
                                        "Customer Photo"
                                    )}

                                    ↗

                                </a>

                            `
                        ).join("")}

                    </div>

                </section>

            `

            : "";


    /* ==================================================
       ALL PROJECT MEDIA
    ================================================== */

    const allMediaHtml =
        media.length

            ? `

                <section class="panel">

                    <div class="panel-head">

                        <div>

                            <span class="eyebrow">
                                ALL PROJECT MEDIA
                            </span>

                            <h2>
                                Photos / Videos
                            </h2>

                        </div>

                    </div>


                    <div class="media-list">

                        ${media.map(
                            item => {

                                const type =
                                    String(
                                        item.media_type ||
                                        item.mime_type ||
                                        ""
                                    ).toLowerCase();


                                const icon =
                                    type.includes(
                                        "video"
                                    )
                                        ? "🎥"
                                        : "📷";


                                return `

                                    <a
                                        class="media-item"
                                        target="_blank"
                                        rel="noopener"
                                        href="${esc(
                                            fileUrl(
                                                item.file_path
                                            )
                                        )}"
                                    >

                                        ${icon}

                                        ${esc(
                                            item.file_name ||
                                            "View File"
                                        )}

                                        ↗

                                    </a>

                                `;

                            }
                        ).join("")}

                    </div>

                </section>

            `

            : "";


    /* ==================================================
       PAGE
    ================================================== */

    $("#projectContent").innerHTML = `


        <!-- =========================================
             PROJECT HEADER
        ========================================== -->

        <section class="project-heading">

            <div>

                <span class="eyebrow">
                    PROJECT
                </span>


                <h2>

                    ${esc(
                        p.request_code ||
                        "Project"
                    )}

                </h2>


                <p>

                    ${esc(
                        p.service_name ||
                        "Service"
                    )}

                    ·

                    ${esc(
                        p.customer_name ||
                        "Customer"
                    )}

                </p>

            </div>


            <span class="big-status">

                ${esc(
                    status(
                        p.status
                    )
                )}

            </span>

        </section>



        <!-- =========================================
             TIMELINE
        ========================================== -->

        <section class="panel">

            <div class="panel-head">

                <div>

                    <span class="eyebrow">
                        PROGRESS
                    </span>

                    <h2>
                        Project Timeline
                    </h2>

                </div>

            </div>


            <div class="timeline">


                <!-- QUOTATION -->

                ${milestone(
                    "Quotation Uploaded",

                    p.quotation_uploaded_at,

                    quotationUploaded,

                    quotationUploaded

                        ? `
                            <div>

                                ${documentLink(
                                    p.quotation_file_url,
                                    "View Quotation"
                                )}

                            </div>
                        `

                        : ""
                )}



                <!-- QUOTATION SENT -->

                ${milestone(
                    "Quotation Sent to Customer",

                    p.quotation_sent_at,

                    quotationSent
                )}



                <!-- QUOTATION PAYMENT -->

                ${milestone(
                    "Quotation Payment Proof",

                    latestQuotationPayment?.payment_proof_uploaded_at,

                    quotationPaymentSubmitted,

                    quotationPaymentSubmitted

                        ? `
                            <div>

                                ${documentLink(
                                    latestQuotationPayment.payment_proof_url,
                                    "View Quotation Payment Proof"
                                )}

                            </div>

                            <div class="muted">

                                Status:
                                ${esc(
                                    paymentStatus(
                                        latestQuotationPayment.payment_status
                                    )
                                )}

                            </div>
                        `

                        : ""
                )}



                <!-- TECHNICIAN ASSIGNED -->

                ${milestone(
                    "Technician Assigned",

                    p.assigned_at,

                    assigned,

                    p.technician_name

                        ? `
                            <div class="muted">

                                ${esc(
                                    p.technician_name
                                )}

                            </div>
                        `

                        : ""
                )}



                <!-- TECHNICIAN STARTED -->

                ${milestone(
                    "Technician Started",

                    p.technician_started_at,

                    started
                )}



                <!-- TECHNICIAN REPORT -->

                ${milestone(
                    "Technician Submitted Report",

                    latestReport?.submitted_at,

                    submitted,

                    latestReport

                        ? `
                            <div class="muted">

                                Latest:

                                ${
                                    latestReport.report_type ===
                                    "progress"

                                        ? `Progress #${esc(
                                            latestReport.progress_number ||
                                            "—"
                                        )}`

                                        : "Final Report"
                                }

                            </div>
                        `

                        : ""
                )}



                <!-- ADMIN APPROVED -->

                ${milestone(
                    "Admin Approved Report",

                    finalReport?.reviewed_at,

                    approved,

                    approved

                        ? `
                            <div class="muted">

                                Reviewed by
                                ${esc(
                                    finalReport.reviewed_by_name ||
                                    "Admin"
                                )}

                            </div>
                        `

                        : ""
                )}



                <!-- FINAL INVOICE -->

                ${milestone(
                    "Final Invoice Uploaded",

                    latestInvoice?.created_at,

                    Boolean(
                        latestInvoice &&
                        latestInvoice.invoice_file_url
                    ),

                    latestInvoice

                        ? `
                            <div>

                                ${documentLink(
                                    latestInvoice.invoice_file_url,
                                    "View Invoice"
                                )}

                            </div>
                        `

                        : ""
                )}



                <!-- INVOICE PAYMENT -->

                ${milestone(
                    "Invoice Payment Proof",

                    latestInvoicePayment?.submitted_at,

                    invoicePaymentSubmitted,

                    invoicePaymentSubmitted

                        ? `
                            <div>

                                ${documentLink(
                                    latestInvoicePayment.payment_proof_url,
                                    "View Invoice Payment Proof"
                                )}

                            </div>

                            <div class="muted">

                                Status:
                                ${esc(
                                    paymentStatus(
                                        latestInvoicePayment.status
                                    )
                                )}

                            </div>
                        `

                        : ""
                )}



                <!-- COMPLETED -->

                ${milestone(
                    "Project Completed",

                    p.completed_at,

                    completed
                )}

            </div>

        </section>



        <!-- =========================================
             PROJECT INFORMATION
        ========================================== -->

        <section class="panel">

            <div class="panel-head">

                <div>

                    <span class="eyebrow">
                        DETAILS
                    </span>

                    <h2>
                        Project Information
                    </h2>

                </div>

            </div>


            <div class="info-grid">


                <div>

                    <span>
                        Customer
                    </span>

                    <strong>

                        ${esc(
                            p.customer_name ||
                            "—"
                        )}

                    </strong>

                </div>


                <div>

                    <span>
                        Phone
                    </span>

                    <strong>

                        ${esc(
                            p.customer_phone ||
                            "—"
                        )}

                    </strong>

                </div>


                <div>

                    <span>
                        Email
                    </span>

                    <strong>

                        ${esc(
                            p.customer_email ||
                            "—"
                        )}

                    </strong>

                </div>


                <div>

                    <span>
                        Service
                    </span>

                    <strong>

                        ${esc(
                            p.service_name ||
                            "—"
                        )}

                    </strong>

                </div>


                <div class="full">

                    <span>
                        Address
                    </span>

                    <strong>

                        ${esc(
                            p.customer_address ||
                            p.address ||
                            "—"
                        )}

                    </strong>

                </div>


                <div>

                    <span>
                        Technician
                    </span>

                    <strong>

                        ${esc(
                            p.technician_name ||
                            "Not assigned"
                        )}

                    </strong>

                </div>


                <div>

                    <span>
                        Created
                    </span>

                    <strong>

                        ${esc(
                            date(
                                p.created_at
                            )
                        )}

                    </strong>

                </div>

            </div>

        </section>



        <!-- =========================================
             QUOTATION
        ========================================== -->

        <section class="panel">

            <div class="panel-head">

                <div>

                    <span class="eyebrow">
                        QUOTATION
                    </span>

                    <h2>
                        Quotation Document
                    </h2>

                </div>

            </div>


            <div class="document-grid">


                <div>

                    <span>
                        Quotation Number
                    </span>

                    <strong>

                        ${esc(
                            p.quotation_number ||
                            "No quotation"
                        )}

                    </strong>

                </div>


                <div>

                    <span>
                        Status
                    </span>

                    <strong>

                        ${esc(
                            p.quotation_status ||
                            "—"
                        )}

                    </strong>

                </div>


                <div>

                    <span>
                        Uploaded
                    </span>

                    <strong>

                        ${esc(
                            date(
                                p.quotation_uploaded_at
                            )
                        )}

                    </strong>

                </div>


                <div>

                    ${documentLink(
                        p.quotation_file_url,
                        "View Quotation PDF"
                    )}

                </div>

            </div>

        </section>



        <!-- =========================================
             QUOTATION PAYMENT
        ========================================== -->

        <section class="panel">

            <div class="panel-head">

                <div>

                    <span class="eyebrow">
                        QUOTATION PAYMENT
                    </span>

                    <h2>
                        Quotation Payment Proof
                    </h2>

                </div>

            </div>


            ${
                quotationPaymentProofs.length

                    ? `

                        <div class="document-grid">

                            ${quotationPaymentHtml}

                        </div>

                    `

                    : `

                        <div class="empty">

                            No quotation payment proof uploaded yet.

                        </div>

                    `
            }

        </section>



        <!-- =========================================
             FINAL INVOICE
        ========================================== -->

        <section class="panel">

            <div class="panel-head">

                <div>

                    <span class="eyebrow">
                        FINAL INVOICE
                    </span>

                    <h2>
                        Invoice Documents
                    </h2>

                </div>

            </div>


            <div class="document-history">

                ${invoiceHtml}

            </div>

        </section>



        <!-- =========================================
             INVOICE PAYMENT
        ========================================== -->

        <section class="panel">

            <div class="panel-head">

                <div>

                    <span class="eyebrow">
                        INVOICE PAYMENT
                    </span>

                    <h2>
                        Final Invoice Payment Proof
                    </h2>

                </div>

            </div>


            ${
                invoicePaymentProofs.length

                    ? `

                        <div class="document-history">

                            ${invoicePaymentHtml}

                        </div>

                    `

                    : `

                        <div class="empty">

                            No invoice payment proof uploaded yet.

                        </div>

                    `
            }

        </section>



        <!-- =========================================
             TECHNICIAN REPORT HISTORY
        ========================================== -->

        <section class="panel">

            <div class="panel-head">

                <div>

                    <span class="eyebrow">
                        TECHNICIAN REPORT HISTORY
                    </span>

                    <h2>
                        Service Progress Reports
                    </h2>

                </div>

            </div>


            ${
                reportHistory

                    ? `

                        <div class="report-history">

                            ${reportHistory}

                        </div>

                    `

                    : `

                        <div class="empty">

                            No technician report submitted yet.

                        </div>

                    `
            }

        </section>



        <!-- =========================================
             CUSTOMER PHOTOS
        ========================================== -->

        ${customerPhotosHtml}



        <!-- =========================================
             ALL PROJECT MEDIA
        ========================================== -->

        ${allMediaHtml}

    `;

}


/* ======================================================
   START
====================================================== */

if (!token()) {

    window.location.href =
        "login.html";

}
else {

    setup();

    load();

}