const fs = require("fs");
const path = require("path");
const util = require("util");

const DEFAULT_LOG_DIR = path.join(__dirname, "..", "logs");
const LOG_DIR = path.resolve(process.env.APP_ERROR_LOG_DIR || DEFAULT_LOG_DIR);
const LOG_FILE = path.join(LOG_DIR, "error.log");
const MAX_LOG_BYTES = 5 * 1024 * 1024;
const ROTATED_LOGS = 3;
const REDACTED_KEYS = /password|passwd|token|secret|authorization|cookie|api[_-]?key|private.?key|credential|endpoint|p256dh|\bauth\b/i;
const STRING_SECRET_PATTERNS = [
    /(\b(?:password|passwd|token|secret|authorization|api[_-]?key)\b\s*[:=]\s*)([^\s,;]+)/gi,
    /(\bBearer\s+)[A-Za-z0-9._~+/=-]+/gi,
    /([?&](?:access_token|token|signature|password|key)=)[^&\s]+/gi
];

let installed = false;

function redactString(value) {
    return STRING_SECRET_PATTERNS.reduce(
        (result, pattern) => result.replace(pattern, "$1[REDACTED]"),
        value
    );
}

function safeValue(value, depth = 0, seen = new WeakSet()) {
    if (typeof value === "string") return redactString(value);
    if (value === null || typeof value !== "object") return value;
    if (depth >= 5) return "[MAX DEPTH]";
    if (seen.has(value)) return "[CIRCULAR]";
    seen.add(value);

    if (value instanceof Error) {
        const details = { name: value.name, message: redactString(value.message || "") };
        for (const key of ["code", "errno", "sqlState", "statusCode"]) {
            if (value[key] !== undefined) details[key] = safeValue(value[key], depth + 1, seen);
        }
        if (value.stack) details.stack = redactString(value.stack);
        return details;
    }

    if (Array.isArray(value)) {
        return value.slice(0, 50).map(item => safeValue(item, depth + 1, seen));
    }

    const result = {};
    for (const [key, item] of Object.entries(value).slice(0, 100)) {
        result[key] = REDACTED_KEYS.test(key)
            ? "[REDACTED]"
            : safeValue(item, depth + 1, seen);
    }
    return result;
}

function rotateIfNeeded() {
    try {
        if (!fs.existsSync(LOG_FILE) || fs.statSync(LOG_FILE).size < MAX_LOG_BYTES) return;

        for (let index = ROTATED_LOGS; index >= 1; index -= 1) {
            const source = index === 1 ? LOG_FILE : `${LOG_FILE}.${index - 1}`;
            const target = `${LOG_FILE}.${index}`;
            if (!fs.existsSync(source)) continue;
            if (fs.existsSync(target)) fs.unlinkSync(target);
            fs.renameSync(source, target);
        }
    } catch {
        // Preserve the application's original stderr logging if rotation fails.
    }
}

function writeRecord(level, args) {
    const message = args.map(value => {
        const safe = safeValue(value);
        return typeof safe === "string"
            ? safe
            : util.inspect(safe, { depth: 5, colors: false, breakLength: Infinity });
    }).join(" ");
    const line = JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message
    }) + "\n";

    try {
        fs.mkdirSync(LOG_DIR, { recursive: true, mode: 0o700 });
        try { fs.chmodSync(LOG_DIR, 0o700); } catch { /* Best effort on shared hosts. */ }
        rotateIfNeeded();
        fs.appendFileSync(LOG_FILE, line, { encoding: "utf8", mode: 0o600 });
        try { fs.chmodSync(LOG_FILE, 0o600); } catch { /* Best effort on shared hosts. */ }
    } catch {
        // Do not recurse through patched console methods if the log path is unavailable.
    }
}

function installErrorLogging() {
    if (installed) return;
    installed = true;

    const originalError = console.error.bind(console);
    const originalWarn = console.warn.bind(console);

    console.error = (...args) => {
        writeRecord("ERROR", args);
        originalError(...args);
    };

    console.warn = (...args) => {
        writeRecord("WARN", args);
        originalWarn(...args);
    };

    // Monitor fatal startup/runtime exceptions without intercepting Node's default crash behavior.
    process.on("uncaughtExceptionMonitor", (error, origin) => {
        writeRecord("FATAL", [`Uncaught exception (${origin})`, error]);
    });
}

module.exports = { installErrorLogging, LOG_FILE };
