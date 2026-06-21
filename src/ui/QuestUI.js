/* ========================================================
   QuestUI.js — 任务窗口 + 属性栏
   显示主线进度、当前目标、角色属性、装备耐久与世界数据
   ======================================================== */

const QuestUI = {
  isOpen: false,
  el: null,

  init() {
    this.el = document.createElement('div');
    this.el.id = 'quest-ui';
    this.el.className = 'hidden';
    this.el.innerHTML = `
      <div class="quest-panel">
        <div class="quest-header">
          <span>任务与属性</span>
          <button id="quest-close">X</button>
        </div>
        <div class="quest-body">
          <div id="quest-main" class="quest-section"></div>
          <div id="quest-stats" class="quest-section"></div>
        </div>
      </div>
    `;
    document.body.appendChild(this.el);
    document.getElementById('quest-close').addEventListener('click', () => this.close());
  },

  toggle() { this.isOpen ? this.close() : this.open(); },
  open() {
    this.isOpen = true;
    this.el.classList.remove('hidden');
    this.render();
  },
  close() {
    this.isOpen = false;
    this.el.classList.add('hidden');
  },

  render() {
    if (!window.game || !window.game.player) return;
    this._renderQuest();
    this._renderStats();
  },

  _renderQuest() {
    const q = QuestSystem.getCurrentQuest();
    const progress = SaveSystem.getProgress();
    const completed = QuestSystem.getCompletedCount();
    const total = Object.keys(QUESTS).length;
    const beasts = progress.progress && progress.progress.divineBeasts ? progress.progress.divineBeasts : [];
    const trials = progress.progress && progress.progress.beastTrials ? progress.progress.beastTrials : [];
    const shrines = progress.progress ? (progress.progress.shrinesCleared || 0) : 0;
    const totalShrines = (typeof SHRINE_DEFS !== 'undefined') ? Object.keys(SHRINE_DEFS).length : 4;
    const memoryCount = (typeof StorySystem !== 'undefined') ? StorySystem.recoveredCount() : 0;
    const memoryTotal = (typeof StorySystem !== 'undefined') ? StorySystem.totalCount() : 0;
    const storySummary = (typeof StorySystem !== 'undefined') ? StorySystem.getSynopsis() : '继续推进主线。';
    const storyRoadmap = (typeof MainQuestSystem !== 'undefined') ? MainQuestSystem.getStoryRoadmap() : null;
    const regionThread = (typeof StorySystem !== 'undefined' && window.game.currentWorld)
      ? StorySystem.getRegionThread(window.game.currentWorld.name)
      : '';
    const memories = (typeof StorySystem !== 'undefined') ? StorySystem.getRecoveredMemories() : [];
    const memoryRows = memories.slice(-4).reverse().map(m => `
      <div class="memory-row">
        <b>${m.def.title}</b>
        <span>${m.def.chapter}</span>
      </div>
    `).join('');
    const auto = window.game.autoPath && window.game.autoPath.active ? window.game.autoPath : null;
    const actRows = (typeof MainQuestSystem !== 'undefined')
      ? MainQuestSystem.getStoryActRows().map(row => `
        <div class="story-act-row ${row.complete ? 'done' : ''} ${row.active ? 'active' : ''} ${row.locked ? 'locked' : ''}">
          <span>${row.complete ? '完成' : row.active ? '当前' : '后续'}</span>
          <div>
            <b>${row.title}</b>
            <small>${row.theme}<br>${row.active ? '目标：' + row.goal + '<br>下一步：' + row.next : row.goal}</small>
          </div>
        </div>
      `).join('')
      : '';
    const beastRows = (typeof MainQuestSystem !== 'undefined')
      ? MainQuestSystem.getBeastRows().map(row => {
        const cls = row.liberated ? 'liberated' : row.trialReady ? 'ready' : row.stage.key;
        const missing = row.missing.length ? `还需：${row.missing.join('、')}` : '终端已响应，前往核心战斗';
        const advice = row.liberated
          ? `${row.champ.ability}：${row.champ.desc}`
          : `${missing}<br>准备：${row.story.prep.join('、')}<br>弱点：${row.story.weakness}<br>奖励：${row.story.reward}`;
        return `<div class="beast-row ${cls}">
          <div>
            <b>${row.def.beast} · ${row.story.region}</b>
            <small>${row.stage.detail}<br>${row.story.emotionalHook}<br>${advice}</small>
          </div>
          <span>${row.stage.label}</span>
        </div>`;
      }).join('')
      : (typeof DIVINE_BEAST_CHALLENGES !== 'undefined'
        ? Object.values(DIVINE_BEAST_CHALLENGES).map(def => {
          const liberated = beasts.includes(def.element);
          const ready = trials.includes(def.element);
          const status = liberated ? '已解放' : ready ? '可挑战' : '准备中';
          return `<div class="memory-row"><b>${def.beast}</b><span>${status}</span></div>`;
        }).join('')
        : '');
    const guardianRows = (typeof MainQuestSystem !== 'undefined')
      ? MainQuestSystem.getGuardianPowerRows().map(row => `
        <div class="guardian-row ${row.unlocked ? row.ready ? 'ready' : 'cooling' : 'locked'}">
          <div>
            <b>${row.name}</b>
            <small>${row.role} · ${row.desc}</small>
          </div>
          <span>${row.unlocked ? row.ready ? '可用' : row.remain + 's' : row.beast}</span>
        </div>
      `).join('')
      : '';
    const bountyRows = (typeof BountySystem !== 'undefined' && window.game.currentWorld)
      ? BountySystem.rowsForWorld(window.game.currentWorld, window.game).map(row => `
        <div class="quest-row ${row.claimed ? 'done' : row.done ? 'active' : ''}">
          <span>${row.claimed ? '已领' : row.done ? '可领' : `${row.current}/${row.target}`}</span>
          <div>
            <b>${row.name}</b>
            <small>${row.desc || ''}<br>进度：${row.current}/${row.target} · 奖励：${this._rewardLabel(row.reward)}</small>
            ${row.done && !row.claimed ? `<button class="quest-path-btn" onclick="QuestUI.claimBounty('${row.id}')">领取奖励</button>` : ''}
          </div>
        </div>
      `).join('')
      : '';
    const list = Object.values(QUESTS).map(item => {
      const done = item.complete(QuestSystem);
      const active = q && q.id === item.id;
      return `<div class="quest-row ${done ? 'done' : ''} ${active ? 'active' : ''}">
        <span>${done ? '完成' : active ? '当前' : '待办'}</span>
        <div><b>第${item.chapter}章 ${item.name}</b><small>${item.desc}</small></div>
      </div>`;
    }).join('');

    document.getElementById('quest-main').innerHTML = `
      <div class="quest-title">当前目标</div>
      <div class="quest-current">
        <h3>${q ? q.name : '海拉鲁已恢复和平'}</h3>
        <p>${q ? q.desc : '你可以继续探索、收集装备、挑战强敌。'}</p>
        <button class="quest-path-btn" onclick="QuestUI.startQuestPath()">${auto ? '更新寻路' : '自动寻路'}</button>
        ${auto ? `<button class="quest-stop-btn" onclick="QuestUI.stopAutoPath()">停止寻路</button><div class="quest-auto">正在前往：${auto.label}${auto.via ? ' · 经由' + auto.via.label : ''}</div>` : ''}
      </div>
      <div class="quest-progress">
        <span>主线 ${completed}/${total}</span>
        <span>神庙 ${shrines}/${totalShrines}</span>
        <span>神兽 ${beasts.length}/4</span>
        <span>终端 ${trials.length}/4</span>
        <span>回忆 ${memoryCount}/${memoryTotal}</span>
        <span>Boss ${(progress.bosses || []).length}</span>
      </div>
      <div class="story-box">
        <div class="quest-title">剧情线索</div>
        <p>${storySummary}</p>
        ${storyRoadmap ? `<small>主题：${storyRoadmap.theme}<br>章节目标：${storyRoadmap.goal}<br>下一步：${storyRoadmap.next}</small>` : ''}
        <small>${regionThread}</small>
      </div>
      <div class="memory-list story-act-list">
        <div class="quest-title">剧情章节路线</div>
        ${actRows || '<div class="memory-empty">主线章节会随剧情推进逐步更新。</div>'}
      </div>
      <div class="memory-list">
        <div class="quest-title">最近找回的回忆</div>
        ${memoryRows || '<div class="memory-empty">靠近发光回忆点并按“对话/交互”即可找回。</div>'}
      </div>
      <div class="memory-list">
        <div class="quest-title">四大神兽挑战</div>
        ${beastRows || '<div class="memory-empty">前往四大区域启动神兽终端。</div>'}
      </div>
      <div class="memory-list">
        <div class="quest-title">英杰守护之力</div>
        ${guardianRows || '<div class="memory-empty">解放神兽后，英杰能力会显示在 HUD 中。</div>'}
      </div>
      <div class="memory-list">
        <div class="quest-title">区域悬赏</div>
        ${bountyRows || '<div class="memory-empty">当前地区暂无悬赏，继续探索营地、采集点与图鉴线索。</div>'}
      </div>
      <div class="quest-list">${list}</div>
    `;
  },

  _rewardLabel(reward) {
    return (reward || []).map(([id, count = 1]) => {
      const d = typeof ITEMS !== 'undefined' ? ITEMS[id] : null;
      return `${d ? (d.icon || '') + d.name : id}${count > 1 ? '×' + count : ''}`;
    }).join('、') || '卢比';
  },

  claimBounty(id) {
    if (typeof BountySystem === 'undefined') return;
    BountySystem.claim(id, window.game);
    this.render();
  },

  _renderStats() {
    const game = window.game;
    const p = game.player;
    const inv = p.inventory;
    const resist = inv.getResist();
    const w = inv.equipped.weapon;
    const s = inv.equipped.shield;
    const b = inv.equipped.bow;
    const armor = [inv.equipped.armor_upper, inv.equipped.armor_lower].filter(Boolean);
    const armorDef = armor.reduce((sum, x) => sum + (x.def.def || 0), 0);
    const world = game.currentWorld;
    const enemyCount = world ? world.enemies.filter(e => !e.dead).length : 0;
    const dropCount = world ? world.drops.filter(d => !d.pickedUp).length : 0;
    const shrineCount = world && world.shrines ? world.shrines.length : 0;
    const shrineCleared = shrineCount ? world.shrines.filter(s => s.cleared).length : 0;
    const ecosystem = this._enemySummary(world);
    const fmtDur = (stack) => stack ? `${inv.getStackDisplayName ? inv.getStackDisplayName(stack) : stack.def.name} ${stack.durability}/${stack.maxDurability || stack.def.durability}` : '未装备';
    const activeBuffs = Object.keys(inv.buffs);
    const setBonus = inv.getSetBonus ? inv.getSetBonus() : null;
    document.getElementById('quest-stats').innerHTML = `
      <div class="quest-title">属性栏</div>
      <div class="stat-grid">
        <div><b>${Math.ceil(p.hp)}/${p.maxHp * 4}</b><span>生命</span></div>
        <div><b>${Math.round(p.stamina)}/${p.maxStamina}</b><span>体力</span></div>
        <div><b>${w ? (inv.getStackAttack ? inv.getStackAttack(w) : w.def.atk) : 1}</b><span>近战攻击</span></div>
        <div><b>${b ? (inv.getStackAttack ? inv.getStackAttack(b) : b.def.atk) : 0}</b><span>弓攻击</span></div>
        <div><b>${armorDef}</b><span>防具防御</span></div>
        <div><b>${s ? (inv.getStackDefense ? inv.getStackDefense(s) : s.def.def) : 0}</b><span>盾防御</span></div>
        <div><b>${inv.rupees}</b><span>卢比</span></div>
        <div><b>${inv.arrows}</b><span>箭矢</span></div>
      </div>
      <div class="equip-readout">
        <div><span>近战</span><b>${fmtDur(w)}</b></div>
        <div><span>盾牌</span><b>${fmtDur(s)}</b></div>
        <div><span>弓箭</span><b>${fmtDur(b)}</b></div>
      </div>
      <div class="resist-readout">
        <span>防寒 ${resist.cold}</span><span>耐火 ${resist.fire}</span><span>防热 ${resist.heat}</span>
        <span>套装 ${setBonus ? setBonus.name : '未激活'}</span>
        <span>Buff ${activeBuffs.length ? activeBuffs.join(', ') : '无'}</span>
      </div>
      ${setBonus ? `<div class="story-box"><div class="quest-title">套装属性</div><p>${setBonus.desc}</p></div>` : ''}
      <div class="world-readout">
        <span>地图：${MapMenu.WORLD_INFO[world.name] ? MapMenu.WORLD_INFO[world.name].name : world.name}</span>
        <span>怪物：${enemyCount}</span>
        <span>神庙：${shrineCleared}/${shrineCount}</span>
        <span>掉落物：${dropCount}</span>
      </div>
      <div class="quest-title ecosystem-title">当前地图生态</div>
      <div class="ecosystem-list">${ecosystem}</div>
    `;
  },

  _enemySummary(world) {
    if (!world || !world.enemies) return '<span>暂无</span>';
    const counts = {};
    for (const e of world.enemies) {
      if (e.dead) continue;
      const name = e.def ? e.def.name : e.typeId;
      counts[name] = (counts[name] || 0) + 1;
    }
    const rows = Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => `<span>${name} ×${count}</span>`);
    return rows.length ? rows.join('') : '<span>暂无</span>';
  },

  startQuestPath() {
    if (!window.game || !window.game.currentWorld) return;
    const target = this._questTarget();
    if (!target) {
      Dialogue.show('当前任务需要先打开地图选择区域');
      return;
    }
    window.game.autoPath = {
      active: true,
      target: { x: target.x, z: target.z },
      label: target.label,
      radius: target.radius || 2.4
    };
    Dialogue.show(`开始自动寻路：${target.label}`);
    this.close();
  },

  stopAutoPath() {
    if (window.game) window.game.autoPath = null;
    Dialogue.show('已停止自动寻路');
    this.render();
  },

  _questTarget() {
    const game = window.game;
    const world = game.currentWorld;
    const q = QuestSystem.getCurrentQuest();
    if (!q || !world) return null;
    const nearest = (items, label, radius = 2.5) => {
      let best = null, bestD = Infinity;
      for (const obj of items || []) {
        const pos = obj.mesh ? obj.mesh.position : obj.position;
        const d = pos.distanceTo(game.player.position);
        if (d < bestD) { bestD = d; best = pos; }
      }
      return best ? { x: best.x, z: best.z, label, radius } : null;
    };
    if (world.name === 'grassland') {
      if (q.id === 'awakening') return { x: 12, z: -12, label: '海拉鲁国王' };
      if (q.id === 'firstTower') return { x: 75, z: 75, label: '起始台地塔', radius: 3 };
      if (q.id === 'fourShrines') return nearest(world.shrines || [], '最近的神庙', 3);
      if (q.id === 'glider') return { x: 12, z: -12, label: '领取滑翔伞' };
    }
    if (q.id === 'kakariko' && world.name === 'forest') return { x: -8, z: 58, label: '英帕' };
    if (q.id === 'memoryEchoes') {
      const marker = nearest((world.storyMarkers || []).filter(m => !(typeof StorySystem !== 'undefined' && StorySystem.hasMemory(m.userData.memoryId))), '最近的回忆点', 3);
      if (marker) return marker;
    }
    if (q.id === 'freeDivineBeasts') {
      const terminal = (world.divineBeastTerminals || []).find(t => !t.userData.ready);
      if (terminal) return { x: terminal.position.x, z: terminal.position.z, label: terminal.userData.name || '神兽终端', radius: 2.8 };
      if (world.boss && !world.boss.dead) return { x: world.boss.position.x, z: world.boss.position.z, label: world.boss.def.name, radius: 8 };
    }
    if (q.id === 'prepareFinal') {
      const marker = nearest((world.storyMarkers || []).filter(m => !(typeof StorySystem !== 'undefined' && StorySystem.hasMemory(m.userData.memoryId))), '决战前回忆', 3);
      if (marker) return marker;
      if (world.name === 'castle' && world.boss) return { x: world.boss.position.x, z: world.boss.position.z, label: '王城深处', radius: 8 };
    }
    if (q.id === 'finalGanon' && world.name === 'castle' && world.boss) return { x: world.boss.position.x, z: world.boss.position.z, label: '灾厄盖侬', radius: 8 };
    return nearest(world.gates || [], '最近的传送门', 2.5);
  }
};
