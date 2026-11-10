const express = require("express");
const multer = require("multer");
const authMiddleware = require("../middleware/authMiddleware");
const { validateUploadFile } = require("../middleware/uploadValidation");
const {
    createLocalStorage,
    prepareUploadedFiles,
    cleanupOnControllerFailure
} = require("../services/mediaStorage");
const invoiceController = require("../controllers/invoiceController");

const {
    getInvoices,
    getInvoiceForRequest,
    createInvoice,
    sendInvoiceByEmail,
    uploadPaymentProof,
    getPaymentProofs,
    verifyPayment
} = invoiceController;
const router = express.Router();

const invoiceStorage = createLocalStorage("invoices");
const paymentProofStorage = createLocalStorage("payment-proofs");
const storage = {
    _handleFile(req, file, callback) {
        const selected = file.fieldname === "payment_proof" ? paymentProofStorage : invoiceStorage;
        selected._handleFile(req, file, callback);
    },
    _removeFile(req, file, callback) {
        const selected = file.fieldname === "payment_proof" ? paymentProofStorage : invoiceStorage;
        selected._removeFile(req, file, callback);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {

        const validation = validateUploadFile(file, {
            fields: [
                "invoice_file",
                "payment_proof"
            ],
            byField: {
                invoice_file: {
                    mimes: ["application/pdf"],
                    extensions: ["pdf"],
                    message: "Invoice must be a PDF file."
                },
                payment_proof: {
                    mimes: [
                        "application/pdf",
                        "image/jpeg",
                        "image/png",
                        "image/webp"
                    ],
                    extensions: [
                        "pdf",
                        "jpg",
                        "jpeg",
                        "png",
                        "webp"
                    ],
                    message: "Payment proof must be a PDF, JPG, PNG, or WEBP file."
                }
            }
        });

        cb(
            validation.valid
                ? null
                : new Error(validation.message),
            validation.valid
        );
    }
});

router.use(authMiddleware, authMiddleware.requireAdmin);

router.get("/", getInvoices);
router.get("/payments", getPaymentProofs);
router.get("/request/:requestId", getInvoiceForRequest);
router.post("/request/:requestId", upload.single("invoice_file"), prepareUploadedFiles, cleanupOnControllerFailure(createInvoice));
router.post("/:id/email", sendInvoiceByEmail);
router.post("/:id/payment-proof", upload.single("payment_proof"), prepareUploadedFiles, cleanupOnControllerFailure(uploadPaymentProof));
router.post("/payments/:paymentId/verify", verifyPayment);
router.patch(
    "/:id/referral-reward",
    authMiddleware,
    authMiddleware.requireAdmin,
    invoiceController.markReferralRewardApplied
);



router.patch(
    "/:id/referral-reward",
    invoiceController.markReferralRewardApplied
);

module.exports = router;
