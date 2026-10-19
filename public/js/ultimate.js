/* Decorative effects are gated by the detected performance mode. */
(() => {
 const hero = document.querySelector('.hero');
 if (!hero || !matchMedia('(pointer: fine)').matches) return;
 let queued = false, x = 50, y = 50;
 hero.addEventListener('pointermove', e => {
   if (document.body.dataset.mode !== 'high' || document.body.classList.contains('reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
   const r = hero.getBoundingClientRect(); x = (e.clientX-r.left)/r.width*100; y = (e.clientY-r.top)/r.height*100;
   if (queued) return; queued=true; requestAnimationFrame(() => {hero.style.setProperty('--mx', x+'%');hero.style.setProperty('--my',y+'%');queued=false;});
 },{passive:true});
})();
