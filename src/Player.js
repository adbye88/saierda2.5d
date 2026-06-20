/* ========================================================
   Player.js — 玩家角色 林克
   职责：移动、跳跃、攀爬、攻击动画、相机跟随、生命/体力
   ======================================================== */

class Player {
  constructor() {
    this.mesh = AssetFactory.createLink();
    this.mesh.castShadow = true;
    this.mesh.traverse(c => { if (c.isMesh) c.castShadow = true; });
    this._gliderMesh = AssetFactory.createParaglider ? AssetFactory.createParaglider() : null;
    if (this._gliderMesh) this.mesh.add(this._gliderMesh);

    this.speed = 6.0;
    this.runSpeed = 9.0;
    this.velocity = new THREE.Vector3();
    this.position = this.mesh.position;
    this.facing = 0;          // 朝向角度（Y轴）
    this.onGround = true;
    this.vy = 0;
    this.gravity = -28;

    // 属性
    this.maxHp = 9;           // 9颗心 = 36 血（每心4格）
    this.hp = this.maxHp * 4;
    this.maxStamina = 100;
    this.stamina = 100;

    // 动画状态
    this.attackTimer = 0;
    this.attackDuration = 0.35;
    this.isAttacking = false;
    this.attackHit = false;   // 本挥是否已经判定过伤害
    this.attackQueued = false;
    this.comboStep = 0;
    this._hitStop = 0;
    this.bowMode = false;
    this.selectedArrowType = 'normal';
    this.invuln = 0;          // 受击无敌时间

    // 装备的可视化模型
    this._weaponMesh = null;
    this._shieldMesh = null;
    this._bowMesh = null;
    this._armorOverlay = null;

    this.inventory = new Inventory();
    this.world = null;

    this.knockback = new THREE.Vector3();

    // ★ 战斗状态计时器（必须在构造时初始化为 0，
    //   否则 update() 里 `if (_stunTimer <= 0)` 等判断会因 undefined 永远为 false，
    //   导致玩家无法移动/攻击）
    this._burnTimer = 0;    // 灼烧剩余
    this._burnTick = 0;     // 灼烧掉血累计
    this._slowTimer = 0;    // 冰冻减速剩余
    this._stunTimer = 0;    // 雷击麻痹剩余
    this._dodgeWindow = 0;  // 完美闪避（林克时间）窗口
    this._dodgeTimer = 0;
    this._dodgeDir = null;
    this._jumpSuppressTimer = 0;
    this._jumpSuppressUntilRelease = false;
    this._flurryTimer = 0;
    this._flurryRushReady = 0;
    this._flurryRushTarget = null;
    this.isGliding = false; // 获得滑翔伞后，空中长按跳跃缓降
    this._shieldCounterWindow = 0;
    this._shieldCounterDir = null;
    this._perfectGuardTimer = 0;
    this._glidePhase = 0;
    this._posePhase = 0;
    this._stepFxTimer = 0;
    this._terrainNow = null;
  }

  spawn(point) {
    this.position.set(point.x, 0, point.z);
    this.facing = point.a || 0;
    this.mesh.rotation.y = this.facing;
  }

  // ---------- 装备刷新（背包变化时调用） ----------
  refreshEquipment() {
    if (this._armorOverlay) {
      this.mesh.remove(this._armorOverlay);
      this._armorOverlay = null;
    }
    this._armorOverlay = AssetFactory.createHeroOutfitOverlay(
      this.inventory.equipped.armor_upper && this.inventory.equipped.armor_upper.itemId,
      this.inventory.equipped.armor_lower && this.inventory.equipped.armor_lower.itemId
    );
    if (this._armorOverlay) this.mesh.add(this._armorOverlay);

    // 武器
    if (this._weaponMesh) { this.mesh.remove(this._weaponMesh); this._weaponMesh = null; }
    if (this.inventory.equipped.weapon) {
      this._weaponMesh = AssetFactory.createWeaponMesh(this.inventory.equipped.weapon.itemId);
      this._weaponMesh.position.set(0.45, 1.0, 0.1);
      this._weaponMesh.rotation.z = -0.5;
      this.mesh.add(this._weaponMesh);
    }
    // 盾
    if (this._shieldMesh) { this.mesh.remove(this._shieldMesh); this._shieldMesh = null; }
    if (this.inventory.equipped.shield) {
      this._shieldMesh = AssetFactory.createShieldMesh(this.inventory.equipped.shield.itemId);
      this._shieldMesh.position.set(-0.18, 1.25, -0.34);
      this._shieldMesh.rotation.set(-0.22, 0, 0.18);
      this.mesh.add(this._shieldMesh);
    }
    // 弓（默认不显示，攻击弓模式时显示）
    if (this._bowMesh) { this.mesh.remove(this._bowMesh); this._bowMesh = null; }
    if (this.inventory.equipped.bow) {
      this._bowMesh = AssetFactory.createBowMesh(this.inventory.equipped.bow.itemId);
      this._bowMesh.position.set(0.26, 1.14, -0.42);
      this._bowMesh.rotation.set(-0.25, 0.2, -0.45);
      this.mesh.add(this._bowMesh);
    }
  }

  setBowMode(active) {
    const canUseBow = !!this.inventory.equipped.bow && this.inventory.arrows > 0;
    this.bowMode = !!active && canUseBow;
    if (!this.bowMode && active) return false;
    return this.bowMode;
  }

  getAvailableArrowTypes() {
    const types = ['normal', 'fire', 'ice', 'shock'];
    const bow = this.inventory.equipped.bow;
    if (bow && bow.itemId === 'ancientBow') types.push('ancient');
    if (bow && bow.itemId === 'royalBow') types.push('piercing');
    return types;
  }

  arrowTypeLabel(type = this.selectedArrowType) {
    return {
      normal: '普通箭',
      fire: '火箭',
      ice: '冰箭',
      shock: '雷箭',
      ancient: '古代箭',
      piercing: '穿透箭'
    }[type] || '普通箭';
  }

  cycleArrowType() {
    const types = this.getAvailableArrowTypes();
    const current = types.includes(this.selectedArrowType) ? this.selectedArrowType : 'normal';
    this.selectedArrowType = types[(types.indexOf(current) + 1) % types.length];
    if (typeof Dialogue !== 'undefined') Dialogue.show(`➹ 切换为 ${this.arrowTypeLabel()}`, 900);
  }

  // ---------- 主更新 ----------
  update(dt, game) {
    if (this._hitStop > 0) {
      this._hitStop -= dt;
      this._updateCamera(game, dt);
      return;
    }
    if (this.invuln > 0) this.invuln -= dt;

    // ★ 元素状态效果倒计时
    if (this._burnTimer > 0) {
      this._burnTimer -= dt;
      // 灼烧：每 0.5 秒掉 0.25 血
      this._burnTick = (this._burnTick || 0) + dt;
      if (this._burnTick >= 0.5) { this._burnTick = 0; this.hp -= 0.25; }
      if (this._burnTimer <= 0 && this.mesh) {
        this.mesh.traverse(c => { if (c.isMesh && c.material && c.material.emissive) c.material.emissiveIntensity = 0; });
      }
    }
    if (this._slowTimer > 0) this._slowTimer -= dt;
    if (this._stunTimer > 0) this._stunTimer -= dt;
    if (this._shieldCounterWindow > 0) this._shieldCounterWindow -= dt;
    if (this._dodgeWindow > 0) this._dodgeWindow -= dt;
    if (this._dodgeTimer > 0) this._dodgeTimer -= dt;
    if (this._jumpSuppressTimer > 0) this._jumpSuppressTimer -= dt;
    if (this._flurryTimer > 0) this._flurryTimer -= dt;
    if (this._flurryRushReady > 0) this._flurryRushReady -= dt;
    else {
      this._flurryRushTarget = null;
      if (typeof ActionButtons !== 'undefined') ActionButtons.setFlurryVisible(false);
    }

    // 麻痹时不能移动/攻击
    if (this._stunTimer <= 0) {
      if (this._perfectGuardTimer > 0) this._perfectGuardTimer -= dt;
      if (Input.justParry) this._handleQuickParry(game);
      if (Input.justFlurryRush) this._performFlurryRush(game);
      this._move(dt, game);
      this._handleEquipCycle(game);
      if (Input.justArrowType) this.cycleArrowType();
      this._handleAttack(dt, game);
    }
    this._recoverStamina(dt);
    this._updateBowFacing(game, dt);
    this._updateGuardFacing(game);
    this._updateLockedFacing(game, dt);
    this._animate(dt);
    this._updateCamera(game, dt);
  }

  _isRunning() {
    // 持续奔跑且体力>0 时消耗
    return false; // 简化：移动不消耗体力，仅冲刺消耗（暂未实现冲刺）
  }

  _recoverStamina(dt) {
    const hasRegenFood = this.inventory && this.inventory.hasBuff && this.inventory.hasBuff('staminaRegen');
    const set = this.inventory && this.inventory.getSetEffects ? this.inventory.getSetEffects() : {};
    if (this.isGliding) {
      if (hasRegenFood) {
        this.stamina = Math.min(this.maxStamina, this.stamina + 8 * dt);
      }
      return;
    }
    if (this.onGround && !Input.state.shield) {
      const rate = (hasRegenFood ? 38 : 26) * (set.staminaRegen || 1);
      this.stamina = Math.min(this.maxStamina, this.stamina + rate * dt);
    } else if (hasRegenFood) {
      this.stamina = Math.min(this.maxStamina, this.stamina + 10 * dt);
    }
  }

  _cameraMoveBasis(game) {
    if (!game || !game.camera) {
      return {
        right: new THREE.Vector3(1, 0, 0),
        forward: new THREE.Vector3(0, 0, -1)
      };
    }
    const right = new THREE.Vector3().setFromMatrixColumn(game.camera.matrixWorld, 0);
    right.y = 0;
    if (right.lengthSq() < 0.001) right.set(1, 0, 0);
    else right.normalize();

    // 屏幕上方 = 镜头看向地面的方向在 XZ 平面上的投影。
    // 这样锁定敌人或镜头自动换角度后，摇杆上/键盘 W 仍然朝画面上方走。
    const forward = new THREE.Vector3();
    game.camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 0.001) forward.set(0, 0, -1);
    else forward.normalize();

    return { right, forward };
  }

  _moveInputToWorld(mx, my, game) {
    const { right, forward } = this._cameraMoveBasis(game);
    const dir = right.multiplyScalar(mx).add(forward.multiplyScalar(-my));
    if (dir.lengthSq() < 0.001) return null;
    return dir.normalize();
  }

  _inputAimVector(game) {
    const mx = Input.state.move.x;
    const my = Input.state.move.y;
    if (Math.abs(mx) < 0.08 && Math.abs(my) < 0.08) return null;
    return this._moveInputToWorld(mx, my, game);
  }

  _quantizeFacing(angle) {
    const step = Math.PI / 4;
    return Math.round(angle / step) * step;
  }

  _angleDelta(from, to) {
    return Math.atan2(Math.sin(to - from), Math.cos(to - from));
  }

  _turnToward(angle, dt, speed = 14) {
    const delta = this._angleDelta(this.facing, angle);
    const step = Math.min(Math.abs(delta), speed * dt);
    this.facing += Math.sign(delta) * step;
    this.mesh.rotation.y = this.facing;
  }

  _resolveAimFacing(game, opts = {}) {
    const inputDir = this._inputAimVector(game);
    if (inputDir) return this._quantizeFacing(Math.atan2(inputDir.x, inputDir.z));

    if (opts.allowLock !== false && game && game.lockedEnemy && !game.lockedEnemy.dead) {
      const to = new THREE.Vector3().subVectors(game.lockedEnemy.mesh.position, this.position);
      to.y = 0;
      if (to.lengthSq() > 0.01) {
        const angle = Math.atan2(to.x, to.z);
        return opts.quantizeLock ? this._quantizeFacing(angle) : angle;
      }
    }
    if (opts.mobileAssist !== false) {
      const assisted = this._nearestCombatTarget(game, opts.assistRange || 6.8);
      if (assisted) {
        const angle = Math.atan2(assisted.x, assisted.z);
        return opts.quantizeAssist ? this._quantizeFacing(angle) : angle;
      }
    }
    return this._quantizeFacing(this.facing);
  }

  _facingVector(angle) {
    return new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle)).normalize();
  }

  _poseAlpha(dt, speed) {
    return 1 - Math.exp(-Math.max(1, speed) * dt);
  }

  _smoothRotation(obj, x = 0, y = 0, z = 0, alpha = 1) {
    if (!obj) return;
    obj.rotation.x += (x - obj.rotation.x) * alpha;
    obj.rotation.y += (y - obj.rotation.y) * alpha;
    obj.rotation.z += (z - obj.rotation.z) * alpha;
  }

  _smoothPosition(obj, x = 0, y = 0, z = 0, alpha = 1) {
    if (!obj) return;
    obj.position.x += (x - obj.position.x) * alpha;
    obj.position.y += (y - obj.position.y) * alpha;
    obj.position.z += (z - obj.position.z) * alpha;
  }

  _lockedTargetPoint(game) {
    if (!game || !game.lockedEnemy || game.lockedEnemy.dead) return null;
    const target = game.lockedEnemy.mesh.position.clone();
    target.y = game.lockedEnemy.boss ? 3.0 : 1.15;
    return target;
  }

  _nearestCombatEnemy(game, maxDist = 6.8) {
    if (!game || !game.currentWorld || !Array.isArray(game.currentWorld.enemies)) return null;
    let best = null;
    let bestScore = Infinity;
    const facingDir = this._facingVector(this.facing);
    for (const enemy of game.currentWorld.enemies) {
      if (!enemy || enemy.dead || !enemy.mesh) continue;
      const to = new THREE.Vector3().subVectors(enemy.mesh.position, this.position);
      to.y = 0;
      const dist = to.length();
      if (dist < 0.05 || dist > maxDist + (enemy.radius || 0)) continue;
      const dir = to.clone().normalize();
      const frontalBonus = Math.max(0, facingDir.dot(dir)) * 1.2;
      const threatBonus = (enemy.state === 'attack' ? 2.0 : enemy.state === 'chase' ? 1.1 : 0) + (enemy.boss ? 0.8 : 0);
      const score = dist - frontalBonus - threatBonus;
      if (score < bestScore) {
        bestScore = score;
        best = { enemy, dir, dist };
      }
    }
    return best;
  }

  _nearestCombatTarget(game, maxDist = 6.8) {
    const best = this._nearestCombatEnemy(game, maxDist);
    return best ? best.dir : null;
  }

  _updateBowFacing(game, dt) {
    if (!this.bowMode) return;
    const target = this._lockedTargetPoint(game);
    if (!target) return;
    const to = new THREE.Vector3().subVectors(target, this.position);
    to.y = 0;
    if (to.lengthSq() < 0.001) return;
    this._turnToward(Math.atan2(to.x, to.z), dt, 22);
  }

  _updateGuardFacing(game) {
    if (!Input.state.shield || !this.inventory.equipped.shield) return;
    this._guardFacing = this._resolveAimFacing(game, { allowLock: true });
    this.facing = this._guardFacing;
    this.mesh.rotation.y = this.facing;
  }

  _updateLockedFacing(game, dt) {
    if (!game || !game.lockedEnemy || game.lockedEnemy.dead || this.isAttacking || this.bowMode || Input.state.shield) return;
    if (this._inputAimVector(game)) return;
    const to = new THREE.Vector3().subVectors(game.lockedEnemy.mesh.position, this.position);
    to.y = 0;
    if (to.lengthSq() < 0.01) return;
    this._turnToward(Math.atan2(to.x, to.z), dt, 10);
  }

  // ---------- 移动 ----------
  _move(dt, game) {
    const mx = Input.state.move.x;   // 摇杆左右：+ 右
    const my = Input.state.move.y;   // 摇杆上下：+ 下（手指向屏幕下方拖）
    const auto = this._autoPathVector(game);
    const manualPower = Math.max(Input.movePower || 0, Math.min(1, Math.hypot(mx, my)));
    const useAuto = auto && manualPower < 0.08;
    let movePower = useAuto ? auto.power : manualPower;
    let moving = movePower > 0.05;

    let dir = useAuto
      ? new THREE.Vector3(auto.x, 0, auto.z)
      : (this._moveInputToWorld(mx, my, game) || new THREE.Vector3());
    this._tryCombatDodge(game);
    if (this._dodgeTimer > 0 && this._dodgeDir) {
      dir.copy(this._dodgeDir);
      movePower = 1;
      moving = true;
    }
    if (moving && dir.lengthSq() > 0.001) {
      dir.normalize();
      this.facing = this._quantizeFacing(Math.atan2(dir.x, dir.z));
    }

    // 击退
    if (this.knockback.lengthSq() > 0.01) {
      dir.add(this.knockback);
      this.knockback.multiplyScalar(0.85);
    }

    // ★ 冰冻减速：移动速度减半
    let speed = this.speed * (0.42 + 0.58 * movePower);
    if (movePower > 0.82) speed = this.runSpeed;
    const set = this.inventory && this.inventory.getSetEffects ? this.inventory.getSetEffects() : {};
    speed *= (set.speedMul || 1);
    if (this._slowTimer > 0) speed *= 0.5;
    if (this._dodgeTimer > 0) speed = Math.max(speed, 17.5);
    const terrainNow = this.world && this.world.getTerrainAt ? this.world.getTerrainAt(this.position.x, this.position.z) : null;
    this._terrainNow = terrainNow;
    if (terrainNow && terrainNow.slope) speed *= terrainNow.slope.speedMul * (set.slopeSpeedMul || 1);

    // 跳跃/滑翔/重力（用备份输入源）
    const wantJump = Input.jump || (window.__btnState && window.__btnState.jump);
    if (!wantJump) this._jumpSuppressUntilRelease = false;
    const jumpSuppressed = this._jumpSuppressTimer > 0 || this._jumpSuppressUntilRelease;
    const climbSpot = this._nearClimbSpot;
    const canClimb = climbSpot && wantJump && this.stamina > 0 && this.position.y < (climbSpot.height || 4.5);
    this.isClimbing = !!canClimb;
    if (canClimb) {
      const climbCost = 24 * (set.climbCostMul || 1);
      this.stamina = Math.max(0, this.stamina - climbCost * dt);
      this.vy = this.stamina > 0 ? 3.8 : -2.5;
      this.onGround = false;
      this.isGliding = false;
      speed *= 0.38;
      if (typeof Effects !== 'undefined' && Math.random() < dt * 5) {
        Effects.footstep(this.position.clone().setY(Math.max(0.1, this.position.y)), this.world ? this.world.name : 'grassland', 0.5);
      }
      if (this.stamina <= 0 && typeof Dialogue !== 'undefined') {
        Dialogue.show('体力耗尽，抓不住岩壁了！', 900);
      }
    } else if (wantJump && this.onGround && !jumpSuppressed) {
      this.vy = 11;
      this.onGround = false;
      this.isGliding = false;
    } else if (Input.justJump && !this.onGround && typeof ChampionSystem !== 'undefined') {
      ChampionSystem.updraft(this);
    }
    const hasGlider = QuestSystem && QuestSystem.progress && QuestSystem.progress.gotGlider;
    this.isGliding = !!(!this.isClimbing && hasGlider && wantJump && !this.onGround && this.vy < 0 && this.stamina > 0);
    if (this.isGliding) {
      this.vy = Math.max(this.vy, -2.6);
      this.stamina = Math.max(0, this.stamina - 14 * (set.glideCostMul || 1) * dt);
      if (this.stamina <= 0) this.isGliding = false;
      dir.add(this._facingVector(this.facing).multiplyScalar(0.35));
      if (typeof Effects !== 'undefined' && Math.random() < dt * 8) {
        Effects.hitBurst(this.position.clone().setY(0.7), 0xdff8ff, 2);
      }
    } else {
      this.vy += this.gravity * dt;
    }
    this.velocity.x = dir.x * speed;
    this.velocity.z = dir.z * speed;

    // 应用位移
    const next = this.position.clone();
    next.x += this.velocity.x * dt;
    next.z += this.velocity.z * dt;
    next.y += this.vy * dt;

    // 简单地面（y=0）
    if (next.y <= 0) { next.y = 0; this.vy = 0; this.onGround = true; this.isGliding = false; }

    // 碰撞检测
    if (this.world) {
      const terrain = this.world.getTerrainAt ? this.world.getTerrainAt(next.x, next.z) : null;
      const flyingOverWater = this.isGliding && next.y > 0.65;
      if (terrain && terrain.inWater && !flyingOverWater) {
        next.x = this.position.x;
        next.z = this.position.z;
        this.velocity.x = 0;
        this.velocity.z = 0;
        const now = performance.now();
        if (!this._waterWarnAt || now - this._waterWarnAt > 1200) {
          this._waterWarnAt = now;
          Dialogue.show('水流太急，找桥或浅坡过去');
        }
      } else if (terrain && terrain.slope) {
        next.y = Math.max(next.y, terrain.slope.height);
        this.onGround = true;
        this.vy = Math.max(0, this.vy);
        this._terrainNow = terrain;
      }
      this._collide(next, this.world);
      const b = this.world.bounds;
      next.x = Math.max(b.minX + 1, Math.min(b.maxX - 1, next.x));
      next.z = Math.max(b.minZ + 1, Math.min(b.maxZ - 1, next.z));
    }

    this.position.copy(next);
    this._emitFootstepFx(dt, moving, movePower);

    if (!this.isAttacking) {
      this.mesh.rotation.y = this.facing;
    }

    this._walkPhase = (this._walkPhase || 0) + (moving ? dt * (6 + movePower * 7) : 0);
  }

  _emitFootstepFx(dt, moving, movePower) {
    if (!moving || !this.onGround || this.isGliding || !this.world || typeof Effects === 'undefined') {
      this._stepFxTimer = 0;
      return;
    }
    const quality = (typeof VisualQualitySystem !== 'undefined' && VisualQualitySystem.level) || 'high';
    if (quality === 'low' && movePower < 0.82) return;
    const rate = movePower > 0.82 ? 0.18 : 0.28;
    this._stepFxTimer -= dt;
    if (this._stepFxTimer > 0) return;
    this._stepFxTimer = quality === 'medium' ? rate * 1.2 : rate;
    const offset = this._facingVector(this.facing).multiplyScalar(-0.22);
    const side = new THREE.Vector3(offset.z, 0, -offset.x).multiplyScalar(Math.sin(this._walkPhase || 0) > 0 ? 0.18 : -0.18);
    const pos = this.position.clone().add(offset).add(side);
    pos.y = Math.max(0.06, this.position.y + 0.04);
    Effects.footstep(pos, this.world.name, movePower);
  }

  _autoPathVector(game) {
    if (!game || !game.autoPath || !game.autoPath.active || !game.autoPath.target) return null;
    const target = game.autoPath.target;
    const to = new THREE.Vector3(target.x - this.position.x, 0, target.z - this.position.z);
    const dist = to.length();
    if (dist < (game.autoPath.radius || 2.2)) {
      game.autoPath.active = false;
      Dialogue.show(`已到达：${game.autoPath.label || '目标'}`);
      return null;
    }
    to.normalize();
    if (this.world && this.world.getTerrainAt) {
      const probe = this.position.clone().add(to.clone().multiplyScalar(3.0));
      const terrain = this.world.getTerrainAt(probe.x, probe.z);
      if (terrain.inWater && this.world.bridgeZones && this.world.bridgeZones.length) {
        let bestBridge = null;
        let bestScore = Infinity;
        for (const bridge of this.world.bridgeZones) {
          const dPlayer = Math.hypot(bridge.x - this.position.x, bridge.z - this.position.z);
          const dTarget = Math.hypot(bridge.x - target.x, bridge.z - target.z);
          const score = dPlayer * 1.15 + dTarget * 0.55;
          if (score < bestScore) {
            bestScore = score;
            bestBridge = bridge;
          }
        }
        if (bestBridge) {
          const bridgeDir = new THREE.Vector3(bestBridge.x - this.position.x, 0, bestBridge.z - this.position.z);
          if (bridgeDir.lengthSq() > 0.01) to.copy(bridgeDir.normalize());
          game.autoPath.via = { x: bestBridge.x, z: bestBridge.z, label: '桥' };
        }
      } else if (game.autoPath.via) {
        const viaDist = Math.hypot(game.autoPath.via.x - this.position.x, game.autoPath.via.z - this.position.z);
        if (viaDist < 3.0) game.autoPath.via = null;
      }
    }
    if (this.world && this.world.colliders) {
      const avoid = new THREE.Vector3();
      for (const obj of this.world.colliders) {
        const cr = obj.userData.collisionRadius || 0.6;
        const dx = this.position.x - obj.position.x;
        const dz = this.position.z - obj.position.z;
        const d = Math.hypot(dx, dz);
        if (d > 0.01 && d < cr + 2.4) {
          avoid.x += (dx / d) * (cr + 2.4 - d);
          avoid.z += (dz / d) * (cr + 2.4 - d);
        }
      }
      to.add(avoid.multiplyScalar(0.18)).normalize();
    }
    return { x: to.x, z: to.z, power: dist > 7 ? 1 : 0.55 };
  }

  _tryCombatDodge(game) {
    if (!Input.justJump || !this.onGround || this.isAttacking || this._dodgeTimer > 0) return false;
    const manualPower = Math.max(Input.movePower || 0, Math.min(1, Math.hypot(Input.state.move.x, Input.state.move.y)));
    const lockedEnemy = game && game.lockedEnemy && !game.lockedEnemy.dead ? game.lockedEnemy : null;
    const nearest = lockedEnemy ? null : this._nearestCombatEnemy(game, 8.5);
    const threatEnemy = lockedEnemy || (nearest && nearest.enemy) || null;
    const lockedDir = threatEnemy
      ? new THREE.Vector3().subVectors(threatEnemy.mesh.position, this.position).setY(0)
      : null;
    if (lockedDir && lockedDir.lengthSq() > 0.001) lockedDir.normalize();
    const threatDir = lockedDir || (nearest && nearest.dir) || null;
    const wantsDirectionalDodge = manualPower > 0.28;
    if (!threatDir && !wantsDirectionalDodge) return false;
    if (this.stamina < 12) {
      Dialogue.show('体力不足，无法闪避');
      return false;
    }

    let dodgeDir = wantsDirectionalDodge ? this._inputAimVector(game) : null;
    if (!dodgeDir && threatDir) dodgeDir = threatDir.clone().negate();
    if (!dodgeDir || dodgeDir.lengthSq() < 0.001) dodgeDir = this._facingVector(this.facing).negate();
    dodgeDir.y = 0;
    dodgeDir.normalize();

    this.stamina = Math.max(0, this.stamina - 12);
    this._dodgeDir = dodgeDir;
    this._dodgeTimer = 0.24;
    this._dodgeWindow = 0.34;
    this._jumpSuppressTimer = 0.24;
    this._jumpSuppressUntilRelease = true;
    this.invuln = Math.max(this.invuln, 0.04);
    if (threatDir) {
      this.facing = Math.atan2(threatDir.x, threatDir.z);
      this.mesh.rotation.y = this.facing;
    }
    if (typeof Effects !== 'undefined') Effects.dodgeAfterimage(this.position.clone());
    if (typeof AudioSystem !== 'undefined') AudioSystem.play('slash');
    const dodgeKind = this._classifyCombatDodge(dodgeDir, threatDir);
    const canFlurry = threatEnemy && dodgeKind && this._enemyInFlurryWindow(threatEnemy);
    if (canFlurry) {
      this._activateLinkTime(game, threatEnemy, dodgeKind);
    } else {
      Dialogue.showFloat(dodgeKind ? `${dodgeKind}闪避` : '闪避', this.position.clone().setY(2.1), '#66ddff');
    }
    return true;
  }

  _classifyCombatDodge(dodgeDir, threatDir) {
    if (!dodgeDir || !threatDir) return null;
    const d = dodgeDir.clone().setY(0).normalize();
    const t = threatDir.clone().setY(0).normalize();
    const dot = d.dot(t);
    const cross = d.x * t.z - d.z * t.x;
    if (dot < -0.42) return '后撤';
    if (Math.abs(cross) > 0.55 && Math.abs(dot) < 0.62) return cross > 0 ? '左横跳' : '右横跳';
    return null;
  }

  _enemyInFlurryWindow(enemy) {
    if (!enemy || enemy.dead) return false;
    if (enemy.attackPhase === 'strike') return true;
    if (enemy.attackPhase === 'recover') return true;
    if (enemy.attackPhase === 'windup') {
      const windupTime = typeof enemy._windupTime === 'function' ? enemy._windupTime() : 0.55;
      return (enemy.windup || 0) >= windupTime * 0.35;
    }
    return enemy.state === 'attack' && (enemy.hurtTimer || 0) <= 0;
  }

  _activateLinkTime(game, enemy, label = '完美') {
    this._flurryRushReady = 1.45;
    this._flurryRushTarget = enemy;
    this._flurryTimer = Math.max(this._flurryTimer || 0, 2.2);
    this.invuln = Math.max(this.invuln, 0.85);
    if (game && typeof game.triggerLinkTime === 'function') game.triggerLinkTime(1.45);
    if (enemy && !enemy.dead) {
      enemy.hurtTimer = Math.max(enemy.hurtTimer || 0, 1.0);
    }
    Dialogue.showFloat(`${label}！林克时间`, this.position.clone().setY(2.55), '#66ddff');
    if (typeof Effects !== 'undefined') {
      Effects.dodgeAfterimage(this.position.clone());
      Effects.hitBurst(this.position.clone().setY(1.15), 0x66ddff, 10);
    }
    if (typeof AudioSystem !== 'undefined') AudioSystem.play('power');
  }

  _performFlurryRush(game) {
    const target = this._flurryRushTarget;
    if (this._flurryRushReady <= 0 || !target || target.dead || !target.mesh) return false;
    const toTarget = new THREE.Vector3().subVectors(target.mesh.position, this.position);
    toTarget.y = 0;
    if (toTarget.lengthSq() < 0.001) toTarget.copy(this._facingVector(this.facing));
    const dir = toTarget.normalize();
    const stopDist = Math.max(1.15, (target.radius || 0.8) + 1.05);
    const next = target.mesh.position.clone().add(dir.clone().multiplyScalar(-stopDist));
    next.y = this.position.y;
    if (this.world && this.world.bounds) {
      const b = this.world.bounds;
      next.x = Math.max(b.minX + 1, Math.min(b.maxX - 1, next.x));
      next.z = Math.max(b.minZ + 1, Math.min(b.maxZ - 1, next.z));
    }
    this.position.copy(next);
    this.facing = Math.atan2(dir.x, dir.z);
    this.mesh.rotation.y = this.facing;
    this._flurryRushReady = 0;
    this._flurryRushTarget = null;
    this._flurryTimer = Math.max(this._flurryTimer || 0, 2.4);
    this.invuln = Math.max(this.invuln, 0.75);
    if (game && typeof game.triggerLinkTime === 'function') game.triggerLinkTime(0.55);
    if (typeof Effects !== 'undefined') {
      Effects.dodgeAfterimage(this.position.clone());
      Effects.hitBurst(target.mesh.position.clone().setY(1.2), 0x66ddff, 14);
    }
    Dialogue.showFloat('突袭！', target.mesh.position.clone().setY(2.35), '#66ddff');
    if (!this.isAttacking) this._startAttack(game);
    return true;
  }

  // ---------- 简易圆形碰撞 ----------
  _collide(next, world) {
    const r = 0.5;
    for (const obj of world.colliders) {
      const cx = obj.position.x, cz = obj.position.z;
      const cr = obj.userData.collisionRadius || 0.6;
      const dx = next.x - cx, dz = next.z - cz;
      const dist = Math.hypot(dx, dz);
      const minDist = r + cr;
      if (dist < minDist && dist > 0.0001) {
        const push = (minDist - dist);
        next.x += (dx / dist) * push;
        next.z += (dz / dist) * push;
      }
    }
  }

  // ---------- 走路/待机动画 ----------
  _animate(dt) {
    const p = this.mesh.userData.parts;
    if (!p) return;
    const movePower = Math.max(Input.movePower || 0, Math.min(1, Math.hypot(Input.state.move.x, Input.state.move.y)));
    const moving = movePower > 0.05;
    const swing = Math.sin(this._walkPhase || 0) * (moving ? (0.22 + movePower * 0.36) : 0);
    this._posePhase += dt * (moving ? 7.5 : 2.2);
    const breath = Math.sin(this._posePhase) * 0.025;
    const runBob = moving ? Math.abs(Math.sin(this._walkPhase || 0)) * 0.055 * movePower : breath * 0.55;
    const setBaseY = (obj) => {
      if (!obj) return;
      if (obj.userData.baseY === undefined) obj.userData.baseY = obj.position.y;
    };
    [p.body, p.head, p.armL, p.armR].forEach(setBaseY);
    if (p.body) p.body.position.y = p.body.userData.baseY + runBob * 0.55;
    if (p.head) p.head.position.y = p.head.userData.baseY + runBob * 0.75;
    if (p.armL) p.armL.position.y = p.armL.userData.baseY + runBob * 0.45;
    if (p.armR) p.armR.position.y = p.armR.userData.baseY + runBob * 0.45;
    const poseAlpha = this._poseAlpha(dt, this.isGliding ? 16 : 13);
    // ★ 防御姿态：按住盾牌时左臂（持盾臂）抬起举盾
    const shielding = Input.state.shield && this.inventory.equipped.shield;
    if (!this.isAttacking) {
      const bowPose = this.bowMode && this.inventory.equipped.bow;
      const glidePose = this.isGliding;
      const bodyLean = glidePose ? 0.2 : bowPose ? -0.05 : moving ? -0.035 * movePower : breath;
      const slopeLean = this._terrainNow && this._terrainNow.slope ? -0.16 : 0;
      const bodyRoll = glidePose ? Math.sin(this._glidePhase * 0.7) * 0.035 : 0;
      this._smoothRotation(p.body, bodyLean + slopeLean, 0, bodyRoll, poseAlpha);
      this._smoothRotation(p.head, glidePose ? -0.08 : bowPose ? -0.05 : 0, 0, 0, poseAlpha);
      if (shielding) {
        this._smoothRotation(p.armL, -1.55, 0.04, -0.48, poseAlpha);
        this._smoothRotation(p.armR, -0.18, 0, 0.1, poseAlpha);
      } else if (bowPose) {
        this._smoothRotation(p.armL, -0.8, 0.12, -0.42, poseAlpha);
        this._smoothRotation(p.armR, -1.18, -0.08, 0.32, poseAlpha);
      } else if (glidePose) {
        this._smoothRotation(p.armL, -1.15, 0.08, -0.72, poseAlpha);
        this._smoothRotation(p.armR, -1.15, -0.08, 0.72, poseAlpha);
      } else {
        this._smoothRotation(p.armL, swing, 0, 0, poseAlpha);
        this._smoothRotation(p.armR, -swing, 0, 0, poseAlpha);
      }
      const legLift = glidePose ? -0.35 : 0;
      this._smoothRotation(p.legL, glidePose ? legLift : -swing, 0, glidePose ? -0.12 : 0, poseAlpha);
      this._smoothRotation(p.legR, glidePose ? legLift : swing, 0, glidePose ? 0.12 : 0, poseAlpha);
    }
    // 盾牌模型跟随防御姿态
    if (this._shieldMesh) {
      const shieldAlpha = this._poseAlpha(dt, 18);
      if (shielding) {
        this._smoothPosition(this._shieldMesh, 0, 1.32, 0.5, shieldAlpha);
        this._smoothRotation(this._shieldMesh, -0.08, 0, 0, shieldAlpha);
      } else {
        this._smoothPosition(this._shieldMesh, -0.18, 1.25, -0.34, shieldAlpha);
        this._smoothRotation(this._shieldMesh, -0.22, 0, 0.18, shieldAlpha);
      }
    }
    if (this._bowMesh) {
      const bowAlpha = this._poseAlpha(dt, 16);
      if (this.bowMode) {
        this._smoothPosition(this._bowMesh, 0.42, 1.22, 0.24, bowAlpha);
        this._smoothRotation(this._bowMesh, -0.15, 0.25, -0.25, bowAlpha);
      } else {
        this._smoothPosition(this._bowMesh, 0.26, 1.14, -0.42, bowAlpha);
        this._smoothRotation(this._bowMesh, -0.25, 0.2, -0.45, bowAlpha);
      }
    }
    if (this._weaponMesh && !this.isAttacking) {
      const weaponAlpha = this._poseAlpha(dt, 15);
      if (this.bowMode) {
        this._smoothPosition(this._weaponMesh, 0.18, 1.1, -0.42, weaponAlpha);
        this._smoothRotation(this._weaponMesh, -0.28, 0.16, -0.52, weaponAlpha);
      } else {
        this._smoothPosition(this._weaponMesh, 0.45, 1.0, 0.1, weaponAlpha);
        this._smoothRotation(this._weaponMesh, 0, 0, -0.5, weaponAlpha);
      }
    }
    if (this._gliderMesh) {
      this._gliderMesh.visible = !!this.isGliding;
      if (this.isGliding) {
        this._glidePhase += dt * 6;
        const bob = Math.sin(this._glidePhase) * 0.035;
        this._smoothPosition(this._gliderMesh, 0, bob, 0, this._poseAlpha(dt, 18));
        const canopy = this._gliderMesh.userData.parts && this._gliderMesh.userData.parts.canopy;
        if (canopy) canopy.rotation.z = Math.sin(this._glidePhase * 0.7) * 0.035;
      }
    }
    // 闪烁（受击）
    this.mesh.visible = !(this.invuln > 0 && Math.floor(this.invuln * 12) % 2 === 0);
  }

  // ---------- 攻击 ----------
  _handleAttack(dt, game) {
    // ★ 备份输入源：直接读 window.__btnState（防 Input 没传到）
    const btnAttack = (window.__btnState && window.__btnState.attack) || Input.state.attack || false;
    const btnJump = (window.__btnState && window.__btnState.jump) || Input.state.jump || false;
    Input.state.attack = btnAttack;
    Input.state.jump = btnJump;

    if (this.isAttacking) {
      this.attackTimer += dt;
      // ★ 修正攻击动画：左臂静止，右臂做从右上到左下的弧线劈砍
      const t = this.attackTimer / this.attackDuration;
      const p = this.mesh.userData.parts;
      if (p) {
        // 左臂保持自然姿态（攻击时不动，避免"左边在攻击"的错觉）
        if (p.armL) { p.armL.rotation.x = 0.08; p.armL.rotation.y = 0; p.armL.rotation.z = 0.08; }
        if (p.body) {
          const twist = Math.sin(t * Math.PI) * (this.comboStep === 1 ? 0.22 : this.comboStep === 2 ? -0.26 : 0.16);
          p.body.rotation.y = twist;
          p.body.rotation.x = -0.05 + Math.sin(t * Math.PI) * 0.08;
        }
        if (p.head) p.head.rotation.y = p.body ? p.body.rotation.y * 0.35 : 0;
        // 右臂劈砍：三段连招略有不同，避免每刀完全一样
        if (p.armR) {
          const swing = Math.sin(t * Math.PI);  // 0→1→0 的弧线
          const comboSide = this.comboStep === 1 ? 1 : this.comboStep === 2 ? -1 : 0.55;
          p.armR.rotation.z = -1.35 * (1 - swing) + comboSide * 0.28 * swing;
          p.armR.rotation.x = -1.45 * swing - (this.comboStep === 2 ? 0.18 : 0);
          p.armR.rotation.y = comboSide * 0.16 * swing;
        }
      }
      // 剑跟随右手劈砍轨迹
      if (this._weaponMesh) {
        const swing = Math.sin(t * Math.PI);
        const comboSide = this.comboStep === 1 ? 0.35 : this.comboStep === 2 ? -0.42 : 0;
        this._weaponMesh.position.set(0.45 + comboSide * swing, 1.0 + 0.08 * swing, 0.1 + 0.12 * swing);
        this._weaponMesh.rotation.z = -0.5 - 1.15 * swing + comboSide;
        this._weaponMesh.rotation.x = -0.95 * swing;
      }
      const profile = this._attackProfile || this._weaponProfile(this.inventory.equipped.weapon);
      const activeStart = profile.activeStart ?? 0.28;
      const activeEnd = profile.activeEnd ?? 0.64;
      // 只在武器有效帧造成一次伤害：起手/收招不再误伤
      if (!this.attackHit && t >= activeStart && t <= activeEnd) {
        this._doMeleeDamage(game);
        this.attackHit = true;
      }
      if (Input.justAttack && t > 0.45) {
        this.attackQueued = true;
      }
      if (this.attackTimer >= this.attackDuration) {
        this.isAttacking = false;
        this.attackTimer = 0;
        // 攻击结束后重置手臂姿态
        if (p && p.armR) { p.armR.rotation.z = 0; p.armR.rotation.x = 0; }
        if (p && p.body) { p.body.rotation.y = 0; p.body.rotation.x = 0; }
        if (p && p.head) { p.head.rotation.y = 0; }
        if (this.attackQueued && this.inventory.equipped.weapon) {
          this.attackQueued = false;
          this._startAttack(game);
        } else {
          this.attackQueued = false;
          this.comboStep = 0;
        }
      }
      return;
    }
    // 触发新攻击
    if (Input.justAttack) {
      if (this._tryShieldCounter(game)) return;
      if (this.bowMode && this.inventory.equipped.bow && this.inventory.arrows > 0) {
        this._shootArrow(game);
      } else if (this.inventory.equipped.weapon) {
        this._startAttack(game);
      } else if (this.inventory.equipped.bow && this.inventory.arrows > 0) {
        this.setBowMode(true);
        this._shootArrow(game);
      } else {
        // 空手也可挥（伤害低）
        this._startAttack(game);
      }
    }
  }

  _handleEquipCycle(game) {
    if (Input.justWeaponCycle) {
      const stack = this.inventory.cycleEquip('weapon', 1);
      this.setBowMode(false);
      this.refreshEquipment();
      Dialogue.show(stack ? `切换近战武器：${stack.def.name}` : '切换为近战模式：没有可切换的近战武器');
    }
    if (Input.justBowCycle) {
      const stack = this.inventory.cycleEquip('bow', 1);
      const active = this.setBowMode(!!stack);
      this.refreshEquipment();
      if (!stack) Dialogue.show('没有可切换的弓');
      else if (!active) Dialogue.show(`切换弓：${stack.def.name}，但没有箭矢`);
      else Dialogue.show(`切换弓箭：${stack.def.name}`);
    }
  }

  _handleQuickParry(game) {
    if (!this.inventory.equipped.shield) {
      Dialogue.show('没有装备盾牌，无法盾反');
      return false;
    }
    this._perfectGuardTimer = Math.max(this._perfectGuardTimer || 0, 0.18);
    this._guardFacing = this._resolveAimFacing(game, { allowLock: true });
    this.facing = this._guardFacing;
    this.mesh.rotation.y = this.facing;
    if (this._shieldCounterWindow > 0) {
      return this._tryShieldCounter(game);
    }
    const now = performance.now();
    if (!this._quickParryHintAt || now - this._quickParryHintAt > 900) {
      this._quickParryHintAt = now;
      Dialogue.showFloat('松手判定！', this.position.clone().setY(2.25), '#c8f6ff');
    }
    return false;
  }

  _tryShieldCounter(game) {
    const releaseParry = Input.justParry || this._perfectGuardTimer > 0;
    if ((!Input.state.shield && !releaseParry) || !this.inventory.equipped.shield || this._shieldCounterWindow <= 0) return false;
    if (this.stamina < 18) {
      Dialogue.show('体力不足，盾反失败');
      return false;
    }
    const shield = this.inventory.equipped.shield;
    this.stamina -= 18;
    this.inventory.damageShield(2);
    const weapon = this.inventory.equipped.weapon;
    const base = weapon ? Math.max(1, weapon.def.atk || 1) : Math.max(4, shield.def.def || 1);
    const set = this.inventory && this.inventory.getSetEffects ? this.inventory.getSetEffects() : {};
    const dmg = base * 3 * (set.counterAtkMul || 1);
    const dir = this._shieldCounterDir && this._shieldCounterDir.lengthSq() > 0.001
      ? this._shieldCounterDir.clone().normalize()
      : this._facingVector(this.facing);
    let hit = 0;
    for (const enemy of game.currentWorld.enemies) {
      if (enemy.dead) continue;
      const to = new THREE.Vector3().subVectors(enemy.mesh.position, this.position);
      to.y = 0;
      const dist = to.length();
      if (dist > 3.4 + enemy.radius) continue;
      const toward = dist > 0.001 ? to.clone().normalize() : dir.clone();
      if (toward.dot(dir) > 0.15 || dist < 1.4) {
        enemy.takeDamage(dmg, toward.multiplyScalar(3.2), 'shock');
        enemy.hurtTimer = Math.max(enemy.hurtTimer || 0, 0.7);
        hit++;
      }
    }
    this._shieldCounterWindow = 0;
    this.invuln = Math.max(this.invuln, 0.45);
    Dialogue.showFloat(`盾反！-${Math.round(dmg)}`, this.position.clone().add(dir.clone().multiplyScalar(1.1)).setY(2.2), '#ffe16a');
    if (typeof Effects !== 'undefined') Effects.parrySpark(this.position.clone().add(dir.multiplyScalar(0.9)).setY(1.2));
    if (typeof AudioSystem !== 'undefined') AudioSystem.play('power');
    return true;
  }

  _weaponProfile(weapon) {
    if (!weapon) return { range: 1.75, angle: 0.72, duration: 0.28, activeStart: 0.24, activeEnd: 0.55, damageMul: 1, knock: 1.4, hitStop: 0.035 };
    const subtype = weapon.def.subtype;
    const id = weapon.itemId || '';
    if (subtype === 'spear' || id.toLowerCase().includes('spear') || id.toLowerCase().includes('halberd')) {
      return { range: 3.65, angle: 0.38, duration: 0.34, activeStart: 0.18, activeEnd: 0.46, damageMul: 0.95, knock: 2.0, hitStop: 0.045 };
    }
    if (id === 'bokoClub' || id.toLowerCase().includes('club')) {
      return { range: 2.62, angle: 0.8, duration: 0.48, activeStart: 0.34, activeEnd: 0.70, damageMul: 1.16, knock: 2.6, hitStop: 0.065 };
    }
    if (id === 'masterSword') {
      return { range: 3.05, angle: 0.72, duration: 0.32, activeStart: 0.24, activeEnd: 0.58, damageMul: 1.0, knock: 2.15, hitStop: 0.06 };
    }
    if (id.toLowerCase().includes('royal')) {
      return { range: 3.05, angle: 0.72, duration: 0.32, activeStart: 0.24, activeEnd: 0.58, damageMul: 1.08, knock: 2.15, hitStop: 0.06 };
    }
    return { range: 2.78, angle: 0.68, duration: 0.34, activeStart: 0.26, activeEnd: 0.62, damageMul: 1, knock: 1.9, hitStop: 0.05 };
  }

  _masterSwordAwakenedAgainst(enemy) {
    if (!enemy) return false;
    const typeId = enemy.typeId || '';
    return !!(
      enemy.boss ||
      enemy.finalBoss ||
      typeId.includes('guardian') ||
      /灾厄|盖侬|咒|守护者/.test((enemy.def && enemy.def.name) || '')
    );
  }

  _startAttack(game) {
    const weapon = this.inventory.equipped.weapon;
    const profile = this._weaponProfile(weapon);
    const attackFacing = this._resolveAimFacing(game, { allowLock: true });
    this.facing = attackFacing;
    this.isAttacking = true;
    this.attackTimer = 0;
    this.attackHit = false;
    this.attackQueued = false;
    this.comboStep = (this.comboStep + 1) % 3;
    this.attackDuration = profile.duration * (this.comboStep === 2 ? 1.15 : 1);
    this._attackProfile = profile;
    this._attackFacing = attackFacing;
    this.mesh.rotation.y = this.facing;
    if (typeof AudioSystem !== 'undefined') AudioSystem.play('slash');
  }

  _doMeleeDamage(game) {
    const weapon = this.inventory.equipped.weapon;
    const profile = this._attackProfile || this._weaponProfile(weapon);
    const set = this.inventory && this.inventory.getSetEffects ? this.inventory.getSetEffects() : {};
    let dmg = Math.max(1, Math.round((weapon ? weapon.def.atk : 1) * profile.damageMul));
    if (this._flurryTimer > 0) dmg = Math.round(dmg * 1.8);
    if (set.meleeAtkMul) dmg = Math.round(dmg * set.meleeAtkMul);
    if (weapon && weapon.itemId && weapon.itemId.startsWith('ancient') && set.ancientAtkMul) {
      dmg = Math.round(dmg * set.ancientAtkMul);
    }
    const isSpear = profile.angle < 0.45;
    const range = profile.range;
    // ★ 用出招瞬间的朝向（快照），而非当前 facing
    const f = (this._attackFacing !== undefined) ? this._attackFacing : this.facing;
    // ★ 武器专属特效颜色
    const weaponElement = weapon && weapon.def.element;
    const isMaster = weapon && weapon.itemId === 'masterSword';
    const isAncient = weapon && weapon.itemId.startsWith('ancient');
    const slashColor = isMaster ? 0xffd700
                     : weaponElement === 'fire' ? 0xff6622
                     : weaponElement === 'ice' ? 0x66ddff
                     : weaponElement === 'shock' ? 0xffee44
                     : isAncient ? 0x66ddcc
                     : 0xfff4b0;
    // 挥砍弧光特效（大师剑+长枪特效差异化）
    const forward = this._facingVector(f);
    Effects.slashArc(this.position, f, slashColor);
    // ★ 大师剑：额外金色光波（更大的二次弧光）
    if (isMaster && typeof Effects !== 'undefined') {
      Effects.slashArc(this.position, f, 0xffffff);
      Effects.hitBurst(this.mesh.position.clone().add(
        forward.clone().multiplyScalar(1.5)
      ).setY(1.2), 0xffd700, 8);
    }
    // ★ 长枪突刺特效：前方直线冲击波
    if (isSpear && typeof Effects !== 'undefined') {
      const tip = this.position.clone().add(forward.clone().multiplyScalar(range));
      tip.y = 0.1;
      Effects.enemyWindup(tip, weaponElement);  // 复用地面圈特效做突刺冲击
    }
    let hitAny = false;
    for (const enemy of game.currentWorld.enemies) {
      if (enemy.dead) continue;
      const to = new THREE.Vector3().subVectors(enemy.mesh.position, this.position);
      to.y = 0;
      const dist = to.length();
      if (dist > range + enemy.radius) continue;
      to.normalize();
      // ★ 贴脸保护：极近距离无视朝向直接命中（防卡进敌人死角打不到）
      const inFacing = to.dot(forward) > profile.angle;
      const pointBlank = dist < 0.8;
      if (inFacing || pointBlank) {
        let finalDmg = dmg;
        if (isMaster && this._masterSwordAwakenedAgainst(enemy)) {
          finalDmg = Math.max(finalDmg, 60);
        }
        if (set.stalAtkMul && (enemy.typeId === 'stal' || (enemy.def && /骷髅|灾厄|咒/.test(enemy.def.name)))) {
          finalDmg = Math.round(finalDmg * set.stalAtkMul);
        }
        if (set.sneakAtkMul && enemy.state !== 'chase' && enemy.state !== 'attack') {
          finalDmg = Math.round(finalDmg * set.sneakAtkMul);
        }
        if (this._campStealthBonus && enemy.state !== 'attack') {
          finalDmg = Math.round(finalDmg * this._campStealthBonus);
          this._campStealthBonus = 0;
          Dialogue.showFloat('营地突袭！-' + Math.round(finalDmg), enemy.mesh.position.clone().setY(2.35), '#9fffb4');
        }
        if (typeof ExplorationSystem !== 'undefined' && ExplorationSystem.modifyPlayerHit) {
          finalDmg = ExplorationSystem.modifyPlayerHit(this, enemy, finalDmg, weapon, weaponElement);
        }
        // ★ 元素武器传递元素伤害（触发敌人的元素克制 + 给敌人附加元素效果）
        enemy.takeDamage(finalDmg, forward.clone().multiplyScalar(profile.knock), weaponElement);
        if (typeof ExplorationSystem !== 'undefined') {
          ExplorationSystem.applyWeaponEcologyOnHit(this, enemy, weaponElement);
        }
        if (!enemy.dead) enemy.hurtTimer = Math.max(enemy.hurtTimer || 0, profile.hitStop ? 0.32 : 0.25);
        if (weaponElement && typeof enemy._applyElementEffect === 'function' && !enemy.dead) {
          enemy._applyElementEffect(enemy, weaponElement); // 元素武器点燃/冻结/麻痹敌人
        }
        if (weapon) this.inventory.damageWeapon(1);
        // ★ 命中特效按武器类型差异化
        const burstColor = this._flurryTimer > 0 ? 0x66ddff
                         : weaponElement === 'fire' ? 0xff4422
                         : weaponElement === 'ice' ? 0x66ddff
                         : weaponElement === 'shock' ? 0xffee44
                         : isMaster ? 0xffd700
                         : enemy.boss ? 0xff8800 : 0xffaa44;
        Effects.hitBurst(enemy.mesh.position.clone().setY(1.2), burstColor, isMaster ? 14 : 10);
        if (typeof AudioSystem !== 'undefined') AudioSystem.play('hit');
        this._hitStop = isMaster ? 0.085 : (profile.hitStop || 0.045);
        if (this._flurryTimer > 0) {
          Dialogue.showFloat(`突袭反击！-${Math.round(finalDmg)}`, enemy.mesh.position.clone().setY(2.2), '#66ddff');
          this._flurryTimer = Math.max(0, this._flurryTimer - 0.45);
        }
        if (typeof CameraPolishSystem !== 'undefined') CameraPolishSystem.bump(isMaster ? 0.52 : 0.28);
        hitAny = true;
      }
    }
    if (hitAny && typeof ChampionSystem !== 'undefined') {
      ChampionSystem.thunderBurst(this, game, this.position);
    }
    // 击碎附近可破坏物
    if (game.currentWorld.breakables) {
      for (const b of game.currentWorld.breakables) {
        if (b.broken) continue;
        const to = new THREE.Vector3().subVectors(b.mesh.position, this.position);
        to.y = 0;
        if (to.length() < range + 0.5) {
          b.break_open(game);
          Effects.hitBurst(b.mesh.position.clone().setY(0.6), 0xffd54f, 6);
        }
      }
    }
  }

  _shootArrow(game) {
    const bow = this.inventory.equipped.bow;
    const availableTypes = this.getAvailableArrowTypes();
    if (!availableTypes.includes(this.selectedArrowType)) this.selectedArrowType = 'normal';
    let arrowType = this.selectedArrowType;
    if (bow && bow.itemId === 'fireBow' && arrowType === 'normal') arrowType = 'fire';
    else if (bow && bow.itemId === 'iceBow' && arrowType === 'normal') arrowType = 'ice';
    else if (bow && bow.itemId === 'shockBow' && arrowType === 'normal') arrowType = 'shock';

    const arrow = AssetFactory.createArrow();
    // ★ 按箭种染色 + 加发光
    const arrowColor = { fire: 0xff4422, ice: 0x66ddff, shock: 0xffee44, ancient: 0x66ddcc, piercing: 0xd4af37, normal: 0xddaa55 }[arrowType];
    arrow.material = new THREE.MeshBasicMaterial({ color: arrowColor });
    arrow.material2 = arrow.material; // 兼容 createArrow 内部引用
    if (arrow.children && arrow.children[0]) {
      arrow.children[0].material = arrow.material;
    }
    // 元素箭加尾迹粒子源（用 emissive 球点在箭尖，由 BaseScene._updateProjectiles 推进时生成）
    if (arrowType !== 'normal') {
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 6, 5),
        new THREE.MeshBasicMaterial({ color: arrowColor })
      );
      glow.position.z = 0.3;
      arrow.add(glow);
    }
    arrow.position.copy(this.position);
    arrow.position.y = 1.2;
    // 锁定射击用精确目标点，不再量化到 8 向，避免远距离擦身打空。
    const targetPoint = this._lockedTargetPoint(game);
    let dir;
    if (targetPoint) {
      dir = new THREE.Vector3().subVectors(targetPoint, arrow.position).normalize();
      this.facing = Math.atan2(dir.x, dir.z);
    } else {
      const shootFacing = this._resolveAimFacing(game, { allowLock: true });
      dir = this._facingVector(shootFacing);
      this.facing = shootFacing;
    }
    this.mesh.rotation.y = this.facing;
    arrow.lookAt(arrow.position.clone().add(dir));
    // ★ 古代弓/穿透弓速度更快、伤害更高
    const speed = arrowType === 'ancient' ? 38 : arrowType === 'piercing' ? 34 : 28;
    const dmgMul = arrowType === 'ancient' ? 1.5 : arrowType === 'piercing' ? 1.3 : 1.0;
    arrow.userData.velocity = dir.multiplyScalar(speed);
    const set = this.inventory && this.inventory.getSetEffects ? this.inventory.getSetEffects() : {};
    let arrowDmg = Math.round(bow.def.atk * dmgMul * (set.bowAtkMul || 1));
    if (bow.itemId === 'ancientBow' && set.ancientAtkMul) arrowDmg = Math.round(arrowDmg * set.ancientAtkMul);
    arrow.userData.damage = arrowDmg;
    arrow.userData.life = 2.5;
    arrow.userData.arrowType = arrowType;
    arrow.userData.fromPlayer = true;
    game.currentWorld.scene.add(arrow);
    game.currentWorld.projectiles.push(arrow);
    if (typeof AudioSystem !== 'undefined') AudioSystem.play('slash');
    this.inventory.arrows -= 1;
    this.inventory.damageBow(1);
    if (this.inventory.arrows <= 0 || !this.inventory.equipped.bow) {
      this.setBowMode(false);
    }
    // 射击特效：元素箭在玩家位置产生彩色闪光
    if (arrowType !== 'normal' && typeof Effects !== 'undefined') {
      Effects.hitBurst(this.position.clone().setY(1.2), arrowColor, 5);
    }
  }

  // ---------- 受伤 ----------
  takeDamage(amount, fromDir, element = null) {
    if (this.invuln > 0) return 'ignored';
    const set = this.inventory && this.inventory.getSetEffects ? this.inventory.getSetEffects() : {};
    if (set.guardianDamageMul && this._lastAttacker && ['guardian', 'guardianStalker', 'guardianSkywatcher'].includes(this._lastAttacker.typeId)) {
      amount *= set.guardianDamageMul;
    }
    if (set.fireDamageMul && this._lastAttacker && this._lastAttacker.element === 'fire') {
      amount *= set.fireDamageMul;
    }
    const equippedWeapon = this.inventory && this.inventory.equipped ? this.inventory.equipped.weapon : null;
    const equippedShield = this.inventory && this.inventory.equipped ? this.inventory.equipped.shield : null;
    if (element === 'shock' && typeof ExplorationSystem !== 'undefined') {
      const metalWeapon = equippedWeapon && ExplorationSystem.isMetal(equippedWeapon.itemId);
      const metalShield = equippedShield && ExplorationSystem.isMetal(equippedShield.itemId);
      if (metalWeapon || metalShield) {
        amount *= 1.35;
        Dialogue.showFloat('金属装备导电！', this.position.clone().setY(2.35), '#ffee66');
      }
    }
    if (element === 'fire' && equippedShield && typeof ExplorationSystem !== 'undefined' && ExplorationSystem.isWood(equippedShield.itemId)) {
      this.inventory.damageShield(Input.state.shield ? 3 : 1);
      Dialogue.showFloat('木盾被火焰灼烧！', this.position.clone().setY(2.25), '#ff8844');
    }
    const shieldFacing = this._guardFacing !== undefined ? this._guardFacing : this.facing;
    const shieldDir = this._facingVector(shieldFacing);
    const incomingDir = fromDir && fromDir.lengthSq && fromDir.lengthSq() > 0.001
      ? fromDir.clone().setY(0).normalize()
      : null;
    // 英杰能力：达尔克尔之护会在强击时自动展开，给孩子更多容错
    if (typeof ChampionSystem !== 'undefined' && amount >= 8) {
      const guarded = ChampionSystem.guard(this, amount);
      if (guarded !== null) amount = guarded;
    }

    // ★ 盾反：先举盾，松开盾反按钮后的极短窗口内被攻击 + 面向攻击者
    if (this._perfectGuardTimer > 0 && this.inventory.equipped.shield) {
      const facing = shieldDir;
      if (incomingDir && facing.dot(incomingDir.clone().negate()) > 0.7) {
        // 完美格挡！完全免伤 + 特效
        Dialogue.showFloat('⚡ 盾反成功！', this.mesh.position.clone().setY(2.5), '#ffd700');
        if (typeof Effects !== 'undefined') Effects.parrySpark(this.mesh.position.clone().add(facing.clone().multiplyScalar(0.8)).setY(1.2));
        this.invuln = 0.5;
        this._perfectGuardTimer = 0;
        if (this.inventory && this.inventory.damageShield) this.inventory.damageShield(1);
        // 弹反推开攻击者（如果有 lockedEnemy）
        if (this._lastAttacker && !this._lastAttacker.dead) {
          this._lastAttacker.hurtTimer = 0.8;  // 敌人硬直
          this._lastAttacker.knockback = facing.clone().multiplyScalar(4);
        }
        HUD.flashDamage();
        return 'parried';
      }
    }
    // 普通格挡：持续按住盾牌
    if (Input.state.shield && this.inventory.equipped.shield) {
      const shield = this.inventory.equipped.shield;
      const facing = shieldDir;
      if (incomingDir && facing.dot(incomingDir.clone().negate()) > 0.45) {
        const reduced = Math.max(0, amount - shield.def.def);
        this.hp -= reduced;
        this.inventory.damageShield(1);
        this._shieldCounterWindow = 0.42;
        this._shieldCounterDir = incomingDir.clone().negate();
        Dialogue.show(`格挡！继续按住“盾反”，看准下一击松开可反击`);
        this.invuln = 0.4;
        HUD.flashDamage();
        return reduced > 0 ? 'blocked-damaged' : 'blocked';
      }
    }
    // ★ 完美闪避（林克时间）：正在移动时被命中 → 触发短暂无敌 + 蓝色残影
    const moving = Math.abs(Input.state.move.x) > 0.3 || Math.abs(Input.state.move.y) > 0.3 || this._dodgeTimer > 0;
    if (moving && this._dodgeWindow > 0) {
      // 在闪避窗口内，算完美闪避
      this.invuln = 1.0;
      this._flurryTimer = 2.2;
      Dialogue.showFloat('✨ 林克时间！', this.mesh.position.clone().setY(2.5), '#66ddff');
      if (typeof Effects !== 'undefined') Effects.dodgeAfterimage(this.mesh.position.clone());
      if (this._lastAttacker && !this._lastAttacker.dead) {
        this._lastAttacker.hurtTimer = Math.max(this._lastAttacker.hurtTimer || 0, 1.0);
      }
      HUD.flashDamage();
      return 'dodged';
    }
    this.hp -= amount;
    if (typeof AudioSystem !== 'undefined') AudioSystem.play('hit');
    if (typeof CameraPolishSystem !== 'undefined') CameraPolishSystem.bump(Math.min(0.85, 0.25 + amount * 0.025));
    this.invuln = 0.8;
    if (incomingDir) this.knockback.copy(incomingDir).multiplyScalar(6);
    HUD.flashDamage();   // 受击红屏 + 屏震
    if (this.hp <= 0) {
      if (typeof ChampionSystem !== 'undefined' && ChampionSystem.revive(this)) {
        return 'hit';
      }
      if (window.game && window.game.respawnPlayer) {
        window.game.respawnPlayer();
        return 'hit';
      }
      this.hp = 1;
    }
    return 'hit';
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp * 4, this.hp + amount);
  }

  // ---------- 相机跟随 ----------
  _updateCamera(game, dt = 1 / 60) {
    if (typeof CameraPolishSystem !== 'undefined' && CameraPolishSystem.update(dt, game, this)) {
      return;
    }
    const target = this.position.clone();
    const dist = Input.cameraDistance || 11;
    const height = dist * 0.8;
    let camPos;
    if (game.lockedEnemy && !game.lockedEnemy.dead) {
      const toEnemy = new THREE.Vector3().subVectors(game.lockedEnemy.mesh.position, target);
      toEnemy.y = 0; toEnemy.normalize();
      camPos = target.clone().add(toEnemy.clone().multiplyScalar(-dist * 0.7)).add(new THREE.Vector3(0, height * 0.85, 0));
    } else {
      camPos = target.clone().add(new THREE.Vector3(0, height, dist));
    }
    game.camera.position.lerp(camPos, 0.12);
    game.camera.lookAt(target.x, target.y + 1.2, target.z);
  }
}
