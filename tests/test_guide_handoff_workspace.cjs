'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

class Node {
  constructor(tag) {
    Object.assign(this,{ tag, dataset:{}, children:[], events:{}, style:{}, attrs:{}, value:'',
      selectionStart:0, selectionEnd:0, hidden:false });
  }
  append(...nodes) {
    for (const n of nodes) {
      if (typeof n === 'string') { this.textContent = (this.textContent || '') + n; continue; }
      n.remove(); n.parentNode = this; this.children.push(n);
    }
  }
  remove() {
    if (!this.parentNode) return;
    const siblings = this.parentNode.children;
    siblings.splice(siblings.indexOf(this),1);
    this.parentNode = null;
  }
  replaceChildren(...nodes) { for (const n of [...this.children]) n.remove(); this.append(...nodes); }
  before(...nodes) {
    const parent = this.parentNode;
    for (const n of nodes) { n.remove(); n.parentNode = parent; }
    parent.children.splice(parent.children.indexOf(this),0,...nodes);
  }
  setAttribute(k,v) { this.attrs[k] = v; }
  getAttribute(k) { return this.attrs[k]; }
  addEventListener(k,f) { (this.events[k] ||= []).push(f); }
  closest(s) {
    const one = selector => selector[0] === '.'
      ? this.className === selector.slice(1)
      : selector === '[data-file]' ? 'file' in this.dataset
      : selector === '[data-note-launch]' ? 'noteLaunch' in this.dataset
      : false;
    return s.split(',').some(one) ? this : this.parentNode?.closest(s);
  }
  querySelectorAll(s) {
    return this.children.flatMap(n => [
      ...(s === '[data-file]' && 'file' in n.dataset ||
          s[0] === '.' && n.className === s.slice(1) ||
          s === n.tag ? [n] : []), ...n.querySelectorAll(s),
    ]);
  }
  querySelector(s) { return this.querySelectorAll(s)[0]; }
  contains(other) { return !!other && (other === this || this.contains(other.parentNode)); }
  emit(k,p = {}) {
    const e = {target:this, preventDefault(){this.defaultPrevented = true;},
      stopImmediatePropagation(){this.stopped = true;}, stopPropagation(){this.propagationStopped = true;}, ...p};
    for (const f of this.events[k] || []) { f(e); if (e.stopped) break; }
    return e;
  }
  getBoundingClientRect() {return {width:400,height:280,left:0,top:0};}
  focus() { this.focused = true; }
  setPointerCapture(id) { this.captured = id; }
  setRangeText(text,start,end) {
    this.value = this.value.slice(0,start) + text + this.value.slice(end);
    this.selectionStart = this.selectionEnd = start + text.length;
  }
}
const source = (file) => fs.readFileSync(path.join(__dirname,'..','js',file),'utf8');
function harness(lang = 'en') {
  const window = new Node('window');
  let hitNode = null;
  const document = {activeElement:null, elementFromPoint: () => hitNode, createElement(tag) {
    const node = new Node(tag);
    node.focus = () => { document.activeElement = node; };
    return node;
  }};
  let captures = [], side = 0;
  const demo = new Node('figure'), scene = new Node('div'), photo = new Node('img');
  scene.focus = () => { document.activeElement = scene; };
  const hint = new Node('p'); hint.className = 'handoff-hint';
  demo.append(scene,hint); scene.append(photo);
  const glass = [[[5,15],[45,15],[45,65],[5,65]],[[55,20],[95,20],[95,70],[55,70]]];
  const context = vm.createContext({window,document});
  vm.runInContext(source('guide-handoff-capture.js'),context);
  window.OneMouseGuideCapture = {...window.OneMouseGuideCapture, snapshot(args) {
    captures.push(args); return true;
  }};
  vm.runInContext(source('guide-handoff-workspace.js'),context);
  const workspace = window.OneMouseGuideWorkspace.mount({demo,scene,photo,lang,glass:()=>glass,
    device: i => ['Work PC','Other PC'][i], active:()=>side, select: i => { side=i; }, acquire: i => {side=i;}});
  workspace.setDesk('mac');
  const desks = scene.querySelectorAll('.handoff-desktop');
  const notes = () => desks.map(x => x.firstChild || x.children[0]).map(x => x.children[0]);
  const file = (side,id) => desks[side].querySelectorAll('[data-file]').find(f => f.dataset.file===id);
  const point = (event,x,y,target = scene,pointerType = 'touch',timeStamp = 0) => scene.emit(event,
    {clientX:x,clientY:y,target,pointerId:2,isPrimary:true,button:0,pointerType,timeStamp});
  const editors = desks.map(d => d.querySelector('.handoff-editor'));
  const fields = editors.map(e => e.querySelector('textarea'));
  const commands = i => editors[i].querySelector('.handoff-editor-tools').children;
  return {demo,scene,photo,captures,file,notes,point,fields,editors,commands,
    tools:demo.querySelector('.handoff-tools').children, desks, document, workspace,
    hit: (node) => { hitNode=node; }, choose: (i) => { side=i; },
    draft:()=>demo.querySelector('.handoff-capture-result'),
    send:()=>demo.querySelector('.handoff-result-actions').children[0],
    cancel:()=>demo.querySelector('.handoff-result-actions').children[1]};
}
const forbiddenClipboard = {getData(){throw new Error('External clipboard read');},
  setData(){throw new Error('External clipboard write');}};

test('notes are independent; Ctrl/Cmd copies a selection across screens without platform clipboard', () => {
  const h = harness();
  const [left,right] = h.fields;
  h.notes()[0].emit('click');
  left.value='select blue only';
  left.selectionStart=7; left.selectionEnd=11;
  assert.equal(left.emit('keydown',{key:'c',ctrlKey:true,clipboardData:forbiddenClipboard}).defaultPrevented,true);
  h.notes()[1].emit('click');
  right.value='Green '; right.selectionStart=right.selectionEnd=6;
  assert.equal(right.emit('keydown',{key:'v',metaKey:true,clipboardData:forbiddenClipboard}).defaultPrevented,true);
  assert.equal(right.value,'Green blue');
  assert.equal(left.value,'select blue only');
  const independent = harness();
  independent.notes()[0].emit('click');
  assert.equal(independent.fields[0].emit('paste',{clipboardData:forbiddenClipboard}).defaultPrevented,true);
  assert.equal(independent.fields[0].value,'');
});
test('notepad remains in the screen that launched it and stays independent on both sides', () => {
  const h = harness();
  assert.equal(h.editors[0].parentNode,h.desks[0]);
  assert.equal(h.editors[1].parentNode,h.desks[1]);
  assert.ok(h.editors.every(e => e.hidden));
  h.notes()[1].emit('click');
  assert.equal(h.editors[0].hidden,true);
  assert.equal(h.editors[1].hidden,false);
  assert.equal(h.notes()[1].getAttribute('aria-expanded'),'true');
  h.fields[1].value='keep this note';
  h.notes()[0].emit('click');
  assert.ok(h.editors.every(e => !e.hidden));
  h.commands(1)[2].emit('click');
  assert.equal(h.editors[0].hidden,false);
  assert.equal(h.editors[1].hidden,true);
  assert.equal(h.notes()[1].getAttribute('aria-expanded'),'false');
  h.notes()[1].emit('click');
  assert.equal(h.fields[1].value,'keep this note');
  assert.equal(h.editors[1].emit('pointerdown').propagationStopped,true);
});
test('visible touch controls copy and paste text using only the simulated buffer', () => {
  const h = harness('ko');
  h.notes()[0].emit('click');
  h.fields[0].value='공유할 텍스트';
  h.commands(0)[0].emit('click');
  h.notes()[1].emit('click');
  h.commands(1)[1].emit('click');
  assert.equal(h.fields[1].value,'공유할 텍스트');
});
test('files drag across and back with no copy; outside/cancel keeps owner', () => {
  const h = harness(), files = () => h.scene.querySelectorAll('[data-file]');
  assert.equal(files().length,3);
  h.point('pointerdown',50,70,h.file(0,'document')); h.point('pointermove',245,95);
  assert.equal(h.scene.querySelector('.handoff-drag').hidden,false);
  h.point('pointerup',245,95);
  assert.equal(h.file(0,'document'),undefined);
  assert.ok(h.file(1,'document'));
  assert.equal(files().length,3);
  h.point('pointerdown',245,95,h.file(1,'document')); h.point('pointermove',50,70);
  h.point('pointercancel',50,70);
  assert.ok(h.file(1,'document'));
  h.point('pointerdown',245,95,h.file(1,'document')); h.point('pointermove',50,70);
  h.point('pointerup',205,70);
  assert.ok(h.file(1,'document'));
  h.point('pointerdown',245,95,h.file(1,'document')); h.point('pointermove',50,70);
  h.point('pointerup',50,70);
  assert.ok(h.file(0,'document'));
  assert.equal(files().length,3);
  assert.equal(h.scene.querySelector('.handoff-drag').hidden,true);
});
test('selected capture shows the cropped virtual photo and appears as a movable file', () => {
  const h = harness();
  h.tools[1].emit('click');
  assert.ok('capturing' in h.scene.dataset);
  h.point('pointerdown',50,70); h.point('pointermove',135,130);
  assert.equal(h.scene.querySelector('.handoff-selection').hidden,false);
  h.point('pointerup',135,130);
  assert.equal(h.captures.length,1);
  const frame = h.captures[0];
  assert.equal(frame.photo,h.photo);
  assert.deepEqual({...frame.rect},{x:50,y:70,width:85,height:60});
  assert.equal(frame.icons.length,4);
  assert.equal(h.draft().hidden,false);
  assert.equal(h.draft().dataset.stage,'draft');
  assert.equal(h.file(0,'capture-1'),undefined);
  assert.equal(h.file(1,'capture-1'),undefined);
  h.send().emit('click');
  assert.equal(h.draft().dataset.stage,'received');
  assert.equal(h.file(0,'capture-1'),undefined);
  assert.ok(h.file(1,'capture-1'));
  h.tools[2].emit('click');
  assert.ok(h.file(0,'capture-1'));
  assert.ok(!('capturing' in h.scene.dataset));
  h.tools[1].emit('click');
  h.demo.emit('keydown',{key:'Escape',target:h.scene});
  assert.ok(!('capturing' in h.scene.dataset));
});
test('explicit capture on the active virtual screen can include its visible note only', () => {
  const h = harness();
  h.notes()[0].emit('click'); h.fields[0].value = 'Local demo note';
  h.notes()[1].emit('click'); h.fields[1].value = 'Other screen';
  h.notes()[0].emit('click');
  h.tools[1].emit('click');
  h.point('pointerdown',50,70); h.point('pointermove',135,130); h.point('pointerup',135,130);
  assert.equal(h.captures[0].panel.text,'Local demo note');
});

function groupTest(pointerType) {
  const h = harness();
  const bounds = (x) => ({left:x,top:50,width:20,height:20});
  h.file(0,'photo').getBoundingClientRect=()=>bounds(48);
  h.file(0,'document').getBoundingClientRect=()=>bounds(84);
  h.file(0,'archive').getBoundingClientRect=()=>bounds(138);
  h.point('pointerdown',115,92,h.scene,pointerType);
  h.point('pointermove',41,45,h.scene,pointerType);
  assert.equal(h.scene.querySelector('.handoff-selection').dataset.mode,'files');
  assert.equal(h.file(0,'photo').getAttribute('aria-pressed'),'true');
  h.point('pointerup',41,45,h.scene,pointerType);
  assert.equal(h.file(0,'document').getAttribute('aria-pressed'),'true');
  assert.equal(h.file(0,'archive').getAttribute('aria-pressed'),'false');
  assert.equal(h.captures.length,0);
  h.point('pointerdown',55,60,h.file(0,'photo'),pointerType);
  h.point('pointermove',250,105,h.scene,pointerType);
  h.point('pointerup',250,105,h.scene,pointerType);
  assert.ok(h.file(1,'photo') && h.file(1,'document') && h.file(0,'archive'));
  assert.ok(!h.file(0,'photo') && !h.file(0,'document'));
  h.point('pointerdown',250,105,h.file(1,'document'),pointerType);
  h.point('pointermove',80,90,h.scene,pointerType);
  h.point('pointerup',80,90,h.scene,pointerType);
  assert.ok(h.file(0,'photo') && h.file(0,'document') && h.file(0,'archive'));
  assert.equal(h.scene.querySelectorAll('[data-file]').length,3);
}
test('blank mouse marquee and group drag round trip, without triggering capture',()=>groupTest('mouse'));
test('the toolbar has no area-selection control and touch still supports group transfer', () => {
  const h = harness();
  assert.equal(h.tools.length,3);
  const photo = h.file(0,'photo'), plan = h.file(0,'document');
  h.point('pointerdown',55,60,photo,'touch',100);
  h.point('pointerup',55,60,photo,'touch',600);
  photo.emit('click',{detail:1});
  assert.equal(photo.getAttribute('aria-pressed'),'true');
  h.point('pointerdown',85,60,plan,'touch',650);
  h.point('pointerup',85,60,plan,'touch',700);
  plan.emit('click',{detail:1});
  assert.equal(photo.getAttribute('aria-pressed'),'true');
  assert.equal(plan.getAttribute('aria-pressed'),'true');
  h.point('pointerdown',85,60,plan,'touch',770);
  h.point('pointermove',250,105,h.scene,'touch',850);
  h.point('pointerup',250,105,h.scene,'touch',910);
  assert.ok(h.file(1,'photo') && h.file(1,'document') && h.file(0,'archive'));
  assert.ok(!h.file(0,'photo') && !h.file(0,'document'));
  assert.equal(h.captures.length,0);
  assert.equal(h.scene.querySelectorAll('[data-file]').length,3);
});

test('Ctrl+Alt+S is focus scoped and a canceled draft creates no file', () => {
  const h=harness(), shortcut={target:h.scene,code:'KeyS',key:'s',ctrlKey:true,altKey:true};
  assert.equal(h.demo.emit('keydown',shortcut).defaultPrevented,undefined);
  assert.ok(!('capturing' in h.scene.dataset));
  h.scene.focus();
  assert.equal(h.demo.emit('keydown',shortcut).defaultPrevented,true);
  h.point('pointerdown',50,70); h.point('pointermove',135,130);
  assert.equal(h.scene.querySelector('.handoff-selection').dataset.mode,'capture');
  h.point('pointerup',135,130);
  assert.equal(h.draft().dataset.stage,'draft');
  h.cancel().emit('click');
  assert.equal(h.draft().hidden,true);
  assert.equal(h.scene.querySelectorAll('[data-file]').length,3);
  h.scene.focus(); h.demo.emit('keydown',shortcut);
  h.demo.emit('keydown',{target:h.scene,key:'Escape'});
  assert.ok(!('capturing' in h.scene.dataset));
});


test('capture preview and its controls open only on main glass, regardless of capture origin', () => {
  const h = harness();
  assert.equal(h.draft().parentNode,h.desks[0]);
  assert.ok(h.draft().contains(h.send()) && h.draft().contains(h.cancel()));
  h.choose(1);
  h.tools[1].emit('click');
  h.point('pointerdown',250,70); h.point('pointermove',315,125); h.point('pointerup',315,125);
  assert.equal(h.draft().dataset.stage,'draft');
  assert.equal(h.draft().parentNode,h.desks[0]);
  assert.equal(h.desks[0].querySelector('.handoff-icons').inert,true);
  assert.equal(h.desks[1].querySelector('.handoff-icons').inert,undefined);
  assert.equal(h.document.activeElement,h.send());
  h.send().emit('click');
  assert.equal(h.draft().hidden,true,'the Windows preview must not cover the received Windows PNG');
  assert.ok(h.file(0,'capture-1'));
  assert.equal(h.document.activeElement,h.file(0,'capture-1'));
  h.file(0,'capture-1').emit('click');
  assert.equal(h.draft().dataset.stage,'received');
  assert.equal(h.draft().parentNode,h.desks[0]);
  h.demo.emit('keydown',{key:'Escape',target:h.draft()});
  assert.equal(h.draft().hidden,true);
  assert.equal(h.desks[0].querySelector('.handoff-icons').inert,false);
});


test('relative touch marquee is bounded, restores canceled selection, and group transfer round-trips', () => {
  const h = harness(), w = h.workspace;
  const bounds = left => () => ({left,top:50,width:20,height:20});
  h.file(0,'photo').getBoundingClientRect = bounds(48);
  h.file(0,'document').getBoundingClientRect = bounds(84);
  h.file(0,'archive').getBoundingClientRect = bounds(138);
  h.file(0,'archive').emit('click',{detail:1});
  h.hit(h.scene);
  const a={x:115,y:92}, b={x:41,y:45};
  assert.equal(w.beginRelativeTouch(7,0,a),'files');
  w.moveRelativeTouch(7,0,b);
  assert.equal(h.scene.querySelector('.handoff-selection').hidden,false);
  assert.equal(h.file(0,'photo').getAttribute('aria-pressed'),'true');
  w.endRelativeTouch(7,0,b,true);
  assert.equal(h.file(0,'photo').getAttribute('aria-pressed'),'false');
  assert.equal(h.file(0,'archive').getAttribute('aria-pressed'),'true');
  assert.equal(h.scene.querySelector('.handoff-selection').hidden,true);
  assert.equal(w.beginRelativeTouch(8,0,a),'files');
  w.endRelativeTouch(8,0,b);
  h.hit(h.file(0,'photo'));
  assert.equal(w.beginRelativeTouch(9,0,{x:54,y:56}),'drag');
  w.moveRelativeTouch(9,1,{x:260,y:95});
  assert.equal(h.scene.querySelector('.handoff-drag').hidden,false);
  w.endRelativeTouch(9,1,{x:260,y:95});
  assert.ok(h.file(1,'photo') && h.file(1,'document') && h.file(0,'archive'));
  assert.ok(!h.file(0,'photo') && !h.file(0,'document'));
  h.hit(h.file(1,'document'));
  assert.equal(w.beginRelativeTouch(10,1,{x:255,y:95}),'drag');
  w.endRelativeTouch(10,0,{x:75,y:90});
  assert.ok(h.file(0,'photo') && h.file(0,'document'));
  assert.equal(h.scene.querySelectorAll('[data-file]').length,3);
  h.hit(h.notes()[0]);
  assert.equal(w.beginRelativeTouch(11,0,{x:40,y:60}),null,'Never turn a notepad launcher into a drag start.');
  assert.equal(h.captures.length,0);
});
