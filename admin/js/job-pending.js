const API_BASE = "https://securepro-service-system.onrender.com/api";
const token = localStorage.getItem("securepro_admin_token");
let adminUser = null;
try { adminUser = JSON.parse(localStorage.getItem("securepro_admin_user") || "null"); } catch (_) {}
if (!token || !adminUser || adminUser.role !== "admin") window.location.href = "login.html";

const tableBody = document.querySelector("#requestsTableBody");
const totalLabel = document.querySelector("#requestTotalLabel");
const errorBox = document.querySelector("#dashboardError");
const searchInput = document.querySelector("#searchInput");

["#sidebarAdminName", "#topbarAdminName"].forEach(selector => {
    const element = document.querySelector(selector);
    if (element) element.textContent = adminUser?.name || "Admin";
});

function escapeHtml(value) {
    return String(value ?? "—").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" });
}

async function loadJobs() {
    errorBox.hidden = true;
    tableBody.innerHTML = '<tr><td colspan="5" class="table-loading">Loading job pending list...</td></tr>';
    try {
        const response = await fetch(`${API_BASE}/admin/job-pending`, { headers: { Authorization: `Bearer ${token}` } });
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("securepro_admin_token");
            localStorage.removeItem("securepro_admin_user");
            window.location.href = "login.html";
            return;
        }
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Unable to load job pending requests.");
        renderJobs(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
        errorBox.textContent = error.message;
        errorBox.hidden = false;
        tableBody.innerHTML = '<tr><td colspan="5" class="table-empty">Unable to load jobs.</td></tr>';
    }
}

function renderJobs(jobs) {
    const term = searchInput.value.trim().toLowerCase();
    const filtered = jobs.filter(job => [job.request_code, job.customer?.name, job.customer?.phone, job.service?.name].join(" ").toLowerCase().includes(term));
    totalLabel.textContent = `${filtered.length} job${filtered.length === 1 ? "" : "s"}`;
    if (!filtered.length) {
        tableBody.innerHTML = '<tr><td colspan="5" class="table-empty">No paid jobs are waiting for technician assignment.</td></tr>';
        return;
    }
    tableBody.innerHTML = filtered.map(job => `
        <tr>
            <td><span class="request-code">${escapeHtml(job.request_code)}</span><span class="request-date">Submitted ${escapeHtml(formatDate(job.created_at))}</span></td>
            <td><span class="customer-name">${escapeHtml(job.customer?.name)}</span><span class="customer-phone">${escapeHtml(job.customer?.phone)}</span></td>
            <td><span class="service-name">${escapeHtml(job.service?.name)}</span></td>
            <td>${escapeHtml(formatDate(job.payment_proof_uploaded_at))}</td>
            <td><a class="view-button" href="request.html?id=${encodeURIComponent(job.id)}#technicianSelect">Assign technician</a></td>
        </tr>`).join("");
}

let latestJobs = [];
const originalRender = renderJobs;
renderJobs = jobs => { latestJobs = jobs; originalRender(jobs); };
document.querySelector("#refreshButton").addEventListener("click", loadJobs);
searchInput.addEventListener("input", () => originalRender(latestJobs));
document.querySelector("#logoutButton").addEventListener("click", () => {
    localStorage.removeItem("securepro_admin_token");
    localStorage.removeItem("securepro_admin_user");
    window.location.href = "login.html";
});
loadJobs();
