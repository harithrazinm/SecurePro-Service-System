/* =========================================================
   SECUREPRO - CUSTOMER PAGE
   ========================================================= */

const API_BASE =
    /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
        ? "http://localhost:5001/api"
        : "https://securepro-service-system.onrender.com/api";

let currentLanguage = "ms";

const translations = {
    en: {
        eyebrow: "SMART SECURITY SOLUTIONS",
        heroTitle: "Find the right system for your space.",
        heroDescription: "Answer a few simple questions and we'll help identify the right SecurePro solution for your home or business.",
        startButton: "Start Your Request",
        servicesTitle: "Choose a solution",
        servicesDescription: "Select the service you are interested in.",
        loadingServices: "Loading services...",
        unableToLoadServices: "Unable to load services.",
        questions: "questions",
        heroStatusValue: "System active",
        heroVisualCaption: "Real-time monitoring for every SecurePro solution.",
        guideTitle: "How to use SecurePro",
        guideDescription: "Choose the service you need below. You will then be guided through a few simple questions to help us understand your requirements.",
        guideStep1: "Choose a service",
        guideStep2: "Answer the questions",
        guideStep3: "Review & send",
        contactEyebrow: "CONTACT US",
        contactTitle: "Need assistance?",
        contactDescription: "For enquiries about products, services or service requests, please contact Sonic System Solution.",
        contactSecurePro: "Security & Smart System Solutions",
        operatedByLabel: "Operated by",
        officialPortalLabel: "Official Service Portal",
        officialPortalDescription: "SecurePro Service Management System",
        footerText: "Security and smart system solutions.",
        footerCompany: "SecurePro is operated by Sonic System Solution.",
        officialPlatform: "Official SecurePro Service Platform"
    },
    ms: {
        eyebrow: "PENYELESAIAN KESELAMATAN PINTAR",
        heroTitle: "Cari sistem yang sesuai untuk ruang anda.",
        heroDescription: "Jawab beberapa soalan mudah dan kami akan membantu mengenal pasti penyelesaian SecurePro yang sesuai untuk rumah atau perniagaan anda.",
        startButton: "Mula Permintaan",
        servicesTitle: "Pilih penyelesaian",
        servicesDescription: "Pilih servis yang anda perlukan.",
        loadingServices: "Memuatkan servis...",
        unableToLoadServices: "Tidak dapat memuatkan servis.",
        questions: "soalan",
        heroStatusValue: "Sistem aktif",
        heroVisualCaption: "Pemantauan masa nyata untuk setiap penyelesaian SecurePro.",
        guideTitle: "Cara menggunakan SecurePro",
        guideDescription: "Pilih servis yang anda perlukan di bawah. Anda akan dibimbing melalui beberapa soalan mudah untuk membantu kami memahami keperluan anda.",
        guideStep1: "Pilih servis",
        guideStep2: "Jawab soalan",
        guideStep3: "Semak & hantar",
        contactEyebrow: "HUBUNGI KAMI",
        contactTitle: "Perlukan bantuan?",
        contactDescription: "Untuk pertanyaan mengenai produk, perkhidmatan atau permintaan servis, sila hubungi Sonic System Solution.",
        contactSecurePro: "Penyelesaian Keselamatan & Sistem Pintar",
        operatedByLabel: "Dikendalikan oleh",
        officialPortalLabel: "Portal Servis Rasmi",
        officialPortalDescription: "Sistem Pengurusan Servis SecurePro",
        footerText: "Penyelesaian keselamatan dan sistem pintar.",
        footerCompany: "SecurePro dikendalikan oleh Sonic System Solution.",
        officialPlatform: "Platform Servis Rasmi SecurePro"
    }
};

function applyLanguage() {
    document.documentElement.lang = currentLanguage;

    document.querySelectorAll("[data-i18n]").forEach(element => {
        const key = element.dataset.i18n;
        const translation = translations[currentLanguage][key];
        if (translation) {
            element.textContent = translation;
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
    if (!grid) {
        return;
    }

    try {
        grid.innerHTML = `<div class="loading">${escapeHtml(translations[currentLanguage].loadingServices)}</div>`;

        const response = await fetch(`${API_BASE}/services`);
        if (!response.ok) {
            throw new Error(translations[currentLanguage].unableToLoadServices);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(translations[currentLanguage].unableToLoadServices);
        }

        renderServices(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
        console.error("Load services error:", error);
        grid.innerHTML = `<div class="loading">${escapeHtml(translations[currentLanguage].unableToLoadServices)}</div>`;
    }
}

function renderServices(services) {
    const grid = document.querySelector("#servicesGrid");
    if (!grid) {
        return;
    }

    const serviceImages = {
        cctv: "assets/cctv.png",
        autogate: "assets/autogate.png",
        alarm: "assets/alarm.png",
        barriergate: "assets/barrier.png",
        solar_cctv: "assets/solarcctv.png",
        attendance: "assets/time.png",
        access: "assets/door.png",
        pabx: "assets/pabx.png",
        solar_pump: "assets/solar-pump.png",
        troubleshoot_repair: "assets/trob.png"
    };

    grid.innerHTML = "";

    services.forEach(service => {
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
                    : `<div class="service-image-placeholder">?</div>`
                }
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

    if (savedLanguage === "en" || savedLanguage === "ms") {
        currentLanguage = savedLanguage;
    } else {
        currentLanguage = "ms";
        localStorage.setItem("securepro_language", "ms");
    }

    applyLanguage();
    loadServices();

    document.querySelector("#languageToggle")?.addEventListener("click", () => {
        currentLanguage = currentLanguage === "en" ? "ms" : "en";
        localStorage.setItem("securepro_language", currentLanguage);
        applyLanguage();
        loadServices();
    });

    document.querySelector("#startButton")?.addEventListener("click", () => {
        document.querySelector("#services")?.scrollIntoView({ behavior: "smooth" });
    });
});