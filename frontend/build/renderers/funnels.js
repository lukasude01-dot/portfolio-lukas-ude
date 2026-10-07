/**
 * FUNNELS RENDERERS
 *
 * PURPOSE:
 * - "funnels-list":   the funnel overview on /funnels/
 * - "funnel-*":       the parts of one funnel case page
 *                     (template: /frontend/templates/funnel-project.html)
 *
 * CONTENT:  /content/funnels/<slug>/project.json
 * DEMOS:    /frontend/demos/<slug>/index.html  (linked via "demoPath")
 *
 * RELATED STYLES:  /frontend/styles/pages/funnels.css
 *                  /frontend/styles/components/device-preview.css
 * RELATED SCRIPT:  /frontend/scripts/modules/device-preview.js
 */

import { html, safeUrl } from "../lib/html.js";
import { projectBadges } from "./work.js";

const HEX_COLOUR = /^#[0-9a-f]{3,8}$/i;

/** Desktop + mobile preview of a live demo (iframes, lazy-loaded). */
export function devicePreview(project, { interactiveMobile = true } = {}) {
    if (!project.demoPath) return "";
    const src = safeUrl(project.demoPath);
    return html`
            <div class="device-preview">
                <!-- DEVICE PREVIEW - DESKTOP (scaled down, not clickable) -->
                <div class="device-preview__desktop" inert>
                    <div class="device-preview__bar" aria-hidden="true"><span></span><span></span><span></span></div>
                    <div class="device-preview__screen" data-device-screen data-device-width="1440">
                        <iframe src="${src}" title="Desktop-Vorschau: ${project.title}" loading="lazy" tabindex="-1" width="1440" height="900"></iframe>
                    </div>
                </div>
                <!-- DEVICE PREVIEW - MOBILE (scrollable) -->
                <div class="device-preview__mobile"${interactiveMobile ? "" : html` inert`}>
                    <div class="device-preview__screen" data-device-screen data-device-width="390">
                        <iframe src="${src}" title="Mobile Vorschau: ${project.title}" loading="lazy" width="390" height="844"></iframe>
                    </div>
                </div>
            </div>`;
}

function list(items = []) {
    return html`<ul class="bullet-list" role="list">${items.map((item) => html`<li>${item}</li>`)}</ul>`;
}

export const funnelRenderers = {

    // FUNNELS PAGE - LIST OF ALL FUNNELS
    "funnels-list": ({ content }) => html`
            <div class="funnel-list">
                ${content.funnels.map((project, index) => html`
                <article class="funnel-item" id="funnel-${project.slug}">
                    <div class="funnel-item__preview" data-reveal>
                        ${devicePreview(project, { interactiveMobile: false })}
                    </div>
                    <div class="funnel-item__content">
                        <p class="eyebrow">${String(index + 1).padStart(2, "0")} · ${project.categories.join(" · ")}</p>
                        <h2 class="funnel-item__title heading-2">${project.title}</h2>
                        <p class="text-lead">${project.description}</p>
                        <dl class="fact-list">
                            <div><dt class="label">Ziel</dt><dd>${project.objectiveShort || project.objective}</dd></div>
                            <div><dt class="label">Aufbau</dt><dd>${(project.structure || []).map((step) => step.step).join(" → ")}</dd></div>
                        </dl>
                        <p class="funnel-item__badges">${projectBadges(project).map((badge) => html`<span class="badge">${badge}</span>`)}</p>
                        <div class="button-row">
                            <a class="button button--primary" href="${project.url}">Case Study lesen<span class="button__arrow" aria-hidden="true">→</span></a>
                            ${project.demoPath ? html`<a class="button button--ghost" href="${safeUrl(project.demoPath)}" target="_blank" rel="noopener">Live-Demo öffnen<span class="visually-hidden"> (öffnet in neuem Tab)</span> <span aria-hidden="true">↗</span></a>` : ""}
                        </div>
                    </div>
                </article>`)}
            </div>`,

    // FUNNEL CASE - KEY FACTS
    "funnel-facts": ({ project }) => html`
                <dl class="project-facts">
                    <div><dt class="label">Kunde</dt><dd>${project.client}</dd></div>
                    <div><dt class="label">Jahr</dt><dd>${project.year}</dd></div>
                    <div><dt class="label">Art</dt><dd>${project.categories.join(", ")}</dd></div>
                    <div><dt class="label">Leistungen</dt><dd>${(project.services || []).join(", ")}</dd></div>
                </dl>`,

    // FUNNEL CASE - DEMO NOTICE
    "funnel-demo-notice": ({ project }) => project.demoNotice ? html`
                <p class="notice"><span class="label">Hinweis</span> ${project.demoNotice}</p>` : "",

    // FUNNEL CASE - TARGET AUDIENCE + STRATEGY
    "funnel-audience": ({ project }) => list(project.audience),
    "funnel-strategy": ({ project }) => list(project.strategy),

    // FUNNEL CASE - FUNNEL STRUCTURE (step diagram)
    "funnel-structure": ({ project }) => html`
                <ol class="step-diagram" role="list">
                    ${(project.structure || []).map((step, index) => html`
                    <li class="step-diagram__step" data-reveal data-reveal-delay="${Math.min(index + 1, 5)}">
                        <span class="step-diagram__number">${String(index + 1).padStart(2, "0")}</span>
                        <p class="step-diagram__label label">${step.step}</p>
                        <h3 class="step-diagram__title">${step.title}</h3>
                        <p class="step-diagram__text">${step.text}</p>
                    </li>`)}
                </ol>`,

    // FUNNEL CASE - COPY CONCEPT
    "funnel-copy": ({ project }) => {
        const copy = project.copy || {};
        return html`
                <div class="copy-concept">
                    <figure class="copy-concept__headline">
                        <figcaption class="label">Haupt-Headline</figcaption>
                        <blockquote><p>${copy.headline}</p></blockquote>
                        ${copy.subheadline ? html`<p class="text-muted">${copy.subheadline}</p>` : ""}
                    </figure>
                    <div class="copy-concept__columns">
                        <div>
                            <h3 class="label">Hook-Varianten</h3>
                            ${list(copy.hooks)}
                        </div>
                        <div>
                            <h3 class="label">Tonalität</h3>
                            <p>${copy.tone}</p>
                        </div>
                    </div>
                </div>`;
    },

    // FUNNEL CASE - VISUAL CONCEPT (colour swatches are SVG -> CSP-safe)
    "funnel-visual": ({ project }) => {
        const visual = project.visual || {};
        return html`
                <div class="visual-concept">
                    <ul class="swatch-list" role="list">
                        ${(visual.palette || []).filter((colour) => HEX_COLOUR.test(colour.hex)).map((colour) => html`
                        <li class="swatch">
                            <svg class="swatch__colour" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><rect width="10" height="10" fill="${colour.hex}"/></svg>
                            <span class="swatch__name">${colour.name}</span>
                            <span class="swatch__hex">${colour.hex}</span>
                        </li>`)}
                    </ul>
                    <dl class="fact-list">
                        ${visual.typography ? html`<div><dt class="label">Typografie</dt><dd>${visual.typography}</dd></div>` : ""}
                        ${visual.imagery ? html`<div><dt class="label">Bildsprache</dt><dd>${visual.imagery}</dd></div>` : ""}
                        ${visual.layout ? html`<div><dt class="label">Layout</dt><dd>${visual.layout}</dd></div>` : ""}
                    </dl>
                </div>`;
    },

    // FUNNEL CASE - DESKTOP + MOBILE PREVIEW
    "funnel-preview": ({ project }) => devicePreview(project),

    // FUNNEL CASE - OPTIONAL SCREENSHOTS
    "funnel-screenshots": ({ project }) => (project.screenshots || []).length ? html`
                <div class="screenshot-grid" data-lightbox-group>
                    ${project.screenshots.map((shot) => html`
                    <figure class="screenshot-grid__item">
                        <a href="${shot.src}" data-lightbox data-caption="${shot.caption || shot.alt}">
                            <img src="${shot.src}" alt="${shot.alt}" sizes="(min-width: 900px) 33vw, 100vw" data-responsive>
                        </a>
                        ${shot.caption ? html`<figcaption class="text-small text-muted">${shot.caption}</figcaption>` : ""}
                    </figure>`)}
                </div>` : "",

    // FUNNEL CASE - CTA STRUCTURE
    "funnel-cta-structure": ({ project }) => html`
                <div class="cta-structure">
                    ${(project.ctaStructure || []).map((cta) => html`
                    <div class="cta-structure__item">
                        <p class="label">${cta.role}</p>
                        <p class="cta-structure__text">“${cta.text}”</p>
                        <p class="text-small text-muted">${cta.where}</p>
                    </div>`)}
                </div>`,

    // FUNNEL CASE - USER JOURNEY
    "funnel-journey": ({ project }) => html`
                <ol class="journey" role="list">
                    ${(project.journey || []).map((moment, index) => html`
                    <li class="journey__step" data-reveal>
                        <span class="journey__number">${String(index + 1).padStart(2, "0")}</span>
                        <div>
                            <h3 class="journey__title">${moment.title}</h3>
                            <p class="text-muted">${moment.text}</p>
                        </div>
                    </li>`)}
                </ol>`,

    // FUNNEL CASE - DEMO BUTTON
    "funnel-demo-button": ({ project }) => project.demoPath ? html`
                <a class="button button--primary" href="${safeUrl(project.demoPath)}" target="_blank" rel="noopener">Live-Demo öffnen<span class="visually-hidden"> (öffnet in neuem Tab)</span><span class="button__arrow" aria-hidden="true">↗</span></a>` : ""
};
