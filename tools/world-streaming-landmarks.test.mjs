import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/WorldStreamingSystem.js', import.meta.url), 'utf8');

class Vec3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
  copy(v) {
    this.x = v.x || 0;
    this.y = v.y || 0;
    this.z = v.z || 0;
    return this;
  }
  clone() {
    return new Vec3(this.x, this.y, this.z);
  }
  setY(y) {
    this.y = y;
    return this;
  }
  normalize() {
    const len = Math.hypot(this.x, this.y, this.z) || 1;
    this.x /= len;
    this.y /= len;
    this.z /= len;
    return this;
  }
}

class Node3D {
  constructor() {
    this.children = [];
    this.userData = {};
    this.position = new Vec3();
    this.scale = new Vec3(1, 1, 1);
    this.rotation = new Vec3();
    this.visible = true;
    this.parent = null;
  }
  add(child) {
    child.parent = this;
    this.children.push(child);
  }
  traverse(fn) {
    fn(this);
    for (const child of this.children) child.traverse(fn);
  }
}

class Mesh extends Node3D {
  constructor(geometry = null, material = null) {
    super();
    this.geometry = geometry;
    this.material = material;
    this.isMesh = true;
  }
}

const THREE = {
  Vector3: Vec3,
  Group: Node3D,
  Mesh,
  Color: class Color {
    constructor(value) { this.value = value; }
  },
  MeshBasicMaterial: class MeshBasicMaterial {
    constructor(opts = {}) { Object.assign(this, opts); }
  },
  CylinderGeometry: class CylinderGeometry {},
  ConeGeometry: class ConeGeometry {},
  BoxGeometry: class BoxGeometry {},
  SphereGeometry: class SphereGeometry {},
  AdditiveBlending: 'additive',
  DoubleSide: 'double'
};

const context = {
  console,
  window: {},
  navigator: { maxTouchPoints: 0 },
  THREE,
  VisualQualitySystem: {
    level: 'low',
    getBudget() {
      return {
        effectiveLevel: 'low',
        activeRadius: 34,
        passiveRadius: 58,
        hideRadius: 72,
        propRadius: 34,
        detailRadius: 42,
        landmarkRadius: 64,
        silhouetteRadius: 180,
        frontBoost: 22,
        enemyInterval: 0.22,
        propInterval: 0.38
      };
    }
  }
};
context.window = context;
vm.createContext(context);
vm.runInContext(source, context, { filename: 'WorldStreamingSystem.js' });

const scene = new Node3D();
const shrine = new Mesh();
shrine.userData.kind = 'shrine';
shrine.userData.perfCull = true;
shrine.position.set(120, 0, 0);
scene.add(shrine);

const world = { scene, enemies: [] };
const player = { position: new Vec3(0, 0, 0) };
const streaming = context.window.WorldStreamingSystem;
streaming.applyWorld(world, { currentWorld: world, player });

assert.ok(shrine.userData.streamProxy, 'important landmarks should receive a lightweight stream proxy');

streaming._updateProps(world, player);

assert.equal(shrine.visible, false, 'far full-detail shrine should be hidden outside landmark radius');
assert.equal(shrine.userData.streamProxy.visible, true, 'far shrine proxy should remain visible inside silhouette radius');
assert.equal(streaming.snapshot().visibleProxies, 1, 'visible proxy should be counted for diagnostics');

console.log('world streaming landmark proxy ok');
