const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../dist/motion.js'),'utf8');
const flowerSource=fs.readFileSync(path.join(__dirname,'../dist/flower.js'),'utf8');
function run(width,height,reduce=false,hz=60,copyHeight=height<680?212:250){
 const handlers=new Map(),queue=new Map();let clock=0,next=0;
 class Element{
  constructor(name){this.name=name;this.attrs={};this.props={};this.children=[];this.style={setProperty:(k,v)=>this.props[k]=v,removeProperty:k=>delete this.props[k]};this.classes=new Set();this.classList={add:x=>this.classes.add(x),remove:(...xs)=>xs.forEach(x=>this.classes.delete(x)),toggle:(x,on)=>on?this.classes.add(x):this.classes.delete(x)};this.offsetHeight=500;this.innerHTML='Original';}
  addEventListener(n,fn){handlers.set(this.name+':'+n,fn)} removeEventListener(){} setAttribute(k,v){this.attrs[k]=v} getAttribute(k){return this.attrs[k]} removeAttribute(k){if(k==='style'){this.style.visibility='';this.style.transform='';}delete this.attrs[k]} replaceChildren(){this.children=[]} append(x){this.children.push(x)} getBoundingClientRect(){return{top:height*3+100-window.scrollY}} querySelectorAll(){return[rect1,rect2]} querySelector(q){return this.parts?.[q]||(q==='span'?label:path)}
 }
 const root=new Element('root'),body=new Element('body'),stage=new Element('stage'),copy=new Element('copy'),collage=new Element('collage'),overlay=new Element('aperture'),hole=new Element('hole'),erosion=new Element('erosion'),mask=new Element('mask'),title=new Element('title'),toggle=new Element('toggle'),hint=new Element('hint'),lettering=new Element('lettering'),label=new Element('label'),path=new Element('path'),rect1=new Element('rect1'),rect2=new Element('rect2');
 Object.defineProperty(copy,'offsetTop',{get:()=>parseFloat(root.props['--scene-h'])-174-copyHeight});
 const planes=Array.from({length:12},(_,i)=>{const p=new Element('plane'+i);p.attrs['data-plane']=String(i);p.parts={'.plane-photo':new Element('photo'+i),'.plane-shade':new Element('shade'+i),'.feather-start':new Element('inner'+i),'.feather-edge':new Element('edge'+i)};return p;}),arrivals=Array.from({length:3},(_,i)=>new Element('arrival'+i));
 title.attrs['data-lines']='Цветы, которые|говорят за вас.';const mq=new Element('mq');mq.matches=reduce;
 const window={innerHeight:height,scrollY:0,matchMedia:()=>mq,addEventListener:(n,fn)=>handlers.set('window:'+n,fn),removeEventListener(){},dispatchEvent(){}};
 const map={'.stage':stage,'.intro-copy':copy,'#collage':collage,'#aperture':overlay,'#portal-hole':hole,'#portal-erosion':erosion,'#portal':mask,'#hero-title':title,'#motion-toggle':toggle,'.scroll-hint':hint,'.stage-lettering':lettering};
 const document={documentElement:root,body,hidden:false,images:[],querySelector:q=>map[q],querySelectorAll:q=>q==='.depth-plane'?planes:arrivals,createElement:q=>new Element(q),addEventListener:(n,fn)=>handlers.set('document:'+n,fn),removeEventListener(){}};root.clientWidth=width;
 const context={window,document,console,CustomEvent:class{constructor(type,args){this.type=type;this.detail=args.detail;}},requestAnimationFrame:fn=>{queue.set(++next,fn);return next},cancelAnimationFrame:id=>queue.delete(id),ResizeObserver:class{observe(){}disconnect(){}}};
 vm.createContext(context);vm.runInContext(flowerSource,context);vm.runInContext(source,context);
 const frames=(n=Math.ceil(hz*2))=>{for(let i=0;i<n&&queue.size;i++){clock+=1000/hz;const batch=[...queue.entries()];queue.clear();for(const [id,fn]of batch)fn(clock)}};
 const scroll=(y,n=Math.ceil(hz*2))=>{window.scrollY=y;handlers.get('window:scroll')();frames(n)};
 const snapshot=(includeWave=true)=>JSON.stringify({hole:hole.attrs.transform,shape:hole.attrs.d,erosion:erosion.attrs.opacity,overlay:overlay.style.visibility,collage:collage.style.opacity,planes:planes.map(p=>({geometry:[p.parts['.plane-photo'].attrs.x,p.parts['.plane-photo'].attrs.y,p.parts['.plane-photo'].attrs.width,p.parts['.plane-photo'].attrs.height],shade:p.parts['.plane-shade'].attrs.opacity,feather:[p.parts['.feather-start'].attrs.offset,p.parts['.feather-edge'].attrs['stop-opacity']],transform:includeWave?p.attrs.transform:undefined,visibility:p.style.visibility,opacity:p.style.opacity})),header:root.props['--header-q'],textAway:stage.classes.has('text-away'),stageOut:stage.classes.has('stage-out'),hint:hint.style.opacity});
 frames();
 assert.equal(body.classes.has('motion-ready'),!reduce);
 const [cx,cy,pw,ph]=hole.attrs.transform.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/g).map(Number);
 if(width<768){
   const coordinates=hole.attrs.d.match(/-?\d+\.\d+/g).map(Number),ys=coordinates.filter((_,i)=>i%2);
   const bottom=cy+Math.max(...ys)*ph,top=cy+Math.min(...ys)*ph;
   assert.ok(top>=15,'The raised flower must remain inside the screen');
   assert.ok(bottom<=copy.offsetTop-24,'The actual flower contour must stay above every hero label');
   assert.ok(cy<height*(height<680?.29:.38),'The mobile opening must be higher than before');
 }else{
   assert.equal(cy,height*.46,'Desktop position must stay unchanged');assert.equal(ph,height*.8);
 }
 if(reduce){assert.match(hole.attrs.transform,/translate\(/);assert.equal(root.props['--scene-length'],`${height}px`);return{width,reduce,pass:true};}
 const initial=snapshot();
 const pointer={pointerType:'mouse',pointerId:1,isPrimary:true,clientX:width/2,clientY:cy-ph*.37};
 handlers.get('window:pointermove')(pointer);frames();assert.notEqual(hole.attrs.d,JSON.parse(initial).shape,'Hover must detach the nearby petal');assert.ok(Number(erosion.attrs.opacity)>0,'Hover must reveal the grain texture');
 handlers.get('document:pointerleave')();frames(240);assert.equal(snapshot(),initial,'Pointer leave must reassemble the complete flower');
 handlers.get('window:pointermove')(pointer);frames(10);scroll(height*.5,1);scroll(0,1);assert.equal(snapshot(),initial,'Scroll must clear hover history before returning to top');
 handlers.get('window:pointerdown')({...pointer,pointerType:'touch',pointerId:7});frames(10);assert.ok(Number(erosion.attrs.opacity)>0,'Touch must interact without requiring hover');handlers.get('window:pointercancel')();frames(240);assert.equal(snapshot(),initial,'Cancelled touch must restore the flower');
 handlers.get('window:pointermove')({...pointer,target:{closest:()=>true}});frames();assert.equal(snapshot(),initial,'Menu controls must not disturb the flower');
 handlers.get('window:pointermove')(pointer);frames();handlers.get('window:bloom:menu')();frames(240);assert.equal(snapshot(),initial,'Opening the menu from the keyboard must release flower interaction');
 // Fast reversal must restore the complete first screen in one render.
 scroll(height*2.1,2);scroll(0,1);
 assert.equal(snapshot(),initial,'Fast return must restore the exact initial scene');
 // The same scroll offset must not depend on direction or previous frames.
 scroll(height*.55,1);const midpoint=snapshot(false);
 scroll(height*2.1,2);scroll(height*.55,1);
 assert.equal(snapshot(false),midpoint,'Reverse scene must match the forward scene at the same offset');
 for(const y of [0,.25*height,.5*height,.9*height,1.4*height,2.1*height,2.7*height,3.2*height,height*.5,0]){
  scroll(y);assert.ok(!/NaN|Infinity/.test(hole.attrs.transform));for(const p of planes)assert.ok([p.parts['.plane-photo'].attrs.x,p.parts['.plane-photo'].attrs.y,p.parts['.plane-photo'].attrs.width,p.parts['.plane-photo'].attrs.height].every(v=>Number.isFinite(Number(v))));
 }
 assert.equal(stage.classes.has('text-away'),false);
 // The aperture remains in place throughout closing: there is no unmasked photo stack.
 const forward=[];
 for(let i=0;i<=150;i++){scroll(i*height*.01,1);assert.equal(overlay.style.visibility,'visible');forward.push(snapshot(false));}
 for(let i=150;i>=0;i--){scroll(i*height*.01,1);assert.equal(snapshot(false),forward[i],'Every reverse frame must match its forward offset');}

 // Scroll supplies a temporary flutter; the base projection remains reversible.
 scroll(0,1);scroll(height*.2,1);const kicked=planes.map(p=>p.attrs.transform);
 assert.ok(kicked.some(value=>value.includes('rotate(')),'Scroll must tilt the photos');
 frames(5);assert.notDeepEqual(planes.map(p=>p.attrs.transform),kicked,'Flutter must move after the wheel stops');
 frames(240);assert.ok(planes.every(p=>p.attrs.transform===''),'Flutter must settle completely');assert.equal(queue.size,0,'There must be no idle wave loop');
 const settled=snapshot();scroll(height*.8);scroll(height*.2);assert.equal(snapshot(),settled,'A settled offset must not accumulate drift');
 scroll(0,1);assert.equal(snapshot(),initial,'Fast top return must also clear flutter');
 let lastShade=0,lastOpacity=1,lastEdge=1;
 for(let i=0;i<=22;i++){scroll(i*height*2.5/70,1);const shade=Number(planes[0].parts['.plane-shade'].attrs.opacity),opacity=Number(planes[0].style.opacity),edge=Number(planes[0].parts['.feather-edge'].attrs['stop-opacity']);assert.ok(shade>=lastShade&&opacity<=lastOpacity&&edge<=lastEdge,'Approaching the camera must darken, fade and soften edges monotonically');lastShade=shade;lastOpacity=opacity;lastEdge=edge;}
 assert.ok(lastShade>.65&&lastOpacity<.01&&lastEdge<.01,'Close photos must dissolve into the green background');
 scroll(height*.45);const before=hole.attrs.transform;handlers.get('toggle:click')();scroll(height*.9);assert.equal(hole.attrs.transform,before);assert.equal(toggle.attrs['aria-pressed'],'true');handlers.get('toggle:click')();frames();assert.notEqual(hole.attrs.transform,before);
 scroll(height*1.15);handlers.get('toggle:click')();const frozen=hole.attrs.transform;scroll(height*4,1);
 assert.equal(hole.attrs.transform,frozen,'Pause must hold the decorative scene');
 for(const el of arrivals)assert.equal(el.props['--arrival'],'1','Catalogue content must reveal during pause');
 scroll(0,1);
 assert.equal(snapshot(),initial,'Returning to the top must restore the first screen even while paused');
 handlers.get('toggle:click')();frames();
 scroll(height*.45,1);
 mq.matches=true;handlers.get('mq:change')();assert.equal(body.classes.has('motion-ready'),false);assert.equal(root.props['--scene-length'],`${height}px`);
 mq.matches=false;handlers.get('mq:change')();frames();assert.equal(body.classes.has('motion-ready'),true);
 assert.equal(stage.classes.has('text-away'),window.scrollY>1,'Re-enabling motion must apply the current heading state');
 document.hidden=true;handlers.get('document:visibilitychange')();assert.equal(queue.size,0);scroll(0,1);document.hidden=false;handlers.get('document:visibilitychange')();frames(1);assert.equal(snapshot(),initial,'Visibility restoration must read the latest scroll');
 handlers.get('window:pagehide')();scroll(height*2,1);scroll(0,0);handlers.get('window:pageshow')();frames(1);assert.equal(snapshot(),initial,'Page restoration must reset the opening');
 root.clientWidth=width<768?1280:390;window.innerHeight=width<768?800:844;handlers.get('window:resize')();frames(1);const resized=snapshot();
 scroll(window.innerHeight*2,1);scroll(0,1);assert.equal(snapshot(),resized,'Return to top after breakpoint resize must be exact');
 return{width,height,hz,pass:true};
}
for(const [w,h]of [[320,568],[375,667],[375,812],[390,844],[430,932],[768,1024],[1024,768],[1280,800],[1440,900]])console.log(JSON.stringify(run(w,h)));
for(const hz of[120,144])console.log(JSON.stringify(run(1440,900,false,hz)));
console.log(JSON.stringify(run(390,844,true)));
console.log(JSON.stringify(run(390,844,false,60,340)));
