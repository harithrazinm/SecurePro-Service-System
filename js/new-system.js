const API_BASE = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? "http://localhost:5001/api" : "/api";
let currentLanguage = localStorage.getItem("securepro_language") === "en" ? "en" : "ms";

const translations = {
    en: {
        navHome: "Home", navServices: "Services", navContact: "Contact Us",
        pageTitle: "Choose the System You Need",
        pageText: "Choose a system below to continue with the existing request process.",
        back: "← Back to categories", servicesTitle: "Available Systems",
        servicesText: "Choose any system to open the existing service request process.",
        loading: "Loading services...", questions: "questions", error: "Unable to load services."
    },
    ms: {
        navHome: "Utama", navServices: "Senarai Servis", navContact: "Hubungi Kami",
        pageTitle: "Pilih Sistem Yang Anda Perlukan",
        pageText: "Pilih sistem di bawah untuk meneruskan permintaan menggunakan aliran sedia ada.",
        back: "← Kembali ke kategori", servicesTitle: "Senarai Sistem",
        servicesText: "Pilih mana-mana sistem untuk membuka proses permintaan sedia ada.",
        loading: "Memuatkan servis...", questions: "soalan", error: "Tidak dapat memuatkan servis."
    }
};

function applyLanguage() {
    const t = translations[currentLanguage];
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.dataset.i18n;
        if (t[key]) el.textContent = t[key];
    });
    const button = document.querySelector("#languageToggle");
    if (button) button.textContent = `🌐 ${currentLanguage === "ms" ? "English" : "Bahasa Melayu"}`;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

async function loadServices() {
    const grid = document.querySelector("#servicesGrid");
    const t = translations[currentLanguage];
    if (!grid) return;

    const serviceImages = {
        cctv: "../assets/cctvt.png",
        troubleshoot_repair: "../assets/tnr.jpg",
        autogate: "../assets/autogatet.png",
        alarm: "../assets/alarmt.png",
        barriergate: "../assets/barriert.png",
        solar_cctv: "../assets/solarcctvt.png",
        attendance: "../assets/timet.png",
        access: "../assets/doort.png",
        pabx: "../assets/pabxt.png",
        solar_pump: "../assets/solarpt.png",
        audio_visual: "../assets/av.png",
        electrical_service: "../assets/electrical.png"
    };

    // These two services use their own HTML/JS question pages, not service.html?service=...
    const dedicatedServices = [
        {
            id: "audio_visual",
            aliases: ["audio_visual", "audio-visual", "audiovisual", "av"],
            name: { en: "Audio & Visual", ms: "Audio & Visual" },
            href: "audio-visual.html",
            questionCount: null,
            image: serviceImages.audio_visual
        },
        {
            id: "electrical_service",
            aliases: ["electrical_service", "electrical-service", "electrical", "electrical_service"],
            name: { en: "Electrical Service", ms: "Electrical Service" },
            href: "electrical.html",
            questionCount: null,
            image: serviceImages.electrical_service
        }
    ];

    const normalizeId = value => String(value ?? "")
        .trim().toLowerCase().replace(/[\s-]+/g, "_");

    const getServiceId = service => normalizeId(
        service?.id ?? service?.service_code ?? service?.code ?? service?.serviceCode
    );

    function makeCard(service, dedicated = null) {
        const card = document.createElement("article");
        card.className = "service-card";
        card.tabIndex = 0;
        card.setAttribute("role", "button");

        const id = getServiceId(service) || dedicated?.id || "";
        const name = service?.name?.[currentLanguage]
            || service?.name?.ms
            || service?.name?.en
            || dedicated?.name?.[currentLanguage]
            || "Service";
        const image = dedicated?.image || serviceImages[id] || serviceImages[normalizeId(service?.service_code)];
     

        
card.innerHTML = `
    <div class="service-image">
        ${image
            ? `<img src="${image}" alt="${escapeHtml(name)}" onerror="this.style.display='none';this.parentElement.innerHTML='<div class=&quot;service-image-placeholder&quot;>＋</div>'">`
            : `<div class="service-image-placeholder">＋</div>`}
    </div>
    <h3>${escapeHtml(name)}</h3>
`;


        const open = () => {
            localStorage.setItem("securepro_language", currentLanguage);
            if (dedicated) {
                window.location.href = dedicated.href;
            } else {
                window.location.href = `service.html?service=${encodeURIComponent(id)}`;
            }
        };
        card.addEventListener("click", open);
        card.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                open();
            }
        });
        return card;
    }

    grid.innerHTML = `<div class="loading">${escapeHtml(t.loading)}</div>`;

    let apiServices = [];
    try {
        const response = await fetch(`${API_BASE}/services`);
        if (!response.ok) throw new Error(`Services API returned ${response.status}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.message || t.error);
        apiServices = Array.isArray(result.data) ? result.data : [];
    } catch (error) {
        // The two dedicated pages should still be available even if the API fails.
        console.error("Load New System services error:", error);
        grid.innerHTML = "";
        dedicatedServices.forEach(service => grid.appendChild(makeCard(service, service)));
        const message = document.createElement("p");
        message.className = "loading";
        message.textContent = t.error;
        grid.appendChild(message);
        return;
    }

    grid.innerHTML = "";
    const seenDedicated = new Set();

    apiServices
        .filter(service => getServiceId(service) !== "troubleshoot_repair")
        .forEach(service => {
            const id = getServiceId(service);
            const dedicated = dedicatedServices.find(item =>
                item.aliases.some(alias => normalizeId(alias) === id)
            );

            if (dedicated) {
                if (seenDedicated.has(dedicated.id)) return;
                seenDedicated.add(dedicated.id);
                grid.appendChild(makeCard(service, dedicated));
            } else {
                grid.appendChild(makeCard(service));
            }
        });

    // Always include the two dedicated pages, even if the API doesn't return them.
    dedicatedServices.forEach(service => {
        if (!seenDedicated.has(service.id)) {
            grid.appendChild(makeCard(service, service));
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    applyLanguage();
    loadServices();
    document.querySelector("#languageToggle")?.addEventListener("click", () => {
        currentLanguage = currentLanguage === "ms" ? "en" : "ms";
        localStorage.setItem("securepro_language", currentLanguage);
        applyLanguage();
        loadServices();
    });
    const menu = document.querySelector("#menuToggle");
    const nav = document.querySelector("#mainNav");
    menu?.addEventListener("click", () => { const open = nav.classList.toggle("open"); menu.setAttribute("aria-expanded", String(open)); });
    nav?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => { nav.classList.remove("open"); menu?.setAttribute("aria-expanded", "false"); }));
});
