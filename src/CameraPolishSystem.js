/* ========================================================
   CameraPolishSystem.js — 商业化镜头表现
   职责：状态镜头、FOV 呼吸、轻微屏震、相机碰撞避让
   ======================================================== */

const CameraPolishSystem = {
  _shake: 0,
  _shakePhase: 0,
  _desiredFov: 58,
  _raycaster: new THREE.Raycaster(),

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

    if (locked) {
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

    const lookAt = target.clone().setY(target.y + lookHeight);
    camPos = this._avoidCameraCollision(game, lookAt, camPos);
    const fov = gliding ? 64 : bow ? 52 : locked ? 56 : attacking ? 55 : 58;
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
    return true;
  },

  bump(amount = 0.45) {
    this._shake = Math.min(1.2, Math.max(this._shake, amount));
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
  }
};

if (typeof window !== 'undefined') window.CameraPolishSystem = CameraPolishSystem;
