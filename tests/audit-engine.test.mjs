import test from 'node:test';
import assert from 'node:assert/strict';
import {maskAlpha} from '../src/advanced-engine.js';
import {normalizeSettings} from '../src/engine.js';

test('one eraser stroke has the same feather at sparse and dense pointer sampling',()=>{
  const paint={points:[{x:.1,y:.5},{x:.9,y:.5}],radius:.4,feather:0};
  const erase=points=>maskAlpha({type:'brush',enabled:true,opacity:1,strokes:[paint,{points,radius:.2,feather:1,erase:true}]},101,101);
  const sparse=erase([{x:.2,y:.5},{x:.8,y:.5}]);
  const dense=erase(Array.from({length:61},(_,i)=>({x:.2+i*.01,y:.5})));
  assert.ok(Math.abs(sparse[60*101+50]-dense[60*101+50])<1e-6);
});

test('linear mask feather changes transition width and zero feather is a hard edge',()=>{
  const mask={type:'linear',enabled:true,opacity:1,start:{x:0,y:.5},end:{x:1,y:.5}};
  const hard=maskAlpha({...mask,feather:0},101,21),soft=maskAlpha({...mask,feather:1},101,21);
  assert.equal(hard[25],0);assert.equal(hard[75],1);
  assert.ok(soft[25]>0&&soft[75]<1);
});

test('linear gradient is perpendicular to its drag direction in image pixels',()=>{
  const mask={type:'linear',enabled:true,opacity:1,feather:1,start:{x:.1,y:.1},end:{x:.9,y:.9}};
  const alpha=maskAlpha(mask,200,100);
  // A displacement of (10,-20) pixels is perpendicular to the (160,80) pixel drag.
  assert.ok(Math.abs(alpha[50*200+100]-alpha[30*200+110])<1e-6);
});

test('duplicate mask identifiers are rejected rather than editing the wrong mask',()=>{
  assert.throws(()=>normalizeSettings({masks:[{id:'same',type:'radial'},{id:'same',type:'brush'}]}),/unique|duplicate/i);
});
