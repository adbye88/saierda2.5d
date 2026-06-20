/* ========================================================
   QualitySettingsUI.js — 游戏内画质设置面板
   ======================================================== */

const QualitySettingsUI = {
  game: null,
  el: null,
  _resumeState: null,
  _fpsTimer: 0,

  init(game) {
    this.game = game;
    this.el = document.getElementById('quality-settings');
    if (!this.el) return;

    document.getElementById('quality-close').addEventListener('click', () => this.close());
    document.getElementById('quality-done').addEventListener('click', () => this.close());
    document.getElementById('quality-reset').addEventListener('click', () => {
      VisualQualitySystem.resetRecommended(false);
      this.sync();
    });

    this.el.querySelectorAll('[data-quality-level]').forEach(btn => {
      btn.addEventListener('click', () => {
        VisualQualitySystem.apply(btn.dataset.qualityLevel, false);
        this.sync();
      });
    });

    const renderScale = document.getElementById('quality-render-scale');
    renderScale.addEventListener('input', () => {
      VisualQualitySystem.updateSetting('renderScale', renderScale.value, true);
      this.sync(false);
    });

    document.getElementById('quality-shadows').addEventListener('change', e => {
      VisualQualitySystem.updateSetting('shadows', e.target.checked, false);
      this.sync(false);
    });
    document.getElementById('quality-shadow-size').addEventListener('change', e => {
      VisualQualitySystem.updateSetting('shadowSize', e.target.value, false);
      this.sync(false);
    });
    document.getElementById('quality-color-grade').addEventListener('change', e => {
      VisualQualitySystem.updateSetting('colorGrade', e.target.checked, false);
      this.sync(false);
    });
    document.getElementById('quality-atmosphere').addEventListener('change', e => {
      VisualQualitySystem.updateSetting('atmosphere', e.target.checked, false);
      this.sync(false);
    });
    document.getElementById('quality-auto').addEventListener('change', e => {
      VisualQualitySystem.updateSetting('autoQuality', e.target.checked, true);
      this.sync(false);
    });

    this.sync();
    window.__openQualitySettings = () => this.open();
  },

  open() {
    if (!this.el || !this.el.classList.contains('hidden')) return;
    this._resumeState = this.game ? this.game.state : null;
    if (this.game && this.game.state === 'playing') this.game.state = 'paused';
    this.el.classList.remove('hidden');
    this.sync();
    clearInterval(this._fpsTimer);
    this._fpsTimer = setInterval(() => this._updateStatus(), 800);
  },

  close() {
    if (!this.el || this.el.classList.contains('hidden')) return;
    this.el.classList.add('hidden');
    clearInterval(this._fpsTimer);
    this._fpsTimer = 0;
    if (this.game && this._resumeState === 'playing') this.game.state = 'playing';
    this._resumeState = null;
  },

  toggle() {
    if (!this.el || this.el.classList.contains('hidden')) this.open();
    else this.close();
  },

  sync(updatePresets = true) {
    if (!this.el || typeof VisualQualitySystem === 'undefined') return;
    const settings = VisualQualitySystem.getSettings();
    if (updatePresets) {
      this.el.querySelectorAll('[data-quality-level]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.qualityLevel === VisualQualitySystem.level);
      });
    }
    document.getElementById('quality-render-scale').value = settings.renderScale;
    document.getElementById('quality-render-value').textContent = Number(settings.renderScale).toFixed(2) + '×';
    document.getElementById('quality-shadows').checked = settings.shadows;
    document.getElementById('quality-shadow-size').value = String(settings.shadowSize);
    document.getElementById('quality-shadow-size').disabled = !settings.shadows;
    document.getElementById('quality-color-grade').checked = settings.colorGrade;
    document.getElementById('quality-atmosphere').checked = settings.atmosphere;
    document.getElementById('quality-auto').checked = settings.autoQuality;
    this._updateStatus();
  },

  _updateStatus() {
    if (!this.el || this.el.classList.contains('hidden')) return;
    const preset = VisualQualitySystem.presets[VisualQualitySystem.level] || VisualQualitySystem.presets.high;
    const fps = typeof AdaptivePerformanceSystem !== 'undefined' ? AdaptivePerformanceSystem.averageFps() : 60;
    const status = document.getElementById('quality-live-status');
    if (status) status.textContent = `${preset.label}画质 · ${fps} FPS`;
  }
};

if (typeof window !== 'undefined') window.QualitySettingsUI = QualitySettingsUI;
