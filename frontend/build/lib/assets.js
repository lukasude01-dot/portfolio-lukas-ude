/**
 * STATIC FILES & CSS BUNDLE
 *
 * PURPOSE:
 * - Copies folders (assets, scripts, public files) into /dist.
 * - Combines all CSS files listed in /frontend/styles/main.css
 *   into ONE file. You keep many small, readable CSS files;
 *   visitors download a single stylesheet (faster).
 */

import fs from "node:fs";
import path from "node:path";
import { log } from "./logger.js";

/** Copies a folder recursively. `filter(file)` can skip files. */
export function copyFolder(source, target, filter = () => true) {
    if (!fs.existsSync(source)) return;
    for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
        const from = path.join(source, entry.name);
        const to = path.join(target, entry.name);
        if (entry.isDirectory()) {
            copyFolder(from, to, filter);
        } else if (filter(from)) {
            fs.mkdirSync(path.dirname(to), { recursive: true });
            fs.copyFileSync(from, to);
        }
    }
}

/**
 * Replaces every  @import url("./base/reset.css");  in main.css
 * with the content of that file (with a comment showing where it came from).
 */
export function bundleCss(entryFile) {
    const baseDir = path.dirname(entryFile);
    const source = fs.readFileSync(entryFile, "utf8");

    return source.replace(/@import\s+url\(["']?([^"')]+)["']?\);?/g, (match, importPath) => {
        const file = path.join(baseDir, importPath);
        if (!fs.existsSync(file)) {
            log.fail("CSS", `main.css imports "${importPath}", but that file does not exist.`);
        }
        return `/* --- from styles/${importPath.replace(/^\.\//, "")} --- */\n${fs.readFileSync(file, "utf8")}`;
    });
}
