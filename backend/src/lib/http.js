/**
 * HTTP HELPERS
 *
 * PURPOSE:
 * Small helpers for reading requests and sending responses:
 * - readJsonBody(): reads a JSON body with a size limit
 * - sendJson():     sends a JSON response
 * - getClientIp():  visitor IP (for rate limiting)
 * - isAllowedOrigin(): blocks requests from foreign websites (CSRF)
 */

export class HttpError extends Error {
    constructor(status, publicMessage, reason) {
        super(reason || publicMessage);
        this.status = status;
        this.publicMessage = publicMessage; // safe to show to visitors
    }
}

const MAX_BODY_BYTES = 16 * 1024; // 16 KB is plenty for a contact message

export async function readJsonBody(request) {
    const contentType = request.headers["content-type"] || "";
    if (!contentType.startsWith("application/json")) {
        throw new HttpError(415, "Unsupported request.", `Content-Type was "${contentType}"`);
    }

    const chunks = [];
    let size = 0;
    for await (const chunk of request) {
        size += chunk.length;
        if (size > MAX_BODY_BYTES) throw new HttpError(413, "Message too large.", `Body larger than ${MAX_BODY_BYTES} bytes`);
        chunks.push(chunk);
    }

    try {
        const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("not an object");
        return data;
    } catch (error) {
        throw new HttpError(400, "Invalid request.", `Body is not valid JSON (${error.message})`);
    }
}

export function sendJson(response, status, data, headers = {}) {
    const body = JSON.stringify(data);
    response.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": Buffer.byteLength(body),
        "Cache-Control": "no-store",
        ...headers
    });
    response.end(body);
}

export function getClientIp(request, trustProxy) {
    if (trustProxy) {
        const forwarded = request.headers["x-forwarded-for"];
        if (forwarded) return String(forwarded).split(",")[0].trim();
    }
    return request.socket.remoteAddress || "unknown";
}

/**
 * CSRF protection for the API: browsers always send an Origin header
 * with POST requests. Requests from other websites are rejected.
 */
export function isAllowedOrigin(request, allowedOrigins) {
    const origin = request.headers.origin;
    if (!origin) {
        // No Origin: allow only if the browser says it is same-origin.
        return request.headers["sec-fetch-site"] === "same-origin";
    }
    return allowedOrigins.includes(origin.replace(/\/+$/, ""));
}
