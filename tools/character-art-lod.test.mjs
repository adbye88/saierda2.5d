import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../src/CharacterArtSystem.js', import.meta.url), 'utf8');

assert.match(
  source,
  /_markDetail\s*\(/,
  'Character art should explicitly mark decorative submeshes that can be hidden at distance'
);

assert.match(
  source,
  /detailRoots/,
  'Character art metadata should keep a list of detail roots for cheap LOD toggling'
);

assert.match(
  source,
  /_applyDetailLod\s*\(/,
  'Character art update should apply a cheap detail LOD pass'
);

assert.match(
  source,
  /detailLod:\s*fullVisual\s*\?\s*'full'\s*:\s*'reduced'/,
  'Passive streamed enemies should use reduced detail LOD while active enemies stay full detail'
);

assert.match(
  source,
  /characterArtDetail/,
  'Decorative character meshes should be tagged with characterArtDetail'
);

console.log('character art lod wiring ok');
