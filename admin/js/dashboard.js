const API_BASE =
    "https://securepro-service-system.onrender.com/api";

const token =
    localStorage.getItem(
        "securepro_admin_token"
    );


const storedUser =
    localStorage.getItem(
        "securepro_admin_user"
    );


let adminUser = null;

try {

    adminUser =
        JSON.parse(
            storedUser || "null"
        );

} catch {

    adminUser = null;

}


/*
 * ========================================
 * AUTHENTICATION
 * ========================================
 */

if (
    !token ||
    !adminUser ||
    adminUser.role !== "admin"
) {

    window.location.href =
        "login.html";

}


/*
 * ========================================
 * ELEMENTS
 * ========================================
 */

const totalCount =
    document.querySelector("#totalCount");

const pendingCount =
    document.querySelector("#pendingCount");

const assignedCount =
    document.querySelector("#assignedCount");

const progressCount =
    document.querySelector("#progressCount");

const completedCount =
    document.querySelector("#completedCount");

const requestsTableBody =
    document.querySelector(
        "#requestsTableBody"
    );

const dashboardError =
    document.querySelector(
        "#dashboardError"
    );

const refreshButton =
    document.querySelector(
        "#refreshButton"
    );

const logoutButton =
    document.querySelector(
        "#logoutButton"
    );


/*
 * ========================================
 * ADMIN NAME
 * ========================================
 */

if (adminUser) {

    document.querySelector(
        "#sidebarAdminName"
    ).textContent =
        adminUser.name || "Admin";


    document.querySelector(
        "#topbarAdminName"
    ).textContent =
        adminUser.name || "Admin";

}


/*
 * ========================================
 * API REQUEST
 * ========================================
 */

async function apiRequest(
    url,
    options = {}
) {

    const response =
        await fetch(
            `${API_BASE}${url}`,
            {
                ...options,

                headers: {

                    ...(options.headers || {}),

                    Authorization:
                        `Bearer ${token}`

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

        window.location.href =
            "login.html";

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


/*
 * ========================================
 * ERROR
 * ========================================
 */

function showError(message) {

    dashboardError.textContent =
        message;

    dashboardError.hidden = false;

}


function hideError() {

    dashboardError.hidden = true;

    dashboardError.textContent = "";

}


/*
 * ========================================
 * DASHBOARD SUMMARY
 * ========================================
 */

async function loadDashboard() {

    try {

        const result =
            await apiRequest(
                "/admin/dashboard"
            );


        if (!result) return;


        const data =
            result.data;


        totalCount.textContent =
            Number(data.total || 0);


        pendingCount.textContent =
            Number(data.pending || 0);


        assignedCount.textContent =
            Number(data.assigned || 0);


        progressCount.textContent =
            Number(
                data.in_progress || 0
            );


        completedCount.textContent =
            Number(
                data.completed || 0
            );


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

        showError(
            error.message
        );

    }

}


/*
 * ========================================
 * LOAD REQUESTS
 * ========================================
 */

async function loadRequests() {

    try {

        hideError();


        requestsTableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="table-loading"
                >
                    Loading requests...
                </td>
            </tr>
        `;


        const result =
            await apiRequest(
                "/admin/requests"
            );


        if (!result) return;


        renderRequests(
            (result.data || []).slice(0, 5)
        );


    } catch (error) {

        console.error(
            "Request loading error:",
            error
        );

        showError(
            error.message
        );


        requestsTableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="table-empty"
                >
                    Unable to load requests.
                </td>
            </tr>
        `;

    }

}


/*
 * ========================================
 * RENDER REQUESTS
 * ========================================
 */

function renderRequests(
    requests
) {

    if (
        !requests ||
        requests.length === 0
    ) {

        requestsTableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="table-empty"
                >
                    No service requests found.
                </td>
            </tr>
        `;

        return;

    }


    requestsTableBody.innerHTML =
        requests.map(
            request => {

                const date =
                    formatDate(
                        request.created_at
                    );


                const serviceName =
                    request.service &&
                    request.service.name
                        ? request.service.name.en
                        : "—";


                const technician =
                    request.technician
                        ? request.technician.name
                        : null;


                const status =
                    request.status ||
                    "pending";


                return `
                    <tr>

                        <td>

                            <span
                                class="request-code"
                            >
                                ${escapeHtml(
                                    request.request_code
                                )}
                            </span>

                            <span
                                class="request-date"
                            >
                                ${date}
                            </span>

                        </td>


                        <td>

                            <span
                                class="customer-name"
                            >
                                ${escapeHtml(
                                    request.customer.name
                                )}
                            </span>

                            <span
                                class="customer-phone"
                            >
                                ${escapeHtml(
                                    request.customer.phone
                                )}
                            </span>

                        </td>


                        <td>

                            <span
                                class="service-name"
                            >
                                ${escapeHtml(
                                    serviceName
                                )}
                            </span>

                        </td>


                        <td>

                            <span
                                class="
                                    status-badge
                                    status-${status}
                                "
                            >
                                ${formatStatus(
                                    status
                                )}
                            </span>

                        </td>


                        <td>

                            ${
                                technician
                                    ? `
                                        <span>
                                            ${escapeHtml(
                                                technician
                                            )}
                                        </span>
                                      `
                                    : `
                                        <span
                                            class="
                                                technician-empty
                                            "
                                        >
                                            Not assigned
                                        </span>
                                      `
                            }

                        </td>


                        <td>
                            ${date}
                        </td>


                        <td>

                            <a
                                class="view-button"
                                href="request.html?id=${
                                    encodeURIComponent(
                                        request.id
                                    )
                                }"
                            >
                                View
                            </a>

                        </td>

                    </tr>
                `;

            }
        ).join("");

}


/*
 * ========================================
 * STATUS TEXT
 * ========================================
 */

function formatStatus(
    status
) {

    return status
        .replaceAll(
            "_",
            " "
        )
        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );

}


/*
 * ========================================
 * DATE
 * ========================================
 */

function formatDate(
    value
) {

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


/*
 * ========================================
 * HTML ESCAPE
 * ========================================
 */

function escapeHtml(
    value
) {

    return String(value ?? "")
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


/*
 * ========================================
 * EVENTS
 * ========================================
 */

refreshButton.addEventListener(
    "click",
    async () => {

        await loadDashboard();

        await loadRequests();

    }
);




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


/*
 * ========================================
 * INITIAL LOAD
 * ========================================
 */

async function init() {

    await loadDashboard();

    await loadRequests();

}


init();
