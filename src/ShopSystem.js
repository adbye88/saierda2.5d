/* ========================================================
   ShopSystem.js — 商店系统
   每个区域的村庄/营地有商人 NPC，可买卖
   ======================================================== */

// 商人定义
const SHOP_DEFS = {
  // 草原商人（基础）
  grasslandShop: {
    name: '海利亚商人', npcColor: 0xe0c0a0,
    pos: [18, -10],
    sell: [ // 商人卖给玩家
      { id: 'apple', price: 8 },
      { id: 'arrow', price: 5 },
      { id: 'travelerSword', price: 50 },
      { id: 'woodenShield', price: 30 },
      { id: 'travelerBow', price: 80 },
      { id: 'hylianTunic', price: 80 },
      { id: 'hylianTrousers', price: 60 },
      { id: 'spicyPepper', price: 12 },
      { id: 'flint', price: 10 }
    ]
  },
  // 卡卡利科村商人
  kakarikoShop: {
    name: '卡卡利科商人', npcColor: 0xe0c0a0,
    pos: [8, 0],
    sell: [
      { id: 'soldierSword', price: 130 },
      { id: 'soldierShield', price: 90 },
      { id: 'soldierBow', price: 200 },
      { id: 'knightSword', price: 350 },
      { id: 'heartyApple', price: 30 },
      { id: 'stamellaShroom', price: 20 },
      { id: 'arrow', price: 5 },
      { id: 'warmDoublet', price: 200 },
      { id: 'rawMeat', price: 15 }
    ]
  },
  // 雪村商人
  ritoShop: {
    name: '利特村商人', npcColor: 0xc8d8e8,
    pos: [10, 25],
    sell: [
      { id: 'snowQuillTrousers', price: 250 },
      { id: 'iceBow', price: 400 },
      { id: 'frostblade', price: 400 },
      { id: 'sapphire', price: 100 },
      { id: 'heartyApple', price: 25 },
      { id: 'arrow', price: 5 }
    ]
  },
  // 戈隆村商人
  goronShop: {
    name: '戈隆村商人', npcColor: 0xd89858,
    pos: [10, 25],
    sell: [
      { id: 'flamebreakerBoots', price: 250 },
      { id: 'fireBow', price: 400 },
      { id: 'flameblade', price: 400 },
      { id: 'ruby', price: 100 },
      { id: 'goronSpice', price: 20 },
      { id: 'arrow', price: 5 }
    ]
  },
  // 格鲁德商人
  gerudoShop: {
    name: '格鲁德商人', npcColor: 0xe8a888,
    pos: [10, 30],
    sell: [
      { id: 'desertVoeTrousers', price: 250 },
      { id: 'shockBow', price: 450 },
      { id: 'thunderblade', price: 450 },
      { id: 'topaz', price: 100 },
      { id: 'voltfruit', price: 20 },
      { id: 'arrow', price: 5 }
    ]
  },
  // 费罗尼高地行商
  highlandShop: {
    name: '高地行商', npcColor: 0xd8c098,
    pos: [8, -82],
    sell: [
      { id: 'soldierSword', price: 130 },
      { id: 'soldierShield', price: 90 },
      { id: 'soldierBow', price: 200 },
      { id: 'stamellaShroom', price: 20 },
      { id: 'rawMeat', price: 15 },
      { id: 'staminaElixir', price: 110 },
      { id: 'arrow', price: 5 }
    ]
  },
  // 古代商人（城堡外）
  ancientShop: {
    name: '古代商人', npcColor: 0x88ccff,
    pos: [0, 25],
    sell: [
      { id: 'ancientShortSword', price: 1000 },
      { id: 'ancientSpear', price: 1000 },
      { id: 'ancientShield', price: 800 },
      { id: 'ancientBow', price: 1200 },
      { id: 'ancientArmor', price: 1500 },
      { id: 'ancientGreaves', price: 1500 }
    ]
  }
};

const ShopSystem = {
  shops: {},  // worldName -> [shopGroups]
  nearbyShop: null,

  basePrice(itemId) {
    for (const id in SHOP_DEFS) {
      const row = SHOP_DEFS[id].sell.find(x => x.id === itemId);
      if (row) return row.price;
    }
    const def = ITEMS[itemId];
    if (!def) return 0;
    if (def.type === 'weapon') return Math.max(25, Math.round((def.atk || 1) * 12 + (def.durability || 0) * 2));
    if (def.type === 'shield') return Math.max(20, Math.round((def.def || 1) * 18 + (def.durability || 0) * 2));
    if (def.type === 'bow') return Math.max(35, Math.round((def.atk || 1) * 14 + (def.durability || 0) * 2));
    if (def.type === 'armor_upper' || def.type === 'armor_lower') return Math.max(50, Math.round((def.def || 1) * 45));
    if (def.type === 'food') return Math.max(4, (def.heal || 1) * 5);
    if (def.type === 'material') {
      const prices = {
        arrow: 5, apple: 8, mushroom: 8, spicyPepper: 12, sunshroom: 14, voltfruit: 16,
        rawMeat: 15, rawPrimeMeat: 35, amber: 60, opal: 70, ruby: 220, sapphire: 220, topaz: 220,
        ancientScrew: 50, ancientShaft: 60, ancientCore: 240, starFragment: 600,
        guardianGear: 70, guardianSpring: 55, dragonScale: 420, luminousStone: 80,
        bokoblinHorn: 18, bokoblinFang: 22, bokoblinGuts: 45, moblinHorn: 35, moblinFang: 45,
        lizalfosHorn: 40, lizalfosTail: 60, lynelHorn: 120, lynelHoof: 140, lynelGuts: 300,
        moldugaFin: 130, moldugaGuts: 320, chuchuJelly: 14, redChuchuJelly: 18,
        whiteChuchuJelly: 18, yellowChuchuJelly: 18, flint: 10, wood: 6
      };
      return prices[itemId] || 12;
    }
    return 0;
  },

  // 在世界中创建商人 NPC
  spawnInWorld(world, shopDefId) {
    const def = SHOP_DEFS[shopDefId];
    if (!def) return;
    this._ensureBasicStock(def);
    const npc = AssetFactory.createMerchant(def.npcColor);
    npc.position.set(def.pos[0], 0, def.pos[1]);
    npc.userData.shop = def;
    npc.userData.shopId = shopDefId;
    npc.userData.npc = true;
    npc.userData.name = def.name;
    npc.userData.onTalk = (game) => {
      ShopUI.open(def);
    };
    world.scene.add(npc);
    world.npcs.push({ mesh: npc });
    if (AssetFactory.createShopStall) {
      const stall = AssetFactory.createShopStall(def, shopDefId);
      stall.position.set(def.pos[0] + 1.35, 0, def.pos[1] - 0.55);
      stall.rotation.y = -0.22;
      stall.userData.shop = def;
      stall.userData.shopId = shopDefId;
      world.scene.add(stall);
    }
    if (!this.shops[world.name]) this.shops[world.name] = [];
    this.shops[world.name].push(npc);
  },

  // 检查玩家是否在某商人附近（用于对话提示）
  checkNearby(player) {
    if (!window.game || !window.game.currentWorld) return null;
    const list = this.shops[window.game.currentWorld.name] || [];
    for (const npc of list) {
      if (player.position.distanceTo(npc.position) < 2.5) return npc;
    }
    return null;
  },

  _ensureBasicStock(def) {
    const basics = [
      { id: 'arrow', price: 5 },
      { id: 'travelerSword', price: 50 },
      { id: 'woodenShield', price: 30 },
      { id: 'travelerBow', price: 80 }
    ];
    for (const item of basics) {
      if (!def.sell.some(x => x.id === item.id)) def.sell.unshift(item);
    }
  }
};
