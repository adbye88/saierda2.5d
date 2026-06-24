/* ========================================================
   ArtDirectionSystem.js — 美术总监层
   目标：把 Three.js demo 感压下去，统一地面、光照、雾、水面与地表细节。
   优先级：视觉完成度 > 功能数量。
   ======================================================== */

const ArtDirectionSystem = {
  _game: null,
  _dummy: null,
  _waterSurfaces: [],

  presets: {
    grassland: {
      fog: 0xb9d7c2, density: 0.0048, sky: 0xbfe2ff,
      hemiSky: 0xd9ecff, hemiGround: 0x6d7250, sun: 0xffe4b0,
      ground: ['#6f8b55', '#7d9a61', '#5d7647', '#8a8b58', '#6c6a42'],
      dirt: '#8b704d', grass: '#5f8a4a', flower: ['#f2d06b', '#e8f0d8', '#c9ddff'],
      grassCount: 760, flowerCount: 76, pebbleCount: 108, patchCount: 16
    },
    forest: {
      fog: 0x89a887, density: 0.0072, sky: 0x9cc7d7,
      hemiSky: 0xc2e6d0, hemiGround: 0x25311f, sun: 0xd8f0a8,
      ground: ['#3f5c36', '#4f7042', '#31472f', '#5d5c34', '#2f3e2a'],
      dirt: '#62513a', grass: '#3e7440', flower: ['#95e690', '#d0f0a8', '#8ee8ff'],
      grassCount: 980, flowerCount: 48, pebbleCount: 90, patchCount: 12
    },
    highland: {
      fog: 0xaec6c0, density: 0.0055, sky: 0xc4def0,
      hemiSky: 0xd6efff, hemiGround: 0x6a6c54, sun: 0xffe1aa,
      ground: ['#74845a', '#879765', '#647551', '#8c8055', '#5b6548'],
      dirt: '#8a7452', grass: '#6e8c4f', flower: ['#fff1a8', '#c7e9ff', '#f0d6ff'],
      grassCount: 720, flowerCount: 78, pebbleCount: 140, patchCount: 15
    },
    snowland: {
      fog: 0xd9edf8, density: 0.0065, sky: 0xd6f2ff,
      hemiSky: 0xffffff, hemiGround: 0x8aa6b5, sun: 0xf3fbff,
      ground: ['#d8e7e8', '#eef6f5', '#bfd2d5', '#d6dcd0', '#aebdc4'],
      dirt: '#aab0a7', grass: '#b8d0c8', flower: ['#dff8ff', '#ffffff', '#b8d8ff'],
      grassCount: 280, flowerCount: 16, pebbleCount: 156, patchCount: 10
    },
    volcano: {
      fog: 0x9a5f45, density: 0.0062, sky: 0xcf8a62,
      hemiSky: 0xffb077, hemiGround: 0x2b1e1a, sun: 0xffb15c,
      ground: ['#5c3b31', '#704636', '#422c28', '#8a4f36', '#2f2422'],
      dirt: '#3f2d28', grass: '#6f4b2c', flower: ['#ff7842', '#ffaa55', '#ffd180'],
      grassCount: 130, flowerCount: 22, pebbleCount: 220, patchCount: 14
    },
    desert: {
      fog: 0xe9cf94, density: 0.0049, sky: 0xf1d7a4,
      hemiSky: 0xffedc0, hemiGround: 0xa17b47, sun: 0xffd38b,
      ground: ['#c9a764', '#d7b875', '#b99552', '#ead092', '#a98245'],
      dirt: '#b18a50', grass: '#8e9b5a', flower: ['#fff0a8', '#ffcf70', '#e8fff0'],
      grassCount: 170, flowerCount: 20, pebbleCount: 130, patchCount: 18
    },
    castle: {
      fog: 0x6e6078, density: 0.0068, sky: 0x8f8aa8,
      hemiSky: 0xc7c2e8, hemiGround: 0x2a2430, sun: 0xb9b0ff,
      ground: ['#53534d', '#62615a', '#3f4142', '#736957', '#4a454d'],
      dirt: '#4c4440', grass: '#556044', flower: ['#b76cff', '#6ee6ff', '#e0d0ff'],
      grassCount: 210, flowerCount: 30, pebbleCount: 170, patchCount: 12
    },
    dungeon: {
      fog: 0x23344a, density: 0.010, sky: 0x1b2734,
      hemiSky: 0x6280a0, hemiGround: 0x19161e, sun: 0x88aaff,
      ground: ['#384251', '#2f3745', '#4a4e55', '#26303d', '#53616a'],
      dirt: '#34303a', grass: '#446060', flower: ['#80e8ff', '#b28cff', '#d0ffff'],
      grassCount: 40, flowerCount: 16, pebbleCount: 90, patchCount: 8
    }
  },

  init(game) {
    this._game = game;
    this._dummy = new THREE.Object3D();
    this.applyRenderer(game);
    if (game && game.currentWorld) this.applyWorld(game.currentWorld, game);
  },

  applyRenderer(game) {
    if (!game || !game.renderer) return;
    const r = game.renderer;
    const quality = this._quality();
    const settings = this._qualitySettings();
    const touch = this._isTouchDevice();
    const shadows = !!(settings.shadows && quality !== 'low' && !touch);
    if ('outputColorSpace' in r && THREE.SRGBColorSpace) r.outputColorSpace = THREE.SRGBColorSpace;
    if ('outputEncoding' in r && THREE.sRGBEncoding) r.outputEncoding = THREE.sRGBEncoding;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 0.98;
    // 性能修复：这里曾经无条件重新打开阴影，覆盖了 VisualQualitySystem 的低画质/手机设置。
    // 大量树木和角色都 castShadow 时，手机会直接掉到个位数 FPS。
    r.shadowMap.enabled = shadows;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, settings.renderScale || (touch ? 1 : 1.25)));
    if (game.camera) {
      game.camera.fov = 55;
      game.camera.updateProjectionMatrix();
    }
  },

  applyWorld(world, game = this._game) {
    if (!world || !world.scene || typeof THREE === 'undefined') return;
    const preset = this.presets[world.name] || this.presets.grassland;
    this._applyAtmosphere(world, preset);
    this._polishGround(world, preset);
    this._addGroundDetails(world, preset);
    this._polishWater(world, preset);
    this._softenMaterials(world);
    if (game) this.applyRenderer(game);
  },

  update(dt, game) {
    if (!this._game && game) this._game = game;
    const t = performance.now() * 0.001;
    for (const item of this._waterSurfaces) {
      if (!item || !item.material || !item.material.uniforms) continue;
      item.material.uniforms.uTime.value = t;
    }
  },

  _applyAtmosphere(world, preset) {
    const quality = this._quality();
    const settings = this._qualitySettings();
    const touch = this._isTouchDevice();
    const shadows = !!(settings.shadows && quality !== 'low' && !touch);
    const shadowSize = settings.shadowSize || (quality === 'medium' ? 1024 : 2048);
    world.scene.background = new THREE.Color(preset.sky);
    world.scene.fog = new THREE.FogExp2(preset.fog, preset.density);
    world.scene.traverse(obj => {
      if (!obj.isLight) return;
      if (obj.isHemisphereLight) {
        obj.color.setHex(preset.hemiSky);
        obj.groundColor.setHex(preset.hemiGround);
        obj.intensity = Math.max(obj.intensity || 0, 0.92);
      }
      if (obj.isDirectionalLight) {
        obj.color.setHex(preset.sun);
        obj.intensity = obj === world.sun ? 1.06 : Math.min(obj.intensity || 0.35, 0.36);
        obj.castShadow = shadows && obj === world.sun;
        if (obj.shadow) {
          obj.shadow.mapSize.set(shadowSize, shadowSize);
          obj.shadow.bias = -0.00022;
          obj.shadow.normalBias = 0.045;
          if (obj.shadow.camera) {
            obj.shadow.camera.left = -46;
            obj.shadow.camera.right = 46;
            obj.shadow.camera.top = 46;
            obj.shadow.camera.bottom = -46;
            obj.shadow.camera.near = 0.5;
            obj.shadow.camera.far = 135;
          }
        }
      }
    });
  },

  _polishGround(world, preset) {
    if (!world.ground || world._artGroundPolished) return;
    world._artGroundPolished = true;
    const geo = world.ground.geometry;
    const pos = geo && geo.attributes && geo.attributes.position;
    const influences = this._collectStaticGroundInfluences(world);
    if (pos) {
      const colors = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const n1 = this._fbm(x * 0.026, z * 0.026, 9, 4);
        const n2 = this._fbm(x * 0.072 + 15, z * 0.072 - 8, 33, 3);
        const path = Math.sin(x * 0.035 + z * 0.018) * 0.5 + 0.5;
        const idx = Math.min(preset.ground.length - 1, Math.floor((n1 * 0.62 + n2 * 0.22 + path * 0.16) * preset.ground.length));
        const c = new THREE.Color(preset.ground[idx]);
        const dirtBlend = n1 > 0.61 && n2 > 0.5 ? 0.42 : n1 > 0.68 ? 0.22 : 0;
        if (dirtBlend > 0) c.lerp(new THREE.Color(preset.dirt), dirtBlend);
        const route = this._distanceToRoutes(world, x, z);
        const routeBlend = route < 0.0 ? 0 : THREE.MathUtils.clamp(1 - route / 7.5, 0, 1);
        if (routeBlend > 0) {
          c.lerp(new THREE.Color(preset.dirt), 0.72 * routeBlend);
          c.offsetHSL(0.015, -0.06, -0.035 * routeBlend);
        }
        const waterEdge = this._distanceToWaterZones(world, x, z);
        const wetBlend = waterEdge < 0.0 ? 0 : THREE.MathUtils.clamp(1 - waterEdge / 8.0, 0, 1);
        if (wetBlend > 0) {
          c.lerp(new THREE.Color(world.name === 'grassland' ? 0x5d674a : preset.dirt), 0.46 * wetBlend);
          c.offsetHSL(-0.015, -0.05, -0.035);
        }
        const landmarkBlend = this._distanceToLandmarks(world, x, z);
        if (landmarkBlend > 0) {
          c.lerp(new THREE.Color(preset.dirt), 0.5 * landmarkBlend);
          c.offsetHSL(0.01, -0.04, -0.025);
        }
        const story = this._terrainStoryBlend(world, x, z, preset, influences);
        if (story.camp > 0) {
          c.lerp(new THREE.Color(preset.dirt), 0.64 * story.camp);
          c.offsetHSL(0.012, -0.055 * story.camp, -0.055 * story.camp);
        }
        if (story.treeRoot > 0) {
          const rootShade = world.name === 'snowland' ? 0x9daeb0 : world.name === 'desert' ? 0xa27c45 : 0x334429;
          c.lerp(new THREE.Color(rootShade), 0.30 * story.treeRoot);
          c.offsetHSL(-0.012, -0.045 * story.treeRoot, -0.035 * story.treeRoot);
        }
        if (story.chest > 0) {
          c.lerp(new THREE.Color(world.name === 'castle' ? 0x7b5b45 : 0x9a7844), 0.34 * story.chest);
          c.offsetHSL(0.02, -0.035 * story.chest, -0.025 * story.chest);
        }
        if (story.gravel > 0) {
          c.lerp(new THREE.Color(world.name === 'snowland' ? 0xb9c7c8 : 0x8d8777), 0.26 * story.gravel);
          c.offsetHSL(0, -0.035 * story.gravel, 0.018 * story.gravel);
        }
        if (story.wet > 0) {
          c.lerp(new THREE.Color(world.name === 'snowland' ? 0xa7c7cf : 0x465843), 0.28 * story.wet);
          c.offsetHSL(-0.015, -0.045 * story.wet, -0.05 * story.wet);
        }
        c.offsetHSL((n2 - 0.5) * 0.018, -0.02 + (n1 - 0.5) * 0.08, -0.08 + (n2 - 0.5) * 0.12);
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geo.attributes.color.needsUpdate = true;
    }
    if (world.ground.material && world.ground.material.dispose) world.ground.material.dispose();
    const detailMap = this._groundDetailTexture(world.name, 1024);
    detailMap.wrapS = detailMap.wrapT = THREE.ClampToEdgeWrapping;
    detailMap.repeat.set(1, 1);
    detailMap.anisotropy = 4;
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: detailMap,
      vertexColors: true,
      roughness: 0.96,
      metalness: 0,
      flatShading: false
    });
    world.ground.material = mat;
    world.ground.receiveShadow = true;
  },

  _groundTexture(name, preset, size) {
    const key = 'art-ground-' + name;
    if (!this._textureCache) this._textureCache = {};
    if (this._textureCache[key]) return this._textureCache[key];
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(size, size);
    const data = img.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const n1 = this._fbm(x * 0.006, y * 0.006, 7, 4);
        const n2 = this._fbm(x * 0.02 + 12, y * 0.02 - 3, 21, 3);
        const n3 = this._fbm(x * 0.055, y * 0.055, 41, 2);
        const band = Math.sin((x + y * 0.55) * 0.018) * 0.5 + 0.5;
        const paletteIndex = Math.min(preset.ground.length - 1, Math.floor((n1 * 0.52 + n2 * 0.32 + band * 0.16) * preset.ground.length));
        const base = this._hex(preset.ground[paletteIndex]);
        const warm = this._hex(preset.ground[(paletteIndex + 1) % preset.ground.length]);
        const mix = Math.max(0, Math.min(1, n2 * 0.55 + n3 * 0.18));
        const idx = (y * size + x) * 4;
        const dirt = n1 > 0.63 && n2 > 0.47;
        const d = dirt ? this._hex(preset.dirt) : null;
        const shade = 0.86 + n3 * 0.2;
        data[idx] = Math.min(255, ((d ? d.r * 0.45 + base.r * 0.55 : base.r * (1 - mix) + warm.r * mix) * shade) | 0);
        data[idx + 1] = Math.min(255, ((d ? d.g * 0.45 + base.g * 0.55 : base.g * (1 - mix) + warm.g * mix) * shade) | 0);
        data[idx + 2] = Math.min(255, ((d ? d.b * 0.45 + base.b * 0.55 : base.b * (1 - mix) + warm.b * mix) * shade) | 0);
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    ctx.globalAlpha = 0.13;
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const rx = 14 + Math.random() * 52;
      const ry = 6 + Math.random() * 24;
      ctx.fillStyle = i % 3 === 0 ? preset.dirt : preset.ground[i % preset.ground.length];
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const tex = new THREE.CanvasTexture(canvas);
    tex.encoding = THREE.sRGBEncoding;
    this._textureCache[key] = tex;
    return tex;
  },

  _groundDetailTexture(name, size) {
    const key = 'art-ground-detail-' + name;
    if (!this._textureCache) this._textureCache = {};
    if (this._textureCache[key]) return this._textureCache[key];
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(size, size);
    const data = img.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const n = this._fbm(x * 0.025, y * 0.025, 73, 4);
        const fine = this._fbm(x * 0.095, y * 0.095, 91, 2);
        const v = Math.max(206, Math.min(255, 232 + (n - 0.5) * 34 + (fine - 0.5) * 18));
        const idx = (y * size + x) * 4;
        data[idx] = v;
        data[idx + 1] = v;
        data[idx + 2] = v;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = '#ffffff';
    for (let i = 0; i < 160; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const len = 6 + Math.random() * 18;
      const a = Math.random() * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.06;
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const rx = 5 + Math.random() * 22;
      const ry = 2 + Math.random() * 8;
      ctx.fillStyle = i % 3 === 0 ? '#111111' : '#ffffff';
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 0.075;
    ctx.strokeStyle = '#0f0f0f';
    for (let i = 0; i < 70; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const len = 3 + Math.random() * 10;
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(
        x + Math.cos(a) * len * 0.35 + (Math.random() - 0.5) * 2,
        y + Math.sin(a) * len * 0.35,
        x + Math.cos(a) * len,
        y + Math.sin(a) * len
      );
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    const tex = new THREE.CanvasTexture(canvas);
    tex.encoding = THREE.sRGBEncoding;
    this._textureCache[key] = tex;
    return tex;
  },

  _addGroundDetails(world, preset) {
    if (world._artGroundDetails) return;
    world._artGroundDetails = true;
    const group = new THREE.Group();
    group.name = 'art-ground-details';
    world.scene.add(group);

    const tuned = this._tunedPreset(preset);
    this._addDirtPatches(world, tuned, group);
    this._addInstancedGrass(world, tuned, group);
    this._addInstancedFlowers(world, tuned, group);
    this._addInstancedPebbles(world, tuned, group);
  },

  _addDirtPatches(world, preset, group) {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(preset.dirt),
      roughness: 1,
      transparent: true,
      opacity: world.name === 'desert' ? 0.18 : 0.34,
      depthWrite: false
    });
    for (let i = 0; i < preset.patchCount; i++) {
      const p = this._randomPoint(world, 10);
      const patch = new THREE.Mesh(new THREE.CircleGeometry(1, 18), mat);
      patch.rotation.x = -Math.PI / 2;
      patch.position.set(p.x, 0.045, p.z);
      patch.scale.set(2.5 + Math.random() * 7, 1.1 + Math.random() * 2.8, 1);
      patch.rotation.z = Math.random() * Math.PI;
      patch.renderOrder = 0;
      group.add(patch);
    }
  },

  _addInstancedGrass(world, preset, group) {
    const count = preset.grassCount;
    if (count <= 0) return;
    const geo = new THREE.ConeGeometry(0.035, 0.42, 3);
    geo.translate(0, 0.21, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, vertexColors: true, flatShading: true });
    const cBase = new THREE.Color(preset.grass);
    const instances = [];
    for (let i = 0; i < count; i++) {
      const p = this._randomPoint(world, 4);
      const s = 0.62 + Math.random() * 1.05;
      const col = cBase.clone().offsetHSL((Math.random() - 0.5) * 0.035, (Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.12);
      instances.push({
        x: p.x,
        y: 0.03,
        z: p.z,
        rot: [(Math.random() - 0.5) * 0.22, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.46],
        scale: [0.75 + Math.random() * 0.45, s, 0.75 + Math.random() * 0.45],
        color: col
      });
    }
    this._addCellInstancedLayer(world, group, 'art-instanced-grass', geo, mat, instances, {
      castShadow: false,
      receiveShadow: this._quality() !== 'low'
    });
  },

  _addInstancedFlowers(world, preset, group) {
    const count = preset.flowerCount;
    if (count <= 0) return;
    const geo = new THREE.IcosahedronGeometry(0.055, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, vertexColors: true, emissive: 0x111111, emissiveIntensity: 0.04 });
    const instances = [];
    for (let i = 0; i < count; i++) {
      const p = this._randomPoint(world, 6);
      const s = 0.65 + Math.random() * 0.95;
      instances.push({
        x: p.x,
        y: 0.18 + Math.random() * 0.05,
        z: p.z,
        rot: [Math.random(), Math.random() * Math.PI * 2, Math.random()],
        scale: [s, s, s],
        color: new THREE.Color(preset.flower[i % preset.flower.length])
      });
    }
    this._addCellInstancedLayer(world, group, 'art-instanced-flowers', geo, mat, instances, {
      castShadow: false,
      receiveShadow: false
    });
  },

  _addInstancedPebbles(world, preset, group) {
    const count = preset.pebbleCount;
    if (count <= 0) return;
    const geo = new THREE.DodecahedronGeometry(0.12, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0x9b9686, roughness: 0.95, flatShading: true, vertexColors: true });
    const instances = [];
    for (let i = 0; i < count; i++) {
      const p = this._randomPoint(world, 5);
      const s = 0.55 + Math.random() * 1.55;
      const col = new THREE.Color(i % 4 === 0 ? preset.dirt : '#9b9686').offsetHSL(0, 0, (Math.random() - 0.5) * 0.12);
      instances.push({
        x: p.x,
        y: 0.08,
        z: p.z,
        rot: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
        scale: [1.25 * s, 0.45 * s, 0.9 * s],
        color: col
      });
    }
    this._addCellInstancedLayer(world, group, 'art-instanced-pebbles', geo, mat, instances, {
      castShadow: this._quality() !== 'low' && !this._isTouchDevice(),
      receiveShadow: this._quality() !== 'low'
    });
  },

  _addCellInstancedLayer(world, group, name, geo, mat, instances, opts = {}) {
    const cellSize = (typeof WorldStreamingSystem !== 'undefined' && WorldStreamingSystem._cellSize) || 48;
    const buckets = new Map();
    for (const inst of instances) {
      const cx = Math.floor(inst.x / cellSize);
      const cz = Math.floor(inst.z / cellSize);
      const key = `${cx},${cz}`;
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = { cx, cz, list: [] };
        buckets.set(key, bucket);
      }
      bucket.list.push(inst);
    }

    world._artGroundDetailCells = world._artGroundDetailCells || [];
    for (const bucket of buckets.values()) {
      const mesh = new THREE.InstancedMesh(geo, mat, bucket.list.length);
      const centerX = bucket.cx * cellSize + cellSize * 0.5;
      const centerZ = bucket.cz * cellSize + cellSize * 0.5;
      mesh.name = `${name}-cell-${bucket.cx}-${bucket.cz}`;
      mesh.position.set(centerX, 0, centerZ);
      mesh.visible = false;
      mesh.frustumCulled = true;
      mesh.castShadow = !!opts.castShadow;
      mesh.receiveShadow = !!opts.receiveShadow;
      mesh.userData.perfCull = true;
      mesh.userData.kind = 'groundDetail';
      mesh.userData.detailLayer = true;
      mesh.userData.streamBaseVisible = true;
      for (let i = 0; i < bucket.list.length; i++) {
        const inst = bucket.list[i];
        this._dummy.position.set(inst.x - centerX, inst.y, inst.z - centerZ);
        this._dummy.rotation.set(inst.rot[0], inst.rot[1], inst.rot[2]);
        this._dummy.scale.set(inst.scale[0], inst.scale[1], inst.scale[2]);
        this._dummy.updateMatrix();
        mesh.setMatrixAt(i, this._dummy.matrix);
        if (inst.color) mesh.setColorAt(i, inst.color);
      }
      if (mesh.instanceMatrix) mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      world._artGroundDetailCells.push(mesh);
      group.add(mesh);
    }
  },

  _polishWater(world, preset) {
    if (world._artWaterPolished) return;
    world._artWaterPolished = true;
    world.scene.traverse(obj => {
      if (!obj || !obj.userData || obj.userData.kind !== 'river') return;
      const water = obj.userData.parts && obj.userData.parts.water;
      if (!water || !water.geometry) return;
      const params = water.geometry.parameters || {};
      const width = params.width || 8;
      const length = params.height || params.depth || 80;
      const mat = this._waterMaterial(world.name, preset);
      water.material = mat;
      water.position.y = 0.075;
      water.receiveShadow = true;
      this._waterSurfaces.push(water);
      this._addRiverBanks(obj, width, length, preset);
    });
  },

  _waterMaterial(worldName, preset) {
    const deep = worldName === 'snowland' ? 0x79c8e8 : 0x2f7784;
    const shallow = worldName === 'snowland' ? 0xc8f7ff : 0x78b8a0;
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uDeep: { value: new THREE.Color(deep) },
        uShallow: { value: new THREE.Color(shallow) },
        uOpacity: { value: worldName === 'snowland' ? 0.58 : 0.64 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main(){
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uDeep;
        uniform vec3 uShallow;
        uniform float uOpacity;
        void main(){
          float edge = abs(vUv.x - 0.5) * 2.0;
          float flow = sin(vUv.y * 34.0 + uTime * 2.2 + sin(vUv.x * 8.0)) * 0.5 + 0.5;
          float ripple = sin((vUv.y + vUv.x * .32) * 75.0 + uTime * 4.1) * 0.5 + 0.5;
          vec3 c = mix(uDeep, uShallow, clamp(edge * 0.72 + flow * 0.18, 0.0, 1.0));
          c += vec3(0.055, 0.08, 0.09) * smoothstep(0.86, 1.0, ripple) * (1.0 - edge * 0.45);
          float foam = smoothstep(0.78, 1.0, edge) * (0.28 + flow * 0.18);
          gl_FragColor = vec4(mix(c, vec3(0.86, 0.96, 1.0), foam), uOpacity + foam * 0.18);
        }`
    });
  },

  _addRiverBanks(river, width, length, preset) {
    if (river.userData.artBanks) return;
    river.userData.artBanks = true;
    const bankMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(preset.dirt), roughness: 0.98, transparent: true, opacity: 0.50, depthWrite: false });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xa9a28f, roughness: 0.96, flatShading: true });
    [-1, 1].forEach(side => {
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(1.6, length, 1, 18), bankMat);
      strip.rotation.x = -Math.PI / 2;
      strip.position.set(side * (width / 2 + 0.58), 0.055, 0);
      river.add(strip);
      for (let i = 0; i < Math.max(10, Math.floor(length / 18)); i++) {
        const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18 + Math.random() * 0.22, 0), stoneMat);
        stone.position.set(side * (width / 2 + 0.56 + Math.random() * 0.55), 0.14, -length / 2 + Math.random() * length);
        stone.scale.set(1.25, 0.45, 0.8 + Math.random() * 0.4);
        stone.rotation.set(Math.random(), Math.random() * Math.PI, Math.random());
        stone.castShadow = this._quality() !== 'low' && !this._isTouchDevice();
        river.add(stone);
      }
    });
  },

  _quality() {
    return (typeof VisualQualitySystem !== 'undefined' && VisualQualitySystem.level) || (this._isTouchDevice() ? 'low' : 'medium');
  },

  _qualitySettings() {
    if (typeof VisualQualitySystem !== 'undefined' && VisualQualitySystem.getSettings) {
      return VisualQualitySystem.getSettings();
    }
    return {
      renderScale: this._isTouchDevice() ? 1 : 1.25,
      shadows: !this._isTouchDevice(),
      shadowSize: this._isTouchDevice() ? 512 : 1024
    };
  },

  _isTouchDevice() {
    return ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  },

  _tunedPreset(preset) {
    const budget = typeof VisualQualitySystem !== 'undefined' && VisualQualitySystem.getBudget
      ? VisualQualitySystem.getBudget()
      : null;
    const quality = this._quality();
    const touch = this._isTouchDevice();
    const factor = budget && Number.isFinite(budget.detailDensity)
      ? budget.detailDensity
      : quality === 'low' || touch ? 0.26 : quality === 'medium' ? 0.55 : quality === 'ultra' ? 1 : 0.78;
    return Object.assign({}, preset, {
      grassCount: Math.max(80, Math.floor((preset.grassCount || 0) * factor)),
      flowerCount: Math.max(8, Math.floor((preset.flowerCount || 0) * factor)),
      pebbleCount: Math.max(18, Math.floor((preset.pebbleCount || 0) * factor)),
      patchCount: Math.max(4, Math.floor((preset.patchCount || 0) * Math.max(0.5, factor)))
    });
  },

  _softenMaterials(world) {
    if (world._artMaterialsSoftened) return;
    world._artMaterialsSoftened = true;
    world.scene.traverse(obj => {
      if (!obj || !obj.material) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of mats) {
        if (!mat || mat.isShaderMaterial || mat.isMeshBasicMaterial) continue;
        if (mat.color && obj.userData && obj.userData.kind === 'tree') {
          mat.color.offsetHSL(0, -0.07, 0.035);
          if ('emissive' in mat) {
            mat.emissive = mat.emissive || new THREE.Color(0x000000);
            mat.emissive.setHex(0x18210f);
            mat.emissiveIntensity = Math.max(mat.emissiveIntensity || 0, 0.035);
          }
        }
        if ('roughness' in mat) mat.roughness = Math.max(mat.roughness || 0.8, 0.82);
        if ('metalness' in mat) mat.metalness = Math.min(mat.metalness || 0, 0.08);
      }
    });
  },

  _collectStaticGroundInfluences(world) {
    const influences = { camps: [], chests: [], trees: [], landmarks: [] };
    if (!world) return influences;
    if (Array.isArray(world.camps)) {
      for (const camp of world.camps) {
        if (!camp) continue;
        influences.camps.push({
          x: Number(camp.x) || 0,
          z: Number(camp.z) || 0,
          radius: Math.max(8, Math.min(28, Number(camp.radius) || 16))
        });
      }
    }
    if (Array.isArray(world.breakables)) {
      for (const b of world.breakables) {
        const mesh = b && b.mesh;
        if (!mesh || !mesh.position) continue;
        const kind = mesh.userData && (mesh.userData.kind || mesh.userData.chestId || mesh.userData.breakable);
        if (!kind) continue;
        influences.chests.push({
          x: mesh.position.x || 0,
          z: mesh.position.z || 0,
          radius: 4.6
        });
      }
    }
    if (Array.isArray(world.landmarkPoints)) {
      for (const p of world.landmarkPoints) {
        influences.landmarks.push({
          x: Number(p.x) || 0,
          z: Number(p.z) || 0,
          radius: p.type === 'campNode' ? 12 : 9
        });
      }
    }
    if (world.scene && world.scene.traverse) {
      const maxTrees = this._quality() === 'low' || this._isTouchDevice() ? 48 : 92;
      world.scene.traverse(obj => {
        if (!obj || !obj.userData || influences.trees.length >= maxTrees) return;
        const kind = obj.userData.kind;
        if (kind === 'tree' && obj.position) {
          influences.trees.push({
            x: obj.position.x || 0,
            z: obj.position.z || 0,
            radius: 3.4 + Math.min(2.2, Math.max(0, (obj.scale && obj.scale.x || 1) - 1) * 1.6)
          });
        }
      });
    }
    return influences;
  },

  _terrainStoryBlend(world, x, z, preset, influences) {
    const story = { camp: 0, chest: 0, treeRoot: 0, gravel: 0, wet: 0 };
    const smoothInfluence = (list, key, scale = 1) => {
      if (!Array.isArray(list)) return;
      for (const p of list) {
        const radius = Math.max(0.1, Number(p.radius) || 1);
        const d = Math.hypot(x - p.x, z - p.z);
        if (d >= radius) continue;
        const t = THREE.MathUtils.clamp(1 - d / radius, 0, 1);
        story[key] = Math.max(story[key], t * t * (3 - 2 * t) * scale);
      }
    };
    smoothInfluence(influences && influences.camps, 'camp', 1);
    smoothInfluence(influences && influences.chests, 'chest', 1);
    smoothInfluence(influences && influences.trees, 'treeRoot', 1);
    smoothInfluence(influences && influences.landmarks, 'gravel', 0.82);
    const waterEdge = this._distanceToWaterZones(world, x, z);
    if (waterEdge >= 0) story.wet = THREE.MathUtils.clamp(1 - waterEdge / 5.6, 0, 1);
    const freckle = this._fbm(x * 0.18 + 13, z * 0.18 - 7, 117, 2);
    story.gravel = Math.max(story.gravel, story.camp * THREE.MathUtils.clamp((freckle - 0.56) * 2.2, 0, 0.32));
    story.treeRoot *= 0.72 + this._fbm(x * 0.11, z * 0.11, 141, 2) * 0.28;
    return story;
  },

  _randomPoint(world, margin = 4) {
    let x = 0, z = 0;
    for (let tries = 0; tries < 16; tries++) {
      x = world.bounds.minX + margin + Math.random() * (world.bounds.maxX - world.bounds.minX - margin * 2);
      z = world.bounds.minZ + margin + Math.random() * (world.bounds.maxZ - world.bounds.minZ - margin * 2);
      if (Math.hypot(x - (world.spawnPoint.x || 0), z - (world.spawnPoint.z || 0)) < 7) continue;
      const terrain = world.getTerrainAt ? world.getTerrainAt(x, z) : null;
      if (terrain && terrain.inWater) continue;
      return { x, z };
    }
    return { x, z };
  },

  _distanceToRoutes(world, x, z) {
    if (!world || !Array.isArray(world.routePaths)) return -1;
    let best = Infinity;
    for (const route of world.routePaths) {
      const pts = route.points || [];
      const width = route.width || 6;
      for (let i = 0; i < pts.length - 1; i++) {
        best = Math.min(best, this._distanceToSegment(x, z, pts[i].x, pts[i].z, pts[i + 1].x, pts[i + 1].z) - width * 0.5);
      }
    }
    return best;
  },

  _distanceToWaterZones(world, x, z) {
    if (!world || !Array.isArray(world.waterZones)) return -1;
    let best = Infinity;
    for (const zone of world.waterZones) {
      const dx = x - zone.x;
      const dz = z - zone.z;
      const a = -(zone.rotation || 0);
      const lx = dx * Math.cos(a) - dz * Math.sin(a);
      const lz = dx * Math.sin(a) + dz * Math.cos(a);
      const edgeX = Math.abs(lx) - (zone.width || 8) * 0.5;
      const edgeZ = Math.abs(lz) - (zone.length || 80) * 0.5;
      if (edgeZ > 0) continue;
      best = Math.min(best, Math.max(0, edgeX));
    }
    return best === Infinity ? -1 : best;
  },

  _distanceToLandmarks(world, x, z) {
    if (!world || !Array.isArray(world.landmarkPoints)) return 0;
    let blend = 0;
    for (const p of world.landmarkPoints) {
      const d = Math.hypot(x - p.x, z - p.z);
      blend = Math.max(blend, THREE.MathUtils.clamp(1 - d / 9.5, 0, 1));
    }
    return blend;
  },

  _distanceToSegment(px, pz, ax, az, bx, bz) {
    const dx = bx - ax;
    const dz = bz - az;
    const lenSq = dx * dx + dz * dz;
    if (lenSq < 0.001) return Math.hypot(px - ax, pz - az);
    const t = THREE.MathUtils.clamp(((px - ax) * dx + (pz - az) * dz) / lenSq, 0, 1);
    return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
  },

  _hex(hex) {
    const h = String(hex).replace('#', '');
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  },

  _noise(x, y, seed) {
    const n = Math.sin(x * 127.1 + y * 311.7 + seed * 19.19) * 43758.5453;
    return n - Math.floor(n);
  },

  _smooth(x, y, seed) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = this._noise(ix, iy, seed);
    const b = this._noise(ix + 1, iy, seed);
    const c = this._noise(ix, iy + 1, seed);
    const d = this._noise(ix + 1, iy + 1, seed);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  },

  _fbm(x, y, seed, octaves) {
    let v = 0, amp = 0.5, freq = 1;
    for (let i = 0; i < octaves; i++) {
      v += this._smooth(x * freq, y * freq, seed + i * 11) * amp;
      amp *= 0.52;
      freq *= 2;
    }
    return v;
  }
};

if (typeof window !== 'undefined') window.ArtDirectionSystem = ArtDirectionSystem;
