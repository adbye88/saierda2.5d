/* ========================================================
   QuickEquipUI.js — 装备损坏后的快速换装弹窗
   点击图标即可装备备用武器/弓/盾，不必打开完整背包。
   ======================================================== */

const QuickEquipUI = {
  el: null,
  listEl: null,
  timer: null,
  type: null,

  init() {
    this.el = document.getElementById('quick-equip');
    this.listEl = document.getElementById('quick-equip-list');
    if (!this.el || !this.listEl) this._ensureDom();
    const close = document.getElementById('quick-equip-close');
    if (close && !close.dataset.boundQuickEquip) {
      close.dataset.boundQuickEquip = '1';
      close.addEventListener('click', () => this.close());
    }
    if (typeof window !== 'undefined') window.QuickEquipUI = this;
  },

  prompt(type, brokenName = '') {
    if (!this.el || !this.listEl) this.init();
    const game = window.game;
    const player = game && game.player;
    const inv = player && player.inventory;
    if (!inv || !inv.slots || !inv.slots[type] || inv.slots[type].length === 0) {
      if (typeof Dialogue !== 'undefined') {
        const label = { weapon: '武器', bow: '弓', shield: '盾牌' }[type] || '装备';
        Dialogue.show(`没有备用${label}可以装备`);
      }
      return;
    }
    this.type = type;
    const label = { weapon: '武器', bow: '弓', shield: '盾牌' }[type] || '装备';
    const title = document.getElementById('quick-equip-title');
    if (title) title.textContent = `${brokenName ? '【' + brokenName + '】已损坏' : label + '已损坏'}，选择备用${label}`;
    const candidates = inv.slots[type]
      .filter(stack => stack && stack.def && (!stack.def.durability || stack.durability > 0))
      .sort((a, b) => {
        const atkA = a.def.atk || a.def.def || 0;
        const atkB = b.def.atk || b.def.def || 0;
        return atkB - atkA || (b.durability || 0) - (a.durability || 0);
      })
      .slice(0, 6);
    if (candidates.length === 0) {
      if (typeof Dialogue !== 'undefined') Dialogue.show(`没有可用备用${label}`);
      return;
    }
    this.listEl.innerHTML = candidates.map((stack, i) => {
      const d = stack.def;
      const stat = d.type === 'weapon' || d.type === 'bow' ? `攻${d.atk}` : d.type === 'shield' ? `防${d.def}` : '';
      const maxDurability = stack.maxDurability || d.durability;
      const dur = d.durability ? `${stack.durability}/${maxDurability}` : '';
      const crit = (d.type === 'weapon' || d.type === 'bow') && inv.getCriticalStats
        ? `✦${(inv.getCriticalStats(d.type, stack).chance * 100).toFixed(1)}%`
        : '';
      return `<button class="quick-equip-item" data-i="${i}">
        ${ArtAssets.itemIconHtml(stack.itemId, 'quick-equip-icon')}
        <span class="quick-equip-name">${d.name}</span>
        <span class="quick-equip-stat">${[stat, dur, crit].filter(Boolean).join(' · ')}</span>
      </button>`;
    }).join('');
    this.listEl.querySelectorAll('.quick-equip-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const stack = candidates[parseInt(btn.dataset.i, 10)];
        this.equip(stack);
      });
    });
    this.el.classList.remove('hidden');
    this.el.setAttribute('aria-hidden', 'false');
    this.el.dataset.type = type;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.close(), 12000);
  },

  equip(stack) {
    const game = window.game;
    const player = game && game.player;
    if (!player || !player.inventory || !stack) return;
    const type = stack.def.type;
    player.inventory.equip(type, stack);
    if (type === 'bow') player.setBowMode(player.inventory.arrows > 0);
    else if (type === 'weapon') player.setBowMode(false);
    player.refreshEquipment();
    if (typeof HUD !== 'undefined') HUD.update(game);
    if (typeof Dialogue !== 'undefined') Dialogue.show(`已快速装备：${stack.def.name}`);
    this.close();
  },

  close() {
    if (this.el) this.el.classList.add('hidden');
    if (this.el) this.el.setAttribute('aria-hidden', 'true');
    clearTimeout(this.timer);
    this.timer = null;
  },

  _ensureDom() {
    const root = document.createElement('div');
    root.id = 'quick-equip';
    root.className = 'hidden';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'false');
    root.setAttribute('aria-labelledby', 'quick-equip-title');
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML = `
      <div class="quick-equip-panel">
        <button id="quick-equip-close" aria-label="关闭">✕</button>
        <div id="quick-equip-title">装备已损坏，选择备用装备</div>
        <div id="quick-equip-list"></div>
      </div>
    `;
    document.body.appendChild(root);
    this.el = root;
    this.listEl = root.querySelector('#quick-equip-list');
  }
};

if (typeof window !== 'undefined') window.QuickEquipUI = QuickEquipUI;
