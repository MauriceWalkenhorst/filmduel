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
  try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch { return false; }
}

function loadMastery() { return safeGet('filmduel_mastery', {}); }
function saveMastery(m) { safeSet('filmduel_mastery', m); }
function loadStats() {
  const stored = safeGet('filmduel_stats', {});
  return {
    ...DEFAULT_STATS,
    ...stored,
    badges: Array.isArray(stored.badges) ? [...stored.badges] : [],
  };
}
function saveStats(s)  { safeSet('filmduel_stats', s); }

function updateMastery(history) {
  const mastery = loadMastery();
  const catGroups = {};

  history.forEach(h => {
    if (!h.cat) return;
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

function updateStats(gameData, mastery) {
  const stats     = loadStats();
  const soloH     = gameData.history.filter(h => h.p === 1);
  const correct   = soloH.filter(h => h.correct).length;
  const played    = soloH.length;
  const fastCount = soloH.filter(h => h.correct && h.answerTime < 8).length;
  const perfect   = played > 0 && correct === played;

  stats.gamesPlayed++;
  stats.totalCorrect  += correct;
  stats.bestStreak     = Math.max(stats.bestStreak, gameData.bestStreak ?? 0);
  stats.maxFastInGame  = Math.max(stats.maxFastInGame, fastCount);
  if (perfect) stats.hadPerfectGame = true;

  const prevBadges = new Set(stats.badges);
  const newBadges  = BADGE_DEFS.filter(b => !prevBadges.has(b.id) && b.check(stats, mastery));
  newBadges.forEach(b => stats.badges.push(b.id));
  saveStats(stats);
  return { stats, newBadges };
}

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
