/* ========================================================
   Volcano.js — 死亡之山·戈隆地带
   地形：暗红岩地、熔岩石、岩浆河（需耐火装备）
   怪物：火丘丘、红色蜥蜴战士、守护者
   神兽 Boss：火咒盖侬（解放瓦·鲁达尼亚，获得达尔克尔之护）
   ======================================================== */

class Volcano extends BaseScene {
  constructor() {
    super('volcano');
    this.bounds = { minX: -180, maxX: 180, minZ: -180, maxZ: 180 };
    this.spawnPoint = { x: 0, z: 124, a: Math.PI };
  }

  build() {
    this._setupGround(0x6a3a2a, 'lava');

    // 火山雾（橙红色）
    this.scene.fog = new THREE.Fog(0xaa5533, 30, 100);

    // 熔岩石（大量，已去 PointLight 不再卡）
    this.scatter(() => AssetFactory.createLavaRock(), 155);
    // 普通石头
    this.scatter(() => AssetFactory.createRock(0.7), 80);
    // 焦黑树
    this.scatter(() => this._createBurntTree(), 58);

    // ★ 火山岩山体屏障（深红色，更大更宏伟）
    const peaks = [
      [124,-108,2.0],[-124,-108,1.8],[124,108,1.7],[-124,108,2.0],
      [80,-134,2.1],[-80,-134,1.9],[80,134,1.7],[-80,134,2.0],
      [0,-138,2.2],[136,0,1.8],[-136,0,1.8],[0,138,1.9]
      ,[164,-146,2.2],[-164,142,2.0],[166,36,1.9],[-166,-40,1.9]
    ];
    for (const [x,z,s] of peaks) {
      const m = AssetFactory.createMountain(s);
      // 染成深红色
      m.traverse(c => { if (c.isMesh && c.material) c.material.color && c.material.color.setHex(0x6a3a2a); });
      m.position.set(x,0,z);
      this.addProp(m);
    }

    // 岩浆河（橙红发光，加宽加长）
    const lava = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 260),
      new THREE.MeshBasicMaterial({ color: 0xff4422, transparent: true, opacity: 0.85 })
    );
    lava.rotation.x = -Math.PI / 2;
    lava.position.set(-40, 0.05, 0);
    this.scene.add(lava);
    this.addWaterZone(-40, 0, 10, 180);
    const basaltBridge = AssetFactory.createBridge(12);
    basaltBridge.position.set(-40, 0, 30);
    basaltBridge.rotation.y = Math.PI / 2;
    basaltBridge.traverse(c => { if (c.isMesh && c.material && c.material.color) c.material.color.setHex(0x3a3028); });
    this.scene.add(basaltBridge);
    this.addBridgeZone(-40, 30, 4, 14, Math.PI / 2);
    const lavaLight = new THREE.PointLight(0xff4422, 2.0, 30);
    lavaLight.position.set(-40, 3, 0);
    this.scene.add(lavaLight);
    this.lava = lava;

    for (const [x, z, r, h] of [[32, 52, 7, 2.0], [-68, -38, 6, 1.8], [58, -20, 5, 1.5], [-112, -96, 9, 2.8], [112, 84, 8, 2.3], [94, -116, 7, 2.0]]) {
      const slope = AssetFactory.createSlopeHill(r, h, 0x7a4a35);
      slope.position.set(x, 0, z);
      this.scene.add(slope);
      this.addSlopeZone(x, z, r, h);
    }

    // 烹饪锅
    const pot = AssetFactory.createCookingPot();
    pot.position.set(2, 0, 75);
    this.scene.add(pot);
    this.cookingPots = [pot];
    ShopSystem.spawnInWorld(this, 'goronShop');

    // 区域神庙
    this.addRuinCluster(-148, 128, { color: 0x5a3a2e, count: 7, rotation: 0.35 });
    this.addRuinCluster(150, -34, { color: 0x6a4432, count: 6, rotation: -0.3 });
    this.addShrines(['shrineVolcano', 'shrineVolcanoCrater', 'shrineVolcanoMine', 'shrineMagmaVault', 'shrineEldinBridge', 'shrineGoronCliff']);

    // 怪物（大幅增加）
    const enemySpots = [
      [-10, 60, 'fireChuchu'], [12, 55, 'fireChuchu'], [-25, 40, 'fireChuchu'],
      [25, 35, 'fireChuchu'], [40, 50, 'fireChuchu'], [-40, 45, 'fireChuchu'],
      [55, 40, 'fireChuchu'], [-55, 35, 'fireChuchu'],
      [-20, 20, 'redLizalfos'], [20, 15, 'redLizalfos'], [-50, 10, 'redLizalfos'],
      [50, -5, 'redLizalfos'], [-35, -15, 'redLizalfos'], [35, -25, 'redLizalfos'],
      [60, -20, 'redLizalfos'], [-60, -30, 'redLizalfos'],
      [0, 30, 'guardian'], [-15, -50, 'guardian'], [15, -65, 'guardian'],
      [-45, -60, 'fireChuchu'], [45, 60, 'redLizalfos'],
      [-70, 50, 'fireChuchu'], [70, -50, 'redLizalfos'],
      [-72, 18, 'fireWizzrobe'], [72, 12, 'fireWizzrobe'],
      [-55, -72, 'fireWizzrobe'], [55, -78, 'redLizalfos'],
      [-78, -8, 'stonePebblit'], [78, -12, 'stonePebblit'],
      [-5, -34, 'stonePebblit'], [5, -44, 'stonePebblit'],
      [-64, 64, 'silverMoblin'], [64, 64, 'guardian']
      ,[-104, 22, 'firePebblit'], [104, -26, 'firePebblit'],
      [-92, -86, 'guardianStalker'], [96, 84, 'goldBokoblin']
    ];
    for (const [x, z, type] of enemySpots) {
      this.enemies.push(new Enemy(type, x, z));
    }
    for (const e of this.enemies) this.scene.add(e.mesh);
    this.addFieldBoss('ignoTalus', -116, -108, '火山口熔岩巨像');
    this.addFieldBoss('lynel', 112, 104, '死亡之山莱尼尔');
    this.addFieldBoss('flameGleeok', -148, 128, '奥尔汀桥火焰三头龙');
    this.addFieldBoss('blackHinox', 150, -34, '鼓隆峭壁黑色独眼巨人');
    this.addFieldBoss('guardianStalker', 158, 138, '死亡之山古代守护者');

    // 神兽 Boss：火咒盖侬
    const boss = new Enemy('fireblightGanon', 0, -75);
    boss.boss = true; boss._bossActive = false;
    boss.mesh.visible = false;
    this.boss = boss;
    if (!ChampionSystem.isLiberated('fire')) {
      this.scene.add(boss.mesh);
      this.enemies.push(boss);
    } else {
      this.bossDefeated = true;
      boss.dead = true;
    }
    this.divineBeast = ChampionSystem.addDivineBeast(this, 'fire', 62, -62, 0xff6633);
    if (typeof DivineBeastChallengeSystem !== 'undefined') {
      DivineBeastChallengeSystem.attachTerminal(this, 'fire', 52, -52);
    }
    if (typeof StorySystem !== 'undefined') {
      StorySystem.addMemoryMarker(this, 'fireChampion', 52, -54, { color: 0xff8844 });
    }

    // 散落补给（含防火食材）
    const pickups = [
      ['sunshroom', 3, -15, 20],
      ['sunshroom', 2, 15, 20],
      ['rawPrimeMeat', 2, -20, 0],
      ['rupee', 20, 25, -25],
      ['arrow', 10, 0, 25],
      ['ruby', 1, -30, -30]
    ];
    for (const [item, n, x, z] of pickups) {
      const d = new DropItem(item, n, x, z);
      this.drops.push(d); this.scene.add(d.mesh);
    }

    // 远古塔
    this.addTower(-118, 118, '死亡之山鸟望塔');
    this.addTower(118, -118, '熔岩河谷鸟望塔');
    this.addTower(-158, 132, '奥尔汀桥鸟望塔');
    this.addTower(158, -42, '鼓隆峭壁鸟望塔');

    // 传送门
    const gate = AssetFactory.createDungeonGate();
    gate.position.set(0, 0, 136);
    gate.userData.target = 'grassland';
    gate.userData.targetName = '起始台地';
    gate.userData.triggered = false;
    this.scene.add(gate);
    this.gates.push(gate);

    setTimeout(() => {
      if (window.game && window.game.currentWorld === this) {
        HUD.setQuest('⚠️ 火山灼热！装备耐火上衣或吃防火料理');
      }
    }, 800);
  }

  _createBurntTree() {
    const g = new THREE.Group();
    // ★ 用 THREE.MeshStandardMaterial 而不是 this._mat（BaseScene 没有 _mat）
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 2, 5),
      new THREE.MeshStandardMaterial({ color: 0x2a1a0a, flatShading: true }));
    trunk.position.y = 1; g.add(trunk);
    if (Math.random() > 0.5) {
      const ember = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 4),
        new THREE.MeshBasicMaterial({ color: 0xff4422 }));
      ember.position.set((Math.random()-0.5)*0.3, 1.5, (Math.random()-0.5)*0.3);
      g.add(ember);
    }
    g.userData.collisionRadius = 0.4;
    return g;
  }

  update(dt, game) {
    super.update(dt, game);
    // 岩浆流光
    if (this.lava) {
      this.lava.material.opacity = 0.7 + Math.sin(performance.now() * 0.002) * 0.15;
    }
    // 灼烧伤害（只在当前世界生效）
    if (!game.currentWorld || game.currentWorld.name !== 'volcano') return;
    if (this._burnTimer === undefined) this._burnTimer = 0;
    this._burnTimer += dt;
    if (this._burnTimer > 4) {
      this._burnTimer = 0;
      const resist = game.player.inventory.getResist();
      const hasBuff = game.player.inventory.hasBuff('fireRes');
      if (resist.fire === 0 && !hasBuff) {
        game.player.hp = Math.max(1, game.player.hp - 2);
        Dialogue.showFloat('-2', game.player.mesh.position, '#ff4422');
      }
    }
    // 远古塔
    if (this.towers) {
      for (const t of this.towers) {
        if (t.userData.activated) continue;
        if (game.player.position.distanceTo(t.position) < 3) {
          t.userData.activated = true;
          t.children[1].material.color.setHex(0xffd54f);
          SaveSystem.unlockTower(t.userData.worldName);
          Dialogue.show(`◆ 解锁了 ${t.userData.towerName}！`);
          Effects.portalEffect(t.position);
          QuestSystem.check();
        }
      }
    }
    // Boss
    if (this.boss && !this.boss._bossActive) {
      const d = game.player.position.distanceTo(this.boss.mesh.position);
      if (d < 14) {
        if (typeof DivineBeastChallengeSystem !== 'undefined' && !DivineBeastChallengeSystem.canFight('fire')) return;
        this.boss._bossActive = true;
        this.boss.mesh.visible = true;
        Dialogue.show('【火咒盖侬】瓦·鲁达尼亚的火影举起巨斧！');
        HUD.setQuest('击败火咒盖侬，解放神兽瓦·鲁达尼亚！', 0xff4422);
      }
    }
    if (this.boss && this.boss.dead && !this.bossDefeated) {
      this.bossDefeated = true;
      ChampionSystem.unlock('fire');
      Dialogue.show('【胜利】火咒盖侬被击败！达尔克尔之护会替你挡下强击。');
    }
  }
}
