/* SYPHER CINEMATIC EDITION  -  local videos + progressive interactions.
   No trackers, outside video hosts, GPU libraries, or required network requests.
   Playback policy:
   HIGH: autoplay muted only while the banner is on screen.
   MEDIUM, BASIC and prefers-reduced-motion: static poster until explicit play.
   Any mode: a user's Play/Pause choice always wins.
*/
(()=>{
 'use strict';
 const body=document.body;
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 const motionVideo=document.getElementById('motionVideo');
 const miniVideo=document.getElementById('miniFilmVideo');
 if(!motionVideo || !miniVideo)return;
 const videoToggle=document.getElementById('videoToggle');
 const miniToggle=document.getElementById('miniFilmToggle');
 const mainFrame=document.getElementById('cinemaFrame');
 const miniFrame=document.getElementById('miniFilmWrap');
 const videoState=document.getElementById('videoState');
 const liveBadge=document.getElementById('cinemaLiveBadge');
 const adaptiveNote=document.getElementById('videoAdaptiveNote');
 const progress=document.getElementById('cinemaTimeProgress');
 const films=[
  {src:'assets/video/sypher-showreel.mp4',poster:'assets/posters/sypher-showreel.jpg',title:'Ideas into impact.',kicker:'FILM 01 / CREATIVE SIGNAL',description:'A kinetic statement of everything Sypher stands for.'},
  {src:'assets/video/sypher-motion.mp4',poster:'assets/posters/sypher-motion.jpg',title:'Design in motion.',kicker:'FILM 02 / MADE TO MOVE',description:'A cinematic study in energy, rhythm, and visual identity.'}
 ];
 let current=0;
 const state={main:{visible:false,intent:'auto'},mini:{visible:false,intent:'auto'}};
 const pausedBySystem=()=>document.hidden;
 const isFullMotion=()=>body.dataset.mode==='high' && !reduce.matches && !body.classList.contains('reduce-motion');
 const shouldPlay=which=>!pausedBySystem()&&state[which].visible&&(state[which].intent==='play'||(state[which].intent==='auto'&&isFullMotion()));
 function updateLabels(){
  const playing=!motionVideo.paused&&!motionVideo.ended;
  videoToggle.textContent=playing?'Ⅱ':'▶';videoToggle.setAttribute('aria-label',playing?'Pause motion reel':'Play motion reel');videoToggle.setAttribute('aria-pressed',String(playing));
  const miniPlaying=!miniVideo.paused&&!miniVideo.ended;
  miniToggle.firstChild.textContent=miniPlaying?'Ⅱ ':'▶ ';
  const text=miniToggle.querySelector('span');if(text)text.textContent=miniPlaying?'Pause film':'Play film';
  miniToggle.setAttribute('aria-label',miniPlaying?'Pause second video banner':'Play second video banner');miniToggle.setAttribute('aria-pressed',String(miniPlaying));
  if(playing)videoState.textContent='Playing / muted';
  else if(state.main.intent==='paused')videoState.textContent='Paused';
  else if(state.main.intent==='play')videoState.textContent='Ready to play';
  else videoState.textContent=isFullMotion()?'Auto / in view':'Tap to play';
  if(reduce.matches)adaptiveNote.textContent='Reduced motion: video stays paused until you press Play.';
  else if(body.dataset.mode==='high')adaptiveNote.textContent='High mode · silent video plays while visible.';
  else adaptiveNote.textContent=body.dataset.mode==='medium'?'Medium mode · still poster until Play.':'Basic mode · static poster until Play.';
  liveBadge.textContent=playing?'●  NOW PLAYING / MUTED':'○  CINEMATIC PREVIEW';
 }
 function sync(which){
  const video=which==='main'?motionVideo:miniVideo;
  if(shouldPlay(which)){
    if(video.paused){
      const result=video.play();
      if(result&&typeof result.catch==='function')result.catch(()=>{state[which].intent='paused';updateLabels();});
    }
  }else video.pause();
  updateLabels();
 }
 function syncAll(){sync('main');sync('mini');}
 function toggle(which){
  const video=which==='main'?motionVideo:miniVideo;
  // Make pause persistent even if the high-mode observer runs again.
  state[which].intent=!video.paused?'paused':'play';
  sync(which);
 }
 videoToggle.addEventListener('click',()=>toggle('main'));
 miniToggle.addEventListener('click',()=>toggle('mini'));
 const filmButtons=[...document.querySelectorAll('[data-film]')];
 filmButtons.forEach(btn=>btn.addEventListener('click',()=>{
  const next=Number(btn.dataset.film);if(!films[next])return;
  current=next;
  const f=films[next];
  motionVideo.pause();motionVideo.removeAttribute('src');
  // Swapping the actual local MP4, not a CSS image or decorative placeholder.
  motionVideo.src=f.src;motionVideo.poster=f.poster;motionVideo.load();
  document.getElementById('filmTitle').textContent=f.title;
  document.getElementById('filmKicker').textContent=f.kicker;
  document.getElementById('filmDescription').textContent=f.description;
  progress.style.transform='scaleX(0)';
  filmButtons.forEach(b=>{const on=Number(b.dataset.film)===current;b.classList.toggle('is-current',on);b.setAttribute('aria-pressed',String(on));});
  if(state.main.intent!=='paused')sync('main');else updateLabels();
 }));
 motionVideo.addEventListener('timeupdate',()=>{
  const ratio=motionVideo.duration>0?Math.min(1,motionVideo.currentTime/motionVideo.duration):0;
  progress.style.transform=`scaleX(${ratio})`;
 });
 [motionVideo,miniVideo].forEach(v=>{
  v.addEventListener('play',updateLabels);v.addEventListener('pause',updateLabels);
  v.addEventListener('error',()=>{if(v===motionVideo)videoState.textContent='Video unavailable: poster displayed';});
 });
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{
   entries.forEach(entry=>{
    const which=entry.target===mainFrame?'main':'mini';
    state[which].visible=entry.isIntersecting&&entry.intersectionRatio>.04;
    sync(which);
   });
  },{threshold:[0,.08,.2],rootMargin:'90px 0px 90px 0px'});
  observer.observe(mainFrame);observer.observe(miniFrame);
 }else{state.main.visible=true;state.mini.visible=true;syncAll();}
 document.addEventListener('visibilitychange',syncAll);
 reduce.addEventListener?.('change',syncAll);
 // Observe only performance and reduced motion changes. Never force playback on scroll.
 new MutationObserver(syncAll).observe(body,{attributes:true,attributeFilter:['data-mode']});
 let lastReduced=body.classList.contains('reduce-motion');
 new MutationObserver(()=>{const now=body.classList.contains('reduce-motion');if(now!==lastReduced){lastReduced=now;syncAll();}}).observe(body,{attributes:true,attributeFilter:['class']});
 updateLabels();

 /* Creative playground  -  real interactive state, not an inert illustration. */
 const concepts={
  beyond:{title:'BEYOND<br>ORDINARY.',glyph:'✳',label:'SYPHER / 01 / BRAND WORLDS',subtitle:'Ideas without limits. Experiences without compromise.'},
  pulse:{title:'MOVE<br>PEOPLE.',glyph:'◈',label:'SYPHER / 02 / DIGITAL ENERGY',subtitle:'Immersive experiences with purpose and personality.'},
  fluid:{title:'STAY<br>CURIOUS.',glyph:'✦',label:'SYPHER / 03 / CREATIVE FLOW',subtitle:'Color, motion, and storytelling working together.'}
 };
 const lab=document.getElementById('labVisual');
 document.querySelectorAll('[data-lab]').forEach(btn=>btn.addEventListener('click',()=>{
  const c=concepts[btn.dataset.lab];if(!c)return;
  lab.dataset.concept=btn.dataset.lab;
  document.getElementById('labTitle').innerHTML=c.title; // Trusted built-in strings only.
  document.getElementById('labGlyph').textContent=c.glyph;
  document.getElementById('labCaption').textContent=c.label;
  document.getElementById('labSubtitle').textContent=c.subtitle;
  document.querySelectorAll('[data-lab]').forEach(b=>{const active=b===btn;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  lab.classList.remove('lab-swap');
  if(isFullMotion()){void lab.offsetWidth;lab.classList.add('lab-swap');}
 }));

 /* Sophisticated service-card lighting. High mode + fine-pointer only. */
 if(matchMedia('(pointer:fine)').matches){
  document.getElementById('servicesGrid')?.addEventListener('pointermove',event=>{
   if(!isFullMotion())return;
   const card=event.target.closest('.service-tile');if(!card)return;
   const rect=card.getBoundingClientRect();
   card.style.setProperty('--card-x',`${((event.clientX-rect.left)/rect.width*100).toFixed(1)}%`);
   card.style.setProperty('--card-y',`${((event.clientY-rect.top)/rect.height*100).toFixed(1)}%`);
  },{passive:true});
 }

 /* Section travel: a brief decorative wipe only for high-performance mode. */
 let travelling=false;
 document.querySelectorAll('.nav a[href^="#"],.hero-actions a[href^="#"],.mini-film-content a[href^="#"]').forEach(link=>{
  link.addEventListener('click',event=>{
   const hash=link.getAttribute('href');const target=hash&&document.querySelector(hash);
   if(!target||!isFullMotion()||travelling)return;
   event.preventDefault();travelling=true;
   body.classList.add('section-travel');
   setTimeout(()=>{target.scrollIntoView({behavior:'smooth',block:'start'});history.pushState(null,'',hash);},245);
   setTimeout(()=>{body.classList.remove('section-travel');travelling=false;},575);
  });
 });
 /* Floating back-to-top utility */
 const backTop=document.getElementById('backTop');
 let scrollQueued=false;
 function updateTop(){if(scrollQueued)return;scrollQueued=true;requestAnimationFrame(()=>{backTop.classList.toggle('is-visible',window.scrollY>520);scrollQueued=false;});}
 window.addEventListener('scroll',updateTop,{passive:true});updateTop();
 backTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:reduce.matches?'instant':'smooth'}));
})();
