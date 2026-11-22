'use strict';
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

const window = {};
vm.runInNewContext(readFileSync(join(__dirname, '../js/guide-handoff-capture.js'), 'utf8'), {window});
const {crop, snapshot} = window.OneMouseGuideCapture;
const photo = {naturalWidth: 1200, naturalHeight: 800};
const bounds = {width: 300, height: 200};
const rect = {x: 25, y: 30, width: 80, height: 60};
function setup(tainted) {
  const log = [];
  const methods = ['drawImage', 'getImageData', 'setTransform', 'fillRect', 'fillText',
    'beginPath', 'moveTo', 'lineTo', 'closePath', 'fill', 'save', 'restore', 'rect', 'clip', 'measureText'];
  const ctx = Object.fromEntries(methods.map(name => [name, (...args) => {
    log.push([name,...args]);
    if (tainted && name === 'getImageData') throw new Error('tainted');
    if (name === 'measureText') return {width:args[0].length*5};
  }]));
  const canvas = {width:0, height:0, getContext: mode => { assert.equal(mode, '2d'); return ctx; }};
  return {log, canvas};
}

test('region selection clamps and accepts reversed drags', () => {
  const r = crop({x: 150, y: 85}, {x: 20, y:95}, {x:50, y:0, width:80, height:90});
  assert.deepEqual({...r}, {x:50, y:85, width:80, height:5});
  assert.equal(crop({x:NaN,y:0}, {x:0,y:0}, rect), null);
});

test('captures the selected part of the image and only overlapping synthetic desktop icons', () => {
  const {log, canvas} = setup();
  const icons = [{x:20,y:50,width:30,height:30,kind:'photo',label:'sample.webp'},
                 {x:215,y:100,width:30,height:30,kind:'note',label:'Notepad'}];
  assert.equal(snapshot({photo,bounds,rect,icons,canvas}), true);
  assert.deepEqual([canvas.width,canvas.height],[160,120]);
  assert.deepEqual(log[0], ['drawImage', photo, 100,120,320,240,0,0,160,120]);
  assert.deepEqual(log[2], ['setTransform',2,0,0,2,-50,-60]);
  assert.deepEqual(log.filter(call => call[0] === 'fillText').map(call => call[1]),['sample.webp']);
});

test('clips near scene edges and bounds output size', () => {
  const {log, canvas} = setup();
  assert.equal(snapshot({photo,bounds,rect:{x:-30,y:-10,width:50,height:35},canvas}), true);
  assert.deepEqual(log[0], ['drawImage', photo, 0,0,80,100,0,0,40,50]);
  assert.equal(snapshot({photo,bounds:{width:4000,height:3000},rect:{x:0,y:0,width:4000,height:3000},canvas}), true);
  assert.deepEqual([canvas.width,canvas.height],[1600,1200]);
});

test('invalid or tainted images cannot appear as successful captures', () => {
  const {canvas} = setup(true);
  assert.equal(snapshot({photo,bounds,rect,canvas}), false);
  assert.equal(canvas.width,0);
  assert.equal(snapshot({photo,bounds,rect:{...rect,width:1},canvas}), false);
  assert.equal(snapshot({photo:{},bounds,rect,canvas}), false);
  assert.equal(snapshot(), false);
});

test('visible notepad is painted only when its virtual display overlaps the crop', () => {
  const {log, canvas} = setup();
  const panel = {x:25,y:30,width:80,height:60,bodyY:45,title:'Notepad',text:'Demo note'};
  assert.equal(snapshot({photo,bounds,rect,panel,canvas}),true);
  assert.ok(log.some(c=>c[0]==='rect' && c[2]===45));
  assert.ok(log.some(c=>c[0]==='fillText' && c[1]==='Demo note'));
  log.length=0;
  assert.equal(snapshot({photo,bounds,rect,panel:{...panel,x:200},canvas}),true);
  assert.ok(!log.some(c=>c[0]==='fillText'));
});
