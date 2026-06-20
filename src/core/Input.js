/* ========================================================
   Input.js — 统一输入管理
   - 桌面端：WASD + 鼠标 + 键盘
   - 移动端：虚拟摇杆 + 动作按钮
   对外暴露 Input.state，每帧由 Game 读取
   ======================================================== */

const Input = {
  state: {
    move:   { x: 0, y: 0 },   // 摇杆/方向键，范围 -1..1
    movePower: 0,             // 摇杆力度，0=停，1=全速
    attack: false,            // 攻击（边沿触发用 justAttack）
    justAttack: false,
    jump:   false,
    justJump: false,
    lock:   false,
    justLock: false,
    shield: false,            // 持续按
    justShield: false,        // ★ 按下盾牌的那一帧（边沿，用于完美格挡判定）
    interact: false,
    justInteract: false,
    inventory: false,
    justInventory: false,
    justBowTarget: false,
    justArrowType: false,
    justWeaponCycle: false,
    justBowCycle: false,
    justQuest: false,
    justParry: false,
    justFlurryRush: false,
    justQuality: false,
    camera: { dx: 0, dy: 0 } // 视角拖动（触屏右半区/鼠标）
  },

  // ★ 便捷代理（代码里可以直接 Input.attack 而不用 Input.state.attack）
  get move() { return this.state.move; },
  get movePower() { return this.state.movePower; },
  get attack() { return this.state.attack; },
  get justAttack() { return this.state.justAttack; },
  get jump() { return this.state.jump; },
  get justJump() { return this.state.justJump; },
  get lock() { return this.state.lock; },
  get justLock() { return this.state.justLock; },
  get shield() { return this.state.shield; },
  get justShield() { return this.state.justShield; },
  get interact() { return this.state.interact; },
  get justInteract() { return this.state.justInteract; },
  get inventory() { return this.state.inventory; },
  get justInventory() { return this.state.justInventory; },
  get justBowTarget() { return this.state.justBowTarget; },
  get justArrowType() { return this.state.justArrowType; },
  get justWeaponCycle() { return this.state.justWeaponCycle; },
  get justBowCycle() { return this.state.justBowCycle; },
  get justQuest() { return this.state.justQuest; },
  get justParry() { return this.state.justParry; },
  get justFlurryRush() { return this.state.justFlurryRush; },
  get justQuality() { return this.state.justQuality; },

  isTouch: false,
  _keys: {},
  _lastTriggerAt: {},
  _debouncedFlags: {
    justLock: 160,
    justInteract: 160,
    justInventory: 160,
    justBowTarget: 160,
    justArrowType: 160,
    justWeaponCycle: 180,
    justBowCycle: 180,
    justQuest: 160,
    justParry: 180,
    justFlurryRush: 140,
    justQuality: 220
  },

  init() {
    this.isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    this._setupKeyboard();
    this._setupMouse();
    // 移动端隐藏鼠标右键菜单
    window.addEventListener('contextmenu', e => e.preventDefault());
  },

  // ---------- 键盘 ----------
  _setupKeyboard() {
    window.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      if (this._keys[k]) { return; } // 防止 keydown 重复触发
      this._keys[k] = true;
      this._refreshMove();
      if (k === ' ') this._trigger('justJump');
      if (k === 'j' || k === 'mouse0') this._trigger('justAttack');
      if (k === 'q') this._trigger('justLock');
      if (k === 'e') this._trigger('justInteract');
      if (k === 'tab') { e.preventDefault(); this._trigger('justBowTarget'); }
      if (k === 'r') this._trigger('justArrowType');
      if (k === 'z') this._trigger('justWeaponCycle');
      if (k === 'x') this._trigger('justBowCycle');
      if (k === 'f') this.pressParry();
      if (k === 'o') this._trigger('justQuest');
      if (k === 'p') this._trigger('justQuality');
      if (k === 'i') this._trigger('justInventory');
      if (k === 'shift') this._trigger('justShield');
      this.state.shield = !!(this._keys['shift']);
      this.state.jump = !!(this._keys[' ']);
      this.state.attack = !!(this._keys['j']);
      this.state.lock = !!(this._keys['q']);
      this.state.shield = !!(this._keys['shift']);
      this.state.interact = !!(this._keys['e']);
    });
    window.addEventListener('keyup', e => {
      const k = e.key.toLowerCase();
      this._keys[k] = false;
      this._refreshMove();
      this.state.jump = !!(this._keys[' ']);
      this.state.attack = !!(this._keys['j']);
      this.state.lock = !!(this._keys['q']);
      this.state.shield = !!(this._keys['shift']);
      this.state.interact = !!(this._keys['e']);
    });
  },

  _trigger(flag) {
    const debounce = this._debouncedFlags[flag] || 0;
    if (debounce) {
      const now = performance.now();
      if (now - (this._lastTriggerAt[flag] || 0) < debounce) return;
      this._lastTriggerAt[flag] = now;
    }
    this.state[flag] = true;
  },

  _refreshMove() {
    let x = 0, y = 0;
    if (this._keys['w'] || this._keys['arrowup']) y -= 1;
    if (this._keys['s'] || this._keys['arrowdown']) y += 1;
    if (this._keys['a'] || this._keys['arrowleft']) x -= 1;
    if (this._keys['d'] || this._keys['arrowright']) x += 1;
    const len = Math.hypot(x, y);
    if (len > 0) { x /= len; y /= len; }
    // 只在没有摇杆输入时用键盘覆盖
    if (!this._joyActive) {
      this.state.move.x = x;
      this.state.move.y = y;
      this.state.movePower = len > 0 ? 1 : 0;
    }
  },

  // ---------- 鼠标（桌面端攻击/视角） ----------
  _setupMouse() {
    window.addEventListener('mousedown', e => {
      if (e.button === 0) {
        this.state.attack = true;
        this._trigger('justAttack');
      }
    });
    window.addEventListener('mouseup', e => {
      if (e.button === 0) this.state.attack = false;
    });
  },

  // ---------- 摇杆接口（被 Joystick.js 调用） ----------
  _joyActive: false,
  _joyX: 0,
  _joyY: 0,
  setJoystick(x, y) {
    const raw = Math.min(1, Math.hypot(x, y));
    const dead = 0.18;
    if (raw <= dead) {
      this._joyActive = false;
      this._joyX = 0;
      this._joyY = 0;
      this.state.move.x = 0;
      this.state.move.y = 0;
      this.state.movePower = 0;
      return;
    }
    let nx = x / raw;
    let ny = y / raw;

    // 手机横屏战斗里最怕轻微斜推导致方向飘。接近 8 向时吸附，保留精细斜走。
    const angle = Math.atan2(ny, nx);
    const snapStep = Math.PI / 4;
    const snapped = Math.round(angle / snapStep) * snapStep;
    const delta = Math.abs(Math.atan2(Math.sin(angle - snapped), Math.cos(angle - snapped)));
    const snapStrength = raw > 0.62 ? 0.9 : 0.72;
    if (delta < 0.18 * snapStrength) {
      nx = Math.cos(snapped);
      ny = Math.sin(snapped);
    }

    const t = Math.min(1, (raw - dead) / (1 - dead));
    const curved = t * t * (3 - 2 * t);
    const alpha = raw > 0.72 ? 0.62 : 0.46;
    this._joyX += (nx * curved - this._joyX) * alpha;
    this._joyY += (ny * curved - this._joyY) * alpha;
    this._joyActive = true;
    this.state.move.x = this._joyX;
    this.state.move.y = this._joyY;
    this.state.movePower = Math.min(1, Math.hypot(this._joyX, this._joyY));
  },

  // ---------- 动作按钮接口（被 ActionButtons.js 调用） ----------
  pressAttack() { this.state.attack = true; this._trigger('justAttack'); },
  releaseAttack() { this.state.attack = false; },
  pressJump() { this.state.jump = true; this._trigger('justJump'); },
  releaseJump() { this.state.jump = false; },
  pressShield() { this._holdShield = true; this.state.shield = true; this._trigger('justShield'); },
  releaseShield() { this._holdShield = false; if (!this._parryShield) this.state.shield = false; },
  pressParry() {
    this._parryShield = true;
    this.state.shield = true;
    this._trigger('justShield');
    this._trigger('justParry');
    if (this._parryReleaseTimer) clearTimeout(this._parryReleaseTimer);
    this._parryReleaseTimer = setTimeout(() => {
      this._parryShield = false;
      if (!this._holdShield) this.state.shield = false;
      this._parryReleaseTimer = null;
    }, 420);
  },
  pressFlurryRush() { this._trigger('justFlurryRush'); },
  toggleLock() { this._trigger('justLock'); },
  toggleInventory() { this._trigger('justInventory'); },
  cycleBowTarget() { this._trigger('justBowTarget'); },
  cycleArrowType() { this._trigger('justArrowType'); },
  cycleWeapon() { this._trigger('justWeaponCycle'); },
  cycleBow() { this._trigger('justBowCycle'); },
  toggleQuest() { this._trigger('justQuest'); },
  pressInteract() {
    this.state.interact = true;
    this._trigger('justInteract');
    this._interactBuffer = 0.25;
    if (this._interactReleaseTimer) clearTimeout(this._interactReleaseTimer);
    this._interactReleaseTimer = setTimeout(() => {
      this.state.interact = false;
      this._interactReleaseTimer = null;
    }, 180);
  },

  // ---------- 镜头缩放（双指捏合） ----------
  setCameraDistance(d) {
    this.cameraDistance = Math.max(6, Math.min(22, d));
  },
  cameraDistance: 11,

  _interactBuffer: 0,
  _interactReleaseTimer: null,
  _holdShield: false,
  _parryShield: false,
  _parryReleaseTimer: null,

  // ---------- 每帧末尾调用：清掉边沿触发标记 ----------
  endFrame() {
    if (this.state.justInteract) this._interactBuffer = 0.18;
    else if (this._interactBuffer > 0) this._interactBuffer = Math.max(0, this._interactBuffer - 1 / 60);
    this.state.justAttack = false;
    this.state.justJump = false;
    this.state.justLock = false;
    this.state.justShield = false;
    this.state.justInteract = false;
    this.state.justInventory = false;
    this.state.justBowTarget = false;
    this.state.justArrowType = false;
    this.state.justWeaponCycle = false;
    this.state.justBowCycle = false;
    this.state.justQuest = false;
    this.state.justParry = false;
    this.state.justFlurryRush = false;
    this.state.justQuality = false;
    this.state.camera.dx = 0;
    this.state.camera.dy = 0;
  }
};

if (typeof window !== 'undefined') window.Input = Input;
