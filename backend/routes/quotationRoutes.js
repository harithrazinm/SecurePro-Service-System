const express = require("express");
const multer = require("multer");
const {
    CloudinaryStorage
} = require("multer-storage-cloudinary");

const cloudinary =
    require("../config/cloudinary");

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


/* =========================================================
   CLOUDINARY STORAGE
========================================================= */

const storage =
    new CloudinaryStorage({

        cloudinary,

        params:
            async (
                req,
                file
            ) => ({

                folder:
                    file.fieldname ===
                    "payment_proof"

                        ? "securepro/payment-proofs"

                        : "securepro/quotations",

                resource_type:
                    file.fieldname ===
                    "quotation_file"

                        ? "raw"

                        : "auto",

                format:
                    file.fieldname ===
                    "quotation_file"

                        ? "pdf"

                        : undefined,

                use_filename:
                    true,

                unique_filename:
                    true

            })

    });


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

                const allowed = [

                    "application/pdf",

                    "image/jpeg",

                    "image/png",

                    "image/webp"

                ];


                const isQuotation =
                    file.fieldname ===
                    "quotation_file";


                const isAllowed =
                    isQuotation

                        ? file.mimetype ===
                            "application/pdf"

                        : allowed.includes(
                            file.mimetype
                        );


                callback(

                    isAllowed
                        ? null
                        : new Error(

                            isQuotation

                                ? "Quotation upload must be a PDF file."

                                : "Payment proof must be a PDF, JPG, PNG, or WEBP file."

                        ),

                    isAllowed

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
    createQuotation
);


/* =========================================================
   UPDATE / REPLACE QUOTATION
========================================================= */

router.put(
    "/:id",
    upload.single("quotation_file"),
    updateQuotation
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
    uploadPaymentProof
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
    uploadFinalQuotation
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