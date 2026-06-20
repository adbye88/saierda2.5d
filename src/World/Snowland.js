/* ========================================================
   Snowland.js — 赫布拉雪山
   地形：白色雪地、雪松、冰水晶，寒气逼人（需防寒装备）
   怪物：冰丘丘、蓝色蜥蜴战士、骷髅
   神兽 Boss：水咒盖侬（解放瓦·鲁塔，获得米法之赐）
   ======================================================== */

class Snowland extends BaseScene {
  constructor() {
    super('snowland');
    this.bounds = { minX: -180, maxX: 180, minZ: -180, maxZ: 180 };
    this.spawnPoint = { x: 0, z: 124, a: Math.PI };
  }

  build() {
    this._setupGround(0xeaeaf5, 'snow');

    // 寒气雾
    this.scene.fog = new THREE.Fog(0xc8d8e8, 30, 95);

    // 雪松（大量）
    this.scatter(() => AssetFactory.createSnowTree(), 175);
    // 石头（覆雪）
    this.scatter(() => AssetFactory.createRock(0.8), 92);
    // 冰柱（可破坏，掉落材料）
    this.scatter(() => this._createIceCrystal(), 58);

    // ★ 雪山山体屏障（地图边缘）
    const peaks = [
      [124,-108,1.8],[-124,-108,1.7],[124,108,1.6],[-124,108,1.8],
      [80,-134,1.9],[-80,-134,1.7],[80,134,1.6],[-80,134,1.9],
      [0,-138,2.1],[136,0,1.7],[-136,0,1.7],[0,138,1.8]
      ,[164,-148,2.1],[-164,148,2.1],[166,38,1.8],[-168,-36,1.8]
    ];
    for (const [x,z,s] of peaks) {
      const m = AssetFactory.createMountain(s);
      m.position.set(x,0,z);
      this.addProp(m);
    }
    // ★ 冰河（横穿地图，蓝白色）
    const iceRiver = AssetFactory.createRiver(10, 260);
    iceRiver.material = new THREE.MeshStandardMaterial({
      color: 0x88ccee, transparent: true, opacity: 0.7, roughness: 0.1, metalness: 0.3
    });
    iceRiver.position.set(30, 0.05, 0);
    this.scene.add(iceRiver);
    this.iceRiver = iceRiver;
    this.addWaterZone(30, 0, 10, 180);
    const iceBridge = AssetFactory.createBridge(12);
    iceBridge.position.set(30, 0, 35);
    iceBridge.rotation.y = Math.PI / 2;
    this.scene.add(iceBridge);
    this.addBridgeZone(30, 35, 4, 14, Math.PI / 2);

    for (const [x, z, r, h] of [[-30, 58, 7, 2.0], [48, -42, 6, 1.7], [-62, -28, 5, 1.5], [-112, -96, 9, 2.7], [96, 96, 8, 2.2], [118, -72, 7, 2.0]]) {
      const slope = AssetFactory.createSlopeHill(r, h, 0xd8e8ee);
      slope.position.set(x, 0, z);
      this.scene.add(slope);
      this.addSlopeZone(x, z, r, h);
    }

    // 环境元素：持续飘雪
    this._setupSnowfall();

    // 烹饪锅
    const pot = AssetFactory.createCookingPot();
    pot.position.set(2, 0, 75);
    this.scene.add(pot);
    this.cookingPots = [pot];
    ShopSystem.spawnInWorld(this, 'ritoShop');

    // 区域神庙
    this.addRuinCluster(-148, 142, { color: 0xd4dde0, count: 7, rotation: 0.5 });
    this.addRuinCluster(150, -30, { color: 0xc7d6da, count: 6, rotation: -0.35 });
    this.addShrines(['shrineSnow', 'shrineSnowPeak', 'shrineSnowCave', 'shrineFrozenLake', 'shrineHebraLabyrinth', 'shrineTabanthaCliff']);

    // 怪物（大幅增加）
    const enemySpots = [
      [-10, 60, 'iceChuchu'], [12, 55, 'iceChuchu'], [-25, 40, 'iceChuchu'],
      [25, 35, 'iceChuchu'], [40, 50, 'iceChuchu'], [-40, 45, 'iceChuchu'],
      [-20, 20, 'blueLizalfos'], [20, 15, 'blueLizalfos'], [-50, 10, 'blueLizalfos'],
      [50, -5, 'blueLizalfos'], [-35, -15, 'blueLizalfos'], [35, -25, 'blueLizalfos'],
      [0, 30, 'stal'], [-15, 5, 'stal'], [15, -10, 'stal'],
      [-30, -40, 'stal'], [30, -45, 'stal'], [-55, -30, 'stal'],
      [55, -50, 'stal'], [0, -60, 'stal'], [-60, 60, 'iceChuchu'],
      [60, 65, 'blueLizalfos'], [-70, -20, 'stal'], [70, 30, 'iceChuchu'],
      [-72, 42, 'iceWizzrobe'], [72, 18, 'iceWizzrobe'],
      [-48, -68, 'iceWizzrobe'], [48, -66, 'blueLizalfos'],
      [-75, -55, 'stonePebblit'], [76, -35, 'stonePebblit'],
      [-5, -35, 'archerBokoblin'], [5, -50, 'archerBokoblin'],
      [-62, 4, 'yigaFootsoldier'], [62, 6, 'yigaFootsoldier']
      ,[-104, 28, 'frostPebblit'], [104, -28, 'frostPebblit'],
      [-96, -84, 'guardianStalker'], [92, 82, 'silverLynel']
    ];
    for (const [x, z, type] of enemySpots) {
      this.enemies.push(new Enemy(type, x, z));
    }
    for (const e of this.enemies) this.scene.add(e.mesh);
    this.addFieldBoss('frostTalus', -118, -112, '赫布拉冰霜巨像');
    this.addFieldBoss('lynel', 112, 106, '雪原莱尼尔');
    this.addFieldBoss('frostGleeok', -148, 142, '赫布拉迷宫冰雪三头龙');
    this.addFieldBoss('silverLynel', 150, -30, '塔邦挞断崖白银莱尼尔');
    this.addFieldBoss('guardianSkywatcher', 154, 136, '雪原巡空守护者');

    // 神兽 Boss：水咒盖侬（北方深处）
    const boss = new Enemy('waterblightGanon', 0, -75);
    boss.boss = true; boss._bossActive = false;
    boss.mesh.visible = false;
    this.boss = boss;
    if (!ChampionSystem.isLiberated('water')) {
      this.scene.add(boss.mesh);
      this.enemies.push(boss);
    } else {
      this.bossDefeated = true;
      boss.dead = true;
    }
    this.divineBeast = ChampionSystem.addDivineBeast(this, 'water', -62, -62, 0x66ddff);
    if (typeof DivineBeastChallengeSystem !== 'undefined') {
      DivineBeastChallengeSystem.attachTerminal(this, 'water', -52, -52);
    }
    if (typeof StorySystem !== 'undefined') {
      StorySystem.addMemoryMarker(this, 'waterChampion', -52, -54, { color: 0x66ddff });
    }

    // 散落补给（含防寒食材暖暖草果）
    const pickups = [
      ['spicyPepper', 3, -15, 20],
      ['spicyPepper', 2, 15, 20],
      ['sunshroom', 2, -20, 0],
      ['apple', 2, 10, -10],
      ['rupee', 15, -25, -25],
      ['arrow', 10, 0, 25]
    ];
    for (const [item, n, x, z] of pickups) {
      const d = new DropItem(item, n, x, z);
      this.drops.push(d); this.scene.add(d.mesh);
    }

    // 远古塔（解锁后可传送）
    this.addTower(-118, 118, '赫布拉雪原鸟望塔');
    this.addTower(118, -118, '冰封山口鸟望塔');
    this.addTower(-158, 150, '赫布拉迷宫鸟望塔');
    this.addTower(158, -34, '塔邦挞断崖鸟望塔');

    // 传送门（回草原）
    const gate = AssetFactory.createDungeonGate();
    gate.position.set(0, 0, 136);
    gate.userData.target = 'grassland';
    gate.userData.targetName = '起始台地';
    gate.userData.triggered = false;
    this.scene.add(gate);
    this.gates.push(gate);

    setTimeout(() => {
      if (window.game && window.game.currentWorld === this) {
        const unlocked = SaveSystem.isTowerUnlocked('snowland');
        HUD.setQuest(unlocked ? '前往北方深处击败水咒盖侬' : '⚠️ 雪山严寒！装备防寒衣或吃防寒料理');
      }
    }, 800);
  }

  _createIceCrystal() {
    const g = new THREE.Group();
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.5, 0),
      new THREE.MeshStandardMaterial({ color: 0x88ddff, flatShading: true, transparent: true, opacity: 0.75, roughness: 0.1, metalness: 0.4, emissive: 0x4488aa, emissiveIntensity: 0.3 })
    );
    crystal.position.y = 0.6; crystal.scale.y = 1.5;
    g.add(crystal);
    g.userData.collisionRadius = 0.5;
    return g;
  }

  _setupSnowfall() {
    this.snowflakes = [];
    const geo = new THREE.PlaneGeometry(0.08, 0.08);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 80; i++) {
      const flake = new THREE.Mesh(geo, mat);
      flake.position.set(
        (Math.random() - 0.5) * 180, 5 + Math.random() * 20, (Math.random() - 0.5) * 180
      );
      flake.userData = { vy: -1 - Math.random(), sway: Math.random() * 6 };
      this.scene.add(flake);
      this.snowflakes.push(flake);
    }
  }

  update(dt, game) {
    super.update(dt, game);
    // 飘雪
    if (this.snowflakes) {
      for (const f of this.snowflakes) {
        f.userData.sway += dt * 2;
        f.position.x += Math.sin(f.userData.sway) * 0.3 * dt;
        f.position.y += f.userData.vy * dt;
        if (f.position.y < 0.1) {
          f.position.set((Math.random() - 0.5) * 180, 25, (Math.random() - 0.5) * 180);
        }
      }
    }
    // 寒气伤害判定（只在当前世界生效）
    if (!game.currentWorld || game.currentWorld.name !== 'snowland') return;
    if (this._coldDmgTimer === undefined) this._coldDmgTimer = 0;
    this._coldDmgTimer += dt;
    if (this._coldDmgTimer > 5) {
      this._coldDmgTimer = 0;
      const resist = game.player.inventory.getResist();
      const hasBuff = game.player.inventory.hasBuff('coldRes');
      if (resist.cold === 0 && !hasBuff) {
        game.player.hp = Math.max(1, game.player.hp - 1);
        Dialogue.showFloat('-1', game.player.mesh.position, '#66ddff');
      }
    }
    // 远古塔解锁
    if (this.towers) {
      for (const t of this.towers) {
        if (t.userData.activated) continue;
        const d = game.player.position.distanceTo(t.position);
        if (d < 3) {
          t.userData.activated = true;
          // 顶部蓝光变金
          t.children[1].material.color.setHex(0xffd54f);
          SaveSystem.unlockTower(t.userData.worldName);
          Dialogue.show(`◆ 解锁了 ${t.userData.towerName}！现在可随时传送至此`);
          Effects.portalEffect(t.position);
          QuestSystem.check();
        }
      }
    }
    // Boss 激活
    if (this.boss && !this.boss._bossActive) {
      const d = game.player.position.distanceTo(this.boss.mesh.position);
      if (d < 14) {
        if (typeof DivineBeastChallengeSystem !== 'undefined' && !DivineBeastChallengeSystem.canFight('water')) return;
        this.boss._bossActive = true;
        this.boss.mesh.visible = true;
        Dialogue.show('【水咒盖侬】瓦·鲁塔的水影从冰雾中现身！');
        HUD.setQuest('击败水咒盖侬，解放神兽瓦·鲁塔！', 0x66ddff);
      }
    }
    if (this.boss && this.boss.dead && !this.bossDefeated) {
      this.bossDefeated = true;
      ChampionSystem.unlock('water');
      Dialogue.show('【胜利】水咒盖侬被击败！米法之赐会在倒下时保护你。');
    }
  }
}
