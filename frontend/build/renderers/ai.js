/**
 * AI & SYSTEMS RENDERERS
 *
 * PURPOSE:
 * - "ai-workflows": workflow blueprints on /ai/ (node diagrams
 *                   built from the "steps" list in each project.json)
 *
 * CONTENT:  /content/ai/<slug>/project.json
 *           Each step has a "role": "Human" | "AI" | "System"
 *           so visitors see where people stay in control.
 *
 * RELATED STYLES:  /frontend/styles/pages/ai.css
 */

import { html } from "../lib/html.js";

const ROLES = ["Human", "AI", "System"];

export const aiRenderers = {

    "ai-workflows": ({ content }) => html`
            <div class="workflow-list">
                ${content.ai.map((workflow) => html`
                <article class="workflow" id="workflow-${workflow.slug}">
                    <header class="workflow__header">
                        <p class="eyebrow">${workflow.categories.join(" · ")} · Blueprint</p>
                        <h3 class="workflow__title heading-3">${workflow.title}</h3>
                        <p class="text-muted">${workflow.description}</p>
                    </header>

                    <ol class="workflow__steps" role="list">
                        ${(workflow.steps || []).map((step, index) => {
                            const role = ROLES.includes(step.role) ? step.role : "System";
                            return html`
                        <li class="workflow__step workflow__step--${role.toLowerCase()}" data-reveal data-reveal-delay="${Math.min(index + 1, 5)}">
                            <span class="workflow__node" aria-hidden="true"></span>
                            <p class="workflow__role label">${role}</p>
                            <h4 class="workflow__step-title">${step.label}</h4>
                            <p class="workflow__step-text">${step.text}</p>
                        </li>`;
                        })}
                    </ol>

                    <dl class="workflow__facts">
                        ${workflow.outputs ? html`<div><dt class="label">Output</dt><dd>${workflow.outputs.join(", ")}</dd></div>` : ""}
                        ${workflow.humanInLoop ? html`<div><dt class="label">Human in the loop</dt><dd>${workflow.humanInLoop}</dd></div>` : ""}
                        ${workflow.tools ? html`<div><dt class="label">Tools</dt><dd>${workflow.tools}</dd></div>` : ""}
                    </dl>
                </article>`)}
            </div>`
};
