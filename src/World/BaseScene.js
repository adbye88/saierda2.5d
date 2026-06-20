/* ========================================================
   BaseScene.js — 地图场景基类
   职责：scene/light/terrain/sky，碰撞体列表，敌人/掉落物/抛射物/可破坏物管理
   ======================================================== */

class BaseScene {
  constructor(name) {
    this.name = name;
    this.scene = new THREE.Scene();
    this.colliders = [];     // 不可穿过的物体（树/石/房子）
    this.breakables = [];    // 可击碎物（罐子/箱子）
    this.enemies = [];
    this.drops = [];
    this.projectiles = [];
    this.npcs = [];
    this.gates = [];         // 通往其它地图的传送门
    this.waterZones = [];    // {x,z,width,length,rotation}
    this.bridgeZones = [];   // 桥面区域，允许跨水
    this.slopeZones = [];    // {x,z,radius,height}
    this.spawnPoint = { x: 0, z: 0, a: 0 };
    this.bounds = { minX: -50, maxX: 50, minZ: -50, maxZ: 50 };
    this._built = false;
  }

  // 子类覆盖
  build() {}

  load() {
    if (!this._built) {
      this._setupLighting();
      this._setupSky();
      this._setupGround();
      this.build();
      this._setupExplorationDefaults();
      if (typeof WorldExpansionSystem !== 'undefined') WorldExpansionSystem.apply(this);
      this._built = true;
    }
  }

  unload() {
    // 保留场景对象，仅停止更新（切换回来时无需重建）
  }

  // ---------- 通用光照（提升质量） ----------
  _setupLighting() {
    // 半球光（天空/地面环境光，亮度提升）
    const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x668d4e, 0.95);
    this.scene.add(hemi);
    // 太阳（方向光 + 阴影）
    // ★ 阴影相机范围适中（30），配合 update 里让太阳跟随玩家，
    //   这样 2048 阴影贴图始终高精度覆盖玩家周围，远处也不黑
    const sun = new THREE.DirectionalLight(0xffefc8, 1.12);
    sun.position.set(30, 50, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -35;
    sun.shadow.camera.right = 35;
    sun.shadow.camera.top = 35;
    sun.shadow.camera.bottom = -35;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 120;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;  // 消除网格纹理的阴影自遮挡瑕疵
    this.scene.add(sun);
    this.scene.add(sun.target);  // ★ target 需加入场景才能随玩家移动
    this.sun = sun;
    // 补光（蓝色冷调，消除死角阴影）
    const fill = new THREE.DirectionalLight(0x8bbcff, 0.38);
    fill.position.set(-20, 30, -20);
    this.scene.add(fill);
  }

  // ---------- 天空盒（渐变） ----------
  _setupSky() {
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(200, 16, 12),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: {
          top: { value: new THREE.Color(0x4a90c2) },
          mid: { value: new THREE.Color(0xa8d8f0) },
          bot: { value: new THREE.Color(0xe8f4d0) }
        },
        vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);}`,
        fragmentShader: `
          varying vec3 vP;
          uniform vec3 top; uniform vec3 mid; uniform vec3 bot;
          void main(){
            float h = normalize(vP).y;
            vec3 c = h > 0.0 ? mix(mid, top, h) : mix(mid, bot, -h);
            gl_FragColor = vec4(c, 1.0);
          }`
      })
    );
    this.scene.add(sky);
    // 云朵（几个白色扁球）
    for (let i = 0; i < 8; i++) {
      const cloud = new THREE.Mesh(
        new THREE.SphereGeometry(4 + Math.random() * 3, 6, 5),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 })
      );
      cloud.scale.y = 0.4;
      cloud.position.set(
        (Math.random() - 0.5) * 180,
        40 + Math.random() * 20,
        (Math.random() - 0.5) * 180
      );
      this.scene.add(cloud);
    }
  }

  // ---------- 地面（带轻微起伏的低多边形 + 程序化贴图） ----------
  _setupGround(color = 0x6a9a4a, textureType = 'grass') {
    if (this.ground && this.ground.parent) {
      this.ground.parent.remove(this.ground);
      if (this.ground.geometry && this.ground.geometry.dispose) this.ground.geometry.dispose();
      if (this.ground.material && this.ground.material.dispose) this.ground.material.dispose();
      this.ground = null;
    }
    const size = Math.max(this.bounds.maxX - this.bounds.minX, this.bounds.maxZ - this.bounds.minZ);
    // ★ 分段数随地图大小自适应（每格约 2.5 单位），起伏更细腻
    const seg = Math.min(96, Math.max(48, Math.round(size / 2.5)));
    const geo = new THREE.PlaneGeometry(size, size, seg, seg);
    geo.rotateX(-Math.PI / 2);
    // 多频起伏：大波浪 + 中起伏 + 细微随机，地形更自然
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const h = Math.sin(x * 0.08) * 0.35 + Math.cos(z * 0.08) * 0.35
              + Math.sin(x * 0.3 + z * 0.2) * 0.15
              + (Math.random() - 0.5) * 0.18;
      pos.setY(i, h);
    }
    geo.computeVertexNormals();
    // 根据地形类型选择贴图
    let texture = null;
    if (textureType === 'grass') texture = Textures.grass();
    else if (textureType === 'snow') texture = Textures.snow();
    else if (textureType === 'sand') texture = Textures.sand();
    else if (textureType === 'rock') texture = Textures.rock('#5a4a3a');
    else if (textureType === 'stoneBrick') texture = Textures.stoneBrick();
    else if (textureType === 'lava') texture = Textures.lava();
    else if (textureType === 'water') texture = Textures.water();
    else if (textureType === 'forestFloor') texture = Textures.forestFloor();
    else if (textureType === 'dungeonFloor') texture = Textures.dungeonFloor();
    else if (textureType === 'castleFloor') texture = Textures.castleFloor();
    // ★ 贴图按地图大小重复；草地用更大块的手绘尺度，避免变成高频花草地毯
    if (texture) {
      const divisor = textureType === 'grass' ? 24 : textureType === 'forestFloor' ? 22 : textureType === 'snow' || textureType === 'sand' ? 34 : 16;
      const minRepeat = textureType === 'grass' || textureType === 'forestFloor' ? 8 : 6;
      const repeat = Math.max(minRepeat, Math.round(size / divisor));
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeat, repeat);
    }
    const matOpts = { color: 0xffffff, flatShading: false, roughness: 0.95, metalness: 0 };
    if (texture) matOpts.map = texture;
    else { matOpts.color = color; matOpts.flatShading = true; }
    const mat = new THREE.MeshStandardMaterial(matOpts);
    const ground = new THREE.Mesh(geo, mat);
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.ground = ground;
  }

  // ---------- 添加装饰物 + 注册碰撞 ----------
  addProp(mesh, collide = true) {
    if (mesh && mesh.userData) mesh.userData.perfCull = mesh.userData.perfCull !== false;
    this.scene.add(mesh);
    if (collide && mesh.userData.collisionRadius) {
      this.colliders.push(mesh);
    }
    return mesh;
  }

  addWaterZone(x, z, width, length, rotation = 0) {
    this.waterZones.push({ x, z, width, length, rotation });
  }

  addBridgeZone(x, z, width, length, rotation = 0) {
    this.bridgeZones.push({ x, z, width, length, rotation });
  }

  addSlopeZone(x, z, radius, height = 1.2) {
    this.slopeZones.push({ x, z, radius, height });
  }

  addShrines(ids) {
    if (!this.shrines) this.shrines = [];
    for (const id of ids) {
      const def = SHRINE_DEFS[id];
      if (!def) continue;
      const shrine = new Shrine(id, def);
      this.scene.add(shrine.mesh);
      this.shrines.push(shrine);
    }
  }

  addTower(x, z, towerName, worldName = this.name) {
    const tower = AssetFactory.createSheikahTower();
    tower.position.set(x, 0, z);
    tower.userData.worldName = worldName;
    tower.userData.towerName = towerName;
    this.scene.add(tower);
    if (!this.towers) this.towers = [];
    this.towers.push(tower);
    if (typeof ExplorationSystem !== 'undefined') {
      ExplorationSystem.addClimbSpot(this, {
        x, z,
        radius: 7.5,
        height: 5.2,
        label: towerName || '远古塔'
      });
    }
    return tower;
  }

  addFieldBoss(typeId, x, z, label = null) {
    const boss = new Enemy(typeId, x, z);
    boss.userData = boss.userData || {};
    boss.userData.fieldBoss = true;
    boss.userData.fieldBossLabel = label || (boss.def && boss.def.name) || typeId;
    boss._fieldBossAnnounced = false;
    boss._fieldBossDefeatAnnounced = false;
    this.enemies.push(boss);
    this.scene.add(boss.mesh);
    return boss;
  }

  addRuinCluster(x, z, options = {}) {
    const g = new THREE.Group();
    const color = options.color || 0x8a8172;
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.86, metalness: 0.02, flatShading: true });
    const count = options.count || 5;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + (options.rotation || 0);
      const r = 2.4 + (i % 3) * 0.9;
      const h = 1.2 + (i % 4) * 0.45;
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.5, h, 0.5), mat);
      col.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
      col.rotation.y = a + 0.2;
      g.add(col);
    }
    const slab = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.18, 3.8), mat);
    slab.position.y = 0.1;
    slab.rotation.y = options.rotation || 0;
    g.add(slab);
    g.position.set(x, 0, z);
    this.scene.add(g);
    if (typeof ExplorationSystem !== 'undefined') {
      ExplorationSystem.addClimbSpot(this, {
        x, z,
        radius: 5.8,
        height: 2.5,
        label: '可攀爬废墟'
      });
    }
    return g;
  }

  _setupExplorationDefaults() {
    if (this._explorationBuilt || typeof ExplorationSystem === 'undefined') return;
    this._explorationBuilt = true;
    const defs = {
      grassland: {
        rewards: [
          { id: 'grassland_peak_cache', label: '台地山顶宝箱', x: 92, y: 2.4, z: -98, requireHeight: 1.6, items: [['stamellaShroom', 3], ['arrow', 10]], clue: '远处山坡顶上有微弱金光，爬上去或从高处滑翔过去试试。' },
          { id: 'grassland_waterfall_cache', label: '瀑布后宝箱', x: -35, y: 0, z: -126, items: [['opal', 1], ['hyruleBass', 2]], clue: '水声后面似乎藏着东西。' },
          { id: 'grassland_ruin_cache', label: '东南废墟宝箱', x: 152, y: 0, z: -132, items: [['soldierShield', 1], ['rupee', 25]], clue: '废墟石柱围出的空地不像自然形成。' }
        ],
        koroks: [
          { id: 'grassland_tree_korok', x: -150, z: 142, clue: '老树根旁的落叶堆很奇怪。' },
          { id: 'grassland_stone_ring_korok', x: 108, z: 52, clue: '山坡上几块石头像是缺了一块。' }
        ],
        climb: [
          { x: 92, z: -98, radius: 9, height: 3.2, label: '台地南侧山坡' },
          { x: 132, z: 0, radius: 8, height: 4.2, label: '东侧峭壁' },
          { x: -35, z: -122, radius: 7, height: 2.6, label: '瀑布湿岩' }
        ],
        camps: [
          { name: '桥北波克布林营地', x: -42, z: -44, radius: 20, alarmRadius: 8 },
          { name: '东南废墟营地', x: 152, z: -132, radius: 22, alarmRadius: 9 }
        ]
      },
      forest: {
        rewards: [
          { id: 'forest_deep_tree_cache', label: '古树树洞宝箱', x: 146, y: 0, z: 132, items: [['forestDwellerSword', 1], ['mushroom', 4]], clue: '迷雾深处有一棵树洞透着绿光。' },
          { id: 'forest_satori_cache', label: '萨托利林地宝箱', x: -148, y: 0, z: 34, items: [['courserBeeHoney', 2], ['rupee', 40]], clue: '林地圆环中央很安静，像在等人靠近。' }
        ],
        koroks: [
          { id: 'forest_leaf_korok', x: -62, z: 72, clue: '树叶旋成了一个小圈。' },
          { id: 'forest_mist_korok', x: 72, z: -18, clue: '雾里传来小小的笑声。' }
        ],
        climb: [
          { x: -102, z: 72, radius: 8, height: 3.4, label: '藤蔓古树' },
          { x: 104, z: -76, radius: 8, height: 3.6, label: '林中断崖' }
        ],
        camps: [
          { name: '迷雾波克布林营地', x: 0, z: -15, radius: 24, alarmRadius: 10 },
          { name: '古树根遗迹营地', x: 114, z: -112, radius: 24, alarmRadius: 10 }
        ]
      },
      highland: {
        rewards: [
          { id: 'highland_falls_cache', label: '瀑布高台宝箱', x: 148, y: 2.5, z: -142, requireHeight: 1.7, items: [['topaz', 1], ['staminaElixir', 1]], clue: '瀑布上方的平台适合从高处滑翔过去。' },
          { id: 'highland_lake_cache', label: '湖畔沉石宝箱', x: -152, y: 0, z: -118, items: [['zoraShield', 1], ['hyruleBass', 3]], clue: '湖畔几块石头指向水边。' }
        ],
        koroks: [
          { id: 'highland_two_tree_korok', x: 0, z: 18, clue: '两棵歪树之间有风铃声。' },
          { id: 'highland_thunder_korok', x: -128, z: 104, clue: '雷鸣高地的石台在雨停后微微发亮。' }
        ],
        climb: [
          { x: 108, z: 92, radius: 9, height: 4.0, label: '高崖神庙岩壁' },
          { x: 148, z: -142, radius: 8, height: 3.5, label: '费罗尼瀑布岩壁' }
        ],
        camps: [
          { name: '双河蜥蜴战士营地', x: -112, z: 18, radius: 24, alarmRadius: 10 }
        ]
      },
      snowland: {
        rewards: [
          { id: 'snow_peak_cache', label: '雪峰宝箱', x: -105, y: 2.8, z: -92, requireHeight: 1.8, items: [['sapphire', 1], ['spicyPepper', 4]], clue: '雪峰上有蓝色反光，防寒后再去更安全。' },
          { id: 'snow_cave_cache', label: '冰洞宝箱', x: 92, y: 0, z: 64, items: [['iceBow', 1], ['whiteChuchuJelly', 3]], clue: '冰洞口的冷风吹出宝箱的金属声。' }
        ],
        koroks: [
          { id: 'snow_snowball_korok', x: 112, z: -118, clue: '冻湖边的小雪球摆得太整齐。' }
        ],
        climb: [
          { x: -105, z: -92, radius: 9, height: 4.2, label: '赫布拉雪峰' },
          { x: 150, z: -30, radius: 8, height: 3.4, label: '塔邦挞断崖' }
        ],
        hazards: [
          { type: 'cold', x: 0, z: -70, radius: 190, damage: 0.5, color: 0x66ddff, message: '严寒正在消耗生命：穿防寒装备或吃暖暖料理。', safeMessage: '防寒效果抵住了雪原严寒。' }
        ],
        camps: [
          { name: '雪原莱尼尔警戒区', x: 112, z: 106, radius: 28, alarmRadius: 12 }
        ]
      },
      volcano: {
        rewards: [
          { id: 'volcano_crater_cache', label: '熔岩口宝箱', x: -104, y: 2.4, z: -88, requireHeight: 1.6, items: [['ruby', 1], ['flameproofDish', 1]], clue: '熔岩口边缘有红色宝石光，耐火后再靠近。' },
          { id: 'volcano_mine_cache', label: '废矿宝箱', x: 104, y: 0, z: 58, items: [['goronSpice', 3], ['flint', 5]], clue: '废矿轨道尽头堆着可疑碎石。' }
        ],
        koroks: [
          { id: 'volcano_ember_korok', x: -148, z: 128, clue: '余烬绕着一圈石头旋转。' }
        ],
        climb: [
          { x: -104, z: -88, radius: 9, height: 3.7, label: '死亡之山熔岩壁' },
          { x: 150, z: -34, radius: 8, height: 3.2, label: '鼓隆峭壁' }
        ],
        hazards: [
          { type: 'fire', x: 0, z: -40, radius: 185, damage: 0.75, color: 0xff5522, message: '灼热空气正在烧伤你：需要耐火装备或防火料理。', safeMessage: '耐火效果抵住了火山灼烧。' }
        ],
        camps: [
          { name: '废矿火蜥蜴营地', x: 104, z: 58, radius: 24, alarmRadius: 10 }
        ]
      },
      desert: {
        rewards: [
          { id: 'desert_oasis_cache', label: '绿洲宝箱', x: -108, y: 0, z: 42, items: [['voltfruit', 4], ['gerudoShield', 1]], clue: '绿洲水边有被沙埋住一半的箱角。' },
          { id: 'desert_bone_cache', label: '龙骨宝箱', x: 28, y: 0, z: -154, items: [['topaz', 1], ['shockBow', 1]], clue: '龙骨阴影下闪过黄色电光。' }
        ],
        koroks: [
          { id: 'desert_cactus_korok', x: -152, z: 106, clue: '三棵仙人掌的高度似乎少了一个节奏。' }
        ],
        climb: [
          { x: 96, z: -98, radius: 8, height: 3.2, label: '沙暴神庙岩脊' },
          { x: 148, z: 132, radius: 8, height: 3.6, label: '格鲁德迷宫外墙' }
        ],
        hazards: [
          { type: 'heat', x: 0, z: 0, radius: 190, damage: 0.45, color: 0xffcc66, message: '酷热正在消耗生命：穿防暑装备或吃沁凉料理。', safeMessage: '防暑效果抵住了沙漠酷热。' }
        ],
        camps: [
          { name: '绿洲蜥蜴战士营地', x: -108, z: 42, radius: 24, alarmRadius: 10 }
        ]
      },
      castle: {
        rewards: [
          { id: 'castle_docks_cache', label: '王城船坞宝箱', x: -96, y: 0, z: -106, items: [['royalGuardShield', 1], ['ancientCore', 1]], clue: '船坞废墟里传来古代零件的嗡鸣。' },
          { id: 'castle_watch_cache', label: '瞭望塔宝箱', x: -72, y: 2.8, z: 52, requireHeight: 1.8, items: [['royalBow', 1], ['arrow', 20]], clue: '瞭望塔上方有近卫留下的补给。' }
        ],
        koroks: [
          { id: 'castle_malice_korok', x: 100, z: 94, clue: '魔气中有一片不合时宜的绿叶。' }
        ],
        climb: [
          { x: -72, z: 52, radius: 8, height: 4.0, label: '王城瞭望塔残壁' },
          { x: 118, z: 112, radius: 8, height: 3.6, label: '中央广场残墙' }
        ],
        camps: [
          { name: '王城守护者警戒区', x: 0, z: 128, radius: 32, alarmRadius: 14 }
        ]
      }
    };
    const cfg = defs[this.name];
    if (!cfg) return;
    for (const r of (cfg.rewards || [])) ExplorationSystem.addDiscoveryReward(this, r);
    for (const k of (cfg.koroks || [])) ExplorationSystem.addKorokPuzzle(this, k);
    for (const c of (cfg.climb || [])) ExplorationSystem.addClimbSpot(this, c);
    for (const h of (cfg.hazards || [])) ExplorationSystem.addHazardZone(this, h);
    for (const camp of (cfg.camps || [])) ExplorationSystem.addCamp(this, camp);
  }

  _pointInRectZone(x, z, zone) {
    const dx = x - zone.x;
    const dz = z - zone.z;
    const c = Math.cos(-(zone.rotation || 0));
    const s = Math.sin(-(zone.rotation || 0));
    const lx = dx * c - dz * s;
    const lz = dx * s + dz * c;
    return Math.abs(lx) <= zone.width / 2 && Math.abs(lz) <= zone.length / 2;
  }

  getTerrainAt(x, z) {
    const onBridge = this.bridgeZones.some(zone => this._pointInRectZone(x, z, zone));
    const inWater = !onBridge && this.waterZones.some(zone => this._pointInRectZone(x, z, zone));
    let slope = null;
    for (const zone of this.slopeZones) {
      const dist = Math.hypot(x - zone.x, z - zone.z);
      if (dist < zone.radius) {
        const k = 1 - dist / zone.radius;
        slope = { height: zone.height * k, speedMul: 0.72 + 0.28 * (1 - k) };
        break;
      }
    }
    return { inWater, onBridge, slope };
  }

  // ---------- 每帧更新场景内容 ----------
  update(dt, game) {
    // ★ 各阶段独立 try/catch：定位出错的具体阶段，且互不影响
    // 阶段1：太阳跟随
    try {
      if (this.sun && game.player) {
        const p = game.player.position;
        this.sun.position.set(p.x + 30, 50, p.z + 20);
        this.sun.target.position.set(p.x, 0, p.z);
        this.sun.target.updateMatrixWorld();
      }
    } catch (e) { this._stageErr('sun', e); }
    // 阶段2：敌人
    try {
      for (const e of this.enemies) e.update(dt, game);
      this.enemies = this.enemies.filter(e => !(e.dead && e.deathTimer > 1.3));
    } catch (e) { this._stageErr('enemies', e); }
    // 阶段3：掉落物
    try {
      for (const d of this.drops) d.update(dt);
      this.drops = this.drops.filter(d => {
        if (d.pickedUp || d.lifetime <= 0) {
          if (d.mesh.parent) d.mesh.parent.remove(d.mesh);
          return false;
        }
        return true;
      });
    } catch (e) { this._stageErr('drops', e); }
    // 阶段4：抛射物
    try { this._updateProjectiles(dt, game); }
    catch (e) { this._stageErr('projectiles', e); }
    // 阶段5：触发器
    try { this._updateTriggers(game); }
    catch (e) { this._stageErr('triggers', e); }
    // 阶段6：野外 Boss 提示
    try { this._updateFieldBosses(game); }
    catch (e) { this._stageErr('fieldBosses', e); }
    // 阶段7：旷野式探索增强（隐藏奖励 / 克洛格 / 环境 / 潜入）
    try { if (typeof ExplorationSystem !== 'undefined') ExplorationSystem.updateWorld(this, game, dt); }
    catch (e) { this._stageErr('exploration', e); }
  }

  // 阶段错误上报：复用 Game 的错误显示
  _stageErr(stage, e) {
    console.error('★ [world.' + stage + ']', e);
    if (window.game && window.game._subError) {
      window.game._subError('world.' + stage, e);
    }
  }

  _updateProjectiles(dt, game) {
    for (const p of this.projectiles) {
      const v = p.userData.velocity;
      p.position.addScaledVector(v, dt);
      p.userData.life -= dt;
      // 箭受重力
      if (p.geometry && p.geometry.type === 'CylinderGeometry' && !p.userData.isLaser) {
        v.y -= 9 * dt;
      }
      // 命中检测
      if (p.userData.fromEnemy) {
        // 敌方抛射物打玩家
        const d = p.position.distanceTo(game.player.position.clone().setY(1.0));
        if (d < 1.0) {
          if (p.userData.owner) game.player._lastAttacker = p.userData.owner;
          const hitResult = game.player.takeDamage(p.userData.damage, v.clone().setY(0).normalize(), p.userData.element);
          if (hitResult === 'parried' && p.userData.isLaser) {
            this._reflectGuardianLaser(p, game);
          } else if (p.userData.element && p.userData.owner && typeof p.userData.owner._applyElementEffect === 'function') {
            p.userData.owner._applyElementEffect(game.player, p.userData.element);
          }
          p.userData.life = 0;
        }
      } else {
        // 玩家箭打敌人
        let hitSomething = false;
        for (const e of this.enemies) {
          if (e.dead) continue;
          const d = p.position.distanceTo(e.mesh.position.clone().setY(1.0));
          if (d < e.radius + 0.4) {
            // ★ 元素箭传递元素伤害
            const arrowType = p.userData.arrowType || 'normal';
            const element = (arrowType === 'fire') ? 'fire'
                          : (arrowType === 'ice') ? 'ice'
                          : (arrowType === 'shock') ? 'shock' : null;
            e.takeDamage(p.userData.damage, v.clone().setY(0).normalize(), element);
            // 元素箭命中附加元素状态（点燃/冻结/麻痹敌人）
            if (element && typeof e._applyElementEffect === 'function') {
              e._applyElementEffect(e, element);
            }
            // ★ 命中特效：元素箭的彩色爆裂
            if (typeof Effects !== 'undefined') {
              const burstColor = arrowType === 'fire' ? 0xff4422
                               : arrowType === 'ice' ? 0x66ddff
                               : arrowType === 'shock' ? 0xffee44
                               : arrowType === 'ancient' ? 0x66ddcc
                               : arrowType === 'piercing' ? 0xd4af37
                               : 0xffaa44;
              Effects.hitBurst(e.mesh.position.clone().setY(1.2), burstColor, 8);
              // 火箭命中：范围爆裂
              if (arrowType === 'fire') Effects.hitBurst(e.mesh.position.clone().setY(1.2), 0xff8822, 12);
            }
            p.userData.life = 0;
            hitSomething = true;
            break;
          }
        }
        // 玩家箭也能打爆营地爆桶/宝箱等可破坏物，支持从高处远程引爆。
        if (!hitSomething && this.breakables) {
          for (const b of this.breakables) {
            if (!b || b.broken || !b.mesh) continue;
            const d = p.position.distanceTo(b.mesh.position.clone().setY(0.7));
            if (d < 0.85 + ((b.mesh.userData && b.mesh.userData.collisionRadius) || 0.45)) {
              if (typeof b.break_open === 'function') b.break_open(game);
              if (typeof Effects !== 'undefined') Effects.hitBurst(b.mesh.position.clone().setY(0.7), 0xffd54f, 6);
              p.userData.life = 0;
              hitSomething = true;
              break;
            }
          }
        }
      }
      // 落地：元素箭会短暂影响环境（火烧草、冰冻水、雷导电）
      if (p.position.y <= 0) {
        if (!p.userData._elementApplied && !p.userData.fromEnemy && typeof ExplorationSystem !== 'undefined') {
          const arrowType = p.userData.arrowType || 'normal';
          const element = arrowType === 'fire' ? 'fire' : arrowType === 'ice' ? 'ice' : arrowType === 'shock' ? 'shock' : null;
          if (element) ExplorationSystem.applyElementToWorld(this, p.position.clone(), element, p);
          p.userData._elementApplied = true;
        }
        p.userData.life = Math.min(p.userData.life, 0.2);
      }
      if (p.userData.life <= 0 && p.parent) p.parent.remove(p);
    }
    this.projectiles = this.projectiles.filter(p => p.userData.life > 0 && p.parent);
  }

  _reflectGuardianLaser(projectile, game) {
    const owner = projectile.userData.owner;
    if (!owner || owner.dead) return;
    const reflected = projectile.clone();
    reflected.position.copy(game.player.position).setY(1.15);
    const target = owner.mesh.position.clone().setY(owner.boss ? 2.2 : 1.15);
    const dir = new THREE.Vector3().subVectors(target, reflected.position);
    if (dir.lengthSq() < 0.001) dir.set(0, 0, -1);
    dir.normalize();
    reflected.lookAt(reflected.position.clone().add(dir));
    reflected.userData = {
      velocity: dir.multiplyScalar(36),
      damage: owner.typeId === 'guardian' || owner.typeId === 'guardianStalker' ? 280 : Math.max(80, projectile.userData.damage * 3),
      fromPlayer: true,
      life: 2.2,
      arrowType: 'ancient',
      reflectedLaser: true
    };
    this.scene.add(reflected);
    this.projectiles.push(reflected);
    Dialogue.showFloat('激光反弹！', game.player.position.clone().setY(2.7), '#66ddff');
    if (typeof Effects !== 'undefined') {
      Effects.hitBurst(game.player.position.clone().setY(1.25), 0x66ddff, 14);
      Effects.parrySpark(game.player.position.clone().add(dir.clone().multiplyScalar(0.8)).setY(1.2));
      Effects.guardianLaserBeam(game.player.position.clone().setY(1.15), target, 0x66ddff, true);
    }
    if (typeof AudioSystem !== 'undefined') AudioSystem.play('power');
  }

  _updateTriggers(game) {
    // ★ 交互容错：justInteract 是边沿信号，易被 endFrame 清掉；
    //   同时接受 state.interact（长按），靠 _interactConsumed 防一帧内连发
    const bufferedInteract = Input.justInteract || Input.state.interact || Input._interactBuffer > 0;
    if (!this._interactConsumed) {
      this._interactWant = bufferedInteract;
    }
    if (!bufferedInteract) {
      this._interactConsumed = false;
      this._interactWant = false;
    }
    // 拾取：靠近自动拾取 + 拾取闪光
    let nearestPickup = null, nearestPickupDist = Infinity;
    for (const d of this.drops) {
      if (d.pickedUp) continue;
      const dist = game.player.position.distanceTo(d.mesh.position);
      if (dist < 1.4) {
        const def = ITEMS[d.itemId];
        game.player.inventory.add(d.itemId, d.count);
        Dialogue.show(`获得 ${def.icon} ${def.name}${d.count > 1 ? ' ×' + d.count : ''}`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.play('pickup');
        Effects.pickupFlash(d.mesh.position);
        d.pickedUp = true;
      } else if (dist < 3.0 && dist < nearestPickupDist) {
        nearestPickup = d; nearestPickupDist = dist;
      }
    }
    // NPC 对话 + 对话按钮提示
    let nearestNpc = null, nearestNpcDist = Infinity;
    for (const npc of this.npcs) {
      const dist = game.player.position.distanceTo(npc.mesh.position);
      if (dist < 2.5) {
        if (dist < nearestNpcDist) { nearestNpc = npc; nearestNpcDist = dist; }
      }
    }
    // 烹饪锅
    let nearestPot = null, nearestPotDist = Infinity;
    for (const pot of (this.cookingPots || [])) {
      const dist = game.player.position.distanceTo(pot.position);
      if (dist < 2.5) {
        if (dist < nearestPotDist) { nearestPot = pot; nearestPotDist = dist; }
      }
    }
    // 神庙（靠近按对话键进入答题挑战）
    let nearestShrine = null, nearestShrineDist = Infinity;
    for (const shrine of (this.shrines || [])) {
      const dist = game.player.position.distanceTo(shrine.mesh.position);
      if (dist < 3.0) {
        if (dist < nearestShrineDist) { nearestShrine = shrine; nearestShrineDist = dist; }
      }
    }
    if (this._interactWant && !this._interactConsumed) {
      if (nearestShrine && !ShrineUI.isOpen) {
        this._consumeInteract();
        if (typeof Effects !== 'undefined') Effects.shrineRunePulse(nearestShrine.mesh.position.clone());
        nearestShrine.enter(game);
      } else if (nearestNpc) {
        const ud = nearestNpc.mesh.userData || nearestNpc.userData;
        if (ud && ud.onTalk) {
          this._consumeInteract();
          try {
            const beforeVisible = this._isDialogueVisible();
            ud.onTalk(game);
            if (!beforeVisible && !this._isDialogueVisible() && !this._isAnyModalOpen()) {
              Dialogue.show(`【${ud.name || '旅人'}】……`);
            }
          } catch (e) {
            console.error('NPC 对话出错:', e);
            Dialogue.show('对话暂时中断，请再试一次');
          }
        }
      } else if (nearestPot && !CookingUI.isOpen) {
        this._consumeInteract();
        CookingUI.open(nearestPot);
      }
    }
    // 显示/隐藏对话拾取按钮（优先级：神庙 > NPC > 锅 > 拾取）
    if (nearestShrine) {
      ActionButtons.showInteract(true, nearestShrine.cleared ? '已通关' : '挑战');
    } else if (nearestNpc) {
      const ud = nearestNpc.mesh.userData || nearestNpc.userData || {};
      ActionButtons.showInteract(true, ud.actionLabel || '对话');
    } else if (nearestPot) {
      ActionButtons.showInteract(true, '烹饪');
    } else if (nearestPickup) {
      ActionButtons.showInteract(true, '拾取');
    } else {
      ActionButtons.showInteract(false);
    }
    // 传送门
    for (const g of this.gates) {
      if (!g.userData.target || g.userData.triggered) continue;
      const dist = game.player.position.distanceTo(g.position);
      if (dist < 2.5) {
        const leavingPlateau = this.name === 'grassland' && !['dungeon'].includes(g.userData.target);
        if (leavingPlateau && !(QuestSystem.progress && QuestSystem.progress.gotGlider)) {
          const now = performance.now();
          if (!this._gliderWarnAt || now - this._gliderWarnAt > 1800) {
            this._gliderWarnAt = now;
            Dialogue.show('先完成四座神庙，向海拉鲁国王领取滑翔伞。');
          }
          g.userData.triggered = false;
          continue;
        }
        const goingCastle = g.userData.target === 'castle';
        const divineBeasts = (QuestSystem.progress && QuestSystem.progress.divineBeasts) || [];
        if (goingCastle && divineBeasts.length < 4) {
          const now = performance.now();
          if (!this._castleWarnAt || now - this._castleWarnAt > 1800) {
            this._castleWarnAt = now;
            Dialogue.show(`先解放四大神兽（${divineBeasts.length}/4），再前往海拉鲁城堡。`);
          }
          g.userData.triggered = false;
          continue;
        }
        g.userData.triggered = true;
        const targetName = g.userData.targetName || g.userData.target;
        const target = g.userData.target;
        Dialogue.show(`前往 ${targetName}…`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.play('warp');
        Effects.portalEffect(game.player.position);
        Effects.shrineRunePulse(g.position.clone());
        // ★ 用闭包捕获 target，防止 g 被回收
        setTimeout(() => {
          console.log('传送执行:', target);
          window.game.loadWorld(target);
        }, 700);
      }
    }
    // 锁定辅助：按距离排序，重复点击/按键循环附近目标
    if (Input.justLock) {
      this._cycleLockTarget(game, { range: 14, bowMode: false });
    }
    if (Input.justBowTarget) {
      this._cycleLockTarget(game, { range: 22, bowMode: true });
    }
  }

  _updateFieldBosses(game) {
    this.activeFieldBoss = null;
    for (const e of this.enemies) {
      if (!e.userData || !e.userData.fieldBoss) continue;
      const label = e.userData.fieldBossLabel || (e.def && e.def.name) || '强敌';
      if (e.dead) {
        if (!e._fieldBossDefeatAnnounced) {
          e._fieldBossDefeatAnnounced = true;
          Dialogue.show(`【挑战完成】${label} 已被击败！`);
          if (typeof Effects !== 'undefined') Effects.pickupFlash(e.mesh.position);
        }
        continue;
      }
      const d = game.player.position.distanceTo(e.mesh.position);
      if (d < 24) {
        this.activeFieldBoss = e;
        if (!e._fieldBossAnnounced) {
          e._fieldBossAnnounced = true;
          const tip = (typeof ExplorationSystem !== 'undefined' && ExplorationSystem.bossTip) ? ExplorationSystem.bossTip(e) : '';
          Dialogue.show('【野外 Boss】' + label + ' 出现！' + (tip ? '<br>' + tip : ''), 4200);
          HUD.setQuest('挑战野外 Boss：' + label + (tip ? '｜' + tip : ''), 0xff8844);
        }
      }
    }
  }

  _isDialogueVisible() {
    const dlg = document.getElementById('dialogue');
    return !!dlg && !dlg.classList.contains('hidden');
  }

  _consumeInteract() {
    if (Input._interactBuffer !== undefined) Input._interactBuffer = 0;
    if (Input.state) {
      Input.state.justInteract = false;
      Input.state.interact = false;
    }
    this._interactConsumed = true;
    this._interactWant = false;
  }

  _isAnyModalOpen() {
    return !!(
      (typeof InventoryUI !== 'undefined' && InventoryUI.isOpen) ||
      (typeof CookingUI !== 'undefined' && CookingUI.isOpen) ||
      (typeof MapMenu !== 'undefined' && MapMenu.isOpen) ||
      (typeof ShopUI !== 'undefined' && ShopUI.isOpen) ||
      (typeof QuestUI !== 'undefined' && QuestUI.isOpen) ||
      (typeof ShrineUI !== 'undefined' && ShrineUI.isOpen) ||
      (typeof StatueUI !== 'undefined' && StatueUI.isOpen)
    );
  }

  _cycleLockTarget(game, opts = {}) {
    const range = opts.range || 14;
    const candidates = this.enemies
      .filter(e => !e.dead && e.hp > 0)
      .map(e => ({ enemy: e, dist: e.mesh.position.distanceTo(game.player.position) }))
      .filter(x => x.dist <= range)
      .sort((a, b) => a.dist - b.dist)
      .map(x => x.enemy);

    if (opts.bowMode) {
      if (!game.player.inventory.equipped.bow) {
        Dialogue.show('还没有装备弓');
        game.player.setBowMode(false);
        return;
      }
      if (game.player.inventory.arrows <= 0) {
        Dialogue.show('没有箭矢了');
        game.player.setBowMode(false);
        return;
      }
      game.player.setBowMode(true);
    }

    if (candidates.length === 0) {
      game.lockedEnemy = null;
      if (opts.bowMode) Dialogue.show('附近没有可瞄准的敌人');
      return;
    }

    const currentIndex = candidates.indexOf(game.lockedEnemy);
    const next = candidates[(currentIndex + 1) % candidates.length];
    game.lockedEnemy = next;
    if (opts.bowMode) {
      Dialogue.show(`🏹 瞄准：${next.def ? next.def.name : '敌人'}`, 900);
    }
  }

  // ---------- 工具：撒 N 个道具 ----------
  scatter(factory, count, margin = 4) {
    const budgetedCount = Math.max(1, Math.round(count * this._sceneDetailFactor()));
    for (let i = 0; i < budgetedCount; i++) {
      const m = factory();
      let x, z, tries = 0;
      do {
        x = this.bounds.minX + margin + Math.random() * (this.bounds.maxX - this.bounds.minX - margin * 2);
        z = this.bounds.minZ + margin + Math.random() * (this.bounds.maxZ - this.bounds.minZ - margin * 2);
        tries++;
      } while (tries < 8 && Math.hypot(x, z) < 6); // 别太靠近出生点
      m.position.set(x, 0, z);
      this.addProp(m, !!m.userData.collisionRadius);
    }
  }

  _sceneDetailFactor() {
    const level = (typeof VisualQualitySystem !== 'undefined' && VisualQualitySystem.level) || 'medium';
    const touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (touch || level === 'low') return 0.22;
    if (level === 'medium') return 0.42;
    if (level === 'ultra') return 1;
    return 0.68;
  }
}
