'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const test = require('node:test');
const source = fs.readFileSync(path.join(__dirname, '../js/preview-cursor-mode.js'), 'utf8');

function harness({selector='.om-file-stage', initial=[.31,.37], target='.om-file-grid', params={}} = {}) {
  const counts = [];
  class Event {
    constructor(type, input={}) { Object.assign(this, {type, isTrusted:false}, input); }
    preventDefault() { this.defaultPrevented = true; }
    stopImmediatePropagation() { this.stopped = true; }
  }
  class Node {
    constructor({name='', selector='', parent=null} = {}) {
      Object.assign(this,{name, selector, parent, dataset:{}, style:{}, isConnected:true, listeners:{}, attributes:{}});
    }
    addEventListener(name, handler, options={}) {
      (this.listeners[name] ||= []).push([handler, Boolean(options.capture)]);
    }
    emit(event, capture) {
      for (const [handler, atCapture] of this.listeners[event.type] || []) {
        if (capture === atCapture && !event.stopped) {
          event.currentTarget = this;
          handler(event);
        }
      }
    }
    dispatchEvent(event) {
      event.target = this;
      const parents = [this];
      while (parents.at(-1).parent) parents.push(parents.at(-1).parent);
      for (const node of [...parents].reverse()) node.emit(event,true);
      for (const node of parents) node.emit(event,false);
      return !event.defaultPrevented;
    }
    contains(child) { return child===this || !!child?.parent && this.contains(child.parent); }
    closest(sel) {
      if (sel === 'button:not(:disabled)' && this.name === 'button') return this;
      if (sel.split(',').includes(this.selector)) return this;
      return this.parent?.closest(sel) || null;
    }
    append(node) { node.parent=this; this.marker=node; }
    after(node) { this.hint=node; }
    getAttribute(key) { return this.attributes[key] || null; }
    setAttribute(key,value) { this.attributes[key]=value; }
    getBoundingClientRect() { return {left:10,top:20,right:410,bottom:320,width:400,height:300}; }
    querySelector() {return null;}
    click() { counts.push(['button']); }
  }
  const window = new Node();
  const outside = new Node({selector:'.outside',parent:window});
  const scene = new Node({selector,parent:window});
  const picked = new Node({name:'button',selector:target,parent:scene});
  const document = {
    documentElement:{lang:params.lang || 'ko'},
    querySelector:()=>null,
    querySelectorAll:s=>s===selector?[scene]:[],
    createElement:()=>new Node(),
    elementFromPoint:(x,y)=>x>=10 && x<410 && y>=20 && y<320 ? picked : null,
  };
  const clock = {value:0};
  vm.runInNewContext(source, {window,document,PointerEvent:Event,performance:{now:()=>clock.value}});
  for (const type of ['pointerdown','pointermove','pointerup','pointercancel']) {
    window.addEventListener(type,e=>{
      if (!e.isTrusted) counts.push([e.type,e.clientX,e.clientY,e.buttons,e.target===picked]);
    });
  }
  function send(type, {at=[360,260], age=0, to=scene, pointerType='touch', pointerId=7}={}) {
    clock.value=age;
    const event = new Event(type,{isTrusted:true,detail:1,button:0,pointerType,pointerId,isPrimary:true,
      clientX:at[0],clientY:at[1],timeStamp:age});
    to.dispatchEvent(event);
    return event;
  }
  function position() {return [parseFloat(scene.marker.style.left)/100, parseFloat(scene.marker.style.top)/100];}
  return {counts,initial,send,scene,picked,position,outside,window};
}

test('starts with a visible cursor and touch down never teleports; tap selects at that cursor once',()=>{
  const h=harness();
  assert.deepEqual(h.position(),h.initial);
  h.send('pointerdown');
  assert.deepEqual(h.position(),h.initial);
  h.send('pointerup',{age:80});
  assert.deepEqual(h.counts,[
    ['pointerdown',134,131,1,true],
    ['pointerup',134,131,0,true],
    ['button'],
  ]);
  assert.equal(h.send('click',{age:85}).defaultPrevented,true);
  assert.deepEqual(h.position(),h.initial);
});

test('swipe uses only deltas, release does not activate, and next tap keeps the moved location',()=>{
  const h=harness();
  h.send('pointerdown',{at:[40,250]});
  h.send('pointermove',{at:[120,226],age:95});
  h.send('pointerup',{at:[120,226],age:110});
  assert.deepEqual(h.counts.map(x=>x[0]),['pointermove']);
  assert.ok(Math.abs(h.position()[0]-.56)<1e-6);
  assert.ok(Math.abs(h.position()[1]-.27)<1e-6);
  h.send('pointerdown',{age:200});
  h.send('pointerup',{age:220});
  assert.ok(Math.abs(h.counts[1][1]-234)<1e-6);
  assert.ok(Math.abs(h.counts[1][2]-101)<1e-6);
});

test('hold and drag stays delivered outside the canvas, never paints an off-canvas cursor, and cancel does not click',()=>{
  const h=harness();
  h.send('pointerdown');
  h.send('pointermove',{at:[830,400],to:h.outside,age:300});
  h.send('pointercancel',{at:[830,400],to:h.outside,age:320});
  assert.deepEqual(h.counts.map(x=>x[0]),['pointerdown','pointermove','pointercancel']);
  assert.equal(h.position()[0],.99);
  assert.ok(h.position()[1] < 1);
  assert.equal(h.send('pointermove',{to:h.outside,age:350}).defaultPrevented,undefined);
});

test('desktop movement controls the visible marker but desktop clicks do not change it',()=>{
  const h=harness();
  h.send('pointermove',{at:[210,170],pointerType:'mouse'});
  assert.deepEqual(h.position(),[.5,.5]);
  h.send('pointerdown',{at:[320,260],pointerType:'mouse',age:20});
  h.send('pointerup',{at:[320,260],pointerType:'mouse',age:25});
  assert.deepEqual(h.position(),[.5,.5]);
  assert.deepEqual(h.counts,[]);
});

test('gamepad controls retain genuine direct touch and localized hints are added only around the relevant demo',()=>{
  const h=harness({selector:'.race-scene',target:'.race-joystick',params:{lang:'ja'}});
  const down=h.send('pointerdown',{to:h.picked});
  const up=h.send('pointerup',{to:h.picked,age:280});
  assert.equal(down.defaultPrevented,undefined);
  assert.equal(up.defaultPrevented,undefined);
  assert.equal(h.counts.length,0);
  assert.match(h.scene.hint.textContent,/指を滑らせる/);
  assert.equal(h.outside.getAttribute('aria-describedby'),null);
});
