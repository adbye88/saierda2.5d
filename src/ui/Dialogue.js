/* ========================================================
   Dialogue.js — 对话/提示气泡
   - show(text)：底部显示一段文字，3秒后淡出
   - showFloat(text, worldPos)：世界位置浮字（伤害数字）
   ======================================================== */

const Dialogue = {
  el: null,
  timer: null,
  floats: [],  // {el, life}
  _lastText: '',   // 防抖：相同文本未消失前不重复弹出

  init() {
    this.el = document.getElementById('dialogue-text');
    // 确保对话层在所有 HUD 之上
    const dlg = document.getElementById('dialogue');
    if (dlg) {
      dlg.style.zIndex = '120';
      dlg.style.pointerEvents = 'none';
    }
  },

  show(text, duration = 1800) {
    if (!this.el) this.el = document.getElementById('dialogue-text');
    const dlg = document.getElementById('dialogue');
    if (!this.el || !dlg) return;
    // 防抖：若正在显示相同文本，跳过（避免拾取/对话重复刷屏）
    if (this._lastText === text && !dlg.classList.contains('hidden')) {
      // 重置消失计时即可
      if (this.timer) clearTimeout(this.timer);
    } else {
      this._lastText = text;
    }
    dlg.classList.remove('hidden');
    this.el.innerHTML = text;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      dlg.classList.add('hidden');
      this._lastText = '';
    }, duration);
  },

  // 世界位置浮字（伤害数字等）
  showFloat(text, worldPos, color = '#ffe44a') {
    // 简化：直接用 DOM 元素贴在屏幕坐标
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = `
      position:absolute; z-index:25; font-weight:bold; font-size:22px;
      color:${color}; text-shadow:0 2px 4px #000, 0 0 2px #000;
      pointer-events:none; transition:transform .8s, opacity .8s;
    `;
    document.body.appendChild(el);
    const proj = this._project(worldPos);
    el.style.left = proj.x + 'px';
    el.style.top = proj.y + 'px';
    requestAnimationFrame(() => {
      el.style.transform = 'translateY(-50px)';
      el.style.opacity = '0';
    });
    setTimeout(() => el.remove(), 900);
  },

  _project(worldPos) {
    const v = worldPos.clone().add(new THREE.Vector3(0, 2, 0));
    v.project(window.game.camera);
    return {
      x: (v.x * 0.5 + 0.5) * window.innerWidth,
      y: (-v.y * 0.5 + 0.5) * window.innerHeight
    };
  }
};
