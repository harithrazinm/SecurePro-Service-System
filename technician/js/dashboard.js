const API_BASE =
    "https://securepro-service-system.onrender.com/api";


let requests = [];


/* =========================================================
   AUTH
========================================================= */

function getToken() {

    return localStorage.getItem(
        "securepro_technician_token"
    );

}


function requireToken() {

    const token =
        getToken();


    if (!token) {

        window.location.href =
            "login.html";

        return false;

    }


    return true;

}


/* =========================================================
   HELPERS
========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


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


    return date.toLocaleString(
        "en-MY",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );

}


function formatStatus(status) {

    const labels = {

        pending:
            "Pending",

        assigned:
            "Assigned",

        in_progress:
            "In Progress",

        waiting_parts:
            "Waiting Parts",

        completed:
            "Completed",

        cancelled:
            "Cancelled"

    };


    return labels[status] ||
        status ||
        "Unknown";

}


function statusClass(status) {

    return String(
        status || ""
    )
        .replaceAll(
            "_",
            "-"
        );

}


/* =========================================================
   ADMIN / TECHNICIAN INFO
========================================================= */

function loadTechnicianInfo() {

    try {

        const raw =
            localStorage.getItem(
                "securepro_technician_user"
            );


        if (!raw) {

            return;

        }


        const user =
            JSON.parse(raw);


        const name =
            user.name ||
            "Technician";


        const sidebar =
            document.querySelector(
                "#sidebarTechnicianName"
            );


        const topbar =
            document.querySelector(
                "#topbarTechnicianName"
            );


        const welcome =
            document.querySelector(
                "#welcomeTechnicianName"
            );


        if (sidebar) {

            sidebar.textContent =
                name;

        }


        if (topbar) {

            topbar.textContent =
                name;

        }


        if (welcome) {

            welcome.textContent =
                name;

        }


    } catch (error) {

        console.warn(
            "Unable to load technician information:",
            error
        );

    }

}


/* =========================================================
   ERROR
========================================================= */

function showError(message) {

    const element =
        document.querySelector(
            "#dashboardError"
        );


    if (!element) {

        return;

    }


    element.textContent =
        message ||
        "Unable to load requests.";


    element.hidden =
        false;

}


function hideError() {

    const element =
        document.querySelector(
            "#dashboardError"
        );


    if (!element) {

        return;

    }


    element.textContent =
        "";


    element.hidden =
        true;

}


/* =========================================================
   SUMMARY
========================================================= */

function renderSummary() {

    const assigned =
        requests.filter(
            request =>
                request.status ===
                "assigned"
        ).length;


    const progress =
        requests.filter(
            request =>
                request.status ===
                "in_progress"
        ).length;


    const completed =
        requests.filter(
            request =>
                request.status ===
                "completed"
        ).length;


    const assignedElement =
        document.querySelector(
            "#assignedCount"
        );


    const progressElement =
        document.querySelector(
            "#progressCount"
        );


    const completedElement =
        document.querySelector(
            "#completedCount"
        );


    if (assignedElement) {

        assignedElement.textContent =
            assigned;

    }


    if (progressElement) {

        progressElement.textContent =
            progress;

    }


    if (completedElement) {

        completedElement.textContent =
            completed;

    }

}


/* =========================================================
   REQUESTS
========================================================= */

function renderRequests() {

    const loading =
        document.querySelector(
            "#requestLoading"
        );


    const empty =
        document.querySelector(
            "#emptyRequests"
        );


    const list =
        document.querySelector(
            "#requestList"
        );


    if (!loading || !empty || !list) {

        console.error(
            "Technician dashboard elements are missing."
        );

        return;

    }


    loading.style.display =
        "none";


    if (!requests.length) {

        list.hidden =
            true;

        empty.hidden =
            false;

        return;

    }


    empty.hidden =
        true;

    list.hidden =
        false;


    list.innerHTML =
        requests.map(
            request => {

                const serviceName =
                    request.service?.name?.en ||
                    request.service?.code ||
                    "Service";


                const status =
                    request.status ||
                    "pending";


                return `

                    <article
                        class="request-card"
                    >

                        <div
                            class="request-card-main"
                        >

                            <span
                                class="request-code"
                            >
                                ${escapeHtml(
                                    request.request_code
                                )}
                            </span>


                            <h3>
                                ${escapeHtml(
                                    serviceName
                                )}
                            </h3>


                            <div
                                class="request-meta"
                            >

                                <span>
                                    Created:
                                    ${escapeHtml(
                                        formatDate(
                                            request.created_at
                                        )
                                    )}
                                </span>

                            </div>

                        </div>


                        <div
                            class="request-card-actions"
                        >

                            <span
                                class="
                                    status-badge
                                    status-${escapeHtml(
                                        statusClass(
                                            status
                                        )
                                    )}
                                "
                            >
                                ${escapeHtml(
                                    formatStatus(
                                        status
                                    )
                                )}
                            </span>


                            <a
                                class="view-button"
                                href="
                                    request.html?id=${encodeURIComponent(
                                        request.id
                                    )}
                                "
                            >
                                View Request
                                →
                            </a>

                        </div>

                    </article>

                `;

            }
        ).join("");

}


/* =========================================================
   LOAD REQUESTS
========================================================= */

async function loadRequests() {

    hideError();


    const loading =
        document.querySelector(
            "#requestLoading"
        );


    const list =
        document.querySelector(
            "#requestList"
        );


    const empty =
        document.querySelector(
            "#emptyRequests"
        );


    if (!loading || !list || !empty) {

        console.error(
            "Required technician dashboard elements are missing."
        );

        return;

    }


    loading.style.display =
        "flex";

    list.hidden =
        true;

    empty.hidden =
        true;


    try {

        /*
         * IMPORTANT:
         *
         * Get the latest token every time.
         * Do not store the token globally.
         */

        const token =
            getToken();


        if (!token) {

            window.location.href =
                "login.html";

            return;

        }


        console.log(
            "Loading technician requests..."
        );


        const response =
            await fetch(
                `${API_BASE}/technician/requests`,
                {
                    method: "GET",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`,

                        "Accept":
                            "application/json"

                    },

                    cache:
                        "no-store"

                }
            );


        console.log(
            "Technician API status:",
            response.status
        );


        /*
         * Read response safely
         */

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        let result;


        if (
            contentType.includes(
                "application/json"
            )
        ) {

            result =
                await response.json();

        } else {

            const text =
                await response.text();


            console.error(
                "Unexpected API response:",
                text
            );


            throw new Error(
                `Server returned HTTP ${response.status}`
            );

        }


        console.log(
            "Technician API response:",
            result
        );


        /*
         * Authentication failed
         */

        if (
            response.status === 401
        ) {

            localStorage.removeItem(
                "securepro_technician_token"
            );

            localStorage.removeItem(
                "securepro_technician_user"
            );


            window.location.href =
                "login.html";


            return;

        }


        /*
         * Other API errors
         */

        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                `Unable to load requests. HTTP ${response.status}`
            );

        }


        /*
         * Store requests
         */

        requests =
            Array.isArray(
                result.data
            )
                ? result.data
                : [];


        console.log(
            "Technician requests loaded:",
            requests.length
        );


        /*
         * Render
         */

        renderSummary();

        renderRequests();


    } catch (error) {

        console.error(
            "Technician dashboard error:",
            error
        );


        loading.style.display =
            "none";


        showError(
            error.message ||
            "Unable to load technician requests."
        );

    }

}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    localStorage.removeItem(
        "securepro_technician_token"
    );


    localStorage.removeItem(
        "securepro_technician_user"
    );


    window.location.href =
        "login.html";

}


/* =========================================================
   REFRESH
========================================================= */

function refreshRequests() {

    loadRequests();

}


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        if (!requireToken()) {

            return;

        }


        loadTechnicianInfo();


        loadRequests();


        const refreshButton =
            document.querySelector(
                "#refreshButton"
            );


        if (refreshButton) {

            refreshButton.addEventListener(
                "click",
                refreshRequests
            );

        }


        const logoutButton =
            document.querySelector(
                "#logoutButton"
            );


        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                logout
            );

        }

    }
);