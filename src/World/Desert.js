/* ========================================================
   Desert.js — 格鲁德沙漠
   地形：金黄色沙丘、仙人掌、沙暴，白天酷热（需防热装备）
   怪物：黄色蜥蜴战士、章鱼怪、莫力布林
   神兽 Boss：雷咒盖侬（解放瓦·娜波力斯，获得乌尔波扎之怒）
   ======================================================== */

class Desert extends BaseScene {
  constructor() {
    super('desert');
    this.bounds = { minX: -190, maxX: 190, minZ: -190, maxZ: 190 };
    this.spawnPoint = { x: 0, z: 126, a: Math.PI };
  }

  build() {
    this._setupGround(0xe8c878, 'sand');

    // 沙暴雾
    this.scene.fog = new THREE.Fog(0xddc088, 35, 110);

    // 仙人掌（大量）
    this.scatter(() => AssetFactory.createCactus(), 170);
    // 沙岩（可避难）
    this.scatter(() => AssetFactory.createRock(0.9), 88);
    // 沙丘（视觉起伏）
    for (let i = 0; i < 56; i++) {
      const dune = new THREE.Mesh(
        new THREE.SphereGeometry(3 + Math.random()*2, 6, 4),
        new THREE.MeshStandardMaterial({ color: 0xddb868, flatShading: true })
      );
      dune.scale.y = 0.3;
      dune.position.set((Math.random()-0.5)*360, 0, (Math.random()-0.5)*360);
      this.scene.add(dune);
    }
    for (const [x, z, r, h] of [[-34, 52, 7, 1.6], [48, 22, 6, 1.4], [-52, -38, 8, 1.8], [-122, 72, 9, 2.0], [118, -104, 10, 2.2], [104, 112, 8, 1.9]]) {
      const slope = AssetFactory.createSlopeHill(r, h, 0xd5b15f);
      slope.position.set(x, 0, z);
      this.scene.add(slope);
      this.addSlopeZone(x, z, r, h);
    }

    // ★ 沙岩峭壁屏障（地图边缘）
    const cliffs = [
      [128,-112,1.7],[-128,-112,1.6],[128,112,1.7],[-128,112,1.6],
      [86,-138,1.8],[-86,-138,1.7],[86,138,1.7],[-86,138,1.8],
      [0,-142,1.9],[140,0,1.6],[-140,0,1.6],[0,142,1.7]
      ,[166,-154,1.9],[-166,150,1.8],[170,136,1.8],[-170,-118,1.8]
    ];
    for (const [x,z,s] of cliffs) {
      const m = AssetFactory.createCliff(s);
      m.position.set(x,0,z);
      this.addProp(m);
    }

    // 烹饪锅（绿洲，扩大）
    const oasis = new THREE.Group();
    const oasisWater = new THREE.Mesh(
      new THREE.CircleGeometry(5, 20),
      new THREE.MeshStandardMaterial({ color: 0x44aacc, transparent: true, opacity: 0.7 })
    );
    oasisWater.rotation.x = -Math.PI/2; oasisWater.position.y = 0.05;
    oasis.add(oasisWater);
    oasis.position.set(5, 0, 70);
    this.scene.add(oasis);
    const pot = AssetFactory.createCookingPot();
    pot.position.set(8, 0, 70);
    this.scene.add(pot);
    this.cookingPots = [pot];
    ShopSystem.spawnInWorld(this, 'gerudoShop');

    // 区域神庙
    this.addRuinCluster(148, 132, { color: 0xc99d52, count: 8, rotation: 0.4 });
    this.addRuinCluster(28, -154, { color: 0xb78c4d, count: 7, rotation: -0.25 });
    this.addShrines(['shrineDesert', 'shrineDesertOasis', 'shrineDesertStorm', 'shrineSunkenDunes', 'shrineGerudoMaze', 'shrineSouthOasis', 'shrineDragonExile']);

    // 怪物（大幅增加）
    const enemySpots = [
      [-15, 60, 'yellowLizalfos'], [15, 55, 'yellowLizalfos'], [-30, 40, 'yellowLizalfos'],
      [30, 35, 'yellowLizalfos'], [45, 50, 'yellowLizalfos'], [-45, 45, 'yellowLizalfos'],
      [-25, -5, 'octorok'], [25, -10, 'octorok'], [-50, 20, 'octorok'],
      [50, 15, 'octorok'], [-60, -10, 'octorok'], [60, -20, 'octorok'],
      [0, 20, 'moblin'], [-15, -30, 'moblin'], [15, -45, 'moblin'],
      [-40, -40, 'moblin'], [40, -55, 'moblin'],
      [-10, -60, 'yellowLizalfos'], [10, -70, 'yellowLizalfos'],
      [-70, 50, 'moblin'], [70, -60, 'yellowLizalfos'], [-55, -65, 'octorok'],
      [-72, 20, 'shockWizzrobe'], [72, 8, 'shockWizzrobe'],
      [-48, -72, 'yigaFootsoldier'], [48, -76, 'yigaFootsoldier'],
      [-78, -38, 'stonePebblit'], [78, -36, 'stonePebblit'],
      [-5, -25, 'archerBokoblin'], [5, -35, 'archerBokoblin'],
      [-64, 70, 'silverMoblin'], [64, 52, 'yellowLizalfos']
      ,[-102, 28, 'electricOctorok'], [102, -34, 'electricOctorok'],
      [-96, -92, 'goldBokoblin'], [94, 96, 'silverLynel']
    ];
    for (const [x, z, type] of enemySpots) {
      this.enemies.push(new Enemy(type, x, z));
    }
    for (const e of this.enemies) this.scene.add(e.mesh);
    this.addFieldBoss('molduga', 112, -118, '沙暴魔吉拉德');
    this.addFieldBoss('lynel', -124, 112, '沙海莱尼尔');
    this.addFieldBoss('thunderGleeok', 148, 132, '格鲁德迷宫雷电三头龙');
    this.addFieldBoss('molduga', -152, 106, '南绿洲魔吉拉德');
    this.addFieldBoss('blackHinox', 28, -154, '龙骨流放地黑色独眼巨人');
    this.addFieldBoss('guardianSkywatcher', 158, -126, '沙暴巡空守护者');

    // 神兽 Boss：雷咒盖侬
    const boss = new Enemy('thunderblightGanon', 0, -75);
    boss.boss = true; boss._bossActive = false;
    boss.mesh.visible = false;
    this.boss = boss;
    if (!ChampionSystem.isLiberated('thunder')) {
      this.scene.add(boss.mesh);
      this.enemies.push(boss);
    } else {
      this.bossDefeated = true;
      boss.dead = true;
    }
    this.divineBeast = ChampionSystem.addDivineBeast(this, 'thunder', -62, -62, 0xffee44);
    if (typeof DivineBeastChallengeSystem !== 'undefined') {
      DivineBeastChallengeSystem.attachTerminal(this, 'thunder', -52, -52);
    }
    if (typeof StorySystem !== 'undefined') {
      StorySystem.addMemoryMarker(this, 'thunderChampion', -52, -54, { color: 0xffee44 });
    }

    // 散落补给
    const pickups = [
      ['voltfruit', 3, -15, 25],
      ['voltfruit', 2, 15, 25],
      ['rawPrimeMeat', 2, -25, 0],
      ['rupee', 25, 30, -30],
      ['arrow', 15, 0, 40],
      ['topaz', 1, -35, -35]
    ];
    for (const [item, n, x, z] of pickups) {
      const d = new DropItem(item, n, x, z);
      this.drops.push(d); this.scene.add(d.mesh);
    }

    // 远古塔
    this.addTower(-122, 122, '格鲁德沙漠鸟望塔');
    this.addTower(122, -122, '沙暴前线鸟望塔');
    this.addTower(158, 138, '格鲁德迷宫鸟望塔');
    this.addTower(-162, 108, '南绿洲鸟望塔');
    this.addTower(34, -162, '龙骨流放地鸟望塔');

    // 传送门（回草原）
    const gate = AssetFactory.createDungeonGate();
    gate.position.set(0, 0, 140);
    gate.userData.target = 'grassland';
    gate.userData.targetName = '起始台地';
    gate.userData.triggered = false;
    this.scene.add(gate);
    this.gates.push(gate);

    setTimeout(() => {
      if (window.game && window.game.currentWorld === this) {
        HUD.setQuest('⚠️ 沙漠酷热！装备防热衣或吃防热料理');
      }
    }, 800);
  }

  update(dt, game) {
    super.update(dt, game);
    // 酷热伤害（只在当前世界生效）
    if (!game.currentWorld || game.currentWorld.name !== 'desert') return;
    if (this._heatTimer === undefined) this._heatTimer = 0;
    this._heatTimer += dt;
    if (this._heatTimer > 6) {
      this._heatTimer = 0;
      const resist = game.player.inventory.getResist();
      const hasBuff = game.player.inventory.hasBuff('heatRes');
      if (resist.heat === 0 && !hasBuff) {
        game.player.hp = Math.max(1, game.player.hp - 1);
        Dialogue.showFloat('-1', game.player.mesh.position, '#ffaa44');
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
    if (this.boss && !this.boss._bossActive) {
      const d = game.player.position.distanceTo(this.boss.mesh.position);
      if (d < 16) {
        if (typeof DivineBeastChallengeSystem !== 'undefined' && !DivineBeastChallengeSystem.canFight('thunder')) return;
        this.boss._bossActive = true;
        this.boss.mesh.visible = true;
        Dialogue.show('【雷咒盖侬】瓦·娜波力斯的雷影高速逼近！');
        HUD.setQuest('击败雷咒盖侬，解放神兽瓦·娜波力斯！', 0xddaa44);
      }
    }
    if (this.boss && this.boss.dead && !this.bossDefeated) {
      this.bossDefeated = true;
      ChampionSystem.unlock('thunder');
      Dialogue.show('【胜利】雷咒盖侬被击败！乌尔波扎之怒会在近战命中时爆发。');
    }
  }
}
