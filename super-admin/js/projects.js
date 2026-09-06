const API_BASE = "http://localhost:5001/api";

//const API_BASE = "https://securepro-service-system.onrender.com/api";
const TOKEN_KEY = "securepro_super_admin_token";
const USER_KEY = "securepro_super_admin_user";
const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
const date=v=>{if(!v)return"—";const d=new Date(v);return Number.isNaN(d.getTime())?"—":d.toLocaleString("en-MY",{dateStyle:"medium",timeStyle:"short"})};
const status=v=>({pending:"Pending",assigned:"Assigned",in_progress:"In Progress",waiting_parts:"Waiting Parts",completed:"Completed",cancelled:"Cancelled"})[v]||v||"—";
const badge=v=>`<span class="badge badge-${esc(v||"none")}">${esc(status(v))}</span>`;
const token=()=>localStorage.getItem(TOKEN_KEY);
function escStatus(v){return v||""}
function setup(){try{const u=JSON.parse(localStorage.getItem(USER_KEY)||"{}");$("#adminName").textContent=u.name||"Super Admin";$("#topName").textContent=u.name||"Super Admin"}catch{}$("#logoutButton").onclick=()=>{localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(USER_KEY);location.href="login.html"}}
async function load(){
 try{
  const r=await fetch(`${API_BASE}/super-admin/projects`,{headers:{Authorization:`Bearer ${token()}`}});
  const d=await r.json(); if(!r.ok||!d.success)throw new Error(d.message||"Unable to load projects.");
  window.projects=d.data||[]; render();
 }catch(e){$("#projectTable").innerHTML=`<tr><td colspan="9" class="empty error-text">${esc(e.message)}</td></tr>`}
}
function render(){
 const q=$("#searchInput").value.trim().toLowerCase(), st=$("#statusFilter").value;
 const rows=(window.projects||[]).filter(p=>(!st||p.status===st)&&(!q||[p.request_code,p.customer_name,p.customer_phone,p.service_name,p.technician_name,p.quotation_number].join(" ").toLowerCase().includes(q)));
 $("#countLabel").textContent=`${rows.length} Project${rows.length===1?"":"s"}`;
 if(!rows.length){$("#projectTable").innerHTML='<tr><td colspan="9" class="empty">No projects found.</td></tr>';return}
 $("#projectTable").innerHTML=rows.map(p=>`<tr>
 <td><strong>${esc(p.request_code)}</strong><small>${esc(date(p.created_at))}</small></td>
 <td><strong>${esc(p.customer_name)}</strong><small>${esc(p.customer_phone)}</small></td>
 <td>${esc(p.service_name||"—")}</td>
 <td>${p.quotation_number?`<strong>${esc(p.quotation_number)}</strong><small>${esc(p.quotation_status||"—")}</small>`:"—"}</td>
 <td>${p.payment_proof_url?`<a class="doc" target="_blank" rel="noopener" href="${esc(p.payment_proof_url)}">View Proof</a>`:"<span class='muted'>No proof</span>"}</td>
 <td>${esc(p.technician_name||"Not assigned")}${p.technician_started_at?`<small>Started ${esc(date(p.technician_started_at))}</small>`:""}</td>
 <td>${p.report_status?badge(p.report_status):"<span class='muted'>No report</span>"}</td>
 <td>${badge(p.status)}</td>
 <td><a class="view" href="project.html?id=${encodeURIComponent(p.id)}">View</a></td>
 </tr>`).join("");
}
if(!token()) location.href="login.html"; else {setup();$("#searchInput").oninput=render;$("#statusFilter").onchange=render;$("#refreshButton").onclick=load;load();}
