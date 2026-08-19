const express = require("express");

const {
    login,
    me
} = require("../controllers/authController");

const authMiddleware =
    require("../middleware/authMiddleware");

const router = express.Router();


// POST /api/auth/login
router.post(
    "/login",
    login
);


// GET /api/auth/me
router.get(
    "/me",
    authMiddleware,
    me
);


module.exports = router;