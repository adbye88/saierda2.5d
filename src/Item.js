/* ========================================================
   Item.js v3 — 全量旷野之息物品数据
   武器/盾/弓/防具/食材/料理/材料/钥匙
   属性尽量贴合《塞尔达传说·旷野之息》原作数值
   ======================================================== */

const ITEMS = {
  // ============ 单手剑 ============
  travelerSword:    { name: '旅人之剑',       type: 'weapon', subtype: 'sword', icon: '🗡️', atk: 5,  durability: 20,  desc: '旅人爱用的剑。虽普通但可靠。' },
  soldierSword:     { name: '士兵之剑',       type: 'weapon', subtype: 'sword', icon: '⚔️', atk: 14, durability: 30, critChance: 0.015, desc: '海拉鲁士兵的制式长剑。' },
  knightSword:      { name: '骑士之剑',       type: 'weapon', subtype: 'sword', icon: '⚔️', atk: 26, durability: 40, critChance: 0.03, desc: '骑士团精英的精钢剑。' },
  royalSword:       { name: '王族之剑',       type: 'weapon', subtype: 'sword', icon: '⚔️', atk: 36, durability: 50, critChance: 0.05, critMultiplierBonus: 0.25, desc: '海拉鲁王族传承的名剑。' },
  masterSword:      { name: '大师之剑',       type: 'weapon', subtype: 'sword', icon: '🌟', atk: 30, durability: 999, critChance: 0.04, critMultiplierBonus: 0.2, desc: '驱魔之剑，常态攻击30；面对守护者、神兽与灾厄时觉醒为60。' },
  bokoClub:         { name: '波克布林之棒',   type: 'weapon', subtype: 'sword', icon: '🏏', atk: 4,  durability: 15,  desc: '粗糙的木棒，波克布林常用。' },
  rustyBroadsword:  { name: '生锈的阔剑',     type: 'weapon', subtype: 'sword', icon: '🗡️', atk: 6,  durability: 8,   desc: '锈迹斑斑的旧剑，快坏了。' },
  flameblade:       { name: '火焰之剑',       type: 'weapon', subtype: 'sword', icon: '🔥', atk: 28, durability: 35, element: 'fire',  desc: '蕴含火之力的红热剑刃，点燃敌人。' },
  frostblade:       { name: '冰雪之剑',       type: 'weapon', subtype: 'sword', icon: '❄️', atk: 28, durability: 35, element: 'ice',   desc: '散发寒气的蓝色剑刃，冻结敌人。' },
  thunderblade:     { name: '雷电之剑',       type: 'weapon', subtype: 'sword', icon: '⚡', atk: 32, durability: 35, element: 'shock', desc: '缠绕电弧的剑，麻痹敌人。' },
  ancientShortSword:{ name: '古代兵装·剑',    type: 'weapon', subtype: 'sword', icon: '⚔️', atk: 40, durability: 55, critChance: 0.04, desc: '古代希卡技术的产物，对守护者伤害加成。' },
  ancientGreatsword:{ name: '古代兵装·大剑',  type: 'weapon', subtype: 'claymore', icon: '⚔️', atk: 58, durability: 55, critChance: 0.045, critMultiplierBonus: 0.2, desc: '古代技术打造的重剑，适合对付大型敌人。' },
  forestDwellerSword:{ name: '森民之剑',      type: 'weapon', subtype: 'sword', icon: '🌿', atk: 22, durability: 35, critChance: 0.035, desc: '森林工匠打造的轻剑，挥动迅速。' },
  zoraSword:        { name: '卓拉之剑',       type: 'weapon', subtype: 'sword', icon: '💧', atk: 24, durability: 45, element: 'ice', desc: '水之民传承的银蓝剑。' },
  gerudoScimitar:   { name: '格鲁德弯刀',     type: 'weapon', subtype: 'sword', icon: '🌙', atk: 28, durability: 38, desc: '沙漠战士使用的弯刀。' },
  scimitarOfSeven:  { name: '七宝匕首',       type: 'weapon', subtype: 'sword', icon: '🌙', atk: 42, durability: 60, desc: '格鲁德英杰传承的名刃，轻巧锋利。' },
  eightfoldBlade:   { name: '戒心小刀',       type: 'weapon', subtype: 'sword', icon: '🗡️', atk: 30, durability: 30, critChance: 0.06, critMultiplierBonus: 0.35, desc: '隐秘战士使用的短刀，背刺伤害高。' },
  savageLynelSword: { name: '兽神剑',         type: 'weapon', subtype: 'sword', icon: '🦁', atk: 58, durability: 42, critChance: 0.07, critMultiplierBonus: 0.45, desc: '强敌战利品，破坏力惊人。' },

  // ============ 双手剑/长枪 ============
  bokoBoneSpear:    { name: '波克布林之骨枪', type: 'weapon', subtype: 'spear', icon: '🔱', atk: 8,  durability: 15,  desc: '骨头拼成的长枪，攻击距离较远。' },
  soldierSpear:     { name: '士兵之枪',       type: 'weapon', subtype: 'spear', icon: '🔱', atk: 12, durability: 30, critChance: 0.015, desc: '制式长枪，可远距离戳刺。' },
  knightHalberd:    { name: '骑士之斧枪',     type: 'weapon', subtype: 'spear', icon: '🔱', atk: 22, durability: 40, critChance: 0.03, desc: '骑士团的重型长柄武器。' },
  royalHalberd:     { name: '王族之斧枪',     type: 'weapon', subtype: 'spear', icon: '🔱', atk: 30, durability: 50, critChance: 0.05, critMultiplierBonus: 0.2, desc: '王族近卫的长柄武器。' },
  ancientSpear:     { name: '古代兵装·枪',    type: 'weapon', subtype: 'spear', icon: '🔱', atk: 30, durability: 50, desc: '古代技术的长枪。' },
  lightscaleTrident:{ name: '光鳞之枪',       type: 'weapon', subtype: 'spear', icon: '🔱', atk: 44, durability: 70, element: 'ice', desc: '卓拉英杰传承的银白长枪。' },
  travelerClaymore: { name: '旅人双手剑',     type: 'weapon', subtype: 'claymore', icon: '🗡️', atk: 10, durability: 22, desc: '沉重但容易上手的双手剑。' },
  soldierClaymore:  { name: '士兵双手剑',     type: 'weapon', subtype: 'claymore', icon: '⚔️', atk: 20, durability: 32, critChance: 0.02, desc: '士兵装备的重剑。' },
  knightClaymore:   { name: '骑士双手剑',     type: 'weapon', subtype: 'claymore', icon: '⚔️', atk: 34, durability: 45, critChance: 0.035, desc: '骑士团用于破阵的重剑。' },
  royalClaymore:    { name: '王族双手剑',     type: 'weapon', subtype: 'claymore', icon: '⚔️', atk: 52, durability: 55, critChance: 0.055, critMultiplierBonus: 0.3, desc: '王族近卫的高阶重剑。' },
  royalGuardClaymore:{ name: '近卫双手剑',    type: 'weapon', subtype: 'claymore', icon: '⚔️', atk: 64, durability: 28, critChance: 0.08, critMultiplierBonus: 0.5, desc: '王城近卫的决战重剑，威力高但耐久较低。' },
  goronCrusher:     { name: '碎岩巨锤',       type: 'weapon', subtype: 'club', icon: '🔨', atk: 42, durability: 55, element: 'fire', desc: '火山工匠打造的破岩重锤。' },
  boulderBreaker:   { name: '碎岩剑',         type: 'weapon', subtype: 'club', icon: '🔨', atk: 60, durability: 60, element: 'fire', desc: '戈隆英杰传承的破岩重兵器。' },

  // ============ 盾 ============
  woodenShield:     { name: '木之盾',         type: 'shield', icon: '🛡️', durability: 12, def: 2,  desc: '木制圆盾，易燃但轻便。' },
  bokoShield:       { name: '波克布林之盾',   type: 'shield', icon: '🛡️', durability: 10, def: 3,  desc: '波克布林用骨头拼的盾。' },
  soldierShield:    { name: '士兵之盾',       type: 'shield', icon: '🛡️', durability: 25, def: 5,  desc: '金属盾，坚固可靠。' },
  knightShield:     { name: '骑士之盾',       type: 'shield', icon: '🛡️', durability: 40, def: 8,  desc: '骑士团重盾，能挡强击。' },
  hylianShield:     { name: '海利亚盾',       type: 'shield', icon: '🛡️', durability: 999, def: 20, desc: '海利亚皇室最强之盾，永不损坏。' },
  ancientShield:    { name: '古代兵装·盾',    type: 'shield', icon: '🛡️', durability: 60, def: 15, desc: '古代技术的高强度盾。' },
  daybreakerShield: { name: '七宝盾',         type: 'shield', icon: '🛡️', durability: 65, def: 16, resist: 'heat', desc: '格鲁德英杰传承的华丽盾牌。' },
  zoraShield:       { name: '卓拉之盾',       type: 'shield', icon: '🛡️', durability: 38, def: 7, resist: 'cold', desc: '卓拉族的银蓝盾。' },
  gerudoShield:     { name: '格鲁德盾',       type: 'shield', icon: '🛡️', durability: 34, def: 9, resist: 'heat', desc: '沙漠战士使用的弧形盾。' },
  radiantShield:    { name: '辉光盾',         type: 'shield', icon: '🛡️', durability: 44, def: 12, desc: '镶嵌宝石的高级盾牌。' },
  royalGuardShield: { name: '近卫盾',         type: 'shield', icon: '🛡️', durability: 32, def: 18, desc: '王城近卫使用的高强度盾。' },

  // ============ 弓 ============
  travelerBow:      { name: '旅人之弓',       type: 'bow', icon: '🏹', durability: 20, atk: 4,  desc: '简单的木弓。' },
  soldierBow:       { name: '士兵之弓',       type: 'bow', icon: '🏹', durability: 35, atk: 10, critChance: 0.015, desc: '士兵用的强弓。' },
  knightBow:        { name: '骑士之弓',       type: 'bow', icon: '🏹', durability: 50, atk: 15, critChance: 0.03, desc: '骑士团的精制弓。' },
  royalBow:         { name: '王族之弓',       type: 'bow', icon: '🏹', durability: 60, atk: 25, critChance: 0.06, critMultiplierBonus: 0.25, desc: '王族的高级弓。' },
  ancientBow:       { name: '古代兵装·弓',    type: 'bow', icon: '🏹', durability: 70, atk: 30, critChance: 0.04, critMultiplierBonus: 0.2, desc: '古代技术的精准弓。' },
  greatEagleBow:    { name: '大鹫弓',         type: 'bow', icon: '🏹', durability: 65, atk: 34, critChance: 0.07, critMultiplierBonus: 0.35, desc: '利特英杰传承的强弓，射程与稳定性出众。' },
  fireBow:          { name: '火焰之弓',       type: 'bow', icon: '🏹', durability: 45, atk: 15, element: 'fire',  desc: '射出火箭，点燃目标。' },
  iceBow:           { name: '冰雪之弓',       type: 'bow', icon: '🏹', durability: 45, atk: 15, element: 'ice',   desc: '射出冰箭，冻结目标。' },
  shockBow:         { name: '雷电之弓',       type: 'bow', icon: '🏹', durability: 45, atk: 18, element: 'shock', desc: '射出电箭，麻痹目标。' },
  forestDwellerBow: { name: '森民之弓',       type: 'bow', icon: '🏹', durability: 42, atk: 14, critChance: 0.035, desc: '森林工匠制作的轻弓。' },
  falconBow:        { name: '飞燕弓',         type: 'bow', icon: '🏹', durability: 50, atk: 20, critChance: 0.055, critMultiplierBonus: 0.2, desc: '利特族使用的远射弓。' },
  duplexBow:        { name: '二连弓',         type: 'bow', icon: '🏹', durability: 32, atk: 18, critChance: 0.05, desc: '一次射出两束箭影，爆发强。' },
  savageLynelBow:   { name: '兽神弓',         type: 'bow', icon: '🏹', durability: 45, atk: 32, critChance: 0.08, critMultiplierBonus: 0.45, desc: '强敌战利品，威力极高。' },

  // ============ 防具（上衣+裤子，可防寒/防火/防热） ============
  // 普通防具
  wellWornTrousers: { name: '穿旧的裤子',     type: 'armor_lower', icon: '👖', def: 1, set: 'starter', desc: '一开始就穿着的旧裤子，聊胜于无。' },
  oldShirt:         { name: '旧衬衫',         type: 'armor_upper', icon: '👕', def: 1, set: 'starter', desc: '一开始就穿的旧衬衫。' },
  hylianTunic:      { name: '海利亚上衣',     type: 'armor_upper', icon: '👕', def: 3, set: 'hylian', desc: '海利亚人的标准上衣。' },
  hylianTrousers:   { name: '海利亚裤子',     type: 'armor_lower', icon: '👖', def: 3, set: 'hylian', desc: '海利亚人的标准裤子。' },
  // 防寒套装（雪山用）
  warmDoublet:      { name: '雪羽上衣',       type: 'armor_upper', icon: '🧥', def: 3, resist: 'cold', set: 'snowquill', desc: '内衬羽绒的上衣，雪山防寒必备。' },
  snowQuillTrousers:{ name: '雪羽裤子',       type: 'armor_lower', icon: '👖', def: 3, resist: 'cold', set: 'snowquill', desc: '用雪羽制作的防寒裤。' },
  // 防火套装（火山用）
  flamebreakerArmor:{ name: '耐火上衣',       type: 'armor_upper', icon: '🧥', def: 4, resist: 'fire', set: 'flamebreaker', desc: '戈隆族特制的耐火上衣，火山必备。' },
  flamebreakerBoots:{ name: '耐火裤靴',       type: 'armor_lower', icon: '👖', def: 4, resist: 'fire', set: 'flamebreaker', desc: '戈隆族特制的耐火裤。' },
  // 防热套装（沙漠用）
  desertVoeTrousers:{ name: '沙漠勇士裤',     type: 'armor_lower', icon: '👖', def: 3, resist: 'heat', set: 'desertVoe', desc: '格鲁德防热裤，沙漠必备。' },
  desertVoeHeadband:{ name: '沙漠勇士上衣',   type: 'armor_upper', icon: '🧥', def: 3, resist: 'heat', set: 'desertVoe', desc: '格鲁德防热上衣。' },
  // 古代套装
  ancientArmor:     { name: '古代兵装·上衣',  type: 'armor_upper', icon: '🧥', def: 6, set: 'ancient', desc: '古代技术的护甲，防御力高。' },
  ancientGreaves:   { name: '古代兵装·护胫',  type: 'armor_lower', icon: '👖', def: 6, set: 'ancient', desc: '古代技术的护胫。' },
  stealthChestGuard:{ name: '潜行紧身服',     type: 'armor_upper', icon: '🥷', def: 2, set: 'stealth', desc: '卡卡利科秘传服装，移动声很轻。' },
  stealthTights:    { name: '潜行紧身裤',     type: 'armor_lower', icon: '👖', def: 2, set: 'stealth', desc: '卡卡利科秘传裤装，适合绕后袭击。' },
  climbingGear:     { name: '攀登护手',       type: 'armor_upper', icon: '🧗', def: 3, set: 'climbing', desc: '能抓稳岩壁和山坡的护具。' },
  climbingBoots:    { name: '攀登靴',         type: 'armor_lower', icon: '🥾', def: 3, set: 'climbing', desc: '便于爬坡的轻靴。' },
  barbarianArmor:   { name: '蛮族上衣',       type: 'armor_upper', icon: '💪', def: 4, set: 'barbarian', desc: '战斗民族的上衣，激发攻击本能。' },
  barbarianLegWraps:{ name: '蛮族短裤',       type: 'armor_lower', icon: '👖', def: 4, set: 'barbarian', desc: '适合猛攻的战斗裤。' },
  zoraArmor:        { name: '卓拉铠甲',       type: 'armor_upper', icon: '💧', def: 4, resist: 'cold', set: 'zora', desc: '水之民打造的铠甲，亲水且轻盈。' },
  zoraGreaves:      { name: '卓拉护胫',       type: 'armor_lower', icon: '👖', def: 4, resist: 'cold', set: 'zora', desc: '卓拉族护腿，适合河湖地形。' },
  radiantShirt:     { name: '辉光上衣',       type: 'armor_upper', icon: '✨', def: 4, set: 'radiant', desc: '用发光矿石织成，对骷髅敌人有效。' },
  radiantTights:    { name: '辉光裤子',       type: 'armor_lower', icon: '👖', def: 4, set: 'radiant', desc: '散发幽光的裤装。' },
  royalGuardUniform:{ name: '近卫上衣',       type: 'armor_upper', icon: '🎖️', def: 5, set: 'royalGuard', desc: '王城近卫的礼装，适合决战。' },
  royalGuardBoots:  { name: '近卫长靴',       type: 'armor_lower', icon: '🥾', def: 5, set: 'royalGuard', desc: '王城近卫的长靴。' },

  // ============ 食材（生吃用） ============
  apple:            { name: '苹果',           type: 'food', subtype: 'raw', icon: '🍎', heal: 3, stackable: true, element: null,  desc: '海拉鲁常见的红苹果。' },
  heartyApple:      { name: '生命苹果',       type: 'food', subtype: 'raw', icon: '🍏', heal: 4, stackable: true, tag: 'hearty', desc: '蕴含生命之力，可额外回满血。' },
  mushroom:         { name: '海拉鲁蘑菇',     type: 'food', subtype: 'raw', icon: '🍄', heal: 2, stackable: true, desc: '森林里的蘑菇。' },
  stamellaShroom:   { name: '毅力蘑菇',       type: 'food', subtype: 'raw', icon: '🍄', heal: 2, stackable: true, tag: 'stamina', desc: '黄色蘑菇，恢复体力。' },
  rawMeat:          { name: '生肉',           type: 'food', subtype: 'raw', icon: '🥩', heal: 2, stackable: true, desc: '打猎获得的生肉。' },
  birdEgg:          { name: '鸟蛋',           type: 'food', subtype: 'raw', icon: '🥚', heal: 2, stackable: true, desc: '鸟窝里捡的蛋。' },
  hyruleBass:       { name: '海拉鲁鲈鱼',     type: 'food', subtype: 'raw', icon: '🐟', heal: 2, stackable: true, desc: '河里钓的鱼。' },
  spicyPepper:      { name: '暖暖草果',       type: 'food', subtype: 'raw', icon: '🌶️', heal: 1, stackable: true, element: 'cold', desc: '辛辣的草果，防寒料理必备。' },
  sunshroom:        { name: '向阳蘑菇',       type: 'food', subtype: 'raw', icon: '🍄', heal: 2, stackable: true, element: 'heat', desc: '吸收阳光的蘑菇。' },
  voltfruit:        { name: '酥麻水果',       type: 'food', subtype: 'raw', icon: '🌵', heal: 2, stackable: true, element: 'shock', desc: '带电的果实。' },
  goronSpice:       { name: '戈隆香料',       type: 'food', subtype: 'raw', icon: '🧂', heal: 0, stackable: true, desc: '戈隆族的调味料。' },
  rawPrimeMeat:     { name: '高级生肉',       type: 'food', subtype: 'raw', icon: '🥩', heal: 4, stackable: true, desc: '优质猎物的肉。' },
  courserBeeHoney:  { name: '蜂巢',           type: 'food', subtype: 'raw', icon: '🍯', heal: 3, stackable: true, tag: 'stamina', desc: '野蜂的蜂巢，恢复体力。' },

  // ============ 料理（烹饪产物） ============
  roastedMeat:      { name: '烤肉',           type: 'food', subtype: 'cooked', icon: '🍖', heal: 6, stackable: true, desc: '篝火烤制的肉。' },
  roastedApple:     { name: '烤苹果',         type: 'food', subtype: 'cooked', icon: '🍎', heal: 4, stackable: true, desc: '烤过的苹果，更甜。' },
  mushroomSkewer:   { name: '蘑菇串烧',       type: 'food', subtype: 'cooked', icon: '🍢', heal: 6, stackable: true, desc: '多种蘑菇串烤而成。' },
  meatSkewer:       { name: '肉串烧',         type: 'food', subtype: 'cooked', icon: '🍢', heal: 8, stackable: true, desc: '肉串烤而成。' },
  seafoodSkewer:    { name: '海鲜串烧',       type: 'food', subtype: 'cooked', icon: '🍢', heal: 7, stackable: true, desc: '鱼和贝类串烧。' },
  heartySkewer:     { name: '生命串烧',       type: 'food', subtype: 'cooked', icon: '🍢', heal: 8, stackable: true, tag: 'hearty', desc: '生命系食材做的串烧，回满血。' },
  staminaSkewer:    { name: '毅力串烧',       type: 'food', subtype: 'cooked', icon: '🍢', heal: 4, stackable: true, tag: 'stamina', desc: '毅力系食材做的串烧，先回一部分体力，并在短时间内持续恢复。' },
  staminaElixir:    { name: '毅力药',         type: 'food', subtype: 'cooked', icon: '🧪', heal: 0, stackable: true, tag: 'stamina', desc: '用怪物材料和毅力食材调成的药，能缓慢自动恢复体力。' },
  spicyMeatSkewer:  { name: '暖暖肉串',       type: 'food', subtype: 'cooked', icon: '🍢', heal: 6, stackable: true, buff: 'coldRes', buffDur: 300, desc: '防寒料理，食用后抵御严寒5分钟。' },
  chillMeatSkewer:  { name: '沁凉肉串',       type: 'food', subtype: 'cooked', icon: '🍢', heal: 6, stackable: true, buff: 'heatRes', buffDur: 300, desc: '防热料理，食用后抵御酷热5分钟。' },
  flameproofDish:   { name: '防火料理',       type: 'food', subtype: 'cooked', icon: '🍲', heal: 6, stackable: true, buff: 'fireRes', buffDur: 300, desc: '戈隆特制，食用后短暂耐火。' },
  hastyElixir:      { name: '加速药',         type: 'food', subtype: 'cooked', icon: '🧪', heal: 0, stackable: true, buff: 'speed', buffDur: 180, desc: '饮用后移速提升3分钟。' },
  mightyElixir:     { name: '攻击药',         type: 'food', subtype: 'cooked', icon: '🧪', heal: 0, stackable: true, buff: 'attack', buffDur: 180, desc: '饮用后攻击力提升3分钟。' },
  toughElixir:      { name: '防御药',         type: 'food', subtype: 'cooked', icon: '🧪', heal: 0, stackable: true, buff: 'defense', buffDur: 180, desc: '饮用后防御力提升3分钟。' },

  // ============ 材料 ============
  rupee:            { name: '卢比',           type: 'material', icon: '💎', stackable: true, desc: '海拉鲁的货币。' },
  arrow:            { name: '箭矢',           type: 'material', icon: '➹', stackable: true, desc: '弓的弹药。' },
  bokoblinHorn:     { name: '波克布林之角',   type: 'material', icon: '🦴', stackable: true, desc: '波克布林掉落的角。' },
  bokoblinFang:     { name: '波克布林之牙',   type: 'material', icon: '🦷', stackable: true, desc: '波克布林掉落的牙。' },
  bokoblinGuts:     { name: '波克布林之内脏', type: 'material', icon: '🫀', stackable: true, desc: '波克布林掉落的内脏，珍贵。' },
  moblinHorn:       { name: '莫力布林之角',   type: 'material', icon: '🦴', stackable: true, desc: '莫力布林掉落的角。' },
  moblinFang:       { name: '莫力布林之牙',   type: 'material', icon: '🦷', stackable: true, desc: '莫力布林掉落的牙。' },
  lizalfosTail:     { name: '蜥蜴战士之尾',   type: 'material', icon: '🐍', stackable: true, desc: '蜥蜴战士的尾巴。' },
  lizalfosHorn:     { name: '蜥蜴战士之角',   type: 'material', icon: '🦴', stackable: true, desc: '蜥蜴战士的角。' },
  octorokEyeball:   { name: '章鱼怪眼球',     type: 'material', icon: '👁️', stackable: true, desc: '章鱼怪的眼球，可做药。' },
  lynelHorn:        { name: '莱尼尔之角',     type: 'material', icon: '🦴', stackable: true, desc: '莱尼尔掉落的坚硬战角。' },
  lynelHoof:        { name: '莱尼尔之蹄',     type: 'material', icon: '🟤', stackable: true, desc: '莱尼尔的强韧蹄甲，是高级装备材料。' },
  lynelGuts:        { name: '莱尼尔之肝',     type: 'material', icon: '🫀', stackable: true, desc: '稀有强敌材料，常用于英杰装备合成。' },
  moldugaFin:       { name: '魔吉拉德背鳍',   type: 'material', icon: '🔶', stackable: true, desc: '沙海巨兽的厚重背鳍。' },
  moldugaGuts:      { name: '魔吉拉德内脏',   type: 'material', icon: '🫀', stackable: true, desc: '极稀有的沙漠 Boss 材料。' },
  guardianGear:     { name: '古代齿轮',       type: 'material', icon: '⚙️', stackable: true, desc: '守护者机体中的精密齿轮。' },
  guardianSpring:   { name: '古代弹簧',       type: 'material', icon: '〰️', stackable: true, desc: '古代机械用的弹簧零件。' },
  chuchuJelly:      { name: '丘丘胶',         type: 'material', icon: '🟦', stackable: true, desc: '史莱姆的胶质，料理常用。' },
  redChuchuJelly:   { name: '红丘丘胶',       type: 'material', icon: '🟥', stackable: true, element: 'fire',  desc: '火属性丘丘胶。' },
  whiteChuchuJelly: { name: '白丘丘胶',       type: 'material', icon: '⬜', stackable: true, element: 'ice',   desc: '冰属性丘丘胶。' },
  yellowChuchuJelly:{ name: '黄丘丘胶',       type: 'material', icon: '🟨', stackable: true, element: 'shock', desc: '雷属性丘丘胶。' },
  amber:            { name: '琥珀',           type: 'material', icon: '🟡', stackable: true, desc: '发光的矿石。' },
  opal:             { name: '蛋白石',         type: 'material', icon: '⚪', stackable: true, desc: '乳白色宝石。' },
  ruby:             { name: '红宝石',         type: 'material', icon: '🔴', stackable: true, desc: '火焰般的红色宝石。' },
  sapphire:         { name: '蓝宝石',         type: 'material', icon: '🔵', stackable: true, desc: '冰蓝的蓝色宝石。' },
  topaz:            { name: '黄玉',           type: 'material', icon: '🟠', stackable: true, desc: '金黄色的宝石。' },
  ancientScrew:     { name: '古代螺丝',       type: 'material', icon: '🔩', stackable: true, desc: '守护者掉落的古代零件。' },
  ancientShaft:     { name: '古代轴承',       type: 'material', icon: '⚙️', stackable: true, desc: '守护者掉落的古代零件。' },
  ancientCore:      { name: '古代核心',       type: 'material', icon: '🔮', stackable: true, desc: '稀有的古代核心，最强材料。' },
  starFragment:     { name: '星星的碎片',     type: 'material', icon: '✨', stackable: true, desc: '夜晚陨落的星之碎片，最稀有。' },
  dragonScale:      { name: '龙鳞碎片',       type: 'material', icon: '◇', stackable: true, desc: '古老龙族遗落的鳞片碎片，蕴含神秘力量。' },
  luminousStone:    { name: '夜光石',         type: 'material', icon: '🟢', stackable: true, desc: '夜晚会微微发亮的矿石。' },
  flint:            { name: '火打石',         type: 'material', icon: '🪨', stackable: true, desc: '可用于生火。' },
  wood:             { name: '木材',           type: 'material', icon: '🪵', stackable: true, desc: '砍树获得的木材。' },

  // ============ 钥匙/任务物品 ============
  keySmall:         { name: '小钥匙',         type: 'key', icon: '🗝️', desc: '开启地牢深处之门。' },
  sheikahSlate:     { name: '希卡石板',       type: 'key', icon: '📱', desc: '神秘的古代终端，可解锁远古塔与传送。' },
  spiritOrb:        { name: '克服之玉',       type: 'key', icon: '🔮', stackable: true, desc: '完成试炼获得，可在女神像处兑换心之容器或精力容器。' },
  heartContainer:   { name: '心之容器',       type: 'key', icon: '❤️', stackable: true, desc: '每获得一个，最大生命+1颗心。' },
  staminaVessel:    { name: '精力容器',       type: 'key', icon: '⭐', stackable: true, desc: '每获得一个，最大体力+20。' },
};

// ---------- 料理配方表 ----------
// 规则：任选 1-5 个食材，按"主材料 + 特性"判断结果
// 主材料类型决定名称，特性标签决定 buff
const COOKING_RECIPES = {
  // [组成条件] => 结果 itemId
  meatOnly:       { result: 'meatSkewer',     desc: '纯肉料理' },
  fishOnly:       { result: 'seafoodSkewer',  desc: '海鲜料理' },
  mushroomOnly:   { result: 'mushroomSkewer', desc: '蘑菇料理' },
  fruitOnly:      { result: 'roastedApple',   desc: '水果料理' },
  hearty:         { result: 'heartySkewer',   desc: '生命料理' },
  stamina:        { result: 'staminaSkewer',  desc: '毅力料理' },
  staminaElixir:  { result: 'staminaElixir',  desc: '毅力药' },
  coldRes:        { result: 'spicyMeatSkewer',desc: '防寒料理' },
  heatRes:        { result: 'chillMeatSkewer',desc: '防热料理' },
  fireRes:        { result: 'flameproofDish', desc: '防火料理' },
  speedBuff:      { result: 'hastyElixir',    desc: '加速药' },
  attackBuff:     { result: 'mightyElixir',   desc: '攻击药' },
  defenseBuff:    { result: 'toughElixir',    desc: '防御药' }
};

// ---------- 装备词条 ----------
// 只改数值和显示，不新增高成本渲染资源，适合浏览器端轻量开放世界循环。
const ITEM_MODIFIERS = {
  sturdy: { id: 'sturdy', name: '耐用', color: '#9fd3ff', bonusDurabilityMultiplier: 0.35, desc: '最大耐久提高' },
  sharp: { id: 'sharp', name: '锋利', color: '#ffd36a', bonusAtk: 3, desc: '攻击提高' },
  keen: { id: 'keen', name: '会心', color: '#ff9ff3', bonusCritChance: 0.035, desc: '暴击率提高' },
  brutal: { id: 'brutal', name: '凶猛', color: '#ff8a6a', bonusAtk: 5, bonusCritMultiplier: 0.25, desc: '攻击与暴击倍率提高' },
  guarded: { id: 'guarded', name: '坚守', color: '#b8f7c6', bonusDef: 2, desc: '盾防御提高' }
};

function resolveItemModifier(modifier) {
  if (!modifier) return null;
  if (typeof modifier === 'string') return ITEM_MODIFIERS[modifier] || null;
  if (modifier.id && ITEM_MODIFIERS[modifier.id]) return ITEM_MODIFIERS[modifier.id];
  return modifier;
}

function rollItemModifier(def, options = {}) {
  if (!def || !['weapon', 'shield', 'bow'].includes(def.type)) return null;
  if (options.source === 'crafted') return null;
  const chance = options.modifierChance !== undefined ? Number(options.modifierChance) : 0.32;
  if (options.rollModifier !== 'always' && Math.random() > chance) return null;
  const pool = def.type === 'shield'
    ? ['sturdy', 'guarded', 'keen']
    : ['sturdy', 'sharp', 'keen', 'brutal'];
  return ITEM_MODIFIERS[pool[Math.floor(Math.random() * pool.length)]];
}

// ---------- 物品堆叠 ----------
class ItemStack {
  constructor(itemId, count = 1, options = {}) {
    this.itemId = itemId;
    this.count = count;
    const def = ITEMS[itemId] || {};
    const baseDurability = def.durability || 0;
    const durable = ['weapon', 'shield', 'bow'].includes(def.type) && baseDurability > 0;
    const multiplier = durable ? Math.max(1, Number(options.durabilityMultiplier || 1)) : 1;
    this.source = options.source || 'world';
    this.modifier = resolveItemModifier(options.modifier) || null;
    this.maxDurability = durable ? Math.round(baseDurability * multiplier) : baseDurability;
    this.durability = options.durability !== undefined
      ? options.durability
      : this.maxDurability;
  }
  get def() { return ITEMS[this.itemId]; }
  get name() { return this.modifier ? `${this.modifier.name}·${this.def.name}` : this.def.name; }
}

function newItemStack(itemId, count = 1, options = {}) {
  const def = ITEMS[itemId];
  const modifier = resolveItemModifier(options.modifier) || (options.rollModifier ? rollItemModifier(def, options) : null);
  const stack = new ItemStack(itemId, count, Object.assign({}, options, { modifier }));
  if ((def.type === 'weapon' || def.type === 'shield' || def.type === 'bow') && def.durability && !options.durabilityMultiplier && options.durability === undefined) {
    stack.maxDurability = def.durability;
    stack.durability = def.durability;
  }
  if (stack.modifier && stack.modifier.bonusDurabilityMultiplier && def.durability && options.durability === undefined) {
    stack.maxDurability = Math.max(stack.maxDurability, Math.round(stack.maxDurability * (1 + stack.modifier.bonusDurabilityMultiplier)));
    stack.durability = stack.maxDurability;
  }
  return stack;
}
