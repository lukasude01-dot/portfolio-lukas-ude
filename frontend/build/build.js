/**
 * WEBSITE BUILD  (turns the source files into the finished website)
 *
 * RUN:
 *   npm run build            -> builds once into /frontend/dist
 *   npm run build -- --watch -> rebuilds whenever a file changes
 *   npm run build -- --drafts -> also builds projects with "status": "draft"
 *
 * WHAT IT DOES (in this order):
 *   1. Loads /frontend/config/site.js and all /content
 *   2. Copies fonts, images, scripts and public files to /dist
 *   3. Bundles the CSS into /dist/styles/main.css
 *   4. Builds every page in /frontend/pages
 *   5. Builds one page per project (funnels, creatives, design)
 *   6. Builds the live funnel demos in /frontend/demos
 *   7. Generates sitemap.xml, robots.txt, _headers, QR code, icons
 *   8. Prints warnings (missing alt texts, placeholders, ...)
 *
 * The /dist folder is generated - never edit files in it.
 * DO NOT EDIT WITHOUT TESTING.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { log } from "./lib/logger.js";
import { renderTemplate, parseFrontMatter } from "./lib/template.js";
import { loadContent } from "./lib/content.js";
import { buildResponsiveImages } from "./lib/images.js";
import { copyFolder, bundleCss } from "./lib/assets.js";
import { createQrCode } from "./lib/qr.js";
import { absoluteUrl, createSitemap, createRobots, createHeadersFile, createManifest, createStructuredData } from "./lib/seo.js";
import { renderers } from "./renderers/index.js";


// ------------------------------------------------------------
// PATHS
// ------------------------------------------------------------

const FRONTEND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(FRONTEND, "..");
const DIST = path.join(FRONTEND, "dist");
const CACHE = path.join(FRONTEND, ".cache", "images");
const CONTENT = path.join(ROOT, "content");
const SHARED = path.join(ROOT, "shared");

const PAGES_DIR = path.join(FRONTEND, "pages");
const COMPONENTS_DIR = path.join(FRONTEND, "components");
const TEMPLATES_DIR = path.join(FRONTEND, "templates");
const DEMOS_DIR = path.join(FRONTEND, "demos");

const args = new Set(process.argv.slice(2));
const includeDrafts = args.has("--drafts");

// Section pages that get one detail page per project
const DETAIL_TEMPLATES = {
    funnels: { template: "funnel-project.html", parent: { label: "Funnels", href: "/funnels/" } },
    creatives: { template: "creative-project.html", parent: { label: "Creatives", href: "/creatives/" } },
    design: { template: "design-project.html", parent: { label: "Designarbeiten", href: "/design/" } }
};


// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

/** Finds the source file for an image URL used in HTML. */
function resolveImageSource(url) {
    if (!url) return null;
    if (url.startsWith("/assets/")) return path.join(FRONTEND, url);
    if (url.startsWith("/media/")) return path.join(CONTENT, url.replace(/^\/media\//, ""));
    return null;
}

function writeFile(relativePath, contents) {
    const target = path.join(DIST, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, contents);
}

/** "/funnels/recruiting-demo/" -> "funnels/recruiting-demo/index.html" */
function outputPathFor(pagePath) {
    if (pagePath.endsWith(".html")) return pagePath.replace(/^\//, "");
    return path.posix.join(pagePath.replace(/^\//, ""), "index.html");
}

async function loadSiteConfig() {
    // A fresh import on every (watch) rebuild, so config edits are picked up.
    const module = await import(`${pathToFileURL(path.join(FRONTEND, "config", "site.js")).href}?t=${Date.now()}`);
    const site = structuredClone(module.siteConfig);
    if (process.env.PUBLIC_SITE_URL) site.url = process.env.PUBLIC_SITE_URL;
    site.url = site.url.replace(/\/+$/, "");
    site.apiOrigin = (site.apiOrigin || "").replace(/\/+$/, "");
    site.contactEndpointUrl = `${site.apiOrigin}${site.contactForm.endpoint}`;
    site.contactTokenUrl = `${site.apiOrigin}${site.contactForm.tokenEndpoint}`;
    site.year = new Date().getFullYear();

    if (site.url.includes("localhost")) log.warn("SITE CONFIG", `site.url is "${site.url}" (local example). Set your real domain before going live – canonical URLs, sitemap and QR code use it.`);
    if (site.email.endsWith("@example.com")) log.warn("SITE CONFIG", "site.email is still the example address.");
    if (site.social.some((profile) => profile.url.includes("/example"))) log.warn("SITE CONFIG", "site.social still contains example links.");
    if (!site.email) log.warn("SITE CONFIG", "site.email is empty – no public e-mail address is shown on the contact page.");
    if (!site.social.some((profile) => profile.url)) log.warn("SITE CONFIG", "No social links set in site.social (e.g. LinkedIn).");
    return site;
}

/** Builds the `page` object that templates can use as {{ page.* }} */
function createPageData(site, data, defaults) {
    const page = { ...defaults, ...data };
    page.fullTitle = page.title === site.name || !page.title ? `${site.name} – ${site.tagline}` : `${page.title} – ${site.name}`;
    page.description = page.description || site.description;
    page.canonical = absoluteUrl(site, page.path);
    page.ogImageUrl = absoluteUrl(site, page.ogImage || site.ogImage);
    page.bodyClass = page.bodyClass || "";
    page.headerTheme = page.headerTheme || "dark";
    page.robots = page.noindex ? "noindex, follow" : "index, follow";
    page.structuredData = createStructuredData(site, page);
    return page;
}

/** Renders a body into the main layout and optimises images. */
async function renderPage({ site, content, page, body, extra = {}, sourceName }) {
    const context = { site, content, page, ...extra };
    const options = { componentsDir: COMPONENTS_DIR, renderers, sourceName };

    page.body = renderTemplate(body, context, options);
    const layout = fs.readFileSync(path.join(COMPONENTS_DIR, "layout.html"), "utf8");
    const finished = renderTemplate(layout, context, { ...options, sourceName: `layout (${sourceName})` });

    return buildResponsiveImages(finished, { distDir: DIST, cacheDir: CACHE, resolveSource: resolveImageSource, pageName: sourceName });
}


// ------------------------------------------------------------
// BUILD STEPS
// ------------------------------------------------------------

function copyStaticFiles(content) {
    log.step("Copying static files");
    copyFolder(path.join(FRONTEND, "public"), DIST);
    copyFolder(path.join(FRONTEND, "assets"), path.join(DIST, "assets"));
    copyFolder(path.join(FRONTEND, "scripts"), path.join(DIST, "scripts"));

    // Only PUBLIC shared code goes to the browser (validation rules).
    fs.mkdirSync(path.join(DIST, "scripts", "shared"), { recursive: true });
    fs.copyFileSync(path.join(SHARED, "contact-schema.js"), path.join(DIST, "scripts", "shared", "contact-schema.js"));

    // Project images: /content/<section>/<slug>/* -> /dist/media/<section>/<slug>/*
    for (const project of content.all) {
        copyFolder(project.sourceFolder, path.join(DIST, "media", project.section, project.slug), (file) => !file.endsWith(".json") && !path.basename(file).startsWith("."));
    }
}

function buildCss() {
    log.step("Bundling CSS");
    writeFile("styles/main.css", bundleCss(path.join(FRONTEND, "styles", "main.css")));
}

async function buildPages(site, content) {
    log.step("Building pages");
    const builtPages = [];

    for (const file of fs.readdirSync(PAGES_DIR).filter((name) => name.endsWith(".html") && !name.startsWith("_"))) {
        const source = fs.readFileSync(path.join(PAGES_DIR, file), "utf8");
        const { data, body } = parseFrontMatter(source, `pages/${file}`);
        const name = file.replace(/\.html$/, "");
        const defaultPath = name === "index" ? "/" : `/${name}/`;
        const page = createPageData(site, data, { path: defaultPath });

        const placeholders = body.match(/\[ADD [^\]]+\]/g) || [];
        if (placeholders.length) log.warn("PLACEHOLDERS", `pages/${file}: ${placeholders.length} placeholder(s) still to fill in.`);

        const htmlOutput = await renderPage({ site, content, page, body, sourceName: `pages/${file}` });
        writeFile(outputPathFor(page.path), htmlOutput);
        builtPages.push(page);
        log.info(`${page.path.padEnd(34)} <- pages/${file}`);
    }
    return builtPages;
}

async function buildProjectPages(site, content) {
    log.step("Building project pages");
    const builtPages = [];

    for (const [section, settings] of Object.entries(DETAIL_TEMPLATES)) {
        const template = fs.readFileSync(path.join(TEMPLATES_DIR, settings.template), "utf8");
        const projects = content[section];

        for (const [index, project] of projects.entries()) {
            const next = projects[(index + 1) % projects.length];
            const page = createPageData(site, {
                title: project.seoTitle || project.title,
                description: project.seoDescription || project.description,
                path: project.url,
                ogImage: project.thumbnail?.src,
                bodyClass: `page-project page-project--${section}`,
                breadcrumbs: [{ label: "Startseite", href: "/" }, settings.parent, { label: project.title, href: project.url }]
            }, {});

            const htmlOutput = await renderPage({
                site, content, page, body: template,
                extra: { project, next: next !== project ? next : null, section: settings.parent },
                sourceName: `templates/${settings.template} (${project.slug})`
            });
            writeFile(outputPathFor(page.path), htmlOutput);
            builtPages.push(page);
            log.info(`${page.path.padEnd(34)} <- content/${section}/${project.slug}`);
        }
    }
    return builtPages;
}

/** Live funnel demos: standalone landing pages without the main layout. */
async function buildDemos(site, content) {
    log.step("Building funnel demos");
    for (const entry of fs.readdirSync(DEMOS_DIR, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const folder = path.join(DEMOS_DIR, entry.name);
        const target = path.join(DIST, "demos", entry.name);

        copyFolder(folder, target, (file) => !file.endsWith(".html"));

        for (const file of fs.readdirSync(folder).filter((name) => name.endsWith(".html"))) {
            const sourceName = `demos/${entry.name}/${file}`;
            const funnel = content.funnels.find((project) => project.demoPath === `/demos/${entry.name}/`) || {};
            const context = { site, content, funnel, page: { path: `/demos/${entry.name}/` } };
            let output = renderTemplate(fs.readFileSync(path.join(folder, file), "utf8"), context, { componentsDir: COMPONENTS_DIR, renderers, sourceName });
            output = await buildResponsiveImages(output, { distDir: DIST, cacheDir: CACHE, resolveSource: resolveImageSource, pageName: sourceName });
            fs.mkdirSync(target, { recursive: true });
            fs.writeFileSync(path.join(target, file), output);
        }
        log.info(`/demos/${entry.name}/`);
    }
}

async function buildIcons() {
    try {
        const sharp = (await import("sharp")).default;
        const svg = path.join(FRONTEND, "public", "favicon.svg");
        fs.mkdirSync(path.join(DIST, "assets", "brand"), { recursive: true });
        await sharp(svg, { density: 300 }).resize(192, 192).png().toFile(path.join(DIST, "assets", "brand", "icon-192.png"));
        await sharp(svg, { density: 300 }).resize(512, 512).png().toFile(path.join(DIST, "assets", "brand", "icon-512.png"));
        await sharp(svg, { density: 300 }).resize(180, 180).png().toFile(path.join(DIST, "apple-touch-icon.png"));
    } catch (error) {
        log.warn("ICONS", `PNG app icons not generated (${error.message}).`);
    }
}

async function buildSeoFiles(site, pages) {
    log.step("Generating SEO, QR code and hosting files");
    writeFile("sitemap.xml", createSitemap(site, pages));
    writeFile("robots.txt", createRobots(site));
    writeFile("_headers", createHeadersFile(site));
    writeFile("site.webmanifest", createManifest(site));
    await createQrCode(site, DIST);
    await buildIcons();
}


// ------------------------------------------------------------
// MAIN
// ------------------------------------------------------------

async function build() {
    const started = Date.now();
    log.resetWarnings();
    console.log("Building website ...");

    const site = await loadSiteConfig();
    const content = loadContent(CONTENT, { includeDrafts });

    fs.rmSync(DIST, { recursive: true, force: true });
    fs.mkdirSync(DIST, { recursive: true });

    copyStaticFiles(content);
    buildCss();
    const pages = [...(await buildPages(site, content)), ...(await buildProjectPages(site, content))];
    await buildDemos(site, content);
    await buildSeoFiles(site, pages);

    log.printWarnings();
    console.log(`\n✓ Done in ${((Date.now() - started) / 1000).toFixed(1)}s -> frontend/dist\n`);
}

async function safeBuild() {
    try {
        await build();
        return true;
    } catch (error) {
        console.error(`\n✗ BUILD FAILED\n  ${error.message}`);
        if (error.detail) console.error(`  ${error.detail}`);
        if (!error.message.startsWith("[")) console.error(error.stack);
        return false;
    }
}

const success = await safeBuild();

if (args.has("--watch")) {
    console.log("Watching for changes (Ctrl+C to stop) ...");
    let timer;
    const rebuild = (event, file) => {
        if (!file || /(^|[\\/])(dist|\.cache)([\\/]|$)/.test(file)) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
            console.log(`\nChanged: ${file}`);
            safeBuild();
        }, 200);
    };
    fs.watch(FRONTEND, { recursive: true }, rebuild);
    fs.watch(CONTENT, { recursive: true }, rebuild);
    fs.watch(SHARED, { recursive: true }, rebuild);
} else if (!success) {
    process.exitCode = 1;
}
