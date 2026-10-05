(() => {
  const mark=document.querySelector('.wordmark');
  if(!mark)return;
  const prefix=mark.querySelector('.wordmark-prefix'),name=mark.querySelector('.wordmark-name');
  const dot=mark.querySelector('.wordmark-typed-dot'),track=mark.querySelector('.wordmark-track');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let cycle=0,steps=[];
  function reset(){
    steps.forEach(clearTimeout);steps=[];
    mark.classList.remove('is-typing','is-settling','is-point');
    prefix.textContent='';name.textContent='';dot.style.opacity='0';
  }
  function later(fn,delay){steps.push(setTimeout(fn,delay))}
  function play(){
    if(document.hidden||reduced.matches)return;
    reset();
    mark.style.setProperty('--wordmark-scale','1');
    prefix.textContent='made by ';name.textContent='tatarin';
    const header=mark.closest('.site-header').getBoundingClientRect();
    const actions=mark.parentElement.querySelector('.header-actions').getBoundingClientRect();
    const rect=mark.getBoundingClientRect();
    const right=actions.top<rect.bottom?actions.left-12:header.right-24;
    const scale=Math.min(1,Math.max(rect.width,right-rect.left)/track.getBoundingClientRect().width);
    mark.style.setProperty('--wordmark-scale',String(scale));
    mark.style.setProperty('--wordmark-shift',-prefix.getBoundingClientRect().width+'px');
    prefix.textContent='';name.textContent='';mark.classList.add('is-typing');
    let time=0;
    ['made','by','tatarin'].forEach((word,index)=>{
      const target=index<2?prefix:name;
      if(index)later(()=>{prefix.textContent+=' '},time);
      for(const letter of word){time+=260;later(()=>{target.textContent+=letter},time)}
      time+=400;
    });
    later(()=>{dot.style.opacity='1';mark.classList.add('is-point')},time);
    later(()=>{mark.classList.add('is-settling')},time+900);
    later(reset,time+1700);
  }
  function schedule(){
    clearTimeout(cycle);reset();
    if(document.hidden||reduced.matches)return;
    function tick(){play();cycle=setTimeout(tick,30000)}
    cycle=setTimeout(tick,30000);
  }
  document.addEventListener('visibilitychange',schedule);
  reduced.addEventListener('change',schedule);
  window.addEventListener('resize',reset);
  schedule();
  play();
})();

(() => {
  const root=document.getElementById('portfolio');
  const dialog=root.querySelector('.works-dialog'),close=root.querySelector('.close-button');
  const openers=Array.from(root.querySelectorAll('[data-open-menu]'));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const expanding=Array.from(root.querySelectorAll('.expand-button'));
  function measureLabels(){
    expanding.forEach(button=>{
      const label=button.querySelector('.button-label');
      button.style.setProperty('--expanded-width',Math.ceil(label.getBoundingClientRect().width+46)+'px');
    });
  }
  expanding.forEach(button=>button.addEventListener('click',event=>{
    if(button.getAttribute('aria-disabled')==='true')event.preventDefault();
  }));
  measureLabels();
  document.fonts?.ready.then(measureLabels);
  window.addEventListener('resize',measureLabels);
  const portraitBoard=root.querySelector('.scene'),header=root.querySelector('.site-header');
  setTimeout(()=>{root.dataset.contactPrompt='true'},30000);
  root.querySelectorAll('a[href="https://t.me/tatarin_web"]').forEach(link=>link.addEventListener('click',()=>{root.dataset.contactEngaged='true'}));
  function alignPortrait(){
    const sceneRect=portraitBoard.getBoundingClientRect(),headerRect=header.getBoundingClientRect();
    root.style.setProperty('--contact-prompt-top',(headerRect.bottom-sceneRect.top+8).toFixed(2)+'px');
    const top=headerRect.bottom-sceneRect.top+16+sceneRect.height*.015-sceneRect.height*1.1*(70/1402);
    const value=top.toFixed(2)+'px';
    if(portraitBoard.style.getPropertyValue('--portrait-top')!==value){
      portraitBoard.style.setProperty('--portrait-top',value);
      root.dispatchEvent(new CustomEvent('portfolio:placement'));
    }
  }
  alignPortrait();
  window.addEventListener('resize',alignPortrait);
  document.fonts?.ready.then(alignPortrait);
  if(typeof ResizeObserver!=='undefined'){
    const labelObserver=new ResizeObserver(measureLabels);
    expanding.forEach(button=>labelObserver.observe(button.querySelector('.button-label')));
    const placementObserver=new ResizeObserver(alignPortrait);
    placementObserver.observe(header);placementObserver.observe(portraitBoard);
  }
  let opener=null,closing=null;
  function open(button){
    if(closing){clearTimeout(closing);closing=null}
    opener=button;dialog.classList.remove('is-closing');
    if(!dialog.open)dialog.showModal();
    dialog.dataset.open='true';openers.forEach(b=>b.setAttribute('aria-expanded','true'));
    requestAnimationFrame(()=>dialog.classList.add('is-open'));close.focus();
    root.dispatchEvent(new CustomEvent('portfolio:menu'));
  }
  function dismiss(){
    if(!dialog.open||closing)return;
    dialog.classList.remove('is-open');dialog.classList.add('is-closing');
    closing=setTimeout(()=>{
      dialog.close();dialog.classList.remove('is-closing');dialog.dataset.open='false';closing=null;
      openers.forEach(b=>b.setAttribute('aria-expanded','false'));opener?.focus();
      root.dispatchEvent(new CustomEvent('portfolio:menu'));
    },reduced.matches?0:170);
  }
  openers.forEach(button=>button.addEventListener('click',()=>open(button)));
  close.addEventListener('click',dismiss);
  dialog.addEventListener('cancel',event=>{event.preventDefault();dismiss()});
  dialog.addEventListener('click',event=>{if(event.target===dialog)dismiss()});
  dialog.addEventListener('close',()=>{dialog.dataset.open='false';openers.forEach(b=>b.setAttribute('aria-expanded','false'));root.dispatchEvent(new CustomEvent('portfolio:menu'))});
})();

(() => {
 const root=document.getElementById('portfolio');
 if(!root) return;
 const board=root.querySelector('.scene'),output=root.querySelector('.portrait-canvas');
 const g=output.getContext('2d');
 if(!g){root.querySelector('[data-motion]').hidden=true;return;}
 const menu=root.querySelector('.works-dialog'),close=root.querySelector('.close-button');
 const motion=root.querySelector('[data-motion]');
 const openers=Array.from(root.querySelectorAll('[data-open-menu]'));
 const live=root.querySelector('.live-region');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const fine=matchMedia('(hover: hover) and (pointer: fine)');
 let raf=0,w=1,h=1,tree=null,textures=[],portrait=null,portraitTop=0;
 let seed=((Date.now()^Math.floor(Math.random()*4294967296))>>>0)||1;
 let splittingSince=0,lastTime=0,sceneTime=0,paused=false,onscreen=true;
 let target={x:0,y:0},current={x:0,y:0},drag=null,mask=null,maskPreset=null,lastMaskMode=-1;
 const TW=480,TH=600;
 const hex=v=>[parseInt(v.slice(1,3),16),parseInt(v.slice(3,5),16),parseInt(v.slice(5,7),16)];
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const shuffle=list=>{const a=list.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
 const createCanvas=(cw=TW,ch=TH)=>{const c=document.createElement('canvas');c.width=cw;c.height=ch;return c};
 const clamp=v=>Math.max(0,Math.min(1,v));
 const mix=(a,b,v)=>a.map((z,i)=>z+(b[i]-z)*v);
 const presets=[
  {mode:0,key:'duotone',variant:'A',contrast:1.35,bg:'#b6f24a',shadow:'#0c3a19',high:'#b6f24a'},
  {mode:1,key:'mosaic',variant:'A',contrast:1.73,bg:'#3a9a3f',shadow:'#0c2410',high:'#eaf7d8',block:13,grid:.89,gridW:.22,checker:0},
  {mode:1,key:'mosaic',variant:'B',contrast:1.73,bg:'#3a9a3f',shadow:'#0c2410',high:'#eaf7d8',block:31,grid:.68,gridW:.23,checker:.18},
  {mode:2,key:'halftone',variant:'A',contrast:1.2,bg:'#8ce63f',ink:'#0a1f0c',dot:15.5,angle:45},
  {mode:2,key:'halftone',variant:'B',contrast:1.2,bg:'#c86ee0',ink:'#0a1f0c',dot:31,angle:0},
  {mode:3,key:'dither',variant:'A',contrast:1.15,bg:'#8ce63f',ink:'#0a1f0c',pixel:2},
  {mode:3,key:'dither',variant:'B',contrast:1.99,bg:'#b5e86a',ink:'#0a1f0c',pixel:7},
  {mode:4,key:'chromatic',variant:'A',contrast:1.45,bg:'#6b4b9e',shadow:'#0d0a2e',high:'#c9b3f0',offset:9,angle:0},
  {mode:4,key:'chromatic',variant:'B',contrast:1.2,bg:'#1e1233',shadow:'#0d0a2e',high:'#ffffff',offset:10,angle:90},
  {mode:5,key:'ascii',variant:'A',contrast:1.06,bg:'#1f4a17',fill:'#d4ee9c',ink:'#173a10',cell:15,lighten:.1},
  {mode:5,key:'ascii',variant:'B',contrast:1.53,bg:'#1f4a17',fill:'#eef7d0',ink:'#000000',cell:9,lighten:.37},
  {mode:6,key:'edge',variant:'A',bg:'#3a9a3f',fill:'#000000',ink:'#3ee04a',strength:1,threshold:.05,thickness:1},
  {mode:6,key:'edge',variant:'B',bg:'#3c2168',fill:'#236630',ink:'#48ee56',strength:1.55,threshold:.27,thickness:.7},
  {mode:7,key:'invert',variant:'A',contrast:1.35,bg:'#16350f',levels:4,colors:['#2f7a3e','#050806','#8ea9df','#c3ee27']},
  {mode:7,key:'invert',variant:'B',contrast:1.82,bg:'#16350f',levels:3,colors:['#000000','#000000','#40efa8','#c3ee27']}
 ];
 const modePresets=Array.from({length:8},(_,m)=>presets.map((p,i)=>p.mode===m?i:-1).filter(i=>i>=0));
 const choosePreset=mode=>{const a=modePresets[mode];return a[Math.floor(random()*a.length)]};
 const bayer2=(x,y)=>{x=Math.floor(x);y=Math.floor(y);const v=x*.5+y*y*.75;return v-Math.floor(v)};
 const bayer4=(x,y)=>bayer2(x*.5,y*.5)*.25+bayer2(x,y);
 const bayer8=Array.from({length:8},(_,y)=>Array.from({length:8},(_,x)=>bayer4(x*.5,y*.5)*.25+bayer4(x,y)));
 const grainCanvas=createCanvas(128,128),grainCtx=grainCanvas.getContext('2d');
 for(let y=0;y<128;y+=2)for(let x=0;x<128;x+=2){
  const hash=Math.sin(x*127.1+y*311.7)*43758.5453,n=hash-Math.floor(hash);
  const alpha=Math.abs(n-.5)*.16;
  grainCtx.fillStyle=n>.5?'rgba(255,255,255,'+alpha+')':'rgba(0,0,0,'+alpha+')';grainCtx.fillRect(x,y,2,2);
 }
 let grainPattern=null;

 function buildTextures(){
  const source=createCanvas(),s=source.getContext('2d');
  s.drawImage(portrait,0,0,TW,TH);
  const src=s.getImageData(0,0,TW,TH).data,L=new Float32Array(TW*TH),A=new Float32Array(TW*TH);
  for(let i=0;i<L.length;i++){const p=i*4;A[i]=src[p+3]/255;L[i]=A[i]?(.299*src[p]+.587*src[p+1]+.114*src[p+2])/255:1}
  const at=(x,y)=>x<0||y<0||x>=TW||y>=TH?-1:Math.floor(y)*TW+Math.floor(x);
  const lum=(x,y)=>{const i=at(x,y);return i<0?1:L[i]};
  const cov=(x,y)=>{const i=at(x,y);return i<0?0:A[i]};
  const contrast=(v,k)=>clamp((v-.5)*k+.5);
  textures=presets.map(cfg=>{
   const tex=createCanvas(),t=tex.getContext('2d'),bg=hex(cfg.bg);
   t.fillStyle=cfg.bg;t.fillRect(0,0,TW,TH);
   if(cfg.mode===2){
    const cell=cfg.dot,angle=cfg.angle*Math.PI/180,cs=Math.cos(angle),sn=Math.sin(angle);
    t.fillStyle=cfg.ink;
    for(let gy=-TH;gy<TH*2;gy+=cell)for(let gx=-TW;gx<TW*2;gx+=cell){
     const x=TW/2+(gx-TW/2)*cs-(gy-TH/2)*sn,y=TH/2+(gx-TW/2)*sn+(gy-TH/2)*cs;
     const coverage=cov(x,y);if(coverage<.2)continue;
     const v=contrast(lum(x,y),cfg.contrast),radius=Math.sqrt(1-v)*cell*.56;
     if(radius>.1){t.beginPath();t.arc(x,y,radius,0,Math.PI*2);t.fill()}
    }
    return {canvas:tex};
   }
   if(cfg.mode===5){
    const cell=cfg.cell,chars='@#S*:. ';
    t.font='700 '+cell+'px ui-monospace,monospace';t.textBaseline='middle';t.textAlign='center';
    for(let y=0;y<TH;y+=cell)for(let x=0;x<TW;x+=cell){
     if(cov(x+cell/2,y+cell/2)<.45)continue;
     const v=clamp(contrast(lum(x+cell/2,y+cell/2),cfg.contrast)+cfg.lighten);
     t.fillStyle=cfg.fill;t.fillRect(x,y,cell,cell);t.fillStyle=cfg.ink;
     t.fillText(chars[Math.min(chars.length-1,Math.floor(v*chars.length))],x+cell/2,y+cell/2);
    }
    return {canvas:tex};
   }
   const image=t.createImageData(TW,TH),data=image.data;
   const shadow=cfg.shadow?hex(cfg.shadow):null,high=cfg.high?hex(cfg.high):null;
   const ink=cfg.ink?hex(cfg.ink):null,fill=cfg.fill?hex(cfg.fill):null;
   const ramp=cfg.colors?cfg.colors.map(hex):null;
   for(let y=0;y<TH;y++)for(let x=0;x<TW;x++){
    let coverage=cov(x,y),v=contrast(lum(x,y),cfg.contrast||1),color=bg;
    if(cfg.mode===0||cfg.mode===4)color=mix(shadow,high,v);
    else if(cfg.mode===1){
     const bx=Math.floor(x/cfg.block),by=Math.floor(y/cfg.block),cx=(bx+.5)*cfg.block,cy=(by+.5)*cfg.block;
     coverage=cov(cx,cy);v=contrast(lum(cx,cy),cfg.contrast);
     color=mix(shadow,high,v);
     const edge=x%cfg.block<cfg.block*cfg.gridW||y%cfg.block<cfg.block*cfg.gridW;
     if(edge)color=mix(color,shadow,cfg.grid);
     if((bx+by)%2)color=mix(color,shadow,cfg.checker);
    }else if(cfg.mode===3){
     const dx=Math.floor(x/cfg.pixel),dy=Math.floor(y/cfg.pixel);
     color=v<=bayer8[dy%8][dx%8]?ink:bg;
    }else if(cfg.mode===6){
     const d=cfg.thickness,tl=lum(x-d,y-d),tt=lum(x,y-d),tr=lum(x+d,y-d),lf=lum(x-d,y),rt=lum(x+d,y),bl=lum(x-d,y+d),bt=lum(x,y+d),br=lum(x+d,y+d);
     const gx=-tl-2*lf-bl+tr+2*rt+br,gy=tl+2*tt+tr-bl-2*bt-br;
     const q=clamp((Math.hypot(gx,gy)*cfg.strength-cfg.threshold)/.15);
     color=mix(fill,ink,q*q*(3-2*q));
    }else if(cfg.mode===7){
     const level=clamp(Math.floor(v*cfg.levels)/(cfg.levels-1))*3,lo=Math.min(2,Math.floor(level));
     color=mix(ramp[lo],ramp[lo+1],level-lo);
    }
    color=mix(bg,color,coverage);
    const p=(y*TW+x)*4;data[p]=color[0];data[p+1]=color[1];data[p+2]=color[2];data[p+3]=255;
   }
   t.putImageData(image,0,0);
   if(cfg.mode!==4)return {canvas:tex};
   const channels=[0,1,2].map(channel=>{
    const c=createCanvas(),cg=c.getContext('2d'),ci=cg.createImageData(TW,TH);
    for(let p=0;p<data.length;p+=4){ci.data[p+channel]=data[p+channel];ci.data[p+3]=255}
    cg.putImageData(ci,0,0);return c;
   });
   return {canvas:tex,channels,lastAngle:null,lastOffset:null};
  });
 }
 function textureAt(index){
  const cfg=presets[index],tex=textures[index];
  if(cfg.mode!==4)return tex.canvas;
  const angle=Math.atan2(current.y,current.x)+cfg.angle*Math.PI/180;
  const offset=cfg.offset/Math.min(devicePixelRatio||1,1.5)*TW/(h*1.1*TW/TH);
  if(tex.lastAngle!==null&&Math.abs(angle-tex.lastAngle)<.01&&Math.abs(offset-tex.lastOffset)<.02)return tex.canvas;
  const t=tex.canvas.getContext('2d'),dx=Math.cos(angle)*offset,dy=Math.sin(angle)*offset;
  t.clearRect(0,0,TW,TH);t.globalCompositeOperation='lighter';
  tex.channels.forEach((channel,i)=>t.drawImage(channel,(1-i)*dx,(1-i)*dy));
  t.globalCompositeOperation='source-over';tex.lastAngle=angle;tex.lastOffset=offset;return tex.canvas;
 }
 function makeTree(){
  let bag=[],previous=-1;
  const next=()=>{if(!bag.length){bag=shuffle([0,1,2,3,4,5,6,7]);if(bag[bag.length-1]===previous)[bag[0],bag[bag.length-1]]=[bag[bag.length-1],bag[0]]}previous=bag.pop();return choosePreset(previous)};
  const node={x:0,y:0,w:1,h:1,preset:0},leaves=[node];let index=0;
  const count=w<590?6:9+Math.floor(random()*6);
  while(leaves.length<count){
   leaves.sort((a,b)=>b.w*b.h-a.w*a.h);
   const n=leaves.shift(),axis=n.w*w>=n.h*h?'x':'y',ratio=[.5,.62,.42,.56,.47,.6][index%6];
   n.axis=axis;n.ratio=ratio;n.split=index++;n.phase=random()*Math.PI*2;
   const a={x:n.x,y:n.y,w:n.w,h:n.h,preset:0},b={...a};
   if(axis==='x'){a.w=n.w*ratio;b.x=n.x+a.w;b.w=n.w-a.w}else{a.h=n.h*ratio;b.y=n.y+a.h;b.h=n.h-a.h}
   n.children=[a,b];leaves.push(a,b);
  }
  const assign=n=>{if(!n.children){n.preset=next();return}n.children.forEach(assign);n.preset=n.children[0].preset};
  assign(node);tree=node;
 }
 function rectangles(node,rect,now,result){
  const reveal=!splittingSince||reduced.matches||now-splittingSince>450+node.split*70;
  if(!node.children||!reveal){result.push({...rect,preset:node.preset});return}
  const r=node.ratio+(!reduced.matches?.025*Math.sin(sceneTime*.4+node.phase):0);
  if(node.axis==='x'){
   rectangles(node.children[0],{x:rect.x,y:rect.y,w:rect.w*r,h:rect.h},now,result);
   rectangles(node.children[1],{x:rect.x+rect.w*r,y:rect.y,w:rect.w*(1-r),h:rect.h},now,result);
  }else{
   rectangles(node.children[0],{x:rect.x,y:rect.y,w:rect.w,h:rect.h*r},now,result);
   rectangles(node.children[1],{x:rect.x,y:rect.y+rect.h*r,w:rect.w,h:rect.h*(1-r)},now,result);
  }
 }
 function draw(now){
  if(!tree||!textures.length)return;
  const dpr=Math.min(devicePixelRatio||1,1.5);g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);
  const list=[];rectangles(tree,{x:0,y:0,w,h},now,list);
  const dx=reduced.matches?0:current.x*w*.015,dy=reduced.matches?0:current.y*h*.015;
  const artW=TW*(h/TH)*1.1,artH=h*1.1,artX=(w-artW)/2+dx,artY=portraitTop+dy;
  const paint=(rect,index)=>{g.save();g.beginPath();g.rect(rect.x,rect.y,rect.w+.6,rect.h+.6);g.clip();g.fillStyle=presets[index].bg;g.fillRect(0,0,w,h);g.drawImage(textureAt(index),artX,artY,artW,artH);g.restore()};
  list.forEach(r=>paint(r,r.preset));if(mask)paint({x:mask.x*w,y:mask.y*h,w:mask.w*w,h:mask.h*h},maskPreset);
  if(!grainPattern)grainPattern=g.createPattern(grainCanvas,'repeat');g.fillStyle=grainPattern;g.fillRect(0,0,w,h);
 }
 function syncMotion(){
  motion.textContent=paused?'Продолжить':'Пауза';motion.setAttribute('aria-pressed',String(paused));motion.disabled=reduced.matches;
  motion.setAttribute('aria-label',paused?'Продолжить движение сцены':'Приостановить движение сцены');
 }
 function tick(now){
  raf=0;if(document.hidden||!onscreen)return;
  const delta=lastTime?Math.min(40,now-lastTime):16;lastTime=now;
  const playing=!paused&&!reduced.matches&&menu.dataset.open!=='true';
  if(playing){sceneTime+=delta/1000;const ease=1-Math.exp(-delta/120);current.x+=(target.x-current.x)*ease;current.y+=(target.y-current.y)*ease}
  draw(now);if(splittingSince&&now-splittingSince>1450)splittingSince=0;
  if(playing)raf=requestAnimationFrame(tick);
 }
 function schedule(){if(!raf&&!document.hidden&&onscreen){lastTime=0;raf=requestAnimationFrame(tick)}}
 function resize(){
  const r=board.getBoundingClientRect(),nw=Math.max(1,r.width),nh=Math.max(1,r.height),changed=Math.abs(nw-w)>.5||Math.abs(nh-h)>.5;
  w=nw;h=nh;portraitTop=parseFloat(board.style.getPropertyValue('--portrait-top'))||0;const dpr=Math.min(devicePixelRatio||1,1.5);output.width=Math.round(w*dpr);output.height=Math.round(h*dpr);
  grainPattern=null;if(!tree||changed)makeTree();schedule();
 }
 root.addEventListener('portfolio:menu',schedule);
 root.addEventListener('portfolio:placement',()=>{portraitTop=parseFloat(board.style.getPropertyValue('--portrait-top'))||0;schedule()});
 function remixScene(announce=true){mask=null;maskPreset=null;makeTree();splittingSince=0;if(announce)live.textContent='Случайная композиция обновлена';schedule()}
 motion.addEventListener('click',()=>{if(reduced.matches)return;paused=!paused;if(paused)splittingSince=0;syncMotion();schedule()});
 let hintIdle=0;
 function holdHint(){clearTimeout(hintIdle);root.dataset.sceneInteracted='true'}
 function resumeHint(){holdHint();hintIdle=setTimeout(()=>{root.dataset.sceneInteracted='false'},10000)}
 board.addEventListener('pointermove',e=>{
  const r=board.getBoundingClientRect(),x=Math.min(w,Math.max(0,e.clientX-r.left)),y=Math.min(h,Math.max(0,e.clientY-r.top));
  if(fine.matches&&!reduced.matches&&!paused)target={x:(x/w-.5)*2,y:(y/h-.5)*2};
  if(drag&&e.pointerId===drag.id){
   if(Math.hypot(x-drag.x,y-drag.y)>4&&!drag.moved){
    drag.moved=true;
    holdHint();
    let mode;do mode=Math.floor(random()*8);while(mode===lastMaskMode);lastMaskMode=mode;maskPreset=choosePreset(mode);
   }
   if(drag.moved)mask={x:Math.min(x,drag.x)/w,y:Math.min(y,drag.y)/h,w:Math.abs(x-drag.x)/w,h:Math.abs(y-drag.y)/h};
  }
  schedule();
 });
 board.addEventListener('pointerleave',()=>{if(!drag){target={x:0,y:0};schedule()}});
 output.addEventListener('pointerdown',e=>{
  if(e.button!==0||e.isPrimary===false||drag)return;const r=board.getBoundingClientRect();drag={id:e.pointerId,x:e.clientX-r.left,y:e.clientY-r.top,moved:false};
  holdHint();
  output.setPointerCapture(e.pointerId);e.preventDefault();
 });
 output.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;resumeHint();if(!drag.moved)remixScene();else live.textContent='Маска со случайной обработкой создана';drag=null;schedule()});
 output.addEventListener('lostpointercapture',()=>{if(drag)resumeHint();drag=null;target={x:0,y:0};schedule()});
 output.addEventListener('pointercancel',()=>{if(drag)resumeHint();drag=null;target={x:0,y:0};schedule()});
 reduced.addEventListener('change',()=>{splittingSince=0;target={x:0,y:0};current={x:0,y:0};syncMotion();schedule()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;lastTime=0}else schedule()});
 new ResizeObserver(resize).observe(board);
 new IntersectionObserver(entries=>{onscreen=entries[0].isIntersecting;if(onscreen)schedule();else{if(raf)cancelAnimationFrame(raf);raf=0;lastTime=0}},{threshold:.05}).observe(board);
 const image=new Image();
 image.onload=()=>{
  portrait=image;buildTextures();resize();splittingSince=reduced.matches?0:performance.now();syncMotion();
  draw(performance.now());root.classList.add('effects-ready');
 };
 image.onerror=()=>{motion.hidden=true;output.hidden=true;root.querySelector('.scene-hint').hidden=true};
 image.src='./assets/portrait.webp';
})();
