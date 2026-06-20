/* ========================================================
   WorldExpansionSystem.js — 地图复杂度扩展层
   目标：在不重写各地图的前提下，按区域风格补充地形层次、树林斑块、
   营地布景、篝火休息点，让每张大地图更像可探索的旷野。
   ======================================================== */

const WorldExpansionSystem = {
  apply(world) {
    if (!world || world._worldExpansionBuilt || typeof THREE === 'undefined') return;
    world._worldExpansionBuilt = true;
    const cfg = this.CONFIG[world.name];
    if (!cfg) return;

    const factor = this._detailFactor();
    for (const hill of (cfg.hills || [])) this._addHill(world, hill);
    for (const ridge of (cfg.ridges || [])) this._addRidge(world, ridge);
    for (const patch of (cfg.groves || [])) this._addGrove(world, patch);
    const campLimit = factor <= 0.25 ? 1 : factor < 0.6 ? 2 : Infinity;
    (cfg.campScenes || []).slice(0, campLimit).forEach(camp => this._addCampScene(world, camp));
    (cfg.campfires || []).slice(0, factor <= 0.25 ? 0 : 1).forEach(fire => this._addCampfireRest(world, fire));
  },

  CONFIG: {
    grassland: {
      hills: [
        { x: -118, z: -22, r: 9, h: 2.1, color: 0x6f9650, label: '西台地缓坡' },
        { x: 54, z: 126, r: 10, h: 2.4, color: 0x7ba15a, label: '南草坡' },
        { x: 146, z: 78, r: 8, h: 1.9, color: 0x789c55, label: '东侧草丘' }
      ],
      ridges: [
        { x: -76, z: -112, len: 62, rot: -0.18, count: 9, scale: 0.75, style: 'moss' },
        { x: 128, z: -48, len: 52, rot: 0.78, count: 8, scale: 0.7, style: 'moss' }
      ],
      groves: [
        { x: -142, z: 108, rx: 30, rz: 18, count: 28, style: 'mixed', bushes: 18 },
        { x: 86, z: -128, rx: 26, rz: 20, count: 24, style: 'pine', bushes: 12 },
        { x: 142, z: 28, rx: 22, rz: 18, count: 20, style: 'birch', bushes: 10 }
      ],
      campScenes: [
        { x: -42, z: -44, rot: 0.35, style: 'boko', name: '桥北营地' },
        { x: 152, z: -132, rot: -0.6, style: 'ruin', name: '东南废墟营地' },
        { x: 68, z: 84, rot: 1.1, style: 'traveler', name: '旅人临时营地' }
      ],
      campfires: [
        { x: -92, z: 76, rot: 0.2 },
        { x: 18, z: -116, rot: -0.5 }
      ]
    },
    forest: {
      hills: [
        { x: -138, z: -92, r: 11, h: 2.5, color: 0x355b35, label: '藤蔓高根' },
        { x: 126, z: 48, r: 10, h: 2.2, color: 0x315432, label: '苔藓土坡' }
      ],
      ridges: [
        { x: -26, z: -118, len: 70, rot: 0.42, count: 11, scale: 0.78, style: 'moss' },
        { x: 132, z: 114, len: 46, rot: -0.3, count: 7, scale: 0.9, style: 'moss' }
      ],
      groves: [
        { x: -112, z: 24, rx: 38, rz: 28, count: 42, style: 'ancient', bushes: 34 },
        { x: 68, z: -118, rx: 34, rz: 24, count: 36, style: 'dark', bushes: 24 },
        { x: 132, z: 132, rx: 28, rz: 24, count: 30, style: 'ancient', bushes: 24 }
      ],
      campScenes: [
        { x: 0, z: -15, rot: -0.2, style: 'boko', name: '迷雾波克营地' },
        { x: 114, z: -112, rot: 0.75, style: 'ruin', name: '古树根遗迹营地' },
        { x: -148, z: 34, rot: -0.45, style: 'traveler', name: '萨托利林地营火' }
      ],
      campfires: [
        { x: -74, z: 126, rot: 0.5 },
        { x: 82, z: 64, rot: -0.8 }
      ]
    },
    highland: {
      hills: [
        { x: -154, z: 74, r: 13, h: 3.0, color: 0x7b8754, label: '雷鸣高地岩坡' },
        { x: 132, z: -132, r: 12, h: 2.7, color: 0x74845a, label: '瀑布上行坡' }
      ],
      ridges: [
        { x: -132, z: 18, len: 80, rot: 0.15, count: 12, scale: 0.9, style: 'moss' },
        { x: 82, z: 126, len: 66, rot: -0.72, count: 10, scale: 0.85, style: 'moss' }
      ],
      groves: [
        { x: -52, z: 142, rx: 30, rz: 24, count: 26, style: 'pine', bushes: 16 },
        { x: 134, z: 36, rx: 24, rz: 18, count: 22, style: 'birch', bushes: 12 }
      ],
      campScenes: [
        { x: -112, z: 18, rot: 0.2, style: 'boko', name: '双河蜥蜴营地' },
        { x: 116, z: 116, rot: -0.5, style: 'traveler', name: '高地观星营地' }
      ],
      campfires: [
        { x: -156, z: -72, rot: 0.1 },
        { x: 62, z: -144, rot: 0.8 }
      ]
    },
    snowland: {
      hills: [
        { x: -136, z: -118, r: 12, h: 3.1, color: 0xd8e8ee, label: '雪峰背脊' },
        { x: 132, z: 82, r: 10, h: 2.5, color: 0xe6eef4, label: '冻土高坡' }
      ],
      ridges: [
        { x: -26, z: 118, len: 70, rot: -0.36, count: 11, scale: 0.8, style: 'snow' },
        { x: 118, z: -82, len: 58, rot: 0.62, count: 9, scale: 0.82, style: 'snow' }
      ],
      groves: [
        { x: -98, z: 98, rx: 32, rz: 24, count: 34, style: 'snow', bushes: 8 },
        { x: 86, z: -126, rx: 30, rz: 22, count: 28, style: 'snow', bushes: 6 }
      ],
      campScenes: [
        { x: 112, z: 106, rot: -0.35, style: 'snow', name: '雪原警戒营地' },
        { x: -84, z: 44, rot: 0.5, style: 'traveler', name: '防寒旅人营地' }
      ],
      campfires: [
        { x: -18, z: 118, rot: 0.2 },
        { x: 124, z: -22, rot: -0.6 }
      ]
    },
    volcano: {
      hills: [
        { x: -126, z: -104, r: 12, h: 3.0, color: 0x7a4a35, label: '熔岩断坡' },
        { x: 132, z: 86, r: 11, h: 2.8, color: 0x6a382c, label: '焦岩脊' }
      ],
      ridges: [
        { x: -112, z: 38, len: 72, rot: 0.26, count: 11, scale: 0.95, style: 'lava' },
        { x: 112, z: -118, len: 64, rot: -0.58, count: 10, scale: 0.9, style: 'lava' }
      ],
      groves: [
        { x: -144, z: 118, rx: 26, rz: 18, count: 20, style: 'burnt', bushes: 4 },
        { x: 72, z: 138, rx: 22, rz: 16, count: 16, style: 'burnt', bushes: 4 }
      ],
      campScenes: [
        { x: 104, z: 58, rot: 0.8, style: 'lava', name: '废矿火蜥蜴营地' },
        { x: -74, z: -118, rot: -0.3, style: 'ruin', name: '鼓隆废矿休息点' }
      ],
      campfires: [
        { x: 30, z: 116, rot: 0.6, color: 0xff5522 },
        { x: -126, z: 42, rot: -0.7, color: 0xff5522 }
      ]
    },
    desert: {
      hills: [
        { x: -132, z: 112, r: 14, h: 2.6, color: 0xd9b96b, label: '沙丘背坡' },
        { x: 118, z: -136, r: 13, h: 2.4, color: 0xd0aa5f, label: '风蚀沙丘' }
      ],
      ridges: [
        { x: -118, z: -38, len: 72, rot: 0.66, count: 10, scale: 0.84, style: 'sand' },
        { x: 142, z: 78, len: 62, rot: -0.42, count: 9, scale: 0.78, style: 'sand' }
      ],
      groves: [
        { x: -108, z: 42, rx: 28, rz: 20, count: 20, style: 'palm', bushes: 10 },
        { x: -152, z: 106, rx: 24, rz: 18, count: 18, style: 'cactus', bushes: 4 }
      ],
      campScenes: [
        { x: -108, z: 42, rot: -0.2, style: 'desert', name: '绿洲蜥蜴营地' },
        { x: 28, z: -154, rot: 0.55, style: 'ruin', name: '龙骨阴影营地' }
      ],
      campfires: [
        { x: 72, z: 112, rot: 0.4 },
        { x: -42, z: -124, rot: -0.7 }
      ]
    },
    castle: {
      hills: [
        { x: -86, z: 64, r: 9, h: 2.3, color: 0x54544d, label: '王城残坡' },
        { x: 108, z: 116, r: 10, h: 2.6, color: 0x4f4c4a, label: '魔气残墙' }
      ],
      ridges: [
        { x: -108, z: -88, len: 62, rot: -0.2, count: 10, scale: 0.86, style: 'castle' },
        { x: 88, z: 44, len: 58, rot: 0.7, count: 9, scale: 0.84, style: 'castle' }
      ],
      groves: [
        { x: -122, z: 104, rx: 26, rz: 18, count: 16, style: 'dead', bushes: 8 },
        { x: 118, z: -118, rx: 24, rz: 18, count: 14, style: 'dead', bushes: 6 }
      ],
      campScenes: [
        { x: 0, z: 128, rot: 0.1, style: 'castle', name: '守护者警戒废营' },
        { x: -96, z: -106, rot: -0.35, style: 'ruin', name: '王城船坞废营' }
      ],
      campfires: [
        { x: -122, z: 30, rot: 0.4 },
        { x: 72, z: -86, rot: -0.5 }
      ]
    }
  },

  _addHill(world, def) {
    if (!AssetFactory.createSlopeHill) return;
    const hill = AssetFactory.createSlopeHill(def.r || 7, def.h || 1.6, def.color || 0x6f9650);
    hill.position.set(def.x, 0, def.z);
    world.scene.add(hill);
    world.addSlopeZone(def.x, def.z, def.r || 7, def.h || 1.6);
    if (typeof ExplorationSystem !== 'undefined') {
      ExplorationSystem.addClimbSpot(world, {
        x: def.x, z: def.z,
        radius: (def.r || 7) + 1,
        height: (def.h || 1.6) + 0.6,
        label: def.label || '可攀爬地形'
      });
    }
  },

  _addRidge(world, def) {
    const count = this._budgetCount(def.count || 8, 2);
    const len = def.len || 48;
    const rot = def.rot || 0;
    const tangent = new THREE.Vector3(Math.cos(rot), 0, Math.sin(rot));
    const normal = new THREE.Vector3(-Math.sin(rot), 0, Math.cos(rot));
    for (let i = 0; i < count; i++) {
      const t = count <= 1 ? 0 : (i / (count - 1) - 0.5) * len;
      const wobble = Math.sin(i * 1.7) * 2.2;
      const scale = (def.scale || 0.8) * (0.78 + (i % 3) * 0.18);
      const rock = (AssetFactory.createCliff && i % 4 === 1)
        ? AssetFactory.createCliff(scale * 0.7)
        : AssetFactory.createRock(scale);
      rock.position.copy(new THREE.Vector3(def.x, 0, def.z).addScaledVector(tangent, t).addScaledVector(normal, wobble));
      rock.rotation.y = rot + (i % 2 ? 0.4 : -0.25);
      this._tintObject(rock, this._ridgeColor(def.style));
      world.addProp(rock, !!rock.userData.collisionRadius);
    }
  },

  _addGrove(world, def) {
    const count = this._budgetCount(def.count || 20, 3);
    for (let i = 0; i < count; i++) {
      const p = this._ellipsePoint(def.x, def.z, def.rx || 20, def.rz || 14);
      if (this._nearSpawn(world, p.x, p.z, 8)) continue;
      const tree = this._createStyledTree(def.style, i);
      const s = 0.82 + Math.random() * 0.5;
      tree.scale.setScalar(s);
      tree.rotation.y = Math.random() * Math.PI * 2;
      tree.position.set(p.x, 0, p.z);
      world.addProp(tree, !!tree.userData.collisionRadius);
    }
    const bushes = this._budgetCount(def.bushes || 0, 0);
    for (let i = 0; i < bushes; i++) {
      const p = this._ellipsePoint(def.x, def.z, (def.rx || 20) * 0.9, (def.rz || 14) * 0.9);
      const bush = def.style === 'desert' || def.style === 'palm' || def.style === 'cactus'
        ? AssetFactory.createRock(0.25 + Math.random() * 0.25)
        : AssetFactory.createBush();
      bush.position.set(p.x, 0, p.z);
      bush.scale.setScalar(0.75 + Math.random() * 0.45);
      world.addProp(bush, !!bush.userData.collisionRadius);
    }
  },

  _addCampScene(world, def) {
    const g = new THREE.Group();
    g.position.set(def.x, 0, def.z);
    g.rotation.y = def.rot || 0;
    g.userData.kind = 'camp-scene';
    g.userData.perfCull = true;

    const fire = AssetFactory.createCampfire();
    fire.position.set(0, 0, 0);
    g.add(fire);

    const ground = this._flatDisc(def.style);
    ground.position.y = 0.025;
    g.add(ground);

    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.4;
      const seat = this._logSeat();
      seat.position.set(Math.cos(a) * 1.65, 0.22, Math.sin(a) * 1.65);
      seat.rotation.y = a + Math.PI / 2;
      g.add(seat);
    }

    const tent = this._tent(def.style);
    tent.position.set(-2.7, 0, 1.9);
    tent.rotation.y = -0.55;
    g.add(tent);

    const rack = this._weaponRack(def.style);
    rack.position.set(2.7, 0, -1.8);
    rack.rotation.y = 0.45;
    g.add(rack);

    for (let i = 0; i < 4; i++) {
      const crate = this._crate(def.style);
      crate.position.set(-3.2 + (i % 2) * 0.55, 0.26, -2.1 + Math.floor(i / 2) * 0.55);
      crate.rotation.y = Math.random() * 0.4;
      g.add(crate);
    }

    for (let i = 0; i < 5; i++) {
      const fence = this._stake(def.style);
      const a = -1.1 + i * 0.55;
      fence.position.set(Math.cos(a) * 4.2, 0.55, Math.sin(a) * 3.3);
      fence.rotation.y = a + Math.PI / 2;
      g.add(fence);
    }

    world.scene.add(g);
    if (!world.campScenes) world.campScenes = [];
    world.campScenes.push(g);
    if (typeof ExplorationSystem !== 'undefined') {
      ExplorationSystem.addCamp(world, {
        name: def.name || '怪物营地',
        x: def.x,
        z: def.z,
        radius: def.radius || 18,
        alarmRadius: def.alarmRadius || 8.5,
        barrelAngle: (def.rot || 0) + Math.PI * 0.58
      });
    }
  },

  _addCampfireRest(world, def) {
    const g = new THREE.Group();
    g.position.set(def.x, 0, def.z);
    g.rotation.y = def.rot || 0;
    g.userData.perfCull = true;
    const fire = AssetFactory.createCampfire();
    g.add(fire);
    for (let i = 0; i < 2; i++) {
      const seat = this._logSeat();
      seat.position.set(i ? 1.15 : -1.15, 0.22, 0.75);
      seat.rotation.y = Math.PI * (i ? 0.58 : 0.42);
      g.add(seat);
    }
    const pack = this._crate('traveler');
    pack.scale.set(0.65, 0.55, 0.65);
    pack.position.set(0.95, 0.22, -1.15);
    g.add(pack);
    world.scene.add(g);
  },

  _createStyledTree(style, i = 0) {
    if (style === 'pine') return AssetFactory.createPine();
    if (style === 'snow') return AssetFactory.createSnowTree ? AssetFactory.createSnowTree() : AssetFactory.createPine();
    if (style === 'palm') return this._palmTree();
    if (style === 'cactus') return AssetFactory.createCactus ? AssetFactory.createCactus() : AssetFactory.createRock(0.6);
    if (style === 'burnt' || style === 'dead') return this._deadTree(style === 'burnt');
    if (style === 'ancient') return this._ancientTree();
    if (style === 'dark') {
      const tree = i % 3 === 0 && AssetFactory.createBigTree ? AssetFactory.createBigTree() : AssetFactory.createTree();
      this._tintObject(tree, 0x345f35);
      return tree;
    }
    if (style === 'birch') return this._birchTree();
    if (style === 'mixed') {
      if (i % 5 === 0 && AssetFactory.createBigTree) return AssetFactory.createBigTree();
      if (i % 3 === 0 && AssetFactory.createPine) return AssetFactory.createPine();
    }
    return AssetFactory.createTree();
  },

  _ancientTree() {
    const t = AssetFactory.createBigTree ? AssetFactory.createBigTree() : AssetFactory.createTree();
    t.scale.set(1.18, 1.08, 1.18);
    const vineMat = new THREE.MeshStandardMaterial({ color: 0x2f6b35, roughness: 0.9 });
    for (let i = 0; i < 4; i++) {
      const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 2.4, 5), vineMat);
      const a = i * Math.PI * 0.5;
      vine.position.set(Math.cos(a) * 0.34, 1.4, Math.sin(a) * 0.34);
      vine.rotation.z = Math.cos(a) * 0.22;
      vine.rotation.x = -Math.sin(a) * 0.22;
      t.add(vine);
    }
    return t;
  },

  _birchTree() {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.2, 2.2, 7),
      new THREE.MeshStandardMaterial({ color: 0xe7e1cc, roughness: 0.9, flatShading: false })
    );
    trunk.position.y = 1.1;
    g.add(trunk);
    const markMat = new THREE.MeshBasicMaterial({ color: 0x25231e });
    for (let i = 0; i < 5; i++) {
      const mark = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.035, 0.012), markMat);
      mark.position.set(0, 0.42 + i * 0.35, 0.135);
      mark.rotation.y = i * 1.7;
      g.add(mark);
    }
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x93b85e, roughness: 0.9 });
    for (let i = 0; i < 3; i++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.92 - i * 0.12, 7, 5), leafMat);
      leaf.position.set((i - 1) * 0.28, 2.25 + i * 0.24, (i % 2) * 0.22);
      leaf.scale.y = 0.75;
      g.add(leaf);
    }
    g.userData.collisionRadius = 0.62;
    g.userData.kind = 'tree-birch';
    return g;
  },

  _palmTree() {
    const g = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8a6139, roughness: 0.92, flatShading: true });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 2.8, 7), trunkMat);
    trunk.position.y = 1.4;
    trunk.rotation.z = 0.12;
    g.add(trunk);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f8f4b, roughness: 0.88, side: THREE.DoubleSide });
    for (let i = 0; i < 7; i++) {
      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 1.9), leafMat);
      const a = (i / 7) * Math.PI * 2;
      leaf.position.set(Math.cos(a) * 0.45, 2.9, Math.sin(a) * 0.45);
      leaf.rotation.set(-0.82, a, 0);
      g.add(leaf);
    }
    g.userData.collisionRadius = 0.58;
    g.userData.kind = 'palm';
    return g;
  },

  _deadTree(burnt = false) {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: burnt ? 0x231915 : 0x5c5448, roughness: 0.96, flatShading: true });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.28, 2.2, 6), mat);
    trunk.position.y = 1.1;
    trunk.rotation.z = (Math.random() - 0.5) * 0.18;
    g.add(trunk);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.08, 0.95, 5), mat);
      branch.position.set(Math.cos(a) * 0.2, 1.45 + i * 0.15, Math.sin(a) * 0.2);
      branch.rotation.z = Math.cos(a) * 0.9;
      branch.rotation.x = -Math.sin(a) * 0.9;
      g.add(branch);
    }
    g.userData.collisionRadius = 0.48;
    g.userData.kind = burnt ? 'burnt-tree' : 'dead-tree';
    return g;
  },

  _flatDisc(style) {
    const color = {
      snow: 0xdde7ec, desert: 0xc89f55, lava: 0x4a2a22, castle: 0x454545, ruin: 0x5e5a50
    }[style] || 0x5b5a3e;
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(4.4, 18),
      new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.55, roughness: 0.98 })
    );
    disc.rotation.x = -Math.PI / 2;
    return disc;
  },

  _tent(style) {
    const color = {
      desert: 0xb98a48, snow: 0xb8c9d4, lava: 0x4d2c25, castle: 0x4c4750, ruin: 0x736b5b, traveler: 0x486a74
    }[style] || 0x744a2f;
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.86, flatShading: true });
    const body = new THREE.Mesh(new THREE.ConeGeometry(1.05, 1.25, 4), mat);
    body.position.y = 0.62;
    body.rotation.y = Math.PI / 4;
    body.scale.z = 1.45;
    g.add(body);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.55, 5), new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.9 }));
    pole.position.y = 0.78;
    g.add(pole);
    return g;
  },

  _weaponRack(style) {
    const g = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: style === 'castle' ? 0x35302a : 0x6a4428, roughness: 0.9 });
    for (let x of [-0.35, 0.35]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.15, 5), wood);
      post.position.set(x, 0.58, 0);
      g.add(post);
    }
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 5), wood);
    bar.rotation.z = Math.PI / 2;
    bar.position.y = 0.96;
    g.add(bar);
    const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.15, 5), new THREE.MeshStandardMaterial({ color: 0x9d8b62, roughness: 0.7 }));
    spear.position.set(0.05, 0.7, 0.08);
    spear.rotation.z = 0.25;
    g.add(spear);
    return g;
  },

  _crate(style) {
    const mat = new THREE.MeshStandardMaterial({ color: style === 'snow' ? 0x6d5f4f : 0x684529, roughness: 0.9, flatShading: true });
    return new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.42, 0.46), mat);
  },

  _stake(style) {
    const mat = new THREE.MeshStandardMaterial({ color: style === 'castle' ? 0x333333 : 0x5a351f, roughness: 0.9, flatShading: true });
    const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 1.05, 5), mat);
    stake.rotation.z = (Math.random() - 0.5) * 0.2;
    return stake;
  },

  _logSeat() {
    const log = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.18, 1.15, 7),
      new THREE.MeshStandardMaterial({ color: 0x604021, roughness: 0.94, flatShading: true })
    );
    log.rotation.z = Math.PI / 2;
    return log;
  },

  _ellipsePoint(cx, cz, rx, rz) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random());
    return {
      x: cx + Math.cos(a) * rx * r,
      z: cz + Math.sin(a) * rz * r
    };
  },

  _nearSpawn(world, x, z, dist) {
    const s = world.spawnPoint || { x: 0, z: 0 };
    return Math.hypot(x - s.x, z - s.z) < dist;
  },

  _ridgeColor(style) {
    return {
      snow: 0xd8e2e8,
      lava: 0x4a221e,
      sand: 0xcaa15a,
      castle: 0x4c4c4c,
      moss: 0x66745a
    }[style] || null;
  },

  _tintObject(obj, color) {
    if (!obj || !color) return;
    obj.traverse(c => {
      if (c.isMesh && c.material && c.material.color) c.material.color.lerp(new THREE.Color(color), 0.35);
    });
  },

  _detailFactor() {
    const level = (typeof VisualQualitySystem !== 'undefined' && VisualQualitySystem.level) || 'medium';
    const touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (touch || level === 'low') return 0.2;
    if (level === 'medium') return 0.38;
    if (level === 'ultra') return 1;
    return 0.62;
  },

  _budgetCount(count, min = 1) {
    if (!count) return 0;
    return Math.max(min, Math.round(count * this._detailFactor()));
  }
};

if (typeof window !== 'undefined') window.WorldExpansionSystem = WorldExpansionSystem;
