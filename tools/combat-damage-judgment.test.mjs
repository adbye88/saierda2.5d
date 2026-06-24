import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const resolverSource = await readFile(new URL('src/CombatResolver.js', root), 'utf8');
const enemySource = await readFile(new URL('src/Enemy.js', root), 'utf8');
const playerSource = await readFile(new URL('src/Player.js', root), 'utf8');

const context = { window: {} };
context.window = context;
vm.createContext(context);
vm.runInContext(`${resolverSource}\nwindow.CombatResolver = CombatResolver;`, context, { filename: 'CombatResolver.js' });

const { CombatResolver } = context.window;

assert.equal(typeof CombatResolver.isEnemyMeleeHit, 'function', 'CombatResolver should expose centralized enemy melee hit resolution');
assert.equal(typeof CombatResolver.resolveIncomingInvulnerability, 'function', 'CombatResolver should expose incoming damage invulnerability timing');

{
  const hit = CombatResolver.isEnemyMeleeHit({
    enemyPosition: { x: 0, z: 0 },
    playerPosition: { x: 0.72, z: 1.92 },
    enemyRadius: 0.6,
    playerRadius: 0.45,
    windupDir: { x: 0, z: 1 },
    profile: { range: 1.05, facingDot: 0.55, hitShape: 'arc' }
  });
  assert.equal(hit.hit, true, 'enemy melee should include player capsule radius near the edge of an arc');
}

{
  const miss = CombatResolver.isEnemyMeleeHit({
    enemyPosition: { x: 0, z: 0 },
    playerPosition: { x: 1.7, z: 1.0 },
    enemyRadius: 0.6,
    playerRadius: 0.45,
    windupDir: { x: 0, z: 1 },
    profile: { range: 2.0, facingDot: 0.75, hitShape: 'thrust', width: 0.32 }
  });
  assert.equal(miss.hit, false, 'enemy thrust should not hit wide side targets just because distance is close');
}

{
  const slam = CombatResolver.isEnemyMeleeHit({
    enemyPosition: { x: 0, z: 0 },
    playerPosition: { x: -2.2, z: 1.8 },
    enemyRadius: 2.4,
    playerRadius: 0.45,
    windupDir: { x: 0, z: 1 },
    profile: { range: 2.1, facingDot: 0.9, hitShape: 'slam' }
  });
  assert.equal(slam.hit, true, 'boss slam should use radial distance instead of a narrow facing cone');
}

{
  const light = CombatResolver.resolveIncomingInvulnerability({ outcome: 'hit', amount: 4 });
  const heavy = CombatResolver.resolveIncomingInvulnerability({ outcome: 'hit', amount: 40 });
  const block = CombatResolver.resolveIncomingInvulnerability({ outcome: 'blocked-damaged', amount: 40, shieldWear: 5 });
  assert.ok(light.invuln >= 0.45 && light.invuln < heavy.invuln, 'normal hit invulnerability should scale gently with damage');
  assert.ok(heavy.invuln <= 0.95, 'heavy hits should not lock the player out for too long');
  assert.ok(block.invuln < heavy.invuln, 'blocked chip damage should recover faster than a clean hit');
}

assert.ok(enemySource.includes('CombatResolver.isEnemyMeleeHit'), 'Enemy strike checks should use CombatResolver.isEnemyMeleeHit');
assert.ok(enemySource.includes("hitShape: 'thrust'"), 'Enemy profiles should identify thrust attacks');
assert.ok(enemySource.includes("hitShape: 'slam'"), 'Enemy profiles should identify radial boss slams');
assert.ok(playerSource.includes('CombatResolver.resolveIncomingInvulnerability'), 'Player damage handling should use CombatResolver invulnerability timing');

console.log('combat damage judgment ok');
