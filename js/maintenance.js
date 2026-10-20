window.CATEGORY_FORM_CONFIG = {
    code: "maintenance_service",
    name: { en: "Maintenance & Service", ms: "Penyelenggaraan & Servis" },
    back: { en: "← Back", ms: "← Kembali" },
    continue: { en: "Continue to Customer Details →", ms: "Teruskan ke Maklumat Pelanggan →" },
    translations: {
        en: { intro: "Tell us about the system you want us to maintain or service." },
        ms: { intro: "Beritahu kami tentang sistem yang anda mahu selenggara atau servis." }
    },
    questions: [
        {
            id: "service_type", type: "radio", required: true,
            title: { en: "Select Service Type", ms: "Pilih Jenis Servis" },
            description: { en: "Choose the purpose of your maintenance request.", ms: "Pilih tujuan permintaan penyelenggaraan anda." },
            options: [
                ["preventive", "Preventive Maintenance", "Servis berkala untuk elakkan kerosakan"],
                ["general", "General Service", "Cleaning, checking, adjustment & testing"],
                ["health_check", "System Health Check", "Semak keseluruhan keadaan sistem"],
                ["scheduled", "Scheduled Maintenance", "Maintenance mengikut kontrak / jadual"],
                ["optimization", "System Optimization", "Configuration / tuning untuk tingkatkan prestasi"]
            ].map(([value, en, ms]) => ({ value, label: { en, ms } }))
        },
        {
            id: "systems", type: "multi", required: true,
            title: { en: "Select System", ms: "Pilih Sistem" },
            description: { en: "Select one or more systems.", ms: "Pilih satu atau lebih sistem." },
            options: ["CCTV", "Alarm", "Door Access", "Barrier Gate", "Network / WiFi", "Electrical", "Intercom", "PA / Audio Visual", "Attendance", "Smart Home", "Other"].map(x => ({ value: x.toLowerCase().replace(/[^a-z0-9]+/g, "_"), label: { en: x, ms: x } }))
        },
        {
            id: "system_information", type: "fields",
            title: { en: "System Information", ms: "Maklumat Sistem" },
            description: { en: "Provide what you know about the existing system. Optional information can be left blank.", ms: "Masukkan maklumat yang anda tahu tentang sistem sedia ada. Maklumat pilihan boleh dibiarkan kosong." },
            fields: [
                { id: "installed_by", type: "select", label: { en: "System Installed By", ms: "Sistem Dipasang Oleh" }, options: [
                    { value: "sonic", label: { en: "Sonic", ms: "Sonic" } },
                    { value: "other", label: { en: "Other Contractor", ms: "Kontraktor Lain" } },
                    { value: "unknown", label: { en: "Not Sure", ms: "Tidak Pasti" } }
                ] },
                { id: "system_age", type: "text", label: { en: "Approximate System Age", ms: "Anggaran Umur Sistem" } },
                { id: "quantity", type: "number", min: 0, label: { en: "Quantity / Number of Devices", ms: "Kuantiti / Bilangan Peranti" } },
                { id: "last_service_date", type: "date", label: { en: "Last Service Date", ms: "Tarikh Servis Terakhir" } },
                { id: "system_status", type: "select", label: { en: "Is the system currently working?", ms: "Adakah sistem sedang berfungsi?" }, options: [
                    { value: "yes", label: { en: "Yes", ms: "Ya" } },
                    { value: "partial", label: { en: "Partially", ms: "Sebahagian" } },
                    { value: "no", label: { en: "No", ms: "Tidak" } }
                ] }
            ],
            note: { en: "If the system is not working, it may require Troubleshooting / Repair instead.", ms: "Jika sistem tidak berfungsi, ia mungkin memerlukan Troubleshooting / Repair." }
        },
        {
            id: "premise", type: "fields",
            title: { en: "Premise Type", ms: "Jenis Premis" },
            fields: [
                { id: "premise_type", type: "select", required: true, label: { en: "Premise Type", ms: "Jenis Premis" }, options: ["Residential", "Shop", "Office", "Factory", "Warehouse", "School", "Mosque", "Government", "Other"].map(x => ({ value: x.toLowerCase(), label: { en: x, ms: x } })) }
            ]
        }
    ]
};

/* ==========================================================
   MAINTENANCE — ONE QUESTION PER PAGE
   category-form.js renders the cards (<section class="question-card">)
   and hides/disables conditional ones. This script only pages through
   the cards that are currently visible.
   ========================================================== */
(function () {
    "use strict";

    const language = localStorage.getItem("securepro_language") === "en" ? "en" : "ms";

    const TEXT = {
        en: { q: "Question", of: "of", next: "Next →", required: "This question is required.", none: "No questions" },
        ms: { q: "Soalan", of: "daripada", next: "Seterusnya →", required: "Soalan ini wajib dijawab.", none: "Tiada soalan" }
    }[language];

    const root = () => document.querySelector("#categoryQuestions");
    const form = () => document.querySelector("#questionForm");

    let pager = null;
    let activeCard = null;
    let currentIndex = 0;
    let backHref = "../index.html#services";

    const allCards = () => [...root().querySelectorAll(":scope > .question-card")];
    const visibleCards = () => allCards().filter(card => !card.hidden);

    const questionOf = card =>
        (window.CATEGORY_FORM_CONFIG?.questions || [])
            .find(q => q.id === card?.dataset.questionId);

    /* ---------- pager UI ---------- */

    function createPager() {
        const f = form();
        if (!f || pager) return;

        pager = document.createElement("div");
        pager.className = "question-pager";
        pager.innerHTML = `
            <div class="question-pager-counter" aria-live="polite">
                <span id="questionPagerNumber"></span>
                <span id="questionPagerTotal"></span>
            </div>
            <div class="question-pager-actions">
                <button type="button" class="question-pager-back" id="questionPagerBack"></button>
                <button type="button" class="question-pager-next" id="questionPagerNext"></button>
            </div>`;
        f.appendChild(pager);

        pager.querySelector("#questionPagerBack").addEventListener("click", previous);
        pager.querySelector("#questionPagerNext").addEventListener("click", next);
    }

    function updatePager(visible) {
        if (!pager) return;

        const cfg = window.CATEGORY_FORM_CONFIG || {};
        const number = pager.querySelector("#questionPagerNumber");
        const total = pager.querySelector("#questionPagerTotal");
        const back = pager.querySelector("#questionPagerBack");
        const nextButton = pager.querySelector("#questionPagerNext");

        back.textContent = cfg.back?.[language] || "← Back";

        if (!visible.length) {
            number.textContent = TEXT.none;
            total.textContent = "";
            nextButton.disabled = true;
            return;
        }

        number.textContent = `${TEXT.q} ${currentIndex + 1}`;
        total.textContent = `${TEXT.of} ${visible.length}`;
        nextButton.disabled = false;
        nextButton.textContent = currentIndex === visible.length - 1
            ? (cfg.continue?.[language] || "Continue →")
            : TEXT.next;
    }

    /* ---------- show only the active question ---------- */

    function refresh() {
        const r = root();
        if (!r) return;

        const all = allCards();
        const visible = all.filter(card => !card.hidden);

        // Stay on the same question when conditional ones appear/disappear.
        if (activeCard && visible.includes(activeCard)) {
            currentIndex = visible.indexOf(activeCard);
        } else {
            currentIndex = Math.min(currentIndex, Math.max(0, visible.length - 1));
        }
        activeCard = visible[currentIndex] || null;

        all.forEach(card => {
            const active = card === activeCard;
            card.style.display = active ? "" : "none";
            card.setAttribute("aria-hidden", active ? "false" : "true");
        });

        updatePager(visible);
    }

    /* ---------- validation ---------- */

    function clearError(card) {
        card?.querySelectorAll(".question-error").forEach(el => el.remove());
    }

    function showError(card, message) {
        clearError(card);
        const el = document.createElement("div");
        el.className = "question-error";
        el.setAttribute("role", "alert");
        el.textContent = message;
        card.appendChild(el);
    }

    function validateCurrent() {
        const card = activeCard;
        if (!card) return true;

        const question = questionOf(card);
        const fields = [...card.querySelectorAll("input,select,textarea")]
            .filter(el => !el.disabled);

        if (question?.required) {
            const answered = fields.some(el => {
                if (el.type === "radio" || el.type === "checkbox") return el.checked;
                if (el.type === "file") return el.files && el.files.length > 0;
                return String(el.value).trim() !== "";
            });

            if (!answered) {
                showError(card, TEXT.required);
                fields[0]?.focus?.();
                return false;
            }
        }

        for (const el of fields) {
            if (el.type === "radio" || el.type === "checkbox") continue;
            if (!el.checkValidity()) {
                el.reportValidity();
                return false;
            }
        }

        clearError(card);
        return true;
    }

    /* ---------- navigation ---------- */

    function goTo(index) {
        const visible = visibleCards();
        if (!visible.length) return;

        currentIndex = Math.max(0, Math.min(index, visible.length - 1));
        activeCard = visible[currentIndex];
        refresh();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function next(event) {
        event?.preventDefault();
        refresh();
        if (!validateCurrent()) return;

        const visible = visibleCards();

        if (currentIndex < visible.length - 1) {
            goTo(currentIndex + 1);
            return;
        }

        // Last question: let category-form.js validate, save and continue.
        const f = form();
        if (!f) return;

        if (typeof f.requestSubmit === "function") f.requestSubmit();
        else f.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    }

    function previous(event) {
        event?.preventDefault();

        if (currentIndex > 0) goTo(currentIndex - 1);
        else window.location.href = backHref;
    }

    /* ---------- start ---------- */

    function initialize() {
        const r = root();
        const f = form();
        if (!r || !f) return;

        // Our own per-question validation replaces the browser's popups,
        // which can't focus fields on pages that are currently hidden.
        f.noValidate = true;

        // Keep the page language and hard-coded header text in step with the chosen language.
        document.documentElement.lang = language;
        const pageName = window.CATEGORY_FORM_CONFIG?.name?.[language];
        if (pageName) {
            const eyebrow = document.querySelector(".category-question-header .eyebrow");
            const heading = document.querySelector(".category-question-header h1");
            if (eyebrow) eyebrow.textContent = pageName.toUpperCase();
            if (heading) heading.textContent = pageName;
            document.title = `SecurePro | ${pageName}`;
        }

        // Use the renderer's own Back link target, then hide its button row
        // (the pager has the navigation now).
        const actions = r.querySelector(":scope > .question-actions");
        const link = actions?.querySelector("a[href]");
        if (link) backHref = link.getAttribute("href");
        if (actions) actions.style.display = "none";

        createPager();

        // category-form.js registered its own "change" listener first, so
        // conditional questions are already updated when this one runs.
        r.addEventListener("change", () => {
            clearError(activeCard);
            refresh();
        });

        refresh();
    }

    document.addEventListener("DOMContentLoaded", initialize);
})();