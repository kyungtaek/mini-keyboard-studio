import http from 'node:http';
import {readFile,realpath,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {publicPath} from './static-path.mjs';
import {CompanionGateway} from './companion-api.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const port=Number(process.env.PORT||4173);
const companion=new CompanionGateway(root);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.md':'text/plain; charset=utf-8'};
http.createServer(async(req,res)=>{
 try{
  if(new URL(req.url,'http://localhost').pathname==='/api/companion')return await companion.handle(req,res,port);
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end();}
  const name=publicPath(new URL(req.url,'http://localhost').pathname);
  const requested=path.resolve(root,name),canonical=await realpath(requested);
  const publicRoot=path.resolve(root,name==='index.html'?'index.html':name.startsWith('data/')?'data/shortcuts':name.split('/')[0]);
  if((canonical!==publicRoot&&!canonical.startsWith(publicRoot+path.sep))||(await stat(canonical)).isDirectory()){res.writeHead(404);return res.end('Not found');}
  const data=await readFile(canonical);
  res.writeHead(200,{'Content-Type':types[path.extname(canonical)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Permissions-Policy':'hid=(self)','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});
  res.end(req.method==='HEAD'?undefined:data);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Mini Keyboard Studio: http://localhost:${port}`));
let stopping=false;
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{if(stopping)return;stopping=true;await companion.stop();process.exit(0);});
