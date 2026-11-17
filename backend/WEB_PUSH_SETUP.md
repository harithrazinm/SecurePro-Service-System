# Super Admin Web Push setup

Quotation-review alerts use standard Web Push and keep email as fallback. This supports iPhone Home Screen web apps on iOS/iPadOS 16.4 or later. On iPhone, the Super Admin must add SOPro to the Home Screen, open it from that icon, then tap **Receive notifications** to grant permission. Apple requires the permission request to follow a direct tap in the installed web app.

## Local development

1. Apply `backend/database/migrations/20261117_create_super_admin_webpush_subscriptions.sql` to the local SecurePro database only. The earlier `super_admin_push_subscriptions` table can remain; this version uses a new table for standard browser subscriptions.
2. From the `backend` directory, generate a VAPID key pair:

   ```sh
   npx web-push generate-vapid-keys --json
   ```

3. Put the generated values in `backend/.env` (keep the private key out of Git):

   ```env
   WEB_PUSH_VAPID_PUBLIC_KEY=<publicKey from command output>
   WEB_PUSH_VAPID_PRIVATE_KEY=<privateKey from command output>
   WEB_PUSH_SUBJECT=mailto:harithrazinm@gmail.com
   ```

4. Restart Node. Open the desktop development site on `localhost` to test browser push. An iPhone cannot use the computer's `localhost`; test iPhone push on the deployed HTTPS site or another HTTPS address reachable by the phone.

## iPhone setup and test

1. Open `https://sopro.my` in Safari on an iPhone running iOS/iPadOS 16.4 or newer.
2. Use **Share → Add to Home Screen**, then launch SOPro using the new Home Screen icon. The manifest sets standalone display mode, which is required for iOS Home Screen web push.
3. Sign in as Super Admin, tap **Receive notifications**, and allow the notification prompt.
4. From an Admin session, create or revise a quotation and confirm the Home Screen app receives the alert. Email remains the fallback.

## cPanel environment

Set these on the existing Node.js application and restart it:

```env
WEB_PUSH_VAPID_PUBLIC_KEY=<same public key paired with the private key>
WEB_PUSH_VAPID_PRIVATE_KEY=<private VAPID key; store only as a server environment secret>
WEB_PUSH_SUBJECT=mailto:harithrazinm@gmail.com
```

Run the new SQL migration on the production database using the normal approved database-change process before rollout. The private VAPID key must never be committed, placed under `public_html`, embedded in HTML/JavaScript, or posted in chat. The public key is returned to authenticated Super Admin pages by the API. A Firebase service-account JSON file is not used by this standard Web Push implementation.

## Notes

- The manifest and `service-worker.js` are served at the website origin root and must be available over HTTPS in production.
- Each device/browser must opt in separately. If a push endpoint expires, the backend removes that subscription after the provider reports it expired.
- Keep the older Firebase subscriptions table intact unless it is separately reviewed for cleanup; this change does not delete existing records.
