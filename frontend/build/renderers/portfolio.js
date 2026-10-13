/**
 * PORTFOLIO RENDERERS  (Selected Work)
 *
 * PURPOSE:
 * - "portfolio-grid":     the editorial grid on /portfolio/
 * - "portfolio-*":        the parts of one portfolio project page
 *                         (template: /frontend/templates/portfolio-project.html)
 *
 * CONTENT:  /content/portfolio/<slug>/project.json + the original graphics
 *
 * IMAGE RULE (important):
 * The graphics are finished designs with text inside them. They are
 * NEVER cropped: every image keeps its own aspect ratio, both in the
 * grid and on the detail pages.
 *
 * Card size in the grid comes from "layout" in project.json:
 *   feature  large card (left)          side     smaller card next to it
 *   tall     large vertical card        wide     broad card with several motifs
 *   closing  full-width closing card with all motifs
 *
 * RELATED STYLES:  /frontend/styles/pages/portfolio.css
 */

import { html } from "../lib/html.js";

const LAYOUTS = ["feature", "side", "tall", "wide", "closing"];

// How large each card is on screen -> lets the browser pick the right image size
const CARD_SIZES = {
    feature: "(min-width: 1000px) 55vw, 100vw",
    side: "(min-width: 1000px) 38vw, 100vw",
    tall: "(min-width: 1000px) 40vw, 100vw",
    wide: "(min-width: 1000px) 28vw, 50vw",
    closing: "(min-width: 1000px) 30vw, 50vw"
};

/** Images shown on a card: wide/closing cards show every motif, the others the thumbnail. */
function cardImages(project, layout) {
    if ((layout === "wide" || layout === "closing") && project.images?.length > 1) return project.images;
    return [project.thumbnail];
}

export const portfolioRenderers = {

    // PORTFOLIO PAGE - EDITORIAL GRID
    "portfolio-grid": ({ content }) => html`
            <ol class="portfolio-grid" role="list">
                ${content.portfolio.map((project, index) => {
                    const layout = LAYOUTS.includes(project.layout) ? project.layout : "side";
                    const images = cardImages(project, layout);
                    return html`
                <li class="portfolio-card portfolio-card--${layout}" data-reveal>
                    <a class="portfolio-card__link" href="${project.url}" data-cursor-label="Ansehen">
                        <div class="portfolio-card__media portfolio-card__media--count-${images.length}">
                            ${images.map((image) => html`
                            <figure class="portfolio-card__image">
                                <img src="${image.src}" alt="${image.alt}" sizes="${CARD_SIZES[layout]}" data-responsive>
                            </figure>`)}
                        </div>
                        <div class="portfolio-card__body">
                            <p class="portfolio-card__index label">${String(index + 1).padStart(2, "0")}</p>
                            <div class="portfolio-card__text">
                                <h2 class="portfolio-card__title">${project.title}</h2>
                                <p class="portfolio-card__category">${project.categories.join(" · ")}</p>
                            </div>
                            <p class="portfolio-card__meta">
                                ${project.projectStatus ? html`<span class="badge">${project.projectStatus}</span>` : ""}
                                <span class="portfolio-card__action">Projekt ansehen <span aria-hidden="true">→</span></span>
                            </p>
                        </div>
                    </a>
                </li>`;
                })}
            </ol>`,

    // PROJECT PAGE - KEY FACTS
    "portfolio-facts": ({ project }) => html`
                <dl class="project-facts">
                    <div><dt class="label">Kategorie</dt><dd>${project.categories.join(", ")}</dd></div>
                    <div><dt class="label">Status</dt><dd>${project.projectStatus}</dd></div>
                </dl>`,

    // PROJECT PAGE - NOTE (e.g. "Freie Konzeptarbeit, keine Zusammenarbeit mit Ford")
    "portfolio-notice": ({ project }) => project.disclaimer ? html`
                <p class="notice"><span class="label">Hinweis</span> ${project.disclaimer}</p>` : "",

    // PROJECT PAGE - MAIN MOTIF (complete, uncropped; click = full screen)
    "portfolio-main": ({ project }) => {
        const image = project.images[0];
        return html`
                <figure class="portfolio-motif portfolio-motif--main" data-lightbox-group>
                    <a class="portfolio-motif__link" href="${image.src}" data-lightbox data-caption="${image.caption || image.alt}" data-cursor-label="Vollbild">
                        <img src="${image.src}" alt="${image.alt}" sizes="(min-width: 900px) 640px, 92vw" loading="eager" fetchpriority="high" data-responsive>
                    </a>
                    ${image.caption ? html`<figcaption class="portfolio-motif__caption text-small text-muted">${image.caption}</figcaption>` : ""}
                </figure>`;
    },

    // PROJECT PAGE - TASK / APPROACH / SERVICES
    "portfolio-brief": ({ project }) => html`
                <div class="portfolio-brief">
                    <section class="portfolio-brief__item" aria-labelledby="brief-task">
                        <h2 class="portfolio-brief__label label" id="brief-task">Aufgabenstellung</h2>
                        <p>${project.task}</p>
                    </section>
                    <section class="portfolio-brief__item" aria-labelledby="brief-approach">
                        <h2 class="portfolio-brief__label label" id="brief-approach">Gestalterischer Ansatz</h2>
                        <p>${project.approach}</p>
                    </section>
                    <section class="portfolio-brief__item" aria-labelledby="brief-services">
                        <h2 class="portfolio-brief__label label" id="brief-services">Leistungen</h2>
                        <ul class="bullet-list" role="list">${(project.services || []).map((service) => html`<li>${service}</li>`)}</ul>
                    </section>
                </div>`,

    // PROJECT PAGE - FURTHER MOTIFS (only if there is more than one image)
    "portfolio-gallery": ({ project }) => {
        const more = project.images.slice(1);
        if (more.length === 0) return "";
        return html`
        <section class="portfolio-more theme-dark section" aria-labelledby="more-heading">
            <div class="container">
                <header class="section-header">
                    <p class="eyebrow eyebrow--line">Weitere Motive</p>
                    <h2 class="heading-2" id="more-heading">${more.length === 1 ? "Die zweite Variante." : "Alle Motive der Serie."}</h2>
                </header>
                <div class="portfolio-more__grid portfolio-more__grid--${more.length}" data-lightbox-group>
                    ${more.map((image) => html`
                    <figure class="portfolio-motif" data-reveal>
                        <a class="portfolio-motif__link" href="${image.src}" data-lightbox data-caption="${image.caption || image.alt}" data-cursor-label="Vollbild">
                            <img src="${image.src}" alt="${image.alt}" sizes="(min-width: 900px) 45vw, 92vw" data-responsive>
                        </a>
                        ${image.caption ? html`<figcaption class="portfolio-motif__caption text-small text-muted">${image.caption}</figcaption>` : ""}
                    </figure>`)}
                </div>
            </div>
        </section>`;
    },

    // PROJECT PAGE - NEXT PROJECT (with small preview)
    "portfolio-next": ({ next }) => next ? html`
        <nav class="portfolio-next theme-dark" aria-label="Nächstes Projekt">
            <div class="container">
                <a class="portfolio-next__link" href="${next.url}" data-cursor-label="Weiter">
                    <figure class="portfolio-next__thumb">
                        <img src="${next.thumbnail.src}" alt="" sizes="160px" data-responsive>
                    </figure>
                    <span class="portfolio-next__text">
                        <span class="eyebrow">Nächstes Projekt ansehen</span>
                        <span class="portfolio-next__title heading-2">${next.title}</span>
                        <span class="portfolio-next__category text-muted">${next.categories.join(" · ")}</span>
                    </span>
                    <span class="portfolio-next__arrow" aria-hidden="true">→</span>
                </a>
                <a class="text-link" href="/portfolio/">Alle Projekte →</a>
            </div>
        </nav>` : ""
};
