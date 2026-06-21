/* ========================================================
   main.js v4 — 两阶段入口
   - 第一阶段：只启动菜单、账号、云存档（不创建 WebGL，不加载完整游戏）
   - 第二阶段：点击开始/读档后再加载 3D 游戏脚本并构建世界
   ======================================================== */

(function () {
  let game = null;
  let booted = false;
  let runtimeReady = false;
  let worldsRegistered = false;
  let playerReady = false;
  let gameOverTimer = 0;

  function setLoadPhase(label, progress, detail) {
    if (typeof window.__setLoadPhase === 'function') {
      window.__setLoadPhase(label, progress, detail);
    } else if (window.__setStatus) {
      window.__setStatus(label);
    }
  }

  function setPerfStage(stage) {
    if (typeof window.__setPerfStage === 'function') window.__setPerfStage(stage);
    else window.__gameplayStage = stage;
  }

  function whenReady(cb) {
    function check() {
      if (window.__loadState && window.__loadState.scriptsLoaded) cb();
      else setTimeout(check, 80);
    }
    check();
  }

  function bootMenu() {
    if (booted) return;
    booted = true;
    try {
      setPerfStage('menu');
      document.body.classList.remove('game-playing');
      window.__setStatus && window.__setStatus('menu: 初始化账号与存档...');

      const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
      const isProbablyDesktop = !isTouchDevice && window.matchMedia && window.matchMedia('(hover: hover)').matches;
      if (isProbablyDesktop) document.documentElement.classList.add('desktop-mode');

      if (typeof Dialogue !== 'undefined') Dialogue.init();
      if (typeof MapMenu !== 'undefined') MapMenu.init();
      if (typeof CloudAccountSystem !== 'undefined') CloudAccountSystem.init();

      window.__setStatus && window.__setStatus('menu: 完成');
      const bs = document.getElementById('boot-status');
      if (bs) bs.style.display = 'none';

      if (typeof window.__enableStartButton === 'function') window.__enableStartButton();
      window.__bindMenuButtons();
      console.log('=== 轻量菜单初始化完成 ===');
    } catch (e) {
      console.error('★★★ 菜单初始化失败:', e);
      showBootFailure(e);
    }
  }

  function showBootFailure(e) {
    window.__bindMenuButtons = function() {
      const bind = (id, msg) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        const nb = btn.cloneNode(true);
        btn.parentNode.replaceChild(nb, btn);
        nb.disabled = false;
        nb.style.opacity = '1';
        const fire = ev => {
          ev.preventDefault();
          alert('初始化失败: ' + msg + '\n请刷新页面重试');
        };
        nb.addEventListener('touchend', fire, { passive: false });
        nb.addEventListener('click', fire);
      };
      bind('btn-start', e.message || String(e));
      bind('btn-continue', e.message || String(e));
      bind('btn-cloud', e.message || String(e));
      bind('btn-howto', e.message || String(e));
    };
    if (typeof window.__enableStartButton === 'function') window.__enableStartButton();
    window.__bindMenuButtons();
  }

  window.__bindMenuButtons = function() {
    const bind = (id, handler) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.disabled = false;
      newBtn.style.opacity = '1';
      newBtn.style.pointerEvents = 'auto';

      let triggered = false;
      const fire = e => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (triggered) return;
        triggered = true;
        setTimeout(() => { triggered = false; }, 350);
        const result = handler();
        if (result && typeof result.catch === 'function') {
          result.catch(err => {
            console.error('按钮动作失败:', err);
            if (typeof Dialogue !== 'undefined') Dialogue.show('⚠️ ' + (err.message || '操作失败'), 2600);
          });
        }
      };
      newBtn.addEventListener('touchend', fire, { passive: false });
      newBtn.addEventListener('click', fire);
      newBtn.addEventListener('pointerup', e => {
        if (e.pointerType === 'touch') return;
        fire(e);
      });
    };

    bind('btn-start', startGame);
    bind('btn-continue', () => MapMenu.open('load'));
    bind('btn-cloud', () => MapMenu.open('cloud'));
    bind('btn-howto', () => {
      const howto = document.getElementById('howto');
      if (howto) howto.classList.toggle('hidden');
    });
    bind('btn-quality-menu', openQualityFromMenu);
  };

  window.__startGame = function() { return startGame(); };
  window.__ensureStarterRangedKit = ensureStarterRangedKit;
  window.__ensureGameReady = ensureGameReady;

  async function openQualityFromMenu() {
    await ensureRuntimeReady();
    if (typeof QualitySettingsUI !== 'undefined') QualitySettingsUI.open();
  }

  async function ensureRuntimeReady() {
    if (runtimeReady && game) return true;

    setPerfStage('loading-game');
    document.body.classList.remove('game-playing');
    setLoadPhase('准备进入世界…', 6, '检查游戏脚本与云存档状态');
    if (typeof window.__loadGameplayScripts === 'function') {
      await window.__loadGameplayScripts();
    }

    if (typeof THREE === 'undefined') throw new Error('THREE 未加载');
    if (typeof Game === 'undefined') throw new Error('Game 类未加载');

    setLoadPhase('正在创建游戏引擎…', 50, '初始化 WebGL、相机、灯光和输入');
    game = new Game();
    window.game = game;
    game.init();

    setLoadPhase('正在初始化游戏 UI…', 58, 'HUD、背包、地图、图鉴和云存档面板');
    if (typeof Debug !== 'undefined') Debug.init();
    if (typeof HUD !== 'undefined') HUD.init();
    if (typeof Joystick !== 'undefined') Joystick.init();
    if (typeof ActionButtons !== 'undefined') ActionButtons.init();
    if (typeof InventoryUI !== 'undefined') InventoryUI.init();
    if (typeof QuickEquipUI !== 'undefined') QuickEquipUI.init();
    if (typeof Dialogue !== 'undefined') Dialogue.init();
    if (typeof CookingUI !== 'undefined') CookingUI.init();
    if (typeof ShopUI !== 'undefined') ShopUI.init();
    if (typeof QuestUI !== 'undefined') QuestUI.init();
    if (typeof ShrineUI !== 'undefined') ShrineUI.init();
    if (typeof StatueUI !== 'undefined') StatueUI.init();
    if (typeof MapMenu !== 'undefined') MapMenu.init();
    if (typeof CompendiumUI !== 'undefined') CompendiumUI.init();
    if (typeof CloudAccountSystem !== 'undefined') CloudAccountSystem.init();
    if (typeof QuestSystem !== 'undefined') QuestSystem.init();
    if (typeof StorySystem !== 'undefined') StorySystem.init();
    if (typeof ChampionSystem !== 'undefined') ChampionSystem.init();
    if (typeof DivineBeastChallengeSystem !== 'undefined') DivineBeastChallengeSystem.init();
    if (typeof MainQuestSystem !== 'undefined') MainQuestSystem.init();
    if (typeof AudioSystem !== 'undefined') AudioSystem.init();
    if (typeof VisualQualitySystem !== 'undefined') VisualQualitySystem.init(game);
    if (typeof WorldStreamingSystem !== 'undefined') WorldStreamingSystem.init(game);
    if (typeof ArtDirectionSystem !== 'undefined') ArtDirectionSystem.init(game);
    if (typeof QualitySettingsUI !== 'undefined') QualitySettingsUI.init(game);
    if (typeof ModelPolishSystem !== 'undefined') ModelPolishSystem.init(game);
    if (typeof CharacterArtSystem !== 'undefined') CharacterArtSystem.init(game);
    if (typeof WorldPolishSystem !== 'undefined') WorldPolishSystem.init(game);
    if (typeof BillboardPolishSystem !== 'undefined') BillboardPolishSystem.init(game);
    if (typeof AdaptivePerformanceSystem !== 'undefined') AdaptivePerformanceSystem.init(game);
    if (typeof ExplorationSystem !== 'undefined') ExplorationSystem.init(game);
    if (typeof TouchControls !== 'undefined') TouchControls.init();

    registerWorlds();
    setLoadPhase('游戏系统准备完成…', 68, '等待生成当前地图');
    runtimeReady = true;
    if (!gameOverTimer) {
      gameOverTimer = setInterval(() => {
        if (game && game.state === 'dead') showGameOver();
      }, 500);
    }
    window.__bindMenuButtons();
    return true;
  }

  function registerWorlds() {
    if (!game || worldsRegistered) return;
    setLoadPhase('正在注册世界索引…', 64, '草原、森林、雪山、火山、沙漠和城堡');
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

  async function ensureGameReady(worldName = 'grassland') {
    await ensureRuntimeReady();
    if (!game) return false;
    registerWorlds();
    if (!game.currentWorld || game.currentWorld.name !== worldName) {
      setLoadPhase('正在生成地图：' + worldName, 74, '完整地图数据加载，近景资源分层激活');
      game.loadWorld(worldName);
    }
    if (!game.player) {
      setLoadPhase('正在创建角色…', 86, '装备、背包、镜头和初始位置');
      game.createPlayer();
      if (game.player && game.player.inventory && typeof InventoryUI !== 'undefined') {
        game.player.inventory.onChange(() => InventoryUI.refreshIfOpen());
      }
    }
    setLoadPhase('正在准备初始装备…', 91, '旅人剑、木盾、弓箭和苏醒套装');
    setupStarterPlayer();
    playerReady = !!(game.player && game.currentWorld);
    if (game.renderer && game.scene && game.camera) {
      setLoadPhase('正在绘制第一帧…', 96, '确认场景可显示后再进入游戏');
      game.renderer.render(game.scene, game.camera);
    }
    if (playerReady) setLoadPhase('世界已就绪，正在开始冒险…', 100, '远景保持低成本，近景美术随视野补完');
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

  async function startGame() {
    console.log('开始游戏！');
    setPerfStage('loading-game');
    document.body.classList.remove('game-playing');
    setLoadPhase('正在读取开始状态…', 4, '检查云档与目标地图');
    const pendingPreview = SaveSystem.peekPendingCloudCurrent && SaveSystem.peekPendingCloudCurrent();
    const targetWorld = pendingPreview && pendingPreview.worldName || 'grassland';
    if (!await ensureGameReady(targetWorld)) return;
    const pendingCloud = SaveSystem.consumePendingCloudCurrent && SaveSystem.consumePendingCloudCurrent();
    if (pendingCloud) SaveSystem.applyLoad(pendingCloud);
    if (typeof AudioSystem !== 'undefined') AudioSystem.startMusic(game.currentWorld && game.currentWorld.name);
    ensureStarterRangedKit();
    const loading = document.getElementById('loading');
    const menu = document.getElementById('menu');
    if (loading) loading.classList.add('hidden');
    if (menu) menu.classList.add('hidden');
    if (typeof HUD !== 'undefined') HUD.show();
    window.gameStartTime = Date.now();
    setPerfStage('game');
    document.body.classList.add('game-playing');
    game.state = 'playing';
    game.start();
    if (typeof QuestSystem !== 'undefined') QuestSystem.refreshHint();
    if (typeof Dialogue !== 'undefined') {
      Dialogue.show('世界已就绪：远景保持低成本，近景细节会随视野补完。', 2200);
    }
  }

  function showGameOver() {
    const menu = document.getElementById('menu');
    const title = document.getElementById('menu-title');
    const startBtn = document.getElementById('btn-start');
    if (title) title.textContent = '林克倒下了…';
    if (startBtn) startBtn.textContent = '重新开始';
    if (menu) menu.classList.remove('hidden');
    setPerfStage('menu');
    document.body.classList.remove('game-playing');
    if (typeof HUD !== 'undefined') HUD.hide();
  }

  whenReady(bootMenu);
})();
