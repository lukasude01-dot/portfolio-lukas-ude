/**
 * WORK RENDERERS  (project cards used across the site)
 *
 * PURPOSE:
 * - workCard():        one project card (image, meta, title, text)
 * - "featured-work":   homepage FEATURED WORK grid
 *                      (projects with "featured": true)
 * - "work-filters" + "work-grid": the /work/ overview page
 *
 * RELATED STYLES:  /frontend/styles/components/cards.css
 *                  /frontend/styles/sections/featured-work.css
 * RELATED SCRIPT:  /frontend/scripts/modules/filters.js
 */

import { html } from "../lib/html.js";

// SAFE TO EDIT: how each section is named on cards
export const SECTION_LABELS = {
    funnels: "Funnel",
    creatives: "Creatives & Copy",
    design: "Design",
    ai: "AI & Systems"
};

/** Small badge: "Live demo" for funnels with a demo, "Concept" for example/concept work */
export function projectBadges(project) {
    const badges = [];
    if (project.demoPath) badges.push("Live demo");
    if (project.example || project.concept) badges.push("Concept");
    return badges;
}

/** Simple node diagram used when a project has no image (AI workflows). */
function workflowThumbnail(project) {
    const steps = (project.steps || []).slice(0, 5);
    return html`
        <div class="work-card__diagram" aria-hidden="true">
            ${steps.map((step, index) => html`
            <span class="work-card__node">${String(index + 1).padStart(2, "0")}<small>${step.label}</small></span>`)}
        </div>`;
}

/**
 * One project card.
 * @param {object} project   content item
 * @param {object} options   { sizes, size: "large"|"standard", headingLevel }
 */
export function workCard(project, { sizes = "(min-width: 900px) 45vw, 100vw", size = "standard", headingLevel = 3 } = {}) {
    const meta = [SECTION_LABELS[project.section], project.year].filter(Boolean).join(" · ");
    const filterValues = [project.section, ...project.categories.map((category) => category.toLowerCase())].join(" ");
    const title = headingLevel === 2 ? html`<h2 class="work-card__title">${project.title}</h2>` : html`<h3 class="work-card__title">${project.title}</h3>`;

    return html`
        <article class="work-card work-card--${size}" data-filter-item data-filter-values="${filterValues}">
            <a class="work-card__link" href="${project.url}" data-cursor-label="View">
                <div class="work-card__media" data-reveal="mask">
                    ${project.thumbnail
                        ? html`<img src="${project.thumbnail.src}" alt="${project.thumbnail.alt || ""}" sizes="${sizes}" data-responsive>`
                        : workflowThumbnail(project)}
                </div>
                <div class="work-card__body">
                    <p class="work-card__meta label">${meta}</p>
                    ${title}
                    <p class="work-card__text">${project.description}</p>
                    <p class="work-card__badges">
                        ${projectBadges(project).map((badge) => html`<span class="badge">${badge}</span>`)}
                        <span class="work-card__more" aria-hidden="true">View project →</span>
                    </p>
                </div>
            </a>
        </article>`;
}

/** Filter buttons. `filters` = [{ label, value }] */
export function filterBar(filters, { label, target }) {
    return html`
            <div class="filter-bar" role="group" aria-label="${label}" data-filter-bar data-filter-target="${target}">
                ${filters.map((filter, index) => html`
                <button class="filter-bar__button" type="button" data-filter="${filter.value}" aria-pressed="${index === 0 ? "true" : "false"}">${filter.label}</button>`)}
            </div>`;
}

export const workRenderers = {

    // HOME - FEATURED WORK
    "featured-work": ({ content }) => {
        const featured = content.all.filter((project) => project.featured).slice(0, 4);
        return html`
            <div class="featured-work__grid">
                ${featured.map((project, index) => workCard(project, {
                    size: index === 0 ? "large" : "standard",
                    sizes: index === 0 ? "(min-width: 900px) 60vw, 100vw" : "(min-width: 900px) 40vw, 100vw"
                }))}
            </div>`;
    },

    // WORK PAGE - FILTERS
    "work-filters": ({ content }) => {
        const filters = [{ label: "All", value: "all" }];
        for (const [section, label] of Object.entries(SECTION_LABELS)) {
            if (content[section].length) filters.push({ label, value: section });
        }
        return filterBar(filters, { label: "Filter work by discipline", target: "work-grid" });
    },

    // WORK PAGE - ALL PROJECTS
    "work-grid": ({ content }) => html`
            <div class="work-grid" id="work-grid" data-filter-list>
                ${content.all.map((project) => workCard(project, { headingLevel: 2 }))}
            </div>
            <p class="filter-empty text-muted" data-filter-empty hidden>No work in this category yet.</p>`
};
