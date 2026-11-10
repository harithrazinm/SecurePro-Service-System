# Private local media storage (GB Network cPanel)

## Existing upload architecture

SecurePro uses Multer for four upload flows. The route modules previously used `multer-storage-cloudinary`; controllers persisted the returned Cloudinary URLs in existing MySQL columns:

- `customer_photos.file_path` — public customer request photos.
- `service_report_media.file_path` and `service_reports.report_file_path` — technician progress/final report media.
- `quotations.quotation_file_url` and `quotations.payment_proof_url` — quotations and quotation payment proofs.
- `invoices.invoice_file_url` and `invoice_payments.payment_proof_url` — invoices and invoice payment proofs.

Admin, technician, and super-admin JSON APIs return these values and their existing pages use them as image, video, or document URLs. Legacy Cloudinary HTTPS URLs remain untouched and continue to display directly. The repository also has older `/uploads/customer/...` and `/uploads/technician/...` references and 41 files under `backend/uploads`; those files are not overwritten or migrated by this change.

The application has JWT roles for admin, super-admin, and technician, but no customer login/session. The request-submission response now provides request-scoped, 24-hour signed links for only the new customer photos, displayed on the success page. It does not add a customer account or ongoing customer portal. Staff viewing remains protected by existing request/assignment API permissions; technician media links are additionally restricted to work assigned to that technician.

## New upload and retrieval behavior

- Multer stores new files under `STORAGE_ROOT/<category>/` with random UUID filenames. Client filenames never become filesystem paths.
- MySQL stores a relative storage reference such as `local://service-reports/<uuid>.jpg` in the existing media URL/path column. No absolute server path is returned or stored.
- Image, PDF, and supported video signatures are checked after upload, in addition to the existing extension/MIME allowlists and file-size limits.
- Authenticated API JSON responses convert local references into HMAC-signed links scoped to a role and user ID, expiring after 10 minutes. The retrieval endpoint checks that the file is still referenced by a SecurePro record and checks technician assignment before streaming it.
- The media endpoint uses `sendFile`, which supports byte ranges for video playback. Files are not exposed via Express static middleware. New storage roots receive an Apache `.htaccess` deny rule; `backend/uploads/.htaccess` protects legacy files if that folder is inside the document root.
- Replaced/deleted quotation media is removed only when its local reference is no longer present in any supported media column. Cloudinary and legacy `/uploads` files are never automatically deleted.
- Quotation and invoice email workflows attach local PDFs as file content. Optional signed links in those emails require `PUBLIC_APP_URL`.

No schema migration is required for new uploads: existing columns hold the `local://` reference. `database/local-media-migration-history.sql` is only for the separate, explicit migration of existing Cloudinary URLs; it preserves the original URL for rollback.

## Local development

For local development, use `MEDIA_STORAGE_PROVIDER=local` and `STORAGE_ROOT=./securepro-storage`. Relative paths resolve from the Node process working directory; when launched with `npm start --prefix backend` at the repository root, the default npm working directory is `backend/`, so uploads are written to `backend/securepro-storage/`. The server automatically creates the root and category folders. The storage directory is git-ignored and is not mounted by Express static routes. The app's `.env` must already have its normal development database and JWT settings. Do not commit `.env`.

For a complete Postman and actual-frontend walkthrough, see [LOCAL_MEDIA_TESTING.md](./LOCAL_MEDIA_TESTING.md).

## cPanel setup and deployment checklist

1. The checked-in `.cpanel.yml` currently deploys the frontend to `/home/sonicxco/public_html/sopro.my` and the Node app to `/home/sonicxco/securepro`. If those deployment paths are still current, create `/home/sonicxco/securepro-storage` in File Manager; it is a sibling of `public_html`, not inside it. Confirm the actual account Home Directory/path in cPanel before creating it.
2. Confirm the Node application user owns the directory and can create files/directories there. Start with directory mode `750`; the app creates files with restricted permissions. Do not make the directory world-writable.
3. In **Setup Node.js App**, set:

   ```env
   MEDIA_STORAGE_PROVIDER=local
   STORAGE_ROOT=<absolute path to the private directory>
   PUBLIC_APP_URL=https://your-production-domain
   ```

   `MEDIA_SIGNING_SECRET` is optional; if omitted, the app uses the existing `JWT_SECRET`.
4. Keep the actual path and credentials out of Git. Restart the Node.js application after changing environment variables.
5. Before deploying the test-marker version, back up the intended database and apply `database/test-request-marker-migration.sql`; the admin requests page uses the new `service_requests.is_test` column. Verify you selected the intended database. Then deploy the code after configuring the storage path. Cloudinary upload calls have been removed from the active upload routes, but the Cloudinary package/configuration is intentionally retained until the cPanel validation checklist passes.
6. From a staff test account, upload one small customer image, one technician image and video, one quotation PDF, one payment proof, and one invoice PDF. Confirm staff can view them, a technician cannot open a file from an unassigned job, direct unsigned URLs are rejected, and video seeking works.
7. Restart the Node application and confirm the same files still load. In cPanel, inspect available disk space and inode quota. Confirm the hosting plan does not delete files from the chosen directory during deploys/backups.
8. Test request limits through the live cPanel/Passenger path. Current app limits are 10 customer photos up to 20 MB each, 10 technician files up to 100 MB each, and one quotation/invoice/proof file up to 10 MB. Apache/Passenger/account-level request limits may be lower; this repository cannot verify those hosting settings.

The repository's Dockerfile targets Node.js 22; the existing Express 5 runtime requires Node.js 18 or newer. The actual version selected in cPanel, account quota, inode limit, upload proxy limit, and restart persistence cannot be verified from this repository. Confirm each in cPanel before production uploads. Sharp is not introduced, so image optimization does not depend on a native binary; FFmpeg is not required.

The admin test-marker UI requires the additive migration in `database/test-request-marker-migration.sql` before deploying this version; otherwise the admin request list will not find `service_requests.is_test`. Back up the database and verify the target database before applying it. It adds one boolean column defaulting to `0` and does not mark or delete existing requests. Mark/unmark and delete actions require typing `PROCEED`; deletion is available only for marked test requests. Do not run SQL from this repository against production without first confirming the selected database and backup.

## Existing Cloudinary files: dry run, apply, rollback

The migration script is never run by the app or during deployment. It only accepts HTTPS Cloudinary URLs, restricts redirects to Cloudinary hosts, caps each download at 100 MB, verifies file signatures, and updates each database reference only after the local copy has been written and verified. Original URLs are retained in `media_migration_history`; local files are kept on rollback.

1. Back up the production database and Cloudinary account first.
2. Apply `database/local-media-migration-history.sql` manually to the correct database. This is an additive table; the app does not apply it automatically.
3. Configure the same `STORAGE_ROOT` and database environment variables in the shell/session used to run the script. Use the cPanel Node application environment or an approved SSH workflow; do not place secrets in command history or a committed file.
4. From `backend/`, run a read-only inventory:

   ```sh
   node migrateCloudinaryMedia.js --dry-run
   ```

5. Review the inventory, backup, then explicitly opt in to migrating:

   ```sh
   node migrateCloudinaryMedia.js --apply
   ```

6. Validate affected records in the UI. If rollback is needed, run:

   ```sh
   node migrateCloudinaryMedia.js --rollback
   ```

Rollback restores the saved Cloudinary URLs and intentionally retains local files. Cloudinary originals are never deleted by this script.

## Removal of Cloudinary packages/config

Do not uninstall `cloudinary` or `multer-storage-cloudinary`, remove `backend/config/cloudinary.js`, or clear Cloudinary environment variables until new uploads, private access, email attachments, video ranges, and restart persistence have all been tested on the actual cPanel app and any desired legacy migration has been verified. Keeping these unused dependencies/config values temporarily is the rollback window; the new request/technician/quotation/invoice routes do not use them for uploads.
