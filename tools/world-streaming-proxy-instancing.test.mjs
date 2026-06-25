import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../src/WorldStreamingSystem.js', import.meta.url), 'utf8');

assert.match(
  source,
  /new\s+THREE\.InstancedMesh\s*\(/,
  'Stream proxies should use InstancedMesh batches when supported'
);

assert.match(
  source,
  /_beginProxyBatchFrame\s*\(/,
  'Proxy batches should be reset each visibility pass before queuing visible instances'
);

assert.match(
  source,
  /_queueStreamProxy\s*\(/,
  'Visible logical proxies should be queued into an instance batch instead of rendered one by one'
);

assert.match(
  source,
  /_endProxyBatchFrame\s*\(/,
  'Proxy batches should publish final instance counts after each visibility pass'
);

assert.match(
  source,
  /batchedProxy/,
  'Logical stream proxy meshes should be marked as batched so they do not add individual draw calls'
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
    this.quaternion = {};
    this.scale = new Vec3(1, 1, 1);
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

class InstancedMesh extends Mesh {
  constructor(geometry, material, capacity) {
    super(geometry, material);
    this.capacity = capacity;
    this.count = 0;
    this.instanceMatrix = { needsUpdate: false };
  }
  setMatrixAt(index, matrix) {
    this.lastMatrixIndex = index;
    this.lastMatrix = matrix;
  }
}

const THREE = {
  Vector3: Vec3,
  Group: Node3D,
  Mesh,
  InstancedMesh,
  Matrix4: class Matrix4 {
    compose(position, quaternion, scale) {
      this.position = position;
      this.quaternion = quaternion;
      this.scale = scale;
      return this;
    }
  },
  MeshBasicMaterial: class MeshBasicMaterial {
    constructor(opts = {}) { Object.assign(this, opts); }
  },
  ConeGeometry: class ConeGeometry {},
  CylinderGeometry: class CylinderGeometry {},
  BoxGeometry: class BoxGeometry {},
  SphereGeometry: class SphereGeometry {},
  AdditiveBlending: 'additive',
  DoubleSide: 'double'
};

const context = {
  console,
  window: {},
  navigator: { maxTouchPoints: 0 },
  THREE
};
context.window = context;
vm.createContext(context);
vm.runInContext(source, context, { filename: 'WorldStreamingSystem.js' });

const scene = new Node3D();
for (let i = 0; i < 80; i++) {
  const tree = new Mesh();
  tree.userData.kind = 'tree';
  tree.userData.perfCull = true;
  tree.position.set(i, 0, 90);
  scene.add(tree);
}

const world = { scene, enemies: [] };
const player = { position: new Vec3(0, 0, 0), facing: 0 };
context.window.WorldStreamingSystem.applyWorld(world, { currentWorld: world, player });

const treeBatch = world._streamProxyBatches && world._streamProxyBatches.get('tree');
assert.ok(treeBatch, 'tree stream proxies should create a shared InstancedMesh batch');
assert.equal(treeBatch.capacity, 80, 'batch capacity should account for all cached stream props before proxy creation');
const logicalTreeProxies = world._streamProps
  .map(obj => obj && obj.userData && obj.userData.streamProxy)
  .filter(Boolean);
assert.equal(logicalTreeProxies.length, 80, 'all logical tree proxies should still exist for visibility accounting');
assert.ok(
  logicalTreeProxies.every(proxy => proxy.geometry === treeBatch.mesh.geometry && proxy.material === treeBatch.mesh.material),
  'batched logical proxies should reuse the batch geometry/material instead of retaining one-off render resources'
);

console.log('world streaming proxy instancing wiring ok');
