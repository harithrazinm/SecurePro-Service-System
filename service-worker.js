/* Standard Web Push worker. This must be served from the site origin root. */
self.addEventListener("push", event => {
    let payload = {};
    try {
        payload = event.data ? event.data.json() : {};
    } catch {
        payload = { body: event.data?.text() || "A quotation is waiting for your review." };
    }

    const title = payload.title || "SOPro quotation needs review";
    const options = {
        body: payload.body || "A quotation is waiting for your review.",
        icon: "/assets/apple-touch-icon.png",
        badge: "/assets/favicon.png",
        tag: payload.tag || "quotation-review",
        data: { url: payload.url || "/super-admin/quotation-approval.html" }
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", event => {
    event.notification.close();
    const target = new URL(event.notification.data?.url || "/super-admin/quotation-approval.html", self.location.origin).href;

    event.waitUntil((async () => {
        const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        for (const client of windows) {
            if (client.url === target && "focus" in client) return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow(target);
        return undefined;
    })());
});
