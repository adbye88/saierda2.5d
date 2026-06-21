/* ========================================================
   CharacterArtSystem.js — 角色美术管线
   目标：在不改战斗逻辑的前提下，给玩家和敌人补足低多边形幻想冒险轮廓。
   - 玩家：披风、肩甲、背部武器轮廓、背包/腰包细节
   - 敌人：旗帜、骨饰、鳞片/背鳍、发光核心、守护者古代能量
   - 动效：布料摆动、核心脉冲、受击强调
   ======================================================== */

const CharacterArtSystem = {
  _time: 0,
  _materials: {},

  init(game) {
    this.game = game;
    this._time = 0;
    this.applyPlayer(game && game.player);
    this.applyWorld(game && game.currentWorld, game);
  },

  applyPlayer(player) {
    if (!player || !player.mesh || player.mesh.userData.characterArtApplied) return;
    const root = player.mesh;
    const art = new THREE.Group();
    art.name = 'character-art-player';

    const capeMat = this._mat('heroCape', 0x2f8f73, { roughness: 0.9, metalness: 0.02 });
    const trimMat = this._mat('heroTrim', 0xe6d27a, { roughness: 0.86, metalness: 0.04 });
    const leather = this._mat('heroLeather', 0x6f3f22, { roughness: 0.92, metalness: 0.02 });
    const darkLeather = this._mat('heroDarkLeather', 0x3d2418, { roughness: 0.94, metalness: 0.02 });
    const metal = this._mat('heroSoftMetal', 0xb6c3bc, { roughness: 0.55, metalness: 0.24 });

    const sways = [];
    const capeGroup = new THREE.Group();
    capeGroup.name = 'hero-cape';
    capeGroup.position.set(0, 1.34, -0.42);
    capeGroup.rotation.x = -0.08;
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 0.15;
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.72 - Math.abs(i - 1) * 0.08, 0.035), capeMat);
      panel.position.set(x, -0.18, -0.02);
      panel.rotation.z = (i - 1) * 0.06;
      capeGroup.add(panel);
      sways.push({
        mesh: panel,
        baseRot: panel.rotation.clone(),
        basePos: panel.position.clone(),
        amp: 0.07 + Math.abs(i - 1) * 0.025,
        speed: 4.2 + i * 0.45,
        phase: i * 1.7
      });
    }
    const capeTrim = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.055, 0.045), trimMat);
    capeTrim.position.set(0, -0.57, 0.012);
    capeGroup.add(capeTrim);
    art.add(capeGroup);
    sways.push({ mesh: capeGroup, baseRot: capeGroup.rotation.clone(), basePos: capeGroup.position.clone(), amp: 0.055, speed: 3.2, phase: 0.8 });

    [-1, 1].forEach(side => {
      const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.105, 0.34), metal);
      shoulder.position.set(side * 0.48, 1.55, -0.02);
      shoulder.rotation.set(0.08, 0, side * 0.22);
      art.add(shoulder);

      const bracer = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.22, 0.08), darkLeather);
      bracer.position.set(side * 0.69, 1.0, 0.08);
      bracer.rotation.z = side * 0.18;
      art.add(bracer);

      const bootStrap = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.035, 0.35), darkLeather);
      bootStrap.position.set(side * 0.16, 0.28, 0.08);
      bootStrap.rotation.z = side * 0.04;
      art.add(bootStrap);
    });

    const sheath = new THREE.Group();
    sheath.name = 'hero-back-sheath';
    sheath.position.set(-0.28, 1.42, -0.48);
    sheath.rotation.set(-0.3, 0.18, -0.62);
    const sheathBody = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.86, 0.075), darkLeather);
    sheath.add(sheathBody);
    const sheathTip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 5), metal);
    sheathTip.position.y = -0.5;
    sheathTip.rotation.x = Math.PI;
    sheath.add(sheathTip);
    art.add(sheath);

    const backpack = new THREE.Group();
    backpack.name = 'hero-backpack';
    backpack.position.set(0.21, 1.22, -0.5);
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.38, 0.17), leather);
    pack.rotation.z = -0.05;
    backpack.add(pack);
    const bedroll = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.34, 8), darkLeather);
    bedroll.rotation.z = Math.PI / 2;
    bedroll.position.y = 0.25;
    backpack.add(bedroll);
    art.add(backpack);
    sways.push({ mesh: backpack, baseRot: backpack.rotation.clone(), basePos: backpack.position.clone(), amp: 0.018, speed: 5.1, phase: 2.1, bob: 0.018 });

    [-1, 1].forEach(side => {
      const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.1), leather);
      pouch.position.set(side * 0.42, 0.88, -0.04);
      pouch.rotation.z = side * 0.18;
      art.add(pouch);
    });

    this._decorate(art);
    root.add(art);
    root.userData.characterArtApplied = true;
    root.userData.characterArt = {
      type: 'player',
      root: art,
      sways,
      pulses: [],
      t: Math.random() * 10
    };
  },

  applyEnemy(enemy) {
    if (!enemy || !enemy.mesh || enemy.mesh.userData.characterArtApplied) return;
    const type = enemy.typeId || '';
    const root = enemy.mesh;
    const art = new THREE.Group();
    art.name = `character-art-${type || 'enemy'}`;
    const sways = [];
    const pulses = [];

    if (type.includes('Bokoblin') || type === 'archerBokoblin') {
      this._addBokoblinArt(art, sways, enemy);
    } else if (type.includes('Moblin') || type === 'moblin' || type.includes('Hinox')) {
      this._addMoblinArt(art, sways, enemy);
    } else if (type.includes('Lizalfos')) {
      this._addLizalfosArt(art, sways, enemy);
    } else if (type.includes('Chuchu') || type === 'chuchu') {
      this._addChuchuArt(art, pulses, enemy);
    } else if (type === 'stal' || type.includes('Stal')) {
      this._addStalArt(art, pulses, enemy);
    } else if (type.includes('guardian') || type.includes('Guardian')) {
      this._addGuardianArt(art, pulses, enemy);
    } else if (enemy.boss || enemy.miniBoss) {
      this._addBossAccent(art, pulses, enemy);
    } else {
      this._addGenericEnemyArt(art, sways, enemy);
    }

    if (art.children.length === 0) return;
    this._decorate(art);
    root.add(art);
    root.userData.characterArtApplied = true;
    root.userData.characterArt = {
      type: 'enemy',
      enemyType: type,
      root: art,
      sways,
      pulses,
      t: Math.random() * 10,
      hurtMats: this._collectAccentMaterials(art)
    };
  },

  applyWorld(world, game) {
    if (game && game.player) this.applyPlayer(game.player);
    if (!world || !world.enemies) return;
    for (const enemy of world.enemies) this.applyEnemy(enemy);
  },

  update(dt, game) {
    this._time += dt;
    if (game && game.player) {
      this.applyPlayer(game.player);
      this._updateCharacterArt(game.player.mesh.userData.characterArt, dt, {
        speed: game.player.velocity ? Math.hypot(game.player.velocity.x || 0, game.player.velocity.z || 0) : 0,
        side: game.player.velocity ? this._sideMotion(game.player.velocity, game.player.facing || 0) : 0,
        hurt: game.player.invuln > 0 ? 0.2 : 0
      });
    }
    const world = game && game.currentWorld;
    if (!world || !world.enemies) return;
    for (const enemy of world.enemies) {
      if (!enemy || !enemy.mesh) continue;
      if (enemy._streamTier === 'dormant' || enemy.mesh.visible === false) continue;
      if (enemy._streamTier === 'passive' && !enemy.boss && !enemy.miniBoss && enemy.hurtTimer <= 0) {
        enemy._characterArtPassiveTimer = (enemy._characterArtPassiveTimer || 0) - dt;
        if (enemy._characterArtPassiveTimer > 0) continue;
        enemy._characterArtPassiveTimer = 0.16;
      }
      this.applyEnemy(enemy);
      this._updateCharacterArt(enemy.mesh && enemy.mesh.userData.characterArt, dt, {
        speed: enemy.velocity ? Math.hypot(enemy.velocity.x || 0, enemy.velocity.z || 0) : 0,
        hurt: enemy.hurtTimer || 0,
        dead: enemy.dead
      });
    }
  },

  _addBokoblinArt(art, sways, enemy) {
    const isElite = enemy.miniBoss || /black|silver|gold/i.test(enemy.typeId || '');
    const leather = this._mat('bokoLeather', 0x4a2a18, { roughness: 0.94 });
    const cloth = this._mat('bokoBanner', isElite ? 0xd8c26a : 0xb53a2e, { roughness: 0.88 });
    const bone = this._mat('boneCharm', 0xe8dcc0, { roughness: 0.8 });
    const paint = this._mat('warPaint', 0xffe28a, { roughness: 0.75, emissive: isElite ? 0x5f3600 : 0x000000, emissiveIntensity: isElite ? 0.08 : 0 });
    const scale = isElite ? 1.18 : 1.0;

    const banner = new THREE.Group();
    banner.name = 'bokoblin-back-banner';
    banner.position.set(0.27 * scale, 1.42 * scale, -0.42 * scale);
    banner.rotation.set(-0.08, 0.02, -0.12);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.2 * scale, 5), leather);
    pole.position.y = 0.2 * scale;
    banner.add(pole);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.32 * scale, 0.34 * scale, 0.035 * scale), cloth);
    flag.position.set(0.16 * scale, 0.62 * scale, 0);
    flag.rotation.z = 0.12;
    banner.add(flag);
    art.add(banner);
    sways.push({ mesh: flag, baseRot: flag.rotation.clone(), basePos: flag.position.clone(), amp: 0.12, speed: 4.4, phase: 0.2 });

    [-1, 0, 1].forEach((i) => {
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.045 * scale, 6, 4), bone);
      bead.position.set(i * 0.12 * scale, 1.05 * scale - Math.abs(i) * 0.03, 0.47 * scale);
      art.add(bead);
    });
    [-1, 1].forEach(side => {
      const shoulderBone = new THREE.Mesh(new THREE.ConeGeometry(0.055 * scale, 0.32 * scale, 4), bone);
      shoulderBone.position.set(side * 0.49 * scale, 1.15 * scale, 0.08 * scale);
      shoulderBone.rotation.set(Math.PI / 2, 0, side * 0.35);
      art.add(shoulderBone);

      const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.13 * scale, 0.035 * scale, 0.02 * scale), paint);
      cheek.position.set(side * 0.16 * scale, 1.53 * scale, 0.39 * scale);
      cheek.rotation.z = side * 0.24;
      art.add(cheek);
    });
  },

  _addMoblinArt(art, sways, enemy) {
    const elite = enemy.miniBoss || /silver|blue/i.test(enemy.typeId || '');
    const leather = this._mat('moblinLeather', 0x4c3020, { roughness: 0.92 });
    const metal = this._mat('moblinIron', elite ? 0xb9c8c1 : 0x8e7460, { roughness: 0.6, metalness: 0.22 });
    const bone = this._mat('moblinBone', 0xe8dcc0, { roughness: 0.82 });
    const cloth = this._mat('moblinCloth', elite ? 0xe7d57a : 0x6f2434, { roughness: 0.9 });

    [-1, 1].forEach(side => {
      const pauldron = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.18, 0.52), metal);
      pauldron.position.set(side * 1.25, 3.15, 0.1);
      pauldron.rotation.set(0.1, 0, side * 0.24);
      art.add(pauldron);

      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.44, 4), bone);
      spike.position.set(side * 1.38, 3.34, 0.08);
      spike.rotation.z = -side * 0.58;
      art.add(spike);
    });

    const trophy = new THREE.Group();
    trophy.name = 'moblin-trophy-rack';
    trophy.position.set(0, 3.15, -0.92);
    const cross = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 1.22, 5), leather);
    cross.rotation.z = Math.PI / 2;
    trophy.add(cross);
    [-1, 1].forEach(side => {
      const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.46, 5), bone);
      tusk.position.set(side * 0.55, 0.02, 0.02);
      tusk.rotation.z = side * 0.62;
      trophy.add(tusk);
    });
    art.add(trophy);

    const pennant = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.48, 0.04), cloth);
    pennant.position.set(0.2, 2.35, -0.95);
    pennant.rotation.z = 0.08;
    art.add(pennant);
    sways.push({ mesh: pennant, baseRot: pennant.rotation.clone(), basePos: pennant.position.clone(), amp: 0.09, speed: 3.4, phase: 1.4 });
  },

  _addLizalfosArt(art, sways, enemy) {
    const type = enemy.typeId || '';
    const accentColor = type.includes('yellow') ? 0xf2e85b : type.includes('red') ? 0xff7044 : 0x7ed7ff;
    const scaleMat = this._mat('lizalfosAccent', accentColor, { roughness: 0.72, emissive: accentColor, emissiveIntensity: 0.08 });
    const leather = this._mat('lizalfosLeather', 0x412616, { roughness: 0.92 });

    for (let i = 0; i < 6; i++) {
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.045 + i * 0.003, 0.18, 4), scaleMat);
      fin.position.set(0, 1.08 - i * 0.13, 0.02 - i * 0.14);
      fin.rotation.x = -0.9;
      art.add(fin);
      sways.push({ mesh: fin, baseRot: fin.rotation.clone(), basePos: fin.position.clone(), amp: 0.025, speed: 5.8, phase: i * 0.5 });
    }
    for (let i = 0; i < 3; i++) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.09 - i * 0.01, 0.015, 5, 10), leather);
      band.position.set(0, 0.68, -0.78 - i * 0.13);
      band.rotation.x = Math.PI / 2;
      art.add(band);
    }
    [-1, 1].forEach(side => {
      const ankleClaw = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.16, 4), scaleMat);
      ankleClaw.position.set(side * 0.22, 0.08, 0.16);
      ankleClaw.rotation.x = Math.PI / 2;
      art.add(ankleClaw);
    });
  },

  _addChuchuArt(art, pulses, enemy) {
    const type = enemy.typeId || '';
    const color = type.includes('fire') ? 0xff6a2a : type.includes('ice') ? 0x9be8ff : type.includes('shock') ? 0xffef62 : 0x5ec8ff;
    const coreMat = this._mat(`chuchuCore-${color}`, color, { roughness: 0.35, metalness: 0.0, emissive: color, emissiveIntensity: 0.55, transparent: true, opacity: 0.68 });
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 1), coreMat);
    core.position.set(0, 0.77, 0.16);
    art.add(core);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.018, 6, 18), coreMat);
    halo.position.set(0, 0.78, 0.12);
    halo.rotation.x = Math.PI / 2;
    art.add(halo);
    pulses.push({ mesh: core, material: coreMat, baseScale: core.scale.clone(), baseEmissive: 0.55, amp: 0.24, speed: 5.2, spin: 1.8 });
    pulses.push({ mesh: halo, material: coreMat, baseScale: halo.scale.clone(), baseEmissive: 0.35, amp: 0.14, speed: 4.2, spin: -1.2 });
  },

  _addStalArt(art, pulses, enemy) {
    const ghost = this._mat('stalGhost', 0x8ee8ff, { roughness: 0.4, emissive: 0x73dfff, emissiveIntensity: 0.35, transparent: true, opacity: 0.72 });
    [-1, 1].forEach(side => {
      const wisp = new THREE.Mesh(new THREE.SphereGeometry(0.065, 7, 5), ghost);
      wisp.position.set(side * 0.17, 1.35, 0.23);
      art.add(wisp);
      pulses.push({ mesh: wisp, material: ghost, baseScale: wisp.scale.clone(), baseEmissive: 0.35, amp: 0.4, speed: 7.5 + side, spin: side * 0.5 });
    });
    const crack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.035, 0.02), ghost);
    crack.position.set(0, 1.05, 0.19);
    crack.rotation.z = -0.25;
    art.add(crack);
  },

  _addGuardianArt(art, pulses, enemy) {
    const glow = this._mat('guardianGlow', 0x68d8ff, { roughness: 0.32, metalness: 0.2, emissive: 0x2bdcff, emissiveIntensity: 0.42, transparent: true, opacity: 0.8 });
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), glow);
    core.position.set(0, 0.82, 0.58);
    art.add(core);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.015, 6, 24), glow);
    ring.position.set(0, 0.82, 0.57);
    ring.rotation.x = Math.PI / 2;
    art.add(ring);
    pulses.push({ mesh: core, material: glow, baseScale: core.scale.clone(), baseEmissive: 0.42, amp: 0.18, speed: 6.8, spin: 0.7 });
    pulses.push({ mesh: ring, material: glow, baseScale: ring.scale.clone(), baseEmissive: 0.3, amp: 0.08, speed: 5.4, spin: 1.8 });
  },

  _addBossAccent(art, pulses, enemy) {
    const color = enemy.element === 'fire' ? 0xff6a2a : enemy.element === 'ice' ? 0x88ddff : enemy.element === 'shock' ? 0xffee44 : 0xaa55ff;
    const glow = this._mat(`bossGlow-${color}`, color, { roughness: 0.42, emissive: color, emissiveIntensity: 0.25, transparent: true, opacity: 0.62 });
    const aura = new THREE.Mesh(new THREE.TorusGeometry(enemy.radius ? enemy.radius * 0.72 : 0.8, 0.035, 6, 28), glow);
    aura.position.set(0, 0.15, 0);
    aura.rotation.x = Math.PI / 2;
    art.add(aura);
    pulses.push({ mesh: aura, material: glow, baseScale: aura.scale.clone(), baseEmissive: 0.22, amp: 0.16, speed: 2.8, spin: 0.45 });
  },

  _addGenericEnemyArt(art, sways, enemy) {
    const cloth = this._mat('enemyCloth', 0x754030, { roughness: 0.9 });
    const sash = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.075, 0.08), cloth);
    sash.position.set(0, 1.05, 0.36);
    sash.rotation.z = 0.28;
    art.add(sash);
    sways.push({ mesh: sash, baseRot: sash.rotation.clone(), basePos: sash.position.clone(), amp: 0.025, speed: 4.5, phase: 0.5 });
  },

  _updateCharacterArt(art, dt, state) {
    if (!art || !art.root) return;
    art.t += dt;
    const motion = Math.min(1, (state && state.speed ? state.speed : 0) / 5);
    const sideMotion = state && state.side ? THREE.MathUtils.clamp(state.side, -1, 1) : 0;
    const hurt = state && state.hurt > 0 ? 1 : 0;
    const time = art.t;

    for (const sway of art.sways || []) {
      if (!sway.mesh) continue;
      const wave = Math.sin(time * sway.speed + sway.phase);
      sway.mesh.rotation.copy(sway.baseRot);
      sway.mesh.position.copy(sway.basePos);
      sway.mesh.rotation.z += wave * sway.amp * (0.45 + motion * 0.9);
      sway.mesh.rotation.x += Math.cos(time * (sway.speed * 0.72) + sway.phase) * sway.amp * 0.28;
      sway.mesh.rotation.y += sideMotion * sway.amp * 0.45 * motion;
      if (sway.bob) sway.mesh.position.y += Math.abs(wave) * sway.bob * (0.35 + motion);
    }

    for (const pulse of art.pulses || []) {
      if (!pulse.mesh) continue;
      const wave = (Math.sin(time * pulse.speed) + 1) * 0.5;
      const scale = 1 + wave * pulse.amp + hurt * 0.08;
      pulse.mesh.scale.copy(pulse.baseScale).multiplyScalar(scale);
      if (pulse.spin) pulse.mesh.rotation.y += dt * pulse.spin;
      if (pulse.material && pulse.material.emissive) {
        pulse.material.emissiveIntensity = (pulse.baseEmissive || 0.2) + wave * 0.18 + hurt * 0.28;
      }
    }

    if (art.hurtMats) {
      for (const material of art.hurtMats) {
        if (material.emissive) {
          material.emissive.setHex(hurt ? 0xff3d22 : (material.userData.baseEmissive || 0x000000));
          material.emissiveIntensity = hurt ? 0.32 : (material.userData.baseEmissiveIntensity || 0);
        }
      }
    }

    if (state && state.dead && art.root.visible) {
      art.root.rotation.y += dt * 2.4;
    }
  },

  _mat(key, color, opts = {}) {
    const matKey = `${key}:${color}:${opts.opacity ?? 1}:${opts.emissive ?? 0}:${opts.metalness ?? 0}`;
    if (!this._materials[matKey]) {
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: opts.roughness ?? 0.85,
        metalness: opts.metalness ?? 0.05,
        flatShading: opts.flat !== false,
        transparent: !!opts.transparent,
        opacity: opts.opacity ?? 1,
        emissive: opts.emissive ?? 0x000000,
        emissiveIntensity: opts.emissiveIntensity ?? 0
      });
      material.userData.baseEmissive = opts.emissive ?? 0x000000;
      material.userData.baseEmissiveIntensity = opts.emissiveIntensity ?? 0;
      this._materials[matKey] = material;
    }
    return this._materials[matKey];
  },

  _decorate(group) {
    group.traverse(child => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material) {
        child.material.needsUpdate = true;
      }
    });
  },

  _collectAccentMaterials(group) {
    const mats = [];
    group.traverse(child => {
      if (!child.isMesh || !child.material) return;
      const list = Array.isArray(child.material) ? child.material : [child.material];
      for (const mat of list) {
        if (mat && !mats.includes(mat)) {
          mat.userData.baseEmissive = mat.emissive ? mat.emissive.getHex() : 0x000000;
          mat.userData.baseEmissiveIntensity = mat.emissiveIntensity || 0;
          mats.push(mat);
        }
      }
    });
    return mats;
  },

  _sideMotion(velocity, facing) {
    if (!velocity || !velocity.lengthSq || velocity.lengthSq() < 0.001) return 0;
    const v = velocity.clone().setY(0).normalize();
    const right = new THREE.Vector3(Math.cos(facing), 0, -Math.sin(facing));
    return right.dot(v);
  }
};

if (typeof window !== 'undefined') window.CharacterArtSystem = CharacterArtSystem;
