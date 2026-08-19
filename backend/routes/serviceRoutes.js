const express = require("express");

const SERVICES = require("../data/services");

const router = express.Router();

// ======================================================
// GET ALL SERVICES
// GET /api/services
// ======================================================

router.get("/", (req, res) => {
    try {
        const services = Object.values(SERVICES).map((service) => ({
            id: service.id,
            name: service.name,
            questionCount: service.questions
                ? service.questions.length
                : 0
        }));

        res.json({
            success: true,
            data: services
        });

    } catch (error) {

        console.error("Get services error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load services."
        });
    }
});

// ======================================================
// GET SINGLE SERVICE
// GET /api/services/:id
// ======================================================

router.get("/:id", (req, res) => {

    try {

        const serviceId = req.params.id;

        const service = SERVICES[serviceId];

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found."
            });
        }

        res.json({
            success: true,
            data: service
        });

    } catch (error) {

        console.error("Get service error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load service."
        });
    }
});

module.exports = router;