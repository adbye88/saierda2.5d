/* ========================================================
   CameraPolishSystem.js — 商业化镜头表现
   职责：状态镜头、FOV 呼吸、轻微屏震、相机碰撞避让
   ======================================================== */

const CameraPolishSystem = {
  _shake: 0,
  _shakePhase: 0,
  _desiredFov: 58,
  _raycaster: new THREE.Raycaster(),
  _inspectMode: false,
  _fadedOccluders: new Set(),

  update(dt, game, player) {
    if (!game || !game.camera || !player) return false;
    const camera = game.camera;
    const target = player.position.clone();
    const distBase = Input.cameraDistance || 11;
    const locked = game.lockedEnemy && !game.lockedEnemy.dead;
    const bow = player.bowMode && player.inventory && player.inventory.equipped.bow;
    const gliding = player.isGliding;
    const shielding = Input.state.shield && player.inventory && player.inventory.equipped.shield;
    const attacking = player.isAttacking;

    let dist = distBase;
    let height = dist * 0.82;
    let lookHeight = 1.25;
    let lateral = 0;
    let camPos;

    if (this._inspectMode) {
      const enemy = this._nearestInspectableEnemy(game, player);
      const focus = enemy
        ? player.position.clone().lerp(enemy.mesh.position, 0.46)
        : target.clone();
      const enemyDir = enemy
        ? new THREE.Vector3().subVectors(enemy.mesh.position, player.position).setY(0)
        : new THREE.Vector3(Math.sin(player.facing), 0, Math.cos(player.facing));
      if (enemyDir.lengthSq() < 0.001) enemyDir.set(0, 0, 1);
      enemyDir.normalize();
      const side = new THREE.Vector3(enemyDir.z, 0, -enemyDir.x);
      dist = enemy ? 4.8 : 4.2;
      height = enemy ? 3.0 : 2.7;
      camPos = focus.clone()
        .add(enemyDir.clone().multiplyScalar(-dist))
        .add(side.multiplyScalar(1.15))
        .add(new THREE.Vector3(0, height, 0));
      lookHeight = enemy ? 1.35 : 1.45;
    } else if (locked) {
      const enemyPos = game.lockedEnemy.mesh.position.clone();
      const toEnemy = new THREE.Vector3().subVectors(enemyPos, target);
      toEnemy.y = 0;
      if (toEnemy.lengthSq() < 0.001) toEnemy.set(Math.sin(player.facing), 0, Math.cos(player.facing));
      toEnemy.normalize();
      const side = new THREE.Vector3(toEnemy.z, 0, -toEnemy.x);
      dist *= bow ? 0.82 : 0.9;
      height *= bow ? 0.78 : 0.86;
      lateral = bow ? 1.35 : shielding ? 0.62 : 0.35;
      camPos = target.clone()
        .add(toEnemy.clone().multiplyScalar(-dist))
        .add(side.multiplyScalar(lateral))
        .add(new THREE.Vector3(0, height, 0));
      lookHeight = game.lockedEnemy.boss ? 2.0 : 1.35;
    } else {
      const forward = new THREE.Vector3(Math.sin(player.facing), 0, Math.cos(player.facing));
      const right = new THREE.Vector3(forward.z, 0, -forward.x);
      const cinematicBack = new THREE.Vector3(0.46, 0, 0.88).normalize();
      if (bow) {
        dist *= 0.84;
        height *= 0.78;
        lateral = 1.05;
      } else if (gliding) {
        dist *= 1.18;
        height *= 1.05;
        lookHeight = 1.55;
      } else if (attacking) {
        dist *= 0.94;
        height *= 0.84;
      }
      camPos = target.clone()
        .add(cinematicBack.multiplyScalar(dist))
        .add(new THREE.Vector3(0, height * 0.92, 0))
        .add(right.multiplyScalar(lateral));
    }

    const lookAhead = this._inspectMode || locked || bow
      ? new THREE.Vector3()
      : new THREE.Vector3(Math.sin(player.facing), 0, Math.cos(player.facing)).multiplyScalar(attacking ? 1.25 : 2.35);
    const lookAt = target.clone().add(lookAhead).setY(target.y + lookHeight);
    camPos = this._avoidCameraCollision(game, lookAt, camPos);
    const fov = this._inspectMode ? 44 : gliding ? 64 : bow ? 52 : locked ? 56 : attacking ? 55 : 58;
    this._desiredFov += (fov - this._desiredFov) * this._alpha(dt, 6);
    if (Math.abs(camera.fov - this._desiredFov) > 0.05) {
      camera.fov += (this._desiredFov - camera.fov) * this._alpha(dt, 8);
      camera.updateProjectionMatrix();
    }

    this._shake = Math.max(0, this._shake - dt * 1.8);
    this._shakePhase += dt * 36;
    const shakeOffset = new THREE.Vector3(
      Math.sin(this._shakePhase * 1.7) * this._shake * 0.18,
      Math.cos(this._shakePhase * 1.3) * this._shake * 0.12,
      0
    );
    camPos.add(shakeOffset);

    camera.position.lerp(camPos, this._alpha(dt, locked || bow ? 7.5 : 6.2));
    camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
    this._fadeForegroundOccluders(dt, game, player, camera);
    return true;
  },

  bump(amount = 0.45) {
    this._shake = Math.min(1.2, Math.max(this._shake, amount));
  },

  toggleInspect(game) {
    this._inspectMode = !this._inspectMode;
    if (typeof Dialogue !== 'undefined') {
      Dialogue.show(this._inspectMode ? '近景角色检查：开启（P 关闭）' : '近景角色检查：关闭', 1100);
    }
    if (game && game.lockedEnemy && game.lockedEnemy.dead) game.lockedEnemy = null;
  },

  _nearestInspectableEnemy(game, player) {
    const enemies = game.currentWorld && game.currentWorld.enemies || [];
    let best = null;
    let bestD = Infinity;
    for (const enemy of enemies) {
      if (!enemy || enemy.dead || !enemy.mesh) continue;
      const d = enemy.mesh.position.distanceTo(player.position);
      if (d < bestD && d < 16) {
        bestD = d;
        best = enemy;
      }
    }
    return best;
  },

  _alpha(dt, speed) {
    return 1 - Math.exp(-Math.max(1, speed) * dt);
  },

  _avoidCameraCollision(game, lookAt, desired) {
    const world = game.currentWorld;
    if (!world || !world.colliders || world.colliders.length === 0) return desired;
    const dir = desired.clone().sub(lookAt);
    const dist = dir.length();
    if (dist < 1) return desired;
    dir.normalize();
    this._raycaster.set(lookAt, dir);
    this._raycaster.near = 0.25;
    this._raycaster.far = dist;
    const candidates = [];
    for (const obj of world.colliders) {
      if (!obj || !obj.visible) continue;
      const r = obj.userData && obj.userData.collisionRadius || 0.6;
      if (obj.position.distanceTo(lookAt) > dist + r + 2) continue;
      candidates.push(obj);
    }
    if (!candidates.length) return desired;
    const hits = this._raycaster.intersectObjects(candidates, true);
    if (!hits.length) return desired;
    const hit = hits[0];
    if (!hit || hit.distance > dist - 0.5) return desired;
    return lookAt.clone().add(dir.multiplyScalar(Math.max(2.6, hit.distance - 0.75)));
  },

  _fadeForegroundOccluders(dt, game, player, camera) {
    const world = game.currentWorld;
    if (!world || !world.colliders || !player || !camera) return;
    const active = new Set();
    const a = camera.position;
    const b = player.position;
    const span = b.clone().sub(a);
    const lenSq = Math.max(0.001, span.lengthSq());
    const fadeAlpha = this._alpha(dt, 10);
    for (const obj of world.colliders) {
      if (!obj || !obj.userData || obj.userData.kind !== 'tree') continue;
      if (obj.position.distanceTo(camera.position) > 18) continue;
      const rel = obj.position.clone().sub(a);
      const t = THREE.MathUtils.clamp(rel.dot(span) / lenSq, 0, 1);
      const closest = a.clone().add(span.clone().multiplyScalar(t));
      const radius = obj.userData.collisionRadius || 0.9;
      const blocksView = t > 0.08 && t < 0.88 && closest.distanceTo(obj.position) < radius * 2.8;
      const targetOpacity = blocksView ? 0.36 : 1;
      if (blocksView) active.add(obj);
      this._setOccluderOpacity(obj, targetOpacity, fadeAlpha);
    }
    for (const obj of this._fadedOccluders) {
      if (!active.has(obj)) this._setOccluderOpacity(obj, 1, fadeAlpha);
    }
    this._fadedOccluders = active;
  },

  _setOccluderOpacity(obj, targetOpacity, alpha) {
    obj.traverse(child => {
      if (!child.isMesh || !child.material) return;
      if (!child.userData.occlusionMaterialCloned) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        child.material = Array.isArray(child.material) ? mats.map(m => m.clone()) : child.material.clone();
        child.userData.occlusionMaterialCloned = true;
      }
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      for (const mat of mats) {
        if (!mat || !('opacity' in mat)) continue;
        if (mat.userData.occlusionBaseOpacity == null) mat.userData.occlusionBaseOpacity = mat.opacity == null ? 1 : mat.opacity;
        const base = mat.userData.occlusionBaseOpacity;
        const desired = base * targetOpacity;
        mat.opacity += (desired - mat.opacity) * alpha;
        mat.transparent = mat.opacity < base * 0.985;
        mat.depthWrite = !mat.transparent;
      }
    });
  }
};

if (typeof window !== 'undefined') window.CameraPolishSystem = CameraPolishSystem;
