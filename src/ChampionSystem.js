/* ========================================================
   ChampionSystem.js — 四神兽与英杰能力
   - 水：米法之赐，倒下时自动复活
   - 火：达尔克尔之护，受强击时自动护盾
   - 风：力巴尔之猛，空中二段上升气流
   - 雷：乌尔波扎之怒，近战命中释放范围雷击
   ======================================================== */

const CHAMPION_DEFS = {
  water: {
    beast: '瓦·鲁塔',
    bossId: 'waterblightGanon',
    bossName: '水咒盖侬',
    champion: '米法',
    ability: '米法之赐',
    desc: '倒下时自动复活并回满生命。',
    cooldown: 300
  },
  fire: {
    beast: '瓦·鲁达尼亚',
    bossId: 'fireblightGanon',
    bossName: '火咒盖侬',
    champion: '达尔克尔',
    ability: '达尔克尔之护',
    desc: '受强击时自动展开护盾，减免大量伤害。',
    cooldown: 45
  },
  wind: {
    beast: '瓦·梅德',
    bossId: 'windblightGanon',
    bossName: '风咒盖侬',
    champion: '力巴尔',
    ability: '力巴尔之猛',
    desc: '空中按跳跃键可产生上升气流。',
    cooldown: 35
  },
  thunder: {
    beast: '瓦·娜波力斯',
    bossId: 'thunderblightGanon',
    bossName: '雷咒盖侬',
    champion: '乌尔波扎',
    ability: '乌尔波扎之怒',
    desc: '近战命中时释放范围雷击。',
    cooldown: 50
  }
};

const ChampionSystem = {
  timers: {},

  init() {
    const p = SaveSystem.getProgress();
    if (!p.progress) p.progress = {};
    if (!p.progress.divineBeasts) p.progress.divineBeasts = [];
    if (!p.progress.champions) p.progress.champions = [];
    if (!p.championCooldowns) p.championCooldowns = {};
    SaveSystem.setProgress(p);
    this.timers = Object.assign({}, p.championCooldowns || {});
  },

  tick(dt) {
    let dirty = false;
    for (const key in this.timers) {
      if (this.timers[key] > 0) {
        this.timers[key] = Math.max(0, this.timers[key] - dt);
        dirty = true;
      }
    }
    if (dirty) this._persistTimers();
  },

  unlock(element) {
    const def = CHAMPION_DEFS[element];
    if (!def) return false;
    const p = SaveSystem.getProgress();
    if (!p.progress) p.progress = {};
    if (!p.progress.divineBeasts) p.progress.divineBeasts = [];
    if (!p.progress.champions) p.progress.champions = [];
    if (!p.bosses) p.bosses = [];
    let changed = false;
    if (!p.progress.divineBeasts.includes(element)) {
      p.progress.divineBeasts.push(element);
      changed = true;
    }
    if (!p.progress.champions.includes(element)) {
      p.progress.champions.push(element);
      changed = true;
    }
    if (!p.bosses.includes(def.bossId)) {
      p.bosses.push(def.bossId);
      changed = true;
    }
    if (changed) {
      SaveSystem.setProgress(p);
      if (typeof StorySystem !== 'undefined') StorySystem.markEvent(`liberated_${element}`);
      Dialogue.show(`解放神兽 ${def.beast}！${def.champion}的意志回应了你，获得 ${def.ability}`);
      if (window.game && window.game.currentWorld && window.game.currentWorld.divineBeast) {
        this.setBeastLiberated(window.game.currentWorld.divineBeast, true);
      }
      if (typeof Effects !== 'undefined' && window.game && window.game.player) {
        Effects.pickupFlash(window.game.player.position);
      }
      QuestSystem.refreshHint();
    }
    return changed;
  },

  has(element) {
    const progress = QuestSystem.progress;
    return !!(progress.champions && progress.champions.includes(element));
  },

  isLiberated(element) {
    const progress = QuestSystem.progress;
    return !!(progress.divineBeasts && progress.divineBeasts.includes(element));
  },

  addDivineBeast(world, element, x, z, color) {
    if (!world || !world.scene || !AssetFactory.createDivineBeast) return null;
    const beast = AssetFactory.createDivineBeast(color || 0x88aacc);
    beast.position.set(x, 0, z);
    beast.scale.setScalar(0.75);
    beast.userData.divineElement = element;
    world.scene.add(beast);
    this.setBeastLiberated(beast, this.isLiberated(element));
    return beast;
  },

  setBeastLiberated(beast, liberated) {
    if (!beast) return;
    beast.userData.liberated = !!liberated;
    const glow = liberated ? 0xffd54f : 0x9922cc;
    const tint = new THREE.Color(liberated ? 0xffffff : 0x4a254f);
    beast.traverse(c => {
      if (!c.material) return;
      if (c.material.emissive) {
        c.material.emissive.setHex(glow);
        c.material.emissiveIntensity = liberated ? 0.25 : 0.35;
      }
      if (c.material.color && !liberated) c.material.color.lerp(tint, 0.35);
    });
    const core = beast.userData.parts && beast.userData.parts.core;
    if (core && core.material && core.material.color) core.material.color.setHex(glow);
  },

  ready(element) {
    return this.has(element) && !(this.timers[element] > 0);
  },

  use(element) {
    const def = CHAMPION_DEFS[element];
    if (!def || !this.ready(element)) return false;
    this.timers[element] = def.cooldown;
    this._persistTimers();
    return true;
  },

  revive(player) {
    if (!this.use('water')) return false;
    player.hp = player.maxHp * 4;
    player.invuln = 2.5;
    player._burnTimer = 0;
    player._slowTimer = 0;
    player._stunTimer = 0;
    Dialogue.show('【米法之赐】你还不能倒下。生命恢复了！');
    if (typeof Effects !== 'undefined') {
      Effects.pickupFlash(player.position);
      Effects.elementalAura(player.position.clone().setY(1.4), 0x66ddff);
    }
    return true;
  },

  guard(player, amount) {
    if (!this.use('fire')) return null;
    const reduced = Math.max(0, amount * 0.18);
    player.invuln = Math.max(player.invuln, 0.7);
    Dialogue.showFloat('达尔克尔之护！', player.position.clone().setY(2.4), '#ff8844');
    if (typeof Effects !== 'undefined') {
      Effects.parrySpark(player.position.clone().setY(1.2));
      Effects.elementalAura(player.position.clone().setY(1.4), 0xff8844);
    }
    return reduced;
  },

  updraft(player) {
    if (!this.use('wind')) return false;
    player.vy = Math.max(player.vy, 15);
    player.onGround = false;
    player.stamina = Math.min(player.maxStamina, player.stamina + 25);
    Dialogue.showFloat('力巴尔之猛！', player.position.clone().setY(2.4), '#9ee8ff');
    if (typeof Effects !== 'undefined') {
      Effects.elementalAura(player.position.clone().setY(1.4), 0x9ee8ff);
      Effects.hitBurst(player.position.clone().setY(0.4), 0x9ee8ff, 16);
    }
    return true;
  },

  thunderBurst(player, game, origin) {
    if (!this.use('thunder')) return false;
    const center = origin ? origin.clone() : player.position.clone();
    Dialogue.showFloat('乌尔波扎之怒！', center.clone().setY(2.6), '#ffe16a');
    if (typeof Effects !== 'undefined') {
      Effects.elementalAura(center.clone().setY(1.5), 0xffee44);
      Effects.hitBurst(center.clone().setY(1.2), 0xffee44, 24);
    }
    for (const enemy of game.currentWorld.enemies) {
      if (enemy.dead) continue;
      const dist = enemy.mesh.position.distanceTo(center);
      if (dist <= 5.5) {
        const dir = new THREE.Vector3().subVectors(enemy.mesh.position, player.position).setY(0);
        if (dir.lengthSq() < 0.01) dir.set(0, 0, 1);
        enemy.takeDamage(18, dir.normalize().multiplyScalar(2.5), 'shock');
      }
    }
    return true;
  },

  _persistTimers() {
    const p = SaveSystem.getProgress();
    p.championCooldowns = Object.assign({}, this.timers);
    SaveSystem.setProgress(p);
  }
};
