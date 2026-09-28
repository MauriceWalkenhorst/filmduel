const {createHash}=require('node:crypto');
function validSubscription(s){
 try{const u=new URL(s.endpoint);const allowed=u.hostname==='web.push.apple.com'||u.hostname==='fcm.googleapis.com'||u.hostname==='updates.push.services.mozilla.com'||u.hostname.endsWith('.notify.windows.com');return allowed&&u.protocol==='https:'&&!u.port&&!u.username&&!u.password&&s.endpoint.length<2048&&typeof s.keys?.p256dh==='string'&&typeof s.keys?.auth==='string'&&Buffer.from(s.keys.p256dh,'base64url').length===65&&Buffer.from(s.keys.auth,'base64url').length===16;}catch{return false;}
}
async function deliverEvents(record,events,{store,send,now=Date.now()}){
 let delivered=0,failed=0;
 for(const e of events){
  if(Date.parse(e.startDate)<=now)continue;
  const key=`${record.id}:${e.id}`;if(!await store.claim(key))continue;
  try{await send(record.subscription,JSON.stringify({title:`${e.title} im Kino`,body:`${e.cinema} · ${new Date(e.startDate).toLocaleString('de-DE',{timeZone:'Europe/Berlin'})}`,url:'/watchlist/',tag:e.id}));await store.complete(key);delivered++;}
  catch(error){await store.release(key);if([404,410].includes(error.statusCode))return {delivered,expired:true,failed:failed+1};failed++;}
 }
 return {delivered,failed};
}
const restUrl=()=>process.env.WATCHLIST_KV_REST_API_URL||process.env.WATCHLIST_REDIS_URL;
const restToken=()=>process.env.WATCHLIST_KV_REST_API_TOKEN||process.env.WATCHLIST_REDIS_TOKEN;
function configured(){return Boolean(/^https:\/\//.test(restUrl()||'')&&restToken()&&['WATCHLIST_VAPID_PUBLIC','WATCHLIST_VAPID_PRIVATE','WATCHLIST_VAPID_SUBJECT','WATCHLIST_CRON_SECRET'].every(k=>process.env[k]));}
async function redis(...command){
 const r=await fetch(restUrl(),{method:'POST',headers:{Authorization:`Bearer ${restToken()}`,'Content-Type':'application/json'},body:JSON.stringify(command),signal:AbortSignal.timeout(8000)});
 if(!r.ok)throw Error('Speicher nicht erreichbar.');const data=await r.json();if(data.error)throw Error('Speicherfehler.');return data.result;
}
const prefix='abspann:v2:';
const idFor=token=>createHash('sha256').update(token).digest('hex');
module.exports={validSubscription,deliverEvents,configured,redis,prefix,idFor};
async function admitRegistration(id,store){if(!await store.exists(id)&&await store.count()>=100)throw Error('Kinoalarm-Kapazität erreicht.');return true;}
module.exports.admitRegistration=admitRegistration;
