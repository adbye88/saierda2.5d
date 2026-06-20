/* ========================================================
   QuestSystem.js — 主线剧情系统
   开放世界冒险式主线流程：
     1. 唤醒（初始台地·老爷爷）
     2. 解锁第一座远古塔（希卡石板）
     3. 完成 4 座神庙，获得滑翔伞（克服之玉）
     4. 离开初始台地，前往卡卡利科村
     5. 找回关键回忆，理解百年前的败局
     6. 解锁 4 大区域，攻略 4 神兽（水/火/风/雷）
     7. 准备最终决战，前往海拉鲁城堡击败灾厄
   ======================================================== */

const QUESTS = {
  awakening: {
    id: 'awakening', name: '在初始台地苏醒', chapter: 0,
    desc: '顺着营火烟和小屋方向找老人。他会告诉你为什么台地上的远古机关重新亮起。',
    complete: (g) => g.progress.talkedOldMan >= 1,
    next: 'firstTower'
  },
  firstTower: {
    id: 'firstTower', name: '远古塔的觉醒', chapter: 1,
    desc: '寻找最高的蓝色古塔。登上高处能看见它的光，也能发现附近神庙与滑翔路线。',
    complete: (g) => SaveSystem.isTowerUnlocked('grassland'),
    next: 'fourShrines'
  },
  fourShrines: {
    id: 'fourShrines', name: '挑战四座神庙', chapter: 1,
    desc: '从塔顶观察台地四周：河湾、雪坡、废墟与北岭各藏着试炼。别只看路，留意发光石门。',
    complete: (g) => (g.progress.shrinesCleared || 0) >= 4,
    next: 'glider'
  },
  glider: {
    id: 'glider', name: '获得滑翔伞', chapter: 1,
    desc: '带着4个克服之玉回到老人常出现的营火与女神像附近。滑翔伞会把高处变成道路。',
    complete: (g) => g.progress.gotGlider === true,
    next: 'kakariko'
  },
  kakariko: {
    id: 'kakariko', name: '前往卡卡利科村', chapter: 2,
    desc: '沿着森林入口的古道前进，寻找会讲述百年前真相的人。路上的塔能帮你确认方向。',
    complete: (g) => g.progress.metImpa === true,
    next: 'memoryEchoes'
  },
  memoryEchoes: {
    id: 'memoryEchoes', name: '找回失落的回忆', chapter: 2,
    desc: '石板影像里有地貌线索：断桥、湖畔、古树、王城阴影。靠近发光回忆点调查。',
    complete: (g) => g.getMemoryCount() >= 1 || ((g.progress.divineBeasts || []).length > 0),
    next: 'freeDivineBeasts'
  },
  freeDivineBeasts: {
    id: 'freeDivineBeasts', name: '解放四大神兽', chapter: 2,
    desc: '四方异象指向神兽：雪原水雾、火山赤光、森林强风、沙漠雷云。先点塔、通神庙，再启动终端。',
    complete: (g) => ['water','fire','wind','thunder'].every(e => g.progress.divineBeasts && g.progress.divineBeasts.includes(e)),
    next: 'prepareFinal'
  },
  prepareFinal: {
    id: 'prepareFinal', name: '决战前的准备', chapter: 3,
    desc: '王城在等你，但森林深处的剑、各地回忆和隐藏宝箱会让这场决战更像选择，而不是数值门槛。',
    complete: (g) => g.hasItem('masterSword') || g.getMemoryCount() >= 4 || SaveSystem.isBossDefeated('calamityGanon'),
    next: 'finalGanon'
  },
  finalGanon: {
    id: 'finalGanon', name: '最终决战', chapter: 3,
    desc: '从任何方向接近海拉鲁城堡。守护者激光可盾反，残墙可攀爬，高处滑翔能避开正门火力。',
    complete: (g) => SaveSystem.isBossDefeated('calamityGanon'),
    next: null
  }
};

const QuestSystem = {
  // 全局进度（存档），通过 SaveSystem 持久化
  init() {
    const p = SaveSystem.getProgress();
    if (!p.progress) {
      p.progress = {
        talkedOldMan: 0, shrinesCleared: 0, gotGlider: false,
        metImpa: false, divineBeasts: [], champions: []
      };
      SaveSystem.setProgress(p);
    }
    if (p.shrines && p.progress && (p.progress.shrinesCleared || 0) < p.shrines.length) {
      p.progress.shrinesCleared = p.shrines.length;
      SaveSystem.setProgress(p);
    }
  },
  get progress() {
    const p = SaveSystem.getProgress();
    if (!p.progress) {
      this.init();
      return SaveSystem.getProgress().progress;
    }
    return p.progress;
  },
  set(key, val) {
    const p = SaveSystem.getProgress();
    if (!p.progress) p.progress = {};
    p.progress[key] = val;
    SaveSystem.setProgress(p);
  },
  add(key, val) {
    const p = SaveSystem.getProgress();
    if (!p.progress) p.progress = {};
    if (!p.progress[key]) p.progress[key] = [];
    if (!p.progress[key].includes(val)) p.progress[key].push(val);
    SaveSystem.setProgress(p);
  },

  getMemoryCount() {
    return (typeof StorySystem !== 'undefined') ? StorySystem.recoveredCount() : 0;
  },

  hasItem(itemId) {
    const game = window.game;
    return !!(game && game.player && game.player.inventory && game.player.inventory.countOf(itemId) > 0);
  },

  // 当前活跃任务
  getCurrentQuest() {
    const game = window.game;
    for (const id in QUESTS) {
      const q = QUESTS[id];
      if (!q.complete(this)) return q;
    }
    return null;
  },

  // 已完成任务数
  getCompletedCount() {
    let n = 0;
    for (const id in QUESTS) {
      if (QUESTS[id].complete(this)) n++;
    }
    return n;
  },

  // 更新任务提示
  refreshHint() {
    const q = this.getCurrentQuest();
    if (q && HUD) {
      HUD.setQuest(`【第${q.chapter}章】${q.name}`);
    }
  },

  // 检查任务推进
  check() {
    const q = this.getCurrentQuest();
    if (!q) return;
    // 完成时弹出
    if (q.complete(this)) {
      Dialogue.show(`✓ 任务完成：${q.name}`);
      Effects.pickupFlash(window.game.player.position);
      // 滑翔伞解锁
      if (q.id === 'fourShrines' && !this.progress.gotGlider) {
        // 让老爷爷在下次对话给滑翔伞
        this._pendingGlider = true;
      }
      this.refreshHint();
    }
  }
};
