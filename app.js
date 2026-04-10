// app.js
import { CATS, Q } from './categories.js';

window.QPR = 3;
window.TSEC = 20;

const CAT_FILTER = {
  all:  null,
  film: ['arthouse','directors','world','noir','cult','tech','horror','indie','oscars','german','comedy','scifi','nineties','worldcinema','animation'],
  more: ['series','superhero','musical'],
};
let _activeCatTab = 'all';

export let G = {
  p1:'', p2:'',
  rounds: 5,
  round: 1,
  player: 1,
  scores: {1:0, 2:0},
  rndPts: {1:0, 2:0},
  usedCats: {1:[], 2:[]},
  selCat: null,
  qs: [],
  qi: 0,
  answered: false,
  timer: null,
  timeLeft: window.TSEC,
  history: [],
  solo: false,
  streak: 0,
  bestStreak: 0,
};

export function show(id, dir = 'forward') {
  document.querySelectorAll('.screen').forEach(s =>
    s.classList.remove('active', 'screen-enter', 'screen-enter-back')
  );
  const next = document.getElementById(id);
  next.classList.add('active');
  if (dir !== 'none') {
    const cls = dir === 'back' ? 'screen-enter-back' : 'screen-enter';
    next.classList.add(cls);
    setTimeout(() => next.classList.remove(cls), 350);
  }
  window.scrollTo(0, 0);
}

export function pname(n) { return n===1 ? G.p1 : G.p2; }

export function shuffle(arr) {
  const a = [...arr];
  for (let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}

export function makeFilmstrip(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = '';
  for (let i = 0; i < 30; i++) {
    const h = document.createElement('div');
    h.className = 'filmstrip-hole';
    el.appendChild(h);
  }
}

// show + makeFilmstrip global verfügbar (wird von online.js genutzt)
window.show = show;
window.makeFilmstrip = makeFilmstrip;

// ═══════════════════════════════════════
// LOCAL GAME LOGIC (Pass the Phone)
// ═══════════════════════════════════════
window.setRounds = function(n) {
  G.rounds = n;
  document.querySelectorAll('[data-r]').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.r) === n);
  });
};

window.setSoloRounds = function(n) {
  G.rounds = n;
  document.querySelectorAll('[data-sr]').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.sr) === n);
  });
};

window.startSolo = function() {
  G.p1 = document.getElementById('solo-p1').value.trim() || 'Spieler';
  G.p2 = '';
  G.scores = {1:0, 2:0};
  G.usedCats = {1:[], 2:[]};
  G.round = 1;
  G.player = 1;
  G.history = [];
  G.solo = true;
  G.streak = 0;
  G.bestStreak = 0;
  showCat();
};

window.startGame = function() {
  G.p1 = document.getElementById('p1').value.trim() || 'Spieler 1';
  G.p2 = document.getElementById('p2').value.trim() || 'Spieler 2';
  G.scores = {1:0, 2:0};
  G.usedCats = {1:[], 2:[]};
  G.round = 1;
  G.player = 1;
  G.history = [];
  G.solo = false;
  G.streak = 0;
  G.bestStreak = 0;
  showCat();
};

window.showCat = function() {
  G.selCat = null;
  G.rndPts[G.player] = 0;
  makeFilmstrip('filmstrip-cat');

  document.getElementById('cat-round').textContent = `Runde ${G.round} von ${G.rounds}`;
  document.getElementById('cat-player').textContent = pname(G.player).toUpperCase();

  if (G.solo) {
    document.getElementById('score-pill').style.display = 'none';
    document.getElementById('solo-score-pill').style.display = 'block';
    document.getElementById('solo-score-val').textContent = G.scores[1];
  } else {
    document.getElementById('score-pill').style.display = 'block';
    document.getElementById('solo-score-pill').style.display = 'none';
    const s1 = G.scores[1], s2 = G.scores[2];
    const tot = s1 + s2 || 2;
    const pct = ((s1 / tot) * 100).toFixed(1);
    document.getElementById('s-p1-name').textContent = G.p1;
    document.getElementById('s-p2-name').textContent = G.p2;
    document.getElementById('s-p1-val').textContent = s1;
    document.getElementById('s-p2-val').textContent = s2;
    document.getElementById('s-bar').style.width = `${pct}%`;
  }

  _activeCatTab = 'all';
  document.querySelectorAll('.cat-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === 'all')
  );
  renderCatGrid();

  document.getElementById('cat-btn').disabled = true;
  show('s-cat');
};

function renderCatGrid() {
  const filter = CAT_FILTER[_activeCatTab];
  const grid = document.getElementById('cat-grid');
  grid.innerHTML = '';
  CATS.forEach(cat => {
    if (filter && !filter.includes(cat.id)) return;
    const used = G.usedCats[1].includes(cat.id) || G.usedCats[2].includes(cat.id);
    const d = document.createElement('div');
    d.className = 'cat-card' + (used ? ' used' : '') + (G.selCat === cat.id ? ' selected' : '');
    d.style.setProperty('--cat-color', cat.color);
    d.innerHTML = `<div class="cat-abbr">${cat.abbr}</div><div class="cat-label">${cat.label}</div>`;
    if (!used) d.onclick = () => window.selCat(cat.id, d);
    grid.appendChild(d);
  });
}

window.setCatTab = function(tab) {
  _activeCatTab = tab;
  G.selCat = null;
  document.getElementById('cat-btn').disabled = true;
  document.querySelectorAll('.cat-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === tab)
  );
  renderCatGrid();
};

window.selCat = function(id, el) {
  document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  G.selCat = id;
  document.getElementById('cat-btn').disabled = false;
};

window.confirmCat = function() {
  if (!G.selCat) return;
  G.usedCats[G.player].push(G.selCat);
  const pool = shuffle(Q[G.selCat]);
  G.qs = pool.slice(0, window.QPR).map(q => {
    const qsc = shuffle(q.a);
    return { ...q, arr: qsc, corIdx: qsc.indexOf(q.a[q.c]) };
  });
  G.qi = 0;
  makeFilmstrip('filmstrip-q');
  showQ();
};

window.showQ = function() {
  G.answered = false;
  const q = G.qs[G.qi];
  document.getElementById('q-round').textContent = `Runde ${G.round} — Frage ${G.qi + 1}`;
  document.getElementById('q-player').textContent = pname(G.player).toUpperCase();

  const catObj = CATS.find(c => c.id === G.selCat);

  // Progress dots
  const progEl = document.getElementById('q-progress');
  progEl.style.setProperty('--prog-color', catObj.color);
  progEl.innerHTML = Array.from({ length: window.QPR }, (_, i) => {
    const cls = i < G.qi ? 'done' : i === G.qi ? 'active' : '';
    return `<div class="prog-dot ${cls}"></div>`;
  }).join('');

  const badge = document.getElementById('q-cat-badge');
  badge.textContent = catObj.label;
  badge.style.color = catObj.color;
  badge.style.borderColor = catObj.color;

  document.getElementById('diff-1').className = 'diff-dot on';
  document.getElementById('diff-2').className = 'diff-dot' + (q.d >= 2 ? ' on' : '');
  document.getElementById('diff-3').className = 'diff-dot' + (q.d === 3 ? ' on' : '');
  document.getElementById('diff-label').textContent = ['Leicht', 'Mittel', 'Schwer'][q.d - 1];

  document.getElementById('q-text').textContent = q.q;

  const grid = document.getElementById('ans-grid');
  grid.innerHTML = '';
  q.arr.forEach((ans, i) => {
    const b = document.createElement('div');
    b.className = 'btn-ans';
    b.innerHTML = `<div class="letter">${['A','B','C','D'][i]}</div><div class="flex-1 text-[17px] leading-snug font-medium pb-0.5">${ans}</div>`;
    b.onclick = () => window.ansQ(i, b);
    grid.appendChild(b);
  });

  document.getElementById('timer-fill').style.width = '100%';
  document.getElementById('timer-num').textContent = window.TSEC;
  document.getElementById('fact-box').classList.remove('show');
  document.getElementById('next-btn').style.display = 'none';

  show('s-q');
  startTimer();
  updateStreakBadge();
};

function updateStreakBadge() {
  const badge = document.getElementById('streak-badge');
  if (!badge) return;
  if (G.streak >= 3) {
    badge.textContent = `🔥 ${G.streak}x`;
    badge.style.display = 'block';
  } else {
    badge.style.display = 'none';
  }
}

function startTimer() {
  clearInterval(G.timer);
  G.timeLeft = window.TSEC;
  const tf = document.getElementById('timer-fill');
  const tn = document.getElementById('timer-num');
  
  G.timer = setInterval(() => {
    G.timeLeft--;
    tn.textContent = G.timeLeft;
    tf.style.width = `${(G.timeLeft / window.TSEC) * 100}%`;
    if (G.timeLeft <= 5) tf.className = 'timer-fill bg-c-red';
    else if (G.timeLeft <= 10) tf.className = 'timer-fill bg-c-orange';
    else tf.className = 'timer-fill bg-c-gold';

    if (G.timeLeft <= 0) {
      clearInterval(G.timer);
      window.ansQ(-1, null);
    }
  }, 1000);
}

window.ansQ = function(idx, el) {
  if (G.answered) return;
  G.answered = true;
  clearInterval(G.timer);
  const q = G.qs[G.qi];
  const cor = q.corIdx;
  const isOk = idx === cor;
  const answerTime = window.TSEC - G.timeLeft;
  const basePts = q.d || 1;
  const timeBonus = (isOk && answerTime < 8) ? 1 : 0;
  const pts = isOk ? basePts + timeBonus : 0;

  if (isOk) {
    G.rndPts[G.player] += pts;
    G.streak++;
    if (G.streak > G.bestStreak) G.bestStreak = G.streak;
  } else {
    G.streak = 0;
  }

  updateStreakBadge();

  G.history.push({
    p: G.player,
    r: G.round,
    cat: G.selCat,
    qi: G.qi,
    pts,
    basePts,
    timeBonus,
    answerTime,
    correct: isOk
  });

  const btns = document.querySelectorAll('.btn-ans');
  btns[cor].classList.add('correct');
  if (!isOk && el) el.classList.add('wrong');

  const fb = document.getElementById('fact-box');
  if (q.f) {
    fb.innerHTML = `<strong>Wusstest du?</strong><br>${q.f}`;
    fb.classList.add('show');
  }

  document.getElementById('next-btn').style.display = 'block';
};

window.nextQ = function() {
  G.qi++;
  if (G.qi < window.QPR) {
    window.showQ();
  } else {
    G.scores[G.player] += G.rndPts[G.player];

    if (G.solo) {
      G.round++;
      if (G.round > G.rounds) {
        showRes();
      } else {
        showCat();
      }
    } else if (G.player === 1) {
      G.player = 2;
      showHand();
    } else {
      G.player = 1;
      G.round++;
      if (G.round > G.rounds) {
        showRes();
      } else {
        showHand();
      }
    }
  }
};

window.showHand = function() {
  document.getElementById('hand-pts').textContent = `+${G.rndPts[G.player === 1 ? 2 : 1]}`;
  const hs = document.getElementById('hand-scores');
  hs.innerHTML = `
    <div class="flex justify-between items-center text-lg"><span class="text-c-text font-medium">${G.p1}</span><span class="font-display font-bold text-c-gold">${G.scores[1]}</span></div>
    <div class="flex justify-between items-center text-lg"><span class="text-c-text font-medium">${G.p2}</span><span class="font-display font-bold text-c-gold">${G.scores[2]}</span></div>
  `;
  document.getElementById('hand-next').textContent = pname(G.player).toUpperCase();
  show('s-hand');
};

window.handConfirm = function() {
  showCat();
};

function soloRating(pct) {
  if (pct >= 90) return { title: 'FILMKRITIKER-LEGENDE', icon: '🏆' };
  if (pct >= 75) return { title: 'CINEAST', icon: '🎬' };
  if (pct >= 55) return { title: 'KINOFAN', icon: '🎥' };
  if (pct >= 35) return { title: 'GELEGENHEITSZUSCHAUER', icon: '🍿' };
  return { title: 'FILMSTUDENT', icon: '📽️' };
}

window.showRes = function() {
  makeFilmstrip('filmstrip-r');
  const soloStatsEl = document.getElementById('solo-stats');
  const soloHSEl = document.getElementById('solo-highscores');
  if (soloStatsEl) soloStatsEl.style.display = 'none';
  if (soloHSEl) soloHSEl.style.display = 'none';
  const s1 = G.scores[1], s2 = G.scores[2];

  const rs = document.getElementById('res-scores');
  const rc = document.getElementById('res-cats');

  if (G.solo) {
    const soloHistory = G.history.filter(h => h.p === 1);
    const maxPossible = soloHistory.reduce((sum, h) => sum + h.basePts + 1, 0) || 1;
    const pct = Math.round((s1 / maxPossible) * 100);
    const rating = soloRating(pct);

    document.getElementById('res-winner').textContent = rating.title + ' ' + rating.icon;

    rs.innerHTML = `
      <div class="bg-c-card border border-c-gold rounded-2xl p-5 flex flex-col items-center gap-2">
        <span class="font-condensed text-xs uppercase tracking-widest text-c-muted">${G.p1}</span>
        <span class="font-display text-6xl font-bold text-c-gold">${s1}</span>
        <span class="font-condensed text-c-muted text-sm">${s1} von ${maxPossible} Punkten (${pct}%)</span>
      </div>
    `;

    rc.innerHTML = '';
    const roundRows = [];
    for (let r = 1; r <= G.rounds; r++) {
      const rEntries = soloHistory.filter(h => h.r === r);
      if (!rEntries.length) continue;
      const cat = CATS.find(c => c.id === rEntries[0].cat);
      const rPts = rEntries.reduce((s, h) => s + h.pts, 0);
      const rMax = rEntries.reduce((s, h) => s + h.basePts + 1, 0);
      roundRows.push(`
        <div class="flex items-center justify-between text-sm py-1.5 border-b border-c-border last:border-0">
          <div class="flex items-center gap-2">
            <div class="font-condensed text-xs text-c-faint w-5">R${r}</div>
            <span class="font-condensed font-semibold uppercase tracking-wide" style="color:${cat.color}">${cat.label}</span>
          </div>
          <span class="font-display font-bold text-c-gold">${rPts} / ${rMax}</span>
        </div>
      `);
    }
    rc.innerHTML = roundRows.join('');

    const catStats = {};
    soloHistory.forEach(h => {
      if (!catStats[h.cat]) catStats[h.cat] = { pts: 0, maxPts: 0 };
      catStats[h.cat].pts += h.pts;
      catStats[h.cat].maxPts += h.basePts + 1;
    });
    const bestCatId = Object.entries(catStats)
      .sort((a, b) => (b[1].pts / b[1].maxPts) - (a[1].pts / a[1].maxPts))[0]?.[0];
    const bestCat = CATS.find(c => c.id === bestCatId);
    const avgTime = soloHistory.length
      ? Math.round(soloHistory.reduce((s, h) => s + h.answerTime, 0) / soloHistory.length)
      : 0;
    const timeBonusCount = soloHistory.filter(h => h.timeBonus === 1).length;

    const statBestCat = document.getElementById('stat-best-cat');
    if (statBestCat) {
      statBestCat.textContent = bestCat ? bestCat.label : '–';
      if (bestCat) statBestCat.style.color = bestCat.color;
    }
    const statAvgTime = document.getElementById('stat-avg-time');
    if (statAvgTime) statAvgTime.textContent = `${avgTime}s`;
    const statStreak = document.getElementById('stat-streak');
    if (statStreak) statStreak.textContent = G.bestStreak > 0 ? `🔥 ${G.bestStreak}x` : '–';
    const statBonuses = document.getElementById('stat-bonuses');
    if (statBonuses) statBonuses.textContent = `⚡ ${timeBonusCount}`;
    if (soloStatsEl) soloStatsEl.style.display = 'flex';

    saveHighscore({ name: G.p1, score: s1, maxScore: maxPossible, pct, rating: rating.title, rounds: G.rounds, date: new Date().toLocaleDateString('de-DE') });
    const scores = loadHighscores();
    if (soloHSEl) soloHSEl.style.display = 'flex';
    const hsList = document.getElementById('highscores-list');
    if (hsList) hsList.innerHTML = scores.map((sc, i) => `
      <div class="flex items-center justify-between text-sm py-1 border-b border-c-border last:border-0">
        <div class="flex items-center gap-2">
          <span class="font-condensed text-xs text-c-faint w-4">${i + 1}.</span>
          <span class="font-medium">${sc.name}</span>
          <span class="font-condensed text-xs text-c-muted">${sc.rating}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="font-condensed text-xs text-c-muted">${sc.date}</span>
          <span class="font-display font-bold text-c-gold">${sc.pct}%</span>
        </div>
      </div>
    `).join('');

  } else {
    let w = 'UNENTSCHIEDEN';
    if (s1 > s2) w = `${G.p1} GEWINNT`;
    if (s2 > s1) w = `${G.p2} GEWINNT`;
    document.getElementById('res-winner').textContent = w.toUpperCase();

    rs.innerHTML = `
      <div class="bg-c-card border ${s1>s2?'border-c-gold':'border-c-border'} rounded-2xl p-4 flex justify-between items-center">
        <span class="font-display text-2xl">${G.p1}</span>
        <span class="font-display text-4xl font-bold text-c-gold">${s1}</span>
      </div>
      <div class="bg-c-card border ${s2>s1?'border-c-gold':'border-c-border'} rounded-2xl p-4 flex justify-between items-center">
        <span class="font-display text-2xl">${G.p2}</span>
        <span class="font-display text-4xl font-bold text-c-gold">${s2}</span>
      </div>
    `;

    rc.innerHTML = '';
    const rows = [];
    for (let r=1; r<=G.rounds; r++) {
      const r1 = G.history.find(h => h.p === 1 && h.r === r);
      const r2 = G.history.find(h => h.p === 2 && h.r === r);
      if (!r1 || !r2) continue;
      const c1 = CATS.find(c => c.id === r1.cat);
      const c2 = CATS.find(c => c.id === r2.cat);
      rows.push(`
        <div class="flex items-center text-sm py-1.5 border-b border-c-border last:border-0">
          <div class="flex-1 text-right pr-3 font-medium" style="color:${c1.color}">${c1.abbr}&nbsp;&nbsp;<span class="text-c-text">${r1.pts}</span></div>
          <div class="font-condensed text-xs text-c-faint w-6 text-center">R${r}</div>
          <div class="flex-1 pl-3 font-medium" style="color:${c2.color}"><span class="text-c-text">${r2.pts}</span>&nbsp;&nbsp;${c2.abbr}</div>
        </div>
      `);
    }
    rc.innerHTML = rows.join('');
  }

  show('s-result');
};

window.rematch = function() {
  G.scores = {1:0, 2:0};
  G.rndPts = {1:0, 2:0};
  G.usedCats = {1:[], 2:[]};
  G.round = 1;
  G.player = 1;
  G.history = [];
  G.streak = 0;
  G.bestStreak = 0;
  window.showCat();
};

window.goHome = function() {
  show('s-start');
};

// ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
// HIGHSCORES (LocalStorage)
// ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
function loadHighscores() {
  try { return JSON.parse(localStorage.getItem('filmduel_highscores') || '[]'); }
  catch { return []; }
}

function saveHighscore(entry) {
  const scores = loadHighscores();
  scores.push(entry);
  scores.sort((a, b) => b.pct - a.pct);
  localStorage.setItem('filmduel_highscores', JSON.stringify(scores.slice(0, 5)));
}

// HIGHSCORE MODAL
// ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
window.openHSModal = function() {
  const modal = document.getElementById('hs-modal');
  const list  = document.getElementById('hs-modal-list');
  if (!modal || !list) return;
  const scores = loadHighscores();
  if (scores.length === 0) {
    list.innerHTML = '<p class="text-c-muted text-sm text-center py-4">Noch keine Einträge</p>';
  } else {
    list.innerHTML = scores.map((s, i) => `
      <div class="flex items-center gap-3 py-2 border-b border-c-border last:border-0">
        <span class="font-display text-lg font-bold ${i === 0 ? 'text-c-gold' : 'text-c-muted'} w-5">${i + 1}</span>
        <span class="font-body flex-1 truncate">${s.name || 'Anon'}</span>
        <span class="font-condensed text-xs text-c-muted">${s.rounds}Rd</span>
        <span class="font-display font-bold ${i === 0 ? 'text-c-gold' : 'text-c-text'}">${s.pct}%</span>
        <span class="font-condensed text-xs text-c-muted">${s.rating}</span>
      </div>`).join('');
  }
  modal.classList.remove('hidden');
};

window.closeHSModal = function() {
  const modal = document.getElementById('hs-modal');
  if (modal) modal.classList.add('hidden');
};

// Start Initialize Setup
document.addEventListener("DOMContentLoaded", () => {
    window.goHome(); // init start screen
});
