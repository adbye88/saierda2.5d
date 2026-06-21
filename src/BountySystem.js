/* ========================================================
   BountySystem.js — 区域悬赏任务
   轻量目标：清营地 / 采集 / 扫描 / 开宝箱 / 持有材料
   状态全部进入 SaveSystem progress.bounties，云存档自动同步。
   ======================================================== */

const BountySystem = {
  worlds: {},

  init() {
    const p = SaveSystem.getProgress ? SaveSystem.getProgress() : {};
    if (!p.bounties) p.bounties = { claimed: [] };
    if (!Array.isArray(p.bounties.claimed)) p.bounties.claimed = [];
    SaveSystem.setProgress && SaveSystem.setProgress(p);
  },

  registerWorld(worldName, rows = []) {
    if (!worldName || !Array.isArray(rows)) return;
    this.worlds[worldName] = rows.map((row, i) => Object.assign({
      id: `${worldName}_bounty_${i}`,
      world: worldName,
      reward: [['rupee', 30]]
    }, row));
    this.init();
  },

  rowsForWorld(worldOrName, game = window.game) {
    const worldName = typeof worldOrName === 'string' ? worldOrName : (worldOrName && worldOrName.name);
    if (!worldName) return [];
    const rows = this.worlds[worldName] || [];
    return rows.map(row => {
      const progress = this._progressFor(row, game);
      const claimed = this.isClaimed(row.id);
      return Object.assign({}, row, {
        current: progress.current,
        target: progress.target,
        done: progress.current >= progress.target,
        claimed
      });
    });
  },

  update(game = window.game) {
    if (!game || !game.currentWorld) return;
    const ready = this.rowsForWorld(game.currentWorld, game).find(row => row.done && !row.claimed);
    if (ready && typeof HUD !== 'undefined') {
      HUD.setQuest(`区域悬赏完成：${ready.name}，打开任务领取奖励`, 0xffd86a);
    }
  },

  claim(id, game = window.game) {
    this.init();
    const row = this._find(id);
    if (!row) return false;
    const view = this.rowsForWorld(row.world, game).find(x => x.id === id);
    if (!view || !view.done || view.claimed) return false;
    const p = SaveSystem.getProgress();
    if (!p.bounties) p.bounties = { claimed: [] };
    if (!Array.isArray(p.bounties.claimed)) p.bounties.claimed = [];
    p.bounties.claimed.push(id);
    SaveSystem.setProgress(p);
    if (game && game.player && game.player.inventory) {
      for (const [itemId, count = 1] of (row.reward || [])) game.player.inventory.add(itemId, count);
    }
    if (typeof Dialogue !== 'undefined') Dialogue.show(`悬赏完成：${row.name}，奖励已领取！`);
    if (typeof Effects !== 'undefined' && game && game.player) Effects.pickupFlash(game.player.position.clone());
    return true;
  },

  isClaimed(id) {
    const p = SaveSystem.getProgress ? SaveSystem.getProgress() : {};
    return !!(p.bounties && Array.isArray(p.bounties.claimed) && p.bounties.claimed.includes(id));
  },

  _find(id) {
    for (const rows of Object.values(this.worlds)) {
      const found = rows.find(row => row.id === id);
      if (found) return found;
    }
    return null;
  },

  _progressFor(row, game) {
    const p = SaveSystem.getProgress ? SaveSystem.getProgress() : {};
    const target = Math.max(1, Number(row.target || 1));
    let current = 0;
    if (row.type === 'clearCamp') {
      current = this._countByPrefix(p.clearedCamps, row.prefix || row.world);
    } else if (row.type === 'harvest') {
      current = this._countByPrefix(p.harvestedNodes, row.prefix || row.world);
    } else if (row.type === 'scan') {
      current = this._countByPrefix(p.scannedCompendium, row.prefix || row.world);
    } else if (row.type === 'rumor') {
      current = this._countByPrefix(p.rumorsHeard, row.prefix || row.world);
    } else if (row.type === 'openChest') {
      const ids = row.ids || [];
      current = ids.length ? ids.filter(id => (p.chests || []).includes(id)).length : this._countByPrefix(p.chests, row.prefix || row.world);
    } else if (row.type === 'collect') {
      const inv = game && game.player && game.player.inventory;
      current = inv && inv.countOf ? inv.countOf(row.itemId) : 0;
    }
    return { current: Math.min(current, target), target };
  },

  _countByPrefix(list, prefix) {
    if (!Array.isArray(list)) return 0;
    if (!prefix) return list.length;
    return list.filter(id => String(id).startsWith(prefix)).length;
  }
};

if (typeof window !== 'undefined') window.BountySystem = BountySystem;
