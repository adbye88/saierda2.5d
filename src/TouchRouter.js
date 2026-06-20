/* ========================================================
   TouchRouter.js — 全局触摸路由器
   ★ 彻底绕过 iOS Safari <button> touchstart 不触发的 bug
   策略：
   1. 在 document 上监听 touchstart/touchend（不在按钮上）
   2. 用 elementFromPoint(x,y) 检测手指下方的元素
   3. 向上找 data-action 属性，触发对应回调
   4. 按住型按钮追踪 touch.identifier，手指离开屏幕才释放
   ======================================================== */

const TouchRouter = {
  // action => { down: fn, up: fn, hold: bool }
  handlers: {},
  // 活跃的按住型：touchId => action
  activeHolds: {},
  // 活跃的点击型：touchId => action
  activeTaps: {},

  init() {
    // ★ 只在 document 上监听，所有触摸都先到这里
    document.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
    document.addEventListener('touchend', (e) => this._onTouchEnd(e), { passive: false });
    document.addEventListener('touchcancel', (e) => this._onTouchEnd(e), { passive: false });

    // 鼠标兜底（桌面）
    document.addEventListener('mousedown', (e) => this._onMouseDown(e));
    document.addEventListener('mouseup', (e) => this._onMouseUp(e));

    // 失焦时释放所有
    window.addEventListener('blur', () => this._releaseAll());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this._releaseAll();
    });
  },

  // 注册动作
  // type: 'hold'（按住）或 'tap'（点击）
  on(action, type, downFn, upFn) {
    this.handlers[action] = { type, down: downFn, up: upFn };
  },

  // ===== 找到坐标下的按钮 action =====
  _findAction(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    // 向上找带 data-action 的祖先
    let node = el;
    while (node && node !== document.body) {
      if (node.dataset && node.dataset.action) {
        return { action: node.dataset.action, el: node };
      }
      node = node.parentElement;
    }
    return null;
  },

  // ===== touchstart =====
  _onTouchStart(e) {
    // HTML 按钮已有内联 touch 处理；如果目标阶段已经处理过，这里作为备份不再重复触发。
    if (e.defaultPrevented) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const hit = this._findAction(t.clientX, t.clientY);
      if (!hit) continue;

      const handler = this.handlers[hit.action];
      if (!handler) continue;

      // 阻止默认行为（防滚动/缩放）
      e.preventDefault();

      if (handler.type === 'hold') {
        // 按住型
        if (this.activeHolds[t.identifier]) continue;  // 已占用
        this.activeHolds[t.identifier] = hit.action;
        hit.el.classList.add('pressed');
        handler.down && handler.down();
      } else {
        // 点击型：记录，等 touchend 触发
        this.activeTaps[t.identifier] = { action: hit.action, el: hit.el };
        hit.el.classList.add('pressed');
      }
    }
  },

  // ===== touchend =====
  _onTouchEnd(e) {
    if (e.defaultPrevented) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const id = t.identifier;

      // 处理按住型释放
      if (this.activeHolds[id]) {
        const action = this.activeHolds[id];
        const handler = this.handlers[action];
        const el = this._findElementByAction(action);
        if (el) el.classList.remove('pressed');
        handler && handler.up && handler.up();
        delete this.activeHolds[id];
        e.preventDefault();
      }

      // 处理点击型触发
      if (this.activeTaps[id]) {
        const tap = this.activeTaps[id];
        const handler = this.handlers[tap.action];
        tap.el.classList.remove('pressed');
        handler && handler.down && handler.down();  // tap 的 down 就是触发
        delete this.activeTaps[id];
        e.preventDefault();
      }
    }
  },

  _findElementByAction(action) {
    return document.querySelector('[data-action="' + action + '"]');
  },

  // ===== 鼠标（桌面）=====
  _onMouseDown(e) {
    const hit = this._findAction(e.clientX, e.clientY);
    if (!hit) return;
    const handler = this.handlers[hit.action];
    if (!handler) return;
    e.preventDefault();
    this._mouseAction = hit.action;
    this._mouseEl = hit.el;
    hit.el.classList.add('pressed');
    if (handler.type === 'tap') {
      // tap 在 mouseup 触发
    } else {
      handler.down && handler.down();
    }
  },

  _onMouseUp(e) {
    if (!this._mouseAction) return;
    const handler = this.handlers[this._mouseAction];
    if (this._mouseEl) this._mouseEl.classList.remove('pressed');
    if (handler) {
      if (handler.type === 'tap') {
        if (!this._recentInline(this._mouseAction)) handler.down && handler.down();
      } else {
        handler.up && handler.up();
      }
    }
    this._mouseAction = null;
    this._mouseEl = null;
  },

  _recentInline(action) {
    const last = window.__btnInlineLast;
    return !!(last && last.action === action && performance.now() - last.time < 180);
  },

  _releaseAll() {
    for (const id in this.activeHolds) {
      const action = this.activeHolds[id];
      const handler = this.handlers[action];
      const el = this._findElementByAction(action);
      if (el) el.classList.remove('pressed');
      handler && handler.up && handler.up();
    }
    this.activeHolds = {};
    this.activeTaps = {};
  }
};
