/* ========================================================
   CombatResolver.js — 轻量战斗判定与伤害公式集中层
   - 不引入物理引擎；只做浏览器友好的 2D 平面数学判定
   - 让近战、弓箭、盾防共用同一套可测试规则
   ======================================================== */

const CombatResolver = {
  clamp(v, min, max) {
    return Math.max(min, Math.min(max, Number(v) || 0));
  },

  facingVector(facing = 0) {
    return { x: Math.sin(facing), z: Math.cos(facing) };
  },

  pointToSegmentDistance2D(point, a, b) {
    const px = point.x || 0;
    const pz = point.z || 0;
    const ax = a.x || 0;
    const az = a.z || 0;
    const bx = b.x || 0;
    const bz = b.z || 0;
    const abx = bx - ax;
    const abz = bz - az;
    const lenSq = abx * abx + abz * abz;
    if (lenSq <= 0.000001) return Math.hypot(px - ax, pz - az);
    const t = this.clamp(((px - ax) * abx + (pz - az) * abz) / lenSq, 0, 1);
    return Math.hypot(px - (ax + abx * t), pz - (az + abz * t));
  },

  isPlayerMeleeHit({ playerPosition, enemyPosition, enemyRadius = 0.6, facing = 0, profile = {} }) {
    if (!playerPosition || !enemyPosition) return { hit: false, reason: 'missing-position' };
    const px = playerPosition.x || 0;
    const pz = playerPosition.z || 0;
    const ex = enemyPosition.x || 0;
    const ez = enemyPosition.z || 0;
    const dx = ex - px;
    const dz = ez - pz;
    const dist = Math.hypot(dx, dz);
    const range = Number(profile.range) || 2.4;
    const radius = Math.max(0.1, Number(enemyRadius) || 0.6);
    const forward = this.facingVector(facing);
    const dot = dist > 0.001 ? ((dx / dist) * forward.x + (dz / dist) * forward.z) : 1;
    const hitShape = profile.hitShape || 'arc';
    const pointBlank = dist < Math.max(0.8, radius + 0.35);

    if (hitShape === 'thrust') {
      const start = { x: px + forward.x * 0.25, z: pz + forward.z * 0.25 };
      const end = { x: px + forward.x * (range + radius), z: pz + forward.z * (range + radius) };
      const lineDist = this.pointToSegmentDistance2D({ x: ex, z: ez }, start, end);
      const hit = lineDist <= radius + (profile.width || 0.42) || pointBlank;
      return { hit, dist, dot, hitShape, lineDist };
    }

    const angle = Number(profile.angle !== undefined ? profile.angle : 0.65);
    const arcBias = hitShape === 'heavy' ? -0.18 : 0;
    const reachBonus = hitShape === 'heavy' ? 0.28 : 0;
    const hit = dist <= range + radius + reachBonus && (dot > angle + arcBias || pointBlank);
    return { hit, dist, dot, hitShape };
  },

  isEnemyMeleeHit({ enemyPosition, playerPosition, enemyRadius = 0.6, playerRadius = 0.45, windupDir = null, profile = {} }) {
    if (!enemyPosition || !playerPosition) return { hit: false, reason: 'missing-position' };
    const ex = enemyPosition.x || 0;
    const ez = enemyPosition.z || 0;
    const px = playerPosition.x || 0;
    const pz = playerPosition.z || 0;
    const dx = px - ex;
    const dz = pz - ez;
    const dist = Math.hypot(dx, dz);
    const radius = Math.max(0.1, Number(enemyRadius) || 0.6);
    const targetRadius = Math.max(0.15, Number(playerRadius) || 0.45);
    const range = Number(profile.range) || 2.0;
    const hitShape = profile.hitShape || 'arc';
    const dirToPlayer = dist > 0.001 ? { x: dx / dist, z: dz / dist } : { x: 0, z: 1 };
    const forward = windupDir && Math.hypot(windupDir.x || 0, windupDir.z || 0) > 0.001
      ? (() => {
        const len = Math.hypot(windupDir.x || 0, windupDir.z || 0) || 1;
        return { x: (windupDir.x || 0) / len, z: (windupDir.z || 0) / len };
      })()
      : dirToPlayer;
    const dot = dirToPlayer.x * forward.x + dirToPlayer.z * forward.z;
    const pointBlank = dist <= radius + targetRadius + 0.2;

    if (hitShape === 'slam') {
      const hit = dist <= radius + targetRadius + range;
      return { hit, dist, dot, hitShape };
    }

    if (hitShape === 'thrust') {
      const start = { x: ex + forward.x * Math.max(0.15, radius * 0.3), z: ez + forward.z * Math.max(0.15, radius * 0.3) };
      const end = { x: ex + forward.x * (radius + range), z: ez + forward.z * (radius + range) };
      const lineDist = this.pointToSegmentDistance2D({ x: px, z: pz }, start, end);
      const hit = lineDist <= targetRadius + (profile.width || 0.34) || pointBlank;
      return { hit, dist, dot, hitShape, lineDist };
    }

    const facingDot = Number(profile.facingDot !== undefined ? profile.facingDot : 0.25);
    const arcBias = hitShape === 'heavy' ? -0.12 : 0;
    const hit = dist <= radius + targetRadius + range && (dot > facingDot + arcBias || pointBlank);
    return { hit, dist, dot, hitShape };
  },

  resolvePlayerMeleeDamage({ baseAtk = 1, profile = {}, set = {}, weapon = null, enemy = null, flurry = false, critical = null }) {
    let damage = Math.max(1, Math.round((Number(baseAtk) || 1) * (profile.damageMul || 1)));
    if (flurry) damage = Math.round(damage * 1.8);
    if (set.meleeAtkMul) damage = Math.round(damage * set.meleeAtkMul);
    if (weapon && weapon.itemId && weapon.itemId.startsWith('ancient') && set.ancientAtkMul) {
      damage = Math.round(damage * set.ancientAtkMul);
    }
    if (weapon && weapon.itemId === 'masterSword' && this.isMasterSwordAwakened(enemy)) {
      damage = Math.max(damage, 60);
    }
    if (set.stalAtkMul && this.isStalLike(enemy)) damage = Math.round(damage * set.stalAtkMul);
    if (set.sneakAtkMul && enemy && enemy.state !== 'chase' && enemy.state !== 'attack') {
      damage = Math.round(damage * set.sneakAtkMul);
    }
    if (critical && critical.critical) damage = Math.round(damage * (critical.multiplier || 2));
    return { damage, critical: !!(critical && critical.critical), multiplier: critical && critical.multiplier ? critical.multiplier : 1 };
  },

  resolvePlayerArrowDamage({ baseDamage = 1, projectileY = 1, enemy = null, critical = false }) {
    const weak = this.weakPointMultiplier(enemy, projectileY);
    let damage = Math.max(1, Math.round(Number(baseDamage) || 1));
    damage = Math.round(damage * weak.multiplier);
    return {
      damage,
      weakPointMultiplier: weak.multiplier,
      weakPointLabel: weak.label,
      critical: !!critical
    };
  },

  weakPointMultiplier(enemy, projectileY = 1) {
    const typeId = (enemy && enemy.typeId) || '';
    const name = (enemy && enemy.def && enemy.def.name) || '';
    const y = Number(projectileY) || 0;
    const boss = !!(enemy && enemy.boss);
    const eyeOrCore = /guardian|hinox|talus|gleeok|cyclops|stalnox|calamity/i.test(typeId) || /守护者|独眼|巨像|三头龙|盖侬/.test(name);
    if (eyeOrCore && y >= (boss ? 1.8 : 1.35)) return { multiplier: 2.0, label: '弱点' };
    if (y >= (boss ? 2.05 : 1.45)) return { multiplier: 1.5, label: '爆头' };
    return { multiplier: 1.0, label: '' };
  },

  resolveBlockDamage(amount = 1, shieldDef = 1) {
    const incoming = Math.max(0, Number(amount) || 0);
    const guard = Math.max(0, Number(shieldDef) || 0);
    const reduced = Math.max(0, incoming - guard);
    const shieldWear = Math.max(1, Math.ceil(Math.max(1, incoming) / Math.max(4, Math.max(1, guard) * 1.6)));
    return { incoming, shieldDef: guard, reduced, shieldWear };
  },

  resolveIncomingInvulnerability({ outcome = 'hit', amount = 1, shieldWear = 1 } = {}) {
    const incoming = Math.max(0, Number(amount) || 0);
    const wear = Math.max(1, Number(shieldWear) || 1);
    if (outcome === 'parried') return { invuln: 0.5 };
    if (outcome === 'dodged') return { invuln: 1.0 };
    if (outcome === 'blocked') return { invuln: this.clamp(0.18 + wear * 0.025, 0.22, 0.36) };
    if (outcome === 'blocked-damaged') return { invuln: this.clamp(0.22 + wear * 0.035, 0.28, 0.5) };
    return { invuln: this.clamp(0.42 + incoming * 0.012, 0.48, 0.95) };
  },

  isMasterSwordAwakened(enemy) {
    if (!enemy) return false;
    const typeId = enemy.typeId || '';
    const name = (enemy.def && enemy.def.name) || '';
    return !!(enemy.boss || enemy.finalBoss || typeId.includes('guardian') || /灾厄|盖侬|咒|守护者/.test(name));
  },

  isStalLike(enemy) {
    if (!enemy) return false;
    const name = (enemy.def && enemy.def.name) || '';
    return enemy.typeId === 'stal' || /骷髅|灾厄|咒/.test(name);
  }
};

if (typeof window !== 'undefined') window.CombatResolver = CombatResolver;
