const net = require("net");
const pool = require("../config/db");
const { getVapidConfig, hashEndpoint, isWebPushConfigured } = require("../services/webPush");
const PUSH_PROVIDER_DOMAINS = [
    "push.apple.com",
    "fcm.googleapis.com",
    "push.services.mozilla.com",
    "push.services.mozilla.org",
    "notify.windows.com"
];

function validateSubscription(subscription) {
    if (!subscription || typeof subscription !== "object") return false;
    const endpoint = typeof subscription.endpoint === "string" ? subscription.endpoint.trim() : "";
    const p256dh = subscription.keys?.p256dh;
    const auth = subscription.keys?.auth;

    try {
        const url = new URL(endpoint);
        const hostname = url.hostname.toLowerCase();
        if (url.protocol !== "https:" || url.username || url.password) return false;
        if (!hostname.includes(".") || hostname === "localhost" || hostname.endsWith(".localhost")) return false;
        if (net.isIP(hostname)) return false;
        if (!PUSH_PROVIDER_DOMAINS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))) return false;
    } catch {
        return false;
    }

    return endpoint.length <= 4096 && typeof p256dh === "string" && p256dh.length <= 512 &&
        typeof auth === "string" && auth.length <= 512 && p256dh.length > 0 && auth.length > 0;
}

function getPushConfig(req, res) {
    const { publicKey } = getVapidConfig();
    if (!publicKey || !isWebPushConfigured()) {
        return res.status(503).json({ success: false, message: "Web Push is not configured on this server." });
    }
    return res.json({ success: true, data: { vapidPublicKey: publicKey } });
}

async function saveSubscription(req, res) {
    const subscription = req.body?.subscription;
    if (!validateSubscription(subscription)) {
        return res.status(400).json({ success: false, message: "A valid browser push subscription is required." });
    }

    const endpoint = subscription.endpoint.trim();
    try {
        await pool.query(
            `INSERT INTO super_admin_webpush_subscriptions
                (id, user_id, endpoint, endpoint_hash, p256dh, auth)
             VALUES (UUID(), ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                user_id = VALUES(user_id), endpoint = VALUES(endpoint),
                p256dh = VALUES(p256dh), auth = VALUES(auth), updated_at = CURRENT_TIMESTAMP`,
            [req.user.id, endpoint, hashEndpoint(endpoint), subscription.keys.p256dh, subscription.keys.auth]
        );
        return res.json({ success: true, message: "This device is registered for quotation notifications." });
    } catch (error) {
        console.error("Unable to save Super Admin Web Push subscription:", error.message);
        return res.status(500).json({ success: false, message: "Unable to save this device's notification subscription." });
    }
}

async function removeSubscription(req, res) {
    const endpoint = typeof req.body?.endpoint === "string" ? req.body.endpoint.trim() : "";
    if (!endpoint) {
        return res.status(400).json({ success: false, message: "The device push endpoint is required." });
    }

    try {
        await pool.query(
            "DELETE FROM super_admin_webpush_subscriptions WHERE user_id = ? AND endpoint_hash = ?",
            [req.user.id, hashEndpoint(endpoint)]
        );
        return res.json({ success: true, message: "This device was removed from quotation notifications." });
    } catch (error) {
        console.error("Unable to remove Super Admin Web Push subscription:", error.message);
        return res.status(500).json({ success: false, message: "Unable to remove this device's notification subscription." });
    }
}

module.exports = { getPushConfig, saveSubscription, removeSubscription };
