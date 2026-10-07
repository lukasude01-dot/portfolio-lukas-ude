/**
 * HTML HELPERS  (used by the build only, never shipped to browsers)
 *
 * PURPOSE:
 * Safely turns content (text from /content/*.json) into HTML.
 *
 * WHY THIS EXISTS (security - "output encoding"):
 * Content text could contain characters like < > " & that
 * would break the page or inject code. `html` escapes every
 * value automatically, unless you explicitly mark trusted HTML
 * with `raw()`.
 *
 * USAGE:
 *   html`<h2>${project.title}</h2>`        -> title is escaped
 *   html`<div>${raw(otherHtml)}</div>`     -> otherHtml inserted as-is
 *   html`<ul>${items.map(i => html`<li>${i}</li>`)}</ul>`  -> lists work
 */

const ESCAPE_MAP = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
};

/** Escape a value for use in HTML text or attributes. */
export function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value).replace(/[&<>"']/g, (character) => ESCAPE_MAP[character]);
}

/** Marks a string as trusted HTML so `html` does not escape it. */
class TrustedHtml {
    constructor(value) {
        this.value = value;
    }
    toString() {
        return this.value;
    }
}

export function raw(value) {
    return new TrustedHtml(value ?? "");
}

function renderValue(value) {
    if (value === null || value === undefined || value === false) return "";
    if (value instanceof TrustedHtml) return value.value;
    if (Array.isArray(value)) return value.map(renderValue).join("");
    return escapeHtml(value);
}

/** Tagged template: escapes every interpolated value. Returns trusted HTML. */
export function html(strings, ...values) {
    let output = strings[0];
    values.forEach((value, index) => {
        output += renderValue(value) + strings[index + 1];
    });
    return raw(output);
}

/** Only allow safe link targets in content (blocks "javascript:" links). */
export function safeUrl(url) {
    if (!url) return "";
    const value = String(url).trim();
    if (/^(https?:|mailto:|tel:|\/|#)/i.test(value)) return value;
    return "#";
}
