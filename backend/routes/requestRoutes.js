const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");


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
 * UPLOAD DIRECTORY
 * ==========================================================
 */

const uploadDirectory =
    path.join(
        __dirname,
        "../uploads/customer"
    );


if (
    !fs.existsSync(
        uploadDirectory
    )
) {

    fs.mkdirSync(
        uploadDirectory,
        {
            recursive: true
        }
    );

}


/*
 * ==========================================================
 * MULTER STORAGE
 * ==========================================================
 */

const storage =
    multer.diskStorage({

        destination:
            (
                req,
                file,
                callback
            ) => {

                callback(
                    null,
                    uploadDirectory
                );

            },


        filename:
            (
                req,
                file,
                callback
            ) => {

                const originalExtension =
                    path.extname(
                        file.originalname ||
                        ""
                    ).toLowerCase();


                let extension =
                    originalExtension;


                /*
                 * Generate extension when mobile browser
                 * does not provide a filename extension.
                 */

                if (!extension) {

                    if (
                        file.mimetype ===
                        "image/png"
                    ) {

                        extension =
                            ".png";

                    }

                    else if (
                        file.mimetype ===
                        "image/webp"
                    ) {

                        extension =
                            ".webp";

                    }

                    else if (
                        file.mimetype ===
                        "image/heic"
                    ) {

                        extension =
                            ".heic";

                    }

                    else if (
                        file.mimetype ===
                        "image/heif"
                    ) {

                        extension =
                            ".heif";

                    }

                    else {

                        extension =
                            ".jpg";

                    }

                }


                const uniqueName =
                    `${Date.now()}-${Math.round(
                        Math.random() * 1e9
                    )}${extension}`;


                callback(
                    null,
                    uniqueName
                );

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

            files:
                10,


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
                    success: false,

                    message:
                        "One photo is too large. Maximum size is 20 MB."
                });

            }


            if (
                error.code ===
                "LIMIT_FILE_COUNT"
            ) {

                return res.status(400).json({
                    success: false,

                    message:
                        "Maximum 10 photos are allowed."
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


module.exports =
    router;