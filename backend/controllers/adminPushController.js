const pool = require("../config/db");
const { hashPushToken } = require("../services/firebasePush");

async function saveSubscription(req, res) {
    const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
    if (token.length < 30 || token.length > 8192) {
        return res.status(400).json({ success: false, message: "A valid browser notification token is required." });
    }

    try {
        await pool.query(
            `INSERT INTO admin_push_subscriptions (id, user_id, token, token_hash)
             VALUES (UUID(), ?, ?, ?)
             ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), token = VALUES(token), updated_at = CURRENT_TIMESTAMP`,
            [req.user.id, token, hashPushToken(token)]
        );
        return res.json({ success: true, message: "This browser is registered for Admin push notifications." });
    } catch (error) {
        console.error("Unable to save Admin push subscription:", error.message);
        return res.status(500).json({ success: false, message: "Unable to save this browser's notification subscription." });
    }
}

async function removeSubscription(req, res) {
    const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
    if (!token) return res.status(400).json({ success: false, message: "The browser notification token is required." });

    try {
        await pool.query(
            "DELETE FROM admin_push_subscriptions WHERE user_id = ? AND token_hash = ?",
            [req.user.id, hashPushToken(token)]
        );
        return res.json({ success: true, message: "This browser was removed from push notifications." });
    } catch (error) {
        console.error("Unable to remove Admin push subscription:", error.message);
        return res.status(500).json({ success: false, message: "Unable to remove this browser's notification subscription." });
    }
}

module.exports = { saveSubscription, removeSubscription };
