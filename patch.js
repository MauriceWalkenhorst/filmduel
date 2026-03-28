const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const scriptStart = content.indexOf('<script>');
const scriptEnd = content.indexOf('</script>', scriptStart) + '</script>'.length;

const newHTML = `
<!-- ═══════════════════════════════════════
     SCREEN 7 — LOGIN
════════════════════════════════════════ -->
<div id="s-login" class="screen flex-col">
  <div class="filmstrip flex-shrink-0"></div>
  <div class="flex flex-col flex-1 p-6 pt-10 justify-center items-center gap-6">
    <h2 class="font-display text-4xl font-bold text-c-gold">ONLINE MODUS</h2>
    <p class="font-condensed text-c-muted text-center max-w-xs">Melde dich an, um gegen Freunde oder zufällige Gegner weltweit anzutreten.</p>
    <button class="btn-primary" onclick="window.loginGoogle()">MIT GOOGLE ANMELDEN</button>
    <button class="btn-secondary" onclick="window.goHome()">ZURÜCK</button>
  </div>
</div>

<!-- ═══════════════════════════════════════
     SCREEN 8 — DASHBOARD
════════════════════════════════════════ -->
<div id="s-dashboard" class="screen flex-col">
  <div class="filmstrip flex-shrink-0"></div>
  <div class="flex flex-col flex-1 p-6 pt-8 gap-5 safe-bottom overflow-y-auto">
    <div class="flex justify-between items-start">
      <div>
        <div class="font-condensed text-c-muted text-xs uppercase tracking-widest mb-1">Eingeloggt als</div>
        <h2 id="dash-name" class="font-display text-3xl font-bold text-c-gold"></h2>
        <p id="dash-stats" class="font-condensed text-c-muted text-sm mt-1"></p>
      </div>
    </div>
    
    <div class="flex justify-between items-end mt-4">
      <h3 class="font-display text-xl text-c-text">DEINE SPIELE</h3>
    </div>
    
    <div id="dash-games" class="flex flex-col gap-3"></div>
    
    <div class="mt-auto flex flex-col gap-3">
        <button class="btn-primary" onclick="window.startOnlineSetup()">NEUES SPIEL (HERAUSFORDERN)</button>
        <button class="btn-secondary" onclick="window.goHome()">LOKAL SPIELEN / LOGOUT</button>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════
     SCREEN 9 — CHALLENGE SETUP
════════════════════════════════════════ -->
<div id="s-challenge-setup" class="screen flex-col">
  <div class="filmstrip flex-shrink-0"></div>
  <div class="flex flex-col flex-1 p-6 pt-8 gap-5 safe-bottom overflow-y-auto">
    <h2 class="font-display text-3xl font-bold text-c-gold mb-2">NEUES DUELL</h2>
    
    <div class="flex flex-col gap-4">
      <div>
        <label class="font-condensed text-xs uppercase tracking-widest text-c-muted mb-2 block">Gegner (Name oder Leer für Zufall)</label>
        <input id="setup-opp" type="text" placeholder="Zufallsgegner (random)" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" class="w-full bg-c-card border border-c-border rounded-xl px-4 py-3 font-display text-lg text-c-text outline-none focus:border-c-gold" />
      </div>
      
      <div>
        <label class="font-condensed text-xs uppercase tracking-widest text-c-muted mb-2 block">Kategorie</label>
        <select id="setup-cat" class="w-full bg-c-card border border-c-border rounded-xl px-4 py-3 font-display text-lg text-c-text outline-none focus:border-c-gold">
           <option value="arthouse">Arthouse</option>
           <option value="directors">Regie</option>
           <option value="world">Weltklasse</option>
           <option value="noir">Neo-Noir</option>
           <option value="cult">Kult</option>
           <option value="tech">Kamera</option>
           <option value="horror">Horror</option>
           <option value="indie">Indie/A24</option>
           <option value="series">Serien</option>
           <option value="animation">Animationsfilme</option>
           <option value="superhero">Superhelden</option>
           <option value="oscars">Oscar-Gewinner</option>
           <option value="german">Deutsches Kino</option>
           <option value="comedy">Komödien</option>
           <option value="musical">Musicals</option>
           <option value="scifi">Sci-Fi</option>
           <option value="nineties">90er Hits</option>
           <option value="worldcinema">Weltfilme</option>
        </select>
      </div>
      
      <div>
        <label class="font-condensed text-xs uppercase tracking-widest text-c-muted mb-2 block">Runden</label>
        <select id="setup-rnds" class="w-full bg-c-card border border-c-border rounded-xl px-4 py-3 font-display text-lg text-c-text outline-none focus:border-c-gold">
           <option value="5">5 Runden</option>
           <option value="10">10 Runden</option>
           <option value="15">15 Runden</option>
        </select>
      </div>
    </div>
    
    <div class="mt-auto flex flex-col gap-3">
      <button class="btn-primary" onclick="window.submitChallenge()">HERAUSFORDERN</button>
      <button class="btn-secondary" onclick="import('./online.js').then(m => m.default.initDashboard())">ABBRECHEN</button>
    </div>
  </div>
</div>

<script type="module" src="./app.js"></script>
<script type="module" src="./auth.js"></script>
<script type="module" src="./online.js"></script>
`;

const updated = content.slice(0, scriptStart) + newHTML + content.slice(scriptEnd);
fs.writeFileSync('index.html', updated);
