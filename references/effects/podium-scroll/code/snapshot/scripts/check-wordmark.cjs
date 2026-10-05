const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../dist/wordmark.js'),'utf8');
function createScene({reduce=false,mobile=false}={}){
  let clock=0,id=0;
  const tasks=new Map(),handlers={},states=[],classes=new Set(),headerClasses=new Set(),props={};
  const classList=set=>({add:(...xs)=>xs.forEach(x=>set.add(x)),remove:(...xs)=>xs.forEach(x=>set.delete(x)),contains:x=>set.has(x)});
  const text={textContent:'bloom'},dot={style:{}},track={get scrollWidth(){return text.textContent.length*16+6;}};
  const reduced={matches:reduce,addEventListener:(name,fn)=>handlers['reduced:'+name]=fn};
  const narrow={matches:mobile,addEventListener:(name,fn)=>handlers['mobile:'+name]=fn};
  const header={classList:classList(headerClasses)};
  const mark={
    querySelector:q=>q==='.brand-text'?text:q==='.brand-track'?track:dot,
    querySelectorAll:()=>[{scrollWidth:150},{scrollWidth:155}],
    get clientWidth(){return narrow.matches?(headerClasses.has('brand-resting')?108:194):104;},
    style:{setProperty:(k,v)=>props[k]=v},classList:classList(classes)
  };
  const window={
    matchMedia:q=>q.includes('max-width')?narrow:reduced,
    getComputedStyle:()=>({paddingLeft:narrow.matches?'16px':'0px',paddingRight:narrow.matches?'16px':'0px'}),
    addEventListener:(name,fn)=>handlers[name]=fn,
    setTimeout:(fn,delay)=>{tasks.set(++id,{fn,due:clock+delay});return id;}
  };
  const document={hidden:false,querySelector:q=>q==='.site-header'?header:mark,addEventListener:(name,fn)=>handlers[name]=fn};
  const context={window,document,clearTimeout:id=>tasks.delete(id),performance:{now:()=>clock}};
  vm.createContext(context);vm.runInContext(source,context);
  function advance(to){
    assert.ok(to>=clock);
    for(;;){
      const next=[...tasks].sort((a,b)=>a[1].due-b[1].due)[0];
      if(!next||next[1].due>to)break;
      tasks.delete(next[0]);clock=next[1].due;next[1].fn();states.push(text.textContent);
    }
    clock=to;
  }
  const motion=paused=>handlers['bloom:motion']({detail:{paused}});
  return {advance,motion,handlers,states,classes,headerClasses,props,tasks,text,dot,document,reduced,narrow,get now(){return clock;}};
}

function checkCycle(mobile){
  const h=createScene({mobile});
  assert.equal(h.headerClasses.has('brand-resting'),false,'Typing starts inside the joined menu');
  assert.ok(Number(h.props['--brand-scale'])<=1);
  h.advance(800);const held=h.text.textContent;
  h.motion(true);assert.equal(h.tasks.size,0);
  h.advance(10800);assert.equal(h.text.textContent,held);
  h.motion(false);h.advance(29999);
  assert.ok(h.states.includes('Нужны цветы?'));assert.ok(h.states.includes('bloom boutique'));
  assert.equal(h.text.textContent,'bloom');assert.equal(h.dot.style.opacity,'1');
  assert.equal(h.classes.has('is-point'),true);assert.equal(h.classes.has('is-typing'),false);
  assert.equal(h.headerClasses.has('brand-resting'),true,'Only the final name gets its own mobile window');
  assert.equal(h.tasks.size,1);
  const a=h.states.indexOf('Нужны цветы?'),b=h.states.indexOf('bloom boutique');
  assert.ok(h.states.slice(a,b).includes(''));assert.ok(h.states.slice(b).includes('bloom boutiqu'));assert.ok(h.states.slice(b).includes('bloom b'));
  h.advance(30000);
  assert.equal(h.headerClasses.has('brand-resting'),false,'The next twenty-second cycle rejoins the window');
  assert.equal(h.text.textContent,mobile?'bloom':'','Mobile keeps the name visible while joining; desktop starts immediately');
  if(mobile){
    assert.equal(h.classes.has('is-typing'),false);h.advance(30559);assert.equal(h.text.textContent,'bloom');
    h.advance(30560);assert.equal(h.text.textContent,'');assert.equal(h.classes.has('is-typing'),true);
  }
  h.advance(39999);assert.equal(h.text.textContent,'bloom');assert.equal(h.headerClasses.has('brand-resting'),true);
  h.motion(true);assert.equal(h.tasks.size,0);h.advance(44999);h.motion(false);
  assert.equal(h.tasks.size,1,'Resuming the resting name restores one countdown');
  h.document.hidden=true;h.handlers.visibilitychange();assert.equal(h.tasks.size,0);assert.equal(h.text.textContent,'bloom');
  h.document.hidden=false;h.handlers.visibilitychange();assert.equal(h.tasks.size,1);
  h.reduced.matches=true;h.handlers['reduced:change']();
  assert.equal(h.text.textContent,'bloom');assert.equal(h.headerClasses.has('brand-resting'),true);
  assert.equal(h.classes.has('is-point'),false);assert.equal(h.tasks.size,0);
}

checkCycle(false);checkCycle(true);
const joining=createScene({mobile:true});joining.advance(20200);joining.motion(true);joining.advance(29200);
assert.equal(joining.text.textContent,'bloom');assert.equal(joining.tasks.size,0);
joining.motion(false);joining.advance(29559);assert.equal(joining.text.textContent,'bloom');
joining.advance(29560);assert.equal(joining.text.textContent,'','Pause must preserve the joining countdown');
joining.advance(39000);assert.equal(joining.headerClasses.has('brand-resting'),true);
const before=joining.props['--brand-scale'];
for(let i=0;i<10;i++)joining.handlers.resize();
assert.equal(joining.props['--brand-scale'],before,'Repeated fitting must not feed transformed widths back into scale');
joining.narrow.matches=false;joining.handlers.resize();assert.equal(joining.headerClasses.has('brand-resting'),true);
joining.narrow.matches=true;joining.handlers.resize();assert.equal(joining.props['--brand-scale'],before);
joining.advance(49000);joining.document.hidden=true;joining.handlers.visibilitychange();
assert.equal(joining.headerClasses.has('brand-resting'),true);assert.equal(joining.tasks.size,0);
for(const mobile of [false,true]){
  const reduced=createScene({reduce:true,mobile});assert.equal(reduced.text.textContent,'bloom');
  assert.equal(reduced.dot.style.opacity,'1');assert.equal(reduced.headerClasses.has('brand-resting'),true);assert.equal(reduced.tasks.size,0);
}
console.log('Typing, deletions, final point, twenty-second cycles, mobile detach/rejoin, stable fit, pause, resize, visibility and reduced motion: passed.');
