import fs from 'node:fs';
import assert from 'node:assert/strict';

const assetFactory = fs.readFileSync(new URL('../src/core/AssetFactory.js', import.meta.url), 'utf8');
const streaming = fs.readFileSync(new URL('../src/WorldStreamingSystem.js', import.meta.url), 'utf8');

assert.match(
  assetFactory,
  /_streamLodDetail\s*\(/,
  'AssetFactory should tag optional static-asset submeshes for distance LOD'
);

for (const method of ['createTree', 'createPine', 'createRock', 'createBush', 'createGrassTuft', 'createBigTree']) {
  const start = assetFactory.indexOf(`${method}(`);
  assert.notEqual(start, -1, `${method} should exist`);
  const next = assetFactory.indexOf('\n  // ----------', start + 1);
  const block = assetFactory.slice(start, next === -1 ? assetFactory.length : next);
  assert.match(block, /_streamLodDetail\s*\(/, `${method} should mark optional detail meshes`);
}

assert.match(
  streaming,
  /_applyStaticAssetLod\s*\(/,
  'WorldStreamingSystem should apply static asset distance LOD'
);

assert.match(
  streaming,
  /obj\.visible\s*=\s*obj\.userData\.streamBaseVisible[\s\S]*?_applyStaticAssetLod\(obj,\s*distSq,\s*budget,\s*important\)/,
  'Visible streamed props should update static asset LOD after distance visibility is resolved'
);

assert.match(
  streaming,
  /streamLodDetail\s*!==\s*true/,
  'Static asset LOD should only affect explicitly tagged optional detail meshes'
);

console.log('static asset lod wiring ok');
