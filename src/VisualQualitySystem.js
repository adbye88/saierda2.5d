/* ========================================================
   VisualQualitySystem.js — 全局画质与商业化视觉气氛控制
   职责：画质档位、阴影/曝光/雾气、屏幕级氛围层
   ======================================================== */

const VisualQualitySystem = {
  level: 'high',
  settings: null,
  _game: null,
  _levels: ['low', 'medium', 'high', 'ultra'],
  _badgeTimer: 0,
  _lastWorldName: '',
  _cullTimer: 0,
  _ui: {
    vignette: null,
    glow: null,
    badge: null
  },
  presets: {
    low: {
      label: '流畅',
      pixelRatio: 1,
      shadows: false,
      shadowSize: 512,
      exposure: 1.04,
      fogScale: 1.18,
      vignette: 0.18,
      glow: 0.06,
      filter: 'saturate(1.02) contrast(1.02) brightness(1.01)'
    },
    medium: {
      label: '均衡',
      pixelRatio: 1.1,
      shadows: false,
      shadowSize: 1024,
      exposure: 1.1,
      fogScale: 1.05,
      vignette: 0.24,
      glow: 0.09,
      filter: 'saturate(1.08) contrast(1.05) brightness(1.015)'
    },
    high: {
      label: '高级',
      pixelRatio: 1.75,
      shadows: true,
      shadowSize: 2048,
      exposure: 1.16,
      fogScale: 0.96,
      vignette: 0.31,
      glow: 0.13,
      filter: 'saturate(1.14) contrast(1.08) brightness(1.02)'
    },
    ultra: {
      label: '电影',
      pixelRatio: 2,
      shadows: true,
      shadowSize: 3072,
      exposure: 1.2,
      fogScale: 0.9,
      vignette: 0.37,
      glow: 0.17,
      filter: 'saturate(1.18) contrast(1.1) brightness(1.025)'
    }
  },

  init(game) {
    this._game = game;
    this._ensureUi();
    this.level = this._readSavedLevel();
    this.settings = this._readSavedSettings(this.level);
    this._applyCurrent(true);
  },

  cycle() {
    const i = this._levels.indexOf(this.level);
    const next = this._levels[(i + 1) % this._levels.length];
    this.apply(next, false);
  },

  apply(level, silent) {
    this.level = this.presets[level] ? level : 'high';
    const autoQuality = this.settings ? this.settings.autoQuality !== false : true;
    this.settings = this._settingsFromPreset(this.level, autoQuality);
    this._applyCurrent(!!silent);
  },

  updateSetting(key, value, silent) {
    if (!this.settings) this.settings = this._settingsFromPreset(this.level, true);
    const allowed = ['renderScale', 'shadows', 'shadowSize', 'colorGrade', 'atmosphere', 'autoQuality'];
    if (!allowed.includes(key)) return;
    if (key === 'renderScale') value = Math.max(0.75, Math.min(2, Number(value) || 1));
    if (key === 'shadowSize') value = [512, 1024, 2048, 3072].includes(Number(value)) ? Number(value) : 1024;
    if (['shadows', 'colorGrade', 'atmosphere', 'autoQuality'].includes(key)) value = !!value;
    this.settings[key] = value;
    this._applyCurrent(!!silent);
  },

  getSettings() {
    return Object.assign({}, this.settings || this._settingsFromPreset(this.level, true));
  },

  resetRecommended(silent) {
    this.apply(this._isTouchDevice() ? 'low' : 'medium', !!silent);
  },

  _applyCurrent(silent) {
    const preset = this.presets[this.level] || this.presets.high;
    const settings = this.settings || this._settingsFromPreset(this.level, true);
    const game = this._game;
    const filter = settings.colorGrade ? preset.filter : 'none';
    const vignette = settings.atmosphere ? preset.vignette : 0;
    const glow = settings.atmosphere ? preset.glow : 0;

    document.documentElement.classList.remove(
      'visual-grade-low',
      'visual-grade-medium',
      'visual-grade-high',
      'visual-grade-ultra'
    );
    document.documentElement.classList.add('visual-grade-' + this.level);
    document.documentElement.style.setProperty('--visual-canvas-filter', filter);
    document.documentElement.style.setProperty('--visual-vignette-opacity', String(vignette));
    document.documentElement.style.setProperty('--visual-glow-opacity', String(glow));

    if (game && game.renderer) {
      const touch = this._isTouchDevice();
      const ratio = touch ? 1 : Math.min(window.devicePixelRatio || 1, settings.renderScale);
      game.renderer.setPixelRatio(ratio);
      game.renderer.setSize(window.innerWidth, window.innerHeight, false);
      game.renderer.shadowMap.enabled = touch ? false : settings.shadows;
      game.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      game.renderer.toneMappingExposure = preset.exposure;
      if (game.canvas) game.canvas.style.filter = filter;
    }

    this.applyWorld(game && game.currentWorld);
    this._saveLevel(this.level);
    this._saveSettings(settings);
    this._showBadge('画质：' + preset.label, silent);
  },

  applyWorld(world) {
    if (!world || !world.scene) return;
    const preset = this.presets[this.level] || this.presets.high;
    this._lastWorldName = world.name || '';
    this._restoreFogBase(world);
    this._applyFog(world, preset);
    this._applyLights(world, preset);
    this._applyWorldTone(world);
    this._cacheCullables(world);
  },

  update(dt, game) {
    if (!this._game && game) this._game = game;
    if (game && game.currentWorld && game.currentWorld.name !== this._lastWorldName) {
      this.applyWorld(game.currentWorld);
    }
    if (this._badgeTimer > 0) {
      this._badgeTimer = Math.max(0, this._badgeTimer - dt);
      if (this._ui.badge) this._ui.badge.classList.toggle('show', this._badgeTimer > 0);
    }
    this._updatePlayerAtmosphere(game);
    this._updateDistanceCulling(dt, game);
  },

  _ensureUi() {
    this._ui.vignette = this._ui.vignette || this._createLayer('cinematic-vignette');
    this._ui.glow = this._ui.glow || this._createLayer('atmosphere-glow');
    this._ui.badge = this._ui.badge || this._createLayer('visual-grade');
  },

  _createLayer(id) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      document.body.appendChild(el);
    }
    return el;
  },

  _showBadge(text, silent) {
    if (!this._ui.badge) return;
    this._ui.badge.textContent = text;
    if (silent) return;
    this._badgeTimer = 1.8;
    this._ui.badge.classList.add('show');
    if (typeof Dialogue !== 'undefined') Dialogue.show(text);
  },

  _restoreFogBase(world) {
    const fog = world.scene.fog;
    if (!fog || world._visualFogBase) return;
    world._visualFogBase = {
      type: fog.isFogExp2 ? 'exp2' : 'linear',
      near: fog.near,
      far: fog.far,
      density: fog.density,
      color: fog.color && fog.color.clone ? fog.color.clone() : null
    };
  },

  _applyFog(world, preset) {
    const fog = world.scene.fog;
    const base = world._visualFogBase;
    if (!fog || !base) return;
    if (base.color && fog.color) fog.color.copy(base.color);
    if (base.type === 'exp2') {
      fog.density = (base.density || 0.02) / Math.max(0.75, preset.fogScale);
      return;
    }
    fog.near = (base.near || 10) * preset.fogScale;
    fog.far = (base.far || 100) * preset.fogScale;
  },

  _applyLights(world, preset) {
    const settings = this.settings || this._settingsFromPreset(this.level, true);
    world.scene.traverse(obj => {
      if (!obj.isLight) return;
      if ((obj.isPointLight || obj.isSpotLight) && obj.userData.visualBaseIntensity == null) {
        obj.userData.visualBaseIntensity = obj.intensity;
      }
      if (obj.isHemisphereLight && obj.userData.visualBaseIntensity == null) {
        obj.userData.visualBaseIntensity = obj.intensity;
      }
      if (obj.isDirectionalLight && obj.userData.visualBaseIntensity == null) {
        obj.userData.visualBaseIntensity = obj.intensity;
      }
      if (obj.isHemisphereLight) {
        obj.intensity = obj.userData.visualBaseIntensity * (settings.shadows ? 0.95 : 1.1);
      }
      if (obj.isDirectionalLight) {
        obj.intensity = obj.userData.visualBaseIntensity * (settings.shadows ? 1.04 : 0.9);
        obj.castShadow = !!settings.shadows && obj.castShadow !== false;
        if (obj.shadow) {
          obj.shadow.mapSize.set(settings.shadowSize, settings.shadowSize);
          obj.shadow.bias = Math.min(obj.shadow.bias || -0.0003, -0.00035);
          obj.shadow.normalBias = Math.max(obj.shadow.normalBias || 0.02, 0.02);
          obj.shadow.needsUpdate = true;
        }
      }
      if (obj.isPointLight || obj.isSpotLight) {
        const showLocalLights = settings.atmosphere && !this._isTouchDevice() && (this.level === 'high' || this.level === 'ultra');
        obj.visible = showLocalLights;
        obj.intensity = showLocalLights ? obj.userData.visualBaseIntensity : 0;
        obj.castShadow = false;
      }
    });
  },

  _applyWorldTone(world) {
    const tones = {
      grassland: ['rgba(178,255,170,.18)', 'rgba(255,226,142,.1)'],
      forest: ['rgba(86,210,126,.16)', 'rgba(78,140,255,.08)'],
      highland: ['rgba(140,210,255,.14)', 'rgba(255,240,190,.1)'],
      snowland: ['rgba(180,225,255,.2)', 'rgba(255,255,255,.1)'],
      volcano: ['rgba(255,90,34,.2)', 'rgba(255,182,72,.12)'],
      desert: ['rgba(255,203,112,.18)', 'rgba(255,244,188,.1)'],
      dungeon: ['rgba(110,95,255,.15)', 'rgba(55,220,255,.08)'],
      castle: ['rgba(160,96,255,.18)', 'rgba(255,64,96,.08)']
    };
    const tone = tones[world.name] || tones.grassland;
    document.documentElement.style.setProperty('--visual-glow-a', tone[0]);
    document.documentElement.style.setProperty('--visual-glow-b', tone[1]);
  },

  _cacheCullables(world) {
    if (!world || !world.scene) return;
    const list = [];
    world.scene.traverse(obj => {
      const kind = obj && obj.userData && obj.userData.kind;
      const isBudgetedLandmark = kind === 'shrine' || kind === 'sheikahTower';
      if (!obj || !obj.userData || (obj.userData.perfCull !== true && !isBudgetedLandmark)) return;
      // 只缓存根装饰物，子 Mesh 跟着父级 visible 即可；避免每次更新几千个子节点。
      let p = obj.parent;
      while (p && p !== world.scene) {
        if (p.userData && p.userData.perfCull === true) return;
        p = p.parent;
      }
      list.push(obj);
    });
    world._visualCullables = list;
  },

  _updateDistanceCulling(dt, game) {
    const world = game && game.currentWorld;
    const player = game && game.player;
    if (!world || !player || !Array.isArray(world._visualCullables)) return;
    this._cullTimer -= dt;
    if (this._cullTimer > 0) return;
    const touch = this._isTouchDevice();
    const radius = touch || this.level === 'low' ? 34 : this.level === 'medium' ? 58 : 92;
    const radiusSq = radius * radius;
    this._cullTimer = touch || this.level === 'low' ? 0.22 : 0.32;
    const px = player.position.x;
    const pz = player.position.z;
    for (const obj of world._visualCullables) {
      if (!obj || !obj.position) continue;
      const dx = obj.position.x - px;
      const dz = obj.position.z - pz;
      const kind = obj.userData && obj.userData.kind;
      const objRadius = (kind === 'shrine' || kind === 'sheikahTower') ? radius * 1.45 : radius;
      const showSq = objRadius * objRadius;
      const hideRadius = objRadius * 1.22;
      const hideSq = hideRadius * hideRadius;
      const dSq = dx * dx + dz * dz;
      if (obj.visible) {
        obj.visible = dSq <= hideSq;
      } else {
        obj.visible = dSq <= showSq;
      }
    }
    if (Array.isArray(world.enemies)) {
      const baseVisibleRadius = touch || this.level === 'low' ? 56 : this.level === 'medium' ? 76 : 125;
      const basePreloadRadius = baseVisibleRadius + (touch || this.level === 'low' ? 28 : 40);
      const baseHideRadius = baseVisibleRadius + (touch || this.level === 'low' ? 16 : 22);
      const move = player.velocity && Math.hypot(player.velocity.x || 0, player.velocity.z || 0) > 0.08
        ? player.velocity.clone().setY(0).normalize()
        : new THREE.Vector3(Math.sin(player.facing || 0), 0, Math.cos(player.facing || 0)).normalize();
      for (const enemy of world.enemies) {
        if (!enemy || !enemy.mesh) continue;
        if (enemy.dead || enemy.hp <= 0) {
          enemy._streamActive = true;
          enemy.mesh.visible = true;
          continue;
        }
        const dx = enemy.mesh.position.x - px;
        const dz = enemy.mesh.position.z - pz;
        const dist = Math.hypot(dx, dz);
        const ahead = dist > 0.001 ? Math.max(0, (dx / dist) * move.x + (dz / dist) * move.z) : 0;
        const frontBoost = ahead > 0.22 ? (touch || this.level === 'low' ? 24 : 34) * ahead : 0;
        const visibleRadius = baseVisibleRadius + frontBoost;
        const preloadRadius = basePreloadRadius + frontBoost * 1.35;
        const hideRadius = baseHideRadius + frontBoost;
        const visibleSq = visibleRadius * visibleRadius;
        const preloadSq = preloadRadius * preloadRadius;
        const hideSq = hideRadius * hideRadius;
        const dSq = dx * dx + dz * dz;
        const force = enemy === game.lockedEnemy || enemy.hurtTimer > 0 || enemy.attackPhase;
        enemy._streamActive = force || dSq <= preloadSq;
        if (force) {
          enemy.mesh.visible = true;
        } else if (enemy.mesh.visible) {
          enemy.mesh.visible = dSq <= hideSq;
        } else {
          enemy.mesh.visible = dSq <= visibleSq;
        }
      }
    }
  },

  _updatePlayerAtmosphere(game) {
    const player = game && game.player;
    if (!player || !this._ui.vignette) return;
    const max = Math.max(1, player.maxHp * 4 || 1);
    const hpRatio = Math.max(0, Math.min(1, player.hp / max));
    const danger = hpRatio < 0.35 ? (0.35 - hpRatio) / 0.35 : 0;
    document.documentElement.style.setProperty('--visual-danger-opacity', String(danger * 0.28));
  },

  _readSavedLevel() {
    try {
      const saved = localStorage.getItem('zcodeVisualQuality');
      const touch = this._isTouchDevice();
      if (this.presets[saved]) {
        // 旧版本可能保存过 high/ultra。手机继续沿用旧高画质会直接变成个位数 FPS。
        if (touch) return saved === 'medium' ? 'medium' : 'low';
        return saved;
      }
      return touch ? 'low' : 'medium';
    } catch (_) {
      return 'medium';
    }
  },

  _settingsFromPreset(level, autoQuality) {
    const preset = this.presets[level] || this.presets.high;
    return {
      renderScale: preset.pixelRatio,
      shadows: preset.shadows,
      shadowSize: preset.shadowSize,
      colorGrade: true,
      atmosphere: level !== 'low',
      autoQuality: autoQuality !== false
    };
  },

  _readSavedSettings(level) {
    const defaults = this._settingsFromPreset(level, true);
    try {
      const raw = localStorage.getItem('zcodeVisualSettings');
      if (!raw) return defaults;
      const saved = JSON.parse(raw);
      const merged = Object.assign({}, defaults, saved || {});
      merged.renderScale = Math.max(0.75, Math.min(2, Number(merged.renderScale) || defaults.renderScale));
      merged.shadowSize = [512, 1024, 2048, 3072].includes(Number(merged.shadowSize)) ? Number(merged.shadowSize) : defaults.shadowSize;
      if (this._isTouchDevice()) {
        merged.renderScale = 1;
        merged.shadows = false;
        if (level === 'low') merged.atmosphere = false;
      } else if (level === 'medium') {
        merged.renderScale = Math.min(1.1, merged.renderScale);
        merged.shadows = false;
      }
      return merged;
    } catch (_) {
      return defaults;
    }
  },

  _isTouchDevice() {
    return ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  },

  _saveLevel(level) {
    try { localStorage.setItem('zcodeVisualQuality', level); }
    catch (_) {}
  },

  _saveSettings(settings) {
    try { localStorage.setItem('zcodeVisualSettings', JSON.stringify(settings)); }
    catch (_) {}
  }
};

if (typeof window !== 'undefined') window.VisualQualitySystem = VisualQualitySystem;
