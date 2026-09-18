# FilmDuel — Hinweise für die Arbeit an diesem Projekt

## ⛔ NICHT auf die Produktion deployen

**`npx convex deploy` (Produktion) würde die laufende App beschädigen.**

Dieses Repo ist **älter als die laufende Produktionsinstanz**. Zwei Funktionen
existieren nur in der Produktion und fehlen hier im Quelltext:

- `users.getLeaderboard`
- `users.updateStats`

Ein Deploy aus diesem Repo ersetzt den Funktionssatz der Zielinstanz
vollständig. Beide Funktionen wären danach weg, und damit der Online-Modus
samt Rangliste für echte Nutzer. Die Tabellendaten (users, games, scores,
pushSubscriptions) bleiben bei einem Deploy erhalten, kaputt gehen die
Funktionen.

Geprüft am 18.09.2026 mit `npx convex function-spec --prod`.

**Vor dem nächsten Produktions-Deploy** müssen die beiden Funktionen erst in
`convex/users.ts` nachgetragen werden. Der Quelltext liegt nicht vor; er
müsste aus der Produktion rekonstruiert oder von der Person besorgt werden,
die ihn ursprünglich deployt hat.

## Zwei Convex-Instanzen

| Instanz | Rolle | Wer spricht damit |
| --- | --- | --- |
| `formal-bee-819` | **Produktion** | Die Live-App: `auth.js` und die Rangliste in `index.html` |
| `shiny-setter-795` | **Entwicklung** (`.env.local`) | Ziel von `npx convex dev`; dort liegen die Freikarten-Zähler |

Achtung: `npx convex dev --once` deployt auf die **Entwicklungs**instanz. Auch
dort gilt, dass der Funktionssatz vollständig ersetzt wird. Wer aus einem
veralteten Arbeitsverzeichnis deployt, löscht dort Funktionen und Indizes.

Die Freikarten-Zähler liegen bewusst noch auf der Entwicklungsinstanz. Ein
Umzug auf eine Produktionsinstanz wurde besprochen und vorerst zurückgestellt,
weil er ohne die beiden fehlenden Funktionen nicht gefahrlos möglich ist. Ein
eigenes Convex-Projekt nur für die Freikarten wäre der sichere Weg.

### Zur `/leaderboard`-Route

`convex/http.ts` zeigt inzwischen auf `api.scores.getLeaderboard`, damit das
Repo in sich stimmig ist. Die Produktion nutzt an dieser Stelle jedoch
`api.users.getLeaderboard`, also eine andere Datenquelle. Wird das Repo
irgendwann mit der Produktion abgeglichen, muss diese Referenz zurück auf
`users` zeigen.

## Freikarten-Seiten

Zwei statische Seiten, beide sprechen über HTTP mit der Entwicklungsinstanz:

- `freikarten-x7q2/` — eine feste Seite mit einem hart hinterlegten Code
- `freikarten/` — Selbstbedienung: jede Person legt sich über den URL-Anker
  eine eigene Seite an

Der Freikarten-Code wird **nie gespeichert**. Er steht ausschließlich im
Anker (`#`) des jeweiligen Links, und Browser senden diesen Teil der Adresse
nicht an den Server. In der Tabelle `freikarten` liegen nur Kennung, Monat und
Anzahl der eingelösten Karten.

In `convex/freikarten.ts` suchen `get`/`set` (ohne Kennung) die Zeile **ohne**
`slug`. Das ist Absicht und darf nicht auf `.first()` zurückgebaut werden,
sonst trifft es ab der ersten selbst angelegten Seite die falsche Zeile.

## Fragenkatalog

`categories.js` enthält `CATS` (19 Kategorien) und `Q` (702 Fragen, je Kategorie
mindestens 36). Format pro Frage: `{ q, a: [4 Antworten], c: Index der
richtigen, d: 1–3, f: Fun-Fact }`. Neue Kategorien zusätzlich in `CAT_FILTER`
in `app.js` eintragen, sonst fehlen sie im jeweiligen Tab.
