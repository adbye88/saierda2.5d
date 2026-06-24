import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../src/Effects.js', import.meta.url), 'utf8');

assert.match(
  source,
  /_disposeEffectObject\s*\(/,
  'Effects should centralize disposal of short-lived geometry/material resources'
);

assert.match(
  source,
  /_disposeEffectObject\s*\(\s*e\.mesh\s*\)/,
  'Expired effects should dispose their mesh/group resources after removal'
);

assert.match(
  source,
  /_disposeEffectObject\s*\(\s*s\s*\)/,
  'Expired spark side objects should also be disposed'
);

assert.match(
  source,
  /material\.dispose\s*\(/,
  'Effect cleanup should dispose materials without disposing shared textures'
);

assert.match(
  source,
  /geometry\.dispose\s*\(/,
  'Effect cleanup should dispose transient geometries'
);

console.log('effects disposal regression wiring ok');
