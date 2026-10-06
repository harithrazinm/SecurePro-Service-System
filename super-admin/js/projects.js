// =========================================================
// SECUREPRO — SUPER ADMIN PROJECTS
// =========================================================

// Local API
// const API_BASE = "http://localhost:5001/api";

// Production API
const API_BASE =
    /^(localhost|127\.0\.0\.1)$/.test(
        location.hostname
    )
        ? "http://localhost:5001/api"
        : "/api";
        
const TOKEN_KEY = "securepro_super_admin_token";
const USER_KEY = "securepro_super_admin_user";

// =========================================================
// HELPERS
// =========================================================

const $ = selector => document.querySelector(selector);

const esc = value =>
    String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

const date = value => {
    if (!value) return "—";

    const d = new Date(value);

    if (Number.isNaN(d.getTime())) {
        return "—";
    }

    return d.toLocaleString("en-MY", {
        dateStyle: "medium",
        timeStyle: "short"
    });
};


// =========================================================
// STATUS TEXT
// =========================================================

const status = value => ({
    pending: "Pending",
    assigned: "Assigned",
    in_progress: "In Progress",
    waiting_parts: "Waiting Parts",
    completed: "Completed",
    cancelled: "Cancelled",
    rejected: "Rejected"
})[value] || value || "—";


// =========================================================
// BADGE CLASS
// =========================================================

const badgeClass = value => {
    const v = String(value || "none")
        .trim()
        .toLowerCase();

    return v
        .replaceAll(" ", "_")
        .replaceAll("-", "_");
};


// =========================================================
// CREATE BADGE
// =========================================================

const badge = value => {

    const originalValue = value || "none";

    const className = badgeClass(originalValue);

    /*
        Examples:

        approved
        -> badge badge-approved

        completed
        -> badge badge-completed

        in_progress
        -> badge badge-in_progress

        pending
        -> badge badge-pending

        assigned
        -> badge badge-assigned

        waiting_parts
        -> badge badge-waiting_parts

        no_report
        -> badge badge-no_report
    */

    let displayText = originalValue;

    // Project status
    if (
        [
            "pending",
            "assigned",
            "in_progress",
            "waiting_parts",
            "completed",
            "cancelled",
            "rejected"
        ].includes(String(originalValue).toLowerCase())
    ) {
        displayText = status(originalValue);
    }

    // Report status formatting
    else if (String(originalValue).toLowerCase() === "approved") {
        displayText = "Approved";
    }

    else if (String(originalValue).toLowerCase() === "submitted") {
        displayText = "Submitted";
    }

    else if (String(originalValue).toLowerCase() === "available") {
        displayText = "Available";
    }

    else if (String(originalValue).toLowerCase() === "pending") {
        displayText = "Pending";
    }

    else if (String(originalValue).toLowerCase() === "rejected") {
        displayText = "Rejected";
    }

    else {
        displayText = String(originalValue)
            .replaceAll("_", " ")
            .replace(/\b\w/g, letter => letter.toUpperCase());
    }

    return `
        <span class="badge badge-${esc(className)}">
            ${esc(displayText)}
        </span>
    `;
};


// =========================================================
// TOKEN
// =========================================================

const token = () => {
    return localStorage.getItem(TOKEN_KEY);
};


// =========================================================
// SETUP
// =========================================================

function setup() {

    try {

        const user = JSON.parse(
            localStorage.getItem(USER_KEY) || "{}"
        );

        const adminName = $("#adminName");
        const topName = $("#topName");

        if (adminName) {
            adminName.textContent =
                user.name || "Super Admin";
        }

        if (topName) {
            topName.textContent =
                user.name || "Super Admin";
        }

    } catch (error) {

        console.warn(
            "Unable to load Super Admin user information.",
            error
        );

    }


    // =====================================================
    // LOGOUT
    // =====================================================

    const logoutButton = $("#logoutButton");

    if (logoutButton) {

        logoutButton.onclick = () => {

            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);

            location.href = "login.html";
        };

    }

}


// =========================================================
// LOAD PROJECTS
// =========================================================

async function load() {

    const projectTable = $("#projectTable");

    if (!projectTable) {
        console.error(
            "Project table element #projectTable was not found."
        );

        return;
    }


    // Loading state

    projectTable.innerHTML = `
        <tr>
            <td colspan="9" class="empty">
                Loading projects...
            </td>
        </tr>
    `;


    try {

        const response = await fetch(
            `${API_BASE}/super-admin/projects`,
            {
                headers: {
                    Authorization: `Bearer ${token()}`
                }
            }
        );


        const data = await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to load projects."
            );

        }


        // Store projects globally

        window.projects = data.data || [];


        // Render

        render();


    } catch (error) {

        console.error(
            "Unable to load projects:",
            error
        );


        projectTable.innerHTML = `
            <tr>
                <td colspan="9" class="empty error-text">
                    ${esc(error.message)}
                </td>
            </tr>
        `;
    }

}


// =========================================================
// RENDER PROJECTS
// =========================================================

function render() {

    const searchInput = $("#searchInput");
    const statusFilter = $("#statusFilter");
    const projectTable = $("#projectTable");
    const countLabel = $("#countLabel");


    if (!projectTable) {
        return;
    }


    // Search

    const q = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";


    // Status filter

    const selectedStatus = statusFilter
        ? statusFilter.value
        : "";


    // Filter projects

    const rows = (window.projects || []).filter(project => {

        const matchesStatus =
            !selectedStatus ||
            project.status === selectedStatus;


        const searchText = [
            project.request_code,
            project.customer_name,
            project.customer_phone,
            project.service_name,
            project.technician_name,
            project.quotation_number
        ]
            .join(" ")
            .toLowerCase();


        const matchesSearch =
            !q ||
            searchText.includes(q);


        return matchesStatus && matchesSearch;

    });


    // =====================================================
    // PROJECT COUNT
    // =====================================================

    if (countLabel) {

        countLabel.textContent =
            `${rows.length} Project${rows.length === 1 ? "" : "s"}`;

    }


    // =====================================================
    // EMPTY RESULT
    // =====================================================

    if (!rows.length) {

        projectTable.innerHTML = `
            <tr>
                <td colspan="9" class="empty">
                    No projects found.
                </td>
            </tr>
        `;

        return;
    }


    // =====================================================
    // CREATE TABLE ROWS
    // =====================================================

    projectTable.innerHTML = rows.map(project => {

        // -------------------------------------------------
        // REPORT
        // -------------------------------------------------

        const reportCell = project.report_status
            ? badge(project.report_status)
            : `
                <span class="badge badge-none">
                    No Report
                </span>
            `;


        // -------------------------------------------------
        // PROJECT STATUS
        // -------------------------------------------------

        const statusCell = badge(project.status);


        // -------------------------------------------------
        // PAYMENT
        // -------------------------------------------------

        const paymentCell = project.payment_proof_url

            ? `
                <a
                    class="doc"
                    target="_blank"
                    rel="noopener"
                    href="${esc(project.payment_proof_url)}"
                >
                    View Proof
                </a>
            `

            : `
                <span class="muted">
                    No proof
                </span>
            `;


        // -------------------------------------------------
        // TECHNICIAN
        // -------------------------------------------------

        const technicianCell = project.technician_name

            ? `
                ${esc(project.technician_name)}

                ${
                    project.technician_started_at
                        ? `
                            <small>
                                Started ${esc(
                                    date(project.technician_started_at)
                                )}
                            </small>
                        `
                        : ""
                }
            `

            : `
                <span class="muted">
                    Not assigned
                </span>
            `;


        // -------------------------------------------------
        // QUOTATION
        // -------------------------------------------------

        const quotationCell = project.quotation_number

            ? `
                <strong>
                    ${esc(project.quotation_number)}
                </strong>

                <small>
                    ${esc(
                        project.quotation_status || "—"
                    )}
                </small>
            `

            : "—";


        // -------------------------------------------------
        // RETURN ROW
        // -------------------------------------------------

        return `
            <tr>

                <!-- REQUEST -->
                <td>
                    <strong>
                        ${esc(project.request_code)}
                    </strong>

                    <small>
                        ${esc(date(project.created_at))}
                    </small>
                </td>


                <!-- CUSTOMER -->
                <td>
                    <strong>
                        ${esc(project.customer_name)}
                    </strong>

                    <small>
                        ${esc(project.customer_phone)}
                    </small>
                </td>


                <!-- SERVICE -->
                <td>
                    ${esc(
                        project.service_name || "—"
                    )}
                </td>


                <!-- QUOTATION -->
                <td>
                    ${quotationCell}
                </td>


                <!-- PAYMENT -->
                <td>
                    ${paymentCell}
                </td>


                <!-- TECHNICIAN -->
                <td>
                    ${technicianCell}
                </td>


                <!-- REPORT -->
                <td class="report-cell">
                    ${reportCell}
                </td>


                <!-- STATUS -->
                <td class="status-cell">
                    ${statusCell}
                </td>


                <!-- VIEW -->
                <td class="action-cell">
                    <a
                        class="view"
                        href="project.html?id=${encodeURIComponent(project.id)}"
                    >
                        View
                    </a>
                </td>

            </tr>
        `;

    }).join("");

}


// =========================================================
// INITIALIZATION
// =========================================================

if (!token()) {

    location.href = "login.html";

} else {

    setup();


    // Search

    const searchInput = $("#searchInput");

    if (searchInput) {
        searchInput.oninput = render;
    }


    // Status filter

    const statusFilter = $("#statusFilter");

    if (statusFilter) {
        statusFilter.onchange = render;
    }


    // Refresh

    const refreshButton = $("#refreshButton");

    if (refreshButton) {

        refreshButton.onclick = async () => {

            refreshButton.disabled = true;

            refreshButton.classList.add("loading");

            try {

                await load();

            } finally {

                refreshButton.disabled = false;

                refreshButton.classList.remove("loading");

            }

        };

    }


    // Initial load

    load();
}