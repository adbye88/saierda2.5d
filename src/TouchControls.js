/* ========================================================
   TouchControls.js — 全局触摸控制
   - 全屏模式（双击/按钮进入 fullscreen）
   - 双指捏合缩放镜头
   - 防止页面滚动/缩放干扰
   ======================================================== */

const TouchControls = {
  pinchStartDist: 0,
  pinchStartCam: 11,

  init() {
    // 1. 阻止默认双指缩放和双击放大（让游戏独占手势）
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('gesturechange', e => e.preventDefault());
    // 阻止双击放大
    let lastTouch = 0;
    document.addEventListener('touchend', e => {
      const now = Date.now();
      if (now - lastTouch < 300) e.preventDefault();
      lastTouch = now;
    }, { passive: false });

    // 2. 双指捏合 → 镜头距离
    document.addEventListener('touchstart', e => {
      if (e.touches.length === 2) {
        this.pinchStartDist = this._dist(e.touches);
        this.pinchStartCam = Input.cameraDistance;
        e.preventDefault();
      }
    }, { passive: false });

    document.addEventListener('touchmove', e => {
      if (e.touches.length === 2 && this.pinchStartDist > 0) {
        const d = this._dist(e.touches);
        const ratio = d / this.pinchStartDist;
        Input.setCameraDistance(this.pinchStartCam / ratio);
        e.preventDefault();
      }
    }, { passive: false });

    document.addEventListener('touchend', e => {
      if (e.touches.length < 2) this.pinchStartDist = 0;
    });

    // 3. 鼠标滚轮缩放（桌面）
    document.addEventListener('wheel', e => {
      if (window.game && window.game.state === 'playing') {
        Input.setCameraDistance(Input.cameraDistance + (e.deltaY > 0 ? 1.5 : -1.5));
        e.preventDefault();
      }
    }, { passive: false });

    // 4. 全屏：首次触摸自动尝试进入（部分浏览器需要用户手势）
    const tryFullscreen = () => {
      const el = document.documentElement;
      const isFS = document.fullscreenElement || document.webkitFullscreenElement;
      if (!isFS && el.requestFullscreen) {
        // 不强制，仅提供能力（避免打扰）
      }
      document.removeEventListener('touchend', tryFullscreen);
    };
    // 提供手动全屏按钮（见 HTML）
  },

  _dist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  },

  // 主动请求全屏
  requestFullscreen() {
    const el = document.documentElement;
    const fn = el.requestFullscreen || el.webkitRequestFullscreen || el.webkitRequestFullScreen || el.msRequestFullscreen;
    if (fn) fn.call(el).catch(() => {});
    // iOS Safari 用特殊的 navigator.standalone
  },

  exitFullscreen() {
    const fn = document.exitFullscreen || document.webkitExitFullscreen || document.webkitCancelFullScreen;
    if (fn) fn.call(document);
  },

  toggleFullscreen() {
    const isFS = document.fullscreenElement || document.webkitFullscreenElement;
    if (isFS) this.exitFullscreen();
    else this.requestFullscreen();
  }
};
