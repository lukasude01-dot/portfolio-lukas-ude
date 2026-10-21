/**
 * BOLD VARIANT RENDERERS  (content blocks for /frontend/variants/bold)
 *
 * PURPOSE:
 * The bold design variant shows the same content in a new layout.
 * These renderers turn the shared content into its markup:
 * - "bold-work-gallery": every portfolio motif (uncropped) for the
 *                        pinned horizontal gallery on the homepage
 * - "bold-work-list":    the portfolio overview with hover previews
 * - "bold-news":         news cards (all, or the newest three)
 * - "bold-packages":     service packages as large glass cards
 *
 * CONTENT:  /content/portfolio, /content/news, /content/leistungen
 * STYLES:   /frontend/variants/bold/styles/bold/*.css
 */

import { html } from "../lib/html.js";

/** All motifs of all portfolio projects (each image once, never cropped). */
function motifs(content) {
    return content.portfolio.flatMap((project) =>
        (project.images?.length ? project.images : [project.thumbnail]).map((image, index) => ({ project, image, index })));
}

function newsCard(article, index) {
    return html`
                <a class="b-news" href="${article.url}" data-reveal data-reveal-delay="${index % 4}">
                    <span class="b-news__meta"><span class="chip">${article.category || "Wissen"}</span><time datetime="${article.date}">${article.dateLabel}</time></span>
                    <span class="b-news__title">${article.title}</span>
                    <span class="b-news__text">${article.description}</span>
                    <span class="arrow-link">Weiterlesen</span>
                </a>`;
}

export const boldRenderers = {

    // HOMEPAGE - PINNED HORIZONTAL GALLERY
    "bold-work-gallery": ({ content }) => html`
                <ol class="gallery__track" role="list">
                    ${motifs(content).map(({ project, image, index }, position) => html`
                    <li class="gallery__item">
                        <a class="gallery__link" href="${project.url}" data-tilt="8">
                            <figure class="gallery__figure">
                                <img src="${image.src}" alt="${image.alt}" sizes="(min-width: 900px) 30vw, 70vw" loading="lazy" data-responsive>
                                <figcaption class="gallery__caption">
                                    <span class="gallery__title">${project.title}${index ? html`<span class="gallery__motif">Motiv ${index + 1}</span>` : ""}</span>
                                    <span class="chip">${project.projectStatus || "Projekt"}</span>
                                </figcaption>
                            </figure>
                        </a>
                    </li>`)}
                </ol>`,

    // PORTFOLIO OVERVIEW - BIG LIST WITH PREVIEW IMAGES
    "bold-work-list": ({ content }) => html`
                <ol class="worklist" role="list">
                    ${content.portfolio.map((project, index) => html`
                    <li class="worklist__item" data-reveal data-reveal-delay="${index % 4}">
                        <a class="worklist__link" href="${project.url}">
                            <span class="worklist__number">${String(index + 1).padStart(2, "0")}</span>
                            <span class="worklist__title">${project.title}</span>
                            <span class="worklist__meta">${(project.categories || [project.category]).filter(Boolean).join(", ")}</span>
                            <span class="chip">${project.projectStatus || "Projekt"}</span>
                            <span class="worklist__preview" aria-hidden="true">
                                <img src="${project.thumbnail.src}" alt="" sizes="320px" loading="lazy" data-responsive>
                            </span>
                        </a>
                    </li>`)}
                </ol>`,

    // NEWS CARDS
    "bold-news": ({ content }) => html`
                <div class="b-news-grid">
                    ${content.news.map((article, index) => newsCard(article, index))}
                </div>`,

    "bold-news-teaser": ({ content }) => html`
                <div class="b-news-grid">
                    ${content.news.slice(0, 3).map((article, index) => newsCard(article, index))}
                </div>`,

    // SERVICE PACKAGES
    "bold-packages": ({ content }) => html`
                <ol class="b-packages" role="list">
                    ${content.packages.map((item, index) => html`
                    <li class="b-package glass" data-tilt="4" data-reveal data-reveal-delay="${index % 3}"${item.id ? html` id="paket-${item.id}"` : ""}>
                        <span class="b-package__number">${String(index + 1).padStart(2, "0")}</span>
                        <h3 class="b-package__name">${item.name}</h3>
                        <p class="b-package__summary">${item.summary}</p>
                        ${item.includes?.length ? html`<ul class="b-package__list" role="list">${item.includes.map((entry) => html`<li>${entry}</li>`)}</ul>` : ""}
                        <p class="b-package__price">${item.price}</p>
                        <div class="b-package__actions">
                            ${item.url ? html`<a class="btn btn--ghost" href="${item.url}">Mehr erfahren<span class="btn__arrow" aria-hidden="true">→</span></a>` : ""}
                            <a class="arrow-link" href="/contact/?thema=${encodeURIComponent(item.topic || "")}">Anfragen</a>
                        </div>
                    </li>`)}
                </ol>`
};
