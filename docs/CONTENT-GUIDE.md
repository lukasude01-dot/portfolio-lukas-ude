# Content Guide

All portfolio content lives in `/content`. **One folder = one project.**

```
/content
  /funnels/<slug>/project.json     + images
  /creatives/<slug>/project.json   + images
  /design/<slug>/project.json      + images
  /ai/<slug>/project.json          (workflow blueprints, no images needed)
  /career/timeline.json            CV / MY JOURNEY + certificates
  /career/skills.json              SKILLS
```

- The **folder name** becomes the URL: `/content/design/poster-series/` → `/design/poster-series/`.
  Use lowercase letters, numbers and hyphens only.
- Folders starting with `_` (e.g. `_template`) are ignored. **To add a project, copy `_template`.**
- Images are referenced by **file name only** (`"src": "cover.jpg"`). Put them in the same folder.
  The build optimises them automatically. Large JPGs or PNGs are fine.
- Every image needs an `"alt"` text that describes it. The build warns if one is missing.
- Text fields are plain text. HTML is escaped (shown as text) for security.
- After saving, `npm run dev` rebuilds automatically. Otherwise run `npm run build`.
- JSON typo? The build stops and names the file. Check commas and quotes.

## Fields used by every section

| Field | Required | Meaning |
|---|---|---|
| `title` | yes | project title |
| `category` | – | list, e.g. `["Recruiting", "Performance"]`. Used for filters |
| `description` | yes | one sentence (cards, SEO description) |
| `year` | – | e.g. `"2026"` |
| `client` | – | client or brand |
| `services` | – | list of what you did |
| `thumbnail` | yes* | `{ "src": "cover.jpg", "alt": "..." }` (*not for AI workflows) |
| `featured` | – | `true` = shown in FEATURED WORK on the homepage (max. 4) |
| `order` | – | sorting, lower first |
| `status` | – | `"published"` (default) or `"draft"` (not built) |
| `example` | – | `true` = example content (fictional), shown as "Concept" and listed as a build warning |
| `concept` | – | `true` = your own concept work, shown as "Concept" |
| `seoTitle`, `seoDescription` | – | override the page title/description in Google |

---

## Funnels

Folder: `/content/funnels/<slug>/`. Page: `/funnels/<slug>/`.

Additional fields:

| Field | Meaning |
|---|---|
| `demoPath` | link to the live demo, e.g. `"/demos/recruiting-demo/"` |
| `demoNotice` | note shown on the case page ("Portfolio demonstration ...") |
| `context`, `objective`, `objectiveShort` | situation and goal |
| `audience`, `strategy` | lists |
| `structure` | steps: `{ "step": "Ad", "title": "...", "text": "..." }` |
| `copy` | `{ "headline", "subheadline", "hooks": [], "tone" }` |
| `visual` | `{ "palette": [{ "name", "hex": "#RRGGBB" }], "typography", "imagery", "layout" }` |
| `ctaStructure` | `{ "role", "text", "where" }` |
| `journey` | `{ "title", "text" }` |
| `screenshots` | optional: `{ "src", "alt", "caption" }` (open in the lightbox) |

### Adding a live demo

1. Copy `/frontend/demos/recruiting-demo/` to `/frontend/demos/<new-demo>/`.
2. Edit `index.html` (texts) and `theme.css` (colours) in the new folder.
3. Multi-step form: use `<fieldset class="demo-step" data-step>` for every question.
   Mark the contact step with `data-step-contact`. Personalise the final screen with
   `data-show-if="fieldname=value"`. The logic is in `/frontend/demos/shared/demo-funnel.js`.
4. Set `"demoPath": "/demos/<new-demo>/"` in the funnel's `project.json`.
5. Make a cover: a screenshot of the demo saved as `cover.jpg` in the content folder.

Demos **never send data**. To turn a demo into a real client funnel, add a backend
endpoint (like `/backend/src/routes/contact.js`) and call it in `finish()` in `demo-funnel.js`.
Do this only with a privacy policy and a real destination.

The case page shows the live demo in a desktop and a phone frame automatically.

---

## Creatives

Folder: `/content/creatives/<slug>/`. Page: `/creatives/<slug>/`.

| Field | Meaning |
|---|---|
| `brand` | `{ "name", "initials", "domain" }` – shown in the ad mockup |
| `objective`, `insight` | text |
| `approach` | list |
| `ads` | variations (the first one is shown in the grid) |
| `hooks`, `headlines` | copy library on the case page |

One entry in `ads`:

```json
{
    "label": "Working hours",
    "format": "portrait",
    "image": { "src": "ad-1.jpg", "alt": "..." },
    "hook": "Short hook",
    "primaryText": "First line\nSecond line",
    "headline": "Headline under the image",
    "description": "small line under the headline (optional)",
    "cta": "Apply now",
    "rationale": "why this variation exists (optional)"
}
```

`format`: `square` (1:1), `portrait` (4:5), `story` (9:16). `\n` makes a new line.

**Filters** on `/creatives/`: Recruiting, Lead Generation, Brand, Social, Performance.
Write the category exactly like that. The list is in `/frontend/build/renderers/creatives.js`.

**Copywriting only (no image)?** Use any neutral image (e.g. a typographic card) and
switch visitors to the COPY view, or create the creative as a simple text graphic.

---

## Design

Folder: `/content/design/<slug>/`. Page: `/design/<slug>/`.

| Field | Meaning |
|---|---|
| `layout` | tile size on `/design/`: `feature` (large), `wide`, `tall`, `standard` |
| `body` | list of paragraphs |
| `images` | gallery: `{ "src", "alt", "caption", "size": "full" \| "half" }` |

Tip: mix layouts (e.g. one `feature`, one `tall`, one `wide`, one `standard`) for an editorial grid.

---

## AI

Folder: `/content/ai/<slug>/`. Shown on `/ai/` as workflow blueprints (anchor `#workflow-<slug>`).

| Field | Meaning |
|---|---|
| `steps` | `{ "label", "role": "Human" \| "AI" \| "System", "text" }` |
| `outputs` | list |
| `humanInLoop` | where a person stays in control |
| `tools` | optional text |

---

## Career

`/content/career/timeline.json`:

```json
{
    "entries": [
        {
            "period": "2023 – today",
            "type": "Experience",
            "title": "Job title",
            "organisation": "Company",
            "location": "City",
            "description": "What you do there",
            "tags": ["Marketing", "AI"]
        }
    ],
    "certificates": [
        { "year": "2024", "title": "Certificate", "issuer": "Issuer" }
    ]
}
```

Newest first. Placeholders like `[ADD DATE]` are highlighted on the page until replaced.

`/content/career/skills.json`: groups with `name`, `summary`, `skills` (list), `tools` (optional).

---

## Before going live

Run `npm run build` and read the warnings:
- `EXAMPLE CONTENT`: replace or set `"status": "draft"`
- `PLACEHOLDERS`: fill in `[ADD ...]`
- `IMAGES` / `CONTENT`: missing files or alt texts

Then run `npm run check`.
