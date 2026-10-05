'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

class Events{
  constructor(){this.handlers=new Map();}
  addEventListener(name,fn){if(!this.handlers.has(name))this.handlers.set(name,[]);this.handlers.get(name).push(fn);}
  fire(name,event={}){event.target??=this;for(const fn of this.handlers.get(name)||[])fn(event);}
}
class Node extends Events{
  constructor(){
    super();this.attrs={};this.focusCount=0;this.animations=[];this.classes=new Set();
    this.classList={add:n=>this.classes.add(n),remove:n=>this.classes.delete(n),contains:n=>this.classes.has(n)};
  }
  setAttribute(name,value){this.attrs[name]=value;}
  focus(options){assert.equal(options.preventScroll,true);this.focusCount++;}
  animate(){
    let resolve,reject;
    const finished=new Promise((r,j)=>{resolve=r;reject=j;});
    finished.catch(()=>{});
    const animation={finished,cancelled:false,cancel(){this.cancelled=true;reject(new Error('Cancelled'));},finish(){resolve();}};
    this.animations.push(animation);return animation;
  }
}
function setup({reduce=false,animate=true,mobile=false}={}){
  const root=new Node(),trigger=new Node(),dialog=new Node(),sheet=new Node(),close=new Node();
  const links=Array.from({length:7},()=>new Node());
  const window=new Events(),reduced=new Events(),small=new Events();
  reduced.matches=reduce;small.matches=mobile;
  window.matchMedia=q=>q.includes('reduced')?reduced:small;
  const document={documentElement:root,hidden:false,querySelector:q=>q==='#menu-toggle'?trigger:dialog};
  dialog.querySelector=q=>q==='.menu-sheet'?sheet:close;
  dialog.querySelectorAll=()=>links;
  dialog.open=false;dialog.shown=0;
  dialog.showModal=()=>{dialog.open=true;dialog.shown++;};
  dialog.close=()=>{dialog.open=false;dialog.fire('close');};
  if(!animate)sheet.animate=undefined;
  const announcements=[];
  window.dispatchEvent=event=>announcements.push(event.detail.open);
  vm.runInNewContext(fs.readFileSync('dist/menu.js','utf8'),{
    document,window,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}}
  });
  return {root,trigger,dialog,sheet,close,links,window,reduced,document,announcements};
}
const flush=async()=>{await Promise.resolve();await Promise.resolve();};
(async()=>{
  const s=setup();
  s.trigger.fire('click');
  assert.ok(s.dialog.open);assert.equal(s.dialog.shown,1);
  assert.equal(s.trigger.attrs['aria-expanded'],'true');
  assert.ok(s.root.classList.contains('menu-open'));
  assert.equal(s.close.focusCount,1);
  s.trigger.fire('click');assert.equal(s.dialog.shown,1,'Repeated opening must not create another modal');
  s.dialog.fire('click',{target:{closest:()=>null}});
  assert.ok(s.dialog.open,'Clicking sheet content must not dismiss navigation');
  const escape={preventDefault(){this.prevented=true;}};
  s.dialog.fire('cancel',escape);
  assert.ok(escape.prevented);
  assert.ok(s.dialog.open,'Keep native focus containment through the closing animation');
  s.sheet.animations.at(-1).finish();await flush();
  assert.ok(!s.dialog.open);assert.equal(s.trigger.attrs['aria-expanded'],'false');
  assert.ok(!s.root.classList.contains('menu-open'));
  assert.equal(s.trigger.focusCount,1);assert.deepEqual(s.announcements,[true,false]);
  s.trigger.fire('click');
  s.dialog.fire('click',{target:{closest:()=>s.links[0]}});
  assert.ok(!s.dialog.open,'Navigation must unlock page scrolling before the anchor default action');
  assert.ok(!s.root.classList.contains('menu-open'));
  s.trigger.fire('click');
  s.dialog.fire('click',{target:s.dialog});
  assert.ok(s.dialog.open);s.sheet.animations.at(-1).finish();await flush();
  assert.ok(!s.dialog.open,'Backdrop dismissal must finish and restore the page');
  s.trigger.fire('click');s.close.fire('click');
  s.reduced.matches=true;s.reduced.fire('change');await flush();
  assert.ok(!s.dialog.open,'Enabling reduced motion during closing must not leave a stuck dialog');
  s.reduced.matches=false;s.trigger.fire('click');
  s.document.hidden=true;const focusCount=s.trigger.focusCount;
  s.window.fire('pagehide');await flush();
  assert.ok(!s.dialog.open);assert.ok(!s.root.classList.contains('menu-open'));
  assert.equal(s.trigger.focusCount,focusCount,'Pagehide must not refocus a hidden page');
  for(const options of [{reduce:true,mobile:true},{animate:false,mobile:true}]){
    const r=setup(options);
    r.trigger.fire('click');assert.ok(r.dialog.open);
    r.close.fire('click');assert.ok(!r.dialog.open);
    assert.equal(r.trigger.attrs['aria-expanded'],'false');
    assert.ok(!r.root.classList.contains('menu-open'));
  }
  console.log('Menu lifecycle passed: repeated opening, Escape during reveal, inside/backdrop clicks, links, focus return, scroll unlock, pagehide and reduced motion.');
})().catch(error=>{console.error(error);process.exitCode=1;});

