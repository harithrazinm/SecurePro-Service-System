/* =========================================================
   API CONFIGURATION
========================================================= */

const API_BASE =
    ["localhost", "127.0.0.1"].includes(window.location.hostname)
        ? "http://localhost:5001/api"
        : "https://securepro-service-system.onrender.com/api";

const BACKEND_BASE =
    ["localhost", "127.0.0.1"].includes(window.location.hostname)
        ? "http://localhost:5001"
        : "https://securepro-service-system.onrender.com";


/* =========================================================
   GLOBAL DATA
========================================================= */

let requestData = null;
let selectedStatus = null;


/* =========================================================
   TOKEN
========================================================= */

function getToken() {
    return localStorage.getItem("securepro_admin_token");
}


/* =========================================================
   REQUEST ID
========================================================= */

function getRequestId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" });
}


/* =========================================================
   STATUS FORMAT
========================================================= */

function formatStatus(status) {
    const labels = {
        pending: "Pending",
        assigned: "Assigned",
        in_progress: "In Progress",
        waiting_parts: "Waiting Parts",
        completed: "Completed",
        cancelled: "Cancelled"
    };
    return labels[status] || status || "Unknown";
}


/* =========================================================
   STATUS CSS CLASS
   NOTE: request.css defines rules like `.status-badge.pending`
   (no "status-" prefix), so the class we hand back here must
   NOT be prefixed — that mismatch was why badges never picked
   up their color before.
========================================================= */

function statusClass(status) {
    const allowed = [
        "pending", "assigned", "in_progress",
        "waiting_parts", "completed", "cancelled"
    ];
    return allowed.includes(status) ? status : "pending";
}


/* =========================================================
   REPORT STATUS
========================================================= */

function formatReportStatus(status) {
    const labels = {
        draft: "Draft",
        submitted: "Submitted",
        approved: "Approved",
        rejected: "Rejected"
    };
    return labels[status] || status || "Unknown";
}


/* =========================================================
   RESPONSE PARSER
========================================================= */

async function parseResponse(response) {
    let result = null;
    try {
        result = await response.json();
    } catch {
        result = null;
    }

    if (!response.ok || !result || !result.success) {
        let message = result?.message || `Request failed with HTTP ${response.status}.`;

        if (response.status === 401) {
            message = "Authentication expired. Please login again.";
        }
        if (response.status === 403) {
            message = result?.message || "You do not have permission to perform this action.";
        }
        if (response.status === 404) {
            message = result?.message || "API endpoint or request was not found.";
        }

        throw new Error(message);
    }

    return result;
}


/* =========================================================
   ERROR DISPLAY
========================================================= */

function showError(message) {
    const element = document.querySelector("#requestError");
    if (!element) {
        console.error(message);
        return;
    }
    element.textContent = message || "Unable to load request.";
    element.hidden = false;
}

function hideError() {
    const element = document.querySelector("#requestError");
    if (!element) return;
    element.textContent = "";
    element.hidden = true;
}


/* =========================================================
   AUTH CHECK
========================================================= */

function requireToken() {
    const token = getToken();
    if (!token) {
        window.location.href = "login.html";
        return false;
    }
    return true;
}

function handleAuthError(error) {
    const message = String(error?.message || "").toLowerCase();

    if (
        message.includes("authentication") ||
        message.includes("401") ||
        message.includes("token")
    ) {
        localStorage.removeItem("securepro_admin_token");
        localStorage.removeItem("securepro_admin_user");
        window.location.href = "login.html";
        return true;
    }

    return false;
}


/* =========================================================
   LOAD REQUEST
========================================================= */

async function loadRequest() {
    hideError();

    const requestId = getRequestId();
    if (!requestId) {
        showError("No request ID was provided.");
        return;
    }

    const token = getToken();
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const loading = document.querySelector("#requestLoading");
    const details = document.querySelector("#requestDetails");

    if (loading) loading.hidden = false;
    if (details) details.hidden = true;

    try {
        const response = await fetch(
            `${API_BASE}/admin/requests/${encodeURIComponent(requestId)}`,
            { method: "GET", headers: { "Authorization": `Bearer ${token}` } }
        );

        const result = await parseResponse(response);
        requestData = result.data;
        renderRequest(requestData);

    } catch (error) {
        console.error("Request details error:", error);
        if (handleAuthError(error)) return;
        showError(error.message || "Unable to load request.");

    } finally {
        if (loading) loading.hidden = true;
        if (details && requestData) details.hidden = false;
    }
}


/* =========================================================
   RENDER REQUEST
========================================================= */

function renderRequest(data) {
    requestData = data;

    renderHeader(data);
    renderCustomer(data);
    renderService(data);
    renderAnswers(data);
    renderNotes(data);
    renderPhotos(data);
    renderTechnicianReport(data);
    renderStatus(data);
    renderAssignment(data);
    renderMeta(data);

    const loading = document.querySelector("#requestLoading");
    const details = document.querySelector("#requestDetails");

    if (loading) loading.hidden = true;
    if (details) details.hidden = false;

    loadTechnicians(data);
}


/* =========================================================
   HEADER
========================================================= */

function renderHeader(data) {
    const requestCode = document.querySelector("#requestCode");
    const requestService = document.querySelector("#requestService");
    const statusBadge = document.querySelector("#requestStatusBadge");

    const service =
        data.service_name ||
        data.service?.name_en ||
        data.service?.name?.en ||
        data.service_name_en ||
        "—";

    const status = data.status || "pending";

    if (requestCode) requestCode.textContent = data.request_code || "—";
    if (requestService) requestService.textContent = service;

    if (statusBadge) {
        statusBadge.textContent = formatStatus(status);
        statusBadge.className = `status-badge ${statusClass(status)}`;
    }
}


/* =========================================================
   SERVICE
========================================================= */

function renderService(data) {
    const service =
        data.service_name ||
        data.service?.name_en ||
        data.service?.name?.en ||
        data.service_name_en ||
        "—";

    const element = document.querySelector("#serviceName");
    if (element) element.textContent = service;
}


/* =========================================================
   CUSTOMER
========================================================= */

function renderCustomer(data) {
    const container = document.querySelector("#customerGrid");
    if (!container) return;

    const customer = data.customer || {};

    const name = customer.name || data.customer_name || "—";
    const phone = customer.phone || data.customer_phone || "";
    const email = customer.email || data.customer_email || "";
    const address = customer.address || data.customer_address || "—";

    const phoneHtml = phone
        ? `<a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a>`
        : "—";

    const emailHtml = email
        ? `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>`
        : "—";

    container.innerHTML = `
        <div class="customer-field">
            <span class="field-label">Customer Name</span>
            <div class="field-value">${escapeHtml(name)}</div>
        </div>

        <div class="customer-field">
            <span class="field-label">Phone</span>
            <div class="field-value">${phoneHtml}</div>
        </div>

        <div class="customer-field">
            <span class="field-label">Email</span>
            <div class="field-value">${emailHtml}</div>
        </div>

        <div class="customer-field full-width">
            <span class="field-label">Installation Address</span>
            <div class="field-value">${escapeHtml(address)}</div>
        </div>
    `;
}


/* =========================================================
   CUSTOMER ANSWERS
========================================================= */

function renderAnswers(data) {
    const container = document.querySelector("#answersGrid");
    if (!container) return;

    const answers = Array.isArray(data.answers) ? data.answers : [];

    if (!answers.length) {
        container.innerHTML = `
            <div class="empty-state">
                No customer requirements found for this request.
            </div>
        `;
        return;
    }

    container.innerHTML = answers.map((answer) => {
        let value = answer.answer;

        if (value === null || value === undefined || value === "") {
            if (answer.number_value !== null && answer.number_value !== undefined) {
                value = answer.number_value;
            }
        }

        if (value === null || value === undefined || value === "") {
            value = answer.text_value;
        }

        if (
            (value === null || value === undefined || value === "") &&
            Array.isArray(answer.options) &&
            answer.options.length
        ) {
            value = answer.options
                .map(option =>
                    option.option_label_en ||
                    option.label?.en ||
                    option.option_value ||
                    option.value ||
                    ""
                )
                .filter(Boolean)
                .join(", ");
        }

        if (value === null || value === undefined || value === "") {
            value = "Not specified";
        }

        const unit =
            answer.unit && typeof answer.unit === "object"
                ? (answer.unit.en || answer.unit.ms || "")
                : (answer.unit || "");

        if (unit && !String(value).includes(unit)) {
            value = `${value} ${unit}`;
        }

        const question =
            answer.question?.en ||
            answer.title_en ||
            answer.question_en ||
            answer.question_code ||
            "Customer Requirement";

        const fullWidth = String(value).length > 40 ? " full-width" : "";

        return `
            <div class="answer-item${fullWidth}">
                <div class="answer-label">${escapeHtml(question)}</div>
                <div class="answer-value">${escapeHtml(value)}</div>
            </div>
        `;
    }).join("");
}


/* =========================================================
   NOTES
========================================================= */

function renderNotes(data) {
    const container = document.querySelector("#customerNotes");
    if (!container) return;

    const notes = data.customer_notes || data.customer?.notes || "";

    if (!String(notes).trim()) {
        container.innerHTML = `
            <div class="empty-state">
                The customer did not provide additional notes.
            </div>
        `;
        return;
    }

    container.innerHTML = `<p class="notes-text">${escapeHtml(notes)}</p>`;
}


/* =========================================================
   CUSTOMER PHOTOS
========================================================= */

function renderPhotos(data) {
    const container = document.querySelector("#photosGrid");
    const count = document.querySelector("#photoCount");
    if (!container) return;

    const photos = Array.isArray(data.photos) ? data.photos : [];

    if (count) {
        count.textContent = `${photos.length} ${photos.length === 1 ? "photo" : "photos"}`;
    }

    if (!photos.length) {
        container.innerHTML = `
            <div class="empty-state">
                No photos were uploaded with this request.
            </div>
        `;
        return;
    }

    container.innerHTML = photos.map((photo, index) => {
        const rawPath = String(photo.file_path || "").trim();

        const photoUrl =
            rawPath.startsWith("http://") || rawPath.startsWith("https://")
                ? rawPath
                : `${BACKEND_BASE}${rawPath.startsWith("/") ? "" : "/"}${rawPath}`;

        const fileName = photo.file_name || `Customer Photo ${index + 1}`;

        return `
            <a class="photo-card" href="${escapeHtml(photoUrl)}" target="_blank" rel="noopener noreferrer">
                <img
                    src="${escapeHtml(photoUrl)}"
                    alt="${escapeHtml(fileName)}"
                    loading="lazy"
                    onerror="this.style.display='none';"
                >
                <span class="photo-name">${escapeHtml(fileName)}</span>
            </a>
        `;
    }).join("");
}


/* =========================================================
   TECHNICIAN REPORT
========================================================= */

function renderTechnicianReport(data) {
    const card = document.querySelector("#technicianReportCard");
    if (!card) return;

    const report = data.report || null;
    card.hidden = false;

    const status = document.querySelector("#technicianReportStatus");
    const work = document.querySelector("#reportWorkPerformed");
    const findings = document.querySelector("#reportFindings");
    const materials = document.querySelector("#reportMaterialsUsed");
    const notes = document.querySelector("#reportTechnicianNotes");

    if (!report) {
        if (status) status.textContent = "No report submitted";
        if (work) work.textContent = "The technician has not submitted a work report yet.";
        if (findings) findings.textContent = "—";
        if (materials) materials.textContent = "—";
        if (notes) notes.textContent = "—";

        renderCompletionMedia([]);
        hideReportReview();
        return;
    }

    if (status) status.textContent = formatReportStatus(report.status);
    if (work) work.textContent = report.work_performed || "—";
    if (findings) findings.textContent = report.findings || "—";
    if (materials) materials.textContent = report.materials_used || "—";
    if (notes) notes.textContent = report.technician_notes || "—";

    const remarksCard = document.querySelector("#reportReviewRemarks");
    const remarksText = document.querySelector("#reportReviewRemarksText");

    if (remarksCard && remarksText) {
        if (report.review_remarks && String(report.review_remarks).trim()) {
            remarksCard.hidden = false;
            remarksText.textContent = report.review_remarks;
        } else {
            remarksCard.hidden = true;
            remarksText.textContent = "";
        }
    }

    renderCompletionMedia(
        data.completion_media || report.completion_media || report.media || []
    );

    setupReportReview(report);
}


/* =========================================================
   COMPLETION MEDIA
========================================================= */

function renderCompletionMedia(media) {
    const grid = document.querySelector("#completionMediaGrid");
    const count = document.querySelector("#completionMediaCount");
    if (!grid) return;

    const items = Array.isArray(media) ? media : [];

    if (count) {
        count.textContent = `${items.length} ${items.length === 1 ? "file" : "files"}`;
    }

    if (!items.length) {
        grid.innerHTML = `
            <div class="empty-state">
                No completion photos or videos were uploaded.
            </div>
        `;
        return;
    }

    grid.innerHTML = items.map((item, index) => {
        const rawPath = String(item.file_path || "").trim();

        const url =
            rawPath.startsWith("http://") || rawPath.startsWith("https://")
                ? rawPath
                : `${BACKEND_BASE}${rawPath.startsWith("/") ? "" : "/"}${rawPath}`;

        const type = item.media_type || (item.mime_type?.startsWith("video/") ? "video" : "image");
        const fileName = item.file_name || `Completion Media ${index + 1}`;

        if (type === "video") {
            return `
                <div class="photo-card">
                    <video src="${escapeHtml(url)}" controls preload="metadata"></video>
                    <span class="photo-name">${escapeHtml(fileName)}</span>
                </div>
            `;
        }

        return `
            <a class="photo-card" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">
                <img src="${escapeHtml(url)}" alt="${escapeHtml(fileName)}" loading="lazy">
                <span class="photo-name">${escapeHtml(fileName)}</span>
            </a>
        `;
    }).join("");
}


/* =========================================================
   REPORT REVIEW
========================================================= */

function setupReportReview(report) {
    const section = document.querySelector("#reportReviewSection");
    const approveButton = document.querySelector("#approveReportButton");
    const rejectButton = document.querySelector("#rejectReportButton");
    const rejectForm = document.querySelector("#rejectForm");
    const cancelRejectButton = document.querySelector("#cancelRejectButton");
    const confirmRejectButton = document.querySelector("#confirmRejectButton");

    if (!section || !approveButton || !rejectButton) return;

    // Only submitted reports can be reviewed.
    if (!report || report.status !== "submitted") {
        section.hidden = true;
        return;
    }

    section.hidden = false;

    if (rejectForm) rejectForm.hidden = true;

    approveButton.onclick = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to approve this technician report?\n\nThe service request will be marked as completed."
        );
        if (!confirmed) return;
        await reviewTechnicianReport("approve");
    };

    rejectButton.onclick = () => {
        if (rejectForm) rejectForm.hidden = false;
        const reason = document.querySelector("#rejectReason");
        if (reason) reason.focus();
    };

    if (cancelRejectButton) {
        cancelRejectButton.onclick = () => {
            if (rejectForm) rejectForm.hidden = true;
            const reason = document.querySelector("#rejectReason");
            if (reason) reason.value = "";
        };
    }

    if (confirmRejectButton) {
        confirmRejectButton.onclick = async () => {
            const reasonElement = document.querySelector("#rejectReason");
            const reason = reasonElement?.value.trim() || "";

            if (!reason) {
                alert("Please enter a rejection reason.");
                return;
            }

            await reviewTechnicianReport("reject", reason);
        };
    }
}


/* =========================================================
   REVIEW REPORT API
========================================================= */

async function reviewTechnicianReport(action, reason = "") {
    if (!requestData) return;

    const approveButton = document.querySelector("#approveReportButton");
    const rejectButton = document.querySelector("#rejectReportButton");
    const confirmRejectButton = document.querySelector("#confirmRejectButton");

    if (approveButton) approveButton.disabled = true;
    if (rejectButton) rejectButton.disabled = true;
    if (confirmRejectButton) confirmRejectButton.disabled = true;

    if (action === "approve") {
        if (approveButton) approveButton.textContent = "Approving...";
    } else {
        if (confirmRejectButton) confirmRejectButton.textContent = "Rejecting...";
    }

    try {
        const response = await fetch(
            `${API_BASE}/admin/requests/${encodeURIComponent(requestData.id)}/report/review`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${getToken()}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ action, reason })
            }
        );

        const result = await parseResponse(response);
        await loadRequest();
        alert(result.message || "Report review completed.");

    } catch (error) {
        console.error("Review technician report error:", error);
        if (handleAuthError(error)) return;
        alert(error.message || "Unable to review technician report.");

    } finally {
        if (approveButton) {
            approveButton.disabled = false;
            approveButton.textContent = "✓ Approve Report";
        }
        if (rejectButton) {
            rejectButton.disabled = false;
            rejectButton.textContent = "✕ Reject Report";
        }
        if (confirmRejectButton) {
            confirmRejectButton.disabled = false;
            confirmRejectButton.textContent = "Reject Report";
        }
    }
}

function hideReportReview() {
    const section = document.querySelector("#reportReviewSection");
    if (section) section.hidden = true;
}


/* =========================================================
   STATUS
   NOTE: #requestStatus is a real <select> in the HTML now.
   We must never overwrite its innerHTML/textContent — that
   was destroying its <option> list on every render before.
   The current-status display lives in its own element,
   #currentStatusBadge.
========================================================= */

function renderStatus(data) {
    const status = data.status || "pending";
    selectedStatus = status;

    const currentBadge = document.querySelector("#currentStatusBadge");
    if (currentBadge) {
        currentBadge.textContent = formatStatus(status);
        currentBadge.className = `status-current-value status-badge ${statusClass(status)}`;
    }

    const select = document.querySelector("#requestStatus");
    if (select) {
        select.value = status;
    }
}

function setupStatusSelect() {
    const select = document.querySelector("#requestStatus");
    if (!select) return;

    select.addEventListener("change", () => {
        selectedStatus = select.value;

        const currentBadge = document.querySelector("#currentStatusBadge");
        if (currentBadge) {
            currentBadge.textContent = formatStatus(selectedStatus);
            currentBadge.className = `status-current-value status-badge ${statusClass(selectedStatus)}`;
        }
    });
}


/* =========================================================
   LOAD TECHNICIANS
========================================================= */

/* =========================================================
   LOAD TECHNICIANS
========================================================= */

async function loadTechnicians(data = requestData) {
    const select = document.querySelector("#technicianSelect");

    if (!select) return;

    try {
        select.disabled = true;
        select.innerHTML = `
            <option value="">Loading technicians...</option>
        `;

        const response = await fetch(
            `${API_BASE}/admin/technicians`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${getToken()}`
                }
            }
        );

        const result = await parseResponse(response);

        const technicians =
            Array.isArray(result.data)
                ? result.data
                : [];

        const currentTechnicianId =
            data?.technician?.id ||
            data?.technician_id ||
            "";

        select.innerHTML = `
            <option value="">
                No technician assigned
            </option>
        `;

        technicians.forEach(technician => {
            const option = document.createElement("option");

            option.value = technician.id;

            option.textContent =
                technician.name
                    ? `${technician.name}${technician.email ? ` — ${technician.email}` : ""}`
                    : technician.email || "Technician";

            select.appendChild(option);
        });

        if (currentTechnicianId) {
            select.value = currentTechnicianId;
        } else {
            select.value = "";
        }

        select.disabled = false;

        updateTechnicianDisplay();

    } catch (error) {
        console.error(
            "Unable to load technicians:",
            error
        );

        if (handleAuthError(error)) return;

        select.innerHTML = `
            <option value="">
                Unable to load technicians
            </option>
        `;

        select.disabled = false;
    }
}


/* =========================================================
   TECHNICIAN DISPLAY
========================================================= */

function updateTechnicianDisplay() {
    const select =
        document.querySelector("#technicianSelect");

    const currentName =
        document.querySelector("#currentTechnicianName");

    if (!select || !currentName) return;

    const selectedOption =
        select.options[select.selectedIndex];

    if (
        !select.value ||
        !selectedOption
    ) {
        currentName.textContent =
            "No technician assigned";
        return;
    }

    currentName.textContent =
        selectedOption.textContent;
}


/* =========================================================
   ASSIGNMENT DISPLAY
========================================================= */

function renderAssignment(data) {

    const technicianSelect =
        document.querySelector(
            "#technicianSelect"
        );

    const scheduledDate =
        document.querySelector(
            "#scheduledDate"
        );

    const scheduledTime =
        document.querySelector(
            "#scheduledTime"
        );

    const currentName =
        document.querySelector(
            "#currentTechnicianName"
        );

    if (!technicianSelect) {
        return;
    }

    const technician =
        data?.technician || null;

    const technicianId =
        technician?.id ||
        data?.technician_id ||
        "";

    /*
     * Technician
     */
    technicianSelect.value =
        technicianId;

    /*
     * Current technician display
     */
    if (currentName) {

        currentName.textContent =
            technician?.name ||
            technician?.email ||
            "No technician assigned";

    }

    /*
     * Scheduled date
     */
    if (scheduledDate) {

        scheduledDate.value =
            data?.scheduled_date ||
            "";

    }

    /*
     * Scheduled time
     */
    if (scheduledTime) {

        scheduledTime.value =
            data?.scheduled_time ||
            "";

    }

    updateTechnicianDisplay();
}


/* =========================================================
   SAVE TECHNICIAN ASSIGNMENT
========================================================= */

async function saveTechnicianAssignment() {

    if (!requestData) {
        alert(
            "Request information has not loaded yet."
        );
        return;
    }

    const requestId = getRequestId();

    if (!requestId) {
        alert("Request ID is missing.");
        return;
    }

    const token = getToken();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const technicianSelect =
        document.querySelector("#technicianSelect");

    const scheduledDate =
        document.querySelector("#scheduledDate");

    const scheduledTime =
        document.querySelector("#scheduledTime");

    const button =
        document.querySelector("#saveTechnicianButton");

    const message =
        document.querySelector(
            "#technicianAssignmentMessage"
        );

    if (!technicianSelect) {
        return;
    }

    const technicianId =
        technicianSelect.value || null;

    /*
     * A technician assignment requires a scheduled date.
     */
    if (technicianId && !scheduledDate?.value) {

        alert(
            "Scheduled date is required when assigning a technician."
        );

        scheduledDate?.focus();

        return;
    }

    const technicianName =
        technicianId
            ? (
                technicianSelect
                    .selectedOptions?.[0]
                    ?.textContent ||
                "Selected technician"
            )
            : "No technician assigned";

    const dateValue =
        scheduledDate?.value || "";

    const timeValue =
        scheduledTime?.value || "";

    const confirmed =
        window.confirm(
            "Confirm technician assignment?\n\n" +
            `Technician: ${technicianName}\n` +
            `Scheduled Date: ${dateValue || "Not scheduled"}\n` +
            `Scheduled Time: ${timeValue || "Not specified"}`
        );

    if (!confirmed) {
        return;
    }

    try {

        if (button) {
            button.disabled = true;
            button.textContent = "Saving...";
        }

        if (message) {
            message.hidden = false;
            message.className =
                "assignment-message";
            message.textContent =
                "Saving technician assignment...";
        }

        const response =
            await fetch(
                `${API_BASE}/admin/requests/${encodeURIComponent(requestId)}`,
                {
                    method: "PUT",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        technician_id:
                            technicianId,

                        scheduled_date:
                            dateValue || null,

                        scheduled_time:
                            timeValue || null,

                        /*
                         * When a technician is selected,
                         * make sure the request is assigned.
                         */
                        status:
                            technicianId
                                ? "assigned"
                                : requestData.status
                    })
                }
            );

        const result =
            await parseResponse(response);

        /*
         * Update local data.
         */
        if (result.data) {

            requestData = {
                ...requestData,
                ...result.data
            };

        }

        /*
         * Reload from database.
         */
        await loadRequest();

        if (message) {

            message.hidden = false;

            message.className =
                "assignment-message success";

            message.textContent =
                technicianId
                    ? "Technician assigned and schedule saved successfully."
                    : "Technician assignment removed.";

        }

        if (button) {

            button.textContent =
                technicianId
                    ? "Technician Assigned ✓"
                    : "Assignment Removed ✓";

        }

    } catch (error) {

        console.error(
            "Save technician assignment error:",
            error
        );

        if (handleAuthError(error)) {
            return;
        }

        if (message) {

            message.hidden = false;

            message.className =
                "assignment-message error";

            message.textContent =
                error.message ||
                "Unable to save technician assignment.";

        }

        alert(
            error.message ||
            "Unable to save technician assignment."
        );

    } finally {

        if (button) {

            button.disabled = false;

            setTimeout(() => {

                button.textContent =
                    "Assign Technician";

            }, 1500);

        }

    }
}

/* =========================================================
   ASSIGNMENT DISPLAY
========================================================= */

function renderAssignment(data) {
    const technicianSelect = document.querySelector("#technicianSelect");
    if (!technicianSelect) return;

    const technician = data.technician || null;
    if (technician?.id) {
        technicianSelect.dataset.currentTechnician = technician.id;
    }
}


/* =========================================================
   SAVE CHANGES
========================================================= */

async function saveChanges() {
    if (!requestData) {
        alert("Request information has not loaded yet.");
        return;
    }

    const requestId = getRequestId();
    if (!requestId) {
        alert("Request ID is missing.");
        return;
    }

    const token = getToken();
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const status = selectedStatus || requestData.status || "pending";

    const technicianSelect = document.querySelector("#technicianSelect");
    const technicianId = technicianSelect && technicianSelect.value ? technicianSelect.value : null;

    const button = document.querySelector("#saveButton");

    const technicianText = technicianId
        ? (technicianSelect.selectedOptions?.[0]?.textContent || "Assigned")
        : "No technician assigned";

    const confirmed = window.confirm(
        "Save these changes?\n\n" +
        `Status: ${formatStatus(status)}\n` +
        `Technician: ${technicianText}`
    );

    if (!confirmed) return;

    try {
        if (button) {
            button.disabled = true;
            button.textContent = "Saving...";
        }

        const response = await fetch(
            `${API_BASE}/admin/requests/${encodeURIComponent(requestId)}`,
            {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status, technician_id: technicianId })
            }
        );

        const result = await parseResponse(response);

        if (result.data) {
            requestData = { ...requestData, ...result.data };
        }

        requestData.status = result.data?.status || status;
        selectedStatus = requestData.status;

        renderStatus(requestData);

        if (technicianSelect) {
            technicianSelect.value = technicianId || "";
        }

        if (button) button.textContent = "Saved ✓";

        // Reload from the database to confirm the change persisted.
        await loadRequest();

        alert(result.message || "Changes saved successfully.");

    } catch (error) {
        console.error("Save request error:", error);
        if (handleAuthError(error)) return;
        alert(error.message || "Unable to save changes.");

    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = "Save Changes";
        }
    }
}


/* =========================================================
   META
========================================================= */

function renderMeta(data) {
    const created = document.querySelector("#createdAt");
    const updated = document.querySelector("#updatedAt");
    const completed = document.querySelector("#completedAt");

    if (created) created.textContent = formatDate(data.created_at);
    if (updated) updated.textContent = formatDate(data.updated_at);
    if (completed) completed.textContent = formatDate(data.completed_at);
}


/* =========================================================
   QUOTATION HISTORY
========================================================= */

function quotationMetaItem(label, value) {
    return `
        <div class="quotation-meta-item">
            <div class="label">${escapeHtml(label)}</div>
            <div class="value">${escapeHtml(value)}</div>
        </div>
    `;
}

function renderQuotationHistory(data) {
    const container = document.querySelector("#quotationHistory");
    const uploadSection = document.querySelector("#finalQuotationUpload");
    if (!container) return;

    const quotations = data.quotations || {};
    const original = quotations.original || null;
    const finalQuotation = quotations.final || null;

    let html = "";

    /* ORIGINAL QUOTATION */
    html += `
        <div class="quotation-history-item">
            <div class="quotation-history-item-header">
                <h3>${original ? escapeHtml(original.quotation_number || "Quotation") : "Original quotation — not created"}</h3>
                ${original ? `<small>${escapeHtml(original.status || "draft")}</small>` : ""}
            </div>
            ${
                original
                    ? `
                        <div class="quotation-meta">
                            ${quotationMetaItem("Created", formatDate(original.created_at))}
                            ${quotationMetaItem("Status", original.status || "—")}
                            ${quotationMetaItem("Total", `RM ${Number(original.total || 0).toFixed(2)}`)}
                        </div>
                        ${
                            original.quotation_file_url
                                ? `<a class="quotation-button" href="${escapeHtml(original.quotation_file_url)}" target="_blank" rel="noopener noreferrer">View Original Quotation PDF</a>`
                                : ""
                        }
                    `
                    : `<div class="empty-state">No original quotation found.</div>`
            }
        </div>
    `;

    /* PAYMENT PROOF */
    html += `
        <div class="quotation-history-item">
            <div class="quotation-history-item-header">
                <h3>${original?.payment_proof_name ? escapeHtml(original.payment_proof_name) : "Payment proof — not uploaded"}</h3>
                ${original?.payment_status ? `<small>${escapeHtml(original.payment_status)}</small>` : ""}
            </div>
            ${
                original?.payment_proof_url
                    ? `
                        <div class="quotation-meta">
                            ${quotationMetaItem("Status", original.payment_status || "proof_uploaded")}
                            ${quotationMetaItem("Uploaded", formatDate(original.payment_proof_uploaded_at))}
                        </div>
                        <a class="payment-proof-button" href="${escapeHtml(original.payment_proof_url)}" target="_blank" rel="noopener noreferrer">View Payment Proof</a>
                    `
                    : `<div class="empty-state">No payment proof has been uploaded.</div>`
            }
        </div>
    `;

    /* FINAL QUOTATION */
    html += `
        <div class="quotation-history-item">
            <div class="quotation-history-item-header">
                <h3>${finalQuotation ? escapeHtml(finalQuotation.quotation_number || "Final Quotation") : "Final quotation — not uploaded"}</h3>
                ${finalQuotation ? `<small>Final</small>` : ""}
            </div>
            ${
                finalQuotation
                    ? `
                        <div class="quotation-meta">
                            ${quotationMetaItem("Uploaded", formatDate(finalQuotation.created_at))}
                            ${quotationMetaItem("Status", finalQuotation.status || "sent")}
                        </div>
                        ${
                            finalQuotation.quotation_file_url
                                ? `<a class="view-quotation-button" href="${escapeHtml(finalQuotation.quotation_file_url)}" target="_blank" rel="noopener noreferrer">View Final Quotation PDF</a>`
                                : ""
                        }
                    `
                    : `<div class="empty-state">No final quotation has been uploaded yet.</div>`
            }
        </div>
    `;

    container.innerHTML = html;

    // Final quotation upload is only available once the job is completed.
    if (uploadSection) {
        uploadSection.hidden = data.status !== "completed";
    }
}


/* =========================================================
   FINAL QUOTATION MESSAGE
========================================================= */

function showFinalQuotationMessage(message, isError = false) {
    const element = document.querySelector("#finalQuotationMessage");
    if (!element) return;

    element.textContent = message;
    element.className = `quotation-upload-message ${isError ? "error" : "success"}`;
    element.hidden = false;
}


/* =========================================================
   UPLOAD FINAL QUOTATION
========================================================= */

async function uploadFinalQuotation() {
    const requestId = getRequestId();
    const fileInput = document.querySelector("#finalQuotationFile");
    const button = document.querySelector("#uploadFinalQuotationButton");

    if (!requestId) {
        showFinalQuotationMessage("Request ID is missing.", true);
        return;
    }

    if (!fileInput || !fileInput.files.length) {
        showFinalQuotationMessage("Please select a PDF file.", true);
        return;
    }

    const file = fileInput.files[0];

    const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
        showFinalQuotationMessage("Final quotation must be a PDF file.", true);
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showFinalQuotationMessage("File is too large. Maximum size is 10 MB.", true);
        return;
    }

    const existingFinal = Boolean(requestData?.quotations?.final);

    const confirmed = window.confirm(
        existingFinal
            ? "A final quotation already exists. Uploading this file will replace the existing final quotation. Continue?"
            : "Upload this final quotation?"
    );

    if (!confirmed) return;

    const formData = new FormData();
    formData.append("quotation_file", file);

    try {
        if (button) {
            button.disabled = true;
            button.textContent = "Uploading...";
        }

        showFinalQuotationMessage("Uploading final quotation...", false);

        const response = await fetch(
            `${API_BASE}/quotations/${encodeURIComponent(requestId)}/final-quotation`,
            {
                method: "POST",
                headers: { "Authorization": `Bearer ${getToken()}` },
                body: formData
            }
        );

        const result = await parseResponse(response);

        fileInput.value = "";
        await loadRequest();

        showFinalQuotationMessage(result.message || "Final quotation uploaded successfully.", false);

    } catch (error) {
        console.error("Upload final quotation error:", error);
        if (handleAuthError(error)) return;
        showFinalQuotationMessage(error.message || "Unable to upload final quotation.", true);

    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = "Upload Final Quotation";
        }
    }
}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {
    localStorage.removeItem("securepro_admin_token");
    localStorage.removeItem("securepro_admin_user");
    window.location.href = "login.html";
}


/* =========================================================
   ADMIN INFORMATION
========================================================= */

function loadAdminInfo() {
    try {
        const raw = localStorage.getItem("securepro_admin_user");
        if (!raw) return;

        const user = JSON.parse(raw);
        const name = user.name || "Admin";

        const sidebar = document.querySelector("#sidebarAdminName");
        const topbar = document.querySelector("#topbarAdminName");

        if (sidebar) sidebar.textContent = name;
        if (topbar) topbar.textContent = name;

    } catch (error) {
        console.warn("Unable to load admin information:", error);
    }
}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    if (!requireToken()) return;

    loadAdminInfo();
    setupStatusSelect();

    const saveButton = document.querySelector("#saveButton");
    if (saveButton) saveButton.addEventListener("click", saveChanges);

    const logoutButton = document.querySelector("#logoutButton");
    if (logoutButton) logoutButton.addEventListener("click", logout);

    const uploadButton = document.querySelector("#uploadFinalQuotationButton");
    if (uploadButton) uploadButton.addEventListener("click", uploadFinalQuotation);

    const saveTechnicianButton =
    document.querySelector("#saveTechnicianButton");

if (saveTechnicianButton) {
    saveTechnicianButton.addEventListener(
        "click",
        saveTechnicianAssignment
    );
}

const technicianSelect =
    document.querySelector("#technicianSelect");

if (technicianSelect) {
    technicianSelect.addEventListener(
        "change",
        updateTechnicianDisplay
    );
}

    loadRequest();
});