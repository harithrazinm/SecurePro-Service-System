const express = require("express");
const multer = require("multer");

const {
    CloudinaryStorage
} = require("multer-storage-cloudinary");

const cloudinary =
    require("../config/cloudinary");

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


/*
 * ==========================================================
 * CLOUDINARY STORAGE
 * ==========================================================
 */

const storage =
    new CloudinaryStorage({

        cloudinary:

            cloudinary,


        params: async (
            req,
            file
        ) => {

            console.log(
                "Uploading photo to Cloudinary:",
                {
                    originalName:
                        file.originalname,

                    mimetype:
                        file.mimetype
                }
            );


            return {

                /*
                 * Cloudinary folder
                 */

                folder:
                    "securepro/customer-photos",


                /*
                 * Image type
                 */

                resource_type:
                    "image",


                /*
                 * Generate unique filename automatically
                 */

                use_filename:
                    true,

                unique_filename:
                    true,


                /*
                 * Supported upload formats
                 */

                allowed_formats: [
                    "jpg",
                    "jpeg",
                    "png",
                    "webp"
                ]

            };

        }

    });


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

    console.log(
        "Incoming photo:",
        {
            originalName:
                file.originalname,

            mimetype:
                file.mimetype
        }
    );


    if (
        file.mimetype &&
        file.mimetype.startsWith(
            "image/"
        )
    ) {

        return callback(
            null,
            true
        );

    }


    return callback(
        new Error(
            "Only image files are allowed."
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