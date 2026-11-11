/**
 * WEBSITE BUILD  (turns the source files into the finished website)
 *
 * RUN:
 *   npm run build            -> builds the live design (variant "bold") into /frontend/dist
 *   npm run build -- --variant=classic -> builds the earlier design without
 *                               a variant into /frontend/dist-classic
 *   npm run build -- --variant=flyfishing -> builds the separate fly fishing
 *                               website into /frontend/dist-flyfishing
 *   npm run build -- --variant=jagdhunde -> builds the hunting dog website
 *   SITE_VARIANT=flyfishing npm run build -> the same into /frontend/dist
 *                               (set on the host of flyfishing.lukasude.de)
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
import { loadContent, loadNews, SECTION_PATHS } from "./lib/content.js";
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
const args = new Set(process.argv.slice(2));
const includeDrafts = args.has("--drafts");

// DESIGN VARIANTS: /frontend/variants/<name>/ can contain its own pages,
// components, templates, styles, scripts and assets. Every file it does
// not contain is taken from the normal website. Content is shared.
// LIVE_VARIANT is the design that is published; it is built into /dist.
// --variant=classic builds the earlier design without a variant into /dist-classic.
const LIVE_VARIANT = "bold";
const REQUESTED = (process.argv.find((arg) => arg.startsWith("--variant="))?.split("=")[1] || process.env.SITE_VARIANT || LIVE_VARIANT).replace(/[^\w-]/g, "");
const VARIANT = REQUESTED === "classic" ? "" : REQUESTED;
const VARIANT_DIR = VARIANT ? path.join(FRONTEND, "variants", VARIANT) : null;
if (VARIANT_DIR && !fs.existsSync(VARIANT_DIR)) throw new Error(`Design variant "${VARIANT}" not found in frontend/variants/`);

// OPTIONAL VARIANT SETTINGS: /frontend/variants/<name>/variant.js
// A "standalone" variant is a website of its own (e.g. flyfishing.lukasude.de):
// only its own pages are built (plus "sharedPages"), with its own content folder.
// "base" names a variant whose files are used where this one has none.
const VARIANT_FILE = VARIANT_DIR && path.join(VARIANT_DIR, "variant.js");
const VARIANT_CONFIG = VARIANT_FILE && fs.existsSync(VARIANT_FILE) ? (await import(pathToFileURL(VARIANT_FILE).href)).variant : {};
const STANDALONE = Boolean(VARIANT_CONFIG.standalone);
// The variant, then its base, the base's base and so on (e.g. jagdhunde -> flyfishing -> bold)
const VARIANT_DIRS = [];
for (let dir = VARIANT_DIR, config = VARIANT_CONFIG; dir; ) {
    VARIANT_DIRS.push(dir);
    dir = config.base ? path.join(FRONTEND, "variants", config.base) : null;
    const file = dir && path.join(dir, "variant.js");
    config = file && fs.existsSync(file) ? (await import(pathToFileURL(file).href)).variant : {};
}

// The site a server publishes is built into /dist: the live design by default,
// or the variant named in SITE_VARIANT (set on the host of that website).
const PUBLISHED = (process.env.SITE_VARIANT || LIVE_VARIANT).replace(/[^\w-]/g, "");
const DIST = path.join(FRONTEND, REQUESTED === PUBLISHED ? "dist" : `dist-${REQUESTED}`);
const CACHE = path.join(FRONTEND, ".cache", "images");
const CONTENT = path.join(ROOT, "content", VARIANT_CONFIG.content || "");
const SHARED = path.join(ROOT, "shared");

const DEMOS_DIR = path.join(FRONTEND, "demos");

/** The variant's folder first, then its base variant, then the normal one (first match wins). */
const sourceDirs = (folder) => [...VARIANT_DIRS.map((dir) => path.join(dir, folder)), path.join(FRONTEND, folder)].filter((dir) => fs.existsSync(dir));
const COMPONENTS_DIR = sourceDirs("components");

function sourceFile(folder, file) {
    const found = sourceDirs(folder).map((dir) => path.join(dir, file)).find((candidate) => fs.existsSync(candidate));
    if (!found) throw new Error(`${folder}/${file} not found`);
    return found;
}

/** All page files: the variant's pages replace normal pages with the same name.
 *  A standalone variant gets only its own pages plus its "sharedPages". */
function listPages() {
    const pages = new Map();
    for (const dir of sourceDirs("pages").reverse()) {
        for (const name of fs.readdirSync(dir).filter((file) => file.endsWith(".html") && !file.startsWith("_"))) pages.set(name, path.join(dir, name));
    }
    if (STANDALONE) {
        const own = path.join(VARIANT_DIR, "pages");
        const shared = VARIANT_CONFIG.sharedPages || [];
        for (const [name, file] of pages) if (path.dirname(file) !== own && !shared.includes(name)) pages.delete(name);
    }
    return [...pages.entries()].sort(([a], [b]) => a.localeCompare(b));
}

// Section pages that get one detail page per project
// ("parent" is the section page, shown in the breadcrumbs and the back link)
const PORTFOLIO_CRUMB = { label: "Portfolio", href: SECTION_PATHS.portfolio };
const DETAIL_TEMPLATES = {
    portfolio: { template: "portfolio-project.html", parent: PORTFOLIO_CRUMB },
    funnels: { template: "funnel-project.html", parent: { label: "Funnels", href: SECTION_PATHS.funnels } },
    creatives: { template: "creative-project.html", parent: { label: "Creatives", href: SECTION_PATHS.creatives } }
};


// Articles: /content/news/ on the main website, the variant's folder on a standalone one
const NEWS = { folder: "news", path: "/news/", label: "News", ...(VARIANT_CONFIG.news || {}) };

/** Content of a standalone variant: articles, courses, flies and photos (/content/<variant>/). */
function loadStandaloneContent() {
    const coursesFile = path.join(CONTENT, "kurse.json");
    const coursesData = fs.existsSync(coursesFile) ? JSON.parse(fs.readFileSync(coursesFile, "utf8")) : {};
    const courses = coursesData.courses || [];
    for (const course of courses) {
        course.url = course.path || `/akademie/${course.slug}/`;
        // "{date}" and "{time}" in the facts come from the course ("date" empty = "dateFallback")
        course.dateLabel = course.date || course.dateFallback || "";
        for (const fact of course.facts || []) fact.value = fact.value.replace("{date}", course.dateLabel).replace("{time}", course.time || "");
    }
    const readList = (file, key) => fs.existsSync(path.join(CONTENT, file)) ? JSON.parse(fs.readFileSync(path.join(CONTENT, file), "utf8"))[key] || [] : [];
    const news = loadNews(CONTENT, { includeDrafts, folder: NEWS.folder, path: NEWS.path });
    return { news, courses, angebote: coursesData.angebote || [], flies: readList("fliegen.json", "flies"), photos: readList("galerie.json", "photos"), all: [], packages: [] };
}


// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

/** Finds the source file for an image URL used in HTML. */
function resolveImageSource(url) {
    if (!url) return null;
    if (url.startsWith("/assets/")) {
        const variantFile = VARIANT_DIRS.map((dir) => path.join(dir, url)).find((file) => fs.existsSync(file));
        return variantFile || path.join(FRONTEND, url);
    }
    if (url.startsWith("/media/")) return path.join(CONTENT, url.replace(/^\/media\//, ""));
    return null;
}

function writeFile(relativePath, contents) {
    const target = path.join(DIST, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, contents);
}

/** "/portfolio/funnels/recruiting-demo/" -> "portfolio/funnels/recruiting-demo/index.html" */
function outputPathFor(pagePath) {
    if (pagePath.endsWith(".html")) return pagePath.replace(/^\//, "");
    return path.posix.join(pagePath.replace(/^\//, ""), "index.html");
}

async function loadSiteConfig() {
    // A fresh import on every (watch) rebuild, so config edits are picked up.
    const module = await import(`${pathToFileURL(path.join(FRONTEND, "config", "site.js")).href}?t=${Date.now()}`);
    const site = { ...structuredClone(module.siteConfig), ...structuredClone(VARIANT_CONFIG.site || {}) };
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
    page.fullTitle = page.title === site.name || !page.title ? `${site.name} | ${site.tagline}` : `${page.title} | ${site.name}`;
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
    const layout = fs.readFileSync(sourceFile("components", "layout.html"), "utf8");
    const finished = renderTemplate(layout, context, { ...options, sourceName: `layout (${sourceName})` });

    return buildResponsiveImages(finished, { distDir: DIST, cacheDir: CACHE, resolveSource: resolveImageSource, pageName: sourceName });
}


// ------------------------------------------------------------
// BUILD STEPS
// ------------------------------------------------------------

function copyStaticFiles(content) {
    log.step("Copying static files");
    // Normal files first, the variant's files on top (they replace same names)
    for (const dir of sourceDirs("public").reverse()) copyFolder(dir, DIST);
    for (const dir of sourceDirs("assets").reverse()) copyFolder(dir, path.join(DIST, "assets"));
    for (const dir of sourceDirs("scripts").reverse()) copyFolder(dir, path.join(DIST, "scripts"));

    // Only PUBLIC shared code goes to the browser (validation rules).
    fs.mkdirSync(path.join(DIST, "scripts", "shared"), { recursive: true });
    fs.copyFileSync(path.join(SHARED, "contact-schema.js"), path.join(DIST, "scripts", "shared", "contact-schema.js"));
    fs.copyFileSync(path.join(SHARED, "order-schema.js"), path.join(DIST, "scripts", "shared", "order-schema.js"));

    // News images: /content/news/<slug>/* -> /dist/media/news/<slug>/*
    for (const article of content.news) {
        copyFolder(article.sourceFolder, path.join(DIST, "media", article.section, article.slug), (file) => !file.endsWith(".md") && !path.basename(file).startsWith("."));
    }

    // Standalone variant: shared images /content/<variant>/bilder/* -> /dist/media/bilder/*
    if (STANDALONE) copyFolder(path.join(CONTENT, "bilder"), path.join(DIST, "media", "bilder"), (file) => !path.basename(file).startsWith("."));

    // Project images: /content/<section>/<slug>/* -> /dist/media/<section>/<slug>/*
    for (const project of content.all) {
        copyFolder(project.sourceFolder, path.join(DIST, "media", project.section, project.slug), (file) => !file.endsWith(".json") && !path.basename(file).startsWith("."));
    }
}

function buildCss() {
    log.step("Bundling CSS");
    writeFile("styles/main.css", bundleCss(sourceFile("styles", "main.css")));
}

async function buildPages(site, content) {
    log.step("Building pages");
    const builtPages = [];

    for (const [file, sourcePath] of listPages()) {
        const source = fs.readFileSync(sourcePath, "utf8");
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
        const template = fs.readFileSync(sourceFile("templates", settings.template), "utf8");
        const projects = content[section];

        for (const [index, project] of projects.entries()) {
            const next = projects[(index + 1) % projects.length];
            const page = createPageData(site, {
                title: project.seoTitle || project.title,
                description: project.seoDescription || project.description,
                path: project.url,
                ogImage: project.thumbnail?.src,
                bodyClass: `page-project page-project--${section}`,
                breadcrumbs: [
                    { label: "Startseite", href: "/" },
                    ...(settings.parent === PORTFOLIO_CRUMB ? [] : [PORTFOLIO_CRUMB]),
                    settings.parent,
                    { label: project.title, href: project.url }
                ]
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

/** One page per news article: /content/news/<slug>/ -> /news/<slug>/ */
async function buildNewsPages(site, content) {
    log.step("Building news articles");
    const template = fs.readFileSync(sourceFile("templates", "news-article.html"), "utf8");
    const builtPages = [];
    const listCrumb = { label: NEWS.label, href: NEWS.path };

    for (const [index, article] of content.news.entries()) {
        const page = createPageData(site, {
            title: article.title,
            description: article.description,
            path: article.url,
            ogImage: article.image,
            bodyClass: "page-news-article",
            headerTheme: "light",
            breadcrumbs: [{ label: "Startseite", href: "/" }, listCrumb, { label: article.title, href: article.url }]
        }, {});

        const htmlOutput = await renderPage({
            site, content, page, body: template,
            extra: { article, newer: content.news[index - 1] || null, older: content.news[index + 1] || null },
            sourceName: `templates/news-article.html (${article.slug})`
        });
        writeFile(outputPathFor(page.path), htmlOutput);
        builtPages.push(page);
        log.info(`${page.path.padEnd(34)} <- ${path.relative(ROOT, article.sourceFolder)}`);
    }
    return builtPages;
}

/** One explanation page per service package: /leistungen/<slug>/ */
async function buildServicePages(site, content) {
    log.step("Building service pages");
    const template = fs.readFileSync(sourceFile("templates", "service-page.html"), "utf8");
    const builtPages = [];

    for (const item of content.packages.filter((entry) => entry.slug && entry.detail)) {
        const page = createPageData(site, {
            title: item.name,
            description: item.detail.intro,
            path: item.url,
            bodyClass: "page-service",
            breadcrumbs: [{ label: "Startseite", href: "/" }, { label: "Leistungen", href: "/leistungen/" }, { label: item.name, href: item.url }]
        }, {});

        const htmlOutput = await renderPage({
            site, content, page, body: template,
            extra: { item, detail: item.detail },
            sourceName: `templates/service-page.html (${item.slug})`
        });
        writeFile(outputPathFor(page.path), htmlOutput);
        builtPages.push(page);
        log.info(`${page.path.padEnd(34)} <- content/leistungen/pakete.json (${item.slug})`);
    }
    return builtPages;
}

/** Public shop catalogue for the cart in the browser (names, images, prices).
 *  The server checks every order against /content again (backend/src/services/catalog.js). */
function writeShopCatalog(content) {
    const items = {};
    for (const fly of content.flies || []) items[`fly-${fly.slug}`] = { name: fly.name, kind: "fly", price: fly.price || "", image: fly.image.src, url: "/fliegen/" };
    for (const offer of content.angebote || []) {
        if (offer.label) items[`course-${offer.id}`] = { name: offer.title, kind: "course", price: offer.price || "", image: offer.image.src, url: "/kurse/" };
        for (const variant of offer.variants || []) {
            items[`course-${offer.id}-${variant.id}`] = { name: `${offer.title}: ${variant.label}`, kind: "course", price: `${variant.price} ${variant.priceNote}`, image: offer.image.src, url: "/kurse/" };
        }
    }
    for (const course of content.courses || []) {
        for (const offer of course.offers || []) items[`course-${offer.id}`] = { name: `${course.title}: ${offer.label}`, kind: "course", price: offer.price || "", image: course.image.src, url: course.url };
    }
    writeFile("data/katalog.json", JSON.stringify(items));
}

/** One landing page per course of a standalone variant: /akademie/<slug>/ */
async function buildCoursePages(site, content) {
    if (!content.courses?.length) return [];
    log.step("Building course pages");
    const template = fs.readFileSync(sourceFile("templates", "course-page.html"), "utf8");
    const builtPages = [];

    for (const course of content.courses) {
        const page = createPageData(site, {
            title: course.title,
            description: course.description,
            path: course.url,
            bodyClass: "page-course",
            ogImage: course.image?.src,
            breadcrumbs: [{ label: "Startseite", href: "/" }, { label: course.title, href: course.url }]
        }, {});

        const htmlOutput = await renderPage({ site, content, page, body: template, extra: { course }, sourceName: `templates/course-page.html (${course.slug})` });
        writeFile(outputPathFor(page.path), htmlOutput);
        builtPages.push(page);
        log.info(`${page.path.padEnd(34)} <- ${path.relative(ROOT, path.join(CONTENT, "kurse.json"))} (${course.slug})`);
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

/** Wraps one PNG image in an .ico file (supported by all current browsers). */
function pngToIco(png, size) {
    const header = Buffer.alloc(22);
    header.writeUInt16LE(0, 0);        // reserved
    header.writeUInt16LE(1, 2);        // type: icon
    header.writeUInt16LE(1, 4);        // one image
    header.writeUInt8(size, 6);        // width
    header.writeUInt8(size, 7);        // height
    header.writeUInt16LE(1, 10);       // colour planes
    header.writeUInt16LE(32, 12);      // bits per pixel
    header.writeUInt32LE(png.length, 14);
    header.writeUInt32LE(22, 18);      // image data starts after this header
    return Buffer.concat([header, png]);
}

async function buildIcons() {
    try {
        const sharp = (await import("sharp")).default;
        const svg = path.join(FRONTEND, "public", "favicon.svg");
        fs.mkdirSync(path.join(DIST, "assets", "brand"), { recursive: true });
        await sharp(svg, { density: 300 }).resize(192, 192).png().toFile(path.join(DIST, "assets", "brand", "icon-192.png"));
        await sharp(svg, { density: 300 }).resize(512, 512).png().toFile(path.join(DIST, "assets", "brand", "icon-512.png"));
        await sharp(svg, { density: 300 }).resize(180, 180).png().toFile(path.join(DIST, "apple-touch-icon.png"));
        // Older iOS versions ask for this name (avoids 404s in the logs)
        fs.copyFileSync(path.join(DIST, "apple-touch-icon.png"), path.join(DIST, "apple-touch-icon-precomposed.png"));
        // Browsers and crawlers request /favicon.ico automatically
        fs.writeFileSync(path.join(DIST, "favicon.ico"), pngToIco(await sharp(svg, { density: 300 }).resize(48, 48).png().toBuffer(), 48));
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
    const content = STANDALONE ? loadStandaloneContent() : loadContent(CONTENT, { includeDrafts });

    fs.rmSync(DIST, { recursive: true, force: true });
    fs.mkdirSync(DIST, { recursive: true });

    copyStaticFiles(content);
    buildCss();
    const pages = STANDALONE
        ? [
            ...(await buildPages(site, content)),
            ...(await buildNewsPages(site, content)),
            ...(await buildCoursePages(site, content))
        ]
        : [
            ...(await buildPages(site, content)),
            ...(await buildProjectPages(site, content)),
            ...(await buildNewsPages(site, content)),
            ...(await buildServicePages(site, content))
        ];
    if (!STANDALONE) await buildDemos(site, content);
    if (STANDALONE) writeShopCatalog(content);
    await buildSeoFiles(site, pages);

    log.printWarnings();
    console.log(`\n✓ Done in ${((Date.now() - started) / 1000).toFixed(1)}s -> frontend/${path.basename(DIST)}\n`);
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
        if (!file || /(^|[\\/])(dist(-[\w-]+)?|\.cache)([\\/]|$)/.test(file)) return;
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
