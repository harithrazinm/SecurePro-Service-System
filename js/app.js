const API_BASE =
    /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
        ? "http://localhost:5001/api"
        : "https://securepro-service-system.onrender.com/api";

let currentLanguage = "ms";

const translations = {
    en: {
        navHome:"Home", navSolutions:"Solutions", navServices:"Services", navWhy:"Why Us", navContact:"Contact", navQuote:"Get a Quote", navGuide:"How to Create a Request",
        heroKicker:"SMART SECURITY SOLUTIONS",
        heroTitle:"Your safety.<br><span>Our priority.</span>",
        heroDescription:"CCTV, access control, alarm, autogate and smart-system solutions for homes, businesses and professional premises.",
        heroPrimary:"Explore Solutions", heroSecondary:"Request a Quote",
        trustOne:"Quality Products", trustTwo:"Professional Installation", trustThree:"After-Sales Support",
        heroBadgeTitle:"SECURE YOUR SPACE", heroBadgeText:"Smart security solutions",
        statusTitle:"System Active", statusText:"Protection around the clock",
        introLabel:"SONIC SYSTEM SOLUTION",
        introTitle:"One place for all your security needs.",
        introText:"From consultation and installation to maintenance and troubleshooting, SecurePro helps you manage your service needs more easily.",
        solutionsLabel:"OUR SOLUTIONS", solutionsTitle:"Complete solutions for every space.",
        solutionsText:"Choose the system you need and we will guide you through the request process.",
        loadingServices:"Loading services...", unableToLoadServices:"Unable to load services.", questions:"questions",
        processLabel:"OUR SERVICES", processTitle:"More than installation. We support you throughout the journey.",
        processText:"Get support from initial consultation through post-installation service.",
        processOne:"Product & service consultation", processTwo:"Professional installation", processThree:"Maintenance & wiring", processFour:"Troubleshooting & upgrade",
        statExperience:"Years of experience", statProjects:"Projects completed", statSupport:"Commitment to quality", statProtection:"Solution support",
        whyLabel:"WHY CHOOSE SONIC", whyTitle:"Technology that helps you feel safer.",
        whyText:"We combine the right products, neat installation and after-sales support to create practical security solutions.",
        whyButton:"Talk to us ↗",
        whyOneTitle:"Quality Products", whyOneText:"Choose equipment that fits your project requirements and budget.",
        whyTwoTitle:"Professional Team", whyTwoText:"Installation and configuration are handled carefully.",
        whyThreeTitle:"After-Sales Support", whyThreeText:"Support for maintenance, troubleshooting and upgrades.",
        whyFourTitle:"Site Visit", whyFourText:"Get assessment and recommendations based on the actual location.",
        contactLabel:"LET'S SECURE YOUR PROPERTY", contactTitle:"Get your site visit and quotation.",
        contactText:"Contact Sonic System Solution for product enquiries, services or installation requests.",
        phoneLabel:"CONTACT US", contactButton:"Start Your Request →",
        footerText:"Security and smart system solutions for homes and businesses.",
        footerSolutions:"Solutions", footerServices:"Services", footerContact:"Contact", footerBottom:"Official SecurePro Service Platform"
    },
    ms: {
        navHome:"Utama", navSolutions:"Penyelesaian", navServices:"Servis", navWhy:"Kenapa Kami", navContact:"Hubungi", navQuote:"Dapatkan Sebut Harga", navGuide:"Cara Membuat Permintaan",
        heroKicker:"PENYELESAIAN KESELAMATAN PINTAR",
        heroTitle:"Keselamatan anda.<br><span>Keutamaan kami.</span>",
        heroDescription:"Penyelesaian CCTV, akses kawalan, alarm, autogate dan sistem pintar untuk rumah, perniagaan dan premis profesional.",
        heroPrimary:"Terokai Penyelesaian", heroSecondary:"Minta Sebut Harga",
        trustOne:"Produk Berkualiti", trustTwo:"Pemasangan Profesional", trustThree:"Sokongan Selepas Jualan",
        heroBadgeTitle:"SECURE YOUR SPACE", heroBadgeText:"Penyelesaian keselamatan pintar",
        statusTitle:"Sistem Aktif", statusText:"Perlindungan sepanjang masa",
        introLabel:"SONIC SYSTEM SOLUTION",
        introTitle:"Satu tempat untuk semua keperluan keselamatan anda.",
        introText:"Daripada konsultasi dan pemasangan sehingga penyelenggaraan dan troubleshooting, SecurePro membantu anda mengurus keperluan servis dengan lebih mudah.",
        solutionsLabel:"OUR SOLUTIONS", solutionsTitle:"Penyelesaian lengkap untuk setiap ruang.",
        solutionsText:"Pilih sistem yang diperlukan dan kami akan membimbing anda melalui proses permintaan.",
        loadingServices:"Memuatkan servis...", unableToLoadServices:"Tidak dapat memuatkan servis.", questions:"soalan",
        processLabel:"OUR SERVICES", processTitle:"Lebih daripada pemasangan. Kami sokong anda sepanjang perjalanan.",
        processText:"Dapatkan bantuan daripada konsultasi awal sehingga servis selepas pemasangan.",
        processOne:"Konsultasi produk & servis", processTwo:"Pemasangan profesional", processThree:"Penyelenggaraan & wiring", processFour:"Troubleshooting & upgrade",
        statExperience:"Tahun pengalaman", statProjects:"Projek disiapkan", statSupport:"Komitmen kepada kualiti", statProtection:"Sokongan penyelesaian",
        whyLabel:"WHY CHOOSE SONIC", whyTitle:"Teknologi yang membantu anda rasa lebih selamat.",
        whyText:"Kami menggabungkan produk yang sesuai, pemasangan kemas dan sokongan selepas jualan untuk menghasilkan penyelesaian yang praktikal.",
        whyButton:"Bercakap dengan kami ↗",
        whyOneTitle:"Produk Berkualiti", whyOneText:"Pilih peralatan yang sesuai dengan keperluan dan bajet projek.",
        whyTwoTitle:"Pasukan Profesional", whyTwoText:"Pemasangan dan konfigurasi dilaksanakan dengan teliti.",
        whyThreeTitle:"Sokongan Selepas Jualan", whyThreeText:"Bantuan untuk penyelenggaraan, troubleshooting dan upgrade.",
        whyFourTitle:"Site Visit", whyFourText:"Dapatkan penilaian dan cadangan berdasarkan lokasi sebenar.",
        contactLabel:"LET'S SECURE YOUR PROPERTY", contactTitle:"Dapatkan site visit dan sebut harga anda.",
        contactText:"Hubungi Sonic System Solution untuk pertanyaan produk, servis atau permintaan pemasangan.",
        phoneLabel:"HUBUNGI KAMI", contactButton:"Mula Permintaan →",
        footerText:"Penyelesaian keselamatan dan sistem pintar untuk rumah dan perniagaan.",
        footerSolutions:"Penyelesaian", footerServices:"Servis", footerContact:"Hubungi", footerBottom:"Platform Servis Rasmi SecurePro"
    }
};

function applyLanguage() {
    document.documentElement.lang = currentLanguage;
    document.querySelectorAll("[data-i18n]").forEach(element => {
        const key = element.dataset.i18n;
        const translation = translations[currentLanguage][key];
        if (translation) element.innerHTML = translation;
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
        cctv:"assets/cctvt.png",
        autogate:"assets/autogatet.png",
        alarm:"assets/alarmt.jpeg",
        barriergate:"assets/barriert.png",
        solar_cctv:"assets/solarcctvt.jpg",
        attendance:"assets/timet.jpeg",
        access:"assets/doort.jpeg",
        pabx:"assets/pabxt.jpeg",
        solar_pump:"assets/solarpt.jpeg",
        troubleshoot_repair:"assets/tnr.jpg"
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
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");
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
