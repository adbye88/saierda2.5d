import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/CameraPolishSystem.js', import.meta.url), 'utf8');

assert.match(
  source,
  /_smoothHeading\s*\(/,
  'Camera polish should smooth heading changes with angle wrap handling'
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
  clone() {
    return new Vec3(this.x, this.y, this.z);
  }
  copy(v) {
    this.x = v.x || 0;
    this.y = v.y || 0;
    this.z = v.z || 0;
    return this;
  }
  add(v) {
    this.x += v.x || 0;
    this.y += v.y || 0;
    this.z += v.z || 0;
    return this;
  }
  subVectors(a, b) {
    this.x = (a.x || 0) - (b.x || 0);
    this.y = (a.y || 0) - (b.y || 0);
    this.z = (a.z || 0) - (b.z || 0);
    return this;
  }
  multiplyScalar(s) {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
  }
  setY(y) {
    this.y = y;
    return this;
  }
  lengthSq() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }
  normalize() {
    const len = Math.hypot(this.x, this.y, this.z) || 1;
    this.x /= len;
    this.y /= len;
    this.z /= len;
    return this;
  }
  lerp(v, alpha) {
    this.x += ((v.x || 0) - this.x) * alpha;
    this.y += ((v.y || 0) - this.y) * alpha;
    this.z += ((v.z || 0) - this.z) * alpha;
    return this;
  }
}

const THREE = {
  Vector3: Vec3,
  Raycaster: class Raycaster {},
  MathUtils: {
    clamp(v, min, max) {
      return Math.max(min, Math.min(max, v));
    }
  }
};

const context = {
  console,
  window: {},
  navigator: { maxTouchPoints: 0 },
  THREE,
  Input: { cameraDistance: 11, state: { shield: false } }
};
context.window = context;
vm.createContext(context);
vm.runInContext(source, context, { filename: 'CameraPolishSystem.js' });

const system = context.window.CameraPolishSystem;
system._smoothedHeading = Math.PI - 0.1;
const result = system._smoothHeading(-Math.PI + 0.1, 0.016, 'explore');

assert.ok(
  Math.abs(Math.abs(result) - Math.PI) < 0.5,
  'smoothed heading should wrap around the ±π seam instead of jumping through zero'
);

console.log('camera polish heading smoothing ok');
