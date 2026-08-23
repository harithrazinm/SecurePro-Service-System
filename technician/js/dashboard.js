const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001/api"
    : "https://securepro-service-system.onrender.com/api";

let requests = [];

function getToken(){ return localStorage.getItem("securepro_technician_token"); }
function requireToken(){ if(!getToken()){ window.location.href="login.html"; return false; } return true; }
function escapeHtml(value){ return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
function formatStatus(status){ return ({pending:"Pending",assigned:"Assigned",in_progress:"In Progress",waiting_parts:"Waiting Parts",completed:"Completed",cancelled:"Cancelled"})[status] || status || "Unknown"; }
function statusClass(status){ return String(status||"").replaceAll("_","-"); }
function formatDateOnly(value){
    if(!value) return "Not scheduled";
    const d=new Date(value);
    if(Number.isNaN(d.getTime())) return "Not scheduled";
    return d.toLocaleDateString("en-MY",{weekday:"short",day:"numeric",month:"short",year:"numeric"});
}
function loadTechnicianInfo(){
    try{
        const user=JSON.parse(localStorage.getItem("securepro_technician_user")||"{}");
        const name=user.name||"Technician";
        ["sidebarTechnicianName","topbarTechnicianName","welcomeTechnicianName"].forEach(id=>{
            const el=document.getElementById(id); if(el) el.textContent=name;
        });
    }catch(e){ console.warn("Unable to load technician information:",e); }
}
function showError(message){ const el=document.getElementById("dashboardError"); if(el){el.textContent=message||"Unable to load dashboard.";el.hidden=false;} }
function hideError(){ const el=document.getElementById("dashboardError"); if(el){el.textContent="";el.hidden=true;} }
function renderSummary(){
    const counts={assigned:0,in_progress:0,completed:0};
    requests.forEach(r=>{ if(Object.prototype.hasOwnProperty.call(counts,r.status)) counts[r.status]++; });
    document.getElementById("assignedCount").textContent=counts.assigned;
    document.getElementById("progressCount").textContent=counts.in_progress;
    document.getElementById("completedCount").textContent=counts.completed;
}
function requestTimeValue(r){
    const date=r.scheduled_date ? new Date(r.scheduled_date).getTime() : Number.MAX_SAFE_INTEGER;
    return date;
}
function renderRequests(){
    const loading=document.getElementById("requestLoading");
    const empty=document.getElementById("emptyRequests");
    const list=document.getElementById("requestList");
    loading.style.display="none";
    const active=requests.filter(r=>!["completed","cancelled"].includes(r.status)).sort((a,b)=>requestTimeValue(a)-requestTimeValue(b)).slice(0,5);
    if(!active.length){list.hidden=true;empty.hidden=false;return;}
    empty.hidden=true;list.hidden=false;
    list.innerHTML=active.map(r=>{
        const serviceName=r.service_name || "Service";
        const time=r.scheduled_time ? String(r.scheduled_time).slice(0,5) : "Time not set";
        return `<article class="request-card">
            <div class="request-card-main">
              <div class="request-card-top"><span class="request-code">${escapeHtml(r.request_code)}</span><span class="status-badge status-${escapeHtml(statusClass(r.status))}">${escapeHtml(formatStatus(r.status))}</span></div>
              <h3>${escapeHtml(serviceName)}</h3>
              <div class="schedule-info">
                <div class="schedule-item"><span class="schedule-icon">📅</span><div><small>Scheduled Date</small><strong>${escapeHtml(formatDateOnly(r.scheduled_date))}</strong></div></div>
                <div class="schedule-item"><span class="schedule-icon">🕒</span><div><small>Scheduled Time</small><strong>${escapeHtml(time)}</strong></div></div>
              </div>
              <div class="request-location"><span>📍</span><div><small>Customer</small><p>${escapeHtml(r.customer_name||"—")} · ${escapeHtml(r.customer_address||"Address not available")}</p></div></div>
            </div>
            <div class="request-card-actions"><a class="view-button" href="request.html?id=${encodeURIComponent(r.id)}">View Details →</a></div>
        </article>`;
    }).join("");
}
async function loadRequests(){
    hideError();
    const loading=document.getElementById("requestLoading"), list=document.getElementById("requestList"), empty=document.getElementById("emptyRequests");
    loading.style.display="flex"; list.hidden=true; empty.hidden=true;
    try{
        const response=await fetch(`${API_BASE}/technician/requests`,{headers:{Authorization:`Bearer ${getToken()}`,Accept:"application/json"},cache:"no-store"});
        const result=await response.json();
        if(response.status===401){ logout(); return; }
        if(!response.ok||!result.success) throw new Error(result.message||"Unable to load requests.");
        requests=Array.isArray(result.data)?result.data:[];
        renderSummary(); renderRequests();
    }catch(error){console.error("Technician dashboard error:",error);loading.style.display="none";showError(error.message);}
}
function logout(){localStorage.removeItem("securepro_technician_token");localStorage.removeItem("securepro_technician_user");window.location.href="login.html";}
document.addEventListener("DOMContentLoaded",()=>{if(!requireToken())return;loadTechnicianInfo();loadRequests();document.getElementById("refreshButton")?.addEventListener("click",loadRequests);document.getElementById("logoutButton")?.addEventListener("click",logout);});