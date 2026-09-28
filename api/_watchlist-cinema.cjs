const {createHash}=require('node:crypto');
const norm=s=>String(s||'').normalize('NFKD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
function coordinates(lat,lon){
 if(lat==null||lon==null||String(lat).trim()===''||String(lon).trim()===''||!Number.isFinite(Number(lat))||!Number.isFinite(Number(lon))||Math.abs(Number(lat))>90||Math.abs(Number(lon))>180)throw Error('Standort ungültig.');
 return {lat:Number(lat),lon:Number(lon)};
}
function distanceKm(a,b){const rad=v=>v*Math.PI/180,dlat=rad(b.lat-a.lat),dlon=rad(b.lon-a.lon),h=Math.sin(dlat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dlon/2)**2;return 6371*2*Math.asin(Math.min(1,Math.sqrt(h)));}
function parseScreenings(html,source,now=Date.now()){
 const events=new Map();
 function visit(value){
  if(Array.isArray(value)){value.forEach(visit);return;}if(!value||typeof value!=='object')return;
  if(value['@graph'])visit(value['@graph']);
  if(value['@type']!=='ScreeningEvent')return;
  const title=value.workPresented?.name||value.name,date=value.startDate,offer=Array.isArray(value.offers)?value.offers[0]:value.offers;
  const url=offer?.url||value.url;
  if(typeof title!=='string'||typeof date!=='string'||!Number.isFinite(Date.parse(date))||Date.parse(date)<=now||/Cancelled|Postponed/.test(value.eventStatus||''))return;
  let link;try{link=new URL(url);if(link.protocol!=='https:'||link.username||link.password)return;}catch{return;}
  const id=createHash('sha256').update([source.id,norm(title),new Date(date).toISOString()].join('|')).digest('hex');
  events.set(id,{id,title,startDate:date,cinema:source.name,cinemaId:source.id,url:link.href});
 }
 for(const m of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{visit(JSON.parse(m[1]));}catch{}}
 return [...events.values()].sort((a,b)=>Date.parse(a.startDate)-Date.parse(b.startDate));
}
function matchScreenings(events,movies){return events.flatMap(e=>{const matches=movies.filter(m=>[m.title,...(m.aliases||[])].some(t=>norm(t)===norm(e.title)));return matches.length===1?[{...e,movieId:matches[0].id}]:[];});}
const sources=require('./_watchlist-cinemas.json');
const cache=new Map();
async function screeningsAt(location,{fetcher=fetch,now=Date.now()}={}){
 const nearby=sources.filter(s=>distanceKm(location,s)<=100),status=[],events=[];
 await Promise.all(nearby.map(async s=>{
  try{
   let cached=cache.get(s.id);if(!cached||now-cached.at>3600000){const r=await fetcher(s.url,{signal:AbortSignal.timeout(10000),redirect:'error',headers:{'User-Agent':'Abspann/1.0 (+https://filmduel.space/watchlist/)'}});if(!r.ok)throw Error();const text=await r.text();if(text.length>5000000)throw Error();cached={at:now,events:parseScreenings(text,s,now)};cache.set(s.id,cached);}
   events.push(...cached.events.filter(e=>Date.parse(e.startDate)>now).map(e=>({...e,distanceKm:Math.round(distanceKm(location,s)*10)/10})));
   status.push({id:s.id,name:s.name,url:s.url,status:'checked',count:cached.events.length});
  }catch{status.push({id:s.id,name:s.name,url:s.url,status:'unavailable'});}
 }));
 return {events:events.sort((a,b)=>Date.parse(a.startDate)-Date.parse(b.startDate)),sources:status,radiusKm:100,checkedAt:new Date(now).toISOString(),coverage:'Nur die aufgeführten angebundenen Kinos werden geprüft. Weitere Kinos und Sondervorstellungen können fehlen.'};
}
module.exports={coordinates,distanceKm,parseScreenings,matchScreenings,screeningsAt};
