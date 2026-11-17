const API_BASE = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? "http://localhost:5001/api" : "/api";
const TOKEN_KEY = "securepro_super_admin_token";

const button = document.querySelector("#enablePushNotifications");
const status = document.querySelector("#pushNotificationStatus");

function setStatus(message, isError = false) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("push-status-error", isError);
}

function isIOSDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isInstalledWebApp() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function decodeVapidKey(value) {
    const padding = "=".repeat((4 - value.length % 4) % 4);
    const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    return Uint8Array.from(raw, character => character.charCodeAt(0));
}

async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY) || ""}`,
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers
        }
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) throw new Error(result.message || "Unable to configure notifications.");
    return result;
}

if (button && status) {
    if (isIOSDevice() && !isInstalledWebApp()) {
        button.addEventListener("click", () => setStatus("On iPhone: tap Share → Add to Home Screen, then open SOPro from its Home Screen icon and try again."));
        setStatus("Install SOPro on your iPhone Home Screen before enabling notifications.");
    } else if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        button.disabled = true;
        setStatus("Web Push is not supported in this browser. Try Safari from the installed Home Screen app or Chrome on Android.", true);
    } else {
        button.addEventListener("click", async () => {
            button.disabled = true;
            setStatus("Enabling notifications…");
            try {
                if (!window.isSecureContext) throw new Error("Notifications require HTTPS. Open the live SecurePro site, not an insecure network address.");

                // On iOS this call must be initiated directly from a user tap in the installed web app.
                const permission = Notification.permission === "granted"
                    ? "granted"
                    : await Notification.requestPermission();
                if (permission !== "granted") throw new Error("Notification permission was not granted. Enable it in your device settings to continue.");

                const config = await apiRequest("/super-admin/push-config");
                await navigator.serviceWorker.register("/service-worker.js", { scope: "/" });
                const registration = await navigator.serviceWorker.ready;
                const applicationServerKey = decodeVapidKey(config.data.vapidPublicKey);
                let subscription = await registration.pushManager.getSubscription();
                const oldKey = subscription?.options?.applicationServerKey;
                const sameKey = oldKey && oldKey.byteLength === applicationServerKey.byteLength &&
                    applicationServerKey.every((byte, index) => byte === new Uint8Array(oldKey)[index]);
                if (subscription && !sameKey) {
                    await subscription.unsubscribe();
                    subscription = null;
                }
                subscription = subscription || await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey
                    });

                await apiRequest("/super-admin/push-subscriptions", {
                    method: "POST",
                    body: JSON.stringify({ subscription: subscription.toJSON() })
                });
                setStatus("This device is registered for quotation notifications.");
            } catch (error) {
                console.error("Unable to enable Web Push notifications:", error);
                setStatus(error.message || "Unable to enable notifications.", true);
            } finally {
                button.disabled = false;
            }
        });
    }
}
