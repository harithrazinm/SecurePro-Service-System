const API_BASE = ["localhost", "127.0.0.1"].includes(window.location.hostname) ? "http://localhost:5001/api" : "https://securepro-service-system.onrender.com/api";
const token = localStorage.getItem("securepro_admin_token");
const user = JSON.parse(localStorage.getItem("securepro_admin_user") || "null");
if (!token || !user || user.role !== "admin") window.location.href = "login.html";

const $ = id => document.getElementById(id);
const invoiceBody = $("invoiceTableBody");
const proofBody = $("proofTableBody");
const errorBox = $("invoiceError");
const successBox = $("invoiceSuccess");
let invoices = [];
let proofs = [];
let referralUsages = [];

if (user?.name) $("topbarAdminName").textContent = user.name;
$("logoutButton").onclick = () => {
    localStorage.removeItem("securepro_admin_token");
    localStorage.removeItem("securepro_admin_user");
    window.location.href = "login.html";
};

function message(box, text) { box.textContent = text || ""; box.hidden = !text; }
function esc(v) { return String(v ?? "").replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[c])); }
function date(v) { if (!v) return "—"; const d = new Date(v); return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" }); }
function status(s) { return `<span class="status-badge ${esc(s)}">${esc(String(s || "").replaceAll("_", " "))}</span>`; }

async function api(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) }
    });
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("securepro_admin_token");
        localStorage.removeItem("securepro_admin_user");
        window.location.href = "login.html";
        return null;
    }
    const result = await response.json().catch(() => ({ success: false, message: "Invalid server response." }));
    if (!response.ok || !result.success) throw new Error(result.message || `Request failed (${response.status}).`);
    return result;
}

async function loadRequests() {
    const result = await api("/admin/requests");
    const select = $("requestId");
    select.innerHTML = `<option value="">Select a service request</option>`;
    const existing = new Set(invoices.map(i => i.request_id));
    (result?.data || []).forEach(r => {
        const name = r.customer?.name || r.customer_name || "Unknown customer";
        const opt = document.createElement("option");
        opt.value = r.id;
        opt.textContent = `${r.request_code} — ${name}`;
        if (existing.has(r.id)) {
            opt.disabled = true;
            opt.textContent += " — Already has invoice";
        }
        select.appendChild(opt);
    });
}

function renderInvoices() {
    $("totalInvoices").textContent = invoices.length;
    $("sentInvoices").textContent = invoices.filter(i => i.status === "sent").length;
    $("submittedInvoices").textContent = invoices.filter(i => i.status === "payment_submitted").length;
    $("paidInvoices").textContent = invoices.filter(i => i.status === "paid").length;

    if (!invoices.length) {
        invoiceBody.innerHTML = `<tr><td colspan="6" class="empty-state">No final invoices yet.</td></tr>`;
        return;
    }

    invoiceBody.innerHTML = invoices.map(i => {
        const referral = referralUsages.find(r => String(r.request_id) === String(i.request_id));
        const referralHtml = referral
            ? `<div class="invoice-referral ${referral.status === "rewarded" ? "applied" : "pending"}">
                    <div><strong>🎁 Referral Reward</strong><span>${esc(referral.referral_code || "—")}</span></div>
                    <div class="muted">Reward: ${esc(referral.reward_type === "percentage" ? `${Number(referral.reward_value || 0)}%` : `RM ${Number(referral.reward_value || 0).toFixed(2)}`)}</div>
                    ${referral.status === "rewarded"
                        ? `<span class="referral-applied">✓ Reward Applied</span>`
                        : `<button type="button" class="action-button success" data-apply-referral="${esc(referral.id)}">Mark Reward as Applied</button>`}
               </div>`
            : "";

        return `<tr>
        <td><strong>${esc(i.invoice_number)}</strong><div class="muted file-name">${esc(i.invoice_file_name)}</div>${referralHtml}</td>
        <td><strong>${esc(i.customer_name)}</strong><div class="muted">${esc(i.customer_email || i.customer_phone || "No contact")}</div></td>
        <td>${esc(i.request_code)}</td>
        <td>${status(i.status)}</td>
        <td>${date(i.created_at)}</td>
        <td><div class="action-group">
            <a class="action-button" href="${esc(i.invoice_file_url)}" target="_blank" rel="noopener">View PDF</a>
            ${i.customer_phone && i.invoice_file_url ? `<button class="action-button" data-wa="${esc(i.id)}">WhatsApp</button>` : ""}
            ${i.customer_email ? `<button class="action-button" data-email="${esc(i.id)}">Email</button>` : ""}
        </div></td>
    </tr>`;
    }).join("");
}

function renderProofs() {
    if (!proofs.length) {
        proofBody.innerHTML = `<tr><td colspan="6" class="empty-state">No balance payment proofs yet.</td></tr>`;
        return;
    }

    proofBody.innerHTML = proofs.map(p => `<tr>
        <td><strong>${esc(p.customer_name)}</strong><div class="muted">${esc(p.request_code)}</div></td>
        <td>${esc(p.invoice_number)}</td>
        <td><a class="action-button" href="${esc(p.payment_proof_url)}" target="_blank" rel="noopener">View Proof</a><div class="muted file-name">${esc(p.payment_proof_name)}</div></td>
        <td>${date(p.submitted_at)}</td>
        <td>${status(p.status)}</td>
        <td>${p.status === "pending" ? `<div class="action-group"><button class="action-button success" data-approve="${esc(p.id)}">Confirm</button><button class="action-button danger" data-reject="${esc(p.id)}">Reject</button></div>` : `<span class="muted">No action</span>`}</td>
    </tr>`).join("");
}

async function loadInvoiceOptions() {
    const select = $("invoiceId");
    select.innerHTML = `<option value="">Select an invoice</option>`;
    invoices.filter(i => i.status !== "paid").forEach(i => {
        const opt = document.createElement("option");
        opt.value = i.id;
        opt.textContent = `${i.invoice_number} — ${i.customer_name}`;
        select.appendChild(opt);
    });
}

async function load() {
    try {
        message(errorBox, "");
        const [invoiceResult, proofResult, referralResult] = await Promise.all([
            api("/invoices"),
            api("/invoices/payments"),
            api("/referrals/usages")
        ]);
        invoices = invoiceResult?.data || [];
        proofs = proofResult?.data || [];
        referralUsages = referralResult?.data || [];
        renderInvoices();
        renderProofs();
        await loadRequests();
        await loadInvoiceOptions();
    } catch (e) {
        message(errorBox, e.message);
    }
}

$("invoiceForm").addEventListener("submit", async e => {
    e.preventDefault();
    message(errorBox, "");
    message(successBox, "");
    const requestId = $("requestId").value;
    const file = $("invoiceFile").files[0];
    if (!requestId || !file) return message(errorBox, "Please select a service request and invoice PDF.");
    if (file.type !== "application/pdf") return message(errorBox, "Invoice must be a PDF file.");

    const data = new FormData();
    data.append("invoice_file", file);
    const button = $("uploadInvoiceButton");
    button.disabled = true;
    button.textContent = "Uploading...";
    try {
        const result = await api(`/invoices/request/${encodeURIComponent(requestId)}`, { method: "POST", body: data });
        message(successBox, result.message);
        e.target.reset();
        await load();
    } catch (err) {
        message(errorBox, err.message);
    } finally {
        button.disabled = false;
        button.textContent = "Upload Invoice";
    }
});

$("proofForm").addEventListener("submit", async e => {
    e.preventDefault();
    message(errorBox, "");
    message(successBox, "");
    const invoiceId = $("invoiceId").value;
    const file = $("proofFile").files[0];
    if (!invoiceId || !file) return message(errorBox, "Please select an invoice and payment proof.");
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) return message(errorBox, "Payment proof must be PDF, JPG, JPEG, PNG or WEBP.");

    const data = new FormData();
    data.append("payment_proof", file);
    const button = $("uploadProofButton");
    button.disabled = true;
    button.textContent = "Uploading...";
    try {
        const result = await api(`/invoices/${encodeURIComponent(invoiceId)}/payment-proof`, { method: "POST", body: data });
        message(successBox, result.message);
        e.target.reset();
        await load();
    } catch (err) {
        message(errorBox, err.message);
    } finally {
        button.disabled = false;
        button.textContent = "Upload Payment Proof";
    }
});

invoiceBody.addEventListener("click", async e => {
    const wa = e.target.closest("[data-wa]");
    const email = e.target.closest("[data-email]");
    const applyReferral = e.target.closest("[data-apply-referral]");

    if (applyReferral) {
        if (!confirm("Mark this referral reward as applied?\n\nMake sure the reward has been considered when preparing the final invoice.")) return;
        applyReferral.disabled = true;
        applyReferral.textContent = "Saving...";
        try {
            const result = await api(`/referrals/usages/${encodeURIComponent(applyReferral.dataset.applyReferral)}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: "rewarded",
                    remarks: "Referral reward applied during final invoice preparation."
                })
            });
            message(successBox, result.message);
            await load();
        } catch (err) {
            message(errorBox, err.message);
            applyReferral.disabled = false;
            applyReferral.textContent = "Mark Reward as Applied";
        }
        return;
    }
    if (wa) {
        const i = invoices.find(x => x.id === wa.dataset.wa);
        if (!i) return;
        let phone = String(i.customer_phone || "").replace(/\D/g, "");
        if (phone.startsWith("0")) phone = "60" + phone.slice(1);
        if (!phone.startsWith("60")) phone = `60${phone}`;
        const msg = `Hello ${i.customer_name || "Customer"},\n\nYour SecurePro final invoice ${i.invoice_number} is ready.\n\nPlease view the invoice PDF here:\n${i.invoice_file_url}\n\nThank you for choosing SecurePro System Solutions.`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
    }
    if (email) {
        email.disabled = true;
        try {
            const r = await api(`/invoices/${encodeURIComponent(email.dataset.email)}/email`, { method: "POST" });
            message(successBox, r.message);
            await load();
        } catch (err) {
            message(errorBox, err.message);
        } finally {
            email.disabled = false;
        }
    }
});

proofBody.addEventListener("click", async e => {
    const approve = e.target.closest("[data-approve]");
    const reject = e.target.closest("[data-reject]");
    if (approve) {
        if (!confirm("Confirm that this customer payment has been received and verified? The service request will be marked as completed.")) return;
        await verifyPayment(approve.dataset.approve, "approve", "");
    }
    if (reject) {
        const remarks = prompt("Reason for rejecting this payment proof:");
        if (remarks === null) return;
        if (!remarks.trim()) return alert("A rejection reason is required.");
        await verifyPayment(reject.dataset.reject, "reject", remarks);
    }
});

async function verifyPayment(id, action, remarks) {
    try {
        const result = await api(`/invoices/payments/${encodeURIComponent(id)}/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, remarks })
        });
        message(successBox, result.message);
        await load();
    } catch (e) {
        message(errorBox, e.message);
    }
}

$("refreshButton").onclick = load;
load();
