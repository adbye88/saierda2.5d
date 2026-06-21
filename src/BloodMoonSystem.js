/* ========================================================
   BloodMoonSystem.js — 血月刷新机制
   - 刷新可重复内容：营地、采集点、血月补给
   - 保留主线/神庙/图鉴/传闻/料理配方/云账号进度
   ======================================================== */

const BloodMoonSystem = {
  interval: 18 * 60,
  _timer: 0,
  _saveTimer: 0,
  _flashTimer: 0,

  init() {
    const p = SaveSystem.getProgress ? SaveSystem.getProgress() : {};
    if (!p.bloodMoon) {
      p.bloodMoon = { elapsed: 0, lastCycle: 0, count: 0, nextAt: this.interval };
      SaveSystem.setProgress && SaveSystem.setProgress(p);
    }
    return p.bloodMoon;
  },

  update(game, dt) {
    if (!game || game.state !== 'playing') return;
    const p = SaveSystem.getProgress ? SaveSystem.getProgress() : {};
    const moon = p.bloodMoon || this.init();
    moon.elapsed = (moon.elapsed || 0) + dt;
    moon.nextAt = Math.max(0, this.interval - ((moon.elapsed || 0) % this.interval));
    p.bloodMoon = moon;
    this._timer += dt;
    this._saveTimer += dt;
    if (moon.elapsed - (moon.lastCycle || 0) >= this.interval) {
      this.trigger(game, 'cycle');
    } else if (this._timer > 12 && moon.nextAt < 45 && typeof HUD !== 'undefined') {
      this._timer = 0;
      HUD.setQuest(`血月将至：${Math.ceil(moon.nextAt)} 秒后怪物与采集点刷新`, 0xff6666);
    }
    if (this._saveTimer >= 10) {
      this._saveTimer = 0;
      SaveSystem.setProgress && SaveSystem.setProgress(p);
    }
    this._updateAtmosphere(game, dt);
  },

  trigger(game = window.game, reason = 'manual') {
    const p = SaveSystem.getProgress ? SaveSystem.getProgress() : {};
    const moon = p.bloodMoon || this.init();
    moon.count = (moon.count || 0) + 1;
    moon.lastCycle = moon.elapsed || 0;
    moon.nextAt = this.interval;
    p.bloodMoon = moon;
    this.resetRepeatableProgress(p);
    SaveSystem.setProgress && SaveSystem.setProgress(p);
    if (game && game.worlds) {
      for (const world of Object.values(game.worlds)) this.refreshWorld(world, game);
    }
    this._flashTimer = 7;
    if (typeof Dialogue !== 'undefined') Dialogue.show('☾ 血月升起……被击败的怪物和野外资源重新出现。', 5200);
    if (typeof HUD !== 'undefined') HUD.setQuest(`血月刷新完成：第 ${moon.count} 次`, 0xff5555);
    if (typeof Effects !== 'undefined' && game && game.player) Effects.elementalAura(game.player.position.clone().setY(1.5), 0xff3333);
    return reason;
  },

  resetRepeatableProgress(progress) {
    progress.clearedCamps = [];
    progress.harvestedNodes = [];
    if (!progress.bloodMoon) progress.bloodMoon = { elapsed: 0, lastCycle: 0, count: 0, nextAt: this.interval };
    return progress;
  },

  refreshWorld(world, game = window.game) {
    if (!world || !world._built || typeof ExplorationSystem === 'undefined') return;
    if (ExplorationSystem.respawnHarvestNodes) ExplorationSystem.respawnHarvestNodes(world);
    for (const camp of (world.camps || [])) {
      if (ExplorationSystem.respawnCamp) ExplorationSystem.respawnCamp(world, camp, game);
    }
    this._refreshBloodMoonChests(world);
  },

  _refreshBloodMoonChests(world) {
    if (!world || !world._bloodMoonChestDefs || typeof SaveSystem === 'undefined') return;
    const p = SaveSystem.getProgress();
    if (!Array.isArray(p.chests)) p.chests = [];
    let changed = false;
    for (const def of world._bloodMoonChestDefs) {
      if (p.chests.includes(def.id)) {
        p.chests = p.chests.filter(id => id !== def.id);
        changed = true;
      }
    }
    if (changed) SaveSystem.setProgress(p);
    for (const def of world._bloodMoonChestDefs) {
      const exists = (world.breakables || []).some(b => b.mesh && b.mesh.userData && b.mesh.userData.chestId === def.id && !b.broken);
      if (!exists && world.addLootChest) world.addLootChest(def.id, def.x, def.z, def.items, def.label, Object.assign({}, def, { itemOptions: { rollModifier: true, modifierChance: 0.5, source: 'bloodMoonChest' } }));
    }
  },

  _updateAtmosphere(game, dt) {
    if (this._flashTimer <= 0 || !game || !game.renderer) return;
    this._flashTimer -= dt;
    const k = Math.max(0, this._flashTimer / 7);
    if (game.renderer && game.renderer.toneMappingExposure !== undefined) {
      game.renderer.toneMappingExposure = 1.15 + Math.sin(k * Math.PI) * 0.18;
    }
  }
};

if (typeof window !== 'undefined') window.BloodMoonSystem = BloodMoonSystem;
