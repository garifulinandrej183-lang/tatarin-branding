(() => {
  'use strict';
  const mark=document.querySelector('.brand');
  const header=document.querySelector('.site-header'),track=mark.querySelector('.brand-track');
  const text=mark.querySelector('.brand-text'),dot=mark.querySelector('.brand-dot');
  const measures=Array.from(mark.querySelectorAll('.brand-measure'));
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=window.matchMedia('(max-width: 767px)');
  const sequence=[];
  let phrase='';
  const step=(value,delay=80,point=false)=>sequence.push({value,delay,point});
  step('',250);
  for(const letter of 'Нужны цветы?'){phrase+=letter;step(phrase,85);}
  step(phrase,1150);
  while(phrase.length){phrase=phrase.slice(0,-1);step(phrase,42);}
  step('',250);
  for(const letter of 'bloom boutique'){phrase+=letter;step(phrase,85);}
  step(phrase,1050);
  while(phrase!=='bloom'){phrase=phrase.slice(0,-1);step(phrase,48);}
  step('bloom',380);
  step('bloom',0,true);
  let timer=0,cycleTimer=0,index=0,paused=false,remaining=0,due=0,done=false,joining=false;
  let cycleRemaining=20000,cycleDue=0;
  function fit() {
    const style=window.getComputedStyle(mark);
    const inset=(parseFloat(style.paddingLeft)||0)+(parseFloat(style.paddingRight)||0);
    const available=Math.max(1,mark.clientWidth-inset-4);
    // Layout widths do not include the track's scale or the point's accent animation.
    const full=done?track.scrollWidth:Math.max(...measures.map(el=>el.scrollWidth))+6;
    mark.style.setProperty('--brand-scale',String(Math.min(1,available/Math.max(1,full))));
  }
  function settle() {
    clearTimeout(timer);timer=0;done=true;joining=false;index=sequence.length;
    clearTimeout(cycleTimer);cycleTimer=0;
    text.textContent='bloom';dot.style.opacity='1';mark.classList.remove('is-typing','is-point');header.classList.add('brand-resting');fit();
  }
  function tick() {
    timer=0;if(done||paused||document.hidden)return;
    if(joining){joining=false;mark.classList.add('is-typing');}
    const current=sequence[index++];
    if(!current)return;
    text.textContent=current.value;dot.style.opacity=current.point?'1':'0';
    if(current.point){done=true;mark.classList.remove('is-typing');mark.classList.add('is-point');header.classList.add('brand-resting');fit();return;}
    schedule(current.delay);
  }
  function schedule(delay) {
    remaining=delay;due=performance.now()+delay;
    if(!paused&&!document.hidden)timer=window.setTimeout(tick,delay);
  }
  function start() {
    clearTimeout(timer);timer=0;
    clearTimeout(cycleTimer);cycleTimer=0;
    if(reduced.matches||document.hidden){settle();return;}
    if(paused)return;
    scheduleCycle(20000);
    joining=mobile.matches&&header.classList.contains('brand-resting');
    done=false;index=0;header.classList.remove('brand-resting');mark.classList.remove('is-point');
    if(joining){
      // Keep bloom visible while its window joins the menu, then start typing.
      mark.classList.remove('is-typing');text.textContent='bloom';dot.style.opacity='1';fit();schedule(560);
    }else{
      mark.classList.add('is-typing');dot.style.opacity='0';text.textContent='';fit();tick();
    }
  }
  function scheduleCycle(delay) {
    cycleRemaining=delay;cycleDue=performance.now()+delay;
    if(!paused&&!document.hidden&&!reduced.matches)cycleTimer=window.setTimeout(start,delay);
  }
  window.addEventListener('bloom:motion',event=>{
    paused=event.detail.paused;
    if(paused){
      remaining=Math.max(0,due-performance.now());cycleRemaining=Math.max(0,cycleDue-performance.now());
      clearTimeout(timer);timer=0;clearTimeout(cycleTimer);cycleTimer=0;
    }else if(!document.hidden&&!reduced.matches){
      if(!done)schedule(remaining);
      scheduleCycle(cycleRemaining);
    }
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)settle();else scheduleCycle(20000);});
  window.addEventListener('pagehide',settle);
  window.addEventListener('pageshow',()=>{if(!cycleTimer)scheduleCycle(20000);});
  window.addEventListener('resize',fit,{passive:true});
  reduced.addEventListener('change',()=>{if(reduced.matches)settle();else scheduleCycle(20000);});
  if('ResizeObserver' in window){const observer=new ResizeObserver(fit);observer.observe(mark);}
  if(document.fonts)document.fonts.ready.then(fit);
  start();
})();
