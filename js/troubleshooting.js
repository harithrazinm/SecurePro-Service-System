window.CATEGORY_FORM_CONFIG = {
    code: "troubleshoot_repair",
    name: { en: "Troubleshooting / Repair", ms: "Troubleshooting / Pembaikan" },
    back: { en: "← Back", ms: "← Kembali" },
    continue: { en: "Continue to Customer Details →", ms: "Teruskan ke Maklumat Pelanggan →" },
    translations: {
        en: { intro: "Tell us what system is affected and what problem you are experiencing." },
        ms: { intro: "Beritahu kami sistem yang bermasalah dan masalah yang sedang berlaku." }
    },
    questions: [
        {
            id: "system", type: "radio", required: true,
            title: { en: "Select System", ms: "Pilih Sistem" },
            description: { en: "Which system has an issue?", ms: "Sistem manakah yang mengalami masalah?" },
            options: ["CCTV", "Alarm System", "Door Access", "Barrier Gate / LPR", "Electrical", "Network / WiFi", "Intercom", "PA / Audio Visual", "Attendance System", "Smart Home", "Other"].map(x => ({ value: x.toLowerCase().replace(/[^a-z0-9]+/g, "_"), label: { en: x, ms: x } }))
        },
        {
            id: "issue_type", type: "radio", required: true,
            title: { en: "Issue Details", ms: "Butiran Masalah" },
            description: { en: "What problem are you experiencing?", ms: "Apakah masalah yang anda alami?" },
            options: [
                ["not_working", "Not Working", "Sistem langsung tidak berfungsi"],
                ["partial", "Partially Working", "Sebahagian sahaja berfungsi"],
                ["intermittent", "Intermittent Issue", "Masalah datang dan pergi"],
                ["performance", "Performance Issue", "Sistem berfungsi tetapi tidak normal"],
                ["damage", "Physical Damage", "Peralatan / kabel rosak"],
                ["error", "Error / Warning", "Terdapat error atau warning"],
                ["connection", "Connection Issue", "Offline / communication problem"],
                ["power", "Power Issue", "Tiada power / kerap trip"],
                ["unsure", "Not Sure", "Tidak pasti punca masalah"]
            ].map(([value, en, ms]) => ({ value, label: { en, ms } }))
        },
        {
            id: "problem", type: "fields",
            title: { en: "Describe the Problem", ms: "Terangkan Masalah" },
            fields: [{ id: "problem_description", type: "textarea", full: true, required: true, label: { en: "Problem Description", ms: "Penerangan Masalah" }, placeholder: { en: "Example: 4 of 8 CCTV cameras have no display since yesterday.", ms: "Contoh: 4 daripada 8 CCTV tiada display sejak semalam." } }]
        },
        {
            id: "system_information", type: "fields",
            title: { en: "System Information", ms: "Maklumat Sistem" },
            description: { en: "Tell us about the existing system.", ms: "Beritahu kami tentang sistem sedia ada." },
            fields: [
                { id: "installed_by", type: "select", label: { en: "Installed By", ms: "Dipasang Oleh" }, options: [
                    { value: "sonic", label: { en: "Sonic", ms: "Sonic" } },
                    { value: "other", label: { en: "Other Contractor", ms: "Kontraktor Lain" } },
                    { value: "unknown", label: { en: "Not Sure", ms: "Tidak Pasti" } }
                ] },
                { id: "brand", type: "text", label: { en: "Brand", ms: "Jenama" } },
                { id: "model", type: "text", label: { en: "Model", ms: "Model" } },
                { id: "quantity", type: "number", min: 0, label: { en: "Quantity / Points", ms: "Kuantiti / Point" } },
                { id: "system_age", type: "text", label: { en: "Approx. System Age", ms: "Anggaran Umur Sistem" } },
                { id: "problem_started", type: "select", label: { en: "Problem Started", ms: "Masalah Bermula" }, options: [
                    ["today", "Today"], ["1_3_days", "1–3 Days Ago"], ["1_week", "About a Week Ago"], ["more", "More Than a Week Ago"], ["unknown", "Not Sure"]
                ].map(([value, en]) => ({ value, label: { en, ms: en } })) }
            ]
        },
        {
            id: "priority", type: "fields",
            title: { en: "Priority", ms: "Keutamaan" },
            fields: [
                { id: "priority", type: "select", required: true, label: { en: "Priority", ms: "Keutamaan" }, options: [
                    { value: "normal", label: { en: "Normal", ms: "Normal" } },
                    { value: "urgent", label: { en: "Urgent", ms: "Segera" } }
                ] }
            ]
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
   TROUBLESHOOTING — ONE QUESTION PER PAGE
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
        pager.className = "electrical-question-pager";
        pager.innerHTML = `
            <div class="electrical-question-counter" aria-live="polite">
                <span id="electricalQuestionNumber"></span>
                <span id="electricalQuestionTotal"></span>
            </div>
            <div class="electrical-question-actions">
                <button type="button" class="electrical-back-button" id="electricalBackButton"></button>
                <button type="button" class="electrical-next-button" id="electricalNextButton"></button>
            </div>`;
        f.appendChild(pager);

        pager.querySelector("#electricalBackButton").addEventListener("click", previous);
        pager.querySelector("#electricalNextButton").addEventListener("click", next);
    }

    function updatePager(visible) {
        if (!pager) return;

        const cfg = window.CATEGORY_FORM_CONFIG || {};
        const number = pager.querySelector("#electricalQuestionNumber");
        const total = pager.querySelector("#electricalQuestionTotal");
        const back = pager.querySelector("#electricalBackButton");
        const nextButton = pager.querySelector("#electricalNextButton");

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
        card?.querySelectorAll(".electrical-error").forEach(el => el.remove());
    }

    function showError(card, message) {
        clearError(card);
        const el = document.createElement("div");
        el.className = "electrical-error";
        el.setAttribute("role", "alert");
        el.style.cssText = "margin-top:12px;color:#c0392b;font-size:13px;font-weight:600";
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