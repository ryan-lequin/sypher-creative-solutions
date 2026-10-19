'use strict';
const fs=require('node:fs'),path=require('node:path');
const folder=process.argv[2],url=String(process.env.SUPABASE_URL||'').replace(/\/$/,''),key=String(process.env.SUPABASE_SECRET_KEY||'');
if(!folder||!url||!key){console.error('Set SUPABASE_URL and SUPABASE_SECRET_KEY, then run: node scripts/import-existing-data.js "OLD_PRIVATE_DATA_FOLDER"');process.exit(1);}
async function upsert(table,data){const headers={apikey:key,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=representation'};
if(!key.startsWith('sb_secret_'))headers.Authorization='Bearer '+key;
const response=await fetch(`${url}/rest/v1/${table}?on_conflict=id`,{method:'POST',headers,body:JSON.stringify(data)});
if(!response.ok)throw Error(`${table} returned HTTP ${response.status}: ${(await response.text()).slice(0,300)}`);}
(async()=>{const base=path.resolve(folder);if(!fs.existsSync(base)||!fs.statSync(base).isDirectory())throw Error('Folder not found: '+base);
const contentFile=path.join(base,'content.json'),inquiriesFile=path.join(base,'inquiries.json');
if(fs.existsSync(contentFile)){await upsert('sypher_content',{id:'main',data:JSON.parse(fs.readFileSync(contentFile,'utf8'))});console.log('Imported website content.');}
if(fs.existsSync(inquiriesFile)){const records=JSON.parse(fs.readFileSync(inquiriesFile,'utf8'));if(!Array.isArray(records))throw Error('Invalid inquiries file');
for(const record of records){if(!/^[0-9a-f-]{36}$/i.test(record.id))throw Error('Invalid inquiry ID in backup');await upsert('sypher_inquiries',{id:record.id,created_at:record.createdAt||new Date().toISOString(),payload:record});}console.log(`Imported ${records.length} inquiries.`);}
console.log('Import complete; keep the original backups.');})().catch(e=>{console.error('Import failed:',e.message);process.exitCode=1;});
