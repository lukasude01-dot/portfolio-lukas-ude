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

const START_TOPIC = "Fly Fishing: Frage zum Workshop";
const startLink = () => `/kontakt/?thema=${encodeURIComponent(START_TOPIC)}`;

function addCourseButton(course) {
    const offer = course.offers?.[0];
    return offer ? html`<button class="ff-add" type="button" data-cart-add="course-${offer.id}" data-cart-name="${course.title}">${offer.label} in den Warenkorb</button>` : "";
}

function courseCard(course, index) {
    return html`
                    <li data-reveal data-reveal-delay="${index % 3}">
                        <article class="ff-card glass">
                            <a class="ff-card__image" href="${course.url}" tabindex="-1" aria-hidden="true"><img src="${course.image.src}" alt="" sizes="(min-width: 1100px) 30vw, (min-width: 700px) 45vw, 92vw" loading="lazy" data-responsive></a>
                            <span class="caption">${course.image.label || course.image.caption}</span>
                            <span class="chip-row"><span class="ff-status">${course.status}</span><span class="chip">${course.level}</span></span>
                            <h3 class="ff-card__title"><a href="${course.url}">${course.title}</a></h3>
                            <p class="ff-card__text">${course.description}</p>
                            <p class="ff-fly__price">${course.offers?.[0]?.price || "Preis auf Anfrage"}</p>
                            ${addCourseButton(course)}
                            <a class="arrow-link" href="${course.url}">Zum Kurs</a>
                        </article>
                    </li>`;
}

const ORDER_TOPIC = "Fly Fishing: Frage zu Fliegen";
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
                        <button class="ff-add" type="button" data-cart-add="fly-${fly.slug}" data-cart-name="${fly.name}">In den Warenkorb</button>
                    </li>`;
}

/** Key facts as a list ("facts" in kurse.json). */
function factsList(course, delay) {
    return html`
                        <dl class="ff-facts" data-reveal data-reveal-delay="${delay}">
                            ${(course.facts || []).map((fact) => html`<div><dt>${fact.label}</dt><dd>${fact.value}</dd></div>`)}
                        </dl>`;
}

/** Puts the workshop place in the cart and opens the cart (data-cart-go). */
function bookButton(course) {
    const offer = course?.offers?.[0];
    if (!offer) return "";
    // without a price yet the place can be reserved ("vormerken")
    return html`<button class="btn" type="button" data-cart-add="course-${offer.id}" data-cart-name="${course.title}" data-cart-go="/warenkorb/">${offer.price ? "Jetzt anmelden" : "Platz vormerken"}<span class="btn__arrow" aria-hidden="true">→</span></button>`;
}

/** One course offer: bookable (cart) or on request (contact form). */
function offerCard(offer, index) {
    const action = offer.label
        ? html`<button class="ff-add" type="button" data-cart-add="course-${offer.id}" data-cart-name="${offer.title}" data-cart-go="/warenkorb/">Jetzt anmelden</button>`
        : html`<a class="ff-add" href="/kontakt/?thema=${encodeURIComponent(offer.topic || START_TOPIC)}">${offer.actionLabel || "Anfrage senden"}</a>`;
    return html`
                    <li class="ff-offer glass" data-reveal data-reveal-delay="${index % 3}">
                        <figure class="ff-offer__image"><img src="${offer.image.src}" alt="${offer.image.alt}" sizes="(min-width: 1100px) 30vw, (min-width: 700px) 45vw, 92vw" loading="lazy" data-responsive></figure>
                        <div class="ff-offer__body">
                            <p class="kicker">${offer.status ? html`<span class="ff-status">${offer.status}</span>` : offer.subtitle}</p>
                            <h3 class="ff-card__title">${offer.url ? html`<a href="${offer.url}">${offer.title}</a>` : offer.title}</h3>
                            <p class="ff-card__text">${offer.text}</p>
                            <ul class="chip-row" role="list">${offer.facts.map((fact) => html`<li class="chip">${fact}</li>`)}</ul>
                            <p class="ff-offer__price">${offer.price ? html`${offer.price} <span>${offer.priceNote}</span>` : html`<span>${offer.priceNote}</span>`}</p>
                            ${action}
                        </div>
                    </li>`;
}

const featured = (content) => content.courses.find((course) => course.featured) || content.courses[0];

export const flyfishingRenderers = {

    // HOMEPAGE - THE WORKSHOP (main offer)
    "ff-course-featured": ({ content }) => {
        const course = featured(content);
        if (!course) return "";
        return html`
                <div class="ff-split ff-split--offer">
                    <figure class="ff-figure ff-split__media" data-reveal>
                        <img src="${course.image.src}" alt="${course.image.alt}" sizes="(min-width: 900px) 45vw, 92vw" loading="lazy" data-responsive>
                        <figcaption class="caption">${course.image.caption}</figcaption>
                    </figure>
                    <div class="ff-split__copy">
                        <p class="kicker" data-reveal>${course.subtitle}</p>
                        <h2 class="h2" id="course-heading" data-split>${course.title}</h2>
                        <p class="lead" data-reveal data-reveal-delay="2">${course.description}</p>
${factsList(course, 3)}
                        <div class="btn-row" data-reveal data-reveal-delay="4">
                            ${bookButton(course)}
                            <a class="btn btn--ghost" href="${course.url}" data-magnetic>Alle Details</a>
                        </div>
                    </div>
                </div>`;
    },

    "ff-course-cards": ({ content }) => html`
                <ul class="ff-cards" role="list">
                    ${content.courses.map(courseCard)}
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

    // ALL COURSE OFFERS (/kurse/), grouped: "Vor Ort", "Online", "Für Vereine"
    "ff-offers": ({ content }) => html`${["Fliegenbinden", "Vor Ort", "Online", "Für Vereine"].map((group) => {
        const offers = (content.angebote || []).filter((offer) => offer.group === group);
        if (!offers.length && !extra.length) return "";
        // the fly tying workshop (its own page) leads the "Fliegenbinden" group
        const extra = group === "Fliegenbinden" ? content.courses.filter((course) => course.offers?.length) : [];
        return html`
                <div class="ff-offer-group" id="${{ "Fliegenbinden": "fliegenbinden", "Vor Ort": "vor-ort", "Online": "online" }[group] || "vereine"}">
                    <h2 class="h2 ff-offer-group__title" data-reveal>${group}</h2>
                    <ul class="ff-offers" role="list">
                        ${extra.map((course, index) => offerCard({
                            id: course.offers[0].id, title: course.title, subtitle: "Live-Online-Workshop", image: course.image,
                            text: course.description, facts: ["4 Stunden", "Maximal 15 Personen"], price: course.offers[0].price,
                            priceNote: "pro Person", label: course.offers[0].label, url: course.url
                        }, index))}
                        ${offers.map((offer, index) => offerCard(offer, extra.length + index))}
                    </ul>
                </div>`;
    })}`,

    // ALL FLIES IN ONE GRID (while the range is small)
    "ff-flies-all": ({ content }) => html`
                <ul class="ff-flies" role="list">
                    ${(content.flies || []).map(flyCard)}
                </ul>`,

    // A FEW FLIES (homepage, shop)
    "ff-flies-teaser": ({ content }) => html`
                <ul class="ff-flies" role="list">
                    ${(content.flies || []).filter((fly, index) => [0, 7, 14, 18].includes(index)).map(flyCard)}
                </ul>`,

    "ff-order-link": () => html`<a class="btn" href="/warenkorb/" data-magnetic>Zum Warenkorb<span class="btn__arrow" aria-hidden="true">→</span></a>`,
    "ff-order-question": () => html`<a class="btn btn--ghost" href="${orderLink}" data-magnetic>Frage zu Fliegen</a>`,

    // EVERY PHOTO (galerie.json)
    "ff-photo-gallery": ({ content }) => html`
                <div class="ff-gallery ff-gallery--large">
                    ${(content.photos || []).map((photo, index) => html`
                    <figure class="ff-figure" data-reveal data-reveal-delay="${index % 3}">
                        <img src="${photo.src}" alt="${photo.alt}" sizes="(min-width: 1100px) 30vw, (min-width: 600px) 45vw, 92vw" loading="lazy" data-responsive>
                        <figcaption class="caption">${photo.caption}</figcaption>
                    </figure>`)}
                </div>`,

    // COURSE PAGE (template course-page.html)
    "ff-course-facts": ({ course }) => factsList(course, 4),

    "ff-course-figure": ({ course }) => html`
                <figure class="ff-figure" data-reveal>
                    <img src="${course.image.src}" alt="${course.image.alt}" sizes="(min-width: 900px) 40vw, 92vw" loading="eager" data-responsive>
                    <figcaption class="caption">${course.image.caption}</figcaption>
                </figure>`,

    "ff-course-intro": ({ course }) => html`${(course.intro || []).map((text, index) => html`
                    <p class="${index === 0 ? "lead" : "muted"}" data-reveal>${text}</p>`)}`,

    "ff-course-agenda": ({ course }) => html`
                <ol class="ff-agenda" role="list">
                    ${(course.agenda || []).map((step, index) => html`
                    <li class="ff-agenda__step${step.image ? "" : " ff-agenda__step--wide"}" data-reveal>
                        <div class="ff-agenda__copy">
                            <p class="ff-agenda__number">${String(index + 1).padStart(2, "0")}</p>
                            <h3 class="h3">${step.title}</h3>
                            ${step.text.map((text) => html`<p class="muted">${text}</p>`)}
                            ${step.list ? html`<ul class="ff-list" role="list">${step.list.map((item) => html`<li>${item}</li>`)}</ul>` : ""}
                        </div>
                        ${step.image ? html`<figure class="ff-figure">
                            <img src="${step.image.src}" alt="${step.image.alt}" sizes="(min-width: 900px) 36vw, 92vw" loading="lazy" data-responsive>
                            <figcaption class="caption">${step.image.caption}</figcaption>
                        </figure>` : ""}
                    </li>`)}
                </ol>`,

    "ff-course-patterns": ({ course }) => html`
                <ul class="ff-cards ff-patterns" role="list">
                    ${(course.patterns || []).map((pattern, index) => html`
                    <li data-reveal data-reveal-delay="${index}">
                        <article class="ff-card glass">
                            ${pattern.image ? html`<figure class="ff-figure"><img src="${pattern.image.src}" alt="${pattern.image.alt}" sizes="(min-width: 1100px) 30vw, 92vw" loading="lazy" data-responsive><figcaption class="caption">${pattern.image.caption}</figcaption></figure>` : html`<p class="ff-pattern__number" aria-hidden="true">${String(index + 1).padStart(2, "0")}</p>`}
                            <p class="kicker">${pattern.subtitle}</p>
                            <h3 class="ff-card__title">${pattern.name}</h3>
                            <p class="ff-card__text">${pattern.text}</p>
                        </article>
                    </li>`)}
                </ul>`,

    "ff-course-together": ({ course }) => html`${(course.together || []).map((text) => html`<p class="muted">${text}</p>`)}`,
    "ff-course-equipment": ({ course }) => html`${(course.equipment || []).map((text) => html`<p class="muted">${text}</p>`)}`,
    "ff-course-audience": ({ course }) => html`${(course.audience || []).map((text) => html`<p class="muted">${text}</p>`)}`,

    "ff-course-extras": ({ course }) => html`
                <ul class="ff-cards" role="list">
                    ${(course.extras || []).map((extra, index) => html`
                    <li data-reveal data-reveal-delay="${index}">
                        <article class="glass ff-card">
                            <span class="value-card__number">${String(index + 1).padStart(2, "0")}</span>
                            <h3 class="ff-card__title">${extra.title}</h3>
                            <p class="ff-card__text">${extra.text}</p>
                        </article>
                    </li>`)}
                </ul>`,

    "ff-course-booking": ({ course }) => html`
                <div class="ff-callbox glass ff-booking" id="anmelden" data-reveal>
                    <div>
                        <p class="kicker">Jetzt deinen Platz sichern</p>
                        <h2 class="h3">${course.dateLabel} | ${course.time} | ${course.offers?.[0]?.format || ""}</h2>
                        <p class="ff-booking__price">${course.offers?.[0]?.price || ""} <span>pro Person</span></p>
                        <p class="muted">Die Teilnehmerzahl ist auf 15 Personen begrenzt, damit genug Zeit für Fragen und die gemeinsame praktische Arbeit bleibt. Mit der Anmeldung schickst du mir eine Anfrage. Ich bestätige deinen Platz per E-Mail. Online bezahlen ist bald möglich.</p>
                    </div>
                    <div class="btn-row">
                        ${bookButton(course)}
                        <a class="btn btn--ghost" href="${startLink()}" data-magnetic>Frage zum Workshop</a>
                    </div>
                </div>`,

    "ff-course-start": ({ course }) => html`${bookButton(course)}
                            <a class="btn btn--ghost" href="#anmelden" data-magnetic>${course.offers?.[0]?.price || ""} pro Person</a>`,

    "ff-book-button": ({ content }) => bookButton(featured(content)),
    "ff-book-button-course": ({ course }) => bookButton(course)
};
