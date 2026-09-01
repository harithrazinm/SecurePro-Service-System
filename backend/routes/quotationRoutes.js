const express = require("express");

const {
    getQuotations,
    getQuotationById,
    createQuotation,
    sendQuotation
} = require("../controllers/quotationController");

const {
    generateQuotationPDF
} = require("../controllers/quotationPdfController");

const authMiddleware =
    require("../middleware/authMiddleware");

const requireAdmin =
    authMiddleware.requireAdmin;

const router = express.Router();


// ======================================================
// ALL QUOTATION ROUTES REQUIRE ADMIN LOGIN
// ======================================================

router.use(
    authMiddleware,
    requireAdmin
);


// ======================================================
// GET ALL QUOTATIONS
// GET /api/admin/quotations
// ======================================================

router.get(
    "/",
    getQuotations
);


// ======================================================
// GET QUOTATION BY ID
// GET /api/admin/quotations/:id
// ======================================================

router.get(
    "/:id",
    getQuotationById
);


// ======================================================
// GENERATE QUOTATION PDF
// GET /api/admin/quotations/:id/pdf
// ======================================================

router.get(
    "/:id/pdf",
    generateQuotationPDF
);


// ======================================================
// CREATE QUOTATION
// POST /api/admin/quotations
// ======================================================

router.post(
    "/",
    createQuotation
);


// ======================================================
// SEND QUOTATION
// POST /api/admin/quotations/:id/send
// ======================================================

router.post(
    "/:id/send",
    sendQuotation
);


module.exports = router;