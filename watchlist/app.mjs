import {MOODS,mergeBackups,emptyState,importFileBatch,eligibleFilms,drawFilm,loadState,saveState,validateBackup,starterState,dropStarter} from './core.mjs';
import {starterFilms} from './starter.mjs';
import {createCinema} from './cinema.mjs';
import {createStreaming} from './streaming.mjs';
import {createReleases} from './releases.mjs';
import {catalog} from './catalog.mjs';
const $=id=>document.getElementById(id);
let state=emptyState(),storageBlocked=false,mood=null,current=null,drawn={},posterRequest=0,posterAbort=null,pendingRestore=null,noticeTimer;
try{state=loadState(localStorage);}catch(e){storageBlocked=true;notice(e.message,null,true);}
// Ohne eigene Daten startet Abspann mit der NYT-Liste; der erste eigene Watchlist-Import ersetzt sie.
const STARTER_KEY='watchlist.starter.v1',starterIds=new Set(starterFilms.map(f=>f[0]));
let starterActive=false;try{starterActive=localStorage.getItem(STARTER_KEY)==='1';}catch{}
if(!storageBlocked&&!state.films.length){state=starterState(starterFilms);starterActive=true;try{saveState(localStorage,state);localStorage.setItem(STARTER_KEY,'1');}catch{}}
function endStarter(){starterActive=false;try{localStorage.removeItem(STARTER_KEY);}catch{}}
const streaming=createStreaming({getFilms:()=>state.films,onChange:()=>renderHome(),onNotice:notice});
const cinema=createCinema({notice});
$('watch-cinema').onclick=()=>current&&cinema.add(current);
const releases=createReleases({getFilms:()=>state.films,onChange:()=>{renderHome();if(!$('library-view').hidden)renderLibrary();}});
// Angekündigte Filme zuerst heraus, danach optional der Abo-Filter.
const poolFilms=()=>streaming.filter(releases.filter(state.films));
const formatDay=d=>new Date(`${d}T00:00`).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'});
const releaseText=film=>{const r=releases.info(film);return r.upcoming?(r.date?`Erscheint am ${formatDay(r.date)}`:'Erscheint demnächst · Termin offen'):'';};
const icons=[
 '<circle cx="24" cy="24" r="9"/><path d="M24 2v7M24 39v7M2 24h7M39 24h7M8 8l5 5M35 35l5 5M8 40l5-5M35 13l5-5"/>',
 '<path d="M33 6a19 19 0 1 0 9 30A20 20 0 0 1 33 6Z"/><path d="m12 6 2 4 4 2-4 2-2 4-2-4-4-2 4-2Z"/>',
 '<path d="m27 3-17 25h13l-2 17 18-26H26Z"/>',
 '<path d="M3 14c8-13 14 13 22 0s14 13 22 0M3 25c8-13 14 13 22 0s14 13 22 0M3 36c8-13 14 13 22 0s14 13 22 0"/>'
];
function notice(message,action,sticky=false){const el=$('notice');el.replaceChildren(document.createTextNode(message));el.hidden=false;if(action){const b=document.createElement('button');b.textContent=action.label;b.onclick=()=>{el.hidden=true;action.run();};el.append(b);}clearTimeout(noticeTimer);if(!sticky)noticeTimer=setTimeout(()=>{el.hidden=true;},action?8000:5000);}
function commit(next,{restoring=false}={}){if(storageBlocked&&!restoring){notice('Bitte zuerst eine gültige Sicherung wiederherstellen. Die vorhandenen Daten bleiben geschützt.');return false;}try{saveState(localStorage,next);state=next;storageBlocked=false;return true;}catch(e){notice(e.message);return false;}}
function show(view){for(const id of ['choose','result','library'])$(`${id}-view`).hidden=id!==view;window.scrollTo({top:0,behavior:'instant'});}
function renderHome(){
 $('total-count').textContent=state.films.filter(f=>f.inWatchlist&&!f.seen).length;
 $('onboarding').hidden=!starterActive&&state.films.some(f=>f.inWatchlist);
 $('onboarding-title').textContent=starterActive?'Start mit der NYT-Liste.':'Deine Filme fehlen noch.';
 $('onboarding-text').textContent=starterActive?'Hier sind die 100 besten Filme des 21. Jahrhunderts laut New York Times. Importierst du deine Letterboxd-Watchlist, ersetzt sie diese Liste.':'Importiere deine Letterboxd-Watchlist. Sie bleibt in diesem Browser.';
 $('first-import').textContent=starterActive?'Eigene Watchlist importieren →':'Watchlist importieren →';
 $('mood-grid').replaceChildren(...MOODS.map((m,i)=>{
  const b=document.createElement('button');b.className='mood-card';b.setAttribute('aria-pressed',String(mood===m.id));
  b.innerHTML=`<span class="number">0${i+1}</span><svg class="mood-icon" viewBox="0 0 48 48" aria-hidden="true">${icons[i]}</svg><span class="mood-title">${m.label}</span><span class="mood-caption">${m.description}</span><span class="mood-count">${eligibleFilms(poolFilms(),m.id).length} FILME</span>`;
  b.onclick=()=>{mood=m.id;renderHome();};return b;
 }));
 const pool=mood?eligibleFilms(poolFilms(),mood):[];
 $('draw').disabled=!mood||!pool.length;
 const exhausted=pool.length>0&&pool.every(f=>(drawn[mood]||[]).includes(f.id));
 $('draw').textContent=exhausted?'Neue Runde starten ↗':'Film auswählen ↗';
 const upcoming=state.films.filter(f=>f.inWatchlist&&!f.seen&&releases.info(f).upcoming).length;
 $('upcoming-hint').hidden=!upcoming;$('upcoming-hint').textContent=upcoming===1?'1 angekündigter Film ist noch nicht erschienen und wartet unter „Demnächst“.':`${upcoming} angekündigte Filme sind noch nicht erschienen und warten unter „Demnächst“.`;
 $('pool-hint').textContent=!mood?'Wähle deine Stimmung.':pool.length?`${pool.length} passende Filme. Einer wird deiner.`:'Kein ungesehener Film für diese Stimmung. Ändere die Stimmung oder ergänze deine Watchlist.';
}
function chooseFilm(reset=false){
 if(reset)drawn[mood]=[];
 current=drawFilm(poolFilms(),mood,drawn[mood]||[]);
 if(!current){notice('Alle passenden Filme dieser Runde sind gezogen. Starte eine neue Runde.');return;}
 (drawn[mood]??=[]).push(current.id);renderResult();show('result');$('film-title').focus({preventScroll:true});
}
function renderResult(){
 if(!current)return;
 $('film-title').textContent=current.title;$('film-year').textContent=current.year||'Jahr noch offen';
 const m=MOODS.find(m=>m.id===mood)||MOODS.find(m=>current.moods.includes(m.id));
 $('result-mood').textContent=m?.label||'Deine Auswahl';$('film-reason').textContent=m?.reason||'Ein Film aus deiner Watchlist.';
 $('letterboxd-link').href=current.id;
 $('pick').textContent=state.selected===current.id?'Für heute ausgewählt ✓':'Den schaue ich ↗';$('picked-message').hidden=state.selected!==current.id;
 const pool=eligibleFilms(poolFilms(),mood);const remaining=pool.filter(f=>!(drawn[mood]||[]).includes(f.id)).length;
 $('again').disabled=!remaining;$('restart').hidden=remaining>0||pool.length<2;
 $('remaining').textContent=remaining?`${remaining} weitere Filme in dieser Runde.`:pool.length===1?'Das ist gerade dein einziger Treffer.':'Alle Treffer dieser Stimmung sind gezogen.';
 loadPoster(current);streaming.show(current);
}
async function loadPoster(film){
 const request=++posterRequest;posterAbort?.abort();posterAbort=new AbortController();
 $('poster').hidden=true;$('poster').removeAttribute('src');$('poster').alt=`Filmcover: ${film.title} (${film.year||'Jahr unbekannt'})`;
 $('poster-fallback').hidden=false;$('poster-status').textContent='Cover wird geladen …';$('retry-poster').hidden=true;$('film-description').textContent='';$('film-description').classList.remove('expanded');
 try{
  const r=await fetch(`/api/watchlist-poster?${new URLSearchParams({title:film.title,year:film.year})}`,{signal:posterAbort.signal});
  const data=await r.json();if(request!==posterRequest)return;
  if(!r.ok||!data.poster)throw Error(data.error||'Für diesen Film ist noch kein Cover verfügbar.');
  $('poster').onload=()=>{if(request!==posterRequest)return;$('poster').hidden=false;$('poster-fallback').hidden=true;};
  $('poster').onerror=()=>{if(request!==posterRequest)return;$('poster').hidden=true;$('poster-fallback').hidden=false;$('poster-status').textContent='Cover konnte nicht geladen werden.';$('retry-poster').hidden=false;};
  $('poster').src=data.poster;
  releases.record(film,data.releaseDate);const upcoming=releases.info(film).upcoming;$('film-description').textContent=[data.overview,upcoming?'Dieser Film ist noch angekündigt. Prüfe vor dem Filmabend, ob er bereits verfügbar ist.':''].filter(Boolean).join(' ');
 }catch(e){if(request!==posterRequest||e.name==='AbortError')return;$('poster-status').textContent=e.message;$('retry-poster').hidden=false;}
}
function setSeen(id,value){
 const next={...state,films:state.films.map(f=>f.id===id?{...f,seen:value}:f),selected:state.selected===id&&value?null:state.selected};
 if(!commit(next))return false;
 streaming.refresh();renderHome();notice(value?'Als gesehen gespeichert.':'Wieder auf deiner Watchlist.',{label:'Rückgängig',run:()=>{setSeen(id,!value);renderLibrary();}});return true;
}
function renderLibrary(){
 const query=$('search').value.trim().toLocaleLowerCase();const filter=$('filter').value;
 const all=state.films.filter(f=>f.inWatchlist);
 const fs=all.filter(f=>(filter==='all'||filter==='seen'&&f.seen||filter==='unseen'&&!f.seen||filter==='unassigned'&&!f.seen&&!f.moods.length||filter==='upcoming'&&!f.seen&&releases.info(f).upcoming)&&f.title.toLocaleLowerCase().includes(query));
 // Demnächst nach Termin sortiert, offene Termine zuletzt; sonst alphabetisch.
 const byDate=(a,b)=>(releases.info(a).date||'9999')<(releases.info(b).date||'9999')?-1:(releases.info(a).date||'9999')>(releases.info(b).date||'9999')?1:a.title.localeCompare(b.title,'de');
 fs.sort(filter==='upcoming'?byDate:(a,b)=>a.title.localeCompare(b.title,'de'));
 const upcomingCount=all.filter(f=>!f.seen&&releases.info(f).upcoming).length;
 $('library-summary').textContent=`${fs.length} angezeigt · ${all.filter(f=>!f.seen).length} ungesehen · ${all.filter(f=>!f.seen&&!f.moods.length).length} ohne Stimmung${upcomingCount?` · ${upcomingCount} demnächst`:''}`;
 $('film-list').replaceChildren();
 if(!fs.length){const p=document.createElement('p');p.className='empty';p.textContent='Hier ist es noch still. Importiere Filme oder ändere deinen Filter.';$('film-list').append(p);return;}
 for(const film of fs){
  const row=document.createElement('article');row.className='film-row';
  const text=document.createElement('div'),h=document.createElement('h3'),p=document.createElement('p');h.textContent=film.title;p.textContent=[film.year||'Jahr offen',film.seen?'Gesehen':'',film.seen?'':releaseText(film)].filter(Boolean).join(' · ');text.append(h,p);
  const tags=document.createElement('div');tags.className='tag-options';tags.setAttribute('role','group');tags.setAttribute('aria-label',`Stimmungen für ${film.title}`);
  for(const m of MOODS){const label=document.createElement('label');const input=document.createElement('input');input.type='checkbox';input.checked=film.moods.includes(m.id);input.setAttribute('aria-label',`${film.title}: ${m.label}`);input.onchange=()=>{const next={...state,films:state.films.map(f=>f.id===film.id?{...f,moods:input.checked?[...f.moods,m.id]:f.moods.filter(x=>x!==m.id)}:f)};if(commit(next)){renderHome();renderLibrary();}else input.checked=!input.checked;};label.append(input,document.createTextNode(m.short));tags.append(label);}
  const b=document.createElement('button');b.className='secondary';b.textContent=film.seen?'Wieder ungesehen':'Gesehen';b.setAttribute('aria-label',`${film.title}: ${b.textContent}`);b.onclick=()=>{if(setSeen(film.id,!film.seen))renderLibrary();};const watch=document.createElement('button');watch.className='quiet';watch.textContent='Kinoalarm vormerken';watch.onclick=()=>cinema.add(film);row.append(text,tags,b,watch);$('film-list').append(row);
 }
}
function openLibrary(importing=false){renderLibrary();show('library');if(importing)$('import-panel').open=true;}
$('draw').onclick=()=>{const pool=eligibleFilms(poolFilms(),mood);chooseFilm(pool.length>0&&pool.every(f=>(drawn[mood]||[]).includes(f.id)));};
$('again').onclick=()=>chooseFilm();$('restart').onclick=()=>chooseFilm(true);
$('back').onclick=()=>{show('choose');renderHome();};$('library-back').onclick=()=>{show('choose');renderHome();};
$('manage').onclick=()=>openLibrary();$('first-import').onclick=()=>openLibrary(true);
$('pick').onclick=()=>{if(current&&commit({...state,selected:current.id})){ $('pick').textContent='Für heute ausgewählt ✓';$('picked-message').hidden=false;}};
$('seen').onclick=()=>{if(current&&setSeen(current.id,true)){posterAbort?.abort();current=null;show('choose');}};
$('retry-poster').onclick=()=>{if(current){loadPoster(current);streaming.show(current);}};
$('film-description').onclick=()=>$('film-description').classList.toggle('expanded');
$('search').oninput=renderLibrary;$('filter').onchange=renderLibrary;
$('csv-files').onchange=async event=>{
 const files=[...event.target.files];
 try{
  const replacing=starterActive&&files.some(f=>/^watchlist(?:\s*\(\d+\))?\.csv$/i.test(f.name));
  const result=await importFileBatch(()=>replacing?dropStarter(state,starterIds):state,files,catalog);
  if(commit(result.state)){if(replacing)endStarter();
   $('import-errors').textContent=result.errors.slice(0,20).join(' ');
   notice(`${result.imported} Filmeinträge eingelesen.${result.errors.length?` ${result.errors.length} fehlerhafte Zeilen übersprungen.`:''}`);
   streaming.refresh();releases.refresh();renderHome();renderLibrary();
  }
 }catch(e){notice(`Import abgebrochen: ${e.message}`);}finally{event.target.value='';}
};
$('backup').onclick=()=>{
 const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`abspann-sicherung-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$('backup-file').onchange=async event=>{
 try{const file=event.target.files[0];if(!file)return;if(file.size>10_000_000)throw Error('Sicherung ist zu groß.');pendingRestore=validateBackup(JSON.parse(await file.text()));$('restore-dialog').showModal();}catch(e){notice(`Sicherung nicht geladen: ${e.message}`);}finally{event.target.value='';}
};
$('cancel-restore').onclick=()=>{pendingRestore=null;$('restore-dialog').close();};
$('confirm-restore').onclick=()=>{const base=starterActive?dropStarter(state,starterIds):state;if(pendingRestore&&commit($('restore-mode').value==='replace'?pendingRestore:mergeBackups(base,pendingRestore),{restoring:true})){endStarter();drawn={};current=null;streaming.refresh();releases.refresh();renderHome();renderLibrary();notice('Sicherung wiederhergestellt.');}pendingRestore=null;$('restore-dialog').close();};
renderHome();releases.refresh();
if(state.selected){current=state.films.find(f=>f.id===state.selected);mood=current.moods[0]||null;if(mood)drawn[mood]=[current.id];renderResult();show('result');}
