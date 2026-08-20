const express = require("express");
const multer = require("multer");

const {
    createRequest
} = require("../controllers/requestController");


const router =
    express.Router();


/*
 * ==========================================================
 * MULTER CONFIGURATION
 * ==========================================================
 */

const upload =
    multer({

        /*
         * Keep uploaded files temporarily in memory.
         * The controller saves them into uploads/customer.
         */

        storage:
            multer.memoryStorage(),


        limits: {

            /*
             * Maximum 10 photos.
             */

            files: 10,


            /*
             * Maximum 10 MB per photo.
             */

            fileSize:
                10 * 1024 * 1024
        },


        /*
         * ALLOWED IMAGE TYPES
         */

        fileFilter:
    (req, file, callback) => {

        console.log(
            "Uploaded file:",
            file.originalname,
            file.mimetype
        );

        if (
            file.mimetype &&
            file.mimetype.startsWith("image/")
        ) {

            callback(null, true);

        } else {

            callback(
                new Error(
                    "Please upload a valid image file."
                )
            );

        }

    }

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
    createRequest
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
            "Request upload error:",
            error
        );


        /*
         * Too many files
         */

        if (
            error instanceof multer.MulterError
        ) {

            if (
                error.code ===
                "LIMIT_FILE_SIZE"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "One of the photos is too large. Maximum size is 10 MB per photo."

                });

            }


            if (
                error.code ===
                "LIMIT_FILE_COUNT"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "You can upload a maximum of 10 photos."

                });

            }


            if (
                error.code ===
                "LIMIT_UNEXPECTED_FILE"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Unexpected photo upload field."

                });

            }


            return res.status(400).json({

                success: false,

                message:
                    error.message ||
                    "Photo upload failed."

            });

        }


        /*
         * File type or other errors
         */

        return res.status(400).json({

            success: false,

            message:
                error.message ||
                "Unable to upload photo."

        });

    }
);


module.exports =
    router;