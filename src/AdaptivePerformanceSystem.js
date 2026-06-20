/* ========================================================
   AdaptivePerformanceSystem.js — 运行时性能保护
   职责：FPS 采样、低帧率自动降画质、压测数据暴露
   ======================================================== */

const AdaptivePerformanceSystem = {
  _game: null,
  _samples: [],
  _time: 0,
  _cooldown: 0,
  _bootGrace: 6,
  _lastFps: 60,

  init(game) {
    this._game = game;
    this._samples = [];
    this._time = 0;
    this._cooldown = 0;
    this._bootGrace = 6;
  },

  update(dt) {
    if (!dt || dt <= 0) return;
    this._time += dt;
    this._cooldown = Math.max(0, this._cooldown - dt);
    this._bootGrace = Math.max(0, this._bootGrace - dt);
    const fps = Math.min(120, 1 / Math.max(0.001, dt));
    this._samples.push(fps);
    if (this._samples.length > 180) this._samples.shift();
    if (this._samples.length < 90 || this._bootGrace > 0 || this._cooldown > 0) return;
    const avg = this.averageFps();
    this._lastFps = avg;
    const settings = typeof VisualQualitySystem !== 'undefined' && VisualQualitySystem.getSettings
      ? VisualQualitySystem.getSettings()
      : { autoQuality: true };
    if (avg < 28 && settings.autoQuality !== false && typeof VisualQualitySystem !== 'undefined') {
      this._stepDownQuality(avg);
    }
  },

  averageFps() {
    if (!this._samples.length) return this._lastFps;
    let sum = 0;
    for (const fps of this._samples) sum += fps;
    return Math.round(sum / this._samples.length);
  },

  snapshot() {
    const quality = (typeof VisualQualitySystem !== 'undefined' && VisualQualitySystem.level) || 'unknown';
    return {
      fps: this.averageFps(),
      quality,
      samples: this._samples.length,
      autoQuality: typeof VisualQualitySystem === 'undefined' || !VisualQualitySystem.getSettings
        ? true
        : VisualQualitySystem.getSettings().autoQuality !== false
    };
  },

  _stepDownQuality(avg) {
    const levels = ['low', 'medium', 'high', 'ultra'];
    const current = VisualQualitySystem.level || 'high';
    const idx = levels.indexOf(current);
    if (idx <= 0) return;
    const next = levels[idx - 1];
    VisualQualitySystem.apply(next, false);
    this._cooldown = 18;
    this._samples = [];
    if (typeof Dialogue !== 'undefined') {
      Dialogue.show(`帧率 ${avg}，已自动切到${VisualQualitySystem.presets[next].label}画质保持流畅`, 1800);
    }
  }
};

if (typeof window !== 'undefined') window.AdaptivePerformanceSystem = AdaptivePerformanceSystem;
