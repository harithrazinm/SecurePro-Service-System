const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const pool = require("../config/db");

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
const FCM_ENDPOINT = "https://fcm.googleapis.com/v1/projects";

let cachedAccessToken = null;
let accessTokenExpiresAt = 0;

function readServiceAccount() {
    const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (inline) {
        return JSON.parse(inline);
    }

    if (credentialsPath) {
        const resolvedPath = path.resolve(credentialsPath);
        return JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
    }

    return null;
}

function base64Url(value) {
    return Buffer.from(value).toString("base64url");
}

async function getAccessToken(serviceAccount) {
    if (cachedAccessToken && Date.now() < accessTokenExpiresAt - 60_000) {
        return cachedAccessToken;
    }

    const issuedAt = Math.floor(Date.now() / 1000);
    const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const claims = base64Url(JSON.stringify({
        iss: serviceAccount.client_email,
        scope: FCM_SCOPE,
        aud: TOKEN_URL,
        iat: issuedAt,
        exp: issuedAt + 3600
    }));
    const unsignedJwt = `${header}.${claims}`;
    const signature = crypto.sign("RSA-SHA256", Buffer.from(unsignedJwt), serviceAccount.private_key)
        .toString("base64url");
    const assertion = `${unsignedJwt}.${signature}`;

    const response = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion
        })
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.access_token) {
        throw new Error(`Google OAuth token request failed (${response.status}).`);
    }

    cachedAccessToken = result.access_token;
    accessTokenExpiresAt = Date.now() + Number(result.expires_in || 3600) * 1000;
    return cachedAccessToken;
}

async function sendToToken({ token, title, body, link, serviceAccount, projectId }) {
    const accessToken = await getAccessToken(serviceAccount);
    const response = await fetch(`${FCM_ENDPOINT}/${encodeURIComponent(projectId)}/messages:send`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: {
                token,
                notification: { title, body },
                data: { url: link },
                webpush: {
                    fcmOptions: { link },
                    notification: {
                        icon: "/assets/favicon.png",
                        tag: "quotation-review"
                    }
                }
            }
        })
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        const error = new Error(`FCM send failed (${response.status}).`);
        error.status = response.status;
        error.details = result.error?.details || result.error?.message;
        throw error;
    }

    return result;
}

async function sendSuperAdminQuotationPush({ title, body, link }) {
    const projectId = String(process.env.FIREBASE_PROJECT_ID || "").trim();
    let serviceAccount;

    try {
        serviceAccount = readServiceAccount();
    } catch (error) {
        console.error("Firebase push credentials could not be read:", error.message);
        return { sent: 0, total: 0, enabled: false };
    }

    if (!projectId || !serviceAccount?.client_email || !serviceAccount?.private_key) {
        return { sent: 0, total: 0, enabled: false };
    }

    try {
        const [subscriptions] = await pool.query(
            `SELECT ps.id, ps.token
             FROM super_admin_push_subscriptions ps
             INNER JOIN users u
               ON CONVERT(u.id USING binary) = CONVERT(ps.user_id USING binary)
             WHERE u.role = 'super_admin' AND u.status = 'active'`
        );

        if (!subscriptions.length) {
            return { sent: 0, total: 0, enabled: true };
        }

        const results = await Promise.all(subscriptions.map(async subscription => {
            try {
                await sendToToken({
                    token: subscription.token,
                    title,
                    body,
                    link,
                    serviceAccount,
                    projectId
                });
                return true;
            } catch (error) {
                console.error("Super Admin push delivery failed:", error.message, error.details || "");
                if (error.details?.includes("UNREGISTERED")) {
                    await pool.query(
                        "DELETE FROM super_admin_push_subscriptions WHERE id = ?",
                        [subscription.id]
                    ).catch(cleanupError => console.error("Unable to remove stale push token:", cleanupError.message));
                }
                return false;
            }
        }));

        return {
            sent: results.filter(Boolean).length,
            total: subscriptions.length,
            enabled: true
        };
    } catch (error) {
        console.error("Super Admin push notification error:", error.message);
        return { sent: 0, total: 0, enabled: true };
    }
}

function hashPushToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = {
    hashPushToken,
    sendSuperAdminQuotationPush
};
