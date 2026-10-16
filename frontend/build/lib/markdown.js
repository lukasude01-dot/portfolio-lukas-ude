/**
 * MARKDOWN  (simple text format for news articles)
 *
 * PURPOSE:
 * Turns the text of /content/news/<article>/article.md into HTML.
 * Only a small, safe set of Markdown is supported:
 *
 *   ## Heading               -> <h2>   (### -> <h3>)
 *   Empty line               -> new paragraph
 *   - item  /  1. item       -> list
 *   > quote                  -> highlighted quote
 *   **bold**   *italic*      -> <strong> / <em>
 *   [link text](https://...) -> link
 *
 * SECURITY:
 * All text is escaped first, so HTML typed into an article is shown
 * as text and never executed. Links go through safeUrl().
 *
 * DO NOT EDIT WITHOUT TESTING: every news article uses this.
 */

import { escapeHtml, safeUrl } from "./html.js";

/** Inline formatting inside one line of (already escaped) text. */
function inline(text) {
    return text
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<em>$2</em>")
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label, url) => {
            const href = safeUrl(url.replace(/&amp;/g, "&"));
            const external = /^https?:/.test(href);
            return `<a class="link-underline" href="${escapeHtml(href)}"${external ? ' rel="noopener" target="_blank"' : ""}>${label}</a>`;
        });
}

/** Converts Markdown text to HTML (see the list above). */
export function markdownToHtml(source) {
    const blocks = source.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
    const output = [];

    for (const block of blocks) {
        const lines = block.split("\n").map((line) => escapeHtml(line.trim()));
        const first = lines[0];

        if (/^#{2,3} /.test(first) && lines.length === 1) {
            const level = first.startsWith("### ") ? 3 : 2;
            output.push(`<h${level}>${inline(first.replace(/^#{2,3} /, ""))}</h${level}>`);
        } else if (lines.every((line) => /^[-*] /.test(line))) {
            output.push(`<ul>${lines.map((line) => `<li>${inline(line.slice(2))}</li>`).join("")}</ul>`);
        } else if (lines.every((line) => /^\d+\. /.test(line))) {
            output.push(`<ol>${lines.map((line) => `<li>${inline(line.replace(/^\d+\. /, ""))}</li>`).join("")}</ol>`);
        } else if (lines.every((line) => line.startsWith("&gt;"))) {
            output.push(`<blockquote><p>${inline(lines.map((line) => line.replace(/^&gt;\s?/, "")).join(" "))}</p></blockquote>`);
        } else {
            output.push(`<p>${inline(lines.join(" "))}</p>`);
        }
    }
    return output.join("\n");
}

/** Rough reading time in minutes (about 200 words per minute). */
export function readingTime(source) {
    const words = source.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
}
