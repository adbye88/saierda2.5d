/* ========================================================
   StorySystem.js — 章节剧情、回忆碎片与地区线索
   开放世界叙事：主线清晰，回忆可探索收集，不强制打断玩家节奏。
   ======================================================== */

const STORY_MEMORIES = {
  plateauAwakening: {
    title: '苏醒前的蓝光',
    chapter: '破碎回声',
    world: 'grassland',
    text: '石板里闪过一座被黑云包围的王城。有人把最后的希望交给沉睡的勇者：醒来后，先点亮高塔，再找回失去的记忆。'
  },
  towerVow: {
    title: '高塔上的誓言',
    chapter: '远古地图',
    world: 'grassland',
    text: '第一座高塔升起时，远古地图重新铺开。四方巨兽曾是守护王国的武器，如今却被灾厄夺走。'
  },
  impaCharge: {
    title: '守望者的托付',
    chapter: '英杰之名',
    world: 'forest',
    text: '年迈的守望者讲述百年前的败局：四位英杰各自奔赴水、火、风、雷之地，却在同一夜失去回音。'
  },
  windChampion: {
    title: '风之英杰',
    chapter: '天空遗志',
    world: 'forest',
    text: '疾风穿过森林。那位骄傲的弓手曾说：如果勇者能重新站起，天空会再次为他让路。'
  },
  waterChampion: {
    title: '水之英杰',
    chapter: '雪与泉',
    world: 'snowland',
    text: '冰雾里浮现温柔的声音：即使世界被灾厄淹没，也要把生命留给仍在战斗的人。'
  },
  fireChampion: {
    title: '火之英杰',
    chapter: '熔岩守护',
    world: 'volcano',
    text: '山腹传来豪迈的笑声。坚盾并不是为了退缩，而是为了替朋友挡下最沉重的一击。'
  },
  thunderChampion: {
    title: '雷之英杰',
    chapter: '沙海女王',
    world: 'desert',
    text: '沙暴静止了一瞬。雷霆女王曾提醒勇者：真正的速度，不是追上敌人，而是先看穿它的下一步。'
  },
  brokenArmy: {
    title: '失落军阵',
    chapter: '双河战场',
    world: 'highland',
    text: '双河之间残留着战斗痕迹。守护者失控后，王国军在这里为平民争取了最后一条撤离道路。'
  },
  castlePromise: {
    title: '黎明之前',
    chapter: '王城回忆',
    world: 'castle',
    text: '城堡深处传来微弱的呼唤：我还能压制灾厄一会儿。勇者，不必害怕过去，现在的你已经回来了。'
  }
};

const STORY_REGION_THREADS = {
  grassland: '起始台地：苏醒、点塔、四神庙、获得滑翔伞。',
  forest: '迷失森林：寻找守望者，理解四英杰与神兽的真相。',
  highland: '费罗尼高地：穿越双河战场，找回王国败退的记忆。',
  snowland: '赫布拉雪山：解放水之神兽，唤回生命守护。',
  volcano: '死亡之山：解放火之神兽，唤回坚盾守护。',
  desert: '格鲁德沙漠：解放雷之神兽，唤回雷霆守护。',
  castle: '海拉鲁城堡：四神兽支援后，进入最终决战。'
};

const STORY_WORLD_INTROS = {
  grassland: '风从台地吹来。先与老人交谈，点亮高塔，找回第一批试炼。',
  forest: '雾气遮住道路。这里藏着守望者，也藏着风之神兽的回音。',
  highland: '双河切开高地。桥、山坡和滑翔伞都会成为穿越战场的办法。',
  snowland: '寒气逼近骨头。准备防寒装备或料理，再追踪水之神兽。',
  volcano: '热浪从岩缝里涌出。耐火准备不足时，山会比怪物更危险。',
  desert: '沙暴正在移动。白天酷热，雷之神兽的影子藏在沙海深处。',
  castle: '灾厄的气息压在王城上方。四神兽已经就位，最后的门打开了。'
};

const StorySystem = {
  _promptMarker: null,
  _interactConsumed: false,

  init() {
    const p = SaveSystem.getProgress();
    if (!p.story) {
      p.story = { memories: [], events: [], visitedWorlds: [] };
      SaveSystem.setProgress(p);
    } else {
      if (!p.story.memories) p.story.memories = [];
      if (!p.story.events) p.story.events = [];
      if (!p.story.visitedWorlds) p.story.visitedWorlds = [];
      SaveSystem.setProgress(p);
    }
  },

  get story() {
    const p = SaveSystem.getProgress();
    if (!p.story) {
      this.init();
      return SaveSystem.getProgress().story;
    }
    return p.story;
  },

  hasMemory(id) {
    return !!(this.story.memories || []).includes(id);
  },

  recoveredCount() {
    return (this.story.memories || []).length;
  },

  totalCount() {
    return Object.keys(STORY_MEMORIES).length;
  },

  getRecoveredMemories() {
    const ids = this.story.memories || [];
    return ids.map(id => ({ id, def: STORY_MEMORIES[id] })).filter(x => x.def);
  },

  getNextMemoryHint(worldName) {
    const sameWorld = Object.entries(STORY_MEMORIES).find(([id, def]) => def.world === worldName && !this.hasMemory(id));
    if (sameWorld) return sameWorld[1].title;
    const any = Object.entries(STORY_MEMORIES).find(([id]) => !this.hasMemory(id));
    return any ? any[1].title : '所有回忆已找回';
  },

  unlockMemory(id, marker) {
    const def = STORY_MEMORIES[id];
    if (!def || this.hasMemory(id)) return false;
    const p = SaveSystem.getProgress();
    if (!p.story) p.story = { memories: [], events: [], visitedWorlds: [] };
    if (!p.story.memories) p.story.memories = [];
    p.story.memories.push(id);
    SaveSystem.setProgress(p);

    if (marker) this._setMarkerRecovered(marker, true);
    Dialogue.show(`【回忆】${def.title}<br><span>${def.text}</span>`, 5200);
    if (window.game && window.game.player && typeof Effects !== 'undefined') {
      Effects.pickupFlash(window.game.player.position);
      Effects.elementalAura(window.game.player.position.clone().setY(1.4), 0x66ddcc);
    }
    if (typeof AudioSystem !== 'undefined') AudioSystem.play('power');
    if (typeof QuestSystem !== 'undefined') QuestSystem.check();
    if (typeof QuestUI !== 'undefined' && QuestUI.isOpen) QuestUI.render();
    return true;
  },

  markEvent(id) {
    const p = SaveSystem.getProgress();
    if (!p.story) p.story = { memories: [], events: [], visitedWorlds: [] };
    if (!p.story.events) p.story.events = [];
    if (!p.story.events.includes(id)) {
      p.story.events.push(id);
      SaveSystem.setProgress(p);
      return true;
    }
    return false;
  },

  hasEvent(id) {
    return !!(this.story.events || []).includes(id);
  },

  onWorldLoaded(world) {
    if (!world || !world.name) return;
    const p = SaveSystem.getProgress();
    if (!p.story) p.story = { memories: [], events: [], visitedWorlds: [] };
    if (!p.story.visitedWorlds) p.story.visitedWorlds = [];
    if (!p.story.visitedWorlds.includes(world.name)) {
      p.story.visitedWorlds.push(world.name);
      SaveSystem.setProgress(p);
      const text = STORY_WORLD_INTROS[world.name];
      if (text && typeof Dialogue !== 'undefined') {
        setTimeout(() => {
          if (window.game && window.game.currentWorld === world) Dialogue.show(`【剧情】${text}`, 3600);
        }, 650);
      }
    }
  },

  addMemoryMarker(world, id, x, z, options = {}) {
    if (!world || !world.scene || !STORY_MEMORIES[id]) return null;
    if (!world.storyMarkers) world.storyMarkers = [];
    const marker = this._createMarker(id, options.color || 0x66ddcc);
    marker.position.set(x, 0.08, z);
    marker.userData.memoryId = id;
    marker.userData.label = STORY_MEMORIES[id].title;
    marker.userData.radius = options.radius || 3.0;
    world.scene.add(marker);
    world.storyMarkers.push(marker);
    this._setMarkerRecovered(marker, this.hasMemory(id));
    return marker;
  },

  updateWorld(world, game, dt) {
    if (!world || !game || !game.player || !world.storyMarkers) return;
    const now = performance.now() * 0.001;
    let nearest = null;
    let nearestDist = Infinity;
    for (const marker of world.storyMarkers) {
      this._animateMarker(marker, now, dt);
      if (this.hasMemory(marker.userData.memoryId)) continue;
      const dist = game.player.position.distanceTo(marker.position);
      if (dist < (marker.userData.radius || 3.0) && dist < nearestDist) {
        nearest = marker;
        nearestDist = dist;
      }
    }

    const buffered = Input.justInteract || Input.state.interact || Input._interactBuffer > 0;
    if (!buffered) this._interactConsumed = false;
    if (nearest) {
      ActionButtons.showInteract(true, '回忆');
      this._promptMarker = nearest;
      if (buffered && !this._interactConsumed) {
        this._interactConsumed = true;
        this._consumeInput();
        this.unlockMemory(nearest.userData.memoryId, nearest);
      }
    } else if (this._promptMarker) {
      this._promptMarker = null;
    }
  },

  getRegionThread(worldName) {
    return STORY_REGION_THREADS[worldName] || '继续探索当前地区，寻找高塔、神庙、商店与剧情线索。';
  },

  getSynopsis() {
    if (typeof MainQuestSystem !== 'undefined') return MainQuestSystem.getSynopsis();
    const count = this.recoveredCount();
    if (SaveSystem.isBossDefeated('calamityGanon')) return '灾厄已被击败，王城迎来黎明。你仍可继续探索未找回的记忆。';
    if ((QuestSystem.progress.divineBeasts || []).length >= 4) return '四神兽已经重新对准王城。最终决战前，可以继续找回回忆，也可以直奔城堡。';
    if (QuestSystem.progress.metImpa) return `守望者已经说明真相。已找回 ${count}/${this.totalCount()} 段回忆，四神兽正在等待解放。`;
    if (QuestSystem.progress.gotGlider) return '滑翔伞让台地之外的世界打开了。下一步是寻找守望者，理解百年前的败局。';
    return '勇者刚刚苏醒。点亮高塔、完成神庙，是离开台地前的第一场试炼。';
  },

  _createMarker(id, color) {
    const g = new THREE.Group();
    const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.78, side: THREE.DoubleSide });
    const glowMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.035, 32), glowMat);
    base.position.y = 0.02;
    g.add(base);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.035, 8, 48), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.08;
    g.add(ring);
    const shard = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22, 0),
      new THREE.MeshStandardMaterial({
        color: 0xdffeff,
        emissive: color,
        emissiveIntensity: 0.55,
        roughness: 0.32,
        metalness: 0.12,
        transparent: true,
        opacity: 0.92
      })
    );
    shard.position.y = 0.9;
    shard.scale.y = 1.55;
    g.add(shard);
    const beam = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 1.8, 18, 1, true),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })
    );
    beam.position.y = 0.95;
    g.add(beam);
    g.userData.parts = { base, ring, shard, beam };
    g.userData.kind = 'memoryMarker';
    g.userData.memoryId = id;
    return g;
  },

  _setMarkerRecovered(marker, recovered) {
    if (!marker || !marker.userData.parts) return;
    marker.userData.recovered = !!recovered;
    marker.visible = true;
    const opacity = recovered ? 0.18 : 0.78;
    const parts = marker.userData.parts;
    if (parts.ring.material) parts.ring.material.opacity = opacity;
    if (parts.base.material) parts.base.material.opacity = recovered ? 0.08 : 0.22;
    if (parts.beam.material) parts.beam.material.opacity = recovered ? 0.04 : 0.18;
    if (parts.shard.material) {
      parts.shard.material.opacity = recovered ? 0.28 : 0.92;
      if (parts.shard.material.emissive) parts.shard.material.emissiveIntensity = recovered ? 0.08 : 0.55;
    }
  },

  _animateMarker(marker, now, dt) {
    const parts = marker.userData.parts;
    if (!parts) return;
    const recovered = marker.userData.recovered;
    parts.ring.rotation.z += dt * (recovered ? 0.25 : 0.9);
    parts.shard.rotation.y += dt * 1.4;
    parts.shard.position.y = 0.9 + Math.sin(now * 2.2 + marker.position.x) * (recovered ? 0.035 : 0.09);
    parts.beam.rotation.y -= dt * 0.35;
  },

  _consumeInput() {
    if (Input._interactBuffer !== undefined) Input._interactBuffer = 0;
    if (Input.state) {
      Input.state.justInteract = false;
      Input.state.interact = false;
    }
  }
};
