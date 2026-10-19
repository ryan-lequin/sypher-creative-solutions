/* Sypher Immersive Studio  -  progressive and optional visual enhancements.
   High: pointer-responsive Canvas 2D at <= 30fps; Medium: CSS only;
   Basic/reduced motion/paused/hidden tab: no Canvas animation loop.
   No external libraries and no personal data collection.
*/
(() => {
  'use strict';
  const hero = document.querySelector('.hero');
  const canvas = document.querySelector('#starfieldCanvas');
  if (!hero || !canvas) return;
  const body = document.body;
  const ctx = canvas.getContext('2d', {alpha:true});
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const scenes = ['nebula','constellation','orbit'];
  const sceneButtons = [...document.querySelectorAll('[data-scene-select]')];
  const pauseButton = document.getElementById('sceneMotion');
  const statusHint = document.getElementById('sceneHint');
  const modeLabel = document.getElementById('studioModeLabel');
  const particleStatus = document.getElementById('liveParticles');
  const sceneStatus = document.getElementById('liveScene');
  const animStatus = document.getElementById('liveAnimation');
  const panel = document.querySelector('.studio-panel');
  const point = {x:0,y:0,active:false};
  const particles = [];
  let scene = 'nebula';
  let paused = false;
  let visible = true;
  let rafId = 0;
  let lastFrame = 0;
  let w = 1,h = 1,dpr = 1;
  let targetCount = 0;
  let t = 0;
  try { const saved = window.localStorage.getItem('sypher-scene'); if (scenes.includes(saved)) scene = saved; } catch {}

  function mode(){return body.dataset.mode || 'basic';}
  function reduced(){return motionPreference.matches || body.classList.contains('reduce-motion');}
  function canAnimate(){return ctx && !paused && !reduced() && mode()==='high' && visible && !document.hidden;}
  function random(a,b){return a+Math.random()*(b-a);}
  function resize(){
    const rect = hero.getBoundingClientRect();
    w = Math.max(1,rect.width); h = Math.max(1,rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    // Cap the canvas pixel count to avoid large retina buffers.
    dpr = Math.min(dpr, Math.sqrt(1700000/(w*h)) || 1);
    canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr);
    if (ctx) ctx.setTransform(dpr,0,0,dpr,0,0);
    targetCount = Math.min(coarsePointer ? 35 : 70,Math.max(25,Math.round(w*h/17000)));
    particles.length=0;
    for(let i=0;i<targetCount;i++) particles.push({x:random(0,w),y:random(0,h),radius:random(.7,2.05),speed:random(.12,.40),phase:random(0,6.28),alpha:random(.28,.92),depth:random(.4,1.1)});
    updateStatus();
  }
  function updateStatus(){
    hero.dataset.scene=scene;
    sceneButtons.forEach(button=>{const selected=button.dataset.sceneSelect===scene;button.classList.toggle('is-active',selected);button.setAttribute('aria-pressed',String(selected));});
    modeLabel.textContent=reduced()?'REDUCED MOTION':mode()==='high'?'HIGH / LIVE':mode()==='medium'?'MEDIUM / LITE':'BASIC / STATIC';
    sceneStatus.textContent=scene[0].toUpperCase()+scene.slice(1);
    particleStatus.textContent=canAnimate()?String(targetCount):(mode()==='high'&&!reduced()&&!paused?'Standby':'Off');
    animStatus.textContent=reduced()?'Motion off':paused?'Paused':mode()==='high'?(visible&&!document.hidden?'Interactive':'Auto sleep'):mode()==='medium'?'Gentle':'Static';
    pauseButton.textContent=paused?'▶':'Ⅱ';
    pauseButton.setAttribute('aria-pressed',String(paused));
    pauseButton.setAttribute('aria-label',paused?'Resume background animations':'Pause background animations');
    pauseButton.title=paused?'Resume background animations':'Pause background animations';
    statusHint.textContent=reduced()?'Your reduced-motion preference is respected.':paused?'Background paused. Press play to resume.':mode()==='basic'?'Static background keeps this device fast.':mode()==='medium'?'Soft atmospheric motion optimized for your device.':coarsePointer?'Tap the open background to create a burst of light.':'Move your cursor or click the background to interact.';
  }
  function sync(){
    // CSS scene-paused also stops the orbital decoration.
    body.classList.toggle('scene-paused',paused);
    updateStatus();
    if(canAnimate()){if(!rafId){lastFrame=0;rafId=requestAnimationFrame(frame);}}
    else { if(rafId) cancelAnimationFrame(rafId); rafId=0; ctx?.clearRect(0,0,w,h); }
  }
  function chooseScene(next){if(!scenes.includes(next))return;scene=next;try{localStorage.setItem('sypher-scene',scene);}catch{}sync();}
  sceneButtons.forEach(button=>button.addEventListener('click',()=>chooseScene(button.dataset.sceneSelect)));
  pauseButton.addEventListener('click',()=>{paused=!paused;sync();});
  function drawStar(p,alpha){
    ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);
    ctx.fillStyle=`rgba(${scene==='orbit'?'166,203,255':'217,192,255'},${alpha})`;
    ctx.fill();
    if(p.radius>1.7){ctx.beginPath();ctx.arc(p.x,p.y,p.radius*3.6,0,Math.PI*2);ctx.fillStyle=`rgba(155,116,254,${alpha*.08})`;ctx.fill();}
  }
  function frame(time){
    rafId=0;
    if(!canAnimate())return;
    // 30 FPS cap; moderate CPU/GPU load even on powerful screens.
    if(lastFrame && time-lastFrame<32){rafId=requestAnimationFrame(frame);return;}
    const delta = Math.min(48,lastFrame?time-lastFrame:33)/33;
    lastFrame=time; t+=delta;
    ctx.clearRect(0,0,w,h);
    const maxDistance = scene==='constellation'?145:scene==='orbit'?95:88;
    particles.forEach((p,i)=>{
      const movement=scene==='orbit'?Math.sin(t*.012+p.phase)*.16:Math.cos(t*.014+p.phase)*.10;
      p.x+=(p.speed + movement)*delta*p.depth;
      p.y+=Math.sin(t*.015+p.phase)*.1*delta;
      if(p.x>w+10){p.x=-10;p.y=random(0,h);}
      if(p.y>h+10)p.y=-10; if(p.y<-10)p.y=h+10;
      let brightness=p.alpha;
      if(point.active){const dx=p.x-point.x,dy=p.y-point.y;const dist=Math.hypot(dx,dy);
        if(dist<180){brightness=Math.min(1,brightness+.35*(1-dist/180));
          // Cursor gently pushes points away: small offsets, no jumps.
          if(dist>3 && dist<80){p.x+=(dx/dist)*.15*delta;p.y+=(dy/dist)*.15*delta;}
        }
      }
      drawStar(p,brightness);
      if(scene==='orbit'&&i%7===0){ctx.strokeStyle='rgba(150,130,248,.14)';ctx.lineWidth=.7;ctx.beginPath();ctx.ellipse(p.x,p.y,14,6,t*.0009+p.phase,0,Math.PI*2);ctx.stroke();}
    });
    // Sparse connection graph (extra lines for constellation preset).
    ctx.lineWidth=scene==='constellation'?.9:.5;
    for(let i=0;i<particles.length;i++){
      const a=particles[i];
      for(let j=i+1;j<particles.length;j++){
        const b=particles[j]; const dx=a.x-b.x,dy=a.y-b.y;
        if(Math.abs(dx)>maxDistance||Math.abs(dy)>maxDistance)continue;
        const distance=Math.hypot(dx,dy);
        if(distance>maxDistance || (scene==='nebula' && (i+j)%4!==0) || (scene==='orbit' && (i+j)%5!==0))continue;
        const strength=(1-distance/maxDistance)*(scene==='constellation'?.24:.12);
        ctx.strokeStyle=`rgba(174,139,255,${strength})`;
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      }
    }
    // Interaction halo is drawn in the same canvas, no separate DOM loops.
    if(point.active){
      const g=ctx.createRadialGradient(point.x,point.y,0,point.x,point.y,100);
      g.addColorStop(0,'rgba(211,173,255,.11)');g.addColorStop(1,'rgba(155,100,255,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(point.x,point.y,100,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(223,201,255,.35)';ctx.lineWidth=.65;ctx.beginPath();ctx.arc(point.x,point.y,16+Math.sin(t*.06)*2,0,Math.PI*2);ctx.stroke();
    }
    rafId=requestAnimationFrame(frame);
  }
  let pointerPending=false,mouseX=0,mouseY=0;
  hero.addEventListener('pointermove',event=>{
    if(!canAnimate())return;
    const r=hero.getBoundingClientRect();
    mouseX=event.clientX-r.left;mouseY=event.clientY-r.top;
    if(pointerPending)return;
    pointerPending=true;
    requestAnimationFrame(()=>{
      pointerPending=false;
      point.x=mouseX;point.y=mouseY;point.active=true;
      hero.style.setProperty('--spot-x',`${mouseX/w*100}%`);
      hero.style.setProperty('--spot-y',`${mouseY/h*100}%`);
    });
  },{passive:true});
  hero.addEventListener('pointerleave',()=>{point.active=false;});
  // Click creates a short sparkle burst; never intercepts buttons or links.
  hero.addEventListener('click',event=>{
    if(!canAnimate()||event.target.closest('button,a,input,textarea,select'))return;
    const r=hero.getBoundingClientRect(),x=event.clientX-r.left,y=event.clientY-r.top;
    const layer=document.getElementById('sparkEffects');
    const count=coarsePointer?6:10;
    for(let i=0;i<count;i++){
      const spark=document.createElement('i');spark.className='spark-pop';
      const angle=i/count*Math.PI*2;
      const radius=random(28,73);
      spark.style.setProperty('--sx',`${x}px`);spark.style.setProperty('--sy',`${y}px`);
      spark.style.setProperty('--dx',`${Math.cos(angle)*radius}px`);
      spark.style.setProperty('--dy',`${Math.sin(angle)*radius}px`);
      spark.addEventListener('animationend',()=>spark.remove(),{once:true});
      layer.append(spark);
    }
  });
  if('IntersectionObserver' in window){
    new IntersectionObserver(entries=>{visible=!!entries[0]?.isIntersecting;sync();},{threshold:0}).observe(hero);
  }
  if('ResizeObserver' in window)new ResizeObserver(()=>{resize();sync();}).observe(hero);
  else window.addEventListener('resize',()=>{resize();sync();},{passive:true});
  document.addEventListener('visibilitychange',sync);
  motionPreference.addEventListener?.('change',sync);
  new MutationObserver(sync).observe(body,{attributes:true,attributeFilter:['data-mode']});
  // Class may change for reduced motion; observe without an infinite loop:
  // sync only reacts to actual reduced-motion class transitions.
  let priorReducedClass=body.classList.contains('reduce-motion');
  new MutationObserver(()=>{const next=body.classList.contains('reduce-motion');if(next!==priorReducedClass){priorReducedClass=next;sync();}}).observe(body,{attributes:true,attributeFilter:['class']});
  resize();sync();

  /* Project filtering. The full case-study dialog is implemented in case-studies.js. */
  const gallery=document.getElementById('projectsGrid');
  const filters=[...document.querySelectorAll('[data-filter]')];
  let activeFilter='all';
  function applyFilter(){
    gallery.querySelectorAll('.project-tile').forEach(tile=>{tile.hidden=activeFilter!=='all'&&tile.dataset.category!==activeFilter;});
    filters.forEach(button=>{const active=button.dataset.filter===activeFilter;button.classList.toggle('is-selected',active);button.setAttribute('aria-pressed',String(active));});
  }
  filters.forEach(button=>button.addEventListener('click',()=>{activeFilter=button.dataset.filter;applyFilter();}));
  new MutationObserver(applyFilter).observe(gallery,{childList:true});

  /* Show the active section in navigation as the reader moves. */
  if('IntersectionObserver' in window){
    const links=[...document.querySelectorAll('.nav a[href^="#"]')];
    const sections=[...document.querySelectorAll('main section[id]')];
    const navObserver = new IntersectionObserver(entries=>{
      entries.filter(e=>e.isIntersecting).forEach(e=>{
        links.forEach(link=>link.removeAttribute('aria-current'));
        const current=links.find(link=>link.getAttribute('href')==='#'+e.target.id);
        if(current)current.setAttribute('aria-current','location');
      });
    },{rootMargin:'-20% 0px -65% 0px',threshold:0});
    sections.forEach(section=>navObserver.observe(section));
  }
})();
