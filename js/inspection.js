window.CATEGORY_FORM_CONFIG = {
    code: "inspection",
    name: { en: "Inspection", ms: "Pemeriksaan" },
    back: { en: "← Back", ms: "← Kembali" },
    continue: { en: "Continue to Customer Details →", ms: "Teruskan ke Maklumat Pelanggan →" },
    translations: {
        en: { intro: "Tell us what you want us to inspect and the condition of the existing system." },
        ms: { intro: "Beritahu kami perkara yang ingin diperiksa dan keadaan sistem sedia ada." }
    },
    questions: [
        {
            id: "inspection_purpose", type: "radio", required: true,
            title: { en: "Inspection Purpose", ms: "Tujuan Pemeriksaan" },
            description: { en: "What would you like us to inspect?", ms: "Apakah yang anda ingin kami periksa?" },
            options: [
                ["existing", "Existing System Assessment", "Semak keadaan sistem sedia ada"],
                ["site", "Site / Technical Assessment", "Pemeriksaan keadaan tapak"],
                ["upgrade", "Upgrade Assessment", "Semak kesesuaian untuk upgrade"],
                ["expansion", "Expansion Assessment", "Tambah device / point pada sistem sedia ada"],
                ["safety", "Safety / Condition Assessment", "Semak keadaan dan keselamatan pemasangan"],
                ["consultation", "Second Opinion / Consultation", "Dapatkan pandangan teknikal Sonic"],
                ["other", "Others", "Lain-lain"]
            ].map(([value, en, ms]) => ({
                value, label: { en, ms },
                ...(value === "other" ? { otherInput: { id: "inspection_purpose_other_text", type: "textarea", required: true, label: { en: "Please specify", ms: "Sila nyatakan" }, placeholder: { en: "Describe what you would like inspected", ms: "Terangkan perkara yang ingin diperiksa" } } } : {})
            }))
        },
        {
            id: "inspection_systems", type: "multi", required: true,
            title: { en: "System / Service", ms: "Sistem / Servis" },
            description: { en: "Which system requires inspection? You may select more than one.", ms: "Sistem manakah yang memerlukan pemeriksaan? Boleh pilih lebih daripada satu." },
            options: [
                ["cctv", "CCTV"], ["alarm", "Alarm"], ["access", "Door Access"], ["barrier", "Barrier Gate / LPR"],
                ["electrical", "Electrical"], ["network", "Network / WiFi"], ["intercom", "Intercom"], ["pa", "PA / Audio Visual"],
                ["attendance", "Attendance"], ["smart_home", "Smart Home"], ["other", "Other"]
            ].map(([value, en]) => ({
                value, label: { en, ms: en },
                ...(value === "other" ? { otherInput: { id: "inspection_systems_other_text", type: "text", required: true, label: { en: "Please specify system / service", ms: "Sila nyatakan sistem / servis" }, placeholder: { en: "Enter the system or service", ms: "Masukkan sistem atau servis" } } } : {})
            }))
        },
        {
            id: "premise_type", type: "radio", required: true,
            title: { en: "Premise Type", ms: "Jenis Premis" },
            description: { en: "Select the type of premises to be inspected.", ms: "Pilih jenis premis yang akan diperiksa." },
            options: [
                ["residential", "Residential / House", "Kediaman / Rumah"],
                ["office", "Office", "Pejabat"],
                ["shop", "Shop / Retail", "Kedai / Runcit"],
                ["commercial", "Commercial Building", "Bangunan Komersial"],
                ["industrial", "Factory / Industrial", "Kilang / Industri"],
                ["school", "School / Institution", "Sekolah / Institusi"],
                ["other", "Other", "Lain-lain"]
            ].map(([value, en, ms]) => ({
                value, label: { en, ms },
                ...(value === "other" ? { otherInput: { id: "premise_type_other_text", type: "text", required: true, label: { en: "Please specify premise type", ms: "Sila nyatakan jenis premis" }, placeholder: { en: "Enter the premise type", ms: "Masukkan jenis premis" } } } : {})
            }))
        },
        {
            id: "current_condition", type: "radio", required: true,
            title: { en: "Current Condition", ms: "Keadaan Semasa" },
            description: { en: "What is the current condition?", ms: "Apakah keadaan semasa?" },
            note: { en: "If you select Not Sure, SOPro may recommend Troubleshooting / Repair instead.", ms: "Jika pilih Tidak Pasti, SOPro mungkin mencadangkan Troubleshooting / Repair." },
            options: [
                ["working", "Working Normally", "Berfungsi seperti biasa"],
                ["assessment", "Working, but needs assessment", "Berfungsi tetapi perlu penilaian"],
                ["partial", "Partially Working", "Berfungsi sebahagian"],
                ["old", "Old / Outdated System", "Sistem lama / ketinggalan"],
                ["unsure", "Not Sure", "Tidak pasti"]
            ].map(([value, en, ms]) => ({ value, label: { en, ms } }))
        },
        {
            id: "existing_details", type: "fields",
            title: { en: "Existing System Details", ms: "Butiran Sistem Sedia Ada" },
            description: { en: "These details are optional because many customers may not know the brand or model.", ms: "Butiran ini adalah pilihan kerana ramai pelanggan mungkin tidak mengetahui jenama atau model." },
            fields: [
                { id: "brand", type: "text", label: { en: "Brand", ms: "Jenama" } },
                { id: "model", type: "text", label: { en: "Model", ms: "Model" } },
                { id: "quantity", type: "text", label: { en: "Quantity / Points", ms: "Kuantiti / Point" } },
                { id: "age", type: "text", label: { en: "Approx. System Age", ms: "Anggaran Umur Sistem" } },
                { id: "installed_by", type: "select", label: { en: "Installed By", ms: "Dipasang Oleh" }, options: [
                    { value: "sonic", label: { en: "Sonic", ms: "Sonic" } },
                    { value: "other", label: { en: "Other Contractor", ms: "Kontraktor Lain" } },
                    { value: "unknown", label: { en: "Unknown", ms: "Tidak Pasti" } }
                ] },
                { id: "last_service_date", type: "date", label: { en: "Last Service Date", ms: "Tarikh Servis Terakhir" } }
            ]
        },
        {
            id: "inspection_targets", type: "multi", required: true,
            title: { en: "What Needs to Be Inspected?", ms: "Apa Yang Perlu Diperiksa?" },
            description: { en: "Use the checklist to quickly select the areas you want inspected.", ms: "Gunakan senarai semak untuk memilih bahagian yang ingin diperiksa." },
            options: [
                "Overall System Condition", "Equipment / Devices", "Cabling & Connection", "Power Supply", "Network / Connectivity",
                "Configuration / Settings", "Installation Condition", "Coverage / Performance", "Upgrade Possibility", "Expansion Possibility", "Other"
            ].map((label, i) => {
                const value = label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
                return { value, label: { en: label, ms: label }, ...(label === "Other" ? { otherInput: { id: "inspection_targets_other_text", type: "text", required: true, label: { en: "Please specify inspection area", ms: "Sila nyatakan bahagian pemeriksaan" }, placeholder: { en: "Enter the area to inspect", ms: "Masukkan bahagian yang ingin diperiksa" } } } : {}) };
            })
        },
        {
            id: "inspection_description", type: "fields",
            title: { en: "Describe Your Inspection Request", ms: "Terangkan Permintaan Pemeriksaan Anda" },
            fields: [{ id: "inspection_description", type: "textarea", full: true, label: { en: "Description", ms: "Penerangan" }, placeholder: { en: "Example: CCTV has been used for about 5 years. We want to know its current condition and whether an upgrade is needed.", ms: "Contoh: CCTV telah digunakan lebih kurang 5 tahun. Kami ingin tahu keadaan sistem sekarang dan sama ada perlu upgrade." } }]
        },
        {
            id: "supporting_information", type: "fields", required: false,
            title: { en: "Supporting Information", ms: "Maklumat Sokongan" },
            description: {
                en: "Help our technician understand the site better. Every item below is optional.",
                ms: "Bantu juruteknik kami memahami tapak dengan lebih baik. Semua item di bawah adalah pilihan."
            },
            fields: [
                { id: "supporting_photos", type: "file", label: { en: "Upload Photos", ms: "Muat Naik Foto" }, accept: ["image/jpeg", "image/png", "image/webp"], multiple: true },
                { id: "supporting_videos", type: "file", label: { en: "Upload Videos", ms: "Muat Naik Video" }, accept: ["video/mp4", "video/quicktime", "video/webm"], multiple: true },
                { id: "supporting_floor_plan", type: "file", label: { en: "Upload Floor Plan or Drawing", ms: "Muat Naik Pelan Lantai atau Lukisan" }, accept: ["application/pdf", "image/jpeg", "image/png", "image/webp"], multiple: true },
                { id: "supporting_previous_documents", type: "file", label: { en: "Upload Previous Quotation or Report", ms: "Muat Naik Sebut Harga atau Laporan Terdahulu" }, accept: ["application/pdf", "image/jpeg", "image/png", "image/webp"], multiple: true }
            ]
        },
        {
            id: "appointment", type: "fields",
            title: { en: "Appointment", ms: "Temujanji" },
            description: { en: "Preferred inspection schedule.", ms: "Jadual pemeriksaan pilihan." },
            fields: [
                { id: "preferred_date", type: "date", required: true, label: { en: "Preferred Date", ms: "Tarikh Pilihan" } },
                { id: "preferred_time", type: "time", required: true, label: { en: "Preferred Time", ms: "Masa Pilihan" } },
                { id: "alternative_date", type: "date", label: { en: "Alternative Date", ms: "Tarikh Alternatif" } }
            ]
        }
    ]
};


/* Save Inspection uploads in the same IndexedDB store used by Customer Details.
   Customer Details then passes them to review.js, which posts customer_photos to the API. */
(function () {
    "use strict";
    const DB_NAME = "SecureProPhotosDB";
    const STORE_NAME = "photos";
    const MAX_FILES = 10;
    const MAX_SIZE = 20 * 1024 * 1024;
    const ALLOWED = new Set([
        "image/jpeg", "image/png", "image/webp",
        "video/mp4", "video/quicktime", "video/webm",
        "application/pdf"
    ]);
    let replaySubmit = false;
    let submitting = false;

    function openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = event => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    function getSelectedFiles(form) {
        return [...form.querySelectorAll('input[type="file"]')]
            .flatMap(input => [...(input.files || [])].map(file => ({ file, fieldId: input.dataset.answer || "supporting_information" })));
    }

    async function persistFiles(items) {
        if (items.length > MAX_FILES) throw new Error("You can upload a maximum of 10 files in total.");
        for (const item of items) {
            const file = item.file;
            if (file.size > MAX_SIZE) throw new Error(`${file.name}: maximum file size is 20 MB.`);
            if (!ALLOWED.has(file.type)) throw new Error(`${file.name}: unsupported file type. Use JPG, PNG, WEBP, MP4, MOV, WEBM or PDF.`);
        }
        const db = await openDB();
        try {
            await new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, "readwrite");
                const store = tx.objectStore(STORE_NAME);
                // Replace earlier Inspection attachments, while preserving other workflow records.
                const getAll = store.getAll();
                getAll.onsuccess = () => {
                    (getAll.result || []).filter(record => record.source === "inspection")
                        .forEach(record => store.delete(record.id));
                    items.forEach(({ file, fieldId }) => store.add({
                        source: "inspection", fieldId,
                        name: file.name, type: file.type, file
                    }));
                };
                getAll.onerror = () => reject(getAll.error);
                tx.oncomplete = resolve;
                tx.onerror = () => reject(tx.error);
                tx.onabort = () => reject(tx.error || new Error("Could not save selected files."));
            });
        } finally {
            db.close();
        }
    }

    function showUploadError(form, message) {
        let error = form.querySelector(".inspection-upload-error");
        if (!error) {
            error = document.createElement("p");
            error.className = "inspection-upload-error question-error";
            error.setAttribute("role", "alert");
            form.prepend(error);
        }
        error.textContent = message;
        error.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    document.addEventListener("DOMContentLoaded", () => {
        const form = document.querySelector("#questionForm");
        if (!form) return;
        form.addEventListener("submit", async event => {
            if (replaySubmit) { replaySubmit = false; return; }
            event.preventDefault();
            event.stopImmediatePropagation();
            if (submitting) return;
            submitting = true;
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) submitButton.disabled = true;
            const error = form.querySelector(".inspection-upload-error");
            if (error) error.remove();
            try {
                await persistFiles(getSelectedFiles(form));
                replaySubmit = true;
                form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
            } catch (err) {
                showUploadError(form, err.message || "Unable to save attachments. Please try again.");
                if (submitButton) submitButton.disabled = false;
            } finally {
                submitting = false;
            }
        }, true);
    });
})();



/* Pager styles now live in category-question.css (.question-pager-*). */

/* ==========================================================
   INSPECTION — ONE QUESTION PER PAGE
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

/* Ensure the inline "Other" input remains visibly boxed and easy to type into. */
(function () {
    if (document.getElementById("inspection-inline-input-fix")) return;
    const style = document.createElement("style");
    style.id = "inspection-inline-input-fix";
    style.textContent = `
      .option-has-other-input { grid-template-columns: 22px minmax(0,1fr) !important; }
      .inline-other-field {
        grid-column: 1 / -1 !important;
        display: block;
        width: auto;
        min-width: 0;
        margin: .65rem 0 0 1.8rem !important;
        padding: 1rem !important;
        box-sizing: border-box;
        border: 1px solid #bfdbfe !important;
        border-radius: 13px !important;
        background: linear-gradient(135deg,#eff6ff,#ffffff) !important;
      }
      .inline-other-field[hidden] { display: none !important; }
      .inline-other-field label {
        display: block !important;
        margin: 0 0 .5rem !important;
        color: #1e3a8a !important;
        font-size: .85rem !important;
        font-weight: 750 !important;
      }
      .inline-other-field input[type="text"],
      .inline-other-field textarea {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
        padding: .85rem .95rem !important;
        border: 1px solid #cbd5e1 !important;
        border-radius: 10px !important;
        background: #fff !important;
        color: #14243b !important;
        font: inherit !important;
        line-height: 1.5 !important;
        outline: none !important;
      }
      .inline-other-field textarea { min-height: 100px !important; resize: vertical; }
      .inline-other-field input:focus,
      .inline-other-field textarea:focus {
        border-color: #2563eb !important;
        box-shadow: 0 0 0 3px rgba(37,99,235,.14) !important;
      }
      .inline-other-invalid input,
      .inline-other-invalid textarea { border-color: #dc2626 !important; }
      @media (max-width: 600px) {
        .inline-other-field { margin-left: .25rem !important; }
      }
    `;
    document.head.appendChild(style);
})();
