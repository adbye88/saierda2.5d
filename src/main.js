/* ========================================================
   main.js v3 — 入口（彻底解决按钮绑定时序问题）
   - boot() 初始化游戏
   - boot 完成后主动绑定菜单按钮
   - 提供全局 __bindMenuButtons 给加载器调用
   ======================================================== */

(function () {
  let game = null;
  let booted = false;
  let worldsRegistered = false;
  let playerReady = false;

  // 等待资源加载完成
  function whenReady(cb) {
    function check() {
      if (window.__loadState && window.__loadState.scriptsLoaded) {
        cb();
      } else {
        setTimeout(check, 100);
      }
    }
    check();
  }

  function boot() {
    if (booted) return;
    booted = true;
    try {
      if (typeof THREE === 'undefined') throw new Error('THREE 未加载');
      if (typeof Game === 'undefined') throw new Error('Game 类未加载');

      window.__setStatus && window.__setStatus('boot: 检测设备...');

      // ★ 设备检测
      const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
      const isProbablyDesktop = !isTouchDevice && window.matchMedia && window.matchMedia('(hover: hover)').matches;
      if (isProbablyDesktop) {
        document.documentElement.classList.add('desktop-mode');
      }

      window.__setStatus && window.__setStatus('boot: 创建游戏...');
      game = new Game();
      window.game = game;

      window.__setStatus && window.__setStatus('boot: 初始化引擎...');
      game.init();

      window.__setStatus && window.__setStatus('boot: 初始化 UI...');
      Debug.init();
      HUD.init();
      Joystick.init();
      ActionButtons.init();
      InventoryUI.init();
      Dialogue.init();
      CookingUI.init();
      ShopUI.init();
      QuestUI.init();
      ShrineUI.init();
      StatueUI.init();
      MapMenu.init();
      if (typeof CompendiumUI !== 'undefined') CompendiumUI.init();
      if (typeof CloudAccountSystem !== 'undefined') CloudAccountSystem.init();
      QuestSystem.init();
      if (typeof StorySystem !== 'undefined') StorySystem.init();
      ChampionSystem.init();
      if (typeof DivineBeastChallengeSystem !== 'undefined') DivineBeastChallengeSystem.init();
      if (typeof MainQuestSystem !== 'undefined') MainQuestSystem.init();
      AudioSystem.init();
      if (typeof VisualQualitySystem !== 'undefined') VisualQualitySystem.init(game);
      if (typeof ArtDirectionSystem !== 'undefined') ArtDirectionSystem.init(game);
      if (typeof QualitySettingsUI !== 'undefined') QualitySettingsUI.init(game);
      if (typeof ModelPolishSystem !== 'undefined') ModelPolishSystem.init(game);
      if (typeof CharacterArtSystem !== 'undefined') CharacterArtSystem.init(game);
      if (typeof WorldPolishSystem !== 'undefined') WorldPolishSystem.init(game);
      if (typeof BillboardPolishSystem !== 'undefined') BillboardPolishSystem.init(game);
      if (typeof AdaptivePerformanceSystem !== 'undefined') AdaptivePerformanceSystem.init(game);
      if (typeof ExplorationSystem !== 'undefined') ExplorationSystem.init(game);
      TouchControls.init();

      window.__setStatus && window.__setStatus('boot: 准备菜单与账号...');
      registerWorlds();
      window.__setStatus && window.__setStatus('boot: 完成！');
      // 隐藏 boot 状态条（加载完成后不需要）
      var bs = document.getElementById('boot-status');
      if (bs) bs.style.display = 'none';
      console.log('=== 游戏初始化完成 ===');
      if (typeof window.__enableStartButton === 'function') window.__enableStartButton();
      window.__bindMenuButtons();

      setInterval(() => {
        if (game.state === 'dead') showGameOver();
      }, 500);

    } catch (e) {
      console.error('★★★ boot 失败:', e.message);
      console.error(e.stack);
      // ★ 即使失败也定义 __bindMenuButtons，让按钮显示错误
      window.__bindMenuButtons = function() {
        const bind = (id, msg) => {
          const btn = document.getElementById(id);
          if (!btn) return;
          const nb = btn.cloneNode(true);
          btn.parentNode.replaceChild(nb, btn);
          nb.disabled = false;
          nb.style.opacity = '1';
          const fire = (e) => {
            e.preventDefault();
            alert('初始化失败: ' + msg + '\n请刷新页面重试');
          };
          nb.addEventListener('touchend', fire, { passive: false });
          nb.addEventListener('click', fire);
        };
        bind('btn-start', e.message);
        bind('btn-continue', e.message);
        document.getElementById('btn-howto').textContent = '查看错误';
        bind('btn-howto', e.message);
      };
      if (typeof window.__enableStartButton === 'function') window.__enableStartButton();
      window.__bindMenuButtons();
    }
  }

  // ★ 提前定义 __bindMenuButtons 的占位（让加载器能调用）
  // boot 成功后会被覆盖
  window.__bindMenuButtons = function() {
    console.log('__bindMenuButtons 占位（boot 未完成）');
  };

  // ===== 全局函数：绑定菜单按钮（加载器和 boot 都可调用）=====
  window.__bindMenuButtons = function() {
    if (!game) {
      console.log('game 还没初始化，等 boot');
      return;
    }
    console.log('绑定菜单按钮事件');

    // ★ 用多种事件确保 iPhone 能触发
    const bind = (id, handler) => {
      const btn = document.getElementById(id);
      if (!btn) { console.log('⚠️ 找不到', id); return; }
      // 移除旧监听（避免重复）
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      // 确保 disabled=false
      newBtn.disabled = false;
      newBtn.style.opacity = '1';
      newBtn.style.pointerEvents = 'auto';

      let triggered = false;
      const fire = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (triggered) return;
        triggered = true;
        setTimeout(() => { triggered = false; }, 300);
        console.log('▶ 触发', id);
        handler();
      };
      // touchend（iPhone 主力）
      newBtn.addEventListener('touchend', fire, { passive: false });
      // click（桌面/兜底）
      newBtn.addEventListener('click', fire);
      // pointerup（部分浏览器）
      newBtn.addEventListener('pointerup', (e) => {
        if (e.pointerType === 'touch') return; // 避免和 touchend 重复
        fire(e);
      });
    };

    bind('btn-start', startGame);
    bind('btn-continue', () => {
      MapMenu.open('load');
    });
    bind('btn-cloud', () => {
      MapMenu.open('cloud');
    });
    bind('btn-howto', () => {
      document.getElementById('howto').classList.toggle('hidden');
    });
    bind('btn-quality-menu', () => {
      if (typeof QualitySettingsUI !== 'undefined') QualitySettingsUI.open();
    });
  };

  // ★ 也暴露给加载器检查
  window.__startGame = function() { return startGame(); };
  window.__ensureStarterRangedKit = ensureStarterRangedKit;
  window.__ensureGameReady = ensureGameReady;

  function registerWorlds() {
    if (!game || worldsRegistered) return;
    window.__setStatus && window.__setStatus('boot: 注册世界索引...');
    game.registerWorld('grassland', new Grassland());
    game.registerWorld('forest', new Forest());
    game.registerWorld('highland', new Highland());
    game.registerWorld('dungeon', new Dungeon());
    game.registerWorld('snowland', new Snowland());
    game.registerWorld('volcano', new Volcano());
    game.registerWorld('desert', new Desert());
    game.registerWorld('castle', new HyruleCastle());
    worldsRegistered = true;
  }

  function ensureGameReady(worldName = 'grassland') {
    if (!game) return false;
    registerWorlds();
    if (!game.currentWorld || game.currentWorld.name !== worldName) {
      window.__setStatus && window.__setStatus('正在生成地图：' + worldName);
      game.loadWorld(worldName);
    }
    if (!game.player) {
      window.__setStatus && window.__setStatus('正在创建角色...');
      game.createPlayer();
      if (game.player && game.player.inventory) {
        game.player.inventory.onChange(() => InventoryUI.refreshIfOpen());
      }
    }
    setupStarterPlayer();
    playerReady = !!(game.player && game.currentWorld);
    if (game.renderer && game.scene && game.camera) game.renderer.render(game.scene, game.camera);
    const bs = document.getElementById('boot-status');
    if (bs) bs.style.display = 'none';
    return playerReady;
  }

  function setupStarterPlayer() {
    if (!game || !game.player || !game.player.inventory || game.player.userData && game.player.userData.starterKitReady) return;
    const inv = game.player.inventory;
    inv.add('oldShirt');
    inv.add('wellWornTrousers');
    inv.equip('armor_upper', inv.slots.armor_upper[0]);
    inv.equip('armor_lower', inv.slots.armor_lower[0]);
    inv.add('travelerSword');
    inv.equip('weapon', inv.slots.weapon[0]);
    inv.add('woodenShield');
    inv.equip('shield', inv.slots.shield[0]);
    inv.add('travelerBow');
    inv.equip('bow', inv.slots.bow[0]);
    inv.add('arrow', 20);
    inv.add('apple', 5);
    inv.add('sheikahSlate');
    ensureStarterRangedKit();
    game.player.refreshEquipment();
    game.player.userData = game.player.userData || {};
    game.player.userData.starterKitReady = true;
    if (typeof CharacterArtSystem !== 'undefined') CharacterArtSystem.applyPlayer(game.player);
  }

  function ensureStarterRangedKit() {
    if (!game || !game.player || !game.player.inventory) return;
    const inv = game.player.inventory;
    const hasAnyBow = !!inv.equipped.bow || (inv.slots.bow && inv.slots.bow.length > 0);
    if (!hasAnyBow) inv.add('travelerBow');
    if (!inv.equipped.bow && inv.slots.bow && inv.slots.bow.length > 0) {
      inv.equip('bow', inv.slots.bow[0]);
    }
    if (inv.arrows < 20) inv.add('arrow', 20 - inv.arrows);
    game.player.refreshEquipment();
  }

  function startGame() {
    console.log('开始游戏！');
    const pendingPreview = SaveSystem.peekPendingCloudCurrent && SaveSystem.peekPendingCloudCurrent();
    const targetWorld = pendingPreview && pendingPreview.worldName || 'grassland';
    if (!ensureGameReady(targetWorld)) return;
    const pendingCloud = SaveSystem.consumePendingCloudCurrent && SaveSystem.consumePendingCloudCurrent();
    if (pendingCloud) SaveSystem.applyLoad(pendingCloud);
    if (typeof AudioSystem !== 'undefined') AudioSystem.startMusic(game.currentWorld && game.currentWorld.name);
    ensureStarterRangedKit();
    const menu = document.getElementById('menu');
    if (menu) menu.classList.add('hidden');
    HUD.show();
    window.gameStartTime = Date.now();
    game.state = 'playing';
    game.start();
    QuestSystem.refreshHint();
  }

  function showGameOver() {
    const menu = document.getElementById('menu');
    document.getElementById('menu-title').textContent = '林克倒下了…';
    document.getElementById('btn-start').textContent = '重新开始';
    menu.classList.remove('hidden');
    HUD.hide();
  }

  // 启动
  whenReady(boot);
})();
