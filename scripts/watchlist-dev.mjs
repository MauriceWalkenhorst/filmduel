import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import handler from '../api/watchlist-poster.js';
import cinemaHandler from '../api/watchlist-cinema.js';
import pushHandler from '../api/watchlist-push.js';
import streamingHandler from '../api/watchlist-streaming.js';
const root=fileURLToPath(new URL('../',import.meta.url));
if(!process.env.TMDB_READ_TOKEN&&process.env.WATCHLIST_TOKEN_FILE){
 const text=await readFile(process.env.WATCHLIST_TOKEN_FILE,'utf8');
 const token=text.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
 if(token)process.env.TMDB_READ_TOKEN=token[0];
}
const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.webmanifest':'application/manifest+json'};
const publicFiles=new Set(['watchlist/icons/abspann-512.png','watchlist/icons/abspann-192.png','watchlist/icons/apple-touch-icon.png','watchlist/icons/favicon-32.png','watchlist/sw.js','watchlist/cinema.mjs','watchlist/manifest.webmanifest','watchlist/streaming.mjs','watchlist/index.html','watchlist/app.mjs','watchlist/core.mjs','watchlist/catalog.mjs','watchlist/styles.css','watchlist/icon.svg','index.html','freikarten/index.html']);
http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://localhost');
 if(['/api/watchlist-poster','/api/watchlist-streaming','/api/watchlist-cinema','/api/watchlist-push'].includes(u.pathname)){
  req.query=Object.fromEntries(u.searchParams);if(req.method==='POST'){let body='';for await(const chunk of req){body+=chunk;if(body.length>100000){res.writeHead(413);res.end();return;}}try{req.body=JSON.parse(body);}catch{req.body=null;}}res.status=n=>{res.statusCode=n;return res;};res.json=b=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(b));return res;};await ({'/api/watchlist-poster':handler,'/api/watchlist-streaming':streamingHandler,'/api/watchlist-cinema':cinemaHandler,'/api/watchlist-push':pushHandler}[u.pathname])(req,res);return;
 }
 const path=u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname;
 if(!publicFiles.has(path.slice(1))){res.writeHead(404);res.end('Not found');return;}
 try{const data=await readFile(resolve(root,path.slice(1)));res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}
}).listen(Number(process.env.PORT||4173),'127.0.0.1',()=>console.log(`Watchlist: http://localhost:${process.env.PORT||4173}/watchlist/ · Cover-Dienst ${process.env.TMDB_READ_TOKEN?'bereit':'ohne Token'}`));
