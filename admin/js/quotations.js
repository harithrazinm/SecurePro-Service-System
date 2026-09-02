const API_BASE = ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "http://localhost:5000/api"
    : "https://securepro-service-system.onrender.com/api";

const token = localStorage.getItem("securepro_admin_token");
let adminUser = null;
try { adminUser = JSON.parse(localStorage.getItem("securepro_admin_user") || "null"); } catch { /* ignored */ }
if (!token) window.location.href = "login.html";

const $ = selector => document.querySelector(selector);
const tableBody = $("#quotationsTableBody");
const errorBox = $("#quotationError");
const modal = $("#quotationModal");
const form = $("#quotationForm");
const requestSelect = $("#requestId");
const proofInput = $("#paymentProofFile");
let quotations = [];
let proofQuotationId = null;

function showError(message, target = errorBox) {
    target.textContent = message;
    target.hidden = false;
}

function hideError(target = errorBox) {
    target.textContent = "";
    target.hidden = true;
}

async function apiRequest(url, options = {}) {
    const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) }
    });
    if ([401, 403].includes(response.status)) {
        localStorage.removeItem("securepro_admin_token");
        localStorage.removeItem("securepro_admin_user");
        window.location.href = "login.html";
        return null;
    }
    const result = await response.json().catch(() => ({ success: false, message: "Invalid server response." }));
    if (!response.ok || !result.success) throw new Error(result.message || "Request failed.");
    return result;
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", "\"": "&quot;" })[character]);
}

function formatDate(value) {
    if (!value || Number.isNaN(new Date(value).getTime())) return "—";
    return new Intl.DateTimeFormat("en-MY", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatStatus(value) {
    return String(value || "draft").replaceAll("_", " ").replace(/\b\w/g, character => character.toUpperCase());
}

function renderQuotations() {
    const search = $("#searchInput").value.trim().toLowerCase();
    const status = $("#statusFilter").value;
    const filtered = quotations.filter(quotation => {
        const text = [quotation.quotation_number, quotation.request_code, quotation.customer_name, quotation.customer_email, quotation.service_name].filter(Boolean).join(" ").toLowerCase();
        return (!search || text.includes(search)) && (!status || quotation.status === status);
    });
    if (!filtered.length) {
        tableBody.innerHTML = '<tr><td colspan="7" class="table-empty">No quotations found.</td></tr>';
        return;
    }
    tableBody.innerHTML = filtered.map(quotation => `
        <tr>
            <td><span class="quotation-number">${escapeHtml(quotation.quotation_number)}</span><span class="quotation-request">${escapeHtml(quotation.request_code || "—")}</span></td>
            <td><span class="customer-name">${escapeHtml(quotation.customer_name || "—")}</span><span class="customer-email">${escapeHtml(quotation.customer_email || "—")}</span></td>
            <td><span class="service-name">${escapeHtml(quotation.service_name || "—")}</span></td>
            <td><span class="quotation-status status-${escapeHtml(quotation.status)}">${formatStatus(quotation.status)}</span></td>
            <td><span class="date-text">${formatDate(quotation.sent_at)}</span></td>
            <td>${quotation.payment_proof_url ? `<button class="action-button" data-open-proof="${quotation.id}">View proof</button><span class="quotation-request">${formatDate(quotation.payment_proof_uploaded_at)}</span>` : '<span class="date-text">Not uploaded</span>'}</td>
            <td><div class="action-group"><button class="action-button" data-open-quotation="${quotation.id}">View PDF</button><button class="action-button send" data-send="${quotation.id}">Mark sent</button><button class="action-button" data-upload-proof="${quotation.id}">Add proof</button></div></td>
        </tr>`).join("");
}

async function loadQuotations() {
    try {
        hideError();
        tableBody.innerHTML = '<tr><td colspan="7" class="table-loading">Loading quotations...</td></tr>';
        const result = await apiRequest("/admin/quotations");
        if (result) { quotations = result.data || []; renderQuotations(); }
    } catch (error) {
        showError(error.message);
        tableBody.innerHTML = '<tr><td colspan="7" class="table-empty">Unable to load quotations.</td></tr>';
    }
}

async function loadRequests() {
    try {
        const result = await apiRequest("/admin/requests");
        if (!result) return;
        requestSelect.innerHTML = '<option value="">Select a service request</option>';
        (result.data || []).forEach(request => {
            const option = document.createElement("option");
            option.value = request.id;
            option.textContent = `${request.request_code} — ${request.customer?.name || request.customer_name || "Unknown customer"}`;
            requestSelect.appendChild(option);
        });
    } catch {
        requestSelect.innerHTML = '<option value="">Unable to load requests</option>';
    }
}

function openModal() { form.reset(); hideError($("#formError")); modal.hidden = false; }
function closeModal() { modal.hidden = true; }

async function submitQuotation(event) {
    event.preventDefault();
    const file = $("#quotationFile").files[0];
    if (!file) return showError("Choose the quotation PDF to upload.", $("#formError"));
    const body = new FormData();
    body.append("request_id", requestSelect.value);
    body.append("notes", $("#notes").value.trim());
    body.append("quotation_file", file);
    const saveButton = $("#saveButton");
    try {
        saveButton.disabled = true;
        saveButton.textContent = "Uploading...";
        const result = await apiRequest("/admin/quotations", { method: "POST", body });
        if (result) { closeModal(); await loadQuotations(); alert(result.message); }
    } catch (error) {
        showError(error.message, $("#formError"));
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Upload quotation";
    }
}

async function markSent(id) {
    if (!confirm("Mark this quotation as sent? The first sent date and time will be saved.")) return;
    try {
        const result = await apiRequest(`/admin/quotations/${encodeURIComponent(id)}/send`, { method: "POST" });
        if (result) { await loadQuotations(); alert(result.message); }
    } catch (error) { showError(error.message); }
}

function openFile(url) {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
}

function choosePaymentProof(id) {
    proofQuotationId = id;
    proofInput.value = "";
    proofInput.click();
}

async function uploadPaymentProof() {
    const file = proofInput.files[0];
    if (!file || !proofQuotationId) return;
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) return showError("Payment proof must be a PDF, JPG, PNG, or WEBP file.");
    const body = new FormData();
    body.append("payment_proof", file);
    try {
        const result = await apiRequest(`/admin/quotations/${encodeURIComponent(proofQuotationId)}/payment-proof`, { method: "POST", body });
        if (result) { await loadQuotations(); alert(result.message); }
    } catch (error) { showError(error.message); }
    finally { proofQuotationId = null; }
}

tableBody.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;
    const id = button.dataset.openQuotation || button.dataset.openProof || button.dataset.send || button.dataset.uploadProof;
    const quotation = quotations.find(item => item.id === id);
    if (button.dataset.openQuotation) openFile(quotation?.quotation_file_url);
    if (button.dataset.openProof) openFile(quotation?.payment_proof_url);
    if (button.dataset.send) markSent(id);
    if (button.dataset.uploadProof) choosePaymentProof(id);
});

$("#createQuotationButton").addEventListener("click", openModal);
$("#closeModalButton").addEventListener("click", closeModal);
$("#cancelButton").addEventListener("click", closeModal);
modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
form.addEventListener("submit", submitQuotation);
proofInput.addEventListener("change", uploadPaymentProof);
$("#searchInput").addEventListener("input", renderQuotations);
$("#statusFilter").addEventListener("change", renderQuotations);
$("#refreshButton").addEventListener("click", loadQuotations);
$("#logoutButton").addEventListener("click", () => { localStorage.removeItem("securepro_admin_token"); localStorage.removeItem("securepro_admin_user"); window.location.href = "login.html"; });

if (adminUser) {
    $("#sidebarAdminName").textContent = adminUser.name || "Admin";
    $("#topbarAdminName").textContent = adminUser.name || "Admin";
}

Promise.all([loadQuotations(), loadRequests()]);
