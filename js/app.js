const API_BASE = "http://localhost:5001/api";

let currentLanguage = "en";

const translations = {
    en: {
        eyebrow: "SMART SECURITY SOLUTIONS",

        heroTitle:
            "Find the right system for your space.",

        heroDescription:
            "Answer a few simple questions and we'll help identify the right SecurePro solution for your home or business.",

        startButton:
            "Explore Solutions",

        systemReady:
            "System Ready",

        heroCardTitle:
            "SecurePro Service Selector",

        heroCardDescription:
            "A smarter way to identify your security and system requirements.",

        servicesTitle:
            "Choose a solution",

        servicesDescription:
            "Select the service you are interested in.",

        footerText:
            "Security and smart system solutions."
    },

    ms: {
        eyebrow:
            "PENYELESAIAN KESELAMATAN PINTAR",

        heroTitle:
            "Cari sistem yang sesuai untuk ruang anda.",

        heroDescription:
            "Jawab beberapa soalan mudah dan kami akan membantu mengenal pasti penyelesaian SecurePro yang sesuai untuk rumah atau perniagaan anda.",

        startButton:
            "Lihat Penyelesaian",

        systemReady:
            "Sistem Sedia",

        heroCardTitle:
            "Pemilih Servis SecurePro",

        heroCardDescription:
            "Cara lebih pintar untuk mengenal pasti keperluan keselamatan dan sistem anda.",

        servicesTitle:
            "Pilih penyelesaian",

        servicesDescription:
            "Pilih servis yang anda perlukan.",

        footerText:
            "Penyelesaian keselamatan dan sistem pintar."
    }
};


function applyLanguage() {

    document
        .querySelectorAll("[data-i18n]")
        .forEach(element => {

            const key = element.dataset.i18n;

            if (translations[currentLanguage][key]) {
                element.textContent =
                    translations[currentLanguage][key];
            }

        });

    const button =
        document.querySelector("#languageToggle");

    if (button) {
        button.textContent =
            currentLanguage === "en"
                ? "BM"
                : "EN";
    }
}


async function loadServices() {

    const grid =
        document.querySelector("#servicesGrid");

    try {

        const response =
            await fetch(`${API_BASE}/services`);

        if (!response.ok) {
            throw new Error("Unable to load services.");
        }

        const result =
            await response.json();

        if (!result.success) {
            throw new Error("Service API returned an error.");
        }

        renderServices(result.data);

    } catch (error) {

        console.error(error);

        grid.innerHTML = `
            <div class="loading">
                Unable to load services.
            </div>
        `;
    }
}


function renderServices(services) {

    const grid =
        document.querySelector("#servicesGrid");


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


    services.forEach((service) => {

        const card =
            document.createElement("article");

        card.className = "service-card";


        const image =
            serviceImages[service.id];


        card.innerHTML = `

            <div class="service-image">

                ${
                    image
                        ? `
                            <img
                                src="${image}"
                                alt="${escapeHtml(
                                    service.name[currentLanguage]
                                )}"
                            >
                        `
                        : `
                            <div class="service-image-placeholder">
                                ?
                            </div>
                        `
                }

            </div>

            <h3>
                ${escapeHtml(
                    service.name[currentLanguage]
                )}
            </h3>

            <p>
                ${service.questionCount}
                ${
                    currentLanguage === "en"
                        ? " questions"
                        : " soalan"
                }
            </p>
        `;


        card.addEventListener("click", () => {

            localStorage.setItem(
                "securepro_language",
                currentLanguage
            );

            window.location.href =
                `pages/service.html?service=${encodeURIComponent(
                    service.id
                )}`;

        });


        grid.appendChild(card);

    });
}


function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


document.addEventListener("DOMContentLoaded", () => {

    const savedLanguage =
        localStorage.getItem("securepro_language");

    if (savedLanguage === "en" || savedLanguage === "ms") {
        currentLanguage = savedLanguage;
    }

    applyLanguage();

    loadServices();


    document
        .querySelector("#languageToggle")
        ?.addEventListener("click", () => {

            currentLanguage =
                currentLanguage === "en"
                    ? "ms"
                    : "en";

            localStorage.setItem(
                "securepro_language",
                currentLanguage
            );

            applyLanguage();

            loadServices();
        });


    document
        .querySelector("#startButton")
        ?.addEventListener("click", () => {

            document
                .querySelector("#services")
                ?.scrollIntoView({
                    behavior: "smooth"
                });

        });

});