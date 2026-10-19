'use strict';
// Local development for the Vercel-ready project: npm start.
const http=require('node:http'),path=require('node:path'),fs=require('node:fs');
const handler=require('./api/index');
const root=path.resolve(__dirname,'public');
const port=Number(process.env.PORT||3000);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.mp4':'video/mp4','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon'};
http.createServer((req,res)=>{
 let uri;try{uri=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
 if(uri.startsWith('/api/')){handler(req,res);return;}
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
 const file=path.resolve(root,uri==='/'?'index.html':uri.replace(/^\//,''));
 if(!(file===root||file.startsWith(root+path.sep))){res.writeHead(403).end();return;}
 fs.stat(file,(err,stat)=>{
  if(err||!stat.isFile()){res.writeHead(404).end();return;}
  const h={'Content-Type':mime[path.extname(file)]||'application/octet-stream','Accept-Ranges':'bytes'};
  const range=req.headers.range;
  if(range){const m=/^bytes=(\d*)-(\d*)$/.exec(range);if(!m){res.writeHead(416).end();return;}
   let start=m[1]?Number(m[1]):0,end=m[2]?Number(m[2]):stat.size-1;
   if(!m[1]&&m[2]){start=Math.max(0,stat.size-Number(m[2]));end=stat.size-1;}
   if(start>=stat.size||end<start){res.writeHead(416).end();return;}
   end=Math.min(end,stat.size-1);
   res.writeHead(206,{...h,'Content-Range':`bytes ${start}-${end}/${stat.size}`,'Content-Length':end-start+1});
   if(req.method==='HEAD')return res.end();return fs.createReadStream(file,{start,end}).pipe(res);
  }
  res.writeHead(200,{...h,'Content-Length':stat.size});
  if(req.method==='HEAD')return res.end();fs.createReadStream(file).pipe(res);
 });
}).listen(port,()=>console.log(`Sypher local: http://localhost:${port}`));
