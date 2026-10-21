(function () {
    "use strict";

    const language = localStorage.getItem("securepro_language") === "en" ? "en" : "ms";

    let config = {};

    // Question types that are a single input (no `fields` array needed).
    const SINGLE_FIELD_TYPES = ["text", "number", "textarea", "file", "select", "email", "tel", "date"];

    function text(value) {
        if (typeof value === "string") return value;
        return value?.[language] || value?.en || value?.ms || "";
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // "single" is an alias of "radio".
    function isChoice(question) {
        return question.type === "radio" || question.type === "single" || question.type === "multi";
    }

    // A question can either list its own `fields`, or be a single input
    // described directly on the question (type: number / text / textarea / file ...).
    function fieldsOf(question) {
        if (question.fields) return question.fields;

        if (SINGLE_FIELD_TYPES.includes(question.type)) {
            return [{
                id: question.id,
                type: question.type,
                required: question.required,
                placeholder: question.placeholder,
                label: question.unit ? { en: question.unit, ms: question.unit } : "",
                full: true,
                accept: question.accept,
                multiple: question.multiple,
                options: question.options,
                min: question.min
            }];
        }

        return [];
    }

    /* ---------- conditional questions ---------- */

    function selectedValues(id) {
        const values = [];

        document.querySelectorAll(`input[name="${CSS.escape(id)}"]:checked`)
            .forEach(el => values.push(el.value));

        const field = document.querySelector(`[data-answer="${CSS.escape(id)}"]`);
        if (field && field.value) values.push(field.value);

        return values;
    }

    function isQuestionVisible(question) {
        if (!question.condition) return true;
        const chosen = selectedValues(question.condition.question);
        return (question.condition.values || []).some(value => chosen.includes(value));
    }

    function applyConditions() {
        (config.questions || []).forEach(question => {
            if (!question.condition) return;

            const card = document.querySelector(
                `.question-card[data-question-id="${CSS.escape(question.id)}"]`
            );
            if (!card) return;

            const visible = isQuestionVisible(question);

            if (card.hidden === visible) card.hidden = !visible;

            card.querySelectorAll("input,select,textarea").forEach(el => {
                // Disabled controls are ignored by validation and submission.
                if (el.disabled === visible) el.disabled = !visible;

                if (!visible) {
                    if (el.type === "radio" || el.type === "checkbox") {
                        if (el.checked) el.checked = false;
                    } else if (el.value) {
                        el.value = "";
                    }
                }
            });
        });
    }

    /* ---------- rendering ---------- */

    function renderOptions(question) {
        const inputType = question.type === "multi" ? "checkbox" : "radio";
        const name = question.id;

        return (question.options || []).map((option, index) => {
            const id = `${name}_${index}`;
            const otherInput = option.otherInput ? `
                <div class="inline-other-field" data-inline-other-for="${escapeHtml(id)}" hidden>
                    <label for="${escapeHtml(option.otherInput.id)}">${escapeHtml(text(option.otherInput.label || { en: "Please specify", ms: "Sila nyatakan" }))}${option.otherInput.required ? ' <span class="required">*</span>' : ""}</label>
                    ${option.otherInput.type === "textarea"
                    ? `<textarea id="${escapeHtml(option.otherInput.id)}" data-answer="${escapeHtml(option.otherInput.id)}" placeholder="${escapeHtml(text(option.otherInput.placeholder || ""))}" ${option.otherInput.required ? "required" : ""} disabled></textarea>`
                    : `<input id="${escapeHtml(option.otherInput.id)}" type="text" data-answer="${escapeHtml(option.otherInput.id)}" placeholder="${escapeHtml(text(option.otherInput.placeholder || ""))}" ${option.otherInput.required ? "required" : ""} disabled>`}
                </div>` : "";

            return `
                <div class="option ${option.otherInput ? "option-has-other-input" : ""}">
                    <input id="${escapeHtml(id)}" type="${inputType}" name="${escapeHtml(name)}" value="${escapeHtml(option.value)}" ${question.required ? "data-required-group=\"true\"" : ""}>
                    <label for="${escapeHtml(id)}">
                        <strong>${escapeHtml(text(option.label))}</strong>
                        ${option.description ? `<span>${escapeHtml(text(option.description))}</span>` : ""}
                    </label>
                    ${otherInput}
                </div>
            `;
        }).join("");
    }

    function renderField(field) {
        const required = field.required ? "required" : "";
        const labelText = text(field.label);
        const requiredMark = field.required && labelText ? ` <span class="required">*</span>` : "";
        const placeholder = field.placeholder ? `placeholder="${escapeHtml(text(field.placeholder))}"` : "";

        if (field.type === "textarea") {
            return `
                <div class="field ${field.full ? "full" : ""}">
                    <label>${escapeHtml(labelText)}${requiredMark}</label>
                    <textarea data-answer="${escapeHtml(field.id)}" ${required} ${placeholder}></textarea>
                </div>
            `;
        }

        if (field.type === "select") {
            return `
                <div class="field ${field.full ? "full" : ""}">
                    <label>${escapeHtml(labelText)}${requiredMark}</label>
                    <select data-answer="${escapeHtml(field.id)}" ${required}>
                        <option value="">${escapeHtml(text(field.placeholder || { en: "Select", ms: "Pilih" }))}</option>
                        ${(field.options || []).map(option => `<option value="${escapeHtml(option.value)}">${escapeHtml(text(option.label))}</option>`).join("")}
                    </select>
                    ${field.otherInput ? `
                        <div class="inline-other-field" data-inline-other-for="${escapeHtml(field.id)}" data-inline-other-value="${escapeHtml(field.otherInput.value || "other")}" hidden>
                            <label for="${escapeHtml(field.otherInput.id)}">${escapeHtml(text(field.otherInput.label || { en: "Please specify", ms: "Sila nyatakan" }))}${field.otherInput.required ? ' <span class="required">*</span>' : ""}</label>
                            <input id="${escapeHtml(field.otherInput.id)}" type="text" data-answer="${escapeHtml(field.otherInput.id)}" placeholder="${escapeHtml(text(field.otherInput.placeholder || ""))}" ${field.otherInput.required ? "required" : ""} disabled>
                        </div>` : ""}
                </div>
            `;
        }

        const accept = Array.isArray(field.accept) && field.accept.length
            ? `accept="${escapeHtml(field.accept.join(","))}"`
            : "";
        const multiple = field.multiple ? "multiple" : "";

        return `
            <div class="field ${field.full ? "full" : ""}">
                <label>${escapeHtml(labelText)}${requiredMark}</label>
                <input data-answer="${escapeHtml(field.id)}" type="${escapeHtml(field.type || "text")}" ${required} ${placeholder} ${accept} ${multiple} ${field.min !== undefined ? `min="${escapeHtml(field.min)}"` : ""}>
            </div>
        `;
    }

    function renderQuestion(question, index) {
        const number = String(index + 1).padStart(2, "0");
        const intro = question.description ? `<p>${escapeHtml(text(question.description))}</p>` : "";
        const qid = escapeHtml(question.id);

        if (isChoice(question)) {
            return `
                <section class="question-card" data-question-id="${qid}">
                    <h2><span class="question-number">${number}</span>${escapeHtml(text(question.title))}</h2>
                    ${intro}
                    <div class="option-grid">${renderOptions(question)}</div>
                    ${question.note ? `<div class="conditional-note">${escapeHtml(text(question.note))}</div>` : ""}
                </section>
            `;
        }

        return `
            <section class="question-card" data-question-id="${qid}">
                <h2><span class="question-number">${number}</span>${escapeHtml(text(question.title))}</h2>
                ${intro}
                <div class="field-grid">
                    ${fieldsOf(question).map(renderField).join("")}
                </div>
            </section>
        `;
    }

function restoreSavedAnswers() {
    let savedAnswers = {};

    try {
        savedAnswers = JSON.parse(
            localStorage.getItem("securepro_answers") || "{}"
        );
    } catch (error) {
        console.error("Unable to restore saved answers:", error);
        return;
    }

    Object.entries(savedAnswers).forEach(([key, value]) => {
        const fields = document.querySelectorAll(
            `[data-answer="${CSS.escape(key)}"]`
        );

        fields.forEach(field => {
            if (field.type === "file") return;

            if (field.type === "radio" || field.type === "checkbox") {
                field.checked = Array.isArray(value)
                    ? value.includes(field.value)
                    : String(value) === field.value;
                return;
            }

            if (field.tagName === "SELECT" || field.tagName === "TEXTAREA" ||
                field.tagName === "INPUT") {
                field.value = Array.isArray(value)
                    ? value.join(", ")
                    : String(value ?? "");
            }
        });

        // Restore radio and checkbox answers using their group name.
        const group = document.querySelectorAll(
            `input[name="${CSS.escape(key)}"]`
        );

        group.forEach(field => {
            field.checked = Array.isArray(value)
                ? value.includes(field.value)
                : String(value) === field.value;
        });
    });

    // Restore conditional questions and "Other" fields.
    document.querySelector("#categoryQuestions")
        ?.dispatchEvent(new Event("change", { bubbles: true }));
}

    function render() {
        const root = document.querySelector("#categoryQuestions");
        if (!root) return;

        root.innerHTML = (config.questions || []).map(renderQuestion).join("") + `
            <div class="question-actions">
                <a href="../index.html#services" class="secondary">${escapeHtml(text(config.back || { en: "← Back", ms: "← Kembali" }))}</a>
                <button type="submit" class="primary">${escapeHtml(text(config.continue || { en: "Continue to Customer Details →", ms: "Teruskan ke Maklumat Pelanggan →" }))}</button>
            </div>
        `;

        applyConditions();
restoreSavedAnswers();
applyConditions();
    }

    /* ---------- answers + validation ---------- */

    
function collectAnswers() {
    const answers = {};

    (config.questions || []).forEach(question => {
        if (!isQuestionVisible(question)) return;

        if (question.type === "radio" || question.type === "single") {
            const selected = document.querySelector(
                `input[name="${CSS.escape(question.id)}"]:checked`
            );

            if (selected) {
                answers[question.id] = selected.value;

                const option = (question.options || []).find(
                    item => item.value === selected.value
                );

                if (option?.otherInput) {
                    const otherField = document.querySelector(
                        `[data-answer="${CSS.escape(option.otherInput.id)}"]`
                    );

                    answers[option.otherInput.id] =
                        otherField?.value.trim() || "";
                }
            }

            return;
        }

        if (question.type === "multi") {
            const selected = [
                ...document.querySelectorAll(
                    `input[name="${CSS.escape(question.id)}"]:checked`
                )
            ];

            answers[question.id] = selected.map(el => el.value);

            selected.forEach(el => {
                const option = (question.options || []).find(
                    item => item.value === el.value
                );

                if (option?.otherInput) {
                    const otherField = document.querySelector(
                        `[data-answer="${CSS.escape(option.otherInput.id)}"]`
                    );

                    answers[option.otherInput.id] =
                        otherField?.value.trim() || "";
                }
            });

            return;
        }

        fieldsOf(question).forEach(field => {
            const el = document.querySelector(
                `[data-answer="${CSS.escape(field.id)}"]`
            );

            if (!el || el.disabled || el.closest("[hidden]")) return;

            // File uploads are handled separately by the upload workflow.
            if (el.type === "file") return;

            answers[field.id] = el.value.trim();

            if (field.otherInput && el.value === (field.otherInput.value || "other")) {
                const otherField = document.querySelector(
                    `[data-answer="${CSS.escape(field.otherInput.id)}"]`
                );
                answers[field.otherInput.id] = otherField?.value.trim() || "";
            }
        });
    });

    // Collect dynamically generated Audio & Visual "Lain-lain" fields.
    document.querySelectorAll(
        '#categoryQuestions [data-answer="av_services_other"], ' +
        '#categoryQuestions [data-answer="av_purpose_other"]'
    ).forEach(el => {
        if (el.disabled || el.closest("[hidden]")) return;

        const value = el.value.trim();

        if (value) {
            answers[el.dataset.answer] = value;
        }
    });

    return answers;
}


    function validate() {
        for (const question of config.questions || []) {
            if (!isQuestionVisible(question)) continue;

            
if (isChoice(question)) {
    const checkedInputs = [
        ...document.querySelectorAll(
            `input[name="${CSS.escape(question.id)}"]:checked`
        )
    ];

    if (question.required && checkedInputs.length === 0) {
        const first = document.querySelector(
            `input[name="${CSS.escape(question.id)}"]`
        );

        first?.closest(".question-card")?.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        first?.focus();
        return false;
    }

    const selectedOptions = checkedInputs
        .map(input =>
            (question.options || []).find(
                option => option.value === input.value
            )
        )
        .filter(Boolean);

    for (const option of selectedOptions) {
        if (!option.otherInput?.required) continue;

        const input = document.querySelector(
            `[data-answer="${CSS.escape(option.otherInput.id)}"]`
        );

        if (!input || !input.value.trim()) {
            input?.closest(".inline-other-field")
                ?.classList.add("inline-other-invalid");

            input?.focus();
            input?.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            return false;
        }
    }

    continue;
}


            for (const field of fieldsOf(question)) {
                const el = document.querySelector(`[data-answer="${CSS.escape(field.id)}"]`);
                if (field.required && (!el || !el.value.trim())) {
                    el?.closest(".question-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
                    el?.focus();
                    return false;
                }

                if (field.otherInput?.required && el?.value === (field.otherInput.value || "other")) {
                    const otherField = document.querySelector(
                        `[data-answer="${CSS.escape(field.otherInput.id)}"]`
                    );
                    if (!otherField || !otherField.value.trim()) {
                        otherField?.closest(".inline-other-field")?.classList.add("inline-other-invalid");
                        otherField?.focus();
                        otherField?.scrollIntoView({ behavior: "smooth", block: "center" });
                        return false;
                    }
                }
            }
        }
        return true;
    }

    
function saveAndContinue() {
    if (!validate()) return;

    // Save service answers
    localStorage.setItem(
        "securepro_answers",
        JSON.stringify(collectAnswers())
    );

    // Save category details
    localStorage.setItem(
        "securepro_category",
        JSON.stringify({
            code: config.code,
            name: text(config.name),
            reviewTitle: text(config.name)
        })
    );

    localStorage.removeItem("securepro_service");

    // Remember the current service-question page
    localStorage.setItem(
        "securepro_previous_question_page",
        window.location.pathname +
        window.location.search +
        window.location.hash
    );

    // Continue to customer details
    window.location.href = "customer.html";
}


    function applyLanguage() {
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.dataset.i18n;
            const value = config.translations?.[language]?.[key];
            if (value) el.textContent = value;
        });

        const button = document.querySelector("#languageToggle");
        if (button) button.textContent = `🌐 ${language === "ms" ? "English" : "Bahasa Melayu"}`;
    }

    document.addEventListener("DOMContentLoaded", () => {
        config = window.CATEGORY_FORM_CONFIG || {};
        render();
        applyLanguage();

        function updateInlineOtherFields() {
            document.querySelectorAll("[data-inline-other-for]").forEach(wrapper => {
                const option = document.getElementById(wrapper.dataset.inlineOtherFor);
                const select = document.querySelector(
                    `select[data-answer="${CSS.escape(wrapper.dataset.inlineOtherFor)}"]`
                );
                const input = wrapper.querySelector("input,textarea");
                const visible = option
                    ? !!option.checked
                    : !!select && select.value === wrapper.dataset.inlineOtherValue;
                wrapper.hidden = !visible;
                if (input) {
                    input.disabled = !visible;
                    input.required = visible && input.hasAttribute("required");
                    if (!visible) input.value = "";
                }
            });
        }

        document.addEventListener("change", event => {
            if (event.target.matches('input[type="radio"],input[type="checkbox"],select')) {
                updateInlineOtherFields();
            }
        });
        updateInlineOtherFields();
        const progressLabels = {
            en: { questions: "Questions", customer: "Customer Details", review: "Review", submit: "Submit" },
            ms: { questions: "Soalan", customer: "Maklumat Pelanggan", review: "Semakan", submit: "Hantar" }
        };
        document.querySelectorAll("[data-progress-label]").forEach(el => {
            const key = el.dataset.progressLabel;
            el.textContent = progressLabels[language]?.[key] || el.textContent;
        });

        // Re-evaluate conditional questions whenever an answer changes.
        document.querySelector("#categoryQuestions")?.addEventListener("change", applyConditions);

        document.querySelector("#questionForm")?.addEventListener("submit", event => {
            event.preventDefault();
            saveAndContinue();
        });

        document.querySelector("#languageToggle")?.addEventListener("click", () => {
            localStorage.setItem("securepro_language", language === "ms" ? "en" : "ms");
            window.location.reload();
        });

        const menu = document.querySelector("#menuToggle");
        const nav = document.querySelector("#mainNav");
        menu?.addEventListener("click", () => {
            const open = nav.classList.toggle("open");
            menu.setAttribute("aria-expanded", String(open));
        });
    });
})();
