import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const html = await read('index.html');
const game = await read('src/core/Game.js');
const baseScene = await read('src/World/BaseScene.js');
const exploration = await read('src/ExplorationSystem.js');
const inventory = await read('src/Inventory.js');
const item = await read('src/Item.js');
const mapMenu = await read('src/ui/MapMenu.js');

await access(new URL('src/BloodMoonSystem.js', root));
await access(new URL('src/BlacksmithSystem.js', root));
await access(new URL('src/ui/BlacksmithUI.js', root));

const bloodMoon = await read('src/BloodMoonSystem.js');
const blacksmith = await read('src/BlacksmithSystem.js');
const blacksmithUi = await read('src/ui/BlacksmithUI.js');

assert.ok(html.includes('src/BloodMoonSystem.js'), 'index.html should load BloodMoonSystem');
assert.ok(html.includes('src/BlacksmithSystem.js'), 'index.html should load BlacksmithSystem');
assert.ok(html.includes('src/ui/BlacksmithUI.js'), 'index.html should load BlacksmithUI');
assert.ok(game.includes('BloodMoonSystem.update'), 'Game loop should update blood moon');

for (const api of ['init', 'update', 'trigger', 'refreshWorld', 'resetRepeatableProgress']) {
  assert.ok(bloodMoon.includes(api), `BloodMoonSystem should expose ${api}`);
}
for (const field of ['bloodMoon', 'lastCycle', 'count', 'nextAt']) {
  assert.ok(bloodMoon.includes(field), `BloodMoonSystem should persist ${field}`);
}
assert.ok(bloodMoon.includes('_saveTimer'), 'BloodMoonSystem should throttle progress writes instead of saving every frame');
assert.ok(!bloodMoon.includes('SaveSystem.setProgress && SaveSystem.setProgress(p);\n    this._updateAtmosphere'), 'BloodMoonSystem.update should not write cloud progress every frame');

assert.ok(exploration.includes('respawnHarvestNodes'), 'ExplorationSystem should respawn harvested nodes');
assert.ok(exploration.includes('respawnCamp'), 'ExplorationSystem should respawn cleared camps');
assert.ok(exploration.includes('camp.tier'), 'ExplorationSystem should track camp tier');
assert.ok(baseScene.includes('tier:'), 'BaseScene camps should define tiers');
assert.ok(baseScene.includes('_supplyChestDefs'), 'BaseScene should record supply chest definitions for region exploration');
assert.ok(baseScene.includes('_bloodMoonChestDefs'), 'BaseScene should record repeatable blood moon chest definitions');

for (const api of ['spawnInWorld', 'repair', 'upgradeAttack', 'upgradeCrit', 'upgradeCritMultiplier']) {
  assert.ok(blacksmith.includes(api), `BlacksmithSystem should expose ${api}`);
}
assert.ok(blacksmithUi.includes('BlacksmithUI'), 'BlacksmithUI should render a blacksmith panel');
assert.ok(baseScene.includes('BlacksmithSystem.spawnInWorld'), 'BaseScene should spawn blacksmith NPCs');

assert.ok(item.includes('bonusAtk'), 'ItemStack should support bonus attack from blacksmith upgrades');
assert.ok(item.includes('bonusCritChance'), 'ItemStack should support bonus crit chance from blacksmith upgrades');
assert.ok(item.includes('bonusCritMultiplier'), 'ItemStack should support bonus crit multiplier from blacksmith upgrades');
assert.ok(inventory.includes('ba:'), 'Inventory should serialize blacksmith attack upgrades');
assert.ok(inventory.includes('bc:'), 'Inventory should serialize blacksmith crit chance upgrades');
assert.ok(inventory.includes('bm:'), 'Inventory should serialize blacksmith crit multiplier upgrades');

for (const api of ['getRegionExploration', 'addMarkerAtPlayer', 'removeMarker', 'mapMarkers']) {
  assert.ok(mapMenu.includes(api), `MapMenu should expose ${api}`);
}
assert.ok(mapMenu.includes('探索度'), 'MapMenu should show region exploration');
assert.ok(mapMenu.includes('自定义标记'), 'MapMenu should support custom markers');

console.log('progression systems wiring ok');
