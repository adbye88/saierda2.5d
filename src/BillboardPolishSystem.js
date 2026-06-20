/* ========================================================
   BillboardPolishSystem.js — 低成本透明贴片细节层
   草丛、花、芦苇、雪晶、沙尘、火星、怨念与古代微光
   ======================================================== */

const BillboardPolishSystem = {
  _game: null,
  _activeWorld: null,
  radius: 34,
  presets: {
    grassland: {
      count: 54,
      sprites: [
        { name: 'grass-clump', weight: 7, size: [1.1, 1.55], y: 0.72, tint: 0xffffff },
        { name: 'flower-patch', weight: 3, size: [0.82, 1.05], y: 0.42, tint: 0xffffff },
        { name: 'ancient-sparkle', weight: 1, size: [0.72, 1.05], y: 1.55, tint: 0x9eeeff, glow: true }
      ]
    },
    forest: {
      count: 66,
      sprites: [
        { name: 'grass-clump', weight: 5, size: [1.18, 1.75], y: 0.78, tint: 0xd8ffd0 },
        { name: 'flower-patch', weight: 2, size: [0.78, 1.02], y: 0.42, tint: 0xffffff },
        { name: 'ancient-sparkle', weight: 2, size: [0.72, 1.12], y: 1.58, tint: 0x99ffcc, glow: true }
      ]
    },
    highland: {
      count: 46,
      sprites: [
        { name: 'grass-clump', weight: 5, size: [0.95, 1.35], y: 0.62, tint: 0xf3ffd2 },
        { name: 'flower-patch', weight: 1, size: [0.72, 0.95], y: 0.38, tint: 0xffffff },
        { name: 'reed-cluster', weight: 2, size: [0.95, 1.65], y: 0.82, tint: 0xf5e7a8 }
      ]
    },
    snowland: {
      count: 46,
      sprites: [
        { name: 'snow-crystal', weight: 5, size: [0.62, 1.08], y: 0.95, tint: 0xdff8ff, glow: true },
        { name: 'ancient-sparkle', weight: 1, size: [0.72, 1.05], y: 1.55, tint: 0xcff7ff, glow: true }
      ]
    },
    volcano: {
      count: 50,
      sprites: [
        { name: 'ember-cluster', weight: 7, size: [0.55, 1.12], y: 1.05, tint: 0xffaa66, glow: true },
        { name: 'malice-wisp', weight: 1, size: [0.8, 1.35], y: 1.18, tint: 0xff88ff, glow: true }
      ]
    },
    desert: {
      count: 48,
      sprites: [
        { name: 'sand-swirl', weight: 7, size: [1.05, 1.75], y: 0.65, tint: 0xffdf9a },
        { name: 'reed-cluster', weight: 2, size: [0.82, 1.5], y: 0.75, tint: 0xe6c27a }
      ]
    },
    dungeon: {
      count: 34,
      sprites: [
        { name: 'ancient-sparkle', weight: 5, size: [0.82, 1.22], y: 1.45, tint: 0x88dfff, glow: true },
        { name: 'malice-wisp', weight: 1, size: [0.78, 1.28], y: 1.1, tint: 0xcc88ff, glow: true }
      ]
    },
    castle: {
      count: 56,
      sprites: [
        { name: 'malice-wisp', weight: 5, size: [0.95, 1.65], y: 1.1, tint: 0xd06cff, glow: true },
        { name: 'ember-cluster', weight: 2, size: [0.62, 1.18], y: 1.1, tint: 0xff8866, glow: true },
        { name: 'ancient-sparkle', weight: 1, size: [0.76, 1.16], y: 1.5, tint: 0x99eaff, glow: true }
      ]
    }
  },

  init(game) {
    this._game = game;
    this.applyWorld(game && game.currentWorld);
  },

  applyWorld(world) {
    if (!world || !world.scene) return;
    this._activeWorld = world;
    this._ensure(world);
  },

  update(dt, game) {
    if (!this._game && game) this._game = game;
    const world = game && game.currentWorld;
    if (!world || !world.scene || !game.player) return;
    if (world !== this._activeWorld) this.applyWorld(world);
    const layer = world._billboardPolishLayer;
    if (!layer) return;
    const quality = (typeof VisualQualitySystem !== 'undefined' && VisualQualitySystem.level) || 'high';
    const qualityMul = quality === 'low' ? 0.32 : quality === 'medium' ? 0.58 : quality === 'ultra' ? 1.15 : 1;
    const activeCount = Math.max(8, Math.floor(layer.items.length * qualityMul));
    const player = game.player.position;
    const camera = game.camera;
    const t = performance.now() * 0.001;
    for (let i = 0; i < layer.items.length; i++) {
      const item = layer.items[i];
      const mesh = item.mesh;
      mesh.visible = i < activeCount;
      if (!mesh.visible) continue;
      const dx = mesh.position.x - player.x;
      const dz = mesh.position.z - player.z;
      if (Math.hypot(dx, dz) > this.radius * 1.22) {
        this._placeItem(world, item, player.x, player.z);
      }
      if (camera) mesh.quaternion.copy(camera.quaternion);
      const sway = Math.sin(t * item.speed + item.seed) * item.sway;
      mesh.scale.set(item.baseScale.x * (1 + sway * 0.12), item.baseScale.y * (1 - sway * 0.08), 1);
      if (item.glow) mesh.material.opacity = item.baseOpacity * (0.72 + Math.sin(t * item.speed + item.seed) * 0.18);
    }
  },

  _ensure(world) {
    if (world._billboardPolishLayer) return;
    const preset = this.presets[world.name] || this.presets.grassland;
    const group = new THREE.Group();
    group.name = 'billboard-polish-layer';
    group.renderOrder = 4;
    const items = [];
    const center = world.spawnPoint || { x: 0, z: 0 };
    for (let i = 0; i < preset.count; i++) {
      const spec = this._chooseSpec(preset.sprites);
      const mesh = this._createMesh(spec);
      const item = {
        mesh,
        spec,
        seed: Math.random() * Math.PI * 2,
        speed: 0.85 + Math.random() * 0.9,
        sway: spec.glow ? 0.08 : 0.16 + Math.random() * 0.14,
        glow: !!spec.glow,
        baseOpacity: mesh.material.opacity,
        baseScale: mesh.scale.clone()
      };
      this._placeItem(world, item, center.x, center.z);
      group.add(mesh);
      items.push(item);
    }
    world.scene.add(group);
    world._billboardPolishLayer = { group, items, preset };
  },

  _chooseSpec(specs) {
    const total = specs.reduce((sum, s) => sum + (s.weight || 1), 0);
    let r = Math.random() * total;
    for (const spec of specs) {
      r -= spec.weight || 1;
      if (r <= 0) return spec;
    }
    return specs[0];
  },

  _createMesh(spec) {
    const tex = (typeof ArtAssets !== 'undefined') ? ArtAssets.billboardTexture(spec.name) : null;
    const mat = new THREE.MeshBasicMaterial({
      color: spec.tint || 0xffffff,
      map: tex,
      transparent: true,
      opacity: spec.glow ? 0.82 : 0.9,
      alphaTest: 0.035,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: spec.glow ? THREE.AdditiveBlending : THREE.NormalBlending
    });
    const geo = new THREE.PlaneGeometry(1, 1);
    const mesh = new THREE.Mesh(geo, mat);
    const size = spec.size || [1, 1];
    const s = size[0] + Math.random() * (size[1] - size[0]);
    mesh.scale.set(s, s, 1);
    mesh.userData.kind = 'billboardPolish';
    return mesh;
  },

  _placeItem(world, item, cx, cz) {
    const r = Math.sqrt(Math.random()) * this.radius;
    const a = Math.random() * Math.PI * 2;
    let x = cx + Math.cos(a) * r;
    let z = cz + Math.sin(a) * r;
    for (let tries = 0; tries < 8; tries++) {
      const terrain = world.getTerrainAt ? world.getTerrainAt(x, z) : null;
      if (!terrain || !terrain.inWater || item.spec.name === 'reed-cluster') break;
      x = cx + Math.cos(Math.random() * Math.PI * 2) * Math.sqrt(Math.random()) * this.radius;
      z = cz + Math.sin(Math.random() * Math.PI * 2) * Math.sqrt(Math.random()) * this.radius;
    }
    const terrain = world.getTerrainAt ? world.getTerrainAt(x, z) : null;
    const groundY = terrain && terrain.slope ? terrain.slope.height : 0;
    item.mesh.position.set(x, groundY + (item.spec.y || 0.7), z);
  }
};

if (typeof window !== 'undefined') window.BillboardPolishSystem = BillboardPolishSystem;
