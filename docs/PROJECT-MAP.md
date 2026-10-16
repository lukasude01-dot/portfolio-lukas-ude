# Project Map

Find the right file in seconds. Paths are relative to the project root.

**Glossary:** a *section* is a visual band on a page (HERO, SERVICES …). A *project* is one
content item in `/content`. *Portfolio* is the hub for all projects (`/portfolio/`); its areas
(Funnels, Creatives, KI) live below it. `work-card` is the card used in FEATURED WORK.

---

## Global (every page)

| What | HTML | CSS | JS / Data |
|---|---|---|---|
| Page frame | `frontend/components/layout.html` | – | – |
| HEAD / SEO tags | `frontend/components/head.html` | – | `frontend/build/lib/seo.js` |
| NAVIGATION | `frontend/components/navigation.html` | `frontend/styles/components/navigation.css` | `frontend/scripts/modules/navigation.js`, links in `frontend/config/site.js` |
| PORTFOLIO SUB-NAVIGATION | `frontend/components/portfolio-subnav.html` | `frontend/styles/components/portfolio-subnav.css` | `frontend/build/renderers/site.js` (`portfolio-subnav`), links in `site.js → portfolioNavigation` |
| FOOTER | `frontend/components/footer.html` | `frontend/styles/components/footer.css` | links from `site.js` |
| QR SHARE CARD | `frontend/components/qr-share.html` | `frontend/styles/components/qr-share.css` | `frontend/build/lib/qr.js` |
| CTA (green band) | `frontend/components/cta-band.html` | `frontend/styles/sections/cta.css` | – |
| Design tokens | – | `frontend/styles/base/variables.css` | – |
| Fonts | – | `frontend/styles/base/typography.css` | `frontend/assets/fonts/` |
| Animations | `data-reveal`, `data-parallax` attributes | `frontend/styles/base/motion.css` | `reveal.js`, `parallax.js` |
| Public settings | – | – | `frontend/config/site.js` |

## HOMEPAGE (`/`)

`frontend/pages/index.html`

| Section | CSS | JS / Data |
|---|---|---|
| HERO (claim "Marketing, das wirkt." with cut-out portrait, name + button left, descriptor right) | `styles/sections/hero.css` | `reveal.js`, portrait `assets/images/portrait/lukas-ude-cutout.png`, descriptor in `site.js` |
| SERVICES BAND (four areas with small images, links into the portfolio) | `styles/sections/home.css` (SERVICES BAND) | – |
| SELECTED WORK (four project cards) | `styles/sections/home.css` (SELECTED WORK) | `build/renderers/portfolio.js` (`home-selected-work`), `/content/portfolio` |
| STORY BANNER ("Vom Forst ins Marketing.", links to `/about/`) | `styles/sections/home.css` (STORY BANNER) | `parallax.js`, `assets/images/nature/` |
| PROCESS (compact, six steps with icons, links to `/about/#vorgehen`) | `styles/sections/home.css` (STEPS COMPACT) | – |
| NEWS TEASER (3 newest articles) | `styles/pages/news.css` | `build/renderers/news.js` (`news-teaser`), `/content/news` |
| CTA | `styles/sections/cta.css` | `components/cta-band.html` |

## PORTFOLIO HUB (`/portfolio/`, `/portfolio/<slug>/`)

The portfolio is the hub for all work. Funnels, Creatives and KI are sub-pages below it,
each with the PORTFOLIO SUB-NAVIGATION under the hero. All project URLs come from
`SECTION_PATHS` in `frontend/build/lib/content.js` (must match the `path:` of each page).
"Alle Arbeiten" links point to `/portfolio/`.

| Part | File |
|---|---|
| Overview page ("Selected Work", the areas are linked in the sub-navigation) | `frontend/pages/portfolio.html` |
| Sub-navigation | `frontend/components/portfolio-subnav.html`, `frontend/build/renderers/site.js` |
| Project page layout | `frontend/templates/portfolio-project.html` |
| Grid, motifs, description, next project | `frontend/build/renderers/portfolio.js` |
| Contact CTA ("Du hast ein Projekt im Kopf?") | `frontend/components/portfolio-cta.html` |
| Styles | `frontend/styles/pages/portfolio.css` |
| Full-screen view | `frontend/scripts/modules/lightbox.js` |
| Content + original graphics | `/content/portfolio/<slug>/` |

## FUNNELS (`/portfolio/funnels/`, `/portfolio/funnels/<slug>/`, `/demos/<slug>/`)

| Part | File |
|---|---|
| Overview page | `frontend/pages/funnels.html` |
| Case page layout | `frontend/templates/funnel-project.html` |
| Case parts (structure, copy, journey …) | `frontend/build/renderers/funnels.js` |
| Styles | `frontend/styles/pages/funnels.css`, `styles/pages/project.css`, `styles/components/device-preview.css` |
| Device preview scaling | `frontend/scripts/modules/device-preview.js` |
| Content | `/content/funnels/<slug>/project.json` |
| Live demos | `frontend/demos/<slug>/index.html` + `theme.css` |
| Demo logic / base styles | `frontend/demos/shared/demo-funnel.js`, `demo-base.css` |
| Demo notice bar | `frontend/components/demo-bar.html` |

## CREATIVES (`/portfolio/creatives/`, `/portfolio/creatives/<slug>/`)

| Part | File |
|---|---|
| Overview page | `frontend/pages/creatives.html` |
| Case page layout | `frontend/templates/creative-project.html` |
| Ad mockup, grid, variations | `frontend/build/renderers/creatives.js` |
| Styles | `frontend/styles/pages/creatives.css`, `styles/components/ad-mockup.css` |
| CREATIVE / COPY / COMBINED (`/portfolio/creatives/?view=copy` opens the copy view) | `frontend/scripts/modules/creative-views.js` |
| Filters | `frontend/scripts/modules/filters.js` |
| Content | `/content/creatives/<slug>/` |

## AI & SYSTEMS (`/portfolio/ki/`, workflows as `#workflow-<slug>`)

| Part | File |
|---|---|
| Page (hero, AI & SYSTEMS AREAS, WORKFLOWS) | `frontend/pages/ai.html` |
| Workflow blueprints | `frontend/build/renderers/ai.js` |
| Styles | `frontend/styles/pages/ai.css` |
| Content | `/content/ai/<slug>/project.json` |

## LEISTUNGEN (`/leistungen/`)

| Part | File |
|---|---|
| Page | `frontend/pages/leistungen.html` |
| Package cards (name, price, summary, "Mehr erfahren" + "Anfragen") | `frontend/build/renderers/services.js` (`service-packages`) |
| Package pages `/leistungen/<slug>/` (full "includes" list, "Ideal für") | `frontend/templates/service-page.html`, `frontend/build/renderers/services.js` |
| Styles | `frontend/styles/pages/services.css` |
| Content | `/content/leistungen/pakete.json` |
| Package button → contact topic | links to `/contact/?thema=<topic>`, pre-selected by `frontend/scripts/modules/contact-form.js` (topic must be in `CONTACT_TOPICS` in `shared/contact-schema.js`) |

## NEWS (`/news/`, `/news/<slug>/`)

| Part | File |
|---|---|
| Overview page | `frontend/pages/news.html` |
| Article page layout | `frontend/templates/news-article.html` |
| List, teaser, cover, more articles | `frontend/build/renderers/news.js` |
| Article pages | `frontend/build/build.js` (`buildNewsPages`) |
| Markdown | `frontend/build/lib/markdown.js` |
| Styles | `frontend/styles/pages/news.css` |
| Content | `/content/news/<slug>/article.md` + images (template: `/content/news/_vorlage`) |

## ABOUT (`/about/`)

| Part | File |
|---|---|
| Page (hero, ABOUT VALUES "Vermitteln statt Marktschreien", ABOUT STORY "Kein Fließband") | `frontend/pages/about.html` |
| PROCESS SECTION (detailed, `id="vorgehen"`, 6 steps + "Mein Anspruch") | `frontend/pages/about.html`, `styles/sections/process.css` |
| TIMELINE, certificates | `frontend/build/renderers/career.js` |
| Styles | `frontend/styles/pages/about.css`, `styles/components/timeline.css` |
| Content | `/content/career/timeline.json` (`skills.json` is not rendered, the About page has no SKILLS section) |

## CONTACT (`/contact/`)

| Part | File |
|---|---|
| Page ("Erzähl mir von deinem Projekt.") | `frontend/pages/contact.html` |
| CONTACT FORM (frontend) | `frontend/components/contact-form.html` |
| Form styles | `frontend/styles/components/forms.css`, `styles/pages/contact.css` |
| Form behaviour | `frontend/scripts/modules/contact-form.js` |
| Validation rules (shared) | `shared/contact-schema.js` |
| Backend endpoint | `backend/src/routes/contact.js` |
| Delivery (e-mail / webhook) | `backend/src/services/email.js` |
| Secrets | `backend/.env` (template: `backend/.env.example`) |

## LEGAL

| Page | File |
|---|---|
| `/impressum/` | `frontend/pages/impressum.html` |
| `/datenschutz/` | `frontend/pages/datenschutz.html` |
| 404 | `frontend/pages/404.html` |
| Styles | `frontend/styles/pages/legal.css` |

## BUILD & BACKEND

| What | File |
|---|---|
| Build entry | `frontend/build/build.js` |
| Templates `{{ }}` / `@include` / `@render` | `frontend/build/lib/template.js` |
| Content loading + checks, `SECTION_PATHS` | `frontend/build/lib/content.js` |
| Markdown for news | `frontend/build/lib/markdown.js` |
| Image optimisation | `frontend/build/lib/images.js` |
| Sitemap, robots, `_headers`, JSON-LD | `frontend/build/lib/seo.js` |
| Server entry | `backend/src/server.js` |
| Server settings | `backend/src/config.js` |
| Security headers | `backend/src/lib/security-headers.js` |
| Rate limit / tokens | `backend/src/lib/rate-limit.js`, `backend/src/lib/form-token.js` |
| Tests | `backend/test/contact.test.js` |
| Local dev runner | `scripts/dev.js` |
| Quality check | `scripts/check-site.js` |
