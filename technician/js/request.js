
const API_BASE = "/api";

const BACKEND_BASE = "";

let requestData = null;


/*
 * =========================================================
 * SELECTED COMPLETION MEDIA
 * =========================================================
 */

let selectedCompletionMedia = [];


/* =========================================================
   SERVICE CATALOG
   IMPORTANT:
   services.js MUST be loaded before request.js
========================================================= */

const SERVICE_CATALOG =
    typeof SERVICES !== "undefined"
        ? SERVICES
        : {};

if (!Object.keys(SERVICE_CATALOG).length) {

    console.warn(
        "SERVICES catalog not found. " +
        "Make sure services.js is loaded before request.js."
    );

}


/* =========================================================
   HELPERS
========================================================= */

async function parseResponse(response) {

    let payload = null;

    try {

        payload =
            await response.json();

    } catch (error) {

        payload = null;

    }


    if (!response.ok) {

        const message =
            payload?.message ||
            payload?.error ||
            `Request failed with status ${response.status}.`;

        const error =
            new Error(message);

        error.status =
            response.status;

        error.data =
            payload;

        throw error;

    }


    return payload || {};

}


function handleAuthError(error) {

    if (
        error?.status !== 401 &&
        error?.status !== 403
    ) {

        return false;

    }


    try {

        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "authToken"
        );

        localStorage.removeItem(
            "accessToken"
        );

    } catch (storageError) {

        console.warn(
            "Unable to clear stored authentication token.",
            storageError
        );

    }


    const message =
        error?.message ||
        "Your session has expired. Please log in again.";


    window.alert(
        message
    );


    window.location.href =
        "../technician/login.html";


    return true;

}


function getRequestId() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return params.get(
        "id"
    );

}


function escapeHtml(value) {

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
            dateStyle:
                "medium",

            timeStyle:
                "short"
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

        awaiting_payment:
            "Awaiting Payment",

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

    renderExistingReports(data);

    renderJobAction(data);

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
            data.service_name ||
            "—";

    }


    if (status) {

        status.textContent =
            formatStatus(
                data.status
            );


        status.className =
            `status-badge status-${data.status || "pending"}`;

    }

}


/* =========================================================
   CUSTOMER
========================================================= */

function renderCustomer(data) {

    const container =
        document.querySelector(
            "#customerGrid"
        );


    if (!container) {

        return;

    }


    const phone =
        data.customer_phone
            ? `
                <a href="tel:${escapeHtml(
                    data.customer_phone
                )}">
                    ${escapeHtml(
                        data.customer_phone
                    )}
                </a>
            `
            : "—";


    const email =
        data.customer_email
            ? `
                <a href="mailto:${escapeHtml(
                    data.customer_email
                )}">
                    ${escapeHtml(
                        data.customer_email
                    )}
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
                    data.customer_name ||
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
                    data.service_name ||
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
                    data.customer_address ||
                    "—"
                )}
            </p>

        </div>

    `;

}


/* =========================================================
   SERVICE DEFINITION
========================================================= */

function getServiceName(data) {

    return (
        data?.service_name ||
        data?.service?.name?.en ||
        data?.service?.name?.ms ||
        data?.service?.name ||
        ""
    );

}


function findServiceDefinition(data) {

    if (!data) {

        return null;

    }


    const possibleIds = [

        data.service_id,

        data.serviceId,

        data.service?.id,

        data.service?.service_id,

        data.service?.serviceId,

        data.service?.code,

        data.service_type,

        data.serviceType

    ];


    for (
        const id of possibleIds
    ) {

        const code =
            String(id || "")
                .trim()
                .toLowerCase();


        if (
            code &&
            SERVICE_CATALOG[code]
        ) {

            return SERVICE_CATALOG[code];

        }

    }


    /*
     * Fallback:
     * Match service by display name.
     */

    const serviceName =
        String(
            getServiceName(data)
        )
            .trim()
            .toLowerCase();


    if (!serviceName) {

        return null;

    }


    return (
        Object.values(
            SERVICE_CATALOG
        ).find(
            service => {

                const english =
                    String(
                        service?.name?.en ||
                        ""
                    )
                        .trim()
                        .toLowerCase();


                const malay =
                    String(
                        service?.name?.ms ||
                        ""
                    )
                        .trim()
                        .toLowerCase();


                return (
                    english ===
                        serviceName ||
                    malay ===
                        serviceName
                );

            }
        ) ||
        null
    );

}


function getAnswerCode(answer) {

    return String(

        answer?.question_code ||

        answer?.question_id ||

        answer?.questionId ||

        answer?.question?.id ||

        answer?.code ||

        ""

    )
        .trim()
        .toLowerCase();

}


function findQuestionDefinition(
    serviceDef,
    answer
) {

    if (
        !serviceDef ||
        !Array.isArray(
            serviceDef.questions
        )
    ) {

        return null;

    }


    /*
     * =====================================================
     * 1. Try question code
     * =====================================================
     */

    const code =
        getAnswerCode(
            answer
        );


    if (code) {

        const codeMatch =
            serviceDef.questions.find(
                question =>

                    String(
                        question?.id ||
                        ""
                    )
                        .trim()
                        .toLowerCase() ===
                    code
            );


        if (codeMatch) {

            return codeMatch;

        }

    }


    /*
     * =====================================================
     * 2. Match by backend question title
     * =====================================================
     *
     * Example:
     *
     * API:
     * "What are you securing?"
     *
     * services.js:
     * "What are you securing?"
     *
     * → same question
     */

    const backendQuestion =
        String(
            answer?.question_en ||
            answer?.question?.en ||
            ""
        )
            .trim()
            .toLowerCase();


    if (backendQuestion) {

        const titleMatch =
            serviceDef.questions.find(
                question => {

                    const englishTitle =
                        String(
                            question?.title?.en ||
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    const malayTitle =
                        String(
                            question?.title?.ms ||
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    return (
                        englishTitle ===
                            backendQuestion ||
                        malayTitle ===
                            backendQuestion
                    );

                }
            );


        if (titleMatch) {

            return titleMatch;

        }

    }


    return null;

}


/* =========================================================
   QUESTION TITLE
========================================================= */

function getConfiguredQuestionTitle(
    questionDef
) {

    if (!questionDef) {

        return "";

    }


    return (
        questionDef.title?.en ||
        questionDef.title?.ms ||
        questionDef.title ||
        ""
    );

}


/* =========================================================
   QUESTION DISPLAY LABEL
========================================================= */

function getQuestionDisplayLabel(
    answer,
    questionDef = null
) {

    /*
     * =====================================================
     * 1. USE BACKEND QUESTION TEXT FIRST
     * =====================================================
     *
     * The technician API already returns:
     *
     * question_en
     * question_ms
     *
     * These are the actual questions used when
     * the customer submitted the request.
     */

    const backendQuestionCandidates = [

        answer?.question_en,

        answer?.question?.en,

        answer?.question?.title?.en,

        answer?.title_en,

        answer?.label_en,

        answer?.field_label_en,

        answer?.field_label,

        answer?.question_ms,

        answer?.question?.ms

    ];


    for (
        const candidate
        of backendQuestionCandidates
    ) {

        const text =
            String(
                candidate || ""
            ).trim();


        if (
            text &&
            text.toLowerCase() !==
                "customer requirement"
        ) {

            return text;

        }

    }


    /*
     * =====================================================
     * 2. USE services.js QUESTION TITLE
     * =====================================================
     */

    const configuredTitle =
        getConfiguredQuestionTitle(
            questionDef
        );


    if (
        configuredTitle &&
        String(
            configuredTitle
        )
            .trim()
            .toLowerCase() !==
            "customer requirement"
    ) {

        return configuredTitle;

    }


    /*
     * =====================================================
     * 3. ONLY USE QUESTION CODE IF IT IS A REAL CODE
     * =====================================================
     */

    const code =
        getAnswerCode(
            answer
        );


    /*
     * IMPORTANT:
     *
     * question_id is a UUID such as:
     *
     * 1b5d883f-649c-46e8-9f2c-933f05cafc2f
     *
     * NEVER display that as the question.
     */

    const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
            .test(code);


    if (
        code &&
        !isUuid
    ) {

        return formatLabel(
            code
        );

    }


    /*
     * =====================================================
     * 4. FINAL FALLBACK
     * =====================================================
     */

    return "Customer Requirement";

}

/* =========================================================
   OPTION LABEL
========================================================= */

function resolveConfiguredOptionLabel(
    questionDef,
    rawValue
) {

    if (
        !questionDef ||
        !Array.isArray(
            questionDef.options
        )
    ) {

        return null;

    }


    const token =
        String(
            rawValue ?? ""
        )
            .trim()
            .toLowerCase();


    if (!token) {

        return null;

    }


    /*
     * Object-style options
     */

    const objectMatch =
        questionDef.options.find(
            option => {

                if (
                    !option ||
                    Array.isArray(option)
                ) {

                    return false;

                }


                const optionValue =
                    String(
                        option.value ??
                        option.id ??
                        ""
                    )
                        .trim()
                        .toLowerCase();


                return (
                    optionValue ===
                    token
                );

            }
        );


    if (objectMatch) {

        return (
            objectMatch.label?.en ||
            objectMatch.label?.ms ||
            objectMatch.label ||
            objectMatch.name ||
            null
        );

    }


    /*
     * Array/string-style options
     */

    const arrayMatch =
        questionDef.options.find(
            option => {

                if (
                    typeof option ===
                    "string"
                ) {

                    return (
                        option
                            .trim()
                            .toLowerCase() ===
                        token
                    );

                }


                if (
                    Array.isArray(option)
                ) {

                    return option.some(
                        value =>
                            String(value)
                                .trim()
                                .toLowerCase() ===
                            token
                    );

                }


                return false;

            }
        );


    if (
        typeof arrayMatch ===
        "string"
    ) {

        return arrayMatch;

    }


    if (
        Array.isArray(
            arrayMatch
        )
    ) {

        return arrayMatch
            .map(
                value =>
                    String(value)
            )
            .join(
                " / "
            );

    }


    return null;

}


/* =========================================================
   COUNTER VALUE
========================================================= */

function formatConfiguredCounterValues(
    questionDef,
    value
) {

    const parsed =
        parseJsonValue(
            value
        );


    if (
        !parsed ||
        typeof parsed !==
            "object" ||
        Array.isArray(parsed)
    ) {

        return null;

    }


    const counters =
        Array.isArray(
            questionDef?.counters
        )
            ? questionDef.counters
            : [];


    return Object.entries(
        parsed
    )
        .map(
            ([key, count]) => {

                const counter =
                    counters.find(
                        item =>
                            String(
                                item?.id ||
                                item?.value ||
                                ""
                            )
                                .trim()
                                .toLowerCase() ===
                            String(key)
                                .trim()
                                .toLowerCase()
                    );


                const label =
                    counter?.label?.en ||
                    counter?.label?.ms ||
                    counter?.label ||
                    formatLabel(
                        key
                    );


                return `${label}: ${count}`;

            }
        )
        .join(
            " • "
        );

}


/* =========================================================
   FORMAT UNIT
========================================================= */

function formatUnit(unit) {

    if (
        unit === null ||
        unit === undefined ||
        unit === ""
    ) {

        return "";

    }


    if (
        typeof unit === "string" ||
        typeof unit === "number"
    ) {

        return String(unit);

    }


    if (
        Array.isArray(unit)
    ) {

        return unit
            .map(
                item =>
                    formatUnit(item)
            )
            .filter(Boolean)
            .join(", ");

    }


    if (
        typeof unit === "object"
    ) {

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
            const value
            of possibleValues
        ) {

            if (
                value !== null &&
                value !== undefined &&
                value !== ""
            ) {

                return typeof value ===
                    "object"
                    ? formatUnit(value)
                    : String(value);

            }

        }

    }


    return "";

}


/* =========================================================
   FORMAT LABEL
========================================================= */

function formatLabel(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "";

    }


    return String(value)

        .replace(
            /[_-]+/g,
            " "
        )

        .replace(
            /\s+/g,
            " "
        )

        .trim()

        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );

}


/* =========================================================
   FORMAT VALUE TEXT
========================================================= */

function formatValueText(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    if (
        typeof value ===
        "object"
    ) {

        return Object.entries(
            value
        )
            .map(
                ([key, item]) =>
                    `${formatLabel(key)}: ${item}`
            )
            .join(
                " • "
            );

    }


    return formatReadableValue(
        String(value)
    );

}


/* =========================================================
   FORMAT READABLE VALUE
========================================================= */

function formatReadableValue(value) {

    if (!value) {

        return "Not specified";

    }


    let result =
        String(value)
            .trim()
            .replace(
                /[_-]+/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            );


    result =
        result.replace(
            /\b1080p\b/gi,
            "1080P"
        );


    result =
        result.replace(
            /\b2mp\b/gi,
            "2MP"
        );


    result =
        result.replace(
            /\b4u\b/gi,
            "4U"
        );


    return result;

}
/* =========================================================
   GET ANSWER DISPLAY VALUE
========================================================= */

function getAnswerDisplayValue(
    answer,
    questionDef = null
) {

    /*
     * ------------------------------------------------------
     * 1. COUNTER
     * ------------------------------------------------------
     */

    if (
        answer?.question_type === "counter" ||
        answer?.type === "counter" ||
        questionDef?.type === "counter"
    ) {

        const counterValue =
            answer?.text_value ??
            answer?.answer;


        const configuredCounter =
            formatConfiguredCounterValues(
                questionDef,
                counterValue
            );


        if (configuredCounter) {

            return configuredCounter;

        }

    }


    /*
     * ------------------------------------------------------
     * 2. BACKEND OPTIONS ARRAY
     * ------------------------------------------------------
     */

    if (
        Array.isArray(
            answer?.options
        ) &&
        answer.options.length
    ) {

        const optionValues =
            answer.options
                .map(option => {

                    const rawValue =
                        option?.value ??
                        option?.option_value ??
                        option?.id ??
                        option?.option_id ??
                        option;


                    /*
                     * First use services.js
                     */

                    const configuredLabel =
                        resolveConfiguredOptionLabel(
                            questionDef,
                            rawValue
                        );


                    if (configuredLabel) {

                        return configuredLabel;

                    }


                    /*
                     * Backend label fallback
                     */

                    return (
                        option?.option_label_en ||
                        option?.label?.en ||
                        option?.label?.ms ||
                        option?.option_value ||
                        option?.value ||
                        ""
                    );

                })
                .filter(Boolean);


        const uniqueOptions =
            removeDuplicateValues(
                optionValues
            );


        if (
            uniqueOptions.length
        ) {

            return uniqueOptions.join(
                " • "
            );

        }

    }


    /*
     * ------------------------------------------------------
     * 3. answer.answer
     * ------------------------------------------------------
     */

    if (
        answer?.answer !== null &&
        answer?.answer !== undefined &&
        String(
            answer.answer
        ).trim() !== ""
    ) {

        const parsed =
            parseJsonValue(
                answer.answer
            );


        /*
         * JSON OBJECT
         */

        if (
            parsed &&
            typeof parsed ===
                "object" &&
            !Array.isArray(parsed)
        ) {

            return Object.entries(
                parsed
            )
                .map(
                    ([key, value]) => {

                        const configuredLabel =
                            resolveConfiguredOptionLabel(
                                questionDef,
                                value
                            );


                        return (
                            configuredLabel ||
                            `${formatLabel(key)}: ${value}`
                        );

                    }
                )
                .join(
                    " • "
                );

        }


        /*
         * JSON ARRAY
         */

        if (
            Array.isArray(parsed)
        ) {

            return removeDuplicateValues(
                parsed.map(
                    value => {

                        const configuredLabel =
                            resolveConfiguredOptionLabel(
                                questionDef,
                                value
                            );


                        return (
                            configuredLabel ||
                            formatValueText(value)
                        );

                    }
                )
            ).join(
                " • "
            );

        }


        /*
         * Single configured option
         */

        const configuredLabel =
            resolveConfiguredOptionLabel(
                questionDef,
                answer.answer
            );


        if (configuredLabel) {

            return configuredLabel;

        }


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
        answer?.number_value !== null &&
        answer?.number_value !== undefined
    ) {

        const rawNumber =
            Number(
                answer.number_value
            );


        let numberValue;


        if (
            !Number.isNaN(
                rawNumber
            )
        ) {

            numberValue =
                Number.isInteger(
                    rawNumber
                )
                    ? String(
                        rawNumber
                    )
                    : String(
                        rawNumber
                    );

        } else {

            numberValue =
                String(
                    answer.number_value
                );

        }


        const unit =
            formatUnit(
                answer.unit ||
                questionDef?.unit
            );


        return unit
            ? `${numberValue} ${unit}`
            : numberValue;

    }


    /*
     * ------------------------------------------------------
     * 5. TEXT VALUE
     * ------------------------------------------------------
     */

    if (
        answer?.text_value !== null &&
        answer?.text_value !== undefined &&
        String(
            answer.text_value
        ).trim() !== ""
    ) {

        const parsed =
            parseJsonValue(
                answer.text_value
            );


        /*
         * JSON OBJECT
         */

        if (
            parsed &&
            typeof parsed ===
                "object" &&
            !Array.isArray(parsed)
        ) {

            return Object.entries(
                parsed
            )
                .map(
                    ([key, value]) => {

                        const configuredLabel =
                            resolveConfiguredOptionLabel(
                                questionDef,
                                value
                            );


                        return (
                            configuredLabel ||
                            `${formatLabel(key)}: ${value}`
                        );

                    }
                )
                .join(
                    " • "
                );

        }


        /*
         * JSON ARRAY
         */

        if (
            Array.isArray(parsed)
        ) {

            return removeDuplicateValues(
                parsed.map(
                    value => {

                        const configuredLabel =
                            resolveConfiguredOptionLabel(
                                questionDef,
                                value
                            );


                        return (
                            configuredLabel ||
                            formatValueText(value)
                        );

                    }
                )
            ).join(
                " • "
            );

        }


        /*
         * Configured option stored
         * inside text_value
         */

        const configuredLabel =
            resolveConfiguredOptionLabel(
                questionDef,
                answer.text_value
            );


        if (configuredLabel) {

            return configuredLabel;

        }


        return normalizeAnswerText(
            answer.text_value
        );

    }


    return "Not specified";

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
        Array.isArray(
            data?.answers
        )
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


    /*
     * Get service definition from
     * services.js.
     */

    const serviceDef =
        findServiceDefinition(
            data
        );


    container.innerHTML =
        answers
            .map(
                (answer, index) => {

                    const questionDef =
                        findQuestionDefinition(
                            serviceDef,
                            answer
                        );


                    const question =
                        getQuestionDisplayLabel(
                            answer,
                            questionDef
                        );


                    const value =
                        getAnswerDisplayValue(
                            answer,
                            questionDef
                        );


                    const formattedValue =
                        formatAnswerForDisplay(
                            value
                        );


                    const description =
                        questionDef?.description?.en ||
                        answer?.description?.en ||
                        "";


                    const unit =
                        formatUnit(
                            answer?.unit ||
                            questionDef?.unit
                        );


                    return `

                        <article class="answer-item">

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
                                    description
                                        ? `
                                            <div class="answer-description">

                                                ${escapeHtml(
                                                    description
                                                )}

                                            </div>
                                        `
                                        : ""
                                }


                                <div class="answer-value">

                                    ${formattedValue}

                                </div>


                                ${
                                    unit
                                        ? `
                                            <div class="answer-unit">

                                                ${escapeHtml(
                                                    unit
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
   FORMAT ANSWER FOR HTML
========================================================= */

function formatAnswerForDisplay(
    value
) {

    if (
        value === null ||
        value === undefined ||
        String(
            value
        ).trim() === ""
    ) {

        return `

            <span class="answer-value-empty">

                Not specified

            </span>

        `;

    }


    const text =
        String(
            value
        ).trim();


    /*
     * Multiple configured values
     */

    if (
        text.includes(
            " • "
        )
    ) {

        const parts =
            text
                .split(
                    " • "
                )
                .map(
                    part =>
                        part.trim()
                )
                .filter(Boolean);


        return `

            <div class="answer-value-list">

                ${parts
                    .map(
                        part => `

                            <span class="answer-value-chip">

                                ${escapeHtml(
                                    part
                                )}

                            </span>

                        `
                    )
                    .join("")}

            </div>

        `;

    }


    return `

        <span class="answer-value-main">

            ${escapeHtml(
                text
            )}

        </span>

    `;

}


/* =========================================================
   PARSE JSON VALUE
========================================================= */

function parseJsonValue(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return null;

    }


    if (
        typeof value ===
        "object"
    ) {

        return value;

    }


    const text =
        String(
            value
        ).trim();


    if (
        !text.startsWith(
            "{"
        ) &&
        !text.startsWith(
            "["
        )
    ) {

        return null;

    }


    try {

        return JSON.parse(
            text
        );

    } catch (error) {

        return null;

    }

}


/* =========================================================
   NORMALIZE ANSWER TEXT
========================================================= */

function normalizeAnswerText(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "Not specified";

    }


    const text =
        String(
            value
        ).trim();


    if (!text) {

        return "Not specified";

    }


    /*
     * Remove duplicate comma-separated
     * values.
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


        return removeDuplicateValues(
            parts
        ).join(
            ", "
        );

    }


    return text;

}


/* =========================================================
   REMOVE DUPLICATE VALUES
========================================================= */

function removeDuplicateValues(
    values
) {

    const seen =
        new Set();


    return values.filter(
        value => {

            const normalized =
                String(
                    value
                )
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
            data.customer_notes ||
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
                (
                    photo,
                    index
                ) => {

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
                                rawPath.startsWith(
                                    "/"
                                )
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
                                        `Customer Photo ${
                                            index + 1
                                        }`
                                    )}"
                                    loading="lazy"
                                >

                            </a>


                            <div class="photo-info">

                                <strong>

                                    ${escapeHtml(
                                        photo.file_name ||
                                        `Customer Photo ${
                                            index + 1
                                        }`
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
   EXISTING REPORTS
========================================================= */

function renderExistingReports(
    data
) {

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


    const reports =
        Array.isArray(
            data.reports
        )
            ? data.reports
            : (
                data.report
                    ? [data.report]
                    : []
            );


    if (!reports.length) {

        card.hidden =
            true;

        container.innerHTML =
            "";

        return;

    }


    card.hidden =
        false;


    const ordered =
        [
            ...reports
        ].sort(
            (
                a,
                b
            ) =>
                new Date(
                    a.created_at ||
                    a.submitted_at ||
                    0
                ) -
                new Date(
                    b.created_at ||
                    b.submitted_at ||
                    0
                )
        );


    const latestFinal =
        [
            ...reports
        ]
            .filter(
                report =>
                    report.report_type ===
                    "final"
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    new Date(
                        b.created_at ||
                        b.submitted_at ||
                        0
                    ) -
                    new Date(
                        a.created_at ||
                        a.submitted_at ||
                        0
                    )
            )[0] ||
            null;


    const workReportCard =
        document.querySelector(
            "#workReportCard"
        );


    if (workReportCard) {

        /*
         * Final report submitted/approved
         * → hide form
         */

        if (
            latestFinal &&
            (
                latestFinal.status ===
                    "submitted" ||
                latestFinal.status ===
                    "approved"
            )
        ) {

            workReportCard.hidden =
                true;

        }


        /*
         * Final report rejected
         * → allow resubmission
         */

        else if (
            latestFinal &&
            latestFinal.status ===
                "rejected" &&
            requestData?.status ===
                "in_progress"
        ) {

            workReportCard.hidden =
                false;

        }


        /*
         * Normal in-progress job
         */

        else if (
            requestData?.status ===
            "in_progress"
        ) {

            workReportCard.hidden =
                false;

        }


        /*
         * Other statuses
         */

        else {

            workReportCard.hidden =
                true;

        }

    }


    container.innerHTML = `

        <div class="progress-timeline">

            ${ordered
                .map(
                    (
                        report,
                        index
                    ) => {

                        const isFinal =
                            report.report_type ===
                            "final";


                        const title =
                            report.report_title ||
                            (
                                isFinal
                                    ? "Final Work Report"
                                    : `Progress Update ${
                                        report.progress_number ||
                                        index + 1
                                    }`
                            );


                        const status =
                            report.status ||
                            "submitted";


                        const media =
                            Array.isArray(
                                report.media
                            )
                                ? report.media
                                : [];


                        return `

                            <article
                                class="progress-item ${
                                    isFinal
                                        ? "progress-item-final"
                                        : ""
                                }"
                            >

                                <div class="progress-marker">

                                    ${
                                        isFinal
                                            ? "✓"
                                            : (
                                                report.progress_number ||
                                                index + 1
                                            )
                                    }

                                </div>


                                <div class="progress-content">

                                    <div class="progress-header">

                                        <div>

                                            <div class="progress-kicker">

                                                ${
                                                    isFinal
                                                        ? "FINAL REPORT"
                                                        : `PROGRESS ${
                                                            report.progress_number ||
                                                            index + 1
                                                        }`
                                                }

                                            </div>


                                            <h3>

                                                ${escapeHtml(
                                                    title
                                                )}

                                            </h3>

                                        </div>


                                        <div class="progress-header-right">

                                            <span
                                                class="progress-status progress-status-${escapeHtml(
                                                    status
                                                )}"
                                            >

                                                ${escapeHtml(
                                                    formatReportStatus(
                                                        status,
                                                        isFinal
                                                    )
                                                )}

                                            </span>


                                            <time>

                                                ${escapeHtml(
                                                    formatDate(
                                                        report.submitted_at ||
                                                        report.created_at
                                                    )
                                                )}

                                            </time>

                                        </div>

                                    </div>


                                    <div class="progress-detail-grid">

                                        <div class="progress-detail">

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


                                        <div class="progress-detail">

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


                                        <div class="progress-detail">

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


                                        <div class="progress-detail">

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


                                        <div class="progress-detail">

                                            <span>
                                                Reported By
                                            </span>

                                            <p class="report-writer-display">

                                                ${escapeHtml(
                                                    report.reported_by ||
                                                    "—"
                                                )}

                                            </p>

                                        </div>

                                    </div>


                                    ${
                                        media.length
                                            ? `

                                                <div class="progress-media">

                                                    <div class="progress-media-label">

                                                        Attached Media · ${
                                                            media.length
                                                        }

                                                    </div>


                                                    <div class="progress-media-grid">

                                                        ${media
                                                            .map(
                                                                file => {

                                                                    const isImage =
                                                                        file.media_type ===
                                                                        "image";


                                                                    return isImage

                                                                        ? `

                                                                            <a
                                                                                href="${escapeHtml(
                                                                                    file.file_path
                                                                                )}"
                                                                                target="_blank"
                                                                                rel="noopener"
                                                                            >

                                                                                <img
                                                                                    src="${escapeHtml(
                                                                                        file.file_path
                                                                                    )}"
                                                                                    alt="${escapeHtml(
                                                                                        file.file_name ||
                                                                                        "Report photo"
                                                                                    )}"
                                                                                >

                                                                            </a>

                                                                        `

                                                                        : `

                                                                            <a
                                                                                class="progress-video"
                                                                                href="${escapeHtml(
                                                                                    file.file_path
                                                                                )}"
                                                                                target="_blank"
                                                                                rel="noopener"
                                                                            >

                                                                                ▶ View Video

                                                                            </a>

                                                                        `;

                                                                }
                                                            )
                                                            .join("")}

                                                    </div>

                                                </div>

                                            `
                                            : ""
                                    }


                                    ${
                                        report.review_remarks
                                            ? `

                                                <div class="progress-review-remarks">

                                                    <strong>
                                                        Admin Feedback
                                                    </strong>

                                                    <p>

                                                        ${escapeHtml(
                                                            report.review_remarks
                                                        )}

                                                    </p>

                                                </div>

                                            `
                                            : ""
                                    }

                                </div>

                            </article>

                        `;

                    }
                )
                .join("")}

        </div>

    `;

}


function formatReportStatus(
    status,
    isFinal
) {

    if (
        !isFinal &&
        status === "approved"
    ) {

        return "Recorded";

    }


    const labels = {

        draft:
            "Draft",

        submitted:
            "Awaiting Admin Review",

        approved:
            "Approved",

        rejected:
            "Rejected"

    };


    return (
        labels[status] ||
        formatStatus(status) ||
        "Unknown"
    );

}

/* =========================================================
   JOB ACTION
========================================================= */

function renderJobAction(data) {

    const button =
        document.querySelector(
            "#startJobButton"
        );

    const title =
        document.querySelector(
            "#jobActionTitle"
        );

    const description =
        document.querySelector(
            "#jobActionDescription"
        );

    const workReportCard =
        document.querySelector(
            "#workReportCard"
        );


    if (!button) {

        return;

    }


    const status =
        data?.status ||
        "pending";


    const reports =
        Array.isArray(
            data?.reports
        )
            ? data.reports
            : (
                data?.report
                    ? [data.report]
                    : []
            );


    /*
     * Find latest final report.
     */

    const finalReports =
        reports
            .filter(
                report =>
                    report.report_type ===
                    "final"
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    new Date(
                        b.submitted_at ||
                        b.created_at ||
                        0
                    ) -
                    new Date(
                        a.submitted_at ||
                        a.created_at ||
                        0
                    )
            );


    const latestFinal =
        finalReports[0] ||
        null;


    /*
     * ------------------------------------------------------
     * ASSIGNED
     * ------------------------------------------------------
     */

    if (
        status ===
        "assigned"
    ) {

        if (workReportCard) {

            workReportCard.hidden =
                true;

        }


        button.hidden =
            false;


        button.disabled =
            false;


        button.textContent =
            "Start Job";


        if (title) {

            title.textContent =
                "Ready to start";

        }


        if (description) {

            description.textContent =
                "Confirm the job details, then start the assigned work.";

        }


        return;

    }


    /*
     * ------------------------------------------------------
     * IN PROGRESS
     * ------------------------------------------------------
     */

    if (
        status ===
        "in_progress"
    ) {

        button.hidden =
            true;


        /*
         * Final report submitted.
         */

        if (
            latestFinal &&
            latestFinal.status ===
                "submitted"
        ) {

            if (workReportCard) {

                workReportCard.hidden =
                    true;

            }


            if (title) {

                title.textContent =
                    "Final Report Submitted";

            }


            if (description) {

                description.textContent =
                    "Your final report has been submitted successfully and is now waiting for Admin review.";

            }


            return;

        }


        /*
         * Final report rejected.
         */

        if (
            latestFinal &&
            latestFinal.status ===
                "rejected"
        ) {

            if (workReportCard) {

                workReportCard.hidden =
                    false;

            }


            if (title) {

                title.textContent =
                    "Final Report Requires Revision";

            }


            if (description) {

                description.textContent =
                    "The Admin has rejected the final report. Please review the feedback and submit the report again.";

            }


            return;

        }


        /*
         * Normal work.
         */

        if (workReportCard) {

            workReportCard.hidden =
                false;

        }


        if (title) {

            title.textContent =
                "Job in progress";

        }


        if (description) {

            description.textContent =
                "You can add progress updates or submit the final report when the work is complete.";

        }


        return;

    }


    /*
     * ------------------------------------------------------
     * AWAITING PAYMENT
     * ------------------------------------------------------
     */

    if (
        status ===
        "awaiting_payment"
    ) {

        button.hidden =
            true;


        if (workReportCard) {

            workReportCard.hidden =
                true;

        }


        if (title) {

            title.textContent =
                "Awaiting Payment";

        }


        if (description) {

            description.textContent =
                "Your final report has been approved. The service request is now waiting for the customer payment to be verified by Admin.";

        }


        return;

    }


    /*
     * ------------------------------------------------------
     * COMPLETED
     * ------------------------------------------------------
 */

    if (
        status ===
        "completed"
    ) {

        button.hidden =
            true;


        if (workReportCard) {

            workReportCard.hidden =
                true;

        }


        if (title) {

            title.textContent =
                "Job completed";

        }


        if (description) {

            description.textContent =
                "This service request has been completed.";

        }


        return;

    }


    /*
     * ------------------------------------------------------
     * CANCELLED
     * ------------------------------------------------------
     */

    if (
        status ===
        "cancelled"
    ) {

        button.hidden =
            true;


        if (workReportCard) {

            workReportCard.hidden =
                true;

        }


        if (title) {

            title.textContent =
                "Job cancelled";

        }


        if (description) {

            description.textContent =
                "This service request is no longer active.";

        }


        return;

    }


    /*
     * ------------------------------------------------------
     * OTHER STATUS
     * ------------------------------------------------------
     */

    button.hidden =
        true;


    if (workReportCard) {

        workReportCard.hidden =
            true;

    }


    if (title) {

        title.textContent =
            "Job status";

    }


    if (description) {

        description.textContent =
            `Current status: ${formatStatus(status)}.`;

    }

}


/* =========================================================
   START JOB
========================================================= */

async function startJob() {

    const requestId =
        getRequestId();


    const token =
        getToken();


    const button =
        document.querySelector(
            "#startJobButton"
        );


    const message =
        document.querySelector(
            "#jobActionMessage"
        );


    if (
        !requestId ||
        !token ||
        !button
    ) {

        return;

    }


    const confirmed =
        window.confirm(
            "Start this assigned job now?"
        );


    if (!confirmed) {

        return;

    }


    try {

        button.disabled =
            true;


        button.textContent =
            "Starting...";


        const response =
            await fetch(
                `${API_BASE}/technician/requests/${encodeURIComponent(requestId)}/start`,
                {

                    method:
                        "POST",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`

                    }

                }
            );


        const result =
            await parseResponse(
                response
            );


        if (result.data) {

            requestData = {
                ...requestData,
                ...result.data
            };

        }


        requestData.status =
            result.data?.status ||
            "in_progress";


        renderRequest(
            requestData
        );


        if (message) {

            message.hidden =
                false;


            message.textContent =
                result.message ||
                "Job started successfully.";

        }


    } catch (error) {

        console.error(
            "Start job error:",
            error
        );


        if (
            handleAuthError(
                error
            )
        ) {

            return;

        }


        if (message) {

            message.hidden =
                false;


            message.textContent =
                error.message ||
                "Unable to start the job.";

        }


        button.disabled =
            false;


        button.textContent =
            "Start Job";

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


    container.innerHTML =
        "";


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


    selectedCompletionMedia.forEach(
        (
            file,
            index
        ) => {

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
     * REMOVE MEDIA
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


                        selectedCompletionMedia
                            .splice(
                                index,
                                1
                            );


                        renderMediaPreview();

                    }
                );

            }
        );

}


/* =========================================================
   ADD COMPLETION MEDIA
========================================================= */

function addCompletionMedia(
    files
) {

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


    for (
        const file of newFiles
    ) {

        /*
         * File type
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
         * File size
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
         * Prevent duplicate file.
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


        selectedCompletionMedia.push(
            file
        );

    }


    /*
     * Maximum 10 files.
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


    renderMediaPreview();

}


/* =========================================================
   FILE SIZE
========================================================= */

function formatFileSize(
    bytes
) {

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
     * Do not use input.files.
     *
     * selectedCompletionMedia is the
     * persistent file list.
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
     * Maximum files.
     */

    if (
        files.length >
        10
    ) {

        return {

            valid:
                false,

            message:
                "You can upload a maximum of 10 photos/videos."

        };

    }


    /*
     * Validate each file.
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

                valid:
                    false,

                message:
                    `${file.name} is not a supported image or video format.`

            };

        }


        if (
            file.size >
            maxSize
        ) {

            return {

                valid:
                    false,

                message:
                    `${file.name} is larger than the 100 MB limit.`

            };

        }

    }


    return {

        valid:
            true

    };

}


/* =========================================================
   SUBMIT WORK REPORT
========================================================= */

async function submitReport(
    event
) {

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


    if (
        !button ||
        !form
    ) {

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


    const reportType =
        document.querySelector(
            "#reportType"
        )?.value ||
        "progress";


    /*
     * Final report confirmation.
     */

    if (
        reportType ===
        "final"
    ) {

        const confirmed =
            window.confirm(

                "Submit this as the FINAL REPORT?\n\n" +

                "After submission, the report will be sent to Admin for review. " +

                "You will not be able to submit another update unless Admin rejects the report."

            );


        if (!confirmed) {

            return;

        }

    }


    const reportTitle =
        String(
            document.querySelector(
                "#reportTitle"
            )?.value ||
            ""
        ).trim();


    /*
     * Work performed is required.
     */

    if (!workPerformed) {

        showReportMessage(
            "Please describe the work you performed.",
            "error"
        );

        return;

    }


    /*
     * Add report data.
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


    formData.append(
        "report_type",
        reportType
    );


    formData.append(
        "report_title",
        reportTitle
    );


    /* =====================================================
       REPORTED BY
    ===================================================== */

    let reportedBy =
        "";


    const headTechnician =
        document.getElementById(
            "reportedByHead"
        );


    const technicianOne =
        document.getElementById(
            "reportedByTechnician"
        );


    if (
        headTechnician &&
        headTechnician.checked
    ) {

        reportedBy =
            headTechnician.value;

    }

    else if (
        technicianOne &&
        technicianOne.checked
    ) {

        reportedBy =
            technicianOne.value;

    }


    console.log(
        "REPORT WRITTEN BY:",
        reportedBy
    );


    if (!reportedBy) {

        showReportMessage(
            "Please select who wrote this report.",
            "error"
        );


        button.disabled =
            false;


        button.textContent =
            reportType ===
            "final"

                ? "Submit Final Report"

                : "Submit Progress Update";


        return;

    }


    formData.append(
        "reported_by",
        reportedBy
    );


    /*
     * ------------------------------------------------------
     * ADD ALL MEDIA
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
                     * Do NOT manually set
                     * Content-Type.
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
         * Clear selected media.
         */

        selectedCompletionMedia =
            [];


        /*
         * Reset form.
         */

        form.reset();


        /*
         * Clear preview.
         */

        renderMediaPreview();


        /*
         * Reload request.
         */

        await loadRequest();


    } catch (error) {

        console.error(
            "Submit report error:",
            error
        );


        if (
            handleAuthError(
                error
            )
        ) {

            return;

        }


        showReportMessage(
            error.message ||
            "Unable to submit work report.",
            "error"
        );

    } finally {

        button.disabled =
            false;


        button.textContent =
            document.querySelector(
                "#reportType"
            )?.value ===
            "final"

                ? "Submit Final Report"

                : "Submit Progress Update";

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
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /*
         * Check technician login.
         */

        if (
            !requireToken()
        ) {

            return;

        }


        /*
         * Work report form.
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
         * Start job.
         */

        const startButton =
            document.querySelector(
                "#startJobButton"
            );


        if (startButton) {

            startButton.addEventListener(
                "click",
                startJob
            );

        }


        /*
         * Report type controls.
         */

        const reportTypeInput =
            document.querySelector(
                "#reportType"
            );


        const reportTitleInput =
            document.querySelector(
                "#reportTitle"
            );


        const submitTitle =
            document.querySelector(
                "#reportSubmitTitle"
            );


        const submitDescription =
            document.querySelector(
                "#reportSubmitDescription"
            );


        const submitButton =
            document.querySelector(
                "#submitReportButton"
            );


        const updateReportTypeUI =
            () => {

                const isFinal =
                    reportTypeInput?.value ===
                    "final";


                if (submitTitle) {

                    submitTitle.textContent =
                        isFinal

                            ? "Ready to submit final report?"

                            : "Add a progress update";

                }


                if (submitDescription) {

                    submitDescription.textContent =
                        isFinal

                            ? "The final report will be sent to the admin for review."

                            : "This update will be recorded in the service progress timeline.";

                }


                if (submitButton) {

                    submitButton.textContent =
                        isFinal

                            ? "Submit Final Report"

                            : "Submit Progress Update";

                }


                if (
                    reportTitleInput &&
                    !reportTitleInput.value
                ) {

                    reportTitleInput.placeholder =
                        isFinal

                            ? "e.g. Final Repair Completed"

                            : "e.g. Initial Inspection, Diagnosis, Repair";

                }

            };


        if (reportTypeInput) {

            reportTypeInput.addEventListener(
                "change",
                updateReportTypeUI
            );


            updateReportTypeUI();

        }


        /*
         * Completion media input.
         */

        const mediaInput =
            document.querySelector(
                "#completionMedia"
            );


        if (mediaInput) {

            mediaInput.addEventListener(
                "change",
                event => {

                    addCompletionMedia(
                        event.target.files
                    );


                    /*
                     * Clear input so technician
                     * can select more files.
                     */

                    event.target.value =
                        "";

                }
            );

        }


        /*
         * Initial media preview.
         */

        renderMediaPreview();


        /*
         * Load request.
         */

        loadRequest();

    }
);