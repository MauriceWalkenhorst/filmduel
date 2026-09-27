import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseCSV, importCSV, drawFilm, eligibleFilms, validateBackup, saveState, loadState, emptyState } from '../watchlist/core.mjs';
const csv = 'Date,Name,Year,Letterboxd URI\n2026-01-01,"A, film",2020,https://letterboxd.com/film/a/\n';
const film = (id, moods = ['warm']) => ({id:`https://letterboxd.com/film/${id}/`,title:id,year:'2020',moods,seen:false,inWatchlist:true});
test('quoted commas, newlines, escaped quotes and BOM parse without splitting films',()=>{
 assert.deepEqual(parseCSV('\ufeffName,Year\r\n"A, ""film""\nPart 2",2020\r\n'),[{Name:'A, "film"\nPart 2',Year:'2020'}]);
 assert.throws(()=>parseCSV('Name,Year\n"bad,2020'),/Anführungszeichen/);
});
test('import merges by URI and preserves manual moods and local watched state',()=>{
 let s=importCSV(emptyState(),csv,'watchlist').state;
 assert.equal(s.films.length,1); assert.equal(s.films[0].title,'A, film');
 s.films[0].moods=['deep']; s.films[0].seen=true;
 s=importCSV(s,csv,'watchlist').state;
 assert.equal(s.films.length,1); assert.deepEqual(s.films[0].moods,['deep']); assert.equal(s.films[0].seen,true);
});
test('watched import excludes existing watchlist movie, regardless of import order',()=>{
 for (const order of [['watchlist','watched'],['watched','watchlist']]) {
 let s=emptyState(); for(const kind of order)s=importCSV(s,csv,kind).state;
 assert.equal(s.films[0].seen,true); assert.equal(eligibleFilms(s.films,'warm').length,0);
 }
});
test('rejects missing columns and reports invalid rows instead of destroying state',()=>{
 assert.throws(()=>importCSV(emptyState(),'Name\nFilm','watchlist'),/Spalten/);
 const r=importCSV(emptyState(),'Name,Year,Letterboxd URI\nBad,2020,javascript:alert(1)\nFuture,,https://letterboxd.com/film/future/','watchlist');
 assert.equal(r.errors.length,1);assert.equal(r.state.films.length,1);assert.equal(r.state.films[0].year,'');
});
test('draw excludes seen, wrong moods, non-watchlist and already drawn; supports endpoints',()=>{
 const fs=[film('a'),film('b'),{...film('seen'),seen:true},film('dark',['dark']),{...film('other'),inWatchlist:false}];
 assert.equal(drawFilm(fs,'warm',[],()=>0).id,fs[0].id);
 assert.equal(drawFilm(fs,'warm',[],()=>0.99999).id,fs[1].id);
 assert.equal(drawFilm(fs,'warm',[fs[0].id],()=>0).id,fs[1].id);
 assert.equal(drawFilm(fs,'warm',[fs[0].id,fs[1].id]),null);
 assert.equal(drawFilm([],'warm',[]),null);
 assert.equal(drawFilm([film('one')],'warm',[]).title,'one');
});
test('backup round trips and rejects malformed movies, duplicates and unsafe links',()=>{
 const s={...emptyState(),films:[film('a')]};assert.deepEqual(validateBackup(JSON.parse(JSON.stringify(s))),s);
 assert.throws(()=>validateBackup({version:1,films:[{...film('a'),moods:['wrong']}]}));
 assert.throws(()=>validateBackup({...s,films:[film('a'),film('a')]}));
 assert.throws(()=>validateBackup({...s,films:[{...film('a'),id:'javascript:alert(1)'}]}));
 assert.throws(()=>validateBackup({...s,selected:'missing'}));
});
test('storage errors are reported and corrupt data is not silently replaced',()=>{
 const store=new Map();const storage={setItem:(k,v)=>store.set(k,v),getItem:k=>store.get(k)??null};
 const s={...emptyState(),films:[film('a')],selected:film('a').id};saveState(storage,s);assert.deepEqual(loadState(storage),s);
 assert.throws(()=>saveState({setItem(){throw Error('quota')}},s),/gespeichert/);
 assert.throws(()=>loadState({getItem(){return 'broken'}}),/Sicherung/);
});
test('actual export counts and repeat import are stable',{skip:!process.env.LETTERBOXD_EXPORT},()=>{
 const base=process.env.LETTERBOXD_EXPORT;
 if(!base)return;
 const watch=readFileSync(`${base}/watchlist.csv`,'utf8');const seen=readFileSync(`${base}/watched.csv`,'utf8');
 assert.equal(parseCSV(watch).length,167);assert.equal(parseCSV(seen).length,684);
 assert.equal(parseCSV(readFileSync(`${base}/ratings.csv`,'utf8')).length,665);
 let s=importCSV(importCSV(emptyState(),watch,'watchlist').state,seen,'watched').state;
 const n=s.films.length;s=importCSV(importCSV(s,watch,'watchlist').state,seen,'watched').state;
 assert.equal(s.films.length,n);assert.equal(s.films.filter(f=>f.inWatchlist).length,167);
});
test('malformed quote positions and duplicate CSV headers are rejected',()=>{
 for(const bad of ['Name,Year\nA"B"C,2020','Name,Year\n"A"B,2020','Name,Year,Name\nA,2020,B'])assert.throws(()=>parseCSV(bad),/Anführungszeichen|Spalten/);
});
test('async import merges latest state rather than overwriting edits made while reading',async()=>{
 const {importFileBatch}=await import('../watchlist/core.mjs');
 let s=importCSV(emptyState(),csv,'watchlist').state;
 let resolveText;const text=new Promise(resolve=>{resolveText=resolve;});
 const pending=importFileBatch(()=>s,[{name:'watchlist.csv',size:200,text:()=>text}]);
 s={...s,films:s.films.map(f=>({...f,seen:true,moods:['deep']}))};resolveText(csv);
 const r=await pending;assert.equal(r.state.films[0].seen,true);assert.deepEqual(r.state.films[0].moods,['deep']);
});
