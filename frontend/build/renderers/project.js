/**
 * PROJECT PAGE RENDERERS  (shared by funnel, creative and design pages)
 *
 * PURPOSE:
 * - "project-badges":  "Live demo" / "Concept" badges
 * - "project-body":    free text paragraphs ("body" in project.json)
 * - "project-next":    link to the next project at the bottom
 */

import { html } from "../lib/html.js";
import { projectBadges } from "./work.js";

export const projectRenderers = {

    "project-badges": ({ project }) => html`${projectBadges(project).map((badge) => html`<span class="badge">${badge}</span>`)}`,

    "project-body": ({ project }) => html`${(project.body || []).map((paragraph) => html`<p>${paragraph}</p>`)}`,

    "project-next": ({ next, section }) => html`
        <nav class="project-next theme-dark" aria-label="More work">
            <div class="container project-next__inner">
                ${next ? html`
                <a class="project-next__link" href="${next.url}" data-cursor-label="Next">
                    <span class="eyebrow">Next project</span>
                    <span class="project-next__title heading-2">${next.title}</span>
                    <span class="project-next__arrow" aria-hidden="true">→</span>
                </a>` : ""}
                <a class="text-link" href="${section.href}">All ${section.label.toLowerCase()} →</a>
            </div>
        </nav>`
};
