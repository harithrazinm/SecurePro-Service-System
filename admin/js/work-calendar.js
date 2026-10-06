const API_BASE =
    /^(localhost|127\.0\.0\.1)$/.test(
        location.hostname
    )
        ? "http://localhost:5001/api"
        : "/api";
        
let calendar;
let schedules = [];
let technicians = [];
let selectedJob = null;
let workloadRequestId = 0;

function getToken() {
    return (
        localStorage.getItem("securepro_admin_token") ||
        sessionStorage.getItem("securepro_admin_token") ||
        ""
    );
}

async function apiRequest(path, options = {}) {
    const token = getToken();

    if (!token) {
        window.location.href = "login.html";
        throw new Error("Authentication required.");
    }

    const response = await fetch(
        `${API_BASE}${path}`,
        {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {}),
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
            "Unable to complete the request."
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

function localDateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function localTimeString(date) {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function findScheduleConflict(technicianId, date, time, excludeId = null) {
    if (!technicianId || !date) return null;

    return schedules.find(job => {
        if (excludeId && String(job.id) === String(excludeId)) return false;
        if (String(job.technician_id || "") !== String(technicianId)) return false;
        if (String(job.scheduled_date || "").slice(0, 10) !== String(date)) return false;
        if (["completed", "cancelled"].includes(job.status)) return false;

        const existingTime = job.scheduled_time
            ? String(job.scheduled_time).slice(0, 5)
            : "";

        // A job without a time occupies the whole selected day.
        if (!time || !existingTime) return true;

        return existingTime === String(time).slice(0, 5);
    }) || null;
}

function selectedWorkloadDate() {
    return calendar
        ? localDateString(calendar.getDate())
        : localDateString(new Date());
}

function eventTitle(job) {
    const time = job.scheduled_time
        ? String(job.scheduled_time).slice(0, 5)
        : "Time not set";

    return `${time} • ${serviceName(job)} • ${job.customer_name}`;
}

function eventClass(status) {
    return `schedule-${status}`;
}

function updateSummary() {
    const now = new Date();

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
            job.scheduled_date
        ) {
            const dateOnly = String(job.scheduled_date).slice(0, 10);

            if (
                dateOnly < now.toISOString().slice(0, 10)
            ) {
                overdue++;
            }
        }
    });

    document.querySelector("#scheduledCount").textContent = scheduled;
    document.querySelector("#progressCount").textContent = progress;
    document.querySelector("#completedCount").textContent = completed;
    document.querySelector("#overdueCount").textContent = overdue;
}

async function loadTechnicians() {
    const result = await apiRequest("/admin/technicians");

    technicians = result.data || [];

    const filter =
        document.querySelector("#technicianFilter");

    const modalSelect =
        document.querySelector("#modalTechnicianSelect");

    filter.innerHTML =
        `<option value="">All Technicians</option>`;

    modalSelect.innerHTML =
        `<option value="">No technician assigned</option>`;

    technicians.forEach(tech => {
        filter.insertAdjacentHTML(
            "beforeend",
            `<option value="${tech.id}">
                ${escapeHtml(tech.name)}
            </option>`
        );

        modalSelect.insertAdjacentHTML(
            "beforeend",
            `<option value="${tech.id}">
                ${escapeHtml(tech.name)}
            </option>`
        );
    });
}

async function loadSchedules() {
    const result = await apiRequest("/schedules");

    schedules = result.data || [];

    renderCalendar();
    updateSummary();
    await loadWorkload(selectedWorkloadDate());
}

function getCalendarHeaderToolbar() {
    const mobile = window.matchMedia("(max-width: 600px)").matches;

    if (mobile) {
        return {
            left: "prev,next",
            center: "title",
            right: "today"
        };
    }

    return {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,listWeek"
    };
}

function updateCalendarHeaderToolbar() {
    if (!calendar) return;

    calendar.setOption("headerToolbar", getCalendarHeaderToolbar());
}

function renderCalendar() {
    const technicianId =
        document.querySelector("#technicianFilter").value;

    const filtered = technicianId
        ? schedules.filter(
            job => String(job.technician_id) === String(technicianId)
        )
        : schedules;

    const events = filtered.map(job => {
        const date =
            String(job.scheduled_date).slice(0, 10);

        const time =
            job.scheduled_time
                ? String(job.scheduled_time).slice(0, 5)
                : null;

        return {
            id: job.id,
            title: eventTitle(job),
            start: time
                ? `${date}T${time}`
                : date,
            allDay: !time,
            classNames: [eventClass(job.status)],
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
                    eventDisplay: "block",

                    headerToolbar: getCalendarHeaderToolbar(),

                    events,
                    editable: true,
                    eventStartEditable: true,
                    eventDurationEditable: false,
                    eventClick(info) {
                        openJobModal(
                            info.event.extendedProps.job
                        );
                    },
                    eventDrop: handleEventDrop,
                    dateClick(info) {
                        loadWorkload(info.dateStr.slice(0, 10));
                    },
                    datesSet(info) {
                        loadWorkload(localDateString(info.view.calendar.getDate()));
                    }
                }
            );

        calendar.render();
    } else {
        calendar.removeAllEvents();
        calendar.addEventSource(events);
    }
}

async function handleEventDrop(info) {
    const job = info.event.extendedProps.job;
    const newDate = localDateString(info.event.start);
    const newTime = info.event.allDay ? null : localTimeString(info.event.start);

    const conflict = findScheduleConflict(
        job.technician_id,
        newDate,
        newTime,
        job.id
    );

    if (conflict) {
        info.revert();
        alert(
            `Schedule conflict: ${job.technician_name || "This technician"} already has ${conflict.request_code} on ${newDate}${conflict.scheduled_time ? ` at ${String(conflict.scheduled_time).slice(0, 5)}` : " (no time set)"}.`
        );
        return;
    }

    const reason = window.prompt(
        `Reschedule ${job.request_code || "this job"} to ${newDate}${newTime ? ` at ${newTime}` : ""}.\n\nPlease enter the reason:`
    );

    if (!reason || !reason.trim()) {
        info.revert();
        return;
    }

    try {
        await apiRequest(
            `/schedules/${encodeURIComponent(job.id)}`,
            {
                method: "PUT",
                body: JSON.stringify({
                    technician_id: job.technician_id || null,
                    scheduled_date: newDate,
                    scheduled_time: newTime,
                    reason: reason.trim()
                })
            }
        );

        const index = schedules.findIndex(item => String(item.id) === String(job.id));
        if (index >= 0) {
            schedules[index].scheduled_date = newDate;
            schedules[index].scheduled_time = newTime;
        }

        updateSummary();
        await loadWorkload(newDate);
    } catch (error) {
        info.revert();
        alert(error.message);
    }
}

async function loadWorkload(date) {
    const list = document.querySelector("#workloadList");
    const label = document.querySelector("#workloadDateLabel");
    const total = document.querySelector("#workloadTotal");

    if (!list) return;

    const requestId = ++workloadRequestId;
    label.textContent = date
        ? new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
            weekday: "long", year: "numeric", month: "long", day: "numeric"
        })
        : "Selected date";
    list.innerHTML = `<div class="workload-empty">Loading workload…</div>`;

    try {
        const result = await apiRequest(`/schedules/workload?date=${encodeURIComponent(date)}`);
        if (requestId !== workloadRequestId) return;

        const rows = result.data || [];
        const totalJobs = rows.reduce((sum, row) => sum + Number(row.total_jobs || 0), 0);
        total.textContent = `${totalJobs} job${totalJobs === 1 ? "" : "s"}`;

        if (!rows.length) {
            list.innerHTML = `<div class="workload-empty">No active technicians found.</div>`;
            return;
        }

        list.innerHTML = rows.map(row => {
            const count = Number(row.total_jobs || 0);
            return `
                <div class="workload-item">
                    <div class="workload-item-head">
                        <strong>${escapeHtml(row.name || "Technician")}</strong>
                        <span class="workload-count">${count}</span>
                    </div>
                    <small>
                        ${Number(row.in_progress_jobs || 0)} in progress ·
                        ${Number(row.assigned_jobs || 0)} assigned ·
                        ${Number(row.waiting_parts_jobs || 0)} waiting parts
                    </small>
                </div>
            `;
        }).join("");
    } catch (error) {
        if (requestId !== workloadRequestId) return;
        total.textContent = "—";
        list.innerHTML = `<div class="workload-empty">Unable to load workload: ${escapeHtml(error.message)}</div>`;
    }
}

function updateSaveButtonState() {
    const button = document.querySelector("#saveReschedule");
    if (!button) return;

    const technicianId = document.querySelector("#modalTechnicianSelect")?.value || "";
    const date = document.querySelector("#modalDate")?.value || "";
    const time = document.querySelector("#modalTime")?.value || "";

    const conflict = findScheduleConflict(
        technicianId,
        date,
        time,
        selectedJob?.id
    );

    // Never allow the Admin to save a schedule that clashes with
    // another active job for the same technician on the same day/time.
    button.disabled = Boolean(conflict);

    if (conflict) {
        button.title = "Cannot save: technician already has a job at this time.";
    } else {
        button.title = "";
    }
}

function updateTimeAvailability() {
    const technicianId = document.querySelector("#modalTechnicianSelect")?.value || "";
    const date = document.querySelector("#modalDate")?.value || "";
    const time = document.querySelector("#modalTime")?.value || "";
    const output = document.querySelector("#timeAvailability");

    if (!output) return;

    output.className = "time-availability neutral";
    output.textContent = "";

    if (!technicianId || !date) {
        updateSaveButtonState();
        return;
    }

    const conflict = findScheduleConflict(technicianId, date, time, selectedJob?.id);

    if (conflict) {
        output.className = "time-availability conflict";
        output.textContent = `⚠ Conflict with ${conflict.request_code || "another job"}${conflict.scheduled_time ? ` at ${String(conflict.scheduled_time).slice(0, 5)}` : " (all-day)"}`;
    } else if (time) {
        output.className = "time-availability available";
        output.textContent = "✓ Time is available";
    }

    updateSaveButtonState();
}

function openJobModal(job) {
    selectedJob = job;

    document.querySelector("#modalTitle").textContent =
        job.request_code || "Service Job";

    document.querySelector("#modalCustomer").textContent =
        job.customer_name || "—";

    document.querySelector("#modalService").textContent =
        serviceName(job);

    document.querySelector("#modalTechnicianSelect").value =
        job.technician_id || "";

    const selectedTech = technicians.find(
        tech => String(tech.id) === String(job.technician_id || "")
    );

    document.querySelector("#modalTechnicianName").textContent =
        selectedTech?.name || job.technician_name || "No technician assigned";

    document.querySelector("#modalStatus").textContent =
        formatStatus(job.status);

    document.querySelector("#modalAddress").textContent =
        job.customer_address || "—";

    document.querySelector("#modalDate").value =
        job.scheduled_date
            ? String(job.scheduled_date).slice(0, 10)
            : "";

    document.querySelector("#modalTime").value =
        job.scheduled_time
            ? String(job.scheduled_time).slice(0, 5)
            : "";

    document.querySelector("#modalReason").value = "";
    updateTimeAvailability();

    const message =
        document.querySelector("#modalMessage");

    message.hidden = true;
    message.textContent = "";

    document.querySelector("#jobModal").hidden = false;
}

async function saveReschedule() {
    if (!selectedJob) {
        return;
    }

    const technicianId =
        document.querySelector("#modalTechnicianSelect").value || null;

    const date =
        document.querySelector("#modalDate").value || null;

    const time =
        document.querySelector("#modalTime").value || null;

    const reason =
        document.querySelector("#modalReason").value.trim();

    if (technicianId && !date) {
        alert(
            "Scheduled date is required when assigning a technician."
        );
        return;
    }

    if (!reason) {
        alert(
            "Please enter a reason for the schedule change."
        );
        return;
    }

    const conflict = findScheduleConflict(
        technicianId,
        date,
        time,
        selectedJob.id
    );

    if (conflict) {
        alert(
            `Schedule conflict: ${conflict.request_code || "This technician"} is already scheduled on ${date}${conflict.scheduled_time ? ` at ${String(conflict.scheduled_time).slice(0, 5)}` : " (no time set)"}. Please choose another schedule.`
        );
        return;
    }

    const button =
        document.querySelector("#saveReschedule");

    try {
        button.disabled = true;
        button.textContent = "Saving...";

        const result =
            await apiRequest(
                `/schedules/${encodeURIComponent(selectedJob.id)}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        technician_id: technicianId,
                        scheduled_date: date,
                        scheduled_time: time,
                        reason
                    })
                }
            );

        const index =
            schedules.findIndex(
                item => item.id === selectedJob.id
            );

        if (index >= 0 && result.data) {
            schedules[index] = result.data;
        }

        closeModal();
        renderCalendar();
        updateSummary();

        alert(
            result.message ||
            "Schedule updated successfully."
        );
    } catch (error) {
        const message =
            document.querySelector("#modalMessage");

        message.hidden = false;
        message.textContent = error.message;

        console.error(error);
    } finally {
        button.disabled = false;
        button.textContent = "Save New Schedule";
    }
}

function closeModal() {
    document.querySelector("#jobModal").hidden = true;
    selectedJob = null;
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
    document
        .querySelector("#logoutButton")
        ?.addEventListener("click", () => {
            localStorage.removeItem("securepro_admin_token");
            localStorage.removeItem("securepro_admin_user");
            sessionStorage.removeItem("securepro_admin_token");
            window.location.href = "login.html";
        });

    document
        .querySelector("#technicianFilter")
        .addEventListener(
            "change",
            renderCalendar
        );

    document
        .querySelector("#refreshCalendar")
        ?.addEventListener("click", async () => {
            try {
                await loadTechnicians();
                await loadSchedules();
            } catch (error) {
                alert(error.message);
            }
        });

    ["#modalTechnicianSelect", "#modalDate", "#modalTime"].forEach(selector => {
        document.querySelector(selector)?.addEventListener("change", updateTimeAvailability);
        document.querySelector(selector)?.addEventListener("input", updateTimeAvailability);
    });

    document
        .querySelector("#closeModal")
        .addEventListener(
            "click",
            closeModal
        );

    document
        .querySelector("#cancelModal")
        .addEventListener(
            "click",
            closeModal
        );

    document
        .querySelector("#saveReschedule")
        .addEventListener(
            "click",
            saveReschedule
        );

    try {
        await loadTechnicians();
        await loadSchedules();
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
});
let calendarHeaderResizeTimer;
window.addEventListener("resize", () => {
    clearTimeout(calendarHeaderResizeTimer);
    calendarHeaderResizeTimer = setTimeout(() => {
        updateCalendarHeaderToolbar();
    }, 150);
});

