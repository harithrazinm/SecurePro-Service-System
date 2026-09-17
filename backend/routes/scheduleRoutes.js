const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../middleware/authMiddleware");

const {
    getSchedules,
    getTechnicianWorkload,
    rescheduleWork,
    getScheduleHistory
} =
    require("../controllers/scheduleController");

/*
 * All schedule endpoints require login.
 */
router.use(authMiddleware);

/*
 * Only Admin and Super Admin may access the calendar API.
 */
router.use((req, res, next) => {
    const role = req.user?.role;

    if (role !== "admin" && role !== "super_admin") {
        return res.status(403).json({
            success: false,
            message: "Admin or Super Admin access required."
        });
    }

    next();
});

/*
 * Calendar data
 */
router.get(
    "/",
    getSchedules
);

/*
 * Technician workload for a selected date.
 */
router.get(
    "/workload",
    getTechnicianWorkload
);

/*
 * Schedule history.
 */
router.get(
    "/:id/history",
    getScheduleHistory
);

/*
 * Admin rescheduling endpoint.
 *
 * The route itself permits Super Admin technically, but the
 * frontend will only expose rescheduling to Admin. To make the
 * permission strict, reject Super Admin here.
 */
router.put(
    "/:id",
    (req, res, next) => {
        if (req.user?.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only Admin can reschedule work."
            });
        }

        next();
    },
    rescheduleWork
);

module.exports = router;
