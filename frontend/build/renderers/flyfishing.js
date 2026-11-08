/**
 * FLY FISHING RENDERERS  (flyfishing.lukasude.de)
 *
 * PURPOSE:
 * Turn /content/flyfishing/kurse.json into markup:
 * - "ff-course-featured":  the highlighted beginner course (homepage)
 * - "ff-course-cards":     all courses as cards (/akademie/, /shop/)
 * - "ff-course-cards-more": all courses except the highlighted one
 * - "ff-flies":             flies for sale, grouped by type (/fliegen/)
 * - "ff-flies-teaser":      a few flies (homepage, shop)
 * - "ff-photo-gallery":     every photo of galerie.json (/ueber-lukas/)
 * - "ff-course-*":          the parts of one course page
 *                           (template /frontend/variants/flyfishing/templates/course-page.html)
 *
 * Every image gets its caption ("caption", short "label" on cards),
 * see kurse.json. AI images must say "KI-illustriert" there.
 *
 * CONTENT:  /content/flyfishing/kurse.json, fliegen.json, galerie.json
 *
 * STYLES:  /frontend/variants/flyfishing/styles/flyfishing.css
 */

import { html } from "../lib/html.js";

const START_TOPIC = "Fly Fishing: Info zum Kursstart";
const startLink = () => `/kontakt/?thema=${encodeURIComponent(START_TOPIC)}`;

function courseCard(course, index) {
    return html`
                    <li data-reveal data-reveal-delay="${index % 3}">
                        <a class="ff-card glass" href="${course.url}" data-tilt="4">
                            <span class="ff-card__image"><img src="${course.image.src}" alt="${course.image.alt}" sizes="(min-width: 1100px) 30vw, (min-width: 700px) 45vw, 92vw" loading="lazy" data-responsive></span>
                            <span class="caption">${course.image.label || course.image.caption}</span>
                            <span class="chip-row"><span class="ff-status">${course.status}</span><span class="chip">${course.level}</span></span>
                            <span class="ff-card__title">${course.title}</span>
                            <span class="ff-card__text">${course.description}</span>
                            <span class="arrow-link">Zum Kurs</span>
                        </a>
                    </li>`;
}

const ORDER_TOPIC = "Fly Fishing: Fliegen bestellen";
const orderLink = `/kontakt/?thema=${encodeURIComponent(ORDER_TOPIC)}`;
const FLY_TYPES = [
    { type: "Streamer", text: "Für Bach-, See- und Meerforelle. Profil und Bewegung stehen im Vordergrund." },
    { type: "Meerforelle", text: "Garnelen und Küstenmuster, gebunden mit Material, das Salzwasser verträgt." },
    { type: "Nassfliege", text: "Spinnenfliegen mit weicher Hechel für Fluss und Küste." }
];

function flyCard(fly, index) {
    return html`
                    <li class="ff-fly" data-reveal data-reveal-delay="${index % 4}">
                        <figure class="ff-fly__figure">
                            <img src="${fly.image.src}" alt="${fly.image.alt}" sizes="(min-width: 1100px) 22vw, (min-width: 600px) 45vw, 92vw" loading="lazy" data-responsive>
                        </figure>
                        <p class="ff-fly__name">${fly.name}</p>
                        <p class="ff-fly__text">${fly.description}</p>
                        <p class="ff-fly__price">${fly.price || "Preis auf Anfrage"}</p>
                    </li>`;
}

const featured = (content) => content.courses.find((course) => course.featured) || content.courses[0];

export const flyfishingRenderers = {

    // HOMEPAGE - HIGHLIGHTED COURSE
    "ff-course-featured": ({ content }) => {
        const course = featured(content);
        if (!course) return "";
        return html`
                <div class="ff-split">
                    <figure class="ff-figure ff-split__media" data-reveal>
                        <img src="${course.image.src}" alt="${course.image.alt}" sizes="(min-width: 900px) 45vw, 92vw" loading="lazy" data-responsive>
                        <figcaption class="caption">${course.image.caption}</figcaption>
                    </figure>
                    <div class="ff-split__copy">
                        <p class="kicker" data-reveal>${course.subtitle}</p>
                        <h2 class="h2" id="course-heading" data-split>${course.title}</h2>
                        <p class="lead" data-reveal data-reveal-delay="2">${course.description}</p>
                        <div class="chip-row" data-reveal data-reveal-delay="3">
                            <span class="ff-status">${course.status}</span>
                            ${course.modules.map((module) => html`<span class="chip">${module.title}</span>`)}
                        </div>
                        <div class="btn-row" data-reveal data-reveal-delay="4">
                            <a class="btn" href="${course.url}" data-magnetic>Zum Kurs<span class="btn__arrow" aria-hidden="true">→</span></a>
                            <a class="btn btn--ghost" href="${startLink(course)}" data-magnetic>Info zum Start</a>
                        </div>
                    </div>
                </div>`;
    },

    // ALL COURSES
    "ff-course-cards": ({ content }) => html`
                <ul class="ff-cards" role="list">
                    ${content.courses.map(courseCard)}
                </ul>`,

    // ALL COURSES EXCEPT THE HIGHLIGHTED ONE (homepage)
    "ff-course-cards-more": ({ content }) => html`
                <ul class="ff-cards" role="list">
                    ${content.courses.filter((course) => course !== featured(content)).map(courseCard)}
                </ul>`,

    // FLIES FOR SALE, GROUPED BY TYPE
    "ff-flies": ({ content }) => html`${FLY_TYPES.map(({ type, text }) => {
        const flies = (content.flies || []).filter((fly) => fly.type === type);
        if (!flies.length) return "";
        return html`
                <div class="ff-fly-group">
                    <div class="ff-fly-group__head">
                        <h2 class="h3">${type === "Meerforelle" ? "Meerforellenfliegen" : type === "Nassfliege" ? "Nassfliegen" : "Streamer"}</h2>
                        <p class="muted">${text}</p>
                    </div>
                    <ul class="ff-flies" role="list">
                        ${flies.map(flyCard)}
                    </ul>
                </div>`;
    })}`,

    // A FEW FLIES (homepage, shop)
    "ff-flies-teaser": ({ content }) => html`
                <ul class="ff-flies" role="list">
                    ${(content.flies || []).filter((fly, index) => [0, 7, 14, 18].includes(index)).map(flyCard)}
                </ul>`,

    "ff-order-link": () => html`<a class="btn" href="${orderLink}" data-magnetic>Fliegen anfragen<span class="btn__arrow" aria-hidden="true">→</span></a>`,

    // EVERY PHOTO (galerie.json)
    "ff-photo-gallery": ({ content }) => html`
                <div class="ff-gallery ff-gallery--large">
                    ${(content.photos || []).map((photo, index) => html`
                    <figure class="ff-figure" data-reveal data-reveal-delay="${index % 3}">
                        <img src="${photo.src}" alt="${photo.alt}" sizes="(min-width: 1100px) 30vw, (min-width: 600px) 45vw, 92vw" loading="lazy" data-responsive>
                        <figcaption class="caption">${photo.caption}</figcaption>
                    </figure>`)}
                </div>`,

    // COURSE PAGE - FACTS (level, status, price, start)
    "ff-course-facts": ({ course }) => html`
                    <dl class="ff-facts" data-reveal data-reveal-delay="4">
                        <div><dt>Niveau</dt><dd>${course.level}</dd></div>
                        <div><dt>Status</dt><dd>${course.status}</dd></div>
                        <div><dt>Umfang</dt><dd>${course.modules.length} Module, ${course.modules.reduce((sum, module) => sum + module.lessons.length, 0)} Lektionen geplant</dd></div>
                        <div><dt>Preis und Zugang</dt><dd>${course.price || "Werden vor dem Start genannt"}</dd></div>
                    </dl>`,

    "ff-course-figure": ({ course }) => html`
                <figure class="ff-figure" data-reveal>
                    <img src="${course.image.src}" alt="${course.image.alt}" sizes="(min-width: 900px) 40vw, 92vw" loading="eager" data-responsive>
                    <figcaption class="caption">${course.image.caption}</figcaption>
                </figure>`,

    "ff-course-audience": ({ course }) => html`
                        <ul class="ff-list" role="list">
                            ${course.audience.map((item) => html`<li>${item}</li>`)}
                        </ul>
                        <p class="ff-small"><strong>Vorwissen:</strong> ${course.prerequisites}</p>`,

    "ff-course-goals": ({ course }) => html`
                        <ul class="ff-list" role="list">
                            ${course.goals.map((item) => html`<li>${item}</li>`)}
                        </ul>`,

    "ff-course-modules": ({ course }) => html`
                <div class="ff-accordion">
                    ${course.modules.map((module, index) => html`
                    <details${index === 0 ? " open" : ""}>
                        <summary><span><span class="ff-accordion__label">Modul ${String(index + 1).padStart(2, "0")}</span>${module.title}</span></summary>
                        <div class="ff-accordion__body">
                            <ul class="ff-list" role="list">
                                ${module.lessons.map((lesson) => html`<li>${lesson}</li>`)}
                            </ul>
                        </div>
                    </details>`)}
                </div>`,

    "ff-course-equipment": ({ course }) => html`
                        <ul class="ff-list" role="list">
                            ${course.equipment.map((item) => html`<li>${item}</li>`)}
                        </ul>`,

    "ff-course-faq": ({ course }) => html`
                <div class="ff-accordion">
                    ${course.faq.map((item) => html`
                    <details>
                        <summary>${item.q}</summary>
                        <div class="ff-accordion__body"><p>${item.a}</p></div>
                    </details>`)}
                </div>`,

    "ff-course-start": ({ course }) => html`<a class="btn" href="${startLink(course)}" data-magnetic>Info zum Kursstart<span class="btn__arrow" aria-hidden="true">→</span></a>`
};
