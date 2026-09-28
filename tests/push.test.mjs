import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let push;try{push=require('../api/_watchlist-push.cjs');}catch{push={};}
test('push subscriptions reject arbitrary endpoints and invalid key material',()=>{
 assert.equal(typeof push.validSubscription,'function');
 const s={endpoint:'https://web.push.apple.com/Q123',keys:{p256dh:Buffer.alloc(65).toString('base64url'),auth:Buffer.alloc(16).toString('base64url')}};
 assert.equal(push.validSubscription(s),true);assert.equal(push.validSubscription({...s,endpoint:'https://127.0.0.1/secret'}),false);
 assert.equal(push.validSubscription({...s,endpoint:'https://web.push.apple.com.evil.example/push'}),false);assert.equal(push.validSubscription({...s,keys:{auth:'x',p256dh:'x'}}),false);
});
test('event push claims each event once, retries failed deliveries and skips past events',async()=>{
 assert.equal(typeof push.deliverEvents,'function');
 const claimed=new Set(),sent=[];
 const store={claim:async key=>{if(claimed.has(key))return false;claimed.add(key);return true;},release:async key=>claimed.delete(key),complete:async()=>{}};
 const event={id:'e1',startDate:'2030-01-01T18:00:00Z',title:'Film',cinema:'Kino'};
 const sub={id:'sub1',subscription:{}};
 await push.deliverEvents(sub,[event],{store,send:async(_,p)=>sent.push(p),now:Date.parse('2026-09-28')});
 await push.deliverEvents(sub,[event],{store,send:async(_,p)=>sent.push(p),now:Date.parse('2026-09-28')});assert.equal(sent.length,1);
 await push.deliverEvents(sub,[{...event,id:'e2'}],{store,send:async()=>{throw Error('network');},now:Date.parse('2026-09-28')});assert.equal(claimed.has('sub1:e2'),false);
 await push.deliverEvents(sub,[{...event,id:'past',startDate:'2020-01-01'}],{store,send:async()=>sent.push('bad'),now:Date.parse('2026-09-28')});assert.equal(sent.length,1);
});

test('delivery records completion only after sending, with a retryable lease on failure',async()=>{
 const actions=[];
 const store={claim:async()=>{actions.push('lease');return true;},complete:async()=>actions.push('sent'),release:async()=>actions.push('release')};
 await push.deliverEvents({id:'s',subscription:{}},[{id:'e',startDate:'2030-01-01',title:'A',cinema:'B'}],{store,send:async()=>actions.push('send')});
 assert.deepEqual(actions,['lease','send','sent']);
});

test('registration rejects a full store but permits updating an existing device',async()=>{
 assert.equal(typeof push.admitRegistration,'function');
 const store={exists:async()=>false,count:async()=>100};
 await assert.rejects(()=>push.admitRegistration('new',store),/Kapazität/);
 assert.equal(await push.admitRegistration('old',{exists:async()=>true,count:async()=>100}),true);
});

test('marketplace REST variables enable push without treating the Redis TCP URL as HTTP',()=>{
 const before={...process.env};
 try{
 for(const key of Object.keys(process.env))if(key.startsWith('WATCHLIST_'))delete process.env[key];
 Object.assign(process.env,{WATCHLIST_KV_REST_API_URL:'https://example.upstash.io',WATCHLIST_KV_REST_API_TOKEN:'secret',WATCHLIST_REDIS_URL:'rediss://not-http',WATCHLIST_VAPID_PUBLIC:'public',WATCHLIST_VAPID_PRIVATE:'private',WATCHLIST_VAPID_SUBJECT:'https://filmduel.space/watchlist/',WATCHLIST_CRON_SECRET:'secret'});
 assert.equal(Boolean(push.configured()),true);
 delete process.env.WATCHLIST_KV_REST_API_URL;assert.equal(Boolean(push.configured()),false);
 }finally{for(const key of Object.keys(process.env))delete process.env[key];Object.assign(process.env,before);}
});
