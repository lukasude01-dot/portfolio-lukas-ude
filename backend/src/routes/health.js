/**
 * HEALTH ROUTE
 *
 * GET /api/health  -> { ok: true }
 *   Used by hosting providers to check that the server is running.
 *   Which settings are set is only written to the server log at startup,
 *   never answered over the internet.
 */

import { sendJson } from "../lib/http.js";

export function createHealthRoutes() {
    return {
        "GET /api/health": async (request, response) => sendJson(response, 200, { ok: true })
    };
}
