import test from 'node:test';
import assert from 'node:assert/strict';
import tmdb from '../api/_watchlist-tmdb.cjs';
test('streaming lookup separates German subscription, rental and purchase and rejects unsafe links',async()=>{
 assert.equal(typeof tmdb.providersLookup,'function');
 const fetcher=async url=>({ok:true,json:async()=>url.includes('watch/providers')?{results:{DE:{link:'javascript:bad',flatrate:[{provider_id:8,provider_name:'Netflix'}],rent:[{provider_id:9,provider_name:'Amazon'}]},US:{flatrate:[{provider_id:99,provider_name:'Wrong region'}]}}}:{results:[{id:100,title:'Example',release_date:'2000-01-01'}]}});
 const r=await tmdb.providersLookup({title:'Example',year:'2000'},{token:'test',fetcher});
 assert.equal(r.status,200);assert.deepEqual(r.body.flatrate,[{id:8,name:'Netflix'}]);assert.deepEqual(r.body.buy,[]);assert.equal(r.body.rent[0].id,9);assert.match(r.body.link,/^https:\/\/www.themoviedb.org\//);
});
test('provider failures and ambiguous film matches never mean available',async()=>{
 assert.equal(typeof tmdb.providersLookup,'function');
 const r=await tmdb.providersLookup({title:'Example',year:'2000'},{token:'test',fetcher:async()=>({ok:false})});assert.equal(r.status,502);
 const missing=await tmdb.providersLookup({title:'Example',year:'2000'},{token:'test',fetcher:async()=>({ok:true,json:async()=>({results:[]})})});assert.equal(missing.status,404);
});
