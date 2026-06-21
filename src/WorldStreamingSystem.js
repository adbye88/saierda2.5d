/* ========================================================
   WorldStreamingSystem.js — 完整地图的流式预算层
   目标：
   - 地图/敌人/宝箱/任务数据一次性保留，不删除、不“近处才生成”
   - 近景 active：完整 AI / 动画 / 美术反馈
   - 中景 passive：可见但降低更新成本
   - 远景 dormant：隐藏并休眠，避免全地图每帧吃 CPU/GPU
   ======================================================== */

const WorldStreamingSystem = {
  enabled: true,
  _game: null,
  _world: null,
  _cellSize: 48,
  _enemyTimer: 0,
  _propTimer: 0,
  _lastCellKey: '',
  _stats: {
    activeEnemies: 0,
    passiveEnemies: 0,
    dormantEnemies: 0,
    visibleProps: 0,
    hiddenProps: 0,
    visibleDetailCells: 0,
    hiddenDetailCells: 0,
    activeCells: 0,
    passiveCells: 0,
    totalCells: 0,
    quality: 'unknown'
  },

  init(game) {
    this._game = game || null;
    this.applyWorld(game && game.currentWorld, game);
  },

  ownsDistanceCulling() {
    return this.enabled === true;
  },

  applyWorld(world, game) {
    if (!world || !world.scene) return;
    this._game = game || this._game;
    this._world = world;
    this._enemyTimer = 0;
    this._propTimer = 0;
    this._lastCellKey = '';
    this._cacheStreamProps(world);
    this._primeEnemies(world);
    this._buildCells(world);
    this._stats = {
      activeEnemies: 0,
      passiveEnemies: 0,
      dormantEnemies: 0,
      visibleProps: 0,
      hiddenProps: 0,
      visibleDetailCells: 0,
      hiddenDetailCells: 0,
      activeCells: 0,
      passiveCells: 0,
      totalCells: world._streamCells ? world._streamCells.size : 0,
      quality: this._quality()
    };
    world._streamingStats = this._stats;
  },

  update(dt, game) {
    if (!this.enabled) return;
    const world = game && game.currentWorld;
    const player = game && game.player;
    if (!world || !world.scene || !player) return;
    if (world !== this._world || !Array.isArray(world._streamProps)) {
      this.applyWorld(world, game);
    }

    this._enemyTimer -= dt;
    this._propTimer -= dt;
    if (this._enemyTimer <= 0) {
      this._enemyTimer = this._enemyInterval();
      this._updateEnemyTiers(world, game, player);
    }
    if (this._propTimer <= 0) {
      this._propTimer = this._propInterval();
      this._updateProps(world, player);
    }
    window.__worldStreamingStats = this._stats;
  },

  snapshot() {
    return Object.assign({}, this._stats);
  },

  _primeEnemies(world) {
    if (!world || !Array.isArray(world.enemies)) return;
    for (const enemy of world.enemies) {
      if (!enemy || !enemy.mesh) continue;
      enemy._streamTier = enemy._streamTier || 'passive';
      enemy._streamActive = enemy._streamTier !== 'dormant';
      enemy.mesh.userData.streamOwner = enemy;
    }
  },

  _cacheStreamProps(world) {
    if (!world || !world.scene) return;
    const list = [];
    world.scene.traverse(obj => {
      if (!obj || !obj.userData) return;
      const kind = obj.userData.kind;
      const important = kind === 'shrine' || kind === 'sheikahTower' || kind === 'campfire' || kind === 'chest';
      if (obj.userData.perfCull !== true && !important) return;
      let p = obj.parent;
      while (p && p !== world.scene) {
        if (p.userData && p.userData.perfCull === true) return;
        p = p.parent;
      }
      if (obj.userData.streamBaseVisible == null) obj.userData.streamBaseVisible = obj.visible !== false;
      list.push(obj);
    });
    world._streamProps = list;
  },

  _buildCells(world) {
    if (!world) return;
    const cellSize = this._cellSize;
    const cells = new Map();
    const ensure = (x, z) => {
      const cx = Math.floor((Number(x) || 0) / cellSize);
      const cz = Math.floor((Number(z) || 0) / cellSize);
      const key = `${cx},${cz}`;
      let cell = cells.get(key);
      if (!cell) {
        cell = { key, cx, cz, enemies: [], props: [], landmarks: [] };
        cells.set(key, cell);
      }
      return cell;
    };

    if (Array.isArray(world.enemies)) {
      for (const enemy of world.enemies) {
        if (!enemy || !enemy.mesh) continue;
        const cell = ensure(enemy.mesh.position.x, enemy.mesh.position.z);
        enemy._streamCellKey = cell.key;
        cell.enemies.push(enemy);
      }
    }

    const props = Array.isArray(world._streamProps) ? world._streamProps : [];
    for (const obj of props) {
      if (!obj || !obj.position || !obj.userData) continue;
      const cell = ensure(obj.position.x, obj.position.z);
      obj.userData.streamCellKey = cell.key;
      const kind = obj.userData.kind;
      if (obj.userData.detailLayer) {
        cell.details = cell.details || [];
        cell.details.push(obj);
      } else if (kind === 'shrine' || kind === 'sheikahTower' || kind === 'campfire' || kind === 'chest') {
        cell.landmarks.push(obj);
      } else {
        cell.props.push(obj);
      }
    }

    world._streamCells = cells;
    world._streamVisibleProps = new Set();
  },

  _updateEnemyTiers(world, game, player) {
    const enemies = Array.isArray(world.enemies) ? world.enemies : [];
    const budget = this._budget();
    const px = player.position.x;
    const pz = player.position.z;
    const move = this._playerForward(player);
    const cells = this._cellsInRadius(world, px, pz, budget.hideRadius + budget.frontBoost * 1.2);
    const candidateEnemies = new Set();
    for (const cell of cells) {
      for (const enemy of cell.enemies) candidateEnemies.add(enemy);
    }
    for (const enemy of enemies) {
      if (enemy && this._forceEnemyActive(enemy, game)) candidateEnemies.add(enemy);
    }
    let active = 0;
    let passive = 0;
    let dormant = 0;

    for (const enemy of enemies) {
      if (!enemy || !enemy.mesh) continue;
      if (enemy.dead || enemy.hp <= 0) {
        enemy._streamTier = 'active';
        enemy._streamActive = true;
        enemy.mesh.visible = true;
        active++;
        continue;
      }

      if (!candidateEnemies.has(enemy)) {
        enemy._streamTier = 'dormant';
        enemy._streamActive = false;
        enemy.mesh.visible = false;
        if (enemy._contactShadow) enemy._contactShadow.visible = false;
        dormant++;
        continue;
      }

      const dx = enemy.mesh.position.x - px;
      const dz = enemy.mesh.position.z - pz;
      const distSq = dx * dx + dz * dz;
      const dist = Math.sqrt(distSq);
      const ahead = dist > 0.001 ? Math.max(0, (dx / dist) * move.x + (dz / dist) * move.z) : 0;
      const frontBoost = ahead > 0.2 ? budget.frontBoost * ahead : 0;
      const force = this._forceEnemyActive(enemy, game);
      const activeRadius = budget.activeRadius + frontBoost;
      const passiveRadius = budget.passiveRadius + frontBoost * 1.25;
      const hideRadius = budget.hideRadius + frontBoost * 1.15;
      const oldTier = enemy._streamTier || 'passive';
      let tier;

      if (force || distSq <= activeRadius * activeRadius) {
        tier = 'active';
      } else if (distSq <= passiveRadius * passiveRadius) {
        tier = 'passive';
      } else if (oldTier !== 'dormant' && distSq <= hideRadius * hideRadius) {
        tier = oldTier === 'active' ? 'passive' : oldTier;
      } else {
        tier = 'dormant';
      }

      enemy._streamTier = tier;
      enemy._streamActive = tier === 'active' || force;
      if (enemy.mesh) enemy.mesh.visible = force || tier !== 'dormant';
      if (enemy._contactShadow) enemy._contactShadow.visible = tier === 'active' && enemy.mesh.visible !== false;

      if (tier === 'active') active++;
      else if (tier === 'passive') passive++;
      else dormant++;
    }

    this._stats.activeEnemies = active;
    this._stats.passiveEnemies = passive;
    this._stats.dormantEnemies = dormant;
    this._stats.activeCells = cells.filter(cell => this._cellDistanceToPlayer(cell, px, pz) <= budget.activeRadius * budget.activeRadius).length;
    this._stats.passiveCells = cells.length - this._stats.activeCells;
    this._stats.totalCells = world._streamCells ? world._streamCells.size : 0;
    this._stats.quality = this._quality();
    world._streamingStats = this._stats;
  },

  _updateProps(world, player) {
    const budget = this._budget();
    const px = player.position.x;
    const pz = player.position.z;
    const cells = this._cellsInRadius(world, px, pz, budget.landmarkRadius);
    const previous = world._streamVisibleProps || new Set();
    const nextVisible = new Set();
    let visible = 0;
    let hidden = 0;
    let visibleDetails = 0;
    let hiddenDetails = 0;

    for (const cell of cells) {
      for (const obj of cell.props) this._updatePropVisibility(obj, px, pz, budget, false, nextVisible);
      for (const obj of cell.landmarks) this._updatePropVisibility(obj, px, pz, budget, true, nextVisible);
      for (const obj of (cell.details || [])) this._updateDetailVisibility(obj, px, pz, budget, nextVisible);
    }

    for (const obj of previous) {
      if (!nextVisible.has(obj) && obj && obj.userData) {
        obj.visible = false;
      }
    }
    world._streamVisibleProps = nextVisible;

    const props = Array.isArray(world._streamProps) ? world._streamProps : [];
    for (const obj of props) {
      if (obj && obj.userData && obj.userData.detailLayer) {
        if (obj.visible) visibleDetails++;
        else hiddenDetails++;
      } else if (obj && obj.visible) visible++;
      else hidden++;
    }

    this._stats.visibleProps = visible;
    this._stats.hiddenProps = hidden;
    this._stats.visibleDetailCells = visibleDetails;
    this._stats.hiddenDetailCells = hiddenDetails;
    this._stats.totalCells = world._streamCells ? world._streamCells.size : 0;
    world._streamingStats = this._stats;
  },

  _updatePropVisibility(obj, px, pz, budget, important, nextVisible) {
    if (!obj || !obj.position || !obj.userData) return;
    const dx = obj.position.x - px;
    const dz = obj.position.z - pz;
    const distSq = dx * dx + dz * dz;
    const showRadius = important ? budget.landmarkRadius : budget.propRadius;
    const hideRadius = showRadius * 1.22;
    const shouldShow = obj.visible
      ? distSq <= hideRadius * hideRadius
      : distSq <= showRadius * showRadius;
    obj.visible = obj.userData.streamBaseVisible !== false && shouldShow;
    if (obj.visible) nextVisible.add(obj);
  },

  _updateDetailVisibility(obj, px, pz, budget, nextVisible) {
    if (!obj || !obj.position || !obj.userData) return;
    const dx = obj.position.x - px;
    const dz = obj.position.z - pz;
    const distSq = dx * dx + dz * dz;
    const detailRadius = budget.detailRadius || budget.propRadius;
    const hideRadius = detailRadius * 1.18;
    const shouldShow = obj.visible
      ? distSq <= hideRadius * hideRadius
      : distSq <= detailRadius * detailRadius;
    obj.visible = obj.userData.streamBaseVisible !== false && shouldShow;
    if (obj.visible) nextVisible.add(obj);
  },

  _cellsInRadius(world, px, pz, radius) {
    if (!world || !world._streamCells) return [];
    const cellSize = this._cellSize;
    const cx = Math.floor((Number(px) || 0) / cellSize);
    const cz = Math.floor((Number(pz) || 0) / cellSize);
    const range = Math.max(1, Math.ceil(radius / cellSize) + 1);
    const radiusSq = (radius + cellSize * 0.75) * (radius + cellSize * 0.75);
    const list = [];
    for (let z = cz - range; z <= cz + range; z++) {
      for (let x = cx - range; x <= cx + range; x++) {
        const cell = world._streamCells.get(`${x},${z}`);
        if (!cell) continue;
        if (this._cellDistanceToPlayer(cell, px, pz) <= radiusSq) list.push(cell);
      }
    }
    return list;
  },

  _cellDistanceToPlayer(cell, px, pz) {
    const size = this._cellSize;
    const cx = cell.cx * size + size * 0.5;
    const cz = cell.cz * size + size * 0.5;
    const dx = cx - px;
    const dz = cz - pz;
    return dx * dx + dz * dz;
  },

  _forceEnemyActive(enemy, game) {
    return !!(
      enemy === (game && game.lockedEnemy) ||
      enemy.boss ||
      enemy.miniBoss ||
      enemy.hurtTimer > 0 ||
      enemy.attackPhase ||
      enemy._stunTimer > 0 ||
      enemy.state === 'attack' ||
      enemy.state === 'chase'
    );
  },

  _playerForward(player) {
    if (player && player.velocity && Math.hypot(player.velocity.x || 0, player.velocity.z || 0) > 0.08) {
      return player.velocity.clone().setY(0).normalize();
    }
    const facing = player && Number.isFinite(player.facing) ? player.facing : 0;
    return new THREE.Vector3(Math.sin(facing), 0, Math.cos(facing)).normalize();
  },

  _budget() {
    const quality = this._quality();
    const touch = this._isTouchDevice();
    if (touch || quality === 'low') {
      return {
        activeRadius: 34,
        passiveRadius: 58,
        hideRadius: 72,
        propRadius: 34,
        detailRadius: 42,
        landmarkRadius: 64,
        frontBoost: 22
      };
    }
    if (quality === 'medium') {
      return {
        activeRadius: 46,
        passiveRadius: 82,
        hideRadius: 102,
        propRadius: 54,
        detailRadius: 58,
        landmarkRadius: 92,
        frontBoost: 30
      };
    }
    return {
      activeRadius: 62,
      passiveRadius: 118,
      hideRadius: 144,
      propRadius: 82,
      detailRadius: 78,
      landmarkRadius: 138,
      frontBoost: 38
    };
  },

  _enemyInterval() {
    const quality = this._quality();
    if (this._isTouchDevice() || quality === 'low') return 0.22;
    return quality === 'medium' ? 0.16 : 0.1;
  },

  _propInterval() {
    const quality = this._quality();
    if (this._isTouchDevice() || quality === 'low') return 0.38;
    return quality === 'medium' ? 0.32 : 0.24;
  },

  _quality() {
    return (typeof VisualQualitySystem !== 'undefined' && VisualQualitySystem.level) || 'medium';
  },

  _isTouchDevice() {
    return ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  }
};

if (typeof window !== 'undefined') window.WorldStreamingSystem = WorldStreamingSystem;
