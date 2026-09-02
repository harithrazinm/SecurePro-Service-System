const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const authMiddleware = require("../middleware/authMiddleware");
const {
    getQuotations,
    getQuotationById,
    createQuotation,
    sendQuotation,
    sendQuotationByEmail,
    uploadPaymentProof
} = require("../controllers/quotationController");

const router = express.Router();

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
        folder: file.fieldname === "payment_proof"
            ? "securepro/payment-proofs"
            : "securepro/quotations",
        /* PDFs must use Cloudinary's raw delivery type. Images and PDFs used
         * as payment proof may remain automatic. */
        resource_type: file.fieldname === "quotation_file" ? "raw" : "auto",
        use_filename: true,
        unique_filename: true
    })
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
        const isQuotation = file.fieldname === "quotation_file";
        const isAllowed = isQuotation
            ? file.mimetype === "application/pdf"
            : allowed.includes(file.mimetype);
        callback(
            isAllowed
                ? null
                : new Error(isQuotation
                    ? "Quotation upload must be a PDF file."
                    : "Payment proof must be a PDF, JPG, PNG, or WEBP file."),
            isAllowed
        );
    }
});

router.use(authMiddleware, authMiddleware.requireAdmin);

router.get("/", getQuotations);
router.get("/:id", getQuotationById);
router.post("/", upload.single("quotation_file"), createQuotation);
router.post("/:id/send", sendQuotation);
router.post("/:id/email", sendQuotationByEmail);
router.post("/:id/payment-proof", upload.single("payment_proof"), uploadPaymentProof);

router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, message: "File is too large. Maximum size is 10 MB." });
    }
    if (error) {
        console.error("Quotation upload error:", error);
        return res.status(400).json({ success: false, message: error.message || "Only PDF, JPG, PNG, and WEBP files are allowed." });
    }
    return next();
});

module.exports = router;
