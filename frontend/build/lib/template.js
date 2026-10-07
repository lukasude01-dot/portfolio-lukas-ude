/**
 * TEMPLATE ENGINE  (tiny, build-time only)
 *
 * PURPOSE:
 * Turns the HTML files in /frontend/pages, /frontend/components
 * and /frontend/templates into finished pages.
 *
 * SUPPORTED SYNTAX (this is everything - intentionally small):
 *
 *   <!-- @include navigation -->
 *       Inserts /frontend/components/navigation.html
 *
 *   {{ site.name }}
 *       Inserts a value (escaped = safe). Values come from
 *       /frontend/config/site.js (site.*), the page front matter
 *       (page.*) or the current content item (project.*).
 *
 *   {{{ page.body }}}
 *       Inserts a value WITHOUT escaping (trusted HTML only).
 *
 *   <!-- @render featured-work -->
 *       Calls the renderer function "featured-work" from
 *       /frontend/build/renderers/ and inserts its HTML.
 *       Renderers build lists from the /content folder.
 *
 * DO NOT EDIT WITHOUT TESTING: every page depends on this file.
 */

import fs from "node:fs";
import path from "node:path";
import { escapeHtml } from "./html.js";
import { log } from "./logger.js";

const INCLUDE_PATTERN = /<!--\s*@include\s+([\w-]+)\s*-->/g;
const RENDER_PATTERN = /<!--\s*@render\s+([\w-]+)\s*-->/g;
const RAW_VALUE_PATTERN = /\{\{\{\s*([\w.]+)\s*\}\}\}/g;
const VALUE_PATTERN = /\{\{\s*([\w.]+)\s*\}\}/g;

/** Reads "a.b.c" from an object. */
function lookup(context, dottedPath) {
    return dottedPath.split(".").reduce((value, key) => (value == null ? undefined : value[key]), context);
}

function resolveIncludes(source, componentsDir, sourceName, depth = 0) {
    if (depth > 10) log.fail("TEMPLATE", `Includes nested too deeply in ${sourceName} (circular include?)`);
    return source.replace(INCLUDE_PATTERN, (match, name) => {
        const file = path.join(componentsDir, `${name}.html`);
        if (!fs.existsSync(file)) {
            log.fail("TEMPLATE", `"${sourceName}" includes "${name}", but ${path.relative(process.cwd(), file)} does not exist.`);
        }
        return resolveIncludes(fs.readFileSync(file, "utf8"), componentsDir, name, depth + 1);
    });
}

/**
 * Renders a template string.
 * @param {string} source       Template HTML
 * @param {object} context      Values available as {{ ... }}
 * @param {object} options      { componentsDir, renderers, sourceName }
 */
export function renderTemplate(source, context, { componentsDir, renderers, sourceName }) {
    let output = resolveIncludes(source, componentsDir, sourceName);

    output = output.replace(RAW_VALUE_PATTERN, (match, key) => {
        const value = lookup(context, key);
        if (value === undefined) log.warn("TEMPLATE", `${sourceName}: unknown value {{{ ${key} }}}`);
        return value == null ? "" : String(value);
    });

    output = output.replace(VALUE_PATTERN, (match, key) => {
        const value = lookup(context, key);
        if (value === undefined) log.warn("TEMPLATE", `${sourceName}: unknown value {{ ${key} }}`);
        return escapeHtml(value);
    });

    output = output.replace(RENDER_PATTERN, (match, name) => {
        const renderer = renderers[name];
        if (!renderer) log.fail("TEMPLATE", `${sourceName} uses <!-- @render ${name} -->, but no renderer called "${name}" exists in /frontend/build/renderers/.`);
        return String(renderer(context));
    });

    return output;
}

/**
 * Splits a page file into front matter (settings between --- lines)
 * and the HTML body.
 *
 * Example page start:
 *   ---
 *   title: Funnels & Landing Pages
 *   description: Interactive funnel demos ...
 *   path: /funnels/
 *   ---
 */
export function parseFrontMatter(source, sourceName) {
    const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (!match) return { data: {}, body: source };

    const data = {};
    for (const line of match[1].split(/\r?\n/)) {
        if (!line.trim() || line.trim().startsWith("#")) continue;
        const separator = line.indexOf(":");
        if (separator === -1) {
            log.warn("TEMPLATE", `${sourceName}: front matter line ignored (missing ":") -> "${line}"`);
            continue;
        }
        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim();
        data[key] = value === "true" ? true : value === "false" ? false : value;
    }
    return { data, body: source.slice(match[0].length) };
}
