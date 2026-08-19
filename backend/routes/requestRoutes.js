const express = require("express");
const multer = require("multer");

const {
    createRequest
} = require("../controllers/requestController");


const router =
    express.Router();


/*
 * ==========================================================
 * MULTER
 * ==========================================================
 *
 * Files are temporarily kept in memory.
 * The request controller then moves them into
 * uploads/customer.
 */

const upload =
    multer({

        storage:
            multer.memoryStorage(),

        limits: {

            files: 10,

            fileSize:
                10 * 1024 * 1024
        },

        fileFilter:
            (req, file, callback) => {

                const allowed = [
                    "image/jpeg",
                    "image/png",
                    "image/webp"
                ];


                if (
                    allowed.includes(
                        file.mimetype
                    )
                ) {

                    callback(
                        null,
                        true
                    );

                } else {

                    callback(
                        new Error(
                            "Only JPG, PNG and WebP images are allowed."
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


module.exports = router;