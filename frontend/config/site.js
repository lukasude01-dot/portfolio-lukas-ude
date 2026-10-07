/**
 * SITE CONFIGURATION  (public settings for the whole website)
 *
 * PURPOSE:
 * Everything you are likely to change often lives here:
 * name, domain, navigation, social links, button labels,
 * contact details and SEO defaults.
 *
 * HOW IT IS USED:
 * The build script (/frontend/build/build.js) reads this file
 * and writes the values into every page. After editing, run
 * `npm run build` (or keep `npm run dev` running).
 *
 * IMPORTANT - SECURITY:
 * Everything in this file ends up in the public website.
 * NEVER put passwords, API keys, private e-mail credentials
 * or any other secret in here. Secrets belong in
 * /backend/.env (see /backend/.env.example).
 *
 * Values marked "EDIT:" still need your real information.
 */

export const siteConfig = {

    // ---------------------------------------------------------
    // IDENTITY
    // ---------------------------------------------------------

    name: "Lukas Ude",

    // EDIT: TAGLINE (logo slogan – deliberately stays English)
    tagline: "Rooted in ideas. Built for growth.",

    // EDIT: DESCRIPTOR (the small line above headlines)
    descriptor: "Marketing · KI · Systeme",

    // EDIT: DEFAULT SEO DESCRIPTION (used when a page has none)
    description:
        "Lukas Ude verbindet kreatives Marketing, Copywriting, Funnels und Design mit " +
        "KI-gestützten Workflows und klaren Systemen – von der ersten Idee bis zum laufenden Prozess.",


    // ---------------------------------------------------------
    // DOMAIN  (the ONE place where the website address lives)
    //
    // EDIT: your real production domain, with https:// and
    // WITHOUT a trailing slash.
    //
    // Used for: canonical URLs, sitemap.xml, robots.txt,
    // Open Graph tags and the QR code.
    //
    // You can also override it when building:
    //   PUBLIC_SITE_URL=https://staging.example.com npm run build
    // ---------------------------------------------------------

    // EXAMPLE VALUE: local development address. Replace with the real
    // domain before going live, e.g. "https://www.your-domain.de".
    url: "http://localhost:3000",

    language: "de",
    locale: "de_DE",


    // ---------------------------------------------------------
    // CONTACT & SOCIAL
    // Leave a value empty ("") to hide it on the website.
    // ---------------------------------------------------------

    // EDIT: PUBLIC E-MAIL ADDRESS (shown on the contact page)
    // EXAMPLE VALUE – replace with your real address.
    email: "hello@example.com",

    // EDIT: LOCATION (optional, e.g. "Hamburg, Germany")
    // EXAMPLE VALUE
    location: "Deutschland",

    // EDIT: SOCIAL LINKS  (empty url = not shown)
    social: [
        // EXAMPLE VALUES – replace with your real profile links.
        { label: "LinkedIn", url: "https://www.linkedin.com/in/example" },
        { label: "Instagram", url: "https://www.instagram.com/example" }
    ],


    // ---------------------------------------------------------
    // NAVIGATION
    // SAFE TO EDIT: add, remove or reorder items.
    // "href" must match a page path (with trailing slash).
    // ---------------------------------------------------------

    navigation: [
        { label: "Arbeiten", href: "/work/" },
        { label: "Funnels", href: "/funnels/" },
        { label: "Creatives", href: "/creatives/" },
        { label: "Design", href: "/design/" },
        { label: "KI", href: "/ai/" },
        { label: "Über mich", href: "/about/" },
        { label: "Kontakt", href: "/contact/" }
    ],

    legalNavigation: [
        { label: "Impressum", href: "/impressum/" },
        { label: "Datenschutz", href: "/datenschutz/" }
    ],


    // ---------------------------------------------------------
    // CALL-TO-ACTION BUTTONS  (used in hero and CTA sections)
    // ---------------------------------------------------------

    cta: {
        primary: { label: "Meine Arbeiten", href: "/work/" },
        secondary: { label: "Zusammenarbeiten", href: "/contact/" }
    },


    // ---------------------------------------------------------
    // CONTACT FORM API
    //
    // apiOrigin:
    //   ""  -> the backend runs on the SAME domain as the website
    //          (recommended, e.g. backend serves /api/...)
    //   "https://api.your-domain.de" -> backend on its own domain
    //
    // This is a public address, not a secret.
    // ---------------------------------------------------------

    apiOrigin: "",

    contactForm: {
        endpoint: "/api/contact",
        tokenEndpoint: "/api/contact/token"
    },


    // ---------------------------------------------------------
    // QR CODE
    // The QR code always points to `url` above (plus `path`).
    // It is generated automatically during the build into
    // /assets/qr/site-qr.svg. No external QR service is used.
    // ---------------------------------------------------------

    qr: {
        label: "Scannen und Portfolio öffnen",
        path: "/"          // e.g. "/contact/" to open the contact page
    },


    // ---------------------------------------------------------
    // SEO DEFAULTS
    // ---------------------------------------------------------

    // Image shown when the site is shared (1200 x 630 px)
    ogImage: "/assets/images/og/og-default.jpg",

    // Used in structured data (schema.org/Person)
    jobTitle: "Marketing, KI & Systeme",
    knowsAbout: [
        "Marketing",
        "Copywriting",
        "Funnels und Landingpages",
        "Grafikdesign",
        "KI-gestütztes Marketing",
        "Marketing-Automatisierung"
    ]
};
