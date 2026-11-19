/*
 * ======================================================
 * SECUREPRO SUPER ADMIN
 * DASHBOARD
 * ======================================================
 *
 * READ-ONLY
 *
 * Dashboard:
 *
 * - Summary
 * - Recent projects
 * - Quotation files
 * - Invoice files
 * - Payment proofs
 * - Completed projects
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

let dashboardUnreadNotificationCount = 0;


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


function statusLabel(value) {

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


function paymentLabel(value) {

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
   AUTH
====================================================== */

function token() {

    return localStorage.getItem(
        TOKEN_KEY
    );

}


function setupProfile() {

    try {

        const user =
            JSON.parse(
                localStorage.getItem(
                    USER_KEY
                ) || "{}"
            );


        const name =
            user.name ||
            "Super Admin";


        $("#adminName").textContent =
            name;

        $("#topName").textContent =
            name;

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


async function loadOverdueSummary() {
    try {
        const response = await fetch(`${API_BASE}/super-admin/projects`, {
            headers: { Authorization: `Bearer ${token()}` },
            cache: "no-store"
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Unable to check overdue requests.");
        const now = Date.now();
        const ids = new Set((Array.isArray(result.data) ? result.data : [])
            .filter(project => {
                if (["completed", "cancelled", "canceled"].includes(String(project.status || "").toLowerCase())) return false;
                const activity = new Date(project.updated_at || project.created_at || "");
                return !Number.isNaN(activity.getTime()) && now - activity.getTime() >= 48 * 60 * 60 * 1000;
            })
            .map(project => String(project.id)));
        const banner = $("#overdueDashboardAlert");
        const label = $("#overdueDashboardText");
        if (!banner || !label) return;
        banner.hidden = ids.size === 0;
        label.textContent = `⚠ ${ids.size} open request${ids.size === 1 ? "" : "s"} untouched for 48+ hours.`;
    } catch (error) {
        console.error("Super Admin overdue request summary error:", error);
    }
}


async function loadNotificationInbox() {
    const list = $("#notificationInbox");
    const count = $("#inboxCount");
    if (!list || !count) return;

    let projects = null;
    try {
        const projectsResponse = await fetch(`${API_BASE}/super-admin/projects`, {
            headers: { Authorization: `Bearer ${token()}` },
            cache: "no-store"
        });
        const projectsResult = await projectsResponse.json();
        if (!projectsResponse.ok || !projectsResult.success) {
            throw new Error(projectsResult.message || "Unable to load dashboard summaries.");
        }

        projects = Array.isArray(projectsResult.data) ? projectsResult.data : [];
        renderDashboardSummaries(projects);

        const notificationsResponse = await fetch(`${API_BASE}/super-admin/notifications`, {
            headers: { Authorization: `Bearer ${token()}` },
            cache: "no-store"
        });
        const notificationsResult = await notificationsResponse.json();
        if (!notificationsResponse.ok || !notificationsResult.success) {
            throw new Error(notificationsResult.message || "Unable to load notification inbox.");
        }

        const items = Array.isArray(notificationsResult.data?.notifications)
            ? notificationsResult.data.notifications
            : [];
        const unreadCount = Number(notificationsResult.data?.unread_count || 0);
        dashboardUnreadNotificationCount = unreadCount;
        count.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
        count.hidden = unreadCount === 0;
        const toggle = $("#notificationToggle");
        if (toggle) toggle.setAttribute("aria-label", `Notifications, ${unreadCount} unread alert${unreadCount === 1 ? "" : "s"}`);
        list.innerHTML = items.length
            ? items.slice(0, 8).map(item => {
                const notificationDate = notificationTimestamp(item.created_at);
                const notificationDateTime = notificationDateTimeValue(item.created_at);
                const destination = item.type === "quotation" ? "quotation-approval.html" : item.link;
                return `
                <a class="notification-inbox-item ${item.read_at ? "is-read" : "is-unread"}" href="${esc(destination)}" data-notification-id="${esc(item.id)}">
                    <span class="notification-inbox-icon" aria-hidden="true">${notificationIcon(item.type)}</span>
                    <span class="notification-inbox-copy">
                        <strong>${esc(item.title)}</strong>
                        <small>${esc(item.message || "Service request")}</small>
                        <time class="notification-inbox-time" datetime="${esc(notificationDateTime)}" title="${esc(notificationDate)}">${esc(notificationDate)}${notificationDate ? ` · ${esc(timeAgo(item.created_at))}` : ""}</time>
                    </span>
                    <span class="notification-inbox-arrow" aria-hidden="true">›</span>
                </a>
            `;
            }).join("")
            : `<div class="notification-inbox-empty">You’re all caught up. No new alerts.</div>`;
    } catch (error) {
        console.error("Super Admin notification inbox error:", error);
        count.textContent = "!";
        count.hidden = false;
        list.innerHTML = `<div class="notification-inbox-empty">Unable to load the inbox. Refresh to try again.</div>`;
        if (!Array.isArray(projects)) renderDashboardSummaries(null);
    }
}

async function loadFormEntrySummary() {
    const customerTotal = $("#customerFilledTotal");
    const adminTotal = $("#adminFilledTotal");
    if (!customerTotal || !adminTotal) return;

    try {
        const response = await fetch(`${API_BASE}/super-admin/dashboard`, {
            headers: { Authorization: `Bearer ${token()}` },
            cache: "no-store"
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || "Unable to load form entry summary.");
        }

        const summary = result.data?.summary || {};
        customerTotal.textContent = String(Number(summary.customer_filled_total || 0));
        adminTotal.textContent = String(Number(summary.admin_filled_total || 0));
    } catch (error) {
        console.error("Super Admin form entry summary error:", error);
        customerTotal.textContent = "—";
        adminTotal.textContent = "—";
    }
}

function notificationIcon(type) {
    return ({
        request: "＋",
        quotation: "✓",
        report: "▤",
        quotation_payment: "＄",
        invoice_payment: "＄"
    })[type] || "•";
}

function timeAgo(value) {
    const timestamp = new Date(value || "").getTime();
    if (!Number.isFinite(timestamp)) return "Recently";
    const minutes = Math.max(1, Math.floor((Date.now() - timestamp) / 60000));
    if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
}

function notificationTimestamp(value) {
    const timestamp = new Date(value || "");
    if (Number.isNaN(timestamp.getTime())) return "";
    return timestamp.toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" });
}

function notificationDateTimeValue(value) {
    const timestamp = new Date(value || "");
    return Number.isNaN(timestamp.getTime()) ? "" : timestamp.toISOString();
}

async function markNotificationRead(id) {
    const response = await fetch(`${API_BASE}/super-admin/notifications/${encodeURIComponent(id)}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token()}` }
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to mark notification as read.");
    }

    const badge = $("#inboxCount");
    const toggle = $("#notificationToggle");
    if (badge && toggle) {
        dashboardUnreadNotificationCount = Math.max(0, dashboardUnreadNotificationCount - 1);
        badge.textContent = dashboardUnreadNotificationCount > 99 ? "99+" : String(dashboardUnreadNotificationCount);
        badge.hidden = dashboardUnreadNotificationCount === 0;
        toggle.setAttribute("aria-label", `Notifications, ${dashboardUnreadNotificationCount} unread alert${dashboardUnreadNotificationCount === 1 ? "" : "s"}`);
    }
}

function renderDashboardSummaries(projects) {
    const statusCounts = {
        pending: 0,
        assigned: 0,
        in_progress: 0,
        waiting_parts: 0,
        awaiting_payment: 0
    };
    let pendingReview = 0;
    let revisionRequired = 0;

    if (Array.isArray(projects)) {
        projects.forEach(project => {
            const status = String(project.status || "").toLowerCase();
            if (Object.prototype.hasOwnProperty.call(statusCounts, status)) statusCounts[status] += 1;

            const approvalStatus = String(project.quotation_approval_status || "").toLowerCase();
            if (approvalStatus === "pending_approval") pendingReview += 1;
            if (approvalStatus === "revision_required") revisionRequired += 1;
        });
    }

    const values = {
        dashboardPendingTotal: Object.values(statusCounts).reduce((sum, value) => sum + value, 0),
        dashboardPendingCount: statusCounts.pending,
        dashboardAssignedCount: statusCounts.assigned,
        dashboardInProgressCount: statusCounts.in_progress,
        dashboardWaitingPartsCount: statusCounts.waiting_parts,
        dashboardAwaitingPaymentCount: statusCounts.awaiting_payment,
        dashboardEnquiryTotal: pendingReview + revisionRequired,
        dashboardEnquiryPendingCount: pendingReview,
        dashboardEnquiryRevisionCount: revisionRequired
    };

    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = Array.isArray(projects) ? String(value) : "—";
    });
}


/* ======================================================
   SET VALUE
====================================================== */

function setValue(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (!element) {
        return;
    }


    element.textContent =
        value ?? 0;

}


/* ======================================================
   RECENT PROJECTS
====================================================== */

function renderRecentProjects(
    projects
) {
 
    const list =
        $("#projectList");
 
    const count =
        $("#projectCount");
 
 
    if (count) {
 
        count.textContent =
            `${projects.length} ${
                projects.length === 1
                    ? "project"
                    : "projects"
            }`;
 
    }
 
 
    if (!projects.length) {
 
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✓</div>
                <div>
                    <strong>No projects found</strong>
                    <span>Projects will appear here once requests are created.</span>
                </div>
            </div>
        `;
 
        return;
 
    }
 
 
    list.innerHTML =
        projects.map(project => {
 
            const invoiceStatus =
                project.invoice_status;
 
            const payment =
                invoiceStatus === "paid"
                    ? `<span class="table-status success">Paid</span>`
                    : invoiceStatus
                        ? `<span class="table-status">${esc(
                            String(invoiceStatus).replaceAll("_", " ")
                        )}</span>`
                        : `<span class="table-status">—</span>`;
 
            const quotation =
                project.quotation_file_url
                    ? `<span class="table-status success">Uploaded</span>`
                    : `<span class="table-status">—</span>`;
 
            return `
                <article class="project-row">
 
                    <div>
                        <strong class="row-main">${esc(project.request_code)}</strong>
                        <small class="row-sub">${esc(project.service_name || "—")}</small>
                    </div>
 
                    <div class="col-customer">
                        <span class="row-label">Customer</span>
                        <strong class="row-value">${esc(project.customer_name || "—")}</strong>
                    </div>
 
                    <div class="col-quotation">
                        <span class="row-label">Quotation</span>
                        ${quotation}
                    </div>
 
                    <div class="col-payment">
                        <span class="row-label">Payment</span>
                        ${payment}
                    </div>
 
                    <div class="col-technician">
                        <span class="row-label">Technician</span>
                        <strong class="row-value">${esc(project.technician_name || "Not assigned")}</strong>
                    </div>
 
                    <div class="col-report">
                        <span class="row-label">Report</span>
                        <strong class="row-value">${esc(formatReportStatus(project.report_status))}</strong>
                    </div>
 
                    <div>
                        <span class="status-pill ${esc(project.status || "")}">
                            ${esc(statusLabel(project.status))}
                        </span>
                    </div>
 
                    <div class="col-view">
                        <a class="view-link"
                           href="project.html?id=${encodeURIComponent(project.id)}">
                            View
                        </a>
                    </div>
 
                </article>
            `;
 
        }).join("");
 
}

/* ======================================================
   REPORT STATUS
====================================================== */

function formatReportStatus(
    value
) {

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


/* ======================================================
   CATEGORY TITLES
====================================================== */

const CATEGORY_TITLES = {

    all:
        "All Projects",

    quotation_uploaded:
        "Quotation Uploaded",

    quotation_sent:
        "Quotation Sent",

    invoice_uploaded:
        "Final Invoices",

    payment_proof:
        "Payment Proof",

    completed:
        "Completed Projects"

};


/* ======================================================
   CATEGORY SUBTITLES
====================================================== */

const CATEGORY_SUBTITLES = {

    all:
        "All active projects.",

    quotation_uploaded:
        "Quotation files uploaded by Admin.",

    quotation_sent:
        "Quotations sent to customers.",

    invoice_uploaded:
        "Final invoice PDFs uploaded by Admin.",

    payment_proof:
        "Payment receipts submitted for invoices.",

    completed:
        "Projects marked as completed."

};


/* ======================================================
   FILE URL
====================================================== */

const API_ORIGIN =
    API_BASE.replace(
        /\/api\/?$/,
        ""
    );


function fileUrl(
    path
) {

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
   FILE ICON
====================================================== */

function fileIcon(
    type,
    name
) {

    const value =
        String(
            type ||
            name ||
            ""
        ).toLowerCase();


    if (
        value.includes("pdf")
    ) {

        return "📕";

    }


    if (
        value.includes("image") ||
        value.match(
            /\.(jpg|jpeg|png|webp|gif)$/i
        )
    ) {

        return "📷";

    }


    if (
        value.includes("video") ||
        value.match(
            /\.(mp4|mov|avi|webm)$/i
        )
    ) {

        return "🎥";

    }


    return "📄";

}


/* ======================================================
   OPEN CATEGORY MODAL
====================================================== */

async function openCategory(
    category
) {

    const modal =
        $("#fileModal");


    const body =
        $("#fileModalBody");


    const title =
        $("#fileModalTitle");


    const subtitle =
        $("#fileModalSubtitle");


    title.textContent =
        CATEGORY_TITLES[
            category
        ] ||
        "Uploaded Files";


    subtitle.textContent =
        CATEGORY_SUBTITLES[
            category
        ] ||
        "Files for this category.";


    body.innerHTML = `

        <div class="loading">
            Loading files...
        </div>

    `;


    modal.hidden = false;


    try {

        const response =
            await fetch(

                `${API_BASE}/super-admin/dashboard/files?category=${encodeURIComponent(
                    category
                )}`,

                {

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
                "Unable to load files."
            );

        }


        const files =
            result.data?.files ||
            [];


        renderCategoryFiles(
            files,
            category
        );


    } catch (error) {

        console.error(
            "Category loading error:",
            error
        );


        body.innerHTML = `

            <div class="empty">

                Unable to load files.

                <br>

                <small>
                    ${esc(
                        error.message
                    )}
                </small>

            </div>

        `;

    }

}


/* ======================================================
   RENDER CATEGORY FILES
====================================================== */

function renderCategoryFiles(
    files,
    category
) {

    const body =
        $("#fileModalBody");


    if (!files.length) {

        body.innerHTML = `

            <div class="empty">

                No files found for this category.

            </div>

        `;

        return;

    }


    /*
     * --------------------------------------------------
     * PROJECT CATEGORY
     * --------------------------------------------------
     */

    if (
        category === "all" ||
        category === "completed"
    ) {

        body.innerHTML =
            files.map(
                file => `

                    <article class="file-row">

                        <div class="file-icon">
                            📁
                        </div>


                        <div class="file-info">

                            <strong>
                                ${esc(
                                    file.request_code
                                )}
                            </strong>

                            <span>
                                ${esc(
                                    file.customer_name ||
                                    "—"
                                )}
                            </span>

                            <small>
                                ${esc(
                                    file.service_name ||
                                    "—"
                                )}
                            </small>

                        </div>


                        <div class="file-meta">

                            <span>
                                ${esc(
                                    statusLabel(
                                        file.status
                                    )
                                )}
                            </span>

                            <small>
                                ${esc(
                                    date(
                                        file.updated_at ||
                                        file.completed_at
                                    )
                                )}
                            </small>

                        </div>


                        <div class="file-actions">

                            <a
                                class="view-link"
                                href="project.html?id=${encodeURIComponent(
                                    file.request_id
                                )}"
                            >
                                View Project →
                            </a>

                        </div>

                    </article>

                `
            ).join("");

        return;

    }


    /*
     * --------------------------------------------------
     * DOCUMENT FILES
     * --------------------------------------------------
     */

    body.innerHTML =
        files.map(
            file => `

                <article class="file-row">


                    <div class="file-icon">

                        ${fileIcon(
                            file.file_type,
                            file.file_name
                        )}

                    </div>


                    <div class="file-info">

                        <strong>

                            ${esc(
                                file.file_name ||
                                "Uploaded File"
                            )}

                        </strong>


                        <span>

                            ${esc(
                                file.request_code ||
                                "—"
                            )}

                            ·

                            ${esc(
                                file.customer_name ||
                                "—"
                            )}

                        </span>


                        <small>

                            ${esc(
                                file.service_name ||
                                file.source ||
                                "Document"
                            )}

                        </small>

                    </div>


                    <div class="file-meta">

                        ${
                            file.invoice_number
                                ? `
                                    <span>
                                        ${esc(
                                            file.invoice_number
                                        )}
                                    </span>
                                `
                                : ""
                        }


                        ${
                            file.payment_status
                                ? `
                                    <span>
                                        ${esc(
                                            paymentLabel(
                                                file.payment_status
                                            )
                                        )}
                                    </span>
                                `
                                : ""
                        }


                        ${
                            file.status &&
                            !file.payment_status
                                ? `
                                    <span>
                                        ${esc(
                                            String(
                                                file.status
                                            ).replaceAll(
                                                "_",
                                                " "
                                            )
                                        )}
                                    </span>
                                `
                                : ""
                        }


                        <small>

                            ${esc(
                                date(
                                    file.uploaded_at
                                )
                            )}

                        </small>

                    </div>


                    <div class="file-actions">


                        ${
                            file.file_path

                                ? `
                                    <a
                                        class="view-link"
                                        href="${esc(
                                            fileUrl(
                                                file.file_path
                                            )
                                        )}"
                                        target="_blank"
                                        rel="noopener"
                                    >
                                        View File ↗
                                    </a>
                                `

                                : `
                                    <span class="muted">
                                        File unavailable
                                    </span>
                                `
                        }


                        ${
                            file.request_id

                                ? `
                                    <a
                                        class="view-link secondary"
                                        href="project.html?id=${encodeURIComponent(
                                            file.request_id
                                        )}"
                                    >
                                        Project →
                                    </a>
                                `

                                : ""
                        }


                    </div>


                </article>

            `
        ).join("");

}


/* ======================================================
   CLOSE MODAL
====================================================== */

function closeModal() {

    $("#fileModal").hidden =
        true;

}


function setupModal() {

    $("#fileModalClose").onclick =
        closeModal;


    document
        .querySelector(
            "[data-close-file-modal]"
        )
        ?.addEventListener(
            "click",
            closeModal
        );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                !$("#fileModal").hidden
            ) {

                closeModal();

            }

        }
    );

}


/* ======================================================
   STAT CARD EVENTS
====================================================== */

function setupStatCards() {

    document
        .querySelectorAll(
            ".stat-card[data-file-category]"
        )
        .forEach(card => {

            const category =
                card.dataset.fileCategory;


            card.addEventListener(
                "click",
                () =>
                    openCategory(
                        category
                    )
            );


            card.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {

                        event.preventDefault();

                        openCategory(
                            category
                        );

                    }

                }
            );

        });

}


/* ======================================================
   REFRESH
====================================================== */

function setupRefresh() {

    $("#refreshButton").onclick = () => {
        loadOverdueSummary();
        loadNotificationInbox();
        loadFormEntrySummary();
    };

}

function setupNotificationDrawer() {
    const toggle = $("#notificationToggle");
    const drawer = $("#notificationDrawer");
    const backdrop = $("#notificationBackdrop");
    const close = $("#notificationClose");
    if (!toggle || !drawer || !backdrop || !close) return;

    const setOpen = open => {
        drawer.hidden = !open;
        backdrop.hidden = !open;
        toggle.setAttribute("aria-expanded", String(open));
        if (open) close.focus();
    };

    $("#notificationInbox")?.addEventListener("click", event => {
        const item = event.target.closest("a[data-notification-id]");
        if (!item || !item.classList.contains("is-unread")) return;
        event.preventDefault();
        const destination = item.href;
        markNotificationRead(item.dataset.notificationId)
            .then(() => {
                item.classList.remove("is-unread");
                item.classList.add("is-read");
            })
            .catch(error => console.error("Unable to persist notification read state:", error))
            .finally(() => window.location.assign(destination));
    });

    toggle.addEventListener("click", () => setOpen(drawer.hidden));
    close.addEventListener("click", () => {
        setOpen(false);
        toggle.focus();
    });
    backdrop.addEventListener("click", () => {
        setOpen(false);
        toggle.focus();
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !drawer.hidden) {
            setOpen(false);
            toggle.focus();
        }
    });
}


/* ======================================================
   START
====================================================== */

if (!token()) {

    window.location.href =
        "login.html";

} else {

    setupProfile();

    setupModal();

    setupStatCards();

    setupRefresh();
    setupNotificationDrawer();

    loadOverdueSummary();
    loadNotificationInbox();
    loadFormEntrySummary();

}
