/* ========================================================
   CraftingSystem.js — 材料合成装备与套装
   所有武器/盾/弓/防具都可在背包“打造”页用材料合成。
   ======================================================== */

const ARMOR_SET_BONUSES = {
  starter: { name: '苏醒套装', desc: '体力自然恢复略微提升。', effects: { staminaRegen: 1.08 } },
  hylian: { name: '海利亚套装', desc: '最大生命 +1 颗心。', effects: { bonusHearts: 1 } },
  snowquill: { name: '雪羽套装', desc: '寒冷完全免疫，滑翔体力消耗降低。', effects: { coldImmune: true, glideCostMul: 0.78 } },
  flamebreaker: { name: '耐火套装', desc: '火山灼烧完全免疫，火焰伤害降低。', effects: { fireImmune: true, fireDamageMul: 0.65 } },
  desertVoe: { name: '沙漠勇士套装', desc: '酷热完全免疫，沙地与沙漠移动更快。', effects: { heatImmune: true, speedMul: 1.08 } },
  ancient: { name: '古代兵装套装', desc: '古代武器、古代弓伤害提升。', effects: { ancientAtkMul: 1.35, guardianDamageMul: 0.75 } },
  stealth: { name: '潜行套装', desc: '移动更快，绕后与近距离突袭伤害提升。', effects: { speedMul: 1.12, sneakAtkMul: 1.25 } },
  climbing: { name: '攀登套装', desc: '上坡速度提升，滑翔体力消耗降低。', effects: { slopeSpeedMul: 1.22, glideCostMul: 0.88 } },
  barbarian: { name: '蛮族套装', desc: '近战伤害与暴击率提升。', effects: { meleeAtkMul: 1.25, meleeCritChance: 0.02 } },
  zora: { name: '卓拉套装', desc: '亲水护甲，滑翔过河体力消耗降低。', effects: { coldImmune: true, glideCostMul: 0.82 } },
  radiant: { name: '辉光套装', desc: '对骷髅与黑暗敌人伤害提升。', effects: { stalAtkMul: 1.45 } },
  royalGuard: { name: '近卫套装', desc: '弓箭、盾反与暴击表现提升。', effects: { bowAtkMul: 1.18, counterAtkMul: 1.25, critChance: 0.025, critMultiplierBonus: 0.15 } }
};

const CRAFT_OVERRIDES = {
  hylianTunic: { materials: { wood: 5, bokoblinHorn: 2, amber: 1 } },
  hylianTrousers: { materials: { wood: 4, bokoblinFang: 2, amber: 1 } },
  warmDoublet: { materials: { spicyPepper: 4, courserBeeHoney: 1, whiteChuchuJelly: 2, sapphire: 1 } },
  snowQuillTrousers: { materials: { sunshroom: 3, whiteChuchuJelly: 3, sapphire: 1 } },
  flamebreakerArmor: { materials: { goronSpice: 3, redChuchuJelly: 3, ruby: 1, flint: 5 } },
  flamebreakerBoots: { materials: { goronSpice: 2, redChuchuJelly: 3, ruby: 1, flint: 4 } },
  desertVoeHeadband: { materials: { voltfruit: 4, yellowChuchuJelly: 3, topaz: 1 } },
  desertVoeTrousers: { materials: { voltfruit: 3, yellowChuchuJelly: 3, topaz: 1 } },
  ancientArmor: { materials: { ancientScrew: 8, ancientShaft: 5, ancientCore: 2, starFragment: 1 } },
  ancientGreaves: { materials: { ancientScrew: 7, ancientShaft: 5, ancientCore: 2 } },
  stealthChestGuard: { materials: { mushroom: 4, octorokEyeball: 2, opal: 1, wood: 3 } },
  stealthTights: { materials: { mushroom: 3, octorokEyeball: 2, opal: 1, wood: 2 } },
  climbingGear: { materials: { stamellaShroom: 4, flint: 4, amber: 2, lizalfosHorn: 2 } },
  climbingBoots: { materials: { stamellaShroom: 3, flint: 4, amber: 2, lizalfosTail: 1 } },
  barbarianArmor: { materials: { moblinHorn: 3, moblinFang: 2, ruby: 1, rawPrimeMeat: 2 } },
  barbarianLegWraps: { materials: { moblinHorn: 2, moblinFang: 2, ruby: 1, rawMeat: 3 } },
  zoraArmor: { materials: { hyruleBass: 4, opal: 2, sapphire: 1, lizalfosTail: 1 } },
  zoraGreaves: { materials: { hyruleBass: 3, opal: 2, sapphire: 1, lizalfosHorn: 2 } },
  radiantShirt: { materials: { luminousStone: 0, amber: 2, opal: 2, starFragment: 1, chuchuJelly: 5 } },
  radiantTights: { materials: { amber: 2, opal: 2, yellowChuchuJelly: 3, chuchuJelly: 3 } },
  royalGuardUniform: { materials: { royalSword: 1, amber: 4, ancientCore: 1, starFragment: 1 } },
  royalGuardBoots: { materials: { knightShield: 1, amber: 3, ancientShaft: 3, starFragment: 1 } },

  ancientShortSword: { materials: { ancientScrew: 5, ancientShaft: 3, ancientCore: 1, flint: 4 } },
  ancientGreatsword: { materials: { ancientScrew: 6, ancientShaft: 4, guardianGear: 3, ancientCore: 2, flint: 6 } },
  ancientSpear: { materials: { ancientScrew: 5, ancientShaft: 4, ancientCore: 1, wood: 3 } },
  ancientShield: { materials: { ancientScrew: 6, ancientShaft: 4, ancientCore: 1, amber: 2 } },
  ancientBow: { materials: { ancientScrew: 6, ancientShaft: 5, ancientCore: 2, wood: 5 } },
  lightscaleTrident: { materials: { zoraSword: 1, opal: 4, sapphire: 2, lizalfosTail: 2, dragonScale: 1 } },
  greatEagleBow: { materials: { falconBow: 1, wood: 8, octorokEyeball: 4, sapphire: 2, dragonScale: 1 } },
  boulderBreaker: { materials: { goronCrusher: 1, ruby: 3, flint: 12, guardianGear: 2, dragonScale: 1 } },
  scimitarOfSeven: { materials: { gerudoScimitar: 1, topaz: 3, moldugaFin: 2, moldugaGuts: 1, dragonScale: 1 } },
  daybreakerShield: { materials: { gerudoShield: 1, topaz: 3, moldugaFin: 2, amber: 5, dragonScale: 1 } },
  royalGuardClaymore: { materials: { royalClaymore: 1, ancientCore: 1, guardianSpring: 4, luminousStone: 4, starFragment: 1 } },
  flameblade: { materials: { soldierSword: 1, redChuchuJelly: 4, ruby: 1, flint: 4 } },
  frostblade: { materials: { soldierSword: 1, whiteChuchuJelly: 4, sapphire: 1, flint: 4 } },
  thunderblade: { materials: { soldierSword: 1, yellowChuchuJelly: 4, topaz: 1, flint: 4 } },
  fireBow: { materials: { soldierBow: 1, redChuchuJelly: 4, ruby: 1, wood: 4 } },
  iceBow: { materials: { soldierBow: 1, whiteChuchuJelly: 4, sapphire: 1, wood: 4 } },
  shockBow: { materials: { soldierBow: 1, yellowChuchuJelly: 4, topaz: 1, wood: 4 } },
  savageLynelSword: { materials: { royalSword: 1, moblinFang: 6, ruby: 2, starFragment: 1 } },
  savageLynelBow: { materials: { royalBow: 1, moblinHorn: 6, topaz: 2, starFragment: 1 } },
  goronCrusher: { materials: { soldierClaymore: 1, ruby: 2, flint: 8, goronSpice: 3 } }
};

const CraftingSystem = {
  _recipes: null,
  CRAFTED_DURABILITY_MULTIPLIER: 10,

  allRecipes() {
    if (this._recipes) return this._recipes;
    const rows = [];
    for (const id in ITEMS) {
      const def = ITEMS[id];
      if (!this._isCraftable(def, id)) continue;
      rows.push(this.recipeFor(id));
    }
    const order = { weapon: 1, shield: 2, bow: 3, armor_upper: 4, armor_lower: 5 };
    rows.sort((a, b) => (order[a.type] - order[b.type]) || a.name.localeCompare(b.name));
    this._recipes = rows;
    return rows;
  },

  recipeFor(itemId) {
    const def = ITEMS[itemId];
    const override = CRAFT_OVERRIDES[itemId];
    const materials = override ? override.materials : this._defaultMaterials(itemId, def);
    return {
      itemId,
      name: def.name,
      type: def.type,
      set: def.set || null,
      materials: this._cleanMaterials(materials),
      desc: this._recipeDesc(def)
    };
  },

  canCraft(inv, itemId) {
    const recipe = this.recipeFor(itemId);
    return this.missing(inv, recipe).length === 0;
  },

  missing(inv, recipe) {
    const rows = [];
    for (const id in recipe.materials) {
      const need = recipe.materials[id];
      const have = inv.countOf(id);
      if (have < need) rows.push({ id, need, have });
    }
    return rows;
  },

  craft(inv, itemId) {
    const recipe = this.recipeFor(itemId);
    if (!this.canCraft(inv, itemId)) return { ok: false, recipe, missing: this.missing(inv, recipe) };
    for (const id in recipe.materials) inv.remove(id, recipe.materials[id]);
    inv.add(itemId, 1, { source: 'crafted', durabilityMultiplier: this.CRAFTED_DURABILITY_MULTIPLIER });
    if (window.game && window.game.player) window.game.player.refreshEquipment();
    return { ok: true, recipe, missing: [] };
  },

  materialsText(recipe) {
    return Object.entries(recipe.materials).map(([id, need]) => {
      const def = ITEMS[id];
      return `${def ? def.name : id}×${need}`;
    }).join('、');
  },

  _isCraftable(def, id) {
    if (!def) return false;
    if (!['weapon', 'shield', 'bow', 'armor_upper', 'armor_lower'].includes(def.type)) return false;
    if (id === 'masterSword' || id === 'hylianShield' || id === 'oldShirt' || id === 'wellWornTrousers') return false;
    return true;
  },

  _recipeDesc(def) {
    if (def.set && ARMOR_SET_BONUSES[def.set]) return `${ARMOR_SET_BONUSES[def.set].name}部件：${ARMOR_SET_BONUSES[def.set].desc}`;
    if (def.type === 'weapon') return `打造武器：攻击 ${def.atk}，打造耐久 ${def.durability * this.CRAFTED_DURABILITY_MULTIPLIER}`;
    if (def.type === 'shield') return `打造盾牌：防御 ${def.def}，打造耐久 ${def.durability * this.CRAFTED_DURABILITY_MULTIPLIER}`;
    if (def.type === 'bow') return `打造弓：攻击 ${def.atk}，打造耐久 ${def.durability * this.CRAFTED_DURABILITY_MULTIPLIER}`;
    return def.desc || '';
  },

  _cleanMaterials(materials) {
    const out = {};
    for (const id in materials) {
      if (!ITEMS[id]) continue;
      const n = Math.max(0, Math.round(materials[id]));
      if (n > 0) out[id] = n;
    }
    return out;
  },

  _defaultMaterials(itemId, def) {
    const power = Math.max(def.atk || def.def || 1, 1);
    if (def.type === 'weapon') {
      if (def.subtype === 'spear') return { wood: 4, flint: 2, bokoblinHorn: Math.ceil(power / 10), amber: Math.max(1, Math.floor(power / 18)) };
      if (def.subtype === 'claymore' || def.subtype === 'club') return { wood: 5, flint: 4, moblinHorn: Math.max(1, Math.ceil(power / 14)), amber: Math.max(1, Math.floor(power / 16)) };
      return { wood: 3, flint: 2, bokoblinFang: Math.max(1, Math.ceil(power / 14)), amber: Math.max(1, Math.floor(power / 18)) };
    }
    if (def.type === 'shield') return { wood: 4, flint: 2, bokoblinHorn: Math.max(1, Math.ceil(power / 4)), amber: Math.max(1, Math.floor(power / 8)) };
    if (def.type === 'bow') return { wood: 5, flint: 1, octorokEyeball: Math.max(1, Math.ceil(power / 12)), amber: Math.max(1, Math.floor(power / 18)) };
    if (def.type === 'armor_upper' || def.type === 'armor_lower') return { wood: 3, bokoblinHorn: 2, amber: Math.max(1, Math.ceil((def.def || 1) / 3)) };
    return { wood: 1 };
  }
};
