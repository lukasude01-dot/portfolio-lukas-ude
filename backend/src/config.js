/**
 * BACKEND CONFIGURATION
 *
 * PURPOSE:
 * Reads all settings from ENVIRONMENT VARIABLES (never from code).
 * Locally they come from /backend/.env (copy .env.example -> .env).
 * On a hosting provider you enter them in its dashboard.
 *
 * SECURITY:
 * - Secrets (mailbox password, token secret) only exist here, on the server.
 * - .env is listed in .gitignore and must never be committed.
 * - If a setting for the contact form is missing, the website still
 *   runs, but the contact form is switched off (and the log says why).
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

// TRUST_PROXY: false/0 = no proxy, true = one proxy, a number = that many proxies.
function readProxyHops(value) {
    const number = Number(value);
    if (Number.isInteger(number) && number >= 0) return number;
    return readBoolean(value, false) ? 1 : 0;
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
        if (isProduction) problems.push("FORM_TOKEN_SECRET is missing or shorter than 32 characters (a temporary one is used).");
        // A random secret that changes on every restart. Safe, but open
        // forms stop working after a restart, so set a fixed one in production.
        formTokenSecret = crypto.randomBytes(32).toString("hex");
    }
    const problemsBeforeDelivery = problems.length;

    const delivery = (env.CONTACT_DELIVERY || "log").toLowerCase();
    if (!["log", "smtp", "webhook"].includes(delivery)) {
        problems.push(`CONTACT_DELIVERY must be "log", "smtp" or "webhook" (got "${delivery}").`);
    }
    if (delivery === "smtp" && (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD || !env.CONTACT_TO_EMAIL)) {
        problems.push('CONTACT_DELIVERY="smtp" needs SMTP_HOST, SMTP_USER, SMTP_PASSWORD and CONTACT_TO_EMAIL.');
    }
    if (delivery === "webhook" && !env.CONTACT_WEBHOOK_URL) {
        problems.push('CONTACT_DELIVERY="webhook" needs CONTACT_WEBHOOK_URL.');
    }
    if (isProduction && delivery === "log") {
        problems.push('CONTACT_DELIVERY="log" only prints messages to the server log. Choose "smtp" or "webhook" for production.');
    }

    // The contact form only runs when its delivery is configured completely.
    const contactEnabled = problems.length === problemsBeforeDelivery;

    // Diagnosis for the server log: which settings are present. Never contains values.
    const isSet = (name) => Boolean(env[name] && String(env[name]).trim());
    const diagnostics = {
        contactForm: contactEnabled ? "on" : "off",
        CONTACT_DELIVERY: ["log", "smtp", "webhook"].includes(delivery) ? (isSet("CONTACT_DELIVERY") ? delivery : "fehlt (log)") : "ungültiger Wert",
        ...Object.fromEntries(["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "CONTACT_TO_EMAIL", "FORM_TOKEN_SECRET", "NODE_ENV", "TRUST_PROXY"]
            .map((name) => [name, isSet(name) ? "gesetzt" : "fehlt"]))
    };

    const config = {
        diagnostics,
        isProduction,
        host: env.HOST || "0.0.0.0",
        port,
        allowedOrigins: readList(env.ALLOWED_ORIGINS, [`http://localhost:${port}`, `http://127.0.0.1:${port}`]),
        trustProxy: readProxyHops(env.TRUST_PROXY),

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
            enabled: contactEnabled,
            delivery,
            toEmail: env.CONTACT_TO_EMAIL || "",
            // Most providers only accept the mailbox itself as sender.
            fromEmail: env.CONTACT_FROM_EMAIL || env.SMTP_USER || "",
            smtp: {
                host: env.SMTP_HOST || "",
                port: readNumber(env.SMTP_PORT, 465),
                user: env.SMTP_USER || "",
                password: env.SMTP_PASSWORD || ""
            },
            webhookUrl: env.CONTACT_WEBHOOK_URL || "",
            webhookSecret: env.CONTACT_WEBHOOK_SECRET || ""
        }
    };

    return { config, problems };
}
