/**
 * CONTACT FORM RULES  (shared between frontend and backend)
 *
 * PURPOSE:
 * One definition of the contact form fields, so the browser
 * and the server check the SAME rules.
 *
 * - Browser:  /frontend/scripts/modules/contact-form.js
 *             (quick feedback for visitors - can be bypassed!)
 * - Server:   /backend/src/routes/contact.js
 *             (the real check - always runs)
 *
 * SECURITY:
 * This file is PUBLIC (it is copied to the website).
 * It must only contain validation rules, never secrets.
 *
 * SAFE TO EDIT: labels, max lengths, topic options.
 * EDIT WITH CARE: field names (must match the HTML form in
 * /frontend/components/contact-form.html).
 */

export const CONTACT_TOPICS = [
    "Funnels & Landing Pages",
    "Creatives & Copy",
    "Design",
    "AI & Systems",
    "Something else"
];

export const CONTACT_FIELDS = {
    name: { label: "Name", required: true, maxLength: 120 },
    email: { label: "E-mail", required: true, maxLength: 200, type: "email" },
    company: { label: "Company", required: false, maxLength: 160 },
    topic: { label: "Topic", required: true, options: CONTACT_TOPICS },
    message: { label: "Message", required: true, minLength: 20, maxLength: 4000 },
    privacy: { label: "Privacy consent", required: true, type: "checkbox" }
};

// Simple, deliberately permissive e-mail check (the real test is the reply).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Checks submitted values.
 * @param {object} input  raw values (from the form or the request body)
 * @returns {{ valid: boolean, errors: object, values: object }}
 *          errors: { fieldName: "message for the visitor" }
 *          values: cleaned (trimmed) values
 */
export function validateContact(input = {}) {
    const errors = {};
    const values = {};

    for (const [name, rules] of Object.entries(CONTACT_FIELDS)) {
        const raw = input[name];

        if (rules.type === "checkbox") {
            const checked = raw === true || raw === "true" || raw === "on";
            values[name] = checked;
            if (rules.required && !checked) errors[name] = "Please confirm that you have read the privacy notice.";
            continue;
        }

        const value = typeof raw === "string" ? raw.trim() : "";
        values[name] = value;

        if (!value) {
            if (rules.required) errors[name] = `Please enter your ${rules.label.toLowerCase()}.`;
            continue;
        }
        if (rules.minLength && value.length < rules.minLength) {
            errors[name] = `Please write at least ${rules.minLength} characters.`;
        } else if (rules.maxLength && value.length > rules.maxLength) {
            errors[name] = `Please keep it under ${rules.maxLength} characters.`;
        } else if (rules.type === "email" && !EMAIL_PATTERN.test(value)) {
            errors[name] = "Please enter a valid e-mail address.";
        } else if (rules.options && !rules.options.includes(value)) {
            errors[name] = "Please choose one of the options.";
        }
    }

    return { valid: Object.keys(errors).length === 0, errors, values };
}
