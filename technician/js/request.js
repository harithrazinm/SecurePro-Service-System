const BACKEND_BASE =
    "https://securepro-service-system.onrender.com";

const API_BASE =
    `${BACKEND_BASE}/api`;

const UPLOAD_BASE =
    BACKEND_BASE;

let requestData = null;


/*
 * =========================================================
 * SELECTED COMPLETION MEDIA
 * =========================================================
 *
 * This array keeps all photos/videos selected by the
 * technician, even after the file input is cleared.
 *
 */

let selectedCompletionMedia = [];


/* =========================================================
   HELPERS
========================================================= */

function getRequestId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("id");

}


function escapeHtml(value) {

    return String(
        value ?? ""
    )
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


    return (
        labels[status] ||
        status ||
        "Unknown"
    );

}


function showError(message) {

    const element =
        document.querySelector(
            "#requestError"
        );


    if (!element) {

        return;

    }


    element.textContent =
        message;


    element.hidden =
        false;

}


function hideError() {

    const element =
        document.querySelector(
            "#requestError"
        );


    if (!element) {

        return;

    }


    element.hidden =
        true;


    element.textContent =
        "";

}


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
   LOAD REQUEST
========================================================= */

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


    const token =
        getToken();


    try {

        const response =
            await fetch(
                `${API_BASE}/technician/requests/${encodeURIComponent(requestId)}`,
                {

                    method:
                        "GET",

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
            "Load technician request error:",
            error
        );


        showError(
            error.message ||
            "Unable to load request."
        );

    }

}


/* =========================================================
   RENDER REQUEST
========================================================= */

function renderRequest(data) {

    renderHeader(data);

    renderCustomer(data);

    renderAnswers(data);

    renderNotes(data);

    renderPhotos(data);

    renderExistingReport(data);

    renderMeta(data);

}


/* =========================================================
   HEADER
========================================================= */

function renderHeader(data) {

    const requestCode =
        document.querySelector(
            "#requestCode"
        );


    const serviceName =
        document.querySelector(
            "#serviceName"
        );


    const status =
        document.querySelector(
            "#requestStatus"
        );


    if (requestCode) {

        requestCode.textContent =
            data.request_code ||
            "—";

    }


    if (serviceName) {

        serviceName.textContent =
            data.service?.name?.en ||
            data.service?.code ||
            "—";

    }


    if (status) {

        status.textContent =
            formatStatus(
                data.status
            );


        status.className =
            `status-badge status-${data.status}`;

    }

}


/* =========================================================
   CUSTOMER
========================================================= */

function renderCustomer(data) {

    const customer =
        data.customer ||
        {};


    const container =
        document.querySelector(
            "#customerGrid"
        );


    if (!container) {

        return;

    }


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


    container.innerHTML = `

        <div class="info-item">

            <span>
                Customer Name
            </span>

            <strong>
                ${escapeHtml(
                    customer.name ||
                    "—"
                )}
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
                Installation Address
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


/* =========================================================
   CUSTOMER ANSWERS
========================================================= */

function renderAnswers(data) {

    const container =
        document.querySelector(
            "#answersGrid"
        );


    if (!container) {
        return;
    }


    const answers =
        Array.isArray(data.answers)
            ? data.answers
            : [];


    if (!answers.length) {

        container.innerHTML = `

            <div class="empty-state">

                <strong>
                    No customer requirements found
                </strong>

                <span>
                    This request does not contain any service answers.
                </span>

            </div>

        `;

        return;
    }


    container.innerHTML =
        answers
            .map(
                (answer, index) => {

                    const question =
                        answer.question?.en ||
                        answer.question_code ||
                        "Customer Requirement";


                    const value =
                        getAnswerDisplayValue(
                            answer
                        );


                    return `

                        <article
                            class="answer-item"
                        >

                            <div class="answer-index">

                                ${String(
                                    index + 1
                                ).padStart(
                                    2,
                                    "0"
                                )}

                            </div>


                            <div class="answer-content">

                                <div class="answer-question">

                                    ${escapeHtml(
                                        question
                                    )}

                                </div>


                                ${
                                    answer.description?.en
                                        ? `
                                            <div
                                                class="answer-description"
                                            >

                                                ${escapeHtml(
                                                    answer.description.en
                                                )}

                                            </div>
                                        `
                                        : ""
                                }


                                <div class="answer-value">

                                    ${escapeHtml(
                                        value
                                    )}

                                </div>


                                ${
                                    answer.unit
                                        ? `
                                            <div
                                                class="answer-unit"
                                            >

                                                ${escapeHtml(
                                                    answer.unit
                                                )}

                                            </div>
                                        `
                                        : ""
                                }

                            </div>

                        </article>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   GET ANSWER DISPLAY VALUE
========================================================= */

function getAnswerDisplayValue(answer) {

    /*
     * ------------------------------------------------------
     * 1. COUNTER
     * ------------------------------------------------------
     */

    if (
        answer.question_type === "counter" ||
        answer.type === "counter"
    ) {

        const counterValue =
            answer.text_value;


        if (counterValue) {

            try {

                const values =
                    typeof counterValue === "string"
                        ? JSON.parse(counterValue)
                        : counterValue;


                if (
                    values &&
                    typeof values === "object" &&
                    !Array.isArray(values)
                ) {

                    return Object.entries(
                        values
                    )
                    .map(
                        ([key, value]) =>
                            `${formatLabel(key)}: ${value}`
                    )
                    .join(" • ");

                }

            } catch (error) {

                // Continue to normal answer handling.

            }

        }

    }


    /*
     * ------------------------------------------------------
     * 2. SELECTED OPTIONS
     *
     * Supports both:
     *
     * option.label.en
     *
     * and
     *
     * option.option_label_en
     * ------------------------------------------------------
     */

    if (
        Array.isArray(answer.options) &&
        answer.options.length > 0
    ) {

        const optionValues =
            answer.options
                .map(
                    option => {

                        return (
                            option.label?.en ||
                            option.option_label_en ||
                            option.value ||
                            option.option_value ||
                            ""
                        );

                    }
                )
                .filter(Boolean);


        const uniqueOptions =
            removeDuplicateValues(
                optionValues
            );


        if (uniqueOptions.length > 0) {

            return uniqueOptions.join(", ");

        }

    }


    /*
     * ------------------------------------------------------
     * 3. answer.answer
     *
     * Backend may already return:
     *
     * "Home, Home"
     *
     * Normalize it to:
     *
     * "Home"
     * ------------------------------------------------------
     */

    if (
        answer.answer !== null &&
        answer.answer !== undefined &&
        String(answer.answer).trim() !== ""
    ) {

        return normalizeAnswerText(
            answer.answer
        );

    }


    /*
     * ------------------------------------------------------
     * 4. NUMBER
     * ------------------------------------------------------
     */

    if (
        answer.number_value !== null &&
        answer.number_value !== undefined
    ) {

        const numberValue =
            String(
                answer.number_value
            );


        if (answer.unit) {

            return `${numberValue} ${answer.unit}`;

        }


        return numberValue;

    }


    /*
     * ------------------------------------------------------
     * 5. TEXT
     * ------------------------------------------------------
     */

    if (
        answer.text_value !== null &&
        answer.text_value !== undefined &&
        String(answer.text_value).trim() !== ""
    ) {

        return normalizeAnswerText(
            answer.text_value
        );

    }


    /*
     * ------------------------------------------------------
     * 6. EMPTY
     * ------------------------------------------------------
     */

    return "Not specified";

}


/* =========================================================
   NORMALIZE ANSWER TEXT
========================================================= */

function normalizeAnswerText(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "Not specified";

    }


    const text =
        String(value)
            .trim();


    if (!text) {

        return "Not specified";

    }


    /*
     * If the answer is comma-separated,
     * remove duplicate values while
     * preserving their original order.
     *
     * Example:
     *
     * Home, Home
     *        ↓
     * Home
     *
     * IP Camera, IP Camera
     *        ↓
     * IP Camera
     *
     * Front Door, Garage, Front Door
     *        ↓
     * Front Door, Garage
     */

    if (
        text.includes(",")
    ) {

        const parts =
            text
                .split(",")
                .map(
                    part =>
                        part.trim()
                )
                .filter(Boolean);


        const unique =
            removeDuplicateValues(
                parts
            );


        return unique.join(", ");

    }


    return text;

}


/* =========================================================
   REMOVE DUPLICATE VALUES
========================================================= */

function removeDuplicateValues(values) {

    const seen =
        new Set();


    return values.filter(
        value => {

            const normalized =
                String(value)
                    .trim()
                    .toLowerCase();


            if (!normalized) {

                return false;

            }


            if (
                seen.has(
                    normalized
                )
            ) {

                return false;

            }


            seen.add(
                normalized
            );


            return true;

        }
    );

}


/* =========================================================
   NOTES
========================================================= */

function renderNotes(data) {

    const card =
        document.querySelector(
            "#notesCard"
        );


    const container =
        document.querySelector(
            "#customerNotes"
        );


    if (
        !card ||
        !container
    ) {

        return;

    }


    const notes =
        String(
            data.customer?.notes ||
            ""
        ).trim();


    if (!notes) {

        card.hidden =
            true;

        return;

    }


    card.hidden =
        false;


    container.textContent =
        notes;

}


/* =========================================================
   CUSTOMER PHOTOS
========================================================= */

function renderPhotos(data) {

    const photos =
        Array.isArray(
            data.photos
        )
            ? data.photos
            : [];


    const container =
        document.querySelector(
            "#photosGrid"
        );


    const count =
        document.querySelector(
            "#photoCount"
        );


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

            <div class="empty-state">

                <strong>
                    No customer photos
                </strong>

                <span>
                    No photos were uploaded with this request.
                </span>

            </div>

        `;

        return;

    }


    container.innerHTML =
        photos
            .map(
                (photo, index) => {

                    const rawPath =
                        String(
                            photo.file_path ||
                            ""
                        ).trim();


                    const photoUrl =
                        rawPath.startsWith(
                            "http://"
                        ) ||
                        rawPath.startsWith(
                            "https://"
                        )
                            ? rawPath
                            : `${BACKEND_BASE}${
                                rawPath.startsWith("/")
                                    ? ""
                                    : "/"
                              }${rawPath}`;


                    return `

                        <article
                            class="photo-card"
                        >

                            <a
                                href="${escapeHtml(
                                    photoUrl
                                )}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >

                                <img
                                    src="${escapeHtml(
                                        photoUrl
                                    )}"
                                    alt="${escapeHtml(
                                        photo.file_name ||
                                        `Customer Photo ${index + 1}`
                                    )}"
                                    loading="lazy"
                                >

                            </a>


                            <div class="photo-info">

                                <strong>
                                    ${escapeHtml(
                                        photo.file_name ||
                                        `Customer Photo ${index + 1}`
                                    )}
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
            )
            .join("");

}


/* =========================================================
   EXISTING REPORT
========================================================= */

function renderExistingReport(data) {

    const card =
        document.querySelector(
            "#existingReportCard"
        );


    const container =
        document.querySelector(
            "#existingReport"
        );


    if (
        !card ||
        !container
    ) {

        return;

    }


    const report =
        data.report;


    if (!report) {

        card.hidden =
            true;

        return;

    }


    card.hidden =
        false;


    container.innerHTML = `

        <div class="report-status">

            <span>
                Report Status
            </span>

            <strong>
                ${escapeHtml(
                    formatStatus(
                        report.status
                    )
                )}
            </strong>

        </div>


        <div class="report-detail">

            <span>
                Work Performed
            </span>

            <p>
                ${escapeHtml(
                    report.work_performed ||
                    "—"
                )}
            </p>

        </div>


        <div class="report-detail">

            <span>
                Findings
            </span>

            <p>
                ${escapeHtml(
                    report.findings ||
                    "—"
                )}
            </p>

        </div>


        <div class="report-detail">

            <span>
                Materials Used
            </span>

            <p>
                ${escapeHtml(
                    report.materials_used ||
                    "—"
                )}
            </p>

        </div>


        <div class="report-detail">

            <span>
                Technician Notes
            </span>

            <p>
                ${escapeHtml(
                    report.technician_notes ||
                    "—"
                )}
            </p>

        </div>


        <div class="report-submitted">

            Submitted:
            ${escapeHtml(
                formatDate(
                    report.submitted_at
                )
            )}

        </div>

    `;


    if (
        report.status === "submitted" ||
        report.status === "approved"
    ) {

        const workReportCard =
            document.querySelector(
                "#workReportCard"
            );


        if (workReportCard) {

            workReportCard.hidden =
                true;

        }

    }

}


/* =========================================================
   META
========================================================= */

function renderMeta(data) {

    const createdAt =
        document.querySelector(
            "#createdAt"
        );


    const metaCreated =
        document.querySelector(
            "#metaCreated"
        );


    const metaUpdated =
        document.querySelector(
            "#metaUpdated"
        );


    const metaCompleted =
        document.querySelector(
            "#metaCompleted"
        );


    if (createdAt) {

        createdAt.textContent =
            formatDate(
                data.created_at
            );

    }


    if (metaCreated) {

        metaCreated.textContent =
            formatDate(
                data.created_at
            );

    }


    if (metaUpdated) {

        metaUpdated.textContent =
            formatDate(
                data.updated_at
            );

    }


    if (metaCompleted) {

        metaCompleted.textContent =
            formatDate(
                data.completed_at
            );

    }

}


/* =========================================================
   COMPLETION MEDIA PREVIEW
========================================================= */

function renderMediaPreview() {

    const container =
        document.querySelector(
            "#mediaPreview"
        );


    if (!container) {

        return;

    }


    /*
     * Clear current preview
     */

    container.innerHTML = "";


    /*
     * No files
     */

    if (
        !selectedCompletionMedia.length
    ) {

        container.innerHTML = `

            <div class="media-empty">

                No completion photos or videos selected.

            </div>

        `;

        return;

    }


    /*
     * Render every selected file
     */

    selectedCompletionMedia.forEach(
        (file, index) => {

            const objectUrl =
                URL.createObjectURL(
                    file
                );


            const isImage =
                file.type.startsWith(
                    "image/"
                );


            const isVideo =
                file.type.startsWith(
                    "video/"
                );


            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "media-preview-card";


            card.innerHTML = `

                <div class="media-preview-image">

                    ${
                        isImage
                            ? `
                                <img
                                    src="${escapeHtml(
                                        objectUrl
                                    )}"
                                    alt="${escapeHtml(
                                        file.name
                                    )}"
                                >
                            `
                            : ""
                    }


                    ${
                        isVideo
                            ? `
                                <video
                                    src="${escapeHtml(
                                        objectUrl
                                    )}"
                                    controls
                                    preload="metadata"
                                ></video>
                            `
                            : ""
                    }

                </div>


                <div class="media-preview-info">

                    <strong>

                        ${escapeHtml(
                            file.name
                        )}

                    </strong>


                    <span>

                        ${
                            isImage
                                ? "Photo"
                                : "Video"
                        }

                        ·

                        ${formatFileSize(
                            file.size
                        )}

                    </span>


                    <button
                        type="button"
                        class="remove-media-button"
                        data-index="${index}"
                    >

                        Remove

                    </button>

                </div>

            `;


            container.appendChild(
                card
            );

        }
    );


    /*
     * REMOVE INDIVIDUAL FILE
     */

    container
        .querySelectorAll(
            ".remove-media-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(
                                button.dataset.index
                            );


                        /*
                         * Remove selected file
                         */

                        selectedCompletionMedia
                            .splice(
                                index,
                                1
                            );


                        /*
                         * Re-render
                         */

                        renderMediaPreview();

                    }
                );

            }
        );

}


/* =========================================================
   ADD COMPLETION MEDIA
========================================================= */

function addCompletionMedia(files) {

    const newFiles =
        Array.from(
            files || []
        );


    const allowedTypes = [

        "image/jpeg",
        "image/png",
        "image/webp",

        "video/mp4",
        "video/webm",
        "video/quicktime"

    ];


    const maxSize =
        100 *
        1024 *
        1024;


    /*
     * Process every newly selected file
     */

    for (
        const file of newFiles
    ) {

        /*
         * Check file type
         */

        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            alert(
                `${file.name} is not a supported photo or video.`
            );

            continue;

        }


        /*
         * Check file size
         */

        if (
            file.size >
            maxSize
        ) {

            alert(
                `${file.name} is larger than 100 MB.`
            );

            continue;

        }


        /*
         * Prevent duplicates
         */

        const alreadyExists =
            selectedCompletionMedia.some(
                existing =>

                    existing.name ===
                        file.name &&

                    existing.size ===
                        file.size

            );


        if (
            alreadyExists
        ) {

            continue;

        }


        /*
         * Add file
         */

        selectedCompletionMedia.push(
            file
        );

    }


    /*
     * Maximum 10 files
     */

    if (
        selectedCompletionMedia.length >
        10
    ) {

        selectedCompletionMedia =
            selectedCompletionMedia.slice(
                0,
                10
            );


        alert(
            "You can upload a maximum of 10 photos/videos."
        );

    }


    /*
     * Update preview
     */

    renderMediaPreview();

}


/* =========================================================
   FILE SIZE
========================================================= */

function formatFileSize(bytes) {

    if (!bytes) {

        return "0 KB";

    }


    if (
        bytes <
        1024
    ) {

        return `${bytes} B`;

    }


    if (
        bytes <
        1024 *
        1024
    ) {

        return `${(
            bytes /
            1024
        ).toFixed(1)} KB`;

    }


    return `${(
        bytes /
        (
            1024 *
            1024
        )
    ).toFixed(1)} MB`;

}


/* =========================================================
   VALIDATE COMPLETION MEDIA
========================================================= */

function validateCompletionMedia() {

    /*
     * IMPORTANT:
     *
     * Do NOT use input.files here.
     *
     * The input is cleared after every selection,
     * so all files are stored in selectedCompletionMedia.
     */

    const files =
        selectedCompletionMedia;


    const allowedTypes = [

        "image/jpeg",
        "image/png",
        "image/webp",

        "video/mp4",
        "video/webm",
        "video/quicktime"

    ];


    const maxSize =
        100 *
        1024 *
        1024;


    /*
     * Maximum number of files
     */

    if (
        files.length >
        10
    ) {

        return {

            valid: false,

            message:
                "You can upload a maximum of 10 photos/videos."

        };

    }


    /*
     * Validate each file
     */

    for (
        const file of files
    ) {

        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            return {

                valid: false,

                message:
                    `${file.name} is not a supported image or video format.`

            };

        }


        if (
            file.size >
            maxSize
        ) {

            return {

                valid: false,

                message:
                    `${file.name} is larger than the 100 MB limit.`

            };

        }

    }


    return {

        valid: true

    };

}


/* =========================================================
   SUBMIT WORK REPORT
========================================================= */

async function submitReport(event) {

    event.preventDefault();


    if (!requestData) {

        return;

    }


    const token =
        getToken();


    const button =
        document.querySelector(
            "#submitReportButton"
        );


    const form =
        document.querySelector(
            "#reportForm"
        );


    if (!button || !form) {

        return;

    }


    /*
     * ------------------------------------------------------
     * VALIDATE MEDIA
     * ------------------------------------------------------
     */

    const mediaValidation =
        validateCompletionMedia();


    if (
        !mediaValidation.valid
    ) {

        showReportMessage(
            mediaValidation.message,
            "error"
        );

        return;

    }


    /*
     * ------------------------------------------------------
     * CREATE FORM DATA
     * ------------------------------------------------------
     */

    const formData =
        new FormData();


    const workPerformedElement =
        document.querySelector(
            "#workPerformed"
        );


    const findingsElement =
        document.querySelector(
            "#findings"
        );


    const materialsUsedElement =
        document.querySelector(
            "#materialsUsed"
        );


    const technicianNotesElement =
        document.querySelector(
            "#technicianNotes"
        );


    const workPerformed =
        String(
            workPerformedElement?.value ||
            ""
        ).trim();


    const findings =
        String(
            findingsElement?.value ||
            ""
        ).trim();


    const materialsUsed =
        String(
            materialsUsedElement?.value ||
            ""
        ).trim();


    const technicianNotes =
        String(
            technicianNotesElement?.value ||
            ""
        ).trim();


    /*
     * Work performed is required
     */

    if (!workPerformed) {

        showReportMessage(
            "Please describe the work you performed.",
            "error"
        );

        return;

    }


    /*
     * Add report fields
     */

    formData.append(
        "work_performed",
        workPerformed
    );


    formData.append(
        "findings",
        findings
    );


    formData.append(
        "materials_used",
        materialsUsed
    );


    formData.append(
        "technician_notes",
        technicianNotes
    );


    /*
     * ------------------------------------------------------
     * ADD ALL PHOTOS / VIDEOS
     * ------------------------------------------------------
     */

    selectedCompletionMedia.forEach(
        file => {

            formData.append(
                "completion_media",
                file
            );

        }
    );


    /*
     * ------------------------------------------------------
     * BUTTON STATE
     * ------------------------------------------------------
     */

    button.disabled =
        true;


    button.textContent =
        "Submitting...";


    hideReportMessage();


    try {

        const response =
            await fetch(
                `${API_BASE}/technician/requests/${encodeURIComponent(requestData.id)}/report`,
                {

                    method:
                        "POST",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`

                    },

                    /*
                     * DO NOT set Content-Type manually.
                     *
                     * Browser automatically sets:
                     *
                     * multipart/form-data
                     * + boundary
                     */

                    body:
                        formData

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
                "Unable to submit work report."
            );

        }


        /*
         * --------------------------------------------------
         * SUCCESS
         * --------------------------------------------------
         */

        showReportMessage(
            result.message ||
            "Work report submitted successfully.",
            "success"
        );


        /*
         * Clear selected media
         */

        selectedCompletionMedia =
            [];


        /*
         * Reset form
         */

        form.reset();


        /*
         * Clear media preview
         */

        renderMediaPreview();


        /*
         * Reload request details
         */

        await loadRequest();


    } catch (error) {

        console.error(
            "Submit report error:",
            error
        );


        showReportMessage(
            error.message ||
            "Unable to submit work report.",
            "error"
        );

    } finally {

        button.disabled =
            false;


        button.textContent =
            "Submit Work Report";

    }

}


/* =========================================================
   REPORT MESSAGE
========================================================= */

function showReportMessage(
    text,
    type
) {

    const element =
        document.querySelector(
            "#reportMessage"
        );


    if (!element) {

        return;

    }


    element.textContent =
        text;


    element.className =
        `report-message ${type}`;


    element.hidden =
        false;

}


function hideReportMessage() {

    const element =
        document.querySelector(
            "#reportMessage"
        );


    if (!element) {

        return;

    }


    element.hidden =
        true;


    element.textContent =
        "";

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
   INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /*
         * Check technician login
         */

        if (
            !requireToken()
        ) {

            return;

        }


        /*
         * Work report form
         */

        const form =
            document.querySelector(
                "#reportForm"
            );


        if (form) {

            form.addEventListener(
                "submit",
                submitReport
            );

        }


        /*
         * Completion media input
         */

        const mediaInput =
            document.querySelector(
                "#completionMedia"
            );


        if (mediaInput) {

            mediaInput.addEventListener(
                "change",
                event => {

                    /*
                     * Add the newly selected files
                     * to our persistent array.
                     */

                    addCompletionMedia(
                        event.target.files
                    );


                    /*
                     * IMPORTANT:
                     *
                     * Clear the actual input.
                     *
                     * This allows the technician to
                     * select more files again.
                     */

                    event.target.value =
                        "";

                }
            );

        }


        /*
         * Initial empty preview
         */

        renderMediaPreview();


        /*
         * Load request
         */

        loadRequest();

    }
);