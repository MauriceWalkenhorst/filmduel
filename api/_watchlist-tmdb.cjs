// Manuell anhand TMDB-Titel, Originaltitel und Handlung geprüft, 27.09.26.
const verified={ 'Burning|2018':491584, 'Hunt|2022':727340, 'Minari|2020':615643, 'Aftersun|2022':965150, 'Kill|2023':1160018 };
const norm=s=>String(s||'').normalize('NFKD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
// Verifizierte TMDB-IDs aus den offiziellen Letterboxd-Filmseiten, 27.09.26.
Object.assign(verified, {
  "I Saw the Devil|2010": 49797,
  "No Country for Old Men|2007": 6977,
  "Magnolia|1999": 334,
  "Big Fish|2003": 587,
  "High and Low|1963": 12493,
  "Come and See|1985": 25237,
  "In Bruges|2008": 8321,
  "Up|2009": 14160,
  "Enemy|2013": 181886,
  "Gone Girl|2014": 210577,
  "Collateral|2004": 1538,
  "Before Sunrise|1995": 76,
  "Shadow of a Doubt|1943": 21734,
  "A Bittersweet Life|2005": 11344,
  "The Yellow Sea|2010": 57361,
  "Hard Boiled|1992": 11782,
  "Paprika|2006": 4977,
  "Capernaum|2018": 517814,
  "Hunt for the Wilderpeople|2016": 371645,
  "Memento|2000": 77,
  "Thirst|2009": 22536,
  "New World|2013": 165213,
  "The Wailing|2016": 293670
});

function matchMovie(results,title,year){
 const matches=results.filter(m=>[m.title,m.original_title].some(t=>norm(t)===norm(title))&&(!year||m.release_date?.slice(0,4)===year));
 return matches.length===1?matches[0]:null;
}
async function posterLookup({title,year},{token,fetcher=fetch}={}){
 if(typeof title!=='string'||!title.trim()||title.length>200||typeof year!=='string'||(year!==''&&!/^\d{4}$/.test(year)))return {status:400,body:{error:'Titel oder Jahr ungültig.'}};
 if(!token)return {status:503,body:{error:'Cover-Dienst ist noch nicht eingerichtet.'}};
 try{
  const params=new URLSearchParams({query:title,language:'en-US',include_adult:'false'});if(year)params.set('primary_release_year',year);
  const verifiedId=verified[`${title}|${year}`];
  const endpoint=verifiedId?`https://api.themoviedb.org/3/movie/${verifiedId}?language=en-US`:`https://api.themoviedb.org/3/search/movie?${params}`;
  const response=await fetcher(endpoint,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(8000)});
  if(!response.ok)return {status:502,body:{error:'Cover-Dienst gerade nicht erreichbar. Bitte erneut versuchen.'}};
  const result=await response.json();const movie=verifiedId?(result.id===verifiedId?result:null):matchMovie(Array.isArray(result.results)?result.results:[],title,year);
  if(!movie)return {status:404,body:{error:'Kein eindeutig passendes Cover gefunden.'}};
  const path=movie.poster_path;
  return {status:200,body:{id:movie.id,title:movie.title,year:movie.release_date?.slice(0,4)||'',poster:typeof path==='string'&&/^\/[a-zA-Z0-9]+\.(jpg|png)$/.test(path)?`https://image.tmdb.org/t/p/w500${path}`:null,overview:movie.overview||'',releaseDate:movie.release_date||''}};
 }catch{return {status:502,body:{error:'Cover konnte nicht geladen werden. Bitte erneut versuchen.'}};}
}
module.exports={matchMovie,posterLookup};

async function providersLookup(input,options={}){
 const movie=await posterLookup(input,options);if(movie.status!==200)return movie;
 try{
  const response=await (options.fetcher||fetch)(`https://api.themoviedb.org/3/movie/${movie.body.id}/watch/providers`,{headers:{Authorization:`Bearer ${options.token}`},signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw Error();
  const data=await response.json(),de=data.results?.DE||{};
  const list=key=>(Array.isArray(de[key])?de[key]:[]).filter(p=>Number.isInteger(p.provider_id)&&typeof p.provider_name==='string').map(p=>({id:p.provider_id,name:p.provider_name}));
  return {status:200,body:{id:movie.body.id,region:'DE',flatrate:list('flatrate'),rent:list('rent'),buy:list('buy'),free:list('free'),ads:list('ads'),link:`https://www.themoviedb.org/movie/${movie.body.id}/watch?locale=DE`,checkedAt:new Date().toISOString()}};
 }catch{return {status:502,body:{error:'Streaming-Angebote konnten nicht geprüft werden.'}};}
}
module.exports.providersLookup=providersLookup;
