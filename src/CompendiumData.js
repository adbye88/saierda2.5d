/* ========================================================
   CompendiumData.js — 海拉鲁图鉴资料索引
   从现有物品、怪物、商店、打造与地图定义汇总资料。
   ======================================================== */

const COMPENDIUM_WORLD_NAMES = {
  grassland: '起始台地',
  forest: '迷失森林',
  highland: '费罗尼高地',
  snowland: '赫布拉雪山',
  volcano: '死亡之山',
  desert: '格鲁德沙漠',
  castle: '海拉鲁城堡',
  dungeon: '地下水牢'
};

const COMPENDIUM_ENEMY_LOCATIONS = {
  redBokoblin: ['起始台地外围营地 (-15,-8)、(40,-40)', '赫布拉/奥尔汀/沙漠边缘的低阶巡逻点'],
  blueBokoblin: ['起始台地东南与北部营地 (30,-25)、(70,-20)', '迷失森林入口附近', '费罗尼高地双河营地'],
  blackBokoblin: ['迷失森林深处与费罗尼高地营地', '海拉鲁城堡外围废墟', '火山/雪山/沙漠高阶据点'],
  silverBokoblin: ['海拉鲁城堡内外守军 (0,15)、(50,-34)', '最终区域高危营地'],
  goldBokoblin: ['费罗尼高地与沙漠精英点', '火山北坡、王城外围'],
  archerBokoblin: ['起始台地射手营地 (-55,10)、(58,10)', '费罗尼高地桥头', '王城外墙巡逻点'],
  octorok: ['起始台地河岸与草地水边', '格鲁德沙漠绿洲周边', '费罗尼双河岸边'],
  electricOctorok: ['格鲁德沙漠电气绿洲', '费罗尼高地东岸'],
  chuchu: ['起始台地草地与河边', '费罗尼高地低洼草甸'],
  fireChuchu: ['死亡之山熔岩河两岸', '火山口附近'],
  iceChuchu: ['赫布拉雪山雪原', '冰河附近'],
  shockChuchu: ['雷雨高地与沙漠电气区域'],
  redLizalfos: ['死亡之山岩浆区', '费罗尼高地东岸火属性营地'],
  blueLizalfos: ['赫布拉雪山、冰河与雪坡', '费罗尼高地西岸'],
  yellowLizalfos: ['格鲁德沙漠主路与绿洲外缘', '雷电高地'],
  moblin: ['迷失森林中央祭坛', '格鲁德沙漠沙丘营地', '王城外墙'],
  blueMoblin: ['费罗尼高地双河营地', '海拉鲁城堡侧翼'],
  silverMoblin: ['费罗尼高地北营地', '死亡之山与沙漠精英据点', '海拉鲁城堡内城'],
  stal: ['起始台地夜间废墟', '迷失森林与雪山夜间点', '王城破墙附近'],
  guardian: ['死亡之山古代遗迹', '海拉鲁城堡内庭', '迷失森林遗迹'],
  guardianStalker: ['起始台地平原行走守护者 (152,-132)', '费罗尼东岸 (118,-44)', '王城中央平原 (0,128)'],
  guardianSkywatcher: ['起始台地巡空守护者 (-150,-138)', '雪山/沙漠/王城空域'],
  yigaFootsoldier: ['迷失森林小路', '费罗尼高地双河之间', '格鲁德沙漠商道', '王城外围'],
  fireWizzrobe: ['迷失森林南部', '死亡之山熔岩河', '王城魔气区'],
  iceWizzrobe: ['赫布拉雪山冰原', '费罗尼高地西岸', '王城魔气区'],
  shockWizzrobe: ['格鲁德沙漠雷电遗迹', '费罗尼高地东岸', '王城魔气区'],
  maliceWizzrobe: ['迷失森林怨念点', '海拉鲁城堡深处'],
  stonePebblit: ['起始台地采石场', '费罗尼高地岩坡', '迷失森林古树根'],
  frostPebblit: ['赫布拉雪山冰坡', '高地冰霜巨像周边'],
  firePebblit: ['死亡之山火山岩地'],
  lynel: ['北原莱尼尔 (-116,112)', '迷雾林地莱尼尔 (-112,108)', '雪原/火山/沙海高危区'],
  silverLynel: ['塔邦挞断崖白银莱尼尔 (150,-30)', '王城东西塔 (-82,-72)、(82,-72)'],
  waterblightGanon: ['赫布拉雪山神兽核心 (0,-75)'],
  fireblightGanon: ['死亡之山神兽核心 (0,-75)'],
  windblightGanon: ['迷失森林神兽核心 (0,-70)'],
  thunderblightGanon: ['格鲁德沙漠神兽核心 (0,-75)'],
  stoneTalus: ['东部采石场岩石巨像 (112,-108)', '双河岩石巨像 (122,-118)', '城门废墟岩石巨像 (0,82)'],
  ignoTalus: ['死亡之山火山口熔岩巨像 (-116,-108)'],
  frostTalus: ['赫布拉冰霜巨像 (-118,-112)', '费罗尼高地冰霜巨像 (132,124)'],
  molduga: ['格鲁德沙漠沙暴魔吉拉德 (112,-118)', '南绿洲魔吉拉德 (-152,106)'],
  hinox: ['萨托利林地独眼巨人 (-148,34)'],
  blackHinox: ['竞技场外缘黑色独眼巨人 (-158,146)', '海利亚湖畔/鼓隆峭壁/龙骨流放地'],
  stalnox: ['迷失森林深处 (146,132)', '王城船坞 (-96,-106)'],
  flameGleeok: ['奥尔汀桥火焰三头龙 (-148,128)'],
  frostGleeok: ['赫布拉迷宫冰雪三头龙 (-148,142)'],
  thunderGleeok: ['海利亚大桥雷电三头龙 (0,166)', '费罗尼瀑布/格鲁德迷宫/王城广场'],
  calamityGanon: ['海拉鲁城堡深处最终战 (0,-15)']
};

const COMPENDIUM_ITEM_LOCATION_HINTS = {
  masterSword: ['迷失森林大师之剑台座 (0,42)，需要 13 颗心'],
  hylianShield: ['海拉鲁城堡王室宝箱 (-18,-28)'],
  sheikahSlate: ['初始携带的重要道具'],
  spiritOrb: ['通关神庙挑战获得'],
  heartContainer: ['女神像处用克服之玉兑换'],
  staminaVessel: ['女神像处用克服之玉兑换'],
  wood: ['砍树、野外木材堆'],
  flint: ['岩石小怪、巨像、火山岩地'],
  arrow: ['商店、弓箭敌人、野外补给'],
  apple: ['起始台地果树、商店与补给点'],
  mushroom: ['迷失森林、费罗尼高地'],
  stamellaShroom: ['费罗尼高地、卡卡利科商人'],
  heartyApple: ['神庙补给、森林/雪山稀有果树'],
  rawMeat: ['商人、野外补给'],
  rawPrimeMeat: ['高阶狩猎补给'],
  rupee: ['所有敌人、宝箱、商店交易'],
  amber: ['岩石巨像、矿石点、黑色怪物掉落'],
  opal: ['岩石巨像、水系 Boss'],
  ruby: ['死亡之山、火系 Boss、熔岩巨像'],
  sapphire: ['赫布拉雪山、冰系 Boss、冰霜巨像'],
  topaz: ['格鲁德沙漠、雷系 Boss、雷电怪物'],
  ancientCore: ['守护者、怨念法师、王城古代遗迹'],
  starFragment: ['莱尼尔、三头龙、强敌稀有掉落'],
  dragonScale: ['三头龙、白银莱尼尔稀有掉落'],
  luminousStone: ['王城、怨念法师、骷髅系强敌']
};

const COMPENDIUM_NPC_ENTRIES = [
  { id: 'king', name: '海拉鲁国王', type: '主线 NPC', world: 'grassland', pos: [12, -12], desc: '引导初始台地任务，完成四座神庙后交付滑翔伞。' },
  { id: 'goddess', name: '海利亚女神像', type: '兑换 NPC', world: 'grassland', pos: [8, 5], desc: '消耗克服之玉兑换心之容器或精力容器。' },
  { id: 'impa', name: '英帕', type: '主线 NPC', world: 'forest', pos: [-8, 58], desc: '讲述回忆、四大神兽与最终决战的主线方向。' },
  { id: 'masterSwordPedestal', name: '大师之剑台座', type: '传说地点', world: 'forest', pos: [0, 42], desc: '拥有 13 颗心后可拔出大师之剑。' },
  { id: 'grasslandShop', name: '海利亚商人', type: '商店', world: 'grassland', pos: [18, -10], desc: '出售基础武器、盾、弓、箭矢与旅行补给。' },
  { id: 'kakarikoShop', name: '卡卡利科商人', type: '商店', world: 'forest', pos: [8, 0], desc: '出售士兵与骑士级装备、防寒衣物和恢复食材。' },
  { id: 'highlandShop', name: '高地行商', type: '商店', world: 'highland', pos: [8, -82], desc: '出售中阶装备、毅力食材和体力药。' },
  { id: 'ritoShop', name: '利特村商人', type: '商店', world: 'snowland', pos: [10, 25], desc: '出售雪羽装备、冰系武器与雪山补给。' },
  { id: 'goronShop', name: '戈隆村商人', type: '商店', world: 'volcano', pos: [10, 25], desc: '出售耐火装备、火系武器与火山补给。' },
  { id: 'gerudoShop', name: '格鲁德商人', type: '商店', world: 'desert', pos: [10, 30], desc: '出售防热装备、雷系武器与沙漠补给。' },
  { id: 'ancientShop', name: '古代商人', type: '商店', world: 'castle', pos: [0, 25], desc: '出售古代兵装和高阶装备，价格昂贵。' },
  { id: 'beastTerminals', name: '四大神兽终端', type: '神兽机关', world: 'various', pos: null, desc: '分布在水、火、风、雷四大区域，启动后可挑战对应咒盖侬。' },
  { id: 'cookingPots', name: '烹饪锅', type: '设施', world: 'various', pos: null, desc: '各区域营地附近可见，用食材制作料理与药剂。' },
  { id: 'shrines', name: '神庙入口', type: '试炼设施', world: 'various', pos: null, desc: '进入后回答题目或挑战怪物，通关获得克服之玉。' },
  { id: 'towers', name: '鸟望塔', type: '地图设施', world: 'various', pos: null, desc: '解锁地图与传送点，也会在地图中显示当前区域路线。' }
];

const CompendiumData = {
  typeName(type) {
    return {
      weapon: '武器', shield: '盾牌', bow: '弓', armor_upper: '上衣', armor_lower: '裤子',
      food: '食物', material: '材料', key: '重要道具'
    }[type] || type;
  },

  worldName(id) {
    return COMPENDIUM_WORLD_NAMES[id] || id || '未知区域';
  },

  enemyEntries() {
    return Object.entries(ENEMY_DEFS || {}).map(([id, def]) => {
      const drops = this._dropIds(def).map(itemId => ITEMS[itemId] ? ITEMS[itemId].name : itemId);
      const tags = [def.boss ? 'Boss' : def.miniBoss ? '精英' : '普通', def.ai || 'melee'];
      if (def.element) tags.push({ fire: '火', ice: '冰', shock: '雷' }[def.element] || def.element);
      return {
        id,
        kind: 'enemy',
        group: def.boss ? 'boss' : def.miniBoss ? 'elite' : 'monster',
        name: def.name,
        icon: def.boss ? '👹' : def.miniBoss ? '⚔️' : '🧿',
        subtitle: tags.join(' · '),
        stats: [
          ['生命', def.hp],
          ['攻击', def.atk],
          ['速度', def.speed],
          ['视野', def.sight]
        ],
        desc: this._enemyDesc(id, def),
        sources: drops.length ? drops.map(x => `掉落：${x}`) : ['无固定掉落记录'],
        locations: COMPENDIUM_ENEMY_LOCATIONS[id] || ['图鉴暂未记录固定位置，通常随区域生态刷新。'],
        search: `${id} ${def.name} ${drops.join(' ')} ${COMPENDIUM_ENEMY_LOCATIONS[id] || ''}`
      };
    });
  },

  itemEntries() {
    const shopSources = this._shopSources();
    const craftSources = this._craftSources();
    const dropSources = this._enemyDropSources();
    return Object.entries(ITEMS || {}).map(([id, def]) => {
      const sources = [];
      if (shopSources[id]) sources.push(...shopSources[id]);
      if (craftSources[id]) sources.push(craftSources[id]);
      if (dropSources[id]) sources.push(...dropSources[id]);
      if (COMPENDIUM_ITEM_LOCATION_HINTS[id]) sources.push(...COMPENDIUM_ITEM_LOCATION_HINTS[id]);
      const locations = [
        ...(COMPENDIUM_ITEM_LOCATION_HINTS[id] || []),
        ...this._itemLocationsFromSources(sources)
      ];
      const stats = [];
      if (def.atk) stats.push(['攻击', def.atk]);
      if (def.def) stats.push(['防御', def.def]);
      if (def.durability) stats.push(['耐久', def.durability]);
      if (def.heal) stats.push(['恢复', def.heal]);
      if (def.resist) stats.push(['抗性', { cold: '防寒', fire: '耐火', heat: '防热' }[def.resist] || def.resist]);
      if (def.element) stats.push(['属性', { fire: '火', ice: '冰', shock: '雷' }[def.element] || def.element]);
      const group = ['weapon', 'shield', 'bow', 'armor_upper', 'armor_lower'].includes(def.type)
        ? 'equipment'
        : def.type;
      return {
        id,
        kind: 'item',
        group,
        name: def.name,
        icon: def.icon || '□',
        subtitle: this.typeName(def.type),
        stats,
        desc: def.desc || '暂无说明。',
        sources: sources.length ? Array.from(new Set(sources)) : ['来源：探索、商店、怪物掉落或后续任务。'],
        locations: Array.from(new Set(locations)),
        search: `${id} ${def.name} ${def.type} ${def.desc || ''} ${(sources || []).join(' ')}`
      };
    });
  },

  npcEntries() {
    return COMPENDIUM_NPC_ENTRIES.map(row => ({
      id: row.id,
      kind: 'npc',
      group: 'npc',
      name: row.name,
      icon: row.type === '商店' ? '🛒' : row.type === '传说地点' ? '🌟' : row.type === '设施' ? '🔥' : '👤',
      subtitle: row.type,
      stats: row.pos ? [['地图', this.worldName(row.world)], ['坐标', `${row.pos[0]}, ${row.pos[1]}`]] : [['地图', row.world === 'various' ? '多区域' : this.worldName(row.world)]],
      desc: row.desc,
      sources: [row.type],
      locations: row.pos ? [`${this.worldName(row.world)} (${row.pos[0]}, ${row.pos[1]})`] : ['多区域分布，打开地图或自动寻路可查看附近设施。'],
      search: `${row.name} ${row.type} ${row.desc} ${this.worldName(row.world)}`
    }));
  },

  allEntries() {
    return [...this.enemyEntries(), ...this.itemEntries(), ...this.npcEntries()]
      .sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name, 'zh-CN'));
  },

  _enemyDesc(id, def) {
    if (def.finalBoss) return '盘踞海拉鲁城堡深处的最终灾厄，建议集齐四神兽祝福、高阶装备和充足料理后挑战。';
    if (def.boss) return `${def.name} 是大型 Boss，生命与攻击都很高。观察前摇、利用盾反和元素克制可以显著降低风险。`;
    if (def.miniBoss) return `${def.name} 属于精英敌人，伤害和血量远高于普通怪物，掉落也更稀有。`;
    if (def.ai === 'ranged') return `${def.name} 擅长远程攻击，接近前注意横向移动或举盾。`;
    return `${def.name} 是常见敌人，会巡逻、追击并在近距离蓄力攻击。`;
  },

  _dropIds(def) {
    if (!def || !def.drops) return [];
    const text = String(def.drops);
    const ids = Object.keys(ITEMS || {}).filter(id => new RegExp(`['"]${id}['"]`).test(text));
    return Array.from(new Set(ids));
  },

  _shopSources() {
    const out = {};
    if (typeof SHOP_DEFS === 'undefined') return out;
    for (const [shopId, shop] of Object.entries(SHOP_DEFS)) {
      const npc = COMPENDIUM_NPC_ENTRIES.find(x => x.id === shopId);
      const where = npc ? `${this.worldName(npc.world)} ${shop.name}` : shop.name;
      for (const row of shop.sell || []) {
        if (!out[row.id]) out[row.id] = [];
        out[row.id].push(`商店：${where} (${row.price}卢比)`);
      }
    }
    return out;
  },

  _craftSources() {
    const out = {};
    if (typeof CraftingSystem === 'undefined' || !CraftingSystem.allRecipes) return out;
    for (const recipe of CraftingSystem.allRecipes()) {
      const mats = Object.entries(recipe.materials || {})
        .map(([id, n]) => `${ITEMS[id] ? ITEMS[id].name : id}×${n}`)
        .join('、');
      out[recipe.itemId] = `打造：${mats || '材料不明'}`;
    }
    return out;
  },

  _enemyDropSources() {
    const out = {};
    if (typeof ENEMY_DEFS === 'undefined') return out;
    for (const def of Object.values(ENEMY_DEFS)) {
      for (const itemId of this._dropIds(def)) {
        if (!out[itemId]) out[itemId] = [];
        out[itemId].push(`怪物掉落：${def.name}`);
      }
    }
    return out;
  },

  _itemLocationsFromSources(sources) {
    const locs = [];
    for (const s of sources || []) {
      for (const name of Object.values(COMPENDIUM_WORLD_NAMES)) {
        if (String(s).includes(name) && !locs.includes(name)) locs.push(name);
      }
    }
    if (!locs.length) return ['位置随来源变化，可通过商店、怪物、打造或探索获得。'];
    return locs.map(x => `${x} 相关来源`);
  }
};
