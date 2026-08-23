const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001/api"
    : "https://securepro-service-system.onrender.com/api";

let allRequests = [];
let activeTab = "";

function getToken() { return localStorage.getItem("securepro_technician_token"); }
function requireToken() { if (!getToken()) { window.location.href = "login.html"; return false; } return true; }
function escapeHtml(v) { return String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function formatStatus(s) { return ({ pending: "Pending", assigned: "Assigned", in_progress: "In Progress", waiting_parts: "Waiting Parts", completed: "Completed", cancelled: "Cancelled" })[s] || s || "Unknown"; }
function statusClass(s) { return String(s || "").replaceAll("_", "-"); }
function formatDate(v) { if (!v) return "Not scheduled"; const d = new Date(v); return Number.isNaN(d.getTime()) ? "Not scheduled" : d.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }); }
function loadTechnicianInfo() { try { const u = JSON.parse(localStorage.getItem("securepro_technician_user") || "{}"); const n = u.name || "Technician";["sidebarTechnicianName", "topbarTechnicianName"].forEach(id => { const e = document.getElementById(id); if (e) e.textContent = n; }); } catch (e) { } }
function logout() { localStorage.removeItem("securepro_technician_token"); localStorage.removeItem("securepro_technician_user"); window.location.href = "login.html"; }
function showError(m) { const e = document.getElementById("workError"); e.textContent = m || "Unable to load work."; e.hidden = false; }
function hideError() { const e = document.getElementById("workError"); e.hidden = true; e.textContent = ""; }
function dateKey(v) { if (!v) return ""; const d = new Date(v); if (Number.isNaN(d.getTime())) return ""; return d.toISOString().slice(0, 10); }
function populateServices() {
    const select = document.getElementById("serviceFilter"), current = select.value;
    const services = [...new Set(allRequests.map(r => r.service_name).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    select.innerHTML = '<option value="">All Services</option>' + services.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
    select.value = current;
}
function updateCounts() {
    const count = s => s ? allRequests.filter(r => r.status === s).length : allRequests.length;
    document.getElementById("allTabCount").textContent = count("");
    document.getElementById("assignedTabCount").textContent = count("assigned");
    document.getElementById("progressTabCount").textContent = count("in_progress");
    document.getElementById("waitingTabCount").textContent = count("waiting_parts");
    document.getElementById("completedTabCount").textContent = count("completed");
}
function filteredRequests() {
    const q = document.getElementById("searchInput").value.trim().toLowerCase();
    const status = document.getElementById("statusFilter").value || activeTab;
    const service = document.getElementById("serviceFilter").value;
    const date = document.getElementById("dateFilter").value;
    const sort = document.getElementById("sortFilter").value;
    const rows = allRequests.filter(r => {
        const hay = [r.request_code, r.customer_name, r.customer_phone, r.customer_address, r.service_name].join(" ").toLowerCase();
        return (!q || hay.includes(q)) && (!status || r.status === status) && (!service || r.service_name === service) && (!date || dateKey(r.scheduled_date) === date);
    });
    const time = r => r.scheduled_date ? new Date(r.scheduled_date).getTime() : Number.MAX_SAFE_INTEGER;
    rows.sort((a, b) => {
        if (sort === "scheduled_desc") return time(b) - time(a);
        if (sort === "created_desc") return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        if (sort === "created_asc") return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        return time(a) - time(b);
    });
    return rows;
}
function renderWork() {
    const rows = filteredRequests(), list = document.getElementById("workList"), empty = document.getElementById("emptyWork");
    document.getElementById("workLoading").style.display = "none";
    document.getElementById("resultCount").textContent = `${rows.length} request${rows.length === 1 ? "" : "s"}`;
    if (!rows.length) { list.hidden = true; empty.hidden = false; return; }
    empty.hidden = true; list.hidden = false;
    list.innerHTML = rows.map(r => {
        const time = r.scheduled_time ? String(r.scheduled_time).slice(0, 5) : "Time not set";
        return `<article class="request-card work-card">
    <div class="request-card-main">
      <div class="request-card-top"><span class="request-code">${escapeHtml(r.request_code)}</span><span class="status-badge status-${escapeHtml(statusClass(r.status))}">${escapeHtml(formatStatus(r.status))}</span></div>
      <h3>${escapeHtml(r.service_name || "Service")}</h3>
      <div class="work-customer"><strong>${escapeHtml(r.customer_name || "Customer")}</strong><span>${escapeHtml(r.customer_phone || "")}</span></div>
      <div class="schedule-info">
       <div class="schedule-item"><span class="schedule-icon">📅</span><div><small>Scheduled</small><strong>${escapeHtml(formatDate(r.scheduled_date))}</strong></div></div>
       <div class="schedule-item"><span class="schedule-icon">🕒</span><div><small>Time</small><strong>${escapeHtml(time)}</strong></div></div>
      </div>
      <div class="request-location"><span>📍</span><div><small>Location</small><p>${escapeHtml(r.customer_address || "Address not available")}</p></div></div>
    </div>
    <div class="request-card-actions"><a class="view-button" href="request.html?id=${encodeURIComponent(r.id)}">View Details →</a></div>
   </article>`;
    }).join("");
}
function applyFilters() { renderWork(); }
function setTab(status, button) {
    activeTab = status;
    document.querySelectorAll(".work-tab").forEach(b => b.classList.toggle("active", b === button));
    document.getElementById("statusFilter").value = status;
    renderWork();
}
function clearFilters() {
    activeTab = "";
    document.getElementById("searchInput").value = "";
    document.getElementById("statusFilter").value = "";
    document.getElementById("serviceFilter").value = "";
    document.getElementById("dateFilter").value = "";
    document.getElementById("sortFilter").value = "scheduled_asc";
    document.querySelectorAll(".work-tab").forEach(b => b.classList.toggle("active", b.dataset.status === ""));
    renderWork();
}
async function loadWork() {
    hideError();
    const loading = document.getElementById("workLoading"), list = document.getElementById("workList"), empty = document.getElementById("emptyWork");
    loading.style.display = "flex"; list.hidden = true; empty.hidden = true;
    try {
        const res = await fetch(`${API_BASE}/technician/requests`, { headers: { Authorization: `Bearer ${getToken()}`, Accept: "application/json" }, cache: "no-store" });
        const result = await res.json();
        if (res.status === 401) { logout(); return; }
        if (!res.ok || !result.success) throw new Error(result.message || "Unable to load work.");
        allRequests = Array.isArray(result.data) ? result.data : [];
        populateServices(); updateCounts(); renderWork();
    } catch (e) { console.error("My work error:", e); loading.style.display = "none"; showError(e.message); }
}
document.addEventListener("DOMContentLoaded", () => {
    if (!requireToken()) return;
    loadTechnicianInfo(); loadWork();
    ["searchInput", "statusFilter", "serviceFilter", "dateFilter", "sortFilter"].forEach(id => document.getElementById(id).addEventListener(id === "searchInput" ? "input" : "change", applyFilters));
    document.querySelectorAll(".work-tab").forEach(b => b.addEventListener("click", () => setTab(b.dataset.status, b)));
    document.getElementById("clearFiltersButton").addEventListener("click", clearFilters);
    document.getElementById("refreshButton").addEventListener("click", loadWork);
    document.getElementById("logoutButton").addEventListener("click", logout);
});