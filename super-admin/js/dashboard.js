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


/* ======================================================
   DASHBOARD SUMMARY
====================================================== */

async function loadDashboard() {

    try {

        const response =
            await fetch(
                `${API_BASE}/super-admin/dashboard`,
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
                "Unable to load dashboard."
            );

        }


        const summary =
            result.data?.summary ||
            {};


        const recent =
            result.data?.recent ||
            [];


        /*
         * --------------------------------------------------
         * SUMMARY CARDS
         * --------------------------------------------------
         */

        setValue(
            "totalProjects",
            summary.total_projects
        );


        setValue(
            "quotationsUploaded",
            summary.quotations_uploaded
        );


        setValue(
            "quotationsSent",
            summary.quotations_sent
        );


        setValue(
            "invoicesUploaded",
            summary.invoices_uploaded
        );


        setValue(
            "paymentProofs",
            summary.payment_proofs
        );


        setValue(
            "projectsCompleted",
            summary.projects_completed
        );


        /*
         * --------------------------------------------------
         * RECENT PROJECTS
         * --------------------------------------------------
         */

        renderRecentProjects(
            recent
        );


    } catch (error) {
 
        console.error(
            "Dashboard loading error:",
            error
        );
 
        const count = $("#projectCount");
 
        if (count) {
            count.textContent = "—";
        }
 
        $("#projectList").innerHTML = `
            <div class="empty-state error-state">
                <div>
                    <strong>Unable to load dashboard</strong>
                    <span>${esc(error.message || "Please try again.")}</span>
                </div>
            </div>
        `;
 
    }

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

    $("#refreshButton").onclick =
        loadDashboard;

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

    loadDashboard();

}