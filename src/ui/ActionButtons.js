/* ========================================================
   ActionButtons.js v6 — 用 TouchRouter（彻底绕过 iOS button bug）
   不再在按钮上绑定任何事件，全部交给 TouchRouter 的坐标命中检测
   ======================================================== */

const ActionButtons = {
  init() {
    // ★ TouchRouter 作为备份（主方案是 HTML 内联 ontouchstart → window.__btn）
    if (typeof TouchRouter !== 'undefined') {
      TouchRouter.init();
      TouchRouter.on('attack', 'hold', () => Input.pressAttack(), () => Input.releaseAttack());
      TouchRouter.on('jump', 'hold', () => Input.pressJump(), () => Input.releaseJump());
      TouchRouter.on('shield', 'hold', () => Input.pressShield(), () => Input.releaseShield());
      TouchRouter.on('parry', 'hold', () => Input.pressParryGuard(), () => Input.releaseParryGuard());
      TouchRouter.on('flurryRush', 'tap', () => Input.pressFlurryRush());
      TouchRouter.on('lock', 'tap', () => Input.toggleLock());
      TouchRouter.on('bag', 'tap', () => Input.toggleInventory());
      TouchRouter.on('map', 'tap', () => { if (typeof MapMenu !== 'undefined') MapMenu.toggle(); });
      TouchRouter.on('quest', 'tap', () => Input.toggleQuest());
      TouchRouter.on('compendium', 'tap', () => { if (typeof window.__openCompendium === 'function') window.__openCompendium(); });
      TouchRouter.on('weaponCycle', 'tap', () => Input.cycleWeapon());
      TouchRouter.on('bowCycle', 'tap', () => Input.cycleBow());
      TouchRouter.on('interact', 'tap', () => Input.pressInteract());
    }
    // ★ 关闭中央日志面板：它会挡住界面，且无实际游戏作用
    // （如需调试，改 window.__debugShowLog = true 重新开启）
    var logEl = document.getElementById('btn-log');
    if (logEl) logEl.style.display = 'none';
  },

  _toggleFullscreen() {
    const el = document.documentElement;
    // 检查是否在 standalone 模式（已从主屏幕启动）
    const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      Dialogue.show('已经在全屏模式');
      return;
    }
    // 方案1：标准 Fullscreen API（Android Chrome）
    const isFS = document.fullscreenElement || document.webkitFullscreenElement;
    if (!isFS) {
      const req = el.requestFullscreen || el.webkitRequestFullscreen || el.webkitRequestFullScreen;
      if (req) {
        try { req.call(el); } catch(e) {}
      }
    } else {
      const ex = document.exitFullscreen || document.webkitExitFullscreen;
      if (ex) ex.call(document);
    }
    // 方案2：iOS Safari 提示添加到主屏幕
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS && !isStandalone) {
      Dialogue.show('🍎 iOS全屏方法：\n点底部分享按钮 → 添加到主屏幕 → 从主屏幕打开即可全屏', 5000);
    }
    // 方案3：滚动隐藏地址栏（临时效果）
    setTimeout(() => {
      document.body.style.height = '101vh';
      window.scrollTo(0, 0);
      setTimeout(() => { document.body.style.height = ''; }, 300);
    }, 100);
  },

  setLockActive(active) {
    const btn = document.getElementById('btn-lock');
    if (btn) btn.classList.toggle('active', active);
  },

  setFlurryVisible(active) {
    const btn = document.getElementById('btn-flurry');
    if (btn) btn.classList.toggle('show', !!active);
  },

  showInteract(show, label) {
    const btn = document.getElementById('btn-interact');
    const hint = document.getElementById('interact-hint');
    if (!btn) return;
    if (show) {
      btn.classList.add('show', 'pulse');
      const span = btn.querySelector('span');
      if (span) span.textContent = label || '对话';
      if (hint) { hint.classList.add('show'); hint.textContent = '按 💬 ' + (label || '对话'); }
    } else {
      btn.classList.remove('show', 'pulse');
      if (hint) hint.classList.remove('show');
    }
  }
};
