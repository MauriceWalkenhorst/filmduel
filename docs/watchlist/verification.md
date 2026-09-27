# Prüfstand 27.09.26

Lokaler Build durch Codex, Branch `codex/watchlist-moods`, Basis `c6c7388`.

- `LETTERBOXD_EXPORT='../../raw/letterboxd/2026-09-27' npm test`: 13/13 bestanden.
- Originalexport gelesen: 167 Watchlist, 684 gesehen, 665 Bewertungen. Zweiter
  Import ohne Dubletten. Persönliche Daten nicht in den Quelltext kopiert.
- Browser: Import beider CSVs, alle vier Stimmungen, Gesehen-Markierung und
  Rücknahme, Auswahl und Status nach Neuladen geprüft.
- Wiederholungsimport nach Ziehung: Restmenge 8 → 7, bereits gezogener Film
  blieb ausgeschlossen. Ganze warme Runde: 9 Ziehungen, 9 verschiedene Filme,
  Neuziehen danach deaktiviert, ausdrücklicher Neustart funktioniert.
- JSON-Sicherung tatsächlich unter Downloads erzeugt, mit 851 Filmeinträgen
  und 167 Watchlist-Filmen validiert. Wiederherstellung im Browser bestätigt.
  Das Browser-Automationstool meldete beim Download ein Timeout; die tatsächliche
  Datei wurde anschließend unabhängig gelesen und validiert.
- Mobile Browseransicht 390 × 844: Start, Ergebnis und Verwaltung jeweils
  scrollWidth 390. Startseite visuell geprüft, keine horizontale Überbreite.
- Ergebnis mit echtem Brimstone-Cover visuell geprüft. Echte TMDB-Stichprobe:
  Burning, Hunt, Whiplash, Call Me by Your Name, GoodFellas, Minari, Decision to
  Leave, Aftersun, Kill, Almost Famous jeweils erfolgreich mit geprüfter Film-ID
  und Posteradresse. Festivaljahr-Abweichungen Minari/Kill explizit zugeordnet.
- Unabhängiges Code-Review: drei P2-Befunde (beschädigte CSV-Quotes/Headers,
  überschriebene Änderungen während Datei-Lesen, Rundenreset beim Import).
  Alle behoben. Die ersten beiden mit fehlgeschlagenem Regressionstest und
  anschließend grünem Testlauf, letzterer im vollständigen Browserablauf geprüft.
- Bestehende Quiz-, Freikarten-, Convex- und Routing-Dateien unverändert.
- Kein Push, kein Deployment, keine Produktions-Backend-Änderung.

## Grenzen

Die Zuordnungen sind redaktionelle Vorschläge. Im Originalexport sind 113 von
167 Watchlist-Filmen zugeordnet, 54 bleiben offen; die Verwaltung erlaubt
Korrekturen und Ergänzungen. Stand: 27.09.26. Quelle: tatsächlicher Import.
Unbekannte/mehrdeutige Cover zeigen einen neutralen Ersatz. Keine Behauptung
über Streaming-Verfügbarkeit. Speicherung ist browserlokal, ohne Gerätesync.
Vercel-Auslieferung wurde nicht live geprüft, weil keine Veröffentlichung
freigegeben ist. Die lokale Vorschau verwendet denselben Poster-Handler.

## Entscheidungen

Frischer Clone statt altem Checkout: aktueller Freikarten-Stand, vorhandene
Arbeitsdateien geschützt. Kosten: separater Arbeitsordner bleibt erhalten.
Browser-Speicherung statt neuem Backend: einfache eigenständige App; Gerätewechsel
benötigt Sicherung. Vier Stimmungsnamen und Arbeitstitel Abspann sind Vorschläge.
