const {coordinates,screeningsAt}=require('./_watchlist-cinema.cjs');
const {posterLookup}=require('./_watchlist-tmdb.cjs');
const geoCache=new Map();
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET')return res.status(405).json({error:'Nur GET erlaubt.'});
 const q=req.query||{};
 try{
  if(q.action==='places'){
   if(typeof q.q!=='string'||q.q.trim().length<2||q.q.length>100)return res.status(400).json({error:'Bitte Stadt oder PLZ eingeben.'});
   const term=q.q.trim().toLowerCase();let data=geoCache.get(term);
   if(!data){const u=new URL('https://geocoding-api.open-meteo.com/v1/search');u.search=new URLSearchParams({name:term,count:'8',language:'de'});const r=await fetch(u,{signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('Ortssuche nicht erreichbar.');const raw=await r.json();data=(raw.results||[]).map(p=>({name:[p.name,p.admin1,p.country].filter(Boolean).join(', '),lat:p.latitude,lon:p.longitude}));if(geoCache.size>200)geoCache.clear();geoCache.set(term,data);}
   return res.status(200).json({places:data});
  }
  if(q.action==='movie'){
   const m=await posterLookup({title:q.title,year:q.year||''},{token:process.env.TMDB_READ_TOKEN});if(m.status!==200)return res.status(m.status).json(m.body);
   const r=await fetch(`https://api.themoviedb.org/3/movie/${m.body.id}?language=de-DE`,{headers:{Authorization:`Bearer ${process.env.TMDB_READ_TOKEN}`},signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('Filmtitel konnten nicht abgeglichen werden.');const d=await r.json();
   return res.status(200).json({id:m.body.id,title:q.title,aliases:[...new Set([d.title,d.original_title,m.body.title].filter(Boolean))]});
  }
  const location=coordinates(q.lat,q.lon);return res.status(200).json(await screeningsAt(location));
 }catch(e){return res.status(/Standort/.test(e.message)?400:502).json({error:e.message||'Kinodaten konnten nicht geladen werden.'});}
};
