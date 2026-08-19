const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const pool = require("../config/db");


function uuid() {
    return crypto.randomUUID();
}


function generateRequestCode() {

    const timestamp =
        Date.now()
            .toString(36)
            .toUpperCase();

    const random =
        Math.random()
            .toString(36)
            .substring(2, 6)
            .toUpperCase();

    return `SR-${timestamp}-${random}`;
}


function safeJsonParse(value) {

    if (!value) {
        return {};
    }

    if (typeof value === "object") {
        return value;
    }

    try {
        return JSON.parse(value);
    } catch {
        return {};
    }
}


/*
 * ==========================================================
 * CREATE SERVICE REQUEST
 * ==========================================================
 */

async function createRequest(req, res) {

    const connection =
        await pool.getConnection();

    try {

        /*
         * --------------------------------------------------
         * CUSTOMER INFORMATION
         * --------------------------------------------------
         */

        const customerName =
            String(
                req.body.customer_name || ""
            ).trim();

        const customerPhone =
            String(
                req.body.customer_phone || ""
            ).trim();

        const customerEmail =
            String(
                req.body.customer_email || ""
            ).trim();

        const customerAddress =
            String(
                req.body.customer_address || ""
            ).trim();

        const customerNotes =
            String(
                req.body.customer_notes || ""
            ).trim();


        /*
         * --------------------------------------------------
         * SERVICE
         * --------------------------------------------------
         */

        const serviceCode =
            String(
                req.body.service_type || ""
            ).trim();


        /*
         * --------------------------------------------------
         * VALIDATION
         * --------------------------------------------------
         */

        if (!customerName) {

            return res.status(400).json({
                success: false,
                message: "Customer name is required."
            });
        }


        if (!customerPhone) {

            return res.status(400).json({
                success: false,
                message: "Customer phone is required."
            });
        }


        if (!serviceCode) {

            return res.status(400).json({
                success: false,
                message: "Service is required."
            });
        }


        /*
         * --------------------------------------------------
         * FIND SERVICE
         * --------------------------------------------------
         */

        const [
            services
        ] = await connection.query(
            `
            SELECT
                id,
                service_code,
                name_en,
                name_ms
            FROM services
            WHERE service_code = ?
              AND active = TRUE
            LIMIT 1
            `,
            [serviceCode]
        );


        if (
            services.length === 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Selected service was not found."
            });
        }


        const service =
            services[0];


        /*
         * --------------------------------------------------
         * ANSWERS
         * --------------------------------------------------
         */

        const answers =
            safeJsonParse(
                req.body.service_answers
            );


        /*
         * --------------------------------------------------
         * FILES
         * --------------------------------------------------
         */

        const files =
            Array.isArray(req.files)
                ? req.files
                : [];


        /*
         * --------------------------------------------------
         * CREATE REQUEST
         * --------------------------------------------------
         */

        const requestId =
            uuid();

        const requestCode =
            generateRequestCode();


        await connection.beginTransaction();


        await connection.query(
            `
            INSERT INTO service_requests (
                id,
                request_code,
                service_id,
                customer_name,
                customer_phone,
                customer_email,
                customer_address,
                customer_notes,
                status
            )
            VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, 'pending'
            )
            `,
            [
                requestId,
                requestCode,
                service.id,
                customerName,
                customerPhone,
                customerEmail || null,
                customerAddress || null,
                customerNotes || null
            ]
        );


        /*
         * --------------------------------------------------
         * SAVE ANSWERS
         * --------------------------------------------------
         */

        for (
            const [questionCode, answer]
            of Object.entries(answers)
        ) {

            const [
                questions
            ] = await connection.query(
                `
                SELECT
                    id,
                    question_type,
                    unit
                FROM service_questions
                WHERE service_id = ?
                  AND question_code = ?
                  AND active = TRUE
                LIMIT 1
                `,
                [
                    service.id,
                    questionCode
                ]
            );


            if (
                questions.length === 0
            ) {

                console.warn(
                    `Unknown question ignored: ${questionCode}`
                );

                continue;
            }


            const question =
                questions[0];


            const answerId =
                uuid();


            let textValue = null;

            let numberValue = null;


            /*
             * Counter / number / measurement
             */

            if (
                question.question_type ===
                    "number" ||
                question.question_type ===
                    "measurement"
            ) {

                const numeric =
                    Number(answer);

                if (
                    Number.isFinite(numeric)
                ) {
                    numberValue =
                        numeric;
                }

            } else if (
                question.question_type ===
                "counter"
            ) {

                /*
                 * Counters can contain multiple
                 * values, so store them as JSON.
                 */

                textValue =
                    JSON.stringify(answer);

            } else {

                /*
                 * Single, multi, text,
                 * textarea, file, etc.
                 */

                if (
                    typeof answer ===
                    "object"
                ) {

                    textValue =
                        JSON.stringify(
                            answer
                        );

                } else {

                    textValue =
                        String(answer ?? "");
                }
            }


            await connection.query(
                `
                INSERT INTO request_answers (
                    id,
                    request_id,
                    question_id,
                    question_type,
                    text_value,
                    number_value,
                    unit
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    answerId,
                    requestId,
                    question.id,
                    question.question_type,
                    textValue,
                    numberValue,
                    question.unit || null
                ]
            );


            /*
             * ------------------------------------------------
             * MULTI / OPTION ANSWERS
             * ------------------------------------------------
             */

            if (
    question.question_type === "single" ||
    question.question_type === "multi"
) {

    const values =
        Array.isArray(answer)
            ? answer
            : [answer];

    for (const value of values) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            continue;
        }

        const [options] =
            await connection.query(
                `
                SELECT
                    id,
                    option_value,
                    label_en,
                    label_ms
                FROM question_options
                WHERE question_id = ?
                  AND option_value = ?
                  AND active = TRUE
                LIMIT 1
                `,
                [
                    question.id,
                    String(value)
                ]
            );

        if (options.length === 0) {
            continue;
        }

        const option = options[0];

        await connection.query(
            `
            INSERT INTO request_answer_options (
                id,
                answer_id,
                option_id,
                option_value,
                option_label_en,
                option_label_ms
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                uuid(),
                answerId,
                option.id,
                option.option_value,
                option.label_en,
                option.label_ms
            ]
        );
    }
}{

                const values =
                    Array.isArray(answer)
                        ? answer
                        : [answer];


                for (
                    const value of values
                ) {

                    if (
                        value === null ||
                        value === undefined ||
                        value === ""
                    ) {
                        continue;
                    }


                    const [
                        options
                    ] = await connection.query(
                        `
                        SELECT id
                        FROM question_options
                        WHERE question_id = ?
                          AND option_value = ?
                          AND active = TRUE
                        LIMIT 1
                        `,
                        [
                            question.id,
                            String(value)
                        ]
                    );


                    if (
                        options.length === 0
                    ) {
                        continue;
                    }


                    const selectedOption = options[0];

await connection.query(
    `
    SELECT
        option_value,
        label_en,
        label_ms
    FROM question_options
    WHERE id = ?
    LIMIT 1
    `,
    [selectedOption.id]
);

const [optionDetails] =
    await connection.query(
        `
        SELECT
            option_value,
            label_en,
            label_ms
        FROM question_options
        WHERE id = ?
        LIMIT 1
        `,
        [selectedOption.id]
    );

if (optionDetails.length > 0) {

    const option =
        optionDetails[0];

    await connection.query(
        `
        INSERT INTO request_answer_options (
            id,
            answer_id,
            option_id,
            option_value,
            option_label_en,
            option_label_ms
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
            uuid(),
            answerId,
            selectedOption.id,
            option.option_value,
            option.label_en,
            option.label_ms
        ]
    );
}
                }
            }
        }


        /*
         * --------------------------------------------------
         * SAVE PHOTOS
         * --------------------------------------------------
         */

        const uploadDirectory =
            path.join(
                __dirname,
                "../uploads/customer"
            );


        fs.mkdirSync(
            uploadDirectory,
            {
                recursive: true
            }
        );


        for (
            const file of files
        ) {

            const extension =
                path.extname(
                    file.originalname
                );


            const storedFileName =
                `${uuid()}${extension}`;


            const destination =
                path.join(
                    uploadDirectory,
                    storedFileName
                );


            /*
             * Multer memory storage gives us
             * file.buffer.
             */

            if (file.buffer) {

                fs.writeFileSync(
                    destination,
                    file.buffer
                );

            } else if (
                file.path
            ) {

                fs.renameSync(
                    file.path,
                    destination
                );
            }


            const databasePath =
                `/uploads/customer/${storedFileName}`;


            await connection.query(
                `
                INSERT INTO customer_photos (
                    id,
                    request_id,
                    file_name,
                    file_path
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    uuid(),
                    requestId,
                    file.originalname,
                    databasePath
                ]
            );
        }


        /*
         * --------------------------------------------------
         * STATUS HISTORY
         * --------------------------------------------------
         */

        /*
         * We will add the initial status-history
         * implementation after confirming the
         * exact status-history columns.
         */


        await connection.commit();


        /*
         * --------------------------------------------------
         * SUCCESS RESPONSE
         * --------------------------------------------------
         */

        return res.status(201).json({

            success: true,

            message:
                "Service request created successfully.",

            data: {

                id: requestId,

                request_code:
                    requestCode,

                service: {

                    id:
                        service.id,

                    code:
                        service.service_code,

                    name: {

                        en:
                            service.name_en,

                        ms:
                            service.name_ms
                    }
                },

                customer: {

                    name:
                        customerName,

                    phone:
                        customerPhone,

                    email:
                        customerEmail,

                    address:
                        customerAddress
                },

                status:
                    "pending",

                photo_count:
                    files.length
            }
        });


    } catch (error) {

        try {
            await connection.rollback();
        } catch {
            // Ignore rollback errors
        }


        console.error(
            "Create request error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to create service request.",

            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined
        });


    } finally {

        connection.release();
    }
}


module.exports = {
    createRequest
};