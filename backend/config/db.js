require("dotenv").config();

const mysql = require("mysql2/promise");

const ssl =
    process.env.DB_SSL === "TRUE"
        ? {
            rejectUnauthorized: true,

            ca: process.env.DB_SSL_CA
                ? process.env.DB_SSL_CA.replace(/\\n/g, "\n")
                : undefined
        }
        : undefined;


/*
 * ======================================================
 * MYSQL CONNECTION POOL
 * ======================================================
 *
 * Keep connections alive so long-lived Node/Render processes
 * are less likely to reuse a stale Aiven TCP connection.
 * Idle connections are recycled instead of being kept forever.
 *
 * ======================================================
 */

const pool = mysql.createPool({

    host: process.env.DB_HOST,

    port: Number(process.env.DB_PORT),

    user: process.env.DB_USER,

    password: process.env.DB_PASSWORD,

    database: process.env.DB_NAME,

    charset: "utf8mb4",

    ssl,

    waitForConnections: true,

    connectionLimit: 10,

    maxIdle: 10,

    idleTimeout: 60_000,

    queueLimit: 50,

    connectTimeout: 15_000,

    enableKeepAlive: true,

    keepAliveInitialDelay: 10_000
});


/*
 * Log pool-level events without exposing credentials.
 */
pool.on("connection", () => {
    console.log("MySQL connection established.");
});

pool.on("acquire", () => {
    console.log("MySQL connection acquired from pool.");
});

pool.on("enqueue", () => {
    console.warn("MySQL pool is busy; request queued.");
});


module.exports = pool;
