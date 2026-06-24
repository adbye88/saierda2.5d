import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../src/WorldStreamingSystem.js', import.meta.url), 'utf8');

assert.match(
  source,
  /_hideDormantStreamProps\s*\(/,
  'World streaming should hide cullable static props before the first near-player visibility pass'
);

assert.match(
  source,
  /this\._hideDormantStreamProps\s*\(\s*world\s*\)/,
  'applyWorld should initialize far static props as hidden instead of leaving full-detail models visible'
);

assert.match(
  source,
  /obj\.visible\s*=\s*false/,
  'Dormant stream prop initialization should actually hide full-detail static objects'
);

assert.match(
  source,
  /streamProxy\.visible\s*=\s*false/,
  'Dormant stream prop initialization should also keep proxy meshes hidden until the visibility pass decides otherwise'
);

console.log('world streaming initial hide wiring ok');
