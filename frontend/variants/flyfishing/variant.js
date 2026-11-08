/**
 * VARIANT SETTINGS  (fly fishing website, flyfishing.lukasude.de)
 *
 * PURPOSE:
 * A website of its own under the brand Lukas Ude. It uses the design
 * of the main website (variant "bold": colours, font, logo, particles)
 * and only builds its own pages from /frontend/variants/flyfishing/pages/.
 *
 * BUILD:
 *   npm run build:flyfishing                  -> /frontend/dist-flyfishing
 *   SITE_VARIANT=flyfishing npm run build     -> /frontend/dist (on its host)
 *
 * CONTENT:
 *   /content/flyfishing/kurse.json            courses (/akademie/<slug>/)
 *   /content/flyfishing/blog/<slug>/article.md   articles (/blog/<slug>/)
 *   /content/flyfishing/bilder/               images (/media/bilder/...)
 *
 * SECURITY: everything here ends up in the public website. No secrets.
 */

import { FLYFISHING_TOPICS } from "../../../shared/contact-schema.js";

export const variant = {
    standalone: true,
    base: "bold",
    content: "flyfishing",
    sharedPages: ["impressum.html"],
    news: { folder: "blog", path: "/blog/", label: "Blog & Wissen" },

    // Replaces the matching values of /frontend/config/site.js
    site: {
        name: "Lukas Ude Fly Fishing",
        brandLine: "Fly Fishing",
        personName: "Lukas Ude",
        personUrl: "https://lukasude.de",
        tagline: "Fliegenbinden. Fliegenfischen. Verstehen.",
        descriptor: "Fliegenbinden, Fliegenfischen, Wissen",
        description:
            "Lukas Ude | Fly Fishing: deutschsprachige Online-Akademie mit Wissen zum Fliegenbinden " +
            "und Fliegenfischen. Verständliche Anleitungen, Materiallisten und ehrliche Empfehlungen.",
        url: "https://flyfishing.lukasude.de",
        navigation: [
            { label: "Akademie", href: "/akademie/" },
            { label: "Fliegenbinden", href: "/fliegenbinden/" },
            { label: "Fliegenfischen", href: "/fliegenfischen/" },
            { label: "Blog", href: "/blog/" },
            { label: "Shop", href: "/shop/" },
            { label: "Über Lukas", href: "/ueber-lukas/" }
        ],
        legalNavigation: [
            { label: "Impressum", href: "/impressum/" },
            { label: "Datenschutz", href: "/datenschutz/" }
        ],
        cta: {
            primary: { label: "Online-Kurse entdecken", href: "/akademie/" },
            secondary: { label: "Wissensbereich erkunden", href: "/fliegenbinden/" }
        },
        contactTopics: FLYFISHING_TOPICS,
        contactPath: "/kontakt/",
        contactForm: {
            endpoint: "/api/contact",
            tokenEndpoint: "/api/contact/token",
            companyLabel: "Verein oder Unternehmen",
            messageHint: "Um welchen Kurs, welches Muster oder welche Idee geht es?"
        },
        qr: { label: "Scannen und Lukas Ude Fly Fishing öffnen", path: "/" },
        ogImage: "/assets/images/og/og-flyfishing.jpg",
        jobTitle: "Fliegenbinden und Fliegenfischen",
        knowsAbout: ["Fliegenbinden", "Fliegenfischen", "Streamerfischen", "Meerforellenfischen"]
    }
};
