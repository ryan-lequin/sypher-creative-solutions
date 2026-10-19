/* Sypher site runtime: live API-backed content and a genuine persistent inquiry form. */
(() => {
  'use strict';
  const $=s=>document.querySelector(s);
  const create=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;};
  const art={
    aurora:'<div class="tile-brand-emblem"><span>aurora<span class="tile-emblem-star">✳</span></span><small>IDENTITY / 2026</small></div><div class="tile-brand-disc"></div><div class="tile-brand-ticket">THE ART OF BECOMING ✦</div>',
    orbit:'<div class="tile-shop"><div class="tile-shop-nav">ORBIT<span>⌕ &nbsp; ♡ &nbsp; ◯</span></div><div class="tile-shop-main"><div><small>THE OBJECTS EDIT</small><strong>Form meets<br>feeling.</strong><i>SHOP COLLECTION ↗</i></div><div class="tile-shop-orb"><span></span></div></div><div class="tile-shop-footer">CURATED FOR EVERYDAY LIVING <span>01 / 03</span></div></div>',
    bloom:'<div class="tile-social"><div class="tile-social-top"><span>✿ bloomclub</span><small>↗</small></div><div class="tile-social-flower">✿</div><strong>GROW<br>YOUR WAY.</strong><div class="tile-social-bottom">MOVE DIFFERENT. BLOOM TOGETHER. <span>♥ 2.8K</span></div></div>'
  };
  const icons={palette:'✦',code:'⌘',megaphone:'◎',video:'▶'};
  const selectService=(service)=>{const input=$('#contactService');if(!input)return;let value=[...input.options].find(x=>x.value.toLowerCase()===String(service).toLowerCase());if(!value&&service){value=new Option('Project like: '+service,'Project like: '+service);input.add(value);}input.value=value?value.value:'Other / Not sure';};
  function goToContact(service){selectService(service);$('#projectDialog')?.open&&$('#projectDialog').close();$('#contact').scrollIntoView({behavior:document.body.classList.contains('reduce-motion')?'instant':'smooth'});}
  window.SypherContact={open:goToContact};
  function render(data){
    const services=$('#servicesGrid'), projects=$('#projectsGrid'),quotes=$('#testimonialsGrid');
    services.replaceChildren();projects.replaceChildren();quotes.replaceChildren();
    const serviceOptions=$('#contactService');const savedService=serviceOptions.value;serviceOptions.innerHTML='<option value="">Choose a service (optional)</option>';
    (data.services||[]).forEach(s=>{
      const c=create('article','tile service-tile');
      c.append(create('div','service-icon',icons[s.icon]||'✦'),create('h3','',s.title),create('p','',s.description));
      const a=create('a','service-request','Discuss this service ↗');a.href='#contact';a.addEventListener('click',()=>selectService(s.title));c.append(a);services.append(c);
      const option=document.createElement('option');option.value=s.title;option.textContent=s.title;serviceOptions.append(option);
    });
    const other=new Option('Other / Not sure','Other / Not sure');serviceOptions.append(other);
    if(savedService){
      if(![...serviceOptions.options].some(o=>o.value===savedService))serviceOptions.add(new Option(savedService,savedService));
      serviceOptions.value=savedService;
    }
    (data.projects||[]).forEach(p=>{
      if(!['aurora','orbit','bloom'].includes(p.theme))return;
      const c=create('article','tile project-tile');c.dataset.category=String(p.category||'').toLowerCase();
      const cover=create('div','project-art '+p.theme);cover.innerHTML=art[p.theme];
      c.append(cover,create('span','project-category',p.category),create('h3','',p.title),create('p','',p.description));
      const button=create('button','project-open','View interactive case study');button.type='button';button.setAttribute('aria-label',`Explore ${p.title} concept`);button.dataset.openProject='true';button.dataset.projectTheme=p.theme;button.append(create('span','','↗'));
      c.append(button);projects.append(c);
    });
    document.querySelectorAll('[data-filter]').forEach((button,i)=>{if(i===0){const badge=button.querySelector('span');if(badge)badge.textContent=String((data.projects||[]).length).padStart(2,'0');return;}const item=(data.projects||[])[i-1];if(item){button.dataset.filter=item.category.toLowerCase();button.textContent=item.category;}});
    window.SypherPublishedProjects=Object.fromEntries((data.projects||[]).map(project=>[project.theme,project]));
    const published=data.testimonials||[];
    published.forEach(t=>{const c=create('article','tile quote-tile');c.append(create('div','quote-mark','“'),create('blockquote','',t.quote),create('strong','',t.name),create('p','',t.role));quotes.append(c);});
    $('#testimonialsNote').textContent=published.length?'Verified testimonials published by the studio.':'No client testimonials have been published yet. We only share genuine, approved feedback.';
    if(!published.length){const box=create('div','testimonial-empty','Verified client stories will appear here once available.');quotes.append(box);}
    const publicEmail=data.settings?.publicEmail||'';const emailLink=$('#publicContactEmail');
    if(publicEmail){emailLink.textContent=publicEmail+' ↗';emailLink.href='mailto:'+publicEmail;emailLink.hidden=false;}else emailLink.hidden=true;
    $('#workNotice').textContent=data.settings?.studioNotice||'These are original portfolio concepts, not completed client commissions.';
  }
  // Always render usable content without waiting for the network. The server's
  // admin-managed catalog replaces these defaults when it loads successfully.
  const defaultContent={
    services:[
      {icon:'palette',title:'Brand Identity',description:'Memorable brand systems, logos, and visual guidelines for ambitious businesses.'},
      {icon:'code',title:'Web Development',description:'Fast, accessible, responsive websites built for real people and real devices.'},
      {icon:'megaphone',title:'Digital Marketing',description:'Strategic campaigns and creative storytelling that connect with audiences.'},
      {icon:'video',title:'Multimedia Production',description:'Video, motion, and digital assets designed to bring ideas to life.'}
    ],
    projects:[
      {category:'Branding',title:'Aurora Identity',description:'An interactive brand identity concept.',theme:'aurora'},
      {category:'Web Design',title:'Orbit Commerce',description:'An interactive, responsive storefront concept.',theme:'orbit'},
      {category:'Campaign',title:'Bloom Social',description:'An interactive social campaign concept.',theme:'bloom'}
    ],
    testimonials:[],
    settings:{publicEmail:'',studioNotice:'Portfolio showcases are original design concepts, not commissioned client work.'}
  };
  async function load(){
    const alert=$('#contentAlert');
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),8000);
    try{
      const response=await fetch('/api/content',{cache:'no-store',signal:controller.signal});
      if(!response.ok)throw new Error('HTTP '+response.status+' from /api/content');
      const data=await response.json();
      if(!data || !Array.isArray(data.services) || !Array.isArray(data.projects) || !Array.isArray(data.testimonials))
        throw new Error('The content API returned an incomplete catalog');
      render(data);
      if(alert){alert.hidden=true;alert.textContent='';}
    }catch(err){
      console.warn('[Sypher] Live content unavailable, using built-in catalog:',err);
      // The menu does not depend on the backend. Leave standard choices usable
      // and never show a permanent retry button.
      if(alert){
        alert.textContent='Live website data is unavailable. Standard content is displayed. Start the Node.js server to submit inquiries and manage content.';
        alert.hidden=false;
      }
    }finally{clearTimeout(timeout);}
  }
  // The offline-safe catalog renders before network access, so service buttons
  // and the portfolio remain interactive while the API request is pending.
  render(defaultContent);
  // Load live content before other interactive modules initialize. If a later
  // browser-specific feature fails, the services dropdown can still update.
  load();
  const info=window.SypherDetector.detect();
  $('#cpuValue').textContent=info.threads??'Unavailable';$('#memoryValue').textContent=info.memory?info.memory+' GB':'Unavailable';$('#screenValue').textContent=`${info.width} × ${info.height}`;$('#webglValue').textContent=info.gpu?'Supported':'Unavailable';$('#scoreValue').textContent=info.score+'/100';$('#motionValue').textContent=info.reduced?'Enabled':'Off';
  let choice='auto';try{choice=localStorage.getItem('sypher-mode')||'auto';}catch{}if(!['auto','high','medium','basic'].includes(choice))choice='auto';
  window.SypherRuntime={info,getChoice:()=>choice,getMode:()=>document.body.dataset.mode};
  function update(){window.SypherAdaptive.apply(choice==='auto'?info.auto:choice,info);document.querySelectorAll('[data-select-mode]').forEach(b=>{const active=b.dataset.selectMode===choice;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});}
  document.querySelectorAll('[data-select-mode]').forEach(b=>b.addEventListener('click',()=>{choice=b.dataset.selectMode;try{localStorage.setItem('sypher-mode',choice);}catch{}update();}));
  const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');motionQuery.addEventListener?.('change',e=>{info.reduced=e.matches;$('#motionValue').textContent=e.matches?'Enabled':'Off';update();});
  update();setTimeout(()=>{$('#analyzer').classList.add('hidden');},650);
  $('#year').textContent=new Date().getFullYear();
  $('#menuToggle').addEventListener('click',()=>{const open=$('#siteNav').classList.toggle('open');$('#menuToggle').setAttribute('aria-expanded',String(open));});
  document.querySelectorAll('#siteNav a').forEach(a=>a.addEventListener('click',()=>{$('#siteNav').classList.remove('open');$('#menuToggle').setAttribute('aria-expanded','false');}));
  document.querySelectorAll('[data-contact-project]').forEach(b=>b.addEventListener('click',()=>goToContact(b.dataset.contactProject)));
  $('#contactForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const form=e.currentTarget,button=form.querySelector('[type=submit]'),status=$('#formStatus');
    const payload=Object.fromEntries(new FormData(form));
    const name=String(payload.name||'').trim();
    const email=String(payload.email||'').trim();
    const message=String(payload.message||'').trim();
    if(name.length<2){status.textContent='Please enter your name (at least 2 characters).';$('#contactName').focus();return;}
    if(!$('#contactEmail').checkValidity()||!email){status.textContent='Please enter a valid email address.';$('#contactEmail').focus();return;}
    if(message.length<10){status.textContent='Your message must be at least 10 characters long.';$('#contactMessage').focus();return;}
    payload.name=name;payload.email=email;payload.message=message;
    status.textContent='Sending your inquiry securely...';button.disabled=true;
    try{
      const r=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const body=await r.json();
      if(!r.ok){status.textContent='Not submitted: '+(body.error||`The server returned HTTP ${r.status}.`);return;}
      status.textContent=`✓ ${body.message} Reference: ${body.id?.slice(0,8)||'received'}.`;
      form.reset();
    }catch(err){
      status.textContent='Could not connect to the server. Make sure npm start is running, then try again.';
    }finally{button.disabled=false;}
  });
})();
