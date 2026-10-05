import { beginRingDrag, chooseFieldGlyph, clamp, createLayout, distance, Gesture, GLYPHS, glyphNoise, PALETTE, pigmentAt, resizeRing, seededRandom, validLayout, VIEW_HEIGHT, VIEW_WIDTH, type Layout, type RingDrag, type Vec } from "./motion-math";
import { CanvasRenderer, GLRenderer, type SceneRenderer } from "./motion-renderer";
import { createSignatureTargets, nearSignaturePoint, SIGNATURE_GATHER, SIGNATURE_PULSE, SIGNATURE_SCATTER, SignatureSchedule, type SignaturePhase, type SignatureTargets } from "./motion-signature";

type Callbacks = { ready: (kind: string) => void; reduced: (value: boolean) => void; changed: () => void };
const STRIDE = 15;
const MAX_PARTICLES = 3000;
const SIGNATURE_GLYPHS = [0,1,2,3,4,16,17,18];
const WHITE_INK = [1,1,1] as const;
const HX=0,HY=1,X=2,Y=3,VX=4,VY=5,SIZE=6,HEAT=7,INK=8,EXPIRY=9,PHASE=10,GLYPH=11,VARIATION=12,DELAY=13,PIGMENT=14;

export class MotionScene {
  private renderer: SceneRenderer | null = null;
  private particles = new Float32Array(MAX_PARTICLES * STRIDE);
  private vertexData = new Float32Array(MAX_PARTICLES * 8);
  private segments = new Float32Array(96 * 6);
  private segmentCount = 0;
  private count = 0;
  private layout: Layout = createLayout(1847,true);
  private frameLayout: Layout = { ...this.layout, rings: this.layout.rings.map(r=>({...r})) };
  private fit = { x: 0, y: 0, scale: 1 };
  private offset = { x: 0, y: 0 };
  private target = { x: 0, y: 0 };
  private smooth = { x: 0, y: 0 };
  private pointerInside = false;
  private raw: Vec | null = null;
  private rawTime = 0;
  private rect: DOMRect;
  private w = 1; private h = 1; private dpr = 1;
  private coarse = false; private mobile = false; private touchMode = true;
  private paused = false; private reduced = false; private onscreen = true; private disposed = false; private failed = false;
  private clock = 0; private last = 0; private raf = 0; private frameCount = 0; private frameSum = 0; private quality = 1;
  private introDone=false;
  private signatureClock=0; private signatureTime=0; private signatureCycle=-1;
  private signaturePhase:SignaturePhase="idle";
  private signatureTargets:SignatureTargets={points:[],halfWidth:0,fullHalfHeight:0,wordHalfHeight:0};
  private signatureAssignments=new Int16Array(MAX_PARTICLES).fill(-1);
  private signatureStarts=new Float32Array(MAX_PARTICLES*2);
  private signatureSchedule=new SignatureSchedule();
  private signatureHitPoint:Vec={x:0,y:0};
  private signatureHitTime=-Infinity;
  private signatureTap=false;
  private gesture = new Gesture();
  private drag: RingDrag | null = null;
  private abort = new AbortController();
  private resizeObserver: ResizeObserver;
  private visibilityObserver: IntersectionObserver;
  private media = window.matchMedia("(prefers-reduced-motion: reduce)");
  private pointerMedia = window.matchMedia("(pointer: coarse)");

  constructor(private canvas: HTMLCanvasElement, private fallback: SVGSVGElement, private callbacks: Callbacks) {
    this.rect = canvas.getBoundingClientRect();
    this.coarse = this.pointerMedia.matches; this.reduced = this.media.matches;
    this.canvas.dataset.touchMode="true";
    this.callbacks.reduced(this.reduced);
    this.initRenderer();
    this.resize();
    const signal = this.abort.signal;
    canvas.addEventListener("pointerenter", this.enter, {signal});
    canvas.addEventListener("pointermove", this.move, {signal});
    canvas.addEventListener("pointerdown", this.down, {signal});
    canvas.addEventListener("pointerup", this.up, {signal});
    canvas.addEventListener("pointerleave", this.leave, {signal});
    canvas.addEventListener("pointercancel", this.cancel, {signal});
    canvas.addEventListener("lostpointercapture", this.lostCapture, {signal});
    canvas.addEventListener("webglcontextlost", this.contextLost, {signal});
    canvas.addEventListener("webglcontextrestored", this.contextRestored, {signal});
    document.addEventListener("visibilitychange", this.syncLoop, {signal});
    window.addEventListener("scroll", this.updateRect, {signal, passive:true});
    window.addEventListener("blur", this.clearInteraction, {signal});
    this.media.addEventListener("change", this.motionChange, {signal});
    this.pointerMedia.addEventListener("change", this.pointerChange, {signal});
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(canvas.parentElement!);
    this.visibilityObserver = new IntersectionObserver(entries => { this.onscreen=entries[0].isIntersecting; this.syncLoop(); }, {threshold:.01});
    this.visibilityObserver.observe(canvas);
    this.syncLoop();
  }

  private initRenderer() {
    try { this.renderer = new GLRenderer(this.canvas); }
    catch {
      try { this.renderer = new CanvasRenderer(this.canvas); }
      catch { this.renderer=null; }
    }
    if(this.renderer) { this.fallback.dataset.hidden="true"; this.canvas.dataset.renderer=this.renderer.kind; this.callbacks.ready(this.renderer.kind); }
    else { this.fallback.dataset.hidden="false"; this.canvas.style.opacity="0"; this.callbacks.ready("static"); }
  }
  private buildParticles() {
    const rnd=seededRandom(this.layout.seed+7919);
    // Tile the whole canvas in CSS pixels, independent of the ring composition's fit.
    const budget=Math.floor(MAX_PARTICLES*this.quality*this.quality);
    const gap=Math.max(this.mobile?12/Math.sqrt(this.quality):18/this.quality,Math.sqrt(this.w*this.h/budget));
    const columns=Math.max(1,Math.min(budget,Math.floor(this.w/gap)));
    const rows=Math.max(1,Math.min(Math.floor(budget/columns),Math.floor(this.h/gap)));
    const stepX=this.w/columns,stepY=this.h/rows;
    let n=0;
    for(let row=0;row<rows;row++) for(let column=0;column<columns;column++){
      const x=((column+.5+(rnd()-.5)*.22)*stepX-this.fit.x)/this.fit.scale;
      const y=((row+.5+(rnd()-.5)*.22)*stepY-this.fit.y)/this.fit.scale;
      const dx=x-this.layout.disc.x,dy=y-this.layout.disc.y,d=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);
      const band=(Math.sin(d*.036+Math.sin(angle*3)*.65)+1)*.5;
      const j=n*STRIDE;
      this.particles[j+HX]=x;this.particles[j+HY]=y;
      this.particles[j+X]=x;this.particles[j+Y]=y;
      this.particles[j+VX]=0;this.particles[j+VY]=0;
      this.particles[j+SIZE]=((this.mobile?6:7)+band*(this.mobile?3.5:8)+rnd()*1.5)/this.fit.scale;
      this.particles[j+HEAT]=0;this.particles[j+INK]=0;this.particles[j+EXPIRY]=0;
      this.particles[j+PHASE]=rnd()*Math.PI*2;
      this.particles[j+GLYPH]=chooseFieldGlyph(rnd());
      this.particles[j+VARIATION]=.72+rnd()*.5;
      this.particles[j+DELAY]=0;this.particles[j+PIGMENT]=-1;n++;
    }
    this.count=n;
    this.signatureTargets=createSignatureTargets(this.w,this.h,this.count);
    this.signatureAssignments.fill(-1);this.signatureCycle=-1;
    this.syncSignature();
    for(let i=0;i<this.count;i++) if(this.signatureAssignments[i]>=0) this.placeSignatureParticle(i);
  }
  private updateRect = () => { this.rect=this.canvas.getBoundingClientRect(); };
  private resize = () => {
    if(this.disposed) return;
    this.clearInteraction(); this.updateRect();
    this.w=Math.max(1,this.rect.width);this.h=Math.max(1,this.rect.height);
    this.mobile=this.w<768;
    this.fit.scale=Math.max(.001,Math.min((this.mobile?this.w*.74:this.w*.84)/VIEW_WIDTH,(this.h-18)/VIEW_HEIGHT));
    this.fit.x=this.w*(this.mobile?.51:.61)-VIEW_WIDTH/2*this.fit.scale;
    this.fit.y=this.h*(this.mobile?.43:.5)-VIEW_HEIGHT/2*this.fit.scale;
    // Preserve native display pixels; adaptive quality changes density, never sharpness.
    this.dpr=Math.max(1,Math.min(window.devicePixelRatio||1,Math.sqrt(8_000_000/(this.w*this.h))));
    this.renderer?.resize(this.w,this.h,this.dpr);
    this.buildParticles();
    const shapes=this.fallback.querySelector<SVGSVGElement>("[data-shapes]");
    if(shapes){
      shapes.style.setProperty("x",`${this.fit.x}px`);shapes.style.setProperty("y",`${this.fit.y}px`);
      shapes.style.width=`${VIEW_WIDTH*this.fit.scale}px`;shapes.style.height=`${VIEW_HEIGHT*this.fit.scale}px`;
    }
    this.render();this.syncLoop();
  };
  private syncSignature() {
    const now=performance.now()/1000,previous=this.signaturePhase;
    const beat=this.signatureSchedule.beat(this.signatureClock,now);
    if((beat.phase==="cooldown"&&previous!=="cooldown")||((previous==="burst"||previous==="cooldown")&&beat.cycle>=0)) this.releaseSignature();
    this.signatureTime=beat.time;this.signaturePhase=beat.phase;
    if(this.canvas.dataset.signaturePhase!==beat.phase) this.canvas.dataset.signaturePhase=beat.phase;
    const remaining=String(this.signatureSchedule.remaining(now));
    if(this.canvas.dataset.signatureCooldown!==remaining) this.canvas.dataset.signatureCooldown=remaining;
    if(beat.cycle<0||!this.signatureTargets.points.length) return;
    if(beat.cycle!==this.signatureCycle){
      const occupied=new Set<number>();
      for(let n=0;n<this.count;n++){
        const target=this.signatureAssignments[n];
        if(target>=0&&!this.signatureTargets.points[target].prefix) occupied.add(target);
        else this.signatureAssignments[n]=-1;
      }
      const available:number[]=[];
      for(let n=0;n<this.count;n++) if(this.signatureAssignments[n]<0) available.push(n);
      const rnd=seededRandom(this.layout.seed+beat.cycle*104729+433);
      for(let i=available.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[available[i],available[j]]=[available[j],available[i]];}
      let used=0;
      this.signatureTargets.points.forEach((_,target)=>{
        if(!occupied.has(target)) this.signatureAssignments[available[used++]]=target;
      });
      for(let n=0;n<this.count;n++) if(this.signatureAssignments[n]>=0){
        this.signatureStarts[n*2]=this.particles[n*STRIDE+X];this.signatureStarts[n*2+1]=this.particles[n*STRIDE+Y];
      }
      this.signatureCycle=beat.cycle;
    }
    if(beat.phase==="hold"){
      for(let n=0;n<this.count;n++){
        const target=this.signatureAssignments[n];
        if(target>=0&&this.signatureTargets.points[target].prefix){
          const j=n*STRIDE;this.particles[j+X]=this.particles[j+HX];this.particles[j+Y]=this.particles[j+HY];
          this.particles[j+VX]=0;this.particles[j+VY]=0;this.signatureAssignments[n]=-1;
        }
      }
    }
  }
  private releaseSignature() {
    for(let n=0;n<this.count;n++) if(this.signatureAssignments[n]>=0){
      const j=n*STRIDE,p=this.particles;
      p[j+X]=p[j+HX];p[j+Y]=p[j+HY];p[j+VX]=0;p[j+VY]=0;
      this.signatureAssignments[n]=-1;
    }
  }
  private disturbSignature(from:Vec,to:Vec) {
    if(this.signaturePhase==="idle"||this.signaturePhase==="burst"||this.signaturePhase==="cooldown"||(this.signaturePhase==="gather"&&this.signatureTime<.55)) return false;
    const radius=(this.coarse?38:32)/this.fit.scale,p=this.particles;
    let hit=false;
    for(let n=0;n<this.count;n++){
      const target=this.signatureAssignments[n];
      if(target<0||(this.signaturePhase==="scatter"&&this.signatureTargets.points[target].prefix)) continue;
      const j=n*STRIDE;
      if(nearSignaturePoint(from,to,{x:p[j+X],y:p[j+Y]},radius)){hit=true;break;}
    }
    if(!hit) return false;
    const now=performance.now()/1000;
    this.signatureHitPoint={...to};this.signatureHitTime=now;
    for(let n=0;n<this.count;n++) if(this.signatureAssignments[n]>=0){
      const j=n*STRIDE;
      this.signatureStarts[n*2]=p[j+X];this.signatureStarts[n*2+1]=p[j+Y];
      p[j+HEAT]=1;p[j+PIGMENT]=4;p[j+INK]=1;p[j+EXPIRY]=this.clock+2.4;
    }
    this.signatureSchedule.interrupt(now,!this.paused&&!this.reduced);this.signatureCycle=-1;
    this.syncSignature();
    for(let n=0;n<this.count;n++) if(this.signatureAssignments[n]>=0) this.placeSignatureParticle(n);
    this.render();this.syncLoop();return true;
  }
  private signatureGather(n:number) {
    const stagger=(this.particles[n*STRIDE+PHASE]/(Math.PI*2))*.16;
    const t=clamp((this.signatureTime-stagger)/(SIGNATURE_GATHER-stagger),0,1);
    return t*t*(3-2*t);
  }
  private signatureRelease() {
    return clamp((this.signatureTime-SIGNATURE_GATHER-SIGNATURE_PULSE)/SIGNATURE_SCATTER,0,1);
  }
  private signaturePulse() {
    return this.signaturePhase==="pulse"&&!this.reduced?Math.sin((this.signatureTime-SIGNATURE_GATHER)*Math.PI*2*1.1):0;
  }
  private placeSignatureParticle(n:number) {
    const point=this.signatureTargets.points[this.signatureAssignments[n]],p=this.particles,j=n*STRIDE;
    if(this.signaturePhase==="burst"){
      const t=clamp(Math.max(.04,this.signatureTime)/SIGNATURE_SCATTER,0,1);
      const sx=this.signatureStarts[n*2],sy=this.signatureStarts[n*2+1];
      const angle=Math.atan2(sy-this.signatureHitPoint.y,sx-this.signatureHitPoint.x)+Math.sin(p[j+PHASE])*.3;
      const travel=(this.mobile?200:440)*(1-(1-t)**3)*p[j+VARIATION]/this.fit.scale;
      let x=sx+Math.cos(angle)*travel,y=sy+Math.sin(angle)*travel;
      const settle=clamp((t-.4)/.6,0,1),home=settle*settle*(3-2*settle);
      x+=(p[j+HX]-x)*home;y+=(p[j+HY]-y)*home;
      p[j+X]=x;p[j+Y]=y;p[j+VX]=0;p[j+VY]=0;return;
    }
    const pulse=1+this.signaturePulse()*.028;
    const release=this.signatureRelease(),shift=release*release*(3-2*release);
    const held=this.signaturePhase==="hold";
    const wordY=point.fullY+(point.holdY-point.fullY)*(held?1:this.signaturePhase==="scatter"?shift:0);
    let x=(this.w/2+point.x*pulse-this.fit.x)/this.fit.scale;
    let y=(this.h/2+(point.prefix?point.fullY:wordY)*pulse-this.fit.y)/this.fit.scale;
    if(this.signaturePhase==="gather"){
      const t=this.signatureGather(n),sx=this.signatureStarts[n*2],sy=this.signatureStarts[n*2+1];
      const curve=Math.sin(t*Math.PI)*Math.sin(p[j+PHASE])*(this.mobile?18:42)/this.fit.scale;
      x=sx+(x-sx)*t+curve;y=sy+(y-sy)*t+curve*.5;
    } else if(this.signaturePhase==="scatter"&&point.prefix){
      const angle=Math.atan2(point.fullY,point.x)+Math.sin(p[j+PHASE])*.9;
      const travel=(this.mobile?120:310)*(1-(1-release)**3)*( .75+p[j+VARIATION]*.35)/this.fit.scale;
      x+=Math.cos(angle)*travel;y+=Math.sin(angle)*travel;
      const t=clamp((release-.4)/.6,0,1),home=t*t*(3-2*t);
      x+=(p[j+HX]-x)*home;y+=(p[j+HY]-y)*home;
    }
    p[j+X]=x;p[j+Y]=y;p[j+VX]=0;p[j+VY]=0;
  }
  private local(e: PointerEvent): Vec { return { x:(e.clientX-this.rect.left-this.fit.x)/this.fit.scale,y:(e.clientY-this.rect.top-this.fit.y)/this.fit.scale }; }
  private css(e: PointerEvent): Vec { return {x:e.clientX,y:e.clientY}; }
  private enter = (e: PointerEvent) => {
    if(this.disposed||this.gesture.blocked) return;
    const p=this.local(e);this.target=p;this.smooth={...p};this.raw=p;this.rawTime=e.timeStamp;this.pointerInside=true;
  };
  private pushSegment(a:Vec,b:Vec,time:number) {
    const len=distance(a,b);if(len<.01||this.segmentCount>=96) return;
    const dt=Math.max(.008,(time-this.rawTime)/1000),speed=Math.min(2300,len/dt);
    const i=this.segmentCount*6;
    this.segments[i]=a.x;this.segments[i+1]=a.y;this.segments[i+2]=b.x;this.segments[i+3]=b.y;
    this.segments[i+4]=(b.x-a.x)/len*speed;this.segments[i+5]=(b.y-a.y)/len*speed;
    this.segmentCount++;
  }
  private move = (e: PointerEvent) => {
    if(this.disposed||this.gesture.blocked) return;
    if(this.gesture.id!==null&&this.gesture.id!==e.pointerId) return;
    const p=this.local(e),isTouch=e.pointerType!=="mouse";
    this.target=p;this.pointerInside=true;
    if((!isTouch||(this.touchMode&&this.gesture.id!==null))&&this.disturbSignature(this.raw??p,p)&&this.gesture.id!==null) this.signatureTap=true;
    const moved=this.gesture.move(e.pointerId,this.css(e));
    if(this.drag&&moved&&(!isTouch||this.touchMode)) {
      const localPointer={x:p.x-this.offset.x,y:p.y-this.offset.y};
      const model={...this.frameLayout,disc:{...this.layout.disc,x:this.layout.disc.x-this.offset.x,y:this.layout.disc.y-this.offset.y}};
      const ring=resizeRing(model,this.drag,localPointer);
      if(ring){ this.layout.rings[this.drag.index]=ring;this.frameLayout.rings[this.drag.index]={...ring};this.pushRing(this.drag.index); }
    } else if(!this.reduced&&!this.paused&&(!isTouch||(this.touchMode&&this.gesture.id!==null))) {
      if(this.raw) this.pushSegment(this.raw,p,e.timeStamp);
    }
    this.raw=p;this.rawTime=e.timeStamp;
    if(!isTouch) {
      const hit=this.hitRing(p);
      this.canvas.style.cursor=this.drag&&moved?"grabbing":hit>=0?"grab":"crosshair";
    }
    if(this.reduced||this.paused) this.render();
  };
  private down = (e: PointerEvent) => {
    if(e.pointerType==="mouse"&&e.button!==0) return;
    if(!this.gesture.down(e.pointerId,this.css(e),e.pointerType!=="mouse")) { this.drag=null;this.segmentCount=0;this.raw=null;return; }
    const p=this.local(e);this.target=p;this.smooth={...p};this.raw=p;this.rawTime=e.timeStamp;this.pointerInside=true;
    this.signatureTap=this.disturbSignature(p,p)||(performance.now()/1000-this.signatureHitTime<.8&&distance(p,this.signatureHitPoint)<48/this.fit.scale);
    const hit=this.hitRing(p,e.pointerType!=="mouse");
    if(!this.signatureTap&&hit>=0&&(e.pointerType==="mouse"||this.touchMode)){
      const model={...this.frameLayout,disc:{...this.layout.disc,x:this.layout.disc.x-this.offset.x,y:this.layout.disc.y-this.offset.y}};
      this.drag=beginRingDrag(model,hit,{x:p.x-this.offset.x,y:p.y-this.offset.y});
    }
    this.canvas.setPointerCapture(e.pointerId);
  };
  private up = (e: PointerEvent) => {
    this.gesture.move(e.pointerId,this.css(e));
    const tap=this.gesture.up(e.pointerId);
    const signatureTap=this.signatureTap;this.signatureTap=false;
    this.drag=null;
    if(this.canvas.hasPointerCapture(e.pointerId))this.canvas.releasePointerCapture(e.pointerId);
    if(tap&&!signatureTap)this.regenerate();
    if(e.pointerType!=="mouse"){this.pointerInside=false;this.raw=null;}
  };
  private cancel = (e: PointerEvent) => {
    this.gesture.cancel(e.pointerId);this.drag=null;this.raw=null;this.segmentCount=0;this.pointerInside=false;this.signatureTap=false;
  };
  private lostCapture = (e: PointerEvent) => {
    if(this.gesture.id===e.pointerId) this.cancel(e);
  };
  private leave = () => {
    if(this.gesture.id!==null) return;
    this.pointerInside=false;this.raw=null;this.canvas.style.cursor="default";
  };
  private clearInteraction = () => {
    const id=this.gesture.id;
    this.gesture.cancel();this.drag=null;this.raw=null;this.segmentCount=0;this.pointerInside=false;this.signatureTap=false;
    if(id!==null&&this.canvas.hasPointerCapture(id)) this.canvas.releasePointerCapture(id);
  };
  private hitRing(p:Vec,touch=this.coarse) {
    let index=-1,best=Infinity;
    const extra=(touch?18:8)/this.fit.scale;
    for(let i=0;i<3;i++) {
      const r=this.frameLayout.rings[i],error=Math.abs(Math.hypot(p.x-r.x-this.offset.x,p.y-r.y-this.offset.y)-r.radius);
      if(error<r.thickness/2+extra&&error<best){best=error;index=i;}
    }
    return index;
  }
  private pushRing(index:number) {
    if(this.reduced||this.paused)return;
    const r=this.frameLayout.rings[index],p=this.particles;
    for(let n=0;n<this.count;n++){
      const j=n*STRIDE,dx=p[j+X]-r.x-this.offset.x,dy=p[j+Y]-r.y-this.offset.y,d=Math.max(.01,Math.hypot(dx,dy));
      const overlap=r.thickness/2+6-Math.abs(d-r.radius);
      if(overlap<=0)continue;
      const sign=d<r.radius?-1:1,nx=dx/d*sign,ny=dy/d*sign;
      p[j+X]+=nx*overlap;p[j+Y]+=ny*overlap;p[j+VX]+=nx*overlap*4;p[j+VY]+=ny*overlap*4;
      p[j+DELAY]=Math.max(p[j+DELAY],this.clock+.06);p[j+HEAT]=1;
    }
  }
  private applyBrush() {
    if(!this.segmentCount)return;
    const p=this.particles,pressure=this.gesture.id!==null?1.35:1,radius=Math.max(this.gesture.id!==null?88.2:84,this.coarse?28/this.fit.scale:0);
    for(let n=0;n<this.count;n++){
      const j=n*STRIDE;
      for(let s=0;s<this.segmentCount;s++){
        const a=s*6,dx=this.segments[a+2]-this.segments[a],dy=this.segments[a+3]-this.segments[a+1],len=Math.hypot(dx,dy);
        const ux=dx/len,uy=dy/len,px=p[j+X]-this.segments[a],py=p[j+Y]-this.segments[a+1],along=px*ux+py*uy;
        if(along < -18||along>len+18)continue;
        const perpendicular=Math.abs(px*uy-py*ux);
        if(perpendicular>radius)continue;
        const falloff=Math.max(0,1-Math.pow(perpendicular/radius,4));
        const mix=clamp((1-Math.exp(-.027*len))*falloff*p[j+VARIATION]*.62*pressure,0,.9);
        const side=Math.sin(p[j+PHASE])* .19;
        const tx=(this.segments[a+4]-this.segments[a+5]*side)*p[j+VARIATION];
        const ty=(this.segments[a+5]+this.segments[a+4]*side)*p[j+VARIATION];
        p[j+VX]+=(tx-p[j+VX])*mix;p[j+VY]+=(ty-p[j+VY])*mix;
        p[j+DELAY]=this.clock+.2;p[j+HEAT]=Math.max(p[j+HEAT],falloff);
        if(pigmentAt(this.frameLayout,p[j+X],p[j+Y],this.offset)<0){
          p[j+PIGMENT]=4;p[j+INK]=Math.max(p[j+INK],falloff);p[j+EXPIRY]=this.clock+2.4;
        }
      }
    }
    this.segmentCount=0;
  }
  private update(dt:number,elapsed:number) {
    this.clock+=dt;
    this.signatureClock+=elapsed;this.syncSignature();
    if(this.signatureClock>=1.32) this.introDone=true;
    const alpha=1-Math.exp(-14*dt);
    this.smooth.x+=(this.target.x-this.smooth.x)*alpha;this.smooth.y+=(this.target.y-this.smooth.y)*alpha;
    if(!this.drag){
      const cap=(this.mobile?0:this.coarse?16:28)/this.fit.scale;
      const ox=this.pointerInside&&!this.coarse?clamp(.05*(this.smooth.x-698),-cap,cap):0;
      const oy=this.pointerInside&&!this.coarse?clamp(.05*(this.smooth.y-730),-cap,cap):0;
      this.offset.x+=(ox-this.offset.x)*Math.min(1,4*dt);this.offset.y+=(oy-this.offset.y)*Math.min(1,4*dt);
    }
    this.applyBrush();
    const p=this.particles,step=dt/2;
    for(let n=0;n<this.count;n++){
      const j=n*STRIDE,oldX=p[j+X],oldY=p[j+Y],loose=this.clock<p[j+DELAY],k=loose?3:30,damping=loose?4.5:9;
      if(this.signatureAssignments[n]>=0){
        this.placeSignatureParticle(n);p[j+HEAT]*=Math.exp(-3.8*dt);
        if(this.clock>p[j+EXPIRY])p[j+INK]*=Math.exp(-dt);
        continue;
      }
      for(let sub=0;sub<2;sub++){
        p[j+VX]+=(k*(p[j+HX]-p[j+X])-damping*p[j+VX])*step;
        p[j+VY]+=(k*(p[j+HY]-p[j+Y])-damping*p[j+VY])*step;
        p[j+X]+=p[j+VX]*step;p[j+Y]+=p[j+VY]*step;
      }
      p[j+HEAT]*=Math.exp(-3.8*dt);
      if(p[j+HEAT]>.08||Math.hypot(p[j+VX],p[j+VY])>25){
        let pigment=pigmentAt(this.frameLayout,p[j+X],p[j+Y],this.offset);
        if(pigment<0) for(let sample=1;sample<4;sample++) {
          const fraction=sample*.25;
          pigment=pigmentAt(this.frameLayout,oldX+(p[j+X]-oldX)*fraction,oldY+(p[j+Y]-oldY)*fraction,this.offset);
          if(pigment>=0)break;
        }
        if(pigment>=0){p[j+PIGMENT]=pigment;p[j+INK]=1;p[j+EXPIRY]=this.clock+2.4;}
      }
      if(this.clock>p[j+EXPIRY])p[j+INK]*=Math.exp(-dt);
    }
  }
  private render() {
    if(!this.renderer||this.failed||this.disposed)return;
    for(let i=0;i<3;i++){
      const source=this.layout.rings[i],r=this.frameLayout.rings[i];
      r.x=source.x;r.y=source.y;r.thickness=source.thickness;r.color=source.color;
      r.radius=source.radius+(!this.reduced&&this.drag?.index!==i?(this.mobile?7:12)*Math.sin(this.clock*(.6+.25*i)+2.1*i):0);
    }
    this.frameLayout.disc=this.layout.disc;
    // Offset is restricted before drawing so the disc never crosses an animated rim.
    if(!validLayout({...this.frameLayout,disc:{...this.layout.disc,x:this.layout.disc.x-this.offset.x,y:this.layout.disc.y-this.offset.y}},2)){
      this.offset.x*=.8;this.offset.y*=.8;
    }
    const p=this.particles,vertices=this.vertexData;
    for(let n=0;n<this.count;n++){
      const j=n*STRIDE,v=n*8,d=Math.hypot(p[j+HX]-this.layout.disc.x,p[j+HY]-this.layout.disc.y);
      const wave=this.reduced?1:1+(this.mobile?.09:.176)*Math.sin(.0131*d-5.2*this.clock);
      let intro=1;
      if(!this.reduced&&!this.introDone){
        const t=clamp((this.signatureClock-Math.min(d,1700)/1700)/.32,0,1),c=1.70158;
        intro=1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);
      }
      vertices[v]=this.fit.x+p[j+X]*this.fit.scale;vertices[v+1]=this.fit.y+p[j+Y]*this.fit.scale;
      vertices[v+2]=Math.max(.01,p[j+SIZE]*1.5*this.fit.scale*wave*intro);
      const phase=p[j+PHASE],heat=p[j+HEAT],ink=p[j+INK];
      let glyph=p[j+GLYPH];
      if(!this.reduced&&((this.clock+phase)%6)>1.8){
        const turn=Math.floor(this.clock*(heat>.2?5+heat*11:.66)+phase);
        glyph=chooseFieldGlyph(glyphNoise(this.layout.seed+n*104729+turn*7919));
      }
      vertices[v+3]=glyph+(this.mobile||heat*.4+ink*.45>.3?GLYPHS.length:0);
      const onShape=pigmentAt(this.frameLayout,p[j+X],p[j+Y],this.offset)>=0;
      const palette=p[j+PIGMENT]===4?WHITE_INK:PALETTE[Math.max(0,p[j+PIGMENT])],base=onShape?.12:.72;
      for(let channel=0;channel<3;channel++)vertices[v+4+channel]=onShape?base:base+(palette[channel]-base)*ink;
      vertices[v+7]=onShape?.87:clamp((this.mobile?.42:.28)+p[j+SIZE]*this.fit.scale/100+heat*.25+ink*.2,0,.95);
      const assigned=this.signatureAssignments[n];
      if(assigned>=0){
        const point=this.signatureTargets.points[assigned];
        const returnT=clamp((this.signatureRelease()-.4)/.6,0,1);
        const burstFade=clamp(this.signatureTime/(SIGNATURE_SCATTER*.55),0,1);
        const emphasis=this.signaturePhase==="burst"?1-burstFade*burstFade*(3-2*burstFade):this.signaturePhase==="gather"?this.signatureGather(n):point.prefix&&this.signaturePhase==="scatter"?1-returnT*returnT*(3-2*returnT):1;
        const pulse=this.signaturePulse();
        if(emphasis>.8){
          vertices[v+3]=chooseFieldGlyph((phase/(Math.PI*2)+Math.floor(this.signatureClock*.45)*.61803398875)%1,SIGNATURE_GLYPHS)+GLYPHS.length*(this.mobile?2:1);
        }
        vertices[v+2]+=(point.size*(1+pulse*.028)-vertices[v+2])*emphasis;
        const color=point.prefix?PALETTE[3]:PALETTE[0];
        for(let channel=0;channel<3;channel++){
          const target=onShape&&!this.mobile?.1:color[channel]+(1-color[channel])*(p[j+PIGMENT]===4?ink:0);
          vertices[v+4+channel]+=(target-vertices[v+4+channel])*emphasis;
        }
        vertices[v+7]+=(.91+pulse*.08-vertices[v+7])*emphasis;
      } else if(this.signaturePhase!=="idle"&&this.signaturePhase!=="cooldown"){
        const box=this.signatureTargets,release=this.signatureRelease(),shift=release*release*(3-2*release);
        const full=this.signaturePhase==="hold"?0:this.signaturePhase==="scatter"?1-shift:1;
        const halfHeight=box.wordHalfHeight+(box.fullHalfHeight-box.wordHalfHeight)*full;
        const mask=clamp((box.halfWidth+30-Math.abs(vertices[v]-this.w/2))/30,0,1)*clamp((halfHeight+22-Math.abs(vertices[v+1]-this.h/2))/22,0,1);
        const focus=this.signaturePhase==="burst"?1-clamp(this.signatureTime/(SIGNATURE_SCATTER*.55),0,1):this.signaturePhase==="gather"?clamp(this.signatureTime/SIGNATURE_GATHER,0,1):1;
        vertices[v+7]*=1-mask*focus*.82;
      }
    }
    try { this.renderer.draw(this.frameLayout,this.offset,this.fit,vertices,this.count); }
    catch { this.failed=true;this.fallback.dataset.hidden="false";this.canvas.style.opacity="0";this.syncLoop(); }
  }
  private tick = (timestamp:number) => {
    this.raf=0;
    if(this.disposed||!this.canRun())return;
    const elapsed=this.last?(timestamp-this.last)/1000:1/60;
    this.last=timestamp;this.update(Math.min(.04,elapsed),elapsed);this.render();
    this.frameCount++;this.frameSum+=elapsed;
    if(this.frameCount>=180){
      if(this.frameSum/this.frameCount>.035&&this.quality>.7){
        this.quality=Math.max(.7,this.quality-.15);this.resize();
      }
      this.frameCount=0;this.frameSum=0;
    }
    if(!this.raf&&this.canRun())this.raf=requestAnimationFrame(this.tick);
  };
  private canRun() { return !this.disposed&&!this.failed&&!!this.renderer&&!this.paused&&!this.reduced&&this.onscreen&&!document.hidden; }
  private syncLoop = () => {
    if(this.canRun()){if(!this.raf){this.last=0;this.raf=requestAnimationFrame(this.tick);}}
    else{if(this.raf)cancelAnimationFrame(this.raf);this.raf=0;this.last=0;}
  };
  private motionChange = () => {
    this.reduced=this.media.matches;this.clearInteraction();this.offset.x=0;this.offset.y=0;
    if(this.reduced){
      const p=this.particles;for(let n=0;n<this.count;n++){const j=n*STRIDE;p[j+X]=p[j+HX];p[j+Y]=p[j+HY];p[j+VX]=0;p[j+VY]=0;p[j+HEAT]=0;p[j+INK]=0;}
      for(let n=0;n<this.count;n++) if(this.signatureAssignments[n]>=0) this.placeSignatureParticle(n);
    }
    this.callbacks.reduced(this.reduced);this.render();this.syncLoop();
  };
  private pointerChange = () => {this.coarse=this.pointerMedia.matches;this.clearInteraction();};
  private contextLost = (event:Event) => {
    event.preventDefault();this.failed=true;this.clearInteraction();this.syncLoop();this.fallback.dataset.hidden="false";this.canvas.style.opacity="0";
  };
  private contextRestored = () => {
    this.renderer?.dispose();this.renderer=null;this.failed=false;this.canvas.style.opacity="1";this.initRenderer();this.resize();this.syncLoop();
  };

  setPaused(value:boolean) {this.paused=value;this.clearInteraction();this.render();this.syncLoop();}
  setTouchMode(value:boolean) {this.touchMode=value;this.clearInteraction();this.canvas.dataset.touchMode=String(value);}
  regenerate() {
    const seed=(this.layout.seed+104729)>>>0;
    this.layout=createLayout(seed);this.frameLayout={...this.layout,rings:this.layout.rings.map(r=>({...r}))};
    this.offset.x=0;this.offset.y=0;this.segmentCount=0;this.buildParticles();
    // Subsequent compositions appear directly, while the first load has a radial entrance.
    this.clock=Math.max(this.clock,2);this.introDone=true;
    this.updateFallback();this.render();this.syncLoop();this.callbacks.changed();
  }
  private updateFallback() {
    this.fallback.querySelectorAll<SVGCircleElement>("[data-ring]").forEach((circle,i)=>{
      const ring=this.layout.rings[i];circle.setAttribute("cx",String(ring.x));circle.setAttribute("cy",String(ring.y));
      circle.setAttribute("r",String(ring.radius));circle.setAttribute("stroke-width",String(ring.thickness));
      circle.setAttribute("stroke","rgb("+PALETTE[ring.color].map(v=>Math.round(v*255)).join(",")+")");
    });
    const disc=this.fallback.querySelector<SVGCircleElement>("[data-disc]");
    if(disc){disc.setAttribute("cx",String(this.layout.disc.x));disc.setAttribute("cy",String(this.layout.disc.y));disc.setAttribute("fill","rgb("+PALETTE[this.layout.disc.color].map(v=>Math.round(v*255)).join(",")+")");}
  }
  getState() {return {seed:this.layout.seed,particles:this.count,paused:this.paused,reducedMotion:this.reduced,touchMode:this.touchMode,renderer:this.failed?"static":this.renderer?.kind??"static",activeLoops:this.raf?1:0,signaturePhase:this.signaturePhase,signatureCycle:this.signatureCycle,signatureParticles:this.signatureTargets.points.length,signatureCooldownSeconds:this.signatureSchedule.remaining(performance.now()/1000)};}
  dispose() {
    if(this.disposed)return;this.clearInteraction();this.disposed=true;this.abort.abort();
    if(this.raf)cancelAnimationFrame(this.raf);this.raf=0;
    this.resizeObserver.disconnect();this.visibilityObserver.disconnect();this.renderer?.dispose();
  }
}
