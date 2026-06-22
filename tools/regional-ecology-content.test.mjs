import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const [
  baseScene,
  exploration,
  enemy,
  crafting,
  grassland,
  forest,
  highland,
  snowland,
  volcano,
  desert,
  castle
] = await Promise.all([
  read('src/World/BaseScene.js'),
  read('src/ExplorationSystem.js'),
  read('src/Enemy.js'),
  read('src/CraftingSystem.js'),
  read('src/World/Grassland.js'),
  read('src/World/Forest.js'),
  read('src/World/Highland.js'),
  read('src/World/Snowland.js'),
  read('src/World/Volcano.js'),
  read('src/World/Desert.js'),
  read('src/World/HyruleCastle.js')
]);

function sectionForWorld(worldName) {
  const defsStart = baseScene.indexOf('const defs = {');
  assert.notEqual(defsStart, -1, 'missing exploration defs object');
  const start = baseScene.indexOf(`\n      ${worldName}: {`, defsStart);
  assert.notEqual(start, -1, `missing ${worldName} defaults`);
  const candidates = ['grassland', 'forest', 'highland', 'snowland', 'volcano', 'desert', 'castle']
    .filter(x => x !== worldName)
    .map(x => baseScene.indexOf(`\n      ${x}: {`, start + 1))
    .filter(x => x !== -1);
  const defsEnd = baseScene.indexOf('\n    };', start);
  const afterStart = candidates.filter(x => x > start);
  const end = afterStart.length ? Math.min(...afterStart) : defsEnd;
  return baseScene.slice(start, end);
}

function campBlock(worldName) {
  const section = sectionForWorld(worldName);
  const start = section.indexOf('camps: [');
  assert.notEqual(start, -1, `${worldName} should define camps`);
  const end = section.indexOf('\n        ]', start);
  assert.notEqual(end, -1, `${worldName} camp block should end`);
  return section.slice(start, end);
}

const expectedRegions = {
  grassland: ['redBokoblin', 'blueBokoblin', 'archerBokoblin', 'octorok', 'stal'],
  forest: ['redBokoblin', 'blueBokoblin', 'moblin', 'stal', 'yigaFootsoldier'],
  highland: ['redLizalfos', 'yellowLizalfos', 'shockChuchu', 'electricOctorok', 'blueMoblin'],
  snowland: ['iceChuchu', 'frostPebblit', 'iceWizzrobe', 'lynel'],
  volcano: ['fireChuchu', 'firePebblit', 'fireWizzrobe', 'redLizalfos'],
  desert: ['yellowLizalfos', 'electricOctorok', 'yigaFootsoldier', 'molduga'],
  castle: ['guardian', 'guardianSkywatcher', 'blackBokoblin', 'silverMoblin', 'maliceWizzrobe']
};

const minimumCamps = {
  grassland: 4,
  forest: 4,
  highland: 3,
  snowland: 3,
  volcano: 3,
  desert: 3,
  castle: 3
};

for (const [worldName, enemyTypes] of Object.entries(expectedRegions)) {
  const block = campBlock(worldName);
  const campCount = (block.match(/\{\s*id:\s*'/g) || []).length;
  assert.ok(campCount >= minimumCamps[worldName], `${worldName} should have at least ${minimumCamps[worldName]} registered ecology camps`);
  assert.ok(block.includes('enemyTypes'), `${worldName} camps should define regional enemyTypes`);
  for (const typeId of enemyTypes) {
    assert.ok(block.includes(typeId), `${worldName} camps should include ${typeId}`);
  }
}

for (const marker of ['camp.spawns', 'camp.enemyTypes', '_makeCampSpawnRing', 'row.radius || 0.65']) {
  assert.ok(exploration.includes(marker), `camp respawn should support ${marker}`);
}

assert.ok(enemy.includes('ENEMY_ECOLOGY'), 'Enemy definitions should be enriched with regional ecology metadata');
for (const typeId of new Set(Object.values(expectedRegions).flat())) {
  assert.ok(enemy.includes(`${typeId}:`), `Enemy ecology should mention ${typeId}`);
  assert.ok(enemy.includes('habitats'), 'Enemy ecology should include habitat lists');
  assert.ok(enemy.includes('threatTier'), 'Enemy ecology should include threat tiers');
}

const worldEnemyCorpus = [grassland, forest, highland, snowland, volcano, desert, castle].join('\n');
for (const [worldName, enemyTypes] of Object.entries(expectedRegions)) {
  for (const typeId of enemyTypes.filter(x => !['molduga', 'guardianSkywatcher'].includes(x))) {
    assert.ok(worldEnemyCorpus.includes(`'${typeId}'`) || worldEnemyCorpus.includes(`"${typeId}"`), `${typeId} should appear in a live world encounter list`);
  }
}

const craftMaterialBlock = crafting.slice(crafting.indexOf('const CRAFT_OVERRIDES'), crafting.indexOf('const CraftingSystem'));
const craftMaterials = [...craftMaterialBlock.matchAll(/([a-zA-Z][a-zA-Z0-9]*):\s*\d+/g)]
  .map(m => m[1])
  .filter(id => !['materials'].includes(id));

const sourceCorpus = [
  enemy,
  baseScene,
  grassland,
  forest,
  highland,
  snowland,
  volcano,
  desert,
  castle
].join('\n');

const missingSources = [...new Set(craftMaterials)].filter(id => !sourceCorpus.includes(`'${id}'`) && !sourceCorpus.includes(`"${id}"`));
assert.deepEqual(missingSources, [], `crafting materials should have loot, harvest, chest, or enemy drop sources: ${missingSources.join(', ')}`);

console.log('regional ecology content ok');
