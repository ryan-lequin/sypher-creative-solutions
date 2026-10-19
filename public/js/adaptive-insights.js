/* Classification explainer & transparent, user-initiated CSV evidence export. */
(() => {
 'use strict';
 const runtime=window.SypherRuntime;
 if(!runtime)return;
 const info=runtime.info;
 const $=id=>document.getElementById(id);
 const pointCPU=info.threads===null?17:info.threads>=12?35:info.threads>=8?28:info.threads>=4?19:8;
 const pointMem=info.memory===null?15:info.memory>=8?30:info.memory>=4?22:info.memory>=2?12:5;
 const pointGL=info.gpu?20:0;
 const pointScreen=Math.max(info.width,info.height)>=1600?15:Math.max(info.width,info.height)>=1000?10:7;
 const penalty=info.saveData?-20:0;
 const pieces=[['CPU threads',pointCPU+' / 35'],['Estimated RAM',pointMem+' / 30'],['WebGL support',pointGL+' / 20'],['Screen size',pointScreen+' / 15']];
 if(info.saveData)pieces.push(['Save-Data', '-20']);
 $('adaptBreakdown').replaceChildren(...pieces.map(([label,points])=>{const el=document.createElement('div');el.className='adapt-part';const a=document.createElement('span'),b=document.createElement('strong');a.textContent=label;b.textContent=points;el.append(a,b);return el;}));
 $('adaptScoreFill').style.width=info.score+'%';
 $('adaptScorePill').textContent=info.score+' / 100';
 $('adaptDetectDetail').textContent=`${[info.threads!=null?'CPU':'',info.memory!=null?'memory':'',info.gpu?'WebGL':'','screen'].filter(Boolean).join(' · ')} available`;
 $('adaptAutoMode').textContent=info.auto.toUpperCase()+' estimate';
 $('adaptScoreDetail').textContent=info.score+' / 100 · Basic 0-70 · Medium 71-80 · High 81-100';
 function feature(label,on){const el=document.createElement('span');el.className='adapt-feature'+(on?' on':'');const dot=document.createElement('i');dot.setAttribute('aria-hidden','true');el.append(dot,document.createTextNode(label+' · '+(on?'On':'Off')));return el;}
 function refresh(){
  const mode=runtime.getMode(),choice=runtime.getChoice();
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const high=mode==='high'&&!reduced,medium=mode==='medium'&&!reduced;
  $('adaptActiveMode').textContent=mode.toUpperCase()+' selected';
  $('adaptEffectsDetail').textContent=high?'Full cinematic effects':medium?'Optimized CSS motion':'Static & lightweight';
  $('adaptResponseLabel').textContent=reduced?'Reduced motion':choice==='auto'?'Automatic adjustment':'Manual override';
  $('adaptResponseDetail').textContent=reduced?'Decorative motion minimized':choice==='auto'?'Selected from browser estimates':'User preference applied instantly';
  $('adaptFeatures').replaceChildren(feature('Animated background',high||medium),feature('Canvas particles',high),feature('Autoplay video',high),feature('3D / visual interactions',high),feature('Section transitions',high),feature('Videos on request',true));
  $('adaptPreferenceNote').textContent=(reduced?'Reduced-motion preference is ON. Decorative animations stay disabled. ':'Reduced-motion preference is OFF. ')+(info.saveData?'Data Saver is enabled; your estimated score is reduced.':'Video is still user-controlled and never essential for accessing content.');
 }
 new MutationObserver(refresh).observe(document.body,{attributes:true,attributeFilter:['data-mode','class']});
 window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change',refresh);
 refresh();
 $('adaptExport').addEventListener('click',()=>{
  const now=new Date();const fields={timestamp:now.toISOString(),device_model:'FILL IN DEVICE MODEL',browser:navigator.userAgent,logical_cpu_threads:info.threads??'unavailable',device_memory_gb:info.memory??'unavailable',screen_width:info.width,screen_height:info.height,webgl_supported:info.gpu,save_data:info.saveData,prefers_reduced_motion:window.matchMedia('(prefers-reduced-motion: reduce)').matches,estimated_score:info.score,estimated_mode:info.auto,mode_selection:runtime.getChoice(),applied_mode:runtime.getMode(),observed_fps:'MEASURE ON DEVICE',page_load_ms:'MEASURE ON DEVICE',notes:'FILL IN AFTER TESTING'};
  const esc=s=>'"'+String(s).replaceAll('"','""')+'"';const csv=Object.keys(fields).map(esc).join(',')+'\r\n'+Object.values(fields).map(esc).join(',')+'\r\n';
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='sypher-device-test-'+now.toISOString().slice(0,10)+'.csv';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  $('adaptExportStatus').textContent='Device record prepared. Add the device model and your measured results before submitting.';
 });
})();
