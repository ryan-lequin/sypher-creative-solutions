'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../public/js/device-detector.js'), 'utf8');
function browser({threads=10, memory=4, width=1920, height=1080, webgl=true, saveData=false}={}) {
  const window = {};
  const context = {
    window,
    navigator: {hardwareConcurrency: threads, deviceMemory: memory, connection:{saveData}},
    screen: {width, height},
    document: {createElement: () => ({getContext: () => webgl ? {} : null})},
    matchMedia: () => ({matches:false})
  };
  vm.runInNewContext(source, context);
  return window.SypherDetector;
}

test('auto classification uses exact requested integer score bands', () => {
  const classify = browser().classifyScore;
  for (const score of [0, 1, 40, 69, 70]) assert.equal(classify(score), 'basic', 'score='+score);
  for (const score of [71, 75, 79, 80]) assert.equal(classify(score), 'medium', 'score='+score);
  for (const score of [81, 85, 99, 100]) assert.equal(classify(score), 'high', 'score='+score);
});

test('real browser estimates select auto mode using new bands', () => {
  const basic = browser({webgl:false}).detect();  // 28+22+0+15 = 65
  assert.equal(basic.score,65);
  assert.equal(basic.auto,'basic');

  const medium = browser({width:1280,height:800}).detect(); // 28+22+20+10 = 80
  assert.equal(medium.score,80);
  assert.equal(medium.auto,'medium');

  const high = browser().detect(); // 28+22+20+15 = 85
  assert.equal(high.score,85);
  assert.equal(high.auto,'high');
});

test('on-page threshold legend and explanation match detector', () => {
  const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
  const insights = fs.readFileSync(path.join(__dirname, '../public/js/adaptive-insights.js'), 'utf8');
  assert.match(html, /BASIC 0-70<\/span><span>MEDIUM 71-80<\/span><span>HIGH 81-100/);
  assert.match(insights, /Basic 0-70 · Medium 71-80 · High 81-100/);
});
