/* ========================================================
   Effects.js — 战斗与环境特效系统
   挥砍弧光、命中爆裂、死亡粒子、传送光环
   全部用 Three.js 几何体 + 透明材质实现，无外部资源
   ======================================================== */

const Effects = {
  scene: null,
  active: [],   // {mesh, life, maxLife, update(dt, t)}

  attach(scene) { this.scene = scene; },

  _effectSprite(name, pos, size = 1, color = 0xffffff) {
    if (typeof ArtAssets === 'undefined') return null;
    const tex = ArtAssets.effectTexture(name);
    if (!tex) return null;
    const mat = new THREE.MeshBasicMaterial({
      color,
      map: tex,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const sprite = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
    sprite.position.copy(pos);
    return sprite;
  },

  // ---------- 主更新 ----------
  update(dt) {
    if (!Array.isArray(this.active)) this.active = [];
    this.active = this.active.filter(Boolean);
    for (const e of this.active) {
      if (!e) continue;
      e.life -= dt;
      const t = 1 - e.life / e.maxLife;
      if (e.update) e.update(dt, t);
    }
    // 清理
    this.active = this.active.filter(e => {
      if (!e) return false;
      if (e.life <= 0) {
        if (e.mesh && e.mesh.parent) e.mesh.parent.remove(e.mesh);
        if (e.sparks) {
          for (const s of e.sparks) {
            if (s && s.parent) s.parent.remove(s);
          }
        }
        return false;
      }
      return true;
    });
  },

  clear() {
    if (!Array.isArray(this.active)) this.active = [];
    for (const e of this.active) {
      if (!e) continue;
      if (e.mesh && e.mesh.parent) e.mesh.parent.remove(e.mesh);
      if (e.sparks) {
        for (const s of e.sparks) {
          if (s && s.parent) s.parent.remove(s);
        }
      }
    }
    this.active = [];
  },

  // ---------- 挥砍弧光 ----------
  slashArc(originPos, facing, color = 0xfff4b0) {
    if (!this.scene) return;
    const slash = this._effectSprite(color === 0xffffff ? 'slash-white' : 'slash-gold', originPos, 2.6, color);
    if (slash) {
      slash.position.y = 1.08;
      slash.rotation.set(-0.45, facing, -0.35);
      this.scene.add(slash);
      this.active.push({
        mesh: slash, life: 0.22, maxLife: 0.22,
        update(dt, t) {
          slash.scale.setScalar(0.8 + t * 0.45);
          slash.material.opacity = 0.95 * (1 - t);
          slash.rotation.z -= dt * 3;
        }
      });
    }
    const geo = new THREE.TorusGeometry(1.6, 0.12, 4, 12, Math.PI * 0.7);
    const mat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false
    });
    const arc = new THREE.Mesh(geo, mat);
    arc.position.copy(originPos);
    arc.position.y = 1.0;
    arc.rotation.y = facing - 0.7;
    arc.rotation.x = Math.PI / 2;
    this.scene.add(arc);
    this.active.push({
      mesh: arc, life: 0.25, maxLife: 0.25,
      update(dt, t) {
        mat.opacity = 0.8 * (1 - t);
        arc.scale.setScalar(1 + t * 0.3);
      }
    });
  },

  // ---------- 命中爆裂粒子 ----------
  hitBurst(originPos, color = 0xffaa44, count = 8) {
    if (!this.scene) return;
    const spriteName = color === 0x66ddff ? 'ice-burst'
                     : color === 0xffee44 ? 'shock-burst'
                     : color === 0xff4422 || color === 0xffaa44 ? 'fire-burst'
                     : 'star-sparkle';
    const burst = this._effectSprite(spriteName, originPos, 1.4, color);
    if (burst) {
      burst.position.y += 0.75;
      burst.rotation.x = -0.3;
      this.scene.add(burst);
      this.active.push({
        mesh: burst, life: 0.34, maxLife: 0.34,
        update(dt, t) {
          burst.scale.setScalar(0.35 + t * 1.35);
          burst.material.opacity = 0.9 * (1 - t);
          burst.rotation.z += dt * 4;
        }
      });
    }
    const group = new THREE.Group();
    group.position.copy(originPos);
    const particles = [];
    for (let i = 0; i < count; i++) {
      const p = new THREE.Mesh(
        new THREE.TetrahedronGeometry(0.1 + Math.random() * 0.08),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 })
      );
      const a = Math.random() * Math.PI * 2;
      const up = 0.5 + Math.random() * 1.5;
      p.userData.vel = new THREE.Vector3(Math.cos(a) * (2 + Math.random()*2), up, Math.sin(a) * (2 + Math.random()*2));
      group.add(p);
      particles.push(p);
    }
    this.scene.add(group);
    this.active.push({
      mesh: group, life: 0.5, maxLife: 0.5,
      update(dt, t) {
        for (const p of particles) {
          p.position.addScaledVector(p.userData.vel, dt);
          p.userData.vel.y -= 8 * dt;
          p.material.opacity = 1 - t;
          p.rotation.x += dt * 10;
          p.rotation.y += dt * 8;
        }
      }
    });
  },

  // ---------- 脚步/移动地表反馈 ----------
  footstep(originPos, worldName = 'grassland', intensity = 1) {
    if (!this.scene) return;
    const color = worldName === 'snowland' ? 0xeef8ff
                : worldName === 'desert' ? 0xd8b06a
                : worldName === 'volcano' ? 0xff7a3a
                : worldName === 'dungeon' || worldName === 'castle' ? 0x9aa0aa
                : 0x8fb96a;
    const sprite = this._effectSprite(worldName === 'snowland' ? 'ice-burst' : 'dust-puff', originPos, 0.48 + intensity * 0.22, color);
    if (sprite) {
      sprite.position.y = 0.08;
      sprite.rotation.x = -Math.PI / 2;
      sprite.material.blending = worldName === 'volcano' ? THREE.AdditiveBlending : THREE.NormalBlending;
      this.scene.add(sprite);
      this.active.push({
        mesh: sprite, life: 0.34, maxLife: 0.34,
        update(dt, t) {
          sprite.scale.setScalar(0.55 + t * (0.9 + intensity * 0.25));
          sprite.material.opacity = (0.42 + intensity * 0.12) * (1 - t);
        }
      });
    }
    const count = worldName === 'volcano' ? 5 : worldName === 'snowland' ? 6 : 4;
    const group = new THREE.Group();
    group.position.copy(originPos);
    group.position.y = 0.06;
    const parts = [];
    for (let i = 0; i < count; i++) {
      const p = new THREE.Mesh(
        new THREE.TetrahedronGeometry(0.035 + Math.random() * 0.035),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72 })
      );
      const a = Math.random() * Math.PI * 2;
      const speed = 0.45 + Math.random() * 1.05;
      p.userData.vel = new THREE.Vector3(Math.cos(a) * speed, 0.25 + Math.random() * 0.6, Math.sin(a) * speed);
      group.add(p);
      parts.push(p);
    }
    this.scene.add(group);
    this.active.push({
      mesh: group, life: 0.42, maxLife: 0.42,
      update(dt, t) {
        for (const p of parts) {
          p.position.addScaledVector(p.userData.vel, dt);
          p.userData.vel.y -= 2.8 * dt;
          p.material.opacity = 0.72 * (1 - t);
          p.scale.setScalar(1 - t * 0.35);
        }
      }
    });
  },

  enemyAttackCue(originPos, facingDir, range = 2.2, color = 0xffaa44) {
    if (!this.scene) return;
    const dir = facingDir && facingDir.lengthSq && facingDir.lengthSq() > 0.001
      ? facingDir.clone().setY(0).normalize()
      : new THREE.Vector3(0, 0, 1);
    const facing = Math.atan2(dir.x, dir.z);
    const group = new THREE.Group();
    group.position.copy(originPos);
    group.position.y = 0.035;
    group.rotation.y = facing;

    const telegraph = new THREE.Mesh(
      new THREE.PlaneGeometry(0.86, range),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    telegraph.rotation.x = -Math.PI / 2;
    telegraph.position.z = range * 0.5;
    group.add(telegraph);

    const edgeMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.42, depthWrite: false });
    [-0.43, 0.43].forEach(x => {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, range), edgeMat);
      edge.position.set(x, 0.01, range * 0.5);
      group.add(edge);
    });
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.035, 5, 18),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, depthWrite: false })
    );
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    this.scene.add(group);
    this.active.push({
      mesh: group, life: 0.48, maxLife: 0.48,
      update(dt, t) {
        telegraph.material.opacity = 0.2 * (1 - t);
        edgeMat.opacity = 0.45 * (1 - t);
        ring.material.opacity = 0.55 * (1 - t);
        ring.scale.setScalar(1 + t * 0.9);
      }
    });
  },

  // ---------- 死亡消散粒子 ----------
  deathPuff(originPos, color = 0xcc4444) {
    if (!this.scene) return;
    const puff = this._effectSprite('dust-puff', originPos, 1.6, color);
    if (puff) {
      puff.position.y += 0.55;
      puff.rotation.x = -0.4;
      this.scene.add(puff);
      this.active.push({
        mesh: puff, life: 0.55, maxLife: 0.55,
        update(dt, t) {
          puff.scale.setScalar(0.7 + t * 1.2);
          puff.material.opacity = 0.65 * (1 - t);
        }
      });
    }
    const group = new THREE.Group();
    group.position.copy(originPos);
    const particles = [];
    for (let i = 0; i < 20; i++) {
      const p = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.12, 0.12),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 })
      );
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 2;
      p.userData.vel = new THREE.Vector3(Math.cos(a)*r, 2+Math.random()*2, Math.sin(a)*r);
      group.add(p); particles.push(p);
    }
    this.scene.add(group);
    this.active.push({
      mesh: group, life: 0.8, maxLife: 0.8,
      update(dt, t) {
        for (const p of particles) {
          p.position.addScaledVector(p.userData.vel, dt);
          p.userData.vel.y -= 6 * dt;
          p.material.opacity = 0.9 * (1 - t);
          p.rotation.x += dt * 5;
        }
      }
    });
  },

  lowPolyShatter(originPos, color = 0xd8c0a0, count = 12, scale = 1) {
    if (!this.scene) return;
    const group = new THREE.Group();
    group.position.copy(originPos);
    const shards = [];
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.72,
      metalness: 0.05,
      flatShading: true,
      emissive: color,
      emissiveIntensity: 0.08,
      transparent: true,
      opacity: 0.95
    });
    for (let i = 0; i < count; i++) {
      const shard = new THREE.Mesh(
        i % 3 === 0
          ? new THREE.TetrahedronGeometry((0.08 + Math.random() * 0.1) * scale)
          : new THREE.BoxGeometry((0.08 + Math.random() * 0.08) * scale, (0.06 + Math.random() * 0.08) * scale, (0.07 + Math.random() * 0.1) * scale),
        mat.clone()
      );
      const a = Math.random() * Math.PI * 2;
      const outward = 1.1 + Math.random() * 2.2;
      shard.userData.vel = new THREE.Vector3(Math.cos(a) * outward, 1.2 + Math.random() * 2.6, Math.sin(a) * outward);
      shard.userData.spin = new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 10);
      shard.position.set((Math.random() - 0.5) * 0.35 * scale, (Math.random() - 0.5) * 0.25 * scale, (Math.random() - 0.5) * 0.35 * scale);
      group.add(shard);
      shards.push(shard);
    }
    this.scene.add(group);
    this.active.push({
      mesh: group, life: 0.62, maxLife: 0.62,
      update(dt, t) {
        for (const shard of shards) {
          shard.position.addScaledVector(shard.userData.vel, dt);
          shard.userData.vel.y -= 7.8 * dt;
          shard.rotation.x += shard.userData.spin.x * dt;
          shard.rotation.y += shard.userData.spin.y * dt;
          shard.rotation.z += shard.userData.spin.z * dt;
          shard.material.opacity = 0.95 * (1 - t);
          shard.scale.setScalar(1 - t * 0.35);
        }
      }
    });
  },

  // ---------- 拾取闪光 ----------
  pickupFlash(originPos) {
    if (!this.scene) return;
    const beam = this._effectSprite('pickup-beam', originPos, 1.25, 0xffd54f);
    if (beam) {
      beam.position.y = 0.85;
      beam.rotation.x = -0.35;
      this.scene.add(beam);
      this.active.push({
        mesh: beam, life: 0.48, maxLife: 0.48,
        update(dt, t) {
          beam.scale.setScalar(0.8 + t * 0.8);
          beam.material.opacity = 0.9 * (1 - t);
        }
      });
    }
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.1, 0.5, 16),
      new THREE.MeshBasicMaterial({ color: 0xffd54f, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
    );
    ring.position.copy(originPos); ring.position.y = 0.1;
    ring.rotation.x = -Math.PI / 2;
    this.scene.add(ring);
    this.active.push({
      mesh: ring, life: 0.5, maxLife: 0.5,
      update(dt, t) {
        ring.scale.setScalar(1 + t * 3);
        ring.material.opacity = 0.9 * (1 - t);
      }
    });
  },

  // ---------- 传送光环 ----------
  portalEffect(originPos) {
    if (!this.scene) return;
    const portal = this._effectSprite('ancient-ring', originPos, 2.1, 0x66ddff);
    if (portal) {
      portal.position.y = 1.25;
      portal.rotation.x = -0.45;
      this.scene.add(portal);
      this.active.push({
        mesh: portal, life: 1.0, maxLife: 1.0,
        update(dt, t) {
          portal.rotation.z += dt * 2.5;
          portal.scale.setScalar(0.7 + t * 1.2);
          portal.material.opacity = 0.85 * (1 - t);
        }
      });
    }
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.5 + i*0.2, 0.06, 4, 16),
        new THREE.MeshBasicMaterial({ color: 0x66ddff, transparent: true, opacity: 0.7 })
      );
      ring.position.copy(originPos);
      ring.position.y = 1.0 + i * 0.3;
      ring.rotation.x = Math.PI / 2;
      this.scene.add(ring);
      this.active.push({
        mesh: ring, life: 1.0 + i*0.1, maxLife: 1.0 + i*0.1,
        update(dt, t) {
          ring.rotation.z += dt * 5;
          ring.scale.setScalar(1 + t);
          ring.material.opacity = 0.7 * (1 - t);
        }
      });
    }
  },

  guardianLaserCharge(originPos) {
    if (!this.scene) return;
    const charge = this._effectSprite('ai-polish-guardian-charge-ring', originPos, 1.35, 0x66ddff);
    if (!charge) return;
    charge.position.y += 0.15;
    charge.rotation.x = -0.2;
    this.scene.add(charge);
    this.active.push({
      mesh: charge, life: 0.38, maxLife: 0.38,
      update(dt, t) {
        charge.scale.setScalar(0.45 + t * 0.85);
        charge.material.opacity = 0.9 * (1 - t * 0.55);
        charge.rotation.z += dt * 7.5;
      }
    });
  },

  guardianLaserBeam(fromPos, toPos, color = 0x66ddff, reflected = false) {
    if (!this.scene || !fromPos || !toPos) return;
    const dir = new THREE.Vector3().subVectors(toPos, fromPos);
    const len = dir.length();
    if (len < 0.1) return;
    dir.normalize();
    const tex = (typeof ArtAssets !== 'undefined') ? ArtAssets.effectTexture('ai-polish-guardian-laser-beam') : null;
    const mat = new THREE.MeshBasicMaterial({
      color,
      map: tex,
      transparent: true,
      opacity: reflected ? 1 : 0.86,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const beam = new THREE.Mesh(new THREE.PlaneGeometry(len, reflected ? 0.62 : 0.42), mat);
    beam.position.copy(fromPos).add(toPos).multiplyScalar(0.5);
    beam.rotation.y = Math.atan2(-dir.z, dir.x);
    this.scene.add(beam);
    this.active.push({
      mesh: beam, life: reflected ? 0.3 : 0.22, maxLife: reflected ? 0.3 : 0.22,
      update(dt, t) {
        beam.scale.y = 1 + Math.sin(t * Math.PI) * 0.55;
        mat.opacity = (reflected ? 1 : 0.86) * (1 - t);
      }
    });
  },

  bossWeakPointPulse(originPos, color = 0xff4466) {
    if (!this.scene) return;
    const core = this._effectSprite('ai-polish-boss-weak-core', originPos, 1.35, color);
    if (!core) return;
    core.rotation.x = -0.18;
    this.scene.add(core);
    this.active.push({
      mesh: core, life: 0.7, maxLife: 0.7,
      update(dt, t) {
        core.scale.setScalar(0.62 + t * 0.72);
        core.material.opacity = 0.62 * (1 - t);
        core.rotation.z += dt * 1.8;
      }
    });
  },

  shrineRunePulse(originPos) {
    if (!this.scene) return;
    const rune = this._effectSprite('ai-polish-shrine-rune-flare', originPos, 1.55, 0x88eeff);
    if (!rune) return;
    rune.position.y += 0.85;
    rune.rotation.x = -0.28;
    this.scene.add(rune);
    this.active.push({
      mesh: rune, life: 0.9, maxLife: 0.9,
      update(dt, t) {
        rune.scale.setScalar(0.75 + t * 0.7);
        rune.material.opacity = 0.58 * (1 - t);
        rune.rotation.z += dt * 1.2;
      }
    });
  },

  // ---------- ★ 完美格挡金色火花 ----------
  parrySpark(pos) {
    if (!this.scene) return;
    const parry = this._effectSprite('parry-flash', pos, 2.0, 0xffe07a);
    if (parry) {
      parry.position.y += 0.7;
      parry.rotation.x = -0.25;
      this.scene.add(parry);
      this.active.push({
        mesh: parry, life: 0.34, maxLife: 0.34,
        update(dt, t) {
          parry.scale.setScalar(0.35 + t * 1.4);
          parry.material.opacity = 1 - t;
          parry.rotation.z += dt * 6;
        }
      });
    }
    // 中心白色闪光环
    const flash = new THREE.Mesh(
      new THREE.RingGeometry(0.2, 0.8, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1, side: THREE.DoubleSide })
    );
    flash.position.copy(pos);
    flash.rotation.x = -Math.PI / 2;
    this.scene.add(flash);
    this.active.push({
      mesh: flash, life: 0.4, maxLife: 0.4,
      update(dt, t) {
        flash.scale.setScalar(1 + t * 4);
        flash.material.opacity = 1 * (1 - t);
      }
    });
    // 金色火花碎片向四周飞溅
    const sparks = [];
    for (let i = 0; i < 14; i++) {
      const spark = new THREE.Mesh(
        new THREE.TetrahedronGeometry(0.1),
        new THREE.MeshBasicMaterial({ color: 0xffd700 })
      );
      spark.position.copy(pos);
      const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.5;
      spark.userData.vel = new THREE.Vector3(
        Math.cos(angle) * (3 + Math.random() * 3),
        2 + Math.random() * 3,
        Math.sin(angle) * (3 + Math.random() * 3)
      );
      this.scene.add(spark);
      sparks.push(spark);
    }
    this.active.push({
      sparks, life: 0.6, maxLife: 0.6,
      update(dt, t) {
        for (const s of sparks) {
          s.position.x += s.userData.vel.x * dt;
          s.position.y += s.userData.vel.y * dt;
          s.position.z += s.userData.vel.z * dt;
          s.userData.vel.y -= 9 * dt;  // 重力
          s.rotation.x += dt * 8; s.rotation.y += dt * 6;
          s.scale.setScalar(1 - t);
          if (s.material) s.material.opacity = 1 - t;
          if (s.material) s.material.transparent = true;
        }
      },
      onEnd() { for (const s of sparks) if (s.parent) s.parent.remove(s); }
    });
  },

  // ---------- ★ 完美闪避蓝色残影 ----------
  dodgeAfterimage(pos) {
    if (!this.scene) return;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.6, 0.08, 6, 16),
      new THREE.MeshBasicMaterial({ color: 0x66ddff, transparent: true, opacity: 0.9 })
    );
    ring.position.copy(pos);
    ring.position.y = 1.0;
    ring.rotation.x = Math.PI / 2;
    this.scene.add(ring);
    this.active.push({
      mesh: ring, life: 0.5, maxLife: 0.5,
      update(dt, t) {
        ring.scale.setScalar(1 + t * 2.5);
        ring.material.opacity = 0.9 * (1 - t);
        ring.rotation.z += dt * 8;
      }
    });
    // 蓝色粒子向上飘
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 4, 3),
        new THREE.MeshBasicMaterial({ color: 0xaaeeff, transparent: true, opacity: 0.8 })
      );
      p.position.copy(pos);
      p.position.x += (Math.random() - 0.5) * 0.6;
      p.position.z += (Math.random() - 0.5) * 0.6;
      p.userData.vy = 1 + Math.random() * 2;
      this.scene.add(p);
      const part = p;
      this.active.push({
        mesh: p, life: 0.6, maxLife: 0.6,
        update(dt2, t) {
          part.position.y += part.userData.vy * dt2;
          part.material.opacity = 0.8 * (1 - t);
          part.scale.setScalar(1 - t * 0.5);
        }
      });
    }
  },

  // ---------- ★ 元素状态光环（玩家着火/冰冻/麻痹时） ----------
  elementalAura(pos, color) {
    if (!this.scene) return;
    const aura = new THREE.Mesh(
      new THREE.TorusGeometry(0.7, 0.05, 4, 16),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 })
    );
    aura.position.copy(pos);
    aura.rotation.x = Math.PI / 2;
    this.scene.add(aura);
    this.active.push({
      mesh: aura, life: 0.8, maxLife: 0.8,
      update(dt, t) {
        aura.scale.setScalar(1 + t * 1.5);
        aura.material.opacity = 0.8 * (1 - t);
        aura.rotation.z += dt * 4;
      }
    });
  },

  // ---------- ★ 敌人蓄力预警圈（地面红色圈） ----------
  enemyWindup(pos, element) {
    if (!this.scene) return;
    const color = element === 'fire' ? 0xff4422 : element === 'ice' ? 0x66ddff :
                  element === 'shock' ? 0xffee44 : 0xff3333;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.6, 20),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
    );
    ring.position.copy(pos); ring.position.y = 0.1;
    ring.rotation.x = -Math.PI / 2;
    this.scene.add(ring);
    this.active.push({
      mesh: ring, life: 0.8, maxLife: 0.8,
      update(dt, t) {
        ring.scale.setScalar(1 + t * 2.5);
        ring.material.opacity = 0.6 * (1 - t * 0.7);
      }
    });
  }
};
