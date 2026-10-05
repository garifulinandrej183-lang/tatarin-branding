import assert from "node:assert/strict";
import {createLayout,validLayout,beginRingDrag,resizeRing,Gesture} from "../lib/motion-math.ts";
let accepted=0,rejected=0;
for(let seed=1;seed<=500;seed++){
  const layout=createLayout(seed);
  assert.ok(validLayout(layout),"Every generated composition must protect the disc");
  for(let i=0;i<3;i++){
    const r=layout.rings[i],point={x:r.x+r.radius,y:r.y};
    const drag=beginRingDrag(layout,i,point);
    for(const delta of [-1800,-700,-120,0,120,700,1800]){
      const resized=resizeRing(layout,drag,{x:point.x+delta,y:point.y+delta*.2});
      if(!resized){rejected++;continue;}
      accepted++;
      const candidate={...layout,rings:layout.rings.map((v,index)=>index===i?resized:v)};
      assert.ok(validLayout(candidate),"Accepted drag must preserve the disc boundary");
      assert.ok(Math.abs(resized.x+drag.direction.x*resized.radius-drag.anchor.x)<1e-6);
      assert.ok(Math.abs(resized.y+drag.direction.y*resized.radius-drag.anchor.y)<1e-6);
    }
  }
}
const g=new Gesture();
assert.ok(g.down(1,{x:0,y:0},false));assert.equal(g.up(1),true);
g.down(1,{x:0,y:0},false);g.move(1,{x:30,y:0});assert.equal(g.up(1),false);
g.down(1,{x:0,y:0},true);g.move(1,{x:0,y:100});assert.equal(g.up(1),false,"Scrolling must not regenerate");
g.down(1,{x:0,y:0},true);g.cancel(1);assert.equal(g.up(1),false,"Cancelled touch must not regenerate");
g.down(1,{x:0,y:0},true);assert.equal(g.down(2,{x:1,y:1},true),false);assert.equal(g.up(2),false);assert.equal(g.up(1),false);
g.down(3,{x:10,y:10},true);assert.equal(g.up(3),true,"A fresh touch must work after multi-touch cancellation");
console.log(JSON.stringify({generatedLayouts:500,acceptedDrags:accepted,rejectedDrags:rejected,gestureCases:6,status:"passed"}));

