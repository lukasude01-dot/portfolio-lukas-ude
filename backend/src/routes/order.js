/**
 * ORDER ROUTE  (shop of flyfishing.lukasude.de)
 *
 * POST /api/order  -> validates the cart and sends it as an order request
 *
 * The order is a NON-BINDING request: Lukas replies with price, shipping
 * and dates. Online payment is added later (see /docs/FLYFISHING.md).
 *
 * CHECKS: the same as the contact form (origin, rate limit, honeypot,
 * form token), then /shared/order-schema.js against the catalogue
 * (/backend/src/services/catalog.js). Delivery uses the contact mail.
 */

import { validateOrder } from "../../../shared/order-schema.js";
import { readJsonBody, sendJson, getClientIp, isAllowedOrigin } from "../lib/http.js";

const MODULE = "backend/routes/order";

function orderText({ values, items, needsShipping }) {
    return [
        "Bestellanfrage aus dem Shop (unverbindlich)",
        "",
        ...items.map((item) => `${item.quantity} x ${item.name}${item.price ? ` (${item.price})` : " (Preis auf Anfrage)"}`),
        "",
        needsShipping ? `Lieferadresse: ${values.street}, ${values.zip} ${values.city}, ${values.country}` : "Keine Lieferung nötig (nur Kurse).",
        "",
        values.message ? `Nachricht:\n${values.message}` : "Keine Nachricht."
    ].join("\n");
}

export function createOrderRoutes({ config, logger, rateLimiter, formTokens, deliver, catalog }) {

    async function submit(request, response) {
        const ip = getClientIp(request, config.trustProxy);

        if (!config.contact.enabled) {
            logger.error({ area: "ORDER", message: "Orders are switched off: the mail settings are incomplete.", module: MODULE });
            return sendJson(response, 503, { ok: false, error: "Bestellungen sind gerade nicht möglich. Bitte schreib mir direkt eine E-Mail." });
        }
        if (!isAllowedOrigin(request, config.allowedOrigins, config.trustProxy)) {
            logger.warn({ area: "ORDER", message: "Rejected request from a foreign origin.", module: MODULE, origin: request.headers.origin || "(none)" });
            return sendJson(response, 403, { ok: false, error: "Anfrage nicht erlaubt." });
        }
        const limit = rateLimiter.check(ip);
        if (!limit.allowed) {
            logger.warn({ area: "ORDER", message: "Rate limit reached.", module: MODULE, ip });
            return sendJson(response, 429, { ok: false, error: "Zu viele Anfragen. Bitte versuche es später noch einmal." }, { "Retry-After": String(limit.retryAfterSeconds) });
        }

        const body = await readJsonBody(request);
        if (typeof body.website === "string" && body.website.trim() !== "") {
            logger.warn({ area: "ORDER", message: "Honeypot filled – order discarded.", module: MODULE, ip });
            return sendJson(response, 200, { ok: true });
        }
        const token = formTokens.verify(body.token);
        if (!token.valid) {
            logger.warn({ area: "ORDER", message: "Invalid form token.", module: MODULE, reason: token.reason, ip });
            return sendJson(response, 400, { ok: false, error: "Deine Anfrage konnte nicht gesendet werden. Bitte versuche es noch einmal." });
        }

        const result = validateOrder(body, catalog);
        if (!result.valid) return sendJson(response, 422, { ok: false, error: "Bitte prüfe die markierten Felder.", errors: result.errors });

        try {
            await deliver({
                name: result.values.name,
                email: result.values.email,
                company: "",
                topic: "Fly Fishing: Bestellanfrage",
                message: orderText(result)
            });
        } catch (error) {
            logger.error({ area: "ORDER", message: "Failed to send order request.", module: MODULE, reason: error.message });
            return sendJson(response, 502, { ok: false, error: "Deine Anfrage konnte nicht gesendet werden. Bitte versuche es noch einmal." });
        }

        logger.info({ area: "ORDER", message: "Order request delivered.", module: MODULE, items: result.items.length });
        return sendJson(response, 200, { ok: true });
    }

    return { "POST /api/order": submit };
}
