const API_BASE = "https://securepro-service-system.onrender.com/api";

let currentLanguage =
    localStorage.getItem("securepro_language") || "en";

let service = null;
let answers = {};
let customer = {};
let selectedFiles = [];

const PHOTO_DB_NAME = "SecureProPhotosDB";
const PHOTO_STORE_NAME = "photos";

const translations = {

    en: {
        back: "Back",
        title: "Review your request",
        description:
            "Please check your information before submitting.",

        serviceTitle: "Selected Service",

        answersTitle: "Your Answers",

        answersDescription:
            "Information provided for this service.",

        customerTitle:
            "Customer Information",

        photosTitle:
            "Photos",

        edit:
            "Edit Information",

        submit:
            "Submit Request",

        privacy:
            "Your information will only be used to process your service request.",

        noAnswer:
            "No answer provided",

        noPhotos:
            "No photos selected",

        photos:
            "photos",

        submitting:
            "Submitting...",

        submitError:
            "Unable to submit request.",

        success:
            "Request submitted successfully."
    },

    ms: {
        back: "Kembali",
        title: "Semak permintaan anda",
        description:
            "Sila semak maklumat anda sebelum menghantar.",

        serviceTitle:
            "Servis Dipilih",

        answersTitle:
            "Jawapan Anda",

        answersDescription:
            "Maklumat yang diberikan untuk servis ini.",

        customerTitle:
            "Maklumat Pelanggan",

        photosTitle:
            "Gambar",

        edit:
            "Edit Maklumat",

        submit:
            "Hantar Permintaan",

        privacy:
            "Maklumat anda hanya akan digunakan untuk memproses permintaan servis anda.",

        noAnswer:
            "Tiada jawapan diberikan",

        noPhotos:
            "Tiada gambar dipilih",

        photos:
            "gambar",

        submitting:
            "Menghantar...",

        submitError:
            "Tidak dapat menghantar permintaan.",

        success:
            "Permintaan berjaya dihantar."
    }
};

function t(key) {
    return translations[currentLanguage][key];
}

function getLanguageText(value) {

    if (!value) return "";

    if (typeof value === "string") {
        return value;
    }

    return value[currentLanguage]
        || value.en
        || "";
}

function getSavedData() {

    try {

        answers =
            JSON.parse(
                localStorage.getItem(
                    "securepro_answers"
                ) || "{}"
            );

    } catch {

        answers = {};
    }

    try {

        customer =
            JSON.parse(
                localStorage.getItem(
                    "securepro_customer"
                ) || "{}"
            );

    } catch {

        customer = {};
    }
}

function getServiceId() {

    return localStorage.getItem(
        "securepro_service"
    );
}

function openPhotoDatabase() {

    return new Promise((resolve, reject) => {

        const request =
            indexedDB.open(
                PHOTO_DB_NAME,
                1
            );

        request.onupgradeneeded =
            event => {

                const db =
                    event.target.result;

                if (
                    !db.objectStoreNames.contains(
                        PHOTO_STORE_NAME
                    )
                ) {

                    db.createObjectStore(
                        PHOTO_STORE_NAME,
                        {
                            keyPath: "id",
                            autoIncrement: true
                        }
                    );
                }
            };

        request.onsuccess =
            () => resolve(request.result);

        request.onerror =
            () => reject(request.error);
    });
}

async function loadPhotosFromDatabase() {

    const db =
        await openPhotoDatabase();

    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    PHOTO_STORE_NAME,
                    "readonly"
                );

            const store =
                transaction.objectStore(
                    PHOTO_STORE_NAME
                );

            const request =
                store.getAll();

            request.onsuccess =
                () => {

                    selectedFiles =
                        request.result.map(
                            item => item.file
                        );

                    db.close();

                    resolve(
                        selectedFiles
                    );
                };

            request.onerror =
                () => {

                    db.close();

                    reject(
                        request.error
                    );
                };
        }
    );
}

async function clearPhotoDatabase() {

    const db =
        await openPhotoDatabase();

    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    PHOTO_STORE_NAME,
                    "readwrite"
                );

            const store =
                transaction.objectStore(
                    PHOTO_STORE_NAME
                );

            store.clear();

            transaction.oncomplete =
                () => {

                    db.close();

                    resolve();
                };

            transaction.onerror =
                () => {

                    db.close();

                    reject(
                        transaction.error
                    );
                };
        }
    );
}

async function loadService() {

    const serviceId =
        getServiceId();

    if (!serviceId) {

        showSubmitError(
            "No service selected."
        );

        return;
    }

    try {

        const response =
            await fetch(
                `${API_BASE}/services/${encodeURIComponent(serviceId)}`
            );

        const result =
            await response.json();

        if (
            !response.ok ||
            !result.success
        ) {
            throw new Error(
                "Unable to load service."
            );
        }

        service =
            result.data;

        await loadPhotosFromDatabase();

        renderReview();

    } catch (error) {

        console.error(error);

        showSubmitError(
            t("submitError")
        );
    }
}

function renderReview() {

    document.title =
        `SecurePro | ${getLanguageText(service.name)}`;

    document.querySelector(
        "#serviceName"
    ).textContent =
        getLanguageText(service.name);

    renderAnswers();

    renderCustomer();

    renderPhotos();
}

function getOptionLabel(
    question,
    value
) {

    if (!question.options) {
        return value;
    }

    const option =
        question.options.find(
            item =>
                item.value === value
        );

    if (!option) {
        return value;
    }

    return getLanguageText(
        option.label
    );
}

function formatAnswer(
    question,
    answer
) {

    if (
        answer === null ||
        answer === undefined ||
        answer === ""
    ) {
        return t("noAnswer");
    }

    if (question.type === "single") {

        return getOptionLabel(
            question,
            answer
        );
    }

    if (question.type === "multi") {

        if (!Array.isArray(answer)) {
            return t("noAnswer");
        }

        return answer
            .map(value =>
                getOptionLabel(
                    question,
                    value
                )
            )
            .join(", ");
    }

    if (question.type === "counter") {

        if (
            typeof answer !== "object" ||
            answer === null
        ) {
            return t("noAnswer");
        }

        return Object.entries(answer)
            .map(
                ([id, value]) => {

                    const counter =
                        question.counters?.find(
                            item =>
                                item.id === id
                        );

                    const label =
                        counter
                            ? getLanguageText(
                                counter.label
                            )
                            : id;

                    return `${label}: ${value}`;
                }
            )
            .join("\n");
    }

    return String(answer);
}

function renderAnswers() {

    const container =
        document.querySelector(
            "#answersList"
        );

    container.innerHTML = "";

    service.questions.forEach(
        question => {

            const answer =
                answers[question.id];

            if (
                question.type === "file"
            ) {
                return;
            }

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "answer-row";

            const label =
                document.createElement(
                    "div"
                );

            label.className =
                "answer-question";

            label.textContent =
                getLanguageText(
                    question.title
                );

            const value =
                document.createElement(
                    "div"
                );

            value.className =
                "answer-value";

            value.textContent =
                formatAnswer(
                    question,
                    answer
                );

            row.appendChild(label);

            row.appendChild(value);

            container.appendChild(row);
        }
    );
}

function renderCustomer() {

    const container =
        document.querySelector(
            "#customerInfo"
        );

    container.innerHTML = "";

    addCustomerItem(
        container,
        currentLanguage === "en"
            ? "Full Name"
            : "Nama Penuh",
        customer.customer_name
    );

    addCustomerItem(
        container,
        currentLanguage === "en"
            ? "Phone Number"
            : "Nombor Telefon",
        customer.customer_phone
    );

    addCustomerItem(
        container,
        currentLanguage === "en"
            ? "Email Address"
            : "Alamat Emel",
        customer.customer_email ||
            (currentLanguage === "en"
                ? "Not provided"
                : "Tidak diberikan")
    );

    addCustomerItem(
        container,
        currentLanguage === "en"
            ? "Address"
            : "Alamat",
        customer.customer_address,
        true
    );

    if (customer.customer_notes) {

        addCustomerItem(
            container,
            currentLanguage === "en"
                ? "Additional Notes"
                : "Nota Tambahan",
            customer.customer_notes,
            true
        );
    }
}

function addCustomerItem(
    container,
    label,
    value,
    full = false
) {

    const item =
        document.createElement(
            "div"
        );

    item.className =
        "customer-review-item" +
        (full ? " full" : "");

    item.innerHTML = `
        <span class="customer-label">
            ${escapeHtml(label)}
        </span>

        <span class="customer-value">
            ${escapeHtml(value || "-")}
        </span>
    `;

    container.appendChild(item);
}

function renderPhotos() {

    const container =
        document.querySelector(
            "#reviewPhotos"
        );

    container.innerHTML = "";

    document.querySelector(
        "#photoCount"
    ).textContent =
        `${selectedFiles.length} ${t("photos")}`;

    if (
        selectedFiles.length === 0
    ) {

        container.innerHTML = `
            <p style="
                color: #6b7280;
                font-size: 14px;
            ">
                ${t("noPhotos")}
            </p>
        `;

        return;
    }

    selectedFiles.forEach(file => {

        const image =
            document.createElement(
                "img"
            );

        image.className =
            "review-photo";

        image.alt =
            file.name;

        const wrapper =
            document.createElement(
                "div"
            );

        wrapper.className =
            "review-photo";

        const reader =
            new FileReader();

        reader.onload =
            event => {

                image.src =
                    event.target.result;
            };

        reader.readAsDataURL(file);

        wrapper.appendChild(image);

        container.appendChild(wrapper);
    });
}

function showSubmitError(message) {

    const element =
        document.querySelector(
            "#submitError"
        );

    element.textContent =
        message;

    element.hidden = false;
}

function hideSubmitError() {

    const element =
        document.querySelector(
            "#submitError"
        );

    element.hidden = true;

    element.textContent = "";
}

async function submitRequest() {

    hideSubmitError();

    const button =
        document.querySelector(
            "#submitButton"
        );

    button.classList.add("loading");

    button.querySelector("span").textContent =
        t("submitting");

    try {

        console.log("STEP 1: Starting submission");
        console.log("API_BASE:", API_BASE);
        console.log("Customer:", customer);
        console.log("Service:", service);
        console.log("Answers:", answers);
        console.log("Selected files:", selectedFiles);


        console.log("STEP 2: Creating FormData");

        const formData =
            new FormData();


        console.log("STEP 3: Adding customer data");

        formData.append(
            "customer_name",
            String(customer?.customer_name || "")
        );

        formData.append(
            "customer_phone",
            String(customer?.customer_phone || "")
        );

        formData.append(
            "customer_email",
            String(customer?.customer_email || "")
        );

        formData.append(
            "customer_address",
            String(customer?.customer_address || "")
        );


        console.log("STEP 4: Adding service");

        formData.append(
            "service_type",
            String(service?.id || "")
        );


        console.log("STEP 5: Adding answers");

        formData.append(
            "service_answers",
            JSON.stringify(answers || {})
        );


        console.log("STEP 6: Adding notes");

        formData.append(
            "customer_notes",
            String(customer?.customer_notes || "")
        );


        console.log("STEP 7: Adding photos");

        for (
            let index = 0;
            index < selectedFiles.length;
            index++
        ) {

            const file =
                selectedFiles[index];

            if (
                !(file instanceof Blob)
            ) {

                console.warn(
                    "Skipping invalid photo:",
                    file
                );

                continue;
            }

            const extension =
                file.type === "image/png"
                    ? "png"
                    : file.type === "image/webp"
                        ? "webp"
                        : "jpg";

            const fileName =
                `customer-photo-${index + 1}.${extension}`;

            console.log(
                "Adding photo:",
                fileName,
                file.type,
                file.size
            );

            formData.append(
                "customer_photos",
                file,
                fileName
            );
        }


        console.log("STEP 8: FormData complete");


        console.log(
            "STEP 9: Sending request to:",
            `${API_BASE}/requests`
        );


        const response =
            await fetch(
                `${API_BASE}/requests`,
                {
                    method: "POST",
                    body: formData
                }
            );


        console.log(
            "STEP 10: Response received:",
            response.status
        );


        const result =
            await response.json();


        console.log(
            "Server response:",
            result
        );


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                t("submitError")
            );
        }


        localStorage.setItem(
            "securepro_request",
            JSON.stringify(result.data)
        );


        localStorage.removeItem(
            "securepro_answers"
        );

        localStorage.removeItem(
            "securepro_customer"
        );

        localStorage.removeItem(
            "securepro_service"
        );

        localStorage.removeItem(
            "securepro_photo_count"
        );


        console.log(
            "STEP 11: Clearing photo database"
        );

        await clearPhotoDatabase();


        console.log(
            "STEP 12: Redirecting to success page"
        );

        window.location.href =
            "success.html";


    } catch (error) {

        console.error(
            "SUBMIT ERROR FULL:",
            error
        );

        console.error(
            "ERROR NAME:",
            error?.name
        );

        console.error(
            "ERROR MESSAGE:",
            error?.message
        );

        console.error(
            "ERROR STACK:",
            error?.stack
        );


        showSubmitError(
            `Error: ${error?.message || t("submitError")}`
        );


        button.classList.remove(
            "loading"
        );

        button.querySelector("span").textContent =
            t("submit");
    }
}

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

document.addEventListener(
    "DOMContentLoaded",
    () => {

        getSavedData();

        document.querySelector(
            "#editButton"
        )?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "customer.html";
            }
        );

        document.querySelector(
            "#languageToggle"
        )?.addEventListener(
            "click",
            () => {

                const newLanguage =
                    currentLanguage === "en"
                        ? "ms"
                        : "en";

                localStorage.setItem(
                    "securepro_language",
                    newLanguage
                );

                window.location.reload();
            }
        );

        document.querySelector(
            "#submitButton"
        )?.addEventListener(
            "click",
            submitRequest
        );

        loadService();
    }
);