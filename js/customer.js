const currentLanguage =
    localStorage.getItem("securepro_language") || "en";

let selectedFiles = [];

const PHOTO_DB_NAME = "SecureProPhotosDB";
const PHOTO_STORE_NAME = "photos";

const translations = {
    en: {
        back: "Back",
        title: "Tell us about yourself",
        description:
            "Provide your contact details so our team can prepare your service request.",

        contactTitle: "Contact Information",
        contactDescription:
            "How can we contact you?",

        name: "Full Name",
        phone: "Phone Number",
        email: "Email Address",
        address: "Address",

        photoTitle: "Photos",
        photoDescription:
            "Upload photos of the installation area.",

        uploadTitle: "Add Photos",
        uploadDescription:
            "Click here to select photos from your device.",

        uploadLimit:
            "JPG, PNG or WebP • Up to 10 photos",

        notesTitle: "Additional Notes",
        notesDescription:
            "Tell us anything else that may help our team.",

        previous: "Previous",
        continue: "Review Request",

        nameRequired:
            "Please enter your full name.",

        phoneRequired:
            "Please enter your phone number.",

        addressRequired:
            "Please enter your address.",

        emailInvalid:
            "Please enter a valid email address.",

        photoLimit:
            "You can upload a maximum of 10 photos.",

        photoType:
            "Only JPG, PNG and WebP images are allowed."
    },

    ms: {
        back: "Kembali",
        title: "Beritahu kami tentang anda",
        description:
            "Masukkan maklumat hubungan anda supaya pasukan kami boleh menyediakan permintaan servis.",

        contactTitle: "Maklumat Hubungan",
        contactDescription:
            "Bagaimanakah kami boleh menghubungi anda?",

        name: "Nama Penuh",
        phone: "Nombor Telefon",
        email: "Alamat Emel",
        address: "Alamat",

        photoTitle: "Gambar",
        photoDescription:
            "Muat naik gambar kawasan pemasangan.",

        uploadTitle: "Tambah Gambar",
        uploadDescription:
            "Klik di sini untuk memilih gambar daripada peranti anda.",

        uploadLimit:
            "JPG, PNG atau WebP • Maksimum 10 gambar",

        notesTitle: "Nota Tambahan",
        notesDescription:
            "Beritahu kami apa-apa maklumat lain yang boleh membantu pasukan kami.",

        previous: "Sebelum",
        continue: "Semak Permintaan",

        nameRequired:
            "Sila masukkan nama penuh anda.",

        phoneRequired:
            "Sila masukkan nombor telefon anda.",

        addressRequired:
            "Sila masukkan alamat anda.",

        emailInvalid:
            "Sila masukkan alamat emel yang sah.",

        photoLimit:
            "Anda boleh memuat naik maksimum 10 gambar.",

        photoType:
            "Hanya gambar JPG, PNG dan WebP dibenarkan."
    }
};

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


async function savePhotosToDatabase(files) {

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

            files.forEach(file => {

                store.add({
                    name: file.name,
                    type: file.type,
                    file: file
                });

            });

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

function t(key) {
    return translations[currentLanguage][key];
}

function showError(message) {
    const error = document.querySelector("#formError");

    error.textContent = message;
    error.hidden = false;

    error.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function hideError() {
    const error = document.querySelector("#formError");

    error.hidden = true;
    error.textContent = "";
}

function validateForm() {
    hideError();

    const name =
        document.querySelector("#customerName").value.trim();

    const phone =
        document.querySelector("#customerPhone").value.trim();

    const email =
        document.querySelector("#customerEmail").value.trim();

    const address =
        document.querySelector("#customerAddress").value.trim();

    if (!name) {
        showError(t("nameRequired"));
        return false;
    }

    if (!phone) {
        showError(t("phoneRequired"));
        return false;
    }

    if (
        email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
        showError(t("emailInvalid"));
        return false;
    }

    if (!address) {
        showError(t("addressRequired"));
        return false;
    }

    return true;
}

function renderPhotos() {
    const container =
        document.querySelector("#photoPreview");

    container.innerHTML = "";

    selectedFiles.forEach((file, index) => {

        const item =
            document.createElement("div");

        item.className = "photo-item";

        const image =
            document.createElement("img");

        image.alt = file.name;

        const reader =
            new FileReader();

        reader.onload = event => {
            image.src = event.target.result;
        };

        reader.readAsDataURL(file);

        const remove =
            document.createElement("button");

        remove.type = "button";
        remove.className = "photo-remove";
        remove.textContent = "×";

        remove.addEventListener("click", () => {

            selectedFiles.splice(index, 1);

            renderPhotos();
        });

        item.appendChild(image);
        item.appendChild(remove);

        container.appendChild(item);
    });
}

function handlePhotos(event) {
    hideError();

    const files =
        Array.from(event.target.files || []);

    for (const file of files) {

        if (
            ![
                "image/jpeg",
                "image/png",
                "image/webp"
            ].includes(file.type)
        ) {
            showError(t("photoType"));

            event.target.value = "";

            return;
        }
    }

    if (
        selectedFiles.length +
        files.length >
        10
    ) {
        showError(t("photoLimit"));

        event.target.value = "";

        return;
    }

    selectedFiles =
        selectedFiles.concat(files);

    renderPhotos();

    event.target.value = "";
}

function saveCustomerData() {

    const customer = {

        customer_name:
            document.querySelector(
                "#customerName"
            ).value.trim(),

        customer_phone:
            document.querySelector(
                "#customerPhone"
            ).value.trim(),

        customer_email:
            document.querySelector(
                "#customerEmail"
            ).value.trim(),

        customer_address:
            document.querySelector(
                "#customerAddress"
            ).value.trim(),

        customer_notes:
            document.querySelector(
                "#customerNotes"
            ).value.trim()
    };

    localStorage.setItem(
        "securepro_customer",
        JSON.stringify(customer)
    );
}

function restoreCustomerData() {

    const saved =
        localStorage.getItem(
            "securepro_customer"
        );

    if (!saved) return;

    try {

        const customer =
            JSON.parse(saved);

        document.querySelector(
            "#customerName"
        ).value =
            customer.customer_name || "";

        document.querySelector(
            "#customerPhone"
        ).value =
            customer.customer_phone || "";

        document.querySelector(
            "#customerEmail"
        ).value =
            customer.customer_email || "";

        document.querySelector(
            "#customerAddress"
        ).value =
            customer.customer_address || "";

        document.querySelector(
            "#customerNotes"
        ).value =
            customer.customer_notes || "";

    } catch (error) {

        console.error(
            "Unable to restore customer data:",
            error
        );
    }
}

document.addEventListener(
    "DOMContentLoaded",
    () => {

        restoreCustomerData();

        document.querySelector(
            "#customerPhotos"
        )?.addEventListener(
            "change",
            handlePhotos
        );

        document.querySelector(
            "#backButton"
        )?.addEventListener(
            "click",
            () => {

                saveCustomerData();

                window.history.back();
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
    "#customerForm"
)?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        saveCustomerData();

        try {

            await savePhotosToDatabase(
                selectedFiles
            );

            localStorage.setItem(
                "securepro_photo_count",
                String(
                    selectedFiles.length
                )
            );

            window.location.href =
                "review.html";

        } catch (error) {

    console.error(
        "Customer form error:",
        error,
        error?.name,
        error?.message
    );

    showError(
        error?.message ||
        (
            currentLanguage === "en"
                ? "Unable to prepare your photos. Please try again."
                : "Tidak dapat menyediakan gambar anda. Sila cuba lagi."
        )
    );
}
    }
);
    }
);