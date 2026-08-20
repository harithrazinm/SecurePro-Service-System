const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
    createRequest
} = require("../controllers/requestController");


const router = express.Router();


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


fs.mkdirSync(
    uploadDirectory,
    {
        recursive: true
    }
);


/*
 * ==========================================================
 * MULTER STORAGE
 * ==========================================================
 */

const storage =
    multer.diskStorage({

        destination:
            (req, file, callback) => {

                callback(
                    null,
                    uploadDirectory
                );

            },


        filename:
            (req, file, callback) => {

                const extension =
                    path.extname(
                        file.originalname
                    ).toLowerCase();


                const uniqueName =
                    `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;


                callback(
                    null,
                    uniqueName
                );

            }

    });


/*
 * ==========================================================
 * MULTER
 * ==========================================================
 */

const upload =
    multer({

        storage,


        limits: {

            files: 10,

            /*
             * Allow up to 20 MB per photo.
             */

            fileSize:
                20 * 1024 * 1024

        },


        fileFilter:
            (req, file, callback) => {

                console.log(
                    "Incoming photo:",
                    file.originalname,
                    file.mimetype
                );


                /*
                 * Accept image files from mobile devices.
                 */

                if (
                    file.mimetype &&
                    file.mimetype.startsWith(
                        "image/"
                    )
                ) {

                    callback(
                        null,
                        true
                    );

                } else {

                    callback(
                        new Error(
                            "Please upload a valid image."
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
 * ERROR HANDLER
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


        if (
            error.message ===
            "Unexpected end of form"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "The photo upload was interrupted. Please check your internet connection and try uploading again."

            });

        }


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

        }


        return res.status(400).json({

            success: false,

            message:
                error.message ||
                "Photo upload failed."

        });

    }
);


module.exports =
    router;