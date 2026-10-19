/**
 * BACKEND TESTS  (run with: npm test)
 *
 * Checks the contact API end to end without sending real e-mails:
 * validation, spam protection, origin check and rate limiting.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

import { loadConfig } from "../src/config.js";
import { createApp } from "../src/server.js";
import { createFormTokens } from "../src/lib/form-token.js";
import { isAllowedOrigin } from "../src/lib/http.js";
import { validateContact } from "../../shared/contact-schema.js";
import { createContactDelivery } from "../src/services/email.js";
import nodemailer from "nodemailer";

const ORIGIN = "http://localhost:3000";
const VALID_MESSAGE = {
    name: "Test Person",
    email: "test@example.com",
    company: "",
    topic: "Landingpage",
    message: "Hello, this is a sufficiently long test message.",
    privacy: true,
    website: ""
};

async function startServer(env = {}) {
    const { config } = loadConfig({ PORT: "3000", SERVE_FRONTEND: "false", FORM_MIN_SECONDS: "0", RATE_LIMIT_MAX: "3", ...env });
    config.formMinSeconds = 0;
    const delivered = [];
    const app = createApp(config, { deliver: async (message) => delivered.push(message) });
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    return {
        base,
        delivered,
        close: () => new Promise((resolve) => { app.close(); server.close(resolve); })
    };
}

async function getToken(base) {
    const response = await fetch(`${base}/api/contact/token`);
    return (await response.json()).token;
}

function post(base, body, headers = {}) {
    return fetch(`${base}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: ORIGIN, ...headers },
        body: JSON.stringify(body)
    });
}

test("shared validation accepts a valid message and rejects bad input", () => {
    assert.equal(validateContact(VALID_MESSAGE).valid, true);
    const result = validateContact({ ...VALID_MESSAGE, email: "not-an-email", message: "short", privacy: false, topic: "Hacking" });
    assert.deepEqual(Object.keys(result.errors).sort(), ["email", "message", "privacy", "topic"]);
});

test("valid message is delivered", async () => {
    const server = await startServer();
    try {
        const response = await post(server.base, { ...VALID_MESSAGE, token: await getToken(server.base) });
        assert.equal(response.status, 200);
        assert.equal(server.delivered.length, 1);
        assert.equal(server.delivered[0].email, "test@example.com");
    } finally {
        await server.close();
    }
});

test("invalid fields return 422 with field errors", async () => {
    const server = await startServer();
    try {
        const response = await post(server.base, { ...VALID_MESSAGE, email: "nope", token: await getToken(server.base) });
        assert.equal(response.status, 422);
        assert.ok((await response.json()).errors.email);
        assert.equal(server.delivered.length, 0);
    } finally {
        await server.close();
    }
});

test("missing or reused token is rejected", async () => {
    const server = await startServer();
    try {
        assert.equal((await post(server.base, VALID_MESSAGE)).status, 400);
        const token = await getToken(server.base);
        assert.equal((await post(server.base, { ...VALID_MESSAGE, token })).status, 200);
        assert.equal((await post(server.base, { ...VALID_MESSAGE, token })).status, 400);
    } finally {
        await server.close();
    }
});

test("honeypot submissions are silently discarded", async () => {
    const server = await startServer();
    try {
        const response = await post(server.base, { ...VALID_MESSAGE, website: "spam.example", token: await getToken(server.base) });
        assert.equal(response.status, 200);
        assert.equal(server.delivered.length, 0);
    } finally {
        await server.close();
    }
});

test("requests from foreign origins are blocked (CSRF)", async () => {
    const server = await startServer();
    try {
        const response = await post(server.base, { ...VALID_MESSAGE, token: await getToken(server.base) }, { Origin: "https://evil.example" });
        assert.equal(response.status, 403);
    } finally {
        await server.close();
    }
});

test("rate limit returns 429", async () => {
    const server = await startServer();
    try {
        const statuses = [];
        for (let index = 0; index < 4; index += 1) {
            statuses.push((await post(server.base, { ...VALID_MESSAGE, token: await getToken(server.base) })).status);
        }
        assert.deepEqual(statuses, [200, 200, 200, 429]);
    } finally {
        await server.close();
    }
});

test("non-JSON bodies and unknown routes return safe errors", async () => {
    const server = await startServer();
    try {
        const form = await fetch(`${server.base}/api/contact`, { method: "POST", headers: { "Content-Type": "text/plain", Origin: ORIGIN }, body: "hi" });
        assert.equal(form.status, 415);
        const body = await form.json();
        assert.equal(body.ok, false);
        assert.ok(!JSON.stringify(body).includes("Content-Type was"), "internal reason must not leak");
        assert.equal((await fetch(`${server.base}/api/unknown`)).status, 404);
    } finally {
        await server.close();
    }
});

test("security headers are set", async () => {
    const server = await startServer();
    try {
        const response = await fetch(`${server.base}/api/health`);
        assert.match(response.headers.get("content-security-policy"), /script-src 'self'/);
        assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    } finally {
        await server.close();
    }
});

test("form tokens: signature, minimum time and expiry are enforced", () => {
    let now = 1_000_000;
    const tokens = createFormTokens({ secret: "x".repeat(32), minSeconds: 3, maxAgeMinutes: 1, now: () => now });
    const token = tokens.issue();
    assert.equal(tokens.verify(token).reason, "submitted too fast");
    now += 5_000;
    assert.equal(tokens.verify(token.slice(0, -2) + "xx").valid, false);
    assert.equal(tokens.verify(token).valid, true);
    const late = tokens.issue();
    now += 2 * 60_000;
    assert.equal(tokens.verify(late).reason, "token expired");
});

test("missing production settings are reported and switch off only the contact form", async () => {
    const { config, problems } = loadConfig({ NODE_ENV: "production" });
    assert.ok(problems.some((problem) => problem.includes("FORM_TOKEN_SECRET")));
    assert.ok(problems.some((problem) => problem.includes("CONTACT_DELIVERY")));
    assert.equal(config.contact.enabled, false);
    assert.ok(config.formTokenSecret.length >= 32);

    const server = await startServer({ NODE_ENV: "production" });
    try {
        const response = await post(server.base, { ...VALID_MESSAGE, token: await getToken(server.base) });
        assert.equal(response.status, 503);
    } finally {
        await server.close();
    }
});

test("smtp delivery needs mailbox settings", () => {
    const { problems } = loadConfig({ CONTACT_DELIVERY: "smtp", SMTP_HOST: "smtp.example.com" });
    assert.ok(problems.some((problem) => problem.includes("SMTP_USER")));
    const complete = loadConfig({ CONTACT_DELIVERY: "smtp", SMTP_HOST: "smtp.example.com", SMTP_USER: "kontakt@example.com", SMTP_PASSWORD: "x", CONTACT_TO_EMAIL: "kontakt@example.com" });
    assert.deepEqual(complete.problems, []);
    assert.equal(complete.config.contact.fromEmail, "kontakt@example.com");
    assert.equal(complete.config.contact.smtp.port, 465);
});

test("smtp delivery builds a safe e-mail (no header injection)", async () => {
    const { config } = loadConfig({ CONTACT_DELIVERY: "smtp", SMTP_HOST: "smtp.example.com", SMTP_USER: "kontakt@example.com", SMTP_PASSWORD: "x", CONTACT_TO_EMAIL: "inbox@example.com" });
    const sent = [];
    const fakeTransport = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: "unix" });
    const recordingTransport = { sendMail: async (mail) => { const info = await fakeTransport.sendMail(mail); sent.push(info.message.toString()); return info; } };
    const deliver = createContactDelivery({ config, logger: console, smtpTransport: recordingTransport });
    await deliver({ ...VALID_MESSAGE, name: "Eve\r\nBcc: victim@example.com", message: "<script>alert(1)</script> long enough text" });
    const raw = sent[0];
    const headers = raw.slice(0, raw.indexOf("\n\n"));
    assert.match(headers, /^To: inbox@example\.com$/m);
    assert.match(headers, /^From: Website Kontaktformular <kontakt@example\.com>$/m);
    assert.doesNotMatch(headers, /^Bcc:/mi);
    assert.match(raw, /&lt;script&gt;/);
});

test("origin check: own domain is allowed, foreign sites are blocked", () => {
    const allowed = ["https://lukasude.de"];
    const request = (origin, headers = {}) => ({ headers: { origin, host: "www.lukasude.de", ...headers } });
    assert.equal(isAllowedOrigin(request("https://lukasude.de"), allowed), true);
    assert.equal(isAllowedOrigin(request("https://www.lukasude.de"), allowed), true);
    assert.equal(isAllowedOrigin(request("https://evil.example"), allowed), false);
    assert.equal(isAllowedOrigin(request("null"), allowed), false);
    const proxied = request("https://preview.example", { host: "127.0.0.1:3000", "x-forwarded-host": "preview.example" });
    assert.equal(isAllowedOrigin(proxied, allowed, false), false);
    assert.equal(isAllowedOrigin(proxied, allowed, true), true);
});
