/**
 * HEALTH ROUTE
 *
 * GET /api/health          -> { ok: true }
 *   Used by hosting providers to check that the server is running.
 * GET /api/health/contact  -> is the contact form on, which settings are set
 *   Shows only "gesetzt" / "fehlt" per setting name, never a value.
 */

import { sendJson } from "../lib/http.js";

export function createHealthRoutes(config) {
    return {
        "GET /api/health": async (request, response) => sendJson(response, 200, { ok: true }),
        "GET /api/health/contact": async (request, response) => sendJson(response, 200, config.diagnostics)
    };
}
