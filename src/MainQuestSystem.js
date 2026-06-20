/* ========================================================
   MainQuestSystem.js — 主线编排与四神兽任务线
   把“英帕托付 → 四神兽调查 → 神兽终端 → 咒盖侬 → 英杰守护之力”
   串成统一的剧情/任务状态，供 HUD、任务 UI、NPC 与终端复用。
   ======================================================== */

const MAIN_BEAST_STORY = {
  water: {
    element: 'water',
    region: '赫布拉雪山',
    world: 'snowland',
    people: '卓拉与雪泉遗民',
    championTitle: '水之英杰',
    route: '准备防寒装备或暖暖料理，沿冰河找到雪泉回路。',
    powerRole: '生命守护',
    hint: '雪原水雾中有蓝色回忆光，找回米法的声音后启动瓦·鲁塔终端。'
  },
  fire: {
    element: 'fire',
    region: '死亡之山',
    world: 'volcano',
    people: '鼓隆矿工',
    championTitle: '火之英杰',
    route: '准备耐火装备或防火料理，穿过废矿与熔岩坡。',
    powerRole: '坚盾守护',
    hint: '火山山腹的赤色回忆会告诉你达尔克尔为何留下护盾。'
  },
  wind: {
    element: 'wind',
    region: '迷失森林',
    world: 'forest',
    people: '利特斥候与森林守望者',
    championTitle: '风之英杰',
    route: '穿过迷雾森林，点亮鸟望塔，寻找风之神兽的炮台终端。',
    powerRole: '高空守护',
    hint: '强风中的英杰回忆会让瓦·梅德的终端重新响应。'
  },
  thunder: {
    element: 'thunder',
    region: '格鲁德沙漠',
    world: 'desert',
    people: '格鲁德巡逻队',
    championTitle: '雷之英杰',
    route: '准备防热装备或沁凉料理，在沙暴和雷云之间找终端。',
    powerRole: '雷霆守护',
    hint: '雷之英杰回忆藏在沙海电光里，找回它再靠近瓦·娜波力斯。'
  }
};

const MAIN_QUEST_CHAPTERS = [
  { id: 'plateau', title: '苏醒与台地试炼', test: () => QuestSystem.progress.gotGlider },
  { id: 'impa', title: '英帕的托付', test: () => QuestSystem.progress.metImpa },
  { id: 'beasts', title: '解放四大神兽', test: () => MainQuestSystem.liberatedCount() >= 4 },
  { id: 'castle', title: '最终决战', test: () => SaveSystem.isBossDefeated('calamityGanon') }
];

const MainQuestSystem = {
  init() {
    const p = SaveSystem.getProgress();
    if (!p.progress) p.progress = {};
    if (!p.progress.mainQuest) {
      p.progress.mainQuest = {
        impaBriefed: false,
        beastIntel: [],
        guardianPowerIntro: []
      };
    }
    if (!p.progress.mainQuest.beastIntel) p.progress.mainQuest.beastIntel = [];
    if (!p.progress.mainQuest.guardianPowerIntro) p.progress.mainQuest.guardianPowerIntro = [];
    SaveSystem.setProgress(p);
  },

  get state() {
    const p = SaveSystem.getProgress();
    if (!p.progress || !p.progress.mainQuest) {
      this.init();
      return SaveSystem.getProgress().progress.mainQuest;
    }
    return p.progress.mainQuest;
  },

  liberatedCount() {
    const progress = QuestSystem.progress || {};
    return (progress.divineBeasts || []).length;
  },

  getCurrentChapter() {
    for (const ch of MAIN_QUEST_CHAPTERS) {
      if (!ch.test()) return ch;
    }
    return { id: 'peace', title: '海拉鲁的黎明' };
  },

  getHudObjective(q = null) {
    if (SaveSystem.isBossDefeated('calamityGanon')) return '灾厄已退，继续探索未完成的回忆与神庙';
    if (this.liberatedCount() >= 4) return '四神兽已就位，前往海拉鲁城堡';
    if (QuestSystem.progress.metImpa) {
      const focus = this.getFocusedBeast();
      return focus ? `${focus.def.beast}：${focus.stage.label}` : '寻找下一座神兽终端';
    }
    if (QuestSystem.progress.gotGlider) return '前往迷失森林寻找英帕';
    return q ? q.name : '推进初始台地主线';
  },

  getSynopsis() {
    const beastCount = this.liberatedCount();
    const chapter = this.getCurrentChapter();
    if (SaveSystem.isBossDefeated('calamityGanon')) {
      return '灾厄盖侬已经被击败。英杰的守护之力仍在，海拉鲁进入可继续探索的尾声。';
    }
    if (beastCount >= 4) {
      return '四大神兽重新对准王城，英杰守护之力已经集结。现在可以前往海拉鲁城堡完成最终决战。';
    }
    if (QuestSystem.progress.metImpa) {
      const focus = this.getFocusedBeast();
      const focusText = focus ? `当前建议：${focus.def.beast}（${focus.story.region}）— ${focus.stage.detail}` : '四方神兽都在等待调查。';
      return `${chapter.title}：已解放 ${beastCount}/4。${focusText}`;
    }
    if (QuestSystem.progress.gotGlider) {
      return '滑翔伞打开了台地之外的道路。去迷失森林寻找英帕，她会说明四英杰与神兽的真相。';
    }
    return '先完成初始台地试炼：点亮高塔、通过四座神庙、向老人领取滑翔伞。';
  },

  getBeastRows() {
    return Object.keys(MAIN_BEAST_STORY).map(element => this.getBeastState(element));
  },

  getFocusedBeast(worldName = null) {
    const world = worldName || (window.game && window.game.currentWorld && window.game.currentWorld.name);
    const rows = this.getBeastRows();
    const sameWorld = rows.find(r => !r.liberated && r.story.world === world);
    if (sameWorld) return sameWorld;
    return rows.find(r => !r.liberated) || null;
  },

  getBeastState(element) {
    const def = (typeof DIVINE_BEAST_CHALLENGES !== 'undefined') ? DIVINE_BEAST_CHALLENGES[element] : null;
    const champ = (typeof CHAMPION_DEFS !== 'undefined') ? CHAMPION_DEFS[element] : null;
    const story = MAIN_BEAST_STORY[element];
    const liberated = !!(typeof ChampionSystem !== 'undefined' && ChampionSystem.isLiberated(element));
    const trialReady = !!(typeof DivineBeastChallengeSystem !== 'undefined' && DivineBeastChallengeSystem.isTrialComplete(element));
    const tower = def ? SaveSystem.isTowerUnlocked(def.tower) : false;
    const shrine = def ? def.shrineAny.some(id => SaveSystem.isShrineCleared(id)) : false;
    const memory = def && def.memory && typeof StorySystem !== 'undefined' ? StorySystem.hasMemory(def.memory) : false;
    const stage = this._beastStage({ liberated, trialReady, tower, shrine, memory, def, champ, story });
    const missing = [];
    if (!liberated && !tower) missing.push('点亮区域鸟望塔');
    if (!liberated && !shrine) missing.push('完成区域神庙');
    if (!liberated && !memory) missing.push('找回英杰回忆');
    return {
      element, def, champ, story,
      liberated, trialReady, tower, shrine, memory,
      stage,
      missing,
      progress: [tower, shrine, memory, trialReady || liberated, liberated].filter(Boolean).length,
      total: 5
    };
  },

  getGuardianPowerRows() {
    const champions = (QuestSystem.progress && QuestSystem.progress.champions) || [];
    const defs = (typeof CHAMPION_DEFS !== 'undefined') ? CHAMPION_DEFS : {};
    return Object.keys(defs).map(element => {
      const def = defs[element];
      const unlocked = champions.includes(element);
      const remain = typeof ChampionSystem !== 'undefined' ? Math.ceil(ChampionSystem.timers[element] || 0) : 0;
      return {
        element,
        name: def.ability,
        champion: def.champion,
        beast: def.beast,
        desc: def.desc,
        role: MAIN_BEAST_STORY[element] ? MAIN_BEAST_STORY[element].powerRole : '守护之力',
        unlocked,
        ready: unlocked && remain <= 0,
        remain
      };
    });
  },

  getImpaDialogue(firstTalk) {
    const p = SaveSystem.getProgress();
    if (!p.progress) p.progress = {};
    if (!p.progress.mainQuest) this.init();
    p.progress.mainQuest.impaBriefed = true;
    SaveSystem.setProgress(p);
    const beastLines = this.getBeastRows().map(row => `· ${row.def.beast}（${row.story.region}）：${row.story.route}`).join('<br>');
    if (firstTalk) {
      return `【英帕】勇者，你失去的不是力量，而是记忆。<br>百年前四位英杰驾驶神兽守护王国，如今水、火、风、雷四兽都被灾厄夺走。<br>${beastLines}<br><span style="color:#ffe16a">找回英杰回忆、启动神兽终端、击败咒盖侬，你就能获得他们的守护之力。</span>`;
    }
    const focus = this.getFocusedBeast();
    if (focus) {
      return `【英帕】${focus.def.beast}仍在呼唤你。${focus.stage.detail}<br>${focus.story.hint}<br><span style="color:#ffe16a">守护之力不是奖励，而是英杰仍与你并肩作战的证明。</span>`;
    }
    return '【英帕】四位英杰已经回应你。带着他们的守护之力前往海拉鲁城堡，结束百年前未完的战斗。';
  },

  onTerminalActivated(element) {
    const row = this.getBeastState(element);
    if (!row || !row.def) return;
    this._rememberIntel(element);
    if (typeof QuestSystem !== 'undefined') QuestSystem.check();
    if (typeof QuestUI !== 'undefined' && QuestUI.isOpen) QuestUI.render();
  },

  onChampionUnlocked(element) {
    const row = this.getBeastState(element);
    const p = SaveSystem.getProgress();
    if (!p.progress) p.progress = {};
    if (!p.progress.mainQuest) this.init();
    const intro = p.progress.mainQuest.guardianPowerIntro || [];
    if (!intro.includes(element)) intro.push(element);
    p.progress.mainQuest.guardianPowerIntro = intro;
    SaveSystem.setProgress(p);
    if (typeof QuestSystem !== 'undefined') QuestSystem.check();
    if (typeof QuestUI !== 'undefined' && QuestUI.isOpen) QuestUI.render();
    return row && row.champ
      ? `【${row.champ.ability}】${row.champ.champion}的${row.story.powerRole}与你相连：${row.champ.desc}<br><span style="color:#ffe16a">英杰之力已加入 HUD，冷却结束后会自动或按条件触发。</span>`
      : '';
  },

  getTerminalMissingText(element) {
    const row = this.getBeastState(element);
    if (!row) return '';
    const steps = [
      ['鸟望塔', row.tower, `点亮${row.story.region}鸟望塔`],
      ['神庙试炼', row.shrine, '完成本区域至少一座神庙'],
      ['英杰回忆', row.memory, `找回${row.story.championTitle}回忆`]
    ];
    return steps.map(([name, done, text]) => `${done ? '✓' : '·'} ${name}：${done ? '完成' : text}`).join('<br>');
  },

  _beastStage(ctx) {
    if (ctx.liberated) {
      return { key: 'liberated', label: '已解放', detail: `${ctx.champ.ability}已成为你的${ctx.story.powerRole}。` };
    }
    if (ctx.trialReady) {
      return { key: 'boss', label: '挑战咒盖侬', detail: `${ctx.def.boss}已显形，前往神兽核心完成解放。` };
    }
    if (!ctx.tower) {
      return { key: 'tower', label: '点亮鸟望塔', detail: `先点亮${ctx.story.region}鸟望塔，确认神兽所在。` };
    }
    if (!ctx.shrine) {
      return { key: 'shrine', label: '完成区域神庙', detail: `通过${ctx.story.region}的神庙试炼，让希卡石板同步神兽回路。` };
    }
    if (!ctx.memory) {
      return { key: 'memory', label: '找回英杰回忆', detail: ctx.story.hint };
    }
    return { key: 'terminal', label: '启动神兽终端', detail: `前往${ctx.def.beast}终端，解除${ctx.def.title}封锁。` };
  },

  _rememberIntel(element) {
    const p = SaveSystem.getProgress();
    if (!p.progress) p.progress = {};
    if (!p.progress.mainQuest) this.init();
    const intel = p.progress.mainQuest.beastIntel || [];
    if (!intel.includes(element)) intel.push(element);
    p.progress.mainQuest.beastIntel = intel;
    SaveSystem.setProgress(p);
  }
};

if (typeof window !== 'undefined') window.MainQuestSystem = MainQuestSystem;
