require("dotenv").config();

const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const pool = require("./config/db");

async function createTechnician() {

    try {

        const name = "SecurePro Technician";
        const email = "technician@securepro.com";
        const password = "tech123";

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const id =
            crypto.randomUUID();


        await pool.query(
            `
            INSERT INTO users (
                id,
                name,
                email,
                password,
                role,
                status
            )
            VALUES (?, ?, ?, ?, 'technician', 'active')
            `,
            [
                id,
                name,
                email,
                hashedPassword
            ]
        );


        console.log(
            "✓ Technician account created successfully."
        );

        console.log(
            "Email:",
            email
        );

        console.log(
            "Password:",
            password
        );

    } catch (error) {

        console.error(
            "Unable to create technician:",
            error
        );

    } finally {

        await pool.end();

    }

}

createTechnician();
