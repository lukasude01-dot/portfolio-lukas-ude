/**
 * CONTACT ROUTES
 *
 * GET  /api/contact/token   -> issues a short-lived anti-spam token
 * POST /api/contact         -> validates and delivers a message
 *
 * CHECKS (in this order) for POST:
 *   1. Origin check (only our own website may send – CSRF)
 *   2. Rate limit per IP (RATE_LIMIT_MAX per RATE_LIMIT_WINDOW_MINUTES)
 *   3. JSON body, max 16 KB
 *   4. Honeypot field "website" must be empty (bots fill it)
 *   5. Valid form token (signed, not too fast, not too old, unused)
 *   6. Field validation – same rules as the browser
 *      (/shared/contact-schema.js)
 *   7. Delivery (/backend/src/services/email.js)
 *
 * ERRORS:
 * Visitors only get short, generic messages. Details are written
 * to the server log with module + reason.
 */

import { validateContact } from "../../../shared/contact-schema.js";
import { readJsonBody, sendJson, getClientIp, isAllowedOrigin } from "../lib/http.js";

const MODULE = "backend/routes/contact";

export function createContactRoutes({ config, logger, rateLimiter, formTokens, deliver }) {

    async function issueToken(request, response) {
        sendJson(response, 200, { token: formTokens.issue() });
    }

    async function submit(request, response) {
        const ip = getClientIp(request, config.trustProxy);

        if (!isAllowedOrigin(request, config.allowedOrigins)) {
            logger.warn({ area: "CONTACT FORM", message: "Rejected request from a foreign origin.", module: MODULE, origin: request.headers.origin || "(none)" });
            return sendJson(response, 403, { ok: false, error: "Anfrage nicht erlaubt." });
        }

        const limit = rateLimiter.check(ip);
        if (!limit.allowed) {
            logger.warn({ area: "CONTACT FORM", message: "Rate limit reached.", module: MODULE, ip });
            return sendJson(response, 429, { ok: false, error: "Zu viele Anfragen. Bitte versuche es später noch einmal." }, { "Retry-After": String(limit.retryAfterSeconds) });
        }

        const body = await readJsonBody(request);

        // Honeypot: pretend success so bots learn nothing.
        if (typeof body.website === "string" && body.website.trim() !== "") {
            logger.warn({ area: "CONTACT FORM", message: "Honeypot filled – message discarded.", module: MODULE, ip });
            return sendJson(response, 200, { ok: true });
        }

        const token = formTokens.verify(body.token);
        if (!token.valid) {
            logger.warn({ area: "CONTACT FORM", message: "Invalid form token.", module: MODULE, reason: token.reason, ip });
            return sendJson(response, 400, { ok: false, error: "Deine Nachricht konnte nicht gesendet werden. Bitte versuche es noch einmal." });
        }

        const { valid, errors, values } = validateContact(body);
        if (!valid) {
            return sendJson(response, 422, { ok: false, error: "Bitte prüfe die markierten Felder.", errors });
        }

        try {
            await deliver({ name: values.name, email: values.email, company: values.company, topic: values.topic, message: values.message });
        } catch (error) {
            logger.error({ area: "CONTACT FORM", message: "Failed to submit contact request.", module: MODULE, reason: error.message, delivery: config.contact.delivery });
            return sendJson(response, 502, { ok: false, error: "Deine Nachricht konnte nicht gesendet werden. Bitte versuche es noch einmal." });
        }

        logger.info({ area: "CONTACT FORM", message: "Contact request delivered.", module: MODULE, delivery: config.contact.delivery });
        return sendJson(response, 200, { ok: true });
    }

    return {
        "GET /api/contact/token": issueToken,
        "POST /api/contact": submit
    };
}

