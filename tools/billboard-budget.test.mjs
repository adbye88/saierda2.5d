import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/BillboardPolishSystem.js', import.meta.url), 'utf8');

class Vector3 {
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
  clone() {
    return new Vector3(this.x, this.y, this.z);
  }
}

class Scale3 extends Vector3 {
  constructor() {
    super(1, 1, 1);
  }
}

class Node3D {
  constructor() {
    this.children = [];
    this.parent = null;
    this.position = new Vector3();
    this.scale = new Scale3();
    this.quaternion = { copy() {} };
    this.userData = {};
    this.visible = true;
  }
  add(child) {
    child.parent = this;
    this.children.push(child);
  }
}

class Group extends Node3D {}

class Mesh extends Node3D {
  constructor(geometry, material) {
    super();
    this.geometry = geometry;
    this.material = material;
  }
}

class Material {
  constructor(options = {}) {
    Object.assign(this, options);
  }
}

function loadSystem({ detailDensity = 0.26, detailRadius = 20 } = {}) {
  const context = {
    console,
    window: {},
    navigator: { maxTouchPoints: 0 },
    performance: { now: () => 1000 },
    ArtAssets: { billboardTexture() { return null; } },
    VisualQualitySystem: {
      level: 'low',
      getBudget() {
        return { effectiveLevel: 'low', detailDensity, detailRadius };
      }
    },
    THREE: {
      Group,
      Mesh,
      PlaneGeometry: class {},
      MeshBasicMaterial: Material,
      DoubleSide: 'double',
      AdditiveBlending: 'add',
      NormalBlending: 'normal'
    }
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(`${source}\nwindow.BillboardPolishSystem = BillboardPolishSystem;`, context, { filename: 'BillboardPolishSystem.js' });
  return context.window.BillboardPolishSystem;
}

function makeWorld() {
  return {
    name: 'grassland',
    scene: new Group(),
    spawnPoint: { x: 0, z: 0 },
    getTerrainAt() {
      return { inWater: false, slope: { height: 0 } };
    }
  };
}

{
  const BillboardPolishSystem = loadSystem({ detailDensity: 0.26, detailRadius: 20 });
  const world = makeWorld();
  const game = { currentWorld: world, player: { position: new Vector3(0, 0, 0) }, camera: { quaternion: {} } };
  BillboardPolishSystem.init(game);
  BillboardPolishSystem.update(0.016, game);
  const layer = world._billboardPolishLayer;
  const visibleCount = layer.items.filter(item => item.mesh.visible).length;
  assert.equal(visibleCount, 14, 'low budget should use detailDensity for billboard active count');
}

{
  const BillboardPolishSystem = loadSystem({ detailDensity: 1, detailRadius: 20 });
  const world = makeWorld();
  const game = { currentWorld: world, player: { position: new Vector3(0, 0, 0) }, camera: { quaternion: {} } };
  BillboardPolishSystem.init(game);
  const item = world._billboardPolishLayer.items[0];
  item.mesh.position.set(30, 0, 0);
  BillboardPolishSystem.update(0.016, game);
  assert.ok(Math.hypot(item.mesh.position.x, item.mesh.position.z) <= 20, 'billboard recycle radius should follow detailRadius budget');
}

console.log('billboard budget ok');
