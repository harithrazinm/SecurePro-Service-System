const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const authMiddleware = require("../middleware/authMiddleware");
const { validateUploadFile } = require("../middleware/uploadValidation");
const {
    getInvoices,
    getInvoiceForRequest,
    createInvoice,
    sendInvoiceByEmail,
    uploadPaymentProof,
    getPaymentProofs,
    verifyPayment
} = require("../controllers/invoiceController");

const router = express.Router();

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
        folder: file.fieldname === "payment_proof" ? "securepro/invoice-payment-proofs" : "securepro/invoices",
        resource_type: file.fieldname === "invoice_file" ? "raw" : "auto",
        format: file.fieldname === "invoice_file" ? "pdf" : undefined,
        use_filename: true,
        unique_filename: true
    })
});

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
router.post("/request/:requestId", upload.single("invoice_file"), createInvoice);
router.post("/:id/email", sendInvoiceByEmail);
router.post("/:id/payment-proof", upload.single("payment_proof"), uploadPaymentProof);
router.post("/payments/:paymentId/verify", verifyPayment);

module.exports = router;
