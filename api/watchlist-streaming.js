const {providersLookup}=require('./_watchlist-tmdb.cjs');
const cache=new Map();
module.exports=async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Nur GET erlaubt.'});}
 const {title,year=''}=req.query,key=JSON.stringify([title,year]);
 let hit=cache.get(key),result=hit?.expires>Date.now()?hit.result:null;
 if(!result){result=await providersLookup({title,year},{token:process.env.TMDB_READ_TOKEN});if(result.status===200){if(cache.size>=1000)cache.delete(cache.keys().next().value);cache.set(key,{expires:Date.now()+86400000,result});}}
 res.setHeader('Cache-Control',result.status===200?'public, max-age=3600, s-maxage=86400':'no-store');return res.status(result.status).json(result.body);
};
