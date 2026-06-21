/* ========================================================
   Inventory.js v2 — 玩家背包数据
   - 分页：weapon/shield/bow/armor_upper/armor_lower/food/material/key
   - 装备槽：武器/盾/弓/上衣/裤子
   - 防具提供防寒/防火/防热抗性
   - 料理 buff 计时
   ======================================================== */

class Inventory {
  constructor() {
    this.slots = {
      weapon: [], shield: [], bow: [],
      armor_upper: [], armor_lower: [],
      food: [], material: [], key: []
    };
    this.equipped = {
      weapon: null, shield: null, bow: null,
      armor_upper: null, armor_lower: null
    };
    this.rupees = 0;
    this.arrows = 0;
    this.maxPerSlot = 99;
    this.listeners = [];

    // 活跃 buff：{ type, time }
    this.buffs = {};
  }

  onChange(fn) { this.listeners.push(fn); }
  _emit() { this.listeners.forEach(fn => fn()); }

  // ---------- 抗性（防具提供） ----------
  getResist() {
    const r = { cold: 0, fire: 0, heat: 0 };
    ['armor_upper', 'armor_lower'].forEach(t => {
      const a = this.equipped[t];
      if (a && a.def.resist) r[a.def.resist] += 1;
    });
    const set = this.getSetEffects();
    if (set.coldImmune) r.cold = Math.max(r.cold, 2);
    if (set.fireImmune) r.fire = Math.max(r.fire, 2);
    if (set.heatImmune) r.heat = Math.max(r.heat, 2);
    return r;
  }

  getSetBonus() {
    const upper = this.equipped.armor_upper;
    const lower = this.equipped.armor_lower;
    if (!upper || !lower || !upper.def.set || upper.def.set !== lower.def.set) return null;
    const def = (typeof ARMOR_SET_BONUSES !== 'undefined') ? ARMOR_SET_BONUSES[upper.def.set] : null;
    return def ? { id: upper.def.set, ...def } : null;
  }

  getSetEffects() {
    const bonus = this.getSetBonus();
    return bonus && bonus.effects ? bonus.effects : {};
  }

  getCriticalStats(type = 'weapon', stackOverride = null) {
    const stack = stackOverride || (type === 'bow' ? this.equipped.bow : this.equipped.weapon);
    const set = this.getSetEffects ? this.getSetEffects() : {};
    const progress = (typeof SaveSystem !== 'undefined' && SaveSystem.getProgress) ? SaveSystem.getProgress() : {};
    const upgrade = progress.upgrades || {};
    const mod = stack && stack.modifier ? stack.modifier : {};
    const baseChance = 0.01;
    const chance = Math.min(0.65,
      baseChance +
      ((stack && stack.def && stack.def.critChance) || 0) +
      (mod.bonusCritChance || 0) +
      (set.critChance || 0) +
      (type === 'bow' ? (set.bowCritChance || 0) : (set.meleeCritChance || 0)) +
      (upgrade.critChance || 0)
    );
    const multiplier = Math.min(3,
      Math.max(1,
        2 +
        ((stack && stack.def && stack.def.critMultiplierBonus) || 0) +
        (mod.bonusCritMultiplier || 0) +
        (set.critMultiplierBonus || 0) +
        (upgrade.critMultiplierBonus || 0)
      )
    );
    return { chance, multiplier };
  }

  getStackDisplayName(stack) {
    if (!stack || !stack.def) return '';
    return stack.modifier ? `${stack.modifier.name}·${stack.def.name}` : stack.def.name;
  }

  getStackAttack(stack) {
    if (!stack || !stack.def) return 0;
    return (stack.def.atk || 0) + ((stack.modifier && stack.modifier.bonusAtk) || 0);
  }

  getStackDefense(stack) {
    if (!stack || !stack.def) return 0;
    return (stack.def.def || 0) + ((stack.modifier && stack.modifier.bonusDef) || 0);
  }

  // ---------- 添加物品 ----------
  add(itemId, count = 1, options = {}) {
    const def = ITEMS[itemId];
    if (!def) return;
    if (def.type === 'material' && itemId === 'rupee') {
      this.rupees += count; this._emit(); return;
    }
    if (def.type === 'material' && itemId === 'arrow') {
      this.arrows += count; this._emit(); return;
    }

    const list = this.slots[def.type] || (this.slots[def.type] = []);
    if (def.stackable) {
      let stack = list.find(s => s.itemId === itemId && s.count < this.maxPerSlot);
      if (stack) { stack.count += count; this._emit(); return; }
    }
    const newStack = newItemStack(itemId, def.stackable ? count : 1, options);
    list.push(newStack);
    if (!def.stackable && count > 1) {
      for (let i = 1; i < count; i++) list.push(newItemStack(itemId, 1, options));
    }
    this._emit();
  }

  maxDurabilityOf(stack) {
    if (!stack || !stack.def) return 0;
    return stack.maxDurability || stack.def.durability || 0;
  }

  // ---------- 查询某物品数量（钥匙物/可堆叠物） ----------
  countOf(itemId) {
    const def = ITEMS[itemId];
    if (!def) return 0;
    if (itemId === 'rupee') return this.rupees;
    if (itemId === 'arrow') return this.arrows;
    let n = 0;
    for (const type in this.slots) {
      for (const s of this.slots[type]) {
        if (s.itemId === itemId) n += s.count;
      }
    }
    for (const type in this.equipped) {
      const s = this.equipped[type];
      if (s && s.itemId === itemId) n += s.count || 1;
    }
    return n;
  }

  // ---------- 移除指定数量的物品（用于兑换消耗） ----------
  remove(itemId, count = 1) {
    const def = ITEMS[itemId];
    if (!def) return;
    if (itemId === 'rupee') { this.rupees = Math.max(0, this.rupees - count); this._emit(); return; }
    if (itemId === 'arrow') { this.arrows = Math.max(0, this.arrows - count); this._emit(); return; }
    let need = count;
    for (const type in this.slots) {
      const list = this.slots[type];
      for (let i = list.length - 1; i >= 0 && need > 0; i--) {
        if (list[i].itemId === itemId) {
          if (list[i].count <= need) {
            need -= list[i].count;
            list.splice(i, 1);
          } else {
            list[i].count -= need;
            need = 0;
          }
        }
      }
    }
    this._emit();
  }

  // ---------- 装备 ----------
  equip(type, stack) {
    if (!stack) return;
    if (!this.equipped.hasOwnProperty(type)) return;
    const old = this.equipped[type];
    this.equipped[type] = stack;
    const list = this.slots[type];
    const idx = list.indexOf(stack);
    if (idx >= 0) list.splice(idx, 1);
    if (old) list.push(old);
    this._emit();
  }

  cycleEquip(type, dir = 1) {
    if (!['weapon', 'shield', 'bow'].includes(type)) return null;
    const pool = [];
    if (this.equipped[type]) pool.push(this.equipped[type]);
    for (const stack of this.slots[type]) pool.push(stack);
    if (pool.length === 0) return null;
    const currentIndex = this.equipped[type] ? pool.indexOf(this.equipped[type]) : -1;
    const next = pool[(currentIndex + dir + pool.length) % pool.length];
    if (next && next !== this.equipped[type]) this.equip(type, next);
    return this.equipped[type];
  }

  sellPrice(stackOrDef) {
    if (!stackOrDef) return 0;
    const def = stackOrDef.def || stackOrDef;
    const id = stackOrDef.itemId || Object.keys(ITEMS).find(k => ITEMS[k] === def) || '';
    if (id === 'rupee' || id === 'sheikahSlate' || id === 'spiritOrb' || id === 'heartContainer' || id === 'staminaVessel') return 0;
    const buy = ShopSystem && ShopSystem.basePrice ? ShopSystem.basePrice(id) : 0;
    if (buy > 0) {
      let rate = 0.35;
      if (def.type === 'material' || def.type === 'food') rate = 0.5;
      const maxDurability = stackOrDef.maxDurability || def.durability;
      const durabilityRate = maxDurability && stackOrDef.durability !== undefined
        ? Math.max(0.2, stackOrDef.durability / maxDurability)
        : 1;
      return Math.max(1, Math.round(buy * rate * durabilityRate));
    }
    if (def.type === 'weapon') return Math.max(3, Math.round((def.atk || 1) * 2.6));
    if (def.type === 'shield') return Math.max(3, Math.round((def.def || 1) * 3));
    if (def.type === 'bow') return Math.max(4, Math.round((def.atk || 1) * 3));
    if (def.type === 'armor_upper' || def.type === 'armor_lower') return Math.max(8, Math.round((def.def || 1) * 18));
    if (def.type === 'food') return Math.max(1, Math.round((def.heal || 1) * 2));
    if (def.type === 'material') {
      const prices = {
        amber: 30, opal: 35, ruby: 110, sapphire: 110, topaz: 110,
        ancientCore: 120, ancientScrew: 25, ancientShaft: 30, starFragment: 300,
        flint: 5, wood: 3, arrow: 2
      };
      return prices[id] || 8;
    }
    return 0;
  }

  sell(stack, count = 1) {
    if (!stack) return 0;
    const price = this.sellPrice(stack);
    if (price <= 0) return 0;
    const def = stack.def;
    const n = def.stackable ? Math.min(count, stack.count) : 1;
    this.rupees += price * n;
    if (def.stackable) {
      stack.count -= n;
      if (stack.count <= 0) this.drop(stack);
    } else {
      this.drop(stack);
    }
    this._emit();
    return price * n;
  }

  // ---------- 使用食物（含 buff） ----------
  useFood(stack) {
    if (!stack) return { heal: 0, buff: null };
    const def = stack.def;
    const heal = def.heal || 0;
    let buff = null;
    if (def.buff) {
      buff = { type: def.buff, time: def.buffDur || 120 };
      this.buffs[def.buff] = buff.time;
    }
    // hearty 系列额外回满血
    let extraHeal = 0;
    if (def.tag === 'hearty') extraHeal = 99;
    // stamina 系食物：先回一部分体力，再提供一段缓慢自动恢复
    if (def.tag === 'stamina' && window.game && window.game.player) {
      const player = window.game.player;
      const instant = def.subtype === 'cooked' ? 45 : 25;
      player.stamina = Math.min(player.maxStamina, player.stamina + instant);
      const regenTime = def.subtype === 'cooked' ? 45 : 24;
      this.buffs.staminaRegen = Math.max(this.buffs.staminaRegen || 0, regenTime);
      buff = { type: 'staminaRegen', time: this.buffs.staminaRegen };
    }
    stack.count -= 1;
    const list = this.slots.food;
    if (stack.count <= 0) {
      const idx = list.indexOf(stack);
      if (idx >= 0) list.splice(idx, 1);
    }
    this._emit();
    return { heal: heal + extraHeal, buff };
  }

  // ---------- buff 计时（每帧调用） ----------
  tickBuffs(dt) {
    let changed = false;
    for (const k in this.buffs) {
      this.buffs[k] -= dt;
      if (this.buffs[k] <= 0) { delete this.buffs[k]; changed = true; }
    }
    return changed;
  }
  hasBuff(type) { return !!this.buffs[type]; }

  // ---------- 丢弃 ----------
  drop(stack) {
    for (const type in this.slots) {
      const list = this.slots[type];
      const idx = list.indexOf(stack);
      if (idx >= 0) { list.splice(idx, 1); this._emit(); return; }
    }
    for (const type in this.equipped) {
      if (this.equipped[type] === stack) {
        this.equipped[type] = null;
        this._emit();
        return;
      }
    }
  }

  // ---------- 消耗武器/盾/弓耐久 ----------
  _handleBrokenEquipment(type, stack, immortalId = null) {
    if (!stack) return;
    if (immortalId && stack.itemId === immortalId) {
      stack.durability = Math.max(1, stack.durability);
      return;
    }
    const label = { weapon: '武器', shield: '盾牌', bow: '弓' }[type] || '装备';
    const brokenName = stack.name;
    Dialogue.show(`【${brokenName}】损坏了！`);
    this.equipped[type] = null;
    this._emit();
    if (window.game && window.game.player) window.game.player.refreshEquipment();
    const ui = (typeof window !== 'undefined' && window.QuickEquipUI)
      ? window.QuickEquipUI
      : (typeof QuickEquipUI !== 'undefined' ? QuickEquipUI : null);
    if (ui && ui.prompt) {
      setTimeout(() => ui.prompt(type, brokenName), 0);
    } else if (typeof Dialogue !== 'undefined') {
      Dialogue.show(`备用${label}可在背包中装备`);
    }
  }

  damageWeapon(amount = 1) {
    const w = this.equipped.weapon;
    if (!w) return;
    w.durability -= amount;
    if (w.durability <= 0) this._handleBrokenEquipment('weapon', w, 'masterSword');
  }
  damageShield(amount = 1) {
    const s = this.equipped.shield;
    if (!s) return;
    s.durability -= amount;
    if (s.durability <= 0) this._handleBrokenEquipment('shield', s, 'hylianShield');
  }
  damageBow(amount = 1) {
    const b = this.equipped.bow;
    if (!b) return;
    b.durability -= amount;
    if (b.durability <= 0) this._handleBrokenEquipment('bow', b);
  }

  // ---------- 序列化（存档用） ----------
  serialize() {
    const serStack = (s) => s ? ({ id: s.itemId, c: s.count, d: s.durability, md: s.maxDurability, src: s.source, mod: s.modifier ? s.modifier.id : null }) : null;
    const ser = (list) => list.map(serStack);
    return {
      rupees: this.rupees, arrows: this.arrows,
      slots: {
        weapon: ser(this.slots.weapon),
        shield: ser(this.slots.shield),
        bow: ser(this.slots.bow),
        armor_upper: ser(this.slots.armor_upper),
        armor_lower: ser(this.slots.armor_lower),
        food: ser(this.slots.food),
        material: ser(this.slots.material),
        key: ser(this.slots.key)
      },
      equipped: {
        weapon: this.equipped.weapon ? this.equipped.weapon.itemId : null,
        shield: this.equipped.shield ? this.equipped.shield.itemId : null,
        bow: this.equipped.bow ? this.equipped.bow.itemId : null,
        armor_upper: this.equipped.armor_upper ? this.equipped.armor_upper.itemId : null,
        armor_lower: this.equipped.armor_lower ? this.equipped.armor_lower.itemId : null
      },
      equippedStacks: {
        weapon: serStack(this.equipped.weapon),
        shield: serStack(this.equipped.shield),
        bow: serStack(this.equipped.bow),
        armor_upper: serStack(this.equipped.armor_upper),
        armor_lower: serStack(this.equipped.armor_lower)
      },
      buffs: { ...this.buffs }
    };
  }

  // ---------- 反序列化（读档用） ----------
  deserialize(data) {
    this.rupees = data.rupees || 0;
    this.arrows = data.arrows || 0;
    const restoreStack = (s) => {
      const stack = new ItemStack(s.id, s.c, { source: s.src || 'world', durability: s.d, modifier: s.mod });
      if (s.md !== undefined) stack.maxDurability = s.md;
      if (s.d !== undefined) stack.durability = s.d;
      return stack;
    };
    for (const type in data.slots) {
      this.slots[type] = (data.slots[type] || []).map(restoreStack);
    }
    for (const t of ['weapon','shield','bow','armor_upper','armor_lower']) this.equipped[t] = null;
    if (data.equippedStacks) {
      for (const t of ['weapon','shield','bow','armor_upper','armor_lower']) {
        if (data.equippedStacks[t]) this.equipped[t] = restoreStack(data.equippedStacks[t]);
      }
    }
    const findInSlots = (type, id) => this.slots[type].find(s => s.itemId === id);
    for (const t of ['weapon','shield','bow','armor_upper','armor_lower']) {
      if (this.equipped[t]) continue;
      const id = data.equipped[t];
      if (id) {
        const stack = findInSlots(t, id);
        if (stack) {
          this.slots[t].splice(this.slots[t].indexOf(stack), 1);
          this.equipped[t] = stack;
        }
      }
    }
    this.buffs = data.buffs ? { ...data.buffs } : {};
    this._emit();
  }
}
