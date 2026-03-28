# FilmDuel — Online-Multiplayer & Neue Kategorien

**Datum:** 2026-03-28
**Status:** Approved

---

## Überblick

FilmDuel erhält einen asynchronen Online-Multiplayer-Modus nach dem QuizDuell-Prinzip sowie 10 neue Filmkategorien. Der bestehende lokale Pass-the-Phone-Modus bleibt vollständig erhalten. Die App bleibt eine statische PWA ohne Build-Schritt, wird aber in mehrere Module aufgeteilt.

---

## Architektur

### Ansatz: Statische Module (kein Build-Schritt)

`index.html` bleibt der Einstiegspunkt. Die Logik wird auf separate `.js`-Dateien aufgeteilt, die über `<script type="module">` geladen werden. Convex SDK und Convex Auth werden direkt via ESM-Import eingebunden.

### Dateistruktur

```
filmduel/
├── index.html          — Screens HTML + script-module Einstieg
├── app.js              — Lokaler Modus, Game-State, Navigation
├── categories.js       — Alle 18 Kategorien + Fragen (export)
├── online.js           — Online-Modus Logik (Herausforderungen, Dashboard)
├── auth.js             — Google OAuth via Convex Auth
└── convex/
    ├── schema.ts       — Erweitert um users + games Tabellen
    ├── scores.ts       — Bestehend (unverändert)
    ├── users.ts        — Neu: Profil, Stats
    ├── games.ts        — Neu: Spiel-State, Mutations, Queries
    └── http.ts         — Bestehend (unverändert)
```

---

## Datenmodell

### Tabelle: `users`

| Feld | Typ | Beschreibung |
|---|---|---|
| `googleId` | string | Google OAuth Subject |
| `displayName` | string | Anzeigename (aus Google-Profil) |
| `wins` | number | Gesamtsiege |
| `games` | number | Gespielte Partien |
| `totalScore` | number | Punktesumme gesamt |
| `createdAt` | number | Timestamp der Registrierung |

### Tabelle: `games`

| Feld | Typ | Beschreibung |
|---|---|---|
| `challengerId` | string | Convex User-ID des Herausforderers |
| `opponentId` | string | Convex User-ID des Gegners (`"random"` bis Gegner gefunden) |
| `category` | string | Gewählte Kategorie |
| `rounds` | number | 5, 10 oder 15 |
| `seed` | number | Zufallsseed zur Reproduktion der Fragereihenfolge |
| `questionIndices` | number[] | Aus `seed` generierte Fragen-Indices (bei Spielerstellung gespeichert) |
| `status` | string | `pending` → `challenger_done` → `finished` |
| `challengerAnswers` | number[] | Antworten des Herausforderers (0=falsch, 1=richtig) |
| `opponentAnswers` | number[] | Antworten des Gegners |
| `challengerScore` | number | Punktzahl Herausforderer |
| `opponentScore` | number | Punktzahl Gegner |
| `winnerId` | string &#124; null | Convex User-ID des Gewinners, `null` bei Unentschieden |
| `createdAt` | number | Timestamp |

---

## Online-Spielfluss

```
1. Start-Screen
   ├── "Lokal spielen"  → bestehender Modus (kein Login nötig)
   └── "Online spielen" → Google Login

2. Google Login (einmalig, Token gespeichert)

3. Dashboard
   ├── Offene Spiele: "Du bist dran" / "Warte auf [Gegner]"
   └── "Herausfordern" Button

4. Neues Spiel Setup (Herausforderer)
   ├── Gegner: Benutzername suchen (exact match, case-insensitive, Query: searchByName in users.ts)
   │          ODER Zufallsgegner (ältestes offenes Spiel mit opponentId="random" wird gefunden;
   │          falls keines existiert: neues Spiel mit opponentId="random" erstellt, Gegner tritt bei)
   ├── Kategorie wählen (alle 18 verfügbar)
   └── Rundenanzahl: 5 / 10 / 15
       (Lokaler Modus behält seine Optionen: 3 / 5 / 7)

5. Herausforderer spielt seine Runde sofort
   → Antworten werden nach jeder Frage sofort in Convex gespeichert (kein gebündeltes Submit)
   → Kein Timer (wie im lokalen Modus)
   → Kein Übergabe-Screen (da Online, ein Gerät pro Spieler)

6. Warte-Screen: Convex Subscription auf games-Tabelle — Dashboard des Gegners
   aktualisiert sich automatisch wenn er die App öffnet.
   Hinweis: Keine Push-Benachrichtigung — Gegner sieht das Spiel nur bei geöffneter App.

7. Gegner öffnet Dashboard → sieht "Du bist dran" → spielt dieselben Fragen
   (Fragen werden aus gespeicherten questionIndices rekonstruiert — identische Reihenfolge)

8. Ergebnis-Screen für beide: Punkte, Vergleich, Gewinner (oder Unentschieden bei Gleichstand)
   → Stats in users-Tabelle aktualisiert (wins, games, totalScore)
   → Zwei Einträge in scores-Tabelle (je einer pro Spieler, mit displayName als player_name)
```

---

## Neue Kategorien (10 zusätzlich)

Bestehende 8 Kategorien bleiben unverändert. Neue:

| ID | Name | Thema |
|---|---|---|
| `series` | Serien | Breaking Bad, Sopranos, Squid Game |
| `animation` | Animationsfilme | Studio Ghibli, Pixar, Disney |
| `superhero` | Superhelden | MCU, DC, X-Men |
| `oscars` | Oscar-Gewinner | Best Picture, Klassiker |
| `german` | Deutsches Kino | Fassbinder, Lola rennt, Dark |
| `comedy` | Komödien | Kultkomödien, Slapstick |
| `musical` | Musicals | Grease, La La Land, Hamilton |
| `scifi` | Sci-Fi | Blade Runner, Matrix, 2001 |
| `nineties` | 90er Hits | Pulp Fiction, Fight Club, Titanic |
| `worldcinema` | Weltfilme | Parasite, Roma, Amelie |

Jede Kategorie erhält 15 Fragen (wie die bestehenden). Fragen im selben Format: 1 richtige + 3 falsche Antworten.

---

## Screens (neu / geändert)

### Geändert
- **s-start:** Zwei Buttons — "Lokal spielen" + "Online spielen"

### Neu
- **s-login:** Google-Login Button, Ladeindikator
- **s-dashboard:** Liste offener Spiele ("Du bist dran" / "Warte auf X") + "Herausfordern"-Button
- **s-challenge-setup:** Gegner suchen (exact match, case-insensitiv), Kategorie wählen, Runden wählen (5/10/15)
- **s-online-q:** Frage-Screen für Online-Modus — kein Timer, kein Übergabe-Screen, Antwort wird nach jeder Frage sofort in Convex gespeichert; Abbruch lässt bisherigen Stand erhalten
- **s-online-wait:** Warte-Screen nach eigenem Zug, Subscription aktualisiert automatisch
- **s-online-result:** Ergebnis mit Vergleich beider Spieler, Unentschieden möglich

---

## Technische Entscheidungen

- **Convex Auth:** Google OAuth, keine eigene Auth-Implementierung nötig
- **Convex Subscriptions:** Dashboard und Warte-Screen subscriben auf `games`-Tabelle — automatisches Update ohne Polling
- **Fragen-Synchronisation:** Beide Spieler bekommen identische Fragen — Reihenfolge wird beim Erstellen des Spiels mit einem Seed festgelegt und in der `games`-Tabelle gespeichert
- **Kein Build-Schritt:** Convex SDK via `import { ConvexClient } from "https://cdn.jsdelivr.net/npm/convex/browser"` oder ESM-CDN

---

## Out of Scope

- Push-Benachrichtigungen (PWA Service Worker) — optionales Follow-up
- Freundesliste / persistente Kontakte
- Chat zwischen Spielern
- In-App-Käufe / Premium-Kategorien
