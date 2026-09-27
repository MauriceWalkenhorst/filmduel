# Abspann: persönliche Watchlist

Eigenständig unter `/watchlist/`, ohne Quiz-Module, Quiz-Anmeldung oder Convex.

## Lokal

Node 22 oder neuer. Keine zusätzlichen npm-Pakete benötigt.

```sh
TMDB_READ_TOKEN='Token aus sicherer Quelle' npm run watchlist:dev
```

Alternativ lokal `WATCHLIST_TOKEN_FILE` auf eine vorhandene Datei mit einem
TMDB-Read-Token setzen. Die Datei wird nur gelesen und niemals ausgeliefert.
Vorschau: http://localhost:4173/watchlist/ .

## Benutzen

„Meine Watchlist“ → Import öffnen → `watchlist.csv` und `watched.csv` aus
Letterboxd auswählen. Einmaliger Import genügt. Vier Stimmungen auswählen und
Film ziehen. Gesehen-Markierungen, gewählte Filme und manuelle Stimmungen
bleiben in diesem Browser. Regelmäßig eine JSON-Sicherung herunterladen.
Sicherung kann auf einem anderen Gerät importiert werden.

Unbekannte Titel bleiben „Ohne Stimmung“. Subjektive Vorschläge können in der
Watchlist geändert werden. Angekündigte Filme mit unbekannter Stimmung werden
nicht automatisch zugeordnet. Ein Cover belegt keine Streaming-Verfügbarkeit.

## Prüfen

```sh
npm test
LETTERBOXD_EXPORT='/absoluter/pfad/zum/export' npm test
```

Tests mit echten Exportdaten verwenden nur die lokale Datei; sie wird nicht
kopiert oder eingecheckt. UI zusätzlich im Browser bei 390 px prüfen.

## Hosting nach ausdrücklicher Freigabe

Die vorhandene statische Vercel-Konfiguration kann unverändert bleiben.
`watchlist/` enthält die öffentliche App. `api/watchlist-poster.js` ist eine
separate serverseitige Funktion; `_watchlist-tmdb.cjs` enthält ihre Hilfslogik.
Auf Vercel `TMDB_READ_TOKEN` als geheime Umgebungsvariable setzen. Persönliche
CSV-/JSON-Dateien und Token gehören nicht in den ausgelieferten Projektordner.
Keinen Convex-Deploy ausführen. Es wurde weder gepusht noch veröffentlicht.

## Cover-Zuordnung

Standard: eindeutige Übereinstimmung von Titel und Jahr. Bei Mehrdeutigkeit
neutraler Platzhalter. Geprüfte Ausnahmen stehen in `_watchlist-tmdb.cjs`.
Manuell geprüft am 27.09.26 über die TMDB-Suche und Filmhandlung:
Burning (2018) → 491584, Hunt (2022) → 727340, Minari (Letterboxd 2020,
TMDB 2021) → 615643, Aftersun (2022) → 965150, Kill (Letterboxd 2023,
TMDB 2024) → 1160018.

Quellen: https://developer.themoviedb.org/reference/search-movie und
https://developer.themoviedb.org/docs/image-basics .
