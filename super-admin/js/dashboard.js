const API_BASE = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
    ? "http://localhost:5001/api"
    : "https://securepro-service-system.onrender.com/api";

const TOKEN_KEY = "securepro_super_admin_token";
const USER_KEY = "securepro_super_admin_user";

function token() { return localStorage.getItem(TOKEN_KEY); }
function esc(v) { return String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function date(v) { if (!v) return "—"; const d = new Date(v); return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" }); }
function status(v) { return ({ pending: "Pending", assigned: "Assigned", in_progress: "In Progress", waiting_parts: "Waiting Parts", completed: "Completed", cancelled: "Cancelled" })[v] || v || "—"; }
function badge(v) { return `<span class="badge badge-${esc(v || "none")}">${esc(status(v))}</span>`; }
function requireLogin() { if (!token()) { location.href = "login.html"; return false; } return true; }
function setUser() { try { const u = JSON.parse(localStorage.getItem(USER_KEY) || "{}"); document.querySelectorAll("#adminName,#topName").forEach(e => e.textContent = u.name || "Super Admin"); } catch { } }
function logout() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); location.href = "login.html"; }

async function api(path) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
        const url = `${API_BASE}${path}`;
        console.log("Super Admin API request:", url);
        const r = await fetch(url, {
            method: "GET",
            headers: { Authorization: `Bearer ${token()}` },
            signal: controller.signal
        });
        const text = await r.text();
        let data;
        try { data = JSON.parse(text); }
        catch { throw new Error(`Server returned an invalid response (${r.status}).`); }
        if (!r.ok || !data.success) throw new Error(data.message || `Request failed (${r.status}).`);
        return data.data;
    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error("The file request timed out. Please make sure the SecurePro backend is running on port 5001.");
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

function renderRows(rows) {
    const body = document.querySelector("#projectTable");
    if (!rows.length) { body.innerHTML = '<tr><td colspan="8" class="empty">No projects found.</td></tr>'; return; }
    body.innerHTML = rows.map(p => `
      <tr>
        <td><strong>${esc(p.request_code)}</strong><small>${esc(p.service_name || "Service")}</small></td>
        <td><strong>${esc(p.customer_name)}</strong><small>${esc(p.customer_phone)}</small></td>
        <td>${p.quotation_number ? `<strong>${esc(p.quotation_number)}</strong><small>${esc(p.quotation_status || "—")}</small>` : "—"}</td>
        <td>${p.payment_proof_url ? `<a class="doc" target="_blank" rel="noopener" href="${esc(p.payment_proof_url)}">View Proof</a><small>${esc(date(p.payment_proof_uploaded_at))}</small>` : "<span class='muted'>Not uploaded</span>"}</td>
        <td>${esc(p.technician_name || "Not assigned")}${p.technician_started_at ? `<small>Started ${esc(date(p.technician_started_at))}</small>` : ""}</td>
        <td>${p.report_status ? badge(p.report_status) : "<span class='muted'>No report</span>"}</td>
        <td>${badge(p.status)}</td>
        <td><a class="view" href="project.html?id=${encodeURIComponent(p.id)}">View</a></td>
      </tr>`).join("");
}


const CATEGORY_TITLES = {
    all: "All Uploaded Files",
    quotation_uploaded: "Quotation Uploaded",
    quotation_sent: "Quotation Sent",
    payment_proof: "Payment Proof",
    report_submitted: "Report Submitted",
    completed: "Completed Project Files"
};

const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");
function fileUrl(path) {
    if (!path) return "#";
    if (/^https?:\/\//i.test(path)) return path;
    return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}
function fileIcon(type = "") {
    const t = String(type).toLowerCase();
    if (t.includes("pdf")) return "📄";
    if (t.includes("video") || t.startsWith("video/")) return "🎥";
    if (t.includes("image") || t.includes("photo") || t.startsWith("image/")) return "📷";
    return "📎";
}
let fileModalOpener = null;
let filePreviewOpener = null;
let currentCategoryFiles = [];

function closeFileModal(event) {
    if (event) event.preventDefault();
    const modal = document.getElementById("fileModal");
    if (!modal) return;
    const opener = fileModalOpener && fileModalOpener.isConnected ? fileModalOpener : null;
    if (modal.contains(document.activeElement)) document.activeElement.blur();
    modal.inert = true;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    fileModalOpener = null;
    if (opener) setTimeout(() => opener.focus({ preventScroll: true }), 0);
}
window.closeFileModal = closeFileModal;

function closeFilePreview(event) {
    if (event) event.preventDefault();
    const modal = document.getElementById("filePreviewModal");
    if (!modal) return;
    const opener = filePreviewOpener && filePreviewOpener.isConnected ? filePreviewOpener : null;
    if (modal.contains(document.activeElement)) document.activeElement.blur();
    modal.inert = true;
    modal.hidden = true;
    document.getElementById("filePreviewBody").innerHTML = "";
    filePreviewOpener = null;
    if (opener) setTimeout(() => opener.focus({ preventScroll: true }), 0);
}
window.closeFilePreview = closeFilePreview;

function openFilePreview(file, opener) {
    const modal = document.getElementById("filePreviewModal");
    const body = document.getElementById("filePreviewBody");
    if (!modal || !body || !file?.file_path) return;
    filePreviewOpener = opener || document.activeElement;
    const url = fileUrl(file.file_path);
    const type = String(file.file_type || "").toLowerCase();
    document.getElementById("filePreviewTitle").textContent = file.file_name || "File Preview";
    document.getElementById("filePreviewMeta").textContent = `${file.request_code || "Project"} · ${file.source || "Uploaded file"}`;
    if (type.includes("pdf") || /\.pdf($|\?)/i.test(url)) {
        body.innerHTML = `<iframe title="PDF preview" src="${esc(url)}"></iframe>`;
    } else if (type.includes("video") || /\.(mp4|webm|mov)($|\?)/i.test(url)) {
        body.innerHTML = `<video controls autoplay><source src="${esc(url)}"></video>`;
    } else if (type.includes("image") || type.includes("photo") || /\.(png|jpe?g|gif|webp)($|\?)/i.test(url)) {
        body.innerHTML = `<img src="${esc(url)}" alt="${esc(file.file_name || "Uploaded file")}">`;
    } else {
        body.innerHTML = `<div class="file-preview-fallback"><strong>Preview is not available for this file type.</strong><a class="doc" target="_blank" rel="noopener" href="${esc(url)}">Open file ↗</a></div>`;
    }
    modal.hidden = false;
    modal.inert = false;
    requestAnimationFrame(() => document.getElementById("filePreviewClose")?.focus());
}

function renderCategoryFiles() {
    const body = document.querySelector("#fileModalBody");
    const count = document.querySelector("#fileCountLabel");
    const q = (document.querySelector("#fileSearchInput")?.value || "").trim().toLowerCase();
    const files = currentCategoryFiles.filter(f => !q || [f.file_name, f.request_code, f.customer_name, f.service_name, f.source, f.technician_name].join(" ").toLowerCase().includes(q));
    count.textContent = `${files.length} file${files.length === 1 ? "" : "s"}`;
    if (!files.length) {
        body.innerHTML = '<div class="file-empty"><strong>No matching files</strong><span>Try a different search term.</span></div>';
        return;
    }
    body.innerHTML = files.map((f, i) => `
        <article class="file-row">
            <div class="file-icon">${fileIcon(f.file_type)}</div>
            <div class="file-main"><strong>${esc(f.file_name || "Uploaded file")}</strong><span>${esc(f.request_code || "Project")} · ${esc(f.customer_name || "Customer")}</span><small>${esc(f.service_name || "Service")} · ${esc(f.source || "Uploaded file")} · ${esc(date(f.uploaded_at))}</small></div>
            <div class="file-actions">
                ${f.file_path ? `<button type="button" class="doc file-view file-preview-trigger" data-index="${i}">Preview</button>` : '<span class="muted">Unavailable</span>'}
                ${f.file_path ? `<a class="file-view" target="_blank" rel="noopener" href="${esc(fileUrl(f.file_path))}">Open ↗</a>` : ''}
                ${f.request_id ? `<a class="file-project" href="project.html?id=${encodeURIComponent(f.request_id)}">Project</a>` : ''}
            </div>
        </article>`).join("");
    body.querySelectorAll(".file-preview-trigger").forEach(btn => btn.addEventListener("click", () => openFilePreview(files[Number(btn.dataset.index)], btn)));
}

function openFileModal(category, opener = null) {
    const modal = document.querySelector("#fileModal");
    const body = document.querySelector("#fileModalBody");
    if (!modal || !body) return;
    fileModalOpener = opener || document.activeElement;
    document.querySelector("#fileModalTitle").textContent = CATEGORY_TITLES[category] || "Uploaded Files";
    document.querySelector("#fileModalSubtitle").textContent = "Browse, preview or open files for this category.";
    const search = document.querySelector("#fileSearchInput");
    if (search) search.value = "";
    body.innerHTML = '<div class="loading">Loading files...</div>';
    document.querySelector("#fileCountLabel").textContent = "Loading...";
    modal.hidden = false;
    modal.inert = false;
    document.body.classList.add("modal-open");
    requestAnimationFrame(() => document.querySelector("#fileModalClose")?.focus());
    loadCategoryFiles(category);
}
async function loadCategoryFiles(category) {
    const body = document.querySelector("#fileModalBody");
    try {
        const data = await api(`/super-admin/dashboard/files?category=${encodeURIComponent(category)}`);
        currentCategoryFiles = data.files || [];
        renderCategoryFiles();
    } catch (e) {
        currentCategoryFiles = [];
        document.querySelector("#fileCountLabel").textContent = "Error";
        body.innerHTML = `<div class="file-empty error-text"><strong>Unable to load files</strong><span>${esc(e.message)}</span></div>`;
    }
}
function setupFileCards() {
    document.querySelectorAll(".stat-card[data-file-category]").forEach(card => {
        card.addEventListener("click", () => openFileModal(card.dataset.fileCategory || "all", card));
        card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openFileModal(card.dataset.fileCategory || "all", card); } });
    });
    document.querySelector("#fileModalClose")?.addEventListener("click", closeFileModal);
    document.querySelector("[data-close-file-modal]")?.addEventListener("click", closeFileModal);
    document.querySelector("#filePreviewClose")?.addEventListener("click", closeFilePreview);
    document.querySelector("[data-close-file-preview]")?.addEventListener("click", closeFilePreview);
    document.querySelector("#fileSearchInput")?.addEventListener("input", renderCategoryFiles);
    document.addEventListener("keydown", e => {
        const preview = document.getElementById("filePreviewModal");
        const modal = document.getElementById("fileModal");
        if (e.key === "Escape" && preview && !preview.hidden) closeFilePreview(e);
        else if (e.key === "Escape" && modal && !modal.hidden) closeFileModal(e);
    });
}

async function load() {
    try {
        const data = await api("/super-admin/dashboard");
        const s = data.summary || {};
        const map = { totalProjects: "total_projects", quotationsUploaded: "quotations_uploaded", quotationsSent: "quotations_sent", paymentProofs: "payment_proofs", reportsSubmitted: "reports_submitted", projectsCompleted: "projects_completed" };
        Object.entries(map).forEach(([id, key]) => document.querySelector(`#${id}`).textContent = Number(s[key] || 0));
        renderRows(data.recent || []);
    } catch (e) { document.querySelector("#projectTable").innerHTML = `<tr><td colspan="8" class="empty error-text">${esc(e.message)}</td></tr>`; }
}
if (requireLogin()) {
    setUser();
    document.querySelector("#logoutButton").addEventListener("click", logout);
    document.querySelector("#refreshButton").addEventListener("click", load);
    setupFileCards();
    load();
}