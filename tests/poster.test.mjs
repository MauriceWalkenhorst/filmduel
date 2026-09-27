import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {matchMovie,posterLookup}=require('../api/_watchlist-tmdb.cjs');
const movie={id:1,title:'Burning',original_title:'버닝',release_date:'2018-05-17',poster_path:'/abc.jpg',overview:'Story',runtime:148};
test('poster matches exact title and year, refuses ambiguous or wrong matches',()=>{
 assert.equal(matchMovie([movie],'Burning','2018')?.id,1);
 assert.equal(matchMovie([movie],'Burning','2024'),null);
 assert.equal(matchMovie([movie,{...movie,id:2}],'Burning','2018'),null);
 assert.equal(matchMovie([movie],'Other','2018'),null);
});
test('endpoint validates inputs, missing token, upstream failure and returns public metadata only',async()=>{
 assert.equal((await posterLookup({title:'x',year:'oops'},{})).status,400);
 assert.equal((await posterLookup({title:'Example',year:'2018'},{})).status,503);
 const fail=await posterLookup({title:'Example',year:'2018'},{token:'private',fetcher:async()=>({ok:false,status:429})});assert.equal(fail.status,502);
 const ok=await posterLookup({title:'Example',year:'2018'},{token:'private',fetcher:async()=>({ok:true,json:async()=>({results:[{...movie,title:'Example'}]})})});
 assert.equal(ok.status,200);assert.equal(ok.body.poster,'https://image.tmdb.org/t/p/w500/abc.jpg');assert.equal(JSON.stringify(ok).includes('private'),false);
 const none=await posterLookup({title:'Example',year:'2018'},{token:'private',fetcher:async()=>({ok:true,json:async()=>({results:[]})})});assert.equal(none.status,404);
});
test('verified festival-year mapping resolves Minari 2020 to the checked 2021 release',async()=>{
 const result=await posterLookup({title:'Minari',year:'2020'},{token:'x',fetcher:async url=>({ok:true,json:async()=>url.includes('/movie/615643')?{id:615643,title:'Minari',original_title:'Minari',release_date:'2021-02-12',poster_path:'/minari.jpg'}:{results:[]}})});
 assert.equal(result.status,200);assert.equal(result.body.id,615643);
});
