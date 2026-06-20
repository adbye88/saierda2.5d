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
    emotionalHook: '米法留下的不是悲伤，而是“哪怕迟到百年，也要把生命交还给勇者”的温柔誓言。',
    prep: ['防寒料理/雪羽装备', '至少一把远程弓', '恢复料理 3 份以上'],
    weakness: '水咒盖侬蓄力时露出核心，弓箭打断后近身输出；冰属性区域注意保持体力。',
    powerRole: '生命守护',
    reward: '米法之赐：倒下时自动复活并回满生命。',
    hint: '雪原水雾中有蓝色回忆光，找回米法的声音后启动瓦·鲁塔终端。'
  },
  fire: {
    element: 'fire',
    region: '死亡之山',
    world: 'volcano',
    people: '鼓隆矿工',
    championTitle: '火之英杰',
    route: '准备耐火装备或防火料理，穿过废矿与熔岩坡。',
    emotionalHook: '达尔克尔的笑声藏在山腹里。他留下的盾，是替朋友扛下第一击的豪迈承诺。',
    prep: ['耐火装备/防火料理', '火打石和木材补给', '高耐久盾牌'],
    weakness: '火咒盖侬重击前摇明显，举盾等破绽；火山区域先处理环境灼烧压力。',
    powerRole: '坚盾守护',
    reward: '达尔克尔之护：受强击时自动展开护盾，减免大量伤害。',
    hint: '火山山腹的赤色回忆会告诉你达尔克尔为何留下护盾。'
  },
  wind: {
    element: 'wind',
    region: '迷失森林',
    world: 'forest',
    people: '利特斥候与森林守望者',
    championTitle: '风之英杰',
    route: '穿过迷雾森林，点亮鸟望塔，寻找风之神兽的炮台终端。',
    emotionalHook: '力巴尔的骄傲不是嘲笑，而是希望勇者再次站到足够高的天空。',
    prep: ['足够箭矢', '轻型武器', '体力料理或毅力蘑菇'],
    weakness: '风咒盖侬会拉开距离，利用弓箭和移动打断；高处滑翔能更快接近核心。',
    powerRole: '高空守护',
    reward: '力巴尔之猛：空中按跳跃键产生上升气流。',
    hint: '强风中的英杰回忆会让瓦·梅德的终端重新响应。'
  },
  thunder: {
    element: 'thunder',
    region: '格鲁德沙漠',
    world: 'desert',
    people: '格鲁德巡逻队',
    championTitle: '雷之英杰',
    route: '准备防热装备或沁凉料理，在沙暴和雷云之间找终端。',
    emotionalHook: '乌尔波扎留下的雷霆，是女王对公主与勇者共同背负命运的回应。',
    prep: ['防热料理/沙漠装备', '金属盾备用', '足够回血和弓箭'],
    weakness: '雷咒盖侬速度快，别贪刀；观察突进节奏，盾反或横移后打短连击。',
    powerRole: '雷霆守护',
    reward: '乌尔波扎之怒：近战命中时释放范围雷击。',
    hint: '雷之英杰回忆藏在沙海电光里，找回它再靠近瓦·娜波力斯。'
  }
};

const MAIN_QUEST_CHAPTERS = [
  { id: 'plateau', title: '苏醒与台地试炼', test: () => QuestSystem.progress.gotGlider },
  { id: 'impa', title: '英帕的托付', test: () => QuestSystem.progress.metImpa },
  { id: 'beasts', title: '解放四大神兽', test: () => MainQuestSystem.liberatedCount() >= 4 },
  { id: 'castle', title: '最终决战', test: () => SaveSystem.isBossDefeated('calamityGanon') }
];

const MAIN_STORY_ACTS = [
  {
    id: 'awakening',
    title: '序章：苏醒的蓝光',
    theme: '从空白中重新学会成为勇者。',
    goal: '见到老人、点亮起始台地高塔、完成四座神庙。',
    check: () => QuestSystem.progress.gotGlider,
    next: '拿到滑翔伞，离开台地。'
  },
  {
    id: 'truth',
    title: '第一章：百年前的真相',
    theme: '林克不是在寻找力量，而是在找回自己为什么战斗。',
    goal: '前往迷失森林见英帕，解锁四英杰与神兽主线。',
    check: () => QuestSystem.progress.metImpa,
    next: '寻找第一段回忆，确认神兽路线。'
  },
  {
    id: 'memories',
    title: '第二章：散落的回忆',
    theme: '每一段回忆都把世界从“地图”变回“故乡”。',
    goal: '调查发光回忆点，理解四英杰、王国军与公主的过去。',
    check: () => (typeof StorySystem !== 'undefined' && StorySystem.recoveredCount() >= 3) || MainQuestSystem.liberatedCount() >= 1,
    next: '选择一座神兽，完成区域准备。'
  },
  {
    id: 'beasts',
    title: '第三章：四大神兽的回响',
    theme: '水、火、风、雷不是副本清单，而是四位英杰重新归队。',
    goal: '点亮区域塔、完成神庙同步、找回英杰回忆、启动神兽终端。',
    check: () => MainQuestSystem.liberatedCount() >= 4,
    next: '四神兽对准王城，准备最终决战。'
  },
  {
    id: 'sword',
    title: '第四章：决战前夜',
    theme: '是否拔出大师之剑、是否找完回忆，决定这场决战有多少重量。',
    goal: '准备装备、料理、回忆与大师之剑，然后进入海拉鲁城堡。',
    check: () => SaveSystem.isBossDefeated('calamityGanon'),
    next: '击败灾厄盖侬。'
  },
  {
    id: 'dawn',
    title: '终章：海拉鲁的黎明',
    theme: '灾厄退去后，探索仍然继续。',
    goal: '继续收集回忆、宝箱、图鉴与装备。',
    check: () => true,
    next: '自由探索。'
  }
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

  getCurrentStoryAct() {
    for (const act of MAIN_STORY_ACTS) {
      if (!act.check()) return act;
    }
    return MAIN_STORY_ACTS[MAIN_STORY_ACTS.length - 1];
  },

  getStoryActRows() {
    const current = this.getCurrentStoryAct();
    let reachedCurrent = false;
    return MAIN_STORY_ACTS.map(act => {
      const complete = act.check() && act.id !== 'dawn';
      const active = act.id === current.id;
      if (active) reachedCurrent = true;
      return {
        id: act.id,
        title: act.title,
        theme: act.theme,
        goal: act.goal,
        next: act.next,
        complete,
        active,
        locked: !complete && !active && reachedCurrent
      };
    });
  },

  getStoryRoadmap() {
    const act = this.getCurrentStoryAct();
    const focus = this.getFocusedBeast();
    const focusLine = focus && focus.def && QuestSystem.progress.metImpa
      ? `当前神兽线：${focus.def.beast} / ${focus.story.championTitle}。${focus.stage.detail}`
      : act.next;
    return {
      title: act.title,
      theme: act.theme,
      goal: act.goal,
      next: focusLine
    };
  },

  getHudObjective(q = null) {
    if (SaveSystem.isBossDefeated('calamityGanon')) return '灾厄已退，继续探索未完成的回忆与神庙';
    if (this.liberatedCount() >= 4) return '四神兽已就位，前往海拉鲁城堡';
    if (QuestSystem.progress.metImpa) {
      const focus = this.getFocusedBeast();
      return focus && focus.def ? `${focus.def.beast}：${focus.stage.label}` : '寻找下一座神兽终端';
    }
    if (QuestSystem.progress.gotGlider) return '前往迷失森林寻找英帕';
    return q ? q.name : '推进初始台地主线';
  },

  getSynopsis() {
    const beastCount = this.liberatedCount();
    const chapter = this.getCurrentChapter();
    const roadmap = this.getStoryRoadmap();
    if (SaveSystem.isBossDefeated('calamityGanon')) {
      return `${roadmap.title}：灾厄盖侬已经被击败。英杰的守护之力仍在，海拉鲁进入可继续探索的尾声。`;
    }
    if (beastCount >= 4) {
      return `${roadmap.title}：四大神兽重新对准王城，英杰守护之力已经集结。现在可以前往海拉鲁城堡完成最终决战。`;
    }
    if (QuestSystem.progress.metImpa) {
      const focus = this.getFocusedBeast();
      const focusText = focus && focus.def ? `当前建议：${focus.def.beast}（${focus.story.region}）— ${focus.stage.detail}` : '四方神兽都在等待调查。';
      return `${chapter.title} / ${roadmap.title}：已解放 ${beastCount}/4。${focusText}`;
    }
    if (QuestSystem.progress.gotGlider) {
      return `${roadmap.title}：滑翔伞打开了台地之外的道路。去迷失森林寻找英帕，她会说明四英杰与神兽的真相。`;
    }
    return `${roadmap.title}：先完成初始台地试炼：点亮高塔、通过四座神庙、向老人领取滑翔伞。`;
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

  getBeastAdvice(element) {
    const row = this.getBeastState(element);
    if (!row || !row.story) return [];
    return [
      `剧情动机：${row.story.emotionalHook}`,
      `准备：${row.story.prep.join('、')}`,
      `战斗提示：${row.story.weakness}`,
      `解放奖励：${row.story.reward}`
    ];
  },

  getImpaDialogue(firstTalk) {
    const p = SaveSystem.getProgress();
    if (!p.progress) p.progress = {};
    if (!p.progress.mainQuest) this.init();
    p.progress.mainQuest.impaBriefed = true;
    SaveSystem.setProgress(p);
    const beastLines = this.getBeastRows().map(row => `· ${row.def.beast}（${row.story.region}）：${row.story.route}<br><span style="opacity:.78">${row.story.emotionalHook}</span>`).join('<br>');
    if (firstTalk) {
      return `【英帕】勇者，你失去的不是力量，而是“为什么还要站起来”的答案。<br>百年前四位英杰驾驶神兽守护王国，如今水、火、风、雷四兽都被灾厄夺走。<br>${beastLines}<br><span style="color:#ffe16a">找回英杰回忆、启动神兽终端、击败咒盖侬，你就能获得他们的守护之力。</span>`;
    }
    const focus = this.getFocusedBeast();
    if (focus && focus.def) {
      return `【英帕】${focus.def.beast}仍在呼唤你。${focus.stage.detail}<br>${focus.story.hint}<br>${focus.story.emotionalHook}<br><span style="color:#ffe16a">守护之力不是奖励，而是英杰仍与你并肩作战的证明。</span>`;
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
    const advice = this.getBeastAdvice(element).map(x => `· ${x}`).join('<br>');
    return steps.map(([name, done, text]) => `${done ? '✓' : '·'} ${name}：${done ? '完成' : text}`).join('<br>') + `<br>${advice}`;
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
