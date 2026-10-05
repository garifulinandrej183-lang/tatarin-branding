(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const stage = document.querySelector('.stage');
  const introCopy = document.querySelector('.intro-copy');
  const collage = document.querySelector('#collage');
  const overlay = document.querySelector('#aperture');
  const hole = document.querySelector('#portal-hole');
  const erosion = document.querySelector('#portal-erosion');
  const flower = new window.BloomFlower(hole,erosion);
  const mask = document.querySelector('#portal');
  const title = document.querySelector('#hero-title');
  const toggle = document.querySelector('#motion-toggle');
  const planes = Array.from(document.querySelectorAll('.depth-plane')).sort((a,b)=>Number(a.getAttribute('data-plane'))-Number(b.getAttribute('data-plane')));
  const papers = planes.map(el=>({photo:el.querySelector('.plane-photo'),shade:el.querySelector('.plane-shade'),inner:el.querySelector('.feather-start'),edge:el.querySelector('.feather-edge')}));
  const lettering = document.querySelector('.stage-lettering');
  const arrivals = Array.from(document.querySelectorAll('.work-heading, .project'));
  const config = {
    camera: 5, fov: 50, travel: 70,
    desktop: { hero: 1, mosaic: 2.5, length: 3, spread: 1, outward: .1 },
    mobile: { hero: .8, mosaic: 1.8, length: 2.2, spread: .5, outward: .055 },
    slots: [
      { x:-4, y:-4.2, z:-18, size:.8, ratio:.8 },
      { x:-9, y:.8, z:-30, size:1.1, ratio:1.5 },
      { x:2.2, y:2, z:-45, size:1.8, ratio:.8 },
      { x:7, y:-1.6, z:-40, size:1.15, ratio:.8 },
      { x:-7, y:2.1, z:-55, size:1.8, ratio:1.33 },
      { x:0, y:-1.4, z:-65, size:3.6, ratio:1.5 },
      { x:-7.2, y:5.2, z:-27, size:1.15, ratio:.8 },
      { x:8.5, y:5, z:-35, size:1.25, ratio:.8 },
      { x:-5.5, y:-6, z:-42, size:1.7, ratio:.8 },
      { x:10, y:-5.8, z:-50, size:2.1, ratio:.8 },
      { x:.4, y:12, z:-57, size:2, ratio:.8 },
      { x:-13, y:3, z:-63, size:2.3, ratio:.8 }
    ]
  };
  const clamp = (x, min=0, max=1) => Math.min(max, Math.max(min, x));
  let width=0, height=0, mobile=false, settings=config.desktop;
  let opening={width:0,height:0,center:0};
  let frame=0, enabled=false, paused=false, hidden=document.hidden;
  let sceneScroll=0, metrics=[];
  const wave={position:0,velocity:0,time:0,scroll:0};
  const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
  function resetWave(scroll=window.scrollY) {wave.position=0;wave.velocity=0;wave.time=0;wave.scroll=scroll;}
  function updateWave(time,scroll,pastScene) {
    if(scroll<=1||pastScene){resetWave(scroll);return false;}
    if(paused){wave.time=0;return false;}
    const dt=wave.time?clamp((time-wave.time)/1000,0,.05):1/60;
    const delta=scroll-wave.scroll;wave.scroll=scroll;wave.time=time;
    wave.velocity=clamp(wave.velocity+clamp(delta/height,-.16,.16)*140,-30,30);
    // Closed-form damped spring: its response is independent of refresh rate.
    const damping=7,frequency=14,decay=Math.exp(-damping*dt),c=Math.cos(frequency*dt),s=Math.sin(frequency*dt);
    const a=wave.position,b=(wave.velocity+damping*a)/frequency;
    wave.position=clamp(decay*(a*c+b*s),-1.1,1.1);
    wave.velocity=decay*((b*frequency-damping*a)*c+(-a*frequency-damping*b)*s);
    if(Math.abs(wave.position)<.00015&&Math.abs(wave.velocity)<.002&&!delta){resetWave(scroll);return false;}
    return true;
  }
  const disposers=[];
  const listen=(el,name,handler,options) => {el.addEventListener(name,handler,options);disposers.push(()=>el.removeEventListener(name,handler,options));};
  let touchPointer=null;
  const portalSize=()=>opening;
  function movePointer(event) {
    if(!enabled||paused||hidden||window.scrollY>height*settings.hero*.35)return;
    if(event.pointerType!=='mouse'&&event.pointerId!==touchPointer)return;
    if(event.target?.closest('a,button,.site-header,#site-menu')){flower.release();requestFrame();return;}
    const p=portalSize(),h=clamp(sceneScroll/(height*settings.hero)),scale=portalScale(h,p);
    flower.move((event.clientX-width/2)/(p.width*scale),(event.clientY-p.center)/(p.height*scale));
    requestFrame();
  }
  function releasePointer() {touchPointer=null;flower.release();requestFrame();}
  function portalScale(h,p) {
    // The centre disk already covers the entire viewport at this scale.
    // Never hide the mask or grow it into an unnecessarily huge surface.
    const cover=Math.hypot(width/2/p.width,Math.max(p.center,height-p.center)/p.height)/.20;
    const growth=1/(1-Math.min(.98,h));
    return 1+(cover-1)*Math.tanh((growth-1)/(cover-1));
  }

  // The complete heading stays available to assistive technology.
  const originalTitle=title.innerHTML;
  function buildCharacters() {
    const lines=title.getAttribute('data-lines').split('|');
    title.setAttribute('aria-label',lines.join(' '));
    title.replaceChildren();
    let index=0;
    lines.forEach((line,lineIndex) => {
      for (const char of line) {
        const span=document.createElement('span');
        span.className='hero-char';
        span.setAttribute('aria-hidden','true');
        span.style.setProperty('--char-delay',`${(index*97+43)%301}ms`);
        span.textContent=char===' '?'\u00a0':char;
        title.append(span);index++;
      }
      if(lineIndex<lines.length-1)title.append(document.createElement('br'));
    });
  }

  function measure() {
    const newWidth=document.documentElement.clientWidth;
    const newHeight=window.innerHeight;
    // Browser chrome changing by a few pixels must not stretch the scene during a swipe.
    const keepHeight=width===newWidth && Math.abs(newHeight-height)<Math.max(40,height*.14) && height;
    width=newWidth;if(!keepHeight)height=newHeight;
    mobile=width<768;
    settings=mobile?config.mobile:config.desktop;
    root.style.setProperty('--scene-h',`${height}px`);
    root.style.setProperty('--scene-length',`${enabled?settings.length*height:height}px`);
    opening={
      width:mobile?width*.92:Math.min(width*.52,height*.95),
      height:height*(mobile?(height<680?.34:.50):.80),center:height*.46
    };
    if(mobile){
      // Measure the copy in stage coordinates so scrolling never moves this boundary.
      const top=16,bottom=Math.max(top+1,introCopy.offsetTop-24);
      const fit=Math.min(1,(bottom-top)/(opening.height*.95));
      opening.width*=fit;opening.height*=fit;
      opening.center=clamp(height*(height<680?.20:.25),top+opening.height*.50,bottom-opening.height*.45);
    }
    root.style.setProperty('--flower-center',`${portalSize().center}px`);
    overlay.setAttribute('viewBox',`0 0 ${width} ${height}`);
    mask.setAttribute('width',width+2);mask.setAttribute('height',height+2);
    for(const el of overlay.querySelectorAll('.mask-field,.white-field,.scene-field')) {
      el.setAttribute('width',width+2);el.setAttribute('height',height+2);
    }
    metrics=arrivals.map(el=>({el,top:el.getBoundingClientRect().top+window.scrollY,height:el.offsetHeight}));
    lettering.setAttribute('x',width/2);lettering.setAttribute('y',mobile?opening.center+opening.height*.30:height*.53);
    lettering.setAttribute('font-size',width*.27);
    if(enabled)requestFrame();else paintScene(0,0);
  }

  function paintScene(h,m) {
    const p=portalSize(),scale=portalScale(h,p);
    const transform=`translate(${width/2} ${p.center}) scale(${p.width*scale} ${p.height*scale})`;
    hole.setAttribute('transform',transform);erosion.setAttribute('transform',transform);
    hole.setAttribute('filter',h<.35?'url(#portal-soft)':'none');
    overlay.style.visibility='visible';
    const commonAlpha=clamp(2*(1-m));collage.style.opacity=String(commonAlpha);
    const focal=height/(2*Math.tan(config.fov*Math.PI/360)),travel=config.travel*m;
    for(let i=0;i<planes.length;i++) {
      const s=config.slots[i],el=planes[i],paper=papers[i],initialDistance=config.camera-s.z,distance=Math.max(.45,initialDistance-travel);
      const px=s.x*settings.spread+(s.x>0?1:-1)*travel*settings.outward;
      const py=s.y*settings.spread+(s.y>0?1:-1)*travel*settings.outward;
      const x=width/2+px*focal/distance,y=p.center-py*focal/distance;
      const w=Math.min(width*8,width*s.size*config.camera/distance),hh=w/s.ratio;
      // Keep stable numeric geometry even while culled. No fallback transforms can reappear.
      for(const surface of [paper.photo,paper.shade]) {
        surface.setAttribute('x',(x-w/2).toFixed(3));surface.setAttribute('y',(y-hh/2).toFixed(3));
        surface.setAttribute('width',w.toFixed(3));surface.setAttribute('height',hh.toFixed(3));
      }
      const approach=clamp(travel/(initialDistance-2)),tone=smooth((approach-.18)/.64),dissolve=smooth((approach-.30)/.65);
      paper.shade.setAttribute('opacity',(tone*.70).toFixed(5));
      paper.inner.setAttribute('offset',`${(100-dissolve*38).toFixed(3)}%`);
      paper.edge.setAttribute('stop-opacity',(1-dissolve).toFixed(5));
      el.style.opacity=String(1-smooth((approach-.45)/.50));
      const sway=clamp(wave.position*Math.cos(i*1.31)+wave.velocity/14*Math.sin(i*1.31)*.22,-1.1,1.1);
      const roll=clamp(sway*(mobile?2.7:3.5),-4,4),tilt=sway*1.1;
      const dx=sway*(mobile?5:11),dy=wave.position*3*Math.sin(i*1.7);
      el.setAttribute('transform',sway||wave.position?`translate(${dx.toFixed(3)} ${dy.toFixed(3)}) rotate(${roll.toFixed(3)} ${x.toFixed(3)} ${y.toFixed(3)}) translate(${x.toFixed(3)} ${y.toFixed(3)}) skewX(${tilt.toFixed(3)}) translate(${(-x).toFixed(3)} ${(-y).toFixed(3)})`:'');
      const margin=Math.max(w,hh)*.07+16;
      const culled=(mobile&&(i===1||i===4))||initialDistance-travel<=1.2||commonAlpha===0||x+w/2+margin<0||x-w/2-margin>width||y+hh/2+margin<0||y-hh/2-margin>height;
      el.style.visibility=culled?'hidden':'visible';
    }
    return {p,scale};
  }

  function requestFrame() {if(enabled&&!hidden&&!frame)frame=requestAnimationFrame(render);}
  function render(time) {
    frame=0;
    if(!enabled||hidden)return;
    const scroll=Math.max(0,window.scrollY);
    // A single scroll position controls every decorative layer in either direction.
    // Pause holds that position, but returning to the top always restores the opening.
    if(!paused||scroll<=1)sceneScroll=scroll<=1?0:scroll;
    const h=clamp(sceneScroll/(height*settings.hero));
    const m=clamp(sceneScroll/(height*settings.mosaic));
    const pastScene=scroll>height*settings.length;
    stage.classList.toggle('stage-out',pastScene);
    // Native scroll remains available when animation is paused.
    const headerProgress=pastScene?0:clamp((h-.4)/.2);
    root.style.setProperty('--header-r',String(Math.round(23+232*headerProgress)));
    root.style.setProperty('--header-g',String(Math.round(66+189*headerProgress)));
    root.style.setProperty('--header-b',String(Math.round(56+199*headerProgress)));
    root.style.setProperty('--header-q',String(headerProgress));
    stage.classList.toggle('text-away',sceneScroll>1);
    const waveActive=updateWave(time,sceneScroll,pastScene);
    const {p,scale}=paintScene(h,m);
    for(const metric of metrics) {
      const progress=clamp((scroll-(metric.top-height))/(metric.height+height));
      metric.el.style.setProperty('--arrival',String(clamp(progress/.25)));
    }
    const hintOpacity=1-clamp(h*4);
    document.querySelector('.scroll-hint').style.opacity=String(hintOpacity);
    const flowerActive=flower.render(time,paused,mobile,{width:p.width*scale,height:p.height*scale});
    if(!pastScene&&(waveActive||(flowerActive&&h<.96)))requestFrame();
  }

  function setMotion() {
    const shouldEnable=!reduced.matches;
    if(shouldEnable===enabled){measure();return;}
    enabled=shouldEnable;
    resetWave();
    document.body.classList.toggle('motion-ready',enabled);
    if(enabled){buildCharacters();arrivals.forEach(el=>el.classList.add('gallery-arrival'));toggle.hidden=false;}
    else {
      cancelAnimationFrame(frame);frame=0;paused=false;sceneScroll=0;flower.reset();touchPointer=null;
      toggle.setAttribute('aria-pressed','false');
      toggle.setAttribute('aria-label','Пауза');
      toggle.querySelector('span').textContent='Пауза';
      toggle.querySelector('path').setAttribute('d','M6 4h2v12H6zm6 0h2v12h-2z');
      title.innerHTML=originalTitle;title.removeAttribute('aria-label');
      toggle.hidden=true;stage.classList.remove('text-away','stage-out');
      root.style.setProperty('--header-r','23');root.style.setProperty('--header-g','66');root.style.setProperty('--header-b','56');root.style.setProperty('--header-q','0');
      root.style.setProperty('--scene-length','100svh');root.style.setProperty('--scene-h','100svh');
      overlay.style.visibility='visible';collage.style.opacity='1';
      arrivals.forEach(el=>{el.classList.remove('gallery-arrival');el.style.removeProperty('--arrival');});
      for(const el of planes){el.removeAttribute('style');}
      document.body.classList.remove('motion-paused');
    }
    measure();
    if(!enabled)root.style.setProperty('--scene-length',`${height}px`);
  }

  // Hover state must never leak into the reversible scroll scene.
  listen(window,'scroll',()=>{if(!paused||window.scrollY<=1)flower.reset();requestFrame();},{passive:true});
  listen(window,'resize',()=>{flower.reset();resetWave();measure();},{passive:true});
  listen(window,'pointermove',movePointer,{passive:true});
  listen(window,'bloom:menu',releasePointer);
  listen(window,'pointerdown',event=>{if(event.isPrimary&&event.pointerType!=='mouse'){touchPointer=event.pointerId;movePointer(event);}},{passive:true});
  listen(window,'pointerup',event=>{if(event.pointerId===touchPointer)releasePointer();},{passive:true});
  listen(window,'pointercancel',releasePointer,{passive:true});
  listen(document,'pointerleave',releasePointer,{passive:true});
  listen(window,'blur',releasePointer);
  listen(document,'visibilitychange',()=>{hidden=document.hidden;flower.reset();resetWave();if(hidden){cancelAnimationFrame(frame);frame=0;}else{requestFrame();}});
  listen(toggle,'click',()=>{
    paused=!paused;toggle.setAttribute('aria-pressed',String(paused));
    toggle.setAttribute('aria-label',paused?'Продолжить анимацию':'Пауза');
    toggle.querySelector('span').textContent=paused?'Продолжить':'Пауза';
    toggle.querySelector('path').setAttribute('d',paused?'M6 3l10 7-10 7z':'M6 4h2v12H6zm6 0h2v12h-2z');
    if(!paused){flower.reset();resetWave();}
    document.body.classList.toggle('motion-paused',paused);requestFrame();
    window.dispatchEvent(new CustomEvent('bloom:motion',{detail:{paused}}));
  });
  listen(reduced,'change',setMotion);
  listen(window,'pagehide',()=>{cancelAnimationFrame(frame);frame=0;});
  listen(window,'pageshow',()=>{flower.reset();resetWave();measure();});
  for(const img of document.images)listen(img,'error',()=>{img.style.visibility='hidden';},{once:true});
  // SVG masking and ordinary DOM images require no WebGL context.
  try {setMotion();} catch(error) {
    enabled=false;cancelAnimationFrame(frame);frame=0;
    document.body.classList.remove('motion-ready');root.style.setProperty('--scene-length','100svh');
    title.innerHTML=originalTitle;toggle.hidden=true;
    console.warn('Decorative motion is unavailable; the flower catalogue remains accessible.',error);
  }
  if('ResizeObserver' in window) {
    const observer=new ResizeObserver(()=>{if(document.documentElement.clientWidth!==width)measure();});
    observer.observe(document.documentElement);disposers.push(()=>observer.disconnect());
  }
  if(document.fonts)document.fonts.ready.then(measure);
})();
