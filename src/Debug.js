/* ========================================================
   Debug.js v2 — 轻量调试工具
   - console 劫持只存内存，不实时改 DOM（防卡顿）
   - 三指点击右上角才渲染一次
   ======================================================== */

const Debug = {
  lines: [],
  maxLines: 20,
  shown: false,

  init() {
    this.el = document.getElementById('debug-overlay');
    let triTapCount = 0;
    let triTapTimer = 0;
    document.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        const t = e.changedTouches[0];
        if (t.clientX > window.innerWidth * 0.7 && t.clientY < window.innerHeight * 0.2) {
          triTapCount++;
          if (triTapTimer) clearTimeout(triTapTimer);
          triTapTimer = setTimeout(() => { triTapCount = 0; }, 600);
          if (triTapCount >= 3) {
            triTapCount = 0;
            this.toggle();
          }
        }
      }
    });
  },

  log(msg, isErr) {
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false }).slice(-8);
    this.lines.push({ time, msg: String(msg).slice(0, 200), isErr });
    if (this.lines.length > this.maxLines) this.lines.shift();
    // ★ 只在面板显示时才渲染，不显示时零开销
    if (this.shown) this._render();
  },

  _render() {
    if (!this.el) return;
    this.el.innerHTML = this.lines.map(l =>
      `<div class="dbg-line${l.isErr ? ' dbg-err' : ''}">[${l.time}] ${l.msg}</div>`
    ).join('');
  },

  show() { this.shown = true; if (this.el) this.el.classList.add('show'); this._render(); },
  hide() { this.shown = false; if (this.el) this.el.classList.remove('show'); },
  toggle() { this.shown ? this.hide() : this.show(); }
};

// console 劫持（轻量，只 push 到数组，不操作 DOM）
(function() {
  try {
    const origLog = console.log ? console.log.bind(console) : function(){};
    const origErr = console.error ? console.error.bind(console) : function(){};
    console.log = function() {
      try {
        origLog.apply(console, arguments);
        if (typeof Debug !== 'undefined' && Debug && Debug.lines) {
          Debug.log(Array.prototype.map.call(arguments, function(a) {
            return typeof a === 'object' ? (a && a.message ? a.message : JSON.stringify(a)) : String(a);
          }).join(' '));
        }
      } catch(e) {}
    };
    console.error = function() {
      try {
        origErr.apply(console, arguments);
        if (typeof Debug !== 'undefined' && Debug && Debug.lines) {
          Debug.log('ERR: ' + Array.prototype.map.call(arguments, function(a) {
            return a && a.message ? a.message : String(a);
          }).join(' '), true);
        }
      } catch(e) {}
    };
  } catch(e) {}
})();
