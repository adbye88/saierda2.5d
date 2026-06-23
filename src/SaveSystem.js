/* ========================================================
   SaveSystem.js — 存档/读档系统
   - 云端 JSON 持久化：账号/存档由 cloud-server.mjs 写入 data/cloud-db.json
   - 浏览器侧只保留本次运行的内存缓存；旧 localStorage 槽位仅作为兼容读取
   - 存档内容：玩家位置/血量/体力/背包/已解锁塔/世界状态/游戏进度
   - 自动存档：切换地图/击败Boss 时
   ======================================================== */

const SaveSystem = {
  KEY_PREFIX: 'wildbreath_save_',
  SLOT_COUNT: 3,
  KEY_PROGRESS: 'wildbreath_progress',  // 跨槽位共享的全局进度
  _pendingCloudCurrent: null,
  _runtimeProgress: null,
  _runtimeSlots: [null, null, null],
  _runtimePlayTime: 0,

  // ---------- 全局进度（已解锁塔、已击败Boss） ----------
  getProgress() {
    if (this._runtimeProgress) return this._runtimeProgress;
    this._runtimeProgress = {};
    // 兼容旧版本：如果玩家曾经用 localStorage 存过进度，只读取一次用于迁移到云端，不再写回本地。
    try {
      const legacy = JSON.parse(localStorage.getItem(this.KEY_PROGRESS) || 'null');
      if (legacy && typeof legacy === 'object') this._runtimeProgress = legacy;
    } catch (e) {}
    return this._runtimeProgress;
  },
  setProgress(data) {
    this._runtimeProgress = data && typeof data === 'object' ? data : {};
    if (typeof CloudAccountSystem !== 'undefined') CloudAccountSystem.scheduleAutoSync('progress');
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
    const data = this._runtimeSlots[slot] || this._readLegacySlot(slot);
    if (!data) return null;
    return {
      slot,
      timestamp: data.timestamp,
      worldName: data.worldName,
      level: data.player ? data.player.hp / 4 : 0,
      rupees: data.inventory ? data.inventory.rupees : 0,
      playTime: data.playTime || 0
    };
  },
  _readLegacySlot(slot) {
    try {
      const raw = localStorage.getItem(this.KEY_PREFIX + slot);
      if (!raw) return null;
      return JSON.parse(raw);
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
    const data = this.createSnapshot();
    try {
      this._runtimeSlots[slot] = data;
      if (typeof CloudAccountSystem !== 'undefined') CloudAccountSystem.scheduleAutoSync('slot-save');
      return true;
    } catch (e) {
      console.error('存档失败', e);
      return false;
    }
  },

  createSnapshot() {
    const game = window.game;
    const now = Date.now();
    const playTime = this._loadPlayTime() + ((game && game.player) ? (now - (window.gameStartTime || now)) / 1000 : 0);
    const data = {
      timestamp: now,
      playTime,
      worldName: game && game.currentWorld ? game.currentWorld.name : 'grassland',
      player: null,
      inventory: null
    };
    if (game && game.player) {
      data.player = {
        x: game.player.position.x, y: game.player.position.y, z: game.player.position.z,
        facing: game.player.facing,
        hp: game.player.hp, stamina: game.player.stamina
      };
      data.inventory = game.player.inventory.serialize();
    }
    return data;
  },

  load(slot) {
    try {
      return this._runtimeSlots[slot] || this._readLegacySlot(slot);
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
      game.player.hp = this._clampLoadedPlayerHp(p.hp, game.player);
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
    this._runtimeSlots[slot] = null;
    // 删除旧版本遗留的本地槽位，避免误以为仍在使用本地存档。
    try { localStorage.removeItem(this.KEY_PREFIX + slot); } catch (e) {}
    if (typeof CloudAccountSystem !== 'undefined') CloudAccountSystem.scheduleAutoSync('slot-delete');
  },

  exportCloudState(label = '云存档') {
    const slots = [];
    for (let i = 0; i < this.SLOT_COUNT; i++) {
      slots.push(this._runtimeSlots[i] || null);
    }
    return {
      version: 1,
      game: 'wildbreath-mini',
      label,
      timestamp: Date.now(),
      progress: this.getProgress(),
      playTime: this._loadPlayTime(),
      slots,
      current: this.createSnapshot()
    };
  },

  importCloudState(archive, applyToGame = true) {
    if (!archive) return false;
    try {
      if (archive.progress) this.setProgress(archive.progress);
      if (Array.isArray(archive.slots)) {
        for (let i = 0; i < this.SLOT_COUNT; i++) {
          const data = archive.slots[i];
          this._runtimeSlots[i] = data || null;
        }
      }
      if (typeof archive.playTime === 'number') this._savePlayTime(archive.playTime);
      if (applyToGame && archive.current) {
        if (window.game && window.game.player) {
          this.applyLoad(archive.current);
        } else {
          this._pendingCloudCurrent = archive.current;
        }
      }
      if (typeof QuestSystem !== 'undefined') QuestSystem.init();
      if (typeof StorySystem !== 'undefined') StorySystem.init();
      if (typeof ChampionSystem !== 'undefined') ChampionSystem.init();
      return true;
    } catch (e) {
      console.error('导入云存档失败', e);
      return false;
    }
  },

  consumePendingCloudCurrent() {
    const pending = this._pendingCloudCurrent;
    this._pendingCloudCurrent = null;
    return pending || null;
  },

  peekPendingCloudCurrent() {
    return this._pendingCloudCurrent || null;
  },

  hasPendingCloudCurrent() {
    return !!this._pendingCloudCurrent;
  },

  _loadPlayTime() {
    return this._runtimePlayTime || 0;
  },
  _savePlayTime(sec) {
    this._runtimePlayTime = Number(sec) || 0;
  },

  _clampLoadedPlayerHp(value, player) {
    const max = player && typeof player._maxHpValue === 'function'
      ? player._maxHpValue()
      : Math.max(1, ((player && player.maxHp) || 1) * 4);
    const n = Number(value);
    if (!Number.isFinite(n)) return max;
    return Math.max(1, Math.min(max, n));
  }
};
