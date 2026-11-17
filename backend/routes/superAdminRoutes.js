const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
    getDashboard,
    getProjects,
    getProjectById,
    getDashboardCategoryFiles
} = require("../controllers/superAdminController");
const {
    saveSubscription,
    removeSubscription
} = require("../controllers/superAdminPushController");

const router = express.Router();

router.use(authMiddleware, authMiddleware.requireSuperAdmin);

// READ-ONLY monitoring endpoints.
router.get("/dashboard", getDashboard);
router.get("/projects", getProjects);
router.get("/projects/:id", getProjectById);
router.get("/dashboard/files", getDashboardCategoryFiles);

// A Super Admin can register or remove only their own authenticated browser token.
router.post("/push-subscriptions", saveSubscription);
router.delete("/push-subscriptions", removeSubscription);

module.exports = router;
