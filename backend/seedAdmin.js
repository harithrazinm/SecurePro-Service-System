require("dotenv").config();

const bcrypt = require("bcryptjs");
const pool = require("./config/db");
const crypto = require("crypto");


async function seedAdmin() {

    try {

        const name = "SecurePro Admin";
        const email = "admin@securepro.com";
        const password = "adan123";


        // Check whether admin already exists

        const [existing] = await pool.query(
            `
            SELECT id
            FROM users
            WHERE email = ?
            LIMIT 1
            `,
            [email]
        );


        // Delete old account if you want to recreate it
        // with a new hashed password

        if (existing.length > 0) {

            console.log(
                "Admin account already exists."
            );

            console.log(
                "Delete the old admin from the database first if its password is not hashed."
            );

            return;

        }


        // Hash password

        const hashedPassword =
            await bcrypt.hash(
                password,
                12
            );


        // Generate UUID

        const id =
            crypto.randomUUID();


        // Insert hashed password

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
            VALUES
            (?, ?, ?, ?, ?, ?)
            `,
            [
                id,
                name,
                email,
                hashedPassword,
                "admin",
                "active"
            ]
        );


        console.log(
            "===================================="
        );

        console.log(
            "Admin account created successfully"
        );

        console.log(
            "===================================="
        );

        console.log(
            "Email:",
            email
        );

        console.log(
            "Password:",
            password
        );

        console.log(
            "Role: admin"
        );

        console.log(
            "===================================="
        );

    } catch (error) {

        console.error(
            "Failed to create admin:"
        );

        console.error(
            error
        );

    } finally {

        await pool.end();

    }

}


seedAdmin();
