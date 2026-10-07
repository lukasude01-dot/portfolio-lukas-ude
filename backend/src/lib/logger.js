/**
 * SERVER LOGGER
 *
 * PURPOSE:
 * Readable, traceable log messages – ONLY on the server.
 * Visitors never see these details; they get a generic message.
 *
 * FORMAT:
 *   [CONTACT FORM] Failed to submit contact request.
 *     Module: backend/routes/contact
 *     Reason: Email provider unavailable.
 *
 * SECURITY:
 * Never log secrets (API keys) or full message texts.
 */

function format(level, { area, message, module, reason, ...context }) {
    const lines = [`${new Date().toISOString()} ${level} [${area}] ${message}`];
    if (module) lines.push(`  Module: ${module}`);
    if (reason) lines.push(`  Reason: ${reason}`);
    for (const [key, value] of Object.entries(context)) {
        if (value !== undefined) lines.push(`  ${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`);
    }
    return lines.join("\n");
}

export const logger = {
    info(entry) {
        console.log(format("INFO ", entry));
    },
    warn(entry) {
        console.warn(format("WARN ", entry));
    },
    error(entry) {
        console.error(format("ERROR", entry));
    }
};
