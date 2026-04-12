// online.js — Online-Multiplayer-Modus
import { client, initAuth, renderGoogleButton, signOut, getCurrentUser, updateCurrentUser } from './auth.js';
import { CATS, Q } from './categories.js';
import { shuffle, G } from './app.js';

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
    updateCurrentUser(profile);
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
  clearInterval(G.timer);
  await signOut();
  show('s-start');
};

// ───────────────────────────────────────────
// Dashboard
// ───────────────────────────────────────────

window.loadDashboard = async function () {
  clearOnlineTimer();
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
  const streak = user.streak ?? 0;
  document.getElementById('dash-streak').textContent = streak > 0 ? `${streak}🔥` : '0';

  // Push-Button anzeigen falls noch keine Erlaubnis
  const pushBtn = document.getElementById('dash-push-btn');
  if (pushBtn && 'Notification' in window && Notification.permission === 'default') {
    pushBtn.classList.remove('hidden');
  } else if (pushBtn) {
    pushBtn.classList.add('hidden');
  }

  makeFilmstrip('filmstrip-dash');

  const list = document.getElementById('dash-duels');
  list.innerHTML = '<div class="font-condensed text-c-muted text-sm text-center py-6">Lädt…</div>';

  try {
    const games = await client.query('games:getOpenGames', {});
    renderGamesList(games, user._id);
    startDashboardPolling(user._id);
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
    const opponentName = isChallenger ? (g.opponentName || 'Zufallsgegner') : (g.challengerName || '?');
    return `
      <div class="bg-c-card border border-c-border rounded-2xl px-4 py-3 flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
           onclick="openOnlineGame('${g._id}')">
        <div>
          <div class="font-condensed text-xs uppercase tracking-wide ${myTurn ? 'text-c-gold' : 'text-c-muted'}">
            ${myTurn ? '🎯 Du bist dran' : `⏳ Warte auf ${opponentName}`}
          </div>
          <div class="font-display text-base text-c-text mt-0.5">${opponentName} · ${cat?.label ?? g.category} · ${g.rounds} Runden</div>
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

let _challengeCreating = false;
window.confirmChallenge = async function () {
  if (_challengeCreating) return;
  const cat = Q[CS.category];
  if (!cat) return;
  const questionIndices = shuffle(Array.from({ length: cat.length }, (_, i) => i)).slice(0, CS.rounds);
  const seed = Math.floor(Math.random() * 1_000_000);
  const startBtn = document.getElementById('cs-start-btn');

  try {
    _challengeCreating = true;
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
  } finally {
    _challengeCreating = false;
  }
};

// ───────────────────────────────────────────
// Spielablauf
// ───────────────────────────────────────────

const VAPID_PUBLIC_KEY = 'BIdn1DR8_LbNpQyQIYsofx3_O9kwC60NW1JoCv1z2QrS-OnMArd9KhtMKV1ya3rEgqKd3m_-MxEjLKZjLj_SJfc';

let OG = { gameId: null, game: null, questions: [], qi: 0 };
let _timerStart = 0;
let _timerTimeout = null;
let _dashInterval = null;
let _waitInterval = null;

function startDashboardPolling(userId) {
  stopDashboardPolling();
  _dashInterval = setInterval(async () => {
    try {
      const games = await client.query('games:getOpenGames', {});
      renderGamesList(games, userId);
    } catch (_) {}
  }, 6000);
}

function stopDashboardPolling() {
  clearInterval(_dashInterval);
  _dashInterval = null;
}

function startWaitPolling(gameId, myId) {
  stopWaitPolling();
  _waitInterval = setInterval(async () => {
    try {
      const game = await client.query('games:getGame', { gameId });
      if (game?.status === 'finished') {
        stopWaitPolling();
        showOnlineResult(game, myId);
      }
    } catch (_) {}
  }, 6000);
}

function stopWaitPolling() {
  clearInterval(_waitInterval);
  _waitInterval = null;
}

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
      `Deine Antworten: ${myScore} Punkte (${game.rounds} Fragen)`;
    show('s-online-wait');
    startWaitPolling(gameId, myId);
    return;
  }

  OG.questions = game.questionIndices.map(i => Q[game.category][i]);
  showOnlineQuestion();
};

function clearOnlineTimer() {
  clearTimeout(_timerTimeout);
  _timerTimeout = null;
  stopDashboardPolling();
  stopWaitPolling();
  const bar = document.getElementById('oq-timer-bar');
  if (bar) { bar.style.transition = 'none'; bar.style.width = '0%'; }
}

function startOnlineTimer() {
  _timerStart = Date.now();
  clearOnlineTimer();

  const bar = document.getElementById('oq-timer-bar');
  if (bar) {
    bar.style.transition = 'none';
    bar.style.width = '100%';
    bar.style.background = '#60a5fa';
    bar.offsetHeight; // force reflow
    bar.style.transition = 'width 15s linear';
    bar.style.width = '0%';
  }

  _timerTimeout = setTimeout(async () => {
    document.querySelectorAll('#oq-answers button').forEach(b => b.disabled = true);
    document.getElementById('oq-points-label').textContent = '⏱ Zeit abgelaufen — 0 Punkte';
    try {
      await client.mutation('games:submitAnswer', { gameId: OG.gameId, points: 0 });
    } catch (e) { console.error('Timeout submit failed:', e); }
    await new Promise(r => setTimeout(r, 800));
    OG.qi++;
    if (OG.qi < OG.questions.length) showOnlineQuestion();
    else await openOnlineGame(OG.gameId);
  }, 15000);
}

function getSpeedPoints(isCorrect) {
  if (!isCorrect) return 0;
  const elapsed = (Date.now() - _timerStart) / 1000;
  if (elapsed < 5) return 3;
  if (elapsed < 10) return 2;
  return 1;
}

function showOnlineQuestion() {
  const q = OG.questions[OG.qi];
  const cat = CATS.find(c => c.id === OG.game.category);

  document.getElementById('oq-progress').textContent = `Frage ${OG.qi + 1} / ${OG.questions.length}`;
  document.getElementById('oq-cat').textContent = cat?.label ?? '';
  document.getElementById('oq-question').textContent = q.q;
  document.getElementById('oq-points-label').textContent = '⚡ <5s = 3pt · 5-10s = 2pt · >10s = 1pt';

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
  startOnlineTimer();
}

window.pickOnlineAnswer = async function (btn, chosen, correct) {
  clearOnlineTimer();
  document.querySelectorAll('#oq-answers button').forEach(b => b.disabled = true);

  const isCorrect = chosen === correct;
  const points = getSpeedPoints(isCorrect);

  if (btn) {
    btn.style.background = isCorrect ? '#14532d' : '#450a0a';
    btn.style.borderColor = isCorrect ? '#22c55e' : '#ef4444';
  }

  if (!isCorrect) {
    document.querySelectorAll('#oq-answers button').forEach(b => {
      if (b.textContent.trim() === correct) {
        b.style.background = '#14532d';
        b.style.borderColor = '#22c55e';
      }
    });
  }

  const ptLabels = ['0 Punkte', '1 Punkt', '2 Punkte ⚡', '3 Punkte ⚡⚡'];
  document.getElementById('oq-points-label').textContent = isCorrect
    ? `✓ Richtig! ${ptLabels[points]}`
    : `✗ Falsch — ${ptLabels[0]}`;

  try {
    await client.mutation('games:submitAnswer', { gameId: OG.gameId, points });
  } catch (e) {
    console.error('Fehler beim Speichern:', e);
    showToast('Antwort konnte nicht gespeichert werden', 'error');
    document.querySelectorAll('#oq-answers button').forEach(b => b.disabled = false);
    if (btn) { btn.style.background = ''; btn.style.borderColor = ''; }
    startOnlineTimer();
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

let _lastRematch = null;

async function showOnlineResult(game, myId) {
  const p1Name = game.challengerName || game.challengerId.slice(0, 8) + '…';
  const p2Name = game.opponentName || (game.opponentId === 'random' ? 'Zufallsgegner' : game.opponentId.slice(0, 8) + '…');

  const p1Score = game.challengerScore;
  const p2Score = game.opponentScore;

  let winnerText;
  if (game.winnerId === null) {
    winnerText = 'UNENTSCHIEDEN';
  } else if (game.winnerId === myId) {
    winnerText = '🏆 DU GEWINNST!';
  } else {
    const winnerName = game.winnerId === game.challengerId ? p1Name : p2Name;
    winnerText = `${winnerName} GEWINNT`;
  }

  document.getElementById('or-winner').textContent = winnerText;
  document.getElementById('or-p1-name').textContent = p1Name;
  document.getElementById('or-p1-score').textContent = p1Score;
  document.getElementById('or-p2-name').textContent = p2Name;
  document.getElementById('or-p2-score').textContent = p2Score;

  // Antwort-Übersicht (mit Speed-Punkten)
  const isChallenger = game.challengerId === myId;
  const myAnswers = isChallenger ? game.challengerAnswers : game.opponentAnswers;
  const theirAnswers = isChallenger ? game.opponentAnswers : game.challengerAnswers;
  const questions = game.questionIndices.map(i => Q[game.category][i]);

  const overviewEl = document.getElementById('or-answers');
  if (overviewEl && questions.length) {
    overviewEl.innerHTML = questions.map((q, i) => {
      const myPts = myAnswers[i] ?? 0;
      const theirPts = theirAnswers[i] ?? 0;
      const myOk = myPts > 0;
      const theirOk = theirPts > 0;
      const ptIcon = pts => pts === 3 ? '⚡⚡' : pts === 2 ? '⚡' : '';
      return `
        <div class="bg-c-card border border-c-border rounded-xl px-4 py-3 text-sm">
          <div class="font-condensed text-c-text text-xs leading-tight mb-2">${q.q}</div>
          <div class="flex gap-3">
            <span class="font-condensed text-xs ${myOk ? 'text-green-400' : 'text-red-400'}">${myOk ? '✓' : '✗'} Du ${myPts > 0 ? myPts + 'P' : ''}${ptIcon(myPts)}</span>
            <span class="font-condensed text-xs ${theirOk ? 'text-green-400' : 'text-red-400'}">${theirOk ? '✓' : '✗'} ${isChallenger ? p2Name : p1Name} ${theirPts > 0 ? theirPts + 'P' : ''}${ptIcon(theirPts)}</span>
            <span class="font-condensed text-xs text-c-muted ml-auto">${q.a[q.c]}</span>
          </div>
        </div>`;
    }).join('');
  }

  // Rematch-Button (nicht bei Zufallsgegner)
  const rematchOpponentId = isChallenger ? game.opponentId : game.challengerId;
  const rematchOpponentName = isChallenger ? p2Name : p1Name;
  const rematchBtn = document.getElementById('or-rematch-btn');
  if (rematchBtn && rematchOpponentId !== 'random') {
    _lastRematch = { opponentId: rematchOpponentId, opponentName: rematchOpponentName, category: game.category, rounds: game.rounds };
    rematchBtn.textContent = `🔁 REMATCH vs ${rematchOpponentName}`;
    rematchBtn.classList.remove('hidden');
  } else if (rematchBtn) {
    rematchBtn.classList.add('hidden');
    _lastRematch = null;
  }

  makeFilmstrip('filmstrip-or');
  show('s-online-result');
}

window.startRematch = function () {
  if (!_lastRematch) return;
  // Challenge-Setup öffnen und Gegner vorausfüllen
  show('s-challenge-setup');
  initChallengeSetup();
  selectChallengeOpponent(_lastRematch.opponentId, _lastRematch.opponentName);
};

// ───────────────────────────────────────────
// Push Notifications
// ───────────────────────────────────────────

function urlBase64ToUint8Array(b64) {
  const padding = '='.repeat((4 - b64.length % 4) % 4);
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

window.requestPushPermission = async function () {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    showToast('Push nicht unterstützt', 'warning');
    return;
  }
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { showToast('Benachrichtigungen abgelehnt', 'warning'); return; }
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    await client.mutation('users:savePushSubscription', { subscription: JSON.parse(JSON.stringify(sub)) });
    document.getElementById('dash-push-btn')?.classList.add('hidden');
    showToast('🔔 Benachrichtigungen aktiviert!', 'success');
  } catch (e) {
    console.error('Push registration failed:', e);
    showToast('Fehler beim Aktivieren', 'error');
  }
};

// Service Worker registrieren
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(e => console.warn('SW:', e));
}

// ───────────────────────────────────────────
// App-Start: Auth prüfen (nach OAuth-Redirect)
// ───────────────────────────────────────────

// App-Start: gespeichertes Token → direkt ins Dashboard
(async () => {
  const user = await initAuth();
  if (user) await loadDashboard();
})();
