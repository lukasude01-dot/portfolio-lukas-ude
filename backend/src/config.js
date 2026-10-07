/**
 * BACKEND CONFIGURATION
 *
 * PURPOSE:
 * Reads all settings from ENVIRONMENT VARIABLES (never from code).
 * Locally they come from /backend/.env (copy .env.example -> .env).
 * On a hosting provider you enter them in its dashboard.
 *
 * SECURITY:
 * - Secrets (API keys, token secret) only exist here, on the server.
 * - .env is listed in .gitignore and must never be committed.
 * - In production the server refuses to start if a required
 *   secret is missing (better than running insecurely).
 *
 * All variables are explained in /backend/.env.example
 */

import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BACKEND_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readBoolean(value, fallback) {
    if (value === undefined || value === "") return fallback;
    return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function readNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : fallback;
}

function readList(value, fallback) {
    if (!value) return fallback;
    return value.split(",").map((item) => item.trim().replace(/\/+$/, "")).filter(Boolean);
}

export function loadConfig(env = process.env) {
    const isProduction = env.NODE_ENV === "production";
    const port = readNumber(env.PORT, 3000);
    const problems = [];

    let formTokenSecret = env.FORM_TOKEN_SECRET;
    if (!formTokenSecret || formTokenSecret.length < 32) {
        if (isProduction) {
            problems.push("FORM_TOKEN_SECRET is missing or shorter than 32 characters.");
        } else {
            // Development only: a random secret that changes on every restart.
            formTokenSecret = crypto.randomBytes(32).toString("hex");
        }
    }

    const delivery = (env.CONTACT_DELIVERY || "log").toLowerCase();
    if (!["log", "resend", "webhook"].includes(delivery)) {
        problems.push(`CONTACT_DELIVERY must be "log", "resend" or "webhook" (got "${delivery}").`);
    }
    if (delivery === "resend" && (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL)) {
        problems.push('CONTACT_DELIVERY="resend" needs RESEND_API_KEY, CONTACT_TO_EMAIL and CONTACT_FROM_EMAIL.');
    }
    if (delivery === "webhook" && !env.CONTACT_WEBHOOK_URL) {
        problems.push('CONTACT_DELIVERY="webhook" needs CONTACT_WEBHOOK_URL.');
    }
    if (isProduction && delivery === "log") {
        problems.push('CONTACT_DELIVERY="log" only prints messages to the server log. Choose "resend" or "webhook" for production.');
    }

    const config = {
        isProduction,
        host: env.HOST || "0.0.0.0",
        port,
        allowedOrigins: readList(env.ALLOWED_ORIGINS, [`http://localhost:${port}`, `http://127.0.0.1:${port}`]),
        trustProxy: readBoolean(env.TRUST_PROXY, false),

        serveFrontend: readBoolean(env.SERVE_FRONTEND, true),
        frontendDist: path.resolve(BACKEND_DIR, env.FRONTEND_DIST || "../frontend/dist"),

        formTokenSecret,
        formMinSeconds: readNumber(env.FORM_MIN_SECONDS, 3),
        formMaxAgeMinutes: readNumber(env.FORM_MAX_AGE_MINUTES, 120),

        rateLimit: {
            max: readNumber(env.RATE_LIMIT_MAX, 5),
            windowMs: readNumber(env.RATE_LIMIT_WINDOW_MINUTES, 15) * 60 * 1000
        },

        contact: {
            delivery,
            toEmail: env.CONTACT_TO_EMAIL || "",
            fromEmail: env.CONTACT_FROM_EMAIL || "",
            resendApiKey: env.RESEND_API_KEY || "",
            webhookUrl: env.CONTACT_WEBHOOK_URL || "",
            webhookSecret: env.CONTACT_WEBHOOK_SECRET || ""
        }
    };

    return { config, problems };
}
