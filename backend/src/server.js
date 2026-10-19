/**
 * BACKEND SERVER  (entry point)
 *
 * START:
 *   npm start            (from /backend, reads /backend/.env if present)
 *   npm run dev          (from the project root: build + server)
 *
 * WHAT IT DOES:
 *   - /api/health              health check
 *   - /api/contact/token       anti-spam token for the contact form
 *   - /api/contact             receives contact messages
 *   - everything else          the built website (if SERVE_FRONTEND=true)
 *
 * Every response gets security headers (lib/security-headers.js).
 * No external packages are used – only Node.js built-ins.
 *
 * DO NOT EDIT WITHOUT TESTING.
 */

import http from "node:http";
import fs from "node:fs";
import { pathToFileURL } from "node:url";

import { loadConfig } from "./config.js";
import { logger } from "./lib/logger.js";
import { createSecurityHeaders } from "./lib/security-headers.js";
import { createRateLimiter } from "./lib/rate-limit.js";
import { createFormTokens } from "./lib/form-token.js";
import { sendJson, HttpError } from "./lib/http.js";
import { createStaticHandler } from "./lib/static-files.js";
import { createContactDelivery } from "./services/email.js";
import { createContactRoutes } from "./routes/contact.js";
import { createHealthRoutes } from "./routes/health.js";

/**
 * Creates the request handler. Separate from listen() so that the
 * tests in /backend/test can use it without opening a port.
 */
export function createApp(config, { deliver } = {}) {
    const securityHeaders = createSecurityHeaders(config);
    const rateLimiter = createRateLimiter(config.rateLimit);
    const formTokens = createFormTokens({ secret: config.formTokenSecret, minSeconds: config.formMinSeconds, maxAgeMinutes: config.formMaxAgeMinutes });

    const routes = {
        ...createHealthRoutes(),
        ...createContactRoutes({ config, logger, rateLimiter, formTokens, deliver: deliver || createContactDelivery({ config, logger }) })
    };

    const serveStatic = config.serveFrontend && fs.existsSync(config.frontendDist)
        ? createStaticHandler({ root: config.frontendDist, isProduction: config.isProduction })
        : null;

    if (config.serveFrontend && !serveStatic) {
        logger.warn({ area: "SERVER", message: "SERVE_FRONTEND is on, but the website is not built yet.", reason: `${config.frontendDist} does not exist. Run "npm run build".` });
    }

    const handler = async (request, response) => {
        for (const [name, value] of Object.entries(securityHeaders)) response.setHeader(name, value);

        const { pathname } = new URL(request.url, "http://localhost");
        const route = routes[`${request.method} ${pathname}`];

        try {
            if (route) return await route(request, response);

            if (pathname.startsWith("/api/")) return sendJson(response, 404, { ok: false, error: "Nicht gefunden." });

            if (serveStatic && (request.method === "GET" || request.method === "HEAD")) return serveStatic(request, response);

            // Website should be served but is not built: say so instead of an empty 404.
            if (config.serveFrontend && (request.method === "GET" || request.method === "HEAD")) {
                response.writeHead(503, { "Content-Type": "text/html; charset=utf-8", "Retry-After": "120" });
                return response.end(MAINTENANCE_PAGE);
            }

            return sendJson(response, 404, { ok: false, error: "Nicht gefunden." });
        } catch (error) {
            if (error instanceof HttpError) {
                logger.warn({ area: "SERVER", message: `${request.method} ${pathname} rejected.`, reason: error.message });
                return sendJson(response, error.status, { ok: false, error: error.publicMessage });
            }
            // Unexpected error: full details in the log, generic message for visitors.
            logger.error({ area: "SERVER", message: `Unexpected error in ${request.method} ${pathname}.`, module: "backend/server", reason: error.stack || error.message });
            if (!response.headersSent) sendJson(response, 500, { ok: false, error: "Etwas ist schiefgelaufen. Bitte versuche es noch einmal." });
            else response.end();
        }
    };

    handler.close = () => rateLimiter.stop();
    return handler;
}

// Shown only if the website files are missing (build step did not run)
const MAINTENANCE_PAGE = `<!doctype html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Lukas Ude</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#EEEAE0;color:#090A09;font:16px/1.6 system-ui,sans-serif;text-align:center;padding:24px}h1{font-size:1.6rem;margin:0 0 .5rem}p{margin:0;color:#5a5a55}</style></head>
<body><main><h1>Die Website wird gerade aktualisiert.</h1><p>Bitte versuche es in wenigen Minuten noch einmal.</p></main></body>
</html>`;

/**
 * Starts the HTTP server with the configuration from the environment.
 * Called below when this file is run directly, or by /server.cjs
 * (the entry file for hosts like Hostinger).
 */
export function startServer() {
    const { config, problems } = loadConfig();

    if (problems.length) {
        const log = config.isProduction ? logger.error : logger.warn;
        log({ area: "CONFIG", message: "Configuration problems found:", module: "backend/config", reason: problems.join(" | ") });
        if (config.isProduction) process.exit(1);
    }
    if (!process.env.FORM_TOKEN_SECRET && !config.isProduction) {
        logger.warn({ area: "CONFIG", message: "FORM_TOKEN_SECRET not set – using a temporary development secret." });
    }

    const server = http.createServer(createApp(config));
    server.headersTimeout = 15_000;
    server.requestTimeout = 20_000;

    server.listen(config.port, config.host, () => {
        logger.info({ area: "SERVER", message: `Running on http://localhost:${config.port}`, delivery: config.contact.delivery, frontend: config.serveFrontend ? config.frontendDist : "not served" });
    });

    const shutdown = () => server.close(() => process.exit(0));
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
    return server;
}

// Start the server only when this file is run directly (not in tests).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    startServer();
}
