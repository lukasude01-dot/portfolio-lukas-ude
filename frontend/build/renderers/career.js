/**
 * CAREER RENDERERS  (About page: timeline, certificates, skills)
 *
 * PURPOSE:
 * - "timeline":      MY JOURNEY – chronological CV timeline
 * - "certificates":  list of certificates
 * - "skills":        SKILLS grid
 *
 * CONTENT:
 *   /content/career/timeline.json   (entries + certificates)
 *   /content/career/skills.json     (skill groups)
 *
 * Placeholders like [ADD DATE] are highlighted on the website
 * so they are easy to spot before launch.
 *
 * RELATED STYLES:  /frontend/styles/components/timeline.css
 *                  /frontend/styles/pages/about.css
 */

import { html, raw, escapeHtml } from "../lib/html.js";

/** Escapes text and wraps [ADD ...] placeholders in a highlight. */
function withPlaceholders(text) {
    return raw(escapeHtml(text).replace(/\[ADD [^\]]+\]/g, (match) => `<mark class="placeholder">${match}</mark>`));
}

export const careerRenderers = {

    // ABOUT - MY JOURNEY (timeline)
    timeline: ({ content }) => html`
            <ol class="timeline" role="list">
                ${content.career.timeline.entries.map((entry) => html`
                <li class="timeline__entry" data-reveal>
                    <div class="timeline__period">
                        <p class="timeline__date">${withPlaceholders(entry.period)}</p>
                        <p class="timeline__type label">${entry.type}</p>
                    </div>
                    <span class="timeline__node" aria-hidden="true"></span>
                    <div class="timeline__content">
                        <h3 class="timeline__title">${withPlaceholders(entry.title)}</h3>
                        ${entry.organisation ? html`<p class="timeline__organisation">${withPlaceholders(entry.organisation)}${entry.location ? html` · ${withPlaceholders(entry.location)}` : ""}</p>` : ""}
                        ${entry.description ? html`<p class="timeline__text">${withPlaceholders(entry.description)}</p>` : ""}
                        ${entry.tags?.length ? html`<p class="timeline__tags">${entry.tags.map((tag) => html`<span class="badge">${tag}</span>`)}</p>` : ""}
                    </div>
                </li>`)}
            </ol>`,

    // ABOUT - CERTIFICATES
    certificates: ({ content }) => html`
            <ul class="certificate-list" role="list">
                ${(content.career.timeline.certificates || []).map((certificate) => html`
                <li class="certificate">
                    <p class="certificate__year label">${withPlaceholders(certificate.year)}</p>
                    <p class="certificate__title">${withPlaceholders(certificate.title)}</p>
                    <p class="certificate__issuer text-muted">${withPlaceholders(certificate.issuer)}</p>
                </li>`)}
            </ul>`,

    // ABOUT - SKILLS
    skills: ({ content }) => html`
            <div class="skills-grid">
                ${content.career.skills.groups.map((group, index) => html`
                <section class="skill-group" aria-labelledby="skill-group-${index}" data-reveal data-reveal-delay="${(index % 3) + 1}">
                    <p class="skill-group__number label">${String(index + 1).padStart(2, "0")}</p>
                    <h3 class="skill-group__title" id="skill-group-${index}">${group.name}</h3>
                    <p class="skill-group__summary text-muted">${group.summary}</p>
                    <ul class="skill-group__list" role="list">${group.skills.map((skill) => html`<li>${withPlaceholders(skill)}</li>`)}</ul>
                    ${group.tools ? html`<p class="skill-group__tools text-small"><span class="label">Tools</span> ${withPlaceholders(group.tools)}</p>` : ""}
                </section>`)}
            </div>`
};
