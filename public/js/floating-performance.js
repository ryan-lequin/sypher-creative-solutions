/* Floating Performance Lab: accessible, persistent collapse/hide/show, no API changes. */
(() => {
  'use strict';
  const panel=document.getElementById('dashboard');
  const trigger=document.getElementById('performanceLauncher');
  const minimize=document.getElementById('minimizePerformance');
  const hide=document.getElementById('hidePerformanceWidget');
  const label=document.getElementById('floatingLauncherMode');
  const badge=document.getElementById('floatingPanelMode');
  if(!panel||!trigger||!minimize||!hide||!label||!badge)return;
  const STORAGE_KEY='sypher-floating-performance-state';
  const VALID=new Set(['open','minimized','hidden']);
  let state='minimized';
  try{const stored=localStorage.getItem(STORAGE_KEY);if(VALID.has(stored))state=stored;}catch{}
  // The panel starts collapsed on first visit, but respects returning visitors.
  function syncLabels(){
    const mode=(document.body.dataset.mode||'basic').toUpperCase();
    label.textContent=mode+' MODE';
    badge.textContent=mode;
  }
  function setState(next,{focus=false}={}){
    if(!VALID.has(next))return;
    state=next;
    const isOpen=next==='open';
    panel.hidden=!isOpen;
    panel.inert=!isOpen;
    trigger.hidden=next==='hidden';
    trigger.setAttribute('aria-expanded',String(isOpen));
    trigger.setAttribute('aria-label',isOpen?'Minimize adaptive performance dashboard':'Show adaptive performance dashboard');
    try{localStorage.setItem(STORAGE_KEY,next);}catch{}
    if(focus){(isOpen?minimize:next==='minimized'?trigger:document.querySelector('#siteNav a[href="#dashboard"]'))?.focus({preventScroll:true});}
  }
  trigger.addEventListener('click',()=>setState(state==='open'?'minimized':'open',{focus:state!=='open'}));
  minimize.addEventListener('click',()=>setState('minimized',{focus:true}));
  hide.addEventListener('click',()=>setState('hidden',{focus:true}));
  // Performance links remain discoverable even if the floating launcher is fully hidden.
  // Capture-phase interception precedes the original high-mode scroll transition handler.
  document.addEventListener('click',event=>{
    const link=event.target.closest?.('a[href="#dashboard"]');
    if(!link)return;
    event.preventDefault();event.stopPropagation();
    document.querySelector('#siteNav')?.classList.remove('open');
    document.querySelector('#menuToggle')?.setAttribute('aria-expanded','false');
    setState('open',{focus:true});
  },true);
  // Support bookmarks / links that arrive with #dashboard.
  const fromHash=()=>{if(location.hash==='#dashboard')setState('open');};
  window.addEventListener('hashchange',fromHash);
  // Wait for browser hash processing so the fixed panel is ready to open.
  if(location.hash==='#dashboard')setState('open');
  panel.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();setState('minimized',{focus:true});}
  });
  new MutationObserver(syncLabels).observe(document.body,{attributes:true,attributeFilter:['data-mode']});
  syncLabels();
  setState(state);
})();
