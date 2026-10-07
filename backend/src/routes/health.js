/**
 * HEALTH ROUTE
 *
 * GET /api/health -> { ok: true }
 * Used by hosting providers to check that the server is running.
 * Deliberately reveals nothing about versions or configuration.
 */

import { sendJson } from "../lib/http.js";

export function createHealthRoutes() {
    return {
        "GET /api/health": async (request, response) => sendJson(response, 200, { ok: true })
    };
}
