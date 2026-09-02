const API_BASE =
    "https://securepro-service-system.onrender.com/api";
const BACKEND_BASE =
    "https://securepro-service-system.onrender.com";

let requestData = null;
let selectedStatus = null;

const token = localStorage.getItem("securepro_admin_token");

/* ========================================
   HELPERS
======================================== */

function getRequestId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("id");
}


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

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
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

    return labels[status] || status || "Unknown";
}


/* ========================================
   ERROR
======================================== */

function showError(message) {

    const error =
        document.querySelector(
            "#requestError"
        );

    error.textContent =
        message || "Unable to load request.";

    error.hidden = false;
}


function hideError() {

    const error =
        document.querySelector(
            "#requestError"
        );

    error.hidden = true;

    error.textContent = "";
}


/* ========================================
   AUTH
======================================== */

function requireToken() {

    if (!token) {

        window.location.href =
            "login.html";

        return false;
    }

    return true;
}


/* ========================================
   LOAD REQUEST
======================================== */

async function loadRequest() {

    hideError();

    const requestId =
        getRequestId();

    if (!requestId) {

        showError(
            "No request ID was provided."
        );

        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE}/admin/requests/${encodeURIComponent(requestId)}`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Unable to load request."
            );
        }


        requestData =
            result.data;


        renderRequest(
            requestData
        );


    } catch (error) {

        console.error(
            "Request details error:",
            error
        );

        showError(
            error.message ||
            "Unable to load request."
        );

    }

}
/* ========================================
   RENDER REQUEST
======================================== */

function renderRequest(data) {

    requestData = data;

    renderHeader(data);

    renderCustomer(data);

    renderAnswers(data);

    renderNotes(data);

    renderPhotos(data);

    renderTechnicianReport(data);

    renderStatus(data);

    renderTechnician(data);

renderAssignment(data);

renderMeta(data);

    /* ========================================
       SHOW REQUEST DETAILS
    ======================================== */

    const loading =
        document.querySelector(
            "#requestLoading"
        );

    const details =
        document.querySelector(
            "#requestDetails"
        );

    if (loading) {
        loading.hidden = true;
    }

    if (details) {
        details.hidden = false;
    }

    /* ========================================
       LOAD TECHNICIANS
    ======================================== */

    loadTechnicians(data);
}

/* ========================================
   RENDER REQUEST
======================================== */

function renderPhotos(data) {

    const photos =
        Array.isArray(data.photos)
            ? data.photos
            : [];

    const container =
        document.querySelector("#photosGrid");

    const count =
        document.querySelector("#photoCount");

    if (!container) {
        return;
    }

    if (count) {
        count.textContent =
            `${photos.length} ${
                photos.length === 1
                    ? "photo"
                    : "photos"
            }`;
    }

    if (!photos.length) {

        container.innerHTML = `
            <div class="no-photos">
                <div class="no-photos-icon">○</div>
                <strong>No customer photos</strong>
                <span>
                    No photos were uploaded with this request.
                </span>
            </div>
        `;

        return;
    }

    container.innerHTML =
        photos.map(
            (photo, index) => {

                const rawPath =
                    String(
                        photo.file_path || ""
                    ).trim();

                const photoUrl =
                    rawPath.startsWith("http://") ||
                    rawPath.startsWith("https://")
                        ? rawPath
                        : `${BACKEND_BASE}${rawPath.startsWith("/") ? "" : "/"}${rawPath}`;

                const fileName =
                    photo.file_name ||
                    `Customer Photo ${index + 1}`;

                return `
                    <article class="photo-card">

                        <a
                            class="photo-preview"
                            href="${escapeHtml(photoUrl)}"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open full image"
                        >

                            <img
                                src="${escapeHtml(photoUrl)}"
                                alt="${escapeHtml(fileName)}"
                                loading="lazy"
                                onerror="this.parentElement.classList.add('image-error'); this.style.display='none';"
                            >

                            <span class="photo-open">
                                ↗
                            </span>

                            <span class="photo-error">
                                Image unavailable
                            </span>

                        </a>

                        <div class="photo-info">

                            <strong
                                title="${escapeHtml(fileName)}"
                            >
                                ${escapeHtml(fileName)}
                            </strong>

                            <span>
                                ${formatDate(
                                    photo.uploaded_at
                                )}
                            </span>

                        </div>

                    </article>
                `;

            }
        ).join("");
}

/* ========================================
   TECHNICIAN REPORT
======================================== */

function renderTechnicianReport(data) {

    const card =
        document.querySelector(
            "#technicianReportCard"
        );

    if (!card) {
        return;
    }


    const report =
        data.report || null;


    /*
     * No report
     */

    if (!report) {

        card.hidden = false;


        document.querySelector(
            "#technicianReportStatus"
        ).textContent =
            "No report submitted";


        document.querySelector(
            "#reportWorkPerformed"
        ).textContent =
            "The technician has not submitted a work report yet.";


        document.querySelector(
            "#reportFindings"
        ).textContent =
            "—";


        document.querySelector(
            "#reportMaterialsUsed"
        ).textContent =
            "—";


        document.querySelector(
            "#reportTechnicianNotes"
        ).textContent =
            "—";


        renderCompletionMedia([]);


        hideReportReview();


        return;
    }


    /*
     * Show report
     */

    card.hidden = false;


    document.querySelector(
        "#technicianReportStatus"
    ).textContent =
        formatReportStatus(
            report.status
        );


    document.querySelector(
        "#reportWorkPerformed"
    ).textContent =
        report.work_performed ||
        "—";


    document.querySelector(
        "#reportFindings"
    ).textContent =
        report.findings ||
        "—";


    document.querySelector(
        "#reportMaterialsUsed"
    ).textContent =
        report.materials_used ||
        "—";


    document.querySelector(
        "#reportTechnicianNotes"
    ).textContent =
        report.technician_notes ||
        "—";


    /*
     * Review remarks
     */

    const remarksCard =
        document.querySelector(
            "#reportReviewRemarks"
        );

    const remarksText =
        document.querySelector(
            "#reportReviewRemarksText"
        );


    if (
        report.review_remarks &&
        String(
            report.review_remarks
        ).trim()
    ) {

        remarksCard.hidden = false;

        remarksText.textContent =
            report.review_remarks;

    } else {

        remarksCard.hidden = true;

        remarksText.textContent =
            "";

    }


    /*
     * Completion media
     */

    renderCompletionMedia(
        data.completion_media ||
        report.completion_media ||
        report.media ||
        []
    );


    /*
     * Review buttons
     */

    setupReportReview(
        report
    );
}

/* ========================================
   REPORT STATUS
======================================== */

function formatReportStatus(status) {

    const labels = {

        draft:
            "Draft",

        submitted:
            "Submitted",

        approved:
            "Approved",

        rejected:
            "Rejected"

    };


    return labels[status] ||
        status ||
        "Unknown";
}

/* ========================================
   COMPLETION MEDIA
======================================== */

function renderCompletionMedia(media) {

    const container =
        document.querySelector(
            "#completionMediaGrid"
        );

    const count =
        document.querySelector(
            "#completionMediaCount"
        );


    if (!container) {
        return;
    }


    media =
        Array.isArray(media)
            ? media
            : [];


    /* ========================================
       COUNT
    ======================================== */

    if (count) {

        count.textContent =
            `${media.length} ${
                media.length === 1
                    ? "file"
                    : "files"
            }`;

    }


    /* ========================================
       NO MEDIA
    ======================================== */

    if (!media.length) {

        container.innerHTML = `
            <div class="no-completion-media">

                <div class="no-media-icon">
                    ○
                </div>

                <strong>
                    No completion media
                </strong>

                <span>
                    The technician did not upload
                    any photos or videos.
                </span>

            </div>
        `;

        return;
    }


    /* ========================================
       RENDER MEDIA
    ======================================== */

    container.innerHTML =
        media.map(
            (item, index) => {

                const rawPath =
                    String(
                        item.file_path ||
                        ""
                    ).trim();


                const mediaUrl =
                    rawPath.startsWith("http://") ||
                    rawPath.startsWith("https://")
                        ? rawPath
                        : `${BACKEND_BASE}${
                            rawPath.startsWith("/")
                                ? ""
                                : "/"
                        }${rawPath}`;


                const fileName =
                    item.file_name ||
                    `Completion Media ${index + 1}`;


                const mediaType =
                    String(
                        item.media_type ||
                        ""
                    ).toLowerCase();


                const mimeType =
                    String(
                        item.mime_type ||
                        ""
                    ).toLowerCase();


                /* ==================================
                   IMAGE
                ================================== */

                if (
                    mediaType === "image" ||
                    mimeType.startsWith("image/")
                ) {

                    return `

                        <article
                            class="completion-media-card"
                        >

                            <a
                                href="${escapeHtml(mediaUrl)}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="completion-media-preview"
                                title="Open full image"
                            >

                                <img
                                    src="${escapeHtml(mediaUrl)}"
                                    alt="${escapeHtml(fileName)}"
                                    loading="lazy"
                                >

                                <span class="media-open">
                                    ↗
                                </span>

                            </a>


                            <div
                                class="completion-media-info"
                            >

                                <strong
                                    title="${escapeHtml(fileName)}"
                                >
                                    ${escapeHtml(fileName)}
                                </strong>

                                <span>
                                    Technician Photo
                                </span>

                                <small>
                                    ${formatDate(
                                        item.uploaded_at
                                    )}
                                </small>

                            </div>

                        </article>

                    `;
                }


                /* ==================================
                   VIDEO
                ================================== */

                if (
                    mediaType === "video" ||
                    mimeType.startsWith("video/")
                ) {

                    return `

                        <article
                            class="completion-media-card"
                        >

                            <div
                                class="completion-media-video"
                            >

                                <video
                                    controls
                                    preload="metadata"
                                >

                                    <source
                                        src="${escapeHtml(mediaUrl)}"
                                        type="${escapeHtml(
                                            item.mime_type ||
                                            "video/mp4"
                                        )}"
                                    >

                                    Your browser does not
                                    support video playback.

                                </video>

                            </div>


                            <div
                                class="completion-media-info"
                            >

                                <strong
                                    title="${escapeHtml(fileName)}"
                                >
                                    ${escapeHtml(fileName)}
                                </strong>

                                <span>
                                    Technician Video
                                </span>

                                <small>
                                    ${formatDate(
                                        item.uploaded_at
                                    )}
                                </small>

                            </div>

                        </article>

                    `;
                }


                /* ==================================
                   UNKNOWN FILE
                ================================== */

                return `

                    <article
                        class="completion-media-card"
                    >

                        <a
                            href="${escapeHtml(mediaUrl)}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="unknown-media"
                        >

                            <span>
                                📎
                            </span>

                            Open File

                        </a>


                        <div
                            class="completion-media-info"
                        >

                            <strong>
                                ${escapeHtml(fileName)}
                            </strong>

                            <span>
                                ${escapeHtml(
                                    item.mime_type ||
                                    "File"
                                )}
                            </span>

                        </div>

                    </article>

                `;

            }
        ).join("");
}


/* ========================================
   HEADER
======================================== */

function renderHeader(data) {

    document.querySelector(
        "#requestCode"
    ).textContent =
        data.request_code || "—";


    const serviceName =
        data.service?.name?.en ||
        data.service?.code ||
        "—";


    document.querySelector(
        "#requestService"
    ).textContent =
        serviceName;


    updateStatusDisplay(
        data.status
    );

}


/* ========================================
   CUSTOMER
======================================== */

function renderCustomer(data) {

    const customer =
        data.customer || {};


    const container =
        document.querySelector(
            "#customerGrid"
        );


    const email =
        customer.email
            ? `
                <a
                    href="mailto:${escapeHtml(customer.email)}"
                >
                    ${escapeHtml(customer.email)}
                </a>
            `
            : "—";


    const phone =
        customer.phone
            ? `
                <a
                    href="tel:${escapeHtml(customer.phone)}"
                >
                    ${escapeHtml(customer.phone)}
                </a>
            `
            : "—";


    container.innerHTML = `

        <div class="info-item">

            <span>
                Customer Name
            </span>

            <strong>
                ${escapeHtml(customer.name || "—")}
            </strong>

        </div>


        <div class="info-item">

            <span>
                Phone
            </span>

            <strong>
                ${phone}
            </strong>

        </div>


        <div class="info-item">

            <span>
                Email
            </span>

            <strong>
                ${email}
            </strong>

        </div>


        <div class="info-item">

            <span>
                Service
            </span>

            <strong>
                ${escapeHtml(
                    data.service?.name?.en ||
                    data.service?.code ||
                    "—"
                )}
            </strong>

        </div>


        <div class="info-item full">

            <span>
                Address
            </span>

            <p>
                ${escapeHtml(
                    customer.address ||
                    "—"
                )}
            </p>

        </div>

    `;
}


/* ========================================
   ANSWERS
======================================== */

function renderAnswers(data) {

    const container =
        document.querySelector(
            "#answersGrid"
        );


    const answers =
        Array.isArray(data.answers)
            ? data.answers
            : [];


    if (!answers.length) {

        container.innerHTML = `

            <div class="no-photos">
                No service answers found.
            </div>

        `;

        return;
    }


    container.innerHTML =
        answers.map(
            answer => {

                const question =
                    answer.question?.en ||
                    answer.question_code ||
                    "Question";


                const value =
                    getAnswerDisplayValue(
                        answer
                    );


                return `

                    <div class="answer-item">

                        <span class="answer-question">
                            ${escapeHtml(question)}
                        </span>

                        <strong class="answer-value">
                            ${escapeHtml(value)}
                        </strong>

                        <span class="answer-code">
                            ${escapeHtml(
                                answer.question_code || ""
                            )}
                        </span>

                    </div>

                `;

            }
        ).join("");

}


/* ========================================
   ANSWER VALUE
======================================== */

function getAnswerDisplayValue(answer) {

    /*
     * ======================================
     * COUNTER
     * ======================================
     */

    if (
        answer.type === "counter" &&
        answer.text_value
    ) {

        try {

            const values =
                typeof answer.text_value === "string"
                    ? JSON.parse(answer.text_value)
                    : answer.text_value;


            if (
                values &&
                typeof values === "object" &&
                !Array.isArray(values)
            ) {

                return Object.entries(values)
                    .map(
                        ([key, value]) => {

                            return `${formatLabel(key)}: ${formatObjectValue(value)}`;

                        }
                    )
                    .join(" • ");

            }

        } catch (error) {

            console.warn(
                "Unable to parse counter:",
                error
            );

        }

    }


    /*
     * ======================================
     * MULTI SELECT
     * ======================================
     */

    if (
        answer.type === "multi" &&
        Array.isArray(answer.options)
    ) {

        const unique =
            removeDuplicateOptions(
                answer.options
            );


        if (unique.length) {

            return unique
                .map(
                    option => {

                        return (
                            option.option_label_en ||
                            option.option_label_ms ||
                            option.option_value ||
                            formatObjectValue(option)
                        );

                    }
                )
                .join(", ");

        }

    }


    /*
     * ======================================
     * SINGLE SELECT
     * ======================================
     */

    if (
        Array.isArray(answer.options) &&
        answer.options.length
    ) {

        const unique =
            removeDuplicateOptions(
                answer.options
            );


        if (unique.length) {

            const option =
                unique[0];


            return (
                option.option_label_en ||
                option.option_label_ms ||
                option.option_value ||
                formatObjectValue(option)
            );

        }

    }


    /*
 * ======================================
 * NUMBER + UNIT
 * ======================================
 */

if (
    answer.number_value !== null &&
    answer.number_value !== undefined
) {

    const rawNumber =
        Number(answer.number_value);

    const questionCode =
        String(
            answer.question_code || ""
        ).toLowerCase();

    /*
     * Measurement / size fields
     * Keep decimal values.
     */
    const decimalFields = [
        "arm_length",
        "pump_height",
        "pipe_length",
        "length",
        "width",
        "height",
        "size",
        "dimension"
    ];

    const isDecimalField =
        decimalFields.includes(
            questionCode
        );

    let numberValue;

    if (
        !Number.isNaN(rawNumber)
    ) {

        if (isDecimalField) {

            /*
             * Size / measurement:
             * show up to 2 decimal places,
             * but remove unnecessary zeros.
             *
             * 5      → 5
             * 5.5    → 5.5
             * 5.50   → 5.5
             * 5.25   → 5.25
             */
            numberValue =
                rawNumber
                    .toFixed(2)
                    .replace(/\.?0+$/, "");

        } else {

            /*
             * Quantity / count:
             * always whole number.
             *
             * 5.000 → 5
             * 1.000 → 1
             */
            numberValue =
                Math.round(
                    rawNumber
                ).toString();

        }

    } else {

        numberValue =
            formatObjectValue(
                answer.number_value
            );

    }


    const unit =
        formatUnit(
            answer.unit
        );


    if (unit) {

        return `${numberValue} ${unit}`;

    }


    return numberValue;
}


    /*
     * ======================================
     * TEXT VALUE
     * ======================================
     */

    if (
        answer.text_value !== null &&
        answer.text_value !== undefined &&
        answer.text_value !== ""
    ) {

        return formatObjectValue(
            answer.text_value
        );

    }


    return "—";
}


/* ========================================
   FORMAT UNIT
======================================== */

function formatUnit(unit) {

    if (
        unit === null ||
        unit === undefined ||
        unit === ""
    ) {

        return "";

    }


    /*
     * Already a normal string
     */

    if (
        typeof unit === "string"
    ) {

        return unit;

    }


    /*
     * Number
     */

    if (
        typeof unit === "number"
    ) {

        return String(unit);

    }


    /*
     * Array
     */

    if (
        Array.isArray(unit)
    ) {

        return unit
            .map(
                item =>
                    formatObjectValue(item)
            )
            .filter(Boolean)
            .join(", ");

    }


    /*
     * Object
     */

    if (
        typeof unit === "object"
    ) {

        /*
         * Try common unit structures.
         */

        const possibleValues = [

            unit.en,

            unit.ms,

            unit.label,

            unit.name,

            unit.value,

            unit.unit,

            unit.symbol,

            unit.text

        ];


        for (
            const value of possibleValues
        ) {

            if (
                value !== null &&
                value !== undefined &&
                value !== ""
            ) {

                /*
                 * Nested object
                 */

                if (
                    typeof value === "object"
                ) {

                    const nested =
                        formatObjectValue(value);


                    if (nested) {

                        return nested;

                    }

                } else {

                    return String(value);

                }

            }

        }


        /*
         * Last resort:
         * inspect every property.
         */

        for (
            const key of Object.keys(unit)
        ) {

            const value =
                unit[key];


            if (
                value === null ||
                value === undefined ||
                value === ""
            ) {

                continue;

            }


            if (
                typeof value === "string" ||
                typeof value === "number"
            ) {

                return String(value);

            }


            if (
                typeof value === "object"
            ) {

                const nested =
                    formatObjectValue(value);


                if (nested) {

                    return nested;

                }

            }

        }

    }


    return "";
}


/* ========================================
   FORMAT ANY OBJECT SAFELY
======================================== */

function formatObjectValue(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    /*
     * String
     */

    if (
        typeof value === "string"
    ) {

        return value;

    }


    /*
     * Number / Boolean
     */

    if (
        typeof value === "number" ||
        typeof value === "boolean"
    ) {

        return String(value);

    }


    /*
     * Array
     */

    if (
        Array.isArray(value)
    ) {

        return value
            .map(
                item =>
                    formatObjectValue(item)
            )
            .filter(Boolean)
            .join(", ");

    }


    /*
     * Object
     */

    if (
        typeof value === "object"
    ) {

        /*
         * Common translated values
         */

        const possibleValues = [

            value.en,

            value.ms,

            value.label,

            value.name,

            value.value,

            value.text,

            value.symbol

        ];


        for (
            const item of possibleValues
        ) {

            if (
                item !== null &&
                item !== undefined &&
                item !== ""
            ) {

                const formatted =
                    formatObjectValue(item);


                if (formatted) {

                    return formatted;

                }

            }

        }


        /*
         * Try every object property
         */

        for (
            const key of Object.keys(value)
        ) {

            const item =
                value[key];


            if (
                item === null ||
                item === undefined ||
                item === ""
            ) {

                continue;

            }


            const formatted =
                formatObjectValue(item);


            if (formatted) {

                return formatted;

            }

        }

    }


    return "";
}

/* ========================================
   DUPLICATE OPTIONS
======================================== */

function removeDuplicateOptions(options) {

    const seen =
        new Set();


    return options.filter(
        option => {

            const key =
                `${option.option_value}|${option.option_id}`;


            if (seen.has(key)) {
                return false;
            }


            seen.add(key);

            return true;

        }
    );

}


/* ========================================
   LABEL FORMAT
======================================== */

function formatLabel(value) {

    return String(value)
        .replaceAll("_", " ")
        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );
}


/* ========================================
   NOTES
======================================== */

function renderNotes(data) {

    const card =
        document.querySelector(
            "#notesCard"
        );


    const container =
        document.querySelector(
            "#customerNotes"
        );


    const notes =
        data.customer?.notes ||
        "";


    if (!notes.trim()) {

        card.hidden = true;

        return;
    }


    card.hidden = false;

    container.textContent =
        notes;

}




/* ========================================
   STATUS
======================================== */

function renderStatus(data) {

    selectedStatus =
        data.status;


    updateStatusDisplay(
        data.status
    );


    document.querySelectorAll(
        ".status-option"
    ).forEach(
        button => {

            button.classList.toggle(
                "selected",
                button.dataset.status ===
                    data.status
            );

        }
    );

}


/* ========================================
   STATUS DISPLAY
======================================== */

function updateStatusDisplay(status) {

    const label =
        formatStatus(status);


    document.querySelector(
        "#requestStatus"
    ).textContent =
        label;


    document.querySelector(
        "#currentStatusText"
    ).textContent =
        label;


    const statusElement =
        document.querySelector(
            "#requestStatus"
        );


    statusElement.className =
        "status-badge";


    statusElement.classList.add(
        `status-${status}`
    );

}


/* ========================================
   META
======================================== */

function renderMeta(data) {

    document.querySelector(
        "#createdAt"
    ).textContent =
        formatDate(
            data.created_at
        );


    document.querySelector(
        "#updatedAt"
    ).textContent =
        formatDate(
            data.updated_at
        );


    document.querySelector(
        "#completedAt"
    ).textContent =
        formatDate(
            data.completed_at
        );

}

/* ========================================
   TECHNICIAN
======================================== */

function renderTechnician(data) {

    const select =
        document.querySelector(
            "#technicianSelect"
        );

    if (!select) {
        return;
    }

    /*
     * Keep the current assignment
     * until the technician list loads.
     */

    if (data?.technician?.id) {

        select.value =
            data.technician.id;

    } else {

        select.value = "";

    }

}
/* ========================================
   TECHNICIANS
======================================== */

async function loadTechnicians(data) {

    const select =
        document.querySelector(
            "#technicianSelect"
        );


    try {

        const response =
            await fetch(
                `${API_BASE}/admin/technicians`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        if (!response.ok) {
            return;
        }


        const result =
            await response.json();


        if (!result.success) {
            return;
        }


        const technicians =
            Array.isArray(result.data)
                ? result.data
                : [];


        technicians.forEach(
            technician => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    technician.id;


                option.textContent =
                    `${technician.name} — ${technician.email}`;


                select.appendChild(
                    option
                );

            }
        );


        if (data.technician?.id) {

            select.value =
                data.technician.id;

        }

    } catch (error) {

        console.warn(
            "Unable to load technicians:",
            error
        );

    }

}


/* ========================================
   STATUS CLICK
======================================== */

function setupStatusButtons() {

    document.querySelectorAll(
        ".status-option"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    selectedStatus =
                        button.dataset.status;


                    document.querySelectorAll(
                        ".status-option"
                    ).forEach(
                        item => {

                            item.classList.toggle(
                                "selected",
                                item === button
                            );

                        }
                    );

                }
            );

        }
    );

}

/* ========================================
   SCHEDULED DATE / TIME
======================================== */

function formatDateForInput(value) {

    if (!value) {
        return "";
    }

    return String(value)
        .slice(0, 10);
}


function formatTimeForInput(value) {

    if (!value) {
        return "";
    }

    return String(value)
        .slice(0, 5);
}


/* ========================================
   RENDER ASSIGNMENT
======================================== */

function renderAssignment(data) {

    const technicianSelect =
        document.querySelector(
            "#technicianSelect"
        );

    const scheduledDate =
        document.querySelector(
            "#scheduledDate"
        );

    const scheduledTime =
        document.querySelector(
            "#scheduledTime"
        );

    const adminNotes =
        document.querySelector(
            "#adminNotes"
        );


    if (
        technicianSelect &&
        data.technician?.id
    ) {

        technicianSelect.value =
            data.technician.id;

    }


    if (scheduledDate) {

        scheduledDate.value =
            formatDateForInput(
                data.scheduled_date
            );

    }


    if (scheduledTime) {

        scheduledTime.value =
            formatTimeForInput(
                data.scheduled_time
            );

    }


    if (adminNotes) {

        adminNotes.value =
            data.admin_notes || "";

    }

}
/* ========================================
   SAVE CHANGES / ASSIGN TECHNICIAN
======================================== */

async function saveChanges() {

    if (!requestData) {
        return;
    }


    const button =
        document.querySelector(
            "#saveButton"
        );


    const technicianSelect =
        document.querySelector(
            "#technicianSelect"
        );


    const scheduledDate =
        document.querySelector(
            "#scheduledDate"
        );


    const scheduledTime =
        document.querySelector(
            "#scheduledTime"
        );


    const adminNotes =
        document.querySelector(
            "#adminNotes"
        );


    const technicianId =
        technicianSelect?.value || null;


    const date =
        scheduledDate?.value || null;


    const time =
        scheduledTime?.value || null;


    const notes =
        adminNotes?.value.trim() || null;


    /*
     * Validation:
     * When assigning a technician,
     * require a scheduled date.
     */

    if (
        technicianId &&
        !date
    ) {

        alert(
            "Please select a scheduled date for the technician."
        );

        return;

    }


    /*
     * Prevent selecting a past date.
     */

    if (date) {

        const today =
            new Date();

        today.setHours(
            0,
            0,
            0,
            0
        );


        const selectedDate =
            new Date(
                `${date}T00:00:00`
            );


        if (
            selectedDate < today
        ) {

            alert(
                "The scheduled date cannot be in the past."
            );

            return;

        }

    }


    button.disabled = true;

    button.textContent =
        "Saving...";


    try {

        const response =
            await fetch(
                `${API_BASE}/admin/requests/${encodeURIComponent(requestData.id)}`,
                {
                    method: "PUT",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        status:
                            selectedStatus,

                        technician_id:
                            technicianId,

                        scheduled_date:
                            date,

                        scheduled_time:
                            time,

                        admin_notes:
                            notes

                    })

                }
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Unable to save changes."
            );

        }


        /*
         * Reload from backend.
         *
         * This ensures the admin sees the
         * latest technician, schedule,
         * notes and status.
         */

        await loadRequest();


        button.textContent =
            "Saved ✓";


        setTimeout(
            () => {

                button.textContent =
                    "Save Changes";

                button.disabled =
                    false;

            },
            1500
        );


    } catch (error) {

        console.error(
            "Save request error:",
            error
        );


        alert(
            error.message ||
            "Unable to save changes."
        );


        button.textContent =
            "Save Changes";

        button.disabled =
            false;

    }

}
/* ========================================
   TECHNICIAN REPORT REVIEW
======================================== */

function hideReportReview() {

    const section =
        document.querySelector(
            "#reportReviewSection"
        );

    if (section) {
        section.hidden = true;
    }

}


function setupReportReview(report) {

    const section =
        document.querySelector(
            "#reportReviewSection"
        );

    const approveButton =
        document.querySelector(
            "#approveReportButton"
        );

    const rejectButton =
        document.querySelector(
            "#rejectReportButton"
        );

    const rejectForm =
        document.querySelector(
            "#rejectForm"
        );

    const cancelRejectButton =
        document.querySelector(
            "#cancelRejectButton"
        );

    const confirmRejectButton =
        document.querySelector(
            "#confirmRejectButton"
        );


    if (
        !section ||
        !approveButton ||
        !rejectButton
    ) {
        return;
    }


    /*
     * Only submitted reports can be reviewed.
     */

    if (
        report.status !==
        "submitted"
    ) {

        section.hidden = true;

        return;

    }


    section.hidden = false;


    /*
     * APPROVE
     */

    approveButton.onclick =
        async () => {

            const confirmed =
                window.confirm(
                    "Are you sure you want to approve this technician report?\n\nThe service request will be marked as completed."
                );


            if (!confirmed) {
                return;
            }


            await reviewTechnicianReport(
                "approve"
            );

        };


    /*
     * SHOW REJECT FORM
     */

    rejectButton.onclick =
        () => {

            rejectForm.hidden =
                false;

            document.querySelector(
                "#rejectReason"
            ).focus();

        };


    /*
     * CANCEL REJECTION
     */

    if (cancelRejectButton) {

        cancelRejectButton.onclick =
            () => {

                rejectForm.hidden =
                    true;

                document.querySelector(
                    "#rejectReason"
                ).value =
                    "";

            };

    }


    /*
     * CONFIRM REJECTION
     */

    if (confirmRejectButton) {

        confirmRejectButton.onclick =
            async () => {

                const reason =
                    document.querySelector(
                        "#rejectReason"
                    ).value.trim();


                if (!reason) {

                    alert(
                        "Please enter a rejection reason."
                    );

                    return;

                }


                await reviewTechnicianReport(
                    "reject",
                    reason
                );

            };

    }

}


/* ========================================
   REVIEW REPORT API
======================================== */

async function reviewTechnicianReport(
    action,
    reason = ""
) {

    if (!requestData) {
        return;
    }


    const approveButton =
        document.querySelector(
            "#approveReportButton"
        );

    const rejectButton =
        document.querySelector(
            "#rejectReportButton"
        );

    const confirmRejectButton =
        document.querySelector(
            "#confirmRejectButton"
        );


    approveButton.disabled =
        true;

    rejectButton.disabled =
        true;


    if (confirmRejectButton) {

        confirmRejectButton.disabled =
            true;

    }


    if (action === "approve") {

        approveButton.textContent =
            "Approving...";

    } else {

        if (confirmRejectButton) {

            confirmRejectButton.textContent =
                "Rejecting...";

        }

    }


    try {

        const response =
            await fetch(
                `${API_BASE}/admin/requests/${encodeURIComponent(requestData.id)}/report/review`,
                {
                    method: "POST",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        action:
                            action,

                        reason:
                            reason

                    })

                }
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Unable to review technician report."
            );

        }


        /*
         * Reload request so all
         * statuses and timestamps
         * are updated.
         */

        await loadRequest();


        alert(
            result.message ||
            "Report review completed."
        );


    } catch (error) {

        console.error(
            "Review technician report error:",
            error
        );


        alert(
            error.message ||
            "Unable to review technician report."
        );


        approveButton.disabled =
            false;

        rejectButton.disabled =
            false;


        if (confirmRejectButton) {

            confirmRejectButton.disabled =
                false;

        }


        approveButton.textContent =
            "✓ Approve Report";


        rejectButton.textContent =
            "✕ Reject Report";


        if (confirmRejectButton) {

            confirmRejectButton.textContent =
                "Reject Report";

        }

    }

}

/* ========================================
   LOGOUT
======================================== */

function logout() {

    localStorage.removeItem(
        "securepro_admin_token"
    );


    localStorage.removeItem(
        "securepro_admin_user"
    );


    window.location.href =
        "login.html";
}


/* ========================================
   ADMIN INFO
======================================== */

function loadAdminInfo() {

    try {

        const raw =
            localStorage.getItem(
                "securepro_admin_user"
            );


        if (!raw) {
            return;
        }


        const user =
            JSON.parse(raw);


        const name =
            user.name ||
            "Admin";


        document.querySelector(
            "#sidebarAdminName"
        ).textContent =
            name;


        document.querySelector(
            "#topbarAdminName"
        ).textContent =
            name;

    } catch {

        // Ignore invalid local storage.
    }

}


/* ========================================
   INIT
======================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        if (!requireToken()) {
            return;
        }


        loadAdminInfo();


        setupStatusButtons();


        document.querySelector(
            "#saveButton"
        ).addEventListener(
            "click",
            saveChanges
        );


        document.querySelector(
            "#logoutButton"
        ).addEventListener(
            "click",
            logout
        );


        loadRequest();

    }
);
