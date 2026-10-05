(() => {
  'use strict';
  const {max,min,sqrt,hypot,exp,abs,cos,sin,PI}=Math;
  const clamp=x=>max(0,min(1,x));
  const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
  const number=x=>x.toFixed(5);
  const angles=Array.from({length:5},(_,i)=>-PI/2+i*PI*2/5);
  const blend=(a,b)=>{
    const h=clamp(.5+.5*(a-b)/.038);
    return b*(1-h)+a*h+.038*h*(1-h);
  };
  const resolution=120,extent=.72,step=extent*2/resolution;
  const cases=[[],[[3,0]],[[0,1]],[[3,1]],[[1,2]],null,[[0,2]],[[3,2]],[[2,3]],[[2,0]],null,[[2,1]],[[1,3]],[[1,0]],[[0,3]],[]];
  let restingOutline='';

  // One blended distance field gives the flower a continuous, liquid outline.
  // Narrow necks separate naturally instead of leaving punched ellipses.
  function outline(forces,point,amount) {
    if(!amount&&forces.every(f=>f===0)&&restingOutline)return restingOutline;
    const petals=angles.map((angle,i)=>{
      const f=forces[i],rotation=angle+(i%2?1:-1)*.92*f,r=.215+.19*f;
      return {x:cos(angle)*r,y:sin(angle)*r,c:cos(rotation),s:sin(rotation),major:.248*(1-.22*f),minor:.142*(1-.18*f),force:f};
    });
    const values=new Float32Array((resolution+1)**2);
    for(let y=0;y<=resolution;y++)for(let x=0;x<=resolution;x++) {
      const px=-extent+x*step,py=-extent+y*step;
      let value=.205-sqrt(px*px+py*py);
      for(const p of petals) {
        const dx=px-p.x,dy=py-p.y,u=dx*p.c+dy*p.s,v=-dx*p.s+dy*p.c;
        const minor=p.minor*(1+.16*p.force*clamp(u/p.major+.5));
        const eu=u/p.major,ev=v/minor;
        value=blend(value,(1-sqrt(eu*eu+ev*ev))*p.minor);
      }
      if(amount) {
        const r=((px-point.x)/.14)**2+((py-point.y)/.105)**2;
        value-=.045*amount*exp(-r*2);
      }
      values[y*(resolution+1)+x]=value;
    }
    const points=new Map(),links=new Map();
    const join=(a,b)=>{if(!links.has(a))links.set(a,[]);if(!links.has(b))links.set(b,[]);links.get(a).push(b);links.get(b).push(a);};
    for(let y=0;y<resolution;y++)for(let x=0;x<resolution;x++) {
      const index=y*(resolution+1)+x;
      const v=[values[index],values[index+1],values[index+resolution+2],values[index+resolution+1]];
      const code=v.reduce((n,value,i)=>n|(value>0?1<<i:0),0);
      if(code===0||code===15)continue;
      const corners=[[x,y],[x+1,y],[x+1,y+1],[x,y+1]];
      const keys=[`h${x},${y}`,`v${x+1},${y}`,`h${x},${y+1}`,`v${x},${y}`];
      const edge=e=>{
        const key=keys[e];
        if(!points.has(key)) {
          const a=corners[e],b=corners[(e+1)%4],t=v[e]/(v[e]-v[(e+1)%4]);
          points.set(key,[-extent+(a[0]+(b[0]-a[0])*t)*step,-extent+(a[1]+(b[1]-a[1])*t)*step]);
        }
        return key;
      };
      let pairs=cases[code];
      if(code===5)pairs=v.reduce((a,b)=>a+b,0)>0?[[0,1],[2,3]]:[[3,0],[1,2]];
      if(code===10)pairs=v.reduce((a,b)=>a+b,0)>0?[[3,0],[1,2]]:[[0,1],[2,3]];
      for(const [a,b]of pairs)join(edge(a),edge(b));
    }
    let path='';const visited=new Set();
    for(const first of links.keys()) {
      if(visited.has(first))continue;
      const loop=[];let current=first,previous=null;
      do {
        visited.add(current);loop.push(points.get(current));
        const neighbours=links.get(current),next=neighbours[0]===previous?neighbours[1]:neighbours[0];
        previous=current;current=next;
      }while(current&&current!==first&&!visited.has(current));
      if(loop.length<4)continue;
      path+=`M${loop[0].map(number).join(',')}`;
      for(let i=0;i<loop.length;i++) {
        const a=loop[(i+loop.length-1)%loop.length],b=loop[i],c=loop[(i+1)%loop.length],d=loop[(i+2)%loop.length];
        path+=`C${number(b[0]+(c[0]-a[0])/6)},${number(b[1]+(c[1]-a[1])/6)} ${number(c[0]-(d[0]-b[0])/6)},${number(c[1]-(d[1]-b[1])/6)} ${c.map(number).join(',')}`;
      }
      path+='Z';
    }
    if(!amount&&forces.every(f=>f===0))restingOutline=path;
    return path;
  }
  class BloomFlower {
    static outline(forces=[0,0,0,0,0]) {return outline(forces,{x:0,y:0},0);}
    constructor(hole,erosion) {
      this.hole=hole;this.erosion=erosion;this.forces=[0,0,0,0,0];
      this.target={x:0,y:0,active:false};this.point={x:0,y:0};
      this.amount=0;this.time=0;this.reset();
    }
    move(x,y) {
      if(!this.target.active&&!this.amount)this.point={x,y};
      this.target={x,y,active:hypot(x,y)<.68};
    }
    release() {this.target.active=false;}
    reset() {
      this.forces.fill(0);this.target.active=false;this.amount=0;this.time=0;
      this.hole.setAttribute('d',BloomFlower.outline());
      this.erosion.setAttribute('opacity','0');
    }
    render(time,paused,mobile=false,view={width:700,height:700}) {
      if(paused)return false;
      const dt=this.time?min(.05,max(0,(time-this.time)/1000)):1/60;
      this.time=time;let settling=false;
      const active=this.target.active,follow=1-exp(-dt/.045),ease=1-exp(-dt/(active?.115:.18));
      for(const axis of ['x','y']) {
        const delta=this.target[axis]-this.point[axis];
        this.point[axis]+=delta*follow;
        if(active&&abs(delta)>.0001)settling=true;
      }
      for(let i=0;i<angles.length;i++) {
        const a=angles[i],distance=hypot(this.point.x-cos(a)*.37,this.point.y-sin(a)*.37);
        const target=active?smooth((.38-distance)/.26):0;
        this.forces[i]+=(target-this.forces[i])*ease;
        if(abs(target-this.forces[i])<.00015)this.forces[i]=target;else settling=true;
      }
      const target=active?1:0;
      this.amount+=(target-this.amount)*ease;
      if(abs(target-this.amount)<.00015)this.amount=target;else settling=true;
      this.hole.setAttribute('d',outline(this.forces,this.point,this.amount));
      const w=(mobile?88:118)/view.width*(.65+.35*this.amount),h=(mobile?70:94)/view.height*(.65+.35*this.amount);
      this.erosion.setAttribute('x',number(this.point.x-w/2));this.erosion.setAttribute('y',number(this.point.y-h/2));
      this.erosion.setAttribute('width',number(w));this.erosion.setAttribute('height',number(h));
      this.erosion.setAttribute('opacity',this.amount?number(this.amount):'0');
      if(!settling)this.time=0;
      return settling;
    }
  }
  window.BloomFlower=BloomFlower;
})();
