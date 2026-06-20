/* ========================================================
   InventoryUI.js v2 — 背包界面（精致版）
   分页、网格、详情卡、状态徽章、装备槽联动
   ======================================================== */

const InventoryUI = {
  isOpen: false,
  currentTab: 'weapon',
  selected: null,
  el: null, gridEl: null, detailEl: null,

  init() {
    this.el = document.getElementById('inventory');
    this.gridEl = document.getElementById('inv-grid');
    this.detailEl = document.getElementById('inv-detail');

    document.getElementById('inv-close').addEventListener('click', () => this.close());
    document.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        this.currentTab = t.dataset.tab;
        this.selected = null;
        this.render();
      });
    });
    document.getElementById('btn-equip').addEventListener('click', () => this._equip());
    document.getElementById('btn-use').addEventListener('click', () => this._use());
    document.getElementById('btn-craft').addEventListener('click', () => this._craft());
    document.getElementById('btn-drop').addEventListener('click', () => this._drop());
  },

  // 玩家库存变化时刷新（main.js 中绑定回调）
  refreshIfOpen() { if (this.isOpen) this.render(); },

  toggle() {
    if (this.isOpen) this.close(); else this.open();
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
    const inv = window.game.player.inventory;
    this.detailEl.classList.toggle('craft-detail-mode', this.currentTab === 'craft');
    document.getElementById('inv-rupee').textContent = '💎 ' + inv.rupees + '　➹' + inv.arrows;
    if (this.currentTab === 'craft') {
      this._renderCraftGrid(inv);
      this._renderCraftDetail(inv);
      this._renderEquipSlots();
      this._updateActionButtons();
      return;
    }
    const list = inv.slots[this.currentTab] || [];
    let html = '';
    list.forEach((stack, i) => {
      const def = stack.def;
      const sel = (stack === this.selected) ? ' selected' : '';
      const equipped = (inv.equipped[def.type] === stack) ? ' equipped' : '';
      const count = def.stackable ? `<div class="count">×${stack.count}</div>` : '';
      let durability = '';
      if ((def.type === 'weapon' || def.type === 'shield' || def.type === 'bow') && def.durability) {
        const pct = Math.max(0, stack.durability / def.durability * 100);
        const color = pct > 50 ? '#5aff5a' : pct > 20 ? '#ffd54f' : '#ff5a5a';
        durability = `<div class="durability"><div style="width:${pct}%;background:${color}"></div></div>`;
      }
      const icon = ArtAssets.itemIconHtml(stack.itemId);
      html += `<div class="inv-cell${sel}${equipped}" data-i="${i}">${icon}${count}${durability}</div>`;
    });
    if (list.length === 0) {
      html = '<div style="grid-column:1/-1;text-align:center;padding:40px;opacity:.5;letter-spacing:2px;">空空如也…去打怪获取装备吧</div>';
    }
    this.gridEl.innerHTML = html;
    this.gridEl.querySelectorAll('.inv-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const i = parseInt(cell.dataset.i);
        this.selected = list[i];
        this.render();
      });
    });
    // 详情卡
    if (this.selected) {
      const d = this.selected.def;
      const typeName = {weapon:'武器',shield:'盾牌',bow:'弓',armor_upper:'上衣',armor_lower:'裤子',food:'食物',material:'材料',key:'重要物品'}[d.type];
      const foodStrategy = d.type === 'food' && typeof CookingSystem !== 'undefined' && CookingSystem.describeResult ? CookingSystem.describeResult(this.selected.itemId) : '';
      let stats = '';
      if (d.type === 'weapon') {
        stats = `<div class="detail-stats">
          <span class="stat-pill atk">⚔️ 攻击 ${d.atk}</span>
          <span class="stat-pill">耐久 ${this.selected.durability}/${d.durability}</span>
        </div>`;
      } else if (d.type === 'shield') {
        stats = `<div class="detail-stats">
          <span class="stat-pill def">🛡️ 防御 ${d.def}</span>
          <span class="stat-pill">耐久 ${this.selected.durability}/${d.durability}</span>
        </div>`;
      } else if (d.type === 'bow') {
        stats = `<div class="detail-stats">
          <span class="stat-pill atk">⚔️ 攻击 ${d.atk}</span>
          <span class="stat-pill">耐久 ${this.selected.durability}/${d.durability}</span>
        </div>`;
      } else if (d.type === 'food') {
        stats = `<div class="detail-stats">
          <span class="stat-pill heal">❤️ 回复 ${d.heal} 心</span>
          <span class="stat-pill">数量 ×${this.selected.count}</span>
        </div>`;
      } else if (d.type === 'armor_upper' || d.type === 'armor_lower') {
        const resistName = {cold:'❄️防寒', fire:'🔥耐火', heat:'☀️防热'}[d.resist];
        const setBonus = d.set && typeof ARMOR_SET_BONUSES !== 'undefined' ? ARMOR_SET_BONUSES[d.set] : null;
        stats = `<div class="detail-stats">
          <span class="stat-pill def">🛡️ 防御 ${d.def}</span>
          ${resistName ? `<span class="stat-pill">${resistName}</span>` : ''}
          ${setBonus ? `<span class="stat-pill set">套装：${setBonus.name}</span>` : ''}
        </div>`;
      } else if (d.type === 'material' && d.stackable) {
        stats = `<div class="detail-stats"><span class="stat-pill">数量 ×${this.selected.count}</span></div>`;
      } else if (d.type === 'key') {
        stats = `<div class="detail-stats"><span class="stat-pill">🔑 重要物品</span></div>`;
      }
      const isEquipped = inv.equipped[d.type] === this.selected;
      this.detailEl.innerHTML = `
        <div class="detail-icon">${ArtAssets.itemIconHtml(this.selected.itemId, 'detail-item-icon')}</div>
        <div class="detail-name">${d.name}</div>
        <div class="detail-type">${typeName}${isEquipped ? ' · 已装备' : ''}</div>
        <div class="detail-desc">${d.desc}${foodStrategy ? '<br><span style="color:#ffe16a">' + foodStrategy + '</span>' : ''}</div>
        ${stats}
      `;
    } else {
      this.detailEl.innerHTML = '<div class="detail-empty">点选左侧物品查看详情</div>';
    }
    this._renderEquipSlots();
    this._updateActionButtons();
  },

  _renderEquipSlots() {
    const inv = window.game.player.inventory;
    const renderSlot = (id, stack, defIcon) => {
      const el = document.getElementById(id);
      if (stack) {
        const d = stack.def;
        const pct = d.durability ? Math.max(0, (stack.durability / d.durability * 100).toFixed(0)) : 100;
        el.innerHTML = `${ArtAssets.itemIconHtml(stack.itemId, 'slot-item-icon')}<div class="slot-dur">${pct}%</div><span class="slot-label">${d.name.slice(0,4)}</span>`;
        el.classList.add('filled');
      } else {
        el.innerHTML = `<span class="slot-label">${defIcon}</span>`;
        el.classList.remove('filled');
      }
    };
    renderSlot('slot-weapon', inv.equipped.weapon, '武器');
    renderSlot('slot-shield', inv.equipped.shield, '盾');
    renderSlot('slot-bow', inv.equipped.bow, '弓');
    renderSlot('slot-armor_upper', inv.equipped.armor_upper, '上衣');
    renderSlot('slot-armor_lower', inv.equipped.armor_lower, '裤子');
  },

  _updateActionButtons() {
    const equipBtn = document.getElementById('btn-equip');
    const useBtn = document.getElementById('btn-use');
    const craftBtn = document.getElementById('btn-craft');
    const dropBtn = document.getElementById('btn-drop');
    craftBtn.textContent = '合成';
    if (!this.selected) {
      equipBtn.disabled = useBtn.disabled = craftBtn.disabled = dropBtn.disabled = true;
      return;
    }
    const isRecipe = !!this.selected.materials;
    if (isRecipe) {
      equipBtn.disabled = true;
      useBtn.disabled = true;
      dropBtn.disabled = true;
      const canCraft = typeof CraftingSystem !== 'undefined' && CraftingSystem.canCraft(window.game.player.inventory, this.selected.itemId);
      craftBtn.disabled = !canCraft;
      craftBtn.textContent = canCraft ? '合成' : '材料不足';
      return;
    }
    dropBtn.disabled = false;
    const t = this.selected.def.type;
    equipBtn.disabled = !['weapon','shield','bow','armor_upper','armor_lower'].includes(t);
    useBtn.disabled = (t !== 'food');
    craftBtn.disabled = true;
  },

  _equip() {
    if (!this.selected) return;
    const t = this.selected.def.type;
    if (!['weapon','shield','bow','armor_upper','armor_lower'].includes(t)) return;
    window.game.player.inventory.equip(t, this.selected);
    this.selected = null;
    window.game.player.refreshEquipment();
    this.render();
  },
  _use() {
    if (!this.selected || this.selected.def.type !== 'food') return;
    const name = this.selected.def.name;
    const result = window.game.player.inventory.useFood(this.selected);
    window.game.player.heal(result.heal || 0);
    const buffText = result.buff && typeof CookingSystem !== 'undefined' ? '，获得' + CookingSystem.buffName(result.buff.type) : '';
    Dialogue.show('吃了 ' + name + '，恢复 ' + (result.heal || 0) + ' 点生命' + buffText);
    this.selected = null;
    this.render();
  },
  _craft() {
    if (!this.selected || !this.selected.materials || typeof CraftingSystem === 'undefined') return;
    const result = CraftingSystem.craft(window.game.player.inventory, this.selected.itemId);
    if (!result.ok) {
      Dialogue.show('材料不足，无法合成');
      this.render();
      return;
    }
    Dialogue.show(`合成成功：${ITEMS[this.selected.itemId].name}`);
    if (typeof Effects !== 'undefined' && window.game && window.game.player) {
      Effects.pickupFlash(window.game.player.position);
    }
    this.selected = CraftingSystem.recipeFor(result.recipe.itemId);
    this.render();
  },
  _drop() {
    if (!this.selected) return;
    const name = this.selected.def.name;
    window.game.player.inventory.drop(this.selected);
    window.game.player.refreshEquipment();
    Dialogue.show(`丢弃了 ${name}`);
    this.selected = null;
    this.render();
  },

  _renderCraftGrid(inv) {
    if (typeof CraftingSystem === 'undefined') {
      this.gridEl.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;opacity:.5;">打造系统未加载</div>';
      return;
    }
    const recipes = CraftingSystem.allRecipes()
      .map(recipe => {
        const progress = this._craftProgress(inv, recipe);
        return { ...recipe, ready: progress.ready, progress };
      })
      .sort((a, b) => {
        if (a.ready !== b.ready) return a.ready ? -1 : 1;
        const order = { weapon: 1, shield: 2, bow: 3, armor_upper: 4, armor_lower: 5 };
        return ((order[a.type] || 99) - (order[b.type] || 99)) || a.name.localeCompare(b.name);
      });
    if (!this.selected || !this.selected.materials || !recipes.some(r => r.itemId === this.selected.itemId)) {
      this.selected = recipes.find(r => r.ready) || recipes[0] || null;
    }
    let html = '';
    recipes.forEach((recipe, i) => {
      const def = ITEMS[recipe.itemId];
      const ready = recipe.ready;
      const sel = (this.selected && this.selected.itemId === recipe.itemId && this.selected.materials) ? ' selected' : '';
      html += `<div class="inv-cell craft-cell ${ready ? 'craft-ready' : 'craft-missing'}${sel}" data-i="${i}" aria-disabled="${ready ? 'false' : 'true'}">
        ${ArtAssets.itemIconHtml(recipe.itemId)}
        <div class="craft-badge">${ready ? '可打造' : '材料不足'}</div>
        <div class="craft-progress">${recipe.progress.ok}/${recipe.progress.total}</div>
        <div class="craft-type">${this._typeShort(def.type)}</div>
      </div>`;
    });
    this.gridEl.innerHTML = html;
    this.gridEl.querySelectorAll('.craft-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const i = parseInt(cell.dataset.i);
        this.selected = recipes[i];
        this.render();
      });
    });
  },

  _renderCraftDetail(inv) {
    if (!this.selected || !this.selected.materials) {
      const bonus = inv.getSetBonus ? inv.getSetBonus() : null;
      this.detailEl.innerHTML = `
        <div class="detail-empty">
          选择配方查看材料需求
          ${bonus ? `<div class="set-active">当前套装：${bonus.name}<br>${bonus.desc}</div>` : ''}
        </div>`;
      return;
    }
    const recipe = this.selected;
    const d = ITEMS[recipe.itemId];
    const missing = CraftingSystem.missing(inv, recipe);
    const ready = missing.length === 0;
    const progress = this._craftProgress(inv, recipe);
    const setBonus = d.set && typeof ARMOR_SET_BONUSES !== 'undefined' ? ARMOR_SET_BONUSES[d.set] : null;
    const stats = this._craftStats(d);
    const matRows = Object.entries(recipe.materials)
      .map(([id, need]) => ({ id, need, have: inv.countOf(id), ok: inv.countOf(id) >= need }))
      .sort((a, b) => Number(a.ok) - Number(b.ok) || ITEMS[a.id].name.localeCompare(ITEMS[b.id].name));
    const mats = matRows.map(({ id, need, have, ok }) => {
      return `<div class="craft-mat ${ok ? 'ok' : 'no'}">
        <span>${ArtAssets.itemIconHtml(id, 'hud-item-icon')}${ITEMS[id].name}</span>
        <b>${have}/${need}</b>
      </div>`;
    }).join('');
    this.detailEl.innerHTML = `
      <div class="craft-summary ${ready ? 'ready' : 'missing'}">
        <div class="craft-summary-icon">${ArtAssets.itemIconHtml(recipe.itemId, 'detail-item-icon')}</div>
        <div class="craft-summary-main">
          <div class="detail-name">${d.name}</div>
          <div class="detail-type">打造配方 · ${this._typeName(d.type)}</div>
          <div class="detail-stats">${stats}</div>
          <div class="craft-progress-line"><span style="width:${progress.total ? Math.round(progress.ok / progress.total * 100) : 0}%"></span></div>
          <div class="craft-progress-text">材料完成 ${progress.ok}/${progress.total}</div>
        </div>
      </div>
      <div class="detail-desc">${recipe.desc}</div>
      ${setBonus ? `<div class="set-bonus-box compact"><b>${setBonus.name}</b><span>${setBonus.desc}</span></div>` : ''}
      <div class="craft-mats">${mats}</div>
      <div class="craft-status ${ready ? 'ok' : 'no'}">${ready ? '材料齐全，可以合成' : '材料不足，配方暂不可打造'}</div>
    `;
  },

  _craftStats(d) {
    const rows = [];
    if (d.type === 'weapon') rows.push(`<span class="stat-pill atk">攻 ${d.atk}</span>`);
    if (d.type === 'shield') rows.push(`<span class="stat-pill def">防 ${d.def}</span>`);
    if (d.type === 'bow') rows.push(`<span class="stat-pill atk">弓攻 ${d.atk}</span>`);
    if (d.type === 'armor_upper' || d.type === 'armor_lower') rows.push(`<span class="stat-pill def">防 ${d.def}</span>`);
    if (d.durability) rows.push(`<span class="stat-pill">耐久 ${d.durability}</span>`);
    if (d.element) rows.push(`<span class="stat-pill">${{fire:'火', ice:'冰', shock:'雷'}[d.element] || d.element}</span>`);
    if (d.resist) rows.push(`<span class="stat-pill">${{cold:'防寒', fire:'耐火', heat:'防热'}[d.resist] || d.resist}</span>`);
    return rows.join('');
  },

  _craftProgress(inv, recipe) {
    const rows = Object.entries(recipe.materials || {});
    const ok = rows.reduce((sum, [id, need]) => sum + (inv.countOf(id) >= need ? 1 : 0), 0);
    return { ok, total: rows.length, ready: rows.length > 0 && ok === rows.length };
  },

  _typeShort(type) {
    return { weapon:'武', shield:'盾', bow:'弓', armor_upper:'衣', armor_lower:'裤' }[type] || '?';
  },

  _typeName(type) {
    return { weapon:'武器', shield:'盾牌', bow:'弓', armor_upper:'上衣', armor_lower:'裤子' }[type] || type;
  }
};
