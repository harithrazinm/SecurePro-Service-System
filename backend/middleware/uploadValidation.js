const path = require("path");

/**
 * Validate upload field name, MIME type and filename extension.
 * MIME type alone is client-controlled, so extension consistency
 * is checked as an additional guard before Cloudinary receives the file.
 */
function validateUploadFile(file, rules) {
    if (!file || !rules) {
        return {
            valid: false,
            message: "Invalid upload."
        };
    }

    if (rules.fields && !rules.fields.includes(file.fieldname)) {
        return {
            valid: false,
            message: "Unexpected upload field."
        };
    }

    const originalName = String(file.originalname || "");

    if (!originalName || originalName.length > 255) {
        return {
            valid: false,
            message: "Filename is invalid or too long."
        };
    }

    if (originalName.includes("\0")) {
        return {
            valid: false,
            message: "Filename contains invalid characters."
        };
    }

    const extension = path.extname(originalName).toLowerCase().replace(".", "");
    const rule = rules.byField
        ? rules.byField[file.fieldname]
        : rules;

    if (!rule) {
        return {
            valid: false,
            message: "This upload type is not allowed."
        };
    }

    const mimeAllowed = rule.mimes.includes(file.mimetype);
    const extensionAllowed = rule.extensions.includes(extension);

    if (!mimeAllowed || !extensionAllowed) {
        return {
            valid: false,
            message: rule.message
        };
    }

    return { valid: true };
}

module.exports = {
    validateUploadFile
};
