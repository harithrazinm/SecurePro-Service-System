const express = require("express");

const {
    getRequests,
    getRequestById,
    getDashboardSummary,
    getJobPendingRequests,
    getTechnicians,
    updateRequest,
    reviewTechnicianReport
} = require("../controllers/adminController");

const authMiddleware =
    require("../middleware/authMiddleware");

const requireAdmin =
    authMiddleware.requireAdmin;

const router = express.Router();


// ======================================================
// ALL ADMIN ROUTES REQUIRE ADMIN LOGIN
// ======================================================

router.use(
    authMiddleware,
    requireAdmin
);


// ======================================================
// DASHBOARD
// ======================================================

router.get(
    "/dashboard",
    getDashboardSummary
);


// ======================================================
// TECHNICIANS
// ======================================================

router.get(
    "/technicians",
    getTechnicians
);


// ======================================================
// REQUESTS
// ======================================================

router.get(
    "/requests",
    getRequests
);

// Paid requests waiting for technician assignment.
router.get(
    "/job-pending",
    getJobPendingRequests
);


// ======================================================
// REQUEST DETAILS
// ======================================================

router.get(
    "/requests/:id",
    getRequestById
);


// ======================================================
// UPDATE REQUEST
// ======================================================

router.put(
    "/requests/:id",
    updateRequest
);


// ======================================================
// REVIEW TECHNICIAN REPORT
// ======================================================

router.post(
    "/requests/:id/report/review",
    reviewTechnicianReport
);


module.exports = router;
