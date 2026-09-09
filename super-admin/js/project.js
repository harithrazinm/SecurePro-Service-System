const API_BASE = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
    ? "http://localhost:5001/api"
    : "https://securepro-service-system.onrender.com/api";
const TOKEN_KEY = "securepro_super_admin_token", USER_KEY = "securepro_super_admin_user";
const $ = s => document.querySelector(s);
const esc = v => String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const date = v => { if (!v) return "—"; const d = new Date(v); return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" }) };
const status = v => ({ pending: "Pending", assigned: "Assigned", in_progress: "In Progress", waiting_parts: "Waiting Parts", completed: "Completed", cancelled: "Cancelled" })[v] || v || "—";
const token = () => localStorage.getItem(TOKEN_KEY);

function setup() {
    try { const u = JSON.parse(localStorage.getItem(USER_KEY) || "{}"); $("#adminName").textContent = u.name || "Super Admin"; $("#topName").textContent = u.name || "Super Admin" } catch { }
    $("#logoutButton").onclick = () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); location.href = "login.html" };
}
function milestone(label, time, done, extra = "") {
    return `<div class="timeline-item ${done ? "done" : "waiting"}"><div class="timeline-dot">${done ? "✓" : "○"}</div><div><strong>${esc(label)}</strong><small>${done ? esc(date(time)) : "Waiting"}</small>${extra}</div></div>`;
}
function documentLink(url, label) { return url ? `<a class="doc" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)} ↗</a>` : "<span class='muted'>Not available</span>" }
async function load() {
    const id = new URLSearchParams(location.search).get("id");
    if (!id) { showError("No project ID was provided."); return }
    try {
        const r = await fetch(`${API_BASE}/super-admin/projects/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token()}` } });
        const d = await r.json(); if (!r.ok || !d.success) throw new Error(d.message || "Unable to load project.");
        render(d.data);
    } catch (e) { showError(e.message) }
}
function showError(msg) { $("#errorBox").textContent = msg; $("#errorBox").hidden = false; $("#projectContent").innerHTML = "" }
function render(data) {
    const p = data.project, reports = data.reports || [], media = data.media || [];
    const latest = reports[0] || null;
    const quotationUploaded = Boolean(p.quotation_file_url);
    const quotationSent = Boolean(p.quotation_sent_at);
    const payment = Boolean(p.payment_proof_url);
    const assigned = Boolean(p.technician_id);
    const started = Boolean(p.technician_started_at);
    const submitted = Boolean(latest && latest.status);
    const approved = Boolean(latest && latest.status === "approved");
    const completed = p.status === "completed" && Boolean(p.completed_at);

    $("#projectContent").innerHTML = `
 <section class="project-heading"><div><span class="eyebrow">PROJECT</span><h2>${esc(p.request_code)}</h2><p>${esc(p.service_name || "Service")} · ${esc(p.customer_name)}</p></div><span class="big-status">${esc(status(p.status))}</span></section>

 <div class="two-col">
  <section class="panel">
   <div class="panel-head"><div><span class="eyebrow">PROGRESS</span><h2>Project Timeline</h2></div></div>
   <div class="timeline">
    ${milestone("Quotation Uploaded", p.quotation_uploaded_at, quotationUploaded, quotationUploaded ? `<div>${documentLink(p.quotation_file_url, "View Quotation")}</div>` : "")}
    ${milestone("Quotation Sent to Customer", p.quotation_sent_at, quotationSent)}
    ${milestone("Payment Received / Proof Uploaded", p.payment_proof_uploaded_at, payment, payment ? `<div>${documentLink(p.payment_proof_url, "View Payment Proof")}</div>` : "")}
    ${milestone("Technician Assigned", p.assigned_at, assigned, p.technician_name ? `<div class="muted">${esc(p.technician_name)}</div>` : "")}
    ${milestone("Technician Started", p.technician_started_at, started)}
    ${milestone("Technician Submitted Report", latest?.submitted_at, submitted, latest ? `<div class="muted">Report status: ${esc(latest.status)}</div>` : "")}
    ${milestone("Admin Approved Report", latest?.reviewed_at, approved, approved ? `<div class="muted">Reviewed by ${esc(latest.reviewed_by_name || "Admin")}</div>` : "")}
    ${milestone("Project Completed", p.completed_at, completed)}
   </div>
  </section>

  <section class="panel">
   <div class="panel-head"><div><span class="eyebrow">DETAILS</span><h2>Project Information</h2></div></div>
   <div class="info-grid">
    <div><span>Customer</span><strong>${esc(p.customer_name)}</strong></div>
    <div><span>Phone</span><strong>${esc(p.customer_phone)}</strong></div>
    <div><span>Email</span><strong>${esc(p.customer_email || "—")}</strong></div>
    <div><span>Service</span><strong>${esc(p.service_name)}</strong></div>
    <div class="full"><span>Address</span><strong>${esc(p.customer_address || "—")}</strong></div>
    <div><span>Technician</span><strong>${esc(p.technician_name || "Not assigned")}</strong></div>
    <div><span>Created</span><strong>${esc(date(p.created_at))}</strong></div>
   </div>
  </section>
 </div>

 <section class="panel">
  <div class="panel-head"><div><span class="eyebrow">QUOTATION & PAYMENT</span><h2>Documents</h2></div></div>
  <div class="document-grid">
   <div><span>Quotation</span><strong>${esc(p.quotation_number || "No quotation")}</strong>${documentLink(p.quotation_file_url, "View Quotation PDF")}<small>Uploaded: ${esc(date(p.quotation_uploaded_at))}</small><small>Sent: ${esc(date(p.quotation_sent_at))}</small></div>
   <div><span>Payment Proof</span><strong>${esc(p.payment_status || "not_received")}</strong>${documentLink(p.payment_proof_url, "View Payment Proof")}<small>Uploaded: ${esc(date(p.payment_proof_uploaded_at))}</small></div>
  </div>
 </section>

 <section class="panel">
  <div class="panel-head"><div><span class="eyebrow">TECHNICIAN REPORTS</span><h2>Report History</h2></div><span class="muted">${reports.length} report${reports.length === 1 ? "" : "s"}</span></div>
  ${reports.length ? `<div class="report-history">${reports.map((r, idx) => {
        const reportLabel = r.report_type === "progress" ? `Progress #${r.progress_number || (reports.length - idx)}` : "Final Report";
        const reportMedia = media.filter(m => Number(m.report_id) === Number(r.id));
        return `<article class="report-history-item">
        <div class="report-history-head"><div><span class="eyebrow">${esc(reportLabel)}</span><h3>${esc(r.report_title || "Service Report")}</h3></div><div class="report-history-meta"><strong>${esc(r.status || "—")}</strong><small>${esc(date(r.submitted_at || r.created_at))}</small></div></div>
        <div class="report-meta"><span>Written By</span><strong>${esc(r.reported_by || r.technician_name || "—")}</strong><span>Reviewed</span><strong>${esc(date(r.reviewed_at))}</strong></div>
        <div class="report-copy-grid"><div><h4>Work Performed</h4><p>${esc(r.work_performed || "—")}</p></div><div><h4>Findings</h4><p>${esc(r.findings || "—")}</p></div><div><h4>Materials Used</h4><p>${esc(r.materials_used || "—")}</p></div><div><h4>Technician Notes</h4><p>${esc(r.technician_notes || "—")}</p></div></div>
        <div class="report-file-list">${r.report_file_path ? documentLink(r.report_file_path, "View Report File") : ""}${reportMedia.map(m => documentLink(m.file_path, `${m.file_name || "Media"} ↗`)).join(" ")}</div>
        ${r.review_remarks ? `<div class="remarks"><strong>Admin Remarks</strong><p>${esc(r.review_remarks)}</p></div>` : ""}
      </article>`;
    }).join("")}</div>` : "<div class='empty'>No technician report submitted yet.</div>"}
 </section>

 ${media.length ? `<section class="panel"><div class="panel-head"><div><span class="eyebrow">COMPLETION MEDIA</span><h2>Photos / Videos</h2></div></div><div class="media-list">${media.map(m => `<a class="media-item" target="_blank" rel="noopener" href="${esc(m.file_path)}">${esc(m.file_name)} ↗</a>`).join("")}</div></section>` : ""}
 </section>`;
}
if (!token()) location.href = "login.html"; else { setup(); load(); }
