import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../watchlist/core.mjs';
const film=(slug,extra={})=>({id:`https://letterboxd.com/film/${slug}/`,title:slug,year:'2000',moods:['warm'],seen:false,inWatchlist:true,...extra});
test('merge restore preserves seen flags, combines moods and adds films without duplicates',()=>{
 assert.equal(typeof core.mergeBackups,'function');
 const a={version:1,films:[film('a',{seen:true,moods:['deep']})],selected:null};
 const b={version:1,films:[film('a'),film('b')],selected:film('a').id};
 const result=core.mergeBackups(a,b);
 assert.equal(result.films.length,2);assert.equal(result.films[0].seen,true);
 assert.deepEqual(result.films[0].moods,['deep','warm']);assert.equal(result.selected,null);
 assert.deepEqual(core.mergeBackups(result,b),result);assert.equal(a.films.length,1);
});
test('subscription filter rejects rental-only and unknown films and keeps matching subscriptions',()=>{
 assert.equal(typeof core.filterStreaming,'function');
 const films=[film('a'),film('b'),film('c')];
 const offers={[films[0].id]:{flatrate:[{id:8}],rent:[]},[films[1].id]:{flatrate:[],rent:[{id:8}]}};
 assert.deepEqual(core.filterStreaming(films,[8],offers).map(f=>f.title),['a']);
 assert.deepEqual(core.filterStreaming(films,[],offers),[]);
});
