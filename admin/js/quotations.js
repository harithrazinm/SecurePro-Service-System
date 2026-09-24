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
    window.location.href = "login.html";
}


/* =========================================================
   ELEMENTS
========================================================= */

const $ =
    selector =>
        document.querySelector(selector);

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

const quotationJobList =
    $("#quotationJobList");

const quotationJobCount =
    $("#quotationJobCount");

let quotations = [];

let serviceRequests = [];

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


    /*
     * ONLY 401 means the admin authentication
     * has expired / is invalid.
     *
     * 403 is NOT treated as logout because
     * the backend also uses 403 for valid
     * business restrictions such as:
     *
     * "Payment proof requires approval."
     */
    if (
        response.status === 401
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
   APPROVAL STATUS
========================================================= */

function formatApprovalStatus(
    value
) {
    return {
        pending_approval:
            "Pending Approval",

        revision_required:
            "Revision Required",

        approved:
            "Approved"
    }[value] ||
        "Pending Approval";
}


function quotationCanBeSent(
    quotation
) {
    return (
        quotation?.approval_status ===
        "approved"
    );
}


function approvalBadge(
    quotation
) {
    const state =
        quotation?.approval_status ||
        "pending_approval";

    return `
        <span class="quotation-approval-status approval-${escapeHtml(state)}">
            ${escapeHtml(
                formatApprovalStatus(state)
            )}
        </span>
    `;
}


function approvalNotice(
    quotation
) {
    const state =
        quotation?.approval_status ||
        "pending_approval";


    if (
        state ===
        "revision_required"
    ) {
        return `
            <div class="approval-notice revision">

                <strong>
                    Super Admin requested a revision
                </strong>

                <p>
                    ${escapeHtml(
                        quotation.approval_remarks ||
                        "Please review and improve the quotation."
                    )}
                </p>

                <small>
                    Upload a revised PDF to submit it again for approval.
                </small>

            </div>
        `;
    }


    if (
        state ===
        "pending_approval"
    ) {
        return `
            <div class="approval-notice pending">

                <strong>
                    Waiting for Super Admin approval
                </strong>

                <p>
                    This quotation cannot be sent to the customer yet.
                </p>

            </div>
        `;
    }


    if (
        state ===
        "approved"
    ) {
        return `
            <div class="approval-notice approved">

                <strong>
                    ✓ Approved by Super Admin
                </strong>

                <p>
                    This quotation is ready to be sent to the customer.
                </p>

            </div>
        `;
    }


    return "";
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
                    colspan="9"
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


                    const isApproved =
                        quotationCanBeSent(
                            quotation
                        );


                    const isRevisionRequired =
                        quotation.approval_status ===
                        "revision_required";


                    return `

                        <tr>

                            <!-- =========================
                                 QUOTATION
                            ========================== -->

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


                            <!-- =========================
                                 CUSTOMER
                            ========================== -->

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


                            <!-- =========================
                                 SERVICE
                            ========================== -->

                            <td>

                                <span class="service-name">

                                    ${escapeHtml(
                                        quotation.service_name ||
                                        "—"
                                    )}

                                </span>

                            </td>


                            <!-- =========================
                                 STATUS
                            ========================== -->

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


                            <!-- =========================
                                 APPROVAL
                            ========================== -->

                            <td>

                                <div class="approval-cell">

                                    ${approvalBadge(
                                        quotation
                                    )}

                                    ${
                                        isRevisionRequired &&
                                        quotation.approval_remarks

                                            ? `
                                                <div class="approval-remark">

                                                    <strong>
                                                        Super Admin Remark:
                                                    </strong>

                                                    <span>
                                                        ${escapeHtml(
                                                            quotation.approval_remarks
                                                        )}
                                                    </span>

                                                </div>
                                              `

                                            : ""
                                    }

                                </div>

                            </td>


                            <!-- =========================
                                 SENT
                            ========================== -->

                            <td>

                                <span class="date-text">

                                    ${formatDate(
                                        quotation.sent_at
                                    )}

                                </span>

                            </td>


                            <!-- =========================
                                 FOLLOW UP
                            ========================== -->

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


                            <!-- =========================
                                 PAYMENT PROOF
                            ========================== -->

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


                            <!-- =========================
                                 ACTIONS
                            ========================== -->

                            <td>

                                <div class="action-group">

                                    <!-- VIEW -->

                                    <button
                                        class="action-button icon-action view"
                                        data-open-quotation="${quotation.id}"
                                        title="View quotation PDF"
                                        aria-label="View quotation PDF"
                                    >

                                        <svg
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                        >

                                            <path
                                                d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                                            />

                                            <circle
                                                cx="12"
                                                cy="12"
                                                r="2.5"
                                            />

                                        </svg>

                                    </button>


                                    <!-- EDIT -->

                                    <button
                                        class="action-button icon-action edit"
                                        data-edit="${quotation.id}"
                                        title="${
                                            isRevisionRequired
                                                ? "Submit revised quotation"
                                                : "Edit quotation"
                                        }"
                                        aria-label="Edit quotation"
                                    >

                                        <svg
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                        >

                                            <path
                                                d="m4 16.5-.8 4.3 4.3-.8L18.8 8.7a2.1 2.1 0 0 0-3-3L4 16.5Z"
                                            />

                                            <path
                                                d="m14.5 7.5 2 2"
                                            />

                                        </svg>

                                    </button>


                                    <!-- DELETE -->

                                    <button
                                        class="action-button icon-action danger"
                                        data-delete="${quotation.id}"
                                        title="Delete quotation"
                                        aria-label="Delete quotation"
                                    >

                                        <svg
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                        >

                                            <path
                                                d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"
                                            />

                                        </svg>

                                    </button>


                                    <!-- EMAIL -->

                                    <button
                                        class="action-button action-text send ${
                                            isApproved
                                                ? ""
                                                : "approval-locked"
                                        }"
                                        data-email="${quotation.id}"
                                        title="${
                                            isApproved
                                                ? "Send quotation by email"
                                                : "Quotation must be approved first"
                                        }"
                                        ${
                                            isApproved
                                                ? ""
                                                : "disabled"
                                        }
                                    >

                                        <svg
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                        >

                                            <rect
                                                x="3"
                                                y="5"
                                                width="18"
                                                height="14"
                                                rx="2"
                                            />

                                            <path
                                                d="m4 7 8 6 8-6"
                                            />

                                        </svg>

                                        Email

                                    </button>


                                    <!-- WHATSAPP -->

                                    <button
                                        class="action-button action-text whatsapp ${
                                            isApproved
                                                ? ""
                                                : "approval-locked"
                                        }"
                                        data-whatsapp="${quotation.id}"
                                        title="${
                                            isApproved
                                                ? "Send quotation via WhatsApp"
                                                : "Quotation must be approved first"
                                        }"
                                        ${
                                            isApproved
                                                ? ""
                                                : "disabled"
                                        }
                                    >

                                        <svg
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                        >

                                            <path
                                                d="M20 11.5a8 8 0 0 1-11.9 7L4 20l1.5-4A8 8 0 1 1 20 11.5Z"
                                            />

                                            <path
                                                d="M9 9.2c.2-.5.5-.5.8-.5h.5c.2 0 .4.1.5.4l.6 1.4c.1.2.1.4-.1.6l-.5.6c.7 1.1 1.4 1.7 2.5 2.2l.6-.6c.2-.2.4-.2.6-.1l1.3.6c.2.1.3.3.3.5 0 .8-.4 1.3-1 1.5-1.1.3-2.8-.6-4.1-1.7-1.3-1.1-2.4-2.7-2.6-3.8-.1-.5 0-.9.2-1.1Z"
                                            />

                                        </svg>

                                        WhatsApp

                                    </button>


                                    <!-- PAYMENT PROOF -->

                                    <button
                                        class="action-button action-text proof ${
                                            isApproved
                                                ? ""
                                                : "approval-locked"
                                        }"
                                        data-upload-proof="${quotation.id}"
                                        title="${
                                            isApproved

                                                ? (
                                                    quotation.payment_proof_url
                                                        ? "Replace payment proof"
                                                        : "Add payment proof"
                                                )

                                                : "Quotation must be approved by Super Admin before payment proof can be uploaded"
                                        }"
                                        ${
                                            isApproved
                                                ? ""
                                                : "disabled"
                                        }
                                    >

                                        <svg
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                        >

                                            <path
                                                d="M12 16V4M8 8l4-4 4 4M5 14v5h14v-5"
                                            />

                                        </svg>

                                        ${
                                            isApproved

                                                ? (
                                                    quotation.payment_proof_url
                                                        ? "Replace"
                                                        : "Proof"
                                                )

                                                : "Locked"
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


        if (tableBody) {

            tableBody.innerHTML = `
                <tr>

                    <td
                        colspan="9"
                        class="table-loading"
                    >
                        Loading quotations...
                    </td>

                </tr>
            `;

        }


        const result =
            await apiRequest(
                "/quotations"
            );


        if (!result) return;


       quotations =
    Array.isArray(result.data)
        ? result.data
        : [];


renderQuotations();
renderQuotationJobQueue();

    } catch (error) {

        console.error(
            "Load quotations error:",
            error
        );


        showError(
            error.message
        );


        if (tableBody) {

            tableBody.innerHTML = `
                <tr>

                    <td
                        colspan="9"
                        class="table-empty"
                    >
                        Unable to load quotations.
                    </td>

                </tr>
            `;

        }

    }

}

/* =========================================================
  QUOTATION JOB QUEUE
========================================================= */

function getRequestCustomerName(request) {
    return (
        request?.customer?.name ||
        request?.customer_name ||
        request?.customer?.full_name ||
        "Unknown customer"
    );
}

function getRequestServiceName(request) {
    return (
        request?.service_name ||
        request?.service?.name ||
        request?.service?.title ||
        request?.service_type ||
        request?.serviceType ||
        "Service request"
    );
}

function getRequestSubmittedDate(request) {
    return (
        request?.created_at ||
        request?.submitted_at ||
        request?.request_date ||
        request?.createdAt ||
        null
    );
}

function renderQuotationJobQueue() {
    if (!quotationJobList) return;

    const existingRequestIds = new Set(
        quotations
            .map(quotation => quotation?.request_id)
            .filter(Boolean)
    );

    const jobs = serviceRequests.filter(request => {
        return request?.id &&
            !existingRequestIds.has(request.id);
    });

    if (quotationJobCount) {
        quotationJobCount.textContent =
            String(jobs.length);
    }

    if (!jobs.length) {
        quotationJobList.innerHTML = `
            <div class="quotation-job-empty">
                <div class="quotation-job-empty-icon">✓</div>

                <strong>
                    All quotation jobs are up to date
                </strong>

                <p>
                    There are currently no service
                    requests waiting for a quotation.
                </p>
            </div>
        `;

        return;
    }

    quotationJobList.innerHTML = jobs.map(request => {

        const requestId =
            escapeHtml(request.id);

        const requestCode =
            escapeHtml(
                request.request_code ||
                request.code ||
                "Service Request"
            );

        const customer =
            escapeHtml(
                getRequestCustomerName(request)
            );

        const service =
            escapeHtml(
                getRequestServiceName(request)
            );

        const submitted =
            formatDate(
                getRequestSubmittedDate(request)
            );

        return `
            <article class="quotation-job-item">

                <div class="quotation-job-main">

                    <span class="quotation-job-code">
                        ${requestCode}
                    </span>

                    <strong class="quotation-job-customer">
                        ${customer}
                    </strong>

                    <div class="quotation-job-meta">

                        <span>
                            ${service}
                        </span>

                        <span>
                            Submitted: ${escapeHtml(submitted)}
                        </span>

                    </div>

                </div>

                <button
                    type="button"
                    class="quotation-job-upload"
                    data-upload-quotation="${requestId}"
                >
                    Upload Quotation
                </button>

            </article>
        `;

    }).join("");
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


        serviceRequests =
    Array.isArray(result.data)
        ? result.data
        : [];
        

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
renderQuotationJobQueue();

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


    const approvalNoticeElement =
        $("#quotationApprovalNotice");


    if (approvalNoticeElement) {

        approvalNoticeElement.innerHTML =
            "";

    }


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
            quotation.approval_status ===
                "revision_required"
                ? "Submit revised quotation"
                : "Edit quotation";


        $("#modalEyebrow").textContent =
            quotation.approval_status ===
                "revision_required"
                ? "REVISION REQUIRED"
                : "UPDATE QUOTATION";


        $("#saveButton").textContent =
            quotation.approval_status ===
                "revision_required"
                ? "Submit Revised Quotation"
                : "Update quotation";


        requestSelect.value =
            quotation.request_id;


        requestSelect.disabled =
            true;


        notesInput.value =
            quotation.notes ||
            "";


        const approvalNoticeElement =
            $("#quotationApprovalNotice");


        if (approvalNoticeElement) {

            approvalNoticeElement.innerHTML =
                approvalNotice(
                    quotation
                );

        }


        modal.hidden =
            false;

    } catch (error) {

        console.error(
            "Open edit modal error:",
            error
        );


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
        editingQuotation &&
        editingQuotation.approval_status ===
            "revision_required" &&
        !file
    ) {

        showError(
            "Please upload the revised quotation PDF before submitting it for approval.",
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


        if (saveButton) {

            saveButton.disabled =
                false;


            saveButton.textContent =
                editingQuotation

                    ? (
                        editingQuotation.approval_status ===
                            "revision_required"

                            ? "Submit Revised Quotation"

                            : "Update quotation"
                    )

                    : "Create quotation";

        }

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
   MARK SENT
========================================================= */

async function markSent(
    id
) {

    const quotation =
        quotations.find(
            item =>
                item.id === id
        );


    if (
        !quotationCanBeSent(
            quotation
        )
    ) {

        showError(
            "This quotation must be approved by Super Admin before it can be marked as sent."
        );

        return;

    }


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
        !quotationCanBeSent(
            quotation
        )
    ) {

        showError(
            "This quotation must be approved by Super Admin before it can be sent."
        );

        return;

    }


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
        !quotationCanBeSent(
            quotation
        )
    ) {

        showError(
            "This quotation must be approved by Super Admin before it can be sent."
        );

        return;

    }


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

        }

    } catch (error) {

        console.error(
            "WhatsApp quotation status update error:",
            error
        );


        showError(
            `WhatsApp opened, but the quotation status could not be updated: ${error.message}`
        );

    }

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

/*
 * Payment proof is ONLY available after
 * Super Admin approval.
 *
 * This check exists in the frontend for UX.
 * The backend controller also performs the
 * same check for security.
 */

function choosePaymentProof(
    id
) {

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


    /*
     * HARD FRONTEND LOCK
     */
    if (
        quotation.approval_status !==
        "approved"
    ) {

        showError(
            "Payment proof can only be uploaded after Super Admin approves the quotation."
        );

        return;

    }


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


    const quotation =
        quotations.find(
            item =>
                item.id ===
                proofQuotationId
        );


    /*
     * SECOND FRONTEND CHECK
     *
     * Protects against stale UI data.
     */
    if (
        !quotation ||
        quotation.approval_status !==
        "approved"
    ) {

        showError(
            "Payment proof can only be uploaded after Super Admin approves the quotation."
        );

        proofQuotationId =
            null;

        proofInput.value =
            "";

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

tableBody?.addEventListener(
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

quotationJobList?.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-upload-quotation]"
            );

        if (!button) return;

        const requestId =
            button.dataset.uploadQuotation;

        if (!requestId) return;

        openCreateModal();

        if (requestSelect) {
            requestSelect.value =
                requestId;
        }

        quotationFile?.focus();
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