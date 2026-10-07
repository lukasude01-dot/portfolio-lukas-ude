/**
 * CREATIVES & COPY RENDERERS
 *
 * PURPOSE:
 * - adMockup():          a social-ad style mockup (structure only:
 *                        brand, "Sponsored", creative, primary text,
 *                        headline, CTA). Clearly labelled as mockup -
 *                        it is NOT a copy of Meta's interface.
 * - "creative-filters":  All / Recruiting / Lead Generation / ...
 * - "creative-views":    CREATIVE / COPY / COMBINED switch
 * - "creatives-grid":    the grid on /creatives/
 * - "creative-*":        parts of one creative case page
 *                        (template: /frontend/templates/creative-project.html)
 *
 * CONTENT:  /content/creatives/<slug>/project.json
 *
 * RELATED STYLES:  /frontend/styles/components/ad-mockup.css
 *                  /frontend/styles/pages/creatives.css
 * RELATED SCRIPT:  /frontend/scripts/modules/creative-views.js
 *                  /frontend/scripts/modules/filters.js
 */

import { html } from "../lib/html.js";
import { filterBar, projectBadges } from "./work.js";

// SAFE TO EDIT: filter buttons on the creatives page (value = category in project.json, lower case)
const CREATIVE_FILTERS = ["Recruiting", "Leadgenerierung", "Marke", "Social", "Performance"];

function paragraphs(text = "") {
    return String(text).split(/\n+/).filter(Boolean).map((line) => html`<p>${line}</p>`);
}

function initials(name = "") {
    return name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase();
}

/**
 * Social ad mockup.
 * @param {object} ad      one entry of project.ads
 * @param {object} brand   project.brand { name, domain }
 */
export function adMockup(ad, brand = {}, { sizes = "(min-width: 900px) 30vw, 90vw", clampText = false } = {}) {
    return html`
                <figure class="ad-mockup ad-mockup--${ad.format || "square"}">
                    <div class="ad-mockup__header">
                        <span class="ad-mockup__avatar" aria-hidden="true">${brand.initials || initials(brand.name)}</span>
                        <div class="ad-mockup__identity">
                            <p class="ad-mockup__brand">${brand.name}</p>
                            <p class="ad-mockup__sponsored">Gesponsert · Mockup</p>
                        </div>
                        <span class="ad-mockup__dots" aria-hidden="true">···</span>
                    </div>
                    <div class="ad-mockup__primary-text${clampText ? " ad-mockup__primary-text--clamped" : ""}">${paragraphs(ad.primaryText)}</div>
                    <div class="ad-mockup__creative">
                        <img src="${ad.image.src}" alt="${ad.image.alt}" sizes="${sizes}" data-responsive>
                    </div>
                    <div class="ad-mockup__footer">
                        <div class="ad-mockup__link">
                            <p class="ad-mockup__domain">${brand.domain || ""}</p>
                            <p class="ad-mockup__headline">${ad.headline}</p>
                            ${ad.description ? html`<p class="ad-mockup__description">${ad.description}</p>` : ""}
                        </div>
                        <span class="ad-mockup__cta">${ad.cta}</span>
                    </div>
                    <figcaption class="ad-mockup__label">Portfolio-Mockup – keine echte Anzeige</figcaption>
                </figure>`;
}

/** COPY view: the text of an ad, without the visual. */
function copyCard(ad) {
    return html`
                <div class="copy-card">
                    <p class="copy-card__row"><span class="label">Hook</span><span class="copy-card__hook">${ad.hook || ad.headline}</span></p>
                    <div class="copy-card__row"><span class="label">Primary Text</span><div class="copy-card__primary">${paragraphs(ad.primaryText)}</div></div>
                    <p class="copy-card__row"><span class="label">Headline</span><span>${ad.headline}</span></p>
                    <p class="copy-card__row"><span class="label">CTA</span><span class="copy-card__cta">${ad.cta}</span></p>
                </div>`;
}

export const creativeRenderers = {

    "creative-filters": ({ content }) => {
        const used = new Set(content.creatives.flatMap((project) => project.categories));
        const filters = [{ label: "Alle", value: "all" }, ...CREATIVE_FILTERS.filter((name) => used.has(name)).map((name) => ({ label: name, value: name.toLowerCase() }))];
        return filterBar(filters, { label: "Creatives nach Kategorie filtern", target: "creatives-grid" });
    },

    "creative-views": () => html`
            <div class="view-switch" role="group" aria-label="Ansicht der Creatives wählen" data-view-switch data-view-target="creatives-grid">
                <button class="view-switch__button" type="button" data-view="creative" aria-pressed="false">Creative</button>
                <button class="view-switch__button" type="button" data-view="copy" aria-pressed="false">Copy</button>
                <button class="view-switch__button" type="button" data-view="combined" aria-pressed="true">Kombiniert</button>
            </div>`,

    // CREATIVES PAGE - GRID (each card contains all three views; CSS shows one)
    "creatives-grid": ({ content }) => html`
            <div class="creatives-grid" id="creatives-grid" data-view="combined" data-filter-list>
                ${content.creatives.map((project) => {
                    const ad = project.ads[0];
                    const filterValues = project.categories.map((category) => category.toLowerCase()).join(" ");
                    return html`
                <article class="creative-card" data-filter-item data-filter-values="${filterValues}">
                    <div class="creative-card__view creative-card__view--creative">
                        <div class="creative-card__image ad-format--${ad.format || "square"}">
                            <img src="${ad.image.src}" alt="${ad.image.alt}" sizes="(min-width: 1100px) 30vw, (min-width: 700px) 45vw, 90vw" data-responsive>
                        </div>
                    </div>
                    <div class="creative-card__view creative-card__view--copy">${copyCard(ad)}</div>
                    <div class="creative-card__view creative-card__view--combined">${adMockup(ad, project.brand, { clampText: true })}</div>

                    <div class="creative-card__info">
                        <p class="label">${project.categories.join(" · ")}</p>
                        <h2 class="creative-card__title"><a href="${project.url}">${project.title}</a></h2>
                        <p class="creative-card__meta text-small text-muted">
                            ${project.ads.length} ${project.ads.length === 1 ? "Variante" : "Varianten"}
                            ${projectBadges(project).map((badge) => html` · ${badge}`)}
                        </p>
                        <a class="text-link" href="${project.url}" aria-label="Case öffnen: ${project.title}">Case öffnen →</a>
                    </div>
                </article>`;
                })}
            </div>
            <p class="filter-empty text-muted" data-filter-empty hidden>In dieser Kategorie gibt es noch keine Creatives.</p>`,

    // CREATIVE CASE - KEY FACTS
    "creative-facts": ({ project }) => html`
                <dl class="project-facts">
                    <div><dt class="label">Marke</dt><dd>${project.client}</dd></div>
                    <div><dt class="label">Jahr</dt><dd>${project.year}</dd></div>
                    <div><dt class="label">Kategorie</dt><dd>${project.categories.join(", ")}</dd></div>
                    <div><dt class="label">Leistungen</dt><dd>${(project.services || []).join(", ")}</dd></div>
                </dl>`,

    "creative-approach": ({ project }) => html`<ul class="bullet-list" role="list">${(project.approach || []).map((item) => html`<li>${item}</li>`)}</ul>`,

    // CREATIVE CASE - ALL VARIATIONS (mockup + copy side by side)
    "creative-variations": ({ project }) => html`
                <div class="variation-list">
                    ${project.ads.map((ad, index) => html`
                    <article class="variation">
                        <div class="variation__mockup" data-reveal>${adMockup(ad, project.brand, { sizes: "(min-width: 900px) 34vw, 90vw" })}</div>
                        <div class="variation__copy">
                            <p class="eyebrow">Variante ${String.fromCharCode(65 + index)}</p>
                            <h3 class="heading-3">${ad.label}</h3>
                            ${ad.rationale ? html`<p class="text-muted">${ad.rationale}</p>` : ""}
                            ${copyCard(ad)}
                        </div>
                    </article>`)}
                </div>`,

    // CREATIVE CASE - HOOK & HEADLINE LIBRARY
    "creative-hooks": ({ project }) => html`
                <div class="hook-library">
                    <div>
                        <h3 class="label">Hooks</h3>
                        <ol class="hook-library__list" role="list">${(project.hooks || []).map((hook) => html`<li>${hook}</li>`)}</ol>
                    </div>
                    <div>
                        <h3 class="label">Headlines</h3>
                        <ol class="hook-library__list" role="list">${(project.headlines || []).map((headline) => html`<li>${headline}</li>`)}</ol>
                    </div>
                </div>`
};
