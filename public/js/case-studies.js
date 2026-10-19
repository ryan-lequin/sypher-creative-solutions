/* SYPHER / Interactive portfolio case studies
   These three projects are expressly labeled illustrative student concepts.
   CSS artwork and UI demos are original, local and require no external services. */
(() => {
  'use strict';
  const dialog = document.getElementById('projectDialog');
  const content = document.getElementById('caseContent');
  const breadcrumb = document.getElementById('caseBreadcrumb');
  const grid = document.getElementById('projectsGrid');
  if (!dialog || !content || !grid) return;
  const PROJECTS = [
    {id:'aurora',type:'BRAND IDENTITY',num:'01',name:'Aurora Identity',tag:'An identity with a pulse.',
      lead:'A bold, optimistic visual world for a fictional lifestyle label that celebrates individuality and change.',
      brief:'Build a recognizable visual language that feels expressive online and beautiful on physical touchpoints.',
      response:'An elastic wordmark, radiant gradient system, and adaptable identity assets built for packaging, social, and web.',
      scope:['Creative direction','Logo system','Color palette','Packaging mockups','Brand guidelines'],
      stages:[['01','Discover','Define the audience, tone and positioning.'],['02','Design','Explore color, typography and mark variations.'],['03','Extend','Apply the identity to packaging and digital touchpoints.']],
      slides:[['The identity world','Signature art direction'],['Campaign artwork','Editorial poster system'],['Brand toolkit','Modular brand assets']],
      accent:'#d9a7ff',next:'orbit'},
    {id:'orbit',type:'WEB EXPERIENCE',num:'02',name:'Orbit Commerce',tag:'Objects worth slowing down for.',
      lead:'A fictional home-goods storefront concept balancing refined editorial design with clear, accessible shopping flows.',
      brief:'Turn browsing a small curated catalog into a calm, intuitive journey that works on mobile and desktop.',
      response:'A modular store UI, product storytelling, easy filtering and a simplified cart interaction.',
      scope:['UI/UX design','Responsive layouts','Product discovery','Cart prototype','Interaction design'],
      stages:[['01','Map','Outline catalog, product and checkout journeys.'],['02','Prototype','Create responsive component patterns and filters.'],['03','Refine','Balance delight with speed and accessibility.']],
      slides:[['The storefront','Editorial product discovery'],['Product details','Focused product storytelling'],['Mobile first','Simple shopping flow']],
      accent:'#89cafa',next:'bloom'},
    {id:'bloom',type:'DIGITAL CAMPAIGN',num:'03',name:'Bloom Social',tag:'Find room to grow.',
      lead:'An energetic fictional community campaign with a playful tone, colorful social layouts, and adaptable messaging.',
      brief:'Create a social-first visual direction that makes everyday growth feel personal, positive and shareable.',
      response:'A flexible campaign identity with feed posts, story assets and selectable creative directions.',
      scope:['Campaign concept','Social art direction','Story templates','Visual storytelling','Motion-ready assets'],
      stages:[['01','Imagine','Define the campaign voice and key message.'],['02','Create','Develop post, story and poster compositions.'],['03','Activate','Adapt the message across digital formats.']],
      slides:[['Hero campaign','Signature visual'],['The social series','Three post concepts'],['Story formats','Mobile-first stories']],
      accent:'#ffaac5',next:'aurora'}
  ];
  const find = id => { const base=PROJECTS.find(p=>p.id===id) || PROJECTS[0];const edited=window.SypherPublishedProjects?.[base.id];return edited?{...base,name:edited.title,type:edited.category.toUpperCase(),lead:edited.description}:base; };
  let current=PROJECTS[0],slide=0,originButton=null, touchStart=null;
  const demo={auroraPalette:'violet',auroraMark:'expressive',cart:0,category:'All',bloomVibe:'bold',liked:false};

  function visual(id,index){
    if(id==='aurora'){
      if(index===0)return `<div class="cs-art aurora-scene cs-brand-world"><div class="cs-brand-star">✺</div><div class="cs-brand-logo">aurora<span>®</span></div><div class="cs-brand-tag">IMAGINE A NEW DAY<br>MAKE IT YOURS</div><div class="cs-brand-jar"><span>aurora</span><small>GOOD DAYS / GOOD ENERGY</small></div><div class="cs-brand-note">a new<br>perspective ↗</div><span class="cs-art-corner">BRAND UNIVERSE / 01</span></div>`;
      if(index===1)return `<div class="cs-art aurora-scene cs-brand-poster"><div class="cs-brand-poster-disc"></div><div class="cs-brand-poster-top">AURORA PRESENTS&nbsp; • &nbsp;VOLUME 01</div><strong>GOOD<br><em>THINGS</em><br>BEGIN.</strong><div class="cs-brand-poster-bottom">CHANGE IS A BEAUTIFUL THING <span>✳</span></div></div>`;
      return `<div class="cs-art cs-brand-toolkit"><div class="cs-tool-heading"><span>aurora®</span><small>DESIGNED TO FEEL ALIVE</small></div><div class="cs-tool-items"><div class="cs-tool-a">a<span>✳</span></div><div class="cs-tool-b"><strong>✳</strong><span>MAKE<br>SPACE FOR<br>MORE.</span></div><div class="cs-tool-c"><span>COLOR SYSTEM</span><i></i><i></i><i></i><i></i></div></div><div class="cs-tool-footer">01 / FOUNDATION&nbsp;&nbsp; 02 / SYSTEMS&nbsp;&nbsp; 03 / APPLICATION</div></div>`;
    }
    if(id==='orbit'){
      if(index===0)return `<div class="cs-art cs-orbit-world"><div class="cs-store-window"><div class="cs-store-nav"><b>orbit.</b><span>Shop&nbsp;&nbsp; Stories&nbsp;&nbsp; About</span><span>⌕ &nbsp; ♡ &nbsp; ◯</span></div><div class="cs-store-hero"><div class="cs-store-copy"><small>OBJECTS FOR LIFE / VOL. 01</small><strong>A little<br>more room<br><em>to feel.</em></strong><span>Thoughtful things, beautifully made.</span><i>EXPLORE THE EDIT ↗</i></div><div class="cs-store-product"><div class="cs-lamp"><span></span></div><small>FORM / 001</small></div></div><div class="cs-store-footer">THE ESSENTIALS EDIT <span>LIGHTING &nbsp; / &nbsp; OBJECTS &nbsp; / &nbsp; SPACES</span></div></div></div>`;
      if(index===1)return `<div class="cs-art cs-orbit-detail"><div class="cs-orbit-product-shot"><div class="cs-lamp"><span></span></div><span class="cs-orbit-shot-name">01 / HALO LIGHT</span></div><div class="cs-orbit-product-info"><small>LIGHTING / NEW ARRIVAL</small><h3>The Halo<br>Lamp.</h3><p>Warm light. Soft edges.<br>A quieter kind of design.</p><div class="cs-orbit-swatch-row"><span></span><span></span><span></span></div><div class="cs-orbit-faux-buy">ADD TO BAG <b>↗</b></div></div></div>`;
      return `<div class="cs-art cs-orbit-mobile"><div class="cs-orbit-mobile-copy"><span>SHOP ANYWHERE</span><strong>Better<br>by design.</strong><p>Every interaction, considered.<br>From discovery to checkout.</p><i>DESIGNED FOR SMALL SCREENS ↗</i></div><div class="cs-phone"><div class="cs-phone-top">orbit. <span>☰ &nbsp; ◯</span></div><div class="cs-phone-photo"><div class="cs-lamp"><span></span></div></div><small>THE HALO LAMP</small><strong>Light up your space.</strong><div class="cs-phone-action">ADD TO BAG <span>↗</span></div></div></div>`;
    }
    if(index===0)return `<div class="cs-art cs-bloom-world"><div class="cs-bloom-top">✿ BLOOM CLUB <span>CAMPAIGN / 01</span></div><div class="cs-bloom-flower">✿</div><div class="cs-bloom-title">GROW<br>YOUR<br><em>WAY.</em></div><div class="cs-bloom-bottom">ONE DAY AT A TIME &nbsp; ↗ <span>MAKE SPACE TO BLOOM</span></div></div>`;
    if(index===1)return `<div class="cs-art cs-bloom-series"><div class="cs-bloom-post one"><small>01 / EMBRACE</small><span>✽</span><strong>BE YOUR<br>OWN<br>SUNSHINE.</strong></div><div class="cs-bloom-post two"><small>02 / EXPLORE</small><span>✿</span><strong>MAKE<br>ROOM TO<br>GROW.</strong></div><div class="cs-bloom-post three"><small>03 / BECOME</small><span>❁</span><strong>THE GOOD<br>IS JUST<br>STARTING.</strong></div></div>`;
    return `<div class="cs-art cs-bloom-stories"><div class="cs-story-card story-a"><span>BLOOM / STORY 01</span><i>✿</i><strong>do your<br>thing.</strong><small>SMALL STEPS / BIG ENERGY</small></div><div class="cs-story-card story-b"><span>BLOOM / STORY 02</span><i>✳</i><strong>keep<br>growing.</strong><small>TAKE UP SPACE ♥</small></div><div class="cs-story-card story-c"><span>BLOOM / STORY 03</span><i>❀</i><strong>stay<br>curious.</strong><small>YOUR STORY IS YOURS</small></div></div>`;
  }
  const widgets={
    aurora:()=>`<div class="cs-demo-grid cs-brand-demo" data-palette="${demo.auroraPalette}" data-mark="${demo.auroraMark}"><div class="cs-brand-live"><span class="cs-demo-eyebrow">LIVE IDENTITY CANVAS <span>✳</span></span><div class="cs-live-brand">${demo.auroraMark==='minimal'?'AURORA':'aurora<span>✳</span>'}</div><p>BE WHAT'S NEXT.</p><div class="cs-live-caption">VISUAL EXPLORATION / NOT A CLIENT PROJECT</div></div><div class="cs-demo-controls"><span class="cs-demo-eyebrow">01 / CHOOSE A PALETTE</span><div class="cs-palette-buttons"><button type="button" class="cs-palette-chip ${demo.auroraPalette==='violet'?'selected':''}" data-palette="violet" aria-pressed="${demo.auroraPalette==='violet'}"><i style="background:#b66ce8"></i> Vivid</button><button type="button" class="cs-palette-chip ${demo.auroraPalette==='peach'?'selected':''}" data-palette="peach" aria-pressed="${demo.auroraPalette==='peach'}"><i style="background:#f9aa8b"></i> Warm</button><button type="button" class="cs-palette-chip ${demo.auroraPalette==='mint'?'selected':''}" data-palette="mint" aria-pressed="${demo.auroraPalette==='mint'}"><i style="background:#a0dfb6"></i> Fresh</button></div><span class="cs-demo-eyebrow">02 / CHOOSE A WORDMARK</span><div class="cs-option-row"><button type="button" data-mark="expressive" class="${demo.auroraMark==='expressive'?'selected':''}" aria-pressed="${demo.auroraMark==='expressive'}">Expressive</button><button type="button" data-mark="minimal" class="${demo.auroraMark==='minimal'?'selected':''}" aria-pressed="${demo.auroraMark==='minimal'}">Minimal</button></div><p>Try the controls to explore how one identity can adapt without losing its character.</p></div></div>`,
    orbit:()=>`<div class="cs-shop-demo"><div class="cs-shop-header"><div><span class="cs-demo-eyebrow">LIVE SHOPPING PROTOTYPE</span><h4>orbit<span>.</span> <small>THE OBJECTS EDIT</small></h4></div><div class="cs-bag" aria-live="polite">BAG &nbsp; <b id="csBagCount">${demo.cart}</b></div></div><div class="cs-option-row cs-shop-filters">${['All','Lighting','Decor'].map(c=>`<button type="button" data-shop-filter="${c}" class="${demo.category===c?'selected':''}" aria-pressed="${demo.category===c}">${c}</button>`).join('')}</div><div class="cs-products">${[{id:'lamp',cat:'Lighting',title:'Halo Table Lamp',price:'₱1,290',icon:'◕'},{id:'vase',cat:'Decor',title:'Form Ceramic Vase',price:'₱980',icon:'❀'},{id:'tray',cat:'Decor',title:'Arc Display Tray',price:'₱790',icon:'◒'}].filter(x=>demo.category==='All'||demo.category===x.cat).map(x=>`<article class="cs-product"><div class="cs-product-visual ${x.id}"><span>${x.icon}</span></div><small>${x.cat.toUpperCase()}</small><div class="cs-product-line"><strong>${x.title}</strong><span>${x.price}</span></div><button type="button" data-cart-add="${x.id}">Add to bag <span>↗</span></button></article>`).join('')}</div><p class="cs-demo-feedback" id="csCartFeedback" role="status">Demo catalog only. Products and prices are illustrative; no purchase is made.</p></div>`,
    bloom:()=>`<div class="cs-bloom-demo" data-vibe="${demo.bloomVibe}"><div class="cs-bloom-demo-controls"><div><span class="cs-demo-eyebrow">CAMPAIGN CREATIVE PLAYGROUND</span><h4>Choose the mood.</h4><p>Watch the same campaign message shift tone.</p><div class="cs-option-row">${['bold','soft','electric'].map(x=>`<button type="button" data-vibe="${x}" class="${demo.bloomVibe===x?'selected':''}" aria-pressed="${demo.bloomVibe===x}">${x==='soft'?'Soft':x==='electric'?'Electric':'Bold'}</button>`).join('')}</div></div><span class="cs-live-hint">DEMO / SOCIAL CONCEPT</span></div><div class="cs-bloom-post-live"><div class="cs-post-header"><span>✿ bloomclub</span><span>•••</span></div><div class="cs-post-art"><div class="cs-post-shape">✿</div><strong>${demo.bloomVibe==='bold'?'GROW<br>YOUR<br>WAY.':demo.bloomVibe==='soft'?'TAKE<br>YOUR<br>TIME.':'MAKE<br>IT<br>HAPPEN.'}</strong></div><div class="cs-post-actions"><button type="button" data-like aria-pressed="${demo.liked}" aria-label="${demo.liked?'Unlike':'Like'} this concept post">${demo.liked?'♥':'♡'}</button><span>✧ &nbsp; ↗</span></div><div class="cs-post-caption"><b>${demo.liked?'Liked by you and 128 others':'128 sample likes'}</b><p><b>bloomclub</b> A little progress is still progress. ✨ #YourWay</p></div></div></div>`
  };
  function galleryHTML(){return `<div class="cs-gallery-main" id="csGalleryVisual" aria-label="${current.slides[slide][0]}">${visual(current.id,slide)}</div><div class="cs-gallery-foot"><div><span class="cs-gallery-counter">0${slide+1} / 0${current.slides.length}</span><strong id="csSlideTitle">${current.slides[slide][0]}</strong><small id="csSlideSubtitle">${current.slides[slide][1]}</small></div><div class="cs-gallery-arrows"><button type="button" data-slide-dir="-1" aria-label="Previous gallery image">←</button><button type="button" data-slide-dir="1" aria-label="Next gallery image">→</button></div></div>`}
  function render(){
    breadcrumb.textContent=current.type;
    content.innerHTML=`<div class="cs-hero cs-${current.id}"><div class="cs-hero-copy"><div class="cs-hero-index"><span>SELECTED WORK / ${current.num}/03</span><span>${current.type}</span></div><span class="cs-hero-pill">✦ FEATURED CONCEPT</span><h2 id="caseTitle">${current.name}<span class="cs-period">.</span></h2><p>${current.lead}</p><div class="cs-hero-cta"><a href="#csLiveDemo" class="cs-jump-demo">Try the live prototype <span>↗</span></a><span>SCROLL TO EXPLORE ↓</span></div></div><div class="cs-hero-visual">${visual(current.id,0)}</div></div>
      <div class="cs-case-padding"><div class="cs-case-meta"><div><span>PROJECT TYPE</span><strong>${current.type}</strong></div><div><span>STATUS</span><strong>Student concept / 2026</strong></div><div><span>FOCUS</span><strong>Visuals + Interaction</strong></div><div><span>DESIGNED FOR</span><strong>Desktop + Mobile</strong></div></div>
      <section class="cs-story"><div class="cs-eyebrow">01 / THE STORY</div><div class="cs-story-main"><div><h3>${current.tag}</h3><p>${current.lead}</p></div><div class="cs-story-details"><div><strong>THE CHALLENGE</strong><p>${current.brief}</p></div><div><strong>OUR CONCEPT</strong><p>${current.response}</p></div></div></div><div class="cs-tags">${current.scope.map(x=>`<span>${x}</span>`).join('')}</div></section>
      <section class="cs-gallery" id="csGallery"><div class="cs-section-heading"><div><span class="cs-eyebrow">02 / THE DESIGN</span><h3>Inside the concept<span>.</span></h3></div><p>Three directions. One coherent idea.<br>Browse the original mockups below.</p></div><div id="csGalleryFrame">${galleryHTML()}</div><div class="cs-gallery-thumbs">${current.slides.map((s,i)=>`<button type="button" data-slide="${i}" class="${i===slide?'selected':''}" aria-current="${i===slide?'true':'false'}"><span class="cs-thumb-mini ${current.id} mini-${i}">${i===0?'✳':i===1?'↗':'◈'}</span><span><b>0${i+1}</b> ${s[0]}</span></button>`).join('')}</div></section>
      <section class="cs-process"><div class="cs-section-heading"><div><span class="cs-eyebrow">03 / THE THINKING</span><h3>How the idea<br>takes shape<span>.</span></h3></div><p>An illustrative creative workflow, not measured client results.</p></div><div class="cs-process-grid">${current.stages.map(x=>`<div><span>${x[0]} / 03</span><h4>${x[1]}</h4><p>${x[2]}</p></div>`).join('')}</div></section>
      <section class="cs-playground" id="csLiveDemo"><div class="cs-section-heading"><div><span class="cs-eyebrow">04 / TRY IT YOURSELF</span><h3>From visual to <em>interactive.</em></h3></div><p>Working frontend prototypes.<br>No purchase, signup, or external account required.</p></div><div id="csDemoStage">${widgets[current.id]()}</div></section>
      <div class="cs-next"><div><span>UP NEXT / 0${find(current.next).num}</span><h3>${find(current.next).name} <span>↗</span></h3><p>${find(current.next).tag}</p></div><button type="button" data-next-project="${current.next}" aria-label="View next project ${find(current.next).name}">Explore next case study ↗</button></div><div class="cs-footer-actions"><button type="button" class="cs-request-link" data-contact-project="${current.name}">Request a similar project ↗</button><button type="button" data-close-case>← Back to all projects</button><span>THE PROJECTS SHOWN HERE ARE ORIGINAL STUDENT CONCEPT DEMONSTRATIONS.</span></div></div>`;
  }
  function openCase(id,button){current=find(id);slide=0;if(button)originButton=button;render();if(!dialog.open)dialog.showModal();dialog.scrollTop=0;}
  function closeCase(){dialog.close();}
  function updateGallery(){
    document.getElementById('csGalleryFrame').innerHTML=galleryHTML();
    content.querySelectorAll('[data-slide]').forEach(b=>{const active=Number(b.dataset.slide)===slide;b.classList.toggle('selected',active);b.setAttribute('aria-current',String(active));});
  }
  grid.addEventListener('click',event=>{
    const button=event.target.closest('[data-open-project]');if(!button)return;
    const theme=button.dataset.projectTheme || ['aurora','orbit','bloom'].find(x=>button.closest('.project-tile')?.querySelector('.project-art')?.classList.contains(x));
    openCase(theme,button);
  });
  document.getElementById('caseClose').addEventListener('click',closeCase);
  dialog.addEventListener('close',()=>{if(originButton?.isConnected)originButton.focus({preventScroll:true});});
  dialog.addEventListener('click',e=>{if(e.target===dialog)closeCase();});
  content.addEventListener('click',e=>{
    const t=e.target.closest('button');if(!t)return;
    if(t.hasAttribute('data-close-case'))return closeCase();
    if(t.hasAttribute('data-contact-project'))return window.SypherContact?.open(t.dataset.contactProject);
    if(t.hasAttribute('data-next-project'))return openCase(t.dataset.nextProject);
    if(t.hasAttribute('data-slide')){slide=Number(t.dataset.slide);return updateGallery();}
    if(t.hasAttribute('data-slide-dir')){slide=(slide+Number(t.dataset.slideDir)+current.slides.length)%current.slides.length;return updateGallery();}
    if(t.hasAttribute('data-palette')){demo.auroraPalette=t.dataset.palette;document.getElementById('csDemoStage').innerHTML=widgets.aurora();return;}
    if(t.hasAttribute('data-mark')){demo.auroraMark=t.dataset.mark;document.getElementById('csDemoStage').innerHTML=widgets.aurora();return;}
    if(t.hasAttribute('data-shop-filter')){demo.category=t.dataset.shopFilter;document.getElementById('csDemoStage').innerHTML=widgets.orbit();return;}
    if(t.hasAttribute('data-cart-add')){demo.cart++;document.getElementById('csBagCount').textContent=demo.cart;document.getElementById('csCartFeedback').textContent=`Added to demo bag. ${demo.cart} item${demo.cart===1?'':'s'} in bag; checkout is disabled.`;return;}
    if(t.hasAttribute('data-vibe')){demo.bloomVibe=t.dataset.vibe;document.getElementById('csDemoStage').innerHTML=widgets.bloom();return;}
    if(t.hasAttribute('data-like')){demo.liked=!demo.liked;document.getElementById('csDemoStage').innerHTML=widgets.bloom();return;}
  });
  content.addEventListener('pointerdown',e=>{if(e.target.closest('#csGalleryVisual'))touchStart={x:e.clientX,y:e.clientY};},{passive:true});
  content.addEventListener('pointerup',e=>{if(!touchStart)return;const dx=e.clientX-touchStart.x,dy=e.clientY-touchStart.y;touchStart=null;if(Math.abs(dx)>70 && Math.abs(dx)>Math.abs(dy)*1.5){slide=(slide+(dx<0?1:-1)+current.slides.length)%current.slides.length;updateGallery();}},{passive:true});
  dialog.addEventListener('keydown',e=>{if(['ArrowRight','ArrowLeft'].includes(e.key)&&!e.target.closest('input,textarea,select,button')){slide=(slide+(e.key==='ArrowRight'?1:-1)+current.slides.length)%current.slides.length;updateGallery();e.preventDefault();}});
})();
