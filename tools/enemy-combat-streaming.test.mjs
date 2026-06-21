import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const enemySource = await readFile(new URL('../src/Enemy.js', import.meta.url), 'utf8');
const streamingSource = await readFile(new URL('../src/WorldStreamingSystem.js', import.meta.url), 'utf8');

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
  subVectors(a, b) {
    this.x = (a.x || 0) - (b.x || 0);
    this.y = (a.y || 0) - (b.y || 0);
    this.z = (a.z || 0) - (b.z || 0);
    return this;
  }
  length() {
    return Math.hypot(this.x, this.y, this.z);
  }
  lengthSq() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }
  normalize() {
    const len = this.length() || 1;
    this.x /= len;
    this.y /= len;
    this.z /= len;
    return this;
  }
  multiplyScalar(s) {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
  }
  add(v) {
    this.x += v.x || 0;
    this.y += v.y || 0;
    this.z += v.z || 0;
    return this;
  }
  distanceTo(v) {
    return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z);
  }
  dot(v) {
    return this.x * (v.x || 0) + this.y * (v.y || 0) + this.z * (v.z || 0);
  }
}

class Node3D {
  constructor() {
    this.children = [];
    this.parent = null;
    this.userData = { parts: {} };
    this.position = new Vec3();
    this.rotation = new Vec3();
    this.scale = new Vec3(1, 1, 1);
    this.visible = true;
    this.isMesh = false;
  }
  add(child) {
    child.parent = this;
    this.children.push(child);
  }
  remove(child) {
    this.children = this.children.filter(c => c !== child);
    child.parent = null;
  }
  traverse(fn) {
    fn(this);
    for (const child of this.children) {
      if (child && typeof child.traverse === 'function') child.traverse(fn);
    }
  }
}

class Mesh extends Node3D {
  constructor() {
    super();
    this.isMesh = true;
  }
}

function createEnemyMesh() {
  const g = new Node3D();
  g.userData.parts = {};
  g.traverse = Node3D.prototype.traverse;
  return g;
}

const context = {
  console,
  window: {},
  navigator: { maxTouchPoints: 0 },
  performance: { now: () => 0 },
  setTimeout() {},
  THREE: {
    Vector3: Vec3,
    MathUtils: { clamp: (value, min, max) => Math.max(min, Math.min(max, value)) },
    Group: Node3D,
    Mesh,
    MeshBasicMaterial: class {},
    MeshStandardMaterial: class {},
    BoxGeometry: class {},
    SphereGeometry: class {},
    CylinderGeometry: class {},
    ConeGeometry: class {},
    IcosahedronGeometry: class {},
    DodecahedronGeometry: class {},
    TetrahedronGeometry: class {},
    LineBasicMaterial: class {},
    BufferGeometry: class {},
    Line: class extends Node3D {},
    DoubleSide: 'double'
  },
  AssetFactory: {
    createBokoblin: createEnemyMesh,
    createOctorok: createEnemyMesh,
    createChuchu: createEnemyMesh,
    createLizalfos: createEnemyMesh,
    createMoblin: createEnemyMesh,
    createLynel: createEnemyMesh,
    createWizzrobe: createEnemyMesh,
    createGuardian: createEnemyMesh,
    createPebblit: createEnemyMesh,
    createStoneTalus: createEnemyMesh,
    createHinox: createEnemyMesh,
    createMolduga: createEnemyMesh,
    createGleeok: createEnemyMesh,
    createCalamityGanon: createEnemyMesh,
    createPickupBeam: createEnemyMesh,
    createWeaponMesh: createEnemyMesh,
    createShieldMesh: createEnemyMesh,
    createBowMesh: createEnemyMesh,
    createApple: createEnemyMesh,
    createRupee: createEnemyMesh,
    createArmorMesh: createEnemyMesh
  },
  ITEMS: { rupee: { type: 'material' } },
  weightedDrop: () => [],
  Dialogue: { show() {}, showFloat() {} },
  Effects: { hitBurst() {}, enemyAttackCue() {} },
  AudioSystem: { play() {} },
  ExplorationSystem: { alertCamp() {} }
};
context.window = context;
vm.createContext(context);
vm.runInContext(`${enemySource}\nwindow.Enemy = Enemy;`, context, { filename: 'Enemy.js' });
vm.runInContext(streamingSource, context, { filename: 'WorldStreamingSystem.js' });

{
  const enemy = new context.window.Enemy('redBokoblin', 0, 0);
  enemy._streamTier = 'passive';
  enemy._streamActive = false;
  enemy.state = 'chase';
  const game = {
    player: { position: new Vec3(5, 0, 0) },
    currentWorld: {
      bounds: { minX: -50, maxX: 50, minZ: -50, maxZ: 50 },
      colliders: [],
      getTerrainAt() { return { inWater: false }; }
    }
  };
  enemy.update(0.1, game);
  assert.notEqual(enemy.state, 'idle', 'passive enemies should keep AI behavior during low-frequency updates');
  assert.ok(enemy.velocity.length() > 0, 'passive enemy AI should still chase or attack when updated');
}

{
  const enemy = new context.window.Enemy('redBokoblin', 80, 0);
  enemy._combatWakeTimer = 4;
  const forced = context.window.WorldStreamingSystem._forceEnemyActive(enemy, { lockedEnemy: null });
  assert.equal(forced, true, 'recently hit enemies should stay stream-active long enough to keep fighting');
}

{
  const enemy = new context.window.Enemy('redBokoblin', 0, 0);
  const game = {
    player: { position: new Vec3(4, 0, 0) },
    currentWorld: {
      bounds: { minX: -50, maxX: 50, minZ: -50, maxZ: 50 },
      colliders: [],
      getTerrainAt() { return { inWater: false }; }
    }
  };
  enemy.takeDamage(1, new Vec3(-1, 0, 0));
  assert.equal(enemy.state, 'hurt', 'enemy should visibly enter hurt state immediately after damage');
  for (let i = 0; i < 12; i++) enemy.update(0.08, game);
  assert.notEqual(enemy.state, 'hurt', 'enemy should leave hurt state after hit reaction timer ends');
  assert.ok(enemy.state === 'chase' || enemy.state === 'attack', 'enemy should resume combat after hit reaction');
}

console.log('enemy combat streaming ok');
