/**
 * FORM TOKEN  (spam protection + request origin check)
 *
 * PURPOSE:
 * Before sending, the contact form asks the server for a token
 * (GET /api/contact/token). The token contains the time it was
 * issued and is signed with FORM_TOKEN_SECRET (HMAC-SHA256).
 *
 * When the message arrives, the server checks:
 * - the signature is valid (token was really issued by us)
 * - at least FORM_MIN_SECONDS have passed (bots submit instantly)
 * - it is not older than FORM_MAX_AGE_MINUTES
 * - it has not been used before (one token = one message)
 *
 * The secret never leaves the server.
 */

import crypto from "node:crypto";

function sign(payload, secret) {
    return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createFormTokens({ secret, minSeconds, maxAgeMinutes, now = () => Date.now() }) {
    const used = new Map(); // nonce -> expiry time

    const forgetExpired = () => {
        const current = now();
        for (const [nonce, expiry] of used) if (expiry < current) used.delete(nonce);
    };

    return {
        issue() {
            const payload = `${now()}.${crypto.randomBytes(12).toString("base64url")}`;
            return `${payload}.${sign(payload, secret)}`;
        },

        /** Returns { valid: true } or { valid: false, reason } (reason is for logs only). */
        verify(token) {
            if (typeof token !== "string" || token.length > 200) return { valid: false, reason: "missing or malformed token" };

            const parts = token.split(".");
            if (parts.length !== 3) return { valid: false, reason: "malformed token" };

            const [issuedAt, nonce, signature] = parts;
            const expected = sign(`${issuedAt}.${nonce}`, secret);
            const given = Buffer.from(signature);
            const wanted = Buffer.from(expected);
            if (given.length !== wanted.length || !crypto.timingSafeEqual(given, wanted)) {
                return { valid: false, reason: "invalid signature" };
            }

            const ageMs = now() - Number(issuedAt);
            if (!Number.isFinite(ageMs) || ageMs < minSeconds * 1000) return { valid: false, reason: "submitted too fast" };
            if (ageMs > maxAgeMinutes * 60 * 1000) return { valid: false, reason: "token expired" };

            forgetExpired();
            if (used.has(nonce)) return { valid: false, reason: "token already used" };
            used.set(nonce, Number(issuedAt) + maxAgeMinutes * 60 * 1000);

            return { valid: true };
        }
    };
}
