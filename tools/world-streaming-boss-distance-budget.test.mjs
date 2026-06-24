import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../src/WorldStreamingSystem.js', import.meta.url), 'utf8');

const forceBody = source.match(/_forceEnemyActive\s*\([^)]*\)\s*\{([\s\S]*?)\n  \},\n\n  _enemyRadiusScale/);
assert.ok(forceBody, 'Should find _forceEnemyActive body');
assert.doesNotMatch(
  forceBody[1],
  /enemy\.boss|enemy\.miniBoss/,
  'Bosses and mini-bosses should not be forced active globally when far away'
);

assert.match(
  source,
  /_enemyRadiusScale\s*\(/,
  'Boss and mini-boss distance handling should use radius scaling instead of global force-active'
);

assert.match(
  source,
  /boss\s*\?\s*[\d.]+\s*:\s*enemy\s*&&\s*enemy\.miniBoss/,
  'Bosses should keep a larger streaming radius than normal enemies'
);

console.log('world streaming boss distance budget ok');
