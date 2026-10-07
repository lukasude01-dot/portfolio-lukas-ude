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

            if (pathname.startsWith("/api/")) return sendJson(response, 404, { ok: false, error: "Not found." });

            if (serveStatic && (request.method === "GET" || request.method === "HEAD")) return serveStatic(request, response);

            return sendJson(response, 404, { ok: false, error: "Not found." });
        } catch (error) {
            if (error instanceof HttpError) {
                logger.warn({ area: "SERVER", message: `${request.method} ${pathname} rejected.`, reason: error.message });
                return sendJson(response, error.status, { ok: false, error: error.publicMessage });
            }
            // Unexpected error: full details in the log, generic message for visitors.
            logger.error({ area: "SERVER", message: `Unexpected error in ${request.method} ${pathname}.`, module: "backend/server", reason: error.stack || error.message });
            if (!response.headersSent) sendJson(response, 500, { ok: false, error: "Something went wrong. Please try again." });
            else response.end();
        }
    };

    handler.close = () => rateLimiter.stop();
    return handler;
}

// Start the server only when this file is run directly (not in tests).
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
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
}
