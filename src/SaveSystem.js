/* ========================================================
   SaveSystem.js — 存档/读档系统
   - localStorage 持久化，最多 3 个存档槽位
   - 存档内容：玩家位置/血量/体力/背包/已解锁塔/世界状态/游戏进度
   - 自动存档：切换地图/击败Boss 时
   ======================================================== */

const SaveSystem = {
  KEY_PREFIX: 'wildbreath_save_',
  SLOT_COUNT: 3,
  KEY_PROGRESS: 'wildbreath_progress',  // 跨槽位共享的全局进度

  // ---------- 全局进度（已解锁塔、已击败Boss） ----------
  getProgress() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY_PROGRESS) || '{}');
    } catch (e) { return {}; }
  },
  setProgress(data) {
    localStorage.setItem(this.KEY_PROGRESS, JSON.stringify(data));
  },
  unlockTower(worldName) {
    const p = this.getProgress();
    if (!p.towers) p.towers = [];
    if (!p.towers.includes(worldName)) {
      p.towers.push(worldName);
      this.setProgress(p);
    }
  },
  defeatBoss(bossId) {
    const p = this.getProgress();
    if (!p.bosses) p.bosses = [];
    if (!p.bosses.includes(bossId)) {
      p.bosses.push(bossId);
      this.setProgress(p);
    }
  },
  isTowerUnlocked(worldName) {
    const p = this.getProgress();
    return p.towers && p.towers.includes(worldName);
  },
  isBossDefeated(bossId) {
    const p = this.getProgress();
    return p.bosses && p.bosses.includes(bossId);
  },
  clearShrine(shrineId) {
    const p = this.getProgress();
    if (!p.shrines) p.shrines = [];
    if (!p.shrines.includes(shrineId)) {
      p.shrines.push(shrineId);
      this.setProgress(p);
    }
  },
  isShrineCleared(shrineId) {
    const p = this.getProgress();
    return p.shrines && p.shrines.includes(shrineId);
  },
  openChest(chestId) {
    const p = this.getProgress();
    if (!p.chests) p.chests = [];
    if (!p.chests.includes(chestId)) {
      p.chests.push(chestId);
      this.setProgress(p);
    }
  },
  isChestOpened(chestId) {
    const p = this.getProgress();
    return p.chests && p.chests.includes(chestId);
  },

  // ---------- 槽位操作 ----------
  getSlotInfo(slot) {
    try {
      const raw = localStorage.getItem(this.KEY_PREFIX + slot);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return {
        slot,
        timestamp: data.timestamp,
        worldName: data.worldName,
        level: data.player ? data.player.hp / 4 : 0,
        rupees: data.inventory ? data.inventory.rupees : 0,
        playTime: data.playTime || 0
      };
    } catch (e) { return null; }
  },
  getAllSlots() {
    const slots = [];
    for (let i = 0; i < this.SLOT_COUNT; i++) slots.push(this.getSlotInfo(i));
    return slots;
  },

  save(slot) {
    const game = window.game;
    if (!game || !game.player) return false;
    const data = {
      timestamp: Date.now(),
      playTime: (this._loadPlayTime() + (Date.now() - (window.gameStartTime || Date.now()))) / 1000,
      worldName: game.currentWorld ? game.currentWorld.name : 'grassland',
      player: {
        x: game.player.position.x, y: game.player.position.y, z: game.player.position.z,
        facing: game.player.facing,
        hp: game.player.hp, stamina: game.player.stamina
      },
      inventory: game.player.inventory.serialize()
    };
    try {
      localStorage.setItem(this.KEY_PREFIX + slot, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('存档失败', e);
      return false;
    }
  },

  load(slot) {
    try {
      const raw = localStorage.getItem(this.KEY_PREFIX + slot);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  },

  applyLoad(data) {
    const game = window.game;
    if (!game || !game.player) return;
    // 切换到存档时的世界
    if (data.worldName && game.worlds[data.worldName]) {
      game.loadWorld(data.worldName);
    }
    // 玩家状态
    const p = data.player;
    if (p) {
      game.player.position.set(p.x || 0, p.y || 0, p.z || 0);
      game.player.facing = p.facing || 0;
      game.player.hp = p.hp || game.player.maxHp * 4;
      game.player.stamina = p.stamina || game.player.maxStamina;
      game.player.mesh.rotation.y = game.player.facing;
    }
    // 背包
    if (data.inventory) {
      game.player.inventory.deserialize(data.inventory);
      game.player.refreshEquipment();
      if (typeof window.__ensureStarterRangedKit === 'function') {
        window.__ensureStarterRangedKit();
      }
      if (typeof ChampionSystem !== 'undefined') ChampionSystem.init();
    }
    window.gameStartTime = Date.now();
  },

  deleteSlot(slot) {
    localStorage.removeItem(this.KEY_PREFIX + slot);
  },

  _loadPlayTime() {
    return (parseFloat(localStorage.getItem('wildbreath_playtime') || '0'));
  },
  _savePlayTime(sec) {
    localStorage.setItem('wildbreath_playtime', String(sec));
  }
};
