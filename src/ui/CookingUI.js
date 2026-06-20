/* ========================================================
   CookingUI.js — 烹饪界面
   选择食材 → 放入锅中 → 烹饪出料理
   ======================================================== */

const CookingUI = {
  isOpen: false,
  el: null,
  selected: [],   // 选中的食材 itemId 列表
  currentPot: null,

  init() {
    // 动态创建 DOM
    this.el = document.createElement('div');
    this.el.id = 'cooking-ui';
    this.el.className = 'hidden';
    this.el.innerHTML = `
      <div class="cook-panel">
        <div class="cook-header">
          <span>🍲 烹饪之锅</span>
          <button id="cook-close">✕</button>
        </div>
        <div class="cook-hint">从背包选择 1~5 个食材，不同组合产生不同料理</div>
        <div id="cook-selected" class="cook-selected"><div class="cook-empty">未选择食材（点击下方食材添加）</div></div>
        <div class="cook-preview" id="cook-preview"></div>
        <div id="cook-grid" class="cook-grid"></div>
        <div class="cook-actions">
          <button id="cook-do">🍳 开始烹饪</button>
          <button id="cook-clear">清空</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.el);
    document.getElementById('cook-close').addEventListener('click', () => this.close());
    document.getElementById('cook-do').addEventListener('click', () => this._cook());
    document.getElementById('cook-clear').addEventListener('click', () => { this.selected = []; this.render(); });
  },

  open(pot) {
    this.isOpen = true;
    this.currentPot = pot;
    this.selected = [];
    this.el.classList.remove('hidden');
    this.render();
  },
  close() {
    this.isOpen = false;
    this.el.classList.add('hidden');
  },

  render() {
    const inv = window.game.player.inventory;
    const foods = inv.slots.food.filter(s => s.def.subtype === 'raw');
    // 也允许放材料（丘丘胶等元素材料可入菜）
    const mats = inv.slots.material.filter(s => ['redChuchuJelly','whiteChuchuJelly','yellowChuchuJelly','goronSpice'].includes(s.itemId));
    const all = [...foods, ...mats];

    // 已选区
    const selEl = document.getElementById('cook-selected');
    if (this.selected.length === 0) {
      selEl.innerHTML = '<div class="cook-empty">未选择食材（点击下方食材添加）</div>';
    } else {
      selEl.innerHTML = this.selected.map((id, i) => {
        const d = ITEMS[id];
        return `<div class="cook-slot" data-sel="${i}">${d.icon}<span>${d.name}</span></div>`;
      }).join('');
      selEl.querySelectorAll('.cook-slot').forEach(s => {
        s.addEventListener('click', () => { this.selected.splice(parseInt(s.dataset.sel), 1); this.render(); });
      });
    }
    // 预览结果
    const preview = document.getElementById('cook-preview');
    if (this.selected.length > 0) {
      const result = CookingSystem.cook(this.selected);
      const rd = ITEMS[result];
      const strategy = CookingSystem.describeResult ? CookingSystem.describeResult(result) : rd.desc;
      preview.innerHTML = '预测结果：' + rd.icon + ' <b>' + rd.name + '</b><br><span style="opacity:.7;font-size:12px">' + rd.desc + '</span><br><span style="color:#ffe16a;font-size:12px">' + strategy + '</span>';
    } else {
      preview.innerHTML = '';
    }
    // 食材网格
    const gridEl = document.getElementById('cook-grid');
    let html = '';
    all.forEach((stack, i) => {
      const d = stack.def;
      const count = `<div class="count">×${stack.count}</div>`;
      html += `<div class="cook-cell" data-i="${i}">${d.icon}${count}</div>`;
    });
    if (all.length === 0) html = '<div style="grid-column:1/-1;text-align:center;padding:30px;opacity:.5;">背包里没有可烹饪的食材</div>';
    gridEl.innerHTML = html;
    gridEl.querySelectorAll('.cook-cell').forEach(c => {
      c.addEventListener('click', () => {
        const i = parseInt(c.dataset.i);
        if (this.selected.length >= 5) { Dialogue.show('最多 5 个食材'); return; }
        const stack = all[i];
        this.selected.push(stack.itemId);
        this.render();
      });
    });
  },

  _cook() {
    if (this.selected.length === 0) { Dialogue.show('请先选择食材'); return; }
    const inv = window.game.player.inventory;
    // 扣除食材
    for (const id of this.selected) {
      const stack = inv.slots.food.find(s => s.itemId === id) || inv.slots.material.find(s => s.itemId === id);
      if (stack) {
        stack.count -= 1;
        if (stack.count <= 0) {
          const list = inv.slots.food.includes(stack) ? inv.slots.food : inv.slots.material;
          list.splice(list.indexOf(stack), 1);
        }
      }
    }
    // 产出
    const result = CookingSystem.cook(this.selected);
    inv.add(result, 1);
    const rd = ITEMS[result];
    Dialogue.show(`🍲 烹饪成功！获得 ${rd.icon} ${rd.name}`);
    Effects.pickupFlash(this.currentPot.position);
    this.selected = [];
    this.render();
    inv._emit();
  }
};
