# Editing Guide – Website selbst bearbeiten

Diese Anleitung ist für Menschen **ohne Programmiererfahrung**. Du brauchst nur einen
Texteditor (empfohlen: **Visual Studio Code**, kostenlos) und Node.js.

---

## 0. Grundlagen (einmal lesen)

### Website starten

1. Terminal im Projektordner öffnen (in VS Code: *Terminal → Neues Terminal*).
2. Beim ersten Mal: `npm run setup`
3. Danach immer: `npm run dev`
4. Im Browser **http://localhost:3000** öffnen.

Solange `npm run dev` läuft, wird die Website bei jedem Speichern automatisch neu gebaut.
Seite im Browser neu laden – fertig. Beenden mit `Strg + C`.

### Die drei wichtigsten Regeln

1. **Nie im Ordner `frontend/dist` arbeiten.** Er wird automatisch erzeugt und überschrieben.
2. **Keine Passwörter oder API-Keys in `/frontend` oder `/content`.** Alles dort ist öffentlich.
   Geheimes gehört nur in `backend/.env`.
3. **Erst ändern, dann im Browser prüfen.** Wenn etwas kaputt ist: Änderung rückgängig machen (`Strg + Z`).

### Etwas finden

In VS Code: **`Strg + Shift + F`** (Suche in allen Dateien). Nützliche Suchwörter:

| Suchwort | findet |
|---|---|
| `EDIT:` | alle Stellen, die zum Bearbeiten gedacht sind |
| `HERO` | den ersten Bereich der Startseite |
| `CONTACT` | Kontaktseite und Kontaktformular |
| `FUNNEL` | Funnel-Seiten und Demos |
| `CREATIVE` | Creatives-Seite |
| `ABOUT` | Über-mich-Seite |
| `IMAGE` | Bild-Stellen |
| `SAFE TO EDIT` | Stellen, die du gefahrlos ändern kannst |
| `EDIT WITH CARE` | Vorsicht – beeinflusst Layout |
| `DO NOT EDIT WITHOUT TESTING` | nur mit Prüfung ändern |

Jeder große Bereich ist im Code mit START- und END-Kommentaren markiert, z. B.:

```html
<!-- =========================================================
     HERO SECTION
     ...
========================================================= -->
...
<!-- ================= END HERO SECTION ================= -->
```

---

## 1. Startseiten-Überschrift ändern

Datei: `frontend/pages/index.html` → suche `EDIT: MAIN HERO HEADLINE`

```html
<span class="hero__line" ...>Rooted in ideas.</span>
<span class="hero__line heading-accent" ...>Built for growth.</span>
```

Nur den Text zwischen `>` und `</span>` ändern. Die zweite Zeile ist kursiv/messingfarben.
Der Slogan bleibt bewusst Englisch (Logo-Slogan) – alle anderen Texte der Website sind Deutsch.

## 2. Normalen Text ändern

Öffne die passende Seite in `frontend/pages/` (z. B. `about.html`) und suche nach `EDIT:`.
Text zwischen den Tags (`<p>…</p>`) ändern. Die Tags selbst stehen lassen.

Texte von **Projekten** (Funnels, Creatives, Design) stehen nicht in den Seiten, sondern
in `content/<bereich>/<projekt>/project.json` → siehe Punkt 9–13.

## 3. Mein Porträt ersetzen

1. Neues Foto (JPG, gerne groß, Hochformat) als
   `frontend/assets/images/portrait/lukas-ude-portrait.jpg` speichern (alte Datei ersetzen).
2. Fertig – die Website erstellt automatisch optimierte Versionen (AVIF/WebP).
3. Das Original bleibt in `source-assets/` gesichert.

Anderer Dateiname? Dann in `index.html` und `about.html` bei `EDIT: PROFILE IMAGE` /
`EDIT: ABOUT IMAGE` das `src="…"` anpassen. Auch den Text bei `alt="…"` (Bildbeschreibung) aktualisieren.

## 4. Logo ersetzen

Dateien in `frontend/assets/brand/`:
- `logo-mark-ivory.svg` (helles Logo für dunkle Flächen)
- `logo-mark-obsidian.svg` (dunkles Logo für helle Flächen)
- `frontend/public/favicon.svg` (Browser-Tab-Symbol)

Neue SVG-Dateien mit **gleichem Namen** speichern. Der Schriftzug „LUKAS UDE“ ist echter Text in
`frontend/components/navigation.html` (suche `EDIT: LOGO`).

## 5. Farben ändern

Datei: `frontend/styles/base/variables.css` → Abschnitt **1. BRAND COLOURS**

```css
--color-obsidian: #090A09;
--color-brass: #9A815C;
```

Hex-Code ändern → überall geändert. Abschnitt 2 (DERIVED COLOURS) nur mit Vorsicht ändern:
dort wird die Lesbarkeit (Kontrast) sichergestellt.

## 6. Schriften ändern

1. Neue Schriftdatei (`.woff2`) in `frontend/assets/fonts/` legen.
2. In `frontend/styles/base/typography.css` den `@font-face`-Block anpassen (Dateiname).
3. In `variables.css` den Namen bei `--font-display` (Überschriften) oder `--font-body` (Text) ändern.
4. In `frontend/components/head.html` die `preload`-Zeilen auf die neuen Dateien anpassen.

Bitte Schriften lokal einbinden (nicht über Google Fonts) – das ist datenschutzfreundlich.

## 7. Buttons ändern

- **Text und Ziel der Haupt-Buttons** (Hero, CTA): `frontend/config/site.js` → `cta`
- **Andere Buttons**: in der jeweiligen Seite den Text zwischen `<a class="button …">` und `</a>` ändern.
- **Aussehen** aller Buttons: `frontend/styles/components/buttons.css`

## 8. Links ändern / Navigationspunkt hinzufügen

Datei: `frontend/config/site.js` → `navigation`

```js
navigation: [
    { label: "Arbeiten", href: "/work/" },
    { label: "Blog", href: "/blog/" },   // neuer Punkt
    ...
]
```

Der Link erscheint automatisch in Kopfzeile, Mobilmenü und Footer.
Für eine **neue Seite**: eine bestehende Datei in `frontend/pages/` kopieren (z. B. `work.html` → `blog.html`),
oben im `---`-Block `title`, `description` und `path: /blog/` anpassen, Inhalt ändern.

## 9. Portfolio-Projekt hinzufügen

1. Bereich wählen: `content/funnels`, `content/creatives` oder `content/design`.
2. Den Ordner `_template` **kopieren** und umbenennen, z. B. `mein-projekt`
   (nur Kleinbuchstaben, Zahlen, Bindestriche – das wird die Adresse `/design/mein-projekt/`).
3. Bilder in diesen Ordner legen.
4. `project.json` öffnen, alle `[ADD …]` ausfüllen, Bildnamen eintragen.
5. `"status": "draft"` in `"status": "published"` ändern.
6. Soll es auf der Startseite erscheinen? `"featured": true`.

Details zu jedem Feld: `docs/CONTENT-GUIDE.md`.

## 10. Creative hinzufügen

Wie Punkt 9 in `content/creatives/`. Jede Anzeigen-Variante ist ein Eintrag in `"ads"`
(Bild, Hook, Primary Text, Headline, CTA). `"format"`: `square`, `portrait` oder `story`.

## 11. Copywriting-Beispiele hinzufügen

Im selben Creative-Projekt:
- `"hooks": [ "…", "…" ]` – Liste von Hooks
- `"headlines": [ "…" ]` – Liste von Headlines
- in jedem Eintrag von `"ads"`: `"primaryText"` (neue Zeile mit `\n`)

Auf `/creatives/` kann man mit **COPY** nur die Texte ansehen.

## 12. Design-Arbeit hinzufügen

Wie Punkt 9 in `content/design/`. Mit `"layout"` bestimmst du die Kachelgröße:
`feature` (groß), `wide` (breit), `tall` (hoch), `standard`.
Alle Bilder für die Projektseite stehen in `"images"` (`"size": "full"` oder `"half"`).

## 13. Funnel hinzufügen

1. Projekt wie Punkt 9 in `content/funnels/` anlegen.
2. Live-Demo: Ordner `frontend/demos/recruiting-demo` kopieren, umbenennen, Texte in
   `index.html` und Farben in `theme.css` ändern.
3. In `project.json`: `"demoPath": "/demos/<ordnername>/"`.
4. Titelbild `cover.jpg` = Screenshot der Demo, in den Content-Ordner legen.

Demos senden **keine Daten**. Das steht auch sichtbar oben in der Demo.

## 14. Lebenslauf aktualisieren

Datei: `content/career/timeline.json` – jeder Block `{ … }` in `"entries"` ist eine Station
(neueste zuerst). Alle `[ADD …]` ersetzen. Nicht benötigte Blöcke löschen
(auf Kommas zwischen den Blöcken achten!).

Fähigkeiten: `content/career/skills.json`.
Persönlicher Satz auf der Über-mich-Seite: `frontend/pages/about.html` → `[ADD PERSONAL DETAIL …]`.

## 15. Zertifikate aktualisieren

`content/career/timeline.json` → `"certificates"`:

```json
{ "year": "2025", "title": "Name des Zertifikats", "issuer": "Anbieter" }
```

## 16. Kontaktdaten ändern

`frontend/config/site.js`:
- `email` – öffentliche E-Mail (leer lassen = wird nicht angezeigt)
- `location` – z. B. „Hamburg, Germany“

**Wohin Formular-Nachrichten gehen**, steht NICHT hier, sondern geheim in `backend/.env`
(`CONTACT_TO_EMAIL` usw., siehe `backend/.env.example`).

## 17. Social Links aktualisieren

`frontend/config/site.js` → `social`:

```js
social: [
    { label: "LinkedIn", url: "https://www.linkedin.com/in/dein-name" },
    { label: "Instagram", url: "" }     // leer = wird nicht angezeigt
]
```

## 18. SEO-Titel ändern

Ganz oben in jeder Seite in `frontend/pages/` steht ein Block zwischen `---`:

```
---
title: Funnels & Landingpages
description: Funnels und Landingpages zum Selbst-Ausprobieren ...
path: /funnels/
---
```

`title` = Titel im Browser-Tab und bei Google (es wird automatisch „– Lukas Ude“ angehängt).
Für Projektseiten: in `project.json` die Felder `"seoTitle"` / `"seoDescription"` ergänzen.

## 19. Meta-Description ändern

Im selben `---`-Block: `description:` (ca. 120–155 Zeichen, ein natürlicher Satz).
Standard-Beschreibung und Teilen-Bild: `frontend/config/site.js` → `description`, `ogImage`.

## 20. Einen bestimmten Bereich finden

1. Seite im Browser öffnen, z. B. `/about/`.
2. Datei `frontend/pages/about.html` öffnen.
3. Die großen Kommentar-Kästen (`=====`) zeigen jeden Bereich mit Namen und den zugehörigen Dateien.

Schneller: `docs/PROJECT-MAP.md` – dort steht jeder Bereich mit seinen Dateien.

## 21. Welche CSS-Datei steuert ein Element?

1. Im Browser Rechtsklick auf das Element → **Untersuchen**.
2. Den Klassennamen lesen, z. B. `class="hero__headline"`.
3. Der erste Teil (`hero`) ist der Name des Bereichs → Datei `frontend/styles/sections/hero.css`.

Faustregel:

| Klasse beginnt mit | Datei |
|---|---|
| `hero`, `services`, `featured-work`, `process`, `cta`, `page-hero`, `brand-core`, `about-teaser` | `styles/sections/<name>.css` |
| `button`, `site-header`, `site-footer`, `work-card`, `ad-mockup`, `device-preview`, `timeline`, `filter-bar`, `form-field`, `lightbox`, `qr-share` | `styles/components/…` |
| `funnel`, `creative`, `design`, `ai-`, `workflow`, `about-`, `contact`, `legal`, `project-` | `styles/pages/…` |

Alternativ: `Strg + Shift + F` und den Klassennamen suchen.

## 22. Welche JavaScript-Datei steuert eine Interaktion?

| Interaktion | Datei (`frontend/scripts/modules/`) |
|---|---|
| Kopfzeile beim Scrollen, Mobilmenü | `navigation.js` |
| Einblend-Animationen beim Scrollen | `reveal.js` |
| Bild-Tiefe (Parallax) | `parallax.js` |
| runder „View“-Kreis an der Maus | `cursor-label.js` |
| Bilder in der SERVICES-Liste | `services-preview.js` |
| Filter-Buttons | `filters.js` |
| CREATIVE / COPY / COMBINED | `creative-views.js` |
| Funnel-Vorschau in Geräte-Rahmen | `device-preview.js` |
| Vollbild-Bildansicht | `lightbox.js` |
| Kontaktformular | `contact-form.js` |
| Mehrstufige Demo-Formulare | `frontend/demos/shared/demo-funnel.js` |

Im HTML erkennst du die Verbindung an `data-…`-Attributen (z. B. `data-contact-form`).

---

## 23. QR-Code

Der QR-Code (Footer und Kontaktseite) wird **beim Build automatisch erzeugt** – ohne externen Dienst.

- **Ziel ändern:** `frontend/config/site.js` → `url` (deine Domain). Optional `qr.path`,
  z. B. `"/contact/"`, damit der Code direkt die Kontaktseite öffnet.
- **Text darunter:** `qr.label`
- **Aussehen** (Größe, Farben): `frontend/styles/components/qr-share.css` und `frontend/build/lib/qr.js`.
  Wichtig: dunkle Punkte auf hellem Grund und mind. ca. 96 px Größe – sonst scannt das Handy schlecht.
- Es werden **keine Tracking-Parameter** angehängt.

Aktuell zeigt der Code auf `http://localhost:3000` (Beispielwert). **Vor dem Livegang die echte Domain eintragen.**

---

## Vor dem Livegang

1. `npm run build` – Warnungen lesen und abarbeiten (Beispielinhalte, `[ADD …]`, Domain).
2. `npm run check` – prüft Links, Bilder und versehentlich veröffentlichte Geheimnisse.
3. `npm test` – prüft das Kontaktformular-Backend.
4. Impressum und Datenschutz ausfüllen und rechtlich prüfen lassen.
