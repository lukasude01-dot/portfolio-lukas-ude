# Project Map

Find the right file in seconds. Paths are relative to the project root.

**Glossary:** a *section* is a visual band on a page (HERO, SERVICES …). A *project* is one
content item in `/content`. *Work* is the umbrella name for all projects (`/work/`, `work-card`).

---

## Global (every page)

| What | HTML | CSS | JS / Data |
|---|---|---|---|
| Page frame | `frontend/components/layout.html` | – | – |
| HEAD / SEO tags | `frontend/components/head.html` | – | `frontend/build/lib/seo.js` |
| NAVIGATION | `frontend/components/navigation.html` | `frontend/styles/components/navigation.css` | `frontend/scripts/modules/navigation.js`, links in `frontend/config/site.js` |
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
| HERO | `styles/sections/hero.css` | `parallax.js`, `reveal.js`, portrait `assets/images/portrait/` |
| BRAND CORE | `styles/sections/brand-core.css` | – |
| SERVICES | `styles/sections/services.css` | `services-preview.js` |
| FEATURED WORK | `styles/sections/featured-work.css`, `styles/components/cards.css` | `build/renderers/work.js`, `"featured": true` in `/content` |
| PROCESS | `styles/sections/process.css` | – |
| ABOUT (teaser) | `styles/sections/about-teaser.css` | `assets/images/mood/` |
| CTA | `styles/sections/cta.css` | `components/cta-band.html` |

## WORK (`/work/`)

| Part | File |
|---|---|
| Page | `frontend/pages/work.html` |
| Styles | `frontend/styles/pages/work.css`, `components/cards.css`, `components/filters.css` |
| Cards + filters | `frontend/build/renderers/work.js` |
| Filtering | `frontend/scripts/modules/filters.js` |
| Content | all of `/content` |

## FUNNELS (`/funnels/`, `/funnels/<slug>/`, `/demos/<slug>/`)

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

## CREATIVES (`/creatives/`, `/creatives/<slug>/`)

| Part | File |
|---|---|
| Overview page | `frontend/pages/creatives.html` |
| Case page layout | `frontend/templates/creative-project.html` |
| Ad mockup, grid, variations | `frontend/build/renderers/creatives.js` |
| Styles | `frontend/styles/pages/creatives.css`, `styles/components/ad-mockup.css` |
| CREATIVE / COPY / COMBINED | `frontend/scripts/modules/creative-views.js` |
| Filters | `frontend/scripts/modules/filters.js` |
| Content | `/content/creatives/<slug>/` |

## DESIGN (`/design/`, `/design/<slug>/`)

| Part | File |
|---|---|
| Overview page | `frontend/pages/design.html` |
| Case page layout | `frontend/templates/design-project.html` |
| Grid + gallery | `frontend/build/renderers/design.js` |
| Styles | `frontend/styles/pages/design.css`, `styles/components/lightbox.css` |
| Full-screen preview | `frontend/scripts/modules/lightbox.js` |
| Content | `/content/design/<slug>/` |

## AI & SYSTEMS (`/ai/`)

| Part | File |
|---|---|
| Page (hero, flow, areas, principles) | `frontend/pages/ai.html` |
| Workflow blueprints | `frontend/build/renderers/ai.js` |
| Styles | `frontend/styles/pages/ai.css` |
| Content | `/content/ai/<slug>/project.json` |

## ABOUT (`/about/`)

| Part | File |
|---|---|
| Page (hero, values) | `frontend/pages/about.html` |
| TIMELINE, certificates, SKILLS | `frontend/build/renderers/career.js` |
| Styles | `frontend/styles/pages/about.css`, `styles/components/timeline.css` |
| Content | `/content/career/timeline.json`, `/content/career/skills.json` |

## CONTACT (`/contact/`)

| Part | File |
|---|---|
| Page | `frontend/pages/contact.html` |
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
| Content loading + checks | `frontend/build/lib/content.js` |
| Image optimisation | `frontend/build/lib/images.js` |
| Sitemap, robots, `_headers`, JSON-LD | `frontend/build/lib/seo.js` |
| Server entry | `backend/src/server.js` |
| Server settings | `backend/src/config.js` |
| Security headers | `backend/src/lib/security-headers.js` |
| Rate limit / tokens | `backend/src/lib/rate-limit.js`, `backend/src/lib/form-token.js` |
| Tests | `backend/test/contact.test.js` |
| Local dev runner | `scripts/dev.js` |
| Quality check | `scripts/check-site.js` |
