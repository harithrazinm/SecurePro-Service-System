const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
    getDashboard,
    getProjects,
    getProjectById,
    getDashboardCategoryFiles
} = require("../controllers/superAdminController");

const router = express.Router();

router.use(authMiddleware, authMiddleware.requireSuperAdmin);

// READ-ONLY monitoring endpoints.
router.get("/dashboard", getDashboard);
router.get("/projects", getProjects);
router.get("/projects/:id", getProjectById);
router.get("/dashboard/files", getDashboardCategoryFiles);

module.exports = router;
