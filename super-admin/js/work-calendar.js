const API_BASE =
    /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
        ? "http://localhost:5001/api"
        : "https://securepro-service-system.onrender.com/api";

let calendar;
let schedules = [];

function getToken() {
    return (
        localStorage.getItem("securepro_super_admin_token") ||
        localStorage.getItem("securepro_admin_token") ||
        sessionStorage.getItem("securepro_super_admin_token") ||
        sessionStorage.getItem("securepro_admin_token") ||
        ""
    );
}

function setUser() {
    try {
        const u = JSON.parse(
            localStorage.getItem("securepro_super_admin_user") || "{}"
        );
        document
            .querySelectorAll("#adminName,#topName")
            .forEach(el => { el.textContent = u.name || "Super Admin"; });
    } catch {}
}

function logout() {
    localStorage.removeItem("securepro_super_admin_token");
    localStorage.removeItem("securepro_super_admin_user");
    window.location.href = "login.html";
}

async function apiRequest(path) {
    const token = getToken();

    if (!token) {
        window.location.href = "login.html";
        throw new Error("Authentication required.");
    }

    const response = await fetch(
        `${API_BASE}${path}`,
        {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        }
    );

    const text = await response.text();

    let result = {};
    try {
        result = text ? JSON.parse(text) : {};
    } catch {
        result = {};
    }

    if (!response.ok) {
        throw new Error(
            result.message ||
            "Unable to retrieve calendar data."
        );
    }

    return result;
}

function formatStatus(status) {
    return {
        pending: "Pending",
        assigned: "Assigned",
        in_progress: "In Progress",
        waiting_parts: "Waiting Parts",
        completed: "Completed",
        cancelled: "Cancelled"
    }[status] || status || "Unknown";
}

function serviceName(job) {
    return job.service_name_en || job.service_name_ms || "Service";
}

function updateSummary() {
    const today =
        new Date().toISOString().slice(0, 10);

    let scheduled = 0;
    let progress = 0;
    let completed = 0;
    let overdue = 0;

    schedules.forEach(job => {
        if (job.status === "in_progress") {
            progress++;
        } else if (job.status === "completed") {
            completed++;
        } else {
            scheduled++;
        }

        if (
            job.status !== "completed" &&
            job.status !== "cancelled" &&
            job.scheduled_date &&
            String(job.scheduled_date).slice(0, 10) < today
        ) {
            overdue++;
        }
    });

    document.querySelector("#scheduledCount").textContent = scheduled;
    document.querySelector("#progressCount").textContent = progress;
    document.querySelector("#completedCount").textContent = completed;
    document.querySelector("#overdueCount").textContent = overdue;
}

async function loadTechnicians() {
    const result =
        await apiRequest("/schedules");

    schedules = result.data || [];

    const select =
        document.querySelector("#technicianFilter");

    const unique = new Map();

    schedules.forEach(job => {
        if (job.technician_id) {
            unique.set(
                job.technician_id,
                job.technician_name || "Technician"
            );
        }
    });

    select.innerHTML =
        `<option value="">All Technicians</option>`;

    unique.forEach((name, id) => {
        select.insertAdjacentHTML(
            "beforeend",
            `<option value="${id}">
                ${escapeHtml(name)}
            </option>`
        );
    });
}

function renderCalendar() {
    const technicianId =
        document.querySelector("#technicianFilter").value;

    const filtered =
        technicianId
            ? schedules.filter(
                job =>
                    String(job.technician_id) ===
                    String(technicianId)
            )
            : schedules;

    const events =
        filtered.map(job => {
            const date =
                String(job.scheduled_date).slice(0, 10);

            const time =
                job.scheduled_time
                    ? String(job.scheduled_time).slice(0, 5)
                    : null;

            return {
                id: job.id,
                title:
                    `${time || "Time not set"} • ` +
                    `${serviceName(job)} • ` +
                    `${job.customer_name}`,
                start:
                    time
                        ? `${date}T${time}`
                        : date,
                allDay: !time,
                classNames: [
                    `schedule-${job.status}`
                ],
                extendedProps: {
                    job
                }
            };
        });

    if (!calendar) {
        calendar =
            new FullCalendar.Calendar(
                document.querySelector("#calendar"),
                {
                    initialView: "dayGridMonth",
                    height: "auto",
                    dayMaxEvents: 4,

                    headerToolbar: {
                        left: "prev,next today",
                        center: "title",
                        right:
                            "dayGridMonth,timeGridWeek,listWeek"
                    },

                    events,

                    eventClick(info) {
                        openJob(
                            info.event.extendedProps.job
                        );
                    }
                }
            );

        calendar.render();
    } else {
        calendar.removeAllEvents();
        calendar.addEventSource(events);
    }
}

async function openJob(job) {
    document.querySelector("#modalTitle").textContent =
        job.request_code || "Service Job";

    document.querySelector("#modalCustomer").textContent =
        job.customer_name || "—";

    document.querySelector("#modalService").textContent =
        serviceName(job);

    document.querySelector("#modalTechnician").textContent =
        job.technician_name || "No technician";

    document.querySelector("#modalStatus").textContent =
        formatStatus(job.status);

    document.querySelector("#modalDate").textContent =
        job.scheduled_date
            ? String(job.scheduled_date).slice(0, 10)
            : "—";

    document.querySelector("#modalTime").textContent =
        job.scheduled_time
            ? String(job.scheduled_time).slice(0, 5)
            : "Not specified";

    document.querySelector("#modalAddress").textContent =
        job.customer_address || "—";

    document.querySelector("#jobModal").hidden = false;

    const history =
        document.querySelector("#historyList");

    history.textContent = "Loading...";

    try {
        const result =
            await apiRequest(
                `/schedules/${encodeURIComponent(job.id)}/history`
            );

        const rows = result.data || [];

        if (!rows.length) {
            history.innerHTML =
                `<div class="history-empty">
                    No schedule changes recorded.
                </div>`;
            return;
        }

        history.innerHTML =
            rows.map(row => `
                <div class="history-item">
                    <strong>
                        ${escapeHtml(
                            row.old_scheduled_date
                                ? String(row.old_scheduled_date).slice(0, 10)
                                : "Unscheduled"
                        )}
                        →
                        ${escapeHtml(
                            row.new_scheduled_date
                                ? String(row.new_scheduled_date).slice(0, 10)
                                : "Unscheduled"
                        )}
                    </strong>

                    <span>
                        ${escapeHtml(
                            row.old_technician_name ||
                            "No technician"
                        )}
                        →
                        ${escapeHtml(
                            row.new_technician_name ||
                            "No technician"
                        )}
                    </span>

                    <small>
                        ${escapeHtml(
                            row.change_reason ||
                            "No reason provided"
                        )}
                        ·
                        ${escapeHtml(
                            row.changed_by_name ||
                            "Admin"
                        )}
                    </small>
                </div>
            `).join("");
    } catch (error) {
        history.textContent =
            error.message;
    }
}

async function refreshCalendarData() {
    const button = document.querySelector("#refreshCalendar");

    if (button) {
        button.disabled = true;
        button.textContent = "↻ Refreshing...";
    }

    try {
        await loadTechnicians();
        updateSummary();
        renderCalendar();
    } catch (error) {
        console.error(error);
        alert(error.message);
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = "↻ Refresh";
        }
    }
}

function closeModal() {
    document.querySelector("#jobModal").hidden = true;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

document.addEventListener("DOMContentLoaded", async () => {
    setUser();

    document
        .querySelector("#logoutButton")
        ?.addEventListener("click", logout);

    document
        .querySelector("#technicianFilter")
        .addEventListener(
            "change",
            renderCalendar
        );

    document
        .querySelector("#closeModal")
        .addEventListener(
            "click",
            closeModal
        );

    const refreshButton =
        document.querySelector("#refreshCalendar");

    if (refreshButton) {
        refreshButton.addEventListener(
            "click",
            refreshCalendarData
        );
    }

    try {
        await loadTechnicians();
        updateSummary();
        renderCalendar();
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
});
