const API_BASE =
    ["localhost", "127.0.0.1"].includes(window.location.hostname)
        ? "http://localhost:5001/api"
        : "https://securepro-service-system.onrender.com/api";

const token = localStorage.getItem("securepro_admin_token");
const storedUser = localStorage.getItem("securepro_admin_user");

let adminUser = null;
let schedules = [];
let calendarDate = new Date();

try {
    adminUser = JSON.parse(storedUser || "null");
} catch {
    adminUser = null;
}

if (!token || !adminUser || adminUser.role !== "admin") {
    window.location.href = "login.html";
}


/* =========================================================
   ELEMENT HELPER
========================================================= */

const $ = selector => document.querySelector(selector);


/* =========================================================
   ADMIN NAME
========================================================= */

function setAdminName() {

    const name = adminUser?.name || "Admin";

    const topbarName = $("#topbarAdminName");
    const heroName = $("#heroAdminName");

    if (topbarName) {
        topbarName.textContent = name;
    }

    if (heroName) {
        heroName.textContent = name;
    }
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(path, options = {}) {

    const response = await fetch(
        `${API_BASE}${path}`,
        {
            ...options,

            headers: {
                ...(options.headers || {}),
                Authorization: `Bearer ${token}`
            }
        }
    );


    if (
        response.status === 401 ||
        response.status === 403
    ) {

        localStorage.removeItem(
            "securepro_admin_token"
        );

        localStorage.removeItem(
            "securepro_admin_user"
        );

        window.location.href = "login.html";

        return null;
    }


    const result =
        await response.json();


    if (
        !response.ok ||
        !result.success
    ) {

        throw new Error(
            result.message ||
            "Request failed."
        );
    }


    return result;
}


/* =========================================================
   ERROR
========================================================= */

function showError(message) {

    const element =
        $("#dashboardError");

    if (!element) return;

    element.textContent =
        message;

    element.hidden =
        false;
}


function hideError() {

    const element =
        $("#dashboardError");

    if (!element) return;

    element.textContent =
        "";

    element.hidden =
        true;
}


/* =========================================================
   TODAY
========================================================= */

function updateToday() {

    const todayDate =
        $("#todayDate");

    if (!todayDate) return;


    const today =
        new Date();


    todayDate.textContent =
        today.toLocaleDateString(
            "en-MY",
            {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
}


/* =========================================================
   FORMAT STATUS
========================================================= */

function formatStatus(status) {

    const labels = {

        pending:
            "Pending Assignment",

        assigned:
            "Assigned",

        in_progress:
            "In Progress",

        waiting_parts:
            "Waiting Parts",

        awaiting_payment:
            "Awaiting Payment",

        completed:
            "Completed",

        cancelled:
            "Cancelled"

    };


    return (
        labels[status] ||
        String(
            status ||
            "Pending"
        )
            .replaceAll(
                "_",
                " "
            )
            .replace(
                /\b\w/g,
                letter =>
                    letter.toUpperCase()
            )
    );
}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(value) {

    if (!value) {
        return "—";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";
    }


    return date.toLocaleDateString(
        "en-MY",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


/* =========================================================
   CUSTOMER
========================================================= */

function getCustomerName(job) {

    return (
        job?.customer?.name ||
        job?.customer_name ||
        "Unknown customer"
    );
}


/* =========================================================
   SERVICE
========================================================= */

function getServiceName(job) {

    return (
        job?.service?.name ||
        job?.service_name_en ||
        job?.service_name_ms ||
        job?.service_name ||
        job?.service_type ||
        "Service"
    );
}


/* =========================================================
   TECHNICIAN
========================================================= */

function getTechnicianName(job) {

    return (
        job?.technician?.name ||
        job?.technician_name ||
        ""
    );
}


/* =========================================================
   SCHEDULE DATE
========================================================= */

function getScheduleDate(job) {

    return (
        job?.scheduled_date ||
        job?.schedule_date ||
        job?.scheduledDate ||
        null
    );
}


/* =========================================================
   SCHEDULE TIME
========================================================= */

function getScheduleTime(job) {

    return (
        job?.scheduled_time ||
        job?.schedule_time ||
        job?.scheduledTime ||
        ""
    );
}


/* =========================================================
   LOAD DASHBOARD SUMMARY
========================================================= */

async function loadDashboard() {

    try {

        const result =
            await apiRequest(
                "/admin/dashboard"
            );


        if (!result) return;


        const data =
            result.data || {};


        const total =
            $("#totalCount");

        const pending =
            $("#pendingCount");

        const assigned =
            $("#assignedCount");

        const progress =
            $("#progressCount");

        const completed =
            $("#completedCount");


        if (total) {

            total.textContent =
                Number(
                    data.total || 0
                );
        }


        if (pending) {

            pending.textContent =
                Number(
                    data.pending || 0
                );
        }


        if (assigned) {

            assigned.textContent =
                Number(
                    data.assigned || 0
                );
        }


        if (progress) {

            progress.textContent =
                Number(
                    data.in_progress || 0
                );
        }


        if (completed) {

            completed.textContent =
                Number(
                    data.completed || 0
                );
        }


    } catch (error) {

        console.error(
            "Dashboard summary error:",
            error
        );

        showError(
            error.message ||
            "Unable to load dashboard summary."
        );
    }
}


/* =========================================================
   LOAD JOB PENDING
========================================================= */

async function loadJobPending() {

    const list =
        $("#jobPendingList");


    if (!list) return;


    list.innerHTML = `
        <div class="job-pending-loading">
            <span class="loading-dot"></span>
            Loading active jobs...
        </div>
    `;


    try {

        const result =
            await apiRequest(
                "/admin/job-pending"
            );


        if (!result) return;


        const jobs =
            Array.isArray(
                result.data
            )
                ? result.data
                : [];


        const count =
            $("#jobPendingCount");


        if (count) {

            count.textContent =
                `${jobs.length} ${
                    jobs.length === 1
                        ? "job"
                        : "jobs"
                }`;
        }


        if (!jobs.length) {

            list.innerHTML = `
                <div class="empty-state">

                    <div class="empty-icon">
                        ✓
                    </div>

                    <div>

                        <strong>
                            No active jobs
                        </strong>

                        <span>
                            Paid jobs will appear here
                            after payment confirmation.
                        </span>

                    </div>

                </div>
            `;

            return;
        }


        list.innerHTML =
            jobs
                .slice(
                    0,
                    5
                )
                .map(
                    job => {

                        const technician =
                            getTechnicianName(
                                job
                            );


                        const status =
                            job.status ||
                            "pending";


                        return `
                            <article
                                class="job-pending-item"
                            >

                                <div
                                    class="job-number"
                                >

                                    <span>
                                        ${escapeHtml(
                                            job.request_code ||
                                            "Service Request"
                                        )}
                                    </span>

                                    <small>
                                        ${escapeHtml(
                                            formatDate(
                                                job.created_at
                                            )
                                        )}
                                    </small>

                                </div>


                                <div
                                    class="job-customer"
                                >

                                    <strong>
                                        ${escapeHtml(
                                            getCustomerName(
                                                job
                                            )
                                        )}
                                    </strong>

                                    <span>
                                        ${escapeHtml(
                                            getServiceName(
                                                job
                                            )
                                        )}
                                    </span>

                                </div>


                                <span
                                    class="
                                        job-status
                                        status-${escapeHtml(
                                            status
                                        )}
                                    "
                                >
                                    ${escapeHtml(
                                        formatStatus(
                                            status
                                        )
                                    )}
                                </span>


                                <div
                                    class="job-tech"
                                >

                                    <span
                                        class="tech-label"
                                    >
                                        Technician
                                    </span>

                                    <strong>
                                        ${escapeHtml(
                                            technician ||
                                            "Not assigned"
                                        )}
                                    </strong>

                                </div>


                                <a
                                    class="job-view-button"
                                    href="
                                        request.html?id=${
                                            encodeURIComponent(
                                                job.id
                                            )
                                        }
                                    "
                                >
                                    View
                                </a>

                            </article>
                        `;
                    }
                )
                .join("");


    } catch (error) {

        console.error(
            "Job pending error:",
            error
        );


        const count =
            $("#jobPendingCount");


        if (count) {

            count.textContent =
                "—";
        }


        list.innerHTML = `
            <div
                class="
                    empty-state
                    error-state
                "
            >

                <strong>
                    Unable to load active jobs
                </strong>

                <span>
                    ${escapeHtml(
                        error.message ||
                        "Please try again."
                    )}
                </span>

            </div>
        `;
    }
}


/* =========================================================
   NORMALIZE CALENDAR DATE
========================================================= */

function normalizeScheduleDate(
    value
) {

    if (!value) {
        return null;
    }


    const text =
        String(value);


    if (
        /^\d{4}-\d{2}-\d{2}$/
            .test(text)
    ) {

        const [
            year,
            month,
            day
        ] =
            text
                .split("-")
                .map(Number);


        return new Date(
            year,
            month - 1,
            day
        );
    }


    const parsed =
        new Date(value);


    return Number.isNaN(
        parsed.getTime()
    )
        ? null
        : parsed;
}


/* =========================================================
   DATE KEY
========================================================= */

function dateKey(date) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        )
            .padStart(
                2,
                "0"
            );


    const day =
        String(
            date.getDate()
        )
            .padStart(
                2,
                "0"
            );


    return `${year}-${month}-${day}`;
}


/* =========================================================
   RENDER CALENDAR
========================================================= */

function renderCalendar() {

    const grid =
        $("#calendarGrid");

    const monthLabel =
        $("#calendarMonth");


    if (
        !grid ||
        !monthLabel
    ) {

        return;
    }


    const year =
        calendarDate.getFullYear();


    const month =
        calendarDate.getMonth();


    monthLabel.textContent =
        calendarDate.toLocaleDateString(
            "en-MY",
            {
                month: "long",
                year: "numeric"
            }
        );


    const firstDay =
        new Date(
            year,
            month,
            1
        );


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    let mondayIndex =
        firstDay.getDay() - 1;


    if (
        mondayIndex < 0
    ) {

        mondayIndex = 6;
    }


    const previousMonthDays =
        new Date(
            year,
            month,
            0
        ).getDate();


    const scheduleMap = {};


    schedules.forEach(
        job => {

            const date =
                normalizeScheduleDate(
                    getScheduleDate(
                        job
                    )
                );


            if (!date) return;


            const key =
                dateKey(date);


            if (
                !scheduleMap[key]
            ) {

                scheduleMap[key] = [];
            }


            scheduleMap[key].push(
                job
            );
        }
    );


    const todayKey =
        dateKey(
            new Date()
        );


    const cells = [];


    /*
     * PREVIOUS MONTH
     */

    for (
        let i =
            mondayIndex - 1;

        i >= 0;

        i--
    ) {

        const day =
            previousMonthDays -
            i;


        cells.push(`
            <button
                type="button"
                class="
                    calendar-day
                    outside
                "
                disabled
            >
                <span>
                    ${day}
                </span>
            </button>
        `);
    }


    /*
     * CURRENT MONTH
     */

    for (
        let day = 1;

        day <= daysInMonth;

        day++
    ) {

        const current =
            new Date(
                year,
                month,
                day
            );


        const key =
            dateKey(
                current
            );


        const jobs =
            scheduleMap[key] ||
            [];


        const isToday =
            key === todayKey;


        cells.push(`
            <button
                type="button"
                class="
                    calendar-day
                    ${isToday ? "is-today" : ""}
                    ${jobs.length ? "has-jobs" : ""}
                "
                data-calendar-date="${key}"
                title="${
                    jobs.length
                        ? `${jobs.length} scheduled job${
                            jobs.length === 1
                                ? ""
                                : "s"
                        }`
                        : ""
                }"
            >

                <span>
                    ${day}
                </span>

                ${
                    jobs.length
                        ? `<i>${jobs.length}</i>`
                        : ""
                }

            </button>
        `);
    }


    /*
     * NEXT MONTH
     */

    const totalCells =
        Math.ceil(
            cells.length / 7
        ) * 7;


    let nextDay = 1;


    while (
        cells.length <
        totalCells
    ) {

        cells.push(`
            <button
                type="button"
                class="
                    calendar-day
                    outside
                "
                disabled
            >

                <span>
                    ${nextDay++}
                </span>

            </button>
        `);
    }


    grid.innerHTML =
        cells.join("");


    /*
     * DATE CLICK
     */

    grid
        .querySelectorAll(
            "[data-calendar-date]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const selected =
                            button.dataset
                                .calendarDate;


                        const jobs =
                            scheduleMap[
                                selected
                            ] || [];


                        if (
                            !jobs.length
                        ) {

                            return;
                        }


                        const firstJob =
                            jobs[0];


                        if (
                            firstJob.id
                        ) {

                            window.location.href =
                                `request.html?id=${
                                    encodeURIComponent(
                                        firstJob.id
                                    )
                                }`;
                        }
                    }
                );
            }
        );
}


/* =========================================================
   UPCOMING JOBS
========================================================= */

function renderUpcomingJobs() {

    const container =
        $("#upcomingJobs");


    const count =
        $("#upcomingCount");


    if (!container) return;


    const upcoming =
        schedules
            .map(
                job => ({

                    job,

                    date:
                        normalizeScheduleDate(
                            getScheduleDate(
                                job
                            )
                        )

                })
            )
            .filter(
                item =>
                    item.date &&
                    item.job.status !==
                        "cancelled" &&
                    item.job.status !==
                        "completed"
            )
            .sort(
                (a, b) =>
                    a.date - b.date
            )
            .slice(
                0,
                4
            );


    if (count) {

        count.textContent =
            `${upcoming.length} ${
                upcoming.length === 1
                    ? "job"
                    : "jobs"
            }`;
    }


    if (
        !upcoming.length
    ) {

        container.innerHTML = `
            <div
                class="
                    empty-state
                    compact-empty
                "
            >

                <div
                    class="empty-icon"
                >
                    ✓
                </div>

                <div>

                    <strong>
                        No upcoming jobs
                    </strong>

                    <span>
                        No active scheduled work
                        is currently listed.
                    </span>

                </div>

            </div>
        `;

        return;
    }


    container.innerHTML =
        upcoming
            .map(
                ({
                    job,
                    date
                }) => {

                    const technician =
                        getTechnicianName(
                            job
                        );


                    const time =
                        getScheduleTime(
                            job
                        );


                    return `
                        <a
                            class="upcoming-job"
                            href="
                                request.html?id=${
                                    encodeURIComponent(
                                        job.id
                                    )
                                }
                            "
                        >

                            <div
                                class="upcoming-date"
                            >

                                <strong>
                                    ${date.getDate()}
                                </strong>

                                <span>
                                    ${date.toLocaleDateString(
                                        "en-MY",
                                        {
                                            month:
                                                "short"
                                        }
                                    )}
                                </span>

                            </div>


                            <div
                                class="upcoming-info"
                            >

                                <strong>
                                    ${escapeHtml(
                                        job.request_code ||
                                        "Service Request"
                                    )}
                                </strong>

                                <span>
                                    ${escapeHtml(
                                        getCustomerName(
                                            job
                                        )
                                    )}
                                </span>

                                <small>
                                    ${escapeHtml(
                                        time ||
                                        "Scheduled"
                                    )}

                                    ${
                                        technician
                                            ? ` · ${escapeHtml(
                                                technician
                                            )}`
                                            : ""
                                    }

                                </small>

                            </div>


                            <span
                                class="upcoming-arrow"
                            >
                                →
                            </span>

                        </a>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   LOAD SCHEDULES
========================================================= */

async function loadSchedules() {

    const calendarGrid =
        $("#calendarGrid");


    const upcoming =
        $("#upcomingJobs");


    try {

        if (calendarGrid) {

            calendarGrid.innerHTML = `
                <div class="calendar-loading">
                    Loading calendar...
                </div>
            `;
        }


        const result =
            await apiRequest(
                "/schedules"
            );


        if (!result) return;


        schedules =
            Array.isArray(
                result.data
            )
                ? result.data
                : [];


        renderCalendar();

        renderUpcomingJobs();


    } catch (error) {

        console.error(
            "Schedule error:",
            error
        );


        if (calendarGrid) {

            calendarGrid.innerHTML = `
                <div class="calendar-loading">
                    Unable to load schedule.
                </div>
            `;
        }


        if (upcoming) {

            upcoming.innerHTML = `
                <div
                    class="
                        empty-state
                        error-state
                    "
                >

                    <strong>
                        Unable to load schedule
                    </strong>

                    <span>
                        ${escapeHtml(
                            error.message ||
                            "Please try again."
                        )}
                    </span>

                </div>
            `;
        }
    }
}


/* =========================================================
   CALENDAR NAVIGATION
========================================================= */

const calendarPrev =
    $("#calendarPrev");


const calendarNext =
    $("#calendarNext");


if (calendarPrev) {

    calendarPrev.addEventListener(
        "click",
        () => {

            calendarDate.setMonth(
                calendarDate.getMonth() - 1
            );

            renderCalendar();
        }
    );
}


if (calendarNext) {

    calendarNext.addEventListener(
        "click",
        () => {

            calendarDate.setMonth(
                calendarDate.getMonth() + 1
            );

            renderCalendar();
        }
    );
}


/* =========================================================
   REFRESH
========================================================= */

const refreshButton =
    $("#refreshButton");


if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        async () => {

            refreshButton.disabled =
                true;


            refreshButton.classList.add(
                "is-loading"
            );


            try {

                hideError();


                await Promise.all([
                    loadDashboard(),
                    loadJobPending(),
                    loadSchedules()
                ]);


            } finally {

                refreshButton.disabled =
                    false;


                refreshButton.classList.remove(
                    "is-loading"
                );
            }
        }
    );
}


/* =========================================================
   LOGOUT
========================================================= */

const logoutButton =
    $("#logoutButton");


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                "securepro_admin_token"
            );

            localStorage.removeItem(
                "securepro_admin_user"
            );

            window.location.href =
                "login.html";
        }
    );
}


/* =========================================================
   INITIALIZE
========================================================= */

async function init() {

    setAdminName();

    updateToday();

    await Promise.all([
        loadDashboard(),
        loadJobPending(),
        loadSchedules()
    ]);
}


init();