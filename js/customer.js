const IS_LOCAL = ["localhost", "127.0.0.1"].includes(
    window.location.hostname
);

const API_BASE =
    /^(localhost|127\.0\.0\.1)$/.test(
        location.hostname
    )
        ? "http://localhost:5001/api"
        : "/api";

const currentLanguage =
    localStorage.getItem("securepro_language") || "ms";

let selectedFiles = [];
let validatedReferral = null;

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
            "Only JPG, PNG and WebP images are allowed.",

        referralOptional:
            "Referral code is optional.",

        checkingReferral:
            "Checking...",

        checkReferral:
            "Check Code",

        invalidReferral:
            "Invalid referral code.",

        referralVerified:
            "Referral code verified successfully.",

        referralAccepted:
            "Referral code accepted",

        referralUnavailable:
            "Unable to verify the referral code. Please try again."
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
            "Hanya gambar JPG, PNG dan WebP dibenarkan.",

        referralOptional:
            "Kod rujukan adalah pilihan.",

        checkingReferral:
            "Sedang menyemak...",

        checkReferral:
            "Semak Kod",

        invalidReferral:
            "Kod rujukan tidak sah.",

        referralVerified:
            "Kod rujukan berjaya disahkan.",

        referralAccepted:
            "Kod rujukan diterima",

        referralUnavailable:
            "Tidak dapat mengesahkan kod rujukan. Sila cuba lagi."
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

/* =====================================================
   REFERRAL CODE
===================================================== */

async function validateReferralCode() {

    const input =
        document.querySelector("#referralCode");

    const button =
        document.querySelector("#validateReferralButton");

    const message =
        document.querySelector("#referralMessage");

    const result =
        document.querySelector("#referralResult");

    const resultTitle =
        document.querySelector("#referralResultTitle");

    const resultDescription =
        document.querySelector("#referralResultDescription");


    if (!input) {
        return;
    }


    const code =
        input.value
            .trim()
            .toUpperCase();


    /*
     * Empty referral code
     */

    if (!code) {

        validatedReferral = null;

        if (result) {
            result.hidden = true;
        }

        if (message) {

            message.className =
                "referral-message";

            message.textContent =
                t("referralOptional");
        }

        localStorage.removeItem(
            "securepro_referral"
        );

        return;
    }


    /*
     * Prevent duplicate requests
     */

    if (button) {

        button.disabled = true;

        button.textContent =
            t("checkingReferral");
    }


    try {

        const response =
            await fetch(
                `${API_BASE}/referrals/validate`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        code
                    })
                }
            );


        const data =
            await response.json();


        /*
         * Invalid referral
         */

        if (
            !response.ok ||
            !data.success
        ) {

            validatedReferral = null;

            localStorage.removeItem(
                "securepro_referral"
            );


            if (result) {
                result.hidden = true;
            }


            if (message) {

                message.className =
                    "referral-message error";

                message.textContent =
                    data.message ||
                    t("invalidReferral");
            }


            return;
        }


        /*
         * Store validated referral
         */

        validatedReferral =
            data.data;


        /*
         * Save for review.html
         */

        localStorage.setItem(
            "securepro_referral",
            JSON.stringify({
                id:
                    data.data.id,

                code:
                    data.data.code,

                reward_type:
                    data.data.reward_type,

                reward_value:
                    data.data.reward_value,

                minimum_order_amount:
                    data.data.minimum_order_amount
            })
        );


        /*
         * Success message
         */

        if (message) {

            message.className =
                "referral-message success";

            message.textContent =
                t("referralVerified");
        }


        if (result) {
            result.hidden = false;
        }


        if (resultTitle) {

            resultTitle.textContent =
                t("referralAccepted");
        }


        if (resultDescription) {

            const rewardType =
                data.data.reward_type;

            const rewardValue =
                Number(
                    data.data.reward_value || 0
                );

            const minimumOrder =
                Number(
                    data.data.minimum_order_amount || 0
                );


            let rewardText;


            if (
                rewardType ===
                "percentage"
            ) {

                rewardText =
                    `${rewardValue}% reward`;

            } else {

                rewardText =
                    `RM${rewardValue.toFixed(2)} reward`;

            }


            if (minimumOrder > 0) {

                rewardText +=
                    `. Minimum order RM${minimumOrder.toFixed(2)}.`;
            }


            resultDescription.textContent =
                rewardText;
        }


    } catch (error) {

        console.error(
            "Referral validation error:",
            error
        );


        validatedReferral = null;


        localStorage.removeItem(
            "securepro_referral"
        );


        if (result) {
            result.hidden = true;
        }


        if (message) {

            message.className =
                "referral-message error";

            message.textContent =
                t("referralUnavailable");
        }


    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                t("checkReferral");
        }

    }
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

/*
 * Resize + re-encode a photo in the browser before it ever
 * touches IndexedDB or the network. Phone camera photos can
 * be 3-10MB; this brings them down to a few hundred KB, which
 * is what actually fixes "upload interrupted" on mobile data.
 */
function compressPhoto(
    file,
    maxDimension = 1600,
    quality = 0.72
) {

    return new Promise((resolve) => {

        const image = new Image();

        const objectUrl =
            URL.createObjectURL(file);

        image.onload = () => {

            URL.revokeObjectURL(objectUrl);

            let { width, height } = image;

            if (width > maxDimension || height > maxDimension) {

                if (width >= height) {

                    height =
                        Math.round(
                            height * (maxDimension / width)
                        );

                    width = maxDimension;

                } else {

                    width =
                        Math.round(
                            width * (maxDimension / height)
                        );

                    height = maxDimension;

                }

            }

            const canvas =
                document.createElement("canvas");

            canvas.width = width;
            canvas.height = height;

            const context =
                canvas.getContext("2d");

            context.drawImage(image, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {

                    if (!blob) {
                        // Fallback: if compression fails for any
                        // reason, just use the original file so
                        // the user isn't blocked.
                        resolve(file);
                        return;
                    }

                    const compressedFile =
                        new File(
                            [blob],
                            file.name.replace(/\.\w+$/, ".jpg"),
                            {
                                type: "image/jpeg",
                                lastModified: Date.now()
                            }
                        );

                    resolve(compressedFile);

                },
                "image/jpeg",
                quality
            );

        };

        image.onerror = () => {

            URL.revokeObjectURL(objectUrl);

            // If the browser can't decode it (rare), fall back
            // to uploading the original file untouched.
            resolve(file);

        };

        image.src = objectUrl;

    });

}

async function handlePhotos(event) {
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

    // Compress every photo before adding it to the selection.
    const compressedFiles =
        await Promise.all(
            files.map(file => compressPhoto(file))
        );

    selectedFiles =
        selectedFiles.concat(compressedFiles);

    renderPhotos();

    event.target.value = "";
}

function handleReferralInputChange() {

    validatedReferral = null;


    localStorage.removeItem(
        "securepro_referral"
    );


    const result =
        document.querySelector(
            "#referralResult"
        );


    const message =
        document.querySelector(
            "#referralMessage"
        );


    if (result) {
        result.hidden = true;
    }


    if (message) {

        message.className =
            "referral-message";

        message.textContent =
            t("referralOptional");
    }
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


function initializeReferralMessages() {

    const message =
        document.querySelector("#referralMessage");

    const resultTitle =
        document.querySelector("#referralResultTitle");

    const resultDescription =
        document.querySelector("#referralResultDescription");

    const button =
        document.querySelector("#validateReferralButton");

    if (message) {
        message.textContent = t("referralOptional");
    }

    if (resultTitle) {
        resultTitle.textContent = t("referralAccepted");
    }

    if (resultDescription) {
        resultDescription.textContent = t("referralOptional");
    }

    if (button) {
        button.textContent = t("checkReferral");
    }
}

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
        initializeReferralMessages();
        restoreCustomerData();

        document.querySelector(
            "#customerPhotos"
        )?.addEventListener(
            "change",
            handlePhotos
        );

        document.querySelector(
            "#validateReferralButton"
        )?.addEventListener(
            "click",
            validateReferralCode
        );


        document.querySelector(
            "#referralCode"
        )?.addEventListener(
            "input",
            handleReferralInputChange
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


                /* =========================================
                   VALIDATE REFERRAL FIRST
                ========================================= */

                const referralInput =
                    document.querySelector(
                        "#referralCode"
                    );

                const referralCode =
                    referralInput
                        ?.value
                        .trim()
                        .toUpperCase() || "";


                if (referralCode) {

                    /*
                     * The referral was validated through the API
                     * and saved to localStorage.
                     *
                     * Read the saved referral here instead of relying
                     * only on the in-memory validatedReferral variable.
                     */

                    let savedReferral = null;

                    try {

                        const rawReferral =
                            localStorage.getItem(
                                "securepro_referral"
                            );

                        if (rawReferral) {
                            savedReferral =
                                JSON.parse(rawReferral);
                        }

                    } catch (error) {

                        console.error(
                            "Unable to read saved referral:",
                            error
                        );

                        savedReferral = null;
                    }


                    const savedReferralCode =
                        String(
                            savedReferral?.code || ""
                        )
                            .trim()
                            .toUpperCase();


                    if (
                        !savedReferral ||
                        savedReferralCode !== referralCode
                    ) {

                        showError(
                            currentLanguage === "en"
                                ? "Please check your referral code before continuing."
                                : "Sila semak kod rujukan anda sebelum meneruskan."
                        );

                        return;
                    }


                    validatedReferral =
                        savedReferral;

                } else {

                    validatedReferral = null;

                    localStorage.removeItem(
                        "securepro_referral"
                    );
                }


                /* =========================================
                   SAVE CUSTOMER DATA
                ========================================= */

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