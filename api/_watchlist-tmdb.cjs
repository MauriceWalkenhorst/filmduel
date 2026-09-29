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

// Startliste (NYT 100 des 21. Jahrhunderts): TMDB-IDs über IMDb-Nummern aufgelöst, 29.09.26.
Object.assign(verified, {
  "Parasite|2019": 496243,
  "Mulholland Drive|2001": 1018,
  "There Will Be Blood|2007": 7345,
  "In the Mood for Love|2000": 843,
  "Moonlight|2016": 376867,
  "No Country for Old Men|2007": 6977,
  "Eternal Sunshine of the Spotless Mind|2004": 38,
  "Get Out|2017": 419430,
  "Spirited Away|2001": 129,
  "The Social Network|2010": 37799,
  "Mad Max: Fury Road|2015": 76341,
  "The Zone of Interest|2023": 467244,
  "Children of Men|2006": 9693,
  "Inglourious Basterds|2009": 16869,
  "City of God|2002": 598,
  "Crouching Tiger, Hidden Dragon|2000": 146,
  "Brokeback Mountain|2005": 142,
  "Y Tu Mamá También|2001": 1391,
  "Zodiac|2007": 1949,
  "The Wolf of Wall Street|2013": 106646,
  "The Royal Tenenbaums|2001": 9428,
  "The Grand Budapest Hotel|2014": 120467,
  "Boyhood|2014": 85350,
  "Her|2013": 152601,
  "Phantom Thread|2017": 400617,
  "Anatomy of a Fall|2023": 915935,
  "Adaptation.|2002": 2757,
  "The Dark Knight|2008": 155,
  "Arrival|2016": 329865,
  "Lost in Translation|2003": 153,
  "The Departed|2006": 1422,
  "Bridesmaids|2011": 55721,
  "A Separation|2011": 60243,
  "WALL·E|2008": 10681,
  "A Prophet|2009": 21575,
  "A Serious Man|2009": 12573,
  "Call Me by Your Name|2017": 398818,
  "Portrait of a Lady on Fire|2019": 531428,
  "Lady Bird|2017": 391713,
  "Yi Yi|2000": 25538,
  "Amélie|2001": 194,
  "The Master|2012": 68722,
  "Oldboy|2003": 670,
  "Once Upon a Time... in Hollywood|2019": 466272,
  "Moneyball|2011": 60308,
  "Roma|2018": 426426,
  "Almost Famous|2000": 786,
  "The Lives of Others|2006": 582,
  "Before Sunset|2004": 80,
  "Up|2009": 14160,
  "12 Years a Slave|2013": 76203,
  "The Favourite|2018": 375262,
  "Borat: Cultural Learnings of America for Make Benefit Glorious Nation of Kazakhstan|2006": 496,
  "Pan's Labyrinth|2006": 1417,
  "Inception|2010": 27205,
  "Punch-Drunk Love|2002": 8051,
  "Best in Show|2000": 13785,
  "Uncut Gems|2019": 473033,
  "Toni Erdmann|2016": 374475,
  "Whiplash|2014": 244786,
  "Kill Bill: Vol. 1|2003": 24,
  "Memento|2000": 77,
  "Little Miss Sunshine|2006": 773,
  "Gone Girl|2014": 210577,
  "Oppenheimer|2023": 872585,
  "Spotlight|2015": 314365,
  "TÁR|2022": 817758,
  "The Hurt Locker|2008": 12162,
  "Under the Skin|2014": 97370,
  "Let the Right One In|2008": 13310,
  "Ocean's Eleven|2001": 161,
  "Carol|2015": 258480,
  "Ratatouille|2007": 2062,
  "The Florida Project|2017": 394117,
  "Amour|2012": 86837,
  "O Brother, Where Art Thou?|2000": 134,
  "Everything Everywhere All at Once|2022": 545611,
  "Aftersun|2022": 965150,
  "The Tree of Life|2011": 8967,
  "Volver|2006": 219,
  "Black Swan|2010": 44214,
  "The Act of Killing|2012": 123678,
  "Inside Llewyn Davis|2013": 86829,
  "Melancholia|2011": 62215,
  "Anchorman: The Legend of Ron Burgundy|2004": 8699,
  "Past Lives|2023": 666277,
  "The Lord of the Rings: The Fellowship of the Ring|2001": 120,
  "The Gleaners and I|2000": 44379,
  "Interstellar|2014": 157336,
  "Frances Ha|2013": 121986,
  "Fish Tank|2009": 24469,
  "Gladiator|2000": 98,
  "Michael Clayton|2007": 4566,
  "Minority Report|2002": 180,
  "The Worst Person in the World|2021": 660120,
  "Black Panther|2018": 284054,
  "Gravity|2013": 49047,
  "Grizzly Man|2005": 501,
  "Memories of Murder|2003": 11423,
  "Superbad|2007": 8363
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
