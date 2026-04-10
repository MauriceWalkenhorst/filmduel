# Solo Online Leaderboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Solo-Scores nach dem Spielende an Convex übermitteln und in einer globalen Online-Rangliste anzeigen, damit alle Spieler sehen können was andere im Solo-Modus erreicht haben.

**Architecture:** Neues Convex-Table `soloScores` für anonyme Solo-Ergebnisse (kein Login nötig). `app.js` sendet nach jedem Solo-Spiel einen fire-and-forget POST. `showLeaderboard()` in `index.html` bekommt Tabs (Duo / Solo). Alles ohne Änderung an der Spiellogik.

**Tech Stack:** Vanilla JS (fetch), Convex HTTP Router, Convex schema/mutation/query

---

## Dateien

| Datei | Änderung |
|-------|----------|
| `convex/schema.ts` | Neues Table `soloScores` hinzufügen |
| `convex/soloScores.ts` | Neu: `submitSolo` mutation + `getSoloLeaderboard` query |
| `convex/http.ts` | 3 neue Routen: POST/GET/OPTIONS `/solo-scores` |
| `app.js` | Nach `saveHighscore()`: fire-and-forget POST an Convex |
| `index.html` | `showLeaderboard()` mit Duo/Solo-Tabs erweitern |

---

## Task 1: Convex Schema erweitern

**Files:**
- Modify: `convex/schema.ts`

### Schritt 1: `soloScores` Table hinzufügen

Aktueller Stand von `convex/schema.ts` — nach dem `scores`-Table (Zeile 43–51) einfügen:

```ts
  soloScores: defineTable({
    name: v.string(),        // Spielername (aus G.p1)
    score: v.number(),       // erreichte Punkte
    maxScore: v.number(),    // maximal mögliche Punkte
    pct: v.number(),         // Prozentsatz (0-100)
    rating: v.string(),      // z.B. "CINEAST"
    rounds: v.number(),      // gespielte Runden
    date: v.string(),        // ISO-Datum
  }).index("by_pct", ["pct"]),
```

- [ ] `soloScores` Table in `convex/schema.ts` einfügen (nach dem `scores` Table, vor der letzten `})`):

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    pictureUrl: v.optional(v.string()),
    displayName: v.optional(v.string()),
    displayNameSet: v.optional(v.boolean()),
    wins: v.optional(v.number()),
    games: v.optional(v.number()),
    totalScore: v.optional(v.number()),
    streak: v.optional(v.number()),
    lastGameDate: v.optional(v.string()),
  }).index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_displayName", ["displayName"]),

  games: defineTable({
    challengerId: v.string(),
    opponentId: v.string(),
    category: v.string(),
    rounds: v.number(),
    seed: v.number(),
    questionIndices: v.array(v.number()),
    status: v.string(),
    challengerAnswers: v.array(v.number()),
    opponentAnswers: v.array(v.number()),
    challengerScore: v.number(),
    opponentScore: v.number(),
    winnerId: v.union(v.string(), v.null()),
  })
    .index("by_opponentId", ["opponentId"])
    .index("by_status", ["status"])
    .index("by_challengerId", ["challengerId"]),

  pushSubscriptions: defineTable({
    userId: v.string(),
    subscription: v.any(),
  }).index("by_userId", ["userId"]),

  scores: defineTable({
    player_name: v.string(),
    opponent_name: v.string(),
    winner: v.string(),
    player_score: v.number(),
    opponent_score: v.number(),
    rounds: v.number(),
    mode: v.string(),
  }).index("by_winner_score", ["winner", "player_score"]),

  soloScores: defineTable({
    name: v.string(),
    score: v.number(),
    maxScore: v.number(),
    pct: v.number(),
    rating: v.string(),
    rounds: v.number(),
    date: v.string(),
  }).index("by_pct", ["pct"]),
});
```

- [ ] Committen:
```bash
cd "/Users/maurice/Antigravity_Projekts/Film Duell/filmduel"
git add convex/schema.ts
git commit -m "feat: add soloScores table to convex schema"
```

---

## Task 2: Convex Backend — mutation + query

**Files:**
- Create: `convex/soloScores.ts`

### Schritt 1: Neue Datei erstellen

```ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const submit = mutation({
  args: {
    name: v.string(),
    score: v.number(),
    maxScore: v.number(),
    pct: v.number(),
    rating: v.string(),
    rounds: v.number(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim().slice(0, 30) || "Anon";
    await ctx.db.insert("soloScores", { ...args, name });
  },
});

export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("soloScores").collect();

    // Bester Score pro Name (nach pct)
    const best: Record<string, { name: string; pct: number; score: number; maxScore: number; rating: string; rounds: number }> = {};
    for (const s of all) {
      const key = s.name.toLowerCase();
      if (!best[key] || s.pct > best[key].pct) {
        best[key] = { name: s.name, pct: s.pct, score: s.score, maxScore: s.maxScore, rating: s.rating, rounds: s.rounds };
      }
    }

    return Object.values(best)
      .sort((a, b) => b.pct - a.pct || b.score - a.score)
      .slice(0, 20);
  },
});
```

- [ ] Datei `convex/soloScores.ts` mit obigem Inhalt erstellen

- [ ] Committen:
```bash
git add convex/soloScores.ts
git commit -m "feat: soloScores mutation + leaderboard query"
```

---

## Task 3: HTTP Router erweitern

**Files:**
- Modify: `convex/http.ts`

### Schritt 1: 3 neue Routen hinzufügen

Aktuell endet `convex/http.ts` vor `export default http`. Vorher einfügen:

```ts
// POST /solo-scores
http.route({
  path: "/solo-scores",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.json();
    await ctx.runMutation(api.soloScores.submit, body);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

// GET /solo-scores
http.route({
  path: "/solo-scores",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const data = await ctx.runQuery(api.soloScores.getLeaderboard);
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

// OPTIONS /solo-scores (CORS preflight)
http.route({
  path: "/solo-scores",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});
```

Vollständiges `convex/http.ts` nach der Änderung:

```ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// POST /scores
http.route({
  path: "/scores",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.json();
    await ctx.runMutation(api.scores.submit, body);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

// GET /leaderboard
http.route({
  path: "/leaderboard",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const data = await ctx.runQuery(api.users.getLeaderboard);
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

http.route({
  path: "/scores",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

http.route({
  path: "/leaderboard",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// POST /solo-scores
http.route({
  path: "/solo-scores",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.json();
    await ctx.runMutation(api.soloScores.submit, body);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

// GET /solo-scores
http.route({
  path: "/solo-scores",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const data = await ctx.runQuery(api.soloScores.getLeaderboard);
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

// OPTIONS /solo-scores
http.route({
  path: "/solo-scores",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

export default http;
```

- [ ] `convex/http.ts` mit obigem Inhalt ersetzen

- [ ] Convex deployen:
```bash
cd "/Users/maurice/Antigravity_Projekts/Film Duell/filmduel"
npx convex deploy
```
Erwartete Ausgabe: `✓ Deployed` ohne Fehler.

- [ ] Committen:
```bash
git add convex/http.ts
git commit -m "feat: add /solo-scores HTTP routes to convex"
```

---

## Task 4: app.js — Solo-Score nach Spielende übermitteln

**Files:**
- Modify: `app.js` (Zeile ~450, nach `saveHighscore(...)`)

### Schritt 1: Konstante und Submit-Funktion hinzufügen

Direkt nach den Imports (nach Zeile 2: `import { CATS, Q } from './categories.js';`) einfügen:

```js
const CONVEX_SITE_URL = 'https://formal-bee-819.eu-west-1.convex.site';

async function submitSoloScoreOnline(entry) {
  try {
    await fetch(`${CONVEX_SITE_URL}/solo-scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
  } catch {
    // fire-and-forget, Fehler ignorieren
  }
}
```

- [ ] `CONVEX_SITE_URL` + `submitSoloScoreOnline()` nach Zeile 2 in `app.js` einfügen

### Schritt 2: Nach `saveHighscore()` aufrufen

Aktuelle Zeile 450 in `app.js`:
```js
saveHighscore({ name: G.p1, score: s1, maxScore: maxPossible, pct, rating: rating.title, rounds: G.rounds, date: new Date().toLocaleDateString('de-DE') });
```

Danach einfügen:
```js
submitSoloScoreOnline({ name: G.p1, score: s1, maxScore: maxPossible, pct, rating: rating.title, rounds: G.rounds, date: new Date().toISOString().slice(0,10) });
```

- [ ] `submitSoloScoreOnline(...)` call nach `saveHighscore(...)` in `showRes()` einfügen

- [ ] Committen:
```bash
git add app.js
git commit -m "feat: submit solo score to convex after game"
```

---

## Task 5: Leaderboard UI — Duo/Solo Tabs

**Files:**
- Modify: `index.html` (inline `<script>` Block, `showLeaderboard()` Funktion)
- Modify: `index.html` (Leaderboard-Screen HTML)

### Schritt 1: Leaderboard-Screen — Tab-Buttons hinzufügen

Den Leaderboard-Screen in `index.html` suchen (hat `id="s-leaderboard"`). Das `lb-list` div ist der Container. Vor `lb-list` Tab-Buttons einfügen.

Suche nach:
```html
<div id="lb-list"
```

Davor einfügen:
```html
<div class="flex gap-2 mb-4">
  <button id="lb-tab-duo" onclick="setLbTab('duo')" class="cat-tab active" data-tab="duo">Duo</button>
  <button id="lb-tab-solo" onclick="setLbTab('solo')" class="cat-tab" data-tab="solo">Solo</button>
</div>
```

- [ ] Tab-Buttons vor `lb-list` in den Leaderboard-Screen einfügen

### Schritt 2: `showLeaderboard()` und `setLbTab()` in `index.html` anpassen

Den aktuellen `showLeaderboard()` Block in `index.html` (Zeilen 800–832) **ersetzen** mit:

```js
let _lbTab = 'duo';

window.setLbTab = function(tab) {
  _lbTab = tab;
  document.querySelectorAll('#lb-tab-duo, #lb-tab-solo').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === tab)
  );
  renderLbList();
};

async function renderLbList() {
  const list = document.getElementById('lb-list');
  list.innerHTML = '<div class="font-condensed text-c-muted text-sm text-center py-8">Lädt…</div>';

  try {
    const endpoint = _lbTab === 'solo' ? '/solo-scores' : '/leaderboard';
    const res = await fetch(`${CONVEX_SITE_URL}${endpoint}`);
    const data = await res.json();

    if (!data.length) {
      list.innerHTML = '<div class="font-condensed text-c-muted text-sm text-center py-8">Noch keine Einträge</div>';
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];

    if (_lbTab === 'solo') {
      list.innerHTML = data.map((p, i) => `
        <div class="flex items-center gap-3 bg-c-card border border-c-border rounded-2xl px-4 py-3">
          <div class="font-display text-xl w-8 text-center">${medals[i] ?? '#' + (i + 1)}</div>
          <div class="flex-1 min-w-0">
            <div class="font-display text-base font-bold text-c-text truncate">${p.name}</div>
            <div class="font-condensed text-xs text-c-muted uppercase tracking-wide">${p.rating} · ${p.rounds} Runden</div>
          </div>
          <div class="text-right">
            <div class="font-display text-xl font-bold text-c-gold">${p.pct}%</div>
            <div class="font-condensed text-xs text-c-muted">${p.score} Pkt</div>
          </div>
        </div>
      `).join('');
    } else {
      list.innerHTML = data.map((p, i) => `
        <div class="flex items-center gap-3 bg-c-card border border-c-border rounded-2xl px-4 py-3">
          <div class="font-display text-xl w-8 text-center">${medals[i] ?? '#' + (i + 1)}</div>
          <div class="flex-1 min-w-0">
            <div class="font-display text-base font-bold text-c-text truncate">${p.name}</div>
            <div class="font-condensed text-xs text-c-muted uppercase tracking-wide">${p.games} Spiele</div>
          </div>
          <div class="text-right">
            <div class="font-display text-xl font-bold text-c-gold">${p.wins}</div>
            <div class="font-condensed text-xs text-c-muted">Siege</div>
          </div>
        </div>
      `).join('');
    }
  } catch {
    list.innerHTML = '<div class="font-condensed text-c-muted text-sm text-center py-8">Fehler beim Laden</div>';
  }
}

async function showLeaderboard() {
  makeFilmstrip('filmstrip-lb');
  show('s-leaderboard');
  _lbTab = 'duo';
  document.querySelectorAll('#lb-tab-duo, #lb-tab-solo').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === 'duo')
  );
  await renderLbList();
}
```

- [ ] `showLeaderboard()` + neue Funktionen in `index.html` ersetzen

### Schritt 3: Manuell testen

- Solo-Spiel komplett durchspielen
- Netzwerk-Tab im Browser: POST an `formal-bee-819.eu-west-1.convex.site/solo-scores` → Status 200
- Rangliste öffnen → "Solo"-Tab klicken → eigener Score erscheint

- [ ] Testen

- [ ] Committen und pushen:
```bash
git add index.html app.js
git commit -m "feat: solo online leaderboard with duo/solo tabs"
git push
```

---

## Self-Review

1. **Spec coverage:** Solo-Score nach Spielende speichern ✓, globale Rangliste anzeigen ✓, Duo-Rangliste bleibt erhalten ✓
2. **Placeholder-Scan:** Keine TBDs, alle Code-Blöcke vollständig
3. **Type consistency:** `submitSoloScoreOnline` übergibt `{ name, score, maxScore, pct, rating, rounds, date }` — passt zu `soloScores.submit` args ✓
4. **Kein Login nötig:** Anonyme Submissions via Name ✓

---

## Hinweis: Convex deploy

Nach Task 3 muss `npx convex deploy` lokal ausgeführt werden bevor die HTTP-Routen live gehen. Das ist zwingend notwendig damit `/solo-scores` erreichbar ist.
