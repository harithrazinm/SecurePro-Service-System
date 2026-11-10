# Local media upload testing

This guide tests the local disk provider with a development/test database. It does not require Cloudinary or GB Network access. Do not point local tests at the production database.

## 1. Configure a local backend

In `backend/.env`, add or set:

```env
MEDIA_STORAGE_PROVIDER=local
STORAGE_ROOT=./securepro-storage
```

`STORAGE_ROOT` resolves relative to the backend process working directory. When started from `backend/` using the scripts below, files are written under `backend/securepro-storage/`. The server creates the root and category folders on the first upload. The directory is git-ignored and is not mounted by Express static routes. It also receives an Apache deny rule as defense in depth.

Keep your existing local DB/JWT settings in `.env`, but make sure the database is a disposable development/test database. Do not copy production credentials into local testing. Never commit `.env` or the generated media files.

Start the API from the repository root:

```sh
npm start --prefix backend
```

Start the existing SecurePro frontend with VS Code Live Server (normally `http://127.0.0.1:5500`) or use the app's configured local server. Sign in using a local test account.

## 2. Test through the SecurePro frontend

Use the real workflows so the app saves both the media storage key and the existing database metadata:

1. Submit a test service request with a JPG/PNG/WebP image from the customer request form. Confirm the success page displays the uploaded image, then open the admin **Service Requests** page and mark the request as test data by typing its request code.
2. Sign in as a technician, open an assigned test job, and submit progress/completion photos and a supported video (MP4, WebM, or MOV). Confirm the admin/job detail page can preview the media.
3. Sign in as admin and upload a quotation PDF and payment proof through the existing enquiry/quotation workflow. Upload an invoice PDF through the invoice workflow if enabled in your local data.
4. Restart the backend and reload the relevant pages. The same files should still open from `backend/securepro-storage/`.
5. Try an unsupported extension, mismatched content (for example a text file renamed `.jpg`), and an over-limit file. The API should return a readable upload error and should not leave a partial file behind.
6. When done, use **Delete test** from the admin requests list and type the exact request code. Test deletion is permanent and blocked if referral usage exists; unexpected foreign-key dependencies abort safely.

The database keeps media keys in the existing columns (`customer_photos.file_path`, `service_report_media.file_path`, `service_reports.report_file_path`, quotation/invoice file URL fields). Existing filename/MIME/size columns continue to be filled where the current schema and workflows have them. The admin test-marker feature adds `service_requests.is_test` using `database/test-request-marker-migration.sql`. Apply that additive migration to a local/test database before using the marker UI; existing requests default to `is_test = 0`.

## 3. Test with Postman

Set `baseUrl` to `http://localhost:5001` (or the port from your local `.env`). Postman can call the API directly; no `Origin` header is required.

### Get a staff token

Create a request:

```http
POST {{baseUrl}}/api/auth/login
Content-Type: application/json
```

Use the same JSON login fields as the SecurePro login page. Copy the returned JWT and configure Postman's Authorization tab as **Bearer Token** for admin/technician routes.

### Upload files

For each upload, use **Body → form-data**, set the file field's type to **File**, and use the field name expected by the existing workflow. Examples:

| Workflow | Request | Form-data file field | Access |
| --- | --- | --- | --- |
| Customer request photos | `POST {{baseUrl}}/api/requests` | `customer_photos` (multiple files allowed) | Public request form; include the normal required request fields |
| Technician report media | `POST {{baseUrl}}/api/technician/requests/{{requestId}}/report` | `completion_media` (multiple files allowed) | Technician Bearer token; request must be assigned to that technician |
| Quotation PDF | `POST {{baseUrl}}/api/quotations` | `quotation_file` | Admin Bearer token; include the normal quotation fields for the selected local request |
| Quotation payment proof | `POST {{baseUrl}}/api/quotations/{{quotationId}}/payment-proof` | `payment_proof` | Admin Bearer token |
| Invoice PDF | `POST {{baseUrl}}/api/invoices/request/{{requestId}}` | `invoice_file` | Admin Bearer token |
| Invoice payment proof | `POST {{baseUrl}}/api/invoices/{{invoiceId}}/payment-proof` | `payment_proof` | Admin Bearer token |

When testing request or quotation creation, include the ordinary form fields the frontend sends; the endpoints intentionally retain their existing validation and database workflow. Use a disposable local request and account.

Confirm an upload creates a UUID-named file below the configured storage root and that the corresponding existing database row contains a `local://...` storage key rather than a public filesystem URL. Do not manually insert production rows or point this test at production.

### Retrieve media and check video seeking

Use a staff-authenticated detail/list endpoint to obtain the short-lived `.../api/media/file?...` URL for a saved file. Open that exact URL in Postman. The media endpoint checks the signed user/role, verifies the storage key is still referenced by a database record, and checks technician assignment. Unsigned or expired URLs should be rejected; the storage directory itself must not be directly browseable.

For video playback, send this request header to the signed URL:

```http
Range: bytes=0-1023
```

Expect `206 Partial Content` and a `Content-Range` response header. A normal request without `Range` should return the whole file. Signed URLs are bearer credentials: do not paste them into tickets or share them publicly.

### Check deletion safely

On the admin **Service Requests** page, choose **Mark test** and type `PROCEED` in the confirmation prompt. The row will show a `TEST DATA` badge and a **Delete test** action. Deletion also requires `PROCEED`; it removes the test request, its linked quotation/invoice/payment/report rows, and any local media no longer referenced elsewhere. Referral-used requests are deliberately blocked to protect referral records. If another foreign-key relationship prevents deletion, the transaction rolls back and leaves the records intact. You can **Unmark test** if a request was marked by mistake. Do not mark real customer requests as test data.

## Troubleshooting

- **Storage unavailable:** confirm `STORAGE_ROOT` is writable by the Node process and the disk has space.
- **Unsupported type / signature mismatch:** use a real JPG, PNG, WebP, PDF, MP4, WebM, or MOV file; changing only the filename extension is rejected.
- **401/403 on retrieval:** use the URL returned by an authenticated SecurePro API response, ensure it has not expired, and use a technician account assigned to that job.
- **No preview after restart:** confirm the same `STORAGE_ROOT` is used on every start; relative paths resolve from the process working directory.
- **Video does not seek:** inspect the response for `206 Partial Content` and `Content-Range`; a proxy or browser extension may interfere even when Express supports ranges.
