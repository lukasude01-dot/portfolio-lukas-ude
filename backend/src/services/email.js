/**
 * CONTACT DELIVERY  (where contact messages go)
 *
 * PURPOSE:
 * Delivers a validated contact message. Choose the method with
 * CONTACT_DELIVERY in /backend/.env:
 *
 *   "log"      Development: prints a short summary to the server
 *              console. Nothing is sent anywhere. (default)
 *   "smtp"     Sends an e-mail through the mailbox of your own domain
 *              (e.g. kontakt@your-domain.de at IONOS, Strato, All-Inkl).
 *              Free: uses the mailbox included with the domain.
 *              Needs SMTP_HOST, SMTP_USER, SMTP_PASSWORD, CONTACT_TO_EMAIL.
 *   "webhook"  POSTs the message as JSON to CONTACT_WEBHOOK_URL,
 *              e.g. a Make / n8n / Zapier scenario or a CRM.
 *
 * ADDING ANOTHER PROVIDER:
 * Write one more function like sendWithSmtp() and add it to
 * DELIVERY_METHODS at the bottom. Nothing else needs to change.
 *
 * SECURITY:
 * Passwords and secrets are read from the config (environment
 * variables) and never sent to the browser. User input is
 * HTML-escaped in e-mails. Nodemailer encodes all headers, so line
 * breaks in user input cannot inject extra e-mail headers.
 */

import crypto from "node:crypto";
import nodemailer from "nodemailer";

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

function plainText(message) {
    return [
        `Neue Nachricht über das Kontaktformular der Website`,
        ``,
        `Name:        ${message.name}`,
        `E-Mail:      ${message.email}`,
        `Unternehmen: ${message.company || "-"}`,
        `Thema:       ${message.topic}`,
        ``,
        message.message
    ].join("\n");
}

function htmlBody(message) {
    return `<h2>Neue Nachricht über das Kontaktformular der Website</h2>
<p><strong>Name:</strong> ${escapeHtml(message.name)}<br>
<strong>E-Mail:</strong> ${escapeHtml(message.email)}<br>
<strong>Unternehmen:</strong> ${escapeHtml(message.company || "-")}<br>
<strong>Thema:</strong> ${escapeHtml(message.topic)}</p>
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

function createSmtpTransport(config) {
    const smtp = config.contact.smtp;
    return nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.port === 465,      // 465 = TLS from the start, 587 = STARTTLS
        requireTLS: smtp.port !== 465,  // never send the password unencrypted
        auth: { user: smtp.user, pass: smtp.password },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000
    });
}

async function sendWithSmtp(message, { config, smtpTransport }) {
    try {
        await smtpTransport.sendMail({
            from: { name: "Website Kontaktformular", address: config.contact.fromEmail },
            to: config.contact.toEmail,
            replyTo: { name: message.name, address: message.email },
            subject: `Kontaktanfrage: ${message.topic} von ${message.name}`,
            text: plainText(message),
            html: htmlBody(message)
        });
    } catch (error) {
        // Only the error code is logged: the server reply could contain account details.
        throw new Error(`SMTP delivery failed (${error.code || "unknown error"})`);
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
    smtp: sendWithSmtp,
    webhook: sendWithWebhook
};

/**
 * @param {object} [options.smtpTransport]  only for tests: replaces the real SMTP connection
 */
export function createContactDelivery({ config, logger, smtpTransport }) {
    const send = DELIVERY_METHODS[config.contact.delivery];
    if (!config.contact.enabled || !send) return async () => { throw new Error("Contact delivery is not configured."); };
    if (config.contact.delivery === "smtp" && !smtpTransport) smtpTransport = createSmtpTransport(config);
    return (message) => send(message, { config, logger, smtpTransport });
}
