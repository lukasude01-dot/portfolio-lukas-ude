/**
 * RESPONSIVE IMAGES  (automatic image optimisation)
 *
 * PURPOSE:
 * You write a normal image tag in any page or template:
 *
 *   <img src="/assets/images/portrait/lukas-ude-portrait.jpg"
 *        alt="Lukas Ude" sizes="50vw" data-responsive>
 *
 * The build replaces it with a <picture> element that offers
 * AVIF + WebP + JPEG in several widths. Browsers download only
 * the smallest file they need -> fast pages (Core Web Vitals).
 *
 * - Original files are NEVER changed. Optimised copies are
 *   written to /frontend/dist and cached in /frontend/.cache.
 * - Width/height are added automatically (prevents layout jumps).
 * - Images load lazily unless you add loading="eager"
 *   (use eager only for the first big image on a page).
 *
 * Requires the "sharp" package (installed with `npm install`).
 * Without it the build still works and uses the original files.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { log } from "./logger.js";

// SAFE TO EDIT: generated widths (pixels) and quality settings
const WIDTHS = [480, 800, 1200, 1600, 2000];
const QUALITY = { avif: 55, webp: 78, jpeg: 80, png: 90 };

const IMG_TAG = /<img\b[^>]*\bdata-responsive\b[^>]*>/g;
const ATTRIBUTE = /([^\s=]+)(?:="([^"]*)")?/g;

let sharpModule;
async function loadSharp() {
    if (sharpModule !== undefined) return sharpModule;
    try {
        sharpModule = (await import("sharp")).default;
    } catch {
        sharpModule = null;
        log.warn("IMAGES", 'The "sharp" package is not installed, so images are NOT optimised. Run `npm install` inside /frontend.');
    }
    return sharpModule;
}

function parseAttributes(tag) {
    const inner = tag.replace(/^<img\b/, "").replace(/\/?>$/, "");
    const attributes = {};
    for (const [, name, value] of inner.matchAll(ATTRIBUTE)) attributes[name] = value ?? "";
    return attributes;
}

function attributesToString(attributes) {
    return Object.entries(attributes)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([name, value]) => (value === "" && name !== "alt" ? name : `${name}="${value}"`))
        .join(" ");
}

/**
 * Creates (or re-uses from cache) one resized file.
 * Returns the public URL of the variant.
 */
async function createVariant(sharp, source, { width, format, publicDir, publicUrl, cacheDir, distDir }) {
    const stat = fs.statSync(source);
    const hash = crypto.createHash("sha1").update(`${source}|${stat.size}|${stat.mtimeMs}|${width}|${format}|${QUALITY[format]}`).digest("hex").slice(0, 16);
    const cached = path.join(cacheDir, `${hash}.${format}`);

    if (!fs.existsSync(cached)) {
        fs.mkdirSync(cacheDir, { recursive: true });
        await sharp(source).rotate().resize({ width, withoutEnlargement: true })[format]({ quality: QUALITY[format] }).toFile(cached);
    }

    const extension = format === "jpeg" ? "jpg" : format;
    const fileName = `${path.parse(publicUrl).name}-${width}.${extension}`;
    const target = path.join(distDir, publicDir, fileName);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(cached, target);
    return `${publicDir}/${fileName}`;
}

/**
 * Replaces every <img data-responsive> in the HTML with <picture>.
 * @param {string} pageHtml
 * @param {object} options { distDir, cacheDir, resolveSource(url) -> absolute file path | null, pageName }
 */
export async function buildResponsiveImages(pageHtml, { distDir, cacheDir, resolveSource, pageName }) {
    const tags = [...new Set(pageHtml.match(IMG_TAG) || [])];
    if (tags.length === 0) return pageHtml;

    const sharp = await loadSharp();
    let output = pageHtml;

    for (const tag of tags) {
        const attributes = parseAttributes(tag);
        delete attributes["data-responsive"];

        if (!("alt" in attributes)) log.warn("IMAGES", `${pageName}: <img src="${attributes.src}"> has no alt attribute.`);

        const source = resolveSource(attributes.src);
        const isRaster = /\.(jpe?g|png|webp)$/i.test(attributes.src || "");

        attributes.loading = attributes.loading || "lazy";
        attributes.decoding = attributes.decoding || "async";

        if (!source || !fs.existsSync(source)) {
            log.warn("IMAGES", `${pageName}: image not found -> ${attributes.src}`);
            output = output.split(tag).join(`<img ${attributesToString(attributes)}>`);
            continue;
        }

        if (!sharp || !isRaster) {
            output = output.split(tag).join(`<img ${attributesToString(attributes)}>`);
            continue;
        }

        try {
            const metadata = await sharp(source).metadata();
            const originalWidth = metadata.width;
            const widths = WIDTHS.filter((width) => width < originalWidth);
            widths.push(Math.min(originalWidth, WIDTHS[WIDTHS.length - 1]));
            const uniqueWidths = [...new Set(widths)];

            const fallbackFormat = metadata.hasAlpha ? "png" : "jpeg";
            const publicDir = path.posix.dirname(attributes.src);
            const shared = { publicDir, publicUrl: attributes.src, cacheDir, distDir };

            const srcset = {};
            for (const format of ["avif", "webp", fallbackFormat]) {
                const entries = [];
                for (const width of uniqueWidths) {
                    const url = await createVariant(sharp, source, { ...shared, width, format });
                    entries.push(`${url} ${width}w`);
                }
                srcset[format] = entries.join(", ");
            }

            const sizes = attributes.sizes || "100vw";
            const middle = uniqueWidths[Math.min(1, uniqueWidths.length - 1)];
            const fallbackUrl = srcset[fallbackFormat].split(", ").find((entry) => entry.endsWith(` ${middle}w`)).split(" ")[0];

            const displayWidth = uniqueWidths[uniqueWidths.length - 1];
            const imgAttributes = {
                ...attributes,
                src: fallbackUrl,
                srcset: srcset[fallbackFormat],
                sizes,
                width: attributes.width || String(displayWidth),
                height: attributes.height || String(Math.round((metadata.height / metadata.width) * displayWidth))
            };

            const picture =
                `<picture>` +
                `<source type="image/avif" srcset="${srcset.avif}" sizes="${sizes}">` +
                `<source type="image/webp" srcset="${srcset.webp}" sizes="${sizes}">` +
                `<img ${attributesToString(imgAttributes)}>` +
                `</picture>`;

            output = output.split(tag).join(picture);
        } catch (error) {
            log.warn("IMAGES", `${pageName}: could not optimise ${attributes.src} (${error.message}). Using the original file.`);
            output = output.split(tag).join(`<img ${attributesToString(attributes)}>`);
        }
    }

    return output;
}
