const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../middleware/authMiddleware");

const {
    getQuotationApprovalQueue,
    getQuotationReview,
    approveQuotation,
    requestQuotationRevision
} =
    require("../controllers/superAdminQuotationController");


/* =========================================================
   AUTHENTICATION
========================================================= */

router.use(
    authMiddleware
);


/* =========================================================
   SUPER ADMIN ONLY
========================================================= */

router.use(
    (req, res, next) => {

        if (
            !req.user ||
            req.user.role !== "super_admin"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Super Admin access required."

            });

        }

        next();

    }
);


/* =========================================================
   GET PENDING QUOTATIONS
 *
 * GET
 * /api/super-admin/quotations/pending
========================================================= */

router.get(
    "/pending",
    getQuotationApprovalQueue
);


/* =========================================================
   GET QUOTATION REVIEW
 *
 * GET
 * /api/super-admin/quotations/:id
========================================================= */

router.get(
    "/:id",
    getQuotationReview
);


/* =========================================================
   APPROVE QUOTATION
 *
 * POST
 * /api/super-admin/quotations/:id/approve
========================================================= */

router.post(
    "/:id/approve",
    approveQuotation
);


/* =========================================================
   REQUEST REVISION
 *
 * POST
 * /api/super-admin/quotations/:id/revision
========================================================= */

router.post(
    "/:id/revision",
    requestQuotationRevision
);


/* =========================================================
   EXPORT ROUTER
========================================================= */

module.exports =
    router;