window.SypherDetector = (() => {
  function webgl() { try {const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'));}catch{return false;} }
  // Integer score bands for Auto mode: Basic 0-70, Medium 71-80, High 81-100.
  function classifyScore(score) { return score >= 81 ? 'high' : score >= 71 ? 'medium' : 'basic'; }
  function detect(){
    const threads=Number(navigator.hardwareConcurrency)||null;
    const memory=Number(navigator.deviceMemory)||null;
    const width=screen.width,height=screen.height;
    const gpu=webgl();
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData=!!navigator.connection?.saveData;
    // Missing values get neutral points; screen size is a weak proxy, not a hardware benchmark.
    const cpuScore=threads===null?17:threads>=12?35:threads>=8?28:threads>=4?19:8;
    const memoryScore=memory===null?15:memory>=8?30:memory>=4?22:memory>=2?12:5;
    const gpuScore=gpu?20:0;
    const screenScore=Math.max(width,height)>=1600?15:Math.max(width,height)>=1000?10:7;
    const score=Math.min(100,Math.max(0,cpuScore+memoryScore+gpuScore+screenScore-(saveData?20:0)));
    const auto=classifyScore(score);
    return {threads,memory,width,height,gpu,reduced,saveData,score,auto};
  }
  return {detect,classifyScore};
})();
