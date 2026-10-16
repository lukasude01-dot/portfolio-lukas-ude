/**
 * NEWS RENDERERS  (knowledge articles)
 *
 * PURPOSE:
 * - "news-list":    all articles on /news/
 * - "news-teaser":  the three newest articles (homepage)
 * - "news-cover":   cover image of one article (if it has one)
 * - "news-more":    links to the newer / older article
 *
 * CONTENT:
 *   /content/news/<article>/article.md
 *
 * RELATED STYLES:  /frontend/styles/pages/news.css
 */

import { html } from "../lib/html.js";

/** One article card (used on /news/ and on the homepage). */
function newsCard(article, { headingLevel = 2 } = {}) {
    const title = headingLevel === 2
        ? html`<h2 class="news-card__title">${article.title}</h2>`
        : html`<h3 class="news-card__title">${article.title}</h3>`;
    return html`
                <article class="news-card" data-reveal>
                    <a class="news-card__link" href="${article.url}">
                        <p class="news-card__meta label"><span>${article.category || "Wissen"}</span><span><time datetime="${article.date}">${article.dateLabel}</time></span></p>
                        ${title}
                        <p class="news-card__text">${article.description}</p>
                        <span class="news-card__more">Weiterlesen<span aria-hidden="true"> →</span></span>
                    </a>
                </article>`;
}

export const newsRenderers = {

    // NEWS PAGE - ALL ARTICLES
    "news-list": ({ content }) => content.news.length
        ? html`
            <div class="news-grid">
                ${content.news.map((article) => newsCard(article))}
            </div>`
        : html`<p class="text-muted">Hier erscheinen bald die ersten Beiträge.</p>`,

    // HOMEPAGE - THREE NEWEST ARTICLES
    "news-teaser": ({ content }) => html`
            <div class="news-grid news-grid--teaser">
                ${content.news.slice(0, 3).map((article) => newsCard(article, { headingLevel: 3 }))}
            </div>`,

    // ARTICLE PAGE - COVER IMAGE (optional)
    "news-cover": ({ article }) => article.image
        ? html`
            <figure class="news-article__cover container" data-reveal="mask">
                <img src="${article.image}" alt="${article.imageAlt || ""}" sizes="(min-width: 1360px) 1260px, 92vw" data-responsive>
            </figure>`
        : "",

    // ARTICLE PAGE - NEWER / OLDER ARTICLE
    "news-more": ({ newer, older }) => html`
            <nav class="news-more" aria-label="Weitere Beiträge">
                ${older ? html`<a class="news-more__link" href="${older.url}"><span class="label">Älterer Beitrag</span><span class="news-more__title">${older.title}</span></a>` : html`<span></span>`}
                ${newer ? html`<a class="news-more__link news-more__link--next" href="${newer.url}"><span class="label">Neuerer Beitrag</span><span class="news-more__title">${newer.title}</span></a>` : ""}
            </nav>`
};
