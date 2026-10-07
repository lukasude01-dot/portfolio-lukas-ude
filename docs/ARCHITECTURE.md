# Architecture

## 1. Brand analysis (source of truth)

Extracted from `/source-assets/lukas-ude-corporate-identity-sheet.pdf` and the logo board.

| CI element | Value | Used on the website as |
|---|---|---|
| Idea | Cinematic Heritage × Modern Systems | the overall feeling: editorial, calm, precise |
| Tagline | Rooted in ideas. Built for growth. | hero, footer, CTA, OG image |
| Descriptor | Marketing · AI · Systems | eyebrow labels, footer, mobile menu |
| Colours | Obsidian `#090A09`, Ivory `#EEEAE0`, British Green `#18251D`, Forest `#2D3B30`, Tobacco `#71543C`, Brass `#9A815C` | `--color-*` tokens |
| Colour ratio | 55% black / 30% ivory / 10% natural / 5% brass | dark-dominant pages, ivory sections, green CTA, brass only for labels and accents |
| Display font | Cormorant Garamond (editorial serif) | headlines, statements, numbers |
| UI font | Manrope | navigation, body text, labels, buttons |
| Logo | Tree + water + nodes + growth chart, monochrome, vertical separator, generous clear space | header (mark + divider + wordmark), footer, favicon |
| Image language | Cinematic not glossy · authentic not staged · warm practical light · deep shadows + texture · nature + technology · no weapons / no neon-AI | portrait treatment (vignette, warm glow), mood images, contour texture, no AI clichés |
| Voice | calm / direct / precise / purposeful. Use "From idea to system." Avoid hype, buzzwords, neon, generic stock. | all copy, no fake KPIs |

The logo was **traced** from the logo board into a vector SVG (`/frontend/assets/brand/`).
For print, use the original logo files.

## 2. System overview

```
              BUILD TIME (your computer / host)                 RUN TIME
 ┌──────────────────────────────────────────────┐
 │ /frontend/config/site.js   (public settings)  │
 │ /frontend/pages, components, templates        │   ┌──────────────┐
 │ /content/**/project.json + images             │──▶│ frontend/dist │──▶ browser
 │ /shared/contact-schema.js (public rules)      │   │ static files  │
 └──────────────────────────────────────────────┘   └──────────────┘
                                                            │ fetch /api/contact
                                                            ▼
                                        ┌───────────────────────────────────┐
                                        │ /backend (Node, no dependencies)   │
                                        │ secrets from environment variables │
                                        │ → Resend / webhook / log           │
                                        └───────────────────────────────────┘
```

**Rule:** everything in `/frontend`, `/content` and `/shared` is public. Secrets exist only
as environment variables of the backend.

## 3. Frontend

### Build pipeline (`frontend/build/`)

| File | Responsibility |
|---|---|
| `build.js` | runs all steps, writes `/dist`, watch mode |
| `lib/template.js` | `{{ value }}`, `{{{ raw }}}`, `<!-- @include -->`, `<!-- @render -->`, front matter |
| `lib/html.js` | `html` tagged template with automatic escaping (output encoding) |
| `lib/content.js` | loads `/content`, resolves image paths, warns about placeholders/example content |
| `lib/images.js` | `<img data-responsive>` → `<picture>` with AVIF/WebP/JPEG, cached |
| `lib/seo.js` | sitemap, robots, `_headers` (CSP), manifest, JSON-LD |
| `lib/qr.js` | QR code from `siteConfig.url` |
| `renderers/*.js` | HTML for content lists (cards, ad mockups, timeline, ...) |

### Pages and routes

| Route | Source |
|---|---|
| `/` | `pages/index.html` |
| `/work/` | `pages/work.html` |
| `/funnels/`, `/funnels/<slug>/` | `pages/funnels.html`, `templates/funnel-project.html` |
| `/demos/<slug>/` | `demos/<slug>/index.html` (live demo, `noindex`) |
| `/creatives/`, `/creatives/<slug>/` | `pages/creatives.html`, `templates/creative-project.html` |
| `/design/`, `/design/<slug>/` | `pages/design.html`, `templates/design-project.html` |
| `/ai/` | `pages/ai.html` (+ workflows from `/content/ai`) |
| `/about/` | `pages/about.html` (+ `/content/career`) |
| `/contact/` | `pages/contact.html` |
| `/impressum/`, `/datenschutz/` | legal placeholders (`noindex`) |
| `/404.html` | `pages/404.html` |

### Design tokens (`styles/base/variables.css`)

| Group | Tokens |
|---|---|
| Brand colours | `--color-obsidian`, `--color-ivory`, `--color-british-green`, `--color-forest`, `--color-tobacco`, `--color-brass` |
| Semantic colours | `--color-background`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-line`, `--color-accent` (switched by `.theme-dark`, `.theme-light`, `.theme-green`) |
| Typography | `--font-display`, `--font-body`, `--text-xs` … `--text-display` |
| Spacing | `--spacing-3xs` … `--spacing-section` (incl. `--spacing-small/medium/large`) |
| Layout | `--content-width`, `--content-width-text`, `--page-gutter`, `--header-height` |
| Shape | `--border-radius`, `--border-radius-large`, `--border-radius-device` |
| Motion | `--ease-cinematic`, `--duration-*`, `--reveal-distance` |

### Reusable components

| Component | CSS | Notes |
|---|---|---|
| Buttons, text links, badges | `components/buttons.css` | `.button--primary`, `.button--ghost`, `.text-link`, `.badge` |
| Navigation + mobile menu | `components/navigation.css` | `scripts/modules/navigation.js` |
| Work card | `components/cards.css` | `renderers/work.js → workCard()` |
| Ad mockup | `components/ad-mockup.css` | structure of a social ad, labelled "not a live ad" |
| Device preview | `components/device-preview.css` | live demo in desktop + phone frame (scaled iframes) |
| Timeline | `components/timeline.css` | CV, placeholders highlighted |
| Filters / view switch | `components/filters.css` | `filters.js`, `creative-views.js` |
| Lightbox | `components/lightbox.css` | `lightbox.js`, native `<dialog>` |
| Forms | `components/forms.css` | contact form states |
| QR share card | `components/qr-share.css` | footer + contact |
| Section themes | `base/variables.css` | dark → light → dark → light → green CTA → dark footer |

### Motion

Scroll reveals (`data-reveal`, `="mask"`, `="line"`), parallax (`data-parallax`),
cursor label on project images, cross-fading service images. They are slow, use one easing curve and never bounce.
Everything is disabled under `prefers-reduced-motion`. Parallax and the cursor label are off on touch devices.

### Performance

- Static HTML, one CSS file, small native JS modules, no frameworks, no third-party requests.
- Self-hosted variable fonts with `preload` and `font-display: swap`.
- Responsive AVIF/WebP images with `width`/`height` (no layout shift), lazy loading except the hero portrait (`fetchpriority="high"`).
- Funnel previews are lazy-loaded iframes.

## 4. Backend

| File | Responsibility |
|---|---|
| `src/server.js` | HTTP server, routing, security headers, error handling |
| `src/config.js` | environment variables, validation, fails fast in production |
| `src/routes/contact.js` | token + contact endpoint (all checks in order) |
| `src/routes/health.js` | `/api/health` |
| `src/services/email.js` | delivery: `log`, `resend`, `webhook` (extendable) |
| `src/lib/form-token.js` | HMAC-signed, single-use, time-limited tokens |
| `src/lib/rate-limit.js` | per-IP sliding window |
| `src/lib/http.js` | JSON body limit, origin check, client IP |
| `src/lib/security-headers.js` | CSP and friends |
| `src/lib/static-files.js` | optional static hosting with clean URLs |

**Future extensions** (CRM, AI integrations, admin area, authentication) belong in `/backend`
as new routes and services, with credentials only in environment variables.
Protected pages must be checked on the server, not hidden in the frontend.

## 5. Shared

`/shared/contact-schema.js`: one set of validation rules. The browser uses it for quick feedback,
the server for the real check. It is copied into the public site, so it must never contain secrets.
