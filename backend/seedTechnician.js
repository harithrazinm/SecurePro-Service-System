require("dotenv").config();

const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const pool = require("./config/db");

async function createTechnician() {

    try {

        const name = "SecurePro Technician";
        const email = "technician@securepro.com";
        const password = "tech123";


        // ==========================================
        // CHECK WHETHER TECHNICIAN ALREADY EXISTS
        // ==========================================

        const [existingUsers] =
            await pool.query(
                `
                SELECT id
                FROM users
                WHERE email = ?
                LIMIT 1
                `,
                [email]
            );


        if (existingUsers.length > 0) {

            console.log(
                "Technician account already exists."
            );

            return;
        }


        // ==========================================
        // HASH PASSWORD
        // ==========================================

        const hashedPassword =
            await bcrypt.hash(
                password,
                12
            );


        // ==========================================
        // CREATE UUID
        // ==========================================

        const id =
            crypto.randomUUID();


        // ==========================================
        // INSERT TECHNICIAN
        // ==========================================

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
            (
                ?, ?, ?, ?, 'technician', 'active'
            )
            `,
            [
                id,
                name,
                email,
                hashedPassword
            ]
        );


        console.log(
            "=========================================="
        );

        console.log(
            "Technician account created successfully"
        );

        console.log(
            "=========================================="
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
            "Role: technician"
        );

        console.log(
            "=========================================="
        );


        // Verify bcrypt before finishing

        const verify =
            await bcrypt.compare(
                password,
                hashedPassword
            );

        console.log(
            "Password hash verification:",
            verify
        );

    } catch (error) {

        console.error(
            "=========================================="
        );

        console.error(
            "Unable to create technician:"
        );

        console.error(
            error
        );

        console.error(
            "=========================================="
        );

    } finally {

        await pool.end();

    }

}


createTechnician();