# Watchlist: Umsetzung

Stand: 27.09.26. Freigegeben durch Maurice: „Danach kannst du starten“, Ziel funktionierende App.
Spec: Second Brain/wiki/themen/watchlist-app.md. Ausführung hier durch Codex.

Eigenständige statische App unter /watchlist/, separates Vanilla-JS-Modul und
CSS; serverseitiger TMDB-Endpunkt. Kein Quiz-Import, keine Quiz-Navigation,
kein Convex-Aufruf. Persönliche Daten ausschließlich im Browser, Sicherung als JSON.

1. Kern in watchlist/core.mjs: CSV-Parser, URI-basierter Import, validierte
   Sicherung, lokale Speicherung, Stimmungspool und Ziehung ohne Wiederholung.
   Tests zuerst in tests/watchlist.test.mjs, dann `node --test tests/*.test.mjs`.
   Export 27.09.26 zusätzlich lesen: 167 Watchlist, 684 gesehen, 665 Bewertungen;
   zweiter Import unverändert. Lokale Markierungen und Stimmungen überleben Import.
2. Poster in api/watchlist-poster.js mit Hilfsfunktionen in
   api/_watchlist-tmdb.cjs: feste TMDB-API, Token nur in Umgebungsvariable,
   Titel+Jahr-Abgleich, eindeutiger Treffer oder neutraler Fehlerzustand;
   Tests: mehrdeutig, falsches Jahr, fehlender Token, ungültige Eingabe, API-Fehler.
3. Oberfläche in watchlist/index.html, styles.css, app.mjs: vier Stimmungskarten,
   großes Cover, Zufallsauswahl, Neuziehen, Auswahl festhalten, gesehen/rückgängig,
   Bibliothek mit Suche/Stimmungspflege, CSV-Import und Backup. Leere Zustände,
   Speicherfehler, Tastatur und schmale Bildschirme berücksichtigen.
4. Lokaler Server scripts/watchlist-dev.mjs lädt Token nur aus Umgebung oder
   expliziter Quelldatei, liefert ausschließlich freigegebene öffentliche Dateien.
   Browserprüfung: Import, alle vier Stimmungen, Neuziehen, Markierung, Reload,
   Backup, 390 px und echte Poster. Bestehende Quiz-/Freikarten-Dateien unverändert.
5. Frisches Code-Review, notwendige Korrekturen und gesamte Testsuite. Übergabe
   mit Dateipfad, Branch, Prüfergebnissen und Vorschau sichern. Kein Push/Deployment.

Review-Schwerpunkte: CSV mit Kommas/Zeilenumbrüchen, fehlende Filmjahre,
beschädigte Backups, gesperrter/voller Speicher, verspätete Posterantworten.

Ruling: Getrennter frischer Clone statt Worktree des alten lokalen Checkout,
da dort Freikarten fehlen. Keine bestehenden Arbeitsdateien geändert.
Ruling: Bestehende CLAUDE.md nennt alte Freikarten-Instanz; neuester Commit und
freikarten/index.html haben den neueren Stand. Kein Backend-Deploy erforderlich.
