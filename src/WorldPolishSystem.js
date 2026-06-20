/* ========================================================
   WorldPolishSystem.js — 地图氛围与环境动态
   职责：区域粒子、空气感、水面/熔岩/瀑布微动
   ======================================================== */

const WorldPolishSystem = {
  _game: null,
  _activeWorld: null,

  presets: {
    grassland: { count: 70, color: 0xb8ff8a, size: 0.13, opacity: 0.34, radius: 34, minY: 1.2, maxY: 8.5, fall: -0.08, drift: 0.28, kind: 'motes' },
    forest:    { count: 90, color: 0x8cff8a, size: 0.16, opacity: 0.4,  radius: 30, minY: 0.8, maxY: 7.5, fall: -0.05, drift: 0.18, kind: 'fireflies' },
    highland:  { count: 90, color: 0xc8f7ff, size: 0.12, opacity: 0.3,  radius: 38, minY: 1.5, maxY: 10,  fall: -0.04, drift: 0.42, kind: 'mist' },
    snowland:  { count: 120,color: 0xffffff, size: 0.12, opacity: 0.58, radius: 34, minY: 2.0, maxY: 12,  fall: -1.15, drift: 0.45, kind: 'snow' },
    volcano:   { count: 95, color: 0xff8840, size: 0.15, opacity: 0.52, radius: 36, minY: 0.5, maxY: 8.5, fall: 0.42, drift: 0.32, kind: 'embers' },
    desert:    { count: 95, color: 0xffd48a, size: 0.11, opacity: 0.32, radius: 42, minY: 0.4, maxY: 5.5, fall: -0.02, drift: 0.72, kind: 'sand' },
    dungeon:   { count: 65, color: 0x99ccff, size: 0.11, opacity: 0.24, radius: 24, minY: 0.5, maxY: 5.8, fall: -0.03, drift: 0.14, kind: 'dust' },
    castle:    { count: 100,color: 0xbb66ff, size: 0.14, opacity: 0.38, radius: 34, minY: 0.8, maxY: 9.0, fall: 0.08, drift: 0.22, kind: 'malice' }
  },

  init(game) {
    this._game = game;
    this.applyWorld(game && game.currentWorld);
  },

  applyWorld(world) {
    if (!world || !world.scene) return;
    this._activeWorld = world;
    this._ensureAmbientFx(world);
    this._cacheSurfaceItems(world);
  },

  update(dt, game) {
    if (!this._game && game) this._game = game;
    const world = game && game.currentWorld;
    if (!world || !world.scene) return;
    if (world !== this._activeWorld) this.applyWorld(world);
    this._updateAmbientFx(dt, world, game && game.player);
    this._updateSurfaceMotion(dt, world);
  },

  _ensureAmbientFx(world) {
    if (world._worldPolishFx) return;
    const preset = this.presets[world.name] || this.presets.grassland;
    const group = new THREE.Group();
    group.name = 'world-polish-fx';
    group.renderOrder = 2;

    const positions = new Float32Array(preset.count * 3);
    const seeds = new Float32Array(preset.count * 4);
    const center = world.spawnPoint || { x: 0, z: 0 };
    for (let i = 0; i < preset.count; i++) {
      this._spawnParticle(positions, seeds, i, preset, center.x, center.z, true);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: preset.color,
      size: preset.size,
      transparent: true,
      opacity: preset.opacity,
      depthWrite: false,
      blending: preset.kind === 'embers' || preset.kind === 'fireflies' || preset.kind === 'malice'
        ? THREE.AdditiveBlending
        : THREE.NormalBlending
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    group.add(points);
    world.scene.add(group);
    world._worldPolishFx = { group, points, geo, mat, positions, seeds, preset };
  },

  _spawnParticle(positions, seeds, i, preset, cx, cz, initial) {
    const r = Math.sqrt(Math.random()) * preset.radius;
    const a = Math.random() * Math.PI * 2;
    const y = preset.minY + Math.random() * (preset.maxY - preset.minY);
    positions[i * 3] = cx + Math.cos(a) * r;
    positions[i * 3 + 1] = initial ? y : preset.maxY - Math.random() * 1.5;
    positions[i * 3 + 2] = cz + Math.sin(a) * r;
    seeds[i * 4] = Math.random() * Math.PI * 2;
    seeds[i * 4 + 1] = 0.6 + Math.random() * 0.8;
    seeds[i * 4 + 2] = (Math.random() - 0.5) * preset.drift;
    seeds[i * 4 + 3] = (Math.random() - 0.5) * preset.drift;
  },

  _updateAmbientFx(dt, world, player) {
    const fx = world._worldPolishFx;
    if (!fx || !fx.positions) return;
    const quality = (typeof VisualQualitySystem !== 'undefined' && VisualQualitySystem.level) || 'high';
    const qualityMul = quality === 'low' ? 0.35 : quality === 'medium' ? 0.65 : 1;
    const activeCount = Math.max(8, Math.floor(fx.preset.count * qualityMul));
    fx.geo.setDrawRange(0, activeCount);
    const p = player && player.position ? player.position : { x: world.spawnPoint.x, z: world.spawnPoint.z };
    const pos = fx.positions;
    const seeds = fx.seeds;
    const preset = fx.preset;
    const t = performance.now() * 0.001;
    for (let i = 0; i < activeCount; i++) {
      const idx = i * 3;
      const seed = seeds[i * 4];
      const amp = seeds[i * 4 + 1];
      const vx = seeds[i * 4 + 2];
      const vz = seeds[i * 4 + 3];
      const swirl = Math.sin(t * (0.8 + amp) + seed) * preset.drift * 0.45;
      pos[idx] += (vx + swirl) * dt;
      pos[idx + 2] += (vz + Math.cos(t + seed) * preset.drift * 0.22) * dt;
      pos[idx + 1] += preset.fall * amp * dt;

      const dx = pos[idx] - p.x;
      const dz = pos[idx + 2] - p.z;
      const far = Math.hypot(dx, dz) > preset.radius * 1.22;
      const outY = preset.fall >= 0
        ? pos[idx + 1] > preset.maxY + 0.8
        : pos[idx + 1] < preset.minY - 0.6;
      if (far || outY) {
        this._spawnParticle(pos, seeds, i, preset, p.x, p.z, preset.fall >= 0);
        if (preset.fall >= 0) pos[idx + 1] = preset.minY + Math.random() * 1.2;
      }
    }
    fx.geo.attributes.position.needsUpdate = true;

    if (preset.kind === 'fireflies' || preset.kind === 'embers' || preset.kind === 'malice') {
      fx.mat.opacity = preset.opacity * (0.75 + Math.sin(t * 1.8) * 0.18);
    } else {
      fx.mat.opacity = preset.opacity;
    }
  },

  _updateSurfaceMotion(dt, world) {
    const t = performance.now() * 0.001;
    const surfaces = world._worldPolishSurfaces || this._cacheSurfaceItems(world);
    for (const item of surfaces.rivers) {
      const mat = item.material;
      if (!mat) continue;
      if (mat.map) {
        mat.map.offset.x += dt * 0.015;
        mat.map.offset.y += dt * 0.035;
      }
      mat.opacity = 0.58 + Math.sin(t * 1.3 + item.phase) * 0.08;
    }
    for (const item of surfaces.waterfalls) {
      if (item.fall && item.fall.material) item.fall.material.opacity = 0.52 + Math.sin(t * 2.8 + item.phase) * 0.08;
      if (item.mist && item.mist.material) item.mist.material.opacity = 0.26 + Math.sin(t * 2.1 + item.phase) * 0.09;
    }
    for (const obj of surfaces.lavaRocks) obj.rotation.y += dt * 0.04;
    if (world.lava && world.lava.material) {
      if (world.lava.material.map) {
        world.lava.material.map.offset.x += dt * 0.02;
        world.lava.material.map.offset.y += dt * 0.03;
      }
      world.lava.material.opacity = 0.66 + Math.sin(t * 2.2) * 0.12;
    }
  },

  _cacheSurfaceItems(world) {
    const surfaces = { rivers: [], waterfalls: [], lavaRocks: [] };
    if (!world || !world.scene) return surfaces;
    world.scene.traverse(obj => {
      if (!obj || !obj.userData) return;
      const parts = obj.userData.parts || {};
      if (obj.userData.kind === 'river' && parts.water && parts.water.material) {
        surfaces.rivers.push({ material: parts.water.material, phase: obj.position ? obj.position.x : Math.random() * 10 });
      } else if (obj.userData.kind === 'waterfall') {
        surfaces.waterfalls.push({ fall: parts.fall, mist: parts.mist, phase: obj.position ? obj.position.y : Math.random() * 10 });
      } else if (obj.userData.kind === 'lavaRock') {
        surfaces.lavaRocks.push(obj);
      }
    });
    world._worldPolishSurfaces = surfaces;
    return surfaces;
  }
};

if (typeof window !== 'undefined') window.WorldPolishSystem = WorldPolishSystem;
