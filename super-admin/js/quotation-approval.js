/* =========================================================
   SECUREPRO SUPER ADMIN — QUOTATION APPROVAL
   New Revision Notification
   Date: 13 September 2026
========================================================= */


/* =========================================================
   API
========================================================= */

const API_BASE =
    /^(localhost|127\.0\.0\.1)$/.test(
        location.hostname
    )
        ? "http://localhost:5001/api"
        : "/api";
        
/* =========================================================
   AUTH
========================================================= */

const token =
    localStorage.getItem(
        "securepro_super_admin_token"
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
        document.querySelector(selector);


const tableBody =
    $("#quotationTableBody");

const pageError =
    $("#pageError");

const reviewModal =
    $("#reviewModal");

const reviewLoading =
    $("#reviewLoading");

const reviewContent =
    $("#reviewContent");

const revisionRemarks =
    $("#revisionRemarks");

const decisionError =
    $("#decisionError");

const newRevisionAlert =
    $("#newRevisionAlert");


/* =========================================================
   STATE
========================================================= */

let quotations = [];

let currentFilter =
    "all";

let currentReview =
    null;

let latestNewRevision =
    null;


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


function formatApprovalStatus(
    value
) {

    return {
        pending_approval:
            "Pending Approval",

        revision_required:
            "Revision Required",

        approved:
            "Approved",

        rejected:
            "Rejected"
    }[value] ||
        "Pending Approval";

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
            "securepro_super_admin_token"
        );

        localStorage.removeItem(
            "securepro_super_admin_user"
        );

        window.location.href =
            "login.html";

        return null;

    }


    const result =
        await response.json()
            .catch(
                () => ({
                    success:
                        false,

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
   ERROR
========================================================= */

function showPageError(
    message
) {

    if (!pageError) return;

    pageError.textContent =
        message ||
        "Something went wrong.";

    pageError.hidden =
        false;

}


function hidePageError() {

    if (!pageError) return;

    pageError.textContent =
        "";

    pageError.hidden =
        true;

}


function showDecisionError(
    message
) {

    if (!decisionError) return;

    decisionError.textContent =
        message ||
        "Something went wrong.";

    decisionError.hidden =
        false;

}


function hideDecisionError() {

    if (!decisionError) return;

    decisionError.textContent =
        "";

    decisionError.hidden =
        true;

}


/* =========================================================
   NORMALIZE QUOTATION
========================================================= */

function normalizeQuotation(
    item
) {

    if (!item) return null;


    return {

        ...item,

        approval_status:
            item.approval_status ||
            "pending_approval",

        revision_number:
            Number(
                item.revision_number ||
                1
            ),

        customer_name:
            item.customer_name ||
            item.customer?.name ||
            "—",

        service_name:
            item.service_name ||
            item.service?.name ||
            "—",

        quotation_number:
            item.quotation_number ||
            "—"

    };

}


/* =========================================================
   IS NEW REVISION
========================================================= */

function isNewRevision(
    quotation
) {

    if (!quotation) return false;


    return (

        quotation.approval_status ===
        "pending_approval"

        &&

        Number(
            quotation.revision_number ||
            1
        ) > 1

        &&

        Boolean(
            quotation.revised_at
        )

    );

}


/* =========================================================
   APPROVAL BADGE
========================================================= */

function approvalBadge(
    quotation
) {

    const state =
        quotation.approval_status ||
        "pending_approval";


    return `
        <div class="approval-badge-stack">

            ${
                isNewRevision(quotation)

                    ? `
                        <span class="new-revision-badge">
                            🆕 New Revision
                        </span>
                      `

                    : ""
            }

            <span
                class="approval-status approval-${escapeHtml(
                    state
                )}"
            >
                ${escapeHtml(
                    formatApprovalStatus(
                        state
                    )
                )}
            </span>

        </div>
    `;

}


/* =========================================================
   REVISION BADGE
========================================================= */

function revisionBadge(
    quotation
) {

    const revision =
        Number(
            quotation.revision_number ||
            1
        );


    if (
        isNewRevision(
            quotation
        )
    ) {

        return `
            <div class="revision-stack">

                <strong>
                    Revision ${revision}
                </strong>

                <span class="revision-new-label">
                    New correction
                </span>

            </div>
        `;

    }


    return `
        <span class="revision-normal">
            Revision ${revision}
        </span>
    `;

}


/* =========================================================
   FILTER
========================================================= */

function filteredQuotations() {

    const search =
        $("#searchInput")
            ?.value
            .trim()
            .toLowerCase() ||
        "";


    return quotations.filter(
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


            const matchesSearch =
                !search ||
                text.includes(
                    search
                );


            const matchesFilter =
                currentFilter ===
                "all"

                ||

                quotation.approval_status ===
                currentFilter;


            return (
                matchesSearch &&
                matchesFilter
            );

        }
    );

}


/* =========================================================
   RENDER TABLE
========================================================= */

function renderQuotations() {

    if (!tableBody) return;


    const filtered =
        filteredQuotations();


    if (!filtered.length) {

        tableBody.innerHTML = `
            <tr>

                <td
                    colspan="7"
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

                    const newRevision =
                        isNewRevision(
                            quotation
                        );


                    return `

                        <tr
                            class="${
                                newRevision
                                    ? "new-revision-row"
                                    : ""
                            }"
                        >

                            <!-- QUOTATION -->

                            <td>

                                <span
                                    class="quotation-number"
                                >
                                    ${escapeHtml(
                                        quotation.quotation_number
                                    )}
                                </span>

                                <span
                                    class="quotation-request"
                                >
                                    ${escapeHtml(
                                        quotation.request_code ||
                                        "—"
                                    )}
                                </span>

                            </td>


                            <!-- CUSTOMER -->

                            <td>

                                <span
                                    class="customer-name"
                                >
                                    ${escapeHtml(
                                        quotation.customer_name
                                    )}
                                </span>

                                <span
                                    class="customer-email"
                                >
                                    ${escapeHtml(
                                        quotation.customer_email ||
                                        "—"
                                    )}
                                </span>

                            </td>


                            <!-- SERVICE -->

                            <td>

                                <span
                                    class="service-name"
                                >
                                    ${escapeHtml(
                                        quotation.service_name
                                    )}
                                </span>

                            </td>


                            <!-- REVISION -->

                            <td>

                                ${revisionBadge(
                                    quotation
                                )}

                                ${
                                    quotation.revised_at

                                        ? `
                                            <span class="quotation-request">
                                                ${escapeHtml(
                                                    formatDate(
                                                        quotation.revised_at
                                                    )
                                                )}
                                            </span>
                                          `

                                        : ""
                                }

                            </td>


                            <!-- APPROVAL -->

                            <td>

                                ${approvalBadge(
                                    quotation
                                )}

                            </td>


                            <!-- UPDATED -->

                            <td>

                                <span class="date-text">

                                    ${formatDate(
                                        quotation.revised_at ||
                                        quotation.updated_at ||
                                        quotation.created_at
                                    )}

                                </span>

                            </td>


                            <!-- ACTIONS -->

                            <td>

                                <div class="approval-action-group">

                                    <button
                                        class="review-button ${
                                            newRevision
                                                ? "review-button-new"
                                                : ""
                                        }"
                                        type="button"
                                        data-review="${escapeHtml(
                                            quotation.id
                                        )}"
                                    >

                                        ${
                                            newRevision
                                                ? "🆕 Review Revision"
                                                : "Review"
                                        }

                                    </button>


                                    ${
                                        quotation.quotation_file_url

                                            ? `
                                                <button
                                                    class="open-file-button"
                                                    type="button"
                                                    data-open-pdf="${escapeHtml(
                                                        quotation.id
                                                    )}"
                                                >
                                                    PDF ↗
                                                </button>
                                              `

                                            : ""
                                    }

                                </div>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   UPDATE STATS
========================================================= */

function updateStats() {

    const pending =
        quotations.filter(
            quotation =>
                quotation.approval_status ===
                "pending_approval"
        );


    const revision =
        quotations.filter(
            quotation =>
                quotation.approval_status ===
                "revision_required"
        );


    const approved =
        quotations.filter(
            quotation =>
                quotation.approval_status ===
                "approved"
        );


    const newRevisions =
        pending.filter(
            quotation =>
                isNewRevision(
                    quotation
                )
        );


    $("#pendingCount").textContent =
        pending.length;


    $("#revisionCount").textContent =
        revision.length;


    $("#approvedCount").textContent =
        approved.length;


    const pendingSubtitle =
        $("#pendingSubtitle");


    if (pendingSubtitle) {

        pendingSubtitle.textContent =
            newRevisions.length

                ? `${newRevisions.length} new revision${newRevisions.length === 1 ? "" : "s"} submitted`

                : "Waiting for your decision";

    }


    const revisionSubtitle =
        $("#revisionSubtitle");


    if (revisionSubtitle) {

        revisionSubtitle.textContent =
            "Waiting for Admin update";

    }

}


/* =========================================================
   NEW REVISION ALERT
========================================================= */

function updateNewRevisionAlert() {

    if (!newRevisionAlert) return;


    const newRevisions =
        quotations.filter(
            quotation =>
                isNewRevision(
                    quotation
                )
        );


    latestNewRevision =
        newRevisions[0] ||
        null;


    if (!latestNewRevision) {

        newRevisionAlert.hidden =
            true;

        return;

    }


    const count =
        newRevisions.length;


    $("#newRevisionAlertTitle").textContent =
        count === 1

            ? "New quotation revision submitted"

            : `${count} new quotation revisions submitted`;


    $("#newRevisionAlertText").textContent =
        count === 1

            ? `${latestNewRevision.quotation_number} — Admin has uploaded a corrected quotation for your review.`

            : `Admin has uploaded ${count} corrected quotations that are waiting for your review.`;


    newRevisionAlert.hidden =
        false;

}


/* =========================================================
   LOAD QUOTATIONS
========================================================= */

async function loadQuotations() {

    try {

        hidePageError();


        tableBody.innerHTML = `
            <tr>

                <td
                    colspan="7"
                    class="table-loading"
                >
                    Loading quotations...
                </td>

            </tr>
        `;


        const result =
            await apiRequest(
                "/super-admin/quotations/pending"
            );


        if (!result) return;


        const data =
            Array.isArray(
                result.data
            )
                ? result.data
                : [];


        quotations =
            data
                .map(
                    normalizeQuotation
                )
                .filter(Boolean);


        updateStats();

        updateNewRevisionAlert();

        renderQuotations();

    } catch (error) {

        console.error(
            "Load quotation approval queue error:",
            error
        );


        showPageError(
            error.message
        );


        tableBody.innerHTML = `
            <tr>

                <td
                    colspan="7"
                    class="table-empty"
                >
                    Unable to load quotations.
                </td>

            </tr>
        `;

    }

}


/* =========================================================
   OPEN REVIEW
========================================================= */

async function openReview(
    id
) {

    const quotation =
        quotations.find(
            item =>
                item.id === id
        );


    if (!quotation) {

        showPageError(
            "Quotation not found."
        );

        return;

    }


    currentReview =
        quotation;


    hideDecisionError();


    revisionRemarks.value =
        "";


    reviewContent.hidden =
        true;


    reviewLoading.hidden =
        false;


    reviewModal.hidden =
        false;


    try {

        const result =
            await apiRequest(
                `/super-admin/quotations/${encodeURIComponent(
                    id
                )}`
            );


        if (!result) return;


        /*
         * Backend may return:
         *
         * data: {
         *   quotation: {...},
         *   history: [...]
         * }
         *
         * or directly:
         *
         * data: {...}
         */

        const payload =
            result.data || {};


        const reviewQuotation =
            normalizeQuotation(
                payload.quotation ||
                payload
            );


        const history =
            Array.isArray(
                payload.history
            )
                ? payload.history
                : Array.isArray(
                    payload.review_history
                )
                    ? payload.review_history
                    : [];


        currentReview = {

            ...reviewQuotation,

            history

        };


        populateReview(
            currentReview,
            history
        );


        reviewLoading.hidden =
            true;


        reviewContent.hidden =
            false;

    } catch (error) {

        reviewLoading.textContent =
            error.message;

    }

}


/* =========================================================
   FIND PREVIOUS REMARK
========================================================= */

function findPreviousRemark(
    quotation,
    history
) {

    /*
     * The current approval_remarks can be NULL after
     * Admin uploads a new revision.
     *
     * Therefore the previous remark should come from
     * quotation_reviews history when available.
     */

    const possible =
        history
            .filter(
                item => {

                    const remarks =
                        item.remarks ||
                        item.approval_remarks ||
                        item.review_remarks ||
                        item.comment ||
                        "";


                    const action =
                        String(
                            item.action ||
                            item.decision ||
                            item.status ||
                            ""
                        ).toLowerCase();


                    return (

                        String(
                            remarks
                        ).trim()

                        &&

                        (
                            action.includes(
                                "revision"
                            )

                            ||

                            action.includes(
                                "request"
                            )

                            ||

                            action.includes(
                                "reject"
                            )

                            ||

                            item.requested_revision ===
                            true
                        )

                    );

                }
            )
            .sort(
                (a, b) => {

                    const aDate =
                        new Date(
                            a.created_at ||
                            a.reviewed_at ||
                            a.updated_at ||
                            0
                        ).getTime();


                    const bDate =
                        new Date(
                            b.created_at ||
                            b.reviewed_at ||
                            b.updated_at ||
                            0
                        ).getTime();


                    return bDate -
                        aDate;

                }
            );


    if (possible.length) {

        return (

            possible[0].remarks ||

            possible[0].approval_remarks ||

            possible[0].review_remarks ||

            possible[0].comment

        );

    }


    /*
     * Fallback to current remarks if backend still
     * keeps them.
     */

    return quotation.approval_remarks ||
        "";

}


/* =========================================================
   POPULATE REVIEW
========================================================= */

function populateReview(
    quotation,
    history
) {

    $("#reviewQuotationNumber").textContent =
        quotation.quotation_number ||
        "—";


    $("#reviewCustomer").textContent =
        quotation.customer_name ||
        "—";


    $("#reviewService").textContent =
        quotation.service_name ||
        "—";


    $("#reviewUploadedBy").textContent =
        quotation.created_by_name ||
        quotation.uploaded_by_name ||
        quotation.uploaded_by ||
        "SecurePro Admin";


    const revision =
        Number(
            quotation.revision_number ||
            1
        );


    $("#reviewRevision").textContent =
        `Revision ${revision}`;


    $("#reviewStatus").textContent =
        formatApprovalStatus(
            quotation.approval_status
        );


    $("#reviewUpdatedAt").textContent =
        formatDate(
            quotation.revised_at ||
            quotation.updated_at ||
            quotation.created_at
        );


    $("#reviewFileName").textContent =
        quotation.quotation_file_name ||
        "quotation.pdf";


    $("#reviewFileDescription").textContent =
        isNewRevision(
            quotation
        )

            ? "Admin has uploaded a corrected quotation for your review."

            : "Review the uploaded quotation document.";


    /*
     * New revision banner
     */

    const banner =
        $("#reviewRevisionBanner");


    if (
        isNewRevision(
            quotation
        )
    ) {

        $("#reviewRevisionBannerText").textContent =
            `Admin has uploaded Revision ${revision} of ${quotation.quotation_number} for your review.`;


        banner.hidden =
            false;

    } else {

        banner.hidden =
            true;

    }


    /*
     * Previous remark
     */

    const previousRemark =
        findPreviousRemark(
            quotation,
            history
        );


    const previousRemarkSection =
        $("#previousRemarkSection");


    if (
        previousRemark &&
        revision > 1
    ) {

        $("#previousRemark").textContent =
            previousRemark;


        previousRemarkSection.hidden =
            false;

    } else {

        previousRemarkSection.hidden =
            true;

    }


    /*
     * History
     */

    renderHistory(
        history
    );


    /*
     * Decision section
     */

    const decisionSection =
        $("#decisionSection");


    if (
        quotation.approval_status ===
        "approved"
    ) {

        decisionSection.hidden =
            true;

    } else {

        decisionSection.hidden =
            false;

    }

}


/* =========================================================
   HISTORY
========================================================= */

function renderHistory(
    history
) {

    const container =
        $("#reviewHistory");


    if (!container) return;


    if (!history.length) {

        container.innerHTML = `
            <div class="history-empty">
                No review history yet.
            </div>
        `;

        return;

    }


    container.innerHTML =
        history
            .map(
                item => {

                    const action =
                        item.action ||
                        item.decision ||
                        item.status ||
                        "Review";


                    const remarks =
                        item.remarks ||
                        item.approval_remarks ||
                        item.review_remarks ||
                        item.comment ||
                        "";


                    const reviewer =
                        item.reviewer_name ||
                        item.reviewed_by_name ||
                        item.approved_by_name ||
                        item.reviewer ||
                        "Super Admin";


                    const date =
                        item.created_at ||
                        item.reviewed_at ||
                        item.updated_at;


                    return `

                        <article class="history-item">

                            <div class="history-item-top">

                                <strong>
                                    ${escapeHtml(
                                        formatStatus(
                                            action
                                        )
                                    )}
                                </strong>

                                <span>
                                    ${escapeHtml(
                                        formatDate(
                                            date
                                        )
                                    )}
                                </span>

                            </div>

                            <div class="history-reviewer">
                                ${escapeHtml(
                                    reviewer
                                )}
                            </div>

                            ${
                                remarks

                                    ? `
                                        <div class="history-remarks">
                                            ${escapeHtml(
                                                remarks
                                            )}
                                        </div>
                                      `

                                    : ""
                            }

                        </article>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   OPEN PDF
========================================================= */

function openPdf() {

    const url =
        currentReview?.quotation_file_url;


    if (!url) {

        showDecisionError(
            "Quotation PDF is not available."
        );

        return;

    }


    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );

}


/* =========================================================
   APPROVE
========================================================= */

async function approveQuotation() {

    if (!currentReview?.id) return;


    if (
        !confirm(
            `Approve ${currentReview.quotation_number}?`
        )
    ) {

        return;

    }


    hideDecisionError();


    const button =
        $("#approveButton");


    button.disabled =
        true;


    button.textContent =
        "Approving...";


    try {

        const result =
            await apiRequest(
                `/super-admin/quotations/${encodeURIComponent(
                    currentReview.id
                )}/approve`,
                {
                    method:
                        "POST"
                }
            );


        if (!result) return;


        closeReview();


        await loadQuotations();


        alert(
            result.message ||
            "Quotation approved successfully."
        );

    } catch (error) {

        showDecisionError(
            error.message
        );

    } finally {

        button.disabled =
            false;


        button.textContent =
            "✓ Approve Quotation";

    }

}


/* =========================================================
   REQUEST REVISION
========================================================= */

async function requestRevision() {

    if (!currentReview?.id) return;


    const remarks =
        revisionRemarks.value.trim();


    if (!remarks) {

        showDecisionError(
            "Revision remarks are required."
        );

        revisionRemarks.focus();

        return;

    }


    hideDecisionError();


    const button =
        $("#revisionButton");


    button.disabled =
        true;


    button.textContent =
        "Sending...";


    try {

        const result =
            await apiRequest(
                `/super-admin/quotations/${encodeURIComponent(
                    currentReview.id
                )}/revision`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            remarks
                        })
                }
            );


        if (!result) return;


        closeReview();


        await loadQuotations();


        alert(
            result.message ||
            "Quotation has been returned to Admin for revision."
        );

    } catch (error) {

        showDecisionError(
            error.message
        );

    } finally {

        button.disabled =
            false;


        button.textContent =
            "Request Revision";

    }

}


/* =========================================================
   CLOSE REVIEW
========================================================= */

function closeReview() {

    reviewModal.hidden =
        true;


    reviewContent.hidden =
        true;


    reviewLoading.hidden =
        false;


    reviewLoading.textContent =
        "Loading quotation...";


    revisionRemarks.value =
        "";


    hideDecisionError();


    currentReview =
        null;

}


/* =========================================================
   FILTER BUTTONS
========================================================= */

document
    .querySelectorAll(
        ".filter-button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".filter-button"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    currentFilter =
                        button.dataset.filter ||
                        "all";


                    renderQuotations();

                }
            );

        }
    );


/* =========================================================
   TABLE ACTIONS
========================================================= */

tableBody?.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "button"
            );


        if (!button) return;


        if (
            button.dataset.review
        ) {

            openReview(
                button.dataset.review
            );

            return;

        }


        if (
            button.dataset.openPdf
        ) {

            const quotation =
                quotations.find(
                    item =>
                        item.id ===
                        button.dataset.openPdf
                );


            if (
                quotation?.quotation_file_url
            ) {

                window.open(
                    quotation.quotation_file_url,
                    "_blank",
                    "noopener,noreferrer"
                );

            }

        }

    }
);


/* =========================================================
   SEARCH
========================================================= */

$("#searchInput")
    ?.addEventListener(
        "input",
        renderQuotations
    );


/* =========================================================
   REFRESH
========================================================= */

$("#refreshButton")
    ?.addEventListener(
        "click",
        loadQuotations
    );


/* =========================================================
   NEW REVISION ALERT BUTTON
========================================================= */

$("#viewNewRevisionButton")
    ?.addEventListener(
        "click",
        () => {

            if (
                latestNewRevision
            ) {

                openReview(
                    latestNewRevision.id
                );

            }

        }
    );


/* =========================================================
   REVIEW MODAL EVENTS
========================================================= */

$("#closeReviewButton")
    ?.addEventListener(
        "click",
        closeReview
    );


reviewModal
    ?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                reviewModal
                ||
                event.target.matches(
                    "[data-close-modal]"
                )
            ) {

                closeReview();

            }

        }
    );


$("#openPdfButton")
    ?.addEventListener(
        "click",
        openPdf
    );


$("#approveButton")
    ?.addEventListener(
        "click",
        approveQuotation
    );


$("#revisionButton")
    ?.addEventListener(
        "click",
        requestRevision
    );


/* =========================================================
   LOGOUT
========================================================= */

$("#logoutButton")
    ?.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                "securepro_super_admin_token"
            );


            localStorage.removeItem(
                "securepro_super_admin_user"
            );


            window.location.href =
                "login.html";

        }
    );


/* =========================================================
   SUPER ADMIN NAME
========================================================= */

try {

    const user =
        JSON.parse(
            localStorage.getItem(
                "securepro_super_admin_user"
            ) ||
            "null"
        );


    if (user) {

        const name =
            user.name ||
            "Super Admin";


        $("#adminName").textContent =
            name;


        $("#topName").textContent =
            name;

    }

} catch {
    // Ignore invalid local storage.
}


/* =========================================================
   INITIALIZE
========================================================= */

loadQuotations();
