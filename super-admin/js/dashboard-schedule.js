/* ======================================================
   SECUREPRO SUPER ADMIN - DASHBOARD CALENDAR + UPCOMING
   Load AFTER js/dashboard.js.
   Wrapped in an IIFE so it can't clash with dashboard.js
   globals ($, esc, date, token, API_BASE ...).
   READ-ONLY: uses GET /schedules only.
====================================================== */

(function () {

    const API =
        /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
            ? "http://localhost:5001/api"
            : "https://securepro-service-system.onrender.com/api";

    const q = selector => document.querySelector(selector);

    let schedules = [];
    let viewDate = new Date();


    /* ---------- helpers ---------- */

    function getToken() {
        return (
            localStorage.getItem("securepro_super_admin_token") ||
            sessionStorage.getItem("securepro_super_admin_token") ||
            ""
        );
    }

    function escape(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function keyOf(job) {
        return job?.scheduled_date
            ? String(job.scheduled_date).slice(0, 10)
            : "";
    }

    function toLocalDate(key) {
        const [y, m, d] = key.split("-").map(Number);
        return new Date(y, m - 1, d);
    }

    function dateKey(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    }

    function timeOf(job) {
        return job?.scheduled_time
            ? String(job.scheduled_time).slice(0, 5)
            : "";
    }

    function serviceOf(job) {
        return job.service_name_en || job.service_name_ms || "Service";
    }

    function isActive(job) {
        return job.status !== "cancelled" && job.status !== "completed";
    }


    /* ---------- load ---------- */

    async function loadSchedules() {

        const grid = q("#calendarGrid");

        try {

            if (grid) {
                grid.innerHTML =
                    `<div class="calendar-loading">Loading calendar...</div>`;
            }

            const response = await fetch(`${API}/schedules`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Unable to load schedule.");
            }

            schedules = Array.isArray(result.data) ? result.data : [];

            renderCalendar();
            renderUpcoming();

        } catch (error) {

            console.error("Schedule error:", error);

            if (grid) {
                grid.innerHTML =
                    `<div class="calendar-loading">Unable to load schedule.</div>`;
            }

            const upcoming = q("#upcomingJobs");
            const count = q("#upcomingCount");

            if (count) count.textContent = "—";

            if (upcoming) {
                upcoming.innerHTML = `
                    <div class="empty-state error-state">
                        <div>
                            <strong>Unable to load schedule</strong>
                            <span>${escape(error.message || "Please try again.")}</span>
                        </div>
                    </div>`;
            }
        }
    }


    /* ---------- calendar ---------- */

    function renderCalendar() {

        const grid = q("#calendarGrid");
        const label = q("#calendarMonth");

        if (!grid || !label) return;

        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();

        label.textContent = viewDate.toLocaleDateString("en-MY", {
            month: "long",
            year: "numeric"
        });

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevDays = new Date(year, month, 0).getDate();

        let offset = new Date(year, month, 1).getDay() - 1;
        if (offset < 0) offset = 6;

        const map = {};

        schedules.forEach(job => {
            const key = keyOf(job);
            if (!key) return;
            (map[key] = map[key] || []).push(job);
        });

        const todayKey = dateKey(new Date());
        const cells = [];

        for (let i = offset - 1; i >= 0; i--) {
            cells.push(
                `<button type="button" class="calendar-day outside" disabled>
                    <span>${prevDays - i}</span>
                </button>`
            );
        }

        for (let day = 1; day <= daysInMonth; day++) {

            const key = dateKey(new Date(year, month, day));
            const jobs = map[key] || [];

            cells.push(`
                <button type="button"
                    class="calendar-day ${key === todayKey ? "is-today" : ""} ${jobs.length ? "has-jobs" : ""}"
                    data-calendar-date="${key}"
                    title="${jobs.length ? `${jobs.length} scheduled job${jobs.length === 1 ? "" : "s"}` : ""}">
                    <span>${day}</span>
                    ${jobs.length ? `<i>${jobs.length}</i>` : ""}
                </button>`);
        }

        const total = Math.ceil(cells.length / 7) * 7;
        let next = 1;

        while (cells.length < total) {
            cells.push(
                `<button type="button" class="calendar-day outside" disabled>
                    <span>${next++}</span>
                </button>`
            );
        }

        grid.innerHTML = cells.join("");

        grid.querySelectorAll("[data-calendar-date]").forEach(button => {

            button.addEventListener("click", () => {

                const jobs = map[button.dataset.calendarDate] || [];

                if (!jobs.length) return;

                window.location.href =
                    jobs.length === 1 && jobs[0].id
                        ? `project.html?id=${encodeURIComponent(jobs[0].id)}`
                        : "work-calendar.html";
            });
        });
    }


    /* ---------- upcoming ---------- */

    function renderUpcoming() {

        const box = q("#upcomingJobs");
        const count = q("#upcomingCount");

        if (!box) return;

        const todayKey = dateKey(new Date());

        const upcoming = schedules
            .filter(job => keyOf(job) && keyOf(job) >= todayKey && isActive(job))
            .sort((a, b) =>
                (keyOf(a) + timeOf(a)).localeCompare(keyOf(b) + timeOf(b))
            )
            .slice(0, 4);

        if (count) {
            count.textContent =
                `${upcoming.length} ${upcoming.length === 1 ? "job" : "jobs"}`;
        }

        if (!upcoming.length) {
            box.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">✓</div>
                    <div>
                        <strong>No upcoming jobs</strong>
                        <span>No active scheduled work is currently listed.</span>
                    </div>
                </div>`;
            return;
        }

        box.innerHTML = upcoming.map(job => {

            const d = toLocalDate(keyOf(job));
            const time = timeOf(job);
            const tech = job.technician_name || "";

            return `
                <a class="upcoming-job"
                   href="project.html?id=${encodeURIComponent(job.id)}">

                    <div class="upcoming-date">
                        <strong>${d.getDate()}</strong>
                        <span>${d.toLocaleDateString("en-MY", { month: "short" })}</span>
                    </div>

                    <div class="upcoming-info">
                        <strong>${escape(job.request_code || "Service Request")}</strong>
                        <span>${escape(job.customer_name || "Unknown customer")} · ${escape(serviceOf(job))}</span>
                        <small>${escape(time || "Time not set")}${tech ? ` · ${escape(tech)}` : ""}</small>
                    </div>

                    <span class="upcoming-arrow">→</span>
                </a>`;
        }).join("");
    }


    /* ---------- events ---------- */

    function init() {

        const prev = q("#calendarPrev");
        const next = q("#calendarNext");
        const refresh = q("#refreshButton");

        if (prev) {
            prev.addEventListener("click", () => {
                viewDate.setMonth(viewDate.getMonth() - 1);
                renderCalendar();
            });
        }

        if (next) {
            next.addEventListener("click", () => {
                viewDate.setMonth(viewDate.getMonth() + 1);
                renderCalendar();
            });
        }

        /* dashboard.js sets refreshButton.onclick; addEventListener runs alongside it */
        if (refresh) {
            refresh.addEventListener("click", loadSchedules);
        }

        if (getToken()) {
            loadSchedules();
        }
    }

    init();

})();
