export const MOODS = [
  {id:'warm',label:'Leicht & warm',short:'Wohlfühlen',description:'Kopf aus. Herz an.',reason:'Für einen warmen, leichteren Filmabend.'},
  {id:'dark',label:'Spannend & düster',short:'Nervenkitzel',description:'Nur noch eine Wendung.',reason:'Spannung, dunkle Geheimnisse und etwas Nervenkitzel.'},
  {id:'energy',label:'Action & Energie',short:'Mitreißen lassen',description:'Bitte mit vollem Tempo.',reason:'Tempo, Abenteuer und mitreißende Momente.'},
  {id:'deep',label:'Gefühl & Tiefgang',short:'Nachfühlen',description:'Darf ruhig bleiben.',reason:'Eine Geschichte zum Nachfühlen und Nachdenken.'},
];
export const STORAGE_KEY='watchlist.personal.v1';
export const emptyState=()=>({version:1,films:[],selected:null});
const validURI = value => typeof value==='string' && /^https:\/\/(?:letterboxd\.com\/film\/[a-zA-Z0-9%_-]+|boxd\.it\/[a-zA-Z0-9]+)\/$/.test(value);
const validYear = value => typeof value==='string' && (value===''||/^\d{4}$/.test(value));
export function parseCSV(text) {
 text=text.replace(/^\ufeff/,'');
 const rows=[]; let row=[],field='',quoted=false,closed=false;
 const pushField=()=>{row.push(field);field='';closed=false;};
 for(let i=0;i<text.length;i++) {
  const c=text[i];
  if(quoted){
   if(c==='"'&&text[i+1]==='"'){field+='"';i++;}
   else if(c==='"'){quoted=false;closed=true;}
   else field+=c;
   continue;
  }
  if(c===','){pushField();}
  else if(c==='\n'||c==='\r'){
   if(c==='\r'&&text[i+1]==='\n')i++;
   pushField();if(row.some(x=>x.trim()))rows.push(row);row=[];
  }else if(c==='"'){
   if(field!==''||closed)throw Error('Anführungszeichen an ungültiger Position in der CSV.');
   quoted=true;
  }else if(closed){
   if(!/\s/.test(c))throw Error('Zeichen nach geschlossenen Anführungszeichen in der CSV.');
  }else field+=c;
 }
 if(quoted)throw Error('Nicht geschlossene Anführungszeichen in der CSV.');
 if(field||row.length||closed){pushField();rows.push(row);}
 const header=(rows.shift()||[]).map(x=>x.trim());
 if(new Set(header).size!==header.length||header.some(x=>!x))throw Error('Doppelte oder leere Spaltennamen in der CSV.');
 const out=rows.map((r,i)=>{if(r.length!==header.length)throw Error(`Zeile ${i+2}: Anzahl der Spalten stimmt nicht.`);return Object.fromEntries(header.map((h,n)=>[h,r[n].trim()]));});
 Object.defineProperty(out,'headers',{value:header});return out;
}
export function importCSV(state,text,kind,catalog={}) {
 if(!['watchlist','watched'].includes(kind))throw Error('Bitte Watchlist oder Gesehen wählen.');
 const rows=parseCSV(text);
 if(!['Name','Year','Letterboxd URI'].every(h=>rows.headers.includes(h)))throw Error('Benötigte Spalten: Name, Year, Letterboxd URI.');
 const films=new Map(state.films.map(f=>[f.id,{...f,moods:[...f.moods]}]));const errors=[];
 rows.forEach((r,i)=>{
  const id=r['Letterboxd URI'].replace(/\/$/,'')+'/';
  if(!validURI(id)||!r.Name||r.Name.length>300||!validYear(r.Year)){errors.push(`Zeile ${i+2}: Titel, Jahr oder Letterboxd-Link ungültig.`);return;}
  const prev=films.get(id);const moods=catalog[`${r.Name}|${r.Year}`]||[];
  films.set(id,{id,title:r.Name,year:r.Year,moods:prev?.moods??[...moods],seen:Boolean(prev?.seen||kind==='watched'),inWatchlist:Boolean(prev?.inWatchlist||kind==='watchlist')});
 });
 return {state:{...state,films:[...films.values()]},errors,imported:rows.length-errors.length};
}
export const eligibleFilms=(films,mood)=>films.filter(f=>f.inWatchlist&&!f.seen&&f.moods.includes(mood));
export function drawFilm(films,mood,drawn=[],random=Math.random) {
 const pool=eligibleFilms(films,mood).filter(f=>!drawn.includes(f.id));
 if(!pool.length)return null;
 return pool[Math.min(pool.length-1,Math.max(0,Math.floor(random()*pool.length)))];
}
export function validateBackup(raw) {
 if(!raw||raw.version!==1||!Array.isArray(raw.films)||raw.films.length>20000)throw Error('Ungültige Watchlist-Sicherung.');
 const ids=new Set();
 const films=raw.films.map(f=>{
  if(!f||!validURI(f.id)||ids.has(f.id)||typeof f.title!=='string'||!f.title.trim()||f.title.length>300||!validYear(f.year)||!Array.isArray(f.moods)||f.moods.length>4||new Set(f.moods).size!==f.moods.length||!f.moods.every(m=>MOODS.some(x=>x.id===m))||typeof f.seen!=='boolean'||typeof f.inWatchlist!=='boolean')throw Error('Ungültiger Filmeintrag in der Sicherung.');
  ids.add(f.id);return {id:f.id,title:f.title,year:f.year,moods:[...f.moods],seen:f.seen,inWatchlist:f.inWatchlist};
 });
 const selected=raw.selected??null;
 if(selected!==null&&!films.some(f=>f.id===selected&&f.inWatchlist&&!f.seen))throw Error('Ungültige Filmauswahl in der Sicherung.');
 return {version:1,films,selected};
}
export function saveState(storage,state){try{storage.setItem(STORAGE_KEY,JSON.stringify(validateBackup(state)));}catch{throw Error('Nicht gespeichert. Der Browserspeicher ist voll oder gesperrt. Bitte eine Sicherung herunterladen.');}}
export function loadState(storage){try{const s=storage.getItem(STORAGE_KEY);return s?validateBackup(JSON.parse(s)):emptyState();}catch{throw Error('Gespeicherte Daten sind nicht lesbar. Bitte eine gültige Sicherung laden. Bestehende Daten wurden nicht überschrieben.');}}
export async function importFileBatch(getState,files,catalog={}) {
 const inputs=[];
 for(const file of files){
  if(file.size>5_000_000)throw Error('Die Datei ist zu groß (maximal 5 MB).');
  const kind=/^watchlist(?:\s*\(\d+\))?\.csv$/i.test(file.name)?'watchlist':/^watched(?:\s*\(\d+\))?\.csv$/i.test(file.name)?'watched':null;
  if(!kind)throw Error(`Bitte watchlist.csv oder watched.csv auswählen, nicht ${file.name}.`);
  inputs.push({kind,text:await file.text(),name:file.name});
 }
 // Snapshot only after asynchronous reads. No await between merging and return.
 let next=structuredClone(getState());const errors=[];let imported=0;
 for(const input of inputs){
  const result=importCSV(next,input.text,input.kind,catalog);next=result.state;
  errors.push(...result.errors.map(e=>`${input.name}: ${e}`));imported+=result.imported;
 }
 if(next.selected&&!next.films.some(f=>f.id===next.selected&&!f.seen))next.selected=null;
 return {state:next,errors,imported};
}
