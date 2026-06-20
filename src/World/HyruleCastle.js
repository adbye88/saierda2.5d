/* ========================================================
   HyruleCastle.js — 海拉鲁城堡（最终关卡）
   地形：黑云笼罩、紫色魔气、城堡废墟
   怪物：守护者、白银波克布林、莫力布林、莱尼尔
   最终 Boss：灾厄盖侬（击败后通关）
   ======================================================== */

class HyruleCastle extends BaseScene {
  constructor() {
    super('castle');
    this.bounds = { minX: -150, maxX: 150, minZ: -150, maxZ: 150 };
    this.spawnPoint = { x: 0, z: 96, a: Math.PI };
  }

  build() {
    this._setupGround(0x3a2a3a, 'castleFloor');

    // 黑紫色魔气雾
    this.scene.fog = new THREE.Fog(0x2a1a3a, 10, 40);

    // 海拉鲁城堡（中央）
    const castle = AssetFactory.createCastle();
    castle.position.set(0, 0, -10);
    this.scene.add(castle);
    if (typeof StorySystem !== 'undefined') {
      StorySystem.addMemoryMarker(this, 'castlePromise', 0, -30, { color: 0xffd56a });
    }

    // 废墟石柱
    this.scatter(() => AssetFactory.createRock(1.0), 80);
    for (const [x, z, r, h] of [[-34, 28, 6, 1.7], [36, 32, 6, 1.7], [-46, -36, 7, 2.0], [48, -42, 7, 2.0], [-86, 76, 8, 2.2], [86, 78, 8, 2.2], [-92, -82, 9, 2.5], [92, -84, 9, 2.5]]) {
      const slope = AssetFactory.createSlopeHill(r, h, 0x514657);
      slope.position.set(x, 0, z);
      this.scene.add(slope);
      this.addSlopeZone(x, z, r, h);
    }
    this.addRuinCluster(-96, -106, { color: 0x4a4450, count: 8, rotation: 0.5 });
    this.addRuinCluster(100, 94, { color: 0x514657, count: 8, rotation: -0.3 });
    // 魔气火盆（紫色）
    for (const [x, z] of [[-10, 5], [10, 5], [-10, 15], [10, 15]]) {
      const brazier = AssetFactory.createCampfire();
      brazier.position.set(x, 0, z);
      // 把火改成紫色
      brazier.children.forEach((c, i) => { if (c.material && i < 2) c.material.color.setHex(0x9922cc); });
      const purpleLight = new THREE.PointLight(0x9922cc, 1.5, 15);
      purpleLight.position.set(x, 2, z);
      this.scene.add(brazier, purpleLight);
    }

    // 烹饪锅
    const pot = AssetFactory.createCookingPot();
    pot.position.set(2, 0, 25);
    this.scene.add(pot);
    this.cookingPots = [pot];
    ShopSystem.spawnInWorld(this, 'ancientShop');

    // 强力小怪
    const enemySpots = [
      [-12, 5, 'silverBokoblin'],
      [12, 5, 'silverBokoblin'],
      [-15, -5, 'moblin'],
      [15, -5, 'moblin'],
      [-8, -15, 'guardian'],
      [8, -15, 'guardian'],
      [0, 15, 'silverBokoblin'],
      [-20, 0, 'guardian'],
      [24, 22, 'blackBokoblin'],
      [-26, 24, 'blackBokoblin'],
      [36, -8, 'moblin'],
      [-38, -12, 'moblin'],
      [44, 12, 'guardian'],
      [-46, 8, 'guardian'],
      [26, -44, 'stal'],
      [-28, -46, 'stal'],
      [50, -34, 'silverBokoblin'],
      [-52, -32, 'silverBokoblin'],
      [0, 42, 'silverMoblin'],
      [-34, 44, 'silverMoblin'],
      [34, 44, 'silverMoblin'],
      [-56, 24, 'yigaFootsoldier'],
      [56, 24, 'yigaFootsoldier'],
      [-42, -54, 'shockWizzrobe'],
      [42, -54, 'fireWizzrobe'],
      [0, -58, 'iceWizzrobe'],
      [-58, -6, 'archerBokoblin'],
      [58, -6, 'archerBokoblin'],
      [-72, 36, 'goldBokoblin'],
      [72, 36, 'goldBokoblin'],
      [-64, -70, 'guardianStalker'],
      [64, -70, 'guardianStalker'],
      [0, -88, 'maliceWizzrobe'],
      [-86, 0, 'blueMoblin'],
      [86, 0, 'blueMoblin'],
      [-108, -104, 'guardianStalker'],
      [108, -104, 'guardianStalker'],
      [-112, 96, 'guardianSkywatcher'],
      [112, 96, 'guardianSkywatcher'],
      [0, 112, 'maliceWizzrobe']
    ];
    for (const [x, z, type] of enemySpots) {
      this.enemies.push(new Enemy(type, x, z));
    }
    for (const e of this.enemies) this.scene.add(e.mesh);

    // 莱尼尔（精英守门）
    const lynel = new Enemy('silverLynel', 0, 10);
    this.enemies.push(lynel);
    this.scene.add(lynel.mesh);
    this.addFieldBoss('silverLynel', -82, -72, '王城西塔白银莱尼尔');
    this.addFieldBoss('silverLynel', 82, -72, '王城东塔白银莱尼尔');
    this.addFieldBoss('stoneTalus', 0, 82, '城门废墟岩石巨像');
    this.addFieldBoss('stalnox', -96, -106, '王城船坞骷髅独眼巨人');
    this.addFieldBoss('thunderGleeok', 100, 94, '中央广场雷电三头龙');
    this.addFieldBoss('guardianStalker', 0, 128, '中央平原行走守护者');

    this.addShrines(['shrineCastleWatch', 'shrineRoyalGuard', 'shrineCastleDocks', 'shrineCentralSquare']);
    this.addTower(-92, 92, '王城西侧鸟望塔');
    this.addTower(92, 92, '王城东侧鸟望塔');
    this.addTower(-118, -112, '王城船坞鸟望塔');
    this.addTower(118, 112, '中央广场鸟望塔');

    // 王室宝箱：海利亚盾（全局唯一奖励）
    if (!SaveSystem.isChestOpened('castleHylianShield')) {
      const royalChest = AssetFactory.createChest();
      royalChest.position.set(-18, 0, -28);
      royalChest.scale.setScalar(1.25);
      royalChest.traverse(c => {
        if (c.isMesh && c.material && c.material.emissive) {
          c.material.emissive.setHex(0xffd54f);
          c.material.emissiveIntensity = 0.08;
        }
      });
      this.scene.add(royalChest);
      this.breakables.push({
        mesh: royalChest, broken: false,
        break_open: (game) => {
          const b = this.breakables.find(x => x.mesh === royalChest);
          if (!b || b.broken || SaveSystem.isChestOpened('castleHylianShield')) return;
          b.broken = true;
          const lid = royalChest.getObjectByName('lid');
          if (lid) { lid.position.y += 0.05; lid.rotation.x = -1.1; }
          game.player.inventory.add('hylianShield', 1);
          game.player.refreshEquipment();
          SaveSystem.openChest('castleHylianShield');
          Dialogue.show('王室宝箱：获得了 🛡️ 海利亚盾！');
          Effects.pickupFlash(royalChest.position);
          if (typeof AudioSystem !== 'undefined') AudioSystem.play('power');
        }
      });
    }

    // 最终 Boss：灾厄盖侬（城堡深处）
    const boss = new Enemy('calamityGanon', 0, -15);
    boss.boss = true; boss.finalBoss = true;
    boss._bossActive = false;
    boss.mesh.visible = false;
    this.boss = boss;
    this.scene.add(boss.mesh);
    this.enemies.push(boss);

    // 散落补给（决战前补给）
    const pickups = [
      ['heartyApple', 5, -15, 25],
      ['heartyApple', 5, 15, 25],
      ['roastedMeat', 5, 0, 28],
      ['arrow', 30, 0, 25],
      ['rupee', 50, -25, 0],
      ['ancientCore', 1, 25, 0]
    ];
    for (const [item, n, x, z] of pickups) {
      const d = new DropItem(item, n, x, z);
      this.drops.push(d); this.scene.add(d.mesh);
    }

    // 传送门
    const gate = AssetFactory.createDungeonGate();
    gate.position.set(0, 0, 106);
    gate.userData.target = 'grassland';
    gate.userData.targetName = '起始台地';
    gate.userData.triggered = false;
    this.scene.add(gate);
    this.gates.push(gate);

    setTimeout(() => {
      if (window.game && window.game.currentWorld === this) {
        HUD.setQuest('最终决战：击败灾厄盖侬，拯救海拉鲁！', 0x9922cc);
      }
    }, 800);
  }

  update(dt, game) {
    super.update(dt, game);
    // Boss 激活
    if (this.boss && !this.boss._bossActive) {
      const d = game.player.position.distanceTo(this.boss.mesh.position);
      if (d < 12) {
        this.boss._bossActive = true;
        this.boss.mesh.visible = true;
        if (typeof StorySystem !== 'undefined') StorySystem.markEvent('finalBattleStarted');
        Dialogue.show('【灾厄盖侬】勇者，你终于走到王城深处。百年前未完的战斗，现在继续。');
        HUD.setQuest('最终决战：击败灾厄盖侬！', 0xff33cc);
      }
    }
    if (this.boss && this.boss.dead && !this.bossDefeated) {
      this.bossDefeated = true;
      SaveSystem.defeatBoss('calamityGanon');
      if (typeof StorySystem !== 'undefined') StorySystem.markEvent('calamityEnded');
      Dialogue.show('【胜利】灾厄被驱散，王城上空终于出现黎明。失去的记忆不会改变过去，但会照亮之后的旅程。');
      HUD.setQuest('★ 通关！你拯救了世界！前往传送门继续探索 ★', 0xffd54f);
      QuestSystem.check();
      // 全屏胜利特效
      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          Effects.pickupFlash(game.player.position.clone().add(new THREE.Vector3(
            (Math.random()-0.5)*8, 0, (Math.random()-0.5)*8)));
        }, i * 200);
      }
    }
  }
}
