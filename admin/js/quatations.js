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


/* =====================================================
   AUTHENTICATION
===================================================== */

if (
    !token ||
    !adminUser ||
    adminUser.role !== "admin"
) {

    window.location.href =
        "login.html";

}


/* =====================================================
   ELEMENTS
===================================================== */

const tableBody =
    document.querySelector(
        "#quotationsTableBody"
    );

const errorBox =
    document.querySelector(
        "#quotationError"
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

const createButton =
    document.querySelector(
        "#createQuotationButton"
    );

const modal =
    document.querySelector(
        "#quotationModal"
    );

const closeModalButton =
    document.querySelector(
        "#closeModalButton"
    );

const cancelButton =
    document.querySelector(
        "#cancelButton"
    );

const form =
    document.querySelector(
        "#quotationForm"
    );

const requestSelect =
    document.querySelector(
        "#requestId"
    );

const itemsContainer =
    document.querySelector(
        "#itemsContainer"
    );

const addItemButton =
    document.querySelector(
        "#addItemButton"
    );

const discountInput =
    document.querySelector(
        "#discount"
    );

const taxInput =
    document.querySelector(
        "#tax"
    );

const deliveryInput =
    document.querySelector(
        "#deliveryCharge"
    );

const validityInput =
    document.querySelector(
        "#validityDays"
    );

const notesInput =
    document.querySelector(
        "#notes"
    );

const termsInput =
    document.querySelector(
        "#terms"
    );

const formError =
    document.querySelector(
        "#formError"
    );

const saveButton =
    document.querySelector(
        "#saveButton"
    );

const subtotalDisplay =
    document.querySelector(
        "#subtotalDisplay"
    );

const discountDisplay =
    document.querySelector(
        "#discountDisplay"
    );

const taxDisplay =
    document.querySelector(
        "#taxDisplay"
    );

const deliveryDisplay =
    document.querySelector(
        "#deliveryDisplay"
    );

const totalDisplay =
    document.querySelector(
        "#totalDisplay"
    );

const logoutButton =
    document.querySelector(
        "#logoutButton"
    );


/* =====================================================
   ADMIN NAME
===================================================== */

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


/* =====================================================
   API
===================================================== */

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


/* =====================================================
   ERROR
===================================================== */

function showError(message) {

    errorBox.textContent =
        message;

    errorBox.hidden = false;

}

function hideError() {

    errorBox.textContent = "";

    errorBox.hidden = true;

}

function showFormError(message) {

    formError.textContent =
        message;

    formError.hidden = false;

}

function hideFormError() {

    formError.textContent = "";

    formError.hidden = true;

}


/* =====================================================
   FORMAT
===================================================== */

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function money(value) {

    return `RM ${Number(value || 0).toFixed(2)}`;

}


function formatDate(value) {

    if (!value) return "—";

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


function formatStatus(status) {

    return String(status || "draft")
        .replaceAll("_", " ")
        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );

}


/* =====================================================
   LOAD QUOTATIONS
===================================================== */

let quotations = [];


async function loadQuotations() {

    try {

        hideError();

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="table-loading">
                    Loading quotations...
                </td>
            </tr>
        `;


        const result =
            await apiRequest(
                "/admin/quotations"
            );


        if (!result) return;


        quotations =
            result.data || [];


        renderQuotations();


    } catch (error) {

        console.error(
            "Quotation loading error:",
            error
        );

        showError(
            error.message
        );


        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="table-empty">
                    Unable to load quotations.
                </td>
            </tr>
        `;

    }

}


/* =====================================================
   RENDER
===================================================== */

function renderQuotations() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();

    const selectedStatus =
        statusFilter.value;


    const filtered =
        quotations.filter(
            quotation => {

                const searchable = [

                    quotation.quotation_number,

                    quotation.request_code,

                    quotation.customer_name,

                    quotation.customer_email,

                    quotation.service_name

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                const matchesSearch =
                    !search ||
                    searchable.includes(search);


                const matchesStatus =
                    !selectedStatus ||
                    quotation.status === selectedStatus;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    if (
        filtered.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="table-empty">
                    No quotations found.
                </td>
            </tr>
        `;

        return;

    }


    tableBody.innerHTML =
        filtered.map(
            quotation => {

                return `

                    <tr>

                        <td>

                            <span class="quotation-number">
                                ${escapeHtml(
                                    quotation.quotation_number
                                )}
                            </span>

                            <span class="quotation-request">
                                ${escapeHtml(
                                    quotation.request_code || "—"
                                )}
                            </span>

                        </td>


                        <td>

                            <span class="customer-name">
                                ${escapeHtml(
                                    quotation.customer_name || "—"
                                )}
                            </span>

                            <span class="customer-email">
                                ${escapeHtml(
                                    quotation.customer_email || "—"
                                )}
                            </span>

                        </td>


                        <td>

                            <span class="service-name">
                                ${escapeHtml(
                                    quotation.service_name || "—"
                                )}
                            </span>

                        </td>


                        <td>

                            <span class="total-amount">
                                ${money(
                                    quotation.total
                                )}
                            </span>

                        </td>


                        <td>

                            <span
                                class="
                                    quotation-status
                                    status-${escapeHtml(
                                        quotation.status
                                    )}
                                "
                            >
                                ${formatStatus(
                                    quotation.status
                                )}
                            </span>

                        </td>


                        <td>

                            <span class="date-text">
                                ${formatDate(
                                    quotation.created_at
                                )}
                            </span>

                        </td>


                        <td>

                            <div class="action-group">

                                <button
                                    class="action-button"
                                    onclick="viewQuotation('${quotation.id}')"
                                >
                                    View
                                </button>

                                <button
                                    class="action-button"
                                    onclick="openQuotationPDF('${quotation.id}')"
                                >
                                    PDF
                                </button>

                                <button
                                    class="action-button"
                                    onclick="downloadQuotationPDF('${quotation.id}')"
                                >
                                    Download
                                </button>

                                ${
                                    quotation.status === "draft"
                                    ? `
                                        <button
                                            class="action-button send"
                                            onclick="sendQuotation('${quotation.id}')"
                                        >
                                            Send
                                        </button>
                                      `
                                    : ""
                                }

                            </div>

                        </td>

                    </tr>

                `;

            }
        ).join("");

}


/* =====================================================
   VIEW QUOTATION
===================================================== */

window.viewQuotation =
    async function(id) {

        try {

            const result =
                await apiRequest(
                    `/admin/quotations/${id}`
                );


            if (!result) return;


            const quotation =
                result.data;


            const itemText =
                (quotation.items || [])
                    .map(
                        item =>
                            `${item.description} × ${item.quantity} = ${money(item.amount)}`
                    )
                    .join("\n");


            alert(
`Quotation: ${quotation.quotation_number}

Customer: ${quotation.customer_name}
Email: ${quotation.customer_email}
Phone: ${quotation.customer_phone}

Service: ${quotation.service_name_en}

Subtotal: ${money(quotation.subtotal)}
Discount: ${money(quotation.discount)}
Tax: ${money(quotation.tax)}
Delivery: ${money(quotation.delivery_charge)}
Total: ${money(quotation.total)}

Items:
${itemText}

Status: ${formatStatus(quotation.status)}

Notes:
${quotation.notes || "—"}

Terms:
${quotation.terms || "—"}`
            );


        } catch (error) {

            showError(
                error.message
            );

        }

    };


/* =====================================================
   OPEN PDF
===================================================== */

window.openQuotationPDF =
    function(id) {

        if (!token) {

            window.location.href =
                "login.html";

            return;

        }


        const url =
            `${API_BASE}/admin/quotations/${encodeURIComponent(id)}/pdf`;


        fetch(
            url,
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        )
        .then(
            async response => {

                if (!response.ok) {

                    const result =
                        await response.json()
                            .catch(
                                () => ({})
                            );

                    throw new Error(
                        result.message ||
                        "Unable to generate PDF."
                    );

                }


                const blob =
                    await response.blob();


                const blobUrl =
                    URL.createObjectURL(
                        blob
                    );


                window.open(
                    blobUrl,
                    "_blank"
                );

            }
        )
        .catch(
            error => {

                showError(
                    error.message
                );

            }
        );

    };


/* =====================================================
   DOWNLOAD PDF
===================================================== */

window.downloadQuotationPDF =
    function(id) {

        fetch(
            `${API_BASE}/admin/quotations/${encodeURIComponent(id)}/pdf`,
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        )
        .then(
            async response => {

                if (!response.ok) {

                    const result =
                        await response.json()
                            .catch(
                                () => ({})
                            );

                    throw new Error(
                        result.message ||
                        "Unable to download PDF."
                    );

                }


                const blob =
                    await response.blob();


                const blobUrl =
                    URL.createObjectURL(
                        blob
                    );


                const link =
                    document.createElement(
                        "a"
                    );

                link.href =
                    blobUrl;

                link.download =
                    "quotation.pdf";

                document.body.appendChild(
                    link
                );

                link.click();

                link.remove();

                URL.revokeObjectURL(
                    blobUrl
                );

            }
        )
        .catch(
            error => {

                showError(
                    error.message
                );

            }
        );

    };


/* =====================================================
   SEND QUOTATION
===================================================== */

window.sendQuotation =
    async function(id) {

        const confirmed =
            confirm(
                "Send this quotation to the customer?"
            );


        if (!confirmed) return;


        try {

            const result =
                await apiRequest(
                    `/admin/quotations/${id}/send`,
                    {
                        method: "POST"
                    }
                );


            if (!result) return;


            alert(
                result.message ||
                "Quotation sent successfully."
            );


            await loadQuotations();


        } catch (error) {

            showError(
                error.message
            );

        }

    };


/* =====================================================
   LOAD SERVICE REQUESTS
===================================================== */

async function loadRequests() {

    try {

        const result =
            await apiRequest(
                "/admin/requests"
            );


        if (!result) return;


        const requests =
            result.data || [];


        requestSelect.innerHTML = `
            <option value="">
                Select a service request
            </option>
        `;


        requests.forEach(
            request => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    request.id;


                const customer =
                    request.customer
                        ? request.customer.name
                        : "Unknown Customer";


                const service =
                    request.service &&
                    request.service.name
                        ? request.service.name.en
                        : "Service";


                option.textContent =
                    `${request.request_code} — ${customer} — ${service}`;


                requestSelect.appendChild(
                    option
                );

            }
        );


    } catch (error) {

        requestSelect.innerHTML = `
            <option value="">
                Unable to load requests
            </option>
        `;

        console.error(
            "Request loading error:",
            error
        );

    }

}


/* =====================================================
   ITEMS
===================================================== */

function addItem(
    description = "",
    quantity = 1,
    unitPrice = 0
) {

    const row =
        document.createElement(
            "div"
        );


    row.className =
        "item-row";


    row.innerHTML = `

        <div>

            <label>
                Description
            </label>

            <input
                type="text"
                class="item-description"
                value="${escapeHtml(description)}"
                placeholder="e.g. CCTV Installation"
                required
            >

        </div>


        <div>

            <label>
                Qty
            </label>

            <input
                type="number"
                class="item-quantity"
                min="0.01"
                step="0.01"
                value="${quantity}"
                required
            >

        </div>


        <div>

            <label>
                Unit Price
            </label>

            <input
                type="number"
                class="item-price"
                min="0"
                step="0.01"
                value="${unitPrice}"
                required
            >

        </div>


        <div>

            <label>
                Amount
            </label>

            <div class="item-amount">
                RM 0.00
            </div>

        </div>


        <button
            type="button"
            class="remove-item"
            title="Remove item"
        >
            ×
        </button>

    `;


    itemsContainer.appendChild(
        row
    );


    const quantityInput =
        row.querySelector(
            ".item-quantity"
        );

    const priceInput =
        row.querySelector(
            ".item-price"
        );


    function updateItem() {

        const quantity =
            Number(
                quantityInput.value
            ) || 0;


        const price =
            Number(
                priceInput.value
            ) || 0;


        row.querySelector(
            ".item-amount"
        ).textContent =
            money(
                quantity * price
            );


        calculateTotals();

    }


    quantityInput.addEventListener(
        "input",
        updateItem
    );

    priceInput.addEventListener(
        "input",
        updateItem
    );


    row.querySelector(
        ".remove-item"
    ).addEventListener(
        "click",
        () => {

            row.remove();

            calculateTotals();

        }
    );


    updateItem();

}


function getItems() {

    return [
        ...itemsContainer.querySelectorAll(
            ".item-row"
        )
    ].map(
        row => {

            const description =
                row.querySelector(
                    ".item-description"
                ).value.trim();


            const quantity =
                Number(
                    row.querySelector(
                        ".item-quantity"
                    ).value
                );


            const unitPrice =
                Number(
                    row.querySelector(
                        ".item-price"
                    ).value
                );


            return {

                description,

                quantity,

                unit_price:
                    unitPrice

            };

        }
    );

}


/* =====================================================
   CALCULATE TOTALS
===================================================== */

function calculateTotals() {

    const items =
        getItems();


    const subtotal =
        items.reduce(
            (
                total,
                item
            ) =>
                total +
                (
                    Number(item.quantity) *
                    Number(item.unit_price)
                ),
            0
        );


    const discount =
        Number(
            discountInput.value
        ) || 0;


    const tax =
        Number(
            taxInput.value
        ) || 0;


    const delivery =
        Number(
            deliveryInput.value
        ) || 0;


    const total =
        subtotal -
        discount +
        tax +
        delivery;


    subtotalDisplay.textContent =
        money(subtotal);


    discountDisplay.textContent =
        money(discount);


    taxDisplay.textContent =
        money(tax);


    deliveryDisplay.textContent =
        money(delivery);


    totalDisplay.textContent =
        money(
            Math.max(
                total,
                0
            )
        );

}


/* =====================================================
   MODAL
===================================================== */

function openModal() {

    modal.hidden = false;

    hideFormError();

    itemsContainer.innerHTML = "";

    requestSelect.value = "";

    discountInput.value = 0;

    taxInput.value = 0;

    deliveryInput.value = 0;

    validityInput.value = 30;

    notesInput.value = "";

    termsInput.value =
        "Payment terms: 50% deposit before service.";


    addItem(
        "Service Call",
        1,
        50
    );


    calculateTotals();

}


function closeModal() {

    modal.hidden = true;

}


createButton.addEventListener(
    "click",
    openModal
);


closeModalButton.addEventListener(
    "click",
    closeModal
);


cancelButton.addEventListener(
    "click",
    closeModal
);


modal.addEventListener(
    "click",
    event => {

        if (
            event.target === modal
        ) {

            closeModal();

        }

    }
);


/* =====================================================
   ADD ITEM
===================================================== */

addItemButton.addEventListener(
    "click",
    () => {

        addItem();

    }
);


/* =====================================================
   CHARGES
===================================================== */

[
    discountInput,
    taxInput,
    deliveryInput
].forEach(
    input => {

        input.addEventListener(
            "input",
            calculateTotals
        );

    }
);


/* =====================================================
   CREATE QUOTATION
===================================================== */

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        hideFormError();


        const requestId =
            requestSelect.value;


        if (!requestId) {

            showFormError(
                "Please select a service request."
            );

            return;

        }


        const items =
            getItems();


        if (
            items.length === 0
        ) {

            showFormError(
                "Please add at least one quotation item."
            );

            return;

        }


        for (
            const item of items
        ) {

            if (
                !item.description ||
                !Number.isFinite(
                    item.quantity
                ) ||
                !Number.isFinite(
                    item.unit_price
                )
            ) {

                showFormError(
                    "Please complete all quotation items."
                );

                return;

            }

        }


        const payload = {

            request_id:
                requestId,

            items,

            discount:
                Number(
                    discountInput.value
                ) || 0,

            tax:
                Number(
                    taxInput.value
                ) || 0,

            delivery_charge:
                Number(
                    deliveryInput.value
                ) || 0,

            validity_days:
                Number(
                    validityInput.value
                ) || 30,

            notes:
                notesInput.value.trim(),

            terms:
                termsInput.value.trim()

        };


        saveButton.disabled =
            true;

        saveButton.textContent =
            "Saving...";


        try {

            const result =
                await apiRequest(
                    "/admin/quotations",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                payload
                            )

                    }
                );


            if (!result) return;


            closeModal();


            await loadQuotations();


            alert(
                result.message ||
                "Quotation created successfully."
            );


        } catch (error) {

            console.error(
                "Create quotation error:",
                error
            );


            showFormError(
                error.message
            );


        } finally {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Save Draft";

        }

    }
);


/* =====================================================
   SEARCH
===================================================== */

searchInput.addEventListener(
    "input",
    renderQuotations
);


statusFilter.addEventListener(
    "change",
    renderQuotations
);


/* =====================================================
   REFRESH
===================================================== */

refreshButton.addEventListener(
    "click",
    loadQuotations
);


/* =====================================================
   LOGOUT
===================================================== */

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


/* =====================================================
   INITIALIZE
===================================================== */

async function init() {

    await loadQuotations();

    await loadRequests();

}


init();