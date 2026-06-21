import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/World/BaseScene.js', import.meta.url), 'utf8');

class Node3D {
  constructor() {
    this.children = [];
    this.userData = {};
    this.position = { set() {} };
  }
  add(child) { this.children.push(child); }
  remove(child) { this.children = this.children.filter(c => c !== child); }
}

const context = {
  console,
  performance: { now: () => 0 },
  window: {},
  navigator: { maxTouchPoints: 0 },
  THREE: {
    Scene: class Scene extends Node3D {},
    HemisphereLight: class HemisphereLight extends Node3D {},
    DirectionalLight: class DirectionalLight extends Node3D {
      constructor() {
        super();
        this.shadow = { mapSize: { set() {} }, camera: {} };
        this.target = new Node3D();
      }
    },
    Mesh: class Mesh extends Node3D {},
    SphereGeometry: class SphereGeometry {},
    PlaneGeometry: class PlaneGeometry {},
    ShaderMaterial: class ShaderMaterial { constructor(opts = {}) { Object.assign(this, opts); } },
    MeshBasicMaterial: class MeshBasicMaterial { constructor(opts = {}) { Object.assign(this, opts); } },
    BackSide: 'back'
  },
  VisualQualitySystem: {
    getBudget() {
      return {
        effectiveLevel: 'low',
        passiveEnemyInterval: 0.3
      };
    }
  },
  Input: { justInteract: false, state: { interact: false }, _interactBuffer: 0 },
  ActionButtons: { setInteractVisible() {}, showInteract() {} }
};
context.window = context;
vm.createContext(context);
vm.runInContext(`${source}\nwindow.BaseScene = BaseScene;`, context, { filename: 'BaseScene.js' });

const scene = new context.window.BaseScene('test');
const calls = { active: 0, passive: 0, dormant: 0 };
scene.enemies = [
  { _streamTier: 'active', update() { calls.active++; } },
  { _streamTier: 'passive', _streamActive: false, update() { calls.passive++; } },
  { _streamTier: 'dormant', _streamActive: false, update() { calls.dormant++; } }
];

scene.update(0.1, { player: { position: { x: 0, z: 0 } } });
assert.equal(calls.active, 1, 'active enemies should update every frame');
assert.equal(calls.passive, 0, 'passive enemies should not update before budget interval elapses');
assert.equal(calls.dormant, 0, 'dormant enemies should not update');

scene.update(0.1, { player: { position: { x: 0, z: 0 } } });
scene.update(0.1, { player: { position: { x: 0, z: 0 } } });
assert.equal(calls.active, 3, 'active enemies should continue updating every frame');
assert.equal(calls.passive, 1, 'passive enemies should update only after accumulated budget interval');
assert.equal(calls.dormant, 0, 'dormant enemies should remain skipped');

console.log('base scene enemy streaming budget ok');
