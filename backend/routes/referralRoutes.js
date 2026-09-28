const express = require("express");
const router = express.Router();
const referralController = require("../controllers/referralController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, authMiddleware.requireAdmin, referralController.createReferralCode);
router.get("/", authMiddleware, authMiddleware.requireAdmin, referralController.getReferralCodes);
router.patch(
    "/usages/:id/status",
    authMiddleware,
    authMiddleware.requireAdmin,
    referralController.updateReferralUsageStatus
);
router.patch("/:id/status", authMiddleware, authMiddleware.requireAdmin, referralController.updateReferralStatus);
router.get("/usages", authMiddleware, authMiddleware.requireAdmin, referralController.getReferralUsages);
router.patch("/usages/:id/status", authMiddleware, authMiddleware.requireAdmin, referralController.updateReferralUsageStatus);
router.post("/validate", referralController.validateReferralCode);

module.exports = router;
