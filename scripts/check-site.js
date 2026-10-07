/**
 * SITE CHECK  (npm run check – run after npm run build)
 *
 * PURPOSE:
 * Checks the built website in /frontend/dist for problems
 * BEFORE it goes live:
 *   1. Broken internal links and missing files (href / src / srcset)
 *   2. Accidentally published secrets (API keys, private keys, .env)
 *   3. Images without alt text
 *   4. Pages without a title or meta description
 *
 * Exits with an error code if something is wrong, so it can also
 * run automatically on a hosting provider or in CI.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "frontend", "dist");

// Patterns that should never appear in public files.
const SECRET_PATTERNS = [
    { name: "Resend API key", pattern: /\bre_[A-Za-z0-9_]{20,}/ },
    { name: "Generic API key assignment", pattern: /(api[_-]?key|secret|password)\s*[:=]\s*["'][^"'\s]{12,}["']/i },
    { name: "Private key", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
    { name: "AWS access key", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
    { name: "OpenAI/Anthropic style key", pattern: /\bsk-(ant-)?[A-Za-z0-9_-]{20,}/ },
    { name: "Backend env variable", pattern: /\b(RESEND_API_KEY|FORM_TOKEN_SECRET|CONTACT_WEBHOOK_SECRET)\s*=/ }
];

const problems = [];
const report = (type, file, message) => problems.push({ type, file: path.relative(DIST, file), message });

function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        return entry.isDirectory() ? walk(full) : [full];
    });
}

function existsInDist(urlPath) {
    const clean = decodeURIComponent(urlPath.split(/[?#]/)[0]);
    const target = path.join(DIST, clean);
    if (clean.endsWith("/")) return fs.existsSync(path.join(target, "index.html"));
    return fs.existsSync(target) || fs.existsSync(path.join(target, "index.html"));
}

if (!fs.existsSync(DIST)) {
    console.error("✗ frontend/dist does not exist. Run `npm run build` first.");
    process.exit(1);
}

const files = walk(DIST);
const ids = new Map();

for (const file of files) {
    if (fs.existsSync(path.join(DIST, ".env")) || path.basename(file).startsWith(".env")) report("SECRET", file, ".env file inside the public folder");
    if (!/\.(html|js|css|json|xml|txt|svg|webmanifest)$/.test(file) && path.basename(file) !== "_headers") continue;

    const text = fs.readFileSync(file, "utf8");

    for (const { name, pattern } of SECRET_PATTERNS) {
        if (pattern.test(text)) report("SECRET", file, `possible ${name}`);
    }

    if (!file.endsWith(".html")) continue;

    // Collect ids for #anchor checks
    ids.set(file, new Set([...text.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1])));

    const isDemo = file.includes(`${path.sep}demos${path.sep}`);
    if (!isDemo) {
        if (!/<title>[^<]+<\/title>/.test(text)) report("SEO", file, "missing <title>");
        if (!/<meta name="description" content="[^"]+">/.test(text)) report("SEO", file, "missing meta description");
    }

    for (const tag of text.match(/<img\b[^>]*>/g) || []) {
        if (!/\balt="/.test(tag)) report("A11Y", file, `image without alt: ${tag.slice(0, 80)}…`);
    }

    const references = [
        ...[...text.matchAll(/\b(?:href|src)="([^"]+)"/g)].map((match) => match[1]),
        ...[...text.matchAll(/\bsrcset="([^"]+)"/g)].flatMap((match) => match[1].split(",").map((part) => part.trim().split(" ")[0]))
    ];

    for (const reference of references) {
        if (/^(https?:|mailto:|tel:|data:|#)/.test(reference)) continue;
        if (!reference.startsWith("/")) continue;
        if (!existsInDist(reference)) report("LINK", file, `broken link -> ${reference}`);
    }
}

// Anchor links like /ai/#workflow-x
for (const file of files.filter((name) => name.endsWith(".html"))) {
    const text = fs.readFileSync(file, "utf8");
    for (const [, target, anchor] of text.matchAll(/href="(\/[^"#]*)#([^"]+)"/g)) {
        const page = path.join(DIST, target, target.endsWith("/") ? "index.html" : "");
        if (ids.has(page) && !ids.get(page).has(anchor)) report("LINK", file, `missing anchor -> ${target}#${anchor}`);
    }
}

if (problems.length === 0) {
    console.log(`✓ Site check passed (${files.length} files): no broken links, no secrets, all images have alt text.`);
} else {
    console.log(`✗ ${problems.length} problem(s) found:\n`);
    for (const problem of problems) console.log(`  [${problem.type}] ${problem.file}: ${problem.message}`);
    process.exitCode = 1;
}
