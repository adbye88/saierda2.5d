/* ========================================================
   Enemy.js v2 — 全量敌人系统
   - 波克布林 4色（红/蓝/黑/骷髅）
   - 元素丘丘（普通/火/冰/雷）
   - 蜥蜴战士（红/蓝/黄）
   - 莫力布林 / 八爪章鱼 / 骷髅 / 守护者
   - 莱尼尔（最强小怪）
   - 5 个 Boss：岩石巨像/冰咒哥莱姆/炎魔/雷咒/灾厄盖侬
   ======================================================== */

const ENEMY_DEFS = {
  // ===== 波克布林系列（按颜色递增） =====
  redBokoblin: {
    name: '红色波克布林', hp: 13, atk: 4, speed: 2.5, radius: 0.6, sight: 12, expDrop: 1, dropRupee: 2,
    mesh: () => AssetFactory.createBokoblin(0xcc4444, false),
    drops: () => weightedDrop([['bokoblinHorn', 1, 0.8], ['rupee', 1, 0.6], ['apple', 1, 0.3], ['bokoClub', 1, 0.1]]),
    ai: 'melee'
  },
  blueBokoblin: {
    name: '蓝色波克布林', hp: 72, atk: 8, speed: 3.0, radius: 0.6, sight: 14, expDrop: 2, dropRupee: 4,
    mesh: () => AssetFactory.createBokoblin(0x4477cc, false),
    drops: () => weightedDrop([['bokoblinHorn', 1, 0.9], ['bokoblinFang', 1, 0.5], ['rupee', 3, 0.5], ['soldierSword', 1, 0.1]]),
    ai: 'melee'
  },
  blackBokoblin: {
    name: '黑色波克布林', hp: 240, atk: 14, speed: 3.5, radius: 0.65, sight: 16, expDrop: 4, dropRupee: 8,
    mesh: () => AssetFactory.createBokoblin(0x2a2a2a, true, 'shield'),
    drops: () => weightedDrop([['bokoblinHorn', 2, 0.9], ['bokoblinGuts', 1, 0.3], ['rupee', 5, 0.6], ['knightSword', 1, 0.15], ['amber', 1, 0.2]]),
    ai: 'melee'
  },
  silverBokoblin: {
    name: '白银波克布林', hp: 720, atk: 24, speed: 4.0, radius: 0.7, sight: 18, expDrop: 8, dropRupee: 20,
    mesh: () => AssetFactory.createBokoblin(0xddddcc, true, 'elite'),
    drops: () => weightedDrop([['bokoblinGuts', 2, 0.7], ['rupee', 15, 0.8], ['royalSword', 1, 0.1], ['amber', 2, 0.5], ['topaz', 1, 0.1]]),
    ai: 'melee'
  },
  goldBokoblin: {
    name: '金色波克布林', hp: 1080, atk: 32, speed: 4.25, radius: 0.72, sight: 20, expDrop: 12, dropRupee: 28,
    mesh: () => AssetFactory.createBokoblin(0xd6b14a, true, 'elite'),
    drops: () => weightedDrop([['bokoblinGuts', 3, 0.8], ['rupee', 24, 0.85], ['royalSword', 1, 0.08], ['topaz', 1, 0.18], ['luminousStone', 1, 0.22]]),
    ai: 'melee'
  },
  // ===== 八爪章鱼怪 =====
  octorok: {
    name: '八爪章鱼怪', hp: 8, atk: 4, speed: 1.5, radius: 0.5, sight: 14, expDrop: 1, dropRupee: 1,
    mesh: () => AssetFactory.createOctorok(),
    drops: () => weightedDrop([['arrow', 3, 0.7], ['rupee', 1, 0.5], ['apple', 1, 0.3], ['octorokEyeball', 1, 0.2]]),
    ai: 'ranged'
  },
  electricOctorok: {
    name: '雷电章鱼怪', hp: 48, atk: 12, speed: 1.8, radius: 0.55, sight: 20, expDrop: 5, dropRupee: 8, element: 'shock',
    mesh: () => AssetFactory.createOctorok(),
    drops: () => weightedDrop([['arrow', 4, 0.75], ['yellowChuchuJelly', 1, 0.6], ['octorokEyeball', 1, 0.35], ['topaz', 1, 0.08], ['rupee', 7, 0.65]]),
    ai: 'ranged'
  },
  archerBokoblin: {
    name: '弓箭波克布林', hp: 72, atk: 8, speed: 2.7, radius: 0.6, sight: 20, expDrop: 3, dropRupee: 5,
    mesh: () => AssetFactory.createBokoblin(0x7a9a44, false, 'archer'),
    drops: () => weightedDrop([['bokoblinHorn', 1, 0.75], ['arrow', 5, 0.65], ['travelerBow', 1, 0.12], ['rupee', 4, 0.5]]),
    ai: 'ranged'
  },
  // ===== 丘丘（史莱姆，元素变种） =====
  chuchu: {
    name: '丘丘', hp: 12, atk: 3, speed: 1.8, radius: 0.5, sight: 8, expDrop: 1, dropRupee: 1,
    mesh: () => AssetFactory.createChuchu(0x44aaff, null),
    drops: () => weightedDrop([['chuchuJelly', 1, 0.8], ['rupee', 1, 0.4]]),
    ai: 'melee'
  },
  fireChuchu: {
    name: '火丘丘', hp: 20, atk: 7, speed: 2.0, radius: 0.5, sight: 10, expDrop: 2, dropRupee: 2, element: 'fire',
    mesh: () => AssetFactory.createChuchu(0xff5522, 'fire'),
    drops: () => weightedDrop([['redChuchuJelly', 1, 0.9], ['rupee', 2, 0.5]]),
    ai: 'melee'
  },
  iceChuchu: {
    name: '冰丘丘', hp: 20, atk: 7, speed: 2.0, radius: 0.5, sight: 10, expDrop: 2, dropRupee: 2, element: 'ice',
    mesh: () => AssetFactory.createChuchu(0x88ddff, 'ice'),
    drops: () => weightedDrop([['whiteChuchuJelly', 1, 0.9], ['rupee', 2, 0.5]]),
    ai: 'melee'
  },
  shockChuchu: {
    name: '雷丘丘', hp: 20, atk: 8, speed: 2.2, radius: 0.5, sight: 10, expDrop: 2, dropRupee: 2, element: 'shock',
    mesh: () => AssetFactory.createChuchu(0xffee44, 'shock'),
    drops: () => weightedDrop([['yellowChuchuJelly', 1, 0.9], ['rupee', 2, 0.5]]),
    ai: 'melee'
  },
  // ===== 蜥蜴战士（元素变种） =====
  redLizalfos: {
    name: '红色蜥蜴战士', hp: 50, atk: 12, speed: 4.0, radius: 0.6, sight: 14, expDrop: 5, dropRupee: 8, element: 'fire',
    mesh: () => AssetFactory.createLizalfos(0xcc4422),
    drops: () => weightedDrop([['lizalfosTail', 1, 0.4], ['lizalfosHorn', 1, 0.6], ['rupee', 5, 0.7], ['soldierSpear', 1, 0.2]]),
    ai: 'melee'
  },
  blueLizalfos: {
    name: '蓝色蜥蜴战士', hp: 120, atk: 18, speed: 4.2, radius: 0.6, sight: 16, expDrop: 7, dropRupee: 12, element: 'ice',
    mesh: () => AssetFactory.createLizalfos(0x3388cc),
    drops: () => weightedDrop([['lizalfosTail', 1, 0.5], ['lizalfosHorn', 1, 0.7], ['rupee', 8, 0.7], ['knightHalberd', 1, 0.15]]),
    ai: 'melee'
  },
  yellowLizalfos: {
    name: '黄色蜥蜴战士', hp: 288, atk: 24, speed: 4.5, radius: 0.6, sight: 16, expDrop: 9, dropRupee: 18, element: 'shock',
    mesh: () => AssetFactory.createLizalfos(0xddcc22),
    drops: () => weightedDrop([['lizalfosTail', 1, 0.6], ['lizalfosHorn', 2, 0.7], ['rupee', 12, 0.7], ['thunderblade', 1, 0.1]]),
    ai: 'melee'
  },
  // ===== 莫力布林 / 骷髅 / 守护者 =====
  moblin: {
    name: '莫力布林', hp: 56, atk: 14, speed: 2.2, radius: 1.0, sight: 16, expDrop: 8, dropRupee: 15,
    mesh: () => AssetFactory.createMoblin(),
    drops: () => weightedDrop([['moblinHorn', 1, 0.7], ['moblinFang', 1, 0.5], ['rupee', 10, 0.8], ['knightSword', 1, 0.2], ['soldierShield', 1, 0.2], ['amber', 2, 0.3]]),
    ai: 'melee'
  },
  blueMoblin: {
    name: '蓝色莫力布林', hp: 144, atk: 22, speed: 2.45, radius: 1.05, sight: 18, expDrop: 11, dropRupee: 22,
    mesh: () => AssetFactory.createMoblin(),
    drops: () => weightedDrop([['moblinHorn', 2, 0.75], ['moblinFang', 2, 0.55], ['rupee', 15, 0.78], ['knightClaymore', 1, 0.1], ['sapphire', 1, 0.12]]),
    ai: 'melee'
  },
  silverMoblin: {
    name: '白银莫力布林', hp: 1080, atk: 34, speed: 2.6, radius: 1.15, sight: 20, expDrop: 16, dropRupee: 30, miniBoss: true,
    mesh: () => AssetFactory.createSilverMoblin(),
    drops: () => weightedDrop([['moblinHorn', 2, 0.8], ['moblinFang', 2, 0.65], ['rupee', 20, 0.85], ['royalHalberd', 1, 0.12], ['sapphire', 1, 0.25]]),
    ai: 'melee'
  },
  stal: {
    name: '骷髅兵', hp: 24, atk: 7, speed: 2.8, radius: 0.5, sight: 12, expDrop: 2, dropRupee: 3,
    mesh: () => AssetFactory.createStal(),
    drops: () => weightedDrop([['bokoBoneSpear', 1, 0.2], ['rupee', 2, 0.6], ['arrow', 2, 0.4]]),
    ai: 'melee'
  },
  guardian: {
    name: '守护者', hp: 500, atk: 32, speed: 1.8, radius: 1.1, sight: 20, expDrop: 15, dropRupee: 30,
    mesh: () => AssetFactory.createGuardian(),
    drops: () => weightedDrop([['ancientScrew', 2, 0.8], ['ancientShaft', 1, 0.6], ['ancientCore', 1, 0.3], ['rupee', 20, 0.7], ['amber', 3, 0.5]]),
    ai: 'ranged'
  },
  guardianStalker: {
    name: '行走守护者', hp: 1500, atk: 58, speed: 2.55, radius: 1.2, sight: 28, expDrop: 24, dropRupee: 55, miniBoss: true,
    mesh: () => AssetFactory.createGuardian(),
    drops: () => weightedDrop([['ancientScrew', 3, 0.85], ['ancientShaft', 2, 0.7], ['guardianGear', 2, 0.65], ['guardianSpring', 2, 0.58], ['ancientCore', 1, 0.32], ['ancientShortSword', 1, 0.08], ['rupee', 38, 0.78]]),
    ai: 'ranged'
  },
  guardianSkywatcher: {
    name: '飞行守护者', hp: 1000, atk: 48, speed: 3.15, radius: 1.05, sight: 30, expDrop: 26, dropRupee: 60, miniBoss: true,
    mesh: () => createGuardianVariantMesh(0x88ccff, 0.82, 1.25),
    drops: () => weightedDrop([['ancientScrew', 3, 0.85], ['guardianGear', 2, 0.62], ['guardianSpring', 2, 0.62], ['ancientCore', 1, 0.28], ['ancientBow', 1, 0.06], ['rupee', 45, 0.82]]),
    ai: 'ranged'
  },
  yigaFootsoldier: {
    name: '依盖队刺客', hp: 64, atk: 16, speed: 5.2, radius: 0.55, sight: 22, expDrop: 8, dropRupee: 18,
    mesh: () => AssetFactory.createYigaFootsoldier(),
    drops: () => weightedDrop([['rupee', 12, 0.8], ['mightyElixir', 1, 0.16], ['soldierSword', 1, 0.12], ['topaz', 1, 0.08]]),
    ai: 'melee'
  },
  fireWizzrobe: {
    name: '火焰法师', hp: 150, atk: 18, speed: 3.1, radius: 0.7, sight: 24, expDrop: 10, dropRupee: 20, element: 'fire',
    mesh: () => AssetFactory.createWizzrobe(0xff5522, 'fire'),
    drops: () => weightedDrop([['redChuchuJelly', 2, 0.7], ['ruby', 1, 0.12], ['fireBow', 1, 0.08], ['rupee', 12, 0.65]]),
    ai: 'ranged'
  },
  iceWizzrobe: {
    name: '冰雪法师', hp: 150, atk: 18, speed: 3.1, radius: 0.7, sight: 24, expDrop: 10, dropRupee: 20, element: 'ice',
    mesh: () => AssetFactory.createWizzrobe(0x66ddff, 'ice'),
    drops: () => weightedDrop([['whiteChuchuJelly', 2, 0.7], ['sapphire', 1, 0.12], ['iceBow', 1, 0.08], ['rupee', 12, 0.65]]),
    ai: 'ranged'
  },
  shockWizzrobe: {
    name: '雷电法师', hp: 180, atk: 22, speed: 3.4, radius: 0.7, sight: 25, expDrop: 12, dropRupee: 24, element: 'shock',
    mesh: () => AssetFactory.createWizzrobe(0xffee44, 'shock'),
    drops: () => weightedDrop([['yellowChuchuJelly', 2, 0.7], ['topaz', 1, 0.12], ['shockBow', 1, 0.08], ['rupee', 14, 0.65]]),
    ai: 'ranged'
  },
  maliceWizzrobe: {
    name: '怨念法师', hp: 300, atk: 28, speed: 3.6, radius: 0.75, sight: 27, expDrop: 18, dropRupee: 32,
    mesh: () => AssetFactory.createWizzrobe(0x9922cc, 'malice'),
    drops: () => weightedDrop([['luminousStone', 2, 0.5], ['starFragment', 1, 0.08], ['ancientCore', 1, 0.12], ['royalGuardClaymore', 1, 0.06], ['rupee', 26, 0.75]]),
    ai: 'ranged'
  },
  stonePebblit: {
    name: '岩石小怪', hp: 22, atk: 7, speed: 2.0, radius: 0.55, sight: 10, expDrop: 3, dropRupee: 4,
    mesh: () => AssetFactory.createStonePebblit(0x7a6a5a),
    drops: () => weightedDrop([['flint', 1, 0.45], ['amber', 1, 0.18], ['rupee', 4, 0.55]]),
    ai: 'melee'
  },
  frostPebblit: {
    name: '冰岩小怪', hp: 30, atk: 10, speed: 2.05, radius: 0.55, sight: 12, expDrop: 4, dropRupee: 6, element: 'ice',
    mesh: () => AssetFactory.createStonePebblit(0x99dfff),
    drops: () => weightedDrop([['flint', 1, 0.45], ['whiteChuchuJelly', 1, 0.45], ['sapphire', 1, 0.08], ['rupee', 5, 0.55]]),
    ai: 'melee'
  },
  firePebblit: {
    name: '熔岩小怪', hp: 34, atk: 11, speed: 2.0, radius: 0.55, sight: 12, expDrop: 4, dropRupee: 6, element: 'fire',
    mesh: () => AssetFactory.createStonePebblit(0xaa4422),
    drops: () => weightedDrop([['flint', 2, 0.55], ['redChuchuJelly', 1, 0.45], ['ruby', 1, 0.08], ['rupee', 5, 0.55]]),
    ai: 'melee'
  },
  // ===== 莱尼尔（最强小怪，半人马） =====
  lynel: {
    name: '莱尼尔', hp: 2000, atk: 50, speed: 4.0, radius: 1.2, sight: 20, expDrop: 30, dropRupee: 50, miniBoss: true,
    mesh: () => AssetFactory.createLynel(),
    drops: () => weightedDrop([['lynelHorn', 1, 0.75], ['lynelHoof', 1, 0.45], ['lynelGuts', 1, 0.18], ['royalSword', 1, 0.18], ['royalBow', 1, 0.18], ['royalHalberd', 1, 0.12], ['amber', 5, 0.8], ['rupee', 30, 0.9], ['starFragment', 1, 0.1]]),
    ai: 'melee'
  },
  silverLynel: {
    name: '白银莱尼尔', hp: 5000, atk: 76, speed: 4.35, radius: 1.28, sight: 25, expDrop: 55, dropRupee: 90, miniBoss: true,
    mesh: () => AssetFactory.createLynel(),
    drops: () => weightedDrop([['lynelHorn', 2, 0.85], ['lynelHoof', 2, 0.65], ['lynelGuts', 1, 0.38], ['savageLynelSword', 1, 0.12], ['savageLynelBow', 1, 0.12], ['starFragment', 1, 0.16], ['dragonScale', 1, 0.1], ['rupee', 55, 0.9]]),
    ai: 'melee'
  },

  // ============ 四大神兽 Boss ============
  waterblightGanon: {
    name: '水咒盖侬', hp: 800, atk: 32, speed: 2.6, radius: 1.7, sight: 28, boss: true, expDrop: 70, dropRupee: 120, element: 'ice', divineElement: 'water',
    mesh: () => AssetFactory.createBlightGanon(0x66ddff, 'spear'),
    drops: () => [['opal', 4], ['rupee', 120], ['frostblade', 1], ['spiritOrb', 1]],
    ai: 'boss'
  },
  fireblightGanon: {
    name: '火咒盖侬', hp: 800, atk: 36, speed: 2.3, radius: 1.8, sight: 28, boss: true, expDrop: 90, dropRupee: 150, element: 'fire', divineElement: 'fire',
    mesh: () => AssetFactory.createBlightGanon(0xff6633, 'axe'),
    drops: () => [['ruby', 5], ['rupee', 150], ['flameblade', 1], ['spiritOrb', 1]],
    ai: 'boss'
  },
  windblightGanon: {
    name: '风咒盖侬', hp: 800, atk: 34, speed: 3.4, radius: 1.6, sight: 30, boss: true, expDrop: 85, dropRupee: 140, divineElement: 'wind',
    mesh: () => AssetFactory.createBlightGanon(0x99e8ff, 'spear'),
    drops: () => [['royalBow', 1], ['arrow', 25], ['rupee', 140], ['spiritOrb', 1]],
    ai: 'boss'
  },
  thunderblightGanon: {
    name: '雷咒盖侬', hp: 800, atk: 42, speed: 4.2, radius: 1.7, sight: 30, boss: true, expDrop: 100, dropRupee: 180, element: 'shock', divineElement: 'thunder',
    mesh: () => AssetFactory.createBlightGanon(0xffee44, 'blade'),
    drops: () => [['topaz', 5], ['rupee', 180], ['thunderblade', 1], ['spiritOrb', 1]],
    ai: 'boss'
  },

  // ============ 5 个 Boss ============
  stoneTalus: {
    name: '岩石巨像', hp: 300, atk: 30, speed: 1.05, radius: 2.5, sight: 25, expDrop: 50, boss: true, dropRupee: 100,
    mesh: () => AssetFactory.createStoneTalus(),
    drops: () => [['amber', 10], ['opal', 4], ['rupee', 100], ['flint', 5]],
    ai: 'boss'
  },
  ignoTalus: {
    name: '熔岩巨像', hp: 800, atk: 40, speed: 1.0, radius: 2.5, sight: 25, boss: true, expDrop: 80, dropRupee: 150, element: 'fire',
    mesh: () => AssetFactory.createStoneTalus(0xcc4422),
    drops: () => [['flamebreakerArmor', 1], ['ruby', 5], ['rupee', 150], ['flameblade', 1]],
    ai: 'boss'
  },
  frostTalus: {
    name: '冰霜巨像', hp: 800, atk: 38, speed: 1.0, radius: 2.5, sight: 25, boss: true, expDrop: 70, dropRupee: 130, element: 'ice',
    mesh: () => AssetFactory.createStoneTalus(0x88ccff),
    drops: () => [['warmDoublet', 1], ['sapphire', 5], ['rupee', 130], ['frostblade', 1]],
    ai: 'boss'
  },
  molduga: {
    name: '魔吉拉德', hp: 1500, atk: 48, speed: 6.0, radius: 3.0, sight: 30, boss: true, expDrop: 100, dropRupee: 200,
    mesh: () => AssetFactory.createMolduga(),
    drops: () => [['moldugaFin', 2], ['moldugaGuts', 1], ['desertVoeTrousers', 1], ['topaz', 5], ['rupee', 200], ['royalSword', 1]],
    ai: 'bossBurrow'
  },
  hinox: {
    name: '独眼巨人', hp: 600, atk: 38, speed: 1.25, radius: 2.6, sight: 24, boss: true, expDrop: 90, dropRupee: 160,
    mesh: () => createHinoxMesh(0x8d6040, 1.0),
    drops: () => weightedDrop([['moblinHorn', 4, 0.85], ['moblinFang', 3, 0.75], ['amber', 4, 0.65], ['knightClaymore', 1, 0.14], ['rupee', 120, 0.9]]),
    ai: 'boss'
  },
  blackHinox: {
    name: '黑色独眼巨人', hp: 1000, atk: 52, speed: 1.45, radius: 2.8, sight: 26, boss: true, expDrop: 125, dropRupee: 220,
    mesh: () => createHinoxMesh(0x30303a, 1.12),
    drops: () => weightedDrop([['moblinHorn', 5, 0.88], ['moblinFang', 4, 0.78], ['luminousStone', 3, 0.5], ['royalClaymore', 1, 0.12], ['starFragment', 1, 0.08], ['rupee', 180, 0.9]]),
    ai: 'boss'
  },
  stalnox: {
    name: '骷髅独眼巨人', hp: 1000, atk: 50, speed: 1.35, radius: 2.8, sight: 26, boss: true, expDrop: 120, dropRupee: 210,
    mesh: () => createHinoxMesh(0xd9d2bd, 1.08),
    drops: () => weightedDrop([['luminousStone', 4, 0.72], ['ancientCore', 1, 0.18], ['royalGuardClaymore', 1, 0.1], ['starFragment', 1, 0.1], ['rupee', 160, 0.88]]),
    ai: 'boss'
  },
  flameGleeok: {
    name: '火焰三头龙', hp: 2000, atk: 58, speed: 2.0, radius: 3.2, sight: 34, boss: true, expDrop: 170, dropRupee: 300, element: 'fire',
    mesh: () => createGleeokMesh(0xff5522, 1.0),
    drops: () => weightedDrop([['ruby', 5, 0.85], ['dragonScale', 2, 0.42], ['starFragment', 1, 0.16], ['flameblade', 1, 0.12], ['rupee', 240, 0.9]]),
    ai: 'boss'
  },
  frostGleeok: {
    name: '冰雪三头龙', hp: 2000, atk: 56, speed: 2.0, radius: 3.2, sight: 34, boss: true, expDrop: 165, dropRupee: 290, element: 'ice',
    mesh: () => createGleeokMesh(0x66ddff, 1.0),
    drops: () => weightedDrop([['sapphire', 5, 0.85], ['dragonScale', 2, 0.42], ['starFragment', 1, 0.16], ['frostblade', 1, 0.12], ['rupee', 230, 0.9]]),
    ai: 'boss'
  },
  thunderGleeok: {
    name: '雷电三头龙', hp: 2000, atk: 62, speed: 2.15, radius: 3.2, sight: 36, boss: true, expDrop: 180, dropRupee: 330, element: 'shock',
    mesh: () => createGleeokMesh(0xffee44, 1.05),
    drops: () => weightedDrop([['topaz', 5, 0.85], ['dragonScale', 2, 0.48], ['starFragment', 1, 0.18], ['thunderblade', 1, 0.12], ['rupee', 260, 0.9]]),
    ai: 'boss'
  },
  calamityGanon: {
    name: '灾厄盖侬', hp: 8000, atk: 72, speed: 3.0, radius: 2.0, sight: 40, boss: true, finalBoss: true, expDrop: 200, dropRupee: 500,
    mesh: () => AssetFactory.createCalamityGanon(),
    drops: () => [['starFragment', 3], ['ancientCore', 5], ['rupee', 500]],
    ai: 'finalBoss'
  }
};

const BASIC_EQUIPMENT_DROPS = new Set([
  'bokoClub', 'rustyBroadsword', 'travelerSword', 'soldierSword',
  'bokoBoneSpear', 'soldierSpear', 'travelerClaymore', 'soldierClaymore',
  'woodenShield', 'bokoShield', 'soldierShield',
  'travelerBow', 'soldierBow'
]);

function weightedDrop(entries) {
  const result = [];
  for (const [item, count, chance] of entries) {
    const def = ITEMS[item];
    const isEquipment = def && ['weapon', 'shield', 'bow', 'armor_upper', 'armor_lower'].includes(def.type);
    const adjustedChance = isEquipment
      ? Math.min(0.75, chance * (BASIC_EQUIPMENT_DROPS.has(item) ? 2.2 : 0.75))
      : chance;
    if (Math.random() < adjustedChance) result.push([item, count]);
  }
  return result;
}

function createGuardianVariantMesh(color = 0x88ccff, scale = 1, yOffset = 0) {
  const g = AssetFactory.createGuardian();
  g.scale.setScalar(scale);
  g.position.y = yOffset;
  g.traverse(c => {
    if (c.isMesh && c.material) {
      if (c.material.color) c.material.color.lerp(new THREE.Color(color), 0.18);
      if (c.material.emissive) {
        c.material.emissive.setHex(color);
        c.material.emissiveIntensity = 0.12;
      }
    }
  });
  return g;
}

function createHinoxMesh(color = 0x8d6040, scale = 1) {
  const g = AssetFactory.createMoblin();
  g.scale.setScalar(2.05 * scale);
  g.traverse(c => {
    if (c.isMesh && c.material && c.material.color) {
      c.material.color.lerp(new THREE.Color(color), 0.58);
    }
  });
  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0xfff2d0, emissive: 0xff8844, emissiveIntensity: 0.3 })
  );
  eye.position.set(0, 1.78, 0.48);
  g.add(eye);
  const pupil = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0x16100c })
  );
  pupil.position.set(0, 1.78, 0.62);
  g.add(pupil);
  g.userData.parts = g.userData.parts || {};
  g.userData.parts.weak = eye;
  return g;
}

function createGleeokMesh(color = 0xff5522, scale = 1) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.05, flatShading: true });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2f2830, roughness: 0.78, flatShading: true });
  const glow = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, roughness: 0.38 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1.05, 10, 8), mat);
  body.scale.set(1.35, 0.82, 1.85);
  body.position.y = 1.5;
  g.add(body);
  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.12, 1.15), dark);
    wing.position.set(side * 1.55, 1.65, 0.1);
    wing.rotation.z = side * 0.22;
    g.add(wing);
  }
  [-0.62, 0, 0.62].forEach((x, i) => {
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.25, 6), mat);
    neck.position.set(x, 2.05, -0.62);
    neck.rotation.x = 0.75;
    neck.rotation.z = -x * 0.18;
    g.add(neck);
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 1), mat);
    head.position.set(x * 1.12, 2.7, -1.02);
    g.add(head);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), glow);
    eye.position.set(x * 1.12, 2.74, -1.32);
    g.add(eye);
    if (i === 1) g.userData.parts = { weak: eye, body };
  });
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.28, 1.6, 6), dark);
  tail.position.set(0, 1.3, 1.45);
  tail.rotation.x = 1.18;
  g.add(tail);
  g.scale.setScalar(scale);
  return g;
}

class Enemy {
  constructor(typeId, x, z) {
    const def = ENEMY_DEFS[typeId];
    this.typeId = typeId;
    this.def = def;
    this.mesh = def.mesh();
    this.mesh.position.set(x, 0, z);
    this.mesh.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    this.position = this.mesh.position;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.atk = def.atk;
    this.baseAtk = def.atk;
    this.speed = def.speed;
    this.radius = def.radius;
    this.sight = def.sight;
    this.boss = def.boss || false;
    this.miniBoss = def.miniBoss || false;
    this.element = def.element || null;
    this.finalBoss = def.finalBoss || false;

    this.state = 'patrol';
    this.patrolDir = new THREE.Vector3((Math.random() - 0.5), 0, (Math.random() - 0.5)).normalize();
    this.patrolTimer = Math.random() * 3;
    this.attackCD = 0;
    this.shootCD = 0;
    this.hurtTimer = 0;
    this.dead = false;
    this.deathTimer = 0;
    this.specialCD = 0;     // Boss 大招冷却
    this.burrowed = false;  // 魔吉拉德钻地
    this.burrowTimer = 0;
    this._moldugaExposed = 0;
    this.sleeping = false;
    this.camp = null;
    this.campRole = null;
    this.heldWeaponId = null;
    this.heldShieldId = null;
    this.disarmed = false;
    this._burnTimer = 0;
    this._burnTick = 0;
    this._slowTimer = 0;
    this._stunTimer = 0;
    this._combatWakeTimer = 0;

    this.velocity = new THREE.Vector3();
    this._walkPhase = Math.random() * 6;
    this._hitReactDir = new THREE.Vector3();
    this._hitReactSide = 0;
    this._hitReactBack = 0;
    this._hitReactMax = 0.25;
    this._deathShatterDone = false;
    this._deathFx = null;
    // ★ 攻击前摇系统：windup(蓄力) → strike(出招) → recover(收招)
    this.attackPhase = null;   // 'windup' | 'strike' | 'recover' | null
    this.windup = 0;           // 蓄力计时
    this.windupDir = null;     // 蓄力开始时锁定的方向（出招方向，防止玩家走出去）
    this._idlePhase = Math.random() * 6;  // idle 呼吸相位
    this._posePhase = Math.random() * 6;
  }

  update(dt, game) {
    if (this.dead) {
      this.deathTimer += dt;
      const fall = Math.min(1, this.deathTimer / 0.32);
      const sink = Math.max(0, this.deathTimer - 0.24);
      this.mesh.rotation.x = -0.65 * fall;
      this.mesh.rotation.z += (this._hitReactSide || 0.35) * dt * 2.8;
      this.mesh.position.y -= sink > 0 ? dt * 1.2 : 0;
      if (!this._deathShatterDone && this.deathTimer > 0.18) {
        this._deathShatterDone = true;
        const fx = this._deathFx || {};
        if (typeof Effects !== 'undefined') {
          if (Effects.lowPolyShatter) Effects.lowPolyShatter(this.mesh.position.clone().setY(fx.y || (this.boss ? 2.2 : 1.0)), fx.color || 0xb8aa92, fx.count || 16, fx.scale || 0.95);
          if ((this.miniBoss || this.boss) && Effects.shockwave) Effects.shockwave(this.mesh.position.clone(), fx.color || 0xffdd88, this.boss ? 2.5 : 1.55);
        }
      }
      this.mesh.scale.multiplyScalar(1 - dt * 0.65);
      if (this.deathTimer > 1.25) {
        if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
      }
      return;
    }
    if (this.boss && this._bossActive === false) return;
    if (this._combatWakeTimer > 0) this._combatWakeTimer -= dt;
    const hardDormant = this._streamTier === 'dormant' || (this._streamActive === false && !this._streamTier);
    if (hardDormant && this._combatWakeTimer <= 0) {
      this.velocity.set(0, 0, 0);
      this.attackPhase = null;
      this.state = this.sleeping ? 'sleep' : 'idle';
      return;
    }

    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
      if (this.hurtTimer <= 0 && this.state === 'hurt') {
        this.hurtTimer = 0;
        this.state = 'patrol';
      }
    }
    this._updateElementStatus(dt);
    if (this._stunTimer > 0) {
      this.velocity.set(0, 0, 0);
      this.state = 'hurt';
      this._animate(dt, this.state);
      return;
    }
    if (this.attackCD > 0) this.attackCD -= dt;
    if (this.shootCD > 0) this.shootCD -= dt;
    if (this.specialCD > 0) this.specialCD -= dt;

    const player = game.player;
    if (!player) return;
    const toPlayer = new THREE.Vector3().subVectors(player.position, this.position);
    toPlayer.y = 0;
    const dist = toPlayer.length();

    if (this.sleeping && this.camp && !this.camp.alerted && this.hurtTimer <= 0) {
      if (dist > 3.2) {
        this.velocity.set(0, 0, 0);
        this.state = 'sleep';
        this.attackPhase = null;
        this._animate(dt, this.state);
        return;
      }
      this.sleeping = false;
      if (typeof ExplorationSystem !== 'undefined') ExplorationSystem.alertCamp(this.camp, '怪物被近距离惊醒！');
    }

    // ★ 攻击前摇/出招/收招期间锁定 attack 状态（不被距离打断）
    const locked = this.attackPhase === 'windup' || this.attackPhase === 'strike' || this.attackPhase === 'recover';
    if (locked && this.state !== 'hurt') {
      this.state = 'attack';
    } else if (dist < this.sight && this.state !== 'hurt') {
      this.state = (dist < this.radius + 2.0) ? 'attack' : 'chase';
    } else if (this.state !== 'hurt') {
      this.state = 'patrol';
    }

    // Boss 特殊行为；随后继续走普通追击/近战状态机。
    if (this.boss && this.state !== 'hurt') {
      this._bossUpdate(dt, player, dist, game);
    }

    switch (this.state) {
      case 'patrol':  this._patrol(dt, game); break;
      case 'chase':   this._chase(dt, toPlayer, dist, game); break;
      case 'attack':  this._attack(dt, player, dist, game); break;
      case 'hurt':    break;
    }
    this._animate(dt, this.state);
  }

  _bossUpdate(dt, player, dist, game) {
    if (this.def.ai === 'bossBurrow' && dist < this.sight && this.state !== 'attack') {
      const playerNoise = player.velocity && Math.hypot(player.velocity.x || 0, player.velocity.z || 0) > 3.2;
      const arrowNoise = game && game.currentWorld && (game.currentWorld.projectiles || []).some(p => !p.userData.fromEnemy && p.position.distanceTo(this.position) < 8);
      const noisy = playerNoise || arrowNoise;
      if (this._moldugaExposed > 0) {
        this._moldugaExposed -= dt;
        this.burrowed = false;
        this.mesh.position.y = Math.max(this.mesh.position.y, 0);
        this.state = 'chase';
      } else if (noisy) {
        this.burrowed = false;
        this._moldugaExposed = 2.8;
        this.hurtTimer = Math.max(this.hurtTimer || 0, 0.8);
        this.mesh.position.y = 0;
        Dialogue.show('魔吉拉德听见震动冲出沙面！现在是输出窗口。', 1700);
        if (typeof Effects !== 'undefined') Effects.hitBurst(this.mesh.position.clone().setY(0.4), 0xd6b14a, 18);
      } else {
        this.burrowed = true;
        this.mesh.position.y = -0.45;
        this.velocity.set(0, 0, 0);
        this.state = 'patrol';
        if (typeof ExplorationSystem !== 'undefined') ExplorationSystem._showClue('沙地下有东西在听震动：移动、射箭或引爆声音能诱它出沙。');
        return;
      }
    }
    if (this.specialCD <= 0 && dist < this.sight) {
      this._bossSpecial(player, game, dist);
      if (typeof AudioSystem !== 'undefined') AudioSystem.play('boss');
      this.specialCD = this._bossSpecialCooldown();
    }
  }

  _bossSpecialCooldown() {
    if (this.finalBoss) return 2.6;
    if (this.typeId && this.typeId.includes('Gleeok')) return 3.0;
    if (this.typeId === 'stoneTalus' || this.typeId === 'ignoTalus' || this.typeId === 'frostTalus') return 3.6;
    if (this.typeId === 'hinox' || this.typeId === 'blackHinox' || this.typeId === 'stalnox') return 3.2;
    return 3.4;
  }

  _bossSpecial(player, game, dist = 999) {
    const element = this.element;
    const color = element === 'fire' ? 0xff4422 : element === 'ice' ? 0x66ddff : element === 'shock' ? 0xffee44 : 0x9922cc;
    Dialogue.show(`【${this.def.name}】释放了${element || '黑暗'}之力！`);
    const closeSlam = dist < this.radius + 4.4 && (
      this.typeId === 'stoneTalus' || this.typeId === 'ignoTalus' || this.typeId === 'frostTalus' ||
      this.typeId === 'hinox' || this.typeId === 'blackHinox' || this.typeId === 'stalnox'
    );
    if (closeSlam) {
      const away = new THREE.Vector3().subVectors(player.position, this.position).setY(0);
      if (away.lengthSq() < 0.001) away.set(Math.sin(this.mesh.rotation.y), 0, Math.cos(this.mesh.rotation.y));
      away.normalize();
      player._lastAttacker = this;
      const result = player.takeDamage(this.atk * 0.8, away, element);
      if (result === 'hit') player.knockback = away.multiplyScalar(13);
      if (typeof Effects !== 'undefined') {
        Effects.enemyAttackCue(this.position, away, this.radius + 4.2, color);
        Effects.hitBurst(this.position.clone().setY(0.25), color, 18);
      }
      return;
    }

    const projCount = this.finalBoss ? 5 : (this.typeId && this.typeId.includes('Gleeok')) ? 3 : 1;
    const baseAngle = Math.atan2(player.position.x - this.position.x, player.position.z - this.position.z);
    for (let i = 0; i < projCount; i++) {
      const spread = projCount === 1 ? 0 : (i - (projCount - 1) / 2) * 0.22;
      const angle = baseAngle + spread;
      const proj = new THREE.Mesh(
        new THREE.IcosahedronGeometry(this.boss ? 0.42 : 0.3, 0),
        new THREE.MeshBasicMaterial({ color })
      );
      proj.position.copy(this.position); proj.position.y = this.radius > 2.4 ? 3.1 : 2.0;
      const dir = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
      proj.userData = {
        velocity: dir.multiplyScalar(this.finalBoss ? 15 : this.radius > 2.4 ? 13.5 : 12),
        damage: this.atk * 0.75,
        fromEnemy: true,
        owner: this,
        life: 3.0,
        element: element
      };
      game.currentWorld.scene.add(proj);
      game.currentWorld.projectiles.push(proj);
    }
  }

  _patrol(dt, game) {
    this.patrolTimer -= dt;
    if (this.patrolTimer <= 0) {
      this.patrolDir.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
      this.patrolTimer = 2 + Math.random() * 3;
    }
    const speedMul = this._statusSpeedMul();
    this.velocity.x = this.patrolDir.x * this.speed * 0.4 * speedMul;
    this.velocity.z = this.patrolDir.z * this.speed * 0.4 * speedMul;
    this._applyMove(dt, game);
    if (this.patrolDir.lengthSq() > 0) this.mesh.rotation.y = Math.atan2(this.patrolDir.x, this.patrolDir.z);
  }

  _chase(dt, toPlayer, dist, game) {
    if (dist > 0.1) toPlayer.normalize();
    const speedMul = this._statusSpeedMul();
    this.velocity.x = toPlayer.x * this.speed * speedMul;
    this.velocity.z = toPlayer.z * this.speed * speedMul;
    this._applyMove(dt, game);
    this.mesh.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
  }

  _attack(dt, player, dist, game) {
    const dir = new THREE.Vector3().subVectors(player.position, this.position); dir.y = 0;
    if (dir.lengthSq() > 0) {
      dir.normalize();
      // 蓄力期间不转向（锁定出招方向），否则转向追踪玩家
      if (this.attackPhase !== 'windup' && this.attackPhase !== 'strike') {
        this.mesh.rotation.y = Math.atan2(dir.x, dir.z);
      }
    }

    // ★ 前摇状态机：windup → strike → recover
    if (this.attackPhase === 'windup') {
      this.windup += dt;
      // 蓄力期间站在原地（不动），但有身体后仰/举武器的动画
      this.velocity.set(0, 0, 0);
      // 守护者蓄力时显示预警激光线
      if ((this.typeId === 'guardian' || this.typeId === 'guardianStalker' || this.typeId === 'guardianSkywatcher') && this.windup > 0.1) {
        this._drawAimLine(game);
      }
      // 蓄力完成 → 出招
      const wt = this._windupTime();
      if (this.windup >= wt) {
        this.attackPhase = 'strike';
        this.windup = 0;
        this._doStrike(player, dist, game, this.windupDir || dir);
      }
      return;
    }
    if (this.attackPhase === 'strike') {
      // strike 是瞬间，直接进入 recover
      this.attackPhase = 'recover';
      this.windup = 0;
      return;
    }
    if (this.attackPhase === 'recover') {
      this.windup += dt;
      // 收招期间站在原地（有破绽，玩家可反击）
      this.velocity.set(0, 0, 0);
      if (this.windup >= 0.4) {
        this.attackPhase = null;
        this.windup = 0;
      }
      return;
    }

    // ★ 无前摇状态：判断是否开始攻击
    // 远程敌人（章鱼/守护者）：距离够远就射击
    if (this.def.ai === 'ranged' && this.shootCD <= 0 && dist < this.sight && dist > this.radius + 1.5) {
      // 守护者走前摇系统（蓄力激光），章鱼直接射
      if (this.typeId === 'guardian' || this.typeId === 'guardianStalker' || this.typeId === 'guardianSkywatcher') {
        this.attackPhase = 'windup';
        this.windup = 0;
        this.windupDir = dir.clone();
        this.attackCD = 2.5;
      } else {
        this._shoot(player, game);
        this.shootCD = 2.0 + Math.random();
      }
      return;
    }
    // 近战敌人：进入蓄力阶段（给玩家反应时间）
    if (this.attackCD <= 0 && dist < this.radius + 2.0) {
      this.attackPhase = 'windup';
      this.windup = 0;
      this.windupDir = dir.clone();
      this.attackCD = this._attackCooldown();
      const profile = this._strikeProfile();
      if (typeof Effects !== 'undefined') {
        Effects.enemyAttackCue(this.position, this.windupDir, profile.range, profile.color);
      }
      return;
    }
    // 还没到攻击时机，继续追击
    if (dist > this.radius + 1.2) {
      this.velocity.x = dir.x * this.speed;
      this.velocity.z = dir.z * this.speed;
      this._applyMove(dt, game);
    } else {
      this.velocity.set(0, 0, 0);
    }
  }

  // ★ 不同敌人的蓄力时长（清晰前摇，可反应）
  _windupTime() {
    if (this.typeId === 'guardian' || this.typeId === 'guardianStalker' || this.typeId === 'guardianSkywatcher') return 0.9;      // 守护者激光蓄力久，有充足闪避时间
    if (this.boss) return this.finalBoss ? 0.62 : 0.82;
    if (this.typeId === 'lynel' || this.typeId === 'silverLynel') return 0.8;          // 莱尼尔冲撞
    if (this.typeId === 'moblin' || this.typeId === 'blueMoblin' || this.typeId === 'silverMoblin') return 0.7;         // 莫力布林突刺
    if (this.typeId === 'yigaFootsoldier') return 0.36;
    return 0.55;                                      // 普通近战（丘丘/波克布林/骷髅/蜥蜴）
  }
  // ★ 不同敌人的攻击冷却
  _attackCooldown() {
    if (this.typeId === 'guardian' || this.typeId === 'guardianStalker' || this.typeId === 'guardianSkywatcher') return 2.5;
    if (this.boss) return this.finalBoss ? 1.35 : 1.8;
    if (this.typeId === 'lynel' || this.typeId === 'silverLynel') return 2.0;
    if (this.typeId === 'moblin' || this.typeId === 'blueMoblin' || this.typeId === 'silverMoblin') return 1.8;
    if (this.typeId === 'yigaFootsoldier') return 0.95;
    return 1.4;  // 普通
  }

  _strikeProfile() {
    if (this.typeId === 'calamityGanon') return { range: 4.2, facingDot: -0.05, knockback: 14, damageMul: 1.05, color: 0xaa22ff };
    if (this.typeId === 'flameGleeok' || this.typeId === 'frostGleeok' || this.typeId === 'thunderGleeok') return { range: 5.0, facingDot: -0.25, knockback: 14, damageMul: 0.9, color: 0xffaa44 };
    if (this.typeId === 'stoneTalus' || this.typeId === 'ignoTalus' || this.typeId === 'frostTalus') return { range: 5.2, facingDot: -0.35, knockback: 15, damageMul: 1.0, color: 0xc8a76a };
    if (this.typeId === 'hinox' || this.typeId === 'blackHinox' || this.typeId === 'stalnox') return { range: 4.8, facingDot: -0.18, knockback: 13, damageMul: 1.0, color: 0xff8844 };
    if (this.boss) return { range: 3.7, facingDot: 0.02, knockback: 11, damageMul: 1.0, color: 0xff55aa };
    if (this.typeId === 'silverLynel') return { range: 3.45, facingDot: 0.16, knockback: 12, damageMul: 1.25, color: 0xf0e8d0 };
    if (this.typeId === 'lynel') return { range: 3.2, facingDot: 0.2, knockback: 10, damageMul: 1.2, color: 0xff8844 };
    if (this.typeId === 'silverMoblin') return { range: 3.2, facingDot: 0.58, knockback: 8, damageMul: 1.08, color: 0xe8d8aa };
    if (this.typeId === 'moblin' || this.typeId === 'blueMoblin') return { range: 3.05, facingDot: 0.62, knockback: 7, damageMul: 1.0, color: 0xaa88ff };
    if (this.typeId === 'yigaFootsoldier') return { range: 2.25, facingDot: 0.45, knockback: 4.8, damageMul: 1.05, color: 0xff3355 };
    if (this.typeId === 'stonePebblit') return { range: 1.7, facingDot: 0.2, knockback: 5.5, damageMul: 1.0, color: 0xc0a878 };
    if (this.typeId === 'stal') return { range: 2.35, facingDot: 0.48, knockback: 5.5, damageMul: 1.0, color: 0x99ddff };
    if (this.typeId && this.typeId.includes('Bokoblin')) return { range: 2.15, facingDot: 0.35, knockback: 5.2, damageMul: 1.0, color: 0xffaa44 };
    return { range: 2.0, facingDot: 0.25, knockback: 5, damageMul: 1.0, color: 0xffaa44 };
  }

  _playerInStrike(player, windupDir, profile) {
    const toPlayer = new THREE.Vector3().subVectors(player.position, this.position);
    toPlayer.y = 0;
    const dist = toPlayer.length();
    if (dist < 0.001) return { hit: true, dir: windupDir.clone().normalize(), dist };

    const dirToPlayer = toPlayer.clone().normalize();
    const forward = windupDir && windupDir.lengthSq() > 0.001
      ? windupDir.clone().setY(0).normalize()
      : dirToPlayer;
    const pointBlank = dist < this.radius + 0.65;
    const inRange = dist < this.radius + profile.range;
    const inCone = dirToPlayer.dot(forward) > profile.facingDot;
    return { hit: inRange && (inCone || pointBlank), dir: dirToPlayer, dist };
  }

  _landMeleeHit(player, dir, amount, profile, element = null) {
    player._lastAttacker = this;
    const result = player.takeDamage(amount, dir, element);
    if (result !== 'hit' && result !== 'blocked-damaged') return;
    if (result === 'hit' && profile.knockback) player.knockback = dir.clone().multiplyScalar(profile.knockback);
    if (result === 'hit' && typeof Effects !== 'undefined') {
      Effects.hitBurst(player.mesh.position.clone().setY(1.15), profile.color, 7);
    }
  }

  // ★ 出招：按敌人类型差异化
  _doStrike(player, dist, game, dir) {
    const typeId = this.typeId;
    const profile = this._strikeProfile();
    const strike = this._playerInStrike(player, dir, profile);
    if (typeof Effects !== 'undefined' && typeId !== 'guardian') {
      Effects.enemyAttackCue(this.position, dir, profile.range, profile.color);
    }

    // 守护者：激光（高速弹幕，高伤害）
    if (typeId === 'guardian' || typeId === 'guardianStalker' || typeId === 'guardianSkywatcher') {
      this._shootLaser(player, game);
      // 清除预警线
      this._clearAimLine(game);
      return;
    }
    // 蜥蜴战士：远程元素吐息（锥形范围弹幕）
    if (typeId === 'redLizalfos' || typeId === 'blueLizalfos' || typeId === 'yellowLizalfos') {
      this._breathAttack(player, game, dir);
      return;
    }
    // 丘丘：弹跳撞击（元素附着）
    if (typeId === 'chuchu' || typeId === 'fireChuchu' || typeId === 'iceChuchu' || typeId === 'shockChuchu' || typeId === 'frostPebblit' || typeId === 'firePebblit') {
      // 丘丘弹跳撞击：近战判定 + 元素效果
      if (strike.hit) {
        const element = this.element;
        this._landMeleeHit(player, strike.dir, this.atk, { ...profile, color: element === 'fire' ? 0xff4422 : element === 'ice' ? 0x66ddff : element === 'shock' ? 0xffee44 : 0x66ddff }, element);
        this._applyElementEffect(player, element);
      }
      return;
    }
    // 莱尼尔：大范围冲撞（三连判定，大击退）
    if (typeId === 'lynel' || typeId === 'silverLynel') {
      if (strike.hit) this._landMeleeHit(player, strike.dir, this.atk * profile.damageMul, profile);
      return;
    }
    // 莫力布林：长枪突刺（距离更远）
    if (typeId === 'moblin' || typeId === 'blueMoblin' || typeId === 'silverMoblin') {
      if (strike.hit) this._landMeleeHit(player, strike.dir, this.atk, profile);
      return;
    }
    // 波克布林 / 骷髅 / 默认：普通近战挥击
    if (strike.hit) this._landMeleeHit(player, strike.dir, this.atk, profile);
  }

  // 元素效果：火=持续灼烧，冰=减速，雷=麻痹
  _applyElementEffect(player, element) {
    if (!element) return;
    if (typeof Effects === 'undefined') return;
    if (element === 'fire') {
      player._burnTimer = 3.0;  // 持续掉血 3 秒
      Effects.elementalAura(player.mesh.position.clone().setY(1.5), 0xff4422);
    } else if (element === 'ice') {
      player._slowTimer = 2.5;  // 减速 2.5 秒
      Effects.elementalAura(player.mesh.position.clone().setY(1.5), 0x66ddff);
    } else if (element === 'shock') {
      player._stunTimer = 1.0;  // 麻痹 1 秒
      Effects.elementalAura(player.mesh.position.clone().setY(1.5), 0xffee44);
    }
  }

  _updateElementStatus(dt) {
    if (this._burnTimer > 0) {
      this._burnTimer -= dt;
      this._burnTick += dt;
      if (this._burnTick >= 0.55) {
        this._burnTick = 0;
        this.hp -= this.boss ? 1.5 : 3;
        if (typeof Dialogue !== 'undefined') Dialogue.showFloat('燃烧', this.mesh.position.clone().setY(1.8), '#ff8844');
        if (this.hp <= 0) this._die();
      }
    }
    if (this._slowTimer > 0) this._slowTimer -= dt;
    if (this._stunTimer > 0) this._stunTimer -= dt;
  }

  _statusSpeedMul() {
    let mul = 1;
    if (this._slowTimer > 0) mul *= 0.55;
    if (this.disarmed) mul *= 0.92;
    if (this._moldugaExposed > 0) mul *= 0.55;
    return mul;
  }

  // 守护者激光：高速红色弹幕
  _shootLaser(player, game) {
    const proj = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.5, 6),
      new THREE.MeshBasicMaterial({ color: 0xff3333 })
    );
    proj.position.copy(this.position); proj.position.y = 1.2;
    const dir = new THREE.Vector3().subVectors(player.position, proj.position); dir.y = 0; dir.normalize();
    // 激光朝向
    proj.rotation.x = Math.PI / 2;
    proj.rotation.z = -Math.atan2(dir.z, dir.x);
    proj.userData = { velocity: dir.multiplyScalar(28), damage: this.atk * 1.5, fromEnemy: true, owner: this, life: 2.0, isLaser: true };
    game.currentWorld.scene.add(proj);
    game.currentWorld.projectiles.push(proj);
    // 激光发射特效
    if (typeof Effects !== 'undefined') {
      Effects.hitBurst(proj.position.clone(), 0xff3333, 6);
    }
  }

  // 蜥蜴吐息：发射 3 发元素弹幕扇形
  _breathAttack(player, game, dir) {
    const element = this.element || 'fire';
    const color = element === 'fire' ? 0xff4422 : element === 'ice' ? 0x66ddff : 0xffee44;
    for (let i = -1; i <= 1; i++) {
      const angle = Math.atan2(dir.x, dir.z) + i * 0.3;
      const d = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
      const proj = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 6, 5),
        new THREE.MeshBasicMaterial({ color })
      );
      proj.position.copy(this.position); proj.position.y = 1.0;
      proj.userData = { velocity: d.multiplyScalar(10), damage: this.atk, fromEnemy: true, owner: this, life: 2.5, element };
      game.currentWorld.scene.add(proj);
      game.currentWorld.projectiles.push(proj);
    }
    if (typeof Effects !== 'undefined') {
      Effects.hitBurst(this.mesh.position.clone().setY(1.2), color, 8);
    }
  }

  // 守护者蓄力时的预警激光线（从眼到玩家）
  _drawAimLine(game) {
    if (!this._aimLine) {
      const geo = new THREE.BufferGeometry();
      const mat = new THREE.LineBasicMaterial({ color: 0xff3333, transparent: true, opacity: 0.5 });
      this._aimLine = new THREE.Line(geo, mat);
      game.currentWorld.scene.add(this._aimLine);
    }
    const from = this.mesh.position.clone().setY(1.2);
    const to = game.player.position.clone().setY(1.0);
    this._aimLine.geometry.setFromPoints([from, to]);
    this._aimLine.material.opacity = 0.3 + Math.sin(this.windup * 20) * 0.2;  // 闪烁
    this._aimLine.visible = true;
    const now = Date.now();
    if ((!this._nextAimFxAt || now >= this._nextAimFxAt) && typeof Effects !== 'undefined') {
      Effects.guardianLaserCharge(from);
      this._nextAimFxAt = now + 360;
    }
  }
  _clearAimLine(game) {
    if (this._aimLine) {
      this._aimLine.visible = false;
    }
  }

  _shoot(player, game) {
    const element = this.element || null;
    const color = element === 'fire' ? 0xff4422
                : element === 'ice' ? 0x66ddff
                : element === 'shock' ? 0xffee44
                : this.typeId === 'guardian' ? 0xff3333
                : 0xffaa22;
    const proj = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 6, 5),
      new THREE.MeshBasicMaterial({ color })
    );
    proj.position.copy(this.position); proj.position.y = 1.0;
    const dir = new THREE.Vector3().subVectors(player.position, proj.position); dir.y = 0; dir.normalize();
    const speed = this.typeId === 'guardian' || this.typeId === 'guardianStalker' || this.typeId === 'guardianSkywatcher' ? 18 : this.typeId.includes('Wizzrobe') ? 13.5 : 12;
    proj.userData = { velocity: dir.multiplyScalar(speed), damage: this.atk, fromEnemy: true, owner: this, life: 3.0, element };
    game.currentWorld.scene.add(proj);
    game.currentWorld.projectiles.push(proj);
    if (typeof Effects !== 'undefined') {
      if (this.typeId === 'guardian' || this.typeId === 'guardianStalker' || this.typeId === 'guardianSkywatcher') {
        Effects.guardianLaserCharge(proj.position.clone());
        Effects.guardianLaserBeam(proj.position.clone(), player.position.clone().setY(1.05), 0x66ddff, false);
      } else {
        Effects.hitBurst(this.position.clone().setY(1.3), color, 4);
      }
    }
  }

  _applyMove(dt, game) {
    const next = this.position.clone();
    next.x += this.velocity.x * dt;
    next.z += this.velocity.z * dt;
    const before = this.position.clone();
    if (game.currentWorld.getTerrainAt) {
      const terrain = game.currentWorld.getTerrainAt(next.x, next.z);
      if (terrain.inWater) {
        next.x = this.position.x;
        next.z = this.position.z;
        this.patrolDir.multiplyScalar(-1);
      } else if (terrain.slope) {
        next.y = terrain.slope.height;
      } else {
        next.y = 0;
      }
    }
    if (game.currentWorld.constrainActorPosition) {
      next.copy(game.currentWorld.constrainActorPosition(next, this.radius || 0.7, before, {
        allowWater: this.typeId === 'octorok' || this.typeId === 'electricOctorok'
      }));
    } else {
      const b = game.currentWorld.bounds;
      next.x = Math.max(b.minX + 1, Math.min(b.maxX - 1, next.x));
      next.z = Math.max(b.minZ + 1, Math.min(b.maxZ - 1, next.z));
      for (const obj of game.currentWorld.colliders) {
        const dx = next.x - obj.position.x, dz = next.z - obj.position.z;
        const cr = obj.userData.collisionRadius || 0.6;
        const dist = Math.hypot(dx, dz);
        const minDist = this.radius + cr;
        if (dist < minDist && dist > 0.001) {
          next.x += (dx / dist) * (minDist - dist);
          next.z += (dz / dist) * (minDist - dist);
        }
      }
    }
    this.position.copy(next);
  }

  _poseAlpha(dt, speed) {
    return 1 - Math.exp(-Math.max(1, speed) * dt);
  }

  _smoothRotation(obj, x = 0, y = 0, z = 0, alpha = 1) {
    if (!obj) return;
    obj.rotation.x += (x - obj.rotation.x) * alpha;
    obj.rotation.y += (y - obj.rotation.y) * alpha;
    obj.rotation.z += (z - obj.rotation.z) * alpha;
  }

  _smoothScale(obj, x = 1, y = 1, z = 1, alpha = 1) {
    if (!obj) return;
    obj.scale.x += (x - obj.scale.x) * alpha;
    obj.scale.y += (y - obj.scale.y) * alpha;
    obj.scale.z += (z - obj.scale.z) * alpha;
  }

  _animate(dt, state) {
    const p = this.mesh.userData.parts;
    if (!p) return;
    const visualRole = this.mesh.userData.enemyRole || (this.def.ai === 'ranged' ? 'archer' : this.miniBoss ? 'elite' : 'melee');
    this._idlePhase += dt * 2.5;
    this._posePhase += dt * (state === 'chase' ? 6.5 : state === 'patrol' ? 4.5 : 2.8);
    const alpha = this._poseAlpha(dt, state === 'attack' ? 14 : 10);

    if (state === 'patrol' || state === 'chase') {
      this._walkPhase += dt * 8;
      const swing = Math.sin(this._walkPhase) * 0.5;
      const power = state === 'chase' ? 1 : 0.55;
      this._smoothRotation(p.legL, swing * power, 0, 0, alpha);
      this._smoothRotation(p.legR, -swing * power, 0, 0, alpha);
      if (visualRole === 'shield') {
        this._smoothRotation(p.armL, -1.05, 0.06, -0.36, alpha);
        this._smoothRotation(p.armR, swing * 0.42 * power, 0, -0.08 * power, alpha);
        this._smoothRotation(p.body, -0.11 * power, 0, Math.sin(this._walkPhase) * 0.035 * power, alpha);
      } else if (visualRole === 'archer') {
        this._smoothRotation(p.armL, -0.62 + swing * 0.18, 0.08, -0.28, alpha);
        this._smoothRotation(p.armR, -0.75 - swing * 0.16, -0.08, 0.26, alpha);
        this._smoothRotation(p.body, -0.02 * power, Math.sin(this._walkPhase) * 0.035 * power, 0, alpha);
      } else {
        this._smoothRotation(p.armL, -swing * power, 0, 0.08 * power, alpha);
        this._smoothRotation(p.armR, swing * power, 0, -0.08 * power, alpha);
        this._smoothRotation(p.body, (visualRole === 'elite' ? -0.075 : -0.035) * power, 0, Math.sin(this._walkPhase) * 0.045 * power, alpha);
      }
      this._smoothRotation(p.head, 0.04 * power, 0, 0, alpha);
      this._smoothScale(p.body, 1, 1, 1, alpha);
    } else if (state === 'attack') {
      // ★ 攻击动画：按阶段表现
      if (this.attackPhase === 'windup') {
        // 蓄力：举武器过头/身体后仰
        const progress = this.windup / this._windupTime();
        const ease = progress * progress * (3 - 2 * progress);
        if (visualRole === 'shield') {
          this._smoothRotation(p.armL, -1.45, 0.08, -0.48, alpha);
          this._smoothRotation(p.armR, -0.78 - ease * 0.45, 0, 0.18, alpha);
        } else if (visualRole === 'archer') {
          this._smoothRotation(p.armL, -1.05, 0.16, -0.55, alpha);
          this._smoothRotation(p.armR, -1.25 - ease * 0.25, -0.12, 0.45, alpha);
        } else {
          this._smoothRotation(p.armR, -1.15 - ease * (visualRole === 'elite' ? 1.18 : 0.95), 0, -0.18, alpha);
          this._smoothRotation(p.armL, -0.28 - ease * 0.18, 0, 0.12, alpha);
        }
        this._smoothRotation(p.body, -ease * (visualRole === 'elite' ? 0.34 : 0.24), 0, Math.sin(this._posePhase * 3) * 0.035 * ease, alpha);
        this._smoothRotation(p.head, ease * 0.08, 0, 0, alpha);
        // 丘丘蓄力：身体压扁
        if (this.typeId === 'chuchu' || this.typeId === 'fireChuchu' || this.typeId === 'iceChuchu' || this.typeId === 'shockChuchu') {
          this._smoothScale(p.body, 1 + ease * 0.34, 1 - ease * 0.42, 1 + ease * 0.2, alpha);
        } else {
          this._smoothScale(p.body, 1 + ease * 0.04, 1 - ease * 0.03, 1, alpha);
        }
      } else if (this.attackPhase === 'strike') {
        // 出招瞬间：快速前挥
        if (visualRole === 'shield') {
          this._smoothRotation(p.armL, -1.15, 0, -0.58, 1);
          this._smoothRotation(p.armR, 1.1, 0.08, 0.24, 1);
          this._smoothRotation(p.body, 0.2, 0, -0.08, 1);
        } else if (visualRole === 'archer') {
          this._smoothRotation(p.armL, -1.2, 0.18, -0.7, 1);
          this._smoothRotation(p.armR, -0.42, -0.16, 0.58, 1);
          this._smoothRotation(p.body, 0.08, 0.18, 0, 1);
        } else {
          this._smoothRotation(p.armR, 1.35, 0.08, 0.25, 1);
          this._smoothRotation(p.armL, -0.15, 0, -0.12, 1);
          this._smoothRotation(p.body, visualRole === 'elite' ? 0.38 : 0.28, 0, 0, 1);
        }
        if (this.typeId === 'chuchu' || this.typeId === 'fireChuchu' || this.typeId === 'iceChuchu' || this.typeId === 'shockChuchu') {
          this._smoothScale(p.body, 0.78, 1.34, 0.92, 1);
        }
      } else if (this.attackPhase === 'recover') {
        // 收招：缓慢回归自然姿态
        const k = 1 - this.windup / 0.4;
        this._smoothRotation(p.armR, 1.4 * k, 0, 0, alpha);
        this._smoothRotation(p.armL, 0, 0, 0, alpha);
        this._smoothRotation(p.body, 0.3 * k, 0, 0, alpha);
        this._smoothRotation(p.head, 0, 0, 0, alpha);
        this._smoothScale(p.body, 1, 1, 1, alpha);
      }
    } else {
      // ★ idle 呼吸动画（静止时的微动，让怪物有"活着"的感觉）
      const breath = Math.sin(this._idlePhase) * 0.04;
      if (p.body && state !== 'hurt') {
        p.body.scale.y = 1 + breath;
        p.body.position.y = (p.body.userData.baseY || p.body.position.y) + breath * 0.5;
        if (!p.body.userData.baseY) p.body.userData.baseY = p.body.position.y - breath * 0.5;
        this._smoothRotation(p.body, breath * 0.4, 0, 0, alpha);
      }
      // 丘丘 idle：果冻挤压
      if (this.typeId === 'chuchu' || this.typeId === 'fireChuchu' || this.typeId === 'iceChuchu' || this.typeId === 'shockChuchu') {
        if (p.body) {
          p.body.scale.y = 1 + Math.sin(this._idlePhase * 1.5) * 0.08;
          p.body.scale.x = 1 - Math.sin(this._idlePhase * 1.5) * 0.05;
        }
      }
      // 重置手臂
      if (visualRole === 'shield') {
        this._smoothRotation(p.armL, -0.78, 0, -0.28, alpha);
        this._smoothRotation(p.armR, 0.05, 0, 0.05, alpha);
      } else if (visualRole === 'archer') {
        this._smoothRotation(p.armL, -0.32, 0.08, -0.22, alpha);
        this._smoothRotation(p.armR, -0.22, -0.06, 0.18, alpha);
      } else {
        this._smoothRotation(p.armL, 0, 0, 0, alpha);
        this._smoothRotation(p.armR, 0, 0, 0, alpha);
      }
      this._smoothRotation(p.legL, 0, 0, 0, alpha);
      this._smoothRotation(p.legR, 0, 0, 0, alpha);
      this._smoothRotation(p.head, 0, 0, 0, alpha);
    }

    // 受击闪白 + 暖色边光：让命中反馈更明确
    if (this.hurtTimer > 0) {
      const flash = 0.45 + Math.sin(this.hurtTimer * 55) * 0.18;
      const react = Math.min(1, this.hurtTimer / Math.max(0.001, this._hitReactMax || 0.25));
      const shake = Math.sin(this.hurtTimer * 52);
      const side = this._hitReactSide || 0;
      const back = this._hitReactBack || 0.45;
      this.mesh.rotation.z = side * react * (this.boss ? 0.04 : 0.14) + shake * (this.boss ? 0.018 : 0.05);
      if (p.body) {
        p.body.rotation.x = -0.42 * react * Math.max(0.45, back);
        p.body.rotation.z = -side * 0.18 * react;
        p.body.position.z = (p.body.userData.baseZ || 0) - 0.08 * react;
        if (p.body.userData.baseZ === undefined) p.body.userData.baseZ = p.body.position.z + 0.08 * react;
      }
      if (visualRole === 'shield') {
        if (p.armL) {
          p.armL.rotation.x = -1.25 + shake * 0.18;
          p.armL.rotation.z = -0.42 + shake * 0.12;
        }
        if (p.armR) p.armR.rotation.x = 0.15 * react;
      } else if (visualRole === 'archer') {
        if (p.armL) p.armL.rotation.x = -0.18 + shake * 0.08;
        if (p.armR) {
          p.armR.rotation.x = 0.72 * react;
          p.armR.rotation.z = 0.42 * react;
        }
      } else if (visualRole === 'elite') {
        if (p.armR) p.armR.rotation.x = -0.45 * react + shake * 0.08;
        if (p.head) p.head.rotation.x = 0.22 * react;
      } else {
        if (p.armL) p.armL.rotation.x = 0.35 * react;
        if (p.armR) p.armR.rotation.x = -0.25 * react;
      }
      this.mesh.traverse(c => {
        if (c.isMesh && c.material && c.material.emissive) {
          c.material.emissive.setHex(this.boss ? 0xffaa44 : 0xfff0c8);
          c.material.emissiveIntensity = flash;
        }
      });
    } else {
      this.mesh.rotation.z += (0 - this.mesh.rotation.z) * this._poseAlpha(dt, 9);
      if (p.body && p.body.userData.baseZ !== undefined) {
        p.body.position.z += (p.body.userData.baseZ - p.body.position.z) * this._poseAlpha(dt, 10);
      }
      this.mesh.traverse(c => {
        if (c.isMesh && c.material && c.material.emissive && !this.boss) {
          c.material.emissiveIntensity = 0;
        }
      });
    }

    // ★ Boss 动态效果
    if (this.boss && p.weak) {
      // 巨像弱点脉动
      p.weak.scale.setScalar(1 + Math.sin(this._idlePhase * 3) * 0.15);
      if (p.weak.material) p.weak.material.opacity = 0.8 + Math.sin(this._idlePhase * 3) * 0.2;
      this._weakFxTimer = (this._weakFxTimer || 0) - dt;
      if (this._weakFxTimer <= 0 && typeof Effects !== 'undefined') {
        const worldPos = p.weak.getWorldPosition(new THREE.Vector3());
        const color = this.element === 'ice' ? 0x66ddff : this.element === 'shock' ? 0xffee44 : this.element === 'fire' ? 0xff5533 : 0xff4466;
        Effects.bossWeakPointPulse(worldPos, color);
        this._weakFxTimer = 1.25;
      }
    }
    if (this.boss && p.aura) {
      // 盖侬光环旋转
      p.aura.rotation.y += dt * 0.8;
      p.aura.scale.setScalar(1 + Math.sin(this._idlePhase * 2) * 0.05);
    }
  }

  takeDamage(amount, fromDir, weaponElement) {
    if (this.dead) return;
    this._combatWakeTimer = Math.max(this._combatWakeTimer || 0, this.boss ? 10 : 7);
    if (this.state !== 'attack') this.state = 'chase';
    if (this.sleeping) {
      amount *= 1.6;
      this.sleeping = false;
      Dialogue.showFloat('偷袭惊醒！', this.mesh.position.clone().setY(2.2), '#9fffb4');
    }
    if (this.camp && !this.camp.alerted && typeof ExplorationSystem !== 'undefined') {
      ExplorationSystem.alertCamp(this.camp, '营地遭到攻击！');
    }
    // 元素克制：火克冰，冰克火，雷克水/金属
    let finalDmg = amount;
    if (weaponElement && this.element) {
      if (weaponElement === 'fire' && this.element === 'ice') finalDmg *= 2;
      else if (weaponElement === 'ice' && this.element === 'fire') finalDmg *= 2;
      else if (weaponElement === 'shock') finalDmg *= 1.5;
    }
    if (weaponElement && typeof ExplorationSystem !== 'undefined' && this.heldWeaponId) {
      if (weaponElement === 'shock' && ExplorationSystem.isMetal(this.heldWeaponId)) {
        ExplorationSystem.disarmEnemy(this, '雷击让敌人武器脱手！');
      } else if (weaponElement === 'fire' && ExplorationSystem.isWood(this.heldWeaponId)) {
        ExplorationSystem.disarmEnemy(this, '火焰烧掉了敌人的木制武器！');
      }
    }
    const visualRole = this.mesh.userData.enemyRole || (this.def.ai === 'ranged' ? 'archer' : this.miniBoss ? 'elite' : 'melee');
    const hitDir = fromDir && fromDir.lengthSq && fromDir.lengthSq() > 0.001
      ? fromDir.clone().setY(0).normalize()
      : new THREE.Vector3(Math.sin(this.mesh.rotation.y), 0, Math.cos(this.mesh.rotation.y));
    const facing = new THREE.Vector3(Math.sin(this.mesh.rotation.y), 0, Math.cos(this.mesh.rotation.y));
    const right = new THREE.Vector3(facing.z, 0, -facing.x);
    this._hitReactDir.copy(hitDir);
    this._hitReactSide = THREE.MathUtils.clamp(right.dot(hitDir), -1, 1);
    this._hitReactBack = THREE.MathUtils.clamp(facing.dot(hitDir), -1, 1);
    this._hitReactMax = visualRole === 'archer' ? 0.46 : visualRole === 'shield' ? 0.38 : visualRole === 'elite' ? 0.34 : 0.28;
    this.hp -= finalDmg;
    this.hurtTimer = this._hitReactMax;
    this.state = 'hurt';
    if (visualRole === 'archer') {
      this.attackPhase = 'recover';
      this.windup = 0.18;
      this.shootCD = Math.max(this.shootCD || 0, 0.45);
    } else if (visualRole === 'shield') {
      this.windup = Math.min(this.windup || 0, 0.12);
    }
    Dialogue.showFloat(`-${Math.round(finalDmg)}`, this.mesh.position, '#ff5a3a');
    const knockScale = this.boss ? 0.12 : visualRole === 'shield' ? 0.34 : visualRole === 'elite' ? 0.42 : visualRole === 'archer' ? 0.72 : 0.62;
    const beforeKnock = this.position.clone();
    this.position.add(hitDir.clone().multiplyScalar(knockScale));
    if (window.game && window.game.currentWorld && window.game.currentWorld.constrainActorPosition) {
      this.position.copy(window.game.currentWorld.constrainActorPosition(this.position, this.radius || 0.7, beforeKnock, {
        allowWater: this.typeId === 'octorok' || this.typeId === 'electricOctorok'
      }));
    }
    if (this.boss) {
      Effects.hitBurst(this.mesh.position.clone().setY(5.3), 0xff8800, 12);
    } else if (typeof Effects !== 'undefined' && Effects.lowPolyShatter) {
      const color = weaponElement === 'fire' ? 0xff6644 : weaponElement === 'ice' ? 0x88ddff : weaponElement === 'shock' ? 0xffee66 : visualRole === 'shield' ? 0xd0c6a8 : 0xd8c0a0;
      Effects.lowPolyShatter(this.mesh.position.clone().setY(visualRole === 'elite' ? 1.35 : 1.05), color, visualRole === 'elite' ? 11 : visualRole === 'shield' ? 6 : 8, visualRole === 'elite' ? 0.72 : 0.58);
      if (visualRole === 'shield' && Effects.shockwave) Effects.shockwave(this.mesh.position.clone(), 0xd6c79a, 0.62);
    }
    if (this.hp <= 0) this._die();
  }

  _die() {
    this.dead = true;
    this.deathTimer = 0;
    this._deathShatterDone = false;
    this._deathFx = {
      color: this.boss ? 0x9a7a5a : (this.element === 'fire' ? 0xff5522 : this.element === 'ice' ? 0x7edfff : this.element === 'shock' ? 0xffee66 : 0xb8aa92),
      count: this.boss ? 34 : this.miniBoss ? 24 : 18,
      scale: this.boss ? 1.55 : this.miniBoss ? 1.15 : 0.95,
      y: this.boss ? 2.2 : 1.0
    };
    Dialogue.show(this.boss ? `击败了 ${this.def.name}！传说成真！` : (this.miniBoss ? `强敌 ${this.def.name} 倒下了！` : `击败了 ${this.def.name}！`));
    if (typeof AudioSystem !== 'undefined') AudioSystem.play(this.boss ? 'power' : 'pickup');
    Effects.deathPuff(this.mesh.position.clone().setY(1.2),
      this.boss ? 0x7a6a5a : (this.element === 'fire' ? 0xff4422 : this.element === 'ice' ? 0x66ddff : this.element === 'shock' ? 0xffee44 : 0x888888));
    if (this.boss) {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          Effects.deathPuff(this.mesh.position.clone().add(new THREE.Vector3(
            (Math.random()-0.5)*4, Math.random()*3, (Math.random()-0.5)*4)), 0x8a7a5a);
        }, i * 100);
      }
    }
    const drops = this.def.drops();
    if (!this.disarmed && this.heldWeaponId && typeof DropItem !== 'undefined' && Math.random() < (this.boss ? 0.35 : 0.75)) {
      drops.push([this.heldWeaponId, 1]);
    }
    if (this.heldShieldId && typeof DropItem !== 'undefined' && Math.random() < 0.65) {
      drops.push([this.heldShieldId, 1]);
    }
    for (const [item, count] of drops) {
      const def = typeof ITEMS !== 'undefined' ? ITEMS[item] : null;
      const itemOptions = def && ['weapon', 'shield', 'bow'].includes(def.type)
        ? { rollModifier: true, modifierChance: this.boss || this.miniBoss ? 0.55 : 0.28, source: 'drop' }
        : {};
      const drop = new DropItem(item, count,
        this.position.x + (Math.random() - 0.5) * 1.5,
        this.position.z + (Math.random() - 0.5) * 1.5,
        itemOptions);
      if (window.game && window.game.currentWorld) {
        window.game.currentWorld.drops.push(drop);
        window.game.currentWorld.scene.add(drop.mesh);
      }
    }
    // 经验/卢比直接入账
    if (window.game) {
      window.game.player.inventory.rupees += this.def.dropRupee || 0;
    }
  }
}

// ========================================================
// DropItem — 地面拾取物
// ========================================================
class DropItem {
  constructor(itemId, count, x, z, options = {}) {
    this.itemId = itemId;
    this.count = count;
    this.options = options || {};
    this.pickedUp = false;
    const def = ITEMS[itemId];
    const color = def.type === 'weapon' ? 0xff8844 :
                  itemId === 'rupee' ? 0x44ff66 :
                  def.type === 'food' ? 0xff4444 :
                  def.type === 'armor_upper' || def.type === 'armor_lower' ? 0xaa66ff : 0xffd54f;
    this.mesh = AssetFactory.createPickupBeam(color);
    this.mesh.position.set(x, 0, z);
    let inner;
    switch (def.type) {
      case 'weapon': inner = AssetFactory.createWeaponMesh(itemId); break;
      case 'shield': inner = AssetFactory.createShieldMesh(itemId); break;
      case 'bow':    inner = AssetFactory.createBowMesh(itemId); break;
      case 'food':
        inner = (itemId.includes('apple') || itemId === 'roastedApple') ? AssetFactory.createApple() :
                itemId.includes('Skewer') || itemId.includes('Meat') ? AssetFactory.createApple() :
                AssetFactory.createApple();
        break;
      case 'material':
        inner = itemId === 'rupee' ? AssetFactory.createRupee() :
                itemId.includes('Chuchu') ? AssetFactory.createRupee(0.6) :
                AssetFactory.createRupee(0.7);
        break;
      case 'armor_upper':
      case 'armor_lower':
        inner = AssetFactory.createArmorMesh(def.type, itemId);
        break;
      default: inner = AssetFactory.createRupee();
    }
    inner.position.y = 1.0;
    this.innerMesh = inner;
    this.mesh.add(inner);
    this.lifetime = 120;
  }

  update(dt) {
    if (this.pickedUp) return;
    this.mesh.rotation.y += dt * 2;
    if (this.innerMesh) {
      this.innerMesh.position.y = 1.0 + Math.sin(performance.now() * 0.003) * 0.15;
    }
    this.lifetime -= dt;
  }
}
