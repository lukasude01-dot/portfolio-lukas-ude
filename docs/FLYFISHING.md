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

## Shop und Warenkorb

- Fliegen: `content/flyfishing/fliegen.json`, Kurse buchbar über `"offers"` in `kurse.json`.
- Preise: `"price": "4,50 €"` eintragen. Ohne Preis steht „Preis auf Anfrage“.
- Warenkorb: `frontend/variants/flyfishing/scripts/flyfishing/cart.js` (speichert nur IDs und Mengen im Browser).
- Absenden: `POST /api/order` (`backend/src/routes/order.js`). Der Server prüft gegen den Katalog in
  `content/flyfishing/` und schickt eine unverbindliche Bestellanfrage per E-Mail.

### Online-Bezahlung später zuschalten

Vorgesehen ist Stripe Checkout (Bezahlseite von Stripe, keine Kartendaten auf dieser Seite):
1. Gewerbe anmelden, Stripe-Konto anlegen.
2. Preise in `fliegen.json` und `kurse.json` eintragen, AGB, Widerrufsbelehrung und Versandinfos ergänzen.
3. `STRIPE_SECRET_KEY` und `STRIPE_WEBHOOK_SECRET` nur als Umgebungsvariable bei Hostinger setzen.
4. `order.js` erzeugt dann eine Checkout-Session statt der E-Mail; ein Webhook bestätigt die Zahlung.
5. Datenschutzerklärung um den Zahlungsanbieter ergänzen, Button in „Zahlungspflichtig bestellen“ ändern.


## Dritte Seite: Jagdhunde (huntingwithdogs.lukasude.de)

Aufbau wie Fly Fishing, Variante `frontend/variants/jagdhunde/` (Basis: flyfishing).
Kurs in `content/jagdhunde/kurse.json`, Bilder in `content/jagdhunde/bilder/`.

```bash
npm run build:jagdhunde
node scripts/check-site.js dist-jagdhunde
```

Hosting: eigene Node.js-App mit `SITE_VARIANT=jagdhunde`, sonst wie oben.
