/* ========================================================
   CompendiumUI.js — 图鉴窗口
   分类展示怪物、材料、武器装备、NPC/设施资料与位置。
   ======================================================== */

const CompendiumUI = {
  isOpen: false,
  el: null,
  currentTab: 'all',
  query: '',
  selectedId: null,
  _entries: [],

  tabs: [
    ['all', '全部'],
    ['monster', '怪物'],
    ['boss', 'Boss'],
    ['equipment', '装备'],
    ['material', '材料'],
    ['food', '食物'],
    ['key', '重要'],
    ['npc', 'NPC/设施']
  ],

  init() {
    this.el = document.createElement('div');
    this.el.id = 'compendium-ui';
    this.el.className = 'hidden';
    this.el.innerHTML = `
      <div class="compendium-panel">
        <div class="compendium-header">
          <div>
            <span>海拉鲁图鉴</span>
            <small>怪物 · 材料 · 武器装备 · NPC · 位置</small>
          </div>
          <button id="compendium-close">X</button>
        </div>
        <div class="compendium-tools">
          <div id="compendium-tabs" class="compendium-tabs"></div>
          <input id="compendium-search" type="search" placeholder="搜索名称、来源、位置..." autocomplete="off">
        </div>
        <div class="compendium-body">
          <div id="compendium-list" class="compendium-list"></div>
          <div id="compendium-detail" class="compendium-detail"></div>
        </div>
      </div>
    `;
    document.body.appendChild(this.el);
    document.getElementById('compendium-close').addEventListener('click', () => this.close());
    document.getElementById('compendium-search').addEventListener('input', (e) => {
      this.query = e.target.value.trim().toLowerCase();
      this.selectedId = null;
      this.render();
    });
  },

  toggle() { this.isOpen ? this.close() : this.open(); },

  open() {
    this.isOpen = true;
    this.el.classList.remove('hidden');
    this.refresh();
    this.render();
  },

  close() {
    this.isOpen = false;
    this.el.classList.add('hidden');
  },

  refresh() {
    if (typeof CompendiumData === 'undefined') {
      this._entries = [];
      return;
    }
    this._entries = CompendiumData.allEntries();
  },

  render() {
    this._renderTabs();
    const entries = this._filtered();
    if (!this.selectedId || !entries.some(e => e.id === this.selectedId && e.kind === this._selectedKind)) {
      const first = entries[0];
      this.selectedId = first ? first.id : null;
      this._selectedKind = first ? first.kind : null;
    }
    this._renderList(entries);
    this._renderDetail(entries.find(e => e.id === this.selectedId && e.kind === this._selectedKind) || entries[0] || null);
  },

  _renderTabs() {
    const tabs = document.getElementById('compendium-tabs');
    tabs.innerHTML = this.tabs.map(([id, label]) =>
      `<button class="comp-tab ${this.currentTab === id ? 'active' : ''}" data-tab="${id}">${label}</button>`
    ).join('');
    tabs.querySelectorAll('.comp-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentTab = btn.dataset.tab;
        this.selectedId = null;
        this.render();
      });
    });
  },

  _filtered() {
    const tab = this.currentTab;
    const q = this.query;
    return this._entries.filter(e => {
      const byTab = tab === 'all'
        || e.group === tab
        || (tab === 'monster' && (e.group === 'monster' || e.group === 'elite'))
        || (tab === 'boss' && e.group === 'boss');
      if (!byTab) return false;
      if (!q) return true;
      return `${e.name} ${e.subtitle} ${e.desc} ${e.search || ''} ${(e.locations || []).join(' ')} ${(e.sources || []).join(' ')}`.toLowerCase().includes(q);
    });
  },

  _renderList(entries) {
    const list = document.getElementById('compendium-list');
    const counts = this._counts();
    const totalLine = `<div class="comp-counts">
      <span>怪物 ${counts.enemies}</span><span>装备 ${counts.equipment}</span><span>物品 ${counts.items}</span><span>NPC ${counts.npcs}</span>
    </div>`;
    if (!entries.length) {
      list.innerHTML = totalLine + '<div class="comp-empty">没有匹配的图鉴条目</div>';
      return;
    }
    list.innerHTML = totalLine + entries.map(entry => {
      const selected = entry.id === this.selectedId && entry.kind === this._selectedKind;
      return `<button class="comp-entry ${selected ? 'selected' : ''}" data-id="${entry.id}" data-kind="${entry.kind}">
        <span class="comp-entry-icon">${this._entryIcon(entry)}</span>
        <span><b>${entry.name}</b><small>${entry.subtitle}</small></span>
      </button>`;
    }).join('');
    list.querySelectorAll('.comp-entry').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedId = btn.dataset.id;
        this._selectedKind = btn.dataset.kind;
        this.render();
      });
    });
  },

  _renderDetail(entry) {
    const detail = document.getElementById('compendium-detail');
    if (!entry) {
      detail.innerHTML = '<div class="comp-empty">选择左侧条目查看详情</div>';
      return;
    }
    const stats = (entry.stats || []).map(([k, v]) => `<div><b>${v}</b><span>${k}</span></div>`).join('');
    const sources = (entry.sources || []).map(x => `<li>${x}</li>`).join('');
    const locations = (entry.locations || []).map(x => `<li>${x}</li>`).join('');
    const actions = this._detailActions(entry);
    detail.innerHTML = `
      <div class="comp-detail-head">
        <div class="comp-detail-icon">${this._entryIcon(entry, true)}</div>
        <div>
          <h3>${entry.name}</h3>
          <p>${entry.subtitle}</p>
        </div>
      </div>
      ${stats ? `<div class="comp-stat-grid">${stats}</div>` : ''}
      <div class="comp-desc">${entry.desc}</div>
      <div class="comp-info-block">
        <h4>位置</h4>
        <ul>${locations}</ul>
      </div>
      <div class="comp-info-block">
        <h4>来源 / 掉落 / 用途</h4>
        <ul>${sources}</ul>
      </div>
      ${actions}
    `;
  },

  _detailActions(entry) {
    if (!window.game || !window.game.currentWorld || !entry.locations) return '';
    const currentName = CompendiumData.worldName(window.game.currentWorld.name);
    const loc = entry.locations.find(x => x.includes(currentName) && /\((-?\d+),\s*(-?\d+)\)/.test(x));
    if (!loc) return '';
    const match = loc.match(/\((-?\d+),\s*(-?\d+)\)/);
    if (!match) return '';
    const x = Number(match[1]);
    const z = Number(match[2]);
    return `<button class="comp-path-btn" onclick="CompendiumUI.startPath(${x}, ${z}, '${entry.name.replace(/'/g, "\\'")}')">前往当前地图位置</button>`;
  },

  startPath(x, z, label) {
    if (!window.game) return;
    window.game.autoPath = {
      active: true,
      target: { x, z },
      label,
      radius: 2.8
    };
    Dialogue.show(`开始自动寻路：${label}`);
    this.close();
  },

  _entryIcon(entry, large = false) {
    if (entry.kind === 'item' && typeof ArtAssets !== 'undefined' && ITEMS[entry.id]) {
      return ArtAssets.itemIconHtml(entry.id, large ? 'detail-item-icon' : 'hud-item-icon');
    }
    return entry.icon || '◇';
  },

  _counts() {
    const entries = this._entries;
    return {
      enemies: entries.filter(e => e.kind === 'enemy').length,
      equipment: entries.filter(e => e.group === 'equipment').length,
      items: entries.filter(e => e.kind === 'item').length,
      npcs: entries.filter(e => e.kind === 'npc').length
    };
  }
};

window.CompendiumUI = CompendiumUI;
window.__openCompendium = function() {
  const now = performance.now();
  if (window.__compendiumToggleAt && now - window.__compendiumToggleAt < 180) return;
  window.__compendiumToggleAt = now;
  if (window.CompendiumUI) window.CompendiumUI.toggle();
};
