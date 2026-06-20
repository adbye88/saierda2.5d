/* ========================================================
   ShopUI.js — 商店界面
   买入（卢比买商品）/ 卖出（玩家背包物品换卢比）
   ======================================================== */

const ShopUI = {
  isOpen: false,
  el: null,
  currentShop: null,
  mode: 'buy',   // buy | sell

  init() {
    this.el = document.createElement('div');
    this.el.id = 'shop-ui';
    this.el.className = 'hidden';
    this.el.innerHTML = `
      <div class="shop-panel">
        <div class="shop-header">
          <span id="shop-name">商店</span>
          <span id="shop-rupee">💎 0</span>
          <button id="shop-close">✕</button>
        </div>
        <div class="shop-tabs">
          <button class="shop-tab active" data-mode="buy">🛒 购买</button>
          <button class="shop-tab" data-mode="sell">💰 出售</button>
        </div>
        <div id="shop-list" class="shop-list"></div>
      </div>
    `;
    document.body.appendChild(this.el);
    document.getElementById('shop-close').addEventListener('click', () => this.close());
    this.el.querySelectorAll('.shop-tab').forEach(t => {
      t.addEventListener('click', () => {
        this.el.querySelectorAll('.shop-tab').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        this.mode = t.dataset.mode;
        this.render();
      });
    });
  },

  open(shopDef) {
    this.currentShop = shopDef;
    this.isOpen = true;
    this.mode = 'buy';
    document.getElementById('shop-name').textContent = '🏪 ' + shopDef.name;
    this.el.classList.remove('hidden');
    this.render();
  },
  close() {
    this.isOpen = false;
    this.el.classList.add('hidden');
  },

  render() {
    document.getElementById('shop-rupee').textContent = '💎 ' + window.game.player.inventory.rupees;
    const list = document.getElementById('shop-list');
    if (this.mode === 'buy') {
      let html = '';
      for (const item of this.currentShop.sell) {
        const def = ITEMS[item.id];
        const canAfford = window.game.player.inventory.rupees >= item.price;
        const stat = this._statLine(item.id);
        html += `
          <div class="shop-item ${canAfford ? '' : 'poor'}" data-id="${item.id}" data-price="${item.price}">
            <div class="shop-icon">${ArtAssets.itemIconHtml(item.id, 'shop-item-icon')}</div>
            <div class="shop-info">
              <div class="shop-name2">${def.name}${item.id === 'arrow' ? ' ×10' : ''}</div>
              <div class="shop-desc">${stat}${def.desc.slice(0,30)}</div>
            </div>
            <div class="shop-price">💎 ${item.price}</div>
          </div>`;
      }
      list.innerHTML = html;
      list.querySelectorAll('.shop-item').forEach(el => {
        el.addEventListener('click', () => this._buy(el.dataset.id, parseInt(el.dataset.price)));
      });
    } else {
      // 卖出模式：列出所有可卖物品
      const inv = window.game.player.inventory;
      const all = [];
      for (const type in inv.slots) {
        for (const stack of inv.slots[type]) {
          const price = inv.sellPrice(stack);
          if (price > 0) all.push({ stack, price, type });
        }
      }
      for (const type in inv.equipped) {
        const stack = inv.equipped[type];
        if (!stack) continue;
        const price = inv.sellPrice(stack);
        if (price > 0) all.push({ stack, price, type, equipped: true });
      }
      let html = '';
      if (all.length === 0) {
        html = '<div style="text-align:center;padding:40px;opacity:.5;">背包里没有可出售的物品</div>';
      } else {
        all.forEach((it, i) => {
          const d = it.stack.def;
          const meta = this._stackMeta(it.stack, it.equipped);
          html += `
            <div class="shop-item" data-index="${i}">
              <div class="shop-icon">${ArtAssets.itemIconHtml(it.stack.itemId, 'shop-item-icon')}</div>
              <div class="shop-info">
                <div class="shop-name2">${d.name} ${d.stackable ? '×'+it.stack.count : ''}${it.equipped ? ' · 已装备' : ''}</div>
                <div class="shop-desc">${meta}</div>
              </div>
              <div class="shop-price">💎 ${it.price}</div>
            </div>`;
        });
      }
      list.innerHTML = html;
      list.querySelectorAll('.shop-item').forEach(el => {
        el.addEventListener('click', () => this._sell(all[parseInt(el.dataset.index, 10)].stack));
      });
    }
  },

  _statLine(itemId) {
    const d = ITEMS[itemId];
    if (!d) return '';
    if (d.type === 'weapon') return `攻${d.atk} 耐久${d.durability} · `;
    if (d.type === 'shield') return `防${d.def} 耐久${d.durability} · `;
    if (d.type === 'bow') return `攻${d.atk} 耐久${d.durability} · `;
    if (d.type === 'armor_upper' || d.type === 'armor_lower') return `防${d.def}${d.resist ? ' 抗性' : ''} · `;
    if (d.type === 'food') return `回复${d.heal || 0} · `;
    return '';
  },

  _stackMeta(stack, equipped) {
    const d = stack.def;
    const typeName = { weapon:'武器', shield:'盾牌', bow:'弓', armor_upper:'上衣', armor_lower:'裤子', food:'食物', material:'材料', key:'重要物品' }[d.type] || d.type;
    const maxDurability = stack.maxDurability || d.durability;
    const durability = d.durability ? ` · 耐久 ${stack.durability}/${maxDurability}` : '';
    return `${typeName}${durability}${equipped ? ' · 卖出后会卸下' : ''}`;
  },

  _buy(itemId, price) {
    const inv = window.game.player.inventory;
    if (inv.rupees < price) {
      Dialogue.show('卢比不足！');
      return;
    }
    inv.rupees -= price;
    inv.add(itemId, itemId === 'arrow' ? 10 : 1);
    const d = ITEMS[itemId];
    Dialogue.show(`购买 ${d.name}${itemId === 'arrow' ? ' ×10' : ''}，花费 ${price} 卢比`);
    inv._emit();
    this.render();
  },

  _sell(stack) {
    const inv = window.game.player.inventory;
    if (!stack) return;
    const price = inv.sell(stack, 1);
    if (price <= 0) { Dialogue.show('此物不可出售'); return; }
    window.game.player.refreshEquipment();
    Dialogue.show(`出售 ${stack.def.name}，获得 ${price} 卢比`);
    this.render();
  }
};
