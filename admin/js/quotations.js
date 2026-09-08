/* =========================================================
   API
========================================================= */

const API_BASE =
    ["localhost", "127.0.0.1"]
        .includes(window.location.hostname)

        ? "http://localhost:5001/api"

        : "https://securepro-service-system.onrender.com/api";


/* =========================================================
   AUTH
========================================================= */

const token =
    localStorage.getItem(
        "securepro_admin_token"
    );


if (!token) {

    window.location.href =
        "login.html";

}


/* =========================================================
   ELEMENTS
========================================================= */

const $ =
    selector =>
        document.querySelector(
            selector
        );


const tableBody =
    $("#quotationsTableBody");

const errorBox =
    $("#quotationError");

const modal =
    $("#quotationModal");

const form =
    $("#quotationForm");

const requestSelect =
    $("#requestId");

const quotationFile =
    $("#quotationFile");

const notesInput =
    $("#notes");

const proofInput =
    $("#paymentProofFile");


let quotations = [];

let proofQuotationId =
    null;

let editingQuotation =
    null;


/* =========================================================
   ERROR
========================================================= */

function showError(
    message,
    target = errorBox
) {

    if (!target) return;

    target.textContent =
        message ||
        "Something went wrong.";

    target.hidden =
        false;

}


function hideError(
    target = errorBox
) {

    if (!target) return;

    target.textContent =
        "";

    target.hidden =
        true;

}


/* =========================================================
   API REQUEST
========================================================= */

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

                    Authorization:
                        `Bearer ${token}`,

                    ...(options.headers || {})

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
        await response.json()
            .catch(
                () => ({
                    success: false,
                    message:
                        "Invalid server response."
                })
            );


    if (
        !response.ok ||
        !result.success
    ) {

        throw new Error(
            result.message ||
            `Request failed (${response.status}).`
        );

    }


    return result;

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /[&<>'"]/g,
            character =>
                ({
                    "&":
                        "&amp;",
                    "<":
                        "&lt;",
                    ">":
                        "&gt;",
                    "'":
                        "&#039;",
                    '"':
                        "&quot;"
                }[
                    character
                ])
        );

}


/* =========================================================
   DATE
========================================================= */

function formatDate(
    value
) {

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

    return new Intl.DateTimeFormat(
        "en-MY",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"

        }
    ).format(date);

}


/* =========================================================
   STATUS
========================================================= */

function formatStatus(
    value
) {

    return String(
        value || "draft"
    )
        .replaceAll(
            "_",
            " "
        )
        .replace(
            /\b\w/g,
            character =>
                character.toUpperCase()
        );

}


/* =========================================================
   FOLLOW-UP
========================================================= */

function followUpInfo(
    quotation,
    number
) {

    const sentAt =
        quotation.sent_at
            ? new Date(
                quotation.sent_at
            )
            : null;


    const completedAt =
        quotation[
            `follow_up_${number}_sent_at`
        ];


    if (completedAt) {

        return {

            label:
                `FU${number} sent ${formatDate(
                    completedAt
                )}`,

            enabled:
                false,

            complete:
                true

        };

    }


    if (
        !sentAt ||
        Number.isNaN(
            sentAt.getTime()
        )
    ) {

        return {

            label:
                `FU${number}: send quotation first`,

            enabled:
                false

        };

    }


    let dueAt;


    if (
        number === 1
    ) {

        dueAt =
            new Date(
                sentAt.getTime()
                +
                (
                    12 *
                    60 *
                    60 *
                    1000
                )
            );

    } else {

        const fu1 =
            quotation.follow_up_1_sent_at
                ? new Date(
                    quotation.follow_up_1_sent_at
                )
                : null;


        if (
            !fu1 ||
            Number.isNaN(
                fu1.getTime()
            )
        ) {

            return {

                label:
                    "FU2: send FU1 first",

                enabled:
                    false

            };

        }


        dueAt =
            new Date(
                fu1.getTime()
                +
                (
                    48 *
                    60 *
                    60 *
                    1000
                )
            );

    }


    const enabled =
        new Date() >=
        dueAt;


    return {

        label:
            enabled

                ? `FU${number} ready`

                : `FU${number} due ${formatDate(
                    dueAt
                )}`,

        enabled

    };

}


/* =========================================================
   RENDER TABLE
========================================================= */

function renderQuotations() {

    if (!tableBody) return;


    const search =
        $("#searchInput")
            ?.value
            .trim()
            .toLowerCase() ||
        "";


    const status =
        $("#statusFilter")
            ?.value ||
        "";


    const filtered =
        quotations.filter(
            quotation => {

                const text = [

                    quotation.quotation_number,

                    quotation.request_code,

                    quotation.customer_name,

                    quotation.customer_email,

                    quotation.service_name

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                return (

                    (!search ||
                        text.includes(
                            search
                        ))

                    &&

                    (!status ||
                        quotation.status ===
                        status)

                );

            }
        );


    if (!filtered.length) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="table-empty"
                >
                    No quotations found.
                </td>
            </tr>
        `;

        return;

    }


    tableBody.innerHTML =
        filtered
            .map(
                quotation => {

                    const fu1 =
                        followUpInfo(
                            quotation,
                            1
                        );

                    const fu2 =
                        followUpInfo(
                            quotation,
                            2
                        );


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
                                        quotation.request_code ||
                                        "—"
                                    )}

                                </span>

                            </td>


                            <td>

                                <span class="customer-name">

                                    ${escapeHtml(
                                        quotation.customer_name ||
                                        "—"
                                    )}

                                </span>

                                <span class="customer-email">

                                    ${escapeHtml(
                                        quotation.customer_email ||
                                        "—"
                                    )}

                                </span>

                            </td>


                            <td>

                                <span class="service-name">

                                    ${escapeHtml(
                                        quotation.service_name ||
                                        "—"
                                    )}

                                </span>

                            </td>


                            <td>

                                <span
                                    class="quotation-status status-${escapeHtml(
                                        quotation.status ||
                                        "draft"
                                    )}"
                                >

                                    ${escapeHtml(
                                        formatStatus(
                                            quotation.status
                                        )
                                    )}

                                </span>

                            </td>


                            <td>

                                <span class="date-text">

                                    ${formatDate(
                                        quotation.sent_at
                                    )}

                                </span>

                            </td>


                            <td>

                                <div class="follow-up-stack">

                                    <button
                                        class="follow-up-button ${
                                            fu1.complete
                                                ? "complete"
                                                : ""
                                        }"
                                        data-follow-up="1"
                                        data-id="${quotation.id}"
                                        ${
                                            fu1.enabled
                                                ? ""
                                                : "disabled"
                                        }
                                    >

                                        ${escapeHtml(
                                            fu1.label
                                        )}

                                    </button>


                                    <button
                                        class="follow-up-button ${
                                            fu2.complete
                                                ? "complete"
                                                : ""
                                        }"
                                        data-follow-up="2"
                                        data-id="${quotation.id}"
                                        ${
                                            fu2.enabled
                                                ? ""
                                                : "disabled"
                                        }
                                    >

                                        ${escapeHtml(
                                            fu2.label
                                        )}

                                    </button>

                                </div>

                            </td>


                            <td>

                                ${
                                    quotation.payment_proof_url

                                        ? `

                                            <button
                                                class="action-button"
                                                data-open-proof="${quotation.id}"
                                            >
                                                View proof
                                            </button>

                                            <span class="quotation-request">

                                                ${formatDate(
                                                    quotation.payment_proof_uploaded_at
                                                )}

                                            </span>

                                        `

                                        : `

                                            <span class="date-text">
                                                Not uploaded
                                            </span>

                                        `
                                }

                            </td>


                            <td>

                                <div class="action-group">

                                    <button
                                        class="action-button"
                                        data-open-quotation="${quotation.id}"
                                    >
                                        View PDF
                                    </button>


                                    <button
                                        class="action-button"
                                        data-edit="${quotation.id}"
                                    >
                                        Edit
                                    </button>


                                    <button
                                        class="action-button danger"
                                        data-delete="${quotation.id}"
                                    >
                                        Delete
                                    </button>


                                    <button
                                        class="action-button send"
                                        data-email="${quotation.id}"
                                    >
                                        Email
                                    </button>


                                    <button
                                        class="action-button send"
                                        data-whatsapp="${quotation.id}"
                                    >
                                        WhatsApp
                                    </button>


                                    <button
                                        class="action-button"
                                        data-upload-proof="${quotation.id}"
                                    >
                                        ${
                                            quotation.payment_proof_url
                                                ? "Replace proof"
                                                : "Add proof"
                                        }
                                    </button>

                                </div>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   LOAD QUOTATIONS
========================================================= */

async function loadQuotations() {

    try {

        hideError();

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="table-loading"
                >
                    Loading quotations...
                </td>
            </tr>
        `;


        const result =
            await apiRequest(
                "/quotations"
            );


        if (!result) return;


        quotations =
            result.data || [];


        renderQuotations();

    } catch (error) {

        console.error(
            "Load quotations error:",
            error
        );

        showError(
            error.message
        );

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="table-empty"
                >
                    Unable to load quotations.
                </td>
            </tr>
        `;

    }

}


/* =========================================================
   LOAD REQUESTS
========================================================= */

async function loadRequests() {

    try {

        const result =
            await apiRequest(
                "/admin/requests"
            );


        if (!result) return;


        const existingRequestIds =
            new Set(
                quotations.map(
                    quotation =>
                        quotation.request_id
                )
            );


        requestSelect.innerHTML = `
            <option value="">
                Select a service request
            </option>
        `;


        (
            result.data || []
        ).forEach(
            request => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    request.id;


                const customer =
                    request.customer?.name ||
                    request.customer_name ||
                    "Unknown customer";


                const alreadyHasQuotation =
                    existingRequestIds.has(
                        request.id
                    );


                option.textContent =
                    alreadyHasQuotation

                        ? `${request.request_code} — ${customer} — Already has quotation`

                        : `${request.request_code} — ${customer}`;


                option.disabled =
                    alreadyHasQuotation;


                requestSelect.appendChild(
                    option
                );

            }
        );

    } catch (error) {

        console.error(
            "Load requests error:",
            error
        );

        requestSelect.innerHTML = `
            <option value="">
                Unable to load requests
            </option>
        `;

    }

}


/* =========================================================
   CREATE MODAL
========================================================= */

function openCreateModal() {

    editingQuotation =
        null;


    form.reset();


    hideError(
        $("#formError")
    );


    $("#modalTitle").textContent =
        "Create quotation";


    $("#modalEyebrow").textContent =
        "NEW QUOTATION";


    $("#saveButton").textContent =
        "Create quotation";


    requestSelect.disabled =
        false;


    modal.hidden =
        false;

}


/* =========================================================
   EDIT MODAL
========================================================= */

async function openEditModal(
    id
) {

    try {

        const quotation =
            quotations.find(
                item =>
                    item.id === id
            );


        if (!quotation) {

            showError(
                "Quotation not found."
            );

            return;

        }


        editingQuotation =
            quotation;


        form.reset();


        hideError(
            $("#formError")
        );


        $("#modalTitle").textContent =
            "Edit quotation";


        $("#modalEyebrow").textContent =
            "UPDATE QUOTATION";


        $("#saveButton").textContent =
            "Update quotation";


        requestSelect.value =
            quotation.request_id;


        requestSelect.disabled =
            true;


        notesInput.value =
            quotation.notes ||
            "";


        modal.hidden =
            false;

    } catch (error) {

        showError(
            error.message
        );

    }

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeModal() {

    modal.hidden =
        true;

    editingQuotation =
        null;

    requestSelect.disabled =
        false;

}


/* =========================================================
   SAVE QUOTATION
========================================================= */

async function submitQuotation(
    event
) {

    event.preventDefault();


    const requestId =
        requestSelect.value;


    const file =
        quotationFile.files[0];


    const notes =
        notesInput.value.trim();


    if (!requestId) {

        showError(
            "Select a service request.",
            $("#formError")
        );

        return;

    }


    if (
        !editingQuotation &&
        !file
    ) {

        showError(
            "Choose the quotation PDF.",
            $("#formError")
        );

        return;

    }


    if (
        file &&
        (
            file.type !==
                "application/pdf" &&
            !file.name
                .toLowerCase()
                .endsWith(".pdf")
        )
    ) {

        showError(
            "Quotation must be a PDF file.",
            $("#formError")
        );

        return;

    }


    if (
        file &&
        file.size >
            10 *
            1024 *
            1024
    ) {

        showError(
            "Quotation PDF must not exceed 10 MB.",
            $("#formError")
        );

        return;

    }


    const body =
        new FormData();


    if (file) {

        body.append(
            "quotation_file",
            file
        );

    }


    body.append(
        "notes",
        notes
    );


    try {

        const saveButton =
            $("#saveButton");


        saveButton.disabled =
            true;


        saveButton.textContent =
            editingQuotation
                ? "Updating..."
                : "Creating...";


        let result;


        if (editingQuotation) {

            result =
                await apiRequest(
                    `/quotations/${encodeURIComponent(
                        editingQuotation.id
                    )}`,
                    {
                        method:
                            "PUT",

                        body

                    }
                );

        } else {

            body.append(
                "request_id",
                requestId
            );


            result =
                await apiRequest(
                    "/quotations",
                    {
                        method:
                            "POST",

                        body

                    }
                );

        }


        if (result) {

            closeModal();

            await loadQuotations();

            await loadRequests();


            alert(
                result.message
            );

        }

    } catch (error) {

        console.error(
            "Save quotation error:",
            error
        );

        showError(
            error.message,
            $("#formError")
        );

    } finally {

        const saveButton =
            $("#saveButton");


        saveButton.disabled =
            false;


        saveButton.textContent =
            editingQuotation
                ? "Update quotation"
                : "Create quotation";

    }

}


/* =========================================================
   DELETE
========================================================= */

async function deleteQuotation(
    id
) {

    const quotation =
        quotations.find(
            item =>
                item.id === id
        );


    if (!quotation) return;


    const confirmed =
        confirm(
            `Delete ${quotation.quotation_number}?\n\n` +
            `This will remove the quotation from SecurePro.`
        );


    if (!confirmed) return;


    try {

        const result =
            await apiRequest(
                `/quotations/${encodeURIComponent(
                    id
                )}`,
                {
                    method:
                        "DELETE"
                }
            );


        if (result) {

            await loadQuotations();

            await loadRequests();

            alert(
                result.message
            );

        }

    } catch (error) {

        showError(
            error.message
        );

    }

}


/* =========================================================
   SEND
========================================================= */

async function markSent(
    id
) {

    if (
        !confirm(
            "Mark this quotation as sent?"
        )
    ) {

        return;

    }


    try {

        const result =
            await apiRequest(
                `/quotations/${encodeURIComponent(
                    id
                )}/send`,
                {
                    method:
                        "POST"
                }
            );


        if (result) {

            await loadQuotations();

            alert(
                result.message
            );

        }

    } catch (error) {

        showError(
            error.message
        );

    }

}


/* =========================================================
   EMAIL
========================================================= */

async function sendEmail(
    id
) {

    const quotation =
        quotations.find(
            item =>
                item.id === id
        );


    if (
        !quotation?.customer_email
    ) {

        showError(
            "This customer does not have an email address."
        );

        return;

    }


    if (
        !confirm(
            `Email ${quotation.quotation_number} to ${quotation.customer_email}?`
        )
    ) {

        return;

    }


    try {

        const result =
            await apiRequest(
                `/quotations/${encodeURIComponent(
                    id
                )}/email`,
                {
                    method:
                        "POST"
                }
            );


        if (result) {

            await loadQuotations();

            alert(
                result.message
            );

        }

    } catch (error) {

        showError(
            error.message
        );

    }

}


/* =========================================================
   WHATSAPP
========================================================= */

async function sendWhatsApp(
    id
) {

    const quotation =
        quotations.find(
            item =>
                item.id === id
        );


    if (
        !quotation?.customer_phone
    ) {

        showError(
            "This customer does not have a WhatsApp phone number."
        );

        return;

    }


    let phone =
        String(
            quotation.customer_phone
        )
            .replace(
                /\D/g,
                ""
            );


    if (
        phone.startsWith("0")
    ) {

        phone =
            `60${phone.slice(1)}`;

    }


    if (
        !phone.startsWith("60")
    ) {

        phone =
            `60${phone}`;

    }


    const message =
        `Hello ${quotation.customer_name || "Customer"},\n\n` +
        `Your SecurePro quotation ${quotation.quotation_number} is ready.\n\n` +
        `View quotation: ${quotation.quotation_file_url}\n\n` +
        `Thank you for choosing SecurePro System Solutions.`;


    window.open(
        `https://wa.me/${phone}?text=${encodeURIComponent(
            message
        )}`,
        "_blank",
        "noopener,noreferrer"
    );

}


/* =========================================================
   FOLLOW-UP
========================================================= */

async function sendFollowUp(
    id,
    number
) {

    const quotation =
        quotations.find(
            item =>
                item.id === id
        );


    if (
        !quotation?.customer_phone
    ) {

        showError(
            "This customer does not have a WhatsApp phone number."
        );

        return;

    }


    try {

        const result =
            await apiRequest(
                `/quotations/${encodeURIComponent(
                    id
                )}/follow-up/${number}`,
                {
                    method:
                        "POST"
                }
            );


        if (!result) return;


        let phone =
            String(
                quotation.customer_phone
            )
                .replace(
                    /\D/g,
                    ""
                );


        if (
            phone.startsWith("0")
        ) {

            phone =
                `60${phone.slice(1)}`;

        }


        if (
            !phone.startsWith("60")
        ) {

            phone =
                `60${phone}`;

        }


        const customer =
            quotation.customer_name ||
            "Pelanggan";


        const message =
            number === 1

                ? `Hi ${customer}, kami ingin membuat susulan mengenai harga yang kami hantar sebelum ini. Adakah anda sudah berkesempatan untuk menyemaknya? Sila maklumkan jika anda mempunyai sebarang pertanyaan atau memerlukan penjelasan. Terima kasih!`

                : `Hi ${customer}, kami ingin membuat susulan sekali lagi mengenai harga anda untuk ${quotation.service_name || "perkhidmatan kami"}. Jika anda berminat untuk meneruskan, sila maklumkan kepada kami dan kami boleh mengatur langkah seterusnya. Terima kasih kerana memilih SecurePro System Solutions.`;


        window.open(
            `https://wa.me/${phone}?text=${encodeURIComponent(
                message
            )}`,
            "_blank",
            "noopener,noreferrer"
        );


        await loadQuotations();

    } catch (error) {

        showError(
            error.message
        );

    }

}


/* =========================================================
   FILE
========================================================= */

function openFile(
    url
) {

    if (url) {

        window.open(
            url,
            "_blank",
            "noopener,noreferrer"
        );

    }

}


/* =========================================================
   PAYMENT PROOF
========================================================= */

function choosePaymentProof(
    id
) {

    proofQuotationId =
        id;

    proofInput.value =
        "";

    proofInput.click();

}


async function uploadPaymentProof() {

    const file =
        proofInput.files[0];


    if (
        !file ||
        !proofQuotationId
    ) {

        return;

    }


    const allowed = [

        "application/pdf",

        "image/jpeg",

        "image/png",

        "image/webp"

    ];


    if (
        !allowed.includes(
            file.type
        )
    ) {

        showError(
            "Payment proof must be a PDF, JPG, PNG, or WEBP file."
        );

        return;

    }


    const body =
        new FormData();


    body.append(
        "payment_proof",
        file
    );


    try {

        const result =
            await apiRequest(
                `/quotations/${encodeURIComponent(
                    proofQuotationId
                )}/payment-proof`,
                {
                    method:
                        "POST",

                    body

                }
            );


        if (result) {

            await loadQuotations();

            alert(
                result.message
            );

        }

    } catch (error) {

        showError(
            error.message
        );

    } finally {

        proofQuotationId =
            null;

        proofInput.value =
            "";

    }

}


/* =========================================================
   TABLE CLICK
========================================================= */

tableBody.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "button"
            );


        if (!button) return;


        const id =
            button.dataset.id ||
            button.dataset.openQuotation ||
            button.dataset.openProof ||
            button.dataset.email ||
            button.dataset.whatsapp ||
            button.dataset.uploadProof ||
            button.dataset.edit ||
            button.dataset.delete;


        const quotation =
            quotations.find(
                item =>
                    item.id === id
            );


        if (
            button.dataset.openQuotation
        ) {

            openFile(
                quotation?.quotation_file_url
            );

        }


        if (
            button.dataset.openProof
        ) {

            openFile(
                quotation?.payment_proof_url
            );

        }


        if (
            button.dataset.edit
        ) {

            openEditModal(
                id
            );

        }


        if (
            button.dataset.delete
        ) {

            deleteQuotation(
                id
            );

        }


        if (
            button.dataset.email
        ) {

            sendEmail(
                id
            );

        }


        if (
            button.dataset.whatsapp
        ) {

            sendWhatsApp(
                id
            );

        }


        if (
            button.dataset.followUp
        ) {

            sendFollowUp(
                id,
                Number(
                    button.dataset.followUp
                )
            );

        }


        if (
            button.dataset.uploadProof
        ) {

            choosePaymentProof(
                id
            );

        }

    }
);


/* =========================================================
   EVENTS
========================================================= */

$("#createQuotationButton")
    ?.addEventListener(
        "click",
        openCreateModal
    );


$("#closeModalButton")
    ?.addEventListener(
        "click",
        closeModal
    );


$("#cancelButton")
    ?.addEventListener(
        "click",
        closeModal
    );


modal?.addEventListener(
    "click",
    event => {

        if (
            event.target === modal
        ) {

            closeModal();

        }

    }
);


form?.addEventListener(
    "submit",
    submitQuotation
);


proofInput?.addEventListener(
    "change",
    uploadPaymentProof
);


$("#searchInput")
    ?.addEventListener(
        "input",
        renderQuotations
    );


$("#statusFilter")
    ?.addEventListener(
        "change",
        renderQuotations
    );


$("#refreshButton")
    ?.addEventListener(
        "click",
        loadQuotations
    );


$("#logoutButton")
    ?.addEventListener(
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


/* =========================================================
   ADMIN NAME
========================================================= */

try {

    const adminUser =
        JSON.parse(
            localStorage.getItem(
                "securepro_admin_user"
            ) ||
            "null"
        );


    if (adminUser) {

        $("#sidebarAdminName")
            .textContent =
            adminUser.name ||
            "Admin";


        $("#topbarAdminName")
            .textContent =
            adminUser.name ||
            "Admin";

    }

} catch {
    // Ignore invalid local storage.
}


/* =========================================================
   INITIAL LOAD
========================================================= */

async function initialize() {

    await loadQuotations();

    await loadRequests();

}


initialize();