const express = require("express");
const multer = require("multer");

const {
    CloudinaryStorage
} = require("multer-storage-cloudinary");

const cloudinary =
    require("../config/cloudinary");


const {
    getAssignedRequests,
    getAssignedRequestById,
    submitWorkReport
} = require("../controllers/technicianController");


const authMiddleware =
    require("../middleware/authMiddleware");


const requireTechnician =
    authMiddleware.requireTechnician;


const router =
    express.Router();


// ======================================================
// CLOUDINARY STORAGE
// ======================================================

const storage =
    new CloudinaryStorage({

        cloudinary,

        params: async (
            req,
            file
        ) => {

            const isImage =
                file.mimetype.startsWith(
                    "image/"
                );


            return {

                folder:
                    "securepro/technician-reports",


                resource_type:
                    isImage
                        ? "image"
                        : "video",


                use_filename:
                    true,


                unique_filename:
                    true,


                allowed_formats:
                    isImage
                        ? [
                            "jpg",
                            "jpeg",
                            "png",
                            "webp"
                        ]
                        : [
                            "mp4",
                            "webm",
                            "mov"
                        ]

            };

        }

    });


// ======================================================
// ALLOWED FILE TYPES
// ======================================================

const allowedImages = [

    "image/jpeg",

    "image/png",

    "image/webp"

];


const allowedVideos = [

    "video/mp4",

    "video/webm",

    "video/quicktime"

];


const allowedTypes = [

    ...allowedImages,

    ...allowedVideos

];


// ======================================================
// MULTER CONFIGURATION
// ======================================================

const upload =
    multer({

        storage,

        limits: {

            files: 10,

            fileSize:
                100 * 1024 * 1024

        },

        fileFilter:
            (
                req,
                file,
                callback
            ) => {

                if (
                    allowedTypes.includes(
                        file.mimetype
                    )
                ) {

                    return callback(
                        null,
                        true
                    );

                }


                return callback(
                    new Error(
                        "Only JPG, PNG, WebP, MP4, WebM and MOV files are allowed."
                    )
                );

            }

    });


// ======================================================
// ALL TECHNICIAN ROUTES REQUIRE TECHNICIAN LOGIN
// ======================================================

router.use(

    authMiddleware,

    requireTechnician

);


// ======================================================
// ASSIGNED REQUESTS
// ======================================================

router.get(

    "/requests",

    getAssignedRequests

);


// ======================================================
// REQUEST DETAILS
// ======================================================

router.get(

    "/requests/:id",

    getAssignedRequestById

);


// ======================================================
// SUBMIT WORK REPORT
// ======================================================

router.post(

    "/requests/:id/report",

    upload.array(
        "completion_media",
        10
    ),

    submitWorkReport

);


// ======================================================
// UPLOAD ERROR HANDLER
// ======================================================

router.use(

    (
        error,
        req,
        res,
        next
    ) => {

        console.error(
            "TECHNICIAN UPLOAD ERROR:",
            error
        );


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
                        "One file is too large. Maximum size is 100 MB."

                });

            }


            if (
                error.code ===
                "LIMIT_FILE_COUNT"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Maximum 10 files are allowed."

                });

            }

        }


        return res.status(400).json({

            success: false,

            message:
                error.message ||
                "Media upload failed."

        });

    }

);


module.exports =
    router;