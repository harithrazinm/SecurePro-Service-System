require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const sslConfig = process.env.DB_SSL === "true"
    ? {
        ca: process.env.DB_SSL_CA
            ? process.env.DB_SSL_CA.replace(/\\n/g, "\n")
            : fs.readFileSync(
                path.join(__dirname, "../../database/ca.pem")
            )
    }
    : undefined;

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    ssl: sslConfig,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;