/**
 * SERVICES RENDERERS  (Leistungen page)
 *
 * PURPOSE:
 * - "service-packages": the package cards on /leistungen/
 * - "service-*":        the parts of one package page /leistungen/<slug>/
 *                       (template: /frontend/templates/service-page.html)
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
                    <div class="package__buttons">
                        ${item.url ? html`<a class="button ${item.highlight ? "button--primary" : "button--ghost"}" href="${item.url}">Mehr erfahren<span class="button__arrow" aria-hidden="true">→</span></a>` : ""}
                        <a class="text-link" href="/contact/?thema=${encodeURIComponent(item.topic || "")}">Anfragen →</a>
                    </div>
                </li>`)}
            </ol>`
,

    // PACKAGE PAGE - "WHY" PARAGRAPHS
    "service-problem": ({ detail }) => html`${detail.problem.map((paragraph) => html`
                    <p>${paragraph}</p>`)}`,

    // PACKAGE PAGE - BENEFITS (four points)
    "service-benefits": ({ detail }) => html`
                <ul class="brand-core__values service-benefits" role="list">
                    ${detail.benefits.map((benefit, index) => html`
                    <li class="brand-core__value" data-reveal data-reveal-delay="${(index % 2) + 1}">
                        <span class="brand-core__value-number label">${String(index + 1).padStart(2, "0")}</span>
                        <h3 class="brand-core__value-title">${benefit.title}</h3>
                        <p class="text-muted">${benefit.text}</p>
                    </li>`)}
                </ul>`,

    // PACKAGE PAGE - WHAT IS INCLUDED (same list as on the card)
    "service-includes": ({ item }) => html`
                <div class="package package--detail${item.highlight ? " package--highlight" : ""}">
                    <h3 class="package__name">${item.name}</h3>
                    ${item.price ? html`<p class="package__price">${item.price}</p>` : ""}
                    <ul class="package__list" role="list">
                        ${item.includes.map((entry) => html`<li>${entry}</li>`)}
                    </ul>
                    ${item.idealFor ? html`<p class="package__ideal"><span class="label">Ideal für</span> ${item.idealFor}</p>` : ""}
                    <a class="button button--primary package__button" href="/contact/?thema=${encodeURIComponent(item.topic || "")}">Jetzt anfragen<span class="button__arrow" aria-hidden="true">→</span></a>
                </div>`,

    // PACKAGE PAGE - STEPS (four steps)
    "service-steps": ({ detail }) => html`
                <ol class="process__steps process__steps--four" role="list">
                    <li class="process__line" aria-hidden="true" data-reveal="line"></li>
                    ${detail.steps.map((step, index) => html`
                    <li class="process__step" data-reveal data-reveal-delay="${index + 1}">
                        <span class="process__node" aria-hidden="true"></span>
                        <p class="process__number label">${String(index + 1).padStart(2, "0")}</p>
                        <h3 class="process__title">${step.title}</h3>
                        <p class="process__text">${step.text}</p>
                    </li>`)}
                </ol>`,

    // PACKAGE PAGE - FAQ (native <details>, works without JavaScript)
    "service-faq": ({ detail }) => html`
                <div class="faq">
                    ${detail.faq.map((entry) => html`
                    <details class="faq__item">
                        <summary class="faq__question">${entry.question}</summary>
                        <p class="faq__answer">${entry.answer}</p>
                    </details>`)}
                </div>`,

    // PACKAGE PAGE - OTHER PACKAGES
    "service-others": ({ content, item }) => html`
                <ul class="service-others" role="list">
                    ${content.packages.filter((entry) => entry.url && entry !== item).map((entry) => html`
                    <li><a class="service-others__link" href="${entry.url}"><span>${entry.name}</span><span aria-hidden="true">→</span></a></li>`)}
                </ul>`
};
