require("dotenv").config();

const bcrypt = require("bcryptjs");
const pool = require("./config/db");
const crypto = require("crypto");

async function seedAdmin() {
    try {

        const name = "SecurePro Admin";
        const email = "admin@securepro.com";
        const password = "admin123";

        const [existing] = await pool.query(
            "SELECT id FROM users WHERE email = ? LIMIT 1",
            [email]
        );

        if (existing.length > 0) {

            console.log("Admin account already exists.");

            process.exit(0);
        }

        const hashedPassword =
            await bcrypt.hash(password, 12);

        const id =
            crypto.randomUUID();

        await pool.query(
            `
            INSERT INTO users
            (
                id,
                name,
                email,
                password,
                role,
                status
            )
            VALUES (?, ?, ?, ?, 'admin', 'active')
            `,
            [
                id,
                name,
                email,
                hashedPassword
            ]
        );

        console.log("====================================");
        console.log("Admin account created successfully");
        console.log("====================================");
        console.log("Email:", email);
        console.log("Password:", password);
        console.log("Role: admin");
        console.log("====================================");

    } catch (error) {

        console.error(
            "Failed to create admin:",
            error
        );

    } finally {

        await pool.end();

    }
}

seedAdmin();
