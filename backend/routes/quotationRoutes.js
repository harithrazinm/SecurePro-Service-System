const express = require("express");

const {
    createQuotation,
    getQuotationById,
    getQuotations,
    getQuotationsByRequest,
    updateQuotation,
    sendQuotation,
    deleteQuotation
} = require("../controllers/quotationController");

const authMiddleware =
    require("../middleware/authMiddleware");

const requireAdmin =
    authMiddleware.requireAdmin;

const router =
    express.Router();

    const {
    generateQuotationPDF
} = require("../controllers/quotationPdfController");


// ======================================================
// ALL QUOTATION ROUTES REQUIRE ADMIN
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
// CREATE QUOTATION
// POST /api/admin/quotations
// ======================================================

router.post(
    "/",
    createQuotation
);


// ======================================================
// GET QUOTATIONS FOR REQUEST
// GET /api/admin/quotations/request/:requestId
// ======================================================

router.get(
    "/request/:requestId",
    getQuotationsByRequest
);


// ======================================================
// GET QUOTATION
// GET /api/admin/quotations/:id
// ======================================================

router.get(
    "/:id",
    getQuotationById
);


// ======================================================
// UPDATE QUOTATION
// PUT /api/admin/quotations/:id
// ======================================================

router.put(
    "/:id",
    updateQuotation
);


// ======================================================
// SEND QUOTATION
// POST /api/admin/quotations/:id/send
// ======================================================

router.post(
    "/:id/send",
    sendQuotation
);


// ======================================================
// DELETE DRAFT QUOTATION
// DELETE /api/admin/quotations/:id
// ======================================================

router.delete(
    "/:id",
    deleteQuotation
);

// ======================================================
// GENERATE QUOTATION PDF
// GET /api/admin/quotations/:id/pdf
// ======================================================

router.get(
    "/:id/pdf",
    generateQuotationPDF
);


module.exports = router;