window.CATEGORY_FORM_CONFIG = {
    code: "electrical_service",
    name: {
        en: "Electrical Service",
        ms: "Electrical Service"
    },

    back: {
        en: "← Back",
        ms: "← Kembali"
    },

    continue: {
        en: "Continue to Customer Details →",
        ms: "Teruskan ke Maklumat Pelanggan →"
    },

    translations: {
        en: {
            intro: "Tell us what electrical work you need."
        },
        ms: {
            intro: "Beritahu kami keperluan kerja elektrik anda."
        }
    },

    questions: [
        {
            id: "electrical_premise_type",
            type: "single",
            required: true,
            title: {
                en: "Where is the electrical work required?",
                ms: "Di mana kerja elektrik diperlukan?"
            },
            options: [
                ["house", "House", "Rumah"],
                ["shop", "Shop", "Kedai"],
                ["office", "Office", "Pejabat"],
                ["factory", "Factory", "Kilang"],
                ["school", "School", "Sekolah"],
                ["mosque", "Mosque", "Masjid"],
                ["other", "Others", "Lain-lain"]
            ].map(([value, en, ms]) => ({
                value,
                label: { en, ms }
            }))
        },

        {
            id: "electrical_services",
            type: "multi",
            required: true,
            title: {
                en: "What electrical service is required?",
                ms: "Apakah perkhidmatan elektrik yang diperlukan?"
            },
            description: {
                en: "You may select more than one service.",
                ms: "Anda boleh memilih lebih daripada satu perkhidmatan."
            },
            options: [
                ["new_wiring", "New wiring / renovation", "Wiring baru / renovation"],
                ["add_point", "Add electrical point", "Tambah electrical point"],
                ["light_fan", "Light / fan", "Lampu / kipas"],
                ["socket", "Socket / power point", "Socket / power point"],
                ["aircond_point", "Aircond point", "Aircond point"],
                ["water_heater", "Water heater", "Water heater"],
                ["distribution_board", "DB / Distribution Board", "DB / Distribution Board"],
                ["troubleshooting", "Electrical trip / troubleshooting", "Elektrik trip / troubleshooting"],
                ["outdoor_underground", "Outdoor / underground wiring", "Outdoor / underground wiring"],
                ["three_phase", "3 Phase", "3 Phase"],
                ["other", "Others", "Lain-lain"]
            ].map(([value, en, ms]) => ({
                value,
                label: { en, ms }
            }))
        },

        /* -------------------------------------------------
           WIRING / ADD POINT
        ------------------------------------------------- */
        {
            id: "wiring_point_quantity",
            type: "number",
            required: true,
            title: {
                en: "How many points are required?",
                ms: "Berapa jumlah point yang diperlukan?"
            },
            condition: {
                question: "electrical_services",
                values: ["new_wiring", "add_point"]
            }
        },

        {
            id: "wiring_point_type",
            type: "multi",
            required: true,
            title: {
                en: "What type of point is required?",
                ms: "Apakah jenis point yang diperlukan?"
            },
            condition: {
                question: "electrical_services",
                values: ["new_wiring", "add_point"]
            },
            options: [
                ["socket", "Socket", "Socket"],
                ["light", "Light", "Lampu"],
                ["fan", "Fan", "Kipas"],
                ["aircond", "Aircond", "Aircond"],
                ["water_heater", "Water Heater", "Water Heater"],
                ["other", "Others", "Lain-lain"]
            ].map(([value, en, ms]) => ({
                value,
                label: { en, ms }
            }))
        },

        {
            id: "wiring_installation_type",
            type: "single",
            required: true,
            title: {
                en: "What type of installation?",
                ms: "Apakah jenis pemasangan?"
            },
            condition: {
                question: "electrical_services",
                values: ["new_wiring", "add_point"]
            },
            options: [
                ["surface", "Surface", "Surface"],
                ["concealed", "Concealed", "Concealed"]
            ].map(([value, en, ms]) => ({
                value,
                label: { en, ms }
            }))
        },

        {
            id: "wiring_distance",
            type: "number",
            required: true,
            title: {
                en: "Estimated wiring distance",
                ms: "Anggaran jarak wiring"
            },
            unit: "m",
            condition: {
                question: "electrical_services",
                values: ["new_wiring", "add_point"]
            }
        },

        {
            id: "wiring_hacking",
            type: "single",
            required: true,
            title: {
                en: "Is hacking required?",
                ms: "Perlu hacking?"
            },
            condition: {
                question: "electrical_services",
                values: ["new_wiring", "add_point"]
            },
            options: [
                ["yes", "Yes", "Ya"],
                ["no", "No", "Tidak"],
                ["unsure", "Not sure", "Tidak pasti"]
            ].map(([value, en, ms]) => ({
                value,
                label: { en, ms }
            }))
        },

        /* -------------------------------------------------
           TROUBLESHOOTING / TRIP
        ------------------------------------------------- */
        {
            id: "troubleshooting_problem",
            type: "textarea",
            required: true,
            title: {
                en: "What is the electrical problem?",
                ms: "Apakah masalah elektrik?"
            },
            condition: {
                question: "electrical_services",
                values: ["troubleshooting"]
            },
            placeholder: {
                en: "Example: Main switch trips when the air conditioner is switched on.",
                ms: "Contoh: Main switch trip apabila aircond dihidupkan."
            }
        },

        {
            id: "troubleshooting_area",
            type: "single",
            required: true,
            title: {
                en: "Where does the problem occur?",
                ms: "Di mana masalah berlaku?"
            },
            condition: {
                question: "electrical_services",
                values: ["troubleshooting"]
            },
            options: [
                ["whole_premise", "Whole premise", "Seluruh premis"],
                ["specific_area", "Specific area", "Kawasan tertentu"]
            ].map(([value, en, ms]) => ({
                value,
                label: { en, ms }
            }))
        },

        {
            id: "troubleshooting_trip_timing",
            type: "single",
            required: true,
            title: {
                en: "When does the trip happen?",
                ms: "Trip berlaku bila?"
            },
            condition: {
                question: "electrical_services",
                values: ["troubleshooting"]
            },
            options: [
                ["always", "All the time", "Sentiasa"],
                ["sometimes", "Sometimes", "Kadang-kadang"],
                ["specific_equipment", "When a specific equipment is used", "Apabila peralatan tertentu digunakan"],
                ["unknown", "Not sure", "Tidak pasti"]
            ].map(([value, en, ms]) => ({
                value,
                label: { en, ms }
            }))
        },

        {
            id: "troubleshooting_equipment",
            type: "text",
            title: {
                en: "Which equipment causes the trip?",
                ms: "Peralatan manakah yang menyebabkan trip?"
            },
            condition: {
                question: "electrical_services",
                values: ["troubleshooting"]
            }
        },

        {
            id: "troubleshooting_safety",
            type: "multi",
            title: {
                en: "Are there any of these signs?",
                ms: "Adakah terdapat tanda-tanda berikut?"
            },
            condition: {
                question: "electrical_services",
                values: ["troubleshooting"]
            },
            options: [
                ["burning_smell", "Burning smell", "Bau terbakar"],
                ["spark", "Spark", "Percikan api"],
                ["hot", "Hot / overheating", "Panas / overheating"],
                ["none", "None", "Tiada"]
            ].map(([value, en, ms]) => ({
                value,
                label: { en, ms }
            }))
        },

        /* -------------------------------------------------
           DB
        ------------------------------------------------- */
        {
            id: "db_work_type",
            type: "single",
            required: true,
            title: {
                en: "What work is required for the Distribution Board?",
                ms: "Apakah kerja yang diperlukan untuk Distribution Board?"
            },
            condition: {
                question: "electrical_services",
                values: ["distribution_board"]
            },
            options: [
                ["new_installation", "New installation", "Pemasangan baru"],
                ["upgrade", "Upgrade", "Upgrade"],
                ["repair", "Repair", "Repair"]
            ].map(([value, en, ms]) => ({
                value,
                label: { en, ms }
            }))
        },

        {
            id: "db_phase",
            type: "single",
            required: true,
            title: {
                en: "Is the supply Single Phase or 3 Phase?",
                ms: "Bekalan Single Phase atau 3 Phase?"
            },
            condition: {
                question: "electrical_services",
                values: ["distribution_board"]
            },
            options: [
                ["single_phase", "Single Phase", "Single Phase"],
                ["three_phase", "3 Phase", "3 Phase"],
                ["unsure", "Not sure", "Tidak pasti"]
            ].map(([value, en, ms]) => ({
                value,
                label: { en, ms }
            }))
        },

        {
            id: "db_ways",
            type: "number",
            title: {
                en: "How many ways does the DB have?",
                ms: "Berapa way DB jika tahu?"
            },
            condition: {
                question: "electrical_services",
                values: ["distribution_board"]
            }
        },

        {
            id: "db_trip",
            type: "single",
            required: true,
            title: {
                en: "Is there a tripping problem?",
                ms: "Ada masalah trip?"
            },
            condition: {
                question: "electrical_services",
                values: ["distribution_board"]
            },
            options: [
                ["yes", "Yes", "Ya"],
                ["no", "No", "Tidak"],
                ["unsure", "Not sure", "Tidak pasti"]
            ].map(([value, en, ms]) => ({
                value,
                label: { en, ms }
            }))
        },

        /* -------------------------------------------------
           OUTDOOR / UNDERGROUND
        ------------------------------------------------- */
        {
            id: "outdoor_work_type",
            type: "single",
            required: true,
            title: {
                en: "What type of outdoor / underground work?",
                ms: "Apakah jenis kerja outdoor / underground?"
            },
            condition: {
                question: "electrical_services",
                values: ["outdoor_underground"]
            },
            options: [
                ["outdoor", "Outdoor", "Outdoor"],
                ["underground", "Underground", "Underground"],
                ["both", "Both", "Kedua-duanya"]
            ].map(([value, en, ms]) => ({
                value,
                label: { en, ms }
            }))
        },

        {
            id: "outdoor_distance",
            type: "number",
            required: true,
            title: {
                en: "Estimated distance",
                ms: "Anggaran jarak"
            },
            unit: "m",
            condition: {
                question: "electrical_services",
                values: ["outdoor_underground"]
            }
        },

        {
            id: "outdoor_ground",
            type: "multi",
            required: true,
            title: {
                en: "What is the ground / surface condition?",
                ms: "Apakah keadaan kawasan tanah / permukaan?"
            },
            condition: {
                question: "electrical_services",
                values: ["outdoor_underground"]
            },
            options: [
                ["soil", "Soil", "Tanah"],
                ["concrete", "Concrete", "Concrete"],
                ["interlocking", "Interlocking", "Interlocking"],
                ["other", "Other", "Lain-lain"]
            ].map(([value, en, ms]) => ({
                value,
                label: { en, ms }
            }))
        },

        {
            id: "outdoor_trenching",
            type: "single",
            required: true,
            title: {
                en: "Is trenching required?",
                ms: "Perlu trenching?"
            },
            condition: {
                question: "electrical_services",
                values: ["outdoor_underground"]
            },
            options: [
                ["yes", "Yes", "Ya"],
                ["no", "No", "Tidak"],
                ["unsure", "Not sure", "Tidak pasti"]
            ].map(([value, en, ms]) => ({
                value,
                label: { en, ms }
            }))
        },

        {
            id: "outdoor_load",
            type: "textarea",
            required: true,
            title: {
                en: "What load / equipment will be connected?",
                ms: "Apakah beban / peralatan yang hendak disambungkan?"
            },
            condition: {
                question: "electrical_services",
                values: ["outdoor_underground"]
            }
        },

        /* -------------------------------------------------
           ELECTRICAL SUPPLY
        ------------------------------------------------- */
        {
            id: "electrical_supply",
            type: "single",
            required: true,
            title: {
                en: "What type of electrical supply does the premise have?",
                ms: "Apakah jenis bekalan elektrik premis?"
            },
            options: [
                ["single_phase", "Single Phase", "Single Phase"],
                ["three_phase", "3 Phase", "3 Phase"],
                ["unsure", "Not sure", "Tidak Pasti"]
            ].map(([value, en, ms]) => ({
                value,
                label: { en, ms }
            }))
        },

        {
            id: "electrical_supply_photo",
            type: "file",
            required: true,
            title: {
                en: "Upload DB / Main Switch / TNB meter photo",
                ms: "Upload gambar DB / Main Switch / meter TNB"
            },
            description: {
                en: "Required when the electrical supply is not known.",
                ms: "Diperlukan jika jenis bekalan elektrik tidak pasti."
            },
            condition: {
                question: "electrical_supply",
                values: ["unsure"]
            },
            accept: ["image/jpeg", "image/png", "image/webp"],
            multiple: true
        },

        /* -------------------------------------------------
           WORK LOCATION
        ------------------------------------------------- */
        {
            id: "work_location",
            type: "textarea",
            required: true,
            title: {
                en: "Work location",
                ms: "Lokasi kerja"
            },
            description: {
                en: "Enter the address, postcode, state / district and any useful location information.",
                ms: "Masukkan alamat, poskod, negeri / daerah dan maklumat lokasi yang berguna."
            },
            placeholder: {
                en: "Address, postcode, state / district...",
                ms: "Alamat, poskod, negeri / daerah..."
            }
        },

        /* -------------------------------------------------
           PHOTOS
        ------------------------------------------------- */
        {
            id: "work_area_photo",
            type: "file",
            required: true,
            title: {
                en: "Upload work area photo",
                ms: "Upload gambar kawasan kerja"
            },
            description: {
                en: "Please upload at least 1 photo of the work area.",
                ms: "Sila upload sekurang-kurangnya 1 gambar kawasan kerja."
            },
            accept: ["image/jpeg", "image/png", "image/webp"],
            multiple: true
        },

        {
            id: "additional_photos",
            type: "file",
            title: {
                en: "Additional photos",
                ms: "Gambar tambahan"
            },
            description: {
                en: "Optional: DB, point / equipment or problem photos.",
                ms: "Pilihan: gambar DB, point / peralatan atau masalah."
            },
            accept: ["image/jpeg", "image/png", "image/webp"],
            multiple: true
        }
    ]
};


/* ==========================================================
   ELECTRICAL — CONDITIONAL DISPLAY
   ========================================================== */
(function () {
    "use strict";

    function selected(id) {
        const root = document.querySelector("#categoryQuestions");
        if (!root) return [];

        return [
            ...root.querySelectorAll(
                `[name="${CSS.escape(id)}"],[name="${CSS.escape(id)}[]"]`
            )
        ]
        .filter(el =>
            !(el.type === "radio" || el.type === "checkbox") || el.checked
        )
        .map(el => el.value);
    }

    function card(id) {
        const root = document.querySelector("#categoryQuestions");
        if (!root) return null;

        const el =
            root.querySelector(`[data-question-id="${CSS.escape(id)}"]`) ||
            root.querySelector(`[name="${CSS.escape(id)}"]`) ||
            root.querySelector(`[name="${CSS.escape(id)}[]"]`);

        return el
            ? el.closest(
                ".question-card,.question-item,.form-group,article,section"
            )
            : null;
    }

    function update() {
        window.CATEGORY_FORM_CONFIG.questions
            .filter(q => q.condition)
            .forEach(q => {
                const c = card(q.id);
                if (!c) return;

                const show = q.condition.values.some(value =>
                    selected(q.condition.question).includes(value)
                );

                // Only touch the DOM when the state really changes.
                // Re-setting `hidden` fires the MutationObserver below,
                // which calls update() again -> infinite loop / frozen page.
                if (c.hidden !== !show) {
                    c.hidden = !show;
                }

                c.querySelectorAll("input,select,textarea").forEach(el => {
                    // Disabled fields are skipped by native validation and
                    // by form submission, so hidden required questions
                    // can't block the final submit.
                    if (el.disabled !== !show) {
                        el.disabled = !show;
                    }

                    if (!show) {
                        if (el.type === "radio" || el.type === "checkbox") {
                            if (el.checked) el.checked = false;
                        } else if (el.value) {
                            el.value = "";
                        }
                    }
                });
            });
    }

    document.addEventListener("DOMContentLoaded", () => {
        const root = document.querySelector("#categoryQuestions");
        if (!root) return;

        root.addEventListener("change", event => {
            setTimeout(update, 30);
        });

        new MutationObserver(update).observe(root, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["hidden"]
        });

        setTimeout(update, 250);
        setTimeout(update, 900);
    });
})();


/* ==========================================================
   ELECTRICAL — ONE QUESTION PER PAGE (robust card detection)
   ========================================================== */
(function () {
    "use strict";

    let currentIndex = 0;
    let cards = [];
    let pager = null;
    let refreshing = false;

    const root = () => document.querySelector("#categoryQuestions");
    const form = () => document.querySelector("#questionForm");

    // Always return the direct child of #categoryQuestions that contains
    // this question. Using a broad closest('section') can accidentally group
    // several questions into one card, which was the cause of the issue.
    function getQuestionCard(question) {
        const r = root();
        if (!r) return null;

        let el = r.querySelector(`[data-question-id="${CSS.escape(question.id)}"]`);
        if (!el) {
            el = r.querySelector(`[name="${CSS.escape(question.id)}"], [name="${CSS.escape(question.id)}[]"]`);
        }
        if (!el) return null;

        let node = el;
        while (node && node.parentElement && node.parentElement !== r) {
            node = node.parentElement;
        }
        return node && node.parentElement === r ? node : null;
    }

    function isConditionVisible(card) {
        if (!card || card.hidden) return false;
        // Respect conditional visibility set by the electrical condition handler.
        return getComputedStyle(card).display !== "none";
    }

    function collectCards() {
        const r = root();
        const questions = window.CATEGORY_FORM_CONFIG?.questions || [];
        const result = [];

        questions.forEach(question => {
            const card = getQuestionCard(question);
            if (card && !result.includes(card) && !card.hidden) result.push(card);
        });

        // If a question has no named control yet (e.g. a renderer-specific
        // field), use the root's direct children as the fallback card list.
        if (!result.length && r) {
            [...r.children].forEach(card => {
                if (!card.hidden && !card.classList.contains("electrical-question-pager")) {
                    result.push(card);
                }
            });
        }
        return result;
    }

    function createPager() {
        const f = form();
        if (!f || pager) return;

        pager = document.createElement("div");
        pager.className = "electrical-question-pager";
        pager.innerHTML = `
            <div class="electrical-question-counter" aria-live="polite">
                <span id="electricalQuestionNumber">Soalan 1</span>
                <span id="electricalQuestionTotal">daripada 1</span>
            </div>
            <div class="electrical-question-actions">
                <button type="button" class="electrical-back-button" id="electricalBackButton">← Kembali</button>
                <button type="button" class="electrical-next-button" id="electricalNextButton">Seterusnya →</button>
            </div>`;
        f.appendChild(pager);
        pager.querySelector("#electricalBackButton").addEventListener("click", previous);
        pager.querySelector("#electricalNextButton").addEventListener("click", next);
    }

    function updatePager() {
        if (!pager) return;
        const number = pager.querySelector("#electricalQuestionNumber");
        const total = pager.querySelector("#electricalQuestionTotal");
        const back = pager.querySelector("#electricalBackButton");
        const nextButton = pager.querySelector("#electricalNextButton");
        if (!cards.length) {
            number.textContent = "Tiada soalan";
            total.textContent = "";
            back.disabled = true;
            nextButton.disabled = true;
            return;
        }
        number.textContent = `Soalan ${currentIndex + 1}`;
        total.textContent = `daripada ${cards.length}`;
        back.disabled = currentIndex === 0;
        nextButton.disabled = false;
        nextButton.textContent = currentIndex === cards.length - 1
            ? "Teruskan ke Maklumat Pelanggan →"
            : "Seterusnya →";

        // Hide the renderer's original submit/continue controls so only one
        // navigation row is shown.
        form().querySelectorAll('button[type="submit"], input[type="submit"], .category-question-actions, .question-actions')
            .forEach(button => {
                if (!pager.contains(button)) button.style.display = "none";
            });
    }

    function refresh() {
        if (refreshing) return;
        refreshing = true;
        try {
            const previousCard = cards[currentIndex];
            cards = collectCards();

            // If a conditional question appeared/disappeared, keep the user
            // on the same question where possible.
            if (previousCard && cards.includes(previousCard)) {
                currentIndex = cards.indexOf(previousCard);
            } else if (currentIndex >= cards.length) {
                currentIndex = Math.max(0, cards.length - 1);
            }

            cards.forEach((card, index) => {
                const active = index === currentIndex;
                card.style.display = active ? "" : "none";
                card.setAttribute("aria-hidden", active ? "false" : "true");
            });
            updatePager();
        } finally {
            refreshing = false;
        }
    }

    function validateCurrent() {
        const card = cards[currentIndex];
        if (!card) return true;
        const fields = [...card.querySelectorAll("input, select, textarea")]
            .filter(field => !field.disabled && field.type !== "hidden");

        const groups = new Map();
        fields.filter(field => field.type === "checkbox").forEach(field => {
            const key = field.name || field.id;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(field);
        });

        for (const [name, group] of groups) {
            const question = (window.CATEGORY_FORM_CONFIG?.questions || [])
                .find(item => item.id === name.replace(/\[\]$/, ""));
            if (question?.required && !group.some(field => field.checked)) {
                group[0].setCustomValidity("Sila pilih sekurang-kurangnya satu pilihan.");
                group[0].reportValidity();
                group[0].setCustomValidity("");
                return false;
            }
        }

        for (const field of fields) {
            if (field.type === "checkbox") continue;
            if (!field.checkValidity()) {
                field.reportValidity();
                return false;
            }
        }
        return true;
    }

    function goTo(index) {
        if (!cards.length) return;
        currentIndex = Math.max(0, Math.min(index, cards.length - 1));
        refresh();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function next(event) {
        event?.preventDefault();
        refresh();
        if (!validateCurrent()) return;
        if (currentIndex < cards.length - 1) {
            goTo(currentIndex + 1);
            return;
        }

        const f = form();
        if (!f) return;
        // Re-enable the original controls before the shared form handler runs.
        f.querySelectorAll("button, input[type='submit']").forEach(button => {
            if (!pager.contains(button)) button.style.display = "";
        });
        const submit = [...f.querySelectorAll('button[type="submit"], input[type="submit"]')]
            .find(button => !pager.contains(button));
        if (submit) submit.click();
        else if (typeof f.requestSubmit === "function") f.requestSubmit();
        else f.submit();
    }

    function previous(event) {
        event?.preventDefault();
        if (currentIndex > 0) goTo(currentIndex - 1);
        else history.back();
    }

    function initialize() {
        if (!root() || !form()) return;
        createPager();

        const r = root();
        // Watch generated questions and conditional visibility, but not style
        // attributes, to avoid observer loops while the pager hides cards.
        const observer = new MutationObserver(() => {
            window.requestAnimationFrame(refresh);
        });
        observer.observe(r, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["hidden"]
        });
        r.addEventListener("change", () => setTimeout(refresh, 60));
        setTimeout(refresh, 300);
        setTimeout(refresh, 1000);
    }

    document.addEventListener("DOMContentLoaded", initialize);
})();
