const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// ======================================================
// LOAD ENVIRONMENT VARIABLES
// ======================================================

dotenv.config();

const app = express();

// Render automatically provides PORT.
// Local development uses 5001.
const PORT = process.env.PORT || 5001;

// ======================================================
// DATABASE
// ======================================================

const pool = require("./config/db");

// ======================================================
// ROUTES
// ======================================================

const serviceRoutes =
    require("./routes/serviceRoutes");

const requestRoutes =
    require("./routes/requestRoutes");

const authRoutes =
    require("./routes/authRoutes");

const adminRoutes =
    require("./routes/adminRoutes");

const technicianRoutes =
    require("./routes/technicianRoutes");

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

// ======================================================
// UPLOADS
// ======================================================

app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);

// ======================================================
// SERVICE ROUTES
// ======================================================

app.use(
    "/api/services",
    serviceRoutes
);

// ======================================================
// CUSTOMER REQUEST ROUTES
// ======================================================

app.use(
    "/api/requests",
    requestRoutes
);

// ======================================================
// AUTHENTICATION ROUTES
// ======================================================

app.use(
    "/api/auth",
    authRoutes
);

// ======================================================
// ADMIN ROUTES
// ======================================================

app.use(
    "/api/admin",
    adminRoutes
);

// ======================================================
// TECHNICIAN ROUTES
// ======================================================

app.use(
    "/api/technician",
    technicianRoutes
);

// ======================================================
// HEALTH CHECK
// ======================================================

app.get(
    "/api/health",
    async (req, res) => {

        try {

            const connection =
                await pool.getConnection();

            await connection.query(
                "SELECT 1"
            );

            connection.release();

            res.json({
                success: true,
                message:
                    "SecurePro API is running",
                database:
                    "connected"
            });

        } catch (error) {

            console.error(
                "Database connection error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "SecurePro API is running, but database connection failed."
            });

        }

    }
);

// ======================================================
// ROOT ROUTE
// ======================================================

app.get(
    "/",
    (req, res) => {

        res.json({
            success: true,
            message:
                "Welcome to SecurePro Service Management API"
        });

    }
);

// ======================================================
// START SERVER
// ======================================================

// ======================================================
// START SERVER
// ======================================================

const server =
    app.listen(
        PORT,
        "0.0.0.0",
        () => {

            console.log(
                "=========================================="
            );

            console.log(
                " SecurePro Backend"
            );

            console.log(
                "=========================================="
            );

            console.log(
                `Server running on port ${PORT}`
            );

            console.log(
                `Health: http://localhost:${PORT}/api/health`
            );

            console.log(
                "=========================================="
            );

        }
    );


server.on(
    "error",
    error => {

        console.error(
            "SERVER ERROR:",
            error
        );

    }
);