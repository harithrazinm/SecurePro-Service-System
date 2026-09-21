/* =========================================================
   SECUREPRO ADMIN — REQUEST DETAILS
   Fixed version
========================================================= */


/* =========================================================
   API CONFIGURATION
========================================================= */

const IS_LOCAL = ["localhost", "127.0.0.1"].includes(window.location.hostname);

const BACKEND_BASE = IS_LOCAL
    ? "http://localhost:5001"
    : "https://securepro-service-system.onrender.com";

const API_BASE = `${BACKEND_BASE}/api`;


/* =========================================================
   GLOBAL DATA
========================================================= */

let requestData = null;
let selectedStatus = null;
let techniciansCache = null;

const $ = (selector) => document.querySelector(selector);


/* =========================================================
   SESSION / AUTH
========================================================= */

function getToken() {
    return localStorage.getItem("securepro_admin_token");
}

function getRequestId() {
    return new URLSearchParams(window.location.search).get("id");
}

function redirectToLogin() {
    window.location.href = "login.html";
}

function clearSession() {
    localStorage.removeItem("securepro_admin_token");
    localStorage.removeItem("securepro_admin_user");
}

function requireToken() {
    if (!getToken()) {
        redirectToLogin();
        return false;
    }
    return true;
}

/*
 * Only a real HTTP 401 logs the admin out.
 * (Matching words like "token" in the message was too fragile.)
 */
function handleAuthError(error) {
    if (error?.status === 401) {
        clearSession();
        redirectToLogin();
        return true;
    }
    return false;
}


/* =========================================================
   GENERAL HELPERS
========================================================= */

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" });
}

function formatLabel(value) {
    if (value === null || value === undefined || value === "") return "";
    return String(value)
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, letter => letter.toUpperCase());
}

/* <input type="date"> needs YYYY-MM-DD, even if the API sends a full ISO string. */
function toDateInputValue(value) {
    const match = String(value || "").match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : "";
}

/* <input type="time"> needs HH:MM. */
function toTimeInputValue(value) {
    const match = String(value || "").match(/^(\d{2}:\d{2})/);
    return match ? match[1] : "";
}

function resolveFileUrl(path) {
    const rawPath = String(path || "").trim();
    if (!rawPath) return "";
    if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) return rawPath;
    return `${BACKEND_BASE}${rawPath.startsWith("/") ? "" : "/"}${rawPath}`;
}

function moneyValue(value) {
    const number = Number(value || 0);
    return Number.isFinite(number) ? number : 0;
}

function moneyText(value) {
    return `RM ${moneyValue(value).toFixed(2)}`;
}

function metaItem(label, value) {
    return `<div class="quotation-meta-item"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(value)}</div></div>`;
}


/* =========================================================
   STATUS FORMATTERS
========================================================= */

const REQUEST_STATUSES = [
    "pending", "assigned", "in_progress",
    "waiting_parts", "awaiting_payment", "completed", "cancelled"
];

function formatStatus(status) {
    const labels = {
        pending: "Pending",
        assigned: "Assigned",
        in_progress: "In Progress",
        waiting_parts: "Waiting Parts",
        awaiting_payment: "Awaiting Payment",
        completed: "Completed",
        cancelled: "Cancelled"
    };
    return labels[status] || status || "Unknown";
}

function statusClass(status) {
    return REQUEST_STATUSES.includes(status) ? status : "pending";
}

function formatReportStatus(status) {
    const labels = {
        draft: "Draft",
        submitted: "Submitted",
        approved: "Approved",
        rejected: "Rejected"
    };
    return labels[status] || status || "Unknown";
}

function formatInvoiceStatus(status) {
    const labels = {
        draft: "Draft",
        sent: "Sent",
        payment_submitted: "Payment Submitted",
        paid: "Paid",
        cancelled: "Cancelled"
    };
    return labels[status] || status || "Unknown";
}

function formatPaymentStatus(status) {
    const labels = {
        pending: "Pending Verification",
        verified: "Verified",
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
        } else if (response.status === 403) {
            message = result?.message || "You do not have permission to perform this action.";
        } else if (response.status === 404) {
            message = result?.message || "API endpoint or request was not found.";
        }

        const error = new Error(message);
        error.status = response.status;
        throw error;
    }

    return result;
}


/* =========================================================
   ERROR DISPLAY
========================================================= */

function showError(message) {
    const element = $("#requestError");

    if (!element) {
        console.error(message);
        return;
    }

    element.textContent = message || "Unable to load request.";
    element.hidden = false;
}

function hideError() {
    const element = $("#requestError");
    if (!element) return;
    element.textContent = "";
    element.hidden = true;
}

/* Replaces the "Loading..." placeholders when the first load fails. */
function showLoadFailure() {
    const code = $("#requestCode");
    const service = $("#requestService");
    const badge = $("#requestStatusBadge");

    if (code) code.textContent = "Unable to load request";
    if (service) service.textContent = "";
    if (badge) badge.hidden = true;
}


/* =========================================================
   LOAD REQUEST
   silent = true  →  refresh the data without hiding the page
   or resetting the scroll position (used after actions).
========================================================= */

async function loadRequest({ silent = false } = {}) {
    hideError();

    const requestId = getRequestId();

    if (!requestId) {
        showError("No request ID was provided.");
        showLoadFailure();
        return;
    }

    if (!getToken()) {
        redirectToLogin();
        return;
    }

    const loading = $("#requestLoading");
    const details = $("#requestDetails");

    if (!silent) {
        if (loading) loading.hidden = false;
        if (details) details.hidden = true;
    }

    try {
        const response = await fetch(
            `${API_BASE}/admin/requests/${encodeURIComponent(requestId)}`,
            { method: "GET", headers: { Authorization: `Bearer ${getToken()}` } }
        );

        const result = await parseResponse(response);
        requestData = result.data;
        renderRequest(requestData);

    } catch (error) {
        console.error("Request details error:", error);
        if (handleAuthError(error)) return;

        showError(error.message || "Unable to load request.");
        if (!requestData) showLoadFailure();

    } finally {
        if (!silent && loading) loading.hidden = true;
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
    renderProgressReports(data);
    renderTechnicianReport(data);
    renderInvoiceSection(data);
    renderStatus(data);
    renderAssignment(data);
    renderMeta(data);

    const details = $("#requestDetails");
    if (details) details.hidden = false;

    loadTechnicians(data);
}


/* =========================================================
   HEADER / SERVICE
========================================================= */

function getServiceName(data) {
    return (
        data.service_name ||
        data.service?.name_en ||
        data.service?.name?.en ||
        data.service_name_en ||
        "—"
    );
}

function renderHeader(data) {
    const status = data.status || "pending";

    const requestCode = $("#requestCode");
    const requestService = $("#requestService");
    const statusBadge = $("#requestStatusBadge");

    if (requestCode) requestCode.textContent = data.request_code || "—";
    if (requestService) requestService.textContent = getServiceName(data);

    if (statusBadge) {
        statusBadge.hidden = false;
        statusBadge.textContent = formatStatus(status);
        statusBadge.className = `status-badge ${statusClass(status)}`;
    }
}

function renderService(data) {
    const element = $("#serviceName");
    if (element) element.textContent = getServiceName(data);
}


/* =========================================================
   CUSTOMER
========================================================= */

function renderCustomer(data) {
    const container = $("#customerGrid");
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
        <div class="customer-field"><span class="field-label">Customer Name</span><div class="field-value">${escapeHtml(name)}</div></div>
        <div class="customer-field"><span class="field-label">Phone</span><div class="field-value">${phoneHtml}</div></div>
        <div class="customer-field"><span class="field-label">Email</span><div class="field-value">${emailHtml}</div></div>
        <div class="customer-field full-width"><span class="field-label">Installation Address</span><div class="field-value">${escapeHtml(address)}</div></div>
    `;
}


/* =========================================================
   CUSTOMER ANSWERS — LABELS
========================================================= */

const QUESTION_LABELS = {
    location: "Installation Location",
    installation_location: "Installation Location",
    property_type: "Property Type",
    building_type: "Building Type",
    camera_location: "Camera Location",
    camera_light: "Camera Light Type",
    camera_light_type: "Camera Light Type",
    light_type: "Camera Light Type",
    installation_type: "Installation Type",
    wiring_type: "Installation Type",
    wiring: "Installation Type",
    connection_type: "Installation Type",
    camera_quantity: "Camera Quantity",
    quantity: "Quantity",
    camera_resolution: "Camera Resolution",
    resolution: "Camera Resolution",
    additional_equipment: "Additional Equipment",
    equipment: "Additional Equipment",
    accessories: "Additional Accessories",
    additional_accessories: "Additional Accessories",
    alarm_type: "Alarm Type",
    alarm: "Alarm Type",
    alarm_area: "Alarm Areas",
    technical_features: "Technical Features",
    features: "Technical Features",
    internet: "Internet Availability",
    internet_available: "Internet Availability",
    internet_access: "Internet Availability",
    site_visit: "Site Visit Requirement",
    request_site_visit: "Site Visit Requirement",
    coverage: "Coverage Area",
    coverage_area: "Coverage Area",
    areas: "Coverage Area"
};

function getAnswerCode(answer) {
    return String(answer.question_code || answer.code || answer.key || "")
        .trim()
        .toLowerCase();
}

function getQuestionDisplayLabel(answer) {
    const question = String(answer.question?.en || "").trim();

    // "Customer Requirement" is a generic placeholder, not useful to admin.
    if (question && question.toLowerCase() !== "customer requirement") {
        return question;
    }

    const code = getAnswerCode(answer);

    if (QUESTION_LABELS[code]) return QUESTION_LABELS[code];
    if (code) return formatLabel(code);

    return "Customer Requirement";
}


/* =========================================================
   CUSTOMER ANSWERS — VALUES
========================================================= */

const ANSWER_VALUE_LABELS = {
    dual_light: "Dual Light",
    single_light: "Single Light",
    "1080p_2mp": "1080P 2MP",
    "1080p 2mp": "1080P 2MP",
    wired: "Wired",
    wireless: "Wireless",
    home: "Home",
    office: "Office",
    shop: "Shop",
    yes: "Yes",
    no: "No",
    true: "Yes",
    false: "No",
    none: "None",
    monitor: "TV / Screen Monitor",
    tv: "TV / Screen Monitor",
    screen_monitor: "TV / Screen Monitor",
    rack: "4U Server Rack Cabinet",
    server_rack: "4U Server Rack Cabinet",
    ups: "UPS (Battery Backup)",
    battery_backup: "UPS (Battery Backup)",
    audio_alarm: "Audio Alarm",
    internet_available: "Internet Available",
    site_visit: "Site Visit",
    request_site_visit: "Request Site Visit"
};

const ACRONYMS = {
    cctv: "CCTV", ups: "UPS", nvr: "NVR", dvr: "DVR",
    poe: "PoE", tv: "TV", hdd: "HDD", ip: "IP", led: "LED"
};

function capitalizeWord(word) {
    const lower = word.toLowerCase();
    if (ACRONYMS[lower]) return ACRONYMS[lower];
    return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/*
 * Turns any answer shape (array / object / JSON string / text)
 * into a flat list of strings.
 */
function normalizeAnswerValues(value) {
    if (value === null || value === undefined || value === "") return [];

    if (Array.isArray(value)) {
        return value.flatMap(item => normalizeAnswerValues(item)).filter(Boolean);
    }

    if (typeof value === "object") {
        const candidates = [
            value.label?.en, value.label,
            value.name?.en, value.name,
            value.value?.en, value.value,
            value.text?.en, value.text,
            value.en,
            value.option_label_en, value.option_value
        ];

        for (const item of candidates) {
            if (item !== null && item !== undefined && item !== "") {
                return normalizeAnswerValues(item);
            }
        }

        /*
         * Multi-field answer, e.g. { indoor: 1, outdoor: 1 }.
         * Keep the key so it shows "Indoor: 1" / "Outdoor: 1"
         * instead of just "1" and "1".
         */
        return Object.entries(value).flatMap(([key, item]) => {
            const parts = normalizeAnswerValues(item);
            if (!parts.length) return [];
            return [`${formatLabel(key)}: ${parts.join(", ")}`];
        });
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return [];

        const looksLikeJson =
            (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
            (trimmed.startsWith("{") && trimmed.endsWith("}"));

        if (looksLikeJson) {
            try {
                return normalizeAnswerValues(JSON.parse(trimmed));
            } catch {
                // Not JSON — treat as text.
            }
        }

        /*
         * Split on commas ONLY for lists of code-style tokens
         * (e.g. "wired,ups"). Sentences and numbers like "1,000"
         * are left intact.
         */
        const isThousands = /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(trimmed);

        if (trimmed.includes(",") && !isThousands) {
            const parts = trimmed.split(",").map(part => part.trim()).filter(Boolean);

            if (parts.length > 1 && parts.every(part => /^[A-Za-z0-9_.-]+$/.test(part))) {
                return parts;
            }
        }

        return [trimmed];
    }

    return [String(value)];
}

/*
 * Prettifies machine-style values only.
 * Real free text (model names, sentences, phone numbers) is untouched.
 * `code` is the question code, used to decide if a range means "Areas".
 */
function formatAnswerValue(value, code = "") {
    const text = String(value ?? "").trim();
    if (!text) return "Not specified";

    const key = text.toLowerCase();

    if (ANSWER_VALUE_LABELS[key]) return ANSWER_VALUE_LABELS[key];

    // 4mp, 8mp, 1080p ...
    if (/^\d+(mp|p|k)$/.test(key)) return text.toUpperCase();

    // Ranges: 1_4 / 1-4
    const range = key.match(/^(\d+)[_-](\d+)$/);
    if (range) {
        if (/area|coverage/.test(String(code).toLowerCase())) {
            return `${range[1]}–${range[2]} Areas`;
        }
        if (key.includes("_")) return `${range[1]}–${range[2]}`;
        return text;
    }

    // indoor_1 / outdoor2
    const counter = key.match(/^(indoor|outdoor)[_-]?(\d+)$/);
    if (counter) {
        return `${capitalizeWord(counter[1])}: ${counter[2]}`;
    }

    // snake_case (lowercase with underscores) → Title Case
    if (/^[a-z0-9]+(_[a-z0-9]+)+$/.test(text)) {
        return text.split("_").map(capitalizeWord).join(" ");
    }

    // Single lowercase word → capitalize
    if (/^[a-z]+$/.test(text)) return capitalizeWord(text);

    // Anything else is real text: leave it exactly as the customer wrote it.
    return text;
}

function getAnswerDisplayValue(answer) {
    const isEmpty = v => v === null || v === undefined || v === "";

    let value = answer.answer;

    if (isEmpty(value) && !isEmpty(answer.number_value)) {
        value = answer.number_value;
    }

    if (isEmpty(value)) {
        value = answer.text_value;
    }

    if (isEmpty(value) && Array.isArray(answer.options) && answer.options.length) {
        value = answer.options
            .map(option =>
                option.option_label_en ||
                option.label?.en ||
                option.option_value ||
                option.value ||
                ""
            )
            .filter(Boolean);
    }

    return isEmpty(value) ? "Not specified" : value;
}

function renderAnswers(data) {
    const container = $("#answersGrid");
    if (!container) return;

    const answers = Array.isArray(data.answers) ? data.answers : [];

    if (!answers.length) {
        container.innerHTML = `<div class="empty-state"><strong>No customer requirements found</strong><span>This request does not contain any service answers.</span></div>`;
        return;
    }

    container.innerHTML = answers.map((answer, index) => {
        const question = getQuestionDisplayLabel(answer);
        const code = getAnswerCode(answer);

        const values = normalizeAnswerValues(getAnswerDisplayValue(answer))
            .map(item => formatAnswerValue(item, code))
            .filter(Boolean);

        const chips = values.length
            ? values.map(item => `<span class="answer-chip">${escapeHtml(item)}</span>`).join("")
            : `<span class="answer-chip">Not specified</span>`;

        return `<article class="answer-item"><div class="answer-index">${String(index + 1).padStart(2, "0")}</div><div class="answer-content"><div class="answer-question">${escapeHtml(question)}</div><div class="answer-value">${chips}</div></div></article>`;
    }).join("");
}


/* =========================================================
   CUSTOMER NOTES
   (values are written on ONE line — the CSS uses
   white-space: pre-wrap, so extra whitespace would show.)
========================================================= */

function renderNotes(data) {
    const container = $("#customerNotes");
    if (!container) return;

    const notes = data.customer_notes || data.customer?.notes || "";

    if (!String(notes).trim()) {
        container.innerHTML = `<div class="empty-state">The customer did not provide additional notes.</div>`;
        return;
    }

    container.innerHTML = `<p class="notes-text">${escapeHtml(notes)}</p>`;
}


/* =========================================================
   CUSTOMER PHOTOS
========================================================= */

function renderPhotos(data) {
    const container = $("#photosGrid");
    const count = $("#photoCount");
    if (!container) return;

    const photos = Array.isArray(data.photos) ? data.photos : [];

    if (count) {
        count.textContent = `${photos.length} ${photos.length === 1 ? "photo" : "photos"}`;
    }

    if (!photos.length) {
        container.innerHTML = `<div class="empty-state">No photos were uploaded with this request.</div>`;
        return;
    }

    container.innerHTML = photos.map((photo, index) => {
        const url = resolveFileUrl(photo.file_path);
        const fileName = photo.file_name || `Customer Photo ${index + 1}`;

        return `<a class="photo-card" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer"><img src="${escapeHtml(url)}" alt="${escapeHtml(fileName)}" loading="lazy" onerror="this.style.display='none';"><span class="photo-name">${escapeHtml(fileName)}</span></a>`;
    }).join("");
}


/* =========================================================
   MEDIA CARD (shared by progress + completion media)
========================================================= */

function renderMediaCard(item, index, { cardClass, nameClass = "", fallbackName }) {
    const url = resolveFileUrl(item.file_path);

    const type =
        item.media_type ||
        (item.mime_type?.startsWith("video/") ? "video" : "image");

    const fileName = item.file_name || `${fallbackName} ${index + 1}`;
    const nameAttr = nameClass ? ` class="${nameClass}"` : "";

    if (type === "video") {
        return `<div class="${cardClass}"><video src="${escapeHtml(url)}" controls preload="metadata"></video><span${nameAttr}>${escapeHtml(fileName)}</span></div>`;
    }

    return `<a class="${cardClass}" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer"><img src="${escapeHtml(url)}" alt="${escapeHtml(fileName)}" loading="lazy"><span${nameAttr}>${escapeHtml(fileName)}</span></a>`;
}

function renderProgressMedia(item, index) {
    return renderMediaCard(item, index, {
        cardClass: "progress-media-card",
        fallbackName: "Progress Media"
    });
}


/* =========================================================
   SERVICE PROGRESS
========================================================= */

function renderProgressReports(data) {
    const timeline = $("#progressTimeline");
    const empty = $("#progressReportsEmpty");
    if (!timeline) return;

    const reports = Array.isArray(data.progress_reports)
        ? data.progress_reports.filter(report => report.report_type === "progress")
        : [];

    if (!reports.length) {
        timeline.innerHTML = "";
        if (empty) empty.hidden = false;
        return;
    }

    if (empty) empty.hidden = true;

    timeline.innerHTML = reports.map((report, index) => {
        const number = report.progress_number || index + 1;
        const title = report.report_title || `Progress Update ${number}`;
        const media = Array.isArray(report.media) ? report.media : [];

        const statusKey = ["draft", "submitted", "approved", "rejected"].includes(report.status)
            ? report.status
            : "unknown";

        const mediaHtml = media.length
            ? `<div class="progress-media-section"><div class="progress-media-heading"><span>Progress Media</span><span>${media.length} ${media.length === 1 ? "file" : "files"}</span></div><div class="progress-media-grid">${media.map((item, i) => renderProgressMedia(item, i)).join("")}</div></div>`
            : "";

        const remarksHtml = report.review_remarks
            ? `<div class="progress-review-remarks"><div class="report-label">Admin Remarks</div><div class="report-value">${escapeHtml(report.review_remarks)}</div></div>`
            : "";

        return `<article class="progress-item"><div class="progress-marker">${escapeHtml(number)}</div><div class="progress-card"><div class="progress-card-header"><div><div class="progress-kicker">Progress Update ${escapeHtml(number)}</div><h3 class="progress-title">${escapeHtml(title)}</h3></div><div class="progress-meta"><span class="progress-status ${statusKey}">${escapeHtml(formatReportStatus(report.status))}</span><span class="progress-date">${escapeHtml(formatDate(report.submitted_at || report.created_at))}</span></div></div><div class="progress-grid"><div class="progress-field progress-field-full"><div class="report-label">Work Performed</div><div class="report-value">${escapeHtml(report.work_performed || "—")}</div></div><div class="progress-field progress-field-full"><div class="report-label">Findings</div><div class="report-value">${escapeHtml(report.findings || "—")}</div></div><div class="progress-field"><div class="report-label">Materials Used</div><div class="report-value">${escapeHtml(report.materials_used || "—")}</div></div><div class="progress-field"><div class="report-label">Technician Notes</div><div class="report-value">${escapeHtml(report.technician_notes || "—")}</div></div><div class="progress-field"><div class="report-label">Reported By</div><div class="report-value report-writer-display">${escapeHtml(report.reported_by || "—")}</div></div></div>${mediaHtml}${remarksHtml}</div></article>`;
    }).join("");
}


/* =========================================================
   TECHNICIAN FINAL REPORT
========================================================= */

function setReportBadge(statusKey, label) {
    const badge = $("#technicianReportStatus");
    if (!badge) return;
    badge.textContent = label;
    badge.className = `status-badge report-${statusKey}`;
}

function renderTechnicianReport(data) {
    const card = $("#technicianReportCard");
    if (!card) return;

    const report = data.report || null;
    card.hidden = false;

    const work = $("#reportWorkPerformed");
    const findings = $("#reportFindings");
    const materials = $("#reportMaterialsUsed");
    const notes = $("#reportTechnicianNotes");
    const reportedBy = $("#reportReportedBy");

    if (!report) {
        setReportBadge("none", "No report submitted");

        if (work) work.textContent = "The technician has not submitted a work report yet.";
        if (findings) findings.textContent = "—";
        if (materials) materials.textContent = "—";
        if (notes) notes.textContent = "—";
        if (reportedBy) reportedBy.textContent = "—";

        const remarksCard = $("#reportReviewRemarks");
        if (remarksCard) remarksCard.hidden = true;

        renderCompletionMedia([]);
        hideReportReview();
        return;
    }

    const statusKey = ["draft", "submitted", "approved", "rejected"].includes(report.status)
        ? report.status
        : "none";

    setReportBadge(statusKey, formatReportStatus(report.status));

    if (work) work.textContent = report.work_performed || "—";
    if (findings) findings.textContent = report.findings || "—";
    if (materials) materials.textContent = report.materials_used || "—";
    if (notes) notes.textContent = report.technician_notes || "—";
    if (reportedBy) reportedBy.textContent = report.reported_by || "—";

    const remarksCard = $("#reportReviewRemarks");
    const remarksText = $("#reportReviewRemarksText");

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

function renderCompletionMedia(media) {
    const grid = $("#completionMediaGrid");
    const count = $("#completionMediaCount");
    if (!grid) return;

    const items = Array.isArray(media) ? media : [];

    if (count) {
        count.textContent = `${items.length} ${items.length === 1 ? "file" : "files"}`;
    }

    if (!items.length) {
        grid.innerHTML = `<div class="empty-state">No completion photos or videos were uploaded.</div>`;
        return;
    }

    grid.innerHTML = items.map((item, index) =>
        renderMediaCard(item, index, {
            cardClass: "photo-card",
            nameClass: "photo-name",
            fallbackName: "Completion Media"
        })
    ).join("");
}


/* =========================================================
   REPORT REVIEW
========================================================= */

function hideReportReview() {
    const section = $("#reportReviewSection");
    if (section) section.hidden = true;
}

function setupReportReview(report) {
    const section = $("#reportReviewSection");
    const approveButton = $("#approveReportButton");
    const rejectButton = $("#rejectReportButton");
    const rejectForm = $("#rejectForm");
    const cancelRejectButton = $("#cancelRejectButton");
    const confirmRejectButton = $("#confirmRejectButton");

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
            "Are you sure you want to approve this technician report?\n\n" +
            "The service request will be moved to Awaiting Payment. " +
            "It will only become Completed after the final payment is verified."
        );

        if (!confirmed) return;
        await reviewTechnicianReport("approve");
    };

    rejectButton.onclick = () => {
        if (rejectForm) rejectForm.hidden = false;
        $("#rejectReason")?.focus();
    };

    if (cancelRejectButton) {
        cancelRejectButton.onclick = () => {
            if (rejectForm) rejectForm.hidden = true;
            const reason = $("#rejectReason");
            if (reason) reason.value = "";
        };
    }

    if (confirmRejectButton) {
        confirmRejectButton.onclick = async () => {
            const reason = ($("#rejectReason")?.value || "").trim();

            if (!reason) {
                alert("Please enter a rejection reason.");
                return;
            }

            await reviewTechnicianReport("reject", reason);
        };
    }
}

async function reviewTechnicianReport(action, reason = "") {
    if (!requestData) return;

    const approveButton = $("#approveReportButton");
    const rejectButton = $("#rejectReportButton");
    const confirmRejectButton = $("#confirmRejectButton");

    if (approveButton) approveButton.disabled = true;
    if (rejectButton) rejectButton.disabled = true;
    if (confirmRejectButton) confirmRejectButton.disabled = true;

    if (action === "approve") {
        if (approveButton) approveButton.textContent = "Approving...";
    } else if (confirmRejectButton) {
        confirmRejectButton.textContent = "Rejecting...";
    }

    try {
        const response = await fetch(
            `${API_BASE}/admin/requests/${encodeURIComponent(requestData.id)}/report/review`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ action, reason })
            }
        );

        const result = await parseResponse(response);

        await loadRequest({ silent: true });
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


/* =========================================================
   INVOICE HELPERS
========================================================= */

/* Newest first, without relying on backend ordering. */
function sortInvoices(invoices) {
    return [...invoices].sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        if (Number.isNaN(timeA) || Number.isNaN(timeB)) return 0;
        return timeB - timeA;
    });
}

/* The invoice currently in play = newest one that is not cancelled. */
function getActiveInvoice(data) {
    const invoices = Array.isArray(data?.invoices) ? data.invoices : [];
    return sortInvoices(invoices).find(invoice => invoice.status !== "cancelled") || null;
}


/* =========================================================
   INVOICE SECTION
========================================================= */

function renderPaymentRow(payment) {
    const proofUrl = resolveFileUrl(payment.payment_proof_url);
    const status = payment.status || "pending";

    const fileName = payment.payment_proof_name
        ? `<span class="payment-file-name">${escapeHtml(payment.payment_proof_name)}</span>`
        : "";

    const meta = [
        metaItem("Submitted", formatDate(payment.submitted_at)),
        payment.verified_at ? metaItem("Verified", formatDate(payment.verified_at)) : "",
        payment.remarks ? metaItem("Remarks", payment.remarks) : ""
    ].join("");

    const proofLink = proofUrl
        ? `<div class="invoice-actions"><a class="invoice-link" href="${escapeHtml(proofUrl)}" target="_blank" rel="noopener noreferrer">View Payment Proof</a></div>`
        : "";

    const verifyActions = status === "pending"
        ? `<div class="invoice-verify-actions"><button type="button" class="approve-button" data-verify-payment="${escapeHtml(payment.id)}">✓ Confirm Payment</button><button type="button" class="reject-button" data-reject-payment="${escapeHtml(payment.id)}">✕ Reject Payment</button></div>`
        : "";

    return `<div class="payment-row"><div class="payment-row-header"><div><strong>Payment Proof</strong>${fileName}</div><span class="payment-${escapeHtml(status)}">${escapeHtml(formatPaymentStatus(status))}</span></div><div class="invoice-meta-grid">${meta}</div>${proofLink}${verifyActions}</div>`;
}

function renderInvoiceSection(data) {
    const container = $("#invoiceHistory");
    const verificationPanel = $("#paymentVerificationPanel");
    if (!container) return;

    const invoices = sortInvoices(Array.isArray(data.invoices) ? data.invoices : []);
    const active = getActiveInvoice(data);

    if (!invoices.length) {
        container.innerHTML = `<div class="empty-state">No final invoice has been uploaded yet.</div>`;
    } else {
        container.innerHTML = invoices.map(invoice => {
            const payments = Array.isArray(invoice.payments) ? invoice.payments : [];

            const paymentHtml = payments.length
                ? payments.map(renderPaymentRow).join("")
                : `<div class="empty-state">No payment proof has been uploaded for this invoice.</div>`;

            // Admin does not enter an amount, so hide amounts that are empty.
            const meta = [
                moneyValue(invoice.total_amount) > 0 ? metaItem("Invoice Total", moneyText(invoice.total_amount)) : "",
                moneyValue(invoice.amount_paid) > 0 ? metaItem("Amount Paid", moneyText(invoice.amount_paid)) : "",
                moneyValue(invoice.balance_due) > 0 ? metaItem("Balance Due", moneyText(invoice.balance_due)) : "",
                metaItem("Created By", invoice.created_by_name || "—")
            ].join("");

            const invoiceUrl = resolveFileUrl(invoice.invoice_file_url);

            const invoiceLink = invoiceUrl
                ? `<div class="invoice-actions"><a class="invoice-link" href="${escapeHtml(invoiceUrl)}" target="_blank" rel="noopener noreferrer">View Final Invoice PDF</a></div>`
                : "";

            return `<div class="invoice-card"><div class="invoice-card-header"><div><h3>${escapeHtml(invoice.invoice_number || "Final Invoice")}</h3><small>Uploaded ${escapeHtml(formatDate(invoice.created_at))}</small></div><span class="invoice-status">${escapeHtml(formatInvoiceStatus(invoice.status))}</span></div><div class="invoice-meta-grid">${meta}</div>${invoiceLink}<div class="payment-list"><div class="payment-list-title">Customer Payment Proof</div>${paymentHtml}</div></div>`;
        }).join("");
    }

    if (verificationPanel) {
        const hasPendingPayment = invoices.some(invoice =>
            Array.isArray(invoice.payments) &&
            invoice.payments.some(payment => payment.status === "pending")
        );

        const show = hasPendingPayment && active?.status !== "paid";

        verificationPanel.hidden = !show;
        verificationPanel.innerHTML = show
            ? `<div class="invoice-panel-title">Payment Verification</div><p class="invoice-help">Review the customer's payment proof above. Confirming the payment updates the invoice, and the service request is completed according to the payment verification result.</p>`
            : "";
    }

    updateInvoiceFormState(data);
    bindInvoicePaymentActions();
}

function updateInvoiceFormState(data) {
    const active = getActiveInvoice(data);

    const invoiceUploadPanel = $("#invoiceUploadPanel");
    const paymentPanel = $("#paymentPanel");
    const uploadPaymentButton = $("#uploadPaymentProofButton");

    // Invoice upload: shown only while there is no active (non-cancelled) invoice.
    if (invoiceUploadPanel) invoiceUploadPanel.hidden = Boolean(active);

    // Payment proof upload: needs an active invoice that is not yet paid.
    const paymentClosed = !active || active.status === "paid";

    if (paymentPanel) paymentPanel.hidden = paymentClosed;
    if (uploadPaymentButton) uploadPaymentButton.disabled = paymentClosed;
}

function showInvoiceMessage(id, message, error = false) {
    const element = $(`#${id}`);
    if (!element) return;

    element.textContent = message;
    element.className = `invoice-message ${error ? "error" : "success"}`;
    element.hidden = false;
}


/* =========================================================
   UPLOAD FINAL INVOICE
========================================================= */

async function uploadInvoice() {
    const requestId = getRequestId();
    const fileInput = $("#invoiceFile");
    const file = fileInput?.files?.[0];
    const button = $("#uploadInvoiceButton");

    if (!requestId) {
        showInvoiceMessage("invoiceUploadMessage", "Request ID is missing.", true);
        return;
    }

    if (!file) {
        showInvoiceMessage("invoiceUploadMessage", "Please select the final invoice PDF.", true);
        return;
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
        showInvoiceMessage("invoiceUploadMessage", "Final invoice must be a PDF file.", true);
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showInvoiceMessage("invoiceUploadMessage", "File is too large. Maximum size is 10 MB.", true);
        return;
    }

    const confirmed = window.confirm(
        "Upload this final invoice PDF?\n\n" +
        "The invoice amount is already contained inside the PDF. " +
        "No amount entry is required."
    );

    if (!confirmed) return;

    // Only the PDF is uploaded. Admin does not enter an amount.
    const form = new FormData();
    form.append("invoice_file", file);

    try {
        if (button) {
            button.disabled = true;
            button.textContent = "Uploading...";
        }

        showInvoiceMessage("invoiceUploadMessage", "Uploading final invoice...");

        const response = await fetch(
            `${API_BASE}/invoices/request/${encodeURIComponent(requestId)}`,
            {
                method: "POST",
                headers: { Authorization: `Bearer ${getToken()}` },
                body: form
            }
        );

        const result = await parseResponse(response);

        if (fileInput) fileInput.value = "";

        await loadRequest({ silent: true });

        showInvoiceMessage(
            "invoiceUploadMessage",
            result.message || "Final invoice uploaded successfully."
        );

    } catch (error) {
        console.error("Upload invoice error:", error);
        if (handleAuthError(error)) return;

        showInvoiceMessage(
            "invoiceUploadMessage",
            error.message || "Unable to upload final invoice.",
            true
        );

    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = "Upload Final Invoice";
        }
    }
}


/* =========================================================
   UPLOAD PAYMENT PROOF
========================================================= */

async function uploadInvoicePaymentProof() {
    const invoice = getActiveInvoice(requestData);
    const fileInput = $("#paymentProofFile");
    const file = fileInput?.files?.[0];
    const button = $("#uploadPaymentProofButton");

    if (!invoice) {
        showInvoiceMessage("paymentUploadMessage", "Upload a final invoice first.", true);
        return;
    }

    if (!file) {
        showInvoiceMessage("paymentUploadMessage", "Please select the customer's payment proof.", true);
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showInvoiceMessage("paymentUploadMessage", "File is too large. Maximum size is 10 MB.", true);
        return;
    }

    const confirmed = window.confirm(
        "Upload this payment proof?\n\n" +
        "No payment amount or payment method is required."
    );

    if (!confirmed) return;

    // Only the proof file is uploaded. No amount, no payment method.
    const form = new FormData();
    form.append("payment_proof", file);

    try {
        if (button) {
            button.disabled = true;
            button.textContent = "Uploading...";
        }

        showInvoiceMessage("paymentUploadMessage", "Uploading payment proof...");

        const response = await fetch(
            `${API_BASE}/invoices/${encodeURIComponent(invoice.id)}/payment-proof`,
            {
                method: "POST",
                headers: { Authorization: `Bearer ${getToken()}` },
                body: form
            }
        );

        const result = await parseResponse(response);

        if (fileInput) fileInput.value = "";

        await loadRequest({ silent: true });

        showInvoiceMessage(
            "paymentUploadMessage",
            result.message || "Payment proof uploaded successfully."
        );

    } catch (error) {
        console.error("Upload payment proof error:", error);
        if (handleAuthError(error)) return;

        showInvoiceMessage(
            "paymentUploadMessage",
            error.message || "Unable to upload payment proof.",
            true
        );

    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = "Upload Payment Proof";
        }
    }
}


/* =========================================================
   VERIFY / REJECT PAYMENT
========================================================= */

function bindInvoicePaymentActions() {
    document.querySelectorAll("[data-verify-payment]").forEach(button => {
        button.onclick = () => verifyInvoicePayment(button.dataset.verifyPayment, "approve");
    });

    document.querySelectorAll("[data-reject-payment]").forEach(button => {
        button.onclick = () => verifyInvoicePayment(button.dataset.rejectPayment, "reject");
    });
}

async function verifyInvoicePayment(paymentId, action) {
    let remarks = "";

    if (action === "reject") {
        const input = window.prompt("Enter the reason for rejecting this payment proof:");

        // Cancel (null) or empty reason → stop.
        if (input === null || !input.trim()) return;
        remarks = input.trim();

    } else {
        const input = window.prompt("Optional verification remark:", "Payment verified.");

        // Cancel (null) must NOT approve the payment.
        if (input === null) return;
        remarks = input.trim();
    }

    const confirmed = window.confirm(
        action === "approve" ? "Confirm this payment proof?" : "Reject this payment proof?"
    );

    if (!confirmed) return;

    try {
        const response = await fetch(
            `${API_BASE}/invoices/payments/${encodeURIComponent(paymentId)}/verify`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`
                },
                body: JSON.stringify({ action, remarks: remarks || null })
            }
        );

        const result = await parseResponse(response);

        await loadRequest({ silent: true });
        alert(result.message || "Payment updated successfully.");

    } catch (error) {
        console.error("Verify invoice payment error:", error);
        if (handleAuthError(error)) return;
        alert(error.message || "Unable to update payment.");
    }
}


/* =========================================================
   REQUEST STATUS
   The backend status is the single source of truth: the
   header badge, the status card and the dropdown all show
   data.status.
========================================================= */

function renderStatus(data) {
    const status = data.status || "pending";
    selectedStatus = status;

    const currentBadge = $("#currentStatusBadge");

    if (currentBadge) {
        currentBadge.textContent = formatStatus(status);
        currentBadge.className = `status-current-value status-badge ${statusClass(status)}`;
    }

    const select = $("#requestStatus");
    if (!select) return;

    // Reset first, so options disabled by an earlier render don't stay disabled.
    Array.from(select.options).forEach(option => {
        option.disabled = false;
        option.title = "";
    });

    select.value = status;

    const hasPaidInvoice =
        Array.isArray(data.invoices) &&
        data.invoices.some(invoice => invoice.status === "paid");

    const completedOption = select.querySelector('option[value="completed"]');
    const awaitingPaymentOption = select.querySelector('option[value="awaiting_payment"]');

    if (completedOption) {
        completedOption.disabled = !hasPaidInvoice && status !== "completed";

        if (completedOption.disabled) {
            completedOption.title =
                "Complete the service request only after the final invoice payment has been verified.";
        }
    }

    if (awaitingPaymentOption) {
        awaitingPaymentOption.disabled = status === "completed" || status === "cancelled";
    }

    // A completed request cannot be moved backwards manually.
    if (status === "completed") {
        Array.from(select.options).forEach(option => {
            if (option.value !== "completed") option.disabled = true;
        });
    }
}

function setupStatusSelect() {
    const select = $("#requestStatus");
    if (!select) return;

    select.addEventListener("change", () => {
        selectedStatus = select.value;

        const currentBadge = $("#currentStatusBadge");

        if (currentBadge) {
            currentBadge.textContent = formatStatus(selectedStatus);
            currentBadge.className =
                `status-current-value status-badge ${statusClass(selectedStatus)}`;
        }
    });
}


/* =========================================================
   TECHNICIANS
========================================================= */

function formatTechnicianLabel(technician) {
    if (!technician) return "No technician assigned";

    const name = technician.name || "";
    const email = technician.email || "";

    if (name && email) return `${name} — ${email}`;
    return name || email || "Technician";
}

/* The technician list is fetched once and reused on every re-render. */
async function fetchTechnicians() {
    if (techniciansCache) return techniciansCache;

    const response = await fetch(
        `${API_BASE}/admin/technicians`,
        { method: "GET", headers: { Authorization: `Bearer ${getToken()}` } }
    );

    const result = await parseResponse(response);
    techniciansCache = Array.isArray(result.data) ? result.data : [];

    return techniciansCache;
}

function addTechnicianOption(select, id, label) {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = label;
    select.appendChild(option);
}

async function loadTechnicians(data = requestData) {
    const select = $("#technicianSelect");
    if (!select) return;

    try {
        select.disabled = true;

        if (!techniciansCache) {
            select.innerHTML = `<option value="">Loading technicians...</option>`;
        }

        const technicians = await fetchTechnicians();

        const current = data?.technician || null;
        const currentId = current?.id || data?.technician_id || "";

        select.innerHTML = "";
        addTechnicianOption(select, "", "No technician assigned");

        technicians.forEach(technician => {
            addTechnicianOption(select, technician.id, formatTechnicianLabel(technician));
        });

        // If the assigned technician is missing from the list, keep them selectable
        // so the current assignment is shown correctly.
        if (currentId && !technicians.some(t => String(t.id) === String(currentId))) {
            addTechnicianOption(
                select,
                currentId,
                current ? formatTechnicianLabel(current) : "Currently assigned technician"
            );
        }

        select.value = currentId || "";
        select.disabled = false;

        updateTechnicianDisplay();

    } catch (error) {
        console.error("Unable to load technicians:", error);
        if (handleAuthError(error)) return;

        select.innerHTML = `<option value="">Unable to load technicians</option>`;
        select.disabled = false;
    }
}

function updateTechnicianDisplay() {
    const select = $("#technicianSelect");
    const currentName = $("#currentTechnicianName");

    if (!select || !currentName) return;

    const selectedOption = select.options[select.selectedIndex];

    currentName.textContent =
        !select.value || !selectedOption
            ? "No technician assigned"
            : selectedOption.textContent;
}

function renderAssignment(data) {
    const technicianSelect = $("#technicianSelect");
    const scheduledDate = $("#scheduledDate");
    const scheduledTime = $("#scheduledTime");
    const currentName = $("#currentTechnicianName");

    if (!technicianSelect) return;

    const technician = data?.technician || null;
    const technicianId = technician?.id || data?.technician_id || "";

    technicianSelect.value = technicianId;

    // Same label format as the dropdown, so the name doesn't change on load.
    if (currentName) {
        currentName.textContent = technician
            ? formatTechnicianLabel(technician)
            : "No technician assigned";
    }

    if (scheduledDate) scheduledDate.value = toDateInputValue(data?.scheduled_date);
    if (scheduledTime) scheduledTime.value = toTimeInputValue(data?.scheduled_time);

    if (techniciansCache) updateTechnicianDisplay();
}

function showAssignmentMessage(text, type = "") {
    const message = $("#technicianAssignmentMessage");
    if (!message) return;

    message.hidden = false;
    message.className = `assignment-message${type ? ` ${type}` : ""}`;
    message.textContent = text;
}


/* =========================================================
   SAVE TECHNICIAN ASSIGNMENT
========================================================= */

async function saveTechnicianAssignment() {
    if (!requestData) {
        alert("Request information has not loaded yet.");
        return;
    }

    const requestId = getRequestId();

    if (!requestId) {
        alert("Request ID is missing.");
        return;
    }

    if (!getToken()) {
        redirectToLogin();
        return;
    }

    const technicianSelect = $("#technicianSelect");
    const scheduledDate = $("#scheduledDate");
    const scheduledTime = $("#scheduledTime");
    const button = $("#saveTechnicianButton");

    if (!technicianSelect) return;

    // If the list never loaded, the dropdown is empty and saving would
    // wrongly remove the current technician.
    if (!techniciansCache) {
        alert("The technician list has not loaded. Please refresh the page and try again.");
        return;
    }

    const technicianId = technicianSelect.value || null;
    const dateValue = scheduledDate?.value || "";
    const timeValue = scheduledTime?.value || "";

    if (technicianId && !dateValue) {
        alert("Scheduled date is required when assigning a technician.");
        scheduledDate?.focus();
        return;
    }

    const technicianName = technicianId
        ? (technicianSelect.selectedOptions?.[0]?.textContent || "Selected technician")
        : "No technician assigned";

    const confirmed = window.confirm(
        "Confirm technician assignment?\n\n" +
        `Technician: ${technicianName}\n` +
        `Scheduled Date: ${dateValue || "Not scheduled"}\n` +
        `Scheduled Time: ${timeValue || "Not specified"}`
    );

    if (!confirmed) return;

    /*
     * Status rules:
     *  - Assigning from Pending/Assigned → Assigned.
     *  - Any later stage (in progress, waiting parts, awaiting payment ...)
     *    keeps its current status.
     *  - Removing the technician from an Assigned job → back to Pending.
     */
    const currentStatus = requestData.status;
    let nextStatus = currentStatus;

    if (technicianId) {
        if (currentStatus === "pending" || currentStatus === "assigned") {
            nextStatus = "assigned";
        }
    } else if (currentStatus === "assigned") {
        nextStatus = "pending";
    }

    let savedLabel = null;

    try {
        if (button) {
            button.disabled = true;
            button.textContent = "Saving...";
        }

        showAssignmentMessage("Saving technician assignment...");

        const response = await fetch(
            `${API_BASE}/admin/requests/${encodeURIComponent(requestId)}`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    technician_id: technicianId,
                    scheduled_date: dateValue || null,
                    scheduled_time: timeValue || null,
                    status: nextStatus
                })
            }
        );

        await parseResponse(response);
        await loadRequest({ silent: true });

        showAssignmentMessage(
            technicianId
                ? "Technician assigned and schedule saved successfully."
                : "Technician assignment removed.",
            "success"
        );

        savedLabel = technicianId ? "Technician Assigned ✓" : "Assignment Removed ✓";

    } catch (error) {
        console.error("Save technician assignment error:", error);
        if (handleAuthError(error)) return;

        showAssignmentMessage(error.message || "Unable to save technician assignment.", "error");
        alert(error.message || "Unable to save technician assignment.");

    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = savedLabel || "Assign Technician";

            if (savedLabel) {
                setTimeout(() => { button.textContent = "Assign Technician"; }, 1500);
            }
        }
    }
}


/* =========================================================
   SAVE REQUEST STATUS
   Sends ONLY the status. Technician changes go through the
   separate "Assign Technician" button, so changing the status
   can never remove or change the technician by accident.
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

    if (!getToken()) {
        redirectToLogin();
        return;
    }

    const status = selectedStatus || requestData.status || "pending";

    const hasPaidInvoice =
        Array.isArray(requestData.invoices) &&
        requestData.invoices.some(invoice => invoice.status === "paid");

    // Completed is only allowed after payment verification.
    if (status === "completed" && !hasPaidInvoice) {
        alert(
            "This service request cannot be marked as Completed until the final invoice payment has been verified."
        );
        return;
    }

    const confirmed = window.confirm(
        "Save this status change?\n\n" +
        `Status: ${formatStatus(status)}`
    );

    if (!confirmed) return;

    const button = $("#saveButton");

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
                    Authorization: `Bearer ${getToken()}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status })
            }
        );

        const result = await parseResponse(response);

        await loadRequest({ silent: true });
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
    const created = $("#createdAt");
    const updated = $("#updatedAt");
    const completed = $("#completedAt");

    if (created) created.textContent = formatDate(data.created_at);
    if (updated) updated.textContent = formatDate(data.updated_at);
    if (completed) completed.textContent = formatDate(data.completed_at);
}


/* =========================================================
   LOGOUT / ADMIN INFO
========================================================= */

function logout() {
    clearSession();
    redirectToLogin();
}

function loadAdminInfo() {
    try {
        const raw = localStorage.getItem("securepro_admin_user");
        if (!raw) return;

        const name = JSON.parse(raw).name || "Admin";

        const sidebar = $("#sidebarAdminName");
        const topbar = $("#topbarAdminName");

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

    $("#saveButton")?.addEventListener("click", saveChanges);
    $("#logoutButton")?.addEventListener("click", logout);
    $("#uploadInvoiceButton")?.addEventListener("click", uploadInvoice);
    $("#uploadPaymentProofButton")?.addEventListener("click", uploadInvoicePaymentProof);
    $("#saveTechnicianButton")?.addEventListener("click", saveTechnicianAssignment);
    $("#technicianSelect")?.addEventListener("change", updateTechnicianDisplay);

    loadRequest();
});