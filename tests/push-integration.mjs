// Explicit integration run only: uses the dedicated configured Redis store.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import handler from '../api/watchlist-push.js';
import cron from '../api/watchlist-cron.js';
import push from '../api/_watchlist-push.cjs';
assert.equal(push.configured(),true);
const token=crypto.randomBytes(32).toString('hex'),id=push.idFor(token);
const ec=crypto.createECDH('prime256v1');ec.generateKeys();
const subscription={endpoint:`https://web.push.apple.com/abspann-integration-${id}`,keys:{p256dh:ec.getPublicKey().toString('base64url'),auth:crypto.randomBytes(16).toString('base64url')}};
const invoke=async(fn,method,body,authorization=`Bearer ${token}`)=>{const result={};const response={setHeader(){},status(n){result.status=n;return this;},json(value){result.body=value;return this;}};await fn({method,headers:{host:'filmduel.space',origin:'https://filmduel.space',authorization},body},response);return result;};
try{
 let r=await invoke(handler,'POST',{subscription,location:{lat:51.51,lon:7.46},movies:[{id:290098,title:'The Handmaiden',aliases:['Die Taschendiebin']}]});assert.equal(r.status,200,JSON.stringify(r));
 const saved=JSON.parse(await push.redis('GET',push.prefix+'sub:'+id));assert.equal(saved.movies[0].id,290098);
 r=await invoke(handler,'POST',{subscription,location:{lat:51.51,lon:7.46},movies:[{id:290098,title:'The Handmaiden',aliases:[]}]},`Bearer ${crypto.randomBytes(32).toString('hex')}`);assert.equal(r.status,409);
 r=await invoke(cron,'GET',null,'Bearer wrong');assert.equal(r.status,401);
 r=await invoke(handler,'DELETE');assert.equal(r.status,200);assert.equal(await push.redis('EXISTS',push.prefix+'sub:'+id),0);assert.equal(await push.redis('SISMEMBER',push.prefix+'subscriptions',id),0);
 r=await invoke(handler,'POST',{action:'test'});assert.equal(r.status,404,'Test notification requires a stored subscription');
 console.log('Redis integration: subscribe/read/deduplicate/unsubscribe and cron authorization passed. No notification sent.');
}finally{
 await push.redis('DEL',push.prefix+'sub:'+id,push.prefix+'endpoint:'+push.idFor(subscription.endpoint));await push.redis('SREM',push.prefix+'subscriptions',id);
}
