/**
 * SECURITY HEADERS
 *
 * PURPOSE:
 * Added to EVERY response of the server. They tell the browser to
 * block common attacks (script injection, clickjacking, sniffing).
 *
 * Content-Security-Policy (CSP):
 *   Only scripts, styles, fonts and images from our own domain are
 *   allowed. No inline scripts, no third-party trackers.
 *
 * The static-hosting version of these headers is generated in
 * /frontend/build/lib/seo.js (file "_headers"). Keep both in sync.
 *
 * DO NOT EDIT WITHOUT TESTING: a too strict CSP can break the site.
 */

export function createSecurityHeaders(config) {
    const csp = [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-src 'self'",
        "frame-ancestors 'self'",
        "form-action 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        // Only in production: on http://localhost this would break loading.
        ...(config.isProduction ? ["upgrade-insecure-requests"] : [])
    ].join("; ");

    const headers = {
        "Content-Security-Policy": csp,
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Resource-Policy": "same-site"
    };

    if (config.isProduction) {
        headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
    }

    return headers;
}
