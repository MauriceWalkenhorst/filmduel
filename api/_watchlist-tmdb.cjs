// Manuell anhand TMDB-Titel, Originaltitel und Handlung geprüft, 27.09.26.
const verified={ 'Burning|2018':491584, 'Hunt|2022':727340, 'Minari|2020':615643, 'Aftersun|2022':965150, 'Kill|2023':1160018 };
const norm=s=>String(s||'').normalize('NFKD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
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
