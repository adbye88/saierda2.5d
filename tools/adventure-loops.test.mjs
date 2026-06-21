import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const exploration = await read('src/ExplorationSystem.js');
const item = await read('src/Item.js');
const inventory = await read('src/Inventory.js');
const cooking = await read('src/CookingSystem.js');
const baseScene = await read('src/World/BaseScene.js');
const questUi = await read('src/ui/QuestUI.js');
const html = await read('index.html');

await access(new URL('src/BountySystem.js', root));
const bounty = await read('src/BountySystem.js');

for (const key of [
  'clearedCamps',
  'harvestedNodes',
  'discoveredRecipes',
  'scannedCompendium',
  'rumorsHeard',
  'bounties'
]) {
  assert.ok(exploration.includes(key), `ExplorationSystem should initialize and persist ${key}`);
}

for (const api of [
  'addHarvestNode',
  '_updateHarvestNodes',
  'addRumor',
  '_updateRumors',
  'scanNearby',
  '_checkCampClear'
]) {
  assert.ok(exploration.includes(api), `ExplorationSystem should expose ${api}`);
}

assert.ok(/harvestNodes\s*:\s*\[/.test(baseScene), 'BaseScene default worlds should define harvest nodes');
assert.ok(/rumors\s*:\s*\[/.test(baseScene), 'BaseScene default worlds should define rumors');
assert.ok(/bounties\s*:\s*\[/.test(baseScene), 'BaseScene default worlds should define bounties');
assert.ok(baseScene.includes('ExplorationSystem.addHarvestNode'), 'BaseScene should register harvest nodes');
assert.ok(baseScene.includes('ExplorationSystem.addRumor'), 'BaseScene should register rumors');
assert.ok(baseScene.includes('BountySystem.registerWorld'), 'BaseScene should register bounty definitions');

assert.ok(item.includes('ITEM_MODIFIERS'), 'Item.js should define weapon/equipment modifiers');
assert.ok(item.includes('modifier'), 'ItemStack should store modifier data');
assert.ok(item.includes('rollModifier'), 'newItemStack should support rolled modifiers for drops/chests');
assert.ok(inventory.includes('mod:'), 'Inventory serialization should persist stack modifiers');
assert.ok(inventory.includes('getStackDisplayName'), 'Inventory should provide modifier-aware display names');
assert.ok(inventory.includes('bonusCritChance'), 'Inventory critical stats should include modifier crit bonus');

assert.ok(cooking.includes('recordRecipe'), 'CookingSystem should record discovered recipes');
assert.ok(cooking.includes('discoveredRecipes'), 'CookingSystem should persist discovered recipes');

for (const api of ['registerWorld', 'update', 'claim', 'rowsForWorld']) {
  assert.ok(bounty.includes(api), `BountySystem should expose ${api}`);
}
assert.ok(questUi.includes('BountySystem'), 'QuestUI should show and claim regional bounties');
assert.ok(html.includes('src/BountySystem.js'), 'index.html should load BountySystem before QuestUI');

console.log('adventure loop feature wiring ok');
