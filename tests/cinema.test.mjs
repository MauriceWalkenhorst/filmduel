import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let cinema;try{cinema=require('../api/_watchlist-cinema.cjs');}catch{cinema={};}
test('100 km radius excludes distant cinemas and validates coordinates',()=>{
 assert.equal(typeof cinema.distanceKm,'function');
 assert.ok(cinema.distanceKm({lat:51.51,lon:7.46},{lat:51.48,lon:7.22})<20);
 assert.ok(cinema.distanceKm({lat:52.52,lon:13.4},{lat:51.48,lon:7.22})>100);
 assert.throws(()=>cinema.coordinates('','7'));assert.throws(()=>cinema.coordinates('91','7'));
});
test('screenings parse arrays and graphs, exclude past/cancelled entries and unsafe links, deduplicate',()=>{
 assert.equal(typeof cinema.parseScreenings,'function');
 const event={'@type':'ScreeningEvent',name:'Die Taschendiebin',startDate:'2026-10-01T19:00:00+02:00',workPresented:{name:'Die Taschendiebin'},offers:{url:'https://metropolis.bochumerkinos.de/programm/film/test'}};
 const html=`<script type="application/ld+json">${JSON.stringify({'@graph':[event,event,{...event,name:'old',startDate:'2020-01-01T00:00:00Z'},{...event,name:'bad',offers:{url:'javascript:alert(1)'}},{...event,name:'cancelled',eventStatus:'https://schema.org/EventCancelled'}]})}</script>`;
 const rows=cinema.parseScreenings(html,{id:'metropolis',name:'Metropolis'},Date.parse('2026-09-28'));
 assert.equal(rows.length,1);assert.equal(rows[0].title,'Die Taschendiebin');assert.equal(rows[0].cinema,'Metropolis');
});
test('movie matching accepts verified alternate title but rejects ambiguous alias collisions',()=>{
 assert.equal(typeof cinema.matchScreenings,'function');
 const movies=[{id:290098,title:'The Handmaiden',aliases:['Die Taschendiebin']}];
 const events=[{id:'e1',title:'Die Taschendiebin'},{id:'e2',title:'Something Else'}];
 assert.equal(cinema.matchScreenings(events,movies).length,1);
 assert.equal(cinema.matchScreenings(events,[...movies,{id:22,title:'Die Taschendiebin',aliases:[]}]).length,0);
});
