/* ========================================================
   AudioSystem.js — 轻量程序化音效
   不依赖外部音频文件，首次开始游戏后解锁 WebAudio。
   ======================================================== */

const AudioSystem = {
  ctx: null,
  enabled: true,
  _musicTimer: null,
  _musicWorld: 'grassland',
  _musicIndex: 0,
  _bossWarnAt: 0,

  _themes: {
    grassland: { notes: [196, 247, 294, 330, 294, 247], gap: 1500, gain: 0.018, type: 'sine' },
    forest:    { notes: [165, 196, 220, 247, 220, 196], gap: 1700, gain: 0.016, type: 'triangle' },
    highland:  { notes: [196, 220, 262, 330, 294, 262], gap: 1450, gain: 0.017, type: 'sine' },
    snowland:  { notes: [147, 196, 220, 262, 220, 196], gap: 1900, gain: 0.014, type: 'sine' },
    volcano:   { notes: [110, 147, 165, 196, 165, 147], gap: 1300, gain: 0.02,  type: 'sawtooth' },
    desert:    { notes: [131, 165, 196, 247, 196, 165], gap: 1600, gain: 0.016, type: 'triangle' },
    castle:    { notes: [98, 123, 147, 185, 147, 123],  gap: 1200, gain: 0.022, type: 'sawtooth' }
  },

  init() {},

  _ensure() {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },

  tone(freq, duration = 0.12, type = 'sine', gain = 0.08, slideTo = null) {
    const ctx = this._ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
    amp.gain.setValueAtTime(0.0001, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + 0.015);
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(amp).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);
  },

  play(name) {
    if (name === 'slash') this.tone(420, 0.09, 'triangle', 0.05, 720);
    else if (name === 'hit') this.tone(150, 0.11, 'square', 0.06, 90);
    else if (name === 'pickup') {
      this.tone(660, 0.08, 'sine', 0.05, 990);
      setTimeout(() => this.tone(880, 0.09, 'sine', 0.04, 1320), 70);
    } else if (name === 'boss') {
      const now = Date.now();
      if (now - this._bossWarnAt < 2200) return;
      this._bossWarnAt = now;
      this.tone(92, 0.35, 'sawtooth', 0.08, 52);
    } else if (name === 'power') {
      this.tone(520, 0.18, 'triangle', 0.06, 1040);
    } else if (name === 'warp') {
      this.tone(330, 0.24, 'sine', 0.05, 880);
    }
  },

  setWorld(worldName) {
    if (!worldName || worldName === this._musicWorld) return;
    this._musicWorld = worldName;
    this._musicIndex = 0;
    if (this._musicTimer && this.ctx) {
      this.stopMusic();
      this.startMusic(worldName);
    }
  },

  stopMusic() {
    if (this._musicTimer) {
      clearInterval(this._musicTimer);
      this._musicTimer = null;
    }
  },

  startMusic(worldName) {
    if (worldName) this._musicWorld = worldName;
    const ctx = this._ensure();
    if (!ctx || this._musicTimer) return;
    const theme = this._themes[this._musicWorld] || this._themes.grassland;
    this._musicIndex = 0;
    this._musicTimer = setInterval(() => {
      if (!this.enabled || !this.ctx) return;
      const freshTheme = this._themes[this._musicWorld] || this._themes.grassland;
      const note = freshTheme.notes[this._musicIndex % freshTheme.notes.length];
      this.tone(note, 0.28, freshTheme.type, freshTheme.gain);
      this._musicIndex++;
    }, theme.gap);
  }
};
