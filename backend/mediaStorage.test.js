const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { Readable } = require("node:stream");
const {
    signatureMime,
    verifyUploadedFile,
    parseLocalReference,
    parseLegacyReference,
    createSignedMediaUrl,
    verifySignedMediaUrl,
    getStorageRoot,
    createLocalStorage,
    resolveReference
} = require("./services/mediaStorage");
const { canReadMedia, streamAuthorizedMedia, deleteLocalMediaIfUnreferenced } = require("./services/mediaAccess");
const pool = require("./config/db");

const validId = "39d9cb45-c1a4-44f0-9f6b-9d01dff86ba1";

test("detects the supported media signatures", () => {
    assert.equal(signatureMime(Buffer.from([0xff, 0xd8, 0xff, 0x00])), "image/jpeg");
    assert.equal(signatureMime(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "image/png");
    assert.equal(signatureMime(Buffer.from("RIFF0000WEBP")), "image/webp");
    assert.equal(signatureMime(Buffer.from("%PDF-1.7")), "application/pdf");
    assert.equal(signatureMime(Buffer.from("0000ftypisom")), "video/mp4");
    assert.equal(signatureMime(Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x00])), "video/webm");
    assert.equal(signatureMime(Buffer.from("not a media file")), null);
});

test("accepts a file only when declared MIME, extension and signature agree", async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "securepro-media-test-"));
    const diskPath = path.join(directory, "photo.jpg");
    await fs.writeFile(diskPath, Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x01]));

    try {
        await assert.doesNotReject(verifyUploadedFile({
            diskPath,
            originalname: "customer-photo.jpg",
            mimetype: "image/jpeg"
        }));
        await assert.rejects(verifyUploadedFile({
            diskPath,
            originalname: "customer-photo.png",
            mimetype: "image/png"
        }), /does not match/);
    } finally {
        await fs.rm(directory, { recursive: true, force: true });
    }
});

test("accepts valid local references and rejects traversal or unknown categories", () => {
    assert.deepEqual(parseLocalReference(`local://customers/${validId}.jpg`), {
        kind: "local",
        key: `customers/${validId}.jpg`
    });
    assert.equal(parseLocalReference(`local://customers/../../${validId}.jpg`), null);
    assert.equal(parseLocalReference(`local://unknown/${validId}.jpg`), null);
    assert.equal(parseLegacyReference("/uploads/customer/../../outside.jpg"), null);
});

test("signed links are short-lived and scoped to the issuing role and user", () => {
    const priorSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "test-only-signing-secret";
    try {
        const reference = `local://quotations/${validId}.pdf`;
        const user = { id: "staff-123", role: "admin" };
        const url = new URL(createSignedMediaUrl(reference, user), "https://example.test");
        const signature = url.searchParams.get("sig");

        assert.ok(signature);
        assert.deepEqual(
            verifySignedMediaUrl(reference, url.searchParams.get("exp"), "staff-123", "admin", signature),
            { id: "staff-123", role: "admin" }
        );
        assert.equal(
            verifySignedMediaUrl(reference, url.searchParams.get("exp"), "other-user", "admin", signature),
            false
        );
        assert.equal(
            verifySignedMediaUrl(reference, url.searchParams.get("exp"), "staff-123", "technician", signature),
            false
        );
        assert.equal(
            verifySignedMediaUrl(reference, String(Math.floor(Date.now() / 1000) - 1), "staff-123", "admin", signature),
            false
        );
    } finally {
        if (priorSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = priorSecret;
    }
});

test("customer media access is scoped to the request that issued the link", async () => {
    const customerMedia = [{ request_id: "request-1", media_kind: "customer_photo" }];
    assert.equal(await canReadMedia({ id: "request-1", role: "customer" }, customerMedia), true);
    assert.equal(await canReadMedia({ id: "request-2", role: "customer" }, customerMedia), false);
    assert.equal(await canReadMedia({ id: "request-1", role: "customer" }, [
        { request_id: "request-1", media_kind: "invoice" }
    ]), false);
});

test("relative local storage creates private directories, uses unique disk files, and supports deletion", async () => {
    const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "securepro-local-media-"));
    const priorRoot = process.env.STORAGE_ROOT;
    const priorProvider = process.env.MEDIA_STORAGE_PROVIDER;
    const originalQuery = pool.query;
    const priorCwd = process.cwd();
    process.chdir(temporaryRoot);
    process.env.MEDIA_STORAGE_PROVIDER = "local";
    process.env.STORAGE_ROOT = "./securepro-storage";

    const writeFile = storage => new Promise((resolve, reject) => {
        const file = {
            originalname: "same-name.jpg",
            mimetype: "image/jpeg",
            stream: Readable.from([Buffer.from([0xff, 0xd8, 0xff, 0x00])])
        };
        storage._handleFile({}, file, (error, result) => {
            if (error) reject(error);
            else resolve({ ...file, ...result });
        });
    });

    try {
        const root = getStorageRoot();
        assert.equal(root, path.resolve(process.cwd(), "./securepro-storage"));

        const storage = createLocalStorage("customers");
        const first = await writeFile(storage);
        const second = await writeFile(storage);

        assert.notEqual(first.filename, second.filename);
        assert.equal(path.dirname(first.path), path.join(root, "customers"));
        assert.equal(await fs.readFile(first.path).then(buffer => buffer[0]), 0xff);
        assert.equal(await fs.readFile(path.join(root, ".htaccess"), "utf8").then(text => text.includes("Require all denied")), true);

        // Resolving the key again after the first write simulates backend restart:
        // the file remains on disk and its storage key still points to it.
        const storedReference = `local://customers/${first.filename}`;
        assert.equal(await fs.readFile(resolveReference(storedReference).absolutePath).then(buffer => buffer[1]), 0xd8);

        pool.query = async () => [[{ request_id: "still-referenced", media_kind: "customer_photo" }]];
        assert.equal(await deleteLocalMediaIfUnreferenced(storedReference), false);
        await fs.access(first.path);

        pool.query = async () => [[]];
        assert.equal(await deleteLocalMediaIfUnreferenced(storedReference), true);
        await assert.rejects(fs.access(first.path));
        assert.equal(await deleteLocalMediaIfUnreferenced("/uploads/customer/legacy.jpg"), false);
    } finally {
        pool.query = originalQuery;
        if (priorRoot === undefined) delete process.env.STORAGE_ROOT;
        else process.env.STORAGE_ROOT = priorRoot;
        if (priorProvider === undefined) delete process.env.MEDIA_STORAGE_PROVIDER;
        else process.env.MEDIA_STORAGE_PROVIDER = priorProvider;
        process.chdir(priorCwd);
        await fs.rm(temporaryRoot, { recursive: true, force: true });
    }
});

test("signed media retrieval authorizes a referenced file and enables byte-range streaming", async () => {
    const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "securepro-media-range-"));
    const priorRoot = process.env.STORAGE_ROOT;
    const priorProvider = process.env.MEDIA_STORAGE_PROVIDER;
    const priorSecret = process.env.JWT_SECRET;
    const originalQuery = pool.query;
    const reference = `local://videos/${validId}.mp4`;
    const videoBytes = Buffer.from("0123456789abcdef");
    process.env.MEDIA_STORAGE_PROVIDER = "local";
    process.env.STORAGE_ROOT = temporaryRoot;
    process.env.JWT_SECRET = "test-range-secret";
    await fs.mkdir(path.join(temporaryRoot, "videos"), { recursive: true });
    await fs.writeFile(path.join(temporaryRoot, "videos", `${validId}.mp4`), videoBytes);

    pool.query = async () => [[{ request_id: "request-test", file_name: "test-video.mp4", media_kind: "invoice" }]];

    try {
        const mediaUrl = new URL(createSignedMediaUrl(reference, { id: "admin-test", role: "admin" }, 60), "http://local.test");
        const req = { query: Object.fromEntries(mediaUrl.searchParams.entries()) };
        let statusCode = 200;
        let streamedPath;
        let streamOptions;
        const res = {
            set(headers) { this.headers = headers; return this; },
            status(value) { statusCode = value; return this; },
            json(value) { this.body = value; return this; },
            sendFile(filePath, options) {
                streamedPath = filePath;
                streamOptions = options;
            }
        };

        await streamAuthorizedMedia(req, res);

        assert.equal(statusCode, 200);
        assert.equal(streamedPath, resolveReference(reference).absolutePath);
        assert.equal(streamOptions.acceptRanges, true);
        assert.equal(res.headers["Accept-Ranges"], "bytes");
        assert.equal(res.headers["X-Content-Type-Options"], "nosniff");
    } finally {
        pool.query = originalQuery;
        if (priorRoot === undefined) delete process.env.STORAGE_ROOT;
        else process.env.STORAGE_ROOT = priorRoot;
        if (priorProvider === undefined) delete process.env.MEDIA_STORAGE_PROVIDER;
        else process.env.MEDIA_STORAGE_PROVIDER = priorProvider;
        if (priorSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = priorSecret;
        await fs.rm(temporaryRoot, { recursive: true, force: true });
    }
});
