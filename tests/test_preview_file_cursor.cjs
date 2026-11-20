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
const box={windows:rect(27,92,295,243),stage:rect(0,0,600,400),grid:rect(44,135,285,232),mac:rect(310,94,576,244),photo:rect(51,142,117,178),work:rect(125,142,191,178),note:rect(201,142,270,178)};
function harness(lang='ko') {
 const captures=new Map(),trace=[];let time=0,activeElement=null;
 class Event {
   constructor(type,data){Object.assign(this,{type,isTrusted:false},data)}
   preventDefault(){this.defaultPrevented=true}
   stopImmediatePropagation(){this.stopped=true}
 }
 class Node {
   constructor(tag){Object.assign(this,{tag,children:[],dataset:{},style:{},attrs:{},listeners:{},className:'',nodeType:1,isConnected:true});}
   append(...kids){for (const kid of kids)this.insertBefore(kid,null);}
   insertBefore(kid,before){
     if(kid.parent)kid.parent.children.splice(kid.parent.children.indexOf(kid),1);
     const i=before?this.children.indexOf(before):this.children.length;
     assert(i>=0);kid.parent=this;this.children.splice(i,0,kid);
   }
   focus(){activeElement=this;}
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
   click(){if(!this.disabled)this.dispatchEvent(new Event('click',{detail:0}));}
   getBoundingClientRect(){
    if(this.dataset.omReceived){
      const x=box.mac.left+parseFloat(this.style.left)*box.mac.width/100;
      const y=box.mac.top+parseFloat(this.style.top)*box.mac.height/100;
      return rect(x-27,y-10,x+27,y+25);
    }
    if(this.dataset.omFile)return box[this.dataset.omFile];
    return [['om-file-stage','stage'],['om-file-file-grid','grid'],['om-file-mac-screen','mac'],['om-file-received','mac'],['om-file-windows-screen','windows']].map(([cls,b])=>this.matches('.'+cls)?box[b]:null).find(Boolean)||rect(0,0,0,0);}
   setPointerCapture(p){captures.set(p,this)}
   hasPointerCapture(p){return captures.get(p)===this}
   releasePointerCapture(p){if(captures.get(p)===this)captures.delete(p)}
 }
 const window=new Node('window'),panel=new Node('div');window.append(panel);
 let stage,grid,mac,desktop;
 const inside=(r,x,y)=>x>=r.left&&x<r.right&&y>=r.top&&y<r.bottom;
 function pick(x,y){
   if(!inside(box.stage,x,y))return window;
   for(const n of grid?.children||[])if(inside(n.getBoundingClientRect(),x,y))return n;
   if(inside(box.grid,x,y))return grid;
   for(const n of desktop?.children||[])if(inside(n.getBoundingClientRect(),x,y))return n;
   if(inside(box.mac,x,y))return desktop;
   return stage;
 }
 const document={get activeElement(){return activeElement;},documentElement:{lang},createElement:tag=>new Node(tag),querySelector:()=>null,
   querySelectorAll:s=>[...panel.walk()].filter(n=>n.matches(s)),elementFromPoint:pick};
 const ctx=vm.createContext({window,document,PointerEvent:Event,performance:{now:()=>time},
    setTimeout,clearTimeout,Date:{now:()=>time}});
 vm.runInContext(fileDemo,ctx);window.OneMouseFileDemo.mount(panel);
 stage=panel.querySelector('.om-file-stage');grid=panel.querySelector('.om-file-file-grid');
 mac=panel.querySelector('.om-file-mac-screen');desktop=panel.querySelector('.om-file-received');
 assert(stage&&grid&&mac&&desktop);
 vm.runInContext(cursorSource,ctx);
 assert.equal(stage.dataset.omTrackpad,'');
 function move(type,x,y,at,pointerType='touch'){
   time=at;const pointerId=pointerType==='mouse'?3:5;
   const real=new Event(type,{isTrusted:true,pointerType,pointerId,isPrimary:true,button:0,
    buttons:type==='pointerup'?0:1,clientX:x,clientY:y,timeStamp:at,detail:1});
   (captures.get(pointerId)||pick(x,y)).dispatchEvent(real);
   if(type==='pointerup'||type==='pointercancel')captures.delete(pointerId);
 }
 const drag=(x0,y0,x1,y1,t,held,p='touch')=>{
   move('pointerdown',x0,y0,t,p);move('pointermove',x1,y1,t+held,p);move('pointerup',x1,y1,t+held+20,p);
 };
 const selected=()=>[...grid.children,...desktop.children].filter(n=>n.attrs['aria-pressed']==='true').map(n=>n.dataset.omFile);
 const received=()=>[...mac.walk()].filter(n=>n.dataset.omReceived).map(n=>n.dataset.omReceived);
 const status=()=>panel.querySelector('.om-file-status').textContent;
 const cursorPosition=()=>{const marker=stage.querySelector('.om-demo-pointer');return [marker.style.left,marker.style.top];};
 const file=id=>[...panel.walk()].find(n=>n.dataset.omFile===id);
 const state=()=>({
   windows:grid.children.map(n=>n.dataset.omFile),
   mac:received()
 });
 const actions=panel.querySelector('.om-file-actions').children;
 return {move,drag,selected,received,status,trace,cursorPosition,pick,grid,desktop,file,state,actions,
   focused:()=>document.activeElement};

}


const xy=(x,y)=>[x,y];
function center(node) {
 const r=node.getBoundingClientRect();
 return xy((r.left+r.right)/2,(r.top+r.bottom)/2);
}
function relative(h,p,to,physical,t,held=80) {
 const [x,y]=h.cursorPosition().map(parseFloat);
 const [originX,originY]=[x*6,y*4];
 h.drag(...physical,physical[0]+(to[0]-originX)/1.25,physical[1]+(to[1]-originY)/1.25,t,held,p);
}
const initial={windows:['photo','work','note'],mac:[]};
const afterGroup={windows:['note'],mac:['photo','work']};
function checkState(h,want) {
 const state=h.state();
 assert.deepEqual(state,want);
 assert.equal(new Set([...state.windows,...state.mac]).size,3);
 assert.equal(state.windows.length+state.mac.length,3);
}
for(const p of ['touch','pen']) {
 test(`${p}: multi-select on both sides, drag two files across and back without copies`,()=>{
  const h=harness();
  checkState(h,initial);
  const photo=h.file('photo'),work=h.file('work');
  const blankWindows=xy(55,205),blankMac=xy(372,211);
  relative(h,p,blankWindows,xy(200,150),10);
  assert.equal(h.pick(...blankWindows),h.grid);
  const parked=h.cursorPosition();
  h.move('pointerdown',...blankWindows,150,p);
  assert.deepEqual(h.cursorPosition(),parked);
  h.move('pointermove',159,155,470,p);
  h.move('pointerup',159,155,490,p);
  assert.deepEqual(h.selected(),['photo','work']);
  relative(h,p,center(photo),xy(185,145),550);
  relative(h,p,xy(435,165),center(photo),700,330);
  checkState(h,afterGroup);
  assert.equal(h.file('photo'),photo);assert.equal(h.file('work'),work);
  assert.match(h.status(),/Mac으로 옮겼어요/);
  assert.equal(h.pick(...blankMac),h.desktop);
  relative(h,p,blankMac,xy(433,166),1100);
  relative(h,p,xy(509,157),blankMac,1230,330);
  assert.deepEqual(h.selected(),['photo','work']);
  relative(h,p,center(photo),xy(509,157),1600);
  relative(h,p,xy(185,157),center(photo),1750,330);
  checkState(h,initial);
  assert.equal(h.file('photo'),photo);assert.equal(h.file('work'),work);
  assert.match(h.status(),/Windows로 옮겼어요/);
 });
}
test('mouse: blank marquee and grouped drag round trip, without a hold',()=>{
 const h=harness();
 h.drag(55,205,185,142,200,50,'mouse');
 assert.deepEqual(h.selected(),['photo','work']);
 h.drag(...center(h.file('photo')),435,165,400,80,'mouse');
 checkState(h,afterGroup);
 h.drag(372,211,509,157,600,50,'mouse');
 assert.deepEqual(h.selected(),['photo','work']);
 h.drag(...center(h.file('photo')),185,157,800,100,'mouse');
 checkState(h,initial);
});
test('mouse: a single file moves without a copy, and can be dragged back',()=>{
 const h=harness();
 h.drag(...center(h.file('note')),451,166,0,90,'mouse');
 checkState(h,{windows:['photo','work'],mac:['note']});
 h.drag(...center(h.file('note')),185,157,200,60,'mouse');
 checkState(h,initial);
});
test('invalid, same-side and canceled drops do not relocate files',()=>{
 const h=harness();
 h.drag(...center(h.file('photo')),288,183,0,90,'mouse'); // still on Windows
 checkState(h,initial);
 h.drag(...center(h.file('photo')),300,320,200,90,'mouse'); // outside both screens
 checkState(h,initial);
 h.move('pointerdown',...center(h.file('photo')),400,'mouse');
 h.move('pointermove',435,165,480,'mouse');
 h.move('pointercancel',435,165,500,'mouse');
 checkState(h,initial);
 assert.deepEqual(h.selected(),[]);
 h.drag(...center(h.file('photo')),435,165,600,100,'mouse');
 h.move('pointerdown',...center(h.file('photo')),800,'mouse');
 h.move('pointermove',185,157,880,'mouse');
 h.move('pointercancel',185,157,900,'mouse');
 checkState(h,{windows:['work','note'],mac:['photo']});
});
test('a short touch tap selects only the file under the cursor without teleporting',()=>{
 const h=harness();
 const start=h.cursorPosition();
 h.move('pointerdown',275,208,10,'touch');
 assert.deepEqual(h.cursorPosition(),start);
 h.move('pointerup',275,208,80,'touch');
 assert.deepEqual(h.selected(),['work']);
 assert.deepEqual(h.cursorPosition(),start);
 checkState(h,initial);
});
const labels={ko:['Mac으로 이동','Windows로 이동','다시 시작'],en:['Move to Mac','Move to Windows','Reset demo'],
 es:['Mover al Mac','Mover a Windows','Reiniciar la demo'],ja:['Macへ移動','Windowsへ移動','デモをリセット'],
 zh:['移到 Mac','移到 Windows','重置演示']};
for (const [lang,expect] of Object.entries(labels)) {
 test(`${lang}: accessible selection, move controls, focus and reset work both ways`,()=>{
  const h=harness(lang);
  const [move,reset]=h.actions;
  assert(move.disabled);
  assert.equal(reset.textContent,expect[2]);
  const file=h.file('photo');file.focus();file.click();
  assert.equal(file.getAttribute('aria-pressed'),'true');
  assert.equal(move.textContent,expect[0]);
  move.focus();move.click();
  checkState(h,{windows:['work','note'],mac:['photo']});
  assert.equal(h.focused(),file);
  file.click();assert.equal(move.textContent,expect[1]);
  move.focus();move.click();checkState(h,initial);
  file.click();move.click();reset.focus();reset.click();
  checkState(h,initial);assert(move.disabled);
 });
}
