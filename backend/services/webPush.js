const crypto = require("crypto");
const webPush = require("web-push");
const pool = require("../config/db");

let configuredWith = "";

function getVapidConfig() {
    const publicKey = String(process.env.WEB_PUSH_VAPID_PUBLIC_KEY || "").trim();
    const privateKey = String(process.env.WEB_PUSH_VAPID_PRIVATE_KEY || "").trim();
    const subject = String(process.env.WEB_PUSH_SUBJECT || "mailto:harithrazinm@gmail.com").trim();
    return { publicKey, privateKey, subject };
}

function isWebPushConfigured() {
    const { publicKey, privateKey } = getVapidConfig();
    return Boolean(publicKey && privateKey);
}

function configureWebPush() {
    const { publicKey, privateKey, subject } = getVapidConfig();
    if (!publicKey || !privateKey) return false;

    const configKey = `${subject}:${publicKey}:${privateKey}`;
    if (configuredWith !== configKey) {
        webPush.setVapidDetails(subject, publicKey, privateKey);
        configuredWith = configKey;
    }
    return true;
}

function hashEndpoint(endpoint) {
    return crypto.createHash("sha256").update(endpoint).digest("hex");
}

async function sendSuperAdminQuotationPush({ title, body, link }) {
    try {
        if (!configureWebPush()) {
            console.warn("Web Push skipped: WEB_PUSH_VAPID_PUBLIC_KEY or WEB_PUSH_VAPID_PRIVATE_KEY is not configured.");
            return { sent: 0, total: 0, enabled: false };
        }
    } catch (error) {
        console.error("Web Push VAPID configuration is invalid:", error.message);
        return { sent: 0, total: 0, enabled: false };
    }

    try {
        const [subscriptions] = await pool.query(
            `SELECT ps.id, ps.endpoint, ps.p256dh, ps.auth
             FROM super_admin_webpush_subscriptions ps
             INNER JOIN users u
               ON CONVERT(u.id USING binary) = CONVERT(ps.user_id USING binary)
             WHERE u.role = 'super_admin' AND u.status = 'active'`
        );

        if (!subscriptions.length) return { sent: 0, total: 0, enabled: true };

        const payload = JSON.stringify({ title, body, url: link, tag: "quotation-review" });
        const results = await Promise.all(subscriptions.map(async row => {
            const subscription = {
                endpoint: row.endpoint,
                keys: { p256dh: row.p256dh, auth: row.auth }
            };

            try {
                await webPush.sendNotification(subscription, payload, { TTL: 60 * 60 });
                return true;
            } catch (error) {
                console.error("Super Admin Web Push delivery failed:", error.statusCode || "unknown status", error.message);
                if (error.statusCode === 404 || error.statusCode === 410) {
                    await pool.query(
                        "DELETE FROM super_admin_webpush_subscriptions WHERE id = ?",
                        [row.id]
                    ).catch(cleanupError => console.error("Unable to remove expired Web Push subscription:", cleanupError.message));
                }
                return false;
            }
        }));

        return { sent: results.filter(Boolean).length, total: subscriptions.length, enabled: true };
    } catch (error) {
        console.error("Super Admin Web Push error:", error.message);
        return { sent: 0, total: 0, enabled: true };
    }
}

module.exports = {
    getVapidConfig,
    hashEndpoint,
    isWebPushConfigured,
    sendSuperAdminQuotationPush
};
