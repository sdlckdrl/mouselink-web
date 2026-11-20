// Mount the actual file-demo DOM and exercise the shared cursor event adapter.
// The fixture supplies hit-testing/geometry, not a separate hard-coded target class.
'use strict';
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const test = require('node:test');
const root = path.join(__dirname, '..');
const fileDemo=readFileSync(root+'/js/preview-file-demo.js','utf8');
const cursorSource=readFileSync(root+'/js/preview-cursor-mode.js','utf8');
const rect=(left,top,right,bottom)=>({left,top,right,bottom,width:right-left,height:bottom-top});
const box={stage:rect(0,0,600,400),grid:rect(44,135,285,232),mac:rect(310,94,576,244),photo:rect(51,142,117,178),work:rect(125,142,191,178),note:rect(201,142,270,178)};
function harness(cursor=cursorSource) {
 const captures=new Map(),trace=[];let time=0;
 class Event {
   constructor(type,data){Object.assign(this,{type,isTrusted:false},data)}
   preventDefault(){this.defaultPrevented=true}
   stopImmediatePropagation(){this.stopped=true}
 }
 class Node {
   constructor(tag){Object.assign(this,{tag,children:[],dataset:{},style:{},attrs:{},listeners:{},className:'',nodeType:1,isConnected:true});}
   append(...kids){for (const kid of kids){kid.parent=this;this.children.push(kid);}}
   after(other){const i=this.parent.children.indexOf(this); this.parent.children.splice(i+1,0,other);other.parent=this.parent}
   replaceChildren(...kids){this.children.length=0;this.append(...kids)}
   [Symbol.iterator](){return this.children[Symbol.iterator]()}
   *walk(){yield this; for(const c of this)yield* c.walk()}
   get classList(){const node=this;return {add(c){this.toggle(c,true)},remove(c){this.toggle(c,false)},contains(c){return node.className.split(' ').includes(c)},toggle(c,v){const arr=new Set(node.className.split(' ').filter(Boolean)); if(v??!arr.has(c))arr.add(c);else arr.delete(c);node.className=[...arr].join(' ');}}}
   contains(maybe){return maybe===this||Boolean(maybe?.parent&&this.contains(maybe.parent))}
   setAttribute(k,v){this.attrs[k]=v}
   getAttribute(k){return this.attrs[k]??null}
   matches(s) { if(s.startsWith('.'))return this.classList.contains(s.slice(1));
     if(s==='button:not(:disabled)')return this.tag==='button'&&!this.disabled;
     if(s.startsWith('[')&&s.endsWith(']'))return s.slice(1,-1).replace(/^data-/,'').replace(/-[a-z]/g,m=>m[1].toUpperCase()) in this.dataset;
     return false;
   }
   closest(sel){return sel.split(',').some(s=>this.matches(s))?this:this.parent?.closest(sel)??null}
   querySelector(sel){return [...this.walk()].find(n=>n!==this&&n.matches(sel))||null}
   addEventListener(type,fn,opts={}){(this.listeners[type]||=[]).push([fn,Boolean(opts.capture)])}
   dispatchEvent(e){
     e.target=this;
     if(!e.isTrusted&&e.type.startsWith('pointer'))trace.push([e.type,e.clientX,e.clientY,e.buttons,this.className]);
     const path=[]; for(let k=this;k;k=k.parent)path.push(k);
     for (const [phase,nodes] of [[true,[...path].reverse()],[false,path]]) {
      for(const n of nodes)for(const [fn,cap] of n.listeners[e.type]||[])if(cap===phase){e.currentTarget=n;fn(e);if(e.stopped)return !e.defaultPrevented;}
     }
     return !e.defaultPrevented;
   }
   click(){this.dispatchEvent(new Event('click',{detail:0}));}
   getBoundingClientRect(){if(this.dataset.omFile)return box[this.dataset.omFile];
    return [['om-file-stage','stage'],['om-file-file-grid','grid'],['om-file-mac-screen','mac']].map(([cls,b])=>this.matches('.'+cls)?box[b]:null).find(Boolean)||rect(0,0,0,0);}
   setPointerCapture(p){captures.set(p,this)}
   hasPointerCapture(p){return captures.get(p)===this}
   releasePointerCapture(p){if(captures.get(p)===this)captures.delete(p)}
 }
 const window=new Node('window'),panel=new Node('div');window.append(panel);
 let stage,grid,mac,drop;
 const inside=(r,x,y)=>x>=r.left&&x<r.right&&y>=r.top&&y<r.bottom;
 function pick(x,y){
   if(!inside(box.stage,x,y))return window;
   for(const n of grid?.children||[])if(inside(n.getBoundingClientRect(),x,y))return n;
   if(inside(box.grid,x,y))return grid;
   if(inside(box.mac,x,y))return drop;
   return stage;
 }
 const document={documentElement:{lang:'ko'},createElement:tag=>new Node(tag),querySelector:()=>null,
   querySelectorAll:s=>[...panel.walk()].filter(n=>n.matches(s)),elementFromPoint:pick};
 const ctx=vm.createContext({window,document,PointerEvent:Event,performance:{now:()=>time},
    setTimeout,clearTimeout,Date:{now:()=>time}});
 vm.runInContext(fileDemo,ctx);window.OneMouseFileDemo.mount(panel);
 stage=panel.querySelector('.om-file-stage');grid=panel.querySelector('.om-file-file-grid');
 mac=panel.querySelector('.om-file-mac-screen');drop=panel.querySelector('.om-file-drop');
 assert(stage&&grid&&mac&&drop);
 vm.runInContext(cursor,ctx);
 assert.equal(stage.dataset.omTrackpad,'');
 function move(type,x,y,at,pointerType='touch'){
   time=at;const pointerId=pointerType==='mouse'?3:5;
   const real=new Event(type,{isTrusted:true,pointerType,pointerId,isPrimary:true,button:0,
    buttons:type==='pointerup'?0:1,clientX:x,clientY:y,timeStamp:at,detail:1});
   (captures.get(pointerId)||pick(x,y)).dispatchEvent(real);
   if(type==='pointerup')captures.delete(pointerId);
 }
 const drag=(x0,y0,x1,y1,t,held,p='touch')=>{
   move('pointerdown',x0,y0,t,p);move('pointermove',x1,y1,t+held,p);move('pointerup',x1,y1,t+held+20,p);
 };
 const selected=()=>grid.children.filter(n=>n.attrs['aria-pressed']==='true').map(n=>n.dataset.omFile);
 const received=()=>[...mac.walk()].filter(n=>n.dataset.omReceived).map(n=>n.dataset.omReceived);
 const status=()=>panel.querySelector('.om-file-status').textContent;
 const cursorPosition=()=>{const marker=stage.querySelector('.om-demo-pointer');return [marker.style.left,marker.style.top];};
 return {move,drag,selected,received,status,trace,cursorPosition,pick,grid};
}

for(const pointerType of ['touch','pen']) {
 test(`${pointerType}: long-press empty Explorer space to select multiple files, then drag the group to Mac`,()=>{
  const h=harness();
  h.drag(200,140,95.2,182.4,0,80,pointerType); // swipe to park cursor in blank Explorer space
  assert.equal(h.pick(55,201),h.grid);
  const parked=h.cursorPosition();
  assert.match(parked[0],/^9\./); // about 55 px on the model 600 px stage
  h.move('pointerdown',55,201,200,pointerType);
  assert.deepEqual(h.cursorPosition(),parked);
  h.move('pointermove',159,155,520,pointerType); // 320 ms hold; drag over two file icons
  h.move('pointerup',159,155,540,pointerType);
  assert.deepEqual(h.selected(),['photo','work']);
  assert.match(h.status(),/2개 선택/);
  assert(h.trace.some(([event,,,,target])=>event==='pointerdown'&&target==='om-file-file-grid'));
  h.drag(185,143.5,103.4,159.9,650,80,pointerType); // move to the first selected icon
  h.drag(83,164,364.6,165.6,850,330,pointerType);    // hold the icon, then drop on Mac
  assert.deepEqual(h.received(),['photo','work']);
  assert.deepEqual(h.selected(),[]);
  assert.match(h.status(),/Mac에 도착/);
 });
}
test('mouse: native empty-space marquee and grouped drop still work without a hold',()=>{
 const h=harness();
 h.drag(55,201,185,143.5,200,50,'mouse');
 assert.deepEqual(h.selected(),['photo','work']);
 h.drag(83,164,435,166,400,100,'mouse');
 assert.deepEqual(h.received(),['photo','work']);
});
test('a short touch tap acts on the file under the cursor without teleporting',()=>{
 const h=harness();
 const start=h.cursorPosition();
 h.move('pointerdown',275,208,10,'touch'); // touch elsewhere; saved cursor starts over the PDF
 assert.deepEqual(h.cursorPosition(),start);
 h.move('pointerup',275,208,80,'touch');
 assert.deepEqual(h.selected(),['work']);
 assert.deepEqual(h.cursorPosition(),start);
 assert.deepEqual(h.received(),[]);
});
