// app.js
import { CATS, Q } from './categories.js';

window.QPR = 3;
window.TSEC = 20;

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
};

export function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0,0);
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
  document.querySelectorAll('.round-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.r) === n);
  });
};

window.startGame = function() {
  G.p1 = document.getElementById('p1').value.trim() || 'Spieler 1';
  G.p2 = document.getElementById('p2').value.trim() || 'Spieler 2';
  G.scores = {1:0, 2:0};
  G.usedCats = {1:[], 2:[]};
  G.round = 1;
  G.player = 1;
  G.history = [];
  showCat();
};

window.showCat = function() {
  G.selCat = null;
  G.rndPts[G.player] = 0;
  makeFilmstrip('filmstrip-cat');

  document.getElementById('cat-round').textContent = `Runde ${G.round} von ${G.rounds}`;
  document.getElementById('cat-player').textContent = pname(G.player).toUpperCase();

  const s1 = G.scores[1], s2 = G.scores[2];
  const tot = s1 + s2 || 2;
  const pct = ((s1 / tot) * 100).toFixed(1);
  document.getElementById('s-p1-name').textContent = G.p1;
  document.getElementById('s-p2-name').textContent = G.p2;
  document.getElementById('s-p1-val').textContent = s1;
  document.getElementById('s-p2-val').textContent = s2;
  document.getElementById('s-bar').style.width = `${pct}%`;

  const grid = document.getElementById('cat-grid');
  grid.innerHTML = '';
  CATS.forEach(cat => {
    const used = G.usedCats[1].includes(cat.id) || G.usedCats[2].includes(cat.id);
    const d = document.createElement('div');
    d.className = 'cat-card' + (used ? ' used' : '');
    d.style.setProperty('--cat-color', cat.color);
    d.innerHTML = `<div class="cat-abbr">${cat.abbr}</div><div class="cat-label">${cat.label}</div>`;
    if (!used) d.onclick = () => window.selCat(cat.id, d);
    grid.appendChild(d);
  });

  document.getElementById('cat-btn').disabled = true;
  show('s-cat');
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
};

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
  
  if (isOk) G.rndPts[G.player]++;

  const btns = document.querySelectorAll('.btn-ans');
  btns[cor].classList.add('correct');
  if (!isOk && el) el.classList.add('wrong');

  const fb = document.getElementById('fact-box');
  fb.innerHTML = `<strong>Wusstest du?</strong><br>${q.f}`;
  fb.classList.add('show');
  
  document.getElementById('next-btn').style.display = 'block';
};

window.nextQ = function() {
  G.qi++;
  if (G.qi < window.QPR) {
    window.showQ();
  } else {
    G.scores[G.player] += G.rndPts[G.player];
    
    G.history.push({
      p: G.player,
      r: G.round,
      cat: G.selCat,
      pts: G.rndPts[G.player]
    });

    if (G.player === 1) {
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

window.showRes = function() {
  makeFilmstrip('filmstrip-r');
  const s1 = G.scores[1], s2 = G.scores[2];
  let w = 'UNENTSCHIEDEN';
  if (s1 > s2) w = `${G.p1} GEWINNT`;
  if (s2 > s1) w = `${G.p2} GEWINNT`;
  document.getElementById('res-winner').textContent = w.toUpperCase();

  const rs = document.getElementById('res-scores');
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

  const rc = document.getElementById('res-cats');
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
        <div class="flex-1 text-right pr-3 font-medium text-[${c1.color}]" style="color:${c1.color}">${c1.abbr}&nbsp;&nbsp;<span class="text-c-text">${r1.pts}</span></div>
        <div class="font-condensed text-xs text-c-faint w-6 text-center">R${r}</div>
        <div class="flex-1 pl-3 font-medium text-[${c2.color}]" style="color:${c2.color}"><span class="text-c-text">${r2.pts}</span>&nbsp;&nbsp;${c2.abbr}</div>
      </div>
    `);
  }
  rc.innerHTML = rows.join('');
  
  show('s-result');
};

window.rematch = function() {
  G.scores = {1:0, 2:0};
  G.rndPts = {1:0, 2:0};
  G.usedCats = {1:[], 2:[]};
  G.round = 1;
  G.player = 1;
  G.history = [];
  window.showCat();
};

window.goHome = function() {
  show('s-start');
};

// Start Initialize Setup
document.addEventListener("DOMContentLoaded", () => {
    window.goHome(); // init start screen
});
