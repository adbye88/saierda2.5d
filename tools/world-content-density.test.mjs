import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const baseScene = await readFile(new URL('../src/World/BaseScene.js', import.meta.url), 'utf8');
const grassland = await readFile(new URL('../src/World/Grassland.js', import.meta.url), 'utf8');

function extractSupplyChestBlock(worldName) {
  const worldStart = baseScene.indexOf(`${worldName}: {`);
  assert.notEqual(worldStart, -1, `missing ${worldName} exploration defaults`);
  const supplyStart = baseScene.indexOf('supplyChests: [', worldStart);
  assert.notEqual(supplyStart, -1, `missing ${worldName} supply chests`);
  const korokStart = baseScene.indexOf('\n        koroks:', supplyStart);
  assert.notEqual(korokStart, -1, `missing ${worldName} korok section after supply chests`);
  return baseScene.slice(supplyStart, korokStart);
}

function countChestIds(worldName) {
  return (extractSupplyChestBlock(worldName).match(/\{\s*id:\s*'/g) || []).length;
}

function countGrasslandEnemySpots() {
  const start = grassland.indexOf('const enemySpots = [');
  assert.notEqual(start, -1, 'missing grassland enemySpots');
  const end = grassland.indexOf('];', start);
  assert.notEqual(end, -1, 'missing grassland enemySpots end');
  return (grassland.slice(start, end).match(/\[\s*-?\d+,\s*-?\d+,\s*'[^']+'\s*\]/g) || []).length;
}

function countGrasslandRouteClusters() {
  const start = grassland.indexOf('const clusters = [');
  assert.notEqual(start, -1, 'missing route detail clusters');
  const end = grassland.indexOf('];', start);
  assert.notEqual(end, -1, 'missing route detail clusters end');
  return (grassland.slice(start, end).match(/\{\s*x:\s*-?\d+,\s*z:\s*-?\d+,/g) || []).length;
}

const minimumSupplyChests = {
  grassland: 9,
  forest: 6,
  highland: 6,
  snowland: 6,
  volcano: 6,
  desert: 6,
  castle: 5
};

for (const [worldName, minimum] of Object.entries(minimumSupplyChests)) {
  assert.ok(
    countChestIds(worldName) >= minimum,
    `${worldName} should have at least ${minimum} supply chests`
  );
}

assert.ok(countGrasslandEnemySpots() >= 24, 'grassland should have at least 24 enemy encounter spawns');
assert.ok(countGrasslandRouteClusters() >= 12, 'grassland should have at least 12 route detail tree clusters');

console.log('world content density ok');
