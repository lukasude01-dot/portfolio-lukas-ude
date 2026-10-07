/**
 * DESIGN RENDERERS
 *
 * PURPOSE:
 * - "design-filters":  category buttons on /design/
 * - "design-grid":     the editorial grid (large feature tiles,
 *                      tall/wide tiles, quick view in full screen)
 * - "design-gallery":  all images of one design project
 *                      (template: /frontend/templates/design-project.html)
 *
 * CONTENT:  /content/design/<slug>/project.json
 *           "layout": "feature" | "tall" | "wide" | "standard"
 *           controls the tile size in the grid.
 *
 * RELATED STYLES:  /frontend/styles/pages/design.css
 *                  /frontend/styles/components/lightbox.css
 * RELATED SCRIPT:  /frontend/scripts/modules/lightbox.js
 */

import { html } from "../lib/html.js";
import { filterBar, projectBadges } from "./work.js";

const TILE_SIZES = {
    feature: "(min-width: 900px) 66vw, 100vw",
    wide: "(min-width: 900px) 66vw, 100vw",
    tall: "(min-width: 900px) 33vw, 100vw",
    standard: "(min-width: 900px) 33vw, 100vw"
};

export const designRenderers = {

    "design-filters": ({ content }) => {
        const categories = [...new Set(content.design.flatMap((project) => project.categories))];
        const filters = [{ label: "Alle", value: "all" }, ...categories.map((name) => ({ label: name, value: name.toLowerCase() }))];
        return filterBar(filters, { label: "Designarbeiten nach Kategorie filtern", target: "design-grid" });
    },

    // DESIGN PAGE - EDITORIAL GRID
    "design-grid": ({ content }) => html`
            <div class="design-grid" id="design-grid" data-filter-list>
                ${content.design.map((project) => {
                    const layout = TILE_SIZES[project.layout] ? project.layout : "standard";
                    const filterValues = project.categories.map((category) => category.toLowerCase()).join(" ");
                    const gallery = project.images || [];
                    return html`
                <article class="design-tile design-tile--${layout}" data-filter-item data-filter-values="${filterValues}" data-lightbox-group>
                    <a class="design-tile__link" href="${project.url}" data-cursor-label="Ansehen">
                        <div class="design-tile__media" data-reveal="mask">
                            <img src="${project.thumbnail.src}" alt="${project.thumbnail.alt}" sizes="${TILE_SIZES[layout]}" data-responsive>
                        </div>
                        <div class="design-tile__overlay">
                            <p class="label">${project.categories.join(" · ")} · ${project.year}</p>
                            <h2 class="design-tile__title">${project.title}</h2>
                            <p class="design-tile__badges">${projectBadges(project).map((badge) => html`<span class="badge">${badge}</span>`)}</p>
                        </div>
                    </a>
                    ${gallery.length ? html`
                    <a class="design-tile__quick-view" href="${gallery[0].src}" data-lightbox data-caption="${gallery[0].caption || gallery[0].alt}">
                        <span class="visually-hidden">Vollbild-Vorschau: ${project.title}</span>
                        <span aria-hidden="true">⤢</span>
                    </a>
                    ${gallery.slice(1).map((image) => html`<a href="${image.src}" data-lightbox data-caption="${image.caption || image.alt}" hidden tabindex="-1">${image.alt}</a>`)}` : ""}
                </article>`;
                })}
            </div>
            <p class="filter-empty text-muted" data-filter-empty hidden>In dieser Kategorie gibt es noch keine Designarbeiten.</p>`,

    "design-facts": ({ project }) => html`
                <dl class="project-facts">
                    <div><dt class="label">Kunde</dt><dd>${project.client}</dd></div>
                    <div><dt class="label">Jahr</dt><dd>${project.year}</dd></div>
                    <div><dt class="label">Kategorie</dt><dd>${project.categories.join(", ")}</dd></div>
                    <div><dt class="label">Leistungen</dt><dd>${(project.services || []).join(", ")}</dd></div>
                </dl>`,

    "design-body": ({ project }) => html`${(project.body || []).map((paragraph) => html`<p>${paragraph}</p>`)}`,

    // DESIGN CASE - GALLERY (click = full screen)
    "design-gallery": ({ project }) => html`
                <div class="design-gallery" data-lightbox-group>
                    ${(project.images || []).map((image) => html`
                    <figure class="design-gallery__item design-gallery__item--${image.size || "full"}" data-reveal>
                        <a href="${image.src}" data-lightbox data-caption="${image.caption || image.alt}" data-cursor-label="Vergrößern">
                            <img src="${image.src}" alt="${image.alt}" sizes="${image.size === "half" ? "(min-width: 900px) 50vw, 100vw" : "100vw"}" data-responsive>
                        </a>
                        ${image.caption ? html`<figcaption class="text-small text-muted">${image.caption}</figcaption>` : ""}
                    </figure>`)}
                </div>`
};
