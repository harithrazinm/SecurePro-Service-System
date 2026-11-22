import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getMessaging, getToken, isSupported, onMessage } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging.js";

const API_BASE = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? "http://localhost:5001/api" : "/api";
const TOKEN_KEY = "securepro_admin_token";
const VAPID_KEY = "BAMOpFEtaN2CXgWis42xJayn2wU3LJFXuDyp5HIZ9NT7AOlPwCuhHK3uEnjz2_cv2CjwXzI-MHwN2ZObwhcqZwk";
const firebaseConfig = {
    apiKey: "AIzaSyCleXo6CQ5IP9tg0V8VgfLmH_-VRgb7wlA",
    authDomain: "onepro-e4bda.firebaseapp.com",
    projectId: "onepro-e4bda",
    storageBucket: "onepro-e4bda.firebasestorage.app",
    messagingSenderId: "403456072690",
    appId: "1:403456072690:web:84790ed1ee00fe6a72296b",
    measurementId: "G-775G1WFB0T"
};

const button = document.querySelector("#enablePushNotifications");
const status = document.querySelector("#pushNotificationStatus");

function setStatus(message, isError = false) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("push-status-error", isError);
}

async function registerToken(token) {
    const response = await fetch(`${API_BASE}/admin/push-subscriptions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY) || ""}`
        },
        body: JSON.stringify({ token })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) throw new Error(result.message || "Could not register this browser.");
}

if (button && status) {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        button.disabled = true;
        setStatus("Push notifications are not supported by this browser.", true);
    } else {
        button.addEventListener("click", async () => {
            button.disabled = true;
            setStatus("Enabling notifications…");
            try {
                if (!await isSupported()) throw new Error("This browser does not support Firebase web push.");
                const permission = await Notification.requestPermission();
                if (permission !== "granted") throw new Error("Notification permission was not granted. Enable it in browser settings to continue.");

                const app = initializeApp(firebaseConfig);
                const messaging = getMessaging(app);
                await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
                const serviceWorker = await navigator.serviceWorker.ready;
                const fcmToken = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: serviceWorker });
                if (!fcmToken) throw new Error("Firebase did not return a browser token. Please try again.");
                await registerToken(fcmToken);
                setStatus("Notifications are enabled for this browser. New customer orders will appear here.");

                onMessage(messaging, payload => {
                    const title = payload.notification?.title || "New customer order";
                    const body = payload.notification?.body || "A customer submitted a new service request.";
                    new Notification(title, { body, icon: "/assets/favicon.png" });
                });
            } catch (error) {
                console.error("Unable to enable Admin push notifications:", error);
                setStatus(error.message || "Unable to enable notifications.", true);
            } finally {
                button.disabled = false;
            }
        });
    }
}
