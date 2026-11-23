const API_BASE = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
    ? "http://localhost:5001/api"
    : "/api";
const token = localStorage.getItem("securepro_admin_token");
let adminUser = null;
try { adminUser = JSON.parse(localStorage.getItem("securepro_admin_user") || "null"); } catch (_) { }
if (!token || !adminUser || adminUser.role !== "admin") location.href = "login.html";

const $ = selector => document.querySelector(selector);
const tbody = $("#reviewTableBody");
const messageBox = $("#pageMessage");
const approveModal = $("#approveModal");
const modal = $("#rejectModal");
let reviews = [];
let approvingId = null;
let rejectingId = null;

if (adminUser?.name && $("#topbarAdminName")) $("#topbarAdminName").textContent = adminUser.name;
$("#logoutButton").onclick = () => {
    localStorage.removeItem("securepro_admin_token");
    localStorage.removeItem("securepro_admin_user");
    location.href = "login.html";
};

function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

function formatDate(value) {
    if (!value) return "—";
    const parsed = new Date(String(value).replace(" ", "T"));
    return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" });
}

function showMessage(text, type = "success") {
    messageBox.textContent = text;
    messageBox.className = `page-message ${type}`;
    messageBox.hidden = !text;
}

async function api(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: { Authorization: `Bearer ${token}`, ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) }
    });
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("securepro_admin_token");
        localStorage.removeItem("securepro_admin_user");
        location.href = "login.html";
        return null;
    }
    const result = await response.json().catch(() => ({ success: false, message: "Invalid server response." }));
    if (!response.ok || !result.success) throw new Error(result.message || `Request failed (${response.status}).`);
    return result;
}

function filteredReviews() {
    const query = $("#reviewSearch").value.trim().toLowerCase();
    return reviews.filter(review => [review.request_code, review.customer_name, review.customer_phone, review.service_name]
        .some(value => String(value || "").toLowerCase().includes(query)));
}

function render() {
    const rows = filteredReviews();
    $("#reviewCount").textContent = String(reviews.length);
    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="review-empty">${reviews.length ? "No cancellation reviews match your search." : "No jobs are waiting for cancellation approval."}</td></tr>`;
        return;
    }
    tbody.innerHTML = rows.map(review => `<tr>
        <td><strong>${esc(review.request_code)}</strong><span class="review-muted">Queued ${esc(formatDate(review.requested_at))}</span></td>
        <td><strong>${esc(review.customer_name || "Unknown customer")}</strong><span class="review-muted">${esc(review.customer_phone || review.customer_email || "No contact details")}</span></td>
        <td>${esc(review.service_name || review.service_code || "Service request")}</td>
        <td>${esc(formatDate(review.pending_since))}</td>
        <td>${esc(formatDate(review.requested_at))}</td>
        <td><div class="review-reason">${esc(review.reason)}</div></td>
        <td><div class="review-actions">
            <button type="button" class="approve-button" data-approve="${esc(review.id)}">Approve cancel</button>
            <button type="button" class="reject-button" data-reject="${esc(review.id)}">Keep pending</button>
        </div></td>
    </tr>`).join("");
}

async function loadReviews() {
    tbody.innerHTML = `<tr><td colspan="7" class="review-empty">Loading cancellation reviews...</td></tr>`;
    try {
        const result = await api("/admin/cancellation-reviews");
        reviews = result?.data || [];
        showMessage("");
        render();
    } catch (error) {
        reviews = [];
        $("#reviewCount").textContent = "—";
        tbody.innerHTML = `<tr><td colspan="7" class="review-empty">Unable to load cancellation reviews.</td></tr>`;
        showMessage(error.message, "error");
    }
}

function openApproveModal(id) {
    const review = reviews.find(item => String(item.id) === String(id));
    if (!review) return;
    approvingId = id;
    $("#approveReason").value = "";
    $("#approveModalMessage").hidden = true;
    $("#approveModalMessage").textContent = "";
    $("#approveModalTitle").textContent = `Cancel ${review.request_code}?`;
    approveModal.hidden = false;
    $("#approveReason").focus();
}

function closeApproveModal() {
    approveModal.hidden = true;
    approvingId = null;
}

async function approveReview() {
    const reason = $("#approveReason").value.trim();
    if (!reason) {
        const reasonMessage = $("#approveModalMessage");
        reasonMessage.textContent = "Enter a reason for cancelling this job.";
        reasonMessage.hidden = false;
        $("#approveReason").focus();
        return;
    }
    if (!approvingId) return;
    const button = $("#confirmApproveButton");
    button.disabled = true;
    try {
        const result = await api(`/admin/cancellation-reviews/${encodeURIComponent(approvingId)}/approve`, { method: "POST", body: JSON.stringify({ reason }) });
        closeApproveModal();
        await loadReviews();
        showMessage(result?.message || "Cancellation approved.");
    } catch (error) {
        const reasonMessage = $("#approveModalMessage");
        reasonMessage.textContent = error.message;
        reasonMessage.hidden = false;
    }
    finally { button.disabled = false; }
}

function openRejectModal(id) {
    rejectingId = id;
    $("#rejectReason").value = "";
    modal.hidden = false;
    $("#rejectReason").focus();
}

function closeRejectModal() {
    modal.hidden = true;
    rejectingId = null;
}

async function rejectReview() {
    const reason = $("#rejectReason").value.trim();
    if (!reason) { showMessage("Enter a reason for keeping the request pending.", "error"); $("#rejectReason").focus(); return; }
    const button = $("#confirmRejectButton");
    button.disabled = true;
    try {
        const result = await api(`/admin/cancellation-reviews/${encodeURIComponent(rejectingId)}/reject`, { method: "POST", body: JSON.stringify({ reason }) });
        closeRejectModal();
        showMessage(result?.message || "Cancellation rejected.");
        await loadReviews();
    } catch (error) { showMessage(error.message, "error"); }
    finally { button.disabled = false; }
}

tbody.addEventListener("click", event => {
    const approve = event.target.closest("[data-approve]");
    const reject = event.target.closest("[data-reject]");
    if (approve) openApproveModal(approve.dataset.approve);
    if (reject) openRejectModal(reject.dataset.reject);
});

modal.addEventListener("click", event => {
    if (event.target.closest("[data-close-modal]")) closeRejectModal();
});
approveModal.addEventListener("click", event => {
    if (event.target.closest("[data-close-approve-modal]")) closeApproveModal();
});
$("#confirmApproveButton").addEventListener("click", approveReview);
$("#confirmRejectButton").addEventListener("click", rejectReview);
$("#refreshButton").addEventListener("click", loadReviews);
$("#reviewSearch").addEventListener("input", render);

loadReviews();
