/* ========================================================
   HUD.js v2 — 平视显示
   心心、体力、卢比、武器、任务、小地图、Boss 血条
   + 怪物头顶血条（DOM 投影）+ 受击红屏 + 锁定标记
   ======================================================== */

const HUD = {
  heartsEl: null, stamEl: null, rupeeEl: null, weaponEl: null, arrowEl: null,
  questEl: null, minimapCtx: null, world: null,
  bossHpEl: null, bossHpFill: null, bossNameEl: null,
  vignetteEl: null,
  // 怪物血条缓存（DOM 元素）
  _enemyBars: new Map(),
  _cache: {},
  _timers: { minimap: 0, enemyBars: 0, buffs: 0, champions: 0 },

  init() {
    this.heartsEl = document.getElementById('hearts');
    this.stamEl   = document.getElementById('stamina-fill');
    this.rupeeEl  = document.getElementById('rupee');
    this.weaponEl = document.getElementById('weapon-info');
    this.arrowEl  = document.getElementById('arrow-type-btn');
    this.questEl  = document.getElementById('quest-tip');
    const mm = document.getElementById('minimap');
    this.minimapCtx = mm.getContext('2d');
    this.bossHpEl = document.getElementById('boss-hp');
    this.bossHpFill = document.getElementById('boss-hp-fill');
    this.bossNameEl = document.getElementById('boss-name');
    this.vignetteEl = document.getElementById('damage-vignette');
    this._cache = {};
    this._timers = { minimap: 0, enemyBars: 0, buffs: 0, champions: 0 };
  },

  show() { document.getElementById('hud').classList.remove('hidden'); },
  hide() { document.getElementById('hud').classList.add('hidden'); },

  setMinimapWorld(w) { this.world = w; },

  setQuest(text, color) {
    if (!this.questEl) return;
    this.questEl.textContent = text;
    this.questEl.style.color = '';
    if (color) this.questEl.style.borderColor = '#' + color.toString(16).padStart(6, '0');
  },

  // ===== 受击红屏闪烁 =====
  flashDamage() {
    if (!this.vignetteEl) return;
    this.vignetteEl.classList.add('flash');
    // 屏幕震动
    const canvas = document.getElementById('game-canvas');
    canvas.classList.add('shake');
    setTimeout(() => {
      this.vignetteEl.classList.remove('flash');
      canvas.classList.remove('shake');
    }, 300);
  },

  // ===== Boss 血条显示/更新 =====
  showBoss(name) {
    this.bossNameEl.textContent = name;
    this.bossHpEl.classList.add('show');
  },
  hideBoss() { this.bossHpEl.classList.remove('show'); },
  updateBoss(hpRatio) {
    this.bossHpFill.style.width = Math.max(0, hpRatio * 100) + '%';
  },

  // ===== 怪物头顶血条 =====
  updateEnemyBars(game) {
    if (!this.world) return;
    const visible = new Set();
    for (const e of this.world.enemies) {
      if (e.dead) continue;
      // 只显示视野内的、或正在战斗的、或锁定的
      const dist = e.mesh.position.distanceTo(game.player.position);
      const inCombat = e.state === 'chase' || e.state === 'attack' || e.hurtTimer > 0;
      const isBoss = e.boss;
      const isLocked = (game.lockedEnemy === e);
      if (dist > 16 && !inCombat && !isLocked) continue;
      visible.add(e);

      let bar = this._enemyBars.get(e);
      if (!bar) {
        bar = this._createEnemyBar(e);
        this._enemyBars.set(e, bar);
      }
      // 更新位置（投影世界坐标到屏幕）
      const pos = e.mesh.position.clone();
      pos.y += e.boss ? 6 : 2.2;
      const proj = pos.clone().project(game.camera);
      const sx = (proj.x * 0.5 + 0.5) * window.innerWidth;
      const sy = (-proj.y * 0.5 + 0.5) * window.innerHeight;
      bar.style.left = sx + 'px';
      bar.style.top = sy + 'px';
      // 更新血量
      const ratio = Math.max(0, e.hp / e.maxHp);
      const fill = bar.querySelector('.ebar-fill');
      fill.style.width = (ratio * 100) + '%';
      bar.querySelector('.ebar-name').textContent = e.def.name;
      bar.style.display = (proj.z < 1) ? 'block' : 'none';
    }
    // 清理不可见/已死的敌人血条
    for (const [e, bar] of this._enemyBars) {
      if (!visible.has(e) || e.dead || !e.mesh.parent) {
        bar.remove();
        this._enemyBars.delete(e);
      }
    }
  },

  _createEnemyBar(enemy) {
    const bar = document.createElement('div');
    const isBoss = enemy.boss;
    bar.className = 'enemy-bar' + (isBoss ? ' boss-bar' : '');
    bar.style.cssText = `
      position:absolute; z-index:11; transform:translate(-50%,-100%);
      pointer-events:none; text-align:center;
      ${isBoss ? 'width:160px;' : 'width:70px;'}
    `;
    bar.innerHTML = `
      <div class="ebar-name" style="font-size:${isBoss?12:9}px;color:#fff;text-shadow:0 1px 2px #000,0 0 2px #000;margin-bottom:2px;letter-spacing:1px;">${enemy.def.name}</div>
      <div style="width:100%;height:${isBoss?7:5}px;background:rgba(0,0,0,.7);border:1px solid rgba(255,255,255,.4);border-radius:3px;overflow:hidden;${isBoss?'box-shadow:0 0 8px rgba(255,80,80,.4);':''}">
        <div class="ebar-fill" style="height:100%;width:100%;background:linear-gradient(90deg,#ff3a3a,#ff8a3a);transition:width .15s;"></div>
      </div>
    `;
    document.body.appendChild(bar);
    return bar;
  },

  clearEnemyBars() {
    for (const [, bar] of this._enemyBars) bar.remove();
    this._enemyBars.clear();
  },

  // ===== 主更新 =====
  update(game, dt = 0.016) {
    if (!game.player) return;
    const p = game.player;
    // 心心
    const totalHearts = p.maxHp;
    const hpInHearts = p.hp / 4;
    const heartKey = totalHearts + '|' + Math.round(hpInHearts * 2) / 2;
    if (this._cache.hearts !== heartKey) {
      let html = '';
      for (let i = 0; i < totalHearts; i++) {
        const fill = hpInHearts - i;
        let cls = 'heart';
        if (fill <= 0) cls += ' empty';
        else if (fill < 1) cls += ' half';
        html += `<div class="${cls}"><div class="fill"></div></div>`;
      }
      this.heartsEl.innerHTML = html;
      this._cache.hearts = heartKey;
    }
    // 体力
    const staminaPct = Math.round(p.stamina / p.maxStamina * 100);
    if (this._cache.stamina !== staminaPct) {
      this.stamEl.style.width = staminaPct + '%';
      this._cache.stamina = staminaPct;
    }
    // 卢比
    if (this._cache.rupees !== p.inventory.rupees) {
      this.rupeeEl.innerHTML = `${ArtAssets.itemIconHtml('rupee', 'hud-item-icon')} ${p.inventory.rupees}`;
      this._cache.rupees = p.inventory.rupees;
    }
    // 武器信息
    const w = p.inventory.equipped.weapon;
    const s = p.inventory.equipped.shield;
    const b = p.inventory.equipped.bow;
    let parts = [];
    if (w) {
      const d = ITEMS[w.itemId];
      const crit = p.inventory.getCriticalStats ? p.inventory.getCriticalStats('weapon') : { chance: 0.01 };
      const maxDurability = w.maxDurability || d.durability;
      parts.push(`${ArtAssets.itemIconHtml(w.itemId, 'hud-item-icon')} ${d.name} <span style="opacity:.6;font-size:11px">攻${d.atk} |${w.durability}/${maxDurability} | ✦${(crit.chance * 100).toFixed(1)}%</span>`);
    }
    if (s) {
      const d = ITEMS[s.itemId];
      const maxDurability = s.maxDurability || d.durability;
      parts.push(`${ArtAssets.itemIconHtml(s.itemId, 'hud-item-icon')} <span style="font-size:11px">${s.durability}/${maxDurability}</span>`);
    }
    if (b) {
      const d = ITEMS[b.itemId];
      const crit = p.inventory.getCriticalStats ? p.inventory.getCriticalStats('bow') : { chance: 0.01 };
      const maxDurability = b.maxDurability || d.durability;
      const aim = p.bowMode
        ? ` <span style="color:#ffe16a;font-size:11px">瞄准中${game.lockedEnemy ? '：' + game.lockedEnemy.def.name : ''}</span>`
        : '';
      parts.push(`${ArtAssets.itemIconHtml(b.itemId, 'hud-item-icon')} <span style="font-size:11px">${b.durability}/${maxDurability} | ➹${p.inventory.arrows} | ✦${(crit.chance * 100).toFixed(1)}%</span>${aim}`);
    }
    if (parts.length === 0) parts.push('空手 — 按🎒拿武器');
    const weaponHtml = parts.join('<br>');
    if (this._cache.weapon !== weaponHtml) {
      this.weaponEl.innerHTML = weaponHtml;
      this._cache.weapon = weaponHtml;
    }
    if (this.arrowEl) {
      const hasBowInPack = !!b || (p.inventory.slots.bow && p.inventory.slots.bow.length > 0);
      const hasArrowInfo = hasBowInPack || p.inventory.arrows > 0;
      const label = p.arrowTypeLabel ? p.arrowTypeLabel() : '普通箭';
      const arrowText = `➹ ${label} ×${p.inventory.arrows}`;
      const arrowKey = `${hasArrowInfo}|${p.inventory.arrows <= 0}|${arrowText}|${!!p.bowMode}`;
      if (this._cache.arrow !== arrowKey) {
        this.arrowEl.classList.toggle('hidden', !hasArrowInfo);
        this.arrowEl.disabled = p.inventory.arrows <= 0;
        this.arrowEl.textContent = arrowText;
        this.arrowEl.classList.toggle('active', !!p.bowMode);
        this._cache.arrow = arrowKey;
      }
    }
    // 小地图
    this._timers.minimap -= dt;
    if (this._timers.minimap <= 0) {
      this._timers.minimap = 0.16;
      this._drawMinimap(game);
    }
    // 怪物血条
    this._timers.enemyBars -= dt;
    if (this._timers.enemyBars <= 0) {
      this._timers.enemyBars = 0.08;
      this.updateEnemyBars(game);
    }
    // Buff 栏
    this._timers.buffs -= dt;
    if (this._timers.buffs <= 0) {
      this._timers.buffs = 0.25;
      this._updateBuffs(p);
    }
    this._timers.champions -= dt;
    if (this._timers.champions <= 0) {
      this._timers.champions = 0.35;
      this._updateChampions(p);
    }
    // 抗性提示（极端地形警告）
    this._updateResistWarn(p);
    // 锁定视觉
    ActionButtons.setLockActive(!!game.lockedEnemy);
    ActionButtons.setFlurryVisible(!!(p._flurryRushReady > 0 && p._flurryRushTarget));
    // Boss
    const activeBoss = this.world && this.world.boss && this.world.boss._bossActive && !this.world.boss.dead
      ? this.world.boss
      : (this.world && this.world.activeFieldBoss && !this.world.activeFieldBoss.dead ? this.world.activeFieldBoss : null);
    if (activeBoss) {
      this.showBoss(activeBoss.def.name);
      this.updateBoss(activeBoss.hp / activeBoss.maxHp);
    } else if (this.world && (!this.world.boss || this.world.boss.dead)) {
      this.hideBoss();
    }
  },

  _drawMinimap(game) {
    const ctx = this.minimapCtx;
    if (!ctx || !this.world) return;
    const W = 120, H = 120;
    ctx.clearRect(0, 0, W, H);
    const b = this.world.bounds;
    const sx = W / (b.maxX - b.minX);
    const sz = H / (b.maxZ - b.minZ);
    // 背景
    ctx.fillStyle = 'rgba(40,80,40,0.5)';
    ctx.fillRect(0, 0, W, H);
    // 玩家（三角形指向朝向）
    const p = game.player.position;
    ctx.save();
    ctx.translate((p.x - b.minX) * sx, (p.z - b.minZ) * sz);
    ctx.rotate(game.player.facing);
    ctx.fillStyle = '#5af0ff';
    ctx.beginPath();
    ctx.moveTo(0, -4); ctx.lineTo(3, 3); ctx.lineTo(-3, 3); ctx.closePath();
    ctx.fill();
    ctx.restore();
    // 敌人
    for (const e of this.world.enemies) {
      if (e.dead) continue;
      ctx.fillStyle = e.boss ? '#ff5a3a' : '#ff5a5a';
      ctx.beginPath();
      const r = e.boss ? 5 : 2.5;
      ctx.arc((e.mesh.position.x - b.minX) * sx, (e.mesh.position.z - b.minZ) * sz, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // 传送门
    ctx.fillStyle = '#ffd54f';
    for (const g of this.world.gates) {
      ctx.beginPath();
      ctx.arc((g.position.x - b.minX) * sx, (g.position.z - b.minZ) * sz, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // NPC
    ctx.fillStyle = '#5aff5a';
    for (const n of this.world.npcs) {
      ctx.beginPath();
      ctx.arc((n.mesh.position.x - b.minX) * sx, (n.mesh.position.z - b.minZ) * sz, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // 拾取物
    ctx.fillStyle = '#fff080';
    for (const d of this.world.drops) {
      if (d.pickedUp) continue;
      ctx.fillRect((d.mesh.position.x - b.minX) * sx - 1, (d.mesh.position.z - b.minZ) * sz - 1, 2, 2);
    }
  },

  // ===== Buff 栏显示 =====
  _updateBuffs(player) {
    const bar = document.getElementById('buff-bar');
    if (!bar) return;
    const buffs = player.inventory.buffs;
    const icons = {
      coldRes: '❄️防寒', heatRes: '☀️防热', fireRes: '🔥耐火',
      speed: '💨加速', attack: '⚔️攻击', defense: '🛡️防御',
      staminaRegen: '⭐回体力'
    };
    let html = '';
    for (const k in buffs) {
      const remain = Math.max(0, Math.ceil(buffs[k]));
      const min = Math.floor(remain / 60);
      const sec = remain % 60;
      html += `<div class="buff-icon">${icons[k] || k}<span>${min}:${String(sec).padStart(2,'0')}</span></div>`;
    }
    const setBonus = player.inventory.getSetBonus ? player.inventory.getSetBonus() : null;
    if (setBonus) {
      html += `<div class="buff-icon set-buff">套装<span>${setBonus.name}</span></div>`;
    }
    if (player._flurryTimer > 0) {
      html += `<div class="buff-icon flurry-buff">突袭<span>${player._flurryTimer.toFixed(1)}s</span></div>`;
    }
    if (player._flurryRushReady > 0 && player._flurryRushTarget) {
      html += `<div class="buff-icon flurry-buff">林克时间<span>点突袭</span></div>`;
    }
    bar.innerHTML = html;
  },

  _updateChampions(player) {
    const bar = document.getElementById('champion-bar');
    if (!bar || typeof ChampionSystem === 'undefined') return;
    const progress = QuestSystem.progress || {};
    const champions = progress.champions || [];
    const glider = progress.gotGlider
      ? `<div class="champion-icon ${player.isGliding ? 'ready' : ''}"><span>滑翔伞</span><span>${player.isGliding ? '滑翔中 ' + Math.round(player.stamina / player.maxStamina * 100) + '%体力' : '跳跃长按'}</span></div>`
      : '';
    const names = {
      water: '米法之赐',
      fire: '达尔克尔之护',
      wind: '力巴尔之猛',
      thunder: '乌尔波扎之怒'
    };
    let html = glider;
    for (const key of ['water', 'fire', 'wind', 'thunder']) {
      if (!champions.includes(key)) continue;
      const remain = Math.ceil(ChampionSystem.timers[key] || 0);
      const ready = remain <= 0;
      html += `<div class="champion-icon ${ready ? 'ready' : 'cooling'}"><span>${names[key]}</span><span>${ready ? '可用' : remain + 's'}</span></div>`;
    }
    bar.innerHTML = html;
  },

  // ===== 极端地形抗性提示 =====
  _updateResistWarn(player) {
    if (!this.world) return;
    const resist = player.inventory.getResist();
    const buffs = player.inventory.buffs;
    let warn = null;
    if (this.world.name === 'snowland' && resist.cold === 0 && !buffs.coldRes) {
      warn = '❄️ 寒气侵蚀中！穿防寒衣或吃防寒料理';
    } else if (this.world.name === 'volcano' && resist.fire === 0 && !buffs.fireRes) {
      warn = '🔥 灼烧中！穿耐火上衣或吃防火料理';
    } else if (this.world.name === 'desert' && resist.heat === 0 && !buffs.heatRes) {
      warn = '☀️ 中暑中！穿防热衣或吃防热料理';
    }
    if (warn && !this._warnLocked) {
      this._warnLocked = true;
      this.setQuest(warn, 0xff5a3a);
      setTimeout(() => { this._warnLocked = false; }, 2000);
    }
  }
};;
