import {validateReleases,shouldRecheckRelease,releaseInfo,filterReleased,needsReleaseCheck} from './core.mjs';
// Lokales Kalenderdatum, nicht UTC: ein Film mit Start heute gilt ab Mitternacht als erschienen.
export const today=()=>new Date().toLocaleDateString('sv-SE');
export function createReleases({getFilms,onChange}){
 const KEY='watchlist.releases.v1';
 let known={},run=0;
 try{known=validateReleases(JSON.parse(localStorage.getItem(KEY)||'{}'));}catch{}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(known));}catch{}}
 function store(film,date){
  if(!needsReleaseCheck(film,today()))return false;
  known[film.id]={date:/^\d{4}-\d{2}-\d{2}$/.test(date||'')?date:'',checked:today()};save();return true;
 }
 async function refresh(){
  const serial=++run,t=today();
  const queue=getFilms().filter(f=>f.inWatchlist&&!f.seen&&shouldRecheckRelease(f,known[f.id],t));
  let changed=false;
  await Promise.all(Array.from({length:2},async()=>{while(queue.length&&serial===run){const f=queue.shift();try{
   const r=await fetch(`/api/watchlist-poster?${new URLSearchParams({title:f.title,year:f.year})}`);const d=await r.json();
   if(r.ok||r.status===404)changed=store(f,r.ok?d.releaseDate:'')||changed;
  }catch{}}}));
  if(changed&&serial===run)onChange();
 }
 return {
  filter:films=>filterReleased(films,known,today()),
  info:film=>releaseInfo(film,known[film.id],today()),
  record:(film,date)=>{if(store(film,date))onChange();},
  refresh,
 };
}
