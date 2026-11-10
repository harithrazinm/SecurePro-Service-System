const express = require("express");
const multer = require("multer");
const {
    createLocalStorage,
    prepareUploadedFiles,
    cleanupOnControllerFailure
} = require("../services/mediaStorage");

const {
    validateUploadFile
} = require("../middleware/uploadValidation");

const authMiddleware =
    require("../middleware/authMiddleware");


const {
    getQuotations,
    getQuotationById,
    getQuotationsByRequest,
    createQuotation,
    updateQuotation,
    deleteQuotation,
    sendQuotation,
    sendQuotationByEmail,
    uploadPaymentProof,
    recordFollowUp,
    uploadFinalQuotation
} = require("../controllers/quotationController");


const router =
    express.Router();


/* Private local storage; payment proofs use their own subdirectory. */
const quotationStorage = createLocalStorage("quotations");
const paymentProofStorage = createLocalStorage("payment-proofs");
const storage = {
    _handleFile(req, file, callback) {
        const selected = file.fieldname === "payment_proof" ? paymentProofStorage : quotationStorage;
        selected._handleFile(req, file, callback);
    },
    _removeFile(req, file, callback) {
        const selected = file.fieldname === "payment_proof" ? paymentProofStorage : quotationStorage;
        selected._removeFile(req, file, callback);
    }
};


/* =========================================================
   MULTER
========================================================= */

const upload =
    multer({

        storage,

        limits: {

            fileSize:
                10 *
                1024 *
                1024

        },

        fileFilter:
            (
                req,
                file,
                callback
            ) => {

                const validation =
                    validateUploadFile(
                        file,
                        {
                            fields: [
                                "quotation_file",
                                "payment_proof"
                            ],
                            byField: {
                                quotation_file: {
                                    mimes: [
                                        "application/pdf"
                                    ],
                                    extensions: [
                                        "pdf"
                                    ],
                                    message:
                                        "Quotation upload must be a PDF file."
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
                                    message:
                                        "Payment proof must be a PDF, JPG, PNG, or WEBP file."
                                }
                            }
                        }
                    );


                callback(
                    validation.valid
                        ? null
                        : new Error(
                            validation.message
                        ),
                    validation.valid
                );

            }

    });


/* =========================================================
   ADMIN AUTHENTICATION
========================================================= */

router.use(
    authMiddleware,
    authMiddleware.requireAdmin
);


/* =========================================================
   GET ALL QUOTATIONS
========================================================= */

router.get(
    "/",
    getQuotations
);


/* =========================================================
   GET QUOTATIONS FOR REQUEST
 *
 * /api/quotations/request/:requestId
========================================================= */

router.get(
    "/request/:requestId",
    getQuotationsByRequest
);


/* =========================================================
   GET ONE QUOTATION
========================================================= */

router.get(
    "/:id",
    getQuotationById
);


/* =========================================================
   CREATE ONE ORIGINAL QUOTATION
========================================================= */

router.post(
    "/",
    upload.single("quotation_file"),
    prepareUploadedFiles,
    cleanupOnControllerFailure(createQuotation)
);


/* =========================================================
   UPDATE / REPLACE QUOTATION
========================================================= */

router.put(
    "/:id",
    upload.single("quotation_file"),
    prepareUploadedFiles,
    cleanupOnControllerFailure(updateQuotation)
);


/* =========================================================
   DELETE QUOTATION
========================================================= */

router.delete(
    "/:id",
    deleteQuotation
);


/* =========================================================
   MARK AS SENT
========================================================= */

router.post(
    "/:id/send",
    sendQuotation
);


/* =========================================================
   EMAIL
========================================================= */

router.post(
    "/:id/email",
    sendQuotationByEmail
);


/* =========================================================
   PAYMENT PROOF
========================================================= */

router.post(
    "/:id/payment-proof",
    upload.single("payment_proof"),
    prepareUploadedFiles,
    cleanupOnControllerFailure(uploadPaymentProof)
);


/* =========================================================
   FOLLOW-UP
========================================================= */

router.post(
    "/:id/follow-up/:number",
    recordFollowUp
);


/* =========================================================
   FINAL QUOTATION

   IMPORTANT: this route must appear before /:id routes are
   interpreted, and it uses a request ID rather than quotation ID.
========================================================= */

router.post(
    "/:requestId/final-quotation",
    upload.single("quotation_file"),
    prepareUploadedFiles,
    cleanupOnControllerFailure(uploadFinalQuotation)
);


/* =========================================================
   UPLOAD ERROR HANDLER
========================================================= */

router.use(
    (
        error,
        req,
        res,
        next
    ) => {

        if (
            error instanceof
            multer.MulterError
        ) {

            if (
                error.code ===
                "LIMIT_FILE_SIZE"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "File is too large. Maximum size is 10 MB."

                });

            }

        }


        if (error) {

            console.error(
                "Quotation upload error:",
                error
            );


            return res.status(400).json({

                success: false,

                message:
                    error.message ||
                    "Invalid quotation file."

            });

        }


        return next(error);

    }
);


module.exports =
    router;
