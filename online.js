// online.js — Online-Multiplayer-Modus
import { client, initAuth, signInWithGoogle, signOut, getCurrentUser } from './auth.js';
import { CATS, Q } from './categories.js';
import { shuffle } from './app.js';

// ───────────────────────────────────────────
// Auth-Handlers
// ───────────────────────────────────────────

window.onlineLogin = async function () {
  const btn = document.getElementById('google-btn');
  const hint = document.getElementById('login-hint');
  btn.disabled = true;
  hint.classList.remove('hidden');
  await signInWithGoogle();
};

window.onlineLogout = async function () {
  await signOut();
  show('s-start');
};

// ───────────────────────────────────────────
// Dashboard
// ───────────────────────────────────────────

window.loadDashboard = async function () {
  const user = getCurrentUser();
  if (!user) { show('s-login'); return; }

  document.getElementById('dash-name').textContent = user.displayName;
  document.getElementById('dash-stats').textContent =
    `${user.wins ?? 0} Siege · ${user.games ?? 0} Spiele · ${user.totalScore ?? 0} Punkte`;

  makeFilmstrip('filmstrip-dash');

  const list = document.getElementById('dash-games');
  list.innerHTML = '<div class="font-condensed text-c-muted text-sm text-center py-6">Lädt…</div>';

  try {
    const games = await client.query('games:getOpenGames', {});
    renderGamesList(games, user._id);
  } catch (e) {
    console.error('Fehler beim Laden der Spiele:', e);
    list.innerHTML = '<div class="font-condensed text-c-muted text-sm text-center py-6">Fehler beim Laden</div>';
  }

  show('s-dashboard');
};

function renderGamesList(games, myId) {
  const list = document.getElementById('dash-games');
  if (!games || !games.length) {
    list.innerHTML = '<div class="font-condensed text-c-muted text-sm text-center py-6">Keine aktiven Duelle</div>';
    return;
  }
  list.innerHTML = games.map(g => {
    const isChallenger = g.challengerId === myId;
    const myTurn = (isChallenger && g.status === 'pending') ||
                   (!isChallenger && g.status === 'challenger_done');
    const cat = CATS.find(c => c.id === g.category);
    return `
      <div class="bg-c-card border border-c-border rounded-2xl px-4 py-3 flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
           onclick="openOnlineGame('${g._id}')">
        <div>
          <div class="font-condensed text-xs uppercase tracking-wide ${myTurn ? 'text-c-gold' : 'text-c-muted'}">
            ${myTurn ? '🎯 Du bist dran' : '⏳ Warte auf Gegner'}
          </div>
          <div class="font-display text-base text-c-text mt-0.5">${cat?.label ?? g.category} · ${g.rounds} Runden</div>
        </div>
        <span class="font-display text-c-muted text-lg">${myTurn ? '→' : '···'}</span>
      </div>`;
  }).join('');
}

// ───────────────────────────────────────────
// Challenge Setup
// ───────────────────────────────────────────

let CS = { opponentId: null, opponentName: null, category: null, rounds: 5, mode: 'name' };

window.initChallengeSetup = function () {
  CS = { opponentId: null, opponentName: null, category: null, rounds: 5, mode: 'name' };
  document.getElementById('cs-opp-input').value = '';
  document.getElementById('cs-opp-results').innerHTML = '';
  document.getElementById('cs-opp-selected').classList.add('hidden');
  document.getElementById('cs-name-area').style.display = '';
  setChallengeRounds(5);

  const grid = document.getElementById('cs-cats');
  grid.innerHTML = CATS.map(c =>
    `<button class="cs-cat-btn rounded-xl p-2 text-center border border-c-border text-xs font-condensed uppercase tracking-wide transition-all"
             data-id="${c.id}"
             onclick="selectChallengeCat('${c.id}', this)">
       <span style="color:${c.color}" class="font-bold">${c.abbr}</span>
       <div class="text-c-muted text-xs mt-0.5">${c.label}</div>
     </button>`
  ).join('');

  updateChallengeStartBtn();
};

window.setChallengeMode = function (mode) {
  CS.mode = mode;
  if (mode === 'random') {
    CS.opponentId = 'random';
    CS.opponentName = 'Zufallsgegner';
    document.getElementById('cs-name-area').style.display = 'none';
    const sel = document.getElementById('cs-opp-selected');
    sel.textContent = '🎲 Zufallsgegner';
    sel.classList.remove('hidden');
  } else {
    CS.opponentId = null;
    CS.opponentName = null;
    document.getElementById('cs-name-area').style.display = '';
    document.getElementById('cs-opp-selected').classList.add('hidden');
  }
  ['name', 'random'].forEach(m => {
    const btn = document.getElementById(`cs-btn-${m}`);
    btn.style.color = m === mode ? '#60a5fa' : '';
    btn.style.borderColor = m === mode ? '#60a5fa' : '';
  });
  updateChallengeStartBtn();
};

window.searchChallengeOpponent = async function (name) {
  const results = document.getElementById('cs-opp-results');
  if (name.length < 2) { results.innerHTML = ''; return; }
  try {
    const found = await client.query('users:searchByName', { name });
    const me = getCurrentUser()?._id;
    const items = (found && found._id !== me) ? [found] : [];
    results.innerHTML = items.map(u =>
      `<button class="w-full text-left bg-c-card border border-c-border rounded-xl px-4 py-2 font-body text-sm text-c-text"
               onclick="selectChallengeOpponent('${u._id}','${u.displayName.replace(/'/g, "\\'")}')">
         ${u.displayName}
       </button>`
    ).join('') || '<p class="text-c-muted text-xs font-condensed px-1">Kein Nutzer gefunden</p>';
  } catch (e) {
    console.error(e);
  }
};

window.selectChallengeOpponent = function (id, name) {
  CS.opponentId = id;
  CS.opponentName = name;
  document.getElementById('cs-opp-results').innerHTML = '';
  document.getElementById('cs-opp-input').value = '';
  const sel = document.getElementById('cs-opp-selected');
  sel.textContent = `✓ ${name}`;
  sel.classList.remove('hidden');
  updateChallengeStartBtn();
};

window.selectChallengeCat = function (id, btn) {
  document.querySelectorAll('.cs-cat-btn').forEach(b => {
    b.style.borderColor = '';
    b.style.background = '';
  });
  const cat = CATS.find(c => c.id === id);
  btn.style.borderColor = cat?.color ?? '#60a5fa';
  btn.style.background = (cat?.color ?? '#60a5fa') + '15';
  CS.category = id;
  updateChallengeStartBtn();
};

window.setChallengeRounds = function (n) {
  CS.rounds = n;
  document.querySelectorAll('.cs-rnd-btn').forEach(b => {
    const active = parseInt(b.dataset.r) === n;
    b.style.borderColor = active ? '#60a5fa' : '';
    b.style.color = active ? '#60a5fa' : '';
  });
};

function updateChallengeStartBtn() {
  document.getElementById('cs-start-btn').disabled = !(CS.opponentId && CS.category);
}

window.confirmChallenge = async function () {
  const cat = Q[CS.category];
  if (!cat) return;
  const questionIndices = shuffle(Array.from({ length: cat.length }, (_, i) => i)).slice(0, CS.rounds);
  const seed = Math.floor(Math.random() * 1_000_000);
  const startBtn = document.getElementById('cs-start-btn');

  try {
    startBtn.disabled = true;
    startBtn.textContent = 'Erstelle Duell…';
    const gameId = await client.mutation('games:createGame', {
      opponentId: CS.opponentId,
      category: CS.category,
      rounds: CS.rounds,
      seed,
      questionIndices,
    });
    await openOnlineGame(gameId);
  } catch (e) {
    console.error('Fehler beim Erstellen:', e);
    alert('Fehler: ' + e.message);
    startBtn.disabled = false;
    startBtn.textContent = 'HERAUSFORDERN ⚔️';
  }
};

// ───────────────────────────────────────────
// Spielablauf
// ───────────────────────────────────────────

let OG = { gameId: null, game: null, questions: [], qi: 0 };

window.openOnlineGame = async function (gameId) {
  const game = await client.query('games:getGame', { gameId });
  if (!game) return;

  const myId = getCurrentUser()?._id;
  const isChallenger = game.challengerId === myId;
  OG = { gameId, game, questions: [], qi: 0 };

  if (game.status === 'finished') {
    showOnlineResult(game, myId);
    return;
  }

  const myTurn = (isChallenger && game.status === 'pending') ||
                 (!isChallenger && game.status === 'challenger_done');

  if (!myTurn) {
    const myScore = isChallenger ? game.challengerScore : game.opponentScore;
    document.getElementById('wait-msg').textContent =
      `Deine Antworten: ${myScore} von ${game.rounds} richtig`;
    show('s-online-wait');
    return;
  }

  OG.questions = game.questionIndices.map(i => Q[game.category][i]);
  showOnlineQuestion();
};

function showOnlineQuestion() {
  const q = OG.questions[OG.qi];
  const cat = CATS.find(c => c.id === OG.game.category);

  document.getElementById('oq-progress').textContent = `Frage ${OG.qi + 1} / ${OG.questions.length}`;
  document.getElementById('oq-cat').textContent = cat?.label ?? '';
  document.getElementById('oq-question').textContent = q.q;

  const answers = shuffle([q.a, ...q.wrong]);
  document.getElementById('oq-answers').innerHTML = answers.map(ans =>
    `<button class="w-full text-left bg-c-card border border-c-border rounded-2xl px-5 py-4
                    font-body text-base text-c-text active:scale-95 transition-all"
             onclick="pickOnlineAnswer(this,'${ans.replace(/'/g, "\\'")}','${q.a.replace(/'/g, "\\'")}')">
       ${ans}
     </button>`
  ).join('');

  makeFilmstrip('filmstrip-oq');
  show('s-online-q');
}

window.pickOnlineAnswer = async function (btn, chosen, correct) {
  document.querySelectorAll('#oq-answers button').forEach(b => b.disabled = true);

  const isCorrect = chosen === correct;
  btn.style.background = isCorrect ? '#14532d' : '#450a0a';
  btn.style.borderColor = isCorrect ? '#22c55e' : '#ef4444';

  if (!isCorrect) {
    document.querySelectorAll('#oq-answers button').forEach(b => {
      if (b.textContent.trim() === correct) {
        b.style.background = '#14532d';
        b.style.borderColor = '#22c55e';
      }
    });
  }

  try {
    await client.mutation('games:submitAnswer', {
      gameId: OG.gameId,
      isCorrect: isCorrect ? 1 : 0,
    });
  } catch (e) {
    console.error('Fehler beim Speichern:', e);
  }

  await new Promise(r => setTimeout(r, 700));
  OG.qi++;

  if (OG.qi < OG.questions.length) {
    showOnlineQuestion();
  } else {
    await openOnlineGame(OG.gameId);
  }
};

// ───────────────────────────────────────────
// Ergebnis
// ───────────────────────────────────────────

async function showOnlineResult(game, myId) {
  const me = getCurrentUser();
  let p1Name = game.challengerId.slice(0, 8) + '…';
  let p2Name = game.opponentId === 'random' ? 'Zufallsgegner' : game.opponentId.slice(0, 8) + '…';

  if (me) {
    if (game.challengerId === myId) p1Name = me.displayName;
    else p2Name = me.displayName;
  }

  const p1Score = game.challengerScore;
  const p2Score = game.opponentScore;
  const winnerText = game.winnerId === null
    ? 'UNENTSCHIEDEN'
    : game.winnerId === myId
      ? '🏆 DU GEWINNST!'
      : `${game.winnerId === game.challengerId ? p1Name : p2Name} GEWINNT`;

  document.getElementById('or-winner').textContent = winnerText;
  document.getElementById('or-p1-name').textContent = p1Name;
  document.getElementById('or-p1-score').textContent = p1Score;
  document.getElementById('or-p2-name').textContent = p2Name;
  document.getElementById('or-p2-score').textContent = p2Score;

  makeFilmstrip('filmstrip-or');
  show('s-online-result');
}

// ───────────────────────────────────────────
// App-Start: Auth prüfen (nach OAuth-Redirect)
// ───────────────────────────────────────────

(async () => {
  const user = await initAuth();
  if (user) {
    const params = new URLSearchParams(window.location.search);
    if (params.has('code') || params.has('token')) {
      await loadDashboard();
    }
  }
})();
