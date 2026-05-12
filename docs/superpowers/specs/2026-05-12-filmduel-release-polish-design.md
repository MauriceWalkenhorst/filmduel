# FilmDuel Release Polish — Design Spec
**Datum:** 2026-05-12
**Ziel:** App besonders und hype-würdig machen durch poliertes Erlebnis (A) + Film-Identitätssystem (C). Verbreitung primär über Mundpropaganda.

---

## 1. Überblick & Architektur

**Was bleibt unverändert:** Spiellogik, Convex-Backend, Kategorien-Datenbank, alle drei Spielmodi (Solo, Lokal, Online).

**Was sich ändert:**

| Bereich | Änderung |
|---|---|
| Landing Screen | Cinematic Intro mit Film-Grain, dramatischer Titel-Einfahrt |
| Frage-Screen | Mikro-Animationen für richtig/falsch/Streak |
| Ergebnis-Screen | Score-Countdown, Film-IQ, Persönlichkeits-Reveal, Mastery-Bar |
| Neues Modul `identity.js` | Film-Persönlichkeit, Mastery, Badges |
| localStorage | Drei neue Keys für Identitätsdaten |

Kein neues Convex-Schema in Phase 1 — alles client-seitig.

---

## 2. Cinematic Core Experience

### Landing Screen (`s-start`)
- Vollbild schwarzer Hintergrund mit CSS Film-Grain-Overlay (`noise`-Animation via SVG-Filter oder repeating radial-gradient)
- Titel "FilmDuel" fährt von unten ein (translate + fade, 600ms) beim ersten Laden
- Claim-Text: "Wer kennt Film wirklich?" erscheint 300ms danach
- Modi-Buttons (Solo / Lokal / Online) mit mehr vertikalem Abstand und leichtem Hover-Glow

### Frage-Screen (`s-q`) — Mikro-Animationen

**Richtige Antwort:**
- Button pulsiert grün (scale 1 → 1.04 → 1, 300ms)
- Goldener Partikel-Burst: 8 kleine `div`s explodieren radial weg (CSS `@keyframes burst`, kein Canvas)
- Streak-Counter springt mit `pop`-Keyframe (bereits vorhanden)

**Falsche Antwort:**
- `shake`-Keyframe auf dem Antwort-Container (bereits vorhanden, nur aktivieren)
- Falscher Button rot, korrekter Button leuchtet grün auf (500ms delay)

**Timer unter 5 Sek:**
- `glow`-Keyframe auf Timer-Bar aktivieren (Keyframe bereits definiert, nur Klasse toggeln)

**Kategorie-Badge:**
- Oben links: Kategorie-Kürzel (z.B. "HOR") in Kategorie-Farbe als Pill — gibt jeder Runde visuellen Charakter

### Ergebnis-Screen (`s-result`) — Dramatisches Reveal
Sequenz nach Spielende:
1. Schwarzes Fade-in (200ms)
2. Score zählt von 0 auf Endwert hoch (500ms, `requestAnimationFrame`)
3. Film-IQ erscheint: `Math.min(100, Math.round(correctPct * difficultyAvg * speedBonus * 100))` — Skala 0–100
   - `correctPct` = richtige Antworten / Gesamtfragen (0–1)
   - `difficultyAvg` = Schnitt der Schwierigkeitswerte der Fragen (1–3), normalisiert: `difficultyAvg / 3`
   - `speedBonus` = 1.0 + (Anzahl Antworten <8 Sek / Gesamtfragen) * 0.2 (max 1.2)
4. Film-Persönlichkeit-Reveal: "Deine Film-Persönlichkeit:" → Archetyp-Name mit Kategorie-Farbe (erster Anblick = Wow-Moment)
5. Mastery-Bar für gespielte Kategorie: "Horror: Stufe 2 von 5 — Kenner" mit animiertem Fortschrittsbalken

---

## 3. Film-Identitätssystem

### Persönlichkeits-Archetypen (8 Typen)
Berechnet aus den letzten 10 gespielten Kategorien, gewichtet nach Trefferquote (correct/played pro Kategorie):

| Archetyp | Trigger-Kategorien (dominant) |
|---|---|
| Der Cineast | Breit verteilt, keine Dominanz (Fallback) |
| Arthouse-Aficionado | ART, WLD, NOIR, REG |
| Blockbuster-König | HERO, SCI, COM, 90S |
| Serienjunkie | SER dominant (>40% der Spiele) |
| Horror-Kenner | HOR dominant |
| Filmgeschichte-Nerd | REG, CAM, OSC, DE |
| Guilty-Pleasure-Fan | COM, MUS, ANI, KULT |
| Weltkinofan | WLD, ART, WCIN |

Algorithmus: Für jede Kategorie `score = correct/played`. Archetyp-Gruppen summieren ihre Scores. Höchste Gruppe gewinnt — Mindest-Schwellwert: 3 gespielte Kategorien der Gruppe. Bei Gleichstand oder wenn kein Schwellwert erreicht → Fallback "Der Cineast".

### Kategorie-Mastery (5 Stufen)
Gespeichert pro Kategorie in `filmduel_mastery`:

| Stufe | Richtige Antworten | Titel |
|---|---|---|
| 0 | 0–2 | Zuschauer |
| 1 | 3–5 | Anfänger |
| 2 | 6–9 | Kenner |
| 3 | 10–14 | Kritiker |
| 4 | 15–24 | Meister |
| 5 | 25+ | Legende |

Stufe steigt nie — nur aufwärts. Wird nach jeder Partie aktualisiert.

### Badges (5 Starter-Achievements)

| Badge | Trigger |
|---|---|
| Erster Duel | Erste Partie abgeschlossen |
| Streak Master | 5er-Streak in einer Partie |
| Kategorien-Kenner | Alle 18 Kategorien mindestens einmal gespielt |
| Speed-Demon | 5 Fragen unter 5 Sek korrekt in einer Partie |
| Perfectionist | Partie mit 100% Trefferquote |

Badges werden einmalig vergeben, in `filmduel_stats.badges[]` gespeichert. Neues Badge → Toast-Notification + kurze Einblend-Animation auf dem Ergebnis-Screen.

### Datenhaltung (localStorage)

```
filmduel_mastery  → { ART: { correct: 12, played: 15 }, HOR: { correct: 3, played: 4 }, ... }
filmduel_stats    → { gamesPlayed: 7, totalCorrect: 42, bestStreak: 5, badges: ["erster_duel", "streak_master"] }
filmduel_identity → { type: "Arthouse-Aficionado", since: 1747000000000 }
```

### Neues Modul: `identity.js`
Exportiert:
- `updateAfterGame(catId, correct, played, streakMax, speedCount, perfectGame)` — nach jeder Partie aufrufen
- `getPersonality()` — berechnet und cached Archetyp
- `getMastery(catId)` — gibt Stufe + Titel zurück
- `getNewBadges()` — gibt neu verdiente Badges zurück (und markiert sie als gesehen)

Wird in `app.js` am **Anfang von `showRes()`** aufgerufen (vor dem Rendern), damit Mastery und neue Badges bereits beim Aufbau des Screens verfügbar sind.

---

## 4. Fehlerbehandlung & Edge Cases

- Noch keine gespeicherten Daten: Persönlichkeit zeigt "Der Cineast" (Fallback)
- localStorage nicht verfügbar (Private Mode): Identitätsfunktionen werden still übersprungen, kein Crash
- Mastery-Berechnung bei 0 gespielten Partien einer Kategorie: Division durch 0 abfangen → Score 0

---

## 5. Was explizit NICHT in diesem Scope ist

- Online-Profil-Sync der Identitätsdaten (Phase 2)
- Shareable Result-Card / Challenge-Link (Ansatz B, separates Spec)
- Wochenranking / Saison-System
- Sound-Design
- Neue Fragen oder Kategorien
