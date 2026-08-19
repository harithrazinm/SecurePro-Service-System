const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const [users] = await pool.query(
            `
            SELECT
                id,
                name,
                email,
                password,
                role,
                status
            FROM users
            WHERE email = ?
            LIMIT 1
            `,
            [email.trim().toLowerCase()]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const user = users[0];

        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "This account is inactive."
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || "securepro-development-secret",
            {
                expiresIn: "8h"
            }
        );

        return res.json({
            success: true,
            message: "Login successful.",
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    status: user.status
                }
            }
        });

    } catch (error) {

        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to login."
        });
    }
}


async function me(req, res) {
    try {

        const [users] = await pool.query(
            `
            SELECT
                id,
                name,
                email,
                role,
                status
            FROM users
            WHERE id = ?
            LIMIT 1
            `,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.json({
            success: true,
            data: users[0]
        });

    } catch (error) {

        console.error("Get current user error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve user."
        });
    }
}


module.exports = {
    login,
    me
};