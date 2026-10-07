/**
 * STATIC FILES  (optional: serve the built website)
 *
 * PURPOSE:
 * When SERVE_FRONTEND=true, this server also delivers the website
 * from /frontend/dist – so one Node process can host everything
 * (website + contact API) on the same domain. This is also what
 * `npm run dev` uses on http://localhost:3000.
 *
 * - Clean URLs: /funnels  -> 301 -> /funnels/ -> funnels/index.html
 * - Unknown pages get /404.html with status 404
 * - Path traversal (../) is blocked
 *
 * If the website is hosted elsewhere (Netlify, Cloudflare Pages ...),
 * set SERVE_FRONTEND=false and only the API runs here.
 */

import fs from "node:fs";
import path from "node:path";

const CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".webmanifest": "application/manifest+json; charset=utf-8",
    ".xml": "application/xml; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".woff2": "font/woff2",
    ".pdf": "application/pdf"
};

function cacheControlFor(urlPath, isProduction) {
    if (!isProduction) return "no-cache";
    if (urlPath.startsWith("/assets/fonts/")) return "public, max-age=31536000, immutable";
    if (urlPath.startsWith("/assets/") || urlPath.startsWith("/media/")) return "public, max-age=604800";
    return "public, max-age=0, must-revalidate";
}

export function createStaticHandler({ root, isProduction }) {
    const rootWithSeparator = root.endsWith(path.sep) ? root : root + path.sep;

    function resolveFile(urlPath) {
        const decoded = decodeURIComponent(urlPath);
        if (decoded.includes("\0")) return null;
        const candidate = path.normalize(path.join(root, decoded));
        if (candidate !== root && !candidate.startsWith(rootWithSeparator)) return null; // blocks ../
        return candidate;
    }

    function sendFile(request, response, file, status = 200) {
        const extension = path.extname(file).toLowerCase();
        const stat = fs.statSync(file);
        response.writeHead(status, {
            "Content-Type": CONTENT_TYPES[extension] || "application/octet-stream",
            "Content-Length": stat.size,
            "Cache-Control": status === 200 ? cacheControlFor(request.url, isProduction) : "no-cache"
        });
        if (request.method === "HEAD") return response.end();
        fs.createReadStream(file).pipe(response);
    }

    return function serveStatic(request, response) {
        const url = new URL(request.url, "http://localhost");
        let urlPath = url.pathname;

        let file;
        try {
            file = resolveFile(urlPath);
        } catch {
            file = null; // malformed URL encoding
        }

        if (file && fs.existsSync(file) && fs.statSync(file).isDirectory()) {
            if (!urlPath.endsWith("/")) {
                response.writeHead(301, { Location: `${urlPath}/${url.search}` });
                return response.end();
            }
            file = path.join(file, "index.html");
        }

        if (file && fs.existsSync(file) && fs.statSync(file).isFile()) {
            return sendFile(request, response, file);
        }

        const notFound = path.join(root, "404.html");
        if (fs.existsSync(notFound)) return sendFile(request, response, notFound, 404);
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not found");
    };
}
