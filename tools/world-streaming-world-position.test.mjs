import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/WorldStreamingSystem.js', import.meta.url), 'utf8');

assert.match(
  source,
  /_objectWorldPosition\s*\(/,
  'World streaming should resolve nested stream props using world position'
);

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
  add(v) {
    this.x += v.x || 0;
    this.y += v.y || 0;
    this.z += v.z || 0;
    return this;
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
  getWorldPosition(target) {
    target.copy(this.position);
    let p = this.parent;
    while (p) {
      target.add(p.position);
      p = p.parent;
    }
    return target;
  }
}

class Mesh extends Node3D {
  constructor() {
    super();
    this.isMesh = true;
  }
}

const context = {
  console,
  window: {},
  navigator: { maxTouchPoints: 0 },
  THREE: {
    Vector3: Vec3,
    Mesh,
    MeshBasicMaterial: class MeshBasicMaterial {},
    ConeGeometry: class ConeGeometry {},
    DoubleSide: 'double',
    AdditiveBlending: 'additive'
  },
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
        treeProxyRadius: 150,
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
const river = new Node3D();
river.position.set(-35, 0, 0);
scene.add(river);
const bankStone = new Mesh();
bankStone.userData.perfCull = true;
bankStone.userData.detailLayer = true;
bankStone.userData.kind = 'scenicDetail';
bankStone.position.set(7, 0, 20);
river.add(bankStone);

const world = { scene, enemies: [] };
const player = { position: new Vec3(-28, 0, 20), facing: 0 };
const streaming = context.window.WorldStreamingSystem;
streaming.applyWorld(world, { currentWorld: world, player });

assert.equal(
  bankStone.userData.streamCellKey,
  '-1,0',
  'nested stream detail should be bucketed by world position, not local position'
);

streaming._updateProps(world, player);
assert.equal(bankStone.visible, true, 'nested stream detail should remain visible when player is near its world position');

console.log('world streaming world position detail ok');
