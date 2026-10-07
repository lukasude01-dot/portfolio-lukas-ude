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
 * SAFE TO EDIT: labels, messages, max lengths, topic options.
 * EDIT WITH CARE: field names (must match the HTML form in
 * /frontend/components/contact-form.html).
 */

export const CONTACT_TOPICS = [
    "Funnels & Landingpages",
    "Creatives & Copy",
    "Design",
    "KI & Systeme",
    "Etwas anderes"
];

// "required" = message when the field is empty
export const CONTACT_FIELDS = {
    name: { label: "Name", required: "Bitte gib deinen Namen ein.", maxLength: 120 },
    email: { label: "E-Mail", required: "Bitte gib deine E-Mail-Adresse ein.", maxLength: 200, type: "email" },
    company: { label: "Unternehmen", required: false, maxLength: 160 },
    topic: { label: "Thema", required: "Bitte wähle ein Thema.", options: CONTACT_TOPICS },
    message: { label: "Nachricht", required: "Bitte schreib mir eine kurze Nachricht.", minLength: 20, maxLength: 4000 },
    privacy: { label: "Datenschutz", required: "Bitte bestätige, dass du die Datenschutzhinweise gelesen hast.", type: "checkbox" }
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
            if (rules.required && !checked) errors[name] = rules.required;
            continue;
        }

        const value = typeof raw === "string" ? raw.trim() : "";
        values[name] = value;

        if (!value) {
            if (rules.required) errors[name] = rules.required;
            continue;
        }
        if (rules.minLength && value.length < rules.minLength) {
            errors[name] = `Bitte schreib mindestens ${rules.minLength} Zeichen.`;
        } else if (rules.maxLength && value.length > rules.maxLength) {
            errors[name] = `Bitte bleib unter ${rules.maxLength} Zeichen.`;
        } else if (rules.type === "email" && !EMAIL_PATTERN.test(value)) {
            errors[name] = "Bitte gib eine gültige E-Mail-Adresse ein.";
        } else if (rules.options && !rules.options.includes(value)) {
            errors[name] = "Bitte wähle eine der Optionen.";
        }
    }

    return { valid: Object.keys(errors).length === 0, errors, values };
}
