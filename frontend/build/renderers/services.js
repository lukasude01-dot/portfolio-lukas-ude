/**
 * SERVICES RENDERERS  (Leistungen page)
 *
 * PURPOSE:
 * - "service-packages": the package cards on /leistungen/
 *
 * CONTENT:
 *   /content/leistungen/pakete.json   (names, prices, lists)
 *
 * Each card links to the contact form with the package's topic
 * pre-selected: /contact/?thema=<topic>
 *
 * RELATED STYLES:  /frontend/styles/pages/services.css
 */

import { html } from "../lib/html.js";

export const servicesRenderers = {

    // LEISTUNGEN - PACKAGE CARDS
    "service-packages": ({ content }) => html`
            <ol class="packages" role="list">
                ${content.packages.map((item, index) => html`
                <li class="package${item.highlight ? " package--highlight" : ""}"${item.id ? html` id="paket-${item.id}"` : ""} data-reveal data-reveal-delay="${(index % 3) + 1}">
                    <p class="package__number label">${String(index + 1).padStart(2, "0")}</p>
                    <h3 class="package__name">${item.name}</h3>
                    ${item.price ? html`<p class="package__price">${item.price}</p>` : ""}
                    <p class="package__summary">${item.summary}</p>
                    <ul class="package__list" role="list">
                        ${item.includes.map((entry) => html`<li>${entry}</li>`)}
                    </ul>
                    ${item.idealFor ? html`<p class="package__ideal"><span class="label">Ideal für</span> ${item.idealFor}</p>` : ""}
                    <a class="button ${item.highlight ? "button--primary" : "button--ghost"} package__button" href="/contact/?thema=${encodeURIComponent(item.topic || "")}">Anfragen<span class="button__arrow" aria-hidden="true">→</span></a>
                </li>`)}
            </ol>`
};
