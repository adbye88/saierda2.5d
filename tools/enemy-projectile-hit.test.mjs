import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/World/BaseScene.js', import.meta.url), 'utf8');

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
  addScaledVector(v, scale) {
    this.x += (v.x || 0) * scale;
    this.y += (v.y || 0) * scale;
    this.z += (v.z || 0) * scale;
    return this;
  }
  multiplyScalar(s) {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
  }
  normalize() {
    const len = Math.hypot(this.x, this.y, this.z) || 1;
    this.x /= len;
    this.y /= len;
    this.z /= len;
    return this;
  }
  distanceTo(v) {
    return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z);
  }
}

class Node3D {
  constructor() {
    this.children = [];
    this.parent = null;
    this.userData = {};
    this.position = new Vec3();
  }
  add(child) {
    child.parent = this;
    this.children.push(child);
  }
  remove(child) {
    this.children = this.children.filter(c => c !== child);
    child.parent = null;
  }
}

class Mesh extends Node3D {
  constructor() {
    super();
    this.geometry = { type: 'SphereGeometry' };
  }
}

const context = {
  console,
  performance: { now: () => 0 },
  window: {},
  navigator: { maxTouchPoints: 0 },
  THREE: {
    Vector3: Vec3,
    Scene: class Scene extends Node3D {},
    HemisphereLight: class HemisphereLight extends Node3D {},
    DirectionalLight: class DirectionalLight extends Node3D {
      constructor() {
        super();
        this.shadow = { mapSize: { set() {} }, camera: {} };
        this.target = new Node3D();
      }
    },
    Mesh,
    SphereGeometry: class SphereGeometry {},
    PlaneGeometry: class PlaneGeometry {},
    ShaderMaterial: class ShaderMaterial { constructor(opts = {}) { Object.assign(this, opts); } },
    MeshBasicMaterial: class MeshBasicMaterial { constructor(opts = {}) { Object.assign(this, opts); } },
    BackSide: 'back'
  },
  Input: { justInteract: false, state: { interact: false }, _interactBuffer: 0 },
  ActionButtons: { setInteractVisible() {}, showInteract() {} }
};
context.window = context;
vm.createContext(context);
vm.runInContext(`${source}\nwindow.BaseScene = BaseScene;`, context, { filename: 'BaseScene.js' });

const scene = new context.window.BaseScene('test');
const projectile = new Mesh();
projectile.position.set(1.15, 1, 0);
projectile.userData = {
  velocity: new Vec3(0, 0, 0),
  damage: 5,
  fromEnemy: true,
  owner: { typeId: 'archerBokoblin' },
  life: 1
};
scene.projectiles = [projectile];
scene.enemies = [];
scene.breakables = [];
scene.scene = new Node3D();

let damageCalls = 0;
const game = {
  player: {
    position: new Vec3(0, 0, 0),
    takeDamage(amount) {
      damageCalls++;
      assert.equal(amount, 5);
      return 'hit';
    }
  }
};

scene._updateProjectiles(0.016, game);
assert.equal(damageCalls, 1, 'enemy projectile should hit the player capsule, not only the exact center point');
assert.equal(projectile.userData.life, 0, 'enemy projectile should expire after hitting player');

console.log('enemy projectile hit ok');
