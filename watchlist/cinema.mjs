export function createCinema({notice}){
 const $=id=>document.getElementById(id);let location=null,movies=[],token=null,active=false,config=null;
 try{const s=JSON.parse(localStorage.getItem('watchlist.cinema.v1')||'{}');location=s.location||null;movies=Array.isArray(s.movies)?s.movies:[];token=s.token||null;active=s.active===true;}catch{}
 function save(){localStorage.setItem('watchlist.cinema.v1',JSON.stringify({location,movies,token,active}));}
 async function request(url,options){const r=await fetch(url,options),d=await r.json();if(!r.ok)throw Error(d.error||'Anfrage fehlgeschlagen.');return d;}
 function render(){
  $('cinema-location').textContent=location?`${location.name} · 100 km Luftlinie`:'Noch kein Standort gewählt.';
  $('watched-movies').replaceChildren(...movies.map(m=>{const row=document.createElement('p'),b=document.createElement('button');b.className='quiet';b.textContent='Entfernen';b.onclick=async()=>{movies=movies.filter(x=>x.id!==m.id);save();render();if(active)await sync().catch(e=>notice(e.message));};row.append(document.createTextNode(m.title+' '),b);return row;}));
  $('push-disable').hidden=!active;$('push-test').hidden=!active;
 }
 async function sync(){
  if(!active)return;
  if(!movies.length){await disable();return;}
  const registration=await navigator.serviceWorker.getRegistration('/watchlist/'),subscription=await registration?.pushManager.getSubscription();if(!subscription)throw Error('Push-Abonnement fehlt. Bitte erneut aktivieren.');
  await request('/api/watchlist-push',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({location,movies,subscription:subscription.toJSON()})});
 }
 async function add(film){try{const m=await request(`/api/watchlist-cinema?${new URLSearchParams({action:'movie',title:film.title,year:film.year})}`);if(!movies.some(x=>x.id===m.id))movies.push(m);save();render();if(active)await sync();notice(`${film.title} für den Kinoalarm vorgemerkt.${active?'':' Push ist noch nicht aktiviert.'}`);return true;}catch(e){notice(e.message);return false;}}
 $('add-cinema-film').onclick=async()=>{if(await add({title:$('cinema-film-title').value.trim(),year:$('cinema-film-year').value.trim()})){$('cinema-film-title').value='';$('cinema-film-year').value='';}};
 $('find-location').onclick=async()=>{
  $('find-location').disabled=true;
  try{const data=await request(`/api/watchlist-cinema?${new URLSearchParams({action:'places',q:$('location-query').value})}`);$('location-options').replaceChildren();if(!data.places.length)$('location-options').textContent='Kein Ort gefunden.';for(const p of data.places){const b=document.createElement('button');b.className='secondary';b.textContent=p.name;b.onclick=async()=>{location=p;save();render();$('location-options').replaceChildren();if(active)await sync().catch(e=>notice(e.message));};$('location-options').append(b);}}catch(e){notice(e.message);}finally{$('find-location').disabled=false;}
 };
 $('check-cinemas').onclick=async()=>{
  if(!location){notice('Bitte zuerst deinen Standort wählen.');return;}$('check-cinemas').disabled=true;$('cinema-results').textContent='Spielpläne werden geprüft …';
  try{const data=await request(`/api/watchlist-cinema?${new URLSearchParams({lat:location.lat,lon:location.lon})}`),el=$('cinema-results');el.replaceChildren();
   const status=document.createElement('p');status.textContent=`${data.sources.filter(s=>s.status==='checked').length} von ${data.sources.length} angebundenen Kinos im Umkreis geprüft. ${data.coverage}`;el.append(status);
   for(const s of data.sources){const p=document.createElement('p');p.textContent=`${s.name}: ${s.status==='checked'?`${s.count} Termine eingelesen`:'zurzeit nicht erreichbar'}`;el.append(p);}
   const norm=s=>s.normalize('NFKD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
   const hits=data.events.filter(e=>movies.filter(m=>[m.title,...m.aliases].some(t=>norm(t)===norm(e.title))).length===1);
   if(!hits.length){const p=document.createElement('p');p.textContent='Keine passenden Termine in den geprüften Spielplänen gefunden.';el.append(p);}
   for(const e of hits){const p=document.createElement('p'),a=document.createElement('a');a.href=e.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=`${e.title} · ${e.cinema} · ${new Date(e.startDate).toLocaleString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Berlin'})} Uhr · ${e.distanceKm} km ↗`;p.append(a);el.append(p);}
  }catch(e){$('cinema-results').textContent=e.message;}finally{$('check-cinemas').disabled=false;}
 };
 async function disable(){await request('/api/watchlist-push',{method:'DELETE',headers:{Authorization:`Bearer ${token}`}});const reg=await navigator.serviceWorker.getRegistration('/watchlist/');await (await reg?.pushManager.getSubscription())?.unsubscribe();active=false;save();render();$('push-status').textContent='Kinoalarm deaktiviert. Servereintrag gelöscht.';}
 $('push-test').onclick=async()=>{try{await request('/api/watchlist-push',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({action:'test'})});notice('Testnachricht an den Push-Dienst übergeben. Prüfe die Mitteilungen auf deinem Gerät.');}catch(e){notice(e.message);}};
 $('push-disable').onclick=()=>disable().catch(e=>notice(e.message));
 $('push-enable').onclick=async()=>{
  try{
   if(!location||!movies.length)throw Error('Bitte Standort und mindestens einen Film vormerken.');
   if(!config?.available)throw Error(config?.reason||'Push-Dienst nicht erreichbar.');
   if(!('serviceWorker' in navigator)||!('PushManager' in window))throw Error('Push ist hier nicht verfügbar. Auf dem iPhone Abspann zum Home-Bildschirm hinzufügen und dort öffnen.');
   const permission=await Notification.requestPermission();if(permission!=='granted')throw Error('Benachrichtigungen wurden nicht erlaubt.');
   const registration=await navigator.serviceWorker.register('./sw.js',{scope:'/watchlist/'});await navigator.serviceWorker.ready;
   const key=config.publicKey.replace(/-/g,'+').replace(/_/g,'/');const bytes=Uint8Array.from(atob(key+'='.repeat((4-key.length%4)%4)),c=>c.charCodeAt(0));
   await registration.pushManager.getSubscription()||await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes});
   token??=Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');active=true;save();
   try{await sync();}catch(e){active=false;save();throw e;}
   render();$('push-status').textContent='Aktiv: tägliche Prüfung. Nachricht bei einem neuen passenden Termin, sobald er erkannt wird.';
  }catch(e){notice(e.message);}
 };
 request('/api/watchlist-push').then(d=>{config=d;$('push-status').textContent=d.available?(active?'Kinoalarm auf diesem Gerät aktiviert.':'Push verfügbar. Aktivierung über den Button.'):d.reason;$('push-enable').disabled=!d.available;}).catch(()=>{$('push-status').textContent='Push-Dienst nicht erreichbar.';});
 render();return {add};
}
