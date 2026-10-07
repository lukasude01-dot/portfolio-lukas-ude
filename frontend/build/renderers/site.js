/**
 * SITE RENDERERS  (navigation, footer, legal links, contact details)
 *
 * PURPOSE:
 * Builds the repeating link lists from /frontend/config/site.js.
 * Used in /frontend/components/navigation.html and footer.html.
 *
 * To change WHICH links appear, edit site.js – not this file.
 * Edit this file only to change the HTML structure of the lists.
 */

import { html, safeUrl } from "../lib/html.js";
import { CONTACT_TOPICS } from "../../../shared/contact-schema.js";

/** true if the nav item belongs to the current page (marks the active link) */
function isActive(item, page) {
    if (item.href === "/") return page.path === "/";
    return page.path?.startsWith(item.href);
}

function currentAttribute(item, page) {
    return isActive(item, page) ? html` aria-current="page"` : "";
}

const visibleSocial = (site) => site.social.filter((profile) => profile.url);

export const siteRenderers = {

    // NAVIGATION - DESKTOP LINKS
    "navigation-links": ({ site, page }) => html`
                <ul class="site-nav__list" role="list">
                    ${site.navigation.map((item) => html`
                    <li><a class="site-nav__link" href="${safeUrl(item.href)}"${currentAttribute(item, page)}>${item.label}</a></li>`)}
                </ul>`,

    // NAVIGATION - MOBILE LINKS (large, numbered)
    "navigation-links-mobile": ({ site, page }) => html`
                <ol class="mobile-menu__list" role="list">
                    ${site.navigation.map((item, index) => html`
                    <li><a class="mobile-menu__link" href="${safeUrl(item.href)}"${currentAttribute(item, page)}><span class="mobile-menu__number">${String(index + 1).padStart(2, "0")}</span>${item.label}</a></li>`)}
                </ol>`,

    // FOOTER - NAVIGATION LINKS
    "footer-links": ({ site }) => html`
                    <ul class="site-footer__list" role="list">
                        ${site.navigation.map((item) => html`<li><a class="link-underline" href="${safeUrl(item.href)}">${item.label}</a></li>`)}
                    </ul>`,

    // FOOTER - CONTACT LINKS (e-mail + social, only if set in site.js)
    "footer-contact": ({ site }) => html`
                    <ul class="site-footer__list" role="list">
                        <li><a class="link-underline" href="/contact/">Kontaktformular</a></li>
                        ${site.email ? html`<li><a class="link-underline" href="mailto:${site.email}">${site.email}</a></li>` : ""}
                        ${visibleSocial(site).map((profile) => html`<li><a class="link-underline" href="${safeUrl(profile.url)}" rel="noopener me" target="_blank">${profile.label}<span class="visually-hidden"> (öffnet in neuem Tab)</span></a></li>`)}
                        ${site.location ? html`<li class="text-muted">${site.location}</li>` : ""}
                    </ul>`,

    // FOOTER - LEGAL LINKS
    "legal-links": ({ site }) => html`
                    <ul class="site-footer__legal" role="list">
                        ${site.legalNavigation.map((item) => html`<li><a class="link-underline" href="${safeUrl(item.href)}">${item.label}</a></li>`)}
                    </ul>`,

    // CONTACT FORM - TOPIC OPTIONS (from /shared/contact-schema.js)
    "contact-topics": () => html`${CONTACT_TOPICS.map((topic) => html`
                                <option value="${topic}">${topic}</option>`)}`,

    // CONTACT PAGE - DIRECT CONTACT DETAILS
    "contact-details": ({ site }) => {
        const social = visibleSocial(site);
        if (!site.email && !site.location && social.length === 0) {
            return html`<p class="text-muted">Über das Formular erreichst du mich am schnellsten.</p>`;
        }
        return html`
                    <dl class="contact-details">
                        ${site.email ? html`
                        <div class="contact-details__item">
                            <dt class="label">E-Mail</dt>
                            <dd><a class="link-underline" href="mailto:${site.email}">${site.email}</a></dd>
                        </div>` : ""}
                        ${social.map((profile) => html`
                        <div class="contact-details__item">
                            <dt class="label">${profile.label}</dt>
                            <dd><a class="link-underline" href="${safeUrl(profile.url)}" rel="noopener me" target="_blank">${profile.url.replace(/^https?:\/\/(www\.)?/, "")}<span class="visually-hidden"> (öffnet in neuem Tab)</span></a></dd>
                        </div>`)}
                        ${site.location ? html`
                        <div class="contact-details__item">
                            <dt class="label">Standort</dt>
                            <dd>${site.location}</dd>
                        </div>` : ""}
                    </dl>`;
    },

    // BREADCRUMBS (project pages)
    breadcrumbs: ({ page }) => html`
            <nav class="breadcrumbs" aria-label="Brotkrumen-Navigation">
                <ol role="list">
                    ${page.breadcrumbs.map((crumb, index) => index === page.breadcrumbs.length - 1
                        ? html`<li><span aria-current="page">${crumb.label}</span></li>`
                        : html`<li><a href="${safeUrl(crumb.href)}">${crumb.label}</a></li>`)}
                </ol>
            </nav>`
};
