/**
 * CONTACT DELIVERY  (where contact messages go)
 *
 * PURPOSE:
 * Delivers a validated contact message. Choose the method with
 * CONTACT_DELIVERY in /backend/.env:
 *
 *   "log"      Development: prints a short summary to the server
 *              console. Nothing is sent anywhere. (default)
 *   "resend"   Sends an e-mail via the Resend API (resend.com).
 *              Needs RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL.
 *   "webhook"  POSTs the message as JSON to CONTACT_WEBHOOK_URL,
 *              e.g. a Make / n8n / Zapier scenario or a CRM.
 *
 * ADDING ANOTHER PROVIDER:
 * Write one more function like sendWithResend() and add it to
 * DELIVERY_METHODS at the bottom. Nothing else needs to change.
 *
 * SECURITY:
 * API keys are read from the config (environment variables) and
 * never sent to the browser. User input is HTML-escaped in e-mails.
 */

import crypto from "node:crypto";

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

function plainText(message) {
    return [
        `New message via the website contact form`,
        ``,
        `Name:    ${message.name}`,
        `E-mail:  ${message.email}`,
        `Company: ${message.company || "-"}`,
        `Topic:   ${message.topic}`,
        ``,
        message.message
    ].join("\n");
}

function htmlBody(message) {
    return `<h2>New message via the website contact form</h2>
<p><strong>Name:</strong> ${escapeHtml(message.name)}<br>
<strong>E-mail:</strong> ${escapeHtml(message.email)}<br>
<strong>Company:</strong> ${escapeHtml(message.company || "-")}<br>
<strong>Topic:</strong> ${escapeHtml(message.topic)}</p>
<p>${escapeHtml(message.message).replace(/\n/g, "<br>")}</p>`;
}

async function sendWithLog(message, { logger }) {
    logger.info({
        area: "CONTACT FORM",
        message: "Message received (CONTACT_DELIVERY=log – nothing was sent).",
        module: "backend/services/email",
        from: `${message.name} <${message.email}>`,
        topic: message.topic,
        length: `${message.message.length} characters`
    });
}

async function sendWithResend(message, { config }) {
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${config.contact.resendApiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            from: config.contact.fromEmail,
            to: [config.contact.toEmail],
            reply_to: message.email,
            subject: `Website contact: ${message.topic} – ${message.name}`,
            text: plainText(message),
            html: htmlBody(message)
        }),
        signal: AbortSignal.timeout(10_000)
    });
    if (!response.ok) {
        // Only the status is logged – the provider response could contain account details.
        throw new Error(`Email provider responded with status ${response.status}`);
    }
}

async function sendWithWebhook(message, { config }) {
    const body = JSON.stringify({ type: "contact", receivedAt: new Date().toISOString(), ...message });
    const headers = { "Content-Type": "application/json" };
    if (config.contact.webhookSecret) {
        // Lets the receiver verify the request really came from this server.
        headers["X-Signature-SHA256"] = crypto.createHmac("sha256", config.contact.webhookSecret).update(body).digest("hex");
    }
    const response = await fetch(config.contact.webhookUrl, { method: "POST", headers, body, signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`Webhook responded with status ${response.status}`);
}

const DELIVERY_METHODS = {
    log: sendWithLog,
    resend: sendWithResend,
    webhook: sendWithWebhook
};

export function createContactDelivery({ config, logger }) {
    const send = DELIVERY_METHODS[config.contact.delivery];
    return (message) => send(message, { config, logger });
}
