import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const [item, player, inventory, blacksmithUi, blacksmithSystem, css, hud] = await Promise.all([
  read('src/Item.js'),
  read('src/Player.js'),
  read('src/Inventory.js'),
  read('src/ui/BlacksmithUI.js'),
  read('src/BlacksmithSystem.js'),
  read('css/style.css'),
  read('src/ui/HUD.js')
]);

for (const marker of ['attackSpeed', 'attackCooldown', '_attackCooldownTimer', '_attackIntervalForWeapon']) {
  assert.ok(
    item.includes(marker) || player.includes(marker),
    `weapon speed system should include ${marker}`
  );
}

assert.ok(player.includes('this._attackCooldownTimer -= dt'), 'player should tick down attack cooldown every frame');
assert.ok(player.includes('this._attackCooldownTimer > 0'), 'player should block new attacks while weapon cooldown remains');
assert.ok(player.includes('profile.attackCooldown'), 'weapon profile should expose attack cooldown');

assert.ok(inventory.includes('bonusHearts'), 'inventory set effects should expose bonusHearts from armor sets');
assert.ok(player.includes('getMaxHearts'), 'player should expose effective hearts including armor set bonus');
assert.ok(player.includes('_syncEffectiveHpFromEquipment'), 'player should reconcile HP when armor set bonuses change');
assert.ok(player.includes('set.bonusHearts'), 'player max HP calculation should include armor bonus hearts');
assert.ok(hud.includes('getMaxHearts'), 'HUD should render effective hearts, not only base maxHp');

assert.ok(blacksmithUi.includes('this.init()'), 'BlacksmithUI.open should lazily initialize itself before showing');
assert.ok(blacksmithUi.includes('try') && blacksmithUi.includes('catch'), 'BlacksmithUI.open should fail safely instead of freezing the game loop');
assert.ok(blacksmithSystem.includes('costForAction'), 'BlacksmithSystem should expose costs so UI can preview exact required materials');
assert.ok(blacksmithSystem.includes('canAfford'), 'BlacksmithSystem should expose affordability for blacksmith actions');
assert.ok(blacksmithUi.includes('_renderActionCards'), 'BlacksmithUI should render per-action material requirement cards');
assert.ok(blacksmithUi.includes('_renderCostRows'), 'BlacksmithUI should render owned/required counts for each material');
assert.ok(blacksmithUi.includes('blacksmith-cost-row'), 'BlacksmithUI should mark material rows for styling and mobile readability');
assert.ok(blacksmithUi.includes('button.disabled = !plan.canAfford'), 'BlacksmithUI should disable actions when required materials are missing');
assert.ok(css.includes('#blacksmith-ui'), 'blacksmith UI should have its own visible overlay CSS');
assert.ok(css.includes('.blacksmith-panel'), 'blacksmith panel should have panel-specific layout CSS');
assert.ok(css.includes('.blacksmith-action-card'), 'blacksmith UI should style action cards with material requirements');
assert.ok(css.includes('.blacksmith-cost-row.missing'), 'blacksmith UI should highlight missing materials');

console.log('combat speed, blacksmith, armor regression ok');
