const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ALLOWED_CATEGORIES = new Set([
    "customers",
    "technicians",
    "service-reports",
    "progress-reports",
    "quotations",
    "invoices",
    "payment-proofs",
    "videos"
]);

const MIME_BY_EXTENSION = Object.freeze({
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    pdf: "application/pdf",
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime"
});

function getStorageRoot() {
    const provider = String(process.env.MEDIA_STORAGE_PROVIDER || "local").toLowerCase();
    if (provider !== "local") {
        throw new Error(`Unsupported media storage provider: ${provider}.`);
    }

    const configuredRoot = process.env.STORAGE_ROOT;

    if (configuredRoot) {
        // Relative paths (for example ./securepro-storage) resolve from the
        // backend process working directory. Production may use an absolute
        // path outside public_html.
        return path.resolve(process.cwd(), configuredRoot);
    }

    if (process.env.NODE_ENV === "production") {
        throw new Error(
            "STORAGE_ROOT must be configured in production before local media uploads are enabled."
        );
    }

    return path.resolve(__dirname, "..", "securepro-storage");
}

function getLegacyUploadsRoot() {
    const configuredRoot = process.env.LEGACY_UPLOADS_ROOT;
    if (configuredRoot) {
        if (!path.isAbsolute(configuredRoot)) {
            throw new Error("LEGACY_UPLOADS_ROOT must be an absolute filesystem path.");
        }
        return path.resolve(configuredRoot);
    }

    return path.resolve(__dirname, "..", "uploads");
}

async function ensurePrivateDirectory(directory) {
    await fs.promises.mkdir(directory, { recursive: true, mode: 0o750 });

    const root = getStorageRoot();
    if (directory === root) {
        const denyFile = path.join(root, ".htaccess");
        try {
            await fs.promises.writeFile(
                denyFile,
                "Options -Indexes\n<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\nOrder allow,deny\nDeny from all\n</IfModule>\n",
                { flag: "wx", mode: 0o640 }
            );
        } catch (error) {
            if (error.code !== "EEXIST") throw error;
        }
    }
}

function createLocalStorage(category) {
    if (!ALLOWED_CATEGORIES.has(category)) {
        throw new Error("Unsupported local media category.");
    }

    return {
        _handleFile(req, file, callback) {
            const extension = path.extname(String(file.originalname || ""))
                .toLowerCase()
                .slice(1);
            if (!Object.hasOwn(MIME_BY_EXTENSION, extension)) {
                callback(new Error("This file extension is not allowed."));
                return;
            }

            const root = getStorageRoot();
            const directory = path.join(root, category);
            ensurePrivateDirectory(root)
                .then(() => ensurePrivateDirectory(directory))
                .then(async () => {
                    let fileHandle;
                    let filename;
                    let absolutePath;

                    // wx atomically reserves the name and refuses to overwrite
                    // an existing file, even if a UUID collision ever occurs.
                    for (let attempt = 0; attempt < 5; attempt += 1) {
                        filename = `${crypto.randomUUID()}.${extension}`;
                        absolutePath = path.join(directory, filename);
                        try {
                            fileHandle = await fs.promises.open(absolutePath, "wx", 0o640);
                            break;
                        } catch (error) {
                            if (error.code !== "EEXIST" || attempt === 4) throw error;
                        }
                    }

                    const output = fileHandle.createWriteStream({ autoClose: true });
                    const { pipeline } = require("node:stream/promises");
                    try {
                        await pipeline(file.stream, output);
                        const stats = await fs.promises.stat(absolutePath);
                        callback(null, {
                            destination: directory,
                            filename,
                            path: absolutePath,
                            size: stats.size
                        });
                    } catch (error) {
                        await removeDiskFile(absolutePath).catch(() => {});
                        callback(error);
                    }
                })
                .catch(callback);
        },
        _removeFile(req, file, callback) {
            removeDiskFile(file.path).then(() => callback(null)).catch(callback);
        }
    };
}

function signatureMime(buffer) {
    if (!Buffer.isBuffer(buffer)) return null;

    if (
        buffer.length >= 3 &&
        buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
    ) return "image/jpeg";

    if (
        buffer.length >= 8 &&
        buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ) return "image/png";

    if (
        buffer.length >= 12 &&
        buffer.toString("ascii", 0, 4) === "RIFF" &&
        buffer.toString("ascii", 8, 12) === "WEBP"
    ) return "image/webp";

    if (buffer.length >= 5 && buffer.toString("ascii", 0, 5) === "%PDF-") {
        return "application/pdf";
    }

    if (
        buffer.length >= 12 &&
        buffer.toString("ascii", 4, 8) === "ftyp"
    ) {
        return buffer.toString("ascii", 8, 12).toLowerCase().startsWith("qt")
            ? "video/quicktime"
            : "video/mp4";
    }

    if (
        buffer.length >= 4 &&
        buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))
    ) return "video/webm";

    return null;
}

async function readFileHeader(filePath, length = 32) {
    const handle = await fs.promises.open(filePath, "r");
    try {
        const buffer = Buffer.alloc(length);
        const { bytesRead } = await handle.read(buffer, 0, length, 0);
        return buffer.subarray(0, bytesRead);
    } finally {
        await handle.close();
    }
}

async function verifyUploadedFile(file) {
    const extension = path.extname(String(file.originalname || ""))
        .toLowerCase()
        .slice(1);
    const expectedMime = MIME_BY_EXTENSION[extension];

    if (!file.diskPath || !expectedMime || expectedMime !== file.mimetype) {
        throw new Error("The uploaded file type does not match its extension.");
    }

    const detectedMime = signatureMime(await readFileHeader(file.diskPath));
    if (!detectedMime || detectedMime !== expectedMime) {
        throw new Error("The uploaded file content does not match an allowed file type.");
    }

    return true;
}

async function storeMigratedBuffer(buffer, category, mimeType) {
    if (!Buffer.isBuffer(buffer) || !ALLOWED_CATEGORIES.has(category)) {
        throw new Error("Migrated media metadata is invalid.");
    }

    const detectedMime = signatureMime(buffer.subarray(0, 32));
    if (!detectedMime || detectedMime !== mimeType) {
        throw new Error("Downloaded media content failed signature validation.");
    }

    const extension = Object.entries(MIME_BY_EXTENSION)
        .find(([, mime]) => mime === detectedMime)?.[0];
    if (!extension) throw new Error("Downloaded media type is not supported.");

    const root = getStorageRoot();
    const directory = path.join(root, category);
    await ensurePrivateDirectory(root);
    await ensurePrivateDirectory(directory);

    const fileName = `${crypto.randomUUID()}.${extension}`;
    const absolutePath = path.join(directory, fileName);
    await fs.promises.writeFile(absolutePath, buffer, { flag: "wx", mode: 0o640 });

    return {
        reference: storageReference(`${category}/${fileName}`),
        absolutePath,
        mimeType: detectedMime,
        size: buffer.length
    };
}

function storageReference(storageKey) {
    return `local://${storageKey}`;
}

function parseLocalReference(reference) {
    const raw = String(reference || "");
    if (!raw.startsWith("local://")) return null;

    const key = raw.slice("local://".length);
    const pieces = key.split("/");
    if (pieces.length !== 2 || !ALLOWED_CATEGORIES.has(pieces[0])) return null;
    if (!/^[a-f0-9-]{36}\.[a-z0-9]{1,8}$/i.test(pieces[1])) return null;
    if (!Object.hasOwn(MIME_BY_EXTENSION, path.extname(pieces[1]).slice(1).toLowerCase())) return null;

    return { kind: "local", key };
}

function parseLegacyReference(reference) {
    const raw = String(reference || "");
    if (!/^\/uploads\/(customer|technician)\/[a-z0-9_./-]+$/i.test(raw)) return null;

    const key = raw.replace(/^\//, "");
    if (key.split("/").some(segment => !segment || segment === "." || segment === "..")) return null;
    const resolved = path.resolve(getLegacyUploadsRoot(), key.slice("uploads/".length));
    const relative = path.relative(getLegacyUploadsRoot(), resolved);
    if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) return null;

    return { kind: "legacy", key, absolutePath: resolved };
}

function resolveReference(reference) {
    const local = parseLocalReference(reference);
    if (local) {
        const root = getStorageRoot();
        const absolutePath = path.resolve(root, local.key);
        const relative = path.relative(root, absolutePath);
        if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) return null;
        return { ...local, absolutePath };
    }

    return parseLegacyReference(reference);
}

function signingSecret() {
    const secret = process.env.MEDIA_SIGNING_SECRET || process.env.JWT_SECRET;
    if (!secret) throw new Error("MEDIA_SIGNING_SECRET or JWT_SECRET must be configured.");
    return secret;
}

function signatureFor(reference, expiresAt, userId, role) {
    return crypto
        .createHmac("sha256", signingSecret())
        .update(`${reference}\n${expiresAt}\n${userId}\n${role}`)
        .digest("base64url");
}

function createSignedMediaUrl(reference, user, ttlSeconds = 10 * 60, origin = "") {
    const parsed = resolveReference(reference);
    if (!parsed || !user?.id || !["admin", "super_admin", "technician", "customer"].includes(user.role)) return "";

    const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
    const query = new URLSearchParams({
        ref: String(reference),
        exp: String(expiresAt),
        sub: String(user.id),
        role: user.role,
        sig: signatureFor(String(reference), expiresAt, user.id, user.role)
    });

    return `${String(origin || "").replace(/\/$/, "")}/api/media/file?${query.toString()}`;
}

function verifySignedMediaUrl(reference, expiresValue, userId, role, suppliedSignature) {
    const expiresAt = Number(expiresValue);
    if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) {
        return false;
    }

    if (!userId || !["admin", "super_admin", "technician", "customer"].includes(role)) return false;
    if (!resolveReference(reference)) return false;

    let expected;
    try {
        expected = Buffer.from(signatureFor(reference, expiresAt, userId, role));
    } catch {
        return false;
    }

    const actual = Buffer.from(String(suppliedSignature || ""));
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return false;
    return { id: String(userId), role };
}

function getReferenceMime(reference) {
    const resolved = resolveReference(reference);
    if (!resolved) return "application/octet-stream";
    return MIME_BY_EXTENSION[path.extname(resolved.absolutePath).slice(1).toLowerCase()] || "application/octet-stream";
}

function sanitizeDownloadName(value) {
    const name = String(value || "download")
        .replace(/[\r\n\0]/g, "")
        .replace(/[\\/]/g, "_")
        .trim();
    return name.slice(0, 180) || "download";
}

async function removeDiskFile(filePath) {
    if (!filePath) return;
    try {
        await fs.promises.unlink(filePath);
    } catch (error) {
        if (error.code !== "ENOENT") throw error;
    }
}

async function deleteLocalMediaFile(reference) {
    const parsed = parseLocalReference(reference);
    if (!parsed) return false;

    const resolved = resolveReference(reference);
    if (!resolved) return false;

    await removeDiskFile(resolved.absolutePath);
    return true;
}

async function cleanupUploadedFiles(files) {
    const list = Array.isArray(files) ? files : files ? [files] : [];
    await Promise.all(list.map(file => removeDiskFile(file.diskPath || file.path)));
}

function prepareUploadedFiles(req, res, next) {
    const files = [
        ...(Array.isArray(req.files) ? req.files : []),
        ...(req.file ? [req.file] : [])
    ];

    Promise.all(files.map(async file => {
        file.diskPath = file.path;
        await verifyUploadedFile(file);

        const category = path.basename(file.destination || "");
        if (!ALLOWED_CATEGORIES.has(category)) {
            throw new Error("Upload storage category is invalid.");
        }

        file.storageKey = `${category}/${file.filename}`;
        file.path = storageReference(file.storageKey);
    }))
        .then(() => next())
        .catch(async error => {
            try {
                await cleanupUploadedFiles(files);
            } catch (cleanupError) {
                console.error("Unable to clean rejected upload:", cleanupError.message);
            }
            res.status(400).json({
                success: false,
                message: error.message || "Uploaded file failed validation."
            });
        });
}

function cleanupOnControllerFailure(controller) {
    return async (req, res, next) => {
        try {
            await controller(req, res, next);
        } catch (error) {
            await cleanupUploadedFiles(req.files || req.file).catch(cleanupError => {
                console.error("Unable to clean failed upload:", cleanupError.message);
            });
            next(error);
            return;
        }

        if (res.statusCode >= 400) {
            await cleanupUploadedFiles(req.files || req.file).catch(error => {
                console.error("Unable to clean rejected upload:", error.message);
            });
        }
    };
}

function decorateMediaReferences(payload, user, origin = "") {
    const allowedRole = ["admin", "super_admin", "technician"].includes(user?.role);

    function visit(value) {
        if (typeof value === "string") {
            if (parseLocalReference(value) || parseLegacyReference(value)) {
                return allowedRole ? createSignedMediaUrl(value, user, 10 * 60, origin) : null;
            }
            return value;
        }

        if (Array.isArray(value)) return value.map(visit);
        if (value && typeof value === "object") {
            return Object.fromEntries(
                Object.entries(value).map(([key, child]) => [key, visit(child)])
            );
        }

        return value;
    }

    return visit(payload);
}

module.exports = {
    ALLOWED_CATEGORIES,
    MIME_BY_EXTENSION,
    getStorageRoot,
    signatureMime,
    createLocalStorage,
    verifyUploadedFile,
    storeMigratedBuffer,
    prepareUploadedFiles,
    cleanupUploadedFiles,
    cleanupOnControllerFailure,
    storageReference,
    parseLocalReference,
    parseLegacyReference,
    resolveReference,
    createSignedMediaUrl,
    verifySignedMediaUrl,
    getReferenceMime,
    sanitizeDownloadName,
    deleteLocalMediaFile,
    decorateMediaReferences
};
