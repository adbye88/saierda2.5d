import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/Effects.js', import.meta.url), 'utf8');

class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  copy(v) {
    this.x = v.x || 0;
    this.y = v.y || 0;
    this.z = v.z || 0;
    return this;
  }
  clone() {
    return new Vector3(this.x, this.y, this.z);
  }
  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
  addScaledVector(v, scale) {
    this.x += (v.x || 0) * scale;
    this.y += (v.y || 0) * scale;
    this.z += (v.z || 0) * scale;
    return this;
  }
}

class Node3D {
  constructor() {
    this.children = [];
    this.parent = null;
    this.position = new Vector3();
    this.rotation = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } };
    this.scale = { x: 1, y: 1, z: 1, setScalar(v) { this.x = v; this.y = v; this.z = v; } };
    this.userData = {};
  }
  add(child) {
    this.children.push(child);
    child.parent = this;
  }
  remove(child) {
    this.children = this.children.filter(c => c !== child);
    child.parent = null;
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
  clone() {
    return new Material({ ...this });
  }
}

function createContext(particleFactor) {
  const scene = new Group();
  const context = {
    console,
    window: {},
    VisualQualitySystem: {
      getBudget() {
        return { effectiveLevel: particleFactor < 1 ? 'low' : 'high', particleFactor };
      }
    },
    THREE: {
      Group,
      Mesh,
      Vector3,
      BoxGeometry: class {},
      TetrahedronGeometry: class {},
      SphereGeometry: class {},
      TorusGeometry: class {},
      RingGeometry: class {},
      PlaneGeometry: class {},
      MeshBasicMaterial: Material,
      MeshStandardMaterial: Material,
      DoubleSide: 'double',
      AdditiveBlending: 'add',
      NormalBlending: 'normal'
    }
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(`${source}\nwindow.Effects = Effects;`, context, { filename: 'Effects.js' });
  const Effects = context.window.Effects;
  Effects.attach(scene);
  Effects.active = [];
  return { Effects, scene, Vector3 };
}

function lastAddedGroup(scene) {
  for (let i = scene.children.length - 1; i >= 0; i--) {
    if (scene.children[i] instanceof Group) return scene.children[i];
  }
  return null;
}

{
  const { Effects, scene, Vector3 } = createContext(0.25);
  Effects.hitBurst(new Vector3(), 0xffaa44, 12);
  const group = lastAddedGroup(scene);
  assert.ok(group, 'hitBurst should still create a visible particle group');
  assert.equal(group.children.length, 3, 'low budget should scale 12 hit particles to 3');
}

{
  const { Effects, scene, Vector3 } = createContext(0.25);
  Effects.lowPolyShatter(new Vector3(), 0xd8c0a0, 16, 1);
  const group = lastAddedGroup(scene);
  assert.ok(group, 'lowPolyShatter should still create shards');
  assert.equal(group.children.length, 4, 'low budget should scale 16 shatter shards to 4');
}

{
  const { Effects, scene, Vector3 } = createContext(0.25);
  Effects.deathPuff(new Vector3(), 0xcc4444);
  const group = lastAddedGroup(scene);
  assert.ok(group, 'deathPuff should still create a visible puff');
  assert.equal(group.children.length, 5, 'low budget should scale 20 death particles to 5');
}

{
  const { Effects, scene, Vector3 } = createContext(0.25);
  Effects.footstep(new Vector3(), 'snowland', 1);
  const group = lastAddedGroup(scene);
  assert.ok(group, 'footstep should still keep ground feedback');
  assert.equal(group.children.length, 2, 'low budget should scale 6 snow footstep particles to at least 2');
}

{
  const { Effects, scene, Vector3 } = createContext(0.25);
  Effects.parrySpark(new Vector3());
  const sparkEntry = Effects.active.find(e => Array.isArray(e.sparks));
  assert.ok(sparkEntry, 'parrySpark should keep spark feedback');
  assert.equal(sparkEntry.sparks.length, 6, 'parrySpark should be budgeted but keep a strong minimum');
}

{
  const { Effects, scene, Vector3 } = createContext(0.25);
  Effects.dodgeAfterimage(new Vector3());
  const particleMeshes = scene.children.filter(child => child instanceof Mesh && child.geometry?.constructor?.name === 'SphereGeometry');
  assert.equal(particleMeshes.length, 3, 'dodgeAfterimage should scale 8 particles to 3');
}

{
  const { Effects, scene, Vector3 } = createContext(1);
  Effects.hitBurst(new Vector3(), 0xffaa44, 12);
  assert.equal(lastAddedGroup(scene).children.length, 12, 'high budget should preserve requested hit particle count');
}

console.log('effects particle budget ok');
