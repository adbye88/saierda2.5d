import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const [resolver, player, baseScene, index] = await Promise.all([
  read('src/CombatResolver.js'),
  read('src/Player.js'),
  read('src/World/BaseScene.js'),
  read('index.html')
]);

for (const api of [
  'resolvePlayerMeleeDamage',
  'isPlayerMeleeHit',
  'resolvePlayerArrowDamage',
  'resolveBlockDamage',
  'pointToSegmentDistance2D'
]) {
  assert.ok(resolver.includes(api), `CombatResolver should expose ${api}`);
}

assert.ok(resolver.includes("hitShape === 'thrust'"), 'CombatResolver should support spear/thrust capsule hit checks');
assert.ok(resolver.includes("hitShape === 'heavy'"), 'CombatResolver should support heavy weapon wider arc checks');
assert.ok(resolver.includes('weakPointMultiplier'), 'CombatResolver should calculate weak point / headshot multipliers');
assert.ok(resolver.includes('shieldWear'), 'CombatResolver should return shield wear from block resolution');

assert.ok(player.includes('CombatResolver.resolvePlayerMeleeDamage'), 'Player melee damage should use centralized CombatResolver damage formula');
assert.ok(player.includes('CombatResolver.isPlayerMeleeHit'), 'Player melee hit test should use weapon-specific CombatResolver hit volumes');
assert.ok(player.includes("hitShape: 'thrust'"), 'spear weapon profile should identify thrust hit shape');
assert.ok(player.includes("hitShape: 'heavy'"), 'club/heavy weapon profile should identify heavy hit shape');
assert.ok(player.includes('CombatResolver.resolveBlockDamage'), 'Player shield damage should use centralized block resolution');

assert.ok(baseScene.includes('CombatResolver.resolvePlayerArrowDamage'), 'Projectile enemy hits should use centralized arrow damage and weak point logic');
assert.ok(baseScene.includes('weakPointMultiplier'), 'Projectile hits should expose weak point multiplier feedback');
assert.ok(index.includes('src/CombatResolver.js'), 'CombatResolver should load before Player, Enemy, and BaseScene');

console.log('combat resolver improvements ok');
