import { test } from 'node:test';
import assert from 'node:assert/strict';
import { releaseInfo, needsReleaseCheck, shouldRecheckRelease, filterReleased, validateReleases, drawFilm } from '../watchlist/core.mjs';
const TODAY = '2026-10-07';
const film = (id, year) => ({id:`https://letterboxd.com/film/${id}/`,title:id,year,moods:['warm'],seen:false,inWatchlist:true});

test('only films without year or from this year onwards need a release check', () => {
 assert.equal(needsReleaseCheck(film('alt','2025'),TODAY),false);
 assert.equal(needsReleaseCheck(film('jetzt','2026'),TODAY),true);
 assert.equal(needsReleaseCheck(film('bald','2027'),TODAY),true);
 assert.equal(needsReleaseCheck(film('offen',''),TODAY),true);
});

test('future year is upcoming even before any lookup; older films never are', () => {
 assert.deepEqual(releaseInfo(film('bald','2027'),undefined,TODAY),{upcoming:true,date:null});
 assert.deepEqual(releaseInfo(film('alt','2019'),{date:'2030-01-01',checked:TODAY},TODAY),{upcoming:false,date:null});
});

test('this year: known future date is upcoming, past or same day is released, unknown stays drawable', () => {
 const f = film('jetzt','2026');
 assert.deepEqual(releaseInfo(f,{date:'2026-12-18',checked:TODAY},TODAY),{upcoming:true,date:'2026-12-18'});
 assert.deepEqual(releaseInfo(f,{date:'2026-10-07',checked:TODAY},TODAY),{upcoming:false,date:'2026-10-07'});
 assert.deepEqual(releaseInfo(f,{date:'2026-03-01',checked:TODAY},TODAY),{upcoming:false,date:'2026-03-01'});
 assert.deepEqual(releaseInfo(f,undefined,TODAY),{upcoming:false,date:null});
});

test('a film moves into the draw once its date is reached', () => {
 const f = film('bald','2026');const known={[f.id]:{date:'2026-10-20',checked:TODAY}};
 assert.equal(filterReleased([f],known,TODAY).length,0);
 assert.equal(filterReleased([f],known,'2026-10-20').length,1);
});

test('without a year the film stays upcoming; a past TMDB date may be a namesake', () => {
 const f = film('offen','');
 assert.deepEqual(releaseInfo(f,undefined,TODAY),{upcoming:true,date:null});
 assert.deepEqual(releaseInfo(f,{date:'1999-05-01',checked:TODAY},TODAY),{upcoming:true,date:null});
 assert.deepEqual(releaseInfo(f,{date:'2027-02-01',checked:TODAY},TODAY),{upcoming:true,date:'2027-02-01'});
});

test('recheck: unknown always, released never, upcoming weekly', () => {
 const f = film('bald','2027');
 assert.equal(shouldRecheckRelease(f,undefined,TODAY),true);
 assert.equal(shouldRecheckRelease(f,{date:'2027-03-01',checked:'2026-10-05'},TODAY),false);
 assert.equal(shouldRecheckRelease(f,{date:'2027-03-01',checked:'2026-09-30'},TODAY),true);
 assert.equal(shouldRecheckRelease(film('jetzt','2026'),{date:'2026-02-01',checked:'2026-01-01'},TODAY),false);
 assert.equal(shouldRecheckRelease(film('alt','2020'),undefined,TODAY),false);
});

test('draw never picks an upcoming film', () => {
 const a=film('da','2024'),b=film('bald','2027');
 const pool=filterReleased([a,b],{},TODAY);
 for(const r of [0,0.5,0.99])assert.equal(drawFilm(pool,'warm',[],()=>r).id,a.id);
});

test('release cache drops invalid entries instead of failing', () => {
 const id='https://letterboxd.com/film/ok/';
 assert.deepEqual(validateReleases({[id]:{date:'2027-01-01',checked:TODAY},'javascript:x':{date:'',checked:TODAY},[id.replace('ok','bad')]:{date:'morgen',checked:TODAY}}),{[id]:{date:'2027-01-01',checked:TODAY}});
 assert.deepEqual(validateReleases(null),{});
 assert.deepEqual(validateReleases([1,2]),{});
});
