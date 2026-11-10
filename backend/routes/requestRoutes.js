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

const {
    createRequest
} = require(
    "../controllers/requestController"
);


const router =
    express.Router();


/*
 * ==========================================================
 * CHECK CONTROLLER
 * ==========================================================
 */

console.log(
    "createRequest type:",
    typeof createRequest
);


/* Keep customer uploads private; files are served only by the signed media endpoint. */
const storage = createLocalStorage("customers");


/*
 * ==========================================================
 * FILE FILTER
 * ==========================================================
 */

function fileFilter(
    req,
    file,
    callback
) {

    const validation =
        validateUploadFile(
            file,
            {
                fields: [
                    "customer_photos"
                ],
                byField: {
                    customer_photos: {
                        mimes: [
                            "image/jpeg",
                            "image/png",
                            "image/webp"
                        ],
                        extensions: [
                            "jpg",
                            "jpeg",
                            "png",
                            "webp"
                        ],
                        message:
                            "Only JPG, JPEG, PNG and WEBP images are allowed."
                    }
                }
            }
        );


    if (validation.valid) {

        return callback(
            null,
            true
        );

    }


    return callback(
        new Error(
            validation.message
        )
    );

}


/*
 * ==========================================================
 * MULTER CONFIGURATION
 * ==========================================================
 */

const upload =
    multer({

        storage:
            storage,


        limits: {

            /*
             * Maximum 10 photos
             */

            files:
                10,


            /*
             * Maximum 20 MB each
             */

            fileSize:
                20 * 1024 * 1024

        },


        fileFilter:
            fileFilter

    });


/*
 * ==========================================================
 * CREATE REQUEST
 * ==========================================================
 */

router.post(
    "/",
    upload.array(
        "customer_photos",
        10
    ),
    prepareUploadedFiles,
    cleanupOnControllerFailure(createRequest)
);


/*
 * ==========================================================
 * UPLOAD ERROR HANDLER
 * ==========================================================
 */

router.use(
    (
        error,
        req,
        res,
        next
    ) => {

        console.error(
            "=========================================="
        );

        console.error(
            "REQUEST UPLOAD ERROR"
        );

        console.error(
            error
        );

        console.error(
            "=========================================="
        );


        if (
            error instanceof multer.MulterError
        ) {

            if (
                error.code ===
                "LIMIT_FILE_SIZE"
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "One photo is too large. Maximum size is 20 MB."

                });

            }


            if (
                error.code ===
                "LIMIT_FILE_COUNT"
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Maximum 10 photos are allowed."

                });

            }


            if (
                error.code ===
                "LIMIT_UNEXPECTED_FILE"
            ) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "Unexpected photo upload field."

                });

            }

        }


        return res.status(400).json({

            success:
                false,

            message:
                error.message ||
                "Photo upload failed."

        });

    }
);


/*
 * ==========================================================
 * EXPORT
 * ==========================================================
 */

module.exports =
    router;
