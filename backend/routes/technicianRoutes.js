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
    startAssignedRequest,
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
// PRIVATE LOCAL STORAGE
// ======================================================

const serviceReportStorage = createLocalStorage("service-reports");
const videoStorage = createLocalStorage("videos");
const storage = {
    _handleFile(req, file, callback) {
        const selected = file.mimetype.startsWith("video/") ? videoStorage : serviceReportStorage;
        selected._handleFile(req, file, callback);
    },
    _removeFile(req, file, callback) {
        const selected = file.mimetype.startsWith("video/") ? videoStorage : serviceReportStorage;
        selected._removeFile(req, file, callback);
    }
};


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

                const validation =
                    validateUploadFile(
                        file,
                        {
                            fields: [
                                "completion_media"
                            ],
                            byField: {
                                completion_media: {
                                    mimes: allowedTypes,
                                    extensions: [
                                        "jpg",
                                        "jpeg",
                                        "png",
                                        "webp",
                                        "mp4",
                                        "webm",
                                        "mov"
                                    ],
                                    message:
                                        "Only JPG, PNG, WebP, MP4, WebM and MOV files are allowed."
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
// START ASSIGNED JOB
// ======================================================

router.post(

    "/requests/:id/start",

    startAssignedRequest

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
    prepareUploadedFiles,
    cleanupOnControllerFailure(submitWorkReport)

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
