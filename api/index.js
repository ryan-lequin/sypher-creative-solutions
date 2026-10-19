'use strict';
/*
 Sypher Vercel API - stateless Vercel Function backed by a private Supabase database.
 The Supabase secret key is used on the server ONLY. Never put it in public/.
*/
const crypto = require('node:crypto');
const config = () => ({
  url: String(process.env.SUPABASE_URL || '').replace(/\/$/, ''),
  key: String(process.env.SUPABASE_SECRET_KEY || '').trim(),
  password: String(process.env.ADMIN_PASSWORD || ''),
});
const initialContent = {
  services: [
    { icon: 'palette', title: 'Brand Identity', description: 'Memorable brand systems, logos, and visual guidelines for ambitious businesses.' },
    { icon: 'code', title: 'Web Development', description: 'Fast, accessible, responsive websites built for real people and real devices.' },
    { icon: 'megaphone', title: 'Digital Marketing', description: 'Strategic campaigns and creative storytelling that connect with audiences.' },
    { icon: 'video', title: 'Multimedia Production', description: 'Video, motion, and digital assets designed to bring ideas to life.' }
  ],
  projects: [
    { category: 'Branding', title: 'Aurora Identity', description: 'An interactive brand identity concept.', theme: 'aurora' },
    { category: 'Web Design', title: 'Orbit Commerce', description: 'An interactive, responsive storefront concept.', theme: 'orbit' },
    { category: 'Campaign', title: 'Bloom Social', description: 'An interactive social campaign concept.', theme: 'bloom' }
  ],
  testimonials: [],
  settings: { publicEmail: '', studioNotice: 'Portfolio showcases are original design concepts, not commissioned client work.' }
};
function asJSON(res, status, value) {
  const body = JSON.stringify(value);
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Length',Buffer.byteLength(body));
  res.end(body);
}
function error(res,status,message){ asJSON(res,status,{error:message}); }
function safe(v){return String(v??'').trim();}
function text(v,min,max){return typeof v==='string'&&v.trim().length>=min&&v.trim().length<=max;}
function email(s){return typeof s==='string'&&s.length<=200&&/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(s);}
async function payload(req){
  if(req.body!==undefined&&req.body!==null){
    if(typeof req.body==='object'&&!Buffer.isBuffer(req.body))return req.body;
    if(typeof req.body==='string')return JSON.parse(req.body);
    if(Buffer.isBuffer(req.body))return JSON.parse(req.body.toString('utf8'));
  }
  let size=0;const parts=[];
  for await(const chunk of req){size+=chunk.length;if(size>65536){const e=new Error('Request too large');e.status=413;throw e;}parts.push(chunk);}
  if(!parts.length)return {};
  return JSON.parse(Buffer.concat(parts).toString('utf8'));
}
function qs(object={}){
 const query=new URLSearchParams();
 for(const [key,val] of Object.entries(object)) query.set(key,String(val));
 return query.toString();
}
async function store(table,query={},options={}){
  const {url,key}=config();
  if(!url||!key){const e=new Error('Database environment variables missing');e.status=503;throw e;}
  const link=`${url}/rest/v1/${table}${Object.keys(query).length?'?'+qs(query):''}`;
  const method=options.method||'GET';
  const headers={'apikey':key,'Accept':'application/json','Content-Type':'application/json','Prefer':options.prefer||'return=representation'};
  // Current sb_secret_* keys authenticate using apikey; legacy service_role JWT needs Authorization.
  if(!key.startsWith('sb_secret_'))headers.Authorization=`Bearer ${key}`;
  const res=await fetch(link,{method,headers,body:options.data===undefined?undefined:JSON.stringify(options.data),signal:AbortSignal.timeout(10000)});
  const body=await res.text();
  if(!res.ok){console.error('Supabase operation failed',table,method,res.status,body.slice(0,250));
    const e=new Error('Database operation failed. Verify SQL setup and Vercel environment variables.');e.status=503;throw e;}
  return body?JSON.parse(body):[];
}
// Keep public editorial copy free of em dashes, including older records saved in Supabase.
// Do not alter submitted customer inquiries or private notes.
function normalizeEditorialPunctuation(value){
  if(typeof value==='string')return value.replace(/\s*\u2014\s*/g,' - ');
  if(Array.isArray(value))return value.map(normalizeEditorialPunctuation);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,normalizeEditorialPunctuation(v)]));
  return value;
}
async function content(){const results=await store('sypher_content',{id:'eq.main',select:'data',limit:1});return normalizeEditorialPunctuation(results[0]?.data||structuredClone(initialContent));}
async function inquiries(){return (await store('sypher_inquiries',{select:'payload',order:'created_at.desc',limit:2000})).map(row=>row.payload);}
async function getInquiry(id){const rows=await store('sypher_inquiries',{id:'eq.'+id,select:'payload',limit:1});return rows[0]?.payload||null;}
function cookieId(req){const cookies=String(req.headers.cookie||'').split(';');const val=cookies.find(c=>c.trim().startsWith('sypher_session='));return val?.trim().slice('sypher_session='.length)||'';}
function cookie(res,token,req){const secure=(process.env.VERCEL==='1'||req.headers['x-forwarded-proto']==='https')?'; Secure':'';
  res.setHeader('Set-Cookie',`sypher_session=${token}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=${token?'28800':'0'}`);
}
function validId(id){return /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id);}
async function getSession(req){const id=cookieId(req);if(!/^[0-9a-f]{64}$/.test(id))return null;
  const digest=crypto.createHash('sha256').update(id).digest('hex');
  const rows=await store('sypher_sessions',{token_hash:'eq.'+digest,select:'expires_at',limit:1});
  return rows.length && new Date(rows[0].expires_at)>new Date()?digest:null;
}
async function needAdmin(req,res){if(!await getSession(req)){error(res,401,'Sign in to the admin panel first.');return false;}return true;}
function ipHash(req){const ip=String(req.headers['x-real-ip']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0,32);}
async function throttle(req,group,cap,minutes){const key=`${group}:${ipHash(req)}`;const after=new Date(Date.now()-minutes*60000).toISOString();
  const previous=await store('sypher_rate_events',{key:'eq.'+key,created_at:'gte.'+after,select:'id',limit:cap+1});
  if(previous.length>=cap)return false;
  await store('sypher_rate_events',{}, {method:'POST',data:{key}});return true;
}
function validateContact(v){
 if(!v||!text(v.name,2,100))return 'Please enter your name (2–100 characters).';
 if(!text(v.email,5,200)||!email(v.email.trim()))return 'Please enter a valid email address.';
 if(!text(v.message,10,2000))return 'Your message must be 10–2000 characters long.';
 if(v.service&&!text(v.service,2,80))return 'Please select a valid service.';
 if(v.budget&&!text(v.budget,1,80))return 'Please select a valid budget.';
 return '';
}
function validateContent(v){
 if(!v||!Array.isArray(v.services)||!Array.isArray(v.projects)||!Array.isArray(v.testimonials)||!v.settings||typeof v.settings!=='object')return 'Content object is incomplete.';
 if(v.services.length>12||v.projects.length!==3||v.testimonials.length>30)return 'Too many items or modified number of project case studies.';
 const icons=['palette','code','megaphone','video'];
 if(!v.services.every(x=>text(x.title,2,80)&&text(x.description,5,300)&&icons.includes(x.icon)))return 'Invalid service information.';
 if(!v.projects.every((x,i)=>x.theme===['aurora','orbit','bloom'][i]&&text(x.title,2,80)&&text(x.category,2,50)&&text(x.description,5,300)))return 'Project themes must remain Aurora, Orbit, Bloom.';
 if(!v.testimonials.every(x=>text(x.name,2,80)&&text(x.role,2,100)&&text(x.quote,5,500)))return 'Invalid testimonial.';
 const mail=safe(v.settings.publicEmail);
 if(mail&&!email(mail))return 'Public email is not valid.';
 return '';
}
function normalizeContent(v){return {
 services:v.services.map(x=>({icon:x.icon,title:safe(x.title),description:safe(x.description)})),
 projects:v.projects.map(x=>({theme:x.theme,title:safe(x.title),category:safe(x.category),description:safe(x.description)})),
 testimonials:v.testimonials.map(x=>({name:safe(x.name),role:safe(x.role),quote:safe(x.quote)})),
 settings:{publicEmail:safe(v.settings.publicEmail),studioNotice:safe(v.settings.studioNotice).slice(0,300)}
};}
function sendCsv(res,list){const fields=['id','createdAt','name','email','service','budget','message','status','notes','replyCount','lastReplyAt'];
 const quote=v=>{let s=String(v??'');if(/^\s*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 const rows=[fields.join(','),...list.map(v=>fields.map(k=>quote(k==='replyCount'?(v.replies||[]).length:k==='lastReplyAt'?((v.replies||[]).at(-1)?.acceptedAt||''):v[k])).join(','))];
 res.statusCode=200;res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Content-Disposition','attachment; filename="sypher-inquiries.csv"');res.setHeader('Cache-Control','no-store');res.end('\uFEFF'+rows.join('\r\n')+'\r\n');
}
async function router(req,res){
 const parsedUrl=new URL(req.url||'/', 'https://sypher.local');
 // Vercel rewrites preserve the original path on some runtimes and forward sypher_route on others.
 const fromRewrite=parsedUrl.searchParams.get('sypher_route')||req.query?.sypher_route;
 const pathname=fromRewrite?'/api/'+String(Array.isArray(fromRewrite)?fromRewrite.join('/'):fromRewrite).replace(/^\/+/, ''):parsedUrl.pathname;
 const m=req.method;
 const {password,key,url}=config();
 if(pathname==='/api/health'&&m==='GET')return asJSON(res,200,{status:'ok',storage:key&&url?'supabase':'not-configured',adminConfigured:!!(password&&key&&url),videoBanners:2});
 if(!url||!key)return error(res,503,'Supabase is not configured. Add SUPABASE_URL and SUPABASE_SECRET_KEY in Vercel settings.');
 if(pathname==='/api/content'&&m==='GET')return asJSON(res,200,await content());
 if(pathname==='/api/contact'&&m==='POST'){
  if(!await throttle(req,'contact',8,60))return error(res,429,'Too many messages. Try again later.');
  const v=await payload(req);if(v.website)return asJSON(res,201,{success:true,message:'Thanks for your inquiry.'});
  const problem=validateContact(v);if(problem)return error(res,400,problem);
  const id=crypto.randomUUID(),record={id,name:safe(v.name),email:safe(v.email).toLowerCase(),service:safe(v.service),budget:safe(v.budget),message:safe(v.message),createdAt:new Date().toISOString(),status:'new',notes:''};
  await store('sypher_inquiries',{}, {method:'POST',data:{id,payload:record}});
  return asJSON(res,201,{success:true,id,message:'Your inquiry was saved successfully. The studio can review it in the secure inbox.'});
 }
 if(pathname==='/api/admin/session'&&m==='GET')return asJSON(res,200,{authenticated:!!(password&&await getSession(req)),configured:!!password});
 if(pathname==='/api/admin/login'&&m==='POST'){
  if(!password)return error(res,503,'Configure ADMIN_PASSWORD in Vercel Project Settings first.');
  if(!await throttle(req,'login',8,15))return error(res,429,'Too many login attempts. Try again later.');
  const input=await payload(req);const value=String(input.password||'');
  if(value.length>256)return error(res,401,'Incorrect admin password.');
  const expected=crypto.createHash('sha256').update(password).digest(),actual=crypto.createHash('sha256').update(value).digest();
  if(!crypto.timingSafeEqual(expected,actual))return error(res,401,'Incorrect admin password.');
  const token=crypto.randomBytes(32).toString('hex'),hash=crypto.createHash('sha256').update(token).digest('hex');
  await store('sypher_sessions',{}, {method:'POST',data:{token_hash:hash,expires_at:new Date(Date.now()+8*60*60*1000).toISOString()}});
  cookie(res,token,req);return asJSON(res,200,{success:true});
 }
 if(pathname==='/api/admin/logout'&&m==='POST'){
  const digest=await getSession(req);if(digest)await store('sypher_sessions',{token_hash:'eq.'+digest},{method:'DELETE',prefer:'return=minimal'});
  cookie(res,'',req);return asJSON(res,200,{success:true});
 }
 if(pathname==='/api/admin/email-settings'&&m==='GET'){
  if(!await needAdmin(req,res))return;
  return asJSON(res,200,{configured:false,provider:'Gmail',note:'Replies open as prefilled Gmail drafts. Sending and sent mail history are managed in Gmail.'});
 }
 if(pathname==='/api/admin/inquiries'&&m==='GET'){
  if(!await needAdmin(req,res))return;
  return asJSON(res,200,{inquiries:await inquiries()});
 }
 if(pathname==='/api/admin/inquiries/export'&&m==='GET'){
  if(!await needAdmin(req,res))return;return sendCsv(res,await inquiries());
 }
 const idMatch=pathname.match(/^\/api\/admin\/inquiries\/([0-9a-f-]{36})$/i);
 if(idMatch&&['PATCH','DELETE'].includes(m)){
  if(!await needAdmin(req,res))return;
  const id=idMatch[1];if(!validId(id))return error(res,400,'Invalid inquiry ID.');
  const record=await getInquiry(id);if(!record)return error(res,404,'Inquiry not found.');
  if(m==='DELETE'){await store('sypher_inquiries',{id:'eq.'+id},{method:'DELETE',prefer:'return=minimal'});return asJSON(res,200,{success:true});}
  const update=await payload(req);
  if(!['new','in-progress','replied','resolved'].includes(update?.status)||typeof update.notes!=='string'||update.notes.length>3000)return error(res,400,'Invalid status or notes.');
  record.status=update.status;record.notes=update.notes;
  await store('sypher_inquiries',{id:'eq.'+id},{method:'PATCH',data:{payload:record}});
  return asJSON(res,200,{success:true,inquiry:record});
 }
 if(pathname==='/api/admin/content'&&m==='PUT'){
  if(!await needAdmin(req,res))return;
  const update=await payload(req),problem=validateContent(update);
  if(problem)return error(res,400,problem);
  const data=normalizeEditorialPunctuation(normalizeContent(update));
  await store('sypher_content',{on_conflict:'id'},{method:'POST',data:{id:'main',data},prefer:'resolution=merge-duplicates,return=representation'});
  return asJSON(res,200,{success:true,content:data});
 }
 return error(res,404,'Unknown API endpoint.');
}
module.exports = async function handler(req,res){
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
 try {await router(req,res);}catch(err){
   console.error('Sypher API error:',err.message);
   if(res.headersSent){res.end();return;}
   if(err instanceof SyntaxError)return error(res,400,'Invalid JSON request.');
   return error(res,err.status||500,err.status===413?'Request too large.':'Could not complete the request. Check server logs and database configuration.');
 }
};
