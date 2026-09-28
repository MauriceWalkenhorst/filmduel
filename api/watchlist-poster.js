const {posterLookup}=require('./_watchlist-tmdb.cjs');
const cache=new Map();
// Handlung auf Deutsch, falls TMDB eine hat; sonst bleibt die englische.
async function withGermanOverview(result){
 try{const r=await fetch(`https://api.themoviedb.org/3/movie/${result.body.id}?language=de-DE`,{headers:{Authorization:`Bearer ${process.env.TMDB_READ_TOKEN}`},signal:AbortSignal.timeout(8000)});if(!r.ok)return result;const d=await r.json();return typeof d.overview==='string'&&d.overview.trim()?{...result,body:{...result.body,overview:d.overview.trim()}}:result;}catch{return result;}
}
module.exports=async function handler(req,res){
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Nur GET erlaubt.'});}
 const {title,year=''}=req.query;
 const key=JSON.stringify([title,year]);const cached=cache.get(key);
 let result=cached?.expires>Date.now()?cached.result:null;
 if(!result){result=await posterLookup({title,year},{token:process.env.TMDB_READ_TOKEN});if(result.status===200){result=await withGermanOverview(result);if(cache.size>=500)cache.delete(cache.keys().next().value);cache.set(key,{expires:Date.now()+3600000,result});}}
 res.setHeader('Cache-Control',result.status===200?'public, max-age=3600, s-maxage=86400':'no-store');
 return res.status(result.status).json(result.body);
};
