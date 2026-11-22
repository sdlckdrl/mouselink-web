'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'js/guide-handoff.js'), 'utf8');
class E {
  constructor(type) {
    this.type=type; this.attrs={}; this.dataset={}; this.events={}; this.style={}; this.children=[]; this.classes=[];
    this.classList={add:(i)=>this.classes.push(i)};
  }
  get firstChild(){ return this.children[0]; }
  set innerHTML(s) {
    if (this.type==='figure') {
      this.heading = new E('figcaption'); this.heading.append(new E('heading-span'));
      this.scene = new E('scene'); this.marker = new E('svg'); this.photo = new E('img');
      this.scene.append(this.photo,this.marker);
      this.buttons = [new E('button'),new E('button')];
      this.hint = new E('hint'); this.status = new E('status');
    } else if (this.type==='heading-span') this.circle=new E('circle');
  }
  append(...args){ this.children.push(...args); }
  remove(){ this.removed=true; }
  before(...sibs){ this.sibs=sibs; }
  add(option){ this.append(option); if (!this.value) this.value=option.value; }
  setAttribute(k,v){ this.attrs[k]=v; }
  addEventListener(k, fn) { (this.events[k]??=[]).push(fn); }
  trigger(k,p={}) { for(const fn of this.events[k]||[]) fn({target:this,preventDefault(){},...p}); }
  setPointerCapture(id){ this.pointerCapture=id; }
  getBoundingClientRect(){ return {left:0,top:0,width:100,height:100}; }
  focus(){ this.focused=true; }
  querySelector(s) {
    return ({'figcaption':this.heading,'.handoff-scene':this.scene,svg:this.children[1],img:this.children[0],
      '.handoff-hint':this.hint,'[role="status"]':this.status,circle:this.circle,':scope > figure.shot':this.shot})[s];
  }
  querySelectorAll(s) { if (s==='[data-side]') return this.buttons; throw Error(s); }
}
function create(locale, device){
  let observer;
  const step = new E('step'); step.id = device+'-handoff'; step.dataset.handoff=device; step.shot=new E('shot');
  const pending=[];
  class Image {set src(s){this.path=s; pending.push(this)} get src(){return this.path}}
  class Option {constructor(text,value){this.text=text;this.value=value}}
  class IntersectionObserver {
    constructor(cb){this.cb=cb; observer=this;}
    observe(target){this.target=target;}
    unobserve(target){assert.equal(target,this.target);}
    reach(){this.cb([{target:this.target,isIntersecting:true}]);}
  }
  const window = new E('window'); window.IntersectionObserver=IntersectionObserver;
  vm.runInNewContext(script,{window,Image,Option,IntersectionObserver,
    document:{documentElement:{lang:locale},querySelectorAll:()=>[step],createElement:(tag)=>new E(tag)}});
  assert.equal(pending.length,0); observer.reach(); assert.equal(pending.length,1);
  return {step,pending,window};
}
function mouse(scene,x,y){scene.trigger('pointermove',{pointerType:'mouse',clientX:x,clientY:y});}
function finger(scene,k,x,y,id=1){scene.trigger(k,{pointerType:'touch',clientX:x,clientY:y,button:0,pointerId:id});}
const bases={android:'android-notification-desk.webp',mac:'file-transfer-desk.webp',windows:'windows-handoff-desk.webp'};
for(const locale of ['ko','en','es','ja','zh']) for(const device of Object.keys(bases)) test(locale + ': ' + device + ' guide handoff', () => {
  const {step,pending,window} = create(locale,device);
  assert.ok(pending[0].src.endsWith(bases[device]));
  assert.ok(fs.existsSync(path.join(root,pending[0].src)));
  pending[0].onload();
  const [d,detail]=step.shot.sibs;
  assert.equal(detail.children[1],step.shot);
  assert.ok(detail.children[0].textContent);
  assert.equal(d.dataset.active,'source');
  assert.equal(d.dataset.shape,'arrow');
  assert.ok(d.scene.attrs['aria-label'].includes('Windows'));
  assert.equal(d.scene.attrs['aria-describedby'],d.hint.id);
  assert.ok(d.buttons[1].textContent);
  const p=()=> JSON.stringify(d.marker.style);
  const a=p();
  finger(d.scene,'pointerdown',90,63);
  assert.equal(p(),a,'New contact must not affect position');
  finger(d.scene,'pointermove',125,63);
  assert.equal(d.dataset.active,'target');
  assert.equal(d.dataset.shape,device==='android'?'dot':'arrow');
  assert.equal(d.buttons[1].attrs['aria-pressed'],'true');
  assert.ok(d.status.textContent.endsWith(d.buttons[1].textContent));
  finger(d.scene,'pointerup',125,63);
  const b=p();
  finger(d.scene,'pointerdown',75,55);
  assert.equal(p(),b,'Recontact must preserve position');
  finger(d.scene,'pointermove',10,55);
  assert.equal(d.dataset.active,'source');
  finger(d.scene,'pointercancel',10,55);
  const c=p();
  finger(d.scene,'pointermove',99,55);
  assert.equal(p(),c,'Canceled movement must stop');
  finger(d.scene,'pointerdown',10,55);
  window.trigger('blur');
  finger(d.scene,'pointermove',80,55);
  assert.equal(p(),c,'Blur must end movement');
  const target=device==='android'?[85,63]:[73,47];
  mouse(d.scene,25,46);
  assert.equal(d.dataset.active,'source');
  mouse(d.scene,...target);
  assert.equal(d.dataset.active,'target');
  mouse(d.scene,25,46);
  assert.equal(d.dataset.active,'source');
  d.trigger('keydown',{target:d.scene,key:'ArrowRight'});
  assert.equal(d.dataset.active,'target');
  d.trigger('keydown',{target:d.scene,key:'ArrowLeft',altKey:true});
  assert.equal(d.dataset.active,'target');
  d.trigger('keydown',{target:d.scene,key:'ArrowLeft'});
  assert.equal(d.dataset.active,'source');
  d.buttons[1].trigger('click');
  assert.equal(d.dataset.active,'target');
  d.buttons[0].trigger('click');
  assert.equal(d.dataset.active,'source');
  if(device==='android'){
    const sel=d.heading.children[1];
    sel.value='tablet';sel.trigger('change'); sel.value='phone';sel.trigger('change');
    pending[2].onload(); pending[1].onload();
    assert.ok(d.photo.src.endsWith(bases.android),'Out-of-order load must not replace selected desk');
    sel.value='tablet';sel.trigger('change'); pending[3].onerror();
    assert.equal(sel.value,'phone','Failed load must restore current selection');
    sel.value='tablet';sel.trigger('change'); pending[4].onload();
    assert.ok(d.photo.src.includes('tablet-gesture'));
    assert.ok(fs.existsSync(path.join(root,d.photo.src)));
    mouse(d.scene,76,55);
    assert.equal(d.dataset.shape,'dot');
    assert.equal(d.dataset.active,'target');
  }
});
