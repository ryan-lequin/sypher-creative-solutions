'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {EventEmitter}=require('node:events');
const handler=require('../api/index');
process.env.SUPABASE_URL='https://mock.supabase.co';
process.env.SUPABASE_SECRET_KEY='sb_secret_fake_unit_test';
process.env.ADMIN_PASSWORD='unit-test-admin-password';
const rows={sypher_content:[],sypher_inquiries:[],sypher_sessions:[],sypher_rate_events:[]};
let sequence=0;
const originalFetch=global.fetch;
global.fetch=async(uri,opt={})=>{
 const url=new URL(uri),table=url.pathname.split('/').pop(),arr=rows[table],method=opt.method||'GET';
 assert.ok(arr,'Unexpected table '+table);
 assert.equal(opt.headers.apikey,process.env.SUPABASE_SECRET_KEY);
 const filtered=()=>arr.filter(row=>{
  for(const [name,value] of url.searchParams){
   if(['select','order','limit','on_conflict'].includes(name))continue;
   if(value.startsWith('eq.')&&String(row[name])!==value.slice(3))return false;
   if(value.startsWith('gte.')&&!(row[name]>=value.slice(4)))return false;
  }
  return true;
 });
 let result;
 if(method==='GET'){
  result=filtered();
  if(url.searchParams.get('order')==='created_at.desc')result=[...result].reverse();
  if(url.searchParams.has('limit'))result=result.slice(0,Number(url.searchParams.get('limit')));
  const select=url.searchParams.get('select');if(select&&select!=='*'){
   const cols=select.split(',');result=result.map(r=>Object.fromEntries(cols.map(k=>[k,r[k]])));
  }
 }else if(method==='POST'){
  const data=JSON.parse(opt.body);
  if(table==='sypher_rate_events')data.id=++sequence;
  if(!data.created_at)data.created_at=new Date().toISOString();
  let idx=table==='sypher_content'?arr.findIndex(v=>v.id===data.id):-1;
  if(idx>=0)arr[idx]={...arr[idx],...data};else arr.push(data);
  result=[data];
 }else if(method==='PATCH'){
  const data=JSON.parse(opt.body);result=filtered().map(row=>Object.assign(row,data));
 }else if(method==='DELETE'){
  const matches=filtered();for(const row of matches)arr.splice(arr.indexOf(row),1);result=matches;
 }else throw Error(method);
 return {ok:true,status:200,text:async()=>JSON.stringify(result)};
};
async function invoke(path,method='GET',body,session){
 const headers={};if(session)headers.cookie='sypher_session='+session;
 const req={url:path,method,headers,body,socket:{remoteAddress:'127.0.0.1'},query:{}};
 const res=new EventEmitter();res.headers={};res.statusCode=200;res.setHeader=(k,v)=>res.headers[k]=v;res.end=v=>{res.raw=v||'';res.emit('finished');};
 const finished=new Promise(r=>res.on('finished',r));
 await handler(req,res);await finished;
 let data;try{data=JSON.parse(res.raw);}catch{data=res.raw;}
 return {status:res.statusCode,data,headers:res.headers};
}
test('complete website API flow persists data, authenticates and locks down admin',async()=>{
 let r=await invoke('/api/health');assert.equal(r.data.storage,'supabase');assert.equal(r.data.adminConfigured,true);
 r=await invoke('/api/content');assert.equal(r.data.services.length,4);
 r=await invoke('/api/admin/inquiries');assert.equal(r.status,401);
 r=await invoke('/api/contact','POST',{name:'',email:'bad',message:'short'});assert.equal(r.status,400);
 r=await invoke('/api/contact','POST',{name:'Test Person',email:'customer@example.com',message:'Please build our new company website!',service:'Web Development'});assert.equal(r.status,201);
 const id=r.data.id;
 r=await invoke('/api/admin/login','POST',{password:'incorrect'});assert.equal(r.status,401);
 r=await invoke('/api/admin/login','POST',{password:process.env.ADMIN_PASSWORD});assert.equal(r.status,200);
 const token=r.headers['Set-Cookie'].split(';')[0].split('=')[1];assert.equal(token.length,64);
 r=await invoke('/api/admin/session','GET',undefined,token);assert.equal(r.data.authenticated,true);
 r=await invoke('/api/admin/inquiries','GET',undefined,token);assert.equal(r.data.inquiries[0].id,id);
 r=await invoke('/api/admin/inquiries/'+id,'PATCH',{status:'replied',notes:'Sent manually using Gmail.'},token);assert.equal(r.data.inquiry.status,'replied');
 r=await invoke('/api/admin/inquiries/export','GET',undefined,token);assert.ok(r.data.includes('customer@example.com'));
 const site=await invoke('/api/content');site.data.settings.studioNotice='Edited studio notice';
 r=await invoke('/api/admin/content','PUT',site.data,token);assert.equal(r.status,200);
 r=await invoke('/api/content');assert.equal(r.data.settings.studioNotice,'Edited studio notice');
 r=await invoke('/api/admin/logout','POST',undefined,token);assert.equal(r.status,200);
 r=await invoke('/api/admin/session','GET',undefined,token);assert.equal(r.data.authenticated,false);
});
test.after(()=>{global.fetch=originalFetch;});
