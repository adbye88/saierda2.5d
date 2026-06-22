/* ========================================================
   Highland.js — 费罗尼高地
   地形：开阔丘陵、双河、可爬坡、混合怪营地
   定位：离开起始台地后的中阶探索地图
   ======================================================== */

class Highland extends BaseScene {
  constructor() {
    super('highland');
    this.bounds = { minX: -190, maxX: 190, minZ: -190, maxZ: 190 };
    this.spawnPoint = { x: 0, z: -132, a: 0 };
  }

  build() {
    this._setupGround(0x668f50, 'grass');
    this.scene.fog = new THREE.Fog(0x9ecf9a, 70, 170);

    this.scatter(() => AssetFactory.createTree(), 125);
    this.scatter(() => AssetFactory.createBigTree(), 28);
    this.scatter(() => AssetFactory.createPine(), 42);
    this.scatter(() => AssetFactory.createRock(0.7 + Math.random() * 0.9), 98);
    this.scatter(() => AssetFactory.createBush(), 68);
    this.scatter(() => AssetFactory.createGrassTuft(), 135, 2);
    this.scatter(() => AssetFactory.createFlower(), 72, 2);

    // 双河：必须通过桥或绕行高地。
    const riverA = AssetFactory.createRiver(9, 280);
    riverA.position.set(-42, 0, 0);
    this.scene.add(riverA);
    this.addWaterZone(-42, 0, 9, 190);
    const riverB = AssetFactory.createRiver(8, 260);
    riverB.position.set(42, 0, 8);
    riverB.rotation.y = 0.18;
    this.scene.add(riverB);
    this.addWaterZone(42, 8, 8, 170, 0.18);
    this.rivers = [riverA, riverB];

    const bridges = [
      [-42, -38, Math.PI / 2],
      [-42, 48, Math.PI / 2],
      [42, -24, Math.PI / 2 + 0.18],
      [42, 60, Math.PI / 2 + 0.18],
      [-42, 116, Math.PI / 2],
      [42, -112, Math.PI / 2 + 0.18]
    ];
    for (const [x, z, rot] of bridges) {
      const bridge = AssetFactory.createBridge(12);
      bridge.position.set(x, 0, z);
      bridge.rotation.y = rot;
      this.scene.add(bridge);
      this.addBridgeZone(x, z, 4, 14, rot);
    }

    for (const [x, z, r, h] of [
      [-70, -55, 8, 2.1], [-72, 55, 7, 1.9], [0, 42, 9, 2.3],
      [70, -50, 8, 2.0], [74, 56, 7, 1.8], [-8, -66, 6, 1.6],
      [-122, 88, 9, 2.4], [126, -102, 10, 2.7], [128, 122, 8, 2.2]
    ]) {
      const slope = AssetFactory.createSlopeHill(r, h, 0x6f9650);
      slope.position.set(x, 0, z);
      this.scene.add(slope);
      this.addSlopeZone(x, z, r, h);
    }
    this.addRuinCluster(-152, -118, { color: 0x6f755d, count: 6, rotation: 0.35 });
    this.addRuinCluster(148, -142, { color: 0x657a5a, count: 7, rotation: -0.4 });

    // 怪物营地：中阶混合敌人，远程、刺客、法师、岩石小怪都有。
    const enemySpots = [
      [-78, -75, 'archerBokoblin'], [-64, -62, 'blueBokoblin'], [-52, -82, 'blackBokoblin'],
      [-78, 72, 'archerBokoblin'], [-62, 62, 'moblin'], [-48, 78, 'stonePebblit'],
      [68, -72, 'redLizalfos'], [82, -54, 'fireWizzrobe'], [52, -86, 'stonePebblit'],
      [64, 62, 'yellowLizalfos'], [82, 48, 'shockWizzrobe'], [48, 78, 'archerBokoblin'],
      [-18, -28, 'yigaFootsoldier'], [18, -30, 'yigaFootsoldier'],
      [-18, 28, 'iceWizzrobe'], [18, 30, 'fireWizzrobe'],
      [0, 70, 'silverMoblin'], [0, -80, 'blackBokoblin'],
      [-92, 0, 'octorok'], [92, 0, 'octorok'], [-36, 4, 'chuchu'], [36, 10, 'chuchu'],
      [-126, 96, 'shockChuchu'], [42, 84, 'shockChuchu'],
      [-96, -42, 'stonePebblit'], [96, 42, 'stonePebblit'], [-96, 42, 'blueLizalfos'], [96, -42, 'redLizalfos'],
      [-118, 44, 'blueMoblin'], [118, -44, 'guardianStalker'], [112, 96, 'electricOctorok']
    ];
    for (const [x, z, type] of enemySpots) this.enemies.push(new Enemy(type, x, z));
    for (const e of this.enemies) this.scene.add(e.mesh);
    this.addFieldBoss('lynel', -128, 112, '费罗尼北岭莱尼尔');
    this.addFieldBoss('stoneTalus', 122, -118, '双河岩石巨像');
    this.addFieldBoss('frostTalus', 132, 124, '高地冰霜巨像');
    this.addFieldBoss('thunderGleeok', 148, -142, '费罗尼瀑布雷电三头龙');
    this.addFieldBoss('blackHinox', -152, -118, '海利亚湖畔黑色独眼巨人');
    this.addFieldBoss('guardianSkywatcher', 166, 132, '高原巡空守护者');

    // 商人、锅、补给。
    const pot = AssetFactory.createCookingPot();
    pot.position.set(-10, 0, -82);
    this.scene.add(pot);
    this.cookingPots = [pot];
    ShopSystem.spawnInWorld(this, 'highlandShop');
    if (typeof StorySystem !== 'undefined') {
      StorySystem.addMemoryMarker(this, 'brokenArmy', 0, 18, { color: 0x9fffb4 });
    }

    for (const [item, n, x, z] of [
      ['apple', 3, -6, -86], ['rawMeat', 2, 8, -84], ['arrow', 12, 16, -78],
      ['stamellaShroom', 2, -30, 36], ['heartyApple', 1, 34, 38],
      ['hyruleBass', 3, -46, 44], ['courserBeeHoney', 1, 58, 36],
      ['rawPrimeMeat', 1, 92, -34],
      ['amber', 1, -72, 12], ['rupee', 20, 72, -12]
    ]) {
      const d = new DropItem(item, n, x, z);
      this.drops.push(d);
      this.scene.add(d.mesh);
    }

    this.addShrines(['shrineHighlandRiver', 'shrineHighlandPeak', 'shrineHighlandRuins', 'shrineThunderPlateau', 'shrineFaronFalls', 'shrineLakeHylia']);

    this.addTower(0, 132, '费罗尼高地鸟望塔');
    this.addTower(-132, -18, '双河西岸鸟望塔');
    this.addTower(132, 28, '双河东岸鸟望塔');
    this.addTower(160, -150, '费罗尼瀑布鸟望塔');
    this.addTower(-164, -122, '海利亚湖畔鸟望塔');

    const gateBack = AssetFactory.createDungeonGate();
    gateBack.position.set(0, 0, -146);
    gateBack.userData.target = 'grassland';
    gateBack.userData.targetName = '起始台地';
    gateBack.userData.triggered = false;
    this.scene.add(gateBack);
    this.gates.push(gateBack);

    setTimeout(() => {
      if (window.game && window.game.currentWorld === this) {
        HUD.setQuest('探索费罗尼高地，解锁远古塔并穿越双河营地');
      }
    }, 800);
  }

  update(dt, game) {
    super.update(dt, game);
    if (this.rivers) {
      for (const river of this.rivers) {
        const water = river.userData.parts && river.userData.parts.water;
        if (water && water.material) {
          water.material.opacity = 0.62 + Math.sin(performance.now() * 0.0012 + river.position.x) * 0.1;
        }
      }
    }
    if (this.towers) {
      for (const t of this.towers) {
        if (t.userData.activated) continue;
        if (game.player.position.distanceTo(t.position) < 3) {
          t.userData.activated = true;
          t.children[1].material.color.setHex(0xffd54f);
          SaveSystem.unlockTower(t.userData.worldName);
          Dialogue.show(`◆ 解锁了 ${t.userData.towerName}！现在可传送至费罗尼高地`);
          Effects.portalEffect(t.position);
          QuestSystem.check();
        }
      }
    }
  }
}
