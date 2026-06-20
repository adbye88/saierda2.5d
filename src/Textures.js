/* ========================================================
   Textures.js v2 — BotW-style 程序化贴图生成器
   用 Canvas2D 动态绘制高品质贴图 + 法线贴图
   模仿旷野之息的 Cel-shading 质感，多层叠加，细节丰富
   ======================================================== */

const Textures = {
  cache: {},
  assetAliases: {
    grass: 'ai-polish-grass',
    snow: 'ai-polish-snow',
    sand: 'ai-polish-sand',
    rock: 'ai-polish-mossy-stone',
    bark: 'ai-polish-bark',
    metal: 'ai-polish-metal',
    wood: 'ai-polish-wood',
    cloth: 'ai-polish-cloth',
    'stone-brick': 'ai-polish-mossy-stone',
    water: 'ai-polish-water',
    lava: 'ai-polish-lava',
    'lava-rock': 'ai-polish-lava-rock',
    'forest-floor': 'ai-polish-grass',
    'dungeon-floor': 'ai-polish-corrupted-stone',
    'castle-floor': 'ai-polish-metal'
  },

  // ---------- 工具：创建 canvas ----------
  _canvas(size = 256) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    return { c, ctx: c.getContext('2d') };
  },

  toTexture(canvas, repeat = 1) {
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
    t.flatShading = true;
    t.encoding = THREE.sRGBEncoding;
    return t;
  },

  _assetTexture(name, repeat = 1, cacheKey = name, tint = null) {
    const resolvedName = this.assetAliases[name] || name;
    const key = 'asset_' + cacheKey + '_' + resolvedName;
    if (this.cache[key]) return this.cache[key];
    if (typeof Image === 'undefined') return null;

    const { c, ctx } = this._canvas(512);
    if (tint) {
      ctx.fillStyle = tint;
      ctx.fillRect(0, 0, c.width, c.height);
    }

    const tex = this.toTexture(c, repeat);
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      if (tint) {
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = tint;
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.globalCompositeOperation = 'source-over';
      }
      tex.needsUpdate = true;
    };
    img.onerror = () => {
      console.warn('[Textures] generated asset failed to load:', img.src);
    };
    img.src = 'assets/textures/' + resolvedName + '.png';

    this.cache[key] = tex;
    return tex;
  },

  // ---------- 法线贴图生成（从颜色贴图推算） ----------
  _normalFromColor(colorCanvas, strength = 2.0) {
    const size = colorCanvas.width;
    const { c, ctx } = this._canvas(size);
    const src = colorCanvas.getContext('2d');
    const imgData = src.getImageData(0, 0, size, size);
    const data = imgData.data;
    const outData = ctx.createImageData(size, size);
    const out = outData.data;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        // 采样邻居（clamp to edge）
        const l = x > 0 ? (y * size + (x - 1)) * 4 : idx;
        const r = x < size - 1 ? (y * size + (x + 1)) * 4 : idx;
        const u = y > 0 ? ((y - 1) * size + x) * 4 : idx;
        const d = y < size - 1 ? ((y + 1) * size + x) * 4 : idx;
        // 灰度差
        const dl = (data[l] + data[l + 1] + data[l + 2]) / 3;
        const dr = (data[r] + data[r + 1] + data[r + 2]) / 3;
        const du = (data[u] + data[u + 1] + data[u + 2]) / 3;
        const dd = (data[d] + data[d + 1] + data[d + 2]) / 3;
        // 法线向量
        let nx = (dl - dr) * strength;
        let ny = (du - dd) * strength;
        let nz = 1.0;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        nx /= len; ny /= len; nz /= len;
        // 编码为颜色 (0~255)
        const oi = idx;
        out[oi] = (nx * 0.5 + 0.5) * 255;
        out[oi + 1] = (ny * 0.5 + 0.5) * 255;
        out[oi + 2] = (nz * 0.5 + 0.5) * 255;
        out[oi + 3] = 255;
      }
    }
    ctx.putImageData(outData, 0, 0);
    return c;
  },

  // 创建材质贴图 + 法线贴图组合
  _materialWithNormal(colorCanvas, opts = {}) {
    const normalCanvas = this._normalFromColor(colorCanvas, opts.normalStrength || 2.0);
    const normalTex = new THREE.CanvasTexture(normalCanvas);
    normalTex.wrapS = normalTex.wrapT = THREE.RepeatWrapping;
    normalTex.flatShading = true;
    return { normalTex };
  },

  _hexToRgb(hex) {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substr(0, 2), 16),
      g: parseInt(h.substr(2, 2), 16),
      b: parseInt(h.substr(4, 2), 16)
    };
  },

  _clamp(v, min = 0, max = 255) { return Math.max(min, Math.min(max, v)); },

  // 多层 Perlin-like 噪声（简化 Value Noise）
  _noise2D(x, y, seed) {
    const n = Math.sin(x * 127.1 + y * 311.7 + seed * 43758.5453) * 43758.5453;
    return n - Math.floor(n);
  },
  _smoothNoise(x, y, seed) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = this._noise2D(ix, iy, seed);
    const b = this._noise2D(ix + 1, iy, seed);
    const c = this._noise2D(ix, iy + 1, seed);
    const d = this._noise2D(ix + 1, iy + 1, seed);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  },
  _fbm(x, y, seed, octaves = 4) {
    let val = 0, amp = 0.5, freq = 1;
    for (let i = 0; i < octaves; i++) {
      val += amp * this._smoothNoise(x * freq, y * freq, seed + i * 17);
      amp *= 0.5; freq *= 2;
    }
    return val;
  },

  // ==================== 草地贴图 ====================
  grass(size = 512) {
    if (this.cache.grass) return this.cache.grass;
    const asset = this._assetTexture('grass', 7, 'grass_premium');
    if (asset) return (this.cache.grass = asset);
    const { c, ctx } = this._canvas(size);
    const seed = 42;

    // 底层：噪声渐变土色
    const imgData = ctx.createImageData(size, size);
    const d = imgData.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const n = this._fbm(x * 0.009, y * 0.009, seed, 3);
        const r = 92 + n * 24;
        const g = 135 + n * 34;
        const b = 58 + n * 16;
        d[idx] = this._clamp(r); d[idx + 1] = this._clamp(g); d[idx + 2] = this._clamp(b); d[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // 稀疏手绘草叶：保留方向感，但不让地面变成高频噪声毯
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const len = 5 + Math.random() * 9;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
      const shade = Math.random();
      const colors = [
        `rgb(${80 + shade * 40 | 0},${140 + shade * 50 | 0},${50 + shade * 20 | 0})`,
        `rgb(${60 + shade * 30 | 0},${120 + shade * 40 | 0},${35 + shade * 15 | 0})`,
        `rgb(${90 + shade * 50 | 0},${160 + shade * 40 | 0},${60 + shade * 25 | 0})`
      ];
      ctx.strokeStyle = colors[Math.floor(Math.random() * 3)];
      ctx.lineWidth = 1.0 + Math.random() * 0.7;
      ctx.beginPath();
      ctx.moveTo(x, y);
      // 弯曲的草叶
      const cx1 = x + Math.cos(angle) * len * 0.3 + (Math.random() - 0.5) * 3;
      const cy1 = y + Math.sin(angle) * len * 0.3;
      const ex = x + Math.cos(angle) * len + (Math.random() - 0.5) * 4;
      const ey = y + Math.sin(angle) * len;
      ctx.quadraticCurveTo(cx1, cy1, ex, ey);
      ctx.stroke();
    }

    // 小花只保留少量点缀，避免远景抢角色
    const flowerColors = ['#fff4c4', '#f5d06a', '#dfefff'];
    for (let i = 0; i < 4; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const fc = flowerColors[Math.floor(Math.random() * flowerColors.length)];
      const flowerSize = 1.8 + Math.random() * 1.3;
      // 4 瓣花
      for (let p = 0; p < 4; p++) {
        const a = (p / 4) * Math.PI * 2 + Math.random() * 0.3;
        ctx.fillStyle = fc;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * flowerSize * 0.6, y + Math.sin(a) * flowerSize * 0.6,
          flowerSize * 0.5, flowerSize * 0.3, a, 0, Math.PI * 2);
        ctx.fill();
      }
      // 花心
      ctx.fillStyle = '#fff4a0';
      ctx.beginPath();
      ctx.arc(x, y, flowerSize * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 泥土裸露点（BotW 特有：草丛中的泥土斑驳）
    for (let i = 0; i < 18; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const r = 8 + Math.random() * 18;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(120,98,58,0.24)');
      grad.addColorStop(0.65, 'rgba(100,82,46,0.13)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 矮草丛暗影（给地面增加层次感）
    for (let i = 0; i < 36; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      ctx.fillStyle = 'rgba(42,78,30,0.10)';
      ctx.beginPath();
      ctx.ellipse(x, y, 10 + Math.random() * 18, 4 + Math.random() * 8,
        Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    this.cache.grass = this.toTexture(c, 7);
    return this.cache.grass;
  },

  // ==================== 雪地贴图 ====================
  snow(size = 512) {
    if (this.cache.snow) return this.cache.snow;
    const asset = this._assetTexture('snow', 7, 'snow_premium');
    if (asset) return (this.cache.snow = asset);
    const { c, ctx } = this._canvas(size);
    const seed = 88;

    // 底层：噪声渐变白雪
    const imgData = ctx.createImageData(size, size);
    const d = imgData.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const n = this._fbm(x * 0.008, y * 0.008, seed, 3);
        const v = 224 + n * 22;
        d[idx] = this._clamp(v); d[idx + 1] = this._clamp(v + 3); d[idx + 2] = this._clamp(v + 8); d[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // 雪粒（细微晶体质感）
    for (let i = 0; i < 420; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const v = 195 + Math.random() * 60;
      ctx.fillStyle = `rgb(${v | 0},${v | 0},${v + 8 | 0})`;
      ctx.fillRect(x, y, 1 + Math.random(), 1 + Math.random());
    }

    // 冰晶闪光
    for (let i = 0; i < 12; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const r = 1.5 + Math.random() * 3;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(200,230,255,0.8)');
      grad.addColorStop(0.4, 'rgba(180,210,240,0.4)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

    // 微弱的蓝紫阴影（BotW 雪地的冷色调）
    for (let i = 0; i < 18; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const r = 8 + Math.random() * 15;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(140,160,200,0.2)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

    // 雪面微起伏（模拟风吹雪的波纹）
    ctx.strokeStyle = 'rgba(200,210,230,0.2)';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 12; i++) {
      const y0 = Math.random() * size;
      ctx.beginPath();
      for (let x = 0; x < size; x += 4) {
        ctx.lineTo(x, y0 + Math.sin(x * 0.05 + i) * 3 + Math.sin(x * 0.12 + i * 2) * 1.5);
      }
      ctx.stroke();
    }

    this.cache.snow = this.toTexture(c, 7);
    return this.cache.snow;
  },

  // ==================== 沙地贴图 ====================
  sand(size = 512) {
    if (this.cache.sand) return this.cache.sand;
    const asset = this._assetTexture('sand', 7, 'sand_premium');
    if (asset) return (this.cache.sand = asset);
    const { c, ctx } = this._canvas(size);
    const seed = 123;

    // 底层：噪声沙色
    const imgData = ctx.createImageData(size, size);
    const d = imgData.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const n = this._fbm(x * 0.009, y * 0.009, seed, 3);
        const r = 210 + n * 24;
        const g = 178 + n * 22;
        const b = 112 + n * 16;
        d[idx] = this._clamp(r); d[idx + 1] = this._clamp(g); d[idx + 2] = this._clamp(b); d[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // 少量沙粒，只做近景质感
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const shades = ['#f0d088', '#d8b058', '#c8a048', '#e8c878', '#b89038', '#ddb060'];
      ctx.fillStyle = shades[Math.floor(Math.random() * shades.length)];
      ctx.fillRect(x, y, 1 + Math.random() * 1.5, 1 + Math.random() * 1.5);
    }

    // 风蚀沙波纹（BotW 沙漠标志性纹路）
    for (let i = 0; i < 18; i++) {
      const y0 = Math.random() * size;
      const wavePhase = Math.random() * Math.PI * 2;
      const amplitude = 2 + Math.random() * 5;
      const frequency = 0.03 + Math.random() * 0.04;
      ctx.strokeStyle = `rgba(160,120,50,${0.08 + Math.random() * 0.10})`;
      ctx.lineWidth = 0.6 + Math.random() * 0.6;
      ctx.beginPath();
      for (let x = 0; x < size; x += 3) {
        ctx.lineTo(x, y0 + Math.sin(x * frequency + wavePhase) * amplitude);
      }
      ctx.stroke();
      // 平行线（波纹组）
      for (let j = 1; j <= 2; j++) {
        ctx.strokeStyle = `rgba(160,120,50,${0.08 + Math.random() * 0.08})`;
        ctx.beginPath();
        for (let x = 0; x < size; x += 3) {
          ctx.lineTo(x, y0 + j * (3 + Math.random() * 4) + Math.sin(x * frequency + wavePhase) * amplitude * 0.7);
        }
        ctx.stroke();
      }
    }

    // 小碎石
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      ctx.fillStyle = `rgb(${140 + Math.random() * 30 | 0},${110 + Math.random() * 20 | 0},${70 + Math.random() * 20 | 0})`;
      ctx.beginPath();
      ctx.ellipse(x, y, 2 + Math.random() * 3, 1.5 + Math.random() * 2, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    // 阴影斑驳
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const r = 6 + Math.random() * 12;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(100,70,30,0.2)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

    this.cache.sand = this.toTexture(c, 7);
    return this.cache.sand;
  },

  // ==================== 岩石/火山岩贴图 ====================
  rock(color = '#7a7a82', size = 512) {
    const key = 'rock_' + color;
    if (this.cache[key]) return this.cache[key];
    const asset = this._assetTexture('rock', 3, key + '_premium', color);
    if (asset) return (this.cache[key] = asset);
    const { c, ctx } = this._canvas(size);
    const seed = this._hexToRgb(color).r;
    const baseRgb = this._hexToRgb(color);

    // 底层：噪声岩石色
    const imgData = ctx.createImageData(size, size);
    const d = imgData.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const n = this._fbm(x * 0.012, y * 0.012, seed, 3);
        const r = baseRgb.r + (n - 0.5) * 30;
        const g = baseRgb.g + (n - 0.5) * 30;
        const b = baseRgb.b + (n - 0.5) * 30;
        d[idx] = this._clamp(r); d[idx + 1] = this._clamp(g); d[idx + 2] = this._clamp(b); d[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // 大块色斑（地质层次）
    for (let i = 0; i < 14; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const r = 24 + Math.random() * 48;
      const v = (Math.random() - 0.5) * 24;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `rgba(${this._clamp(baseRgb.r + v) | 0},${this._clamp(baseRgb.g + v) | 0},${this._clamp(baseRgb.b + v) | 0},0.6)`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

    // 石头斑点纹理
    for (let i = 0; i < 220; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const v = (Math.random() - 0.5) * 34;
      ctx.fillStyle = `rgb(${this._clamp(baseRgb.r + v) | 0},${this._clamp(baseRgb.g + v) | 0},${this._clamp(baseRgb.b + v) | 0})`;
      ctx.fillRect(x, y, 2 + Math.random() * 3, 2 + Math.random() * 3);
    }

    // 裂纹线（多层，主线 + 分叉）
    const darkFactor = 0.45;
    for (let i = 0; i < 7; i++) {
      ctx.strokeStyle = `rgba(${baseRgb.r * darkFactor | 0},${baseRgb.g * darkFactor | 0},${baseRgb.b * darkFactor | 0},${0.18 + Math.random() * 0.18})`;
      ctx.lineWidth = 0.7 + Math.random() * 1.2;
      ctx.beginPath();
      let x = Math.random() * size, y = Math.random() * size;
      ctx.moveTo(x, y);
      const segments = 5 + Math.floor(Math.random() * 8);
      for (let j = 0; j < segments; j++) {
        x += (Math.random() - 0.5) * 40;
        y += (Math.random() - 0.5) * 40;
        ctx.lineTo(x, y);
        // 偶尔分叉
        if (Math.random() > 0.6) {
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 20);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x, y);
        }
      }
      ctx.stroke();
    }

    // 苔藓斑点（让岩石有生机）
    if (color === '#7a7a82' || color === '#8a8a92') {
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * size, y = Math.random() * size;
        const r = 3 + Math.random() * 8;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, 'rgba(60,100,40,0.4)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
    }

    this.cache[key] = this.toTexture(c, 5);
    return this.cache[key];
  },

  // ==================== 树皮贴图 ====================
  bark(color = '#6b4a25', size = 512) {
    const key = 'bark_' + color;
    if (this.cache[key]) return this.cache[key];
    const asset = this._assetTexture('bark', 2, key, color);
    if (asset) return asset;
    const { c, ctx } = this._canvas(size);
    const base = this._hexToRgb(color);
    const seed = base.r + base.g;

    // 底色
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);

    // 树皮竖纹（主要纹理，粗细不一）
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * size;
      const v = (Math.random() - 0.5) * 50;
      const width = 1.5 + Math.random() * 5;
      ctx.strokeStyle = `rgba(${this._clamp(base.r + v) | 0},${this._clamp(base.g + v) | 0},${this._clamp(base.b + v) | 0},${0.5 + Math.random() * 0.4})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      let y = 0;
      while (y < size) {
        const wx = x + (Math.random() - 0.5) * 6 + Math.sin(y * 0.02 + i) * 3;
        ctx.moveTo(wx, y);
        y += 6 + Math.random() * 8;
        ctx.lineTo(wx + (Math.random() - 0.5) * 4, y);
      }
      ctx.stroke();
    }

    // 横向裂纹（树皮会裂开）
    for (let i = 0; i < 35; i++) {
      const y0 = Math.random() * size;
      ctx.strokeStyle = `rgba(${base.r * 0.5 | 0},${base.g * 0.5 | 0},${base.b * 0.5 | 0},${0.3 + Math.random() * 0.3})`;
      ctx.lineWidth = 0.5 + Math.random() * 1.5;
      ctx.beginPath();
      let x = 0;
      ctx.moveTo(x, y0);
      const w = 15 + Math.random() * 40;
      while (x < w) {
        x += 4 + Math.random() * 8;
        ctx.lineTo(x, y0 + (Math.random() - 0.5) * 3);
      }
      ctx.stroke();
    }

    // 树节（椭圆形深色区域）
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const rw = 8 + Math.random() * 15, rh = 4 + Math.random() * 8;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rw, rh));
      grad.addColorStop(0, `rgba(${base.r * 0.35 | 0},${base.g * 0.35 | 0},${base.b * 0.35 | 0},0.7)`);
      grad.addColorStop(0.5, `rgba(${base.r * 0.5 | 0},${base.g * 0.5 | 0},${base.b * 0.5 | 0},0.4)`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(x, y, rw, rh, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    // 苔藓（树根处的苔藓）
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * size, y = size * 0.6 + Math.random() * size * 0.4;
      const r = 5 + Math.random() * 12;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(50,90,40,0.5)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

    this.cache[key] = this.toTexture(c, 2);
    return this.cache[key];
  },

  // ==================== 金属贴图（武器/守护者） ====================
  metal(color = '#c8d0d8', size = 256) {
    const key = 'metal_' + color;
    if (this.cache[key]) return this.cache[key];
    const asset = this._assetTexture('metal', 1, key, color);
    if (asset) return asset;
    const { c, ctx } = this._canvas(size);
    const base = this._hexToRgb(color);

    // 底色渐变（有方向感的光照）
    const g = ctx.createLinearGradient(0, 0, size, size);
    g.addColorStop(0, `rgb(${base.r * 0.75 | 0},${base.g * 0.75 | 0},${base.b * 0.75 | 0})`);
    g.addColorStop(0.3, `rgb(${base.r * 1.1 | 0},${base.g * 1.1 | 0},${base.b * 1.1 | 0})`);
    g.addColorStop(0.5, `rgb(${Math.min(255, base.r * 1.2) | 0},${Math.min(255, base.g * 1.2) | 0},${Math.min(255, base.b * 1.2) | 0})`);
    g.addColorStop(0.7, `rgb(${base.r * 0.9 | 0},${base.g * 0.9 | 0},${base.b * 0.9 | 0})`);
    g.addColorStop(1, `rgb(${base.r * 0.8 | 0},${base.g * 0.8 | 0},${base.b * 0.8 | 0})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    // 拉丝金属（定向细线）
    for (let i = 0; i < 400; i++) {
      const y = Math.random() * size;
      const alpha = 0.05 + Math.random() * 0.2;
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
      ctx.lineWidth = 0.3 + Math.random() * 0.5;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y + (Math.random() - 0.5) * 2); ctx.stroke();
    }

    // 镜面高光带
    for (let i = 0; i < 3; i++) {
      const y = size * 0.2 + Math.random() * size * 0.6;
      const grad = ctx.createLinearGradient(0, y - 8, 0, y + 8);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0.15)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, y - 8, size, 16);
    }

    // 细微划痕
    for (let i = 0; i < 8; i++) {
      const x1 = Math.random() * size, y1 = Math.random() * size;
      ctx.strokeStyle = `rgba(0,0,0,${0.08 + Math.random() * 0.1})`;
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + (Math.random() - 0.5) * 30, y1 + (Math.random() - 0.5) * 5);
      ctx.stroke();
    }

    // 氧化斑点（古旧金属感）
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const r = 2 + Math.random() * 5;
      ctx.fillStyle = `rgba(80,100,80,${0.1 + Math.random() * 0.15})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

    this.cache[key] = this.toTexture(c, 1);
    return this.cache[key];
  },

  // ==================== 木材贴图（盾/弓/棒） ====================
  wood(color = '#7a5a3a', size = 256) {
    const key = 'wood_' + color;
    if (this.cache[key]) return this.cache[key];
    const asset = this._assetTexture('wood', 1, key, color);
    if (asset) return asset;
    const { c, ctx } = this._canvas(size);
    const base = this._hexToRgb(color);

    // 底色
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);

    // 木纹年轮（波浪形曲线，从一侧到另一侧）
    for (let i = 0; i < 50; i++) {
      const startX = Math.random() * size;
      const v = (Math.random() - 0.5) * 40;
      ctx.strokeStyle = `rgba(${this._clamp(base.r + v) | 0},${this._clamp(base.g + v) | 0},${this._clamp(base.b + v) | 0},${0.3 + Math.random() * 0.4})`;
      ctx.lineWidth = 0.5 + Math.random() * 1.5;
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      for (let y = 0; y < size; y += 2) {
        ctx.lineTo(startX + Math.sin(y * 0.04 + i * 0.7) * 12 + Math.sin(y * 0.1 + i) * 4, y);
      }
      ctx.stroke();
    }

    // 年轮结节（椭圆同心圆）
    for (let i = 0; i < 3; i++) {
      const cx = Math.random() * size, cy = Math.random() * size;
      for (let r = 3; r < 15; r += 2.5) {
        ctx.strokeStyle = `rgba(${base.r * 0.7 | 0},${base.g * 0.7 | 0},${base.b * 0.7 | 0},${0.2 + Math.random() * 0.2})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r * (0.5 + Math.random() * 0.3), Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // 木纹细节斑点
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const v = (Math.random() - 0.5) * 25;
      ctx.fillStyle = `rgba(${this._clamp(base.r + v) | 0},${this._clamp(base.g + v) | 0},${this._clamp(base.b + v) | 0},0.3)`;
      ctx.fillRect(x, y, 1, 2 + Math.random() * 3);
    }

    this.cache[key] = this.toTexture(c, 1);
    return this.cache[key];
  },

  // ==================== 布料贴图（防具） ====================
  cloth(color = '#3a8a3a', size = 256) {
    const key = 'cloth_' + color;
    if (this.cache[key]) return this.cache[key];
    const asset = this._assetTexture('cloth', 1, key, color);
    if (asset) return asset;
    const { c, ctx } = this._canvas(size);
    const base = this._hexToRgb(color);

    // 底色
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);

    // 编织纹路（经纬线）
    const weaveSize = 3;
    for (let y = 0; y < size; y += weaveSize) {
      for (let x = 0; x < size; x += weaveSize) {
        const isWarp = ((x / weaveSize | 0) + (y / weaveSize | 0)) % 2 === 0;
        const v = isWarp ? -12 : 12;
        ctx.fillStyle = `rgba(${this._clamp(base.r + v) | 0},${this._clamp(base.g + v) | 0},${this._clamp(base.b + v) | 0},0.5)`;
        ctx.fillRect(x, y, weaveSize - 0.5, weaveSize - 0.5);
      }
    }

    // 线缝纹理（横向细线）
    for (let y = 0; y < size; y += weaveSize * 4) {
      ctx.strokeStyle = `rgba(${base.r * 0.7 | 0},${base.g * 0.7 | 0},${base.b * 0.7 | 0},0.3)`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }

    // 绒毛效果
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const v = (Math.random() - 0.5) * 30;
      ctx.fillStyle = `rgba(${this._clamp(base.r + v) | 0},${this._clamp(base.g + v) | 0},${this._clamp(base.b + v) | 0},0.25)`;
      ctx.fillRect(x, y, 1, 1);
    }

    this.cache[key] = this.toTexture(c, 1);
    return this.cache[key];
  },

  // ==================== 城堡石砖贴图 ====================
  stoneBrick(size = 512) {
    if (this.cache.stoneBrick) return this.cache.stoneBrick;
    const asset = this._assetTexture('stone-brick', 4, 'stoneBrick');
    if (asset) return asset;
    const { c, ctx } = this._canvas(size);
    const seed = 77;

    // 底色
    ctx.fillStyle = '#4a4a55';
    ctx.fillRect(0, 0, size, size);

    // 砖块（交错排列，每块砖有随机色差）
    const brickH = 32, brickW = 64;
    const mortarW = 3;
    for (let row = 0; row < Math.ceil(size / brickH); row++) {
      const offset = (row % 2) * (brickW / 2);
      for (let col = -1; col < Math.ceil(size / brickW) + 1; col++) {
        const bx = col * brickW + offset;
        const by = row * brickH;
        // 每块砖独立的色差
        const n = this._smoothNoise(col * 0.3, row * 0.3, seed);
        const v = n * 40 - 20;
        const r = 80 + v, g = 80 + v, b = 90 + v;
        ctx.fillStyle = `rgb(${this._clamp(r) | 0},${this._clamp(g) | 0},${this._clamp(b) | 0})`;
        ctx.fillRect(bx + mortarW, by + mortarW, brickW - mortarW * 2, brickH - mortarW * 2);

        // 砖面纹理（细微斑点）
        for (let i = 0; i < 15; i++) {
          const px = bx + mortarW + Math.random() * (brickW - mortarW * 2);
          const py = by + mortarW + Math.random() * (brickH - mortarW * 2);
          const pv = (Math.random() - 0.5) * 20;
          ctx.fillStyle = `rgba(${this._clamp(r + pv) | 0},${this._clamp(g + pv) | 0},${this._clamp(b + pv) | 0},0.4)`;
          ctx.fillRect(px, py, 2 + Math.random() * 2, 2 + Math.random() * 2);
        }

        // 砖面边缘暗线（立体感）
        ctx.strokeStyle = `rgba(0,0,0,0.1)`;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(bx + mortarW, by + mortarW, brickW - mortarW * 2, brickH - mortarW * 2);
      }
    }

    // 灰泥/砂浆线
    for (let row = 0; row <= Math.ceil(size / brickH); row++) {
      ctx.fillStyle = '#3a3a42';
      ctx.fillRect(0, row * brickH, size, mortarW);
    }
    for (let row = 0; row < Math.ceil(size / brickH); row++) {
      const offset = (row % 2) * (brickW / 2);
      for (let col = -1; col <= Math.ceil(size / brickW) + 1; col++) {
        ctx.fillStyle = '#3a3a42';
        ctx.fillRect(col * brickW + offset, row * brickH, mortarW, brickH);
      }
    }

    // 苔藓（随机生长在砖缝处）
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const r = 3 + Math.random() * 10;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `rgba(${50 + Math.random() * 30 | 0},${90 + Math.random() * 40 | 0},${40},${0.3 + Math.random() * 0.2})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

    // 风化/水渍（深色竖向条纹）
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * size;
      const w = 3 + Math.random() * 8;
      const grad = ctx.createLinearGradient(x, 0, x, size);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.3 + Math.random() * 0.4, 'rgba(30,30,35,0.2)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, 0, w, size);
    }

    this.cache.stoneBrick = this.toTexture(c, 4);
    return this.cache.stoneBrick;
  },

  // ==================== 水面贴图 ====================
  water(size = 256) {
    if (this.cache.water) return this.cache.water;
    const asset = this._assetTexture('water', 6, 'water');
    if (asset) return asset;
    const { c, ctx } = this._canvas(size);

    // 深水底色
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.7);
    grad.addColorStop(0, '#2a6090');
    grad.addColorStop(0.5, '#1a4a70');
    grad.addColorStop(1, '#0f3050');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // 水波纹（同心圆/弧形）
    for (let i = 0; i < 15; i++) {
      const cx = Math.random() * size, cy = Math.random() * size;
      for (let r = 5; r < 40; r += 4) {
        ctx.strokeStyle = `rgba(120,180,220,${0.15 - r * 0.003})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r, Math.random() * Math.PI, Math.random() * Math.PI + Math.PI * 0.8);
        ctx.stroke();
      }
    }

    // 光斑（水面反光）
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const r = 2 + Math.random() * 6;
      const g2 = ctx.createRadialGradient(x, y, 0, x, y, r);
      g2.addColorStop(0, 'rgba(180,220,255,0.4)');
      g2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g2;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

    // 焦散光纹（水下光斑透过水面的效果）
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      ctx.fillStyle = `rgba(100,180,255,${0.05 + Math.random() * 0.08})`;
      ctx.beginPath();
      const points = 3 + Math.floor(Math.random() * 3);
      for (let p = 0; p < points; p++) {
        const a = (p / points) * Math.PI * 2;
        const r = 10 + Math.random() * 20;
        if (p === 0) ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        else ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    this.cache.water = this.toTexture(c, 6);
    return this.cache.water;
  },

  // ==================== 岩浆贴图 ====================
  lava(size = 256) {
    if (this.cache.lava) return this.cache.lava;
    const asset = this._assetTexture('lava', 4, 'lava');
    if (asset) return asset;
    const { c, ctx } = this._canvas(size);
    const seed = 666;

    // 底层：暗黑岩石
    const imgData = ctx.createImageData(size, size);
    const d = imgData.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const n = this._fbm(x * 0.04, y * 0.04, seed);
        const rockV = 30 + n * 25;
        d[idx] = this._clamp(rockV); d[idx + 1] = this._clamp(rockV * 0.7); d[idx + 2] = this._clamp(rockV * 0.5); d[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // 岩浆裂缝（发光的橙红色线条）
    for (let i = 0; i < 12; i++) {
      ctx.strokeStyle = `rgba(255,${80 + Math.random() * 80 | 0},0,${0.6 + Math.random() * 0.3})`;
      ctx.lineWidth = 1.5 + Math.random() * 3;
      ctx.shadowColor = '#ff4400';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      let x = Math.random() * size, y = Math.random() * size;
      ctx.moveTo(x, y);
      const segs = 6 + Math.floor(Math.random() * 10);
      for (let j = 0; j < segs; j++) {
        x += (Math.random() - 0.5) * 35;
        y += (Math.random() - 0.5) * 35;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // 岩浆发光区域（橙色光斑）
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const r = 4 + Math.random() * 12;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `rgba(255,${120 + Math.random() * 60 | 0},0,${0.4 + Math.random() * 0.3})`);
      grad.addColorStop(0.5, `rgba(200,${50 + Math.random() * 40 | 0},0,0.2)`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

    // 热浪扭曲效果（微弱的黄色区域）
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const r = 8 + Math.random() * 15;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(255,200,50,0.15)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

    this.cache.lava = this.toTexture(c, 4);
    return this.cache.lava;
  },

  // ==================== 环境专属地面贴图 ====================

  // 森林地面（落叶/泥土/树根）
  forestFloor(size = 512) {
    if (this.cache.forestFloor) return this.cache.forestFloor;
    const asset = this._assetTexture('forest-floor', 7, 'forest_floor_premium');
    if (asset) return (this.cache.forestFloor = asset);
    const { c, ctx } = this._canvas(size);

    // 泥土底色
    const imgData = ctx.createImageData(size, size);
    const d = imgData.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const n = this._fbm(x * 0.009, y * 0.009, 55, 3);
        d[idx] = this._clamp(66 + n * 24);
        d[idx + 1] = this._clamp(84 + n * 26);
        d[idx + 2] = this._clamp(43 + n * 16);
        d[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // 草地（稀疏）
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      ctx.strokeStyle = `rgba(${60 + Math.random() * 30 | 0},${100 + Math.random() * 40 | 0},${30 + Math.random() * 20 | 0},0.6)`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 4, y - 3 - Math.random() * 4);
      ctx.stroke();
    }

    // 落叶
    const leafColors = ['#8a5a20', '#aa6a20', '#6a4015', '#aa7030', '#7a5025', '#c08030'];
    for (let i = 0; i < 36; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      ctx.fillStyle = leafColors[Math.floor(Math.random() * leafColors.length)];
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.random() * Math.PI);
      ctx.beginPath();
      ctx.ellipse(0, 0, 3 + Math.random() * 3, 1.5 + Math.random() * 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 树根
    for (let i = 0; i < 4; i++) {
      const x0 = Math.random() * size, y0 = Math.random() * size;
      ctx.strokeStyle = `rgba(80,55,30,0.4)`;
      ctx.lineWidth = 2 + Math.random() * 3;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      let x = x0, y = y0;
      for (let j = 0; j < 5; j++) {
        x += (Math.random() - 0.5) * 25;
        y += (Math.random() - 0.5) * 25;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // 碎石头
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      ctx.fillStyle = `rgb(${100 + Math.random() * 30 | 0},${100 + Math.random() * 30 | 0},${95 + Math.random() * 30 | 0})`;
      ctx.beginPath();
      ctx.ellipse(x, y, 3 + Math.random() * 4, 2 + Math.random() * 3, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    this.cache.forestFloor = this.toTexture(c, 7);
    return this.cache.forestFloor;
  },

  // 地牢地面（潮湿石板）
  dungeonFloor(size = 512) {
    if (this.cache.dungeonFloor) return this.cache.dungeonFloor;
    const asset = this._assetTexture('dungeon-floor', 4, 'dungeon_floor_premium');
    if (asset) return (this.cache.dungeonFloor = asset);
    const { c, ctx } = this._canvas(size);

    // 暗色底
    ctx.fillStyle = '#2a2a35';
    ctx.fillRect(0, 0, size, size);

    // 石板
    const tileH = 48, tileW = 48;
    for (let row = 0; row < Math.ceil(size / tileH); row++) {
      for (let col = 0; col < Math.ceil(size / tileW); col++) {
        const bx = col * tileW, by = row * tileH;
        const n = this._smoothNoise(col * 0.5, row * 0.5, 33);
        const v = 35 + n * 25;
        ctx.fillStyle = `rgb(${v | 0},${v | 0},${v + 8 | 0})`;
        ctx.fillRect(bx + 2, by + 2, tileW - 4, tileH - 4);
        // 石板面纹理
        for (let i = 0; i < 10; i++) {
          const px = bx + 2 + Math.random() * (tileW - 4);
          const py = by + 2 + Math.random() * (tileH - 4);
          const pv = (Math.random() - 0.5) * 15;
          ctx.fillStyle = `rgba(${v + pv | 0},${v + pv | 0},${v + 8 + pv | 0},0.3)`;
          ctx.fillRect(px, py, 2, 2);
        }
      }
    }

    // 缝隙
    ctx.strokeStyle = '#1a1a22';
    ctx.lineWidth = 2;
    for (let row = 0; row <= Math.ceil(size / tileH); row++) {
      ctx.beginPath(); ctx.moveTo(0, row * tileH); ctx.lineTo(size, row * tileH); ctx.stroke();
    }
    for (let col = 0; col <= Math.ceil(size / tileW); col++) {
      ctx.beginPath(); ctx.moveTo(col * tileW, 0); ctx.lineTo(col * tileW, size); ctx.stroke();
    }

    // 潮湿水渍
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const r = 5 + Math.random() * 15;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(20,30,50,0.3)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

    // 绿色苔藓
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const r = 3 + Math.random() * 8;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(30,70,35,0.4)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

    this.cache.dungeonFloor = this.toTexture(c, 6);
    return this.cache.dungeonFloor;
  },

  // 城堡地面（光洁石板 + 地毯痕迹）
  castleFloor(size = 512) {
    if (this.cache.castleFloor) return this.cache.castleFloor;
    const asset = this._assetTexture('castle-floor', 4, 'castle_floor_premium');
    if (asset) return (this.cache.castleFloor = asset);
    const { c, ctx } = this._canvas(size);

    // 灰白底
    ctx.fillStyle = '#6a6a75';
    ctx.fillRect(0, 0, size, size);

    // 大理石纹路
    const imgData = ctx.createImageData(size, size);
    const d = imgData.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const n1 = this._fbm(x * 0.01, y * 0.01, 99);
        const n2 = this._fbm(x * 0.05, y * 0.05, 99);
        const v = 90 + n1 * 30 + (n2 - 0.5) * 20;
        d[idx] = this._clamp(v + 5);
        d[idx + 1] = this._clamp(v + 5);
        d[idx + 2] = this._clamp(v + 12);
        d[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // 石板线
    const tileS = 64;
    ctx.strokeStyle = 'rgba(40,40,50,0.4)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i <= size / tileS; i++) {
      ctx.beginPath(); ctx.moveTo(i * tileS, 0); ctx.lineTo(i * tileS, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * tileS); ctx.lineTo(size, i * tileS); ctx.stroke();
    }

    // 磨损痕迹（高光区域）
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const r = 10 + Math.random() * 20;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(160,160,175,0.2)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

    this.cache.castleFloor = this.toTexture(c, 4);
    return this.cache.castleFloor;
  }
};
