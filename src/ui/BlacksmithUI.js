/* ========================================================
   BlacksmithUI.js — 铁匠面板
   ======================================================== */

const BlacksmithUI = {
  isOpen: false,
  el: null,
  type: 'weapon',

  init() {
    if (this.el && document.body.contains(this.el)) return;
    this.el = document.createElement('div');
    this.el.id = 'blacksmith-ui';
    this.el.className = 'hidden';
    this.el.innerHTML = `
      <div class="quest-panel blacksmith-panel">
        <div class="quest-header">
          <span>🔨 铁匠修理 / 强化</span>
          <button id="blacksmith-close">X</button>
        </div>
        <div class="quest-body">
          <div class="quest-section">
            <div class="map-tabs blacksmith-tabs">
              <button data-type="weapon" class="map-tab active">武器</button>
              <button data-type="bow" class="map-tab">弓</button>
              <button data-type="shield" class="map-tab">盾</button>
            </div>
            <div id="blacksmith-current"></div>
            <div id="blacksmith-actions" class="cloud-actions blacksmith-actions">
              <button class="slot-btn" data-action="repair">修理当前装备</button>
              <button class="slot-btn" data-action="atk">强化攻击</button>
              <button class="slot-btn" data-action="crit">强化暴击率</button>
              <button class="slot-btn" data-action="critMul">强化暴击倍率</button>
            </div>
            <div class="cloud-msg">修理消耗木材、矿石和卢比；攻击用矿石，暴击用怪物材料。自己打造装备仍保留耐久 ×10。</div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(this.el);
    document.getElementById('blacksmith-close').addEventListener('click', () => this.close());
    this.el.querySelectorAll('.blacksmith-tabs button').forEach(btn => {
      btn.addEventListener('click', () => {
        this.type = btn.dataset.type;
        this.el.querySelectorAll('.blacksmith-tabs button').forEach(x => x.classList.toggle('active', x === btn));
        this.render();
      });
    });
    const actionBox = this.el.querySelector('#blacksmith-actions');
    if (actionBox) actionBox.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn || btn.disabled) return;
      this._do(btn.dataset.action);
    });
  },

  open() {
    try {
      if (!this.el || !document.body.contains(this.el)) this.init();
      if (!this.el) throw new Error('BlacksmithUI element was not created');
      this.isOpen = true;
      this.el.classList.remove('hidden');
      this.render();
    } catch (e) {
      this.isOpen = false;
      console.error('BlacksmithUI.open failed', e);
      if (typeof Dialogue !== 'undefined') Dialogue.show('铁匠面板打开失败，请稍后再试。');
    }
  },

  close() {
    this.isOpen = false;
    if (this.el) this.el.classList.add('hidden');
  },

  render() {
    const inv = window.game && window.game.player && window.game.player.inventory;
    const stack = inv && inv.equipped ? inv.equipped[this.type] : null;
    const box = document.getElementById('blacksmith-current');
    if (!box) return;
    if (!inv) {
      box.innerHTML = '<div class="memory-empty">铁匠正在整理工具，角色数据还没有准备好。</div>';
      const actionBox = document.getElementById('blacksmith-actions');
      if (actionBox) actionBox.innerHTML = '';
      return;
    }
    if (!stack) {
      box.innerHTML = '<div class="memory-empty">当前没有装备这一栏。先在背包装备武器/弓/盾。</div>';
      const actionBox = document.getElementById('blacksmith-actions');
      if (actionBox) actionBox.innerHTML = '';
      return;
    }
    const crit = inv.getCriticalStats ? inv.getCriticalStats(this.type === 'shield' ? 'weapon' : this.type, stack) : { chance: 0.01, multiplier: 2 };
    const atk = stack.def.type === 'shield'
      ? (inv.getStackDefense ? inv.getStackDefense(stack) : stack.def.def)
      : (inv.getStackAttack ? inv.getStackAttack(stack) : stack.def.atk);
    const label = stack.def.type === 'shield' ? '防御' : '攻击';
    box.innerHTML = `
      <div class="quest-current">
        <h3>${inv.getStackDisplayName ? inv.getStackDisplayName(stack) : stack.name}</h3>
        <p>${label} ${atk} · 耐久 ${stack.durability}/${stack.maxDurability || stack.def.durability} · 暴击 ${(crit.chance * 100).toFixed(1)}% / ×${crit.multiplier.toFixed(1)}</p>
        <p>铁匠强化：攻击 +${stack.bonusAtk || 0}，暴击率 +${(((stack.bonusCritChance || 0) * 100).toFixed(1))}%，暴击倍率 +${(stack.bonusCritMultiplier || 0).toFixed(1)}</p>
      </div>
    `;
    this._renderActionCards(inv, stack);
  },

  _actionDefinitions() {
    return [
      { id: 'repair', label: '修理当前装备', desc: '补满耐久，重武器和打造装备破损越多越贵。' },
      { id: 'atk', label: '强化攻击', desc: '武器/弓攻击 +2，上限 +12。' },
      { id: 'crit', label: '强化暴击率', desc: '武器/弓暴击率 +1.5%，上限 +12%。' },
      { id: 'critMul', label: '强化暴击倍率', desc: '武器/弓暴击倍率 +0.1，上限 +0.6。' }
    ];
  },

  _renderActionCards(inv, stack) {
    const box = document.getElementById('blacksmith-actions');
    if (!box) return;
    box.innerHTML = this._actionDefinitions().map(def => {
      const plan = typeof BlacksmithSystem !== 'undefined' && BlacksmithSystem.actionPlan
        ? BlacksmithSystem.actionPlan(def.id, this.type, inv)
        : { cost: [], canAfford: false, blockedReason: '系统未准备' };
      const missing = plan.cost && plan.cost.some(([id, need]) => (inv.countOf ? inv.countOf(id) : 0) < need);
      const status = plan.blockedReason || (plan.canAfford ? '材料足够' : '材料不足');
      return `
        <div class="blacksmith-action-card ${plan.canAfford ? 'ready' : 'locked'}">
          <button class="slot-btn" data-action="${def.id}">${def.label}</button>
          <div class="blacksmith-action-info">
            <b>${def.label}</b>
            <span>${def.desc}</span>
            <div class="blacksmith-cost-list">${this._renderCostRows(plan.cost || [], inv)}</div>
            <em class="${plan.canAfford ? 'ok' : 'missing'}">${status}${missing ? '：看红色材料' : ''}</em>
          </div>
        </div>
      `;
    }).join('');
    box.querySelectorAll('[data-action]').forEach(button => {
      const plan = typeof BlacksmithSystem !== 'undefined' && BlacksmithSystem.actionPlan
        ? BlacksmithSystem.actionPlan(button.dataset.action, this.type, inv)
        : { canAfford: false };
      button.disabled = !plan.canAfford;
    });
  },

  _renderCostRows(cost, inv) {
    if (!cost || cost.length === 0) return '<div class="blacksmith-cost-row missing">没有可用配方</div>';
    return cost.map(([id, need]) => {
      const have = inv && inv.countOf ? inv.countOf(id) : 0;
      const ok = have >= need;
      const item = typeof ITEMS !== 'undefined' ? ITEMS[id] : null;
      const name = item ? item.name : id;
      const icon = typeof ArtAssets !== 'undefined' && ArtAssets.itemIconHtml
        ? ArtAssets.itemIconHtml(id, 'hud-item-icon')
        : (item && item.icon ? item.icon : '•');
      return `
        <div class="blacksmith-cost-row ${ok ? 'ok' : 'missing'}">
          <span>${icon} ${name}</span>
          <b>${have}/${need}</b>
        </div>
      `;
    }).join('');
  },

  _do(action) {
    try {
      if (typeof BlacksmithSystem === 'undefined') return;
      if (action === 'repair') BlacksmithSystem.repair(this.type);
      else if (action === 'atk') BlacksmithSystem.upgradeAttack(this.type);
      else if (action === 'crit') BlacksmithSystem.upgradeCrit(this.type);
      else if (action === 'critMul') BlacksmithSystem.upgradeCritMultiplier(this.type);
      this.render();
      if (typeof HUD !== 'undefined' && window.game) HUD.update(window.game, 0);
    } catch (e) {
      console.error('Blacksmith action failed', e);
      if (typeof Dialogue !== 'undefined') Dialogue.show('铁匠操作失败，但游戏不会卡住。');
    }
  }
};

if (typeof window !== 'undefined') window.BlacksmithUI = BlacksmithUI;
