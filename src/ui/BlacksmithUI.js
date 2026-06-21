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
            <div class="cloud-actions">
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
    this.el.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => this._do(btn.dataset.action));
    });
  },

  open() {
    this.isOpen = true;
    this.el.classList.remove('hidden');
    this.render();
  },

  close() {
    this.isOpen = false;
    this.el.classList.add('hidden');
  },

  render() {
    const inv = window.game && window.game.player && window.game.player.inventory;
    const stack = inv && inv.equipped ? inv.equipped[this.type] : null;
    const box = document.getElementById('blacksmith-current');
    if (!box) return;
    if (!stack) {
      box.innerHTML = '<div class="memory-empty">当前没有装备这一栏。先在背包装备武器/弓/盾。</div>';
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
  },

  _do(action) {
    if (typeof BlacksmithSystem === 'undefined') return;
    if (action === 'repair') BlacksmithSystem.repair(this.type);
    else if (action === 'atk') BlacksmithSystem.upgradeAttack(this.type);
    else if (action === 'crit') BlacksmithSystem.upgradeCrit(this.type);
    else if (action === 'critMul') BlacksmithSystem.upgradeCritMultiplier(this.type);
    this.render();
    if (typeof HUD !== 'undefined' && window.game) HUD.update(window.game, 0);
  }
};

if (typeof window !== 'undefined') window.BlacksmithUI = BlacksmithUI;
