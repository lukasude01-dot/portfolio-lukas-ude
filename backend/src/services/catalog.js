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
    const courses = readJson(path.join(contentDir, "kurse.json"));
    for (const offer of courses.angebote || []) {
        if (offer.label) catalog[`course-${offer.id}`] = { name: offer.title, kind: "course", price: offer.price || "" };
        // price levels, e.g. single person / 2 to 3 persons
        for (const variant of offer.variants || []) {
            catalog[`course-${offer.id}-${variant.id}`] = { name: `${offer.title}: ${variant.label}`, kind: "course", price: `${variant.price} ${variant.priceNote}` };
        }
    }
    for (const course of courses.courses || []) {
        for (const offer of course.offers || []) {
            catalog[`course-${offer.id}`] = { name: `${course.title}: ${offer.label}`, kind: "course", price: offer.price || "" };
        }
    }
    return catalog;
}
