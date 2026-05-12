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
