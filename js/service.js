const API_BASE = "http://localhost:5001/api";

let currentLanguage =
    localStorage.getItem("securepro_language") || "en";

let service = null;

let currentQuestion = 0;

const answers = {};


/* =========================================================
   TRANSLATIONS
========================================================= */

const translations = {

    en: {
        back: "Back to services",
        previous: "Previous",
        next: "Next",
        finish: "Continue",
        required: "Please answer this question.",
        question: "Question",
        upload: "Click to upload photos",
        uploadHint: "JPG, PNG or WebP"
    },

    ms: {
        back: "Kembali ke servis",
        previous: "Sebelum",
        next: "Seterusnya",
        finish: "Teruskan",
        required: "Sila jawab soalan ini.",
        question: "Soalan",
        upload: "Klik untuk muat naik gambar",
        uploadHint: "JPG, PNG atau WebP"
    }

};


/* =========================================================
   LANGUAGE
========================================================= */

function getLanguageText(value) {

    if (!value) return "";

    if (typeof value === "string") {
        return value;
    }

    return value[currentLanguage]
        || value.en
        || "";
}


/* =========================================================
   GET SERVICE ID
========================================================= */

function getServiceId() {

    const params =
        new URLSearchParams(window.location.search);

    return params.get("service");
}


/* =========================================================
   CONDITIONAL QUESTIONS
========================================================= */

/*
   A question without showIf is always visible.

   Example:

   showIf: {
       question: "gate_status",
       equals: "need_new_gate"
   }
*/

function getVisibleQuestions() {

    if (!service) {
        return [];
    }

    return service.questions.filter(question => {

        if (!question.showIf) {
            return true;
        }

        const condition =
            question.showIf;

        return answers[condition.question] ===
            condition.equals;

    });
}


function getCurrentQuestion() {

    const visibleQuestions =
        getVisibleQuestions();

    return visibleQuestions[currentQuestion] || null;
}


function getQuestionIndexById(questionId) {

    const visibleQuestions =
        getVisibleQuestions();

    return visibleQuestions.findIndex(
        question =>
            question.id === questionId
    );
}


/* =========================================================
   LOAD SERVICE
========================================================= */

async function loadService() {

    const serviceId =
        getServiceId();

    if (!serviceId) {

        showError(
            currentLanguage === "en"
                ? "No service was selected."
                : "Tiada servis dipilih."
        );

        return;
    }

    try {

        const response =
            await fetch(
                `${API_BASE}/services/${encodeURIComponent(serviceId)}`
            );

        if (!response.ok) {
            throw new Error("Service not found.");
        }

        const result =
            await response.json();

        if (!result.success) {
            throw new Error(
                "Unable to load service."
            );
        }

        service =
            result.data;

        currentQuestion =
            0;

        renderService();

    } catch (error) {

        console.error(error);

        showError(
            currentLanguage === "en"
                ? "Unable to load this service."
                : "Tidak dapat memuatkan servis ini."
        );
    }
}


/* =========================================================
   RENDER SERVICE
========================================================= */

/* =========================================================
   RENDER SERVICE
========================================================= */

function renderService() {

    if (!service) {
        return;
    }

    document.title =
        `SecurePro | ${getLanguageText(service.name)}`;


    const title =
        document.querySelector("#serviceTitle");

    const description =
        document.querySelector("#serviceDescription");


    if (title) {

        title.textContent =
            getLanguageText(service.name);

    }


    if (description) {

        description.textContent =
            currentLanguage === "en"
                ? "Answer the questions below so we can understand your requirements."
                : "Jawab soalan di bawah supaya kami dapat memahami keperluan anda.";

    }


    renderQuestion();

    updateProgress();

}


/* =========================================================
   RENDER QUESTION
========================================================= */

function renderQuestion() {

    const container =
        document.querySelector(
            "#questionContainer"
        );

    const question =
        getCurrentQuestion();

    if (!question) {
        return;
    }

    const visibleQuestions =
        getVisibleQuestions();

    const number =
        currentQuestion + 1;

    let html = `
        <div class="question-card">

            <div class="question-number">
                ${translations[currentLanguage].question}
                ${number}
            </div>

            <h2 class="question-title">
                ${escapeHtml(
                    getLanguageText(question.title)
                )}
            </h2>
    `;


    if (question.description) {

        html += `
            <p class="question-description">
                ${escapeHtml(
                    getLanguageText(
                        question.description
                    )
                )}
            </p>
        `;
    }


    if (question.subtitle) {

        html += `
            <p class="question-description">
                ${escapeHtml(
                    getLanguageText(
                        question.subtitle
                    )
                )}
            </p>
        `;
    }


    html +=
        renderQuestionInput(question);

    html += `
        </div>
    `;

    container.innerHTML =
        html;

    restoreAnswer(question);

    updateNavigation();
}


/* =========================================================
   RENDER QUESTION INPUT
========================================================= */

function renderQuestionInput(question) {

    switch (question.type) {

        case "single":
            return renderSingle(question);

        case "multi":
            return renderMulti(question);

        case "number":
            return renderNumber(question);

        case "text":
            return renderText(question);

        case "counter":
            return renderCounter(question);

        case "textarea":
            return renderTextarea(question);

        case "file":
            return renderFile(question);

        default:

            return `
                <div class="question-error">
                    Unsupported question type:
                    ${escapeHtml(question.type)}
                </div>
            `;
    }
}


/* =========================================================
   SINGLE
========================================================= */

function renderSingle(question) {

    return `
        <div class="options">

            ${question.options.map((option, index) => {

                let value = "";
                let label = "";
                let description = "";

                /*
                   ==========================================
                   OBJECT FORMAT
                   ==========================================

                   {
                       value: "yes",
                       label: {
                           en: "Yes",
                           ms: "Ya"
                       },
                       description: {
                           en: "...",
                           ms: "..."
                       }
                   }
                */

                if (
                    typeof option === "object" &&
                    !Array.isArray(option)
                ) {

                    value =
                        option.value || "";

                    label =
                        getLanguageText(
                            option.label
                        );

                    description =
                        option.description
                            ? getLanguageText(
                                option.description
                            )
                            : "";

                }


                /*
                   ==========================================
                   ARRAY FORMAT
                   ==========================================

                   [
                       value,
                       English label,
                       Malay label,
                       English description,
                       Malay description
                   ]
                */

                else if (Array.isArray(option)) {

                    value =
                        option[0] || "";

                    label =
                        currentLanguage === "ms"
                            ? (
                                option[2] ||
                                option[1] ||
                                ""
                            )
                            : (
                                option[1] || ""
                            );

                    description =
                        currentLanguage === "ms"
                            ? (
                                option[4] ||
                                option[3] ||
                                ""
                            )
                            : (
                                option[3] || ""
                            );

                }


                const optionId =
                    `option-${question.id}-${index}`;


                return `

                    <div class="option">

                        <input
                            type="radio"
                            id="${escapeHtml(optionId)}"
                            name="question"
                            value="${escapeHtml(value)}"
                        >

                        <label
                            class="option-label"
                            for="${escapeHtml(optionId)}"
                        >

                            <span class="option-title">
                                ${escapeHtml(label)}
                            </span>

                            ${
                                description
                                    ? `
                                        <span class="option-description">
                                            ${escapeHtml(description)}
                                        </span>
                                    `
                                    : ""
                            }

                        </label>

                    </div>

                `;

            }).join("")}

        </div>
    `;
}


/* =========================================================
   MULTI
========================================================= */

function renderMulti(question) {

    return `
        <div class="options">

            ${question.options.map(option => {

                let value = "";
                let label = "";
                let description = "";


                if (
                    typeof option === "object" &&
                    !Array.isArray(option)
                ) {

                    value =
                        option.value || "";

                    label =
                        getLanguageText(
                            option.label
                        );

                    description =
                        option.description
                            ? getLanguageText(
                                option.description
                            )
                            : "";

                }


                else if (Array.isArray(option)) {

                    value =
                        option[0] || "";

                    label =
                        currentLanguage === "ms"
                            ? (
                                option[2] ||
                                option[1] ||
                                ""
                            )
                            : (
                                option[1] || ""
                            );

                    description =
                        currentLanguage === "ms"
                            ? (
                                option[4] ||
                                option[3] ||
                                ""
                            )
                            : (
                                option[3] || ""
                            );

                }


                return `

                    <label
                        class="option-label option-checkbox"
                    >

                        <input
                            type="checkbox"
                            name="question"
                            value="${escapeHtml(value)}"
                        >

                        <span>

                            <span class="option-title">
                                ${escapeHtml(label)}
                            </span>

                            ${
                                description
                                    ? `
                                        <span class="option-description">
                                            ${escapeHtml(description)}
                                        </span>
                                    `
                                    : ""
                            }

                        </span>

                    </label>

                `;

            }).join("")}

        </div>
    `;
}


/* =========================================================
   NUMBER
========================================================= */

function renderNumber(question) {

    const unit =
        question.unit
            ? getLanguageText(question.unit)
            : "";

    return `
        <div class="number-input-wrap">

            <input
                id="numberAnswer"
                class="number-input"
                type="number"

                ${
                    question.min_value !== undefined
                        ? `min="${question.min_value}"`
                        : ""
                }

                ${
                    question.max_value !== undefined
                        ? `max="${question.max_value}"`
                        : ""
                }

                ${
                    question.step_value !== undefined
                        ? `step="${question.step_value}"`
                        : ""
                }

                placeholder="${
                    question.placeholder
                        ? escapeHtml(
                            getLanguageText(
                                question.placeholder
                            )
                        )
                        : ""
                }"
            >

            ${
                unit
                    ? `
                        <span class="number-unit">
                            ${escapeHtml(unit)}
                        </span>
                    `
                    : ""
            }

        </div>
    `;
}


/* =========================================================
   TEXT
========================================================= */

function renderText(question) {

    return `
        <input
            id="textAnswer"
            class="number-input"
            type="text"

            maxlength="${
                question.max_length || 255
            }"

            placeholder="${
                question.placeholder
                    ? escapeHtml(
                        getLanguageText(
                            question.placeholder
                        )
                    )
                    : ""
            }"
        >
    `;
}


/* =========================================================
   COUNTER
========================================================= */

function renderCounter(question) {

    const counters =
        question.counters || [];

    return `
        <div class="counter-list">

            ${counters.map(counter => `

                <div
                    class="counter-item"
                    data-counter-id="${escapeHtml(counter.id)}"
                >

                    <div class="counter-info">

                        <div class="counter-title">
                            ${escapeHtml(
                                getLanguageText(
                                    counter.label
                                )
                            )}
                        </div>

                        ${
                            counter.description
                                ? `
                                    <div class="counter-description">
                                        ${escapeHtml(
                                            getLanguageText(
                                                counter.description
                                            )
                                        )}
                                    </div>
                                `
                                : ""
                        }

                    </div>

                    <div class="counter-control">

                        <button
                            type="button"
                            class="counter-button counter-minus"
                        >
                            −
                        </button>

                        <span class="counter-value">
                            ${counter.min_value ?? 0}
                        </span>

                        <button
                            type="button"
                            class="counter-button counter-plus"
                        >
                            +
                        </button>

                    </div>

                </div>

            `).join("")}

        </div>
    `;
}


/* =========================================================
   TEXTAREA
========================================================= */

function renderTextarea(question) {

    return `
        <textarea
            id="textareaAnswer"
            class="question-textarea"

            maxlength="${
                question.max_length || 2000
            }"

            placeholder="${
                question.placeholder
                    ? escapeHtml(
                        getLanguageText(
                            question.placeholder
                        )
                    )
                    : ""
            }"
        ></textarea>
    `;
}


/* =========================================================
   FILE
========================================================= */

function renderFile(question) {

    return `
        <label class="file-upload">

            <input
                id="fileAnswer"
                type="file"

                accept="${
                    (question.accept || []).join(",")
                }"

                ${
                    question.multiple
                        ? "multiple"
                        : ""
                }
            >

            <strong>
                ${translations[currentLanguage].upload}
            </strong>

            <span>
                ${translations[currentLanguage].uploadHint}
            </span>

        </label>

        <div
            id="fileNames"
            style="
                margin-top: 12px;
                color: #6b7280;
                font-size: 13px;
            "
        ></div>
    `;
}


/* =========================================================
   RESTORE ANSWER
========================================================= */

function restoreAnswer(question) {

    const answer =
        answers[question.id];

    if (answer === undefined) {

        setupQuestionEvents(question);

        return;
    }


    if (question.type === "single") {

        const input =
            document.querySelector(
                `input[value="${CSS.escape(answer)}"]`
            );

        if (input) {
            input.checked = true;
        }
    }


    if (question.type === "multi") {

        const values =
            Array.isArray(answer)
                ? answer
                : [];

        document
            .querySelectorAll(
                'input[type="checkbox"]'
            )
            .forEach(input => {

                input.checked =
                    values.includes(input.value);

            });
    }


    if (question.type === "number") {

        const input =
            document.querySelector(
                "#numberAnswer"
            );

        if (input) {
            input.value = answer;
        }
    }


    if (question.type === "text") {

        const input =
            document.querySelector(
                "#textAnswer"
            );

        if (input) {
            input.value = answer;
        }
    }


    if (question.type === "textarea") {

        const input =
            document.querySelector(
                "#textareaAnswer"
            );

        if (input) {
            input.value = answer;
        }
    }


    if (question.type === "counter") {

        const values =
            answer || {};

        document
            .querySelectorAll(
                "[data-counter-id]"
            )
            .forEach(item => {

                const id =
                    item.dataset.counterId;

                const value =
                    values[id] ?? 0;

                item.querySelector(
                    ".counter-value"
                ).textContent =
                    value;

            });
    }


    setupQuestionEvents(question);
}


/* =========================================================
   EVENTS
========================================================= */

function setupQuestionEvents(question) {

    if (question.type === "counter") {

        document
            .querySelectorAll(
                "[data-counter-id]"
            )
            .forEach(item => {

                const id =
                    item.dataset.counterId;

                const config =
                    question.counters.find(
                        counter =>
                            counter.id === id
                    );

                item
                    .querySelector(
                        ".counter-minus"
                    )
                    .addEventListener(
                        "click",
                        () => {

                            changeCounter(
                                item,
                                config,
                                -1
                            );

                        }
                    );

                item
                    .querySelector(
                        ".counter-plus"
                    )
                    .addEventListener(
                        "click",
                        () => {

                            changeCounter(
                                item,
                                config,
                                1
                            );

                        }
                    );

            });
    }


    if (question.type === "file") {

        const input =
            document.querySelector(
                "#fileAnswer"
            );

        input?.addEventListener(
            "change",
            () => {

                const files =
                    Array.from(
                        input.files || []
                    );

                document.querySelector(
                    "#fileNames"
                ).textContent =
                    files.length
                        ? files
                            .map(
                                file => file.name
                            )
                            .join(", ")
                        : "";

            }
        );
    }
}


/* =========================================================
   CHANGE COUNTER
========================================================= */

function changeCounter(
    item,
    config,
    change
) {

    const valueElement =
        item.querySelector(
            ".counter-value"
        );

    let value =
        Number(
            valueElement.textContent
        );

    value +=
        change;

    const min =
        config.min_value ?? 0;

    const max =
        config.max_value ?? 100;

    value =
        Math.max(
            min,
            Math.min(max, value)
        );

    valueElement.textContent =
        value;
}


/* =========================================================
   COLLECT ANSWER
========================================================= */

function collectCurrentAnswer() {

    const question =
        getCurrentQuestion();

    if (!question) {
        return null;
    }


    if (question.type === "single") {

        const selected =
            document.querySelector(
                'input[name="question"]:checked'
            );

        return selected
            ? selected.value
            : null;
    }


    if (question.type === "multi") {

        return Array.from(
            document.querySelectorAll(
                'input[type="checkbox"]:checked'
            )
        ).map(
            input => input.value
        );
    }


    if (question.type === "number") {

        const input =
            document.querySelector(
                "#numberAnswer"
            );

        return input?.value || null;
    }


    if (question.type === "text") {

        const input =
            document.querySelector(
                "#textAnswer"
            );

        return input?.value.trim() || null;
    }


    if (question.type === "textarea") {

        const input =
            document.querySelector(
                "#textareaAnswer"
            );

        return input?.value.trim() || null;
    }


    if (question.type === "counter") {

        const result = {};

        document
            .querySelectorAll(
                "[data-counter-id]"
            )
            .forEach(item => {

                result[
                    item.dataset.counterId
                ] =
                    Number(
                        item.querySelector(
                            ".counter-value"
                        ).textContent
                    );

            });

        return result;
    }


    if (question.type === "file") {

        const input =
            document.querySelector(
                "#fileAnswer"
            );

        return Array.from(
            input?.files || []
        );
    }


    return null;
}


/* =========================================================
   VALIDATE ANSWER
========================================================= */

function validateAnswer(question, answer) {

    // ==========================================
    // SINGLE CHOICE
    // ==========================================

    if (question.type === "single") {

        return (
            answer !== null &&
            answer !== undefined &&
            answer !== ""
        );
    }


    // ==========================================
    // MULTIPLE CHOICE
    // ==========================================

    if (question.type === "multi") {

        return (
            Array.isArray(answer) &&
            answer.length > 0
        );
    }


    // ==========================================
    // NUMBER
    // ==========================================

    if (question.type === "number") {

        if (
            answer === null ||
            answer === undefined ||
            answer === ""
        ) {
            return false;
        }

        const number =
            Number(answer);

        if (!Number.isFinite(number)) {
            return false;
        }

        // Check minimum value
        if (
            question.min_value !== undefined &&
            number < question.min_value
        ) {
            return false;
        }

        // Check maximum value
        if (
            question.max_value !== undefined &&
            number > question.max_value
        ) {
            return false;
        }

        return true;
    }


    // ==========================================
    // TEXT
    // ==========================================

    if (question.type === "text") {

        return (
            typeof answer === "string" &&
            answer.trim().length >=
                (question.min_length || 1)
        );
    }


    // ==========================================
    // TEXTAREA
    // ==========================================

    if (question.type === "textarea") {

        return (
            typeof answer === "string" &&
            answer.trim().length >=
                (question.min_length || 1)
        );
    }


    // ==========================================
    // COUNTER
    // ==========================================

    if (question.type === "counter") {

        if (!answer) {
            return false;
        }

        return Object.values(answer)
            .some(
                value => Number(value) > 0
            );
    }


    // ==========================================
    // FILE
    // File is optional unless required: true
    // ==========================================

    if (question.type === "file") {

        if (question.required === true) {

            return (
                Array.isArray(answer) &&
                answer.length > 0
            );
        }

        return true;
    }


    return true;
}


/* =========================================================
   SAVE ANSWER
========================================================= */

function saveCurrentAnswer() {

    const question =
        getCurrentQuestion();

    if (!question) {
        return false;
    }

    const answer =
        collectCurrentAnswer();

    if (!validateAnswer(question, answer)) {

    showValidationPopup(
        translations[currentLanguage].required
    );

    return false;
}

    answers[question.id] =
        answer;

    return true;
}


/* =========================================================
   PROGRESS
========================================================= */

function updateProgress() {

    if (!service) {
        return;
    }

    const visibleQuestions =
        getVisibleQuestions();

    const total =
        visibleQuestions.length;

    const current =
        currentQuestion + 1;

    const percent =
        total > 0
            ? Math.round(
                (current / total) * 100
            )
            : 0;

    document.querySelector(
        "#progressText"
    ).textContent =
        `${translations[currentLanguage].question} ${current} ${
            currentLanguage === "en"
                ? "of"
                : "daripada"
        } ${total}`;

    document.querySelector(
        "#progressPercent"
    ).textContent =
        `${percent}%`;

    document.querySelector(
        "#progressBar"
    ).style.width =
        `${percent}%`;
}


/* =========================================================
   NAVIGATION BUTTONS
========================================================= */

function updateNavigation() {

    const previous =
        document.querySelector(
            "#previousButton"
        );

    const next =
        document.querySelector(
            "#nextButton"
        );

    const visibleQuestions =
        getVisibleQuestions();

    previous.disabled =
        currentQuestion === 0;

    next.querySelector(
        "span"
    ).textContent =
        currentQuestion ===
        visibleQuestions.length - 1
            ? translations[currentLanguage].finish
            : translations[currentLanguage].next;
}


/* =========================================================
   NEXT
========================================================= */

function goNext() {

    if (!saveCurrentAnswer()) {
        return;
    }


    /*
       Answers may change which questions
       are visible, so calculate again.
    */

    const visibleQuestions =
        getVisibleQuestions();


    if (
        currentQuestion <
        visibleQuestions.length - 1
    ) {

        currentQuestion++;

        renderQuestion();

        updateProgress();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

        return;
    }


    localStorage.setItem(
        "securepro_answers",
        JSON.stringify(answers)
    );

    localStorage.setItem(
        "securepro_service",
        service.id
    );

    window.location.href =
        "customer.html";
}


/* =========================================================
   PREVIOUS
========================================================= */

function goPrevious() {

    // If already at first question,
    // return to the service page
    if (currentQuestion === 0) {

        showPreviousPopup(
            currentLanguage === "en"
                ? "Are you sure you want to go back to the services page?"
                : "Adakah anda pasti mahu kembali ke halaman servis?"
        );

        return;
    }


    // Ask confirmation before going to previous question
    showPreviousPopup(
        currentLanguage === "en"
            ? "Are you sure you want to return to the previous question?"
            : "Adakah anda pasti mahu kembali ke soalan sebelumnya?"
    );
}
/* =========================================================
   VALIDATION POPUP
========================================================= */

function showValidationPopup(message) {

    let popup =
        document.querySelector(
            "#validationPopup"
        );


    // Create popup if it does not exist
    if (!popup) {

        popup =
            document.createElement(
                "div"
            );

        popup.id =
            "validationPopup";

        popup.className =
            "validation-popup-overlay";

        popup.innerHTML = `
            <div class="validation-popup">

                <div class="validation-popup-icon">
                    !
                </div>

                <h3>
                    ${
                        currentLanguage === "en"
                            ? "Answer Required"
                            : "Jawapan Diperlukan"
                    }
                </h3>

                <p id="validationPopupMessage"></p>

                <button
                    type="button"
                    id="validationPopupButton"
                >
                    ${
                        currentLanguage === "en"
                            ? "OK, I Understand"
                            : "Baik, Saya Faham"
                    }
                </button>

            </div>
        `;

        document.body.appendChild(
            popup
        );


        document.querySelector(
            "#validationPopupButton"
        ).addEventListener(
            "click",
            hideValidationPopup
        );


        // Close when clicking outside popup
        popup.addEventListener(
            "click",
            event => {

                if (
                    event.target === popup
                ) {
                    hideValidationPopup();
                }

            }
        );
    }


    document.querySelector(
        "#validationPopupMessage"
    ).textContent =
        message;


    popup.classList.add(
        "show"
    );


    // Focus the popup button
    setTimeout(
        () => {

            document.querySelector(
                "#validationPopupButton"
            )?.focus();

        },
        50
    );
}


function hideValidationPopup() {

    document.querySelector(
        "#validationPopup"
    )?.classList.remove(
        "show"
    );
}

/* =========================================================
   PREVIOUS CONFIRMATION POPUP
========================================================= */

function showPreviousPopup(message) {

    let popup =
        document.querySelector(
            "#previousPopup"
        );


    if (!popup) {

        popup =
            document.createElement(
                "div"
            );

        popup.id =
            "previousPopup";

        popup.className =
            "previous-popup-overlay";

        popup.innerHTML = `
            <div class="previous-popup">

                <div class="previous-popup-icon">
                    ?
                </div>

                <h3 id="previousPopupTitle"></h3>

                <p id="previousPopupMessage"></p>

                <div class="previous-popup-actions">

                    <button
                        type="button"
                        id="previousPopupCancel"
                        class="previous-popup-cancel"
                    >
                    </button>

                    <button
                        type="button"
                        id="previousPopupConfirm"
                        class="previous-popup-confirm"
                    >
                    </button>

                </div>

            </div>
        `;

        document.body.appendChild(
            popup
        );


        document.querySelector(
            "#previousPopupCancel"
        ).addEventListener(
            "click",
            hidePreviousPopup
        );


        document.querySelector(
            "#previousPopupConfirm"
        ).addEventListener(
            "click",
            confirmPrevious
        );


        // Close when clicking outside
        popup.addEventListener(
            "click",
            event => {

                if (event.target === popup) {
                    hidePreviousPopup();
                }

            }
        );
    }


    document.querySelector(
        "#previousPopupTitle"
    ).textContent =
        currentLanguage === "en"
            ? "Go Back?"
            : "Kembali?"


    document.querySelector(
        "#previousPopupMessage"
    ).textContent =
        message;


    document.querySelector(
        "#previousPopupCancel"
    ).textContent =
        currentLanguage === "en"
            ? "Stay Here"
            : "Kekal Di Sini";


    document.querySelector(
        "#previousPopupConfirm"
    ).textContent =
        currentLanguage === "en"
            ? "Yes, Go Back"
            : "Ya, Kembali";


    popup.classList.add(
        "show"
    );
}


function hidePreviousPopup() {

    document.querySelector(
        "#previousPopup"
    )?.classList.remove(
        "show"
    );
}


function confirmPrevious() {

    hidePreviousPopup();


    // First question → Services page
    if (currentQuestion === 0) {

        window.location.href =
            "../index.html";

        return;
    }


    // Save the current answer before going back
    const question =
        getCurrentQuestion();

    const answer =
        collectCurrentAnswer();

    // Save only if the user has answered
    if (
        question &&
        validateAnswer(question, answer)
    ) {

        answers[question.id] =
            answer;
    }


    currentQuestion--;

    renderQuestion();

    updateProgress();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/* =========================================================
   ERROR
========================================================= */

function showError(message) {

    document.querySelector(
        "#questionContainer"
    ).innerHTML = `
        <div class="question-error">
            ${escapeHtml(message)}
        </div>
    `;
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        document.querySelector(
            "#languageToggle"
        )?.addEventListener(
            "click",
            () => {

                currentLanguage =
                    currentLanguage === "en"
                        ? "ms"
                        : "en";

                localStorage.setItem(
                    "securepro_language",
                    currentLanguage
                );

                window.location.reload();
            }
        );


        document.querySelector(
            "#nextButton"
        )?.addEventListener(
            "click",
            goNext
        );


        document.querySelector(
            "#previousButton"
        )?.addEventListener(
            "click",
            goPrevious
        );


        loadService();

    }
);