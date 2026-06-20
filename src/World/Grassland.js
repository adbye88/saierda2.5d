/* ========================================================
   Grassland.js — 起始台地·草原
   教学区：老爷爷 NPC，史莱姆/波克布林，几个宝箱，地牢入口
   ======================================================== */

class Grassland extends BaseScene {
  constructor() {
    super('grassland');
    this.bounds = { minX: -180, maxX: 180, minZ: -180, maxZ: 180 };
    this.spawnPoint = { x: 0, z: 20, a: 0 };
  }

  build() {
    this._setupGround(0x6a9a4a, 'grass');

    // 散布大量树木（大地图）
    this.scatter(() => AssetFactory.createTree(), 150);
    this.scatter(() => AssetFactory.createBigTree(), 58);
    this.scatter(() => AssetFactory.createPine(), 48);
    // 石头
    this.scatter(() => AssetFactory.createRock(0.6 + Math.random() * 0.8), 88);
    // 灌木
    this.scatter(() => AssetFactory.createBush(), 98);
    // 花朵
    this.scatter(() => AssetFactory.createFlower(), 52, 2);
    // 草丛
    this.scatter(() => AssetFactory.createGrassTuft(), 150, 2);

    // ★ 山体（地图边缘形成天然屏障）
    const mountainSpots = [
      [122, -90, 1.7], [-122, -90, 1.6], [122, 90, 1.5], [-122, 90, 1.7],
      [80, -128, 1.8], [-80, -128, 1.6], [80, 128, 1.5], [-80, 128, 1.7],
      [0, -134, 2.0], [132, 0, 1.6], [-132, 0, 1.6], [0, 134, 1.75]
      ,[166, -136, 1.7], [-166, 136, 1.7], [164, 148, 1.6], [-164, -146, 1.8]
    ];
    for (const [x, z, s] of mountainSpots) {
      const m = AssetFactory.createMountain(s);
      m.position.set(x, 0, z);
      this.addProp(m);
    }

    // ★ 悬崖
    this.scatter(() => AssetFactory.createCliff(0.8 + Math.random()*0.7), 14);

    // ★ 河流（横穿地图）
    const river = AssetFactory.createRiver(11, 340);
    river.position.set(-35, 0, 0);
    this.scene.add(river);
    this.river = river;  // 用于波纹动画
    this.addWaterZone(-35, 0, 11, 260);

    // ★ 桥（过河用）
    const bridge = AssetFactory.createBridge(10);
    bridge.position.set(-35, 0, 15);
    bridge.rotation.y = Math.PI / 2;
    this.scene.add(bridge);
    this.addBridgeZone(-35, 15, 4, 12, Math.PI / 2);
    const bridgeNorth = AssetFactory.createBridge(12);
    bridgeNorth.position.set(-35, 0, -72);
    bridgeNorth.rotation.y = Math.PI / 2;
    this.scene.add(bridgeNorth);
    this.addBridgeZone(-35, -72, 4, 14, Math.PI / 2);
    const bridgeField = AssetFactory.createBridge(14);
    bridgeField.position.set(-35, 0, 112);
    bridgeField.rotation.y = Math.PI / 2;
    this.scene.add(bridgeField);
    this.addBridgeZone(-35, 112, 4, 16, Math.PI / 2);

    // 可攀爬山坡
    for (const [x, z, r, h] of [[28, 28, 6, 1.6], [-62, 62, 7, 1.8], [62, -12, 5, 1.3], [108, 52, 8, 2.0], [-112, 94, 7, 2.1], [92, -98, 9, 2.4]]) {
      const slope = AssetFactory.createSlopeHill(r, h, 0x6f9650);
      slope.position.set(x, 0, z);
      this.scene.add(slope);
      this.addSlopeZone(x, z, r, h);
    }
    this.addRuinCluster(152, -132, { color: 0x8d897b, count: 7, rotation: 0.4 });
    this.addRuinCluster(-150, 142, { color: 0x6f6558, count: 8, rotation: -0.25 });

    // ★ 瀑布（河流上游）
    const waterfall = AssetFactory.createWaterfall(6);
    waterfall.position.set(-35, 0, -122);
    this.scene.add(waterfall);

    // 老爷爷的房子 + NPC
    const house = AssetFactory.createHouse();
    house.position.set(15, 0, -15);
    this.addProp(house);

    const oldMan = AssetFactory.createOldMan();
    oldMan.position.set(12, 0, -12);
    oldMan.userData.npc = true;
    oldMan.userData.name = '海拉鲁国王';
    oldMan.userData.onTalk = (game) => {
      const progress = QuestSystem.progress;
      const talked = progress.talkedOldMan || 0;
      const lines = [
        '【海拉鲁国王】林克啊…你终于醒了。百年前的灾厄还压在王城上空，先让石板重新连接这片土地。',
        '【海拉鲁国王】点亮远古塔后，地图会显示神庙与通路。四座神庙是离开台地前的证明。',
        '【海拉鲁国王】神庙会赐下克服之玉。完成4座试炼后，我会把滑翔伞交给你。',
        '【海拉鲁国王】离开台地后，去迷失森林寻找英帕。她会告诉你四神兽为何沉默。'
      ];
      const wasAwakening = (QuestSystem.getCurrentQuest() || {}).id === 'awakening';
      QuestSystem.set('talkedOldMan', talked + 1);
      if (typeof StorySystem !== 'undefined') StorySystem.markEvent('metKingSpirit');
      // 4神庙完成 → 给滑翔伞
      if (QuestSystem.progress.shrinesCleared >= 4 && !QuestSystem.progress.gotGlider) {
        QuestSystem.set('gotGlider', true);
        game.player.inventory.add('apple', 5);
        if (typeof StorySystem !== 'undefined') StorySystem.markEvent('receivedGlider');
        Dialogue.show('【海拉鲁国王】你通过了4座神庙。这把滑翔伞交给你，去更广阔的世界吧。记住：先找英帕，再面对四方神兽。');
        HUD.setQuest('获得滑翔伞！前往更广阔的海拉鲁');
      } else if (wasAwakening) {
        Dialogue.show(lines[0] + '<br><span style="color:#ffe16a">✓ 任务完成：在初始台地苏醒</span>', 3200);
        QuestSystem.refreshHint();
      } else {
        Dialogue.show(lines[talked % lines.length], 2600);
        QuestSystem.refreshHint();
      }
    };
    this.scene.add(oldMan);
    this.npcs.push({ mesh: oldMan });

    // ★ 女神像（海利亚祝福：用克服之玉兑换心/精力容器）
    const goddess = AssetFactory.createGoddessStatue();
    goddess.position.set(8, 0, 5);
    goddess.userData.npc = true;
    goddess.userData.name = '海利亚女神像';
    goddess.userData.onTalk = (game) => {
      const orbs = game.player.inventory.countOf('spiritOrb');
      if (orbs < StatueUI.COST) {
        Dialogue.show(`【海利亚女神像】勇者啊，通关神庙获得 ${StatueUI.COST} 个克服之玉后，再来接受祝福吧。`);
        return;
      }
      if (typeof StatueUI !== 'undefined' && !StatueUI.isOpen) {
        StatueUI.open(game);
      }
    };
    this.scene.add(goddess);
    this.npcs.push({ mesh: goddess });

    // 敌人（大地图更多怪物）
    const enemySpots = [
      [-15, -8, 'redBokoblin'], [-25, 5, 'redBokoblin'], [30, -25, 'blueBokoblin'],
      [-30, 20, 'octorok'], [35, 15, 'redBokoblin'], [-35, -20, 'blueBokoblin'],
      [40, -40, 'redBokoblin'], [-40, 40, 'chuchu'], [50, 30, 'blueBokoblin'],
      [-50, -30, 'chuchu'], [60, -50, 'octorok'], [-60, 50, 'redBokoblin'],
      [70, -20, 'blueBokoblin'], [-70, 20, 'stal'], [10, -60, 'chuchu'],
      [-10, 60, 'redBokoblin'], [20, 70, 'octorok'], [-20, -70, 'stal'],
      [45, 55, 'blueBokoblin'], [-45, -55, 'redBokoblin'],
      [-55, 10, 'archerBokoblin'], [58, 10, 'archerBokoblin'],
      [72, 62, 'archerBokoblin'], [-72, -62, 'archerBokoblin'],
      [25, -72, 'stonePebblit'], [-32, 72, 'stonePebblit'],
      [64, -72, 'stonePebblit'], [-68, 64, 'stonePebblit'],
      [5, -82, 'blackBokoblin'], [82, 5, 'blueBokoblin']
    ];
    for (const [x, z, type] of enemySpots) {
      this.enemies.push(new Enemy(type, x, z));
    }
    for (const e of this.enemies) this.scene.add(e.mesh);
    this.addFieldBoss('stoneTalus', 112, -108, '东部采石场岩石巨像');
    this.addFieldBoss('lynel', -116, 112, '北原莱尼尔');
    this.addFieldBoss('blackHinox', -158, 146, '竞技场外缘黑色独眼巨人');
    this.addFieldBoss('guardianStalker', 152, -132, '海拉鲁平原行走守护者');
    this.addFieldBoss('guardianSkywatcher', -150, -138, '平原巡空守护者');
    this.addFieldBoss('thunderGleeok', 0, 166, '海利亚大桥雷电三头龙');

    // 几个宝箱（可破坏后开宝）
    const openLid = (chest) => {
      const lid = chest.getObjectByName('lid');
      if (lid) {
        lid.position.y += 0.05;
        lid.rotation.x = -1.1;
      }
    };
    const chest1 = AssetFactory.createChest();
    chest1.position.set(8, 0, -8);
    chest1.userData.breakable = true;
    this.scene.add(chest1);
    this.breakables.push({
      mesh: chest1, broken: false,
      break_open: (game) => {
        if (this.breakables.find(b => b.mesh === chest1).broken) return;
        this.breakables.find(b => b.mesh === chest1).broken = true;
        openLid(chest1);
        const drop = new DropItem('soldierSword', 1, chest1.position.x, chest1.position.z);
        this.drops.push(drop); this.scene.add(drop.mesh);
        Dialogue.show('宝箱：获得了 ⚔️ 士兵之剑！');
      }
    });

    const chest2 = AssetFactory.createChest();
    chest2.position.set(-8, 0, 25);
    this.scene.add(chest2);
    this.breakables.push({
      mesh: chest2, broken: false,
      break_open: (game) => {
        const b = this.breakables.find(x => x.mesh === chest2);
        if (b.broken) return; b.broken = true;
        openLid(chest2);
        const drop = new DropItem('travelerBow', 1, chest2.position.x, chest2.position.z);
        this.drops.push(drop); this.scene.add(drop.mesh);
        game.player.inventory.add('arrow', 20);
        Dialogue.show('宝箱：获得了 🏹 旅人之弓 + 箭矢×20！');
      }
    });

    // 散落拾取物
    const drops = [
      ['apple', 1, 5, 8],
      ['apple', 1, -3, -10],
      ['rupee', 5, 12, 5],
      ['rupee', 3, -12, -15],
      ['mushroom', 1, 18, -8]
    ];
    for (const [item, n, x, z] of drops) {
      const d = new DropItem(item, n, x, z);
      this.drops.push(d); this.scene.add(d.mesh);
    }

    // 通往森林的传送门（北方深处）
    const gate = AssetFactory.createDungeonGate();
    gate.position.set(0, 0, -90);
    gate.userData.target = 'forest';
    gate.userData.targetName = '迷失森林';
    gate.userData.triggered = false;
    this.scene.add(gate);
    this.gates.push(gate);

    // 通往雪山（西北）
    const gateSnow = AssetFactory.createDungeonGate();
    gateSnow.position.set(-90, 0, -30);
    gateSnow.userData.target = 'snowland';
    gateSnow.userData.targetName = '赫布拉雪山';
    gateSnow.userData.triggered = false;
    this.scene.add(gateSnow);
    this.gates.push(gateSnow);

    // 通往火山（东北）
    const gateVolcano = AssetFactory.createDungeonGate();
    gateVolcano.position.set(90, 0, -30);
    gateVolcano.userData.target = 'volcano';
    gateVolcano.userData.targetName = '死亡之山';
    gateVolcano.userData.triggered = false;
    this.scene.add(gateVolcano);
    this.gates.push(gateVolcano);

    // 通往沙漠（西南）
    const gateDesert = AssetFactory.createDungeonGate();
    gateDesert.position.set(-90, 0, 40);
    gateDesert.userData.target = 'desert';
    gateDesert.userData.targetName = '格鲁德沙漠';
    gateDesert.userData.triggered = false;
    this.scene.add(gateDesert);
    this.gates.push(gateDesert);

    // 通往费罗尼高地（南方）
    const gateHighland = AssetFactory.createDungeonGate();
    gateHighland.position.set(0, 0, 92);
    gateHighland.userData.target = 'highland';
    gateHighland.userData.targetName = '费罗尼高地';
    gateHighland.userData.triggered = false;
    this.scene.add(gateHighland);
    this.gates.push(gateHighland);

    // 通往海拉鲁城堡（东南）
    const gateCastle = AssetFactory.createDungeonGate();
    gateCastle.position.set(90, 0, 40);
    gateCastle.userData.target = 'castle';
    gateCastle.userData.targetName = '海拉鲁城堡';
    gateCastle.userData.triggered = false;
    this.scene.add(gateCastle);
    this.gates.push(gateCastle);

    // 烹饪锅
    const pot = AssetFactory.createCookingPot();
    pot.position.set(5, 0, 10);
    this.scene.add(pot);
    this.cookingPots = [pot];

    // 神庙（初始台地试炼 + 扩展探索神庙）
    this.addShrines(['shrineJaBaij','shrineOwaDaim','shrineKehNamut','shrineOmanAu','shrineRotaOoh','shrineDahKasoPlateau','shrineRiverBend','shrineNorthRidge','shrineColiseumEdge','shrineHyruleField']);

    // 商人 NPC
    ShopSystem.spawnInWorld(this, 'grasslandShop');

    // 起始台地的远古塔
    this.addTower(75, 75, '起始台地鸟望塔');
    this.addTower(-118, 116, '北原鸟望塔');
    this.addTower(118, -116, '东部采石场鸟望塔');
    this.addTower(160, -150, '海拉鲁平原鸟望塔');
    this.addTower(-160, 150, '竞技场遗迹鸟望塔');

    if (typeof StorySystem !== 'undefined') {
      StorySystem.addMemoryMarker(this, 'plateauAwakening', -22, 18, { color: 0x66ddcc });
      StorySystem.addMemoryMarker(this, 'towerVow', 70, 68, { color: 0xffd56a });
    }

    // 篝火（出生点附近，用于氛围）
    const fire = AssetFactory.createCampfire();
    fire.position.set(3, 0, 10);
    this.scene.add(fire);

    // 任务提示
    setTimeout(() => {
      if (window.game && window.game.currentWorld === this) {
        HUD.setQuest('与老爷爷对话，获取你的武器');
      }
    }, 800);

    // 落叶粒子系统（飘浮的叶子）
    this._setupLeaves();
    // 篝火火焰动画引用
    this.fire = fire;
  }

  // 落叶粒子
  _setupLeaves() {
    const leafGeo = new THREE.PlaneGeometry(0.15, 0.15);
    const leafColors = [0x8aaa4a, 0xaaaa3a, 0xc89030];
    this.leaves = [];
    for (let i = 0; i < 25; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: leafColors[i % 3], transparent: true, opacity: 0.7, side: THREE.DoubleSide
      });
      const leaf = new THREE.Mesh(leafGeo, mat);
      leaf.position.set(
        (Math.random() - 0.5) * 80,
        8 + Math.random() * 10,
        (Math.random() - 0.5) * 80
      );
      leaf.userData = {
        vy: -0.5 - Math.random() * 0.5,
        vx: (Math.random() - 0.5) * 0.5,
        vz: (Math.random() - 0.5) * 0.5,
        rot: Math.random() * Math.PI,
        rotSpd: (Math.random() - 0.5) * 2,
        sway: Math.random() * Math.PI * 2
      };
      this.scene.add(leaf);
      this.leaves.push(leaf);
    }
  }

  update(dt, game) {
    super.update(dt, game);
    // 水面波纹（材质流动感）
    // ★ river 是 Group（createRiver 返回），真正的水面材质在其子物体 water 上
    if (this.river) {
      const water = this.river.userData.parts && this.river.userData.parts.water;
      if (water && water.material) {
        water.material.opacity = 0.65 + Math.sin(performance.now() * 0.001) * 0.1;
      }
    }
    // 篝火跳动
    if (this.fire && this.fire.userData.parts) {
      const p = this.fire.userData.parts;
      if (p.fire) {
        p.fire.scale.y = 1 + Math.sin(performance.now() * 0.012) * 0.15;
        p.fire.scale.x = 1 + Math.cos(performance.now() * 0.015) * 0.1;
      }
      if (p.fireLight) p.fireLight.intensity = 1.3 + Math.sin(performance.now() * 0.02) * 0.4;
    }
    // 落叶飘动
    if (this.leaves) {
      for (const leaf of this.leaves) {
        const u = leaf.userData;
        u.sway += dt * 2;
        leaf.position.x += (u.vx + Math.sin(u.sway) * 0.3) * dt;
        leaf.position.z += (u.vz + Math.cos(u.sway * 0.7) * 0.3) * dt;
        leaf.position.y += u.vy * dt;
        leaf.rotation.z += u.rotSpd * dt;
        leaf.rotation.x = Math.sin(u.sway) * 0.5;
        if (leaf.position.y < 0.2) {
          leaf.position.set(
            (Math.random() - 0.5) * 80,
            15 + Math.random() * 5,
            (Math.random() - 0.5) * 80
          );
        }
      }
    }
    // 远古塔激活
    if (this.towers) {
      for (const t of this.towers) {
        if (t.userData.activated) continue;
        if (game.player.position.distanceTo(t.position) < 3) {
          t.userData.activated = true;
          t.children[1].material.color.setHex(0xffd54f);
          SaveSystem.unlockTower(t.userData.worldName);
          Dialogue.show(`◆ 解锁了 ${t.userData.towerName}！现在可随时传送至此`);
          Effects.portalEffect(t.position);
          QuestSystem.check();
        }
      }
    }
  }
}
