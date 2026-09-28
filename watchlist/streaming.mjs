import {filterStreaming} from './core.mjs';
export function createStreaming({getFilms,onChange,onNotice}){
 const $=id=>document.getElementById(id),offers={},pending=new Map();
 let services=[],enabled=false,run=0,resultRun=0;
 try{const stored=JSON.parse(localStorage.getItem('watchlist.services.v1')||'[]');if(Array.isArray(stored))services=stored.filter(Number.isInteger);}catch{}
 const providers=[[8,'Netflix'],[9,'Amazon Prime Video'],[337,'Disney+'],[350,'Apple TV'],[531,'Paramount+'],[30,'WOW'],[2750,'RTL+'],[421,'Joyn Plus']];
 function save(){try{localStorage.setItem('watchlist.services.v1',JSON.stringify(services));}catch{onNotice('Dienste konnten nicht gespeichert werden.');}}
 function filter(films){const ids=[...services];if(ids.includes(8))ids.push(1796,175);if(ids.includes(9))ids.push(2100);return enabled?filterStreaming(films,ids,offers):films;}
 async function lookup(film){
  if(offers[film.id])return offers[film.id];
  if(pending.has(film.id))return pending.get(film.id);
  const task=(async()=>{const response=await fetch(`/api/watchlist-streaming?${new URLSearchParams({title:film.title,year:film.year})}`);const data=await response.json();if(!response.ok)throw Error(data.error||'Streaming-Daten fehlen.');offers[film.id]=data;return data;})();
  pending.set(film.id,task);try{return await task;}finally{pending.delete(film.id);}
 }
 async function refresh(){
  const serial=++run;if(!enabled){$('streaming-progress').textContent='';onChange();return;}
  const queue=getFilms().filter(f=>f.inWatchlist&&!f.seen);let done=0,failed=0;
  onChange();
  await Promise.all(Array.from({length:3},async()=>{while(queue.length&&serial===run){const f=queue.shift();try{await lookup(f);}catch{failed++;}done++;if(serial===run){$('streaming-progress').textContent=`${done} Filme geprüft${failed?` · ${failed} unbekannt`:''}`;onChange();}}}));
 }
 $('services').replaceChildren(...providers.map(([id,name])=>{const l=document.createElement('label'),c=document.createElement('input');c.type='checkbox';c.checked=services.includes(id);c.onchange=()=>{services=c.checked?[...services,id]:services.filter(x=>x!==id);save();onChange();};l.append(c,document.createTextNode(name));return l;}));
 $('only-services').onchange=()=>{enabled=$('only-services').checked;refresh();};
 $('refresh-streaming').onclick=()=>{for(const k of Object.keys(offers))delete offers[k];refresh();};
 async function show(film){
  const serial=++resultRun,el=$('streaming-result');el.textContent='Streaming-Angebote werden geprüft …';
  try{const d=await lookup(film);if(serial!==resultRun)return;el.replaceChildren();
   const heading=document.createElement('h3');heading.textContent='Wo läuft der Film? · Deutschland';el.append(heading);
   for(const [key,label] of [['flatrate','Im Abo'],['rent','Leihen'],['buy','Kaufen'],['free','Kostenlos'],['ads','Mit Werbung']]){if(!d[key]?.length)continue;const p=document.createElement('p');p.textContent=`${label}: ${d[key].map(x=>x.name).join(', ')}`;el.append(p);}
   if(!['flatrate','rent','buy','free','ads'].some(k=>d[k]?.length)){const p=document.createElement('p');p.textContent='Keine Angebote gemeldet. Die Verfügbarkeit kann unvollständig sein.';el.append(p);}
   const a=document.createElement('a');a.href=d.link;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Angebote öffnen ↗';el.append(a);
   const p=document.createElement('p');p.className='muted';p.textContent=`Daten: JustWatch über TMDB · geprüft ${new Date(d.checkedAt).toLocaleDateString('de-DE')}. Preise und Verfügbarkeit beim Anbieter prüfen.`;el.append(p);
  }catch(e){if(serial===resultRun)el.textContent=e.message;}
 }
 return {filter,show,refresh};
}
