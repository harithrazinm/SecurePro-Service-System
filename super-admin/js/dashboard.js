//const API_BASE = "https://securepro-service-system.onrender.com/api";
const API_BASE = "http://localhost:5001/api";

const TOKEN_KEY = "securepro_super_admin_token";
const USER_KEY = "securepro_super_admin_user";

function token(){ return localStorage.getItem(TOKEN_KEY); }
function esc(v){ return String(v ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
function date(v){ if(!v) return "—"; const d=new Date(v); return Number.isNaN(d.getTime())?"—":d.toLocaleString("en-MY",{dateStyle:"medium",timeStyle:"short"}); }
function status(v){ return ({pending:"Pending",assigned:"Assigned",in_progress:"In Progress",waiting_parts:"Waiting Parts",completed:"Completed",cancelled:"Cancelled"})[v] || v || "—"; }
function badge(v){ return `<span class="badge badge-${esc(v || "none")}">${esc(status(v))}</span>`; }
function requireLogin(){ if(!token()){ location.href="login.html"; return false; } return true; }
function setUser(){ try{ const u=JSON.parse(localStorage.getItem(USER_KEY)||"{}"); document.querySelectorAll("#adminName,#topName").forEach(e=>e.textContent=u.name||"Super Admin"); }catch{} }
function logout(){ localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); location.href="login.html"; }

async function api(path){
    const r=await fetch(`${API_BASE}${path}`,{headers:{Authorization:`Bearer ${token()}`}});
    const data=await r.json();
    if(!r.ok || !data.success) throw new Error(data.message||"Unable to load monitoring data.");
    return data.data;
}

function renderRows(rows){
    const body=document.querySelector("#projectTable");
    if(!rows.length){ body.innerHTML='<tr><td colspan="8" class="empty">No projects found.</td></tr>'; return; }
    body.innerHTML=rows.map(p=>`
      <tr>
        <td><strong>${esc(p.request_code)}</strong><small>${esc(p.service_name||"Service")}</small></td>
        <td><strong>${esc(p.customer_name)}</strong><small>${esc(p.customer_phone)}</small></td>
        <td>${p.quotation_number?`<strong>${esc(p.quotation_number)}</strong><small>${esc(p.quotation_status||"—")}</small>`:"—"}</td>
        <td>${p.payment_proof_url?`<a class="doc" target="_blank" rel="noopener" href="${esc(p.payment_proof_url)}">View Proof</a><small>${esc(date(p.payment_proof_uploaded_at))}</small>`:"<span class='muted'>Not uploaded</span>"}</td>
        <td>${esc(p.technician_name||"Not assigned")}${p.technician_started_at?`<small>Started ${esc(date(p.technician_started_at))}</small>`:""}</td>
        <td>${p.report_status?badge(p.report_status):"<span class='muted'>No report</span>"}</td>
        <td>${badge(p.status)}</td>
        <td><a class="view" href="project.html?id=${encodeURIComponent(p.id)}">View</a></td>
      </tr>`).join("");
}

async function load(){
    try{
        const data=await api("/super-admin/dashboard");
        const s=data.summary||{};
        const map={totalProjects:"total_projects",quotationsUploaded:"quotations_uploaded",quotationsSent:"quotations_sent",paymentProofs:"payment_proofs",techniciansAssigned:"technicians_assigned",reportsSubmitted:"reports_submitted",reportsApproved:"reports_approved",projectsCompleted:"projects_completed"};
        Object.entries(map).forEach(([id,key])=>document.querySelector(`#${id}`).textContent=Number(s[key]||0));
        renderRows(data.recent||[]);
    }catch(e){ document.querySelector("#projectTable").innerHTML=`<tr><td colspan="8" class="empty error-text">${esc(e.message)}</td></tr>`; }
}
if(requireLogin()){
    setUser();
    document.querySelector("#logoutButton").addEventListener("click",logout);
    document.querySelector("#refreshButton").addEventListener("click",load);
    load();
}
