export const SIGNATURE_INTERVAL = 10;
export const SIGNATURE_GATHER = .85;
export const SIGNATURE_PULSE = 5;
export const SIGNATURE_SCATTER = 1.2;
export const SIGNATURE_COOLDOWN = 30;
export type SignaturePhase = "idle" | "gather" | "pulse" | "scatter" | "hold" | "burst" | "cooldown";
export type SignaturePoint = { x: number; fullY: number; holdY: number; prefix: boolean; size: number };
export type SignatureTargets = { points: SignaturePoint[]; halfWidth: number; fullHalfHeight: number; wordHalfHeight: number };

// This clock advances with visible animation time, independent of the physics timestep.
export function signatureBeat(seconds: number) {
  if(seconds < SIGNATURE_INTERVAL) return { cycle: -1, time: 0, phase: "idle" as SignaturePhase };
  const cycle=Math.floor((seconds-SIGNATURE_INTERVAL)/SIGNATURE_INTERVAL);
  const time=seconds-SIGNATURE_INTERVAL-cycle*SIGNATURE_INTERVAL;
  const phase:SignaturePhase=time<SIGNATURE_GATHER?"gather":time<SIGNATURE_GATHER+SIGNATURE_PULSE?"pulse":time<SIGNATURE_GATHER+SIGNATURE_PULSE+SIGNATURE_SCATTER?"scatter":"hold";
  return {cycle,time,phase};
}

export class SignatureSchedule {
  private blockedUntil=0;
  private interruptedAt=0;
  private origin=0;
  private burstDuration=SIGNATURE_SCATTER;

  interrupt(now:number,animate=true) {
    this.interruptedAt=now;this.blockedUntil=now+SIGNATURE_COOLDOWN;
    this.burstDuration=animate?SIGNATURE_SCATTER:0;
  }
  beat(clock:number,now:number) {
    if(this.blockedUntil>0){
      if(now<this.blockedUntil){
        const time=Math.max(0,now-this.interruptedAt);
        return {cycle:-1,time,phase:(time<this.burstDuration?"burst":"cooldown") as SignaturePhase};
      }
      // Restart assembly at the end of the cooldown, then keep the ten-second rhythm.
      this.origin=clock-SIGNATURE_INTERVAL;this.blockedUntil=0;
    }
    return signatureBeat(clock-this.origin);
  }
  remaining(now:number) { return Math.max(0,Math.ceil(this.blockedUntil-now)); }
}

export function nearSignaturePoint(from:{x:number;y:number},to:{x:number;y:number},point:{x:number;y:number},radius:number) {
  const dx=to.x-from.x,dy=to.y-from.y,length=dx*dx+dy*dy;
  const t=length>0?Math.max(0,Math.min(1,((point.x-from.x)*dx+(point.y-from.y)*dy)/length)):0;
  const x=from.x+t*dx-point.x,y=from.y+t*dy-point.y;
  return x*x+y*y<=radius*radius;
}

function textMask(text:string,fontSize:number) {
  const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d",{willReadFrequently:true});
  if(!ctx) return null;
  const font=`750 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
  ctx.font=font;
  canvas.width=Math.ceil(ctx.measureText(text).width+fontSize);
  canvas.height=Math.ceil(fontSize*1.8);
  ctx.font=font;ctx.textAlign="center";ctx.textBaseline="alphabetic";ctx.fillStyle="#fff";
  ctx.fillText(text,canvas.width/2,fontSize*1.25);
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  let left=canvas.width,right=0,top=canvas.height,bottom=0;
  for(let y=0;y<canvas.height;y++) for(let x=0;x<canvas.width;x++) {
    if(pixels[(y*canvas.width+x)*4+3]<110) continue;
    left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
  }
  return {pixels,width:canvas.width,left,right,top,bottom};
}

export function createSignatureTargets(width:number,height:number,count:number):SignatureTargets {
  const empty={points:[],halfWidth:0,fullHalfHeight:0,wordHalfHeight:0};
  const measure=document.createElement("canvas").getContext("2d");
  if(!measure||count<24) return empty;
  const mobile=width<768;
  measure.font="750 128px ui-sans-serif, system-ui, sans-serif";
  const wordWidth=Math.min(width*(mobile?.94:.82),700);
  const fontSize=Math.min(wordWidth/measure.measureText("tatarin").width*128,height*.22);
  const word=textMask("tatarin",fontSize),prefix=textMask("made by",fontSize*(mobile?.46:.34));
  if(!word||!prefix) return empty;
  const wordHeight=word.bottom-word.top,prefixHeight=prefix.bottom-prefix.top,lineGap=Math.max(10,fontSize*.09);
  const wordOffset=(prefixHeight+lineGap)/2,prefixOffset=-(wordHeight+lineGap)/2;
  // Phone lettering needs several rows of tiny glyphs across each stroke.
  // Use the same moving particles as desktop, with more of the field gathered.
  const budget=Math.min(mobile?1200:1000,Math.floor(count*(mobile?.6:.42)));
  let gap=mobile?3:4.7,points:SignaturePoint[]=[];
  const sample=(mask:NonNullable<ReturnType<typeof textMask>>,step:number,isPrefix:boolean,offset:number)=>{
    const centerX=(mask.left+mask.right)/2,centerY=(mask.top+mask.bottom)/2;
    for(let y=mask.top+step*.5;y<=mask.bottom;y+=step) for(let x=mask.left+step*.5;x<=mask.right;x+=step){
      if(mask.pixels[(Math.floor(y)*mask.width+Math.floor(x))*4+3]<110) continue;
      points.push({x:x-centerX,fullY:y-centerY+offset,holdY:y-centerY,prefix:isPrefix,size:step*(mobile?2.15:2.5)});
    }
  };
  for(let pass=0;pass<6;pass++) {
    points=[];sample(word,gap,false,wordOffset);sample(prefix,gap*.76,true,prefixOffset);
    if(points.length<=budget) break;
    gap*=Math.sqrt(points.length/budget)*1.025;
  }
  if(points.length>budget) points=Array.from({length:budget},(_,i)=>points[Math.floor(i*points.length/budget)]);
  return {points,halfWidth:(word.right-word.left)/2,fullHalfHeight:(wordHeight+prefixHeight+lineGap)/2,wordHalfHeight:wordHeight/2};
}
