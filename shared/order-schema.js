/**
 * ORDER RULES  (shared between frontend and backend)
 *
 * PURPOSE:
 * One definition of the order request of the fly fishing shop
 * (flyfishing.lukasude.de/warenkorb/), so the browser and the server
 * check the SAME rules.
 *
 * - Browser:  /frontend/variants/flyfishing/scripts/flyfishing/cart.js
 * - Server:   /backend/src/routes/order.js (the real check, always runs)
 *
 * The order is a non-binding request. Prices always come from the
 * catalogue on the server (/content/flyfishing/*.json), never from
 * the browser.
 *
 * SECURITY: this file is PUBLIC (copied to the website). No secrets.
 */

export const ORDER_LIMITS = { maxItems: 30, maxQuantity: 50 };

export const ORDER_FIELDS = {
    name: { required: "Bitte gib deinen Namen ein.", maxLength: 120 },
    email: { required: "Bitte gib deine E-Mail-Adresse ein.", maxLength: 200, type: "email" },
    street: { required: "Bitte gib Straße und Hausnummer ein.", maxLength: 160, shippingOnly: true },
    zip: { required: "Bitte gib die Postleitzahl ein.", maxLength: 10, pattern: /^[0-9A-Za-z -]{4,10}$/, shippingOnly: true },
    city: { required: "Bitte gib den Ort ein.", maxLength: 120, shippingOnly: true },
    country: { required: "Bitte wähle ein Land.", options: ["Deutschland", "Österreich", "Schweiz"], shippingOnly: true },
    message: { required: false, maxLength: 2000 },
    privacy: { required: "Bitte bestätige, dass du die Datenschutzhinweise gelesen hast.", type: "checkbox" }
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ID_PATTERN = /^[a-z0-9-]{1,80}$/;

/**
 * @param {object} input   { ...fields, items: [{ id, quantity }] }
 * @param {object} catalog { [id]: { name, kind: "fly" | "course", price? } }
 * @returns {{ valid, errors, values, items }}
 */
export function validateOrder(input = {}, catalog = {}) {
    const errors = {};
    const values = {};

    const rawItems = Array.isArray(input.items) ? input.items.slice(0, ORDER_LIMITS.maxItems) : [];
    const items = [];
    for (const raw of rawItems) {
        const id = typeof raw?.id === "string" ? raw.id : "";
        const quantity = Number(raw?.quantity);
        if (!ID_PATTERN.test(id) || !catalog[id]) continue;
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > ORDER_LIMITS.maxQuantity) continue;
        items.push({ id, quantity, ...catalog[id] });
    }
    if (!items.length) errors.items = "Dein Warenkorb ist leer.";

    const needsShipping = items.some((item) => item.kind === "fly");

    for (const [name, rules] of Object.entries(ORDER_FIELDS)) {
        const raw = input[name];
        if (rules.type === "checkbox") {
            values[name] = raw === true || raw === "true" || raw === "on";
            if (rules.required && !values[name]) errors[name] = rules.required;
            continue;
        }
        const value = typeof raw === "string" ? raw.trim() : "";
        values[name] = value;
        const required = rules.required && (!rules.shippingOnly || needsShipping);
        if (!value) {
            if (required) errors[name] = rules.required;
            continue;
        }
        if (rules.maxLength && value.length > rules.maxLength) errors[name] = `Bitte bleib unter ${rules.maxLength} Zeichen.`;
        else if (rules.type === "email" && !EMAIL_PATTERN.test(value)) errors[name] = "Bitte gib eine gültige E-Mail-Adresse ein.";
        else if (rules.pattern && !rules.pattern.test(value)) errors[name] = "Bitte prüfe die Eingabe.";
        else if (rules.options && !rules.options.includes(value)) errors[name] = "Bitte wähle eine der Optionen.";
    }

    return { valid: Object.keys(errors).length === 0, errors, values, items, needsShipping };
}
