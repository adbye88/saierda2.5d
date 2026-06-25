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

    // 散布基础自然物；第五阶段后改为“少量随机底噪 + 路线节点簇状布置”，避免测试地图式平均撒点
    this.scatter(() => AssetFactory.createTree(), 84);
    this.scatter(() => AssetFactory.createBigTree(), 30);
    this.scatter(() => AssetFactory.createPine(), 28);
    // 石头
    this.scatter(() => AssetFactory.createRock(0.6 + Math.random() * 0.8), 46);
    // 灌木
    this.scatter(() => AssetFactory.createBush(), 48);
    // 花朵
    this.scatter(() => AssetFactory.createFlower(), 34, 2);
    // 草丛
    this.scatter(() => AssetFactory.createGrassTuft(), 92, 2);

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

    // ★ 第五阶段：明确出生点 → 小路 → 遭遇 → 河岸 → 营地/遗迹 → 远处目标的关卡动线
    this._setupLevelComposition();

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
      // 第一遭遇：出生点前方小路边
      [22, -24, 'redBokoblin'], [30, -30, 'chuchu'], [35, -18, 'archerBokoblin'],
      // 桥头遭遇：河岸掩体和踏步附近
      [-22, 16, 'redBokoblin'], [-50, 12, 'blueBokoblin'], [-55, 24, 'archerBokoblin'], [-36, 34, 'octorok'],
      // 营地遭遇：路线上第一个完整战斗场
      [-66, -38, 'redBokoblin'], [-73, -32, 'blueBokoblin'], [-58, -50, 'archerBokoblin'],
      // 北侧遗迹/传送目标前的精英守卫
      [-20, -74, 'stal'], [0, -82, 'blackBokoblin'], [24, -72, 'stonePebblit'],
      // 支线与远景威胁保留少量，不再平均撒满首屏
      [62, 30, 'blueBokoblin'], [-70, 58, 'redBokoblin'], [74, 70, 'archerBokoblin'],
      [92, 5, 'blueBokoblin'], [-82, -70, 'stonePebblit'],
      // 新增巡逻/伏击：围绕补给箱、河岸和老橡树形成更密的探索遭遇
      [-42, 96, 'archerBokoblin'], [-58, 100, 'redBokoblin'],
      [78, -12, 'chuchu'], [98, -2, 'redBokoblin'],
      [-108, 104, 'blueBokoblin'], [-124, 96, 'archerBokoblin'],
      [104, -88, 'stonePebblit'], [-104, -24, 'chuchu']
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
      ['mushroom', 1, 18, -8],
      ['birdEgg', 2, 23, -5],
      ['hyruleBass', 2, -39, 22],
      ['wood', 2, 15, -23]
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

    this._groundStructuresIntoScene();

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

  _setupLevelComposition() {
    this.routePaths = [
      {
        kind: 'main',
        width: 8.5,
        points: [
          { x: 0, z: 22 }, { x: 4, z: 9 }, { x: 12, z: -10 }, { x: 27, z: -26 },
          { x: 5, z: -18 }, { x: -18, z: -2 }, { x: -35, z: 15 },
          { x: -52, z: -4 }, { x: -68, z: -38 }, { x: -42, z: -66 }, { x: 0, z: -90 }
        ]
      },
      { kind: 'branch', width: 5.5, points: [{ x: 3, z: 9 }, { x: 8, z: 5 }, { x: 15, z: -15 }] },
      { kind: 'branch', width: 5.2, points: [{ x: -35, z: 15 }, { x: -45, z: 33 }, { x: -70, z: 58 }] }
    ];
    this.landmarkPoints = [
      { x: 27, z: -26, type: 'firstEncounter' },
      { x: -35, z: 15, type: 'bridgeNode' },
      { x: -68, z: -38, type: 'campNode' },
      { x: 0, z: -90, type: 'gateNode' }
    ];

    const roadMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uColor: { value: new THREE.Color(0x786448) },
        uDust: { value: new THREE.Color(0xa38d65) },
        uOpacity: { value: 0.36 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorld;
        void main() {
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorld = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: `
        uniform vec3 uColor;
        uniform vec3 uDust;
        uniform float uOpacity;
        varying vec2 vUv;
        varying vec3 vWorld;
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }
        void main() {
          float edge = abs(vUv.x - 0.5) * 2.0;
          float sideFade = 1.0 - smoothstep(0.58, 0.98, edge);
          float endFade = smoothstep(0.0, 0.14, vUv.y) * (1.0 - smoothstep(0.86, 1.0, vUv.y));
          float noise = hash(floor(vWorld.xz * 1.45));
          float broken = smoothstep(0.12, 0.74, noise + (1.0 - edge) * 0.22);
          vec3 color = mix(uColor, uDust, 0.18 + noise * 0.18);
          float alpha = uOpacity * sideFade * endFade * (0.45 + broken * 0.55);
          if (alpha < 0.025) discard;
          gl_FragColor = vec4(color, alpha);
        }`
    });
    for (const path of this.routePaths) {
      this._addRoadPolyline(path.points, path.width, roadMat);
    }
    this._addRouteDetailClusters();
    this._addRiverWetlands();
    this._addCampNode(-68, -38);
    this._addEncounterNode(27, -26);
    this._addGateApproach(0, -90);
  }

  _addRoadPolyline(points, width, mat) {
    const detail = this._sceneDetailFactor ? this._sceneDetailFactor() : 0.42;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i + 1];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const len = Math.hypot(dx, dz);
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(width, len + width * 0.35, 1, 1), mat);
      strip.rotation.x = -Math.PI / 2;
      strip.rotation.z = -Math.atan2(dx, dz);
      strip.position.set((a.x + b.x) / 2, 0.062, (a.z + b.z) / 2);
      strip.renderOrder = 1;
      this._markScenicDetail(strip);
      this.scene.add(strip);
      const steps = Math.max(2, Math.floor((len / 6) * Math.max(0.35, detail)));
      for (let j = 0; j <= steps; j++) {
        const t = j / steps;
        const x = a.x + dx * t;
        const z = a.z + dz * t;
        const side = ((i + j) % 4 < 2) ? 1 : -1;
        const nx = dz / Math.max(0.001, len) * side;
        const nz = -dx / Math.max(0.001, len) * side;
        if ((i + j) % 2 === 0) {
          this._addPathEdgeDetail(x + nx * (width * 0.56 + Math.random() * 1.4), z + nz * (width * 0.56 + Math.random() * 1.4), 0.7 + Math.random() * 0.5);
        }
        if ((i + j) % 3 === 0) {
          this._addRoadPebblePatch(x + (Math.random() - 0.5) * width * 0.42, z + (Math.random() - 0.5) * width * 0.42, 0.45 + Math.random() * 0.5);
        }
      }
    }
  }

  _addRoadPebblePatch(x, z, s = 1) {
    this._roadPebbleMat = this._roadPebbleMat || new THREE.MeshStandardMaterial({
      color: 0x8b7a5a,
      roughness: 1,
      transparent: true,
      opacity: 0.42,
      depthWrite: false
    });
    const patch = new THREE.Mesh(new THREE.CircleGeometry(0.35 * s, 9), this._roadPebbleMat);
    patch.rotation.x = -Math.PI / 2;
    patch.rotation.z = Math.random() * Math.PI;
    patch.scale.set(1.6 + Math.random() * 0.9, 0.55 + Math.random() * 0.35, 1);
    patch.position.set(x, 0.068, z);
    patch.renderOrder = 2;
    this._markScenicDetail(patch);
    this.scene.add(patch);
  }

  _markScenicDetail(obj) {
    if (!obj) return obj;
    obj.userData = obj.userData || {};
    obj.userData.perfCull = true;
    obj.userData.detailLayer = true;
    obj.userData.kind = obj.userData.kind || 'scenicDetail';
    obj.userData.streamBaseVisible = obj.visible !== false;
    return obj;
  }

  _addPathEdgeDetail(x, z, s = 1) {
    const pick = Math.random();
    const obj = pick < 0.34 ? AssetFactory.createGrassTuft()
      : pick < 0.62 ? AssetFactory.createBush()
      : pick < 0.82 ? AssetFactory.createFlower()
      : AssetFactory.createRock(0.22 + Math.random() * 0.25);
    obj.position.set(x, 0, z);
    obj.scale.setScalar(s * (0.65 + Math.random() * 0.35));
    obj.rotation.y = Math.random() * Math.PI * 2;
    this.addProp(obj, false);
  }

  _addRouteDetailClusters() {
    const detail = this._sceneDetailFactor ? this._sceneDetailFactor() : 0.42;
    const clusters = [
      { x: 2, z: 20, trees: 2, rocks: 3, grass: 16 },
      { x: 8, z: 2, trees: 1, rocks: 2, grass: 12 },
      { x: 17, z: -12, trees: 1, rocks: 3, grass: 14 },
      { x: 22, z: -24, trees: 2, rocks: 5, grass: 14 },
      { x: -35, z: 15, trees: 1, rocks: 7, grass: 16 },
      { x: -67, z: -38, trees: 3, rocks: 5, grass: 18 },
      { x: -4, z: -88, trees: 1, rocks: 8, grass: 12 },
      { x: -88, z: 82, trees: 4, rocks: 4, grass: 16 },
      { x: -118, z: 112, trees: 5, rocks: 3, grass: 18 },
      { x: 78, z: -8, trees: 2, rocks: 4, grass: 14 },
      { x: 96, z: 2, trees: 3, rocks: 3, grass: 13 },
      { x: -52, z: 104, trees: 2, rocks: 5, grass: 15 },
      { x: 42, z: 44, trees: 3, rocks: 4, grass: 14 }
    ];
    for (const c of clusters) {
      for (let i = 0; i < Math.max(0, Math.round(c.trees * detail)); i++) this._placeClusterProp(AssetFactory.createTree(), c, 7, true);
      for (let i = 0; i < Math.max(1, Math.round(c.rocks * detail)); i++) this._placeClusterProp(AssetFactory.createRock(0.25 + Math.random() * 0.5), c, 6, false);
      for (let i = 0; i < Math.max(2, Math.round(c.grass * detail)); i++) this._placeClusterProp(i % 5 === 0 ? AssetFactory.createFlower() : AssetFactory.createGrassTuft(), c, 8, false);
    }
  }

  _placeClusterProp(obj, c, r, collide) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.sqrt(Math.random()) * r;
    obj.position.set(c.x + Math.cos(a) * d, 0, c.z + Math.sin(a) * d);
    obj.rotation.y = Math.random() * Math.PI * 2;
    obj.scale.setScalar(0.75 + Math.random() * 0.55);
    this.addProp(obj, collide && !!obj.userData.collisionRadius);
  }

  _addRiverWetlands() {
    const mudMat = new THREE.MeshStandardMaterial({ color: 0x5f6245, roughness: 1, transparent: true, opacity: 0.46, depthWrite: false });
    for (const z of [-92, -72, -42, -12, 15, 45, 82, 112]) {
      const patch = new THREE.Mesh(new THREE.CircleGeometry(3.2 + Math.random() * 2.6, 18), mudMat);
      patch.rotation.x = -Math.PI / 2;
      patch.position.set(-35 + (Math.random() - 0.5) * 11, 0.064, z + (Math.random() - 0.5) * 5);
      patch.scale.set(1.9, 0.65, 1);
      patch.rotation.z = Math.random() * Math.PI;
      patch.renderOrder = 1;
      this._markScenicDetail(patch);
      this.scene.add(patch);
    }
    const detail = this._sceneDetailFactor ? this._sceneDetailFactor() : 0.42;
    const reedCount = Math.max(12, Math.round(72 * detail));
    for (let i = 0; i < reedCount; i++) {
      const side = i % 2 ? 1 : -1;
      const z = -112 + Math.random() * 244;
      const x = -35 + side * (6.1 + Math.random() * 2.8);
      const reed = this._createReeds();
      reed.position.set(x, 0.02, z);
      reed.rotation.y = Math.random() * Math.PI * 2;
      reed.userData.perfCull = true;
      this.scene.add(reed);
    }
    for (let i = 0; i < 6; i++) {
      const stone = AssetFactory.createRock(0.32 + Math.random() * 0.18);
      stone.position.set(-39 + i * 1.55, 0.03, 51 + Math.sin(i) * 0.6);
      stone.scale.set(1.35, 0.32, 0.9);
      this.addProp(stone, false);
    }
  }

  _createReeds() {
    const g = new THREE.Group();
    const reedMat = new THREE.MeshStandardMaterial({ color: 0x6f7b46, roughness: 0.9, flatShading: true });
    const tipMat = new THREE.MeshStandardMaterial({ color: 0x7a5130, roughness: 0.86, flatShading: true });
    for (let i = 0; i < 3; i++) {
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.75 + Math.random() * 0.45, 5), reedMat);
      stalk.position.set((Math.random() - 0.5) * 0.35, 0.38, (Math.random() - 0.5) * 0.35);
      stalk.rotation.x = (Math.random() - 0.5) * 0.25;
      stalk.rotation.z = (Math.random() - 0.5) * 0.25;
      g.add(stalk);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.18, 5), tipMat);
      tip.position.copy(stalk.position).setY(0.88 + Math.random() * 0.28);
      g.add(tip);
    }
    g.scale.setScalar(0.9 + Math.random() * 0.35);
    return g;
  }

  _addEncounterNode(x, z) {
    this._addSignpost(x - 8, z + 6, '小路边有怪物脚印');
    for (let i = 0; i < 4; i++) {
      const stump = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.22, 0.55, 6),
        new THREE.MeshStandardMaterial({ color: 0x5a3922, roughness: 0.9, flatShading: true })
      );
      stump.position.set(x - 4 + i * 2.2, 0.28, z + 5 + Math.sin(i) * 1.3);
      stump.rotation.y = Math.random() * Math.PI;
      stump.userData.perfCull = true;
      this.scene.add(stump);
    }
  }

  _addCampNode(x, z) {
    const fire = AssetFactory.createCampfire();
    fire.position.set(x, 0, z);
    this.scene.add(fire);
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(7.2, 22),
      new THREE.MeshStandardMaterial({ color: 0x6b5138, roughness: 1, transparent: true, opacity: 0.52, depthWrite: false })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(x, 0.066, z);
    ground.renderOrder = 2;
    this._markScenicDetail(ground);
    this.scene.add(ground);
    for (let i = 0; i < 5; i++) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 0.55, 0.75),
        new THREE.MeshStandardMaterial({ color: 0x6a4a2e, roughness: 0.9, flatShading: true })
      );
      box.position.set(x + 3.5 + (i % 2) * 0.8, 0.28, z - 2.8 + Math.floor(i / 2) * 0.75);
      box.rotation.y = Math.random() * 0.8;
      box.castShadow = true;
      box.userData.perfCull = true;
      this.scene.add(box);
    }
    this.fire = this.fire || fire;
  }

  _addGateApproach(x, z) {
    const focus = new THREE.Mesh(
      new THREE.TorusGeometry(5.2, 0.06, 6, 32),
      new THREE.MeshBasicMaterial({ color: 0x8fe8d0, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending })
    );
    focus.rotation.x = Math.PI / 2;
    focus.position.set(x, 0.08, z);
    this._markScenicDetail(focus);
    this.scene.add(focus);
    this._addSignpost(x - 8, z + 8, '北方森林入口');
  }

  _groundStructuresIntoScene() {
    const points = [
      { x: 15, z: -15, r: 4.8, color: 0x6a563f },
      { x: 8, z: 5, r: 4.2, color: 0x7a6f50 },
      { x: 75, z: 75, r: 7, color: 0x5e6048 },
      { x: 0, z: -90, r: 6.8, color: 0x4f6359 }
    ];
    for (const p of points) {
      const base = new THREE.Mesh(
        new THREE.CircleGeometry(p.r, 24),
        new THREE.MeshStandardMaterial({ color: p.color, roughness: 1, transparent: true, opacity: 0.36, depthWrite: false })
      );
      base.rotation.x = -Math.PI / 2;
      base.position.set(p.x, 0.063, p.z);
      base.renderOrder = 1;
      this._markScenicDetail(base);
      this.scene.add(base);
    }
  }

  _addSignpost(x, z, label) {
    const g = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: 0x5b3a22, roughness: 0.88, flatShading: true });
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), wood);
    post.position.y = 0.55;
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.28, 0.08), wood);
    board.position.set(0.28, 0.95, 0);
    g.add(post, board);
    g.position.set(x, 0, z);
    g.rotation.y = Math.random() * 0.35 - 0.15;
    g.userData.label = label;
    g.userData.perfCull = true;
    this.scene.add(g);
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
