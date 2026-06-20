/* ========================================================
   StatueUI.js — 女神像·海利亚祝福兑换
   4 个克服之玉 → 1 个心之容器（最大生命 +1 心）
   4 个克服之玉 → 1 个精力容器（最大体力 +20）
   ======================================================== */

const StatueUI = {
  isOpen: false,
  el: null,

  // 每次兑换所需克服之玉数量
  COST: 4,

  init() {
    this.el = document.createElement('div');
    this.el.id = 'statue-ui';
    this.el.className = 'hidden';
    this.el.innerHTML = `
      <div class="shrine-panel" style="max-width:440px;">
        <div class="shrine-top">
          <div class="shrine-title">🕊️ 海利亚女神的祝福</div>
          <button id="statue-close" style="background:none;border:none;color:#fff;font-size:22px;cursor:pointer;padding:4px 10px;touch-action:manipulation;">✕</button>
        </div>
        <div class="shrine-body" id="statue-body"></div>
        <div style="text-align:center;padding:10px;color:#aaa;font-size:12px;">
          点击 ✕ 或按 ESC/返回 关闭
        </div>
      </div>
    `;
    document.body.appendChild(this.el);
    // ★ 关闭：同时绑定 click 和 touchend（移动端），并支持点击遮罩关闭
    const closeBtn = document.getElementById('statue-close');
    const doClose = (e) => { if (e) e.preventDefault(); this.close(); };
    closeBtn.addEventListener('click', doClose);
    closeBtn.addEventListener('touchend', doClose);
    // 点击遮罩区域（非面板）也关闭
    this.el.addEventListener('click', (e) => {
      if (e.target === this.el) doClose(e);
    });
    // ESC 键关闭
    document.addEventListener('keydown', (e) => {
      if (this.isOpen && (e.key === 'Escape' || e.key === 'Backspace')) doClose(e);
    });
  },

  open(game) {
    try {
      if (!this.el) this.init();
      this.isOpen = true;
      this.el.classList.remove('hidden');
      this._render(game);
    } catch (e) {
      console.error('女神像界面打开失败:', e);
      this.isOpen = false;
      if (this.el) this.el.classList.add('hidden');
      Dialogue.show('女神像暂时没有回应，请稍后再试');
    }
  },

  close() {
    this.isOpen = false;
    this.el.classList.add('hidden');
  },

  _render(gameArg) {
    const game = gameArg || window.game;
    if (!game || !game.player) throw new Error('缺少游戏玩家状态');
    const p = game.player;
    const inv = p.inventory;
    const orbs = inv.countOf('spiritOrb');
    const haveHeart = inv.countOf('heartContainer');
    const haveStam = inv.countOf('staminaVessel');
    const canAfford = orbs >= this.COST;

    document.getElementById('statue-body').innerHTML = `
      <div style="text-align:center;color:#ffe88a;margin:6px 0 14px;font-size:15px;line-height:1.6;">
        「将你从试炼中获得的力量，转化为新的生机吧。」
      </div>
      <div style="text-align:center;margin-bottom:14px;">
        <span style="font-size:20px;">🔮 克服之玉：<b style="color:#fff;">${orbs}</b></span>
      </div>
      <div class="statue-offers">
        <div class="statue-offer">
          <div class="offer-icon">❤️</div>
          <div class="offer-info">
            <div class="offer-name">心之容器</div>
            <div class="offer-desc">最大生命 +1 颗心（已拥有 ${haveHeart} 个）</div>
          </div>
          <button class="offer-btn" id="statue-heart" ${canAfford ? '' : 'disabled'}>
            ${this.COST} 🔮兑换
          </button>
        </div>
        <div class="statue-offer">
          <div class="offer-icon">⭐</div>
          <div class="offer-info">
            <div class="offer-name">精力容器</div>
            <div class="offer-desc">最大体力 +20（已拥有 ${haveStam} 个）</div>
          </div>
          <button class="offer-btn" id="statue-stam" ${canAfford ? '' : 'disabled'}>
            ${this.COST} 🔮兑换
          </button>
        </div>
      </div>
      <div style="text-align:center;margin-top:14px;font-size:13px;opacity:0.8;">
        ${canAfford
          ? '选择你想强化的力量'
          : `还需 ${this.COST - orbs} 个克服之玉（通关神庙可获得）`}
      </div>
    `;

    const hb = document.getElementById('statue-heart');
    const sb = document.getElementById('statue-stam');
    if (canAfford) {
      hb.addEventListener('click', () => this._exchange('heart'));
      sb.addEventListener('click', () => this._exchange('stamina'));
    }
  },

  _exchange(kind) {
    const game = window.game;
    const p = game.player;
    const inv = p.inventory;
    if (inv.countOf('spiritOrb') < this.COST) return;

    inv.remove('spiritOrb', this.COST);

    if (kind === 'heart') {
      inv.add('heartContainer', 1);
      // ★ 实际生效：最大生命 +1 心（=4 血），并回满
      p.maxHp += 1;
      p.hp = p.maxHp * 4;
      Dialogue.show('🕊️ 女神的祝福！最大生命 +1 颗心，并完全恢复！');
      Effects.pickupFlash(p.mesh.position);
    } else {
      inv.add('staminaVessel', 1);
      p.maxStamina += 20;
      p.stamina = p.maxStamina;
      Dialogue.show('🕊️ 女神的祝福！最大体力 +20，并完全恢复！');
      Effects.pickupFlash(p.mesh.position);
    }
    this._render();
  }
};
