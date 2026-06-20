/* ========================================================
   MapMenu.js — 大地图/传送菜单
   - 显示海拉鲁全域，已解锁的远古塔可传送
   - 按 M 键或菜单按钮打开
   - 同时包含存档/读档入口
   ======================================================== */

const MapMenu = {
  isOpen: false,
  el: null,
  mode: 'travel',  // travel | save | load

  WORLD_INFO: {
    grassland: { name: '起始台地', icon: '🌳', color: '#6a9a4a', x: 50, y: 50, desc: '草原，冒险起点' },
    forest:    { name: '迷失森林', icon: '🌲', color: '#2a5a2a', x: 50, y: 25, desc: '茂密森林，莫力布林出没' },
    highland:  { name: '费罗尼高地', icon: '⛰️', color: '#6f9650', x: 50, y: 78, desc: '丘陵与双河交错的中阶探索区' },
    snowland:  { name: '赫布拉雪山', icon: '🏔️', color: '#aaccdd', x: 20, y: 35, desc: '极寒之地，需防寒装备' },
    volcano:   { name: '死亡之山', icon: '🌋', color: '#cc5533', x: 80, y: 35, desc: '灼热火山，需耐火装备' },
    desert:    { name: '格鲁德沙漠', icon: '🏜️', color: '#e8c878', x: 20, y: 65, desc: '酷热沙漠，需防热装备' },
    castle:    { name: '海拉鲁城堡', icon: '🏰', color: '#9922cc', x: 80, y: 65, desc: '灾厄盖侬盘踞之地，最终决战' }
  },

  init() {
    this.el = document.createElement('div');
    this.el.id = 'map-menu';
    this.el.className = 'hidden';
    this.el.innerHTML = `
      <div class="map-panel">
        <div class="map-header">
          <span id="map-title">🗺️ 海拉鲁全境图</span>
          <button id="map-close">✕</button>
        </div>
        <div class="map-tabs">
          <button class="map-tab active" data-mode="travel">🗺️ 传送</button>
          <button class="map-tab" data-mode="save">💾 存档</button>
          <button class="map-tab" data-mode="load">📂 读档</button>
        </div>
        <div id="map-content" class="map-content"></div>
      </div>
    `;
    document.body.appendChild(this.el);
    document.getElementById('map-close').addEventListener('click', () => this.close());
    this.el.querySelectorAll('.map-tab').forEach(t => {
      t.addEventListener('click', () => {
        this.el.querySelectorAll('.map-tab').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        this.mode = t.dataset.mode;
        this.render();
      });
    });
  },

  open(mode = 'travel') {
    this.isOpen = true;
    this.mode = mode;
    this.el.classList.remove('hidden');
    this.el.querySelectorAll('.map-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
    this.render();
  },
  close() {
    this.isOpen = false;
    this.el.classList.add('hidden');
  },

  toggle() { this.isOpen ? this.close() : this.open(); },

  render() {
    const c = document.getElementById('map-content');
    if (this.mode === 'travel') c.innerHTML = this._renderTravel();
    else if (this.mode === 'save') c.innerHTML = this._renderSaveLoad(true);
    else c.innerHTML = this._renderSaveLoad(false);
    this._bindEvents();
  },

  _renderTravel() {
    const progress = SaveSystem.getProgress();
    const unlocked = progress.towers || [];
    const currentWorld = window.game.currentWorld ? window.game.currentWorld.name : '';
    let html = '<div class="world-map">';
    for (const [id, info] of Object.entries(this.WORLD_INFO)) {
      const isUnlocked = unlocked.includes(id);
      const isCurrent = id === currentWorld;
      const cls = isCurrent ? 'world-node current' : (isUnlocked ? 'world-node unlocked' : 'world-node locked');
      // ★ 用 onclick 内联（iOS 可靠），调用 MapMenu.teleport
      const clickAttr = (isUnlocked && !isCurrent) ? `onclick="MapMenu.teleport('${id}')"` : '';
      html += `
        <div class="${cls}" data-world="${id}" ${clickAttr} style="left:${info.x}%;top:${info.y}%;border-color:${info.color}">
          <div class="node-icon">${isUnlocked ? info.icon : '❓'}</div>
          <div class="node-name">${isUnlocked ? info.name : '???'}</div>
          ${isCurrent ? '<div class="node-here">★ 此处</div>' : ''}
          ${isUnlocked && !isCurrent ? '<div class="node-go">点击传送</div>' : ''}
          ${!isUnlocked ? '<div class="node-lock">未解锁远古塔</div>' : ''}
        </div>`;
    }
    html += '</div>';
    const beasts = progress.progress && progress.progress.divineBeasts ? progress.progress.divineBeasts.length : 0;
    html += `<div class="map-legend">已解锁 ${unlocked.length}/${Object.keys(this.WORLD_INFO).length} 个远古塔　解放神兽 ${beasts}/4　击败Boss ${(progress.bosses||[]).length} 个</div>`;
    html += this._renderAutoPathTargets();
    return html;
  },

  _renderAutoPathTargets() {
    if (!window.game || !window.game.currentWorld) return '';
    const targets = this._currentWorldTargets();
    if (!targets.length) return '';
    const buttons = targets.map((t, i) => `
      <button class="path-target" onclick="MapMenu.startAutoPath(${i})">
        <span>${t.name}</span><small>${Math.round(t.x)}, ${Math.round(t.z)}</small>
      </button>
    `).join('');
    return `<div class="path-panel"><div class="path-title">自动寻路</div><div class="path-grid">${buttons}</div></div>`;
  },

  _currentWorldTargets() {
    const world = window.game.currentWorld;
    if (!world) return [];
    const targets = [];
    const push = (name, pos, radius = 2.4) => {
      if (!pos) return;
      targets.push({ name, x: pos.x, z: pos.z, radius });
    };
    for (const t of world.towers || []) push(t.userData.towerName || '远古塔', t.position, 3);
    for (const s of world.shrines || []) push(s.cleared ? '已通关神庙' : '神庙挑战', s.mesh.position, 3);
    for (const npc of world.npcs || []) {
      const ud = npc.mesh.userData || {};
      push(ud.name || 'NPC', npc.mesh.position, 2.2);
    }
    if (world.boss && !world.boss.dead) push(world.boss.def.name, world.boss.position, 7);
    for (const g of world.gates || []) push(g.userData.targetName || '传送门', g.position, 2.5);
    return targets.slice(0, 12);
  },

  startAutoPath(index) {
    const target = this._currentWorldTargets()[index];
    if (!target || !window.game) return;
    window.game.autoPath = {
      active: true,
      target: { x: target.x, z: target.z },
      label: target.name,
      radius: target.radius || 2.4
    };
    Dialogue.show(`开始自动寻路：${target.name}`);
    this.close();
  },

  // ★ 全局传送函数（被 onclick 内联调用）
  teleport(worldId) {
    if (!window.game || !window.game.currentWorld) return;
    if (worldId === window.game.currentWorld.name) { Dialogue.show('已在此地'); return; }
    const info = this.WORLD_INFO[worldId];
    Dialogue.show(`传送至 ${info.name}…`);
    Effects.portalEffect(window.game.player.position);
    setTimeout(() => {
      window.game.loadWorld(worldId);
      this.close();
    }, 600);
  },

  _renderSaveLoad(isSave) {
    const slots = SaveSystem.getAllSlots();
    let html = `<div class="save-list"><div class="save-hint">${isSave ? '选择一个槽位保存进度' : '选择一个槽位读取存档'}</div>`;
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (s) {
        const date = new Date(s.timestamp);
        const timeStr = date.toLocaleString('zh-CN', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
        // ★ 用 onclick 内联
        const saveBtn = isSave ? `<button class="slot-btn" onclick="MapMenu.doAction('save',${i})">覆盖</button>` : `<button class="slot-btn" onclick="MapMenu.doAction('load',${i})">读取</button>`;
        html += `
          <div class="save-slot filled">
            <div class="slot-num">槽位 ${i+1}</div>
            <div class="slot-info">
              <div>📍 ${this.WORLD_INFO[s.worldName] ? this.WORLD_INFO[s.worldName].name : s.worldName}</div>
              <div>❤️ ${s.level} 心　💎 ${s.rupees}</div>
              <div class="slot-time">${timeStr}</div>
            </div>
            ${saveBtn}
            <button class="slot-btn del" onclick="MapMenu.doAction('delete',${i})">删除</button>
          </div>`;
      } else {
        html += `
          <div class="save-slot empty">
            <div class="slot-num">槽位 ${i+1}</div>
            <div class="slot-info"><div style="opacity:.5">空槽位</div></div>
            ${isSave ? `<button class="slot-btn" onclick="MapMenu.doAction('save',${i})">新建存档</button>` : '<div style="opacity:.3">无存档</div>'}
          </div>`;
      }
    }
    html += '</div>';
    return html;
  },

  // ★ 全局存读档函数（被 onclick 内联调用）
  doAction(act, slot) {
    if (act === 'save') {
      if (SaveSystem.save(slot)) {
        Dialogue.show(`✓ 已保存到槽位 ${slot+1}`);
        this.render();
      }
    } else if (act === 'load') {
      const data = SaveSystem.load(slot);
      if (data) {
        this.close();
        document.getElementById('menu').classList.add('hidden');
        HUD.show();
        window.game.state = 'playing';
        SaveSystem.applyLoad(data);
        Dialogue.show(`✓ 读取槽位 ${slot+1}`);
      }
    } else if (act === 'delete') {
      SaveSystem.deleteSlot(slot);
      Dialogue.show(`已删除槽位 ${slot+1}`);
      this.render();
    }
  },

  _bindEvents() {
    // 不再需要，全部改用 onclick 内联
  }
};
