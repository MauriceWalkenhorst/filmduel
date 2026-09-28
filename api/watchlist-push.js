const {validSubscription,configured,redis,prefix,idFor,admitRegistration}=require('./_watchlist-push.cjs');
const {coordinates}=require('./_watchlist-cinema.cjs');
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.method==='GET')return res.status(200).json({available:Boolean(configured()),publicKey:configured()?process.env.WATCHLIST_VAPID_PUBLIC:null,interval:'täglich',reason:configured()?null:'Der Kinoalarm ist noch nicht serverseitig eingerichtet.'});
 if(!['POST','DELETE'].includes(req.method))return res.status(405).json({error:'Methode nicht erlaubt.'});
 if(!configured())return res.status(503).json({error:'Der Kinoalarm ist noch nicht eingerichtet.'});
 if(req.headers.origin&&req.headers.origin!==`https://${req.headers.host}`&&!(req.headers.host||'').startsWith('localhost:'))return res.status(403).json({error:'Ungültiger Ursprung.'});
 const token=(req.headers.authorization||'').replace(/^Bearer /,'');if(!/^[a-f0-9]{64}$/.test(token))return res.status(401).json({error:'Gerätekennung fehlt.'});
 const id=idFor(token);
 try{
  if(req.method==='DELETE'){const old=await redis('GET',prefix+'sub:'+id);if(old){const record=typeof old==='string'?JSON.parse(old):old;await redis('DEL',prefix+'endpoint:'+idFor(record.subscription.endpoint));}await redis('DEL',prefix+'sub:'+id);await redis('SREM',prefix+'subscriptions',id);return res.status(200).json({removed:true});}
  const requests=await redis('INCR',prefix+'registrations:'+Math.floor(Date.now()/3600000));if(requests===1)await redis('EXPIRE',prefix+'registrations:'+Math.floor(Date.now()/3600000),7200);if(requests>60)return res.status(429).json({error:'Zu viele Änderungen. Bitte später erneut versuchen.'});
  await admitRegistration(id,{exists:async key=>Boolean(await redis('EXISTS',prefix+'sub:'+key)),count:()=>redis('SCARD',prefix+'subscriptions')});
  const b=req.body;if(!b||JSON.stringify(b).length>100000||!validSubscription(b.subscription)||!Array.isArray(b.movies)||!b.movies.length||b.movies.length>300)return res.status(400).json({error:'Ungültiges Push-Abonnement oder keine Filme ausgewählt.'});
  const location=coordinates(b.location?.lat,b.location?.lon);
  const movies=b.movies.map(m=>{if(!Number.isInteger(m.id)||m.id<1||typeof m.title!=='string'||m.title.length>200||!Array.isArray(m.aliases)||m.aliases.length>10||m.aliases.some(a=>typeof a!=='string'||a.length>200))throw Error('Ungültiger Film.');return {id:m.id,title:m.title,aliases:m.aliases};});
  const record={id,subscription:b.subscription,location,movies,updatedAt:new Date().toISOString()};
  const endpointKey=prefix+'endpoint:'+idFor(b.subscription.endpoint);
  const saved=await redis('EVAL',"local owner=redis.call('GET',KEYS[3]); if owner and owner ~= ARGV[1] then return -1 end; if redis.call('SISMEMBER',KEYS[2],ARGV[1]) == 0 and redis.call('SCARD',KEYS[2]) >= 100 then return 0 end; redis.call('SET',KEYS[1],ARGV[2],'EX',31536000); redis.call('SADD',KEYS[2],ARGV[1]); redis.call('SET',KEYS[3],ARGV[1],'EX',31536000); return 1",3,prefix+'sub:'+id,prefix+'subscriptions',endpointKey,id,JSON.stringify(record));
  if(saved!==1)return res.status(409).json({error:saved===-1?'Dieses Push-Abonnement ist bereits einem Gerät zugeordnet.':'Kinoalarm-Kapazität erreicht.'});
  return res.status(200).json({saved:true});
 }catch(e){return res.status(/Ungültig|Standort/.test(e.message)?400:503).json({error:e.message});}
};
