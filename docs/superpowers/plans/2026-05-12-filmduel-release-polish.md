# FilmDuel Release Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cinematic UX-Polish (Film-Grain, Mikro-Animationen, dramatischer Ergebnis-Screen) + Film-Identitätssystem (Persönlichkeit, Mastery, Badges) für mehr Mundpropaganda und Wiederkehrrate.

**Architecture:** Neues `identity.js` ES-Modul mit reinen Funktionen und localStorage-Persistenz. `app.js` importiert es und ruft `updateAfterGame()` am Anfang von `showRes()` auf. CSS-Ergänzungen in `index.html`. Alle Identity-Features sind Solo-only in Phase 1 (kein Convex-Schema nötig).

**Tech Stack:** Vanilla ES6 Modules, Tailwind CDN (Custom Keyframes), CSS Custom Properties (für Partikel-Burst), localStorage, SVG-Filter (Film-Grain), `requestAnimationFrame` (Score-Countdown)

---

## File Structure

```
filmduel/
├── identity.js                   NEU — Film-Identity-Engine (Mastery, Badges, Persönlichkeit)
├── app.js                        MODIFY — Import identity.js; ansQ(), startTimer(), showRes()
└── index.html                    MODIFY — CSS (Grain, Burst, Glow), s-start Overlay, s-result HTML
```

**Wichtige Zeilen-Referenzen:**
- `app.js:2` — Imports
- `app.js:3-4` — `window.QPR`, `window.TSEC` (vor diesen die Hilfsfunktion einfügen)
- `app.js:266-285` — `startTimer()`
- `app.js:287-331` — `ansQ()`
- `app.js:321-323` — Button-Klassen setzen (correct/wrong)
- `app.js:386-514` — `showRes()`
- `app.js:397` — `const soloHistory = G.history.filter(h => h.p === 1);`
- `index.html:13` — `<title>` (SVG-Filter davor einfügen)
- `index.html:64-190` — `<style>`-Block (CSS anhängen)
- `index.html:413` — `<div id="s-start" ...>`
- `index.html:414` — Erste Zeile in s-start (Grain-Overlay danach)
- `index.html:748-768` — `solo-stats` Block
- `index.html:770` — `<!-- Highscores -->` (Identity-Block davor einfügen)

---

### Task 1: identity.js — Grundstruktur, Konstanten & localStorage

**Files:**
- Create: `identity.js`

- [ ] **Step 1: Datei anlegen** mit Konstanten und localStorage-Helpers

```js
// identity.js

const MASTERY_LEVELS = [
  { min: 0,  title: 'Zuschauer' },
  { min: 3,  title: 'Anfänger' },
  { min: 6,  title: 'Kenner' },
  { min: 10, title: 'Kritiker' },
  { min: 15, title: 'Meister' },
  { min: 25, title: 'Legende' },
];

const PERSONALITY_TYPES = [
  { id: 'arthouse',    label: 'Arthouse-Aficionado', cats: ['arthouse','world','noir','directors'] },
  { id: 'blockbuster', label: 'Blockbuster-König',   cats: ['superhero','scifi','comedy','nineties'] },
  { id: 'series',      label: 'Serienjunkie',        cats: ['series'] },
  { id: 'horror',      label: 'Horror-Kenner',       cats: ['horror'] },
  { id: 'history',     label: 'Filmgeschichte-Nerd', cats: ['directors','tech','oscars','german'] },
  { id: 'guilty',      label: 'Guilty-Pleasure-Fan', cats: ['comedy','musical','animation','cult'] },
  { id: 'worldcinema', label: 'Weltkinofan',         cats: ['world','arthouse','worldcinema'] },
];

const BADGE_DEFS = [
  { id: 'erster_duel',       emoji: '🎬', label: 'Erster Duel',       check: (s)    => s.gamesPlayed >= 1 },
  { id: 'streak_master',     emoji: '🔥', label: 'Streak Master',     check: (s)    => s.bestStreak >= 5 },
  { id: 'kategorien_kenner', emoji: '🗺️', label: 'Kategorien-Kenner', check: (s, m) => Object.keys(m).length >= 18 },
  { id: 'speed_demon',       emoji: '⚡', label: 'Speed-Demon',       check: (s)    => s.maxFastInGame >= 5 },
  { id: 'perfectionist',     emoji: '💎', label: 'Perfectionist',     check: (s)    => s.hadPerfectGame },
];

const DEFAULT_STATS = {
  gamesPlayed: 0, totalCorrect: 0, bestStreak: 0,
  badges: [], maxFastInGame: 0, hadPerfectGame: false,
};

function safeGet(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function safeSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function loadMastery() { return safeGet('filmduel_mastery', {}); }
function saveMastery(m) { safeSet('filmduel_mastery', m); }
function loadStats()   { return { ...DEFAULT_STATS, ...safeGet('filmduel_stats', {}) }; }
function saveStats(s)  { safeSet('filmduel_stats', s); }
```

- [ ] **Step 2: Im Browser-Console prüfen** (nach `npx serve .` im Projektordner)

Öffne `http://localhost:3000` → DevTools → Console:
```js
localStorage.setItem('filmduel_mastery', JSON.stringify({ arthouse: { correct: 5, played: 8 } }));
// Dann Seite neu laden und prüfen:
JSON.parse(localStorage.getItem('filmduel_mastery'));
// Erwartet: { arthouse: { correct: 5, played: 8 } }
```

- [ ] **Step 3: Commit**
```bash
cd "/Users/maurice/Antigravity_Projekts/Film Duell/filmduel"
git add identity.js
git commit -m "feat(identity): Grundstruktur — Konstanten und localStorage-Helpers"
```

---

### Task 2: getMasteryInfo

**Files:**
- Modify: `identity.js` (anhängen)

- [ ] **Step 1: getMasteryInfo exportieren** — am Ende von identity.js einfügen

```js
export function getMasteryInfo(totalCorrect) {
  let level = 0;
  for (let i = 0; i < MASTERY_LEVELS.length; i++) {
    if (totalCorrect >= MASTERY_LEVELS[i].min) level = i;
  }
  const title   = MASTERY_LEVELS[level].title;
  const isMax   = level === MASTERY_LEVELS.length - 1;
  const nextMin = isMax ? MASTERY_LEVELS[level].min : MASTERY_LEVELS[level + 1].min;
  const prevMin = MASTERY_LEVELS[level].min;
  const progress = isMax ? 100 : Math.round(((totalCorrect - prevMin) / (nextMin - prevMin)) * 100);
  return { level, title, progress };
}
```

- [ ] **Step 2: Erwartete Rückgabewerte notieren** (zum späteren Nachschlagen)

```
getMasteryInfo(0)  → { level: 0, title: 'Zuschauer', progress: 0 }
getMasteryInfo(3)  → { level: 1, title: 'Anfänger',  progress: 0 }
getMasteryInfo(4)  → { level: 1, title: 'Anfänger',  progress: 33 }
getMasteryInfo(15) → { level: 4, title: 'Meister',   progress: 0 }
getMasteryInfo(25) → { level: 5, title: 'Legende',   progress: 100 }
```

- [ ] **Step 3: Commit**
```bash
git add identity.js
git commit -m "feat(identity): getMasteryInfo — Stufe und Fortschritt berechnen"
```

---

### Task 3: Mastery nach Partie updaten

**Files:**
- Modify: `identity.js` (vor den Exporten einfügen)

- [ ] **Step 1: updateMastery Funktion einfügen** — vor `export function getMasteryInfo` in identity.js

```js
function updateMastery(history) {
  const mastery = loadMastery();
  const catGroups = {};

  history.forEach(h => {
    if (!catGroups[h.cat]) catGroups[h.cat] = { correct: 0, played: 0 };
    catGroups[h.cat].played++;
    if (h.correct) catGroups[h.cat].correct++;
  });

  Object.entries(catGroups).forEach(([cat, data]) => {
    if (!mastery[cat]) mastery[cat] = { correct: 0, played: 0 };
    mastery[cat].correct += data.correct;
    mastery[cat].played  += data.played;
  });

  saveMastery(mastery);
  return { mastery, catGroups };
}
```

- [ ] **Step 2: Commit**
```bash
git add identity.js
git commit -m "feat(identity): updateMastery — Kategorie-Fortschritt nach Partie persistieren"
```

---

### Task 4: Badge-System

**Files:**
- Modify: `identity.js` (vor den Exporten einfügen)

- [ ] **Step 1: updateStats mit Badge-Check einfügen** — nach `updateMastery`, vor `export function getMasteryInfo`

```js
function updateStats(gameData, mastery) {
  const stats     = loadStats();
  const soloH     = gameData.history.filter(h => h.p === 1);
  const correct   = soloH.filter(h => h.correct).length;
  const played    = soloH.length;
  const fastCount = soloH.filter(h => h.correct && h.answerTime < 8).length;
  const perfect   = played > 0 && correct === played;

  stats.gamesPlayed++;
  stats.totalCorrect  += correct;
  stats.bestStreak     = Math.max(stats.bestStreak, gameData.bestStreak);
  stats.maxFastInGame  = Math.max(stats.maxFastInGame, fastCount);
  if (perfect) stats.hadPerfectGame = true;

  const prevBadges = new Set(stats.badges);
  const newBadges  = BADGE_DEFS.filter(b => !prevBadges.has(b.id) && b.check(stats, mastery));
  newBadges.forEach(b => stats.badges.push(b.id));
  saveStats(stats);
  return { stats, newBadges };
}
```

- [ ] **Step 2: Commit**
```bash
git add identity.js
git commit -m "feat(identity): updateStats + Badge-System"
```

---

### Task 5: Persönlichkeits-Algorithmus

**Files:**
- Modify: `identity.js` (vor den Exporten einfügen)

- [ ] **Step 1: computePersonality einfügen** — nach `updateStats`, vor `export function getMasteryInfo`

```js
function computePersonality(mastery) {
  const scores = {};

  PERSONALITY_TYPES.forEach(type => {
    let sum = 0, catCount = 0;
    type.cats.forEach(cat => {
      if (mastery[cat]?.played > 0) {
        sum += mastery[cat].correct / mastery[cat].played;
        catCount++;
      }
    });
    scores[type.id] = catCount >= Math.min(3, type.cats.length) ? sum : 0;
  });

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  if (!best || best[1] === 0) return 'Der Cineast';
  return PERSONALITY_TYPES.find(t => t.id === best[0])?.label ?? 'Der Cineast';
}
```

- [ ] **Step 2: Commit**
```bash
git add identity.js
git commit -m "feat(identity): computePersonality — Film-Archetyp aus Spielhistorie"
```

---

### Task 6: updateAfterGame — Haupt-Export + Film-IQ

**Files:**
- Modify: `identity.js` (als letzter Export anhängen)

- [ ] **Step 1: updateAfterGame am Ende von identity.js einfügen**

```js
export function updateAfterGame(gameData) {
  const { mastery, catGroups } = updateMastery(gameData.history);
  const { newBadges }          = updateStats(gameData, mastery);
  const personality            = computePersonality(mastery);

  const soloH = gameData.history.filter(h => h.p === 1);
  let filmIQ = 0;
  if (soloH.length > 0) {
    const correctPct    = soloH.filter(h => h.correct).length / soloH.length;
    const difficultyAvg = soloH.reduce((s, h) => s + (h.basePts || 1), 0) / soloH.length;
    const fastCount     = soloH.filter(h => h.correct && h.answerTime < 8).length;
    const speedBonus    = 1.0 + (fastCount / soloH.length) * 0.2;
    filmIQ = Math.min(100, Math.round(correctPct * (difficultyAvg / 3) * speedBonus * 100));
  }

  return { newBadges, personality, catGroups, filmIQ, mastery };
}
```

- [ ] **Step 2: Commit**
```bash
git add identity.js
git commit -m "feat(identity): updateAfterGame + Film-IQ-Formel — Haupt-Export fertig"
```

---

### Task 7: CSS — Film-Grain, Partikel-Burst, Timer-Glow

**Files:**
- Modify: `index.html:13` (SVG-Filter vor `<title>`)
- Modify: `index.html` CSS-Block (innerhalb von `<style>`, vor `</style>`)

- [ ] **Step 1: SVG-Filter einfügen** — in `index.html` direkt vor `<title>FilmDuel...`

```html
<svg style="display:none" aria-hidden="true">
  <defs>
    <filter id="film-grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
  </defs>
</svg>
```

- [ ] **Step 2: CSS am Ende des `<style>`-Blocks einfügen** (vor `</style>`, nach der letzten vorhandenen Regel)

```css
/* Film-Grain */
@keyframes grain {
  0%  { transform: translate(0,0) }
  25% { transform: translate(-1%,1%) }
  50% { transform: translate(1%,-1%) }
  75% { transform: translate(-1%,-1%) }
}
.film-grain {
  position: absolute; inset: 0;
  filter: url(#film-grain);
  opacity: 0.06;
  pointer-events: none;
  z-index: 1;
  animation: grain 0.4s steps(1) infinite;
}

/* Partikel-Burst */
@keyframes burst {
  0%   { transform: translate(0,0) scale(1); opacity: 1; }
  100% { transform: translate(var(--tx),var(--ty)) scale(0); opacity: 0; }
}
.particle {
  position: fixed;
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #e8c84a;
  pointer-events: none;
  z-index: 9999;
  animation: burst 0.55s cubic-bezier(0.16,1,0.3,1) forwards;
}

/* Timer-Glow */
.timer-glow { animation: glow 0.8s ease-in-out infinite; }
```

- [ ] **Step 3: Commit**
```bash
git add index.html
git commit -m "feat(ui): CSS für Film-Grain, Partikel-Burst und Timer-Glow"
```

---

### Task 8: Landing Screen — Film-Grain-Overlay

**Files:**
- Modify: `index.html:413` (`s-start` div + erste Kind-Zeile)

- [ ] **Step 1: `s-start` auf `position:relative` setzen und Overlay-Div einfügen**

`index.html:413` — Zeile ändern von:
```html
<div id="s-start" class="screen active">
  <div class="filmstrip" id="filmstrip-top"></div>
```
zu:
```html
<div id="s-start" class="screen active" style="position:relative;overflow:hidden">
  <div class="film-grain" aria-hidden="true"></div>
  <div class="filmstrip" id="filmstrip-top"></div>
```

- [ ] **Step 2: Im Browser prüfen**

`npx serve .` → `http://localhost:3000` → Landing Screen: subtiler Filmkorn-Effekt sichtbar, UI-Elemente weiterhin klar lesbar.

- [ ] **Step 3: Commit**
```bash
git add index.html
git commit -m "feat(ui): Film-Grain-Overlay auf Landing Screen"
```

---

### Task 9: Antwort-Animationen — Partikel-Burst, Shake & Timer-Glow

**Files:**
- Modify: `app.js:3` (Hilfsfunktion einfügen)
- Modify: `app.js:321-323` (ansQ, Button-Klassen-Block)
- Modify: `app.js:276` (startTimer, Timer-Farb-Zeile)

- [ ] **Step 1: `spawnParticleBurst` in app.js einfügen** — direkt vor `window.QPR = 3` (Zeile 4)

```js
function spawnParticleBurst(el) {
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top  + rect.height / 2;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const dist  = 45 + Math.random() * 20;
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = cx + 'px';
    p.style.top  = cy + 'px';
    p.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 600);
  }
}
```

- [ ] **Step 2: Button-Klassen-Block in ansQ() ersetzen** — `app.js:321-323`

Ersetze:
```js
  btns[cor].classList.add('correct');
  if (!isOk && el) el.classList.add('wrong');
```
durch:
```js
  btns[cor].classList.add('correct');
  if (isOk && el) {
    spawnParticleBurst(el);
  }
  if (!isOk && el) {
    el.classList.add('wrong');
    const grid = document.getElementById('ans-grid');
    grid.classList.add('animate-shake');
    setTimeout(() => grid.classList.remove('animate-shake'), 400);
  }
```

- [ ] **Step 3: Timer-Glow in startTimer() aktivieren** — `app.js:276`

Ersetze:
```js
    if (G.timeLeft <= 5) tf.className = 'timer-fill bg-c-red';
```
durch:
```js
    if (G.timeLeft <= 5) tf.className = 'timer-fill bg-c-red timer-glow';
```

- [ ] **Step 4: Im Browser testen**

`npx serve .` → Solo → Frage:
- Richtige Antwort → 8 goldene Partikel explodieren vom Button-Mittelpunkt
- Falsche Antwort → Antwort-Container shakt horizontal
- Timer ≤5 Sek → Timer-Bar pulsiert rot

- [ ] **Step 5: Commit**
```bash
git add app.js
git commit -m "feat(ui): Partikel-Burst (richtig), Shake (falsch), Timer-Glow (<5s)"
```

---

### Task 10: Ergebnis-Screen HTML — Identity-Block

**Files:**
- Modify: `index.html:770` (vor `<!-- Highscores -->`)

- [ ] **Step 1: Identity-Block HTML einfügen** — direkt vor `<!-- Highscores -->` (index.html:770)

```html
    <!-- Identity Block (Solo only, via JS befüllt) -->
    <div id="identity-block" style="display:none" class="flex flex-col gap-3">
      <!-- Film-IQ -->
      <div class="bg-c-card border border-c-border rounded-2xl p-5 animate-up" style="animation-delay:140ms">
        <div class="font-condensed text-xs uppercase tracking-widest text-c-muted mb-1">Film-IQ</div>
        <div class="flex items-end gap-2">
          <span id="film-iq-value" class="font-display text-5xl font-bold text-c-gold">0</span>
          <span class="font-condensed text-c-muted text-sm mb-1.5">/ 100</span>
        </div>
      </div>
      <!-- Persönlichkeit -->
      <div class="bg-c-card border border-c-border rounded-2xl p-5 animate-up" style="animation-delay:180ms">
        <div class="font-condensed text-xs uppercase tracking-widest text-c-muted mb-1">Deine Film-Persönlichkeit</div>
        <div id="personality-value" class="font-display text-2xl font-bold text-c-gold"></div>
      </div>
      <!-- Mastery Bar -->
      <div class="bg-c-card border border-c-border rounded-2xl p-5 animate-up" style="animation-delay:220ms">
        <div class="flex justify-between items-center mb-2">
          <div id="mastery-cat-name" class="font-display text-sm font-bold"></div>
          <div id="mastery-title" class="font-condensed text-xs font-semibold text-c-gold"></div>
        </div>
        <div class="timer-track">
          <div id="mastery-bar" class="timer-fill bg-c-gold" style="width:0%;transition:width 0.9s cubic-bezier(0.16,1,0.3,1)"></div>
        </div>
        <div id="mastery-next-label" class="font-condensed text-xs text-c-muted mt-1.5"></div>
      </div>
      <!-- Neue Badges -->
      <div id="new-badges-block" style="display:none" class="flex flex-col gap-2"></div>
    </div>
```

- [ ] **Step 2: Commit**
```bash
git add index.html
git commit -m "feat(ui): Identity-Block HTML im Ergebnis-Screen"
```

---

### Task 11: identity.js importieren + showRes() verdrahten

**Files:**
- Modify: `app.js:2` (Import-Zeile)
- Modify: `app.js:397` (Anfang des `if (G.solo)` Blocks in showRes)

- [ ] **Step 1: Import in app.js ergänzen** — Zeile 2 (nach `import { CATS, Q } from './categories.js';`)

```js
import { updateAfterGame, getMasteryInfo } from './identity.js';
```

- [ ] **Step 2: Identity-Block in showRes() befüllen** — nach `const soloHistory = G.history.filter(h => h.p === 1);` (app.js:398) einfügen, als erster Block im `if (G.solo)` Zweig

```js
    // Identity-Daten berechnen und in UI eintragen
    const identity = updateAfterGame({ history: G.history, bestStreak: G.bestStreak });
    const identityBlock = document.getElementById('identity-block');
    if (identityBlock) {
      identityBlock.style.display = 'flex';

      // Film-IQ count-up
      const iqEl = document.getElementById('film-iq-value');
      if (iqEl) {
        const target = identity.filmIQ;
        const start  = performance.now();
        const tick   = (now) => {
          const pct = Math.min((now - start) / 500, 1);
          iqEl.textContent = Math.round(pct * target);
          if (pct < 1) requestAnimationFrame(tick);
        };
        setTimeout(() => requestAnimationFrame(tick), 350);
      }

      // Persönlichkeit
      const persEl = document.getElementById('personality-value');
      if (persEl) persEl.textContent = identity.personality;

      // Mastery Bar — letzte gespielte Kategorie
      const lastCat = soloHistory[soloHistory.length - 1]?.cat;
      if (lastCat && identity.mastery[lastCat]) {
        const catObj     = CATS.find(c => c.id === lastCat);
        const totalCorr  = identity.mastery[lastCat].correct;
        const { title, progress } = getMasteryInfo(totalCorr);
        const catNameEl  = document.getElementById('mastery-cat-name');
        const titleEl    = document.getElementById('mastery-title');
        const barEl      = document.getElementById('mastery-bar');
        const nextLabelEl = document.getElementById('mastery-next-label');
        if (catNameEl && catObj) { catNameEl.textContent = catObj.label; catNameEl.style.color = catObj.color; }
        if (titleEl)    titleEl.textContent = title;
        if (nextLabelEl) nextLabelEl.textContent = progress < 100 ? `${totalCorr} richtige Antworten insgesamt` : 'Maximalstufe erreicht 🏆';
        if (barEl)      setTimeout(() => { barEl.style.width = `${progress}%`; }, 500);
      }

      // Neue Badges
      if (identity.newBadges.length > 0) {
        const badgesBlock = document.getElementById('new-badges-block');
        if (badgesBlock) {
          badgesBlock.style.display = 'flex';
          badgesBlock.innerHTML = identity.newBadges.map(b => `
            <div class="bg-c-card border border-c-gold rounded-xl p-4 flex items-center gap-3 animate-pop">
              <span class="text-2xl">${b.emoji}</span>
              <div>
                <div class="font-condensed text-xs uppercase tracking-widest text-c-muted">Neues Badge freigeschaltet</div>
                <div class="font-display font-bold text-c-gold">${b.label}</div>
              </div>
            </div>
          `).join('');
        }
      }
    }
```

- [ ] **Step 3: Im Browser vollständig testen**

`npx serve .` → Solo-Spiel, 3 Runden, mind. eine Kategorie mehrfach spielen:
1. Ergebnis-Screen lädt ohne JS-Fehler (DevTools Console)
2. Film-IQ zählt von 0 hoch (0–100 Bereich plausibel)
3. Persönlichkeit wird angezeigt (bei wenig Spielen: "Der Cineast")
4. Mastery-Bar füllt sich nach 500ms
5. Nach erster Partie: "Erster Duel" 🎬 Badge erscheint

- [ ] **Step 4: Commit**
```bash
git add app.js
git commit -m "feat(identity): updateAfterGame in showRes() — Film-IQ, Persönlichkeit, Mastery, Badges"
```

---

## Self-Review Checkliste (vor Abschluss)

- [ ] `spawnParticleBurst` ist vor seiner Verwendung in `ansQ` definiert ✓
- [ ] `import { updateAfterGame, getMasteryInfo }` — beide Funktionen sind in identity.js exportiert ✓
- [ ] `identity.newBadges` ist immer ein Array (nie `undefined`) — `updateStats` gibt `[]` zurück wenn keine neuen Badges ✓
- [ ] `identity.mastery[lastCat]` Guard vor dem Mastery-Block ✓
- [ ] `animate-shake` Tailwind-Klasse: in `tailwind.config` ist `shake` definiert → `animate-shake` wird generiert ✓
- [ ] Film-Grain `position:absolute` braucht `position:relative` auf `s-start` → explizit als inline-style gesetzt ✓
- [ ] localStorage-Schreibfehler (Private Mode) werden in `safeSet` silent gefangen ✓
- [ ] Identity-Block nur für Solo (`if (G.solo)`) — Duo-Modus bleibt unberührt ✓
