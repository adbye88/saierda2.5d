import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../src/Enemy.js', import.meta.url), 'utf8');

for (const method of [
  '_combatMovementProfile',
  '_moveCombatStyle',
  '_shouldUseRangedKeepAway',
  '_moveRangedKeepAway',
  '_telegraphAttackCue'
]) {
  assert.match(source, new RegExp(`${method}\\s*\\(`), `Enemy should expose ${method} for combat feel tuning`);
}

const attackStart = source.indexOf('_attack(dt, player, dist, game)');
assert.notEqual(attackStart, -1, 'Enemy._attack should exist');
const attackEnd = source.indexOf('\n  // ★ 不同敌人的蓄力时长', attackStart);
const attackBlock = source.slice(attackStart, attackEnd === -1 ? source.length : attackEnd);

assert.match(
  attackBlock,
  /const\s+movementProfile\s*=\s*this\._combatMovementProfile\(\)/,
  'Enemy._attack should resolve one combat movement profile per attack update'
);

assert.match(
  attackBlock,
  /this\._shouldUseRangedKeepAway\(dist,\s*movementProfile\)/,
  'Ranged enemies should check keep-away behavior before shooting'
);

assert.match(
  attackBlock,
  /this\._moveRangedKeepAway\(dt,\s*dir,\s*dist,\s*game,\s*movementProfile\)/,
  'Ranged enemies should reposition when the player gets too close'
);

assert.match(
  source,
  /\(\(this\.shootCD\s*\|\|\s*0\)\s*>\s*0\s*\|\|\s*dist\s*<\s*this\.radius\s*\+\s*1\.7\)/,
  'Ranged enemies should stop pure keep-away once they are far enough and ready to shoot'
);

assert.match(
  attackBlock,
  /this\._moveCombatStyle\(dt,\s*dir,\s*dist,\s*game,\s*movementProfile\)/,
  'Melee enemies should use tactical cooldown footwork instead of standing still'
);

assert.match(
  source,
  /this\._telegraphAttackCue\(profile\)/,
  'Attack windup should refresh lightweight threat cues for readability'
);

assert.match(
  source,
  /stoneTalus[\s\S]*return\s+1\.[01]/,
  'Large Talus-style bosses should have a longer readable windup'
);

console.log('enemy combat experience wiring ok');
