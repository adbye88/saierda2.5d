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

const COMPENDIUM_ACTUAL_ITEM_SOURCES = {
  apple: { sources: ['野外拾取：起始台地、迷失森林、费罗尼高地可见补给点', '商店：起始台地海利亚商人'], locations: ['起始台地 (5, 8)、(-3, -10)', '迷失森林 (-15, 0)', '费罗尼高地 (-6, -86)'], guide: ['初期最稳定的回血食物，靠近发光掉落物自动拾取。'] },
  heartyApple: { sources: ['野外拾取：森林、高地、王城与地下水牢稀有补给', '商店：卡卡利科商人、利特村商人'], locations: ['迷失森林 (20, 25)', '费罗尼高地 (34, 38)'], guide: ['生命系料理核心材料，建议留给 Boss 战前烹饪。'] },
  mushroom: { sources: ['野外拾取：起始台地、迷失森林', '宝箱：迷失森林古树树洞'], locations: ['起始台地 (18, -8)', '迷失森林 (15, 5)', '迷失森林古树树洞 (146, 132)'], guide: ['森林里最常见的料理底材，也用于潜行套装打造。'] },
  stamellaShroom: { sources: ['野外拾取：费罗尼高地', '商店：卡卡利科商人、高地行商'], locations: ['费罗尼高地 (-30, 36)'], guide: ['体力料理核心材料，适合攀爬、滑翔和长跑前准备。'] },
  rawMeat: { sources: ['野外拾取：费罗尼高地营地补给', '商店：卡卡利科商人、高地行商'], locations: ['费罗尼高地 (8, -84)'], guide: ['基础肉料理材料，可和辣椒、蘑菇组合做抗性料理。'] },
  rawPrimeMeat: { sources: ['野外拾取：费罗尼高地、死亡之山、格鲁德沙漠高阶补给', '商店：高地行商'], locations: ['费罗尼高地 (92, -34)', '死亡之山 (-20, 0)', '格鲁德沙漠 (-25, 0)'], guide: ['蛮族套装会用到；野外点位刷新前可用高地商人补货。'] },
  birdEgg: { sources: ['野外拾取：起始台地树下鸟窝、迷失森林鸟窝', '商店：起始台地海利亚商人、卡卡利科商人'], locations: ['起始台地 (23, -5)', '迷失森林 (-20, 12)'], guide: ['这是新补齐的真实入口：不是文字介绍，地图上有可拾取掉落物，商店也能买。'] },
  hyruleBass: { sources: ['野外拾取：起始台地河岸、费罗尼高地河岸', '宝箱：起始台地瀑布后、高地湖畔沉石宝箱', '商店：利特村商人、高地行商'], locations: ['起始台地 (-39, 22)', '费罗尼高地 (-46, 44)', '瀑布后宝箱 (-35, -126)', '湖畔沉石宝箱 (-152, -118)'], guide: ['卓拉套装打造材料。沿河走、看发光拾取物，比盲找更快。'] },
  spicyPepper: { sources: ['野外拾取：赫布拉雪山、防寒补给点', '商店：起始台地海利亚商人'], locations: ['赫布拉雪山 (-15, 20)、(15, 20)'], guide: ['去雪山前先烹饪防寒料理；初期商人可直接买。'] },
  sunshroom: { sources: ['野外拾取：赫布拉雪山、死亡之山', '商店：利特村商人'], locations: ['赫布拉雪山 (-20, 0)', '死亡之山 (-15, 20)、(15, 20)'], guide: ['雪羽裤与防热料理都会用到，火山外围补给比较集中。'] },
  voltfruit: { sources: ['野外拾取：格鲁德沙漠', '商店：格鲁德商人'], locations: ['格鲁德沙漠 (-15, 25)、(15, 25)'], guide: ['雷属性料理与沙漠装备材料，优先在格鲁德商人处补货。'] },
  goronSpice: { sources: ['商店：戈隆村商人', '隐藏补给：火山区域宝箱/营地补给'], locations: ['死亡之山 戈隆村商人 (10, 25)'], guide: ['耐火套装和防火料理的重要材料，当前最稳定入口是戈隆村商店。'] },
  courserBeeHoney: { sources: ['野外拾取：迷失森林蜂巢、费罗尼高地蜂巢', '宝箱：萨托利林地宝箱', '商店：卡卡利科商人、高地行商'], locations: ['迷失森林 (26, 18)', '费罗尼高地 (58, 36)', '萨托利林地宝箱 (-148, 34)'], guide: ['体力料理和雪羽上衣材料。森林蜂巢点位最早能拿到。'] },
  wood: { sources: ['采集：攻击树木砍树掉落', '野外拾取：起始台地木材堆', '商店：起始台地海利亚商人'], locations: ['砍任意可破坏树木', '起始台地 (15, -23)'], guide: ['靠近树后用近战武器攻击即可砍树；大树掉落更多木材。'] },
  flint: { sources: ['怪物掉落：岩石小怪、冰岩小怪、熔岩小怪、岩石巨像', '商店：起始台地海利亚商人'], locations: ['起始台地采石场与各区域岩石怪据点'], guide: ['打造基础装备和火山装备常用，刷岩石类敌人最快。'] }
};

const COMPENDIUM_GUIDE_ENTRIES = [
  {
    id: 'main_story_route',
    group: 'story',
    name: '主线推进路线',
    icon: '📜',
    subtitle: '剧情攻略',
    desc: '推荐路线：苏醒 → 远古塔 → 四座神庙 → 英帕 → 回忆 → 四大神兽 → 大师之剑 → 海拉鲁城堡。',
    locations: ['起始台地', '迷失森林', '赫布拉雪山', '死亡之山', '格鲁德沙漠', '海拉鲁城堡'],
    guide: ['序章：完成起始台地 4 座神庙，拿到滑翔伞。', '第一章：去迷失森林见英帕，开启四神兽与回忆主线。', '第二章：收集回忆，让地图从“路线”变成“故事”。', '第三章：按水、火、风、雷任选顺序解放神兽。', '第四章：准备大师之剑、料理和装备，再进入王城。'],
    story: ['百年前灾厄盖侬吞没王城，四英杰与神兽沉默。林克苏醒后需要恢复石板、找回记忆，并重新夺回四神兽的力量。', '这条主线不是单纯打 Boss，而是让林克重新理解：他为什么失败、谁仍在等待他、现在要如何完成百年前未完成的约定。']
  },
  {
    id: 'divine_beasts',
    group: 'story',
    name: '四大神兽',
    icon: '🐘',
    subtitle: '水 · 火 · 风 · 雷',
    desc: '四大神兽分别对应水、火、风、雷区域。解放神兽会削弱最终战压力，并解锁守护之力。',
    locations: ['水神兽：赫布拉雪山', '火神兽：死亡之山', '风神兽：迷失森林', '雷神兽：格鲁德沙漠'],
    guide: ['水神兽：准备防寒、弓箭和回复料理，击败水咒后获得米法之赐。', '火神兽：准备耐火、防火料理和盾，击败火咒后获得达尔克尔之护。', '风神兽：准备箭矢、体力料理和轻武器，击败风咒后获得力巴尔之猛。', '雷神兽：准备防热、回血和盾反节奏，击败雷咒后获得乌尔波扎之怒。'],
    story: ['四英杰的力量被困在神兽核心中。每解放一座神兽，海拉鲁反攻灾厄的机会就更大。', '神兽线的重点是“英杰重新归队”：他们不是装备奖励，而是百年前未完成战斗的同伴。']
  },
  {
    id: 'materials_route',
    group: 'guide',
    name: '材料获取总览',
    icon: '🧭',
    subtitle: '采集 · 掉落 · 商店',
    desc: '所有材料和生食都应至少有一个真实入口：怪物掉落、野外拾取、宝箱、砍树、商店或神庙奖励。',
    locations: ['图鉴搜索材料名，可在右侧查看具体入口。'],
    guide: ['怪物材料刷对应怪。', '食材优先看野外拾取和商店。', '木材通过砍树获得。', '稀有材料如龙鳞、星星碎片来自莱尼尔、三头龙或最终强敌。']
  },
  {
    id: 'crafting_route',
    group: 'guide',
    name: '打造与耐久',
    icon: '🛠️',
    subtitle: '装备攻略',
    desc: '自己打造的武器、弓、盾默认耐久为原始耐久的 10 倍；宝箱和怪物掉落保持原始耐久。',
    locations: ['打开背包 → 打造页'],
    guide: ['想长期使用的武器尽量自己打造。', '普通刷怪/开箱拿到的装备适合过渡。', '当前装备损坏后可用快速换装窗口直接点图标装备背包里的替代品。']
  },
  {
    id: 'combat_route',
    group: 'guide',
    name: '战斗与盾反',
    icon: '🛡️',
    subtitle: '战斗攻略',
    desc: '盾反逻辑为按住盾进入防御，敌人攻击命中的瞬间松开盾触发判定。',
    locations: ['所有战斗场景'],
    guide: ['普通怪先观察攻击前摇。', '盾怪优先绕侧面或用弓箭打断。', '守护者激光适合练盾反，但失败惩罚高，先备盾和料理。']
  },
  {
    id: 'shrine_route',
    group: 'guide',
    name: '神庙挑战',
    icon: '🔮',
    subtitle: '试炼攻略',
    desc: '神庙挑战完成后获得克服之玉，用于女神像兑换心之容器或精力容器。',
    locations: ['各区域神庙入口'],
    guide: ['手机上题目会自动进入下一题。', '结算页会显示错题、正确答案，并提供获得奖励、重试或关闭。', '优先凑齐 4 个克服之玉兑换一次属性。']
  }
];

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
        guide: this._enemyGuide(id, def, drops),
        search: `${id} ${def.name} ${drops.join(' ')} ${COMPENDIUM_ENEMY_LOCATIONS[id] || ''}`
      };
    });
  },

  itemEntries() {
    const shopSources = this._shopSources();
    const craftSources = this._craftSources();
    const cookingSources = this._cookingSources();
    const dropSources = this._enemyDropSources();
    return Object.entries(ITEMS || {}).map(([id, def]) => {
      const sources = [];
      const actual = COMPENDIUM_ACTUAL_ITEM_SOURCES[id] || null;
      if (shopSources[id]) sources.push(...shopSources[id]);
      if (craftSources[id]) sources.push(craftSources[id]);
      if (cookingSources[id]) sources.push(cookingSources[id]);
      if (dropSources[id]) sources.push(...dropSources[id]);
      if (actual) sources.push(...actual.sources);
      if (COMPENDIUM_ITEM_LOCATION_HINTS[id]) sources.push(...COMPENDIUM_ITEM_LOCATION_HINTS[id]);
      const locations = [
        ...((actual && actual.locations) || []),
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
        guide: this._itemGuide(id, def, sources),
        search: `${id} ${def.name} ${def.type} ${def.desc || ''} ${(sources || []).join(' ')} ${((actual && actual.guide) || []).join(' ')}`
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
      guide: this._npcGuide(row),
      search: `${row.name} ${row.type} ${row.desc} ${this.worldName(row.world)}`
    }));
  },

  guideEntries() {
    return COMPENDIUM_GUIDE_ENTRIES.map(row => ({
      id: row.id,
      kind: 'guide',
      group: row.group,
      name: row.name,
      icon: row.icon,
      subtitle: row.subtitle,
      stats: [['类型', row.group === 'story' ? '剧情' : '攻略']],
      desc: row.desc,
      sources: ['百科攻略'],
      locations: row.locations || [],
      guide: row.guide || [],
      story: row.story || [],
      search: `${row.name} ${row.subtitle} ${row.desc} ${(row.locations || []).join(' ')} ${(row.guide || []).join(' ')} ${(row.story || []).join(' ')}`
    }));
  },

  allEntries() {
    return [...this.enemyEntries(), ...this.itemEntries(), ...this.npcEntries(), ...this.guideEntries()]
      .sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name, 'zh-CN'));
  },

  _enemyDesc(id, def) {
    if (def.finalBoss) return '盘踞海拉鲁城堡深处的最终灾厄，建议集齐四神兽祝福、高阶装备和充足料理后挑战。';
    if (def.boss) return `${def.name} 是大型 Boss，生命与攻击都很高。观察前摇、利用盾反和元素克制可以显著降低风险。`;
    if (def.miniBoss) return `${def.name} 属于精英敌人，伤害和血量远高于普通怪物，掉落也更稀有。`;
    if (def.ai === 'ranged') return `${def.name} 擅长远程攻击，接近前注意横向移动或举盾。`;
    return `${def.name} 是常见敌人，会巡逻、追击并在近距离蓄力攻击。`;
  },

  _enemyGuide(id, def, drops) {
    const rows = [];
    if (def.finalBoss) rows.push('最终战前建议解放四大神兽、准备古代装备、盾和高回复料理。');
    else if (def.boss) rows.push('Boss 战先观察前摇，打出硬直后再贪刀；低血量时优先拉开距离吃料理。');
    else if (def.miniBoss) rows.push('精英怪伤害高，建议用弓箭、元素武器或地形先制造优势。');
    else if (def.ai === 'ranged') rows.push('远程敌人优先处理；横向移动或举盾接近，近身后连续攻击。');
    else rows.push('普通近战怪适合练闪避、盾反和基础连击。');
    if (def.element) rows.push(`属性：${{ fire: '火', ice: '冰', shock: '雷' }[def.element] || def.element}，可用相反抗性料理或保持距离降低风险。`);
    if (drops && drops.length) rows.push(`刷取价值：${drops.slice(0, 5).join('、')}${drops.length > 5 ? '等' : ''}。`);
    return rows;
  },

  _itemGuide(id, def, sources) {
    const actual = COMPENDIUM_ACTUAL_ITEM_SOURCES[id];
    const rows = [];
    if (actual && actual.guide) rows.push(...actual.guide);
    if (def.type === 'material') rows.push('材料用途：主要用于打造、料理或后续任务；缺材料时优先看上方“来源/掉落/用途”的真实入口。');
    if (def.type === 'food' && def.subtype === 'raw') rows.push('生食可以直接回血，但更推荐在烹饪锅做成料理，收益更高。');
    if (def.type === 'food' && def.subtype === 'cooked') rows.push('料理通过烹饪锅制作；不同材料组合会决定回血、体力或抗性效果。');
    if (['weapon', 'shield', 'bow'].includes(def.type)) {
      rows.push('装备建议：怪物/宝箱掉落为原始耐久，自己打造的同类装备耐久为 10 倍。');
      if (def.critChance) rows.push(`暴击率加成：约 ${Math.round(def.critChance * 1000) / 10}%。暴击最高可造成 3 倍伤害。`);
    }
    if (def.type === 'armor_upper' || def.type === 'armor_lower') rows.push('防具建议：成套穿戴可触发套装思路，优先按区域抗性需求打造。');
    if (!rows.length && sources && sources.length) rows.push('按来源列表获取；如果是稀有掉落，建议刷对应强敌或区域宝箱。');
    return Array.from(new Set(rows));
  },

  _npcGuide(row) {
    if (row.type === '商店') return ['商店是材料兜底入口：野外找不到时可以直接购买基础补给。'];
    if (row.id === 'shrines') return ['神庙挑战完成后获得克服之玉，攒够数量去女神像兑换生命或体力。'];
    if (row.id === 'beastTerminals') return ['四大神兽终端会推进对应英杰剧情，挑战前准备好区域抗性料理。'];
    if (row.id === 'masterSwordPedestal') return ['需要 13 颗心才能拔剑；体力不够不影响拔剑条件。'];
    return ['靠近后按交互/对话按钮，可推进剧情、打开设施或获得提示。'];
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

  _cookingSources() {
    const out = {};
    if (typeof COOKING_RECIPES === 'undefined') return out;
    for (const row of Object.values(COOKING_RECIPES)) {
      if (!row || !row.result) continue;
      out[row.result] = `烹饪：${row.desc || '使用食材在烹饪锅制作'}`;
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
