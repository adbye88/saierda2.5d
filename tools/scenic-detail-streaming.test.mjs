import fs from 'node:fs';
import assert from 'node:assert/strict';

const grassland = fs.readFileSync(new URL('../src/World/Grassland.js', import.meta.url), 'utf8');
const artDirection = fs.readFileSync(new URL('../src/ArtDirectionSystem.js', import.meta.url), 'utf8');

assert.match(
  grassland,
  /_markScenicDetail\s*\(/,
  'Grassland should have a shared helper to mark non-critical scenic decals as streamable detail'
);

assert.match(
  grassland,
  /this\._markScenicDetail\s*\(\s*patch\s*\)/,
  'Grassland mud and road decal patches should be registered as streamable detail'
);

assert.match(
  artDirection,
  /_markScenicDetail\s*\(/,
  'Art direction should mark river bank decals and stones as streamable scenic detail'
);

assert.match(
  artDirection,
  /this\._markScenicDetail\s*\(\s*stone\s*\)/,
  'River bank stones should be streamable detail instead of always-rendered meshes'
);

console.log('scenic detail streaming wiring ok');
