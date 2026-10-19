window.SypherAdaptive = (() => {
  const labels={high:'Full visual effects enabled.',medium:'Optimized animations and lightweight visuals enabled.',basic:'Visual effects reduced for better performance.'};
  function apply(mode,info){
    document.body.dataset.mode=mode;
    document.body.classList.toggle('reduce-motion',info.reduced);
    document.querySelector('#modeTitle').textContent=`${mode.toUpperCase()} PERFORMANCE MODE`;
    document.querySelector('#modeDescription').textContent=labels[mode];
    document.querySelector('#modeBadge').textContent=mode.toUpperCase();
    document.querySelector('#modeNote').textContent=info.reduced?'Reduced-motion preference detected: motion stays disabled in every mode.':'Browser hardware estimates may be missing or imprecise. Manual selection is available.';
  }
  return {apply};
})();
