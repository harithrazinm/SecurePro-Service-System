const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const rateLimit = require("express-rate-limit");

// ======================================================
// LOAD ENVIRONMENT VARIABLES
// ======================================================

dotenv.config();

// ======================================================
// LOAD ROUTES AFTER ENVIRONMENT VARIABLES
// ======================================================

const quotationRoutes =
    require("./routes/quotationRoutes");

const app = express();

// Render automatically provides PORT.
// Docker/local development uses 5000.
// Your current local backend uses 5001.
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

const superAdminRoutes =
    require("./routes/superAdminRoutes");

// ======================================================
// CORS
// ======================================================

// Local frontend
// Render frontend
// Existing SecurePro frontend
const allowedOrigins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",

    "http://localhost:5501",
    "http://127.0.0.1:5501",

    "https://securepro-service-system-1.onrender.com",
    "https://securepro-service-system.onrender.com"
];

app.use(
    cors({
        origin: function (origin, callback) {

            // Allow requests without an Origin
            // such as Postman or server-to-server requests.
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            console.warn(
                `CORS blocked origin: ${origin}`
            );

            return callback(
                new Error("Not allowed by CORS")
            );
        },

        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ],

        credentials: true
    })
);

// ======================================================
// BODY PARSERS
// ======================================================

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

// ======================================================
// LOGIN RATE LIMITER
// ======================================================

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,

    max: 10,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
        success: false,
        message:
            "Too many login attempts. Please try again later."
    }
});

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

// Rate limit ONLY the login endpoint
app.use(
    "/api/auth/login",
    loginLimiter
);

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
// QUOTATION ROUTES
// ======================================================

app.use(
    "/api/admin/quotations",
    quotationRoutes
);

// ======================================================
// TECHNICIAN ROUTES
// ======================================================

app.use(
    "/api/technician",
    technicianRoutes
);

// ======================================================
// SUPER ADMIN MONITORING ROUTES
// ======================================================

app.use(
    "/api/super-admin",
    superAdminRoutes
);

// ======================================================
// HEALTH CHECK
// ======================================================

app.get(
    "/api/health",
    async (req, res) => {

        let connection;

        try {

            connection =
                await pool.getConnection();

            await connection.query(
                "SELECT 1"
            );

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

        } finally {

            if (connection) {
                connection.release();
            }

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
// 404 HANDLER
// ======================================================

app.use(
    (req, res) => {

        res.status(404).json({
            success: false,
            message:
                "API endpoint not found."
        });

    }
);

// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use(
    (err, req, res, next) => {

        console.error(
            "Unhandled server error:",
            {
                method: req.method,
                url: req.originalUrl,
                message: err.message,
                stack: err.stack
            }
        );

        res.status(
            err.status || 500
        ).json({
            success: false,
            message:
                "An unexpected server error occurred."
        });

    }
);

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

// ======================================================
// SERVER ERROR
// ======================================================

server.on(
    "error",
    error => {

        console.error(
            "SERVER ERROR:",
            error
        );

    }
);