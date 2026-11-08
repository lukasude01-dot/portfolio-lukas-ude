/**
 * SHOP CATALOGUE  (what can be ordered on flyfishing.lukasude.de)
 *
 * PURPOSE:
 * Reads the flies and courses from /content/flyfishing/ once at startup.
 * The order route only accepts these IDs and takes names and prices
 * from here, never from the browser.
 *
 * IDs:  "fly-<slug>"     a fly from fliegen.json
 *       "course-<slug>"  a course offer from kurse.json ("offers")
 */

import fs from "node:fs";
import path from "node:path";

const readJson = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {});

export function loadCatalog(contentDir) {
    const catalog = {};
    for (const fly of readJson(path.join(contentDir, "fliegen.json")).flies || []) {
        catalog[`fly-${fly.slug}`] = { name: fly.name, kind: "fly", price: fly.price || "" };
    }
    for (const course of readJson(path.join(contentDir, "kurse.json")).courses || []) {
        for (const offer of course.offers || []) {
            catalog[`course-${offer.id}`] = { name: `${course.title}: ${offer.label}`, kind: "course", price: offer.price || "" };
        }
    }
    return catalog;
}
