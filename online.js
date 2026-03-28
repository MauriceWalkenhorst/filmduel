// online.js — Online-Multiplayer-Modus
import { client, initAuth, renderGoogleButton, signOut, getCurrentUser, updateCurrentUser } from './auth.js';
import { CATS, Q } from './categories.js';
import { shuffle } from './app.js';

// ───────────────────────────────────────────
// Auth-Handlers
// ───────────────────────────────────────────

window.showLoginScreen = function () {
  makeFilmstrip('filmstrip-login');
  show('s-login');
  renderGoogleButton('google-btn-container', async (user) => {
    if (!user) return;
    if (!user.displayNameSet) {
      makeFilmstrip('filmstrip-username');
      document.getElementById('username-input').value = '';
      document.getElementById('username-error').classList.add('hidden');
      document.getElementById('username-btn').disabled = true;
      show('s-username-setup');
    } else {
      await loadDashboard();
    }
  });
};

window.updateUsernameBtn = function () {
  const val = document.getElementById('username-input').value.trim();
  document.getElementById('username-btn').disabled = val.length < 2;
};

window.confirmUsername = async function () {
  const btn = document.getElementById('username-btn');
  const input = document.getElementById('username-input');
  const errEl = document.getElementById('username-error');
  const name = input.value.trim();

  btn.disabled = true;
  btn.textContent = '…';
  errEl.classList.add('hidden');

  try {
    const profile = await client.mutation('users:setDisplayName', { displayName: name });
    // Profil in localStorage aktualisieren
    localStorage.setItem('filmduel_user', JSON.stringify(profile));
    await loadDashboard();
  } catch (e) {
    const msg = e.message || 'Fehler — bitte erneut versuchen';
    errEl.textContent = msg;
    errEl.classList.remove('hidden');
    showToast(msg, 'error');
    btn.disabled = false;
    btn.textContent = 'WEITER →';
  }
};

window.onlineLogout = async function () {
  clearInterval(window._localTimer);
  await signOut();
  show('s-start');
};

// ───────────────────────────────────────────
// Dashboard
// ───────────────────────────────────────────

window.loadDashboard = async function () {
  if (!getCurrentUser()) { show('s-login'); return; }

  // Immer frisches Profil von Convex holen → aktuellen Namen + ID sicherstellen
  let user;
  try {
    user = await client.query('users:getProfile', {});
    if (user) updateCurrentUser(user);
  } catch (_) {
    user = getCurrentUser();
  }
  if (!user) { show('s-login'); return; }

  document.getElementById('dash-name').textContent = user.displayName;
  document.getElementById('dash-wins').textContent  = user.wins ?? 0;
  document.getElementById('dash-games').textContent = user.games ?? 0;
  document.getElementById('dash-score').textContent = user.totalScore ?? 0;

  makeFilmstrip('filmstrip-dash');

  const list = document.getElementById('dash-duels');
  list.innerHTML = '<div class="font-condensed text-c-muted text-sm text-center py-6">Lädt…</div>';

  try {
    const games = await client.query('games:getOpenGames', {});
    renderGamesList(games, user._id);
  } catch (e) {
    if (e?.message?.includes('auth') || e?.message?.includes('token') || e?.message?.includes('Unauthorized')) {
      showToast('Sitzung abgelaufen — bitte neu einloggen', 'warning');
      setTimeout(() => show('s-login'), 1500);
      return;
    }
    showToast('Duelle konnten nicht geladen werden', 'error');
    list.innerHTML = '<div class="font-condensed text-c-muted text-sm text-center py-6">Fehler beim Laden</div>';
  }

  show('s-dashboard');
};

function renderGamesList(games, myId) {
  const list = document.getElementById('dash-duels');
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

let _searchTimeout;
window.searchChallengeOpponent = function (name) {
  const results = document.getElementById('cs-opp-results');
  if (name.length < 2) { results.innerHTML = ''; return; }
  clearTimeout(_searchTimeout);
  _searchTimeout = setTimeout(async () => {
    try {
      const found = await client.query('users:searchByName', { name });
      const me = getCurrentUser()?._id;
      const items = Array.isArray(found) ? found.filter(u => u._id !== me) : [];
      if (items.length === 0) {
        results.innerHTML = '<p class="text-c-muted text-xs font-condensed px-1">Kein Nutzer gefunden</p>';
        return;
      }
      results.innerHTML = '';
      items.forEach(u => {
        const btn = document.createElement('button');
        btn.className = 'w-full text-left bg-c-card border border-c-border rounded-xl px-4 py-2 font-body text-sm text-c-text';
        btn.textContent = u.displayName;
        btn.onclick = () => selectChallengeOpponent(u._id, u.displayName);
        results.appendChild(btn);
      });
    } catch (e) {
      console.error(e);
    }
  }, 300);
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
    showToast(e.message || 'Duell konnte nicht erstellt werden', 'error');
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

  const correct = q.a[q.c];
  const answers = shuffle([...q.a]);
  const container = document.getElementById('oq-answers');
  container.innerHTML = '';
  answers.forEach(ans => {
    const btn = document.createElement('button');
    btn.className = 'w-full text-left bg-c-card border border-c-border rounded-2xl px-5 py-4 font-body text-base text-c-text active:scale-95 transition-all';
    btn.textContent = ans;
    btn.dataset.ans = ans;
    btn.dataset.correct = correct;
    btn.onclick = function() { pickOnlineAnswer(this, this.dataset.ans, this.dataset.correct); };
    container.appendChild(btn);
  });

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
    showToast('Antwort konnte nicht gespeichert werden', 'error');
    document.querySelectorAll('#oq-answers button').forEach(b => b.disabled = false);
    btn.style.background = '';
    btn.style.borderColor = '';
    return;
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

// App-Start: gespeichertes Token → direkt ins Dashboard
(async () => {
  const user = await initAuth();
  if (user) await loadDashboard();
})();
