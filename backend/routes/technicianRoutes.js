const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

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
// UPLOAD DIRECTORY
// ======================================================

const uploadDirectory =
    path.join(
        __dirname,
        "..",
        "uploads",
        "technician",
        "reports"
    );


if (!fs.existsSync(uploadDirectory)) {

    fs.mkdirSync(
        uploadDirectory,
        {
            recursive: true
        }
    );

}


// ======================================================
// MULTER STORAGE
// ======================================================

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
                    );

                const uniqueName =
                    `${Date.now()}-${Math.round(
                        Math.random() * 1E9
                    )}${extension}`;

                callback(
                    null,
                    uniqueName
                );

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
            (req, file, callback) => {

                if (
                    allowedTypes.includes(
                        file.mimetype
                    )
                ) {

                    callback(
                        null,
                        true
                    );

                    return;
                }


                callback(
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
//
// Supports:
// - work_performed
// - findings
// - materials_used
// - technician_notes
// - completion_media[]
// ======================================================

router.post(
    "/requests/:id/report",

    upload.array(
        "completion_media",
        10
    ),

    submitWorkReport
);


module.exports = router;