# Kinoalarm in Betrieb nehmen

Noch nicht aktiv: Ein eigener Redis-REST-Speicher ist erforderlich. Bestehende Convex-Instanzen nicht verändern. API und Worker sind vorbereitet; echte Zustellung muss nach Einrichtung auf einem Handy geprüft werden.

Servervariablen in Vercel (niemals ins Git):

- WATCHLIST_REDIS_URL / WATCHLIST_REDIS_TOKEN: Redis REST, z.B. eigener Upstash-Speicher
- WATCHLIST_VAPID_PUBLIC / WATCHLIST_VAPID_PRIVATE: `web-push.generateVAPIDKeys()`
- WATCHLIST_VAPID_SUBJECT: Betreiber-Kontakt-URL oder mailto
- WATCHLIST_CRON_SECRET: langer zufälliger Bearer-Schlüssel für den Worker
- CRON_SECRET: für Vercel Cron auf denselben Wert setzen

Nach erfolgreicher Einrichtung vercel.json um folgenden täglichen Cron ergänzen:

```json
{"crons":[{"path":"/api/watchlist-cron","schedule":"0 7 * * *"}]}
```

Daily Vercel Hobby läuft innerhalb der vorgesehenen Stunde, nicht minutengenau. Beim Treffer wird nach Erkennung gesendet. Es handelt sich nicht um Echtzeit-Überwachung.

Vor Aktivierung: isolierten Redis verwenden, An-/Abmelden und Browser-Neustart testen, echten Push bei geschlossener Home-Screen-App auf iPhone prüfen, denselben Cron zweimal ausführen (zweiter Durchlauf ohne erneute Meldung), fehlgeschlagene Zustellung und abgelaufene Abonnements prüfen. Erst danach verfügbar behaupten.

Aktuelle Grenze:100Geräte,300beobachtete Filme pro Gerät,60Registrierungsänderungen pro Stunde global. Kleine persönliche Nutzung; vor Wachstum paginierten Worker und differenzierte Limits bauen. Filmzuordnung über eindeutige normalisierte Original-/deutsche TMDB-Titel; Kinoquellen ohne Releasejahr können gleichnamige Neuverfilmungen nicht sicher unterscheiden. Treffer vor Ticketkauf prüfen.

Standorte: manuell Stadt/PLZ via Open-Meteo/GeoNames,100kmLuftlinie. Spielpläne bisher nur Metropolis/Capitol/CasablancaBochum. Keine Behauptung vollständiger Kinosuche oder Abdeckung. Quellenkonfiguration api/_watchlist-cinemas.json. Zweiwöchiger Stabilitätstest noch offen; keine automatische externe Überwachung dafür eingerichtet.
