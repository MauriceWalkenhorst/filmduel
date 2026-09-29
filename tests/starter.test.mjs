import test from 'node:test';
import assert from 'node:assert/strict';
import {starterState,dropStarter,importCSV,validateBackup} from '../watchlist/core.mjs';
import {starterFilms} from '../watchlist/starter.mjs';

test('starter list has 100 valid, unique films with moods',()=>{
 const s=starterState(starterFilms);
 assert.equal(s.films.length,100);
 assert.equal(new Set(s.films.map(f=>f.id)).size,100);
 assert.ok(s.films.every(f=>f.inWatchlist&&!f.seen&&f.moods.length>0));
 assert.doesNotThrow(()=>validateBackup(s));
});

test('first own watchlist import replaces the starter list but keeps seen films as seen',()=>{
 const ids=new Set(starterFilms.map(f=>f[0]));
 let s=starterState(starterFilms);
 const parasite=s.films[0].id,mulholland=s.films[1].id;
 s={...s,films:s.films.map(f=>f.id===parasite?{...f,seen:true}:f),selected:mulholland};
 const dropped=dropStarter(s,ids);
 assert.equal(dropped.films.length,1);
 assert.deepEqual(dropped.films[0],{...s.films[0],inWatchlist:false});
 assert.equal(dropped.selected,null);
 const csv='Date,Name,Year,Letterboxd URI\n2026-01-01,Heat,1995,https://boxd.it/2aYq\n2026-01-01,Parasite,2019,https://letterboxd.com/film/parasite-2019/\n';
 const result=importCSV(dropped,csv,'watchlist').state;
 assert.equal(result.films.length,2);
 assert.equal(result.films.find(f=>f.id===parasite).seen,true);
});

test('dropStarter leaves non-starter films untouched',()=>{
 const own={id:'https://boxd.it/2aYq/',title:'Heat',year:'1995',moods:['dark'],seen:false,inWatchlist:true};
 const s={...starterState(starterFilms)};s.films=[...s.films,own];
 assert.deepEqual(dropStarter(s,new Set(starterFilms.map(f=>f[0]))).films,[own]);
});
