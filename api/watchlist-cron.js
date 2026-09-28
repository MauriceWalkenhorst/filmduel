const {timingSafeEqual,randomUUID}=require('node:crypto');
const {configured,redis,prefix,deliverEvents}=require('./_watchlist-push.cjs');
const {screeningsAt,matchScreenings}=require('./_watchlist-cinema.cjs');
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 const expected=`Bearer ${process.env.WATCHLIST_CRON_SECRET||''}`,actual=req.headers.authorization||'';
 if(!process.env.WATCHLIST_CRON_SECRET||actual.length!==expected.length||!timingSafeEqual(Buffer.from(actual),Buffer.from(expected)))return res.status(401).json({error:'Unauthorized'});
 if(!configured())return res.status(503).json({error:'Push not configured'});
 const lockToken=randomUUID();
 if(!await redis('SET',prefix+'cron-lock',lockToken,'NX','EX',300))return res.status(200).json({busy:true});
 try{
  const webpush=require('web-push');webpush.setVapidDetails(process.env.WATCHLIST_VAPID_SUBJECT,process.env.WATCHLIST_VAPID_PUBLIC,process.env.WATCHLIST_VAPID_PRIVATE);
  const ids=await redis('SMEMBERS',prefix+'subscriptions');let delivered=0,failed=0;
  for(const id of ids){
   const raw=await redis('GET',prefix+'sub:'+id);if(!raw){await redis('SREM',prefix+'subscriptions',id);continue;}
   const record=typeof raw==='string'?JSON.parse(raw):raw,data=await screeningsAt(record.location),events=matchScreenings(data.events,record.movies);
   const result=await deliverEvents(record,events,{store:{claim:async key=>{if(await redis('EXISTS',prefix+'sent:'+key))return false;return Boolean(await redis('SET',prefix+'lease:'+key,'1','NX','EX',300));},complete:async key=>{await redis('SET',prefix+'sent:'+key,'1','EX',31536000);await redis('DEL',prefix+'lease:'+key);},release:key=>redis('DEL',prefix+'lease:'+key)},send:(sub,payload)=>webpush.sendNotification(sub,payload,{TTL:86400,timeout:10000})});
   delivered+=result.delivered;failed+=result.failed||0;
   if(result.expired){await redis('DEL',prefix+'sub:'+id);await redis('SREM',prefix+'subscriptions',id);}
  }
  return res.status(200).json({delivered,failed});
 }catch{return res.status(503).json({error:'Kinoalarm-Prüfung fehlgeschlagen.'});}
 finally{await redis('EVAL',"if redis.call('GET',KEYS[1]) == ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end",1,prefix+'cron-lock',lockToken);}
};
