# Ausbau Version 2, 28.09.26

Auftrag: Brain-Ausbauplan, 100 km um angegebenen Standort, Push bei Treffern.
Bestehender separater Checkout bleibt Arbeitsort. Keine Convex-Änderung.

- Basis: 12 Tests grün, Originalexport-Test ohne Umgebungsvariable übersprungen.
- Zusammenführen und Streamingfilter: zwei Tests zunächst rot, danach grün.
- Zusammenführen an Wiederherstellung angeschlossen, Manifest angelegt.
- Offen: Streaming-Endpunkt/UI, Kino-Datentest/Standort, Push-Speicher und Versand, Browserprüfung, Review und Veröffentlichung.
- Entscheidung: Ereignis-Push ersetzt vorgeschlagene Wochenübersicht. Zweiwöchiger Kino-Datentest lässt sich heute nicht als abgeschlossen behaupten; aktuelle Quellen prüfen, Abdeckung explizit anzeigen.

Kino-Datentest 28.09.26: Metropolis JSON-LD enthält Die Taschendiebin am 29.09.26 19:45 +02. Drei Bochumer Quellen angebunden. Standortkoordinaten aus einmaliger OSM/Overpass-Abfrage (212 Kinoobjekte im Dortmunder 100-km-Kreis), nur überprüfte drei Quellen in App. Keine Behauptung vollständiger Umkreisabdeckung. GeoNames über Open-Meteo für manuelle Ortssuche. Quellen: https://metropolis.bochumerkinos.de/programm, https://open-meteo.com/en/docs/geocoding-api, OSM © contributors.
Streaming-Anbieter live verifiziert: RTL+ ist 2750, nicht 298. 4 neue Tests für Streaming und Kino zusätzlich grün.
Push: Hosting enthält nur TMDB_READ_TOKEN; separater dauerhafter Speicher fehlt. Nutzerfrage offen, unabhängige Arbeiten gehen weiter.

Browserprüfung lokal Port4174: Sicherung mit211 Filmen importiert; Romancing the Stone zeigt Disney Plus, Leihe/Kauf und Quellenhinweis. Ortssuche Dortmund auswählbar; The Handmaiden2016 vorgemerkt; 3/3 Kinoquellen liefern173 Termine und passenden Treffer Die Taschendiebin29.09.2619:45,17.3km. Handy390px hat keinen horizontalen Überlauf.
Review: Streaming-Refresh nach Import/Restore/Seen ergänzt. Versand-Lease statt dauerhafter Vorabmarkierung, Abschluss nach erfolgreichem Versand; Registrierung auf100 Geräte/60 Änderungen pro Stunde begrenzt, Endpoint-Deduplizierung. Testausbau23+ Tests. Push live mangels Redis/VAPID/Cron noch nicht möglich.
