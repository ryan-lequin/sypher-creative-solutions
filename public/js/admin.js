(() => {
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let inquiries=[], content=null, selected=null;
// Gmail compose URL: the customer is always the recipient; the admin sends manually in Gmail.
// This does not send email or confirm delivery within Sypher.
function gmailDraftUrl(to, subject, body) {
 const url=new URL('https://mail.google.com/mail/');
 url.searchParams.set('view','cm');
 url.searchParams.set('fs','1');
 url.searchParams.set('to',String(to||''));
 url.searchParams.set('su',String(subject||''));
 url.searchParams.set('body',String(body||''));
 return url.href;
}
function replySubject(item){return 'Re: Your Sypher project inquiry'+(item.service?' | '+item.service:'');}
function replyTemplate(item){
 return 'Hi '+item.name+',\n\nThank you for contacting Sypher Creative Solutions'+(item.service?' about '+item.service:'')+'. We would be happy to discuss your project with you.\n\nBest regards,\nSypher Creative Solutions';
}
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(path, options = {}) {
 let response;
 try {
  response = await fetch(path, {
   cache: 'no-store',
   credentials: 'same-origin',
   ...options,
   headers: {'Accept':'application/json', 'Content-Type':'application/json', ...(options.headers || {})}
  });
 } catch (cause) {
  throw new Error('Cannot reach the Sypher API. Start your Node.js server with npm start and reload this page. (' + cause.message + ')');
 }
 let body;
 try { body = await response.text(); }
 catch (cause) { throw new Error('Could not read the server response for ' + path + ': ' + cause.message); }
 if (!body.trim()) {
  throw new Error('Empty response from ' + path + ' (HTTP ' + response.status + '). Make sure you opened the correct Sypher Node.js server. Check /api/health and restart the process using port 3000.');
 }
 let data;
 try { data = JSON.parse(body); }
 catch {
  throw new Error('Unexpected non-JSON response from ' + path + ' (HTTP ' + response.status + ', Content-Type: ' + (response.headers.get('content-type') || 'unknown') + '). Check that the Sypher Node.js server is running, rather than a static preview server.');
 }
 if (!data || typeof data !== 'object') throw new Error('The server returned an invalid API response for ' + path + '.');
 if (!response.ok) throw new Error(data.error || ('Request failed (HTTP ' + response.status + ').'));
 return data;
}
function status(id,msg){$(id).textContent=msg;}
function show(authed){$('#loginPanel').hidden=authed;$('#adminPanel').hidden=!authed;$('#logout').hidden=!authed;}
async function initialize(){try{const s=await api('/api/admin/session');show(s.authenticated);if(!s.configured)status('#loginStatus','Admin access is disabled. Set ADMIN_PASSWORD on your server, then restart.');if(s.authenticated)await load();}catch(e){status('#loginStatus',e.message);}}
$('#loginForm').addEventListener('submit',async e=>{e.preventDefault();status('#loginStatus','Signing in...');try{await api('/api/admin/login',{method:'POST',body:JSON.stringify({password:$('#password').value})});$('#password').value='';show(true);await load();}catch(e){status('#loginStatus',e.message);}});
$('#logout').addEventListener('click',async()=>{await api('/api/admin/logout',{method:'POST'});show(false);selected=null;});
$$('[data-view]').forEach(button=>button.addEventListener('click',()=>{const chosen=button.dataset.view;$$('[data-view]').forEach(b=>{const yes=b===button;b.classList.toggle('active',yes);b.setAttribute('aria-selected',String(yes));});$('#inboxView').hidden=chosen!=='inbox';$('#contentView').hidden=chosen!=='content';}));
async function load(){const [msgs,site]=await Promise.all([api('/api/admin/inquiries'),api('/api/content')]);inquiries=msgs.inquiries;content=site;$('#emailConfigLabel').textContent='Gmail replies enabled · no domain or API key needed';$('#emailConfigLabel').classList.add('configured');drawInbox();drawContent();}
async function reloadInbox(){try{inquiries=(await api('/api/admin/inquiries')).inquiries;drawInbox();}catch(e){$('#inquiryList').textContent=e.message;}}
$('#refreshBtn').addEventListener('click',reloadInbox);$('#statusFilter').addEventListener('change',drawInbox);
function drawInbox(){const list=$('#inquiryList'),filter=$('#statusFilter').value;$('#totalCount').textContent=inquiries.length;$('#newCount').textContent=inquiries.filter(i=>i.status==='new').length;const shown=inquiries.filter(i=>filter==='all'||i.status===filter);list.replaceChildren();if(!shown.length){list.innerHTML='<div class="empty">No inquiries match this filter yet.</div>';}for(const item of shown){const b=document.createElement('button');b.type='button';b.className='inquiry-item'+(item.id===selected?' active':'');b.innerHTML=`<span class="pill ${escape(item.status)}">${escape(item.status)}</span><strong>${escape(item.name)}</strong><small>${escape(item.service||'General inquiry')}</small><small>${escape(new Date(item.createdAt).toLocaleString())}</small><small>${(item.replies||[]).length} earlier Resend replies</small>`;b.addEventListener('click',()=>{selected=item.id;drawInbox();});list.append(b);}drawDetail();}
function drawDetail(){
 const box=$('#inquiryDetails');const item=inquiries.find(x=>x.id===selected);
 if(!item){box.innerHTML='<p class="muted">Select an inquiry to view and manage it.</p>';return;}
 const history=(item.replies||[]).slice().reverse().map(r=>`<article class="reply-history-item"><div class="reply-meta"><strong>Earlier Resend reply</strong><span>${escape(new Date(r.acceptedAt).toLocaleString())}</span></div><div class="reply-subject">${escape(r.subject)}</div><div class="reply-message">${escape(r.message)}</div><small>To: ${escape(r.to)} · Provider message ID: ${escape(r.providerMessageId)}</small></article>`).join('');
 const template=replyTemplate(item), defaultSubject=replySubject(item), directGmailLink=gmailDraftUrl(item.email,defaultSubject,template);
 box.innerHTML=`<div class="tag">INQUIRY / ${escape(item.createdAt)}</div><h3>${escape(item.name)}</h3><p><strong>Email:</strong> ${escape(item.email)}<br><strong>Service:</strong> ${escape(item.service||'Not selected')}<br><strong>Budget:</strong> ${escape(item.budget||'Not specified')}</p><div class="message-box">${escape(item.message)}</div>
 <label for="inquiryStatus">Status<select id="inquiryStatus"><option value="new">New</option><option value="in-progress">In progress</option><option value="replied">Replied</option><option value="resolved">Resolved</option></select></label>
 <label for="inquiryNotes">Private notes<textarea id="inquiryNotes" rows="3" maxlength="3000" placeholder="Record follow-ups and next steps..."></textarea></label>
 <div class="inquiry-actions"><button class="primary" id="saveInquiry">Save changes</button><a class="ghost" id="openGmailReply" href="${escape(directGmailLink)}" target="_blank" rel="noopener noreferrer">↗ Reply in Gmail</a><button type="button" class="ghost" id="composeReply">✎ Customize reply</button><button id="deleteInquiry">Delete</button></div><p role="status" id="detailStatus" aria-live="polite"></p>
 <section class="reply-composer" id="replyComposer" hidden aria-label="Gmail reply composer"><div class="reply-heading"><div><span class="tag">OPEN IN GMAIL / NO DOMAIN NEEDED</span><h4>Write a reply<span>.</span></h4></div><button type="button" id="closeComposer" aria-label="Close email composer">✕</button></div>
 <p class="muted">The customer address and your draft will open in Gmail. Choose your Gmail account, review, and click <strong>Send</strong> there.</p>
 <form id="replyForm" class="reply-form"><label for="replyTo">Recipient<input id="replyTo" type="email" value="${escape(item.email)}" readonly></label><label for="replySubject">Subject<input id="replySubject" type="text" minlength="5" maxlength="180" required value="${escape(defaultSubject)}"></label><label for="replyMessage">Message<textarea id="replyMessage" rows="7" minlength="10" maxlength="5000" required placeholder="Write your reply here...">${escape(template)}</textarea></label>
 <div class="reply-actions"><button type="submit" id="sendReply" class="primary">↗ Open draft in Gmail</button><button type="button" id="cancelReply">Cancel</button></div></form>
 <p id="replyStatus" class="reply-feedback" role="status" aria-live="polite">Opening Gmail does not send email. Return here and manually set the status to <strong>Replied</strong> after you send it.</p></section>
 <section class="reply-history" aria-label="Previous Resend reply history"><div class="reply-heading"><div><span class="tag">PAST PROVIDER RECORDS</span><h4>Earlier email history <span>${(item.replies||[]).length}</span></h4></div></div>${history||'<div class="history-empty">Gmail drafts and sent mail are managed in your Gmail account, not stored automatically in Sypher.</div>'}</section>`;
 $('#inquiryStatus').value=item.status;$('#inquiryNotes').value=item.notes||'';
 $('#saveInquiry').addEventListener('click',async()=>{try{await api('/api/admin/inquiries/'+item.id,{method:'PATCH',body:JSON.stringify({status:$('#inquiryStatus').value,notes:$('#inquiryNotes').value})});status('#detailStatus','Saved.');await reloadInbox();}catch(e){status('#detailStatus',e.message);}});
 $('#deleteInquiry').addEventListener('click',async()=>{if(!confirm('Permanently delete this inquiry and its email reply history?'))return;try{await api('/api/admin/inquiries/'+item.id,{method:'DELETE'});selected=null;await reloadInbox();}catch(e){status('#detailStatus',e.message);}});
 const composer=$('#replyComposer');
 $('#composeReply').addEventListener('click',()=>{composer.hidden=false;$('#replyMessage').focus();});
 $('#closeComposer').addEventListener('click',()=>composer.hidden=true);
 $('#cancelReply').addEventListener('click',()=>composer.hidden=true);
 // Native Gmail link opens directly from a user click, avoiding pop-up blocker issues.
 $('#openGmailReply').addEventListener('click',()=>{
  status('#detailStatus','Gmail is opening in a new tab. Send your email there, then set status to Replied here and click Save changes.');
 });
 $('#replyForm').addEventListener('submit',e=>{
  e.preventDefault();
  const subject=$('#replySubject').value.trim(),message=$('#replyMessage').value.trim();
  if(subject.length<5||message.length<10){status('#replyStatus','Enter a subject (at least 5 characters) and message (at least 10 characters).');return;}
  const url=gmailDraftUrl(item.email,subject,message);
  // Open the tab synchronously in the submit event to preserve the browser's user gesture.
  const tab=window.open(url,'_blank');
  if(tab){try{tab.opener=null;}catch{};
   status('#replyStatus','Gmail opened in another tab. Review and send your message there. Then manually mark this inquiry as Replied.');
  }else{
   const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Click here to open your Gmail draft';
   const box=$('#replyStatus');box.replaceChildren('Your browser blocked the new tab. ',link);
  }
 });
}

function field(label,value,max,kind='input'){return `<label>${escape(label)}${kind==='textarea'?`<textarea maxlength="${max}">${escape(value)}</textarea>`:`<input maxlength="${max}" value="${escape(value)}">`}</label>`;}
function drawContent(){if(!content)return;$('#publicEmail').value=content.settings?.publicEmail||'';$('#studioNotice').value=content.settings?.studioNotice||'';
 $('#serviceEditors').innerHTML=content.services.map((x,i)=>`<div class="editor-item" data-service="${i}"><strong>${escape(x.icon)} / ${i+1}</strong>${field('Service name',x.title,80)}${field('Service description',x.description,300,'textarea')}</div>`).join('');
 $('#projectEditors').innerHTML=content.projects.map((x,i)=>`<div class="editor-item" data-project="${i}"><strong>${escape(x.theme)} / ${i+1}</strong>${field('Project title',x.title,80)}${field('Category',x.category,50)}${field('Short description',x.description,300,'textarea')}</div>`).join('');renderTestimonials();}
function renderTestimonials(){$('#testimonialEditors').innerHTML=content.testimonials.length?content.testimonials.map((x,i)=>`<div class="editor-item" data-testimonial="${i}">${field('Author name',x.name,80)}${field('Role / organization',x.role,100)}${field('Quote (with permission)',x.quote,500,'textarea')}<button type="button" data-remove-testimonial="${i}">Remove testimonial</button></div>`).join(''):'<p class="muted">No testimonials published. The public site displays an honest empty state until you add verified quotes.</p>';}
function gatherTestimonials(){return $$('[data-testimonial]').map(x=>({name:x.querySelectorAll('input')[0].value,role:x.querySelectorAll('input')[1].value,quote:x.querySelector('textarea').value}));}
$('#testimonialEditors').addEventListener('click',e=>{const btn=e.target.closest('[data-remove-testimonial]');if(!btn)return;content.testimonials=gatherTestimonials().filter((_,i)=>i!==Number(btn.dataset.removeTestimonial));renderTestimonials();});
$('#addTestimonial').addEventListener('click',()=>{content.testimonials=[...gatherTestimonials(),{name:'',role:'',quote:''}];renderTestimonials();$('#testimonialEditors [data-testimonial]:last-child input').focus();});
$('#saveContent').addEventListener('click',async()=>{const updated=structuredClone(content);updated.settings={publicEmail:$('#publicEmail').value,studioNotice:$('#studioNotice').value};updated.services=$$('[data-service]').map((div,i)=>({icon:content.services[i].icon,title:div.querySelector('input').value,description:div.querySelector('textarea').value}));updated.projects=$$('[data-project]').map((div,i)=>({theme:content.projects[i].theme,title:div.querySelectorAll('input')[0].value,category:div.querySelectorAll('input')[1].value,description:div.querySelector('textarea').value}));updated.testimonials=gatherTestimonials();status('#saveStatus','Saving...');try{const d=await api('/api/admin/content',{method:'PUT',body:JSON.stringify(updated)});content=d.content;status('#saveStatus','Saved! Reload the public site to see your changes.');drawContent();}catch(e){status('#saveStatus','Could not save: '+e.message);}});
initialize();
})();
