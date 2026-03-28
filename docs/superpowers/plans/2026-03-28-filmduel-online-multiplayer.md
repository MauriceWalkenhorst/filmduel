# FilmDuel Online-Multiplayer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Asynchronen Online-Multiplayer-Modus (QuizDuell-Stil) + 10 neue Kategorien zur bestehenden FilmDuel PWA hinzufügen, ohne Build-Schritt.

**Architecture:** Die 1154-Zeilen `index.html` wird in Module aufgeteilt (`app.js`, `categories.js`, `online.js`, `auth.js`). Das Convex-Backend bekommt zwei neue Tabellen (`users`, `games`). Google OAuth via Convex Auth (`@convex-dev/auth`). Alle Module via `<script type="module">` geladen. ConvexClient SDK via ESM-CDN für Echtzeit-Subscriptions.

**Tech Stack:** Vanilla JS (ES Modules), Tailwind CDN, Convex SDK (`convex/browser`), `@convex-dev/auth` (Google OAuth)

**Projektpfad:** `/Users/maurice/Antigravity_Projekts/Film Duell/filmduel`
**Convex Deployment:** `shiny-setter-795.eu-west-1.convex.cloud`
**Deploy Key:** `dev:shiny-setter-795|eyJ2MiI6IjdjMTRmZGNjNzY1ODQ0ZDc4MDkyMzQ4NWQyOTMzNjZmIn0=`

> **Stand 2026-03-28:** Tasks 2–3 (categories.js, app.js) und Tasks 5–7 (Convex Schema, users.ts, games.ts) wurden von Gemini bereits umgesetzt. Weiterarbeiten ab Task 4 (Kategorien prüfen) → Task 8 (auth.js fix) → Task 9+ (Screens + online.js).

---

## Dateistruktur nach Abschluss

```
filmduel/
├── index.html           — Screens HTML, lädt app.js als module
├── app.js               — Lokaler Modus, Game-State G, Navigation, Utils
├── categories.js        — Alle 18 Kategorien + Fragen (export CATS, QUESTIONS)
├── online.js            — Online-Modus: Dashboard, Challenge, Spielablauf
├── auth.js              — Google Auth via Convex Auth (login, logout, getUser)
├── convex/
│   ├── schema.ts        — users + games Tabellen hinzugefügt
│   ├── scores.ts        — unverändert
│   ├── users.ts         — NEU: upsertUser, getByGoogleId, searchByName
│   ├── games.ts         — NEU: createGame, submitAnswers, getMyGames, getGame
│   └── http.ts          — unverändert
└── tests/
    ├── categories.test.js  — Datenstruktur-Tests
    └── scoring.test.js     — Score-Berechnungs-Tests
```

---

## Task 1: Vitest Setup

**Files:**
- Create: `package.json`
- Create: `vitest.config.js`
- Create: `tests/categories.test.js`

- [ ] **Schritt 1: package.json anlegen**

```json
{
  "name": "filmduel",
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Schritt 2: vitest.config.js anlegen**

```js
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { environment: 'node' }
});
```

- [ ] **Schritt 3: Dependencies installieren**

```bash
npm install
```

- [ ] **Schritt 4: Smoke-Test anlegen und ausführen**

`tests/smoke.test.js`:
```js
import { describe, it, expect } from 'vitest';
describe('setup', () => {
  it('works', () => expect(1 + 1).toBe(2));
});
```

```bash
npm test
```
Erwartet: `1 passed`

- [ ] **Schritt 5: Commit**

```bash
git add package.json vitest.config.js tests/smoke.test.js
git commit -m "chore: add vitest for unit tests"
```

---

## Task 2: categories.js extrahieren

Die Kategorie-Definitionen und alle Fragen aus `index.html` (ab Zeile 511) in eine eigene Datei auslagern.

**Files:**
- Create: `categories.js`
- Create: `tests/categories.test.js`

- [ ] **Schritt 1: Failing Test schreiben**

`tests/categories.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { CATS, QUESTIONS } from '../categories.js';

describe('CATS', () => {
  it('hat mindestens 8 Einträge', () => {
    expect(CATS.length).toBeGreaterThanOrEqual(8);
  });
  it('jeder Eintrag hat id, label, abbr, color', () => {
    for (const c of CATS) {
      expect(c).toHaveProperty('id');
      expect(c).toHaveProperty('label');
      expect(c).toHaveProperty('abbr');
      expect(c).toHaveProperty('color');
    }
  });
});

describe('QUESTIONS', () => {
  it('hat für jede Kategorie mindestens 15 Fragen', () => {
    for (const c of CATS) {
      expect(QUESTIONS[c.id]).toBeDefined();
      expect(QUESTIONS[c.id].length).toBeGreaterThanOrEqual(15);
    }
  });
  it('jede Frage hat q, a, wrong (3 Einträge)', () => {
    for (const c of CATS) {
      for (const q of QUESTIONS[c.id]) {
        expect(q).toHaveProperty('q');
        expect(q).toHaveProperty('a');
        expect(q).toHaveProperty('wrong');
        expect(q.wrong.length).toBe(3);
      }
    }
  });
});
```

```bash
npm test
```
Erwartet: FAIL — `categories.js not found`

- [ ] **Schritt 2: categories.js anlegen**

Kopiere `const CATS = [...]` und `const QUESTIONS = {...}` aus `index.html` (Zeilen 511–675) in `categories.js` und exportiere sie:

```js
// categories.js
export const CATS = [
  { id:'arthouse',  label:'Arthouse',   abbr:'ART',  color:'#c084fc' },
  { id:'directors', label:'Regisseure',  abbr:'REG',  color:'#60a5fa' },
  { id:'world',     label:'Weltfilme',   abbr:'WLT',  color:'#34d399' },
  { id:'noir',      label:'Film Noir',   abbr:'NOI',  color:'#94a3b8' },
  { id:'cult',      label:'Kultfilme',   abbr:'KLT',  color:'#f472b6' },
  { id:'tech',      label:'Filmtechnik', abbr:'TCH',  color:'#fb923c' },
  { id:'horror',    label:'Horror',      abbr:'HOR',  color:'#f87171' },
  { id:'indie',     label:'Indie',       abbr:'IND',  color:'#a3e635' },
];

export const QUESTIONS = {
  arthouse: [ /* alle 15 Fragen aus index.html kopieren */ ],
  // ... alle weiteren Kategorien
};
```

- [ ] **Schritt 3: Tests ausführen**

```bash
npm test
```
Erwartet: PASS (alle Kategorien mit ≥15 Fragen, richtige Struktur)

- [ ] **Schritt 4: In index.html löschen und importieren**

In `index.html` das `<script>`-Tag auf `type="module"` ändern und die CATS/QUESTIONS-Definitionen entfernen. Stattdessen am Anfang des Scripts:
```js
import { CATS, QUESTIONS } from './categories.js';
```

**Achtung:** Das setzt voraus, dass das gesamte `<script>` in `type="module"` umgewandelt wird (das passiert in Task 3).

- [ ] **Schritt 5: Commit**

```bash
git add categories.js tests/categories.test.js index.html
git commit -m "refactor: extract categories.js from index.html"
```

---

## Task 3: app.js extrahieren + index.html auf ES-Module umstellen

Das gesamte JavaScript aus `index.html` in `app.js` verschieben.

**Files:**
- Create: `app.js`
- Modify: `index.html`

- [ ] **Schritt 1: Failing Test für Scoring-Logik**

`tests/scoring.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { calcScore } from '../app.js';

describe('calcScore', () => {
  it('gibt 0 zurück bei leerer History', () => {
    expect(calcScore([])).toBe(0);
  });
  it('zählt korrekte Antworten', () => {
    expect(calcScore([1, 0, 1])).toBe(2);
  });
});
```

```bash
npm test
```
Erwartet: FAIL — `app.js not found`

- [ ] **Schritt 2: app.js anlegen**

Verschiebe den kompletten `<script>`-Inhalt aus `index.html` nach `app.js`. Ergänze die `calcScore`-Funktion und alle Imports:

```js
// app.js
import { CATS, QUESTIONS } from './categories.js';

// ... gesamter bisheriger Code aus index.html ...

// Exportiere testbare Pure Functions
export function calcScore(answers) {
  return answers.filter(a => a === 1).length;
}

// Mache window-globale Funktionen verfügbar (für onclick= in HTML)
// WICHTIG: show() und makeFilmstrip() müssen hier stehen —
//           online.js und andere Module rufen sie via window.* auf
window.show = show;
window.makeFilmstrip = makeFilmstrip;
window.startGame = startGame;
window.showCat = showCat;
window.showQ = showQ;
window.pick = pick;
window.showResult = showResult;
window.submitOnlineScore = submitOnlineScore;
window.showLeaderboard = showLeaderboard;
window.setRounds = setRounds;
```

- [ ] **Schritt 3: index.html Script-Tag aktualisieren**

Ersetze das alte `<script>`-Tag am Ende von `index.html`:
```html
<!-- ALT: -->
<script>
  // ... ganzer Code ...
</script>

<!-- NEU: -->
<script type="module" src="app.js"></script>
```

- [ ] **Schritt 4: App im Browser testen**

Lokalen Server starten (z.B. `npx serve .` oder `python3 -m http.server`) und testen:
- Start-Screen lädt
- Lokales Spiel starten → Fragen erscheinen
- Score wird angezeigt

**Wichtig:** ES-Module funktionieren nur über HTTP, nicht via `file://`. Ein lokaler Server ist nötig.

- [ ] **Schritt 5: Unit Tests ausführen**

```bash
npm test
```
Erwartet: PASS

- [ ] **Schritt 6: Commit**

```bash
git add app.js index.html tests/scoring.test.js
git commit -m "refactor: extract app.js, switch to ES modules"
```

---

## Task 4: 10 neue Kategorien hinzufügen

**Files:**
- Modify: `categories.js`

Jede neue Kategorie bekommt 15 Fragen im Format:
```js
{ q: 'Frage?', a: 'Richtige Antwort', wrong: ['Falsch 1', 'Falsch 2', 'Falsch 3'] }
```

- [ ] **Schritt 1: Test für 18 Kategorien schreiben**

In `tests/categories.test.js` ergänzen:
```js
it('hat genau 18 Kategorien', () => {
  expect(CATS.length).toBe(18);
});

it('enthält alle neuen Kategorien', () => {
  const ids = CATS.map(c => c.id);
  ['series','animation','superhero','oscars','german','comedy','musical','scifi','nineties','worldcinema']
    .forEach(id => expect(ids).toContain(id));
});
```

```bash
npm test
```
Erwartet: FAIL

- [ ] **Schritt 2: Neue Kategorien zu CATS hinzufügen**

In `categories.js`, Array `CATS` erweitern:
```js
{ id:'series',     label:'Serien',         abbr:'SER', color:'#818cf8' },
{ id:'animation',  label:'Animation',      abbr:'ANI', color:'#f9a8d4' },
{ id:'superhero',  label:'Superhelden',    abbr:'SUP', color:'#fbbf24' },
{ id:'oscars',     label:'Oscar-Gewinner', abbr:'OSC', color:'#e8c84a' },
{ id:'german',     label:'Deutsches Kino', abbr:'DEU', color:'#6ee7b7' },
{ id:'comedy',     label:'Komödien',       abbr:'KOM', color:'#fdba74' },
{ id:'musical',    label:'Musicals',       abbr:'MUS', color:'#f472b6' },
{ id:'scifi',      label:'Sci-Fi',         abbr:'SCI', color:'#38bdf8' },
{ id:'nineties',   label:'90er Hits',      abbr:'90S', color:'#a78bfa' },
{ id:'worldcinema',label:'Weltfilme (neu)',abbr:'WCI', color:'#34d399' },
```

- [ ] **Schritt 3: 15 Fragen pro neuer Kategorie in QUESTIONS schreiben**

Beispiel für `series`:
```js
series: [
  { q: 'In welcher Stadt spielt "Breaking Bad"?', a: 'Albuquerque', wrong: ['Las Vegas', 'Phoenix', 'Denver'] },
  { q: 'Wie heißt Walter Whites Alter Ego in Breaking Bad?', a: 'Heisenberg', wrong: ['Scarface', 'El Jefe', 'Blue Sky'] },
  { q: 'In welchem Land spielt "Squid Game"?', a: 'Südkorea', wrong: ['Japan', 'China', 'Nordkorea'] },
  // ... 12 weitere Fragen
],
```

Alle 10 Kategorien vollständig befüllen (je 15 Fragen). Quellen: eigenes Filmwissen, bekannte Fakten.

- [ ] **Schritt 4: Tests ausführen**

```bash
npm test
```
Erwartet: PASS

- [ ] **Schritt 5: Commit**

```bash
git add categories.js tests/categories.test.js
git commit -m "feat: add 10 new film categories (150 questions)"
```

---

## Task 5: Convex Schema erweitern

**Files:**
- Modify: `convex/schema.ts`

- [ ] **Schritt 1: Schema aktualisieren**

`convex/schema.ts`:
```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  scores: defineTable({
    player_name: v.string(),
    opponent_name: v.string(),
    winner: v.string(),
    player_score: v.number(),
    opponent_score: v.number(),
    rounds: v.number(),
    mode: v.string(),
  }).index("by_winner_score", ["winner", "player_score"]),

  users: defineTable({
    googleId: v.string(),
    displayName: v.string(),
    wins: v.number(),
    games: v.number(),
    totalScore: v.number(),
    createdAt: v.number(),
  }).index("by_google_id", ["googleId"])
    .index("by_display_name", ["displayName"]),

  games: defineTable({
    challengerId: v.string(),
    opponentId: v.string(),
    category: v.string(),
    rounds: v.number(),
    seed: v.number(),
    questionIndices: v.array(v.number()),
    status: v.union(
      v.literal("pending"),
      v.literal("challenger_done"),
      v.literal("finished")
    ),
    challengerAnswers: v.array(v.number()),
    opponentAnswers: v.array(v.number()),
    challengerScore: v.number(),
    opponentScore: v.number(),
    winnerId: v.union(v.string(), v.null()),
    createdAt: v.number(),
  }).index("by_challenger", ["challengerId"])
    .index("by_opponent", ["opponentId"])
    .index("by_status", ["status"]),
});
```

- [ ] **Schritt 2: Convex deployen**

```bash
CONVEX_DEPLOY_KEY="dev:shiny-setter-795|eyJ2MiI6IjdjMTRmZGNjNzY1ODQ0ZDc4MDkyMzQ4NWQyOTMzNjZmIn0=" npx convex deploy
```
Erwartet: `Deployed successfully` (kein Fehler)

- [ ] **Schritt 3: Commit**

```bash
git add convex/schema.ts
git commit -m "feat: add users and games tables to Convex schema"
```

---

## Task 6: convex/users.ts erstellen

**Files:**
- Create: `convex/users.ts`

- [ ] **Schritt 1: users.ts anlegen**

```ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Benutzer anlegen oder aktualisieren (upsert beim Login)
export const upsertUser = mutation({
  args: {
    googleId: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, { googleId, displayName }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_google_id", q => q.eq("googleId", googleId))
      .first();

    if (existing) {
      // displayName ggf. aktualisieren
      if (existing.displayName !== displayName) {
        await ctx.db.patch(existing._id, { displayName });
      }
      return existing._id;
    }

    return await ctx.db.insert("users", {
      googleId,
      displayName,
      wins: 0,
      games: 0,
      totalScore: 0,
      createdAt: Date.now(),
    });
  },
});

// Benutzer per Google-ID laden
export const getByGoogleId = query({
  args: { googleId: v.string() },
  handler: async (ctx, { googleId }) => {
    return ctx.db
      .query("users")
      .withIndex("by_google_id", q => q.eq("googleId", googleId))
      .first();
  },
});

// Benutzer per Convex-ID laden
export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => ctx.db.get(userId),
});

// Benutzernamen suchen (exact match, case-insensitive via toLowerCase)
export const searchByName = query({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const all = await ctx.db.query("users").collect();
    const lower = name.toLowerCase();
    return all
      .filter(u => u.displayName.toLowerCase() === lower)
      .slice(0, 5);
  },
});

// Stats nach Spiel aktualisieren
export const updateStats = mutation({
  args: {
    userId: v.id("users"),
    won: v.boolean(),
    score: v.number(),
  },
  handler: async (ctx, { userId, won, score }) => {
    const user = await ctx.db.get(userId);
    if (!user) return;
    await ctx.db.patch(userId, {
      games: user.games + 1,
      wins: user.wins + (won ? 1 : 0),
      totalScore: user.totalScore + score,
    });
  },
});
```

- [ ] **Schritt 2: Convex deployen**

```bash
CONVEX_DEPLOY_KEY="dev:shiny-setter-795|eyJ2MiI6IjdjMTRmZGNjNzY1ODQ0ZDc4MDkyMzQ4NWQyOTMzNjZmIn0=" npx convex deploy
```

- [ ] **Schritt 3: Commit**

```bash
git add convex/users.ts
git commit -m "feat: add users.ts Convex mutations and queries"
```

---

## Task 7: convex/games.ts erstellen

**Files:**
- Create: `convex/games.ts`

- [ ] **Schritt 1: games.ts anlegen**

```ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Neues Spiel erstellen (Herausforderer spielt zuerst)
export const createGame = mutation({
  args: {
    challengerId: v.string(),
    opponentId: v.string(),   // Convex User-ID oder "random"
    category: v.string(),
    rounds: v.number(),
    questionIndices: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const seed = Math.floor(Math.random() * 1_000_000);
    return await ctx.db.insert("games", {
      challengerId: args.challengerId,
      opponentId: args.opponentId,
      category: args.category,
      rounds: args.rounds,
      seed,
      questionIndices: args.questionIndices,
      status: "pending",
      challengerAnswers: [],
      opponentAnswers: [],
      challengerScore: 0,
      opponentScore: 0,
      winnerId: null,
      createdAt: Date.now(),
    });
  },
});

// Zufallsgegner: ältestes offenes random-Spiel beitreten oder neues erstellen
export const joinOrCreateRandom = mutation({
  args: {
    userId: v.string(),
    category: v.string(),
    rounds: v.number(),
    questionIndices: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    // Ältestes offenes "random"-Spiel suchen (nicht vom selben Spieler)
    const openGame = await ctx.db
      .query("games")
      .withIndex("by_status", q => q.eq("status", "pending"))
      .filter(q =>
        q.and(
          q.eq(q.field("opponentId"), "random"),
          q.neq(q.field("challengerId"), args.userId)
        )
      )
      .order("asc")
      .first();

    if (openGame) {
      await ctx.db.patch(openGame._id, { opponentId: args.userId });
      return openGame._id;
    }

    // Kein offenes Spiel → neues erstellen
    const seed = Math.floor(Math.random() * 1_000_000);
    return await ctx.db.insert("games", {
      challengerId: args.userId,
      opponentId: "random",
      category: args.category,
      rounds: args.rounds,
      seed,
      questionIndices: args.questionIndices,
      status: "pending",
      challengerAnswers: [],
      opponentAnswers: [],
      challengerScore: 0,
      opponentScore: 0,
      winnerId: null,
      createdAt: Date.now(),
    });
  },
});

// Antworten einreichen (nach jedem Zug)
export const submitAnswers = mutation({
  args: {
    gameId: v.id("games"),
    userId: v.string(),
    answers: v.array(v.number()),
    score: v.number(),
  },
  handler: async (ctx, { gameId, userId, answers, score }) => {
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Spiel nicht gefunden");

    const isChallenger = game.challengerId === userId;

    if (isChallenger && game.status === "pending") {
      await ctx.db.patch(gameId, {
        challengerAnswers: answers,
        challengerScore: score,
        status: "challenger_done",
      });
    } else if (!isChallenger && game.status === "challenger_done") {
      const cScore = game.challengerScore;
      const oScore = score;
      const winnerId = cScore === oScore ? null :
                       cScore > oScore ? game.challengerId : userId;
      await ctx.db.patch(gameId, {
        opponentAnswers: answers,
        opponentScore: score,
        status: "finished",
        winnerId,
      });

      // Stats für beide Spieler aktualisieren
      await ctx.runMutation(api.users.updateStats, {
        userId: game.challengerId as any,
        won: winnerId === game.challengerId,
        score: cScore,
      });
      await ctx.runMutation(api.users.updateStats, {
        userId: userId as any,
        won: winnerId === userId,
        score: oScore,
      });
    }
  },
});

// Alle Spiele eines Benutzers laden (Dashboard)
export const getMyGames = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const asChallenger = await ctx.db
      .query("games")
      .withIndex("by_challenger", q => q.eq("challengerId", userId))
      .collect();
    const asOpponent = await ctx.db
      .query("games")
      .withIndex("by_opponent", q => q.eq("opponentId", userId))
      .collect();
    return [...asChallenger, ...asOpponent]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20);
  },
});

// Einzelnes Spiel laden
export const getGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => ctx.db.get(gameId),
});
```

- [ ] **Schritt 2: Convex deployen**

```bash
CONVEX_DEPLOY_KEY="dev:shiny-setter-795|eyJ2MiI6IjdjMTRmZGNjNzY1ODQ0ZDc4MDkyMzQ4NWQyOTMzNjZmIn0=" npx convex deploy
```
Erwartet: Kein Fehler

- [ ] **Schritt 3: Commit**

```bash
git add convex/games.ts
git commit -m "feat: add games.ts Convex mutations and queries"
```

---

## Task 8: auth.js — Google Login via Convex Auth

**Files:**
- Create: `auth.js`
- Create: `convex/auth.config.ts` (Convex Auth Konfiguration)

**Voraussetzung:** Google OAuth Client-ID in der [Google Cloud Console](https://console.cloud.google.com) erstellen. Authorized origins: `https://shiny-setter-795.eu-west-1.convex.cloud` und die Hosting-Domain der App.

- [ ] **Schritt 1: Convex Auth via CLI einrichten (primärer Weg)**

```bash
npx convex auth add google
```

Die CLI führt interaktiv durch die Konfiguration (Google Client-ID + Secret eingeben) und generiert `convex/auth.config.ts` sowie Hilfscode automatisch. **Diesen generierten Code verwenden** — er ist die einzig zuverlässige Quelle für den korrekten OAuth-Flow.

Nach dem CLI-Setup prüfen welche Auth-Hilfsfunktionen generiert wurden (typisch: `useConvexAuth`, Token-Getter) und `auth.js` entsprechend anpassen.

- [ ] **Schritt 2: auth.js anlegen**

Die konkrete Implementierung richtet sich nach dem in Schritt 1 generierten Code. Das folgende Skelett zeigt die benötigte öffentliche API — die Implementierung der Funktionen aus dem generierten Convex-Auth-Code ableiten:

```js
// auth.js — öffentliche API die der Rest der App braucht
// Implementierung aus generiertem Convex-Auth-Code ableiten

let _user = null; // { convexId, displayName, token }

// Google-OAuth-Redirect starten (aus Convex Auth generiertem Code ableiten)
export async function signInWithGoogle() {
  // z.B.: window.location.href = convexAuth.getSignInUrl('google');
  throw new Error('Implementierung aus Schritt 1 ableiten');
}

// Session beenden
export async function signOut() {
  _user = null;
  localStorage.removeItem('filmduel_user');
  // + Convex Auth signout aufrufen (aus generiertem Code)
}

// Eingeloggten User laden (aus URL-Params nach Redirect oder localStorage)
export async function getCurrentUser() {
  if (_user) return _user;
  const stored = localStorage.getItem('filmduel_user');
  if (stored) { _user = JSON.parse(stored); return _user; }
  // Token aus URL-Params nach OAuth-Redirect extrahieren (Convex Auth spezifisch)
  // Aus generiertem Code ableiten
  return null;
}

export function getAuthToken() {
  return _user?.token ?? null;
}
```

**Kernprinzip:** `auth.js` ist ein dünner Wrapper. Die echte OAuth-Logik kommt aus Convex Auth. Falls `npx convex auth` einen anderen Ansatz (z.B. Convex JS Client SDK mit Subscriptions) generiert, diesen verwenden statt HTTP-fetch.

- [ ] **Schritt 3: Convex deployen**

```bash
CONVEX_DEPLOY_KEY="dev:shiny-setter-795|eyJ2MiI6IjdjMTRmZGNjNzY1ODQ0ZDc4MDkyMzQ4NWQyOTMzNjZmIn0=" npx convex deploy
```

- [ ] **Schritt 4: Commit**

```bash
git add auth.js convex/auth.config.ts
git commit -m "feat: add Google OAuth via Convex Auth"
```

---

## Task 9: s-start Screen anpassen + s-login Screen

Den bestehenden Start-Screen um "Online spielen"-Button erweitern. Neuen Login-Screen anlegen.

**Files:**
- Modify: `index.html` (s-start erweitern, s-login hinzufügen)
- Modify: `app.js` (online-Button Handler)

- [ ] **Schritt 1: s-start — Online-Button hinzufügen**

In `index.html`, im `s-start` Screen nach dem "DUELL STARTEN"-Button:
```html
<button class="btn-secondary mt-2" onclick="goOnline()"
  style="border-color:#60a5fa;color:#60a5fa">
  🌐 ONLINE SPIELEN
</button>
```

- [ ] **Schritt 2: s-login Screen in index.html hinzufügen**

Nach dem `s-start` Screen einfügen:
```html
<section id="s-login" class="screen flex-col items-center justify-center safe-top safe-bottom px-6">
  <div class="filmstrip fixed top-0 left-0 right-0 flex" id="filmstrip-login"></div>
  <div class="text-center mb-10">
    <h1 class="font-display text-4xl font-bold tracking-widest text-c-text mb-2">FILM<span class="text-c-gold">DUEL</span></h1>
    <p class="font-condensed text-c-muted tracking-wide uppercase text-sm">Online-Modus</p>
  </div>
  <div class="w-full max-w-sm flex flex-col gap-4">
    <button id="google-login-btn" onclick="loginWithGoogle()"
      class="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3 px-6 rounded-lg text-base">
      <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.5 30.2 0 24 0 14.7 0 6.8 5.5 2.9 13.5l7.8 6.1C12.5 13.2 17.8 9.5 24 9.5z"/><path fill="#4A90D9" d="M46.9 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.9c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.3-10 7.3-17z"/><path fill="#34A853" d="M10.7 28.4A14.6 14.6 0 0 1 9.5 24c0-1.5.2-3 .6-4.4L2.3 13.5A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.5 10.8l8.2-6.4z"/><path fill="#FBBC05" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.2 0-11.5-4.2-13.3-9.8l-8 6.2C6.6 42.3 14.7 48 24 48z"/></svg>
      Mit Google anmelden
    </button>
    <button onclick="show('s-start')" class="btn-secondary text-sm">← Zurück</button>
  </div>
  <p id="login-error" class="text-c-red text-sm mt-4 hidden"></p>
</section>
```

- [ ] **Schritt 3: Handler in app.js hinzufügen**

```js
import { signInWithGoogle, getCurrentUser } from './auth.js';

function goOnline() {
  show('s-login');
}

async function loginWithGoogle() {
  const btn = document.getElementById('google-login-btn');
  btn.disabled = true;
  btn.textContent = 'Weiterleiten...';
  await signInWithGoogle();
}

// Beim Start prüfen ob User bereits eingeloggt ist (nach OAuth-Redirect)
(async () => {
  const user = await getCurrentUser();
  if (user) {
    // Online-Dashboard direkt anzeigen wenn User vorhanden
    // (wird in Task 10 implementiert)
    console.log('Eingeloggter User:', user.displayName);
  }
})();

// Zu window hinzufügen
window.goOnline = goOnline;
window.loginWithGoogle = loginWithGoogle;
```

- [ ] **Schritt 4: Im Browser testen**

- Start-Screen zeigt "Online spielen" Button
- Klick zeigt Login-Screen
- Google-Button leitet zu Google-Auth weiter
- Nach Login erscheint Redirect zurück zur App

- [ ] **Schritt 5: Commit**

```bash
git add index.html app.js
git commit -m "feat: add online mode entry point and login screen"
```

---

## Task 10: s-dashboard Screen

**Files:**
- Modify: `index.html` (s-dashboard Screen hinzufügen)
- Create: `online.js` (Dashboard-Logik)

- [ ] **Schritt 1: s-dashboard HTML in index.html hinzufügen**

```html
<section id="s-dashboard" class="screen flex-col safe-top safe-bottom">
  <div class="filmstrip fixed top-0 left-0 right-0 flex" id="filmstrip-dashboard"></div>

  <!-- Header -->
  <div class="flex items-center justify-between px-4 pt-14 pb-3 border-b border-c-border">
    <div>
      <p class="font-condensed text-xs text-c-muted uppercase tracking-wide">Eingeloggt als</p>
      <p id="dashboard-username" class="font-display text-c-gold font-bold tracking-wide"></p>
    </div>
    <button onclick="logoutOnline()" class="text-c-muted text-xs font-condensed uppercase tracking-wide">Abmelden</button>
  </div>

  <!-- Offene Spiele -->
  <div class="flex-1 px-4 pt-4 overflow-y-auto">
    <h2 class="font-condensed text-sm uppercase tracking-widest text-c-muted mb-3">Deine Duelle</h2>
    <div id="games-list" class="flex flex-col gap-3">
      <p class="text-c-muted text-sm text-center py-8">Keine aktiven Duelle</p>
    </div>
  </div>

  <!-- Neues Duell starten -->
  <div class="px-4 pb-4 border-t border-c-border pt-4">
    <button onclick="startChallenge()" class="btn-primary w-full">
      ⚔️ NEUES DUELL
    </button>
  </div>
</section>
```

- [ ] **Schritt 2: online.js anlegen mit Dashboard-Logik**

```js
// online.js
import { getCurrentUser, signOut, getAuthToken } from './auth.js';
import { CATS, QUESTIONS } from './categories.js';

const CONVEX_URL = "https://shiny-setter-795.eu-west-1.convex.cloud";

// Convex HTTP-Action wrapper (mit Auth-Token)
async function convexQuery(path, body = null) {
  const token = getAuthToken();
  const opts = {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
  const res = await fetch(`${CONVEX_URL}${path}`, opts);
  if (!res.ok) throw new Error(`Convex error: ${res.status}`);
  return res.json();
}

export async function loadDashboard() {
  const user = await getCurrentUser();
  if (!user) { show('s-login'); return; }

  document.getElementById('dashboard-username').textContent = user.displayName;
  makeFilmstrip('filmstrip-dashboard');

  // Spiele laden (HTTP Action)
  try {
    const games = await convexQuery(`/my-games?userId=${encodeURIComponent(user.convexId)}`);
    renderGamesList(games, user.convexId);
  } catch(e) {
    console.error('Fehler beim Laden der Spiele:', e);
  }

  show('s-dashboard');
}

function renderGamesList(games, myId) {
  const list = document.getElementById('games-list');
  if (!games.length) {
    list.innerHTML = '<p class="text-c-muted text-sm text-center py-8">Keine aktiven Duelle</p>';
    return;
  }
  list.innerHTML = games.map(g => {
    const isChallenger = g.challengerId === myId;
    const myTurn = (isChallenger && g.status === 'pending') ||
                   (!isChallenger && g.status === 'challenger_done');
    const opponent = isChallenger ? g.opponentId : g.challengerId;
    const cat = CATS.find(c => c.id === g.category);

    return `<div class="bg-c-card rounded-xl p-4 flex items-center justify-between cursor-pointer"
                onclick="openGame('${g._id}')">
      <div>
        <p class="font-condensed text-sm uppercase tracking-wide ${myTurn ? 'text-c-gold' : 'text-c-muted'}">
          ${myTurn ? '🎯 Du bist dran' : '⏳ Warte auf Gegner'}
        </p>
        <p class="text-c-text text-sm mt-0.5">${cat?.label ?? g.category} · ${g.rounds} Runden</p>
      </div>
      <span class="text-2xl">${myTurn ? '→' : '···'}</span>
    </div>`;
  }).join('');
}

export async function logoutOnline() {
  await signOut();
  show('s-start');
}

// Global verfügbar machen
window.logoutOnline = logoutOnline;
window.startChallenge = () => show('s-challenge-setup');
window.openGame = openGame;
```

- [ ] **Schritt 3: HTTP-Action für getMyGames in http.ts hinzufügen**

In `convex/http.ts` ergänzen:
```ts
http.route({
  path: "/my-games",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId") ?? "";
    const data = await ctx.runQuery(api.games.getMyGames, { userId });
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

http.route({
  path: "/my-games",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});
```

- [ ] **Schritt 4: online.js in index.html einbinden**

In `index.html`:
```html
<script type="module" src="online.js"></script>
```

- [ ] **Schritt 5: Nach Login Dashboard laden**

In `app.js` den Login-Redirect-Handler erweitern:
```js
(async () => {
  const user = await getCurrentUser();
  if (user && window.location.search.includes('token=')) {
    // Nach OAuth-Redirect direkt ins Dashboard
    const { loadDashboard } = await import('./online.js');
    await loadDashboard();
  }
})();
```

- [ ] **Schritt 6: Deployen und testen**

```bash
CONVEX_DEPLOY_KEY="dev:shiny-setter-795|eyJ2MiI6IjdjMTRmZGNjNzY1ODQ0ZDc4MDkyMzQ4NWQyOTMzNjZmIn0=" npx convex deploy
```

- Dashboard lädt nach Login
- Zeigt "Keine aktiven Duelle" bei leerem State

- [ ] **Schritt 7: Commit**

```bash
git add index.html online.js convex/http.ts
git commit -m "feat: add online dashboard screen"
```

---

## Task 11: s-challenge-setup Screen

**Files:**
- Modify: `index.html` (s-challenge-setup Screen)
- Modify: `online.js` (Challenge-Setup-Logik)

- [ ] **Schritt 1: HTML in index.html hinzufügen**

```html
<section id="s-challenge-setup" class="screen flex-col safe-top safe-bottom px-4">
  <div class="pt-14 pb-4 flex items-center gap-3 border-b border-c-border">
    <button onclick="show('s-dashboard')" class="text-c-muted">←</button>
    <h2 class="font-display text-xl tracking-widest">NEUES DUELL</h2>
  </div>

  <!-- Gegner -->
  <div class="mt-6">
    <p class="font-condensed text-xs uppercase tracking-widest text-c-muted mb-3">Gegner</p>
    <div class="flex gap-2 mb-3">
      <button id="btn-search" onclick="setOpponentMode('search')"
        class="flex-1 btn-secondary text-sm active-mode">Benutzername suchen</button>
      <button id="btn-random" onclick="setOpponentMode('random')"
        class="flex-1 btn-secondary text-sm">Zufallsgegner</button>
    </div>
    <div id="opponent-search-area">
      <input id="opponent-input" type="text" placeholder="Benutzername eingeben..."
        class="w-full bg-c-card border border-c-border rounded-lg px-4 py-3 text-c-text font-body text-sm"
        oninput="searchOpponent(this.value)" />
      <div id="opponent-results" class="mt-2 flex flex-col gap-2"></div>
    </div>
    <p id="selected-opponent" class="text-c-gold font-condensed text-sm mt-2 hidden"></p>
  </div>

  <!-- Kategorie -->
  <div class="mt-6">
    <p class="font-condensed text-xs uppercase tracking-widest text-c-muted mb-3">Kategorie</p>
    <div id="challenge-cats" class="grid grid-cols-3 gap-2"></div>
  </div>

  <!-- Runden -->
  <div class="mt-6">
    <p class="font-condensed text-xs uppercase tracking-widest text-c-muted mb-3">Runden</p>
    <div class="flex gap-3">
      <button class="challenge-round-btn flex-1 btn-secondary" data-r="5" onclick="setChallengeRounds(5)">5</button>
      <button class="challenge-round-btn flex-1 btn-secondary" data-r="10" onclick="setChallengeRounds(10)">10</button>
      <button class="challenge-round-btn flex-1 btn-secondary" data-r="15" onclick="setChallengeRounds(15)">15</button>
    </div>
  </div>

  <div class="flex-1"></div>
  <button id="start-challenge-btn" onclick="confirmChallenge()" class="btn-primary w-full" disabled>
    DUELL STARTEN ⚔️
  </button>
</section>
```

- [ ] **Schritt 2: Challenge-Setup-Logik in online.js hinzufügen**

```js
let challengeState = { opponentId: null, opponentName: null, category: null, rounds: 5, mode: 'search' };

export function initChallengeSetup() {
  // Kategorien rendern
  const grid = document.getElementById('challenge-cats');
  grid.innerHTML = CATS.map(c =>
    `<button class="challenge-cat-btn rounded-lg p-2 text-center border border-c-border text-xs font-condensed uppercase tracking-wide"
             style="border-color:${c.color}20"
             data-id="${c.id}"
             onclick="selectChallengecat('${c.id}', this)">
       <span style="color:${c.color}">${c.abbr}</span><br>
       <span class="text-c-muted text-xs">${c.label}</span>
     </button>`
  ).join('');

  // Erste Rundenoption aktivieren
  setChallengeRounds(5);
  challengeState = { opponentId: null, opponentName: null, category: null, rounds: 5, mode: 'search' };
  updateStartBtn();
}

window.setOpponentMode = (mode) => {
  challengeState.mode = mode;
  challengeState.opponentId = mode === 'random' ? 'random' : null;
  challengeState.opponentName = mode === 'random' ? 'Zufallsgegner' : null;
  document.getElementById('opponent-search-area').style.display = mode === 'search' ? '' : 'none';
  document.getElementById('selected-opponent').textContent = mode === 'random' ? '🎲 Zufallsgegner' : '';
  document.getElementById('selected-opponent').classList.toggle('hidden', mode === 'search');
  updateStartBtn();
};

window.searchOpponent = async (name) => {
  if (name.length < 2) { document.getElementById('opponent-results').innerHTML = ''; return; }
  try {
    const results = await convexQuery(`/search-users?name=${encodeURIComponent(name)}`);
    const me = (await getCurrentUser())?.convexId;
    document.getElementById('opponent-results').innerHTML = results
      .filter(u => u._id !== me)
      .map(u => `<button class="w-full text-left bg-c-card rounded-lg px-4 py-2 text-sm text-c-text"
                          onclick="selectOpponent('${u._id}','${u.displayName}')">
                   ${u.displayName}
                 </button>`).join('');
  } catch(e) { console.error(e); }
};

window.selectOpponent = (id, name) => {
  challengeState.opponentId = id;
  challengeState.opponentName = name;
  document.getElementById('opponent-results').innerHTML = '';
  document.getElementById('opponent-input').value = '';
  const sel = document.getElementById('selected-opponent');
  sel.textContent = `✓ ${name}`;
  sel.classList.remove('hidden');
  updateStartBtn();
};

window.selectChallengecat = (id, btn) => {
  document.querySelectorAll('.challenge-cat-btn').forEach(b => b.classList.remove('ring-2'));
  btn.classList.add('ring-2');
  challengeState.category = id;
  updateStartBtn();
};

window.setChallengeRounds = (n) => {
  challengeState.rounds = n;
  document.querySelectorAll('.challenge-round-btn').forEach(b =>
    b.classList.toggle('active', parseInt(b.dataset.r) === n));
};

function updateStartBtn() {
  const ok = challengeState.opponentId && challengeState.category;
  document.getElementById('start-challenge-btn').disabled = !ok;
}

window.confirmChallenge = async () => {
  const cat = QUESTIONS[challengeState.category];
  const indices = shuffle(Array.from({length: cat.length}, (_, i) => i)).slice(0, challengeState.rounds);

  try {
    const user = await getCurrentUser();
    let gameId;
    if (challengeState.mode === 'random') {
      // HTTP-Action gibt { id: "..." } zurück — destructuren!
      const res = await convexQuery('/join-or-create-random', {
        userId: user.convexId, category: challengeState.category,
        rounds: challengeState.rounds, questionIndices: indices
      });
      gameId = res.id;
    } else {
      const res = await convexQuery('/create-game', {
        challengerId: user.convexId, opponentId: challengeState.opponentId,
        category: challengeState.category, rounds: challengeState.rounds,
        questionIndices: indices
      });
      gameId = res.id;
    }
    // Direkt ins Spiel
    await openGame(gameId);
  } catch(e) {
    alert('Fehler beim Erstellen des Duells: ' + e.message);
  }
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length-1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
```

- [ ] **Schritt 3: Neue HTTP-Actions in http.ts**

```ts
// /search-users, /create-game, /join-or-create-random
http.route({ path: "/search-users", method: "GET",
  handler: httpAction(async (ctx, req) => {
    const name = new URL(req.url).searchParams.get("name") ?? "";
    const data = await ctx.runQuery(api.users.searchByName, { name });
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", ...corsHeaders }});
  })
});
http.route({ path: "/create-game", method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.json();
    const id = await ctx.runMutation(api.games.createGame, body);
    return new Response(JSON.stringify({ id }), { headers: { "Content-Type": "application/json", ...corsHeaders }});
  })
});
http.route({ path: "/join-or-create-random", method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.json();
    const id = await ctx.runMutation(api.games.joinOrCreateRandom, body);
    return new Response(JSON.stringify({ id }), { headers: { "Content-Type": "application/json", ...corsHeaders }});
  })
});
// OPTIONS für alle neuen Routen
["/search-users","/create-game","/join-or-create-random"].forEach(path => {
  http.route({ path, method: "OPTIONS",
    handler: httpAction(async () => new Response(null, { headers: corsHeaders }))
  });
});
```

- [ ] **Schritt 4: Deployen und testen**

```bash
CONVEX_DEPLOY_KEY="dev:shiny-setter-795|eyJ2MiI6IjdjMTRmZGNjNzY1ODQ0ZDc4MDkyMzQ4NWQyOTMzNjZmIn0=" npx convex deploy
```

- Challenge-Setup öffnet sich
- Kategorien werden angezeigt
- Benutzername-Suche liefert Ergebnisse

- [ ] **Schritt 5: Commit**

```bash
git add index.html online.js convex/http.ts
git commit -m "feat: add challenge setup screen"
```

---

## Task 12: s-online-q + s-online-wait Screens

**Files:**
- Modify: `index.html`
- Modify: `online.js`

- [ ] **Schritt 1: HTML für s-online-q hinzufügen**

```html
<section id="s-online-q" class="screen flex-col safe-top safe-bottom">
  <div class="filmstrip fixed top-0 left-0 right-0 flex" id="filmstrip-online-q"></div>
  <div class="px-4 pt-14 pb-3 border-b border-c-border flex justify-between items-center">
    <span id="oq-progress" class="font-condensed text-c-muted text-xs uppercase tracking-wide"></span>
    <span id="oq-category" class="font-condensed text-c-gold text-xs uppercase tracking-wide"></span>
  </div>
  <div class="flex-1 px-4 pt-6">
    <p id="oq-question" class="font-display text-xl font-bold text-c-text leading-snug mb-6"></p>
    <div id="oq-answers" class="flex flex-col gap-3"></div>
  </div>
</section>

<section id="s-online-wait" class="screen flex-col items-center justify-center safe-top safe-bottom px-6">
  <div class="text-center">
    <div class="text-5xl mb-6">⏳</div>
    <h2 class="font-display text-2xl font-bold text-c-text mb-3">Warte auf Gegner</h2>
    <p id="wait-msg" class="text-c-muted font-condensed text-sm uppercase tracking-wide mb-8"></p>
    <button onclick="show('s-dashboard')" class="btn-secondary text-sm">← Zurück zum Dashboard</button>
  </div>
</section>
```

- [ ] **Schritt 2: Online-Frage-Logik in online.js**

```js
let OG = { gameId: null, game: null, myAnswers: [], qi: 0 };

export async function openGame(gameId) {
  const game = await convexQuery(`/game?id=${gameId}`);
  if (!game) return;
  const user = await getCurrentUser();
  OG = { gameId, game, myAnswers: [], qi: 0 };

  const isChallenger = game.challengerId === user.convexId;
  const myTurn = (isChallenger && game.status === 'pending') ||
                 (!isChallenger && game.status === 'challenger_done');

  if (game.status === 'finished') {
    showOnlineResult(game, user.convexId);
    return;
  }
  if (!myTurn) {
    document.getElementById('wait-msg').textContent =
      `Deine Antworten: ${isChallenger ? game.challengerScore : game.opponentScore} Punkte`;
    show('s-online-wait');
    return;
  }

  // Fragen aus questionIndices laden
  const questions = game.questionIndices.map(i => QUESTIONS[game.category][i]);
  OG.questions = questions;
  showOnlineQuestion();
}

function showOnlineQuestion() {
  const q = OG.questions[OG.qi];
  const cat = CATS.find(c => c.id === OG.game.category);

  document.getElementById('oq-progress').textContent = `Frage ${OG.qi + 1} / ${OG.questions.length}`;
  document.getElementById('oq-category').textContent = cat?.label ?? '';
  document.getElementById('oq-question').textContent = q.q;

  const answers = shuffle([q.a, ...q.wrong]);
  document.getElementById('oq-answers').innerHTML = answers.map(ans =>
    `<button class="w-full text-left bg-c-card border border-c-border rounded-xl px-5 py-4
                    font-body text-base text-c-text active:scale-95 transition-transform"
             onclick="pickOnline(this, '${ans.replace(/'/g,"\\'")}', '${q.a.replace(/'/g,"\\'")}')">${ans}</button>`
  ).join('');

  makeFilmstrip('filmstrip-online-q');
  show('s-online-q');
}

window.pickOnline = async (btn, chosen, correct) => {
  // Buttons sperren
  document.querySelectorAll('#oq-answers button').forEach(b => b.disabled = true);

  const isCorrect = chosen === correct;
  OG.myAnswers.push(isCorrect ? 1 : 0);

  btn.classList.add(isCorrect ? 'bg-green-900' : 'bg-red-900');
  if (!isCorrect) {
    document.querySelectorAll('#oq-answers button').forEach(b => {
      if (b.textContent === correct) b.classList.add('bg-green-900');
    });
  }

  await new Promise(r => setTimeout(r, 700));
  OG.qi++;

  if (OG.qi < OG.questions.length) {
    showOnlineQuestion();
  } else {
    // Runde beendet — Antworten an Convex schicken
    const score = OG.myAnswers.filter(a => a === 1).length;
    const user = await getCurrentUser();
    await convexQuery('/submit-answers', {
      gameId: OG.gameId, userId: user.convexId,
      answers: OG.myAnswers, score
    });
    // Spiel neu laden
    await openGame(OG.gameId);
  }
};
```

- [ ] **Schritt 3: HTTP-Actions in http.ts**

```ts
http.route({ path: "/game", method: "GET",
  handler: httpAction(async (ctx, req) => {
    const id = new URL(req.url).searchParams.get("id") as any;
    const data = await ctx.runQuery(api.games.getGame, { gameId: id });
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", ...corsHeaders }});
  })
});
http.route({ path: "/submit-answers", method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.json();
    await ctx.runMutation(api.games.submitAnswers, body);
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json", ...corsHeaders }});
  })
});
["/game", "/submit-answers"].forEach(path =>
  http.route({ path, method: "OPTIONS", handler: httpAction(async () => new Response(null, { headers: corsHeaders })) })
);
```

- [ ] **Schritt 4: Deployen und testen**

```bash
CONVEX_DEPLOY_KEY="dev:shiny-setter-795|eyJ2MiI6IjdjMTRmZGNjNzY1ODQ0ZDc4MDkyMzQ4NWQyOTMzNjZmIn0=" npx convex deploy
```

Manuelle Test-Schritte:
- Neues Spiel starten → Fragen erscheinen
- Frage beantworten → Feedback angezeigt
- Nach letzter Frage → Warte-Screen erscheint
- Status in Convex-Dashboard prüfen: `status: "challenger_done"`

- [ ] **Schritt 5: Commit**

```bash
git add index.html online.js convex/http.ts
git commit -m "feat: add online question and wait screens"
```

---

## Task 13: s-online-result Screen

**Files:**
- Modify: `index.html`
- Modify: `online.js`

- [ ] **Schritt 1: HTML in index.html**

```html
<section id="s-online-result" class="screen flex-col safe-top safe-bottom px-4">
  <div class="filmstrip fixed top-0 left-0 right-0 flex" id="filmstrip-online-result"></div>
  <div class="flex-1 flex flex-col items-center justify-center">
    <p id="or-winner-label" class="font-condensed text-xs uppercase tracking-widest text-c-muted mb-2"></p>
    <h2 id="or-winner" class="font-display text-3xl font-bold text-c-gold mb-8 tracking-widest"></h2>

    <div class="w-full flex gap-4 mb-8">
      <div class="flex-1 bg-c-card rounded-xl p-4 text-center">
        <p id="or-p1-name" class="font-condensed text-xs text-c-muted uppercase tracking-wide mb-1"></p>
        <p id="or-p1-score" class="font-display text-4xl font-bold text-c-gold"></p>
      </div>
      <div class="flex items-center text-c-muted font-display text-xl">VS</div>
      <div class="flex-1 bg-c-card rounded-xl p-4 text-center">
        <p id="or-p2-name" class="font-condensed text-xs text-c-muted uppercase tracking-wide mb-1"></p>
        <p id="or-p2-score" class="font-display text-4xl font-bold text-c-gold"></p>
      </div>
    </div>
  </div>
  <div class="flex flex-col gap-3 pb-4">
    <button onclick="startChallenge()" class="btn-primary">⚔️ NEUES DUELL</button>
    <button onclick="loadDashboard()" class="btn-secondary">← DASHBOARD</button>
  </div>
</section>
```

- [ ] **Schritt 2: showOnlineResult in online.js**

```js
async function showOnlineResult(game, myId) {
  const isChallenger = game.challengerId === myId;

  // Usernamen laden
  const [challenger, opponent] = await Promise.all([
    convexQuery(`/user?id=${game.challengerId}`),
    game.opponentId !== 'random' ? convexQuery(`/user?id=${game.opponentId}`) : null,
  ]);

  const p1Name = challenger?.displayName ?? 'Herausforderer';
  const p2Name = opponent?.displayName ?? 'Gegner';
  const p1Score = game.challengerScore;
  const p2Score = game.opponentScore;

  let winnerText;
  if (game.winnerId === null) {
    winnerText = 'UNENTSCHIEDEN';
    document.getElementById('or-winner-label').textContent = 'Remis';
  } else {
    const winnerName = game.winnerId === game.challengerId ? p1Name : p2Name;
    const iWon = game.winnerId === myId;
    winnerText = iWon ? '🏆 DU GEWINNST!' : `${winnerName} gewinnt`;
    document.getElementById('or-winner-label').textContent = iWon ? 'Gewinner' : 'Gewinner';
  }

  document.getElementById('or-winner').textContent = winnerText;
  document.getElementById('or-p1-name').textContent = p1Name;
  document.getElementById('or-p1-score').textContent = p1Score;
  document.getElementById('or-p2-name').textContent = p2Name;
  document.getElementById('or-p2-score').textContent = p2Score;

  makeFilmstrip('filmstrip-online-result');
  show('s-online-result');
}
```

- [ ] **Schritt 3: HTTP-Action für /user in http.ts**

```ts
http.route({ path: "/user", method: "GET",
  handler: httpAction(async (ctx, req) => {
    const id = new URL(req.url).searchParams.get("id") as any;
    const data = await ctx.runQuery(api.users.getById, { userId: id });
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", ...corsHeaders }});
  })
});
http.route({ path: "/user", method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })) });
```

- [ ] **Schritt 4: Vollständiger Flow-Test**

Manuell mit 2 Geräten / 2 Browsern:
1. User A loggt ein, fordert User B heraus, beantwortet Fragen → Warte-Screen
2. User B loggt ein, sieht "Du bist dran" im Dashboard, beantwortet Fragen
3. Ergebnis-Screen für beide erscheint mit korrekten Scores
4. `loadDashboard()` zurück → Spiel als `finished` gelistet

- [ ] **Schritt 5: Deployen**

```bash
CONVEX_DEPLOY_KEY="dev:shiny-setter-795|eyJ2MiI6IjdjMTRmZGNjNzY1ODQ0ZDc4MDkyMzQ4NWQyOTMzNjZmIn0=" npx convex deploy
```

- [ ] **Schritt 6: Commit**

```bash
git add index.html online.js convex/http.ts
git commit -m "feat: add online result screen, complete multiplayer flow"
```

---

## Task 14: Smoke Test + Abschluss

- [ ] **Schritt 1: Alle Unit Tests laufen**

```bash
npm test
```
Erwartet: Alle PASS

- [ ] **Schritt 2: Lokalen Modus testen**

- App öffnen → "Lokal spielen" → Spiel startet normal
- Alle 18 Kategorien in der Kategorie-Auswahl vorhanden
- Score einreichen funktioniert
- Rangliste lädt

- [ ] **Schritt 3: Online-Modus End-to-End**

- Login → Dashboard → Herausfordern → Spielen → Warte → Gegner spielt → Ergebnis ✓

- [ ] **Schritt 4: .gitignore prüfen**

```bash
echo ".superpowers/" >> .gitignore
echo "node_modules/" >> .gitignore
git add .gitignore
```

- [ ] **Schritt 5: Finaler Commit**

```bash
git add .
git commit -m "feat: FilmDuel online multiplayer complete

- Async QuizDuell-style multiplayer via Convex
- Google OAuth login
- 10 new categories (150 questions)
- Dashboard with active games
- Challenge setup: opponent search + random matchmaking
- Online question/wait/result screens
- Code split into ES modules (no build step)"
```
