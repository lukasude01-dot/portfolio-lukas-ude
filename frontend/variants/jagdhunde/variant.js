/**
 * VARIANT SETTINGS  (hunting dog website, huntingwithdogs.lukasude.de)
 *
 * PURPOSE:
 * A website of its own under the brand Lukas Ude about the work with
 * hunting dogs. It builds on the fly fishing website (base "flyfishing",
 * which itself builds on "bold"): same design, cart and course template
 * parts. Only its own pages from /frontend/variants/jagdhunde/pages/ are built.
 *
 * BUILD:
 *   npm run build:jagdhunde                  -> /frontend/dist-jagdhunde
 *   SITE_VARIANT=jagdhunde npm run build     -> /frontend/dist (on its host)
 *
 * CONTENT:
 *   /content/jagdhunde/kurse.json            the course ("path": /kurs/)
 *   /content/jagdhunde/bilder/               images (/media/bilder/...)
 *
 * SECURITY: everything here ends up in the public website. No secrets.
 */

import { JAGDHUNDE_TOPICS } from "../../../shared/contact-schema.js";

export const variant = {
    standalone: true,
    base: "flyfishing",
    content: "jagdhunde",
    sharedPages: ["impressum.html", "warenkorb.html"],
    news: { folder: "blog", path: "/blog/", label: "Wissen" },

    site: {
        name: "Lukas Ude Jagdhunde",
        brandLine: "Hunting with Dogs",
        personName: "Lukas Ude",
        personUrl: "https://lukasude.de",
        tagline: "Dein erster Jagdhund",
        descriptor: "Jagdhundeführer aus der Praxis",
        description:
            "Dein erster Jagdhund: Praxiswissen eines erfahrenen Jagdhundeführers für angehende Erstlingsführer. " +
            "Live-Onlinekurs von Lukas Ude, aktiver Jagdhundeführer und Dozent für Jagdhundewesen.",
        url: "https://huntingwithdogs.lukasude.de",
        navigation: [
            { label: "Der Kurs", href: "/kurs/" },
            { label: "Dein Referent", href: "/referent/" }
        ],
        legalNavigation: [
            { label: "Impressum", href: "/impressum/" },
            { label: "Datenschutz", href: "/datenschutz/" }
        ],
        cta: {
            primary: { label: "Zum Kurs", href: "/kurs/" },
            secondary: { label: "Dein Referent", href: "/referent/" }
        },
        contactTopics: JAGDHUNDE_TOPICS,
        contactPath: "/kontakt/",
        contactForm: {
            endpoint: "/api/contact",
            tokenEndpoint: "/api/contact/token",
            companyLabel: "Revier, Verein oder Unternehmen",
            messageHint: "Worum geht es? Zum Beispiel deine Fragen zum Kurs oder zu deinem ersten Jagdhund."
        },
        qr: { label: "Scannen und Dein erster Jagdhund öffnen", path: "/" },
        ogImage: "/assets/images/og/og-jagdhunde.jpg",
        jobTitle: "Jagdhundeführer und Dozent für Jagdhundewesen",
        knowsAbout: ["Jagdhunde", "Jagdhundeausbildung", "Nachsuche", "Jagdhundewesen"]
    }
};
