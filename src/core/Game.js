/* ========================================================
   Game.js — 游戏主引擎
   职责：Three.js 渲染器/相机/灯光/时钟，场景状态机，全局事件总线
   ======================================================== */

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.clock = new THREE.Clock();
    this.player = null;
    this.currentWorld = null;
    this.worlds = {};
    this.lockedEnemy = null;
    this.state = 'menu';        // menu | playing | paused | dead | win
    this.onPause = null;
    this.onHudUpdate = null;
    this.autoPath = null;
    this.linkTimeTimer = 0;
  }

  init() {
    // 渲染器（提升画质：抗锯齿 + 高分辨率 + PBR）
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    // 手机高 DPI 屏，但限制避免性能问题
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.physicallyCorrectLights = true;

    // 相机（第三人称俯视斜角，视野更大）
    this.camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 500);
    this.camera.position.set(0, 12, 14);
    this.camera.lookAt(0, 0, 0);

    window.addEventListener('resize', () => this._onResize());

    Input.init();
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ---------- 玩家 ----------
  createPlayer() {
    this.player = new Player();
    if (this.currentWorld) {
      this.currentWorld.scene.add(this.player.mesh);
      this.player.spawn(this.currentWorld.spawnPoint);
      // ★ 必须设置 world，否则 Player._move 里的碰撞检测和边界夹紧全部跳过
      this.player.world = this.currentWorld;
    }
  }

  // ---------- 切换世界 ----------
  loadWorld(name) {
    console.log('=== 切换世界到:', name, '===');
    // 1. 从旧场景移除玩家
    if (this.currentWorld && this.player) {
      try { this.currentWorld.scene.remove(this.player.mesh); } catch(e) {}
    }
    // 2. 清理特效和血条
    Effects.clear();
    HUD.clearEnemyBars();
    HUD.hideBoss();
    // 3. 切换世界
    const newWorld = this.worlds[name];
    if (!newWorld) { console.error('世界不存在:', name); return; }
    this.currentWorld = newWorld;
    newWorld.load();
    if (newWorld.gates) {
      for (const gate of newWorld.gates) gate.userData.triggered = false;
    }
    // 4. 特效系统指向新场景
    Effects.attach(newWorld.scene);
    // 5. 重置新世界的伤害计时器（防旧计时器残留导致持续掉血）
    newWorld._coldDmgTimer = 99;  // 设大值，等进入新区域才重新计时
    newWorld._burnTimer = 99;
    newWorld._heatTimer = 99;
    // 6. 玩家加入新场景
    if (this.player) {
      newWorld.scene.add(this.player.mesh);
      // ★ spawn 前先确保位置合法（在边界内）
      const sp = newWorld.spawnPoint;
      const b = newWorld.bounds;
      const safeX = Math.max(b.minX + 3, Math.min(b.maxX - 3, sp.x));
      const safeZ = Math.max(b.minZ + 3, Math.min(b.maxZ - 3, sp.z));
      this.player.spawn({ x: safeX, z: safeZ, a: sp.a || 0 });
      this.player.world = newWorld;
      // 重置玩家无敌时间（防传送途中被打）
      this.player.invuln = 1.0;
      // 重置击退
      this.player.knockback.set(0, 0, 0);
      // 玩家可见
      this.player.mesh.visible = true;
      console.log('玩家 spawn 在:', safeX, safeZ, '边界:', JSON.stringify(b));
    }
    // 7. 更新场景引用
    this.scene = newWorld.scene;
    // 8. 重置锁定
    this.lockedEnemy = null;
    // 9. 更新小地图
    HUD.setMinimapWorld(newWorld);
    if (typeof AudioSystem !== 'undefined') AudioSystem.setWorld(name);
    if (typeof VisualQualitySystem !== 'undefined') VisualQualitySystem.applyWorld(newWorld);
    if (typeof ArtDirectionSystem !== 'undefined') ArtDirectionSystem.applyWorld(newWorld, this);
    if (typeof ModelPolishSystem !== 'undefined') ModelPolishSystem.polishWorld(newWorld);
    if (typeof WorldPolishSystem !== 'undefined') WorldPolishSystem.applyWorld(newWorld);
    if (typeof BillboardPolishSystem !== 'undefined') BillboardPolishSystem.applyWorld(newWorld);
    if (typeof StorySystem !== 'undefined') StorySystem.onWorldLoaded(newWorld);
    // 10. 立即渲染一帧（防黑屏）
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  registerWorld(name, world) {
    this.worlds[name] = world;
  }

  respawnPlayer() {
    if (!this.player || !this.currentWorld) return;
    const sp = this.currentWorld.spawnPoint || { x: 0, z: 0, a: 0 };
    this.player.spawn(sp);
    this.player.hp = this.player.maxHp * 4;
    this.player.stamina = this.player.maxStamina;
    this.player.invuln = 2.0;
    this.player.knockback.set(0, 0, 0);
    this.player._burnTimer = 0;
    this.player._slowTimer = 0;
    this.player._stunTimer = 0;
    this.state = 'playing';
    Dialogue.show('你在安全地点醒来，进度没有丢失。');
    if (typeof Effects !== 'undefined') Effects.portalEffect(this.player.position);
  }

  _cycleLockTarget() {
    if (!this.player || !this.currentWorld || !Array.isArray(this.currentWorld.enemies)) return;
    const candidates = this.currentWorld.enemies
      .filter(e => e && !e.dead && e.hp > 0 && e.mesh)
      .map(e => {
        const dx = e.mesh.position.x - this.player.position.x;
        const dz = e.mesh.position.z - this.player.position.z;
        const dist = Math.hypot(dx, dz);
        return { enemy: e, dist };
      })
      .filter(e => e.dist <= 18 + ((e.enemy && e.enemy.radius) || 0))
      .sort((a, b) => a.dist - b.dist);

    if (!candidates.length) {
      this.lockedEnemy = null;
      if (typeof Dialogue !== 'undefined') Dialogue.show('附近没有可锁定目标');
      return;
    }

    const currentIndex = candidates.findIndex(c => c.enemy === this.lockedEnemy);
    const next = candidates[(currentIndex + 1) % candidates.length].enemy;
    this.lockedEnemy = next;
    if (typeof Dialogue !== 'undefined') {
      Dialogue.showFloat(`锁定：${next.def && next.def.name ? next.def.name : '目标'}`, next.mesh.position.clone().setY(2.2), '#ffe16a');
    }
  }

  triggerLinkTime(duration = 1.35) {
    this.linkTimeTimer = Math.max(this.linkTimeTimer || 0, duration);
  }

  // ---------- 主循环 ----------
  start() {
    this.state = 'playing';
    this.clock.start();
    const loop = () => {
      requestAnimationFrame(loop);
      const dt = Math.min(this.clock.getDelta(), 0.05); // 防卡顿大跳
      this.update(dt);
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  update(dt) {
    // ★ try/catch 保护：任何逻辑错误都不应让游戏完全卡死
    //   报错显示在屏幕左下角，方便诊断，且不影响下一帧继续运行
    try {
      this._updateInner(dt);
    } catch (e) {
      console.error('★ update 出错:', e);
      // 显示错误（不刷屏，每秒最多更新一次）
      const now = performance.now();
      if (!this._lastErrShow || now - this._lastErrShow > 1500) {
        this._lastErrShow = now;
        this._showError(e);
      }
      // 确保输入状态不残留（即使出错也要清帧）
      try { Input.endFrame(); } catch(_) {}
    }
  }

  _showError(e) {
    this._errBox('update', e);
  }
  // 子系统级错误：标注来源，独立显示，互不覆盖
  _subError(subsystem, e) {
    console.error('★ [' + subsystem + '] 出错:', e);
    this._errBox(subsystem, e);
  }
  _errBox(tag, e) {
    const el = document.getElementById('runtime-error') || (() => {
      const d = document.createElement('div');
      d.id = 'runtime-error';
      d.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:9999;max-width:92%;max-height:55%;font-size:12px;font-family:monospace;background:rgba(180,0,0,.93);color:#fff;padding:10px 14px;border-radius:8px;white-space:pre-wrap;overflow:auto;line-height:1.5;box-shadow:0 4px 20px rgba(0,0,0,.5);';
      document.body.appendChild(d);
      return d;
    })();
    // 只显示堆栈的第一帧（最关键的出错位置），避免太长
    const stack = (e && e.stack) ? e.stack : String(e);
    const firstLine = stack.split('\n').slice(0, 4).join('\n');
    // 累积各子系统的错误（用 tag 区分），但每秒只刷新一次避免闪烁
    if (!this._errMap) this._errMap = {};
    this._errMap[tag] = firstLine;
    const now = performance.now();
    if (!this._errRenderAt || now - this._errRenderAt > 800) {
      this._errRenderAt = now;
      let txt = '⚠️ 发现错误（游戏继续运行）请截图发我：\n';
      for (const k in this._errMap) {
        txt += '\n【' + k + '】\n' + this._errMap[k] + '\n';
      }
      el.textContent = txt;
    }
  }

  _updateInner(dt) {
    if (this.state !== 'playing') {
      Input.endFrame();
      return;
    }
    if (this.linkTimeTimer > 0) {
      this.linkTimeTimer = Math.max(0, this.linkTimeTimer - dt);
    }
    // 背包切换
    if (Input.justInventory) {
      InventoryUI.toggle();
    }
    // 地图/菜单（M 键，与背包同等优先）
    if (Input._keys && (Input._keys['m'] && !this._mHandled)) {
      this._mHandled = true;
      MapMenu.toggle();
    }
    if (Input._keys && !Input._keys['m']) this._mHandled = false;
    if (Input.justQuest && typeof QuestUI !== 'undefined') {
      QuestUI.toggle();
    }
    if (Input.justLock) {
      this._cycleLockTarget();
    }
    if (Input._keys && (Input._keys['c'] && !this._cHandled)) {
      this._cHandled = true;
      if (typeof window.__openCompendium === 'function') window.__openCompendium();
    }
    if (Input._keys && !Input._keys['c']) this._cHandled = false;
    if (Input.justQuality && typeof VisualQualitySystem !== 'undefined') {
      VisualQualitySystem.cycle();
    }
    // 任一全屏菜单打开时暂停游戏
    if (InventoryUI.isOpen || CookingUI.isOpen || MapMenu.isOpen || ShopUI.isOpen || ShrineUI.isOpen || StatueUI.isOpen || (typeof QuestUI !== 'undefined' && QuestUI.isOpen) || (typeof CompendiumUI !== 'undefined' && CompendiumUI.isOpen)) {
      // 神庙答题挑战需要继续检测（即使"暂停"也要让答题逻辑跑）
      if (ShrineUI.isOpen) { try { ShrineUI.update(this); } catch(e){ console.error(e); } }
      Input.endFrame();
      return;
    }

    // ★ 各子系统用独立 try/catch 隔离：一个出错不影响其他，避免连锁卡死
    if (this.player) {
      try {
        this.player.update(dt, this);
        if (this.player.inventory.tickBuffs(dt)) {
          this.player.inventory._emit();
        }
        if (typeof ChampionSystem !== 'undefined') ChampionSystem.tick(dt);
      } catch (e) { this._subError('player', e); }
    }
    if (this.currentWorld) {
      const worldDt = this.linkTimeTimer > 0 ? dt * 0.035 : dt;
      try { this.currentWorld.update(worldDt, this); }
      catch (e) { this._subError('world', e); }
    }
    try { if (typeof StorySystem !== 'undefined') StorySystem.updateWorld(this.currentWorld, this, dt); }
    catch (e) { this._subError('story', e); }
    try { Effects.update(dt); }
    catch (e) { this._subError('effects', e); }
    if (this.lockedEnemy && (this.lockedEnemy.dead || this.lockedEnemy.hp <= 0)) {
      this.lockedEnemy = null;
    }
    try { HUD.update(this); }
    catch (e) { this._subError('hud', e); }
    try { if (typeof VisualQualitySystem !== 'undefined') VisualQualitySystem.update(dt, this); }
    catch (e) { this._subError('visual', e); }
    try { if (typeof ArtDirectionSystem !== 'undefined') ArtDirectionSystem.update(dt, this); }
    catch (e) { this._subError('art-direction', e); }
    try { if (typeof ModelPolishSystem !== 'undefined') ModelPolishSystem.update(dt, this); }
    catch (e) { this._subError('model-polish', e); }
    try { if (typeof WorldPolishSystem !== 'undefined') WorldPolishSystem.update(dt, this); }
    catch (e) { this._subError('world-polish', e); }
    try { if (typeof BillboardPolishSystem !== 'undefined') BillboardPolishSystem.update(dt, this); }
    catch (e) { this._subError('billboard-polish', e); }
    try { if (typeof AdaptivePerformanceSystem !== 'undefined') AdaptivePerformanceSystem.update(dt, this); }
    catch (e) { this._subError('adaptive-performance', e); }
    try { QuestSystem.refreshHint(); }
    catch (e) { this._subError('quest', e); }
    Input.endFrame();
  }
}
