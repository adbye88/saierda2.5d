import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/VisualQualitySystem.js', import.meta.url), 'utf8');

function loadQualitySystem({ touch = false } = {}) {
  const context = {
    console,
    window: null,
    navigator: { maxTouchPoints: touch ? 1 : 0 },
    document: {
      documentElement: {
        classList: { remove() {}, add() {} },
        style: { setProperty() {} }
      },
      getElementById() { return null; },
      createElement() { return { id: '', style: {}, classList: { add() {}, remove() {}, toggle() {} } }; },
      body: { appendChild() {} }
    },
    localStorage: {
      getItem() { return null; },
      setItem() {}
    },
    THREE: {
      PCFSoftShadowMap: 'soft'
    }
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'VisualQualitySystem.js' });
  return context.window.VisualQualitySystem;
}

const desktop = loadQualitySystem();
assert.equal(typeof desktop.getBudget, 'function', 'VisualQualitySystem should expose getBudget()');

desktop.level = 'low';
const low = desktop.getBudget();
desktop.level = 'medium';
const medium = desktop.getBudget();
desktop.level = 'high';
const high = desktop.getBudget();
desktop.level = 'ultra';
const ultra = desktop.getBudget();

assert.equal(low.label, '流畅');
assert.ok(low.activeRadius < medium.activeRadius, 'medium should activate more nearby enemies than low');
assert.ok(medium.passiveRadius < high.passiveRadius, 'high should preserve more midrange enemies than medium');
assert.ok(high.landmarkRadius <= ultra.landmarkRadius, 'ultra should not reduce landmark visibility');
assert.ok(low.detailDensity < medium.detailDensity && medium.detailDensity < high.detailDensity, 'detail density should scale by quality');
assert.ok(low.enemyInterval > medium.enemyInterval && medium.enemyInterval > high.enemyInterval, 'low quality should update streaming less often');
assert.ok(low.particleFactor < high.particleFactor, 'effects budget should scale with quality');

const touchQuality = loadQualitySystem({ touch: true });
touchQuality.level = 'high';
const touchBudget = touchQuality.getBudget();
assert.equal(touchBudget.effectiveLevel, 'low', 'touch devices should clamp high/ultra budget to low by default');
assert.equal(touchBudget.realtimeShadows, false, 'touch budget should keep realtime shadows off');

console.log('quality budget mapping ok');
