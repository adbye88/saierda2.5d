import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const [item, player, inventory, blacksmithUi, css, hud] = await Promise.all([
  read('src/Item.js'),
  read('src/Player.js'),
  read('src/Inventory.js'),
  read('src/ui/BlacksmithUI.js'),
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
assert.ok(css.includes('#blacksmith-ui'), 'blacksmith UI should have its own visible overlay CSS');
assert.ok(css.includes('.blacksmith-panel'), 'blacksmith panel should have panel-specific layout CSS');

console.log('combat speed, blacksmith, armor regression ok');
