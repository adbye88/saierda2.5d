/* ========================================================
   DivineBeastChallengeSystem.js — 四大神兽区域挑战
   每只神兽都有“点塔 → 通过区域神庙 → 找回英杰回忆 → 启动终端”
   的解锁链，终端完成后才开放对应咒盖侬战。
   ======================================================== */

const DIVINE_BEAST_CHALLENGES = {
  water: {
    element: 'water',
    beast: '瓦·鲁塔',
    boss: '水咒盖侬',
    tower: 'snowland',
    color: 0x66ddff,
    shrineAny: ['shrineSnow', 'shrineSnowPeak', 'shrineSnowCave', 'shrineFrozenLake'],
    memory: 'waterChampion',
    title: '雪泉回路',
    readyText: '水之神兽核心回路已重新接通，冰雾中的水咒盖侬现身了。'
  },
  fire: {
    element: 'fire',
    beast: '瓦·鲁达尼亚',
    boss: '火咒盖侬',
    tower: 'volcano',
    color: 0xff6633,
    shrineAny: ['shrineVolcano', 'shrineVolcanoCrater', 'shrineVolcanoMine', 'shrineMagmaVault'],
    memory: 'fireChampion',
    title: '熔岩装甲',
    readyText: '火之神兽装甲解除封锁，火咒盖侬在山腹深处苏醒了。'
  },
  wind: {
    element: 'wind',
    beast: '瓦·梅德',
    boss: '风咒盖侬',
    tower: 'forest',
    color: 0x99e8ff,
    shrineAny: ['shrineForestKorok', 'shrineForestMist', 'shrineAncientGrove'],
    memory: 'windChampion',
    title: '高空炮台',
    readyText: '风之神兽的炮台重新校准，风咒盖侬被迫现身。'
  },
  thunder: {
    element: 'thunder',
    beast: '瓦·娜波力斯',
    boss: '雷咒盖侬',
    tower: 'desert',
    color: 0xffee44,
    shrineAny: ['shrineDesert', 'shrineDesertOasis', 'shrineDesertStorm', 'shrineSunkenDunes'],
    memory: 'thunderChampion',
    title: '雷鸣矩阵',
    readyText: '雷之神兽的雷鸣矩阵启动，雷咒盖侬的高速影子逼近了。'
  }
};

const DivineBeastChallengeSystem = {
  init() {
    const p = SaveSystem.getProgress();
    if (!p.progress) p.progress = {};
    if (!p.progress.beastTrials) p.progress.beastTrials = [];
    SaveSystem.setProgress(p);
  },

  isTrialComplete(element) {
    const progress = QuestSystem.progress || {};
    return !!(progress.beastTrials && progress.beastTrials.includes(element));
  },

  status(element) {
    const def = DIVINE_BEAST_CHALLENGES[element];
    const missing = [];
    if (!def) return { ok: false, missing: ['未知神兽挑战'] };
    if (ChampionSystem.isLiberated(element)) return { ok: true, liberated: true, missing: [] };
    if (!SaveSystem.isTowerUnlocked(def.tower)) missing.push('激活本区域鸟望塔');
    if (!def.shrineAny.some(id => SaveSystem.isShrineCleared(id))) missing.push('完成本区域至少一座神庙试炼');
    if (def.memory && typeof StorySystem !== 'undefined' && !StorySystem.hasMemory(def.memory)) missing.push('找回对应英杰回忆');
    return { ok: missing.length === 0, missing };
  },

  completeTrial(element) {
    const def = DIVINE_BEAST_CHALLENGES[element];
    if (!def) return false;
    const p = SaveSystem.getProgress();
    if (!p.progress) p.progress = {};
    if (!p.progress.beastTrials) p.progress.beastTrials = [];
    if (p.progress.beastTrials.includes(element)) return false;
    p.progress.beastTrials.push(element);
    SaveSystem.setProgress(p);
    if (typeof StorySystem !== 'undefined') StorySystem.markEvent(`beast_trial_${element}`);
    return true;
  },

  canFight(element, quiet = false) {
    const def = DIVINE_BEAST_CHALLENGES[element];
    if (!def) return true;
    if (ChampionSystem.isLiberated(element) || this.isTrialComplete(element)) return true;
    if (!quiet) {
      Dialogue.show(`先启动 ${def.beast} 的神兽终端，再挑战${def.boss}。`);
      HUD.setQuest(`启动神兽终端：${def.beast}`, def.color);
    }
    return false;
  },

  attachTerminal(world, element, x, z) {
    const def = DIVINE_BEAST_CHALLENGES[element];
    if (!world || !def) return null;
    const terminal = this._createTerminal(def.color);
    terminal.position.set(x, 0, z);
    terminal.userData.npc = true;
    terminal.userData.name = `${def.beast}终端`;
    terminal.userData.onTalk = () => this._talk(def, terminal);
    world.scene.add(terminal);
    world.npcs.push({ mesh: terminal });
    if (!world.divineBeastTerminals) world.divineBeastTerminals = [];
    world.divineBeastTerminals.push(terminal);
    this._setTerminalState(terminal, ChampionSystem.isLiberated(element) || this.isTrialComplete(element), def.color);
    return terminal;
  },

  _talk(def, terminal) {
    if (ChampionSystem.isLiberated(def.element)) {
      Dialogue.show(`【${def.beast}】神兽已经解放，英杰之力正守护着你。`);
      return;
    }
    if (this.isTrialComplete(def.element)) {
      Dialogue.show(`【${def.beast}】${def.boss} 已经显形，前往神兽核心完成战斗。`);
      HUD.setQuest(`击败${def.boss}，解放${def.beast}`, def.color);
      return;
    }
    const status = this.status(def.element);
    if (!status.ok) {
      const progressText = (typeof MainQuestSystem !== 'undefined') ? MainQuestSystem.getTerminalMissingText(def.element) : status.missing.map(x => '· ' + x).join('<br>');
      Dialogue.show(`【${def.beast}终端】${def.title}尚未稳定：<br>${progressText}`, 5600);
      HUD.setQuest(`准备神兽挑战：${def.beast}`, def.color);
      return;
    }
    this.completeTrial(def.element);
    this._setTerminalState(terminal, true, def.color);
    if (typeof MainQuestSystem !== 'undefined') MainQuestSystem.onTerminalActivated(def.element);
    Dialogue.show(`【${def.beast}终端】${def.readyText}`, 5200);
    HUD.setQuest(`击败${def.boss}，解放${def.beast}`, def.color);
    if (window.game && window.game.player && typeof Effects !== 'undefined') {
      Effects.portalEffect(window.game.player.position);
      Effects.elementalAura(window.game.player.position.clone().setY(1.5), def.color);
    }
    if (typeof QuestUI !== 'undefined' && QuestUI.isOpen) QuestUI.render();
  },

  _createTerminal(color) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 1.25, 0.45, 8),
      new THREE.MeshStandardMaterial({ color: 0x36413f, roughness: 0.75, metalness: 0.15 })
    );
    base.position.y = 0.22;
    g.add(base);
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.36, 1.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x8bb7aa, transparent: true, opacity: 0.62, roughness: 0.2 })
    );
    pillar.position.y = 1.05;
    g.add(pillar);
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.34, 0),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, roughness: 0.25 })
    );
    core.position.y = 1.85;
    core.userData.spin = true;
    g.add(core);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.7, 0.04, 8, 24),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55 })
    );
    ring.position.y = 1.48;
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    g.userData.parts = { core, ring };
    return g;
  },

  _setTerminalState(terminal, ready, color) {
    terminal.userData.ready = !!ready;
    const parts = terminal.userData.parts || {};
    if (parts.core && parts.core.material) {
      parts.core.material.emissiveIntensity = ready ? 0.8 : 0.25;
      parts.core.material.color.setHex(ready ? color : 0x6b7f78);
    }
    if (parts.ring && parts.ring.material) {
      parts.ring.material.opacity = ready ? 0.82 : 0.35;
    }
  }
};
