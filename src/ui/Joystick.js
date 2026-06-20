/* ========================================================
   Joystick.js v4 — 虚拟摇杆（iPhone iOS Safari 终极修复版）
   关键修复：
   1. 用 getBoundingClientRect 计算中心（避免 viewport 缩放错位）
   2. 摇杆"上"= 角色远离镜头（符合直觉）
   3. pointerdown/move/up 全程跟踪，pointerup 绑 window
   4. setPointerCapture 防丢失
   5. 任何情况下都要归零（包括 blur/visibilitychange）
   ======================================================== */

const Joystick = {
  container: null, knob: null,
  active: false,
  pointerId: null,
  centerX: 0, centerY: 0,
  maxRadius: 55,

  init() {
    this.container = document.getElementById('joystick-fixed');
    if (!this.container) return;
    this.knob = this.container.querySelector('.joy-knob');

    // ★ 只用 Pointer Events（iOS 13+ Safari 完全支持，最可靠）
    this.container.addEventListener('pointerdown', (e) => this._onDown(e));

    // move/up 绑到 window，确保手指离开摇杆区域也能收到
    window.addEventListener('pointermove', (e) => this._onMove(e));
    window.addEventListener('pointerup', (e) => this._onUp(e));
    window.addEventListener('pointercancel', (e) => this._onUp(e));

    // 兜底：页面失焦/切后台/滚动 → 强制归零
    window.addEventListener('blur', () => this._reset());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this._reset();
    });
  },

  _onDown(e) {
    // 菜单打开时不响应
    if (this._anyMenuOpen()) return;
    if (this.active) return;
    e.preventDefault();

    // ★ 用 getBoundingClientRect 获取摇杆中心（处理全屏/缩放）
    const rect = this.container.getBoundingClientRect();
    this.centerX = rect.left + rect.width / 2;
    this.centerY = rect.top + rect.height / 2;
    this.maxRadius = Math.max(42, Math.min(58, rect.width * 0.37));
    this.pointerId = e.pointerId;
    this.active = true;

    // 锁定指针，确保 move/up 都能收到
    try { this.container.setPointerCapture(e.pointerId); } catch (err) {}

    this._update(e.clientX, e.clientY);
  },

  _onMove(e) {
    if (!this.active) return;
    if (e.pointerId !== this.pointerId) return;
    e.preventDefault();
    this._update(e.clientX, e.clientY);
  },

  _onUp(e) {
    if (!this.active) return;
    if (e.pointerId !== this.pointerId) return;
    this._reset();
  },

  _update(clientX, clientY) {
    let dx = clientX - this.centerX;
    let dy = clientY - this.centerY;
    const dist = Math.hypot(dx, dy);
    if (dist > this.maxRadius) {
      dx = (dx / dist) * this.maxRadius;
      dy = (dy / dist) * this.maxRadius;
    }
    // 移动旋钮
    this.knob.style.transform = `translate(${dx}px, ${dy}px)`;

    // ★ 关键：方向定义
    //   手指右滑 (dx>0) → 角色向屏幕右 → Input.move.x = +
    //   手指下滑 (dy>0) → 角色向屏幕下（靠近镜头）→ Input.move.y = +
    //   手指上滑 (dy<0) → 角色向屏幕上（远离镜头）→ Input.move.y = -
    const nx = dx / this.maxRadius;
    const ny = dy / this.maxRadius;
    Input.setJoystick(nx, ny);
  },

  _reset() {
    this.active = false;
    this.pointerId = null;
    // 旋钮回弹
    this.knob.style.transition = 'transform 0.15s ease-out';
    this.knob.style.transform = 'translate(0px, 0px)';
    setTimeout(() => { this.knob.style.transition = ''; }, 160);
    // ★ 必须归零输入
    Input.setJoystick(0, 0);
  },

  _anyMenuOpen() {
    return (typeof InventoryUI !== 'undefined' && InventoryUI.isOpen) ||
           (typeof CookingUI !== 'undefined' && CookingUI.isOpen) ||
           (typeof ShopUI !== 'undefined' && ShopUI.isOpen) ||
           (typeof ShrineUI !== 'undefined' && ShrineUI.isOpen) ||
           (typeof StatueUI !== 'undefined' && StatueUI.isOpen) ||
           (typeof MapMenu !== 'undefined' && MapMenu.isOpen) ||
           (typeof CompendiumUI !== 'undefined' && CompendiumUI.isOpen);
  }
};
