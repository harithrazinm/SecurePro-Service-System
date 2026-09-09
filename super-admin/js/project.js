const API_BASE = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
    ? "http://localhost:5001/api"
    : "https://securepro-service-system.onrender.com/api";
const TOKEN_KEY = "securepro_super_admin_token", USER_KEY = "securepro_super_admin_user";
const $ = s => document.querySelector(s);
const esc = v => String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const date = v => { if (!v) return "—"; const d = new Date(v); return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" }) };
const status = v => ({ pending: "Pending", assigned: "Assigned", in_progress: "In Progress", waiting_parts: "Waiting Parts", completed: "Completed", cancelled: "Cancelled" })[v] || v || "—";
const token = () => localStorage.getItem(TOKEN_KEY);

function setup() {
    try { const u = JSON.parse(localStorage.getItem(USER_KEY) || "{}"); $("#adminName").textContent = u.name || "Super Admin"; $("#topName").textContent = u.name || "Super Admin" } catch { }
    $("#logoutButton").onclick = () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); location.href = "login.html" };
}
function milestone(label, time, done, extra = "") {
    const displayTime = done
        ? (time ? date(time) : (label === "Technician Started" ? "Started" : "—"))
        : "Waiting";
    return `<div class="timeline-item ${done ? "done" : "waiting"}"><div class="timeline-dot">${done ? "✓" : "○"}</div><div><strong>${esc(label)}</strong><small>${esc(displayTime)}</small>${extra}</div></div>`;
}
function documentLink(url, label) { return url ? `<a class="doc" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)} ↗</a>` : "<span class='muted'>Not available</span>" }
async function load() {
    const id = new URLSearchParams(location.search).get("id");
    if (!id) { showError("No project ID was provided."); return }
    try {
        const r = await fetch(`${API_BASE}/super-admin/projects/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token()}` } });
        const d = await r.json(); if (!r.ok || !d.success) throw new Error(d.message || "Unable to load project.");
        render(d.data);
    } catch (e) { showError(e.message) }
}
function showError(msg) { $("#errorBox").textContent = msg; $("#errorBox").hidden = false; $("#projectContent").innerHTML = "" }
function render(data) {

    const p = data.project;
    const reports = data.reports || [];
    const media = data.media || [];

    /*
     * --------------------------------------------------
     * REPORT GROUPING
     * --------------------------------------------------
     */

    const progressReports = reports
        .filter(r => (r.report_type || "final") === "progress")
        .sort((a, b) => {

            const numberA = Number(a.progress_number || 0);
            const numberB = Number(b.progress_number || 0);

            if (numberA !== numberB) {
                return numberA - numberB;
            }

            return new Date(a.created_at || 0) -
                   new Date(b.created_at || 0);
        });

    const finalReports = reports
        .filter(r => (r.report_type || "final") === "final")
        .sort((a, b) =>
            new Date(b.created_at || 0) -
            new Date(a.created_at || 0)
        );

    const finalReport = finalReports[0] || null;

    /*
     * Latest report for timeline purposes only.
     */
    const latestReport = reports.length
        ? [...reports].sort((a, b) =>
            new Date(b.created_at || 0) -
            new Date(a.created_at || 0)
        )[0]
        : null;


    /*
     * --------------------------------------------------
     * PROJECT STATUS
     * --------------------------------------------------
     */

    const quotationUploaded =
        Boolean(p.quotation_file_url);

    const quotationSent =
        Boolean(p.quotation_sent_at);

    const payment =
        Boolean(p.payment_proof_url);

    const assigned =
        Boolean(p.technician_id);

    const submitted =
        reports.length > 0;

    const started =
        Boolean(p.technician_started_at) ||
        p.status === "in_progress" ||
        p.status === "completed" ||
        submitted;

    const approved =
        Boolean(
            finalReport &&
            finalReport.status === "approved"
        );

    const completed =
        p.status === "completed" &&
        Boolean(p.completed_at);


    /*
     * --------------------------------------------------
     * MEDIA FOR SPECIFIC REPORT
     * --------------------------------------------------
     */

    function getReportMedia(reportId) {

        return media.filter(
            m => String(m.report_id || "") === String(reportId || "")
        );

    }


    /*
     * --------------------------------------------------
     * RENDER REPORT MEDIA
     * --------------------------------------------------
     */

    function renderReportMedia(reportId) {

        const reportMedia =
            getReportMedia(reportId);

        if (!reportMedia.length) {
            return `
                <div class="report-media-empty">
                    No photos or videos uploaded.
                </div>
            `;
        }

        return `
            <div class="report-media">

                <h4>Photos / Videos</h4>

                <div class="report-file-list">

                    ${reportMedia.map(m => `

                        <a
                            class="media-item"
                            href="${esc(m.file_path)}"
                            target="_blank"
                            rel="noopener"
                        >

                            ${
                                m.media_type === "video"
                                    ? "🎥"
                                    : "📷"
                            }

                            ${esc(
                                m.file_name ||
                                "View File"
                            )}

                            ↗

                        </a>

                    `).join("")}

                </div>

            </div>
        `;

    }


    /*
     * --------------------------------------------------
     * RENDER SINGLE REPORT
     * --------------------------------------------------
     */

    function renderReport(
        report,
        index,
        isFinal = false
    ) {

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
                        ${esc(report.report_title)}
                    </p>
                  `
                : "";

        const statusLabel =
            isFinal
                ? esc(report.status || "—")
                : "Submitted";

        const writer =
            report.reported_by
                ? `
                    <div>
                        <span>Written By</span>
                        <strong>
                            ${esc(report.reported_by)}
                        </strong>
                    </div>
                  `
                : "";

        const reviewInfo =
            isFinal
                ? `
                    <div>
                        <span>Reviewed</span>
                        <strong>
                            ${esc(
                                date(report.reviewed_at)
                            )}
                        </strong>
                    </div>
                  `
                : "";

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
                    ${isFinal
                        ? "final-report"
                        : "progress-report"}
                "
            >

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
                            ${isFinal
                                ? esc(
                                    report.status || ""
                                  )
                                : "submitted"}
                        "
                    >

                        ${statusLabel}

                    </span>

                </div>


                <div class="report-history-meta">

                    ${writer}

                    <div>

                        <span>Submitted</span>

                        <strong>
                            ${esc(
                                date(
                                    report.submitted_at
                                )
                            )}
                        </strong>

                    </div>

                    ${reviewInfo}

                    <div>

                        <span>Technician</span>

                        <strong>
                            ${esc(
                                report.technician_name ||
                                p.technician_name ||
                                "—"
                            )}
                        </strong>

                    </div>

                </div>


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


                ${
                    report.report_file_path
                        ? `
                            <div
                                class="report-main-file"
                            >

                                ${documentLink(
                                    report.report_file_path,
                                    "View Report File"
                                )}

                            </div>
                          `
                        : ""
                }


                ${renderReportMedia(report.id)}


                ${reviewer}

                ${remarks}

            </article>

        `;

    }


    /*
     * --------------------------------------------------
     * BUILD COMPLETE REPORT HISTORY
     * --------------------------------------------------
     */

    const progressHistory =
        progressReports
            .map((report, index) =>
                renderReport(
                    report,
                    index,
                    false
                )
            )
            .join("");


    const finalHistory =
        finalReport
            ? renderReport(
                finalReport,
                0,
                true
            )
            : "";


    const reportHistory =
        progressHistory +
        finalHistory;


    /*
     * --------------------------------------------------
     * PAGE
     * --------------------------------------------------
     */

    $("#projectContent").innerHTML = `

        <section class="project-heading">

            <div>

                <span class="eyebrow">
                    PROJECT
                </span>

                <h2>
                    ${esc(p.request_code)}
                </h2>

                <p>
                    ${esc(
                        p.service_name ||
                        "Service"
                    )}
                    ·
                    ${esc(p.customer_name)}
                </p>

            </div>

            <span class="big-status">
                ${esc(status(p.status))}
            </span>

        </section>


        <div class="two-col">


            <!-- PROJECT TIMELINE -->

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


                    ${milestone(
                        "Quotation Sent to Customer",
                        p.quotation_sent_at,
                        quotationSent
                    )}


                    ${milestone(
                        "Payment Received / Proof Uploaded",
                        p.payment_proof_uploaded_at,
                        payment,
                        payment
                            ? `
                                <div>
                                    ${documentLink(
                                        p.payment_proof_url,
                                        "View Payment Proof"
                                    )}
                                </div>
                              `
                            : ""
                    )}


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


                    ${milestone(
                        "Technician Started",
                        p.technician_started_at,
                        started
                    )}


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
                                            ? `Progress #${
                                                esc(
                                                    latestReport
                                                        .progress_number ||
                                                    "—"
                                                )
                                            }`
                                            : "Final Report"
                                    }

                                </div>
                              `
                            : ""
                    )}


                    ${milestone(
                        "Admin Approved Report",
                        finalReport?.reviewed_at,
                        approved,
                        approved
                            ? `
                                <div class="muted">

                                    Reviewed by
                                    ${esc(
                                        finalReport
                                            .reviewed_by_name ||
                                        "Admin"
                                    )}

                                </div>
                              `
                            : ""
                    )}


                    ${milestone(
                        "Project Completed",
                        p.completed_at,
                        completed
                    )}

                </div>

            </section>


            <!-- PROJECT INFORMATION -->

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
                        <span>Customer</span>
                        <strong>
                            ${esc(
                                p.customer_name
                            )}
                        </strong>
                    </div>


                    <div>
                        <span>Phone</span>
                        <strong>
                            ${esc(
                                p.customer_phone
                            )}
                        </strong>
                    </div>


                    <div>
                        <span>Email</span>
                        <strong>
                            ${esc(
                                p.customer_email ||
                                "—"
                            )}
                        </strong>
                    </div>


                    <div>
                        <span>Service</span>
                        <strong>
                            ${esc(
                                p.service_name
                            )}
                        </strong>
                    </div>


                    <div class="full">
                        <span>Address</span>
                        <strong>
                            ${esc(
                                p.customer_address ||
                                "—"
                            )}
                        </strong>
                    </div>


                    <div>
                        <span>Technician</span>
                        <strong>
                            ${esc(
                                p.technician_name ||
                                "Not assigned"
                            )}
                        </strong>
                    </div>


                    <div>
                        <span>Created</span>
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

        </div>


        <!-- QUOTATION & PAYMENT -->

        <section class="panel">

            <div class="panel-head">

                <div>

                    <span class="eyebrow">
                        QUOTATION & PAYMENT
                    </span>

                    <h2>
                        Documents
                    </h2>

                </div>

            </div>


            <div class="document-grid">


                <div>

                    <span>
                        Quotation
                    </span>

                    <strong>
                        ${esc(
                            p.quotation_number ||
                            "No quotation"
                        )}
                    </strong>

                    ${documentLink(
                        p.quotation_file_url,
                        "View Quotation PDF"
                    )}

                    <small>
                        Uploaded:
                        ${esc(
                            date(
                                p.quotation_uploaded_at
                            )
                        )}
                    </small>

                    <small>
                        Sent:
                        ${esc(
                            date(
                                p.quotation_sent_at
                            )
                        )}
                    </small>

                </div>


                <div>

                    <span>
                        Payment Proof
                    </span>

                    <strong>
                        ${esc(
                            p.payment_status ||
                            "not_received"
                        )}
                    </strong>

                    ${documentLink(
                        p.payment_proof_url,
                        "View Payment Proof"
                    )}

                    <small>
                        Uploaded:
                        ${esc(
                            date(
                                p.payment_proof_uploaded_at
                            )
                        )}
                    </small>

                </div>

            </div>

        </section>


        <!-- COMPLETE TECHNICIAN REPORT HISTORY -->

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


        <!-- ALL PROJECT MEDIA -->

        ${
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

                            ${media.map(m => `

                                <a
                                    class="media-item"
                                    target="_blank"
                                    rel="noopener"
                                    href="${esc(
                                        m.file_path
                                    )}"
                                >

                                    ${
                                        m.media_type === "video"
                                            ? "🎥"
                                            : "📷"
                                    }

                                    ${esc(
                                        m.file_name
                                    )}

                                    ↗

                                </a>

                            `).join("")}

                        </div>

                    </section>
                  `
                : ""
        }

    `;
}
if (!token()) location.href = "login.html"; else { setup(); load(); }
