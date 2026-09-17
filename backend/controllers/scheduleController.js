const crypto = require("crypto");
const pool = require("../config/db");

function uuid() {
    return crypto.randomUUID();
}

/*
 * ==========================================================
 * GET WORK CALENDAR
 *
 * GET /api/schedules
 *
 * Query:
 *   from=YYYY-MM-DD
 *   to=YYYY-MM-DD
 *   technician_id=<uuid>   optional
 *   status=<status>        optional
 *
 * Used by Admin and Super Admin.
 * ==========================================================
 */
async function getSchedules(req, res) {
    try {
        const { from, to, technician_id, status } = req.query;

        const conditions = [
            "sr.technician_id IS NOT NULL",
            "sr.scheduled_date IS NOT NULL",
            "sr.status <> 'cancelled'"
        ];

        const params = [];

        if (from) {
            conditions.push("sr.scheduled_date >= ?");
            params.push(from);
        }

        if (to) {
            conditions.push("sr.scheduled_date <= ?");
            params.push(to);
        }

        if (technician_id) {
            conditions.push("sr.technician_id = ?");
            params.push(technician_id);
        }

        if (status) {
            conditions.push("sr.status = ?");
            params.push(status);
        }

        const [rows] = await pool.query(
            `
            SELECT
                sr.id,
                sr.request_code,
                sr.customer_name,
                sr.customer_phone,
                sr.customer_address,
                sr.status,
                sr.technician_id,
                sr.scheduled_date,
                sr.scheduled_time,
                sr.admin_notes,
                sr.assigned_at,
                sr.created_at,
                sr.updated_at,

                u.name AS technician_name,
                u.email AS technician_email,

                s.name_en AS service_name_en,
                s.name_ms AS service_name_ms

            FROM service_requests sr

            LEFT JOIN users u
                ON u.id = sr.technician_id

            LEFT JOIN services s
                ON s.id = sr.service_id

            WHERE ${conditions.join(" AND ")}

            ORDER BY
                sr.scheduled_date ASC,
                sr.scheduled_time ASC,
                u.name ASC
            `,
            params
        );

        return res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Get schedules error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve work schedules."
        });
    }
}

/*
 * ==========================================================
 * GET TECHNICIAN WORKLOAD
 *
 * GET /api/schedules/workload?date=YYYY-MM-DD
 * ==========================================================
 */
async function getTechnicianWorkload(req, res) {
    try {
        const date = req.query.date;

        if (!date) {
            return res.status(400).json({
                success: false,
                message: "Date is required."
            });
        }

        const [rows] = await pool.query(
            `
            SELECT
                u.id,
                u.name,
                u.email,
                COUNT(sr.id) AS total_jobs,

                SUM(
                    sr.status = 'assigned'
                ) AS assigned_jobs,

                SUM(
                    sr.status = 'in_progress'
                ) AS in_progress_jobs,

                SUM(
                    sr.status = 'waiting_parts'
                ) AS waiting_parts_jobs

            FROM users u

            LEFT JOIN service_requests sr
                ON sr.technician_id = u.id
                AND sr.scheduled_date = ?
                AND sr.status <> 'cancelled'

            WHERE
                u.role = 'technician'
                AND u.status = 'active'

            GROUP BY
                u.id,
                u.name,
                u.email

            ORDER BY
                total_jobs DESC,
                u.name ASC
            `,
            [date]
        );

        return res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Get technician workload error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve technician workload."
        });
    }
}

/*
 * ==========================================================
 * RESCHEDULE WORK
 *
 * PUT /api/schedules/:id
 *
 * Body:
 * {
 *   technician_id,
 *   scheduled_date,
 *   scheduled_time,
 *   reason
 * }
 *
 * Admin only.
 * ==========================================================
 */
async function rescheduleWork(req, res) {
    const connection = await pool.getConnection();
    let transactionStarted = false;

    try {
        const requestId = req.params.id;

        const technicianId =
            req.body.technician_id !== undefined
                ? (req.body.technician_id || null)
                : undefined;

        const scheduledDate =
            req.body.scheduled_date !== undefined
                ? (req.body.scheduled_date || null)
                : undefined;

        const scheduledTime =
            req.body.scheduled_time !== undefined
                ? (req.body.scheduled_time || null)
                : undefined;

        const reason =
            String(req.body.reason || "").trim();

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: "A reason is required when rescheduling."
            });
        }

        if (reason.length > 1000) {
            return res.status(400).json({
                success: false,
                message: "Reschedule reason must not exceed 1000 characters."
            });
        }

        const [requests] = await connection.query(
            `
            SELECT
                id,
                request_code,
                status,
                technician_id,
                scheduled_date,
                scheduled_time
            FROM service_requests
            WHERE id = ?
            LIMIT 1
            `,
            [requestId]
        );

        if (!requests.length) {
            return res.status(404).json({
                success: false,
                message: "Service request not found."
            });
        }

        const current = requests[0];

        if (["completed", "cancelled"].includes(current.status)) {
            return res.status(400).json({
                success: false,
                message: "Completed or cancelled jobs cannot be rescheduled."
            });
        }

        const newTechnician =
            technicianId !== undefined
                ? technicianId
                : current.technician_id;

        const newDate =
            scheduledDate !== undefined
                ? scheduledDate
                : current.scheduled_date;

        const newTime =
            scheduledTime !== undefined
                ? scheduledTime
                : current.scheduled_time;

        if (newTechnician && !newDate) {
            return res.status(400).json({
                success: false,
                message: "Scheduled date is required when a technician is assigned."
            });
        }

        if (newTechnician) {
            const [technicians] = await connection.query(
                `
                SELECT id
                FROM users
                WHERE id = ?
                  AND role = 'technician'
                  AND status = 'active'
                LIMIT 1
                `,
                [newTechnician]
            );

            if (!technicians.length) {
                return res.status(400).json({
                    success: false,
                    message: "Selected technician is invalid or inactive."
                });
            }
        }

        /*
         * Conflict check:
         * Two jobs for the same technician on the same date and exact
         * time are blocked. If either time is not specified, the system
         * treats it as a date-level scheduling conflict.
         */
        if (newTechnician && newDate) {
            const conflictParams = [
                newTechnician,
                newDate,
                requestId
            ];

            let conflictSql = `
                SELECT
                    id,
                    request_code,
                    scheduled_date,
                    scheduled_time
                FROM service_requests
                WHERE technician_id = ?
                  AND scheduled_date = ?
                  AND id <> ?
                  AND status NOT IN ('completed', 'cancelled')
            `;

            if (newTime) {
                conflictSql += `
                    AND (
                        scheduled_time = ?
                        OR scheduled_time IS NULL
                    )
                `;
                conflictParams.splice(2, 0, newTime);
            } else {
                conflictSql += `
                    AND scheduled_time IS NULL
                `;
            }

            conflictSql += " LIMIT 1";

            const [conflicts] = await connection.query(
                conflictSql,
                conflictParams
            );

            if (conflicts.length) {
                return res.status(409).json({
                    success: false,
                    message:
                        `Technician already has a scheduled job on ${newDate}` +
                        (newTime ? ` at ${newTime}.` : "."),
                    conflict: conflicts[0]
                });
            }
        }

        const changed =
            String(current.technician_id || "") !== String(newTechnician || "") ||
            String(current.scheduled_date || "") !== String(newDate || "") ||
            String(current.scheduled_time || "") !== String(newTime || "");

        if (!changed) {
            return res.status(400).json({
                success: false,
                message: "No schedule changes were made."
            });
        }

        await connection.beginTransaction();
        transactionStarted = true;

        await connection.query(
            `
            INSERT INTO schedule_history (
                id,
                request_id,
                old_technician_id,
                old_scheduled_date,
                old_scheduled_time,
                new_technician_id,
                new_scheduled_date,
                new_scheduled_time,
                change_reason,
                changed_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                uuid(),
                requestId,
                current.technician_id || null,
                current.scheduled_date || null,
                current.scheduled_time || null,
                newTechnician || null,
                newDate || null,
                newTime || null,
                reason,
                req.user.id
            ]
        );

        await connection.query(
            `
            UPDATE service_requests
            SET
                technician_id = ?,
                scheduled_date = ?,
                scheduled_time = ?,
                updated_at = NOW()
            WHERE id = ?
            `,
            [
                newTechnician,
                newDate,
                newTime,
                requestId
            ]
        );

        await connection.commit();
        transactionStarted = false;

        const [updated] = await connection.query(
            `
            SELECT
                sr.*,
                u.name AS technician_name,
                u.email AS technician_email,
                s.name_en AS service_name_en,
                s.name_ms AS service_name_ms
            FROM service_requests sr
            LEFT JOIN users u
                ON u.id = sr.technician_id
            LEFT JOIN services s
                ON s.id = sr.service_id
            WHERE sr.id = ?
            LIMIT 1
            `,
            [requestId]
        );

        return res.json({
            success: true,
            message: "Work schedule updated successfully.",
            data: updated[0]
        });
    } catch (error) {
        if (transactionStarted) {
            await connection.rollback();
        }

        console.error("Reschedule work error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to reschedule the work."
        });
    } finally {
        connection.release();
    }
}

/*
 * ==========================================================
 * GET SCHEDULE HISTORY
 *
 * GET /api/schedules/:id/history
 * ==========================================================
 */
async function getScheduleHistory(req, res) {
    try {
        const [rows] = await pool.query(
            `
            SELECT
                sh.*,

                oldTech.name AS old_technician_name,
                newTech.name AS new_technician_name,
                changer.name AS changed_by_name

            FROM schedule_history sh

            LEFT JOIN users oldTech
                ON oldTech.id = sh.old_technician_id

            LEFT JOIN users newTech
                ON newTech.id = sh.new_technician_id

            LEFT JOIN users changer
                ON changer.id = sh.changed_by

            WHERE sh.request_id = ?

            ORDER BY sh.changed_at DESC
            `,
            [req.params.id]
        );

        return res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Get schedule history error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve schedule history."
        });
    }
}

module.exports = {
    getSchedules,
    getTechnicianWorkload,
    rescheduleWork,
    getScheduleHistory
};
