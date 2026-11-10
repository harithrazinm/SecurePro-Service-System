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
    /^(localhost|127\.0\.0\.1)$/.test(
        location.hostname
    )
        ? "http://localhost:5001/api"
        : "/api";

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

const serviceFilter = document.querySelector("#serviceFilter");
const dateFromFilter = document.querySelector("#dateFromFilter");
const dateToFilter = document.querySelector("#dateToFilter");
const overdueOnlyFilter = document.querySelector("#overdueOnlyFilter");
const clearFiltersButton = document.querySelector("#clearFiltersButton");
const filterSummary = document.querySelector("#filterSummary");
let allRequests = [];


const refreshButton =
    document.querySelector(
        "#refreshButton"
    );

const overdueRequestCount = document.querySelector("#overdueRequestCount");
const REQUEST_OVERDUE_AFTER_MS = 48 * 60 * 60 * 1000;
const CLOSED_REQUEST_STATUSES = new Set(["completed", "cancelled", "canceled"]);


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
         * Fetch the complete list once. Search and filters run locally so
         * changing a filter feels immediate and can be combined freely.
         *
         */

        const result = await apiRequest("/admin/requests");


        if (!result) {
            return;
        }


        /*
         * ====================================
         * GET DATA
         * ====================================
         */

        let requests = result.data;


        /*
         * ====================================
         * SAFETY CHECK
         * ====================================
         */

        if (!Array.isArray(requests)) {

            requests = [];

        }


        allRequests = requests;
        populateServiceFilter(allRequests);
        applyRequestFilters();


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


function getRequestService(request) {
    const service = request.service || {};
    const names = service.name || {};
    const name = typeof names === "string"
        ? names
        : names.en || names.ms || service.code || "Other service";

    return { code: String(service.code || name), name };
}

function populateServiceFilter(requests) {
    if (!serviceFilter) return;

    const selected = serviceFilter.value;
    const services = new Map();
    requests.forEach(request => {
        const service = getRequestService(request);
        services.set(service.code, service.name);
    });

    serviceFilter.innerHTML = `<option value="">All services</option>${
        [...services.entries()]
            .sort((a, b) => a[1].localeCompare(b[1]))
            .map(([code, name]) => `<option value="${escapeHtml(code)}">${escapeHtml(name)}</option>`)
            .join("")
    }`;

    if (services.has(selected)) serviceFilter.value = selected;
}

function getRequestDateKey(value) {
    if (!value) return "";
    const valueText = String(value);
    if (/^\d{4}-\d{2}-\d{2}/.test(valueText)) return valueText.slice(0, 10);

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function isRequestOverdue(request, now = Date.now()) {
    const status = String(request.status || "pending").toLowerCase();
    const activity = new Date(request.updated_at || request.created_at || "");
    return !CLOSED_REQUEST_STATUSES.has(status) &&
        !Number.isNaN(activity.getTime()) &&
        now - activity.getTime() >= REQUEST_OVERDUE_AFTER_MS;
}

function applyRequestFilters() {
    const search = (searchInput?.value || "").trim().toLocaleLowerCase();
    const status = (statusFilter?.value || "").toLowerCase();
    const serviceCode = serviceFilter?.value || "";
    const fromDate = dateFromFilter?.value || "";
    const toDate = dateToFilter?.value || "";
    const overdueOnly = Boolean(overdueOnlyFilter?.checked);

    const filtered = allRequests.filter(request => {
        const requestStatus = String(request.status || "pending").toLowerCase();
        const service = getRequestService(request);
        const customer = request.customer || {};
        const createdDate = getRequestDateKey(request.created_at);
        const searchable = [
            request.request_code,
            request.id,
            customer.name,
            customer.phone,
            customer.email,
            service.name,
            service.code,
            request.technician?.name
        ].filter(Boolean).join(" ").toLocaleLowerCase();

        if (status && requestStatus !== status) return false;
        if (serviceCode && service.code !== serviceCode) return false;
        if (search && !searchable.includes(search)) return false;
        if (fromDate && (!createdDate || createdDate < fromDate)) return false;
        if (toDate && (!createdDate || createdDate > toDate)) return false;
        if (overdueOnly && !isRequestOverdue(request)) return false;
        return true;
    });

    if (filterSummary) {
        filterSummary.textContent = `Showing ${filtered.length} of ${allRequests.length} requests`;
    }

    if (clearFiltersButton) {
        clearFiltersButton.disabled = !search && !status && !serviceCode &&
            !fromDate && !toDate && !overdueOnly;
    }

    renderRequests(filtered);
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

    const now = Date.now();
    const overdueRequests = requests.filter(request => {
        const lastActivity = new Date(request.updated_at || request.created_at || "");
        return !CLOSED_REQUEST_STATUSES.has(String(request.status || "pending").toLowerCase()) &&
            !Number.isNaN(lastActivity.getTime()) &&
            now - lastActivity.getTime() >= REQUEST_OVERDUE_AFTER_MS;
    });
    if (overdueRequestCount) {
        overdueRequestCount.hidden = overdueRequests.length === 0;
        overdueRequestCount.textContent = overdueRequests.length
            ? `⚠ ${overdueRequests.length} overdue (48h+)`
            : "";
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

                    const lastActivity = new Date(request.updated_at || request.created_at || "");
                    const inactivityMs = Number.isNaN(lastActivity.getTime()) ? 0 : now - lastActivity.getTime();
                    const isOverdue =
                        !CLOSED_REQUEST_STATUSES.has(String(status).toLowerCase()) &&
                        inactivityMs >= REQUEST_OVERDUE_AFTER_MS;
                    const overdueHours = Math.floor(inactivityMs / (60 * 60 * 1000));
                    const overdueAge = overdueHours >= 48
                        ? `${Math.floor(overdueHours / 24)}d ${overdueHours % 24}h`
                        : "48h+";


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

                                ${isOverdue ? `<span class="request-overdue-badge">⚠ Overdue · ${escapeHtml(overdueAge)}</span>` : ""}

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


[
    statusFilter,
    serviceFilter,
    dateFromFilter,
    dateToFilter,
    overdueOnlyFilter
].forEach(control => control?.addEventListener("change", applyRequestFilters));

searchInput?.addEventListener("input", applyRequestFilters);

clearFiltersButton?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (statusFilter) statusFilter.value = "";
    if (serviceFilter) serviceFilter.value = "";
    if (dateFromFilter) dateFromFilter.value = "";
    if (dateToFilter) dateToFilter.value = "";
    if (overdueOnlyFilter) overdueOnlyFilter.checked = false;
    applyRequestFilters();
});


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
