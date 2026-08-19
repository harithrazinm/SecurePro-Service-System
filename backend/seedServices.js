require("dotenv").config();

const mysql = require("mysql2/promise");
const crypto = require("crypto");

const services = require("./data/services");

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "securepro",
    password: process.env.DB_PASSWORD || "securepro123",
    database: process.env.DB_NAME || "securepro",
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
});


function uuid() {
    return crypto.randomUUID();
}


function text(value, language) {

    if (!value) {
        return null;
    }

    if (typeof value === "string") {
        return value;
    }

    return value[language] ||
           value.en ||
           value.ms ||
           null;
}


function cleanCode(value) {

    return String(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}


function getCategory(service) {

    if (
        service.category === "support"
    ) {
        return "support";
    }

    if (
        service.id === "troubleshoot_repair"
    ) {
        return "support";
    }

    return "installation";
}


async function seed() {

    const connection =
        await pool.getConnection();

    try {

        await connection.beginTransaction();

        console.log("");
        console.log("==========================================");
        console.log(" SecurePro Service Database Seeder");
        console.log("==========================================");
        console.log("");


        /*
         * ==========================================
         * CLEAR EXISTING SERVICE DATA
         * ==========================================
         *
         * This is safe for the current empty database.
         *
         * It removes only:
         * - question options
         * - service questions
         * - services
         *
         * It does NOT remove customer requests.
         */

        await connection.query(
            "DELETE FROM question_options"
        );

        await connection.query(
            "DELETE FROM service_questions"
        );

        await connection.query(
            "DELETE FROM services"
        );


        let serviceOrder = 0;

        let totalQuestions = 0;

        let totalOptions = 0;


        /*
         * ==========================================
         * SERVICES
         * ==========================================
         */

        for (
            const [serviceCode, service]
            of Object.entries(services)
        ) {

            const serviceId =
                uuid();

            const nameEn =
                text(
                    service.name,
                    "en"
                ) ||
                serviceCode;

            const nameMs =
                text(
                    service.name,
                    "ms"
                ) ||
                nameEn;

            const descriptionEn =
                text(
                    service.description,
                    "en"
                );

            const descriptionMs =
                text(
                    service.description,
                    "ms"
                );


            await connection.query(
                `
                INSERT INTO services (
                    id,
                    service_code,
                    name_en,
                    name_ms,
                    description_en,
                    description_ms,
                    category,
                    active,
                    display_order
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    serviceId,
                    serviceCode,
                    nameEn,
                    nameMs,
                    descriptionEn,
                    descriptionMs,
                    getCategory(service),
                    true,
                    serviceOrder
                ]
            );


            console.log(
                `✓ Service: ${serviceCode}`
            );


            /*
             * ======================================
             * QUESTIONS
             * ======================================
             */

            const questions =
                Array.isArray(
                    service.questions
                )
                    ? service.questions
                    : [];


            for (
                let questionIndex = 0;
                questionIndex < questions.length;
                questionIndex++
            ) {

                const question =
                    questions[questionIndex];

                const questionId =
                    uuid();

                const questionCode =
                    cleanCode(
                        question.id ||
                        `question_${questionIndex + 1}`
                    );


                /*
                 * Some frontend question types
                 * need to map to the SQL ENUM.
                 */

                let questionType =
                    question.type || "single";


                const allowedTypes = [
                    "single",
                    "multi",
                    "number",
                    "measurement",
                    "counter",
                    "text",
                    "textarea",
                    "file"
                ];


                if (
                    !allowedTypes.includes(
                        questionType
                    )
                ) {

                    questionType =
                        "text";
                }


                await connection.query(
                    `
                    INSERT INTO service_questions (
                        id,
                        service_id,
                        question_code,
                        question_type,
                        title_en,
                        title_ms,
                        description_en,
                        description_ms,
                        placeholder_en,
                        placeholder_ms,
                        unit,
                        min_value,
                        max_value,
                        step_value,
                        required,
                        display_order,
                        active
                    )
                    VALUES (
                        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?, ?, ?
                    )
                    `,
                    [
                        questionId,

                        serviceId,

                        questionCode,

                        questionType,

                        text(
                            question.title,
                            "en"
                        ) || questionCode,

                        text(
                            question.title,
                            "ms"
                        ) ||
                        text(
                            question.title,
                            "en"
                        ) ||
                        questionCode,

                        text(
                            question.description,
                            "en"
                        ),

                        text(
                            question.description,
                            "ms"
                        ),

                        text(
                            question.placeholder,
                            "en"
                        ),

                        text(
                            question.placeholder,
                            "ms"
                        ),

                        question.unit || null,

                        question.min_value ??
                            null,

                        question.max_value ??
                            null,

                        question.step_value ??
                            null,

                        question.required !== false,

                        questionIndex,

                        true
                    ]
                );


                totalQuestions++;


                /*
                 * ==================================
                 * QUESTION OPTIONS
                 * ==================================
                 */

                const options =
                    Array.isArray(
                        question.options
                    )
                        ? question.options
                        : [];


                for (
                    let optionIndex = 0;
                    optionIndex < options.length;
                    optionIndex++
                ) {

                    const option =
                        options[optionIndex];


                    await connection.query(
                        `
                        INSERT INTO question_options (
                            id,
                            question_id,
                            option_value,
                            label_en,
                            label_ms,
                            description_en,
                            description_ms,
                            display_order,
                            active
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `,
                        [
                            uuid(),

                            questionId,

                            String(
                                option.value
                            ),

                            text(
                                option.label,
                                "en"
                            ) ||
                            String(
                                option.value
                            ),

                            text(
                                option.label,
                                "ms"
                            ) ||
                            text(
                                option.label,
                                "en"
                            ) ||
                            String(
                                option.value
                            ),

                            text(
                                option.description,
                                "en"
                            ),

                            text(
                                option.description,
                                "ms"
                            ),

                            optionIndex,

                            true
                        ]
                    );


                    totalOptions++;
                }


                /*
                 * ==================================
                 * COUNTER QUESTIONS
                 * ==================================
                 *
                 * The database stores the main counter
                 * question. Individual counters are
                 * currently represented in the question
                 * definition.
                 *
                 * We keep the complete counter structure
                 * available in the frontend services.js.
                 */

                if (
                    questionType === "counter" &&
                    Array.isArray(
                        question.counters
                    )
                ) {

                    console.log(
                        `  ↳ ${question.counters.length} counters`
                    );
                }
            }


            serviceOrder++;
        }


        await connection.commit();


        console.log("");
        console.log("==========================================");
        console.log(" Database Seed Completed");
        console.log("==========================================");
        console.log(
            `Services: ${serviceOrder}`
        );
        console.log(
            `Questions: ${totalQuestions}`
        );
        console.log(
            `Options: ${totalOptions}`
        );
        console.log("==========================================");
        console.log("");


    } catch (error) {

        await connection.rollback();

        console.error("");
        console.error(
            "❌ Database seed failed:"
        );
        console.error(error);
        console.error("");

        process.exitCode = 1;

    } finally {

        connection.release();

        await pool.end();
    }
}


seed();
