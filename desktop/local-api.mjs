import http from 'node:http';
export function createCompanionApi(gateway,port=4173){
 return http.createServer(async(req,res)=>{
  let url;try{url=new URL(req.url,'http://localhost');}catch{res.writeHead(400);res.end('Bad request');return;}
  if(url.pathname!=='/api/companion'){res.writeHead(404);res.end('Not found');return;}
  try{await gateway.handle(req,res,port);}catch{if(!res.headersSent)res.writeHead(500);res.end('Local API failed');}
 });
}
