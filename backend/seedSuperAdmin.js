require("dotenv").config();

const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const pool = require("./config/db");

async function seedSuperAdmin() {
    const email = String(process.env.SUPER_ADMIN_EMAIL || "").trim().toLowerCase();
    const password = String(process.env.SUPER_ADMIN_PASSWORD || "");
    const name = String(process.env.SUPER_ADMIN_NAME || "SecurePro Super Admin").trim();

    if (!email || !password) {
        throw new Error(
            "Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in the environment before running this script."
        );
    }

    if (password.length < 8) {
        throw new Error("SUPER_ADMIN_PASSWORD must contain at least 8 characters.");
    }

    try {
        const [existing] = await pool.query(
            "SELECT id, role, status FROM users WHERE email = ? LIMIT 1",
            [email]
        );

        if (existing.length) {
            if (existing[0].role !== "super_admin") {
                await pool.query(
                    "UPDATE users SET role = 'super_admin', status = 'active' WHERE id = ?",
                    [existing[0].id]
                );
                console.log("Existing account promoted to super_admin.");
            } else {
                console.log("Super Admin account already exists.");
            }
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await pool.query(
            `INSERT INTO users
                (id, name, email, password, role, status)
             VALUES (?, ?, ?, ?, 'super_admin', 'active')`,
            [
                crypto.randomUUID(),
                name,
                email,
                hashedPassword
            ]
        );

        console.log("Super Admin account created successfully.");
        console.log("Email:", email);
        console.log("Role: super_admin");
    } finally {
        await pool.end();
    }
}

seedSuperAdmin().catch(error => {
    console.error("Failed to create Super Admin:", error.message);
    process.exit(1);
});
