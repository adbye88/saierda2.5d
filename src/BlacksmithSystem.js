/* ========================================================
   BlacksmithSystem.js — 铁匠修理 / 强化
   - 消耗材料和卢比修理当前装备
   - 强化攻击、暴击率、暴击倍率
   - 强化字段写入 ItemStack 并随云存档序列化
   ======================================================== */

const BlacksmithSystem = {
  spawnInWorld(world, options = {}) {
    if (!world || typeof AssetFactory === 'undefined') return null;
    if (world._blacksmithSpawned) return null;
    world._blacksmithSpawned = true;
    const x = options.x !== undefined ? options.x : ((world.spawnPoint && world.spawnPoint.x) || 0) + 10;
    const z = options.z !== undefined ? options.z : ((world.spawnPoint && world.spawnPoint.z) || 0) - 10;
    const npc = AssetFactory.createMerchant ? AssetFactory.createMerchant(0xd0a060) : new THREE.Group();
    npc.position.set(x, 0, z);
    npc.userData.npc = true;
    npc.userData.name = options.name || '流浪铁匠';
    npc.userData.actionLabel = '铁匠';
    npc.userData.blacksmith = true;
    npc.userData.onTalk = () => {
      if (typeof BlacksmithUI !== 'undefined') BlacksmithUI.open();
      else if (typeof Dialogue !== 'undefined') Dialogue.show('铁匠台还没准备好。');
    };
    world.scene.add(npc);
    world.npcs.push({ mesh: npc });
    return npc;
  },

  repair(type = 'weapon', inventory = window.game && window.game.player && window.game.player.inventory) {
    const stack = this._stack(type, inventory);
    if (!stack) return this._fail('没有可修理的装备。');
    const max = stack.maxDurability || stack.def.durability || 0;
    if (!max || stack.durability >= max) return this._fail('这件装备耐久已满。');
    const cost = this.costForAction('repair', stack);
    if (!this._pay(inventory, cost)) return this._fail('材料或卢比不足，无法修理。');
    stack.durability = max;
    inventory._emit();
    this._ok(`修理完成：${inventory.getStackDisplayName ? inventory.getStackDisplayName(stack) : stack.name}`);
    return true;
  },

  upgradeAttack(type = 'weapon', inventory = window.game && window.game.player && window.game.player.inventory) {
    const stack = this._stack(type, inventory);
    if (!stack || !['weapon', 'bow'].includes(stack.def.type)) return this._fail('请选择武器或弓强化攻击。');
    if ((stack.bonusAtk || 0) >= 12) return this._fail('攻击强化已达上限。');
    const cost = this.costForAction('atk', stack);
    if (!this._pay(inventory, cost)) return this._fail('需要琥珀、火打石和卢比。');
    stack.bonusAtk = (stack.bonusAtk || 0) + 2;
    inventory._emit();
    this._ok(`攻击强化 +2：${inventory.getStackDisplayName ? inventory.getStackDisplayName(stack) : stack.name}`);
    return true;
  },

  upgradeCrit(type = 'weapon', inventory = window.game && window.game.player && window.game.player.inventory) {
    const stack = this._stack(type, inventory);
    if (!stack || !['weapon', 'bow'].includes(stack.def.type)) return this._fail('请选择武器或弓强化暴击率。');
    if ((stack.bonusCritChance || 0) >= 0.12) return this._fail('暴击率强化已达上限。');
    const cost = this.costForAction('crit', stack);
    if (!this._pay(inventory, cost)) return this._fail('需要怪物角、牙和卢比。');
    stack.bonusCritChance = Math.round(((stack.bonusCritChance || 0) + 0.015) * 1000) / 1000;
    inventory._emit();
    this._ok('暴击率强化完成。');
    return true;
  },

  upgradeCritMultiplier(type = 'weapon', inventory = window.game && window.game.player && window.game.player.inventory) {
    const stack = this._stack(type, inventory);
    if (!stack || !['weapon', 'bow'].includes(stack.def.type)) return this._fail('请选择武器或弓强化暴击倍率。');
    if ((stack.bonusCritMultiplier || 0) >= 0.6) return this._fail('暴击倍率强化已达上限。');
    const cost = this.costForAction('critMul', stack);
    if (!this._pay(inventory, cost)) return this._fail('需要琥珀、怪物内脏和卢比。');
    stack.bonusCritMultiplier = Math.round(((stack.bonusCritMultiplier || 0) + 0.1) * 100) / 100;
    inventory._emit();
    this._ok('暴击倍率强化完成。');
    return true;
  },

  repairCost(stack) {
    const missing = Math.max(1, (stack.maxDurability || stack.def.durability || 0) - (stack.durability || 0));
    const ore = stack.def.type === 'shield' ? 'flint' : 'amber';
    return [['wood', 1], [ore, Math.max(1, Math.ceil(missing / 25))], ['rupee', Math.max(12, Math.ceil(missing * 1.5))]];
  },

  costForAction(action, stack) {
    if (action === 'repair') return stack ? this.repairCost(stack) : [];
    if (action === 'atk') return [['amber', 2], ['flint', 2], ['rupee', 45]];
    if (action === 'crit') return [['bokoblinHorn', 2], ['bokoblinFang', 1], ['rupee', 35]];
    if (action === 'critMul') return [['amber', 3], ['bokoblinGuts', 1], ['rupee', 80]];
    return [];
  },

  canAfford(cost, inventory) {
    if (!inventory || !Array.isArray(cost)) return false;
    return cost.every(([id, count]) => (inventory.countOf ? inventory.countOf(id) : 0) >= count);
  },

  actionPlan(action, type = 'weapon', inventory = window.game && window.game.player && window.game.player.inventory) {
    const stack = this._stack(type, inventory);
    const cost = this.costForAction(action, stack);
    const validTarget = action === 'repair'
      ? !!stack
      : !!(stack && ['weapon', 'bow'].includes(stack.def.type));
    let blockedReason = '';
    if (!stack) blockedReason = '没有装备';
    else if (action === 'repair') {
      const max = stack.maxDurability || stack.def.durability || 0;
      if (!max || stack.durability >= max) blockedReason = '耐久已满';
    } else if (!validTarget) blockedReason = '只支持武器/弓';
    else if (action === 'atk' && (stack.bonusAtk || 0) >= 12) blockedReason = '已达上限';
    else if (action === 'crit' && (stack.bonusCritChance || 0) >= 0.12) blockedReason = '已达上限';
    else if (action === 'critMul' && (stack.bonusCritMultiplier || 0) >= 0.6) blockedReason = '已达上限';
    const canAfford = !blockedReason && this.canAfford(cost, inventory);
    return { action, type, stack, cost, canAfford, blockedReason };
  },

  _stack(type, inventory) {
    if (!inventory || !inventory.equipped) return null;
    return inventory.equipped[type] || null;
  },

  _pay(inventory, cost) {
    if (!inventory) return false;
    if (!this.canAfford(cost, inventory)) return false;
    for (const [id, count] of cost) inventory.remove(id, count);
    return true;
  },

  _fail(text) {
    if (typeof Dialogue !== 'undefined') Dialogue.show(text);
    return false;
  },

  _ok(text) {
    if (typeof Dialogue !== 'undefined') Dialogue.show('🔨 ' + text);
    if (typeof AudioSystem !== 'undefined') AudioSystem.play('pickup');
    if (window.game && window.game.player && typeof Effects !== 'undefined') Effects.pickupFlash(window.game.player.position.clone());
  }
};

if (typeof window !== 'undefined') window.BlacksmithSystem = BlacksmithSystem;
