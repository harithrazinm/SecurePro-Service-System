# Super Admin browser push setup

Browser push supplements the existing quotation-review email. Each Super Admin must sign in to the dashboard, click **Enable alerts**, and allow browser notifications on each browser/device they want to register.

## Database

Apply `backend/database/migrations/20261117_create_super_admin_push_subscriptions.sql` once to the SecurePro MySQL database. It adds a separate table for authenticated Super Admin browser tokens; it does not modify existing request or user records.

## Local backend

1. In Firebase Project settings, make sure Cloud Messaging API (V1) is enabled and the Web Push certificate/VAPID key is generated.
2. Create a Firebase service account with permission to send Firebase Cloud Messaging messages. Download its JSON key and store it outside the project/repository, for example `/Users/you/private/secureonepro-fcm-service-account.json`.
3. In `backend/.env`, set:

   ```env
   FIREBASE_PROJECT_ID=onepro-e4bda
   GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/secureonepro-fcm-service-account.json
   ```

4. Start the backend and open the Super Admin dashboard over `http://localhost` (not `file://`). Click **Enable alerts** and allow notifications.
5. Upload or revise a quotation as Admin. With the backend configured, the signed-in Super Admin browser should receive a push notification. Email remains a fallback.

## cPanel production

Upload the service-account JSON to a private directory outside `public_html` and outside the Git repository, such as `/home/ACCOUNT/private/secureonepro-fcm-service-account.json`. Restrict its file permissions and set `FIREBASE_PROJECT_ID` and `GOOGLE_APPLICATION_CREDENTIALS` in the existing cPanel Node.js application's environment variables. Never put the JSON key in File Manager's public website directory, Git, a frontend file, or chat. Restart the Node.js app after setting the environment variables.

Run the migration against the production database through the normal approved database-change process before enabling the feature. Then deploy/restart the backend and have each Super Admin enable notifications from their own browser. The service worker must be reachable at `https://sopro.my/firebase-messaging-sw.js`.

## Notes

- The Firebase web config and VAPID public key are client-side values. The service-account private key is the secret and must remain server-side.
- Browser/device permission is required; notifications can be blocked by OS/browser settings or power-saving policies. Email remains the reliable fallback.
- Push delivery is to browser tokens explicitly registered by authenticated, active Super Admin accounts only.
