require("dotenv").config();

const pool = require("./config/db");
const {
    signatureMime,
    storeMigratedBuffer,
    deleteLocalMediaFile
} = require("./services/mediaStorage");

const MAX_FILE_BYTES = 100 * 1024 * 1024;
const SOURCE_FIELDS = [
    { table: "customer_photos", column: "file_path", category: "customers" },
    { table: "service_report_media", column: "file_path", category: "service-reports", typeColumn: "media_type" },
    { table: "technician_photos", column: "file_path", category: "service-reports" },
    { table: "service_reports", column: "report_file_path", category: "service-reports" },
    { table: "quotations", column: "quotation_file_url", category: "quotations" },
    { table: "quotations", column: "payment_proof_url", category: "payment-proofs" },
    { table: "invoices", column: "invoice_file_url", category: "invoices" },
    { table: "invoice_payments", column: "payment_proof_url", category: "payment-proofs" }
];

function parseMode() {
    const modes = ["--dry-run", "--apply", "--rollback"].filter(flag => process.argv.includes(flag));
    if (modes.length > 1) {
        throw new Error("Choose only one mode: --dry-run, --apply, or --rollback.");
    }
    return modes[0] || "--dry-run";
}

function assertCloudinaryUrl(value) {
    let url;
    try {
        url = new URL(value);
    } catch {
        throw new Error("Stored Cloudinary URL is invalid.");
    }

    if (
        url.protocol !== "https:" ||
        !(url.hostname === "res.cloudinary.com" || url.hostname.endsWith(".cloudinary.com")) ||
        url.username || url.password
    ) {
        throw new Error("Only HTTPS Cloudinary media URLs are allowed by this migration tool.");
    }

    return url;
}

async function downloadCloudinaryFile(value) {
    let url = assertCloudinaryUrl(value);

    for (let redirectCount = 0; redirectCount <= 4; redirectCount += 1) {
        const response = await fetch(url, {
            redirect: "manual",
            signal: AbortSignal.timeout(45_000)
        });

        if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get("location");
            if (!location || redirectCount === 4) {
                throw new Error("Cloudinary media redirect limit was reached.");
            }
            url = assertCloudinaryUrl(new URL(location, url).toString());
            continue;
        }

        if (!response.ok) {
            throw new Error(`Cloudinary download failed with HTTP ${response.status}.`);
        }

        const contentLength = Number(response.headers.get("content-length") || 0);
        if (contentLength > MAX_FILE_BYTES) {
            throw new Error("Cloudinary file exceeds the migration limit of 100 MB.");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("Cloudinary response did not contain a readable file stream.");
        const chunks = [];
        let totalBytes = 0;
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            totalBytes += value.byteLength;
            if (totalBytes > MAX_FILE_BYTES) {
                await reader.cancel();
                throw new Error("Downloaded file exceeds the 100 MB migration limit.");
            }
            chunks.push(Buffer.from(value));
        }

        const buffer = Buffer.concat(chunks, totalBytes);
        if (!buffer.length) throw new Error("Downloaded file is empty.");

        const mimeType = signatureMime(buffer.subarray(0, 32));
        if (!mimeType) throw new Error("Downloaded file signature is not an allowed media format.");
        return { buffer, mimeType };
    }

    throw new Error("Unable to download Cloudinary media.");
}

async function getSourceRows(connection, source) {
    const typeSelection = source.typeColumn ? `, ${source.typeColumn} AS media_type` : "";
    const [rows] = await connection.query(
        `SELECT id, ${source.column} AS cloudinary_url${typeSelection}
         FROM ${source.table}
         WHERE ${source.column} LIKE '%cloudinary.com/%'`
    );
    return rows;
}

async function hasMigrationHistory(connection, source, rowId) {
    const [rows] = await connection.query(
        `SELECT id FROM media_migration_history
         WHERE source_table = ? AND source_column = ? AND source_id = ?
         LIMIT 1`,
        [source.table, source.column, String(rowId)]
    );
    return rows.length > 0;
}

async function ensureHistoryTable(connection) {
    await connection.query("SELECT id FROM media_migration_history LIMIT 0");
}

async function runDryRun(connection) {
    let total = 0;
    let historyAvailable = true;
    try {
        await ensureHistoryTable(connection);
    } catch {
        historyAvailable = false;
        console.warn("Migration history table is not installed; dry run will count every Cloudinary record.");
    }

    for (const source of SOURCE_FIELDS) {
        try {
            const rows = await getSourceRows(connection, source);
            const pending = [];
            for (const row of rows) {
                if (!historyAvailable || !await hasMigrationHistory(connection, source, row.id)) pending.push(row);
            }
            total += pending.length;
            console.log(`${source.table}.${source.column}: ${pending.length} Cloudinary record(s) to review`);
        } catch (error) {
            console.warn(`${source.table}.${source.column}: unable to inspect (${error.message})`);
        }
    }
    console.log(`Dry run complete. ${total} record(s) identified; no files or database rows were changed.`);
}

async function applyMigration(connection) {
    await ensureHistoryTable(connection);

    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    for (const source of SOURCE_FIELDS) {
        let rows;
        try {
            rows = await getSourceRows(connection, source);
        } catch (error) {
            console.error(`${source.table}.${source.column}: unable to inspect (${error.message})`);
            failed += 1;
            continue;
        }

        for (const row of rows) {
            if (await hasMigrationHistory(connection, source, row.id)) {
                skipped += 1;
                continue;
            }

            let stored;
            try {
                const { buffer, mimeType } = await downloadCloudinaryFile(row.cloudinary_url);
                const category = row.media_type === "video" ? "videos" : source.category;
                stored = await storeMigratedBuffer(buffer, category, mimeType);

                await connection.beginTransaction();
                const [updated] = await connection.query(
                    `UPDATE ${source.table}
                     SET ${source.column} = ?
                     WHERE id = ? AND ${source.column} = ?`,
                    [stored.reference, row.id, row.cloudinary_url]
                );

                if (updated.affectedRows !== 1) {
                    await connection.rollback();
                    await deleteLocalMediaFile(stored.reference);
                    skipped += 1;
                    console.warn(`${source.table}.${source.column} ${row.id}: changed during migration; skipped.`);
                    continue;
                }

                await connection.query(
                    `INSERT INTO media_migration_history
                     (source_table, source_column, source_id, cloudinary_url, local_reference)
                     VALUES (?, ?, ?, ?, ?)`,
                    [source.table, source.column, String(row.id), row.cloudinary_url, stored.reference]
                );
                await connection.commit();
                migrated += 1;
                console.log(`${source.table}.${source.column} ${row.id}: migrated (${stored.size} bytes).`);
            } catch (error) {
                await connection.rollback().catch(() => {});
                if (stored) await deleteLocalMediaFile(stored.reference).catch(() => {});
                failed += 1;
                console.error(`${source.table}.${source.column} ${row.id}: ${error.message}`);
            }
        }
    }

    console.log(`Migration finished: ${migrated} migrated, ${skipped} skipped, ${failed} failed. Cloudinary originals were not deleted.`);
}

async function rollbackMigration(connection) {
    await ensureHistoryTable(connection);
    const [history] = await connection.query(
        `SELECT id, source_table, source_column, source_id, cloudinary_url, local_reference
         FROM media_migration_history
         WHERE rolled_back_at IS NULL
         ORDER BY id DESC`
    );

    let restored = 0;
    let skipped = 0;
    for (const entry of history) {
        const source = SOURCE_FIELDS.find(item =>
            item.table === entry.source_table && item.column === entry.source_column
        );
        if (!source) {
            skipped += 1;
            console.warn(`History ${entry.id}: source is not in the allowlist; skipped.`);
            continue;
        }

        await connection.beginTransaction();
        const [updated] = await connection.query(
            `UPDATE ${source.table}
             SET ${source.column} = ?
             WHERE id = ? AND ${source.column} = ?`,
            [entry.cloudinary_url, entry.source_id, entry.local_reference]
        );

        if (updated.affectedRows !== 1) {
            await connection.rollback();
            skipped += 1;
            console.warn(`History ${entry.id}: database reference changed; skipped.`);
            continue;
        }

        await connection.query(
            "UPDATE media_migration_history SET rolled_back_at = NOW() WHERE id = ?",
            [entry.id]
        );
        await connection.commit();
        restored += 1;
        console.log(`History ${entry.id}: restored Cloudinary URL. Local file retained for safety.`);
    }

    console.log(`Rollback finished: ${restored} restored, ${skipped} skipped. No files were deleted.`);
}

async function main() {
    const mode = parseMode();
    let connection;
    try {
        connection = await pool.getConnection();
        if (mode === "--apply") {
            console.log("WARNING: this explicitly updates database references after each verified download.");
            await applyMigration(connection);
        } else if (mode === "--rollback") {
            console.log("WARNING: this restores prior Cloudinary URLs and retains local files.");
            await rollbackMigration(connection);
        } else {
            await runDryRun(connection);
        }
    } catch (error) {
        console.error(error.message || "Media migration failed.");
        process.exitCode = 1;
    } finally {
        connection?.release();
        await pool.end();
    }
}

main();
