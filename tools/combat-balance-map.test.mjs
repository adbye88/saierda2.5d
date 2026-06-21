import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const player = await read('src/Player.js');
const crafting = await read('src/CraftingSystem.js');
const mapMenu = await read('src/ui/MapMenu.js');
const saveSystem = await read('src/SaveSystem.js');

assert.ok(player.includes('_clampHp'), 'Player should centralize HP clamping');
assert.ok(player.includes('this._clampHp()'), 'Player damage paths should clamp HP after damage');
assert.ok(player.includes('_shieldDurabilityCost'), 'Player should scale shield wear by incoming damage');
assert.ok(player.includes('damageShield(shieldWear'), 'Normal guard should damage shields by scaled shield wear');
assert.ok(!player.includes('this.hp -= reduced;\n        this.inventory.damageShield(1);'), 'Normal guard should not be fixed 1 durability and should not leave negative HP');
assert.ok(!player.includes('this.hp -= amount;\n    if (typeof AudioSystem'), 'Direct damage should not leave negative HP before death handling');
assert.ok(saveSystem.includes('_clampLoadedPlayerHp'), 'SaveSystem should repair old cloud saves that contain negative player HP');

assert.ok(crafting.includes('MATERIAL_COST_MULTIPLIER: 2'), 'Crafting should globally double material requirements');
assert.ok(crafting.includes('_scaleMaterials'), 'Crafting should scale both override and default recipe materials');
assert.ok(crafting.includes('this._scaleMaterials'), 'Crafting recipeFor should apply scaled materials');

assert.ok(mapMenu.includes('_renderCurrentWorldMonsterMap'), 'MapMenu should render current area monster distribution');
assert.ok(mapMenu.includes('怪物分布'), 'MapMenu should show monster distribution labels');
assert.ok(mapMenu.includes('_enemyMarkerColor'), 'MapMenu should color-code enemy markers on the local map');

console.log('combat balance and monster map wiring ok');
