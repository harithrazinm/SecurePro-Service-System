const API_BASE =
    /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
        ? "http://localhost:5001/api"
        : "/api";

let currentLanguage = "ms";

const translations = {
    en: {
        // ---- Navigation ----
        navHome: "Home",
        navGuide: "How to Create a Request",
        navServices: "Service List",
        navContact: "Contact Us",
        navSolutions: "Solutions",
        navWhy: "Why Us",
        navQuote: "Get a Quote",

        // ---- Why SOPro ----
        whyLabel: "WHY SOPRO",
        whyTitle: "Your requests,<br><span>better organized.</span>",
        whyText: "The SOPro system helps our team manage every request more efficiently and give you better service.",
        whyButton: "Create a Service Request →",
        whyOneTitle: "Recorded in the system",
        whyOneText: "All information is stored securely.",
        whyTwoTitle: "Faster response",
        whyTwoText: "The technical team receives complete information.",
        whyThreeTitle: "More organized action",
        whyThreeText: "Easy to follow up at every stage of work.",
        whyFourTitle: "Service records available",
        whyFourText: "Track all your data and service history.",

        // ---- How it works ----
        guideLabel: "HOW IT WORKS",
        guideTitle: "Just <span>3 Easy Steps</span>",
        guideText: "Submit your service request in just a few minutes.",
        guideNote: "You can choose one service below to get started.",
        statusTitle: "Request Status",
        statusReceived: "Request Received",
        statusAssigned: "Technician Assigned",
        statusProgress: "Work In Progress",
        statusCompleted: "Completed",
        stepOneTitle: "Choose a Service",
        stepOneText: "Select the service category you need.",
        stepTwoTitle: "Provide Information",
        stepTwoText: "Fill in the required information completely.",
        stepThreeTitle: "Submit Request",
        stepThreeText: "Your request will be recorded in our system.",

        // ---- Services ----
        servicesLabel: "OUR SERVICES",
        servicesTitle: "Choose the Service You Need",
        servicesText: "Submit a service request in just a few clicks.",
        allServices: "View all services →",
        loadingServices: "Loading services...",
        unableToLoadServices: "Unable to load services.",
        questions: "questions",

        // ---- Help ----
        helpLabel: "HELP & SUPPORT",
        helpTitle: "Need Help?",
        helpText: "Contact our team or create a service request now.",
        whatsappButton: "Chat on WhatsApp →",

        // ---- Info cards ----
        hoursTitle: "Operating Hours",
        hoursText: "9:00 AM - 6:00 PM<br>Sunday - Thursday<br>Saturday (by appointment)<br>Closed: Friday & Public Holidays",
        questionsTitle: "Other Enquiries",
        questionsText: "For quotations, enquiries or partnerships, please contact us by phone or WhatsApp.",

        // ---- Footer ----
        footerText: "Service Request Platform.",
        footerSolutions: "Solutions",
        footerServices: "Services",
        footerContact: "Contact",
        footerBottom: "Official SecurePro Service Platform",

        // ---- Referral (used on service page) ----
        referralEyebrow: "OPTIONAL",
        referralTitle: "Referral Reward",
        referralDescription: "Have a referral code from a SecurePro customer? Enter it below to claim the available reward.",
        referralCode: "Referral Code",
        referralPlaceholder: "Enter referral code",
        checkReferral: "Check Code",
        referralOptional: "Referral code is optional.",
        checkingReferral: "Checking...",
        referralVerified: "Referral code verified successfully.",
        referralAccepted: "Referral code accepted",
        invalidReferral: "Invalid referral code.",
        referralUnavailable: "Unable to check the referral code. Please try again.",
        referralOwnCode: "You cannot use your own referral code."
    },

    ms: {
        // ---- Navigation ----
        navHome: "Utama",
        navGuide: "Cara Membuat Permintaan",
        navServices: "Senarai Servis",
        navContact: "Hubungi Kami",
        navSolutions: "Penyelesaian",
        navWhy: "Kenapa Kami",
        navQuote: "Dapatkan Sebut Harga",

        // ---- Why SOPro ----
        whyLabel: "KENAPA SOPRO",
        whyTitle: "Permintaan anda,<br><span>lebih teratur.</span>",
        whyText: "Sistem SOPro membantu pasukan kami menguruskan setiap permintaan dengan lebih cekap dan memberikan perkhidmatan yang lebih baik kepada anda.",
        whyButton: "Buat Permintaan Servis →",
        whyOneTitle: "Direkod dalam sistem",
        whyOneText: "Semua maklumat disimpan dengan selamat.",
        whyTwoTitle: "Respons lebih cepat",
        whyTwoText: "Pasukan teknikal menerima maklumat lengkap.",
        whyThreeTitle: "Tindakan lebih teratur",
        whyThreeText: "Mudah untuk disusuli dengan setiap peringkat kerja.",
        whyFourTitle: "Rekod servis tersedia",
        whyFourText: "Jejak semua data dan sejarah servis anda.",

        // ---- How it works ----
        guideLabel: "CARA BERFUNGSI",
        guideTitle: "Hanya <span>3 Langkah</span> Mudah",
        guideText: "Hantar permintaan servis anda dalam beberapa minit sahaja.",
        guideNote: "Anda boleh pilih satu servis di bawah untuk bermula.",
        statusTitle: "Status Permintaan",
        statusReceived: "Permintaan Diterima",
        statusAssigned: "Juruteknik Ditugaskan",
        statusProgress: "Kerja Sedang Dijalankan",
        statusCompleted: "Selesai",
        stepOneTitle: "Pilih Servis",
        stepOneText: "Pilih kategori servis yang anda perlukan.",
        stepTwoTitle: "Berikan Maklumat",
        stepTwoText: "Isi maklumat yang diperlukan dengan lengkap.",
        stepThreeTitle: "Hantar Permintaan",
        stepThreeText: "Permintaan anda akan direkodkan dalam sistem kami.",

        // ---- Services ----
        servicesLabel: "PERKHIDMATAN KAMI",
        servicesTitle: "Pilih Servis Yang Anda Perlukan",
        servicesText: "Hantar permintaan servis dengan beberapa klik sahaja.",
        allServices: "Lihat semua servis →",
        loadingServices: "Memuatkan servis...",
        unableToLoadServices: "Tidak dapat memuatkan servis.",
        questions: "soalan",

        // ---- Help ----
        helpLabel: "BANTUAN & SOKONGAN",
        helpTitle: "Perlukan Bantuan?",
        helpText: "Hubungi pasukan kami atau buat permintaan servis sekarang.",
        whatsappButton: "Chat di WhatsApp →",

        // ---- Info cards ----
        hoursTitle: "Waktu Operasi",
        hoursText: "9:00 pagi - 6:00 petang<br>Ahad - Khamis<br>Selasa (by appointment)<br>Cuti: Jumaat & Cuti Umum",
        questionsTitle: "Lain-lain Pertanyaan",
        questionsText: "Untuk sebut harga, pertanyaan atau kerjasama, sila hubungi kami melalui telefon atau WhatsApp.",

        // ---- Footer ----
        footerText: "Platform Permintaan Servis.",
        footerSolutions: "Penyelesaian",
        footerServices: "Servis",
        footerContact: "Hubungi",
        footerBottom: "Platform Servis Rasmi SecurePro",

        // ---- Referral (used on service page) ----
        referralEyebrow: "PILIHAN",
        referralTitle: "Ganjaran Rujukan",
        referralDescription: "Mempunyai kod rujukan daripada pelanggan SecurePro? Masukkan kod di bawah untuk mendapatkan ganjaran yang tersedia.",
        referralCode: "Kod Rujukan",
        referralPlaceholder: "Masukkan kod rujukan",
        checkReferral: "Semak Kod",
        referralOptional: "Kod rujukan adalah pilihan.",
        checkingReferral: "Menyemak...",
        referralVerified: "Kod rujukan berjaya disahkan.",
        referralAccepted: "Kod rujukan diterima",
        invalidReferral: "Kod rujukan tidak sah.",
        referralUnavailable: "Tidak dapat menyemak kod rujukan. Sila cuba lagi.",
        referralOwnCode: "Anda tidak boleh menggunakan kod rujukan sendiri."
    }
};

function applyLanguage() {
    document.documentElement.lang = currentLanguage;

    document.querySelectorAll("[data-i18n]").forEach(element => {
        const key = element.dataset.i18n;
        const translation = translations[currentLanguage][key];

        if (translation) {
            element.innerHTML = translation;
        } else {
            console.warn(`Missing translation: "${key}" for "${currentLanguage}"`);
        }
    });

    const button = document.querySelector("#languageToggle");
    if (button) {
        const switchTo = currentLanguage === "ms" ? "English" : "Bahasa Melayu";
        button.textContent = `🌐 ${switchTo}`;
        button.setAttribute("aria-label", `Switch language to ${switchTo}`);
    }
}

async function loadServices() {
    const grid = document.querySelector("#servicesGrid");
    if (!grid) return;

    const serviceImages = {
        cctv: "assets/cctvt.png",
        troubleshoot_repair: "assets/tnr.jpg",
        autogate: "assets/autogatet.png",
        alarm: "assets/alarmt.jpeg",
        barriergate: "assets/barriert.png",
        solar_cctv: "assets/solarcctvt.jpg",
        attendance: "assets/timet.jpeg",
        access: "assets/doort.jpeg",
        pabx: "assets/pabxt.jpeg",
        solar_pump: "assets/solarpt.jpeg"
    };

    try {
        grid.innerHTML = `<div class="loading">${escapeHtml(translations[currentLanguage].loadingServices)}</div>`;

        const response = await fetch(`${API_BASE}/services`);
        if (!response.ok) throw new Error(translations[currentLanguage].unableToLoadServices);

        const result = await response.json();
        if (!result.success) throw new Error(translations[currentLanguage].unableToLoadServices);

        grid.innerHTML = "";

        (Array.isArray(result.data) ? result.data : []).forEach(service => {
            const card = document.createElement("article");
            card.className = "service-card";
            card.tabIndex = 0;
            card.setAttribute("role", "button");

            const image = serviceImages[service.id];
            const serviceName = service.name?.[currentLanguage] || service.name?.ms || service.name?.en || "Service";
            const questionCount = Number(service.questionCount || 0);

            card.innerHTML = `
                <div class="service-image">
                    ${image
                        ? `<img src="${image}" alt="${escapeHtml(serviceName)}">`
                        : `<div class="service-image-placeholder">?</div>`}
                </div>
                <h3>${escapeHtml(serviceName)}</h3>
                <p>${questionCount} ${escapeHtml(translations[currentLanguage].questions)}</p>
            `;

            const openService = () => {
                localStorage.setItem("securepro_language", currentLanguage);
                window.location.href = `pages/service.html?service=${encodeURIComponent(service.id)}`;
            };

            card.addEventListener("click", openService);
            card.addEventListener("keydown", event => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openService();
                }
            });

            grid.appendChild(card);
        });
    } catch (error) {
        console.error("Load services error:", error);
        grid.innerHTML = `<div class="loading">${escapeHtml(translations[currentLanguage].unableToLoadServices)}</div>`;
    }
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {
    const savedLanguage = localStorage.getItem("securepro_language");
    currentLanguage = savedLanguage === "en" || savedLanguage === "ms" ? savedLanguage : "ms";
    localStorage.setItem("securepro_language", currentLanguage);

    applyLanguage();
    loadServices();

    document.querySelector("#languageToggle")?.addEventListener("click", () => {
        currentLanguage = currentLanguage === "en" ? "ms" : "en";
        localStorage.setItem("securepro_language", currentLanguage);
        applyLanguage();
        loadServices();
    });

    const menuToggle = document.querySelector("#menuToggle");
    const mainNav = document.querySelector("#mainNav");

    menuToggle?.addEventListener("click", () => {
        const open = mainNav.classList.toggle("open");
        menuToggle.setAttribute("aria-expanded", String(open));
    });

    mainNav?.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            mainNav.classList.remove("open");
            menuToggle?.setAttribute("aria-expanded", "false");
        });
    });
});
