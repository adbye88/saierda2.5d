/* ========================================================
   MapMenu.js — 大地图/传送菜单
   - 显示海拉鲁全域，已解锁的远古塔可传送
   - 按 M 键或菜单按钮打开
   - 同时包含存档/读档入口
   ======================================================== */

const MapMenu = {
  isOpen: false,
  el: null,
  mode: 'travel',  // travel | save | load | cloud
  _cloudBusy: false,

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
    if (this.el && document.body.contains(this.el)) return;
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
          <button class="map-tab" data-mode="cloud">☁️ 云存档</button>
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
    else if (this.mode === 'load') c.innerHTML = this._renderSaveLoad(false);
    else c.innerHTML = this._renderCloud();
    this._bindEvents();
  },

  _renderTravel() {
    const progress = SaveSystem.getProgress();
    const unlocked = progress.towers || [];
    const currentWorld = window.game && window.game.currentWorld ? window.game.currentWorld.name : '';
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
    if (typeof CloudAccountSystem === 'undefined') {
      return '<div class="save-list"><div class="save-hint">云存档模块尚未加载。</div></div>';
    }
    const esc = this._esc;
    if (!CloudAccountSystem.isLoggedIn()) {
      return `
        <div class="cloud-panel">
          <div class="cloud-card">
            <h3>${isSave ? '💾 保存进度' : '📂 读取进度'}</h3>
            <p>现在存档入口已经切到云端 JSON：请先登录或注册账号。账号和存档会写入服务器的 <code>data/cloud-db.json</code>，不是浏览器本地槽位。</p>
            <p class="cloud-msg">${esc(CloudAccountSystem.getStatusText())}</p>
            <button class="slot-btn" onclick="MapMenu.open('cloud')">去登录 / 注册云账号</button>
          </div>
        </div>
      `;
    }
    const rows = CloudAccountSystem.getArchiveRows();
    const archives = this._renderCloudArchiveRows(rows, isSave ? 'manage' : 'load');
    return `
      <div class="cloud-panel">
        <div class="cloud-top">
          <div>
            <b>${esc(isSave ? '💾 云保存' : '📂 云读档')}</b>
            <small>${esc(CloudAccountSystem.getStatusText())}</small>
          </div>
          <button class="slot-btn" onclick="MapMenu.open('cloud')">账号 / 云存档</button>
        </div>
        ${isSave ? `
          <div class="cloud-actions">
            <button class="slot-btn" onclick="MapMenu.cloudAction('manual')">创建手动云存档</button>
            <button class="slot-btn" onclick="MapMenu.cloudAction('sync')">上传当前进度</button>
          </div>
          <div class="cloud-msg">${esc(CloudAccountSystem.lastMessage || '手动云档会永久写入 data/cloud-db.json；自动同步档只保留最新一份。')}</div>
        ` : `
          <div class="cloud-msg">${esc(CloudAccountSystem.lastMessage || '选择一个云存档加载；如果还没进入游戏，会在开始游戏后自动套用。')}</div>
        `}
        <div class="save-list">${archives}</div>
      </div>
    `;
  },

  _renderCloud() {
    if (typeof CloudAccountSystem === 'undefined') {
      return '<div class="save-list"><div class="save-hint">云存档模块尚未加载。</div></div>';
    }
    const esc = (s) => String(s || '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
    if (!CloudAccountSystem.isLoggedIn()) {
      return `
        <div class="cloud-panel">
          <div class="cloud-card">
            <h3>☁️ 账号登录 / 注册</h3>
            <p>账号、自动同步、手动云档都会写入服务器 JSON 文件：<code>data/cloud-db.json</code>。浏览器只保留登录会话 token，不再把账号/云档数据库存在 localStorage。</p>
            ${CloudAccountSystem.apiAvailable ? '' : '<p class="cloud-msg">⚠️ 云存档 API 未连接：请用 <code>node cloud-server.mjs</code> 启动游戏；python 静态服务器不能注册、登录或云保存。</p>'}
            <input id="cloud-user" class="cloud-input" placeholder="账号名，例如 link">
            <input id="cloud-pass" class="cloud-input" placeholder="密码，至少 4 位" type="password">
            <div class="cloud-actions">
              <button class="slot-btn" onclick="MapMenu.cloudAction('login')" ${this._cloudBusy ? 'disabled' : ''}>登录并自动同步</button>
              <button class="slot-btn" onclick="MapMenu.cloudAction('register')" ${this._cloudBusy ? 'disabled' : ''}>注册账号</button>
            </div>
            <div class="cloud-msg">${esc(CloudAccountSystem.lastMessage)}</div>
          </div>
        </div>
      `;
    }
    const rows = CloudAccountSystem.getArchiveRows();
    const latest = CloudAccountSystem.getLatestArchive();
    const archiveHtml = this._renderCloudArchiveRows(rows, 'manage');
    return `
      <div class="cloud-panel">
        <div class="cloud-top">
          <div>
            <b>${esc(CloudAccountSystem.getStatusText())}</b>
            <small>${latest ? '登录后会自动同步最新云进度；当前运行进度变化会更新“自动同步”云档。' : '还没有云端 JSON 档案。'}</small>
          </div>
          <button class="slot-btn del" onclick="MapMenu.cloudAction('logout')">退出账号</button>
        </div>
        <div class="cloud-actions">
          <button class="slot-btn" onclick="MapMenu.cloudAction('manual')">创建手动云存档</button>
          <button class="slot-btn" onclick="MapMenu.cloudAction('sync')">上传当前进度</button>
          <button class="slot-btn" onclick="MapMenu.cloudAction('latest')">加载最新云档</button>
        </div>
        <div class="cloud-msg">${esc(CloudAccountSystem.lastMessage)}</div>
        <div class="save-list">${archiveHtml}</div>
      </div>
    `;
  },

  _esc(s) {
    return String(s || '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  },

  _renderCloudArchiveRows(rows, mode = 'manage') {
    const esc = this._esc;
    if (!rows.length) {
      return '<div class="save-slot empty"><div class="slot-info">暂无云存档，先创建一个。</div></div>';
    }
    return rows.map(a => {
      const date = new Date(a.timestamp || 0).toLocaleString('zh-CN', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
      const world = a.current && a.current.worldName ? (this.WORLD_INFO[a.current.worldName] ? this.WORLD_INFO[a.current.worldName].name : a.current.worldName) : '未知地点';
      const type = a.kind === 'auto' ? '自动同步' : '手动云档';
      const del = mode === 'manage' && a.kind === 'manual' ? `<button class="slot-btn del" onclick="MapMenu.cloudAction('delete','${esc(a.id)}')">删除</button>` : '';
      const download = mode === 'manage' ? `<button class="slot-btn" onclick="MapMenu.cloudAction('download','${esc(a.id)}')">导出JSON</button>` : '';
      return `
        <div class="save-slot filled cloud-archive">
          <div class="slot-num">${type}</div>
          <div class="slot-info">
            <div><b>${esc(a.label || type)}</b></div>
            <div>📍 ${esc(world)}　🕒 ${date}</div>
          </div>
          <button class="slot-btn" onclick="MapMenu.cloudAction('load','${esc(a.id)}')">加载</button>
          ${download}
          ${del}
        </div>`;
    }).join('');
  },

  // ★ 全局存读档函数（被 onclick 内联调用）
  async doAction(act, slot) {
    if (act === 'save') {
      if (SaveSystem.save(slot)) {
        Dialogue.show(`✓ 已保存到槽位 ${slot+1}`);
        this.render();
      }
    } else if (act === 'load') {
      const data = SaveSystem.load(slot);
      if (data) {
        if (typeof window.__ensureGameReady === 'function') {
          await window.__ensureGameReady(data.worldName || 'grassland');
        }
        this.close();
        document.getElementById('menu').classList.add('hidden');
        HUD.show();
        window.game.state = 'playing';
        SaveSystem.applyLoad(data);
        window.game.start();
        Dialogue.show(`✓ 读取槽位 ${slot+1}`);
      }
    } else if (act === 'delete') {
      SaveSystem.deleteSlot(slot);
      Dialogue.show(`已删除槽位 ${slot+1}`);
      this.render();
    }
  },

  async cloudAction(act, id = null) {
    if (typeof CloudAccountSystem === 'undefined') return;
    if (this._cloudBusy && act !== 'download') return;
    const userEl = document.getElementById('cloud-user');
    const passEl = document.getElementById('cloud-pass');
    try {
      this._cloudBusy = act !== 'download';
      if (this._cloudBusy) CloudAccountSystem.lastMessage = '正在处理云存档请求...';
      if (act === 'register') {
        await CloudAccountSystem.register(userEl ? userEl.value : '', passEl ? passEl.value : '');
      } else if (act === 'login') {
        await CloudAccountSystem.login(userEl ? userEl.value : '', passEl ? passEl.value : '');
      } else if (act === 'logout') {
        CloudAccountSystem.logout();
      } else if (act === 'manual') {
        await CloudAccountSystem.createArchive('手动云存档', false);
      } else if (act === 'sync') {
        await CloudAccountSystem.createArchive('手动上传当前进度', true);
      } else if (act === 'latest') {
        await CloudAccountSystem.syncLatestToLocal(false);
      } else if (act === 'load') {
        await CloudAccountSystem.loadArchive(id);
      } else if (act === 'delete') {
        await CloudAccountSystem.deleteArchive(id);
      } else if (act === 'download') {
        CloudAccountSystem.downloadArchive(id);
      }
    } catch (e) {
      CloudAccountSystem.lastMessage = '云存档操作失败：' + (e.message || e);
      if (typeof Dialogue !== 'undefined') Dialogue.show('☁️ ' + CloudAccountSystem.lastMessage);
    } finally {
      this._cloudBusy = false;
      this.render();
    }
  },

  _bindEvents() {
    // 不再需要，全部改用 onclick 内联
  }
};
