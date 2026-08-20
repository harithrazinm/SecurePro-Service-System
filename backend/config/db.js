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


const pool = mysql.createPool({

    host: process.env.DB_HOST,

    port: Number(process.env.DB_PORT),

    user: process.env.DB_USER,

    password: process.env.DB_PASSWORD,

    database: process.env.DB_NAME,

    ssl,

    waitForConnections: true,

    connectionLimit: 10,

    queueLimit: 0
});


module.exports = pool;