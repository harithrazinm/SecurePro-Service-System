/* =========================================================
   SOPRO REQUEST PROGRESS
   Shared progress indicator for the request flow.
   ========================================================= */

(function () {
    const language =
        localStorage.getItem("securepro_language") || "ms";

    const labels = {
        en: {
            questions: "Questions",
            customer: "Customer Details",
            review: "Review",
            submit: "Submit"
        },
        ms: {
            questions: "Soalan",
            customer: "Maklumat Pelanggan",
            review: "Semakan",
            submit: "Hantar"
        }
    };

    function applyLabels() {
        const selected = labels[language] || labels.ms;

        document
            .querySelectorAll("[data-request-progress-label]")
            .forEach((element) => {
                const key = element.dataset.requestProgressLabel;
                if (selected[key]) {
                    element.textContent = selected[key];
                }
            });
    }

    document.addEventListener("DOMContentLoaded", applyLabels);
})();
