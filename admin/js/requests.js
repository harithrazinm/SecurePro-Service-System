/*
 * ========================================
 * SECUREPRO ADMIN
 * SERVICE REQUESTS PAGE
 * ========================================
 *
 * This page displays ALL service requests.
 *
 * LOCAL DEVELOPMENT:
 * http://localhost:5001/api
 *
 * PRODUCTION:
 * https://securepro-service-system.onrender.com/api
 *
 */


/*
 * ========================================
 * API CONFIGURATION
 * ========================================
 *
 * Use localhost while testing locally.
 *
 */

const API_BASE = 
       "https://securepro-service-system.onrender.com/api";
  //  "http://localhost:5001/api";


/*
 * ========================================
 * AUTHENTICATION
 * ========================================
 */

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

} catch (error) {

    console.error(
        "Unable to parse admin user:",
        error
    );

    adminUser = null;

}


/*
 * ========================================
 * CHECK ADMIN LOGIN
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

const requestsTableBody =
    document.querySelector(
        "#requestsTableBody"
    );


const requestTotalLabel =
    document.querySelector(
        "#requestTotalLabel"
    );


const dashboardError =
    document.querySelector(
        "#dashboardError"
    );


const searchInput =
    document.querySelector(
        "#searchInput"
    );


const statusFilter =
    document.querySelector(
        "#statusFilter"
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

const sidebarAdminName =
    document.querySelector(
        "#sidebarAdminName"
    );


const topbarAdminName =
    document.querySelector(
        "#topbarAdminName"
    );


if (adminUser) {

    if (sidebarAdminName) {

        sidebarAdminName.textContent =
            adminUser.name || "Admin";

    }


    if (topbarAdminName) {

        topbarAdminName.textContent =
            adminUser.name || "Admin";

    }

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

    try {

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


        /*
         * ====================================
         * AUTHORIZATION ERROR
         * ====================================
         */

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


        /*
         * ====================================
         * READ RESPONSE
         * ====================================
         */

        const result =
            await response.json();


        /*
         * ====================================
         * API ERROR
         * ====================================
         */

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


    } catch (error) {

        console.error(
            "API Request Error:",
            error
        );

        throw error;

    }

}


/*
 * ========================================
 * SHOW ERROR
 * ========================================
 */

function showError(
    message
) {

    if (!dashboardError) {
        return;
    }


    dashboardError.textContent =
        message;


    dashboardError.hidden =
        false;

}


/*
 * ========================================
 * HIDE ERROR
 * ========================================
 */

function hideError() {

    if (!dashboardError) {
        return;
    }


    dashboardError.hidden =
        true;


    dashboardError.textContent =
        "";

}


/*
 * ========================================
 * LOAD REQUESTS
 * ========================================
 */

async function loadRequests() {

    try {

        hideError();


        /*
         * ====================================
         * LOADING MESSAGE
         * ====================================
         */

        if (requestsTableBody) {

            requestsTableBody.innerHTML = `
                <tr>
                    <td
                        colspan="7"
                        class="table-loading"
                    >
                        Loading service requests...
                    </td>
                </tr>
            `;

        }


        /*
         * ====================================
         * SEARCH + STATUS
         * ====================================
         */

        const params =
            new URLSearchParams();


        const search =
            searchInput
                ? searchInput.value.trim()
                : "";


        const status =
            statusFilter
                ? statusFilter.value
                : "";


        if (search) {

            params.set(
                "search",
                search
            );

        }


        if (status) {

            params.set(
                "status",
                status
            );

        }


        const query =
            params.toString();


        /*
         * ====================================
         * GET ALL REQUESTS
         * ====================================
         *
         * IMPORTANT:
         *
         * There is NO:
         *
         * slice(0, 5)
         *
         * limit = 5
         *
         * pagination
         *
         *
         * The API returns all requests.
         *
         */

        const result =
            await apiRequest(
                `/admin/requests${
                    query
                        ? `?${query}`
                        : ""
                }`
            );


        if (!result) {
            return;
        }


        /*
         * ====================================
         * GET DATA
         * ====================================
         */

        let requests =
            result.data;


        /*
         * ====================================
         * SAFETY CHECK
         * ====================================
         */

        if (!Array.isArray(requests)) {

            requests = [];

        }


        console.log(
            "Service requests received:",
            requests.length
        );


        /*
         * ====================================
         * RENDER ALL REQUESTS
         * ====================================
         */

        renderRequests(
            requests
        );


    } catch (error) {

        console.error(
            "Request loading error:",
            error
        );


        showError(
            error.message ||
            "Unable to load service requests."
        );


        if (requestsTableBody) {

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

}


/*
 * ========================================
 * RENDER REQUESTS
 * ========================================
 */

function renderRequests(
    requests
) {

    /*
     * ====================================
     * MAKE SURE ARRAY
     * ====================================
     */

    if (!Array.isArray(requests)) {

        requests = [];

    }


    /*
     * ====================================
     * UPDATE TOTAL
     * ====================================
     */

    if (requestTotalLabel) {

        requestTotalLabel.textContent =
            `${requests.length} request${
                requests.length === 1
                    ? ""
                    : "s"
            }`;

    }


    /*
     * ====================================
     * EMPTY STATE
     * ====================================
     */

    if (
        requests.length === 0
    ) {

        if (requestsTableBody) {

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

        }

        return;

    }


    /*
     * ====================================
     * RENDER EVERY REQUEST
     * ====================================
     */

    if (!requestsTableBody) {

        console.error(
            "ERROR: #requestsTableBody was not found."
        );

        return;

    }


    requestsTableBody.innerHTML =
        requests
            .map(
                request => {

                    /*
                     * ==========================
                     * REQUEST DATE
                     * ==========================
                     */

                    const date =
                        formatDate(
                            request.created_at
                        );


                    /*
                     * ==========================
                     * SERVICE NAME
                     * ==========================
                     */

                    let serviceName =
                        "—";


                    if (
                        request.service &&
                        request.service.name
                    ) {

                        if (
                            typeof request.service.name ===
                            "object"
                        ) {

                            serviceName =
                                request.service.name.en ||
                                request.service.name.ms ||
                                "—";

                        } else {

                            serviceName =
                                request.service.name;

                        }

                    }


                    /*
                     * ==========================
                     * TECHNICIAN
                     * ==========================
                     */

                    const technician =
                        request.technician
                            ? request.technician.name
                            : null;


                    /*
                     * ==========================
                     * STATUS
                     * ==========================
                     */

                    const status =
                        request.status ||
                        "pending";


                    /*
                     * ==========================
                     * CUSTOMER
                     * ==========================
                     */

                    const customer =
                        request.customer || {};


                    const customerName =
                        customer.name ||
                        "—";


                    const customerPhone =
                        customer.phone ||
                        "—";


                    /*
                     * ==========================
                     * REQUEST CODE
                     * ==========================
                     */

                    const requestCode =
                        request.request_code ||
                        "—";


                    /*
                     * ==========================
                     * REQUEST ID
                     * ==========================
                     */

                    const requestId =
                        request.id ||
                        "";


                    /*
                     * ==========================
                     * RETURN ROW
                     * ==========================
                     */

                    return `
                        <tr>

                            <!-- REQUEST -->

                            <td>

                                <span
                                    class="request-code"
                                >
                                    ${escapeHtml(
                                        requestCode
                                    )}
                                </span>

                                <span
                                    class="request-date"
                                >
                                    ${escapeHtml(
                                        date
                                    )}
                                </span>

                            </td>


                            <!-- CUSTOMER -->

                            <td>

                                <span
                                    class="customer-name"
                                >
                                    ${escapeHtml(
                                        customerName
                                    )}
                                </span>

                                <span
                                    class="customer-phone"
                                >
                                    ${escapeHtml(
                                        customerPhone
                                    )}
                                </span>

                            </td>


                            <!-- SERVICE -->

                            <td>

                                <span
                                    class="service-name"
                                >
                                    ${escapeHtml(
                                        serviceName
                                    )}
                                </span>

                            </td>


                            <!-- STATUS -->

                            <td>

                                <span
                                    class="
                                        status-badge
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

                            </td>


                            <!-- TECHNICIAN -->

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


                            <!-- CREATED DATE -->

                            <td>

                                ${escapeHtml(
                                    date
                                )}

                            </td>


                            <!-- VIEW -->

                            <td>

                                <a
                                    class="view-button"
                                    href="request.html?id=${
                                        encodeURIComponent(
                                            requestId
                                        )
                                    }"
                                >
                                    View
                                </a>

                            </td>

                        </tr>
                    `;

                }
            )
            .join("");

}


/*
 * ========================================
 * FORMAT STATUS
 * ========================================
 */

function formatStatus(
    status
) {

    if (!status) {

        return "Pending";

    }


    return String(status)
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
 * FORMAT DATE
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

    return String(
        value ?? ""
    )
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
 * REFRESH BUTTON
 * ========================================
 */

if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        async () => {

            await loadRequests();

        }
    );

}


/*
 * ========================================
 * STATUS FILTER
 * ========================================
 */

if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        async () => {

            await loadRequests();

        }
    );

}


/*
 * ========================================
 * SEARCH
 * ========================================
 */

let searchTimer = null;


if (searchInput) {

    searchInput.addEventListener(
        "input",
        () => {

            clearTimeout(
                searchTimer
            );


            searchTimer =
                setTimeout(
                    () => {

                        loadRequests();

                    },
                    350
                );

        }
    );

}


/*
 * ========================================
 * REQUESTS NAVIGATION
 * ========================================
 *
 * IMPORTANT:
 *
 * The element may not exist on this page.
 *
 * Therefore we check it before using
 * addEventListener().
 *
 */

const requestsNav =
    document.querySelector(
        "#requestsNav"
    );


if (requestsNav) {

    requestsNav.addEventListener(
        "click",
        event => {

            event.preventDefault();


            const requestsSection =
                document.querySelector(
                    "#requests"
                );


            if (requestsSection) {

                requestsSection.scrollIntoView({
                    behavior: "smooth"
                });

            }

        }
    );

}


/*
 * ========================================
 * LOGOUT
 * ========================================
 */

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


/*
 * ========================================
 * INITIAL LOAD
 * ========================================
 */

async function init() {

    console.log(
        "========================================"
    );

    console.log(
        "SecurePro Service Orders"
    );

    console.log(
        "Loading ALL service requests..."
    );

    console.log(
        "API:",
        API_BASE
    );

    console.log(
        "========================================"
    );


    await loadRequests();

}


/*
 * ========================================
 * START
 * ========================================
 */

init();