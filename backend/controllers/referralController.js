const crypto = require("crypto");
const pool = require("../config/db");


/* ============================================================
   GENERATE REFERRAL CODE
============================================================*/

function generateReferralCode(length = 8) {

    const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < length; i++) {

        const index =
            Math.floor(
                Math.random() *
                characters.length
            );

        code += characters[index];
    }

    return code;
}


/* ============================================================
   CREATE REFERRAL CODE - ADMIN
============================================================*/

async function createReferralCode(req, res) {

    try {

        const {
            description = null,
            reward_type = "fixed",
            reward_value = 20,
            minimum_order_amount = 0,
            usage_limit = null
        } = req.body;


        if (
            !["fixed", "percentage"]
                .includes(reward_type)
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid reward type."
            });
        }


        const reward =
            Number(reward_value);


        const minimumOrder =
            Number(
                minimum_order_amount
            );


        if (
            !Number.isFinite(reward) ||
            reward <= 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Reward value must be greater than zero."
            });
        }


        if (
            !Number.isFinite(minimumOrder) ||
            minimumOrder < 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid minimum order amount."
            });
        }


        if (
            reward_type === "percentage" &&
            reward > 100
        ) {

            return res.status(400).json({
                success: false,
                message: "Percentage reward cannot exceed 100."
            });
        }


        let code;

        let attempts = 0;


        /*
         * Generate a unique code.
         */

        while (attempts < 10) {

            const generated =
                generateReferralCode();


            const [existing] =
                await pool.query(
                    `
                    SELECT id
                    FROM referral_codes
                    WHERE code = ?
                    LIMIT 1
                    `,
                    [generated]
                );


            if (!existing.length) {

                code = generated;

                break;
            }


            attempts++;
        }


        if (!code) {

            return res.status(500).json({
                success: false,
                message: "Unable to generate a unique referral code."
            });
        }


        const id =
            crypto.randomUUID();


        const createdBy =
            req.user?.id ||
            req.user?.user_id;


        if (!createdBy) {

            return res.status(401).json({
                success: false,
                message: "Administrator authentication is required."
            });
        }


        await pool.query(
            `
            INSERT INTO referral_codes (
                id,
                code,
                description,
                reward_type,
                reward_value,
                minimum_order_amount,
                usage_limit,
                usage_count,
                status,
                created_by
            )
            VALUES (
                ?, ?, ?, ?, ?, ?, ?, 0, 'active', ?
            )
            `,
            [
                id,
                code,
                description,
                reward_type,
                reward,
                minimumOrder,
                usage_limit || null,
                createdBy
            ]
        );


        return res.status(201).json({

            success: true,

            message:
                "Referral code created successfully.",

            data: {

                id,
                code,
                description,
                reward_type,
                reward_value: reward,
                minimum_order_amount:
                    minimumOrder,
                usage_limit:
                    usage_limit || null,
                usage_count: 0,
                status: "active"

            }

        });


    } catch (error) {

        console.error(
            "Create referral code error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to create referral code."

        });
    }
}


/* ============================================================
   GET ALL REFERRAL CODES - ADMIN
============================================================*/

async function getReferralCodes(req, res) {

    try {

        const [rows] =
            await pool.query(
                `
                SELECT
                    rc.id,
                    rc.code,
                    rc.description,
                    rc.reward_type,
                    rc.reward_value,
                    rc.minimum_order_amount,
                    rc.usage_limit,
                    rc.usage_count,
                    rc.status,
                    rc.created_at,
                    rc.updated_at
                FROM referral_codes rc
                ORDER BY rc.created_at DESC
                `
            );


        return res.json({

            success: true,

            data: rows

        });


    } catch (error) {

        console.error(
            "Get referral codes error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load referral codes."

        });
    }
}


/* ============================================================
   VALIDATE REFERRAL CODE
   CUSTOMER
============================================================*/

async function validateReferralCode(req, res) {

    try {

        const rawCode =
            req.body?.code ||
            req.query?.code;


        const code =
            String(
                rawCode || ""
            )
                .trim()
                .toUpperCase();


        if (!code) {

            return res.status(400).json({

                success: false,

                message:
                    "Referral code is required."

            });
        }


        const [rows] =
            await pool.query(
                `
                SELECT
                    id,
                    code,
                    description,
                    reward_type,
                    reward_value,
                    minimum_order_amount,
                    usage_limit,
                    usage_count,
                    status
                FROM referral_codes
                WHERE code = ?
                LIMIT 1
                `,
                [code]
            );


        if (!rows.length) {

            return res.status(404).json({

                success: false,

                message:
                    "Invalid referral code."

            });
        }


        const referral =
            rows[0];


        if (
            referral.status !==
            "active"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "This referral code is no longer active."

            });
        }


        if (
            referral.usage_limit !== null &&
            referral.usage_count >=
                referral.usage_limit
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "This referral code has reached its usage limit."

            });
        }


        return res.json({

            success: true,

            message:
                "Referral code is valid.",

            data: {

                id:
                    referral.id,

                code:
                    referral.code,

                description:
                    referral.description,

                reward_type:
                    referral.reward_type,

                reward_value:
                    referral.reward_value,

                minimum_order_amount:
                    referral.minimum_order_amount

            }

        });


    } catch (error) {

        console.error(
            "Validate referral code error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to validate referral code."

        });
    }
}


/* ============================================================
   TOGGLE REFERRAL CODE STATUS - ADMIN
============================================================*/

async function updateReferralStatus(
    req,
    res
) {

    try {

        const {
            id
        } = req.params;


        const {
            status
        } = req.body;


        if (
            !["active", "inactive"]
                .includes(status)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid referral status."

            });
        }


        const [result] =
            await pool.query(
                `
                UPDATE referral_codes
                SET status = ?
                WHERE id = ?
                `,
                [
                    status,
                    id
                ]
            );


        if (
            result.affectedRows === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Referral code not found."

            });
        }


        return res.json({

            success: true,

            message:
                `Referral code ${status}.`

        });


    } catch (error) {

        console.error(
            "Update referral status error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to update referral code."

        });
    }
}


/* ============================================================
   GET REFERRAL USAGES - ADMIN
============================================================*/

async function getReferralUsages(
    req,
    res
) {

    try {

        const requestId = String(
            req.query?.request_id || ""
        ).trim();

        const where = requestId
            ? "WHERE ru.request_id = ?"
            : "";

        const params = requestId
            ? [requestId]
            : [];

        const [rows] =
            await pool.query(
                `
                SELECT
                    ru.id,
                    ru.request_id,
                    ru.referrer_customer_id,
                    ru.referred_customer_id,
                    ru.reward_type,
                    ru.reward_value,
                    ru.reward_amount,
                    ru.status,
                    ru.used_at,
                    ru.qualified_at,
                    ru.rewarded_at,
                    ru.remarks,
                    rc.code AS referral_code,
                    sr.request_code
                FROM referral_usages ru
                INNER JOIN referral_codes rc
                    ON rc.id = ru.referral_code_id
                LEFT JOIN service_requests sr
                    ON sr.id = ru.request_id
                ${where}
                ORDER BY ru.used_at DESC
                `,
                params
            );


        return res.json({

            success: true,

            data: rows

        });


    } catch (error) {

        console.error(
            "Get referral usages error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load referral usages."

        });
    }
}


/* ============================================================
   MARK REFERRAL REWARD AS APPLIED - ADMIN
============================================================*/

async function updateReferralUsageStatus(req, res) {
    try {
        const { id } = req.params;
        const { status, remarks = null } = req.body || {};

        if (status !== "rewarded") {
            return res.status(400).json({
                success: false,
                message: "Only the rewarded status can be applied from the invoice page."
            });
        }

        const [result] = await pool.query(
            `
            UPDATE referral_usages
            SET
                status = 'rewarded',
                rewarded_at = NOW(),
                remarks = ?
            WHERE id = ?
              AND status = 'pending'
            `,
            [
                String(remarks || "Referral reward applied during final invoice preparation.").trim(),
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Referral usage not found or has already been applied."
            });
        }

        return res.json({
            success: true,
            message: "Referral reward marked as applied."
        });
    } catch (error) {
        console.error("Update referral usage status error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to update referral reward."
        });
    }
}


/* ============================================================
   EXPORT
============================================================*/

module.exports = {

    createReferralCode,

    getReferralCodes,

    validateReferralCode,

    updateReferralStatus,

    getReferralUsages,

    updateReferralUsageStatus

};
