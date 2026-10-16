/**
 * CONTENT LOADER
 *
 * PURPOSE:
 * Reads all portfolio content from the /content folder.
 *
 * FOLDER RULE (one folder = one project):
 *   /content/<section>/<project-slug>/project.json   <- the text
 *   /content/<section>/<project-slug>/*.jpg|png|webp <- its images
 *
 *   Sections: portfolio, funnels, creatives, design, ai
 *   The folder name becomes the URL, e.g.
 *   /content/funnels/recruiting-demo/ -> /portfolio/funnels/recruiting-demo/
 *
 * IMAGES:
 * Inside project.json you only write the file name, e.g.
 *   "thumbnail": { "src": "cover.jpg", "alt": "..." }
 * The loader turns it into the public URL
 *   /media/funnels/recruiting-demo/cover.jpg
 *
 * NEWS (knowledge articles, one folder per article):
 *   /content/news/<article-slug>/article.md   <- text (Markdown)
 *   /content/news/<article-slug>/*.jpg        <- optional cover image
 *   URL: /news/<article-slug>/
 *
 * CAREER (CV / timeline / skills):
 *   /content/career/timeline.json
 *   /content/career/skills.json
 *
 * CHECKS (shown as warnings after the build):
 * - images without alt text
 * - image files that do not exist
 * - placeholders like [ADD DATE]
 * - example content that should be replaced before launch
 */

import fs from "node:fs";
import path from "node:path";
import { log } from "./logger.js";
import { CONTACT_TOPICS } from "../../../shared/contact-schema.js";
import { parseFrontMatter } from "./template.js";
import { markdownToHtml, readingTime } from "./markdown.js";

export const CONTENT_SECTIONS = ["portfolio", "funnels", "creatives", "design", "ai"];

// Public URL of each section. Funnels, Creatives, Design and KI are
// sub-pages of the Portfolio. EDIT WITH CARE: must match the "path:"
// in the matching /frontend/pages/*.html file.
export const SECTION_PATHS = {
    portfolio: "/portfolio/",
    funnels: "/portfolio/funnels/",
    creatives: "/portfolio/creatives/",
    design: "/portfolio/design/",
    ai: "/portfolio/ki/"
};

const IMAGE_FILE = /\.(jpe?g|png|webp|avif|gif|svg)$/i;
const PLACEHOLDER = /\[ADD [^\]]+\]/g;

function readJson(file) {
    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (error) {
        log.fail(
            "CONTENT",
            `Could not read ${path.relative(process.cwd(), file)}.`,
            `This is usually a JSON typo (missing comma, missing quote, trailing comma). Reason: ${error.message}`
        );
    }
}

/**
 * Walks through the project data and converts image file names
 * into public /media/... URLs. Also checks alt texts.
 */
function resolveMedia(value, context) {
    if (Array.isArray(value)) return value.map((item) => resolveMedia(item, context));

    if (value && typeof value === "object") {
        const result = {};
        for (const [key, item] of Object.entries(value)) result[key] = resolveMedia(item, context);

        if (typeof value.src === "string" && IMAGE_FILE.test(value.src) && !("alt" in value)) {
            log.warn("CONTENT", `${context.label}: image "${value.src}" has no "alt" text (describe the image for screen readers).`);
        }
        return result;
    }

    if (typeof value === "string" && IMAGE_FILE.test(value) && !/^(https?:|\/)/.test(value)) {
        const file = path.join(context.folder, value);
        if (!fs.existsSync(file)) {
            log.warn("CONTENT", `${context.label}: image "${value}" not found in ${path.relative(process.cwd(), context.folder)}/`);
        }
        return `/media/${context.section}/${context.slug}/${value}`;
    }

    return value;
}

function countPlaceholders(data, label) {
    // Keys starting with "_" are help texts and are not checked.
    const text = JSON.stringify(data, (key, value) => (key.startsWith("_") ? undefined : value));
    const matches = text.match(PLACEHOLDER) || [];
    if (matches.length > 0) {
        log.warn("PLACEHOLDERS", `${label}: ${matches.length} placeholder(s) still to fill in (${[...new Set(matches)].slice(0, 4).join(", ")}${matches.length > 4 ? ", ..." : ""})`);
    }
}

function loadSection(contentDir, section, { includeDrafts }) {
    const sectionDir = path.join(contentDir, section);
    if (!fs.existsSync(sectionDir)) return [];

    const projects = [];
    for (const entry of fs.readdirSync(sectionDir, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name.startsWith("_")) continue; // "_template" folders are ignored

        const folder = path.join(sectionDir, entry.name);
        const file = path.join(folder, "project.json");
        if (!fs.existsSync(file)) {
            log.warn("CONTENT", `content/${section}/${entry.name}/ has no project.json – folder skipped.`);
            continue;
        }

        const slug = entry.name;
        const label = `content/${section}/${slug}/project.json`;
        const data = readJson(file);

        if (!data.title) log.fail("CONTENT", `${label} is missing the required field "title".`);
        if (data.status === "draft" && !includeDrafts) continue;

        const project = resolveMedia(data, { folder, section, slug, label });
        project.slug = slug;
        project.section = section;
        // URLs: everything lives below /portfolio/ (see SECTION_PATHS).
        // AI workflows are shown on the KI page itself (no own page).
        project.url = section === "ai" ? `${SECTION_PATHS.ai}#workflow-${slug}` : `${SECTION_PATHS[section]}${slug}/`;
        project.categories = [].concat(data.category || []);
        project.status = data.status || "published";
        project.sourceFolder = folder;

        if (data.example) log.warn("EXAMPLE CONTENT", `${label} is example content ("example": true). Replace it with real work or set "status": "draft".`);
        countPlaceholders(data, label);

        projects.push(project);
    }

    // Sort: lower "order" first, then newest year first
    return projects.sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || String(b.year).localeCompare(String(a.year)));
}

const GERMAN_MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

/** "2026-10-16" -> "16. Oktober 2026" */
function germanDate(value) {
    const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return String(value || "");
    return `${Number(match[3])}. ${GERMAN_MONTHS[Number(match[2]) - 1]} ${match[1]}`;
}

/** Reads all news articles, newest first. */
function loadNews(contentDir, { includeDrafts }) {
    const newsDir = path.join(contentDir, "news");
    if (!fs.existsSync(newsDir)) return [];

    const articles = [];
    for (const entry of fs.readdirSync(newsDir, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name.startsWith("_")) continue;
        const folder = path.join(newsDir, entry.name);
        const file = path.join(folder, "article.md");
        const label = `content/news/${entry.name}/article.md`;
        if (!fs.existsSync(file)) {
            log.warn("CONTENT", `content/news/${entry.name}/ has no article.md, folder skipped.`);
            continue;
        }

        const { data, body } = parseFrontMatter(fs.readFileSync(file, "utf8"), label);
        if (!data.title) log.fail("CONTENT", `${label} is missing the required field "title".`);
        if (data.status === "draft" && !includeDrafts) continue;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date || "")) log.warn("CONTENT", `${label}: "date" should look like 2026-10-16.`);

        const slug = entry.name;
        const image = data.image ? resolveMedia(data.image, { folder, section: "news", slug, label }) : "";
        if (data.image && !data.imageAlt) log.warn("CONTENT", `${label}: image "${data.image}" has no "imageAlt" text.`);
        countPlaceholders({ data, body }, label);

        articles.push({
            ...data,
            category: data.category || "Wissen",
            slug,
            section: "news",
            url: `/news/${slug}/`,
            image,
            dateLabel: germanDate(data.date),
            readingTime: readingTime(body),
            html: markdownToHtml(body),
            sourceFolder: folder
        });
    }
    return articles.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

/** Loads everything from /content. Returns { funnels, creatives, design, ai, career, all } */
export function loadContent(contentDir, options = {}) {
    const content = {};
    for (const section of CONTENT_SECTIONS) content[section] = loadSection(contentDir, section, options);

    const careerDir = path.join(contentDir, "career");
    const timeline = readJson(path.join(careerDir, "timeline.json"));
    const skills = readJson(path.join(careerDir, "skills.json"));
    countPlaceholders(timeline, "content/career/timeline.json");
    countPlaceholders(skills, "content/career/skills.json");
    content.career = { timeline, skills };

    // LEISTUNGEN (packages on /leistungen/)
    const packagesFile = path.join(contentDir, "leistungen", "pakete.json");
    content.packages = fs.existsSync(packagesFile) ? readJson(packagesFile).packages || [] : [];
    for (const item of content.packages) {
        if (item.topic && !CONTACT_TOPICS.includes(item.topic)) {
            log.warn("CONTENT", `content/leistungen/pakete.json: topic "${item.topic}" of "${item.name}" is not in CONTACT_TOPICS (/shared/contact-schema.js).`);
        }
    }

    content.news = loadNews(contentDir, options);

    content.all = CONTENT_SECTIONS.flatMap((section) => content[section]);
    return content;
}
