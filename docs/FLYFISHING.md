# Fly Fishing Website (flyfishing.lukasude.de)

Eigene Website unter der Marke Lukas Ude: **Lukas Ude | Fly Fishing**.
Sie liegt im selben Repository wie die Hauptseite und nutzt deren Design
(Variante „bold“: Farben, Schrift, Logo, Partikel), baut aber nur ihre eigenen Seiten.

## Wo was liegt

| Was | Datei |
| --- | --- |
| Einstellungen (Domain, Navigation, Kontaktthemen) | `frontend/variants/flyfishing/variant.js` |
| Seiten | `frontend/variants/flyfishing/pages/*.html` |
| Kursseiten (Layout) | `frontend/variants/flyfishing/templates/course-page.html` |
| Kurse (Texte, Module, Fragen) | `content/flyfishing/kurse.json` |
| Blogartikel | `content/flyfishing/blog/<slug>/article.md` |
| Bilder | `content/flyfishing/bilder/` (öffentlich unter `/media/bilder/...`) |
| Partikel-Formen (Forelle, Streamer) | `frontend/variants/flyfishing/assets/shapes/*.svg` |
| Styles | `frontend/variants/flyfishing/styles/flyfishing.css` |
| Kontaktthemen | `shared/contact-schema.js` → `FLYFISHING_TOPICS` |

Impressum kommt von der Hauptseite. Die Datenschutzerklärung hat eine eigene Fassung.

## Bauen

```bash
npm run build:flyfishing                 # -> frontend/dist-flyfishing
node scripts/check-site.js dist-flyfishing
```

## Hosting (eigene Node.js-App bei Hostinger)

Gleiches Repository und gleicher Branch wie die Hauptseite. Unterschied ist nur
die Umgebungsvariable `SITE_VARIANT=flyfishing`: Dann baut `npm run build` die
Fly-Fishing-Seite nach `frontend/dist`, und der Server liefert sie aus.

Für das Kontaktformular braucht die App dieselben Variablen wie die Hauptseite
(siehe `backend/.env.example`). Werte nie ins Repository schreiben.

## Bilder

Alle Bilder sind echte Fotos von Lukas Ude (Fliegen vom eigenen Bindetisch, Fänge, Gewässer).
Beim Einfügen neuer Fotos: auf höchstens 2000 px verkleinern und die Metadaten entfernen
(GPS-Daten verraten sonst den Angelplatz). Jedes Bild braucht einen Alt-Text und eine Bildunterschrift.

Werden wieder KI-Bilder genutzt, müssen sie sichtbar markiert sein und die Bildunterschrift
„KI-illustriert“ tragen. KI-Bilder von Personen werden nicht verwendet.
