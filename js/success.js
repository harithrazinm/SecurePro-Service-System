const WHATSAPP_NUMBER =
    "60196162487";


let currentLanguage =
    localStorage.getItem(
        "securepro_language"
    ) || "ms";


let requestData = null;


const translations = {

    en: {

        eyebrow:
            "REQUEST RECEIVED",

        title:
            "Request submitted successfully",

        description:
            "Thank you. Your service request has been received by SecurePro.",

        requestNumber:
            "Request Number",

        service:
            "Service",

        customer:
            "Customer",

        status:
            "Status",

        pending:
            "Pending",

        whatsappTitle:
            "Send your request details",

        whatsappDescription:
            "Send the request details to SecurePro through WhatsApp for faster communication.",

        whatsappButton:
            "Send Details via WhatsApp",

        homeButton:
            "Back to Home",

        privacy:
            "Your information will only be used to process your service request."

    },


    ms: {

        eyebrow:
            "PERMINTAAN DITERIMA",

        title:
            "Permintaan berjaya dihantar",

        description:
            "Terima kasih. Permintaan servis anda telah diterima oleh SecurePro.",

        requestNumber:
            "Nombor Permintaan",

        service:
            "Servis",

        customer:
            "Pelanggan",

        status:
            "Status",

        pending:
            "Menunggu",

        whatsappTitle:
            "Hantar maklumat permintaan anda",

        whatsappDescription:
            "Hantar maklumat permintaan kepada SecurePro melalui WhatsApp untuk komunikasi yang lebih pantas.",

        whatsappButton:
            "Hantar Maklumat melalui WhatsApp",

        homeButton:
            "Kembali ke Laman Utama",

        privacy:
            "Maklumat anda hanya akan digunakan untuk memproses permintaan servis anda."

    }

};


function t(key) {

    return (
        translations[currentLanguage] &&
        translations[currentLanguage][key]
    ) || key;

}


function getLanguageText(value) {

    if (!value) {
        return "";
    }

    if (
        typeof value ===
        "string"
    ) {
        return value;
    }

    return (
        value[currentLanguage] ||
        value.en ||
        value.ms ||
        ""
    );

}


/*
 * ========================================
 * LOAD REQUEST
 * ========================================
 */

function loadRequest() {

    try {

        requestData =
            JSON.parse(
                localStorage.getItem(
                    "securepro_request"
                ) || "null"
            );

    } catch {

        requestData = null;

    }


    if (!requestData) {

        console.error(
            "No SecurePro request found."
        );

        return false;
    }


    return true;

}


/*
 * ========================================
 * RENDER REQUEST
 * ========================================
 */

function renderRequest() {

    if (!requestData) {
        return;
    }


    const requestCode =
        document.querySelector(
            "#requestCode"
        );


    const serviceName =
        document.querySelector(
            "#serviceName"
        );


    const customerName =
        document.querySelector(
            "#customerName"
        );


    const requestStatus =
        document.querySelector(
            "#requestStatus"
        );


    if (requestCode) {

        requestCode.textContent =
            requestData.request_code ||
            "—";

    }


    if (serviceName) {

        serviceName.textContent =
            getLanguageText(
                requestData.service &&
                requestData.service.name
            ) ||
            requestData.service?.code ||
            "—";

    }


    if (customerName) {

        customerName.textContent =
            requestData.customer?.name ||
            "—";

    }


    if (requestStatus) {

        requestStatus.textContent =
            t("pending");

    }

}


/*
 * ========================================
 * TRANSLATION
 * ========================================
 */

function applyTranslations() {

    document
        .querySelectorAll(
            "[data-i18n]"
        )
        .forEach(
            element => {

                const key =
                    element.dataset.i18n;

                if (
                    translations[
                        currentLanguage
                    ] &&
                    translations[
                        currentLanguage
                    ][key]
                ) {

                    element.textContent =
                        t(key);

                }

            }
        );


    const languageToggle =
        document.querySelector(
            "#languageToggle"
        );


    if (languageToggle) {

        languageToggle.textContent =
            currentLanguage === "en"
                ? "BM"
                : "EN";

    }


    renderRequest();

}


/*
 * ========================================
 * WHATSAPP MESSAGE
 * ========================================
 */

function createWhatsAppMessage() {

    if (!requestData) {
        return "";
    }


    const serviceName =
        getLanguageText(
            requestData.service &&
            requestData.service.name
        ) ||
        requestData.service?.code ||
        "";


    const customer =
        requestData.customer ||
        {};


    const lines = [];


    if (currentLanguage === "ms") {

        lines.push(
            "*Permintaan Servis SecurePro*"
        );

        lines.push("");

        lines.push(
            `No. Permintaan: ${requestData.request_code || "-"}`
        );

        lines.push(
            `Servis: ${serviceName || "-"}`
        );

        lines.push("");

        lines.push(
            "*Maklumat Pelanggan*"
        );

        lines.push(
            `Nama: ${customer.name || "-"}`
        );

        lines.push(
            `Telefon: ${customer.phone || "-"}`
        );

        if (customer.email) {

            lines.push(
                `Emel: ${customer.email}`
            );

        }

        if (customer.address) {

            lines.push(
                `Alamat: ${customer.address}`
            );

        }

        lines.push("");

        lines.push(
            "Status: Menunggu"
        );

        lines.push("");

        lines.push(
            "Saya telah menghantar permintaan servis melalui sistem SecurePro."
        );

    } else {

        lines.push(
            "*SecurePro Service Request*"
        );

        lines.push("");

        lines.push(
            `Request No: ${requestData.request_code || "-"}`
        );

        lines.push(
            `Service: ${serviceName || "-"}`
        );

        lines.push("");

        lines.push(
            "*Customer Information*"
        );

        lines.push(
            `Name: ${customer.name || "-"}`
        );

        lines.push(
            `Phone: ${customer.phone || "-"}`
        );

        if (customer.email) {

            lines.push(
                `Email: ${customer.email}`
            );

        }

        if (customer.address) {

            lines.push(
                `Address: ${customer.address}`
            );

        }

        lines.push("");

        lines.push(
            "Status: Pending"
        );

        lines.push("");

        lines.push(
            "I have submitted a service request through the SecurePro system."
        );

    }


    return lines.join("\n");

}


/*
 * ========================================
 * OPEN WHATSAPP
 * ========================================
 */

function openWhatsApp() {

    const message =
        createWhatsAppMessage();


    if (!message) {
        return;
    }


    const encodedMessage =
        encodeURIComponent(
            message
        );


    const url =
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;


    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );

}


/*
 * ========================================
 * LANGUAGE TOGGLE
 * ========================================
 */

function setupLanguageToggle() {

    const button =
        document.querySelector(
            "#languageToggle"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            currentLanguage =
                currentLanguage === "en"
                    ? "ms"
                    : "en";


            localStorage.setItem(
                "securepro_language",
                currentLanguage
            );


            applyTranslations();

        }
    );

}


/*
 * ========================================
 * START
 * ========================================
 */


function updateLanguageToggleLabel() {

    const button =
        document.querySelector("#languageToggle");

    if (!button) return;

    const switchTo =
        currentLanguage === "ms"
            ? "English"
            : "Bahasa Melayu";

    button.textContent =
        `🌐 ${switchTo}`;

    button.setAttribute(
        "aria-label",
        `Switch language to ${switchTo}`
    );
}


document.addEventListener(
    "DOMContentLoaded",
    () => {

        
        

        updateLanguageToggleLabel();
updateLanguageToggleLabel();
if (
            !loadRequest()
        ) {

            return;

        }


        applyTranslations();


        setupLanguageToggle();


        const whatsappButton =
            document.querySelector(
                "#whatsappButton"
            );


        if (whatsappButton) {

            whatsappButton.addEventListener(
                "click",
                openWhatsApp
            );

        }

    }
);
