/* ========================================================
   AssetFactory.js v2 — 低多边形模型工厂（精致版）
   全部用 Three.js 几何体生成，零美术依赖
   v2: 更精细的玩家/武器/怪物造型，加入装备外观差异
   ======================================================== */

const AssetFactory = {

  // ---------- 工具 ----------
  _mat(color, opts = {}) {
    return new THREE.MeshStandardMaterial({
      color,
      flatShading: opts.flat !== false,
      roughness: opts.rough ?? 0.85,
      metalness: opts.metal ?? 0.1,
      emissive: opts.emissive ?? 0x000000,
      emissiveIntensity: opts.emissiveIntensity ?? 0
    });
  },
  _shiny(color, emissive = 0x000000) {
    return new THREE.MeshStandardMaterial({
      color, flatShading: true, roughness: 0.25, metalness: 0.7,
      emissive, emissiveIntensity: emissive ? 0.3 : 0
    });
  },
  _artMat(textureName, color, opts = {}) {
    const tint = typeof color === 'number' ? '#' + color.toString(16).padStart(6, '0') : color;
    const map = (typeof ArtAssets !== 'undefined') ? ArtAssets.materialTexture(textureName, opts.repeat || 1, tint) : null;
    const normalMap = (typeof ArtAssets !== 'undefined') ? ArtAssets.materialNormalTexture(textureName, opts.repeat || 1) : null;
    return new THREE.MeshStandardMaterial({
      color: map ? 0xffffff : color,
      map,
      normalMap,
      normalScale: normalMap ? new THREE.Vector2(opts.normalScale ?? 0.42, opts.normalScale ?? 0.42) : undefined,
      flatShading: opts.flat !== false,
      roughness: opts.rough ?? 0.85,
      metalness: opts.metal ?? 0.08,
      emissive: opts.emissive ?? 0x000000,
      emissiveIntensity: opts.emissiveIntensity ?? 0
    });
  },
  _streamLodDetail(obj) {
    if (!obj) return obj;
    obj.userData.streamLodDetail = true;
    obj.userData.streamBaseVisible = obj.visible !== false;
    if (obj.traverse) {
      obj.traverse(child => {
        child.userData.streamLodDetail = true;
        child.userData.streamBaseVisible = child.visible !== false;
      });
    }
    return obj;
  },

  // ---------- 玩家：绿衣勇者（精致版） ----------
  createLink() {
    const g = new THREE.Group();
    const skin = this._artMat('hero-skin', 0xf0c896, { flat: false, rough: 0.78 });
    const tunic = this._artMat('hero-tunic', 0xffffff, { flat: false, rough: 0.82 });
    const tunicDark = this._artMat('hero-tunic', 0x8fd0bc, { flat: false, rough: 0.86 });
    const trousers = this._artMat('hero-trousers', 0xffffff, { flat: false, rough: 0.86 });
    const leather = this._artMat('leather-straps', 0xffffff, { flat: false, rough: 0.88 });
    const blond = this._artMat('hero-hair', 0xf0c868, { flat: false, rough: 0.7 });
    const bootMat = this._artMat('leather-straps', 0x7a4a24, { flat: false, rough: 0.9 });
    const stitchMat = this._mat(0xd8bd76, { flat: false, rough: 0.9 });

    const legGeo = new THREE.CylinderGeometry(0.105, 0.135, 0.78, 6);
    const legL = new THREE.Mesh(legGeo, trousers); legL.position.set(-0.17, 0.43, 0); g.add(legL); legL.name = 'legL';
    const legR = new THREE.Mesh(legGeo, trousers); legR.position.set(0.17, 0.43, 0); g.add(legR); legR.name = 'legR';
    [-0.17, 0.17].forEach(x => {
      const seam = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.66, 0.035), stitchMat);
      seam.position.set(x + (x < 0 ? 0.08 : -0.08), 0.46, 0.14);
      g.add(seam);
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.38), bootMat);
      boot.position.set(x, 0.1, 0.05);
      g.add(boot);
      const cuff = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.08, 0.3), leather);
      cuff.position.set(x, 0.24, 0.02);
      g.add(cuff);
    });

    const hip = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.2, 0.42), tunicDark);
    hip.position.y = 0.88; g.add(hip);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.82, 0.38), tunic);
    body.position.y = 1.28; g.add(body); body.name = 'body';
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.36, 0.11), tunicDark);
    chest.position.set(0, 1.45, 0.24);
    chest.rotation.x = -0.08;
    g.add(chest);
    const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.06), stitchMat);
    chestPlate.position.set(0, 1.32, 0.29);
    chestPlate.rotation.x = -0.1;
    g.add(chestPlate);

    const skirtFront = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.42, 4), tunic);
    skirtFront.position.set(0, 0.88, 0.22);
    skirtFront.rotation.set(Math.PI, 0, Math.PI / 4);
    skirtFront.scale.set(1.1, 0.7, 0.28);
    g.add(skirtFront);
    const skirtBack = skirtFront.clone();
    skirtBack.position.z = -0.22;
    skirtBack.rotation.x = 0;
    g.add(skirtBack);

    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.13, 0.5), leather);
    belt.position.y = 0.93; g.add(belt);
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.12, 0.055), this._shiny(0xffd56a));
    buckle.position.set(0, 0.94, 0.27); g.add(buckle);
    [-1, 1].forEach(s => {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.78, 0.055), leather);
      strap.position.set(s * 0.19, 1.3, 0.25);
      strap.rotation.z = s * 0.3;
      g.add(strap);
    });

    const collar = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.28, 4), tunicDark);
    collar.position.set(0, 1.62, 0.24);
    collar.rotation.set(Math.PI, 0, Math.PI / 4);
    g.add(collar);
    const scarf = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.07), stitchMat);
    scarf.position.set(0, 1.58, 0.28);
    g.add(scarf);

    const upperArmGeo = new THREE.BoxGeometry(0.22, 0.34, 0.23);
    const lowerArmGeo = new THREE.BoxGeometry(0.19, 0.42, 0.2);
    const armL = new THREE.Group(); armL.position.set(-0.5, 1.32, 0); armL.name = 'armL';
    const armR = new THREE.Group(); armR.position.set(0.5, 1.32, 0); armR.name = 'armR';
    [armL, armR].forEach(arm => {
      const sleeve = new THREE.Mesh(upperArmGeo, tunic);
      sleeve.position.y = 0.12; arm.add(sleeve);
      const forearm = new THREE.Mesh(lowerArmGeo, skin);
      forearm.position.y = -0.25; arm.add(forearm);
      const bracer = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.22), leather);
      bracer.position.y = -0.46; arm.add(bracer);
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.18), skin);
      hand.position.y = -0.62; arm.add(hand);
      g.add(arm);
    });
    [-1, 1].forEach(s => {
      const shoulderPad = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.09, 0.32), tunicDark);
      shoulderPad.position.set(s * 0.48, 1.55, -0.01);
      shoulderPad.rotation.set(0.06, 0, s * 0.24);
      g.add(shoulderPad);
      const knee = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.08), leather);
      knee.position.set(s * 0.17, 0.5, 0.16);
      g.add(knee);
    });

    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.2), skin);
    neck.position.y = 1.72; g.add(neck);
    const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.34, 0), skin);
    head.scale.set(0.82, 0.92, 0.76);
    head.position.y = 2.0; g.add(head); head.name = 'head';
    const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.2, 0.54), blond);
    hairTop.position.set(0, 2.22, -0.02); g.add(hairTop);
    const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.42, 0.13), blond);
    hairBack.position.set(0, 1.96, -0.29); g.add(hairBack);
    [-1, 1].forEach(s => {
      const lock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 0.15), blond);
      lock.position.set(s * 0.25, 1.94, 0.12);
      lock.rotation.z = -s * 0.14;
      g.add(lock);
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 4), skin);
      ear.position.set(s * 0.33, 2.02, 0.02);
      ear.rotation.z = -s * 0.65;
      g.add(ear);
    });

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x3f87d8 });
    [-0.12, 0.12].forEach(x => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.08, 0.035), eyeMat);
      eye.position.set(x, 2.02, 0.255); g.add(eye);
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.026, 0.035), this._mat(0xc6922a));
      brow.position.set(x, 2.11, 0.26); g.add(brow);
    });

    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.86, 7), tunic);
    cap.position.set(0, 2.47, -0.12);
    cap.rotation.x = -0.85;
    cap.scale.set(0.82, 1, 0.82);
    g.add(cap);
    const capBand = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.08, 0.5), tunicDark);
    capBand.position.set(0, 2.25, 0.02);
    g.add(capBand);

    const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.58, 7), bootMat);
    quiver.rotation.z = Math.PI / 2;
    quiver.rotation.y = 0.18;
    quiver.position.set(0.22, 1.43, -0.39);
    g.add(quiver);
    const backBedroll = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.58, 8), leather);
    backBedroll.rotation.z = Math.PI / 2;
    backBedroll.position.set(-0.08, 1.28, -0.38);
    g.add(backBedroll);
    const backCloth = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.58, 0.06), tunicDark);
    backCloth.position.set(0, 1.18, -0.36);
    g.add(backCloth);

    g.userData.parts = { armL, armR, legL, legR, head, body };
    g.scale.set(0.92, 0.92, 0.92);
    return g;
  },

  createParaglider() {
    const g = new THREE.Group();
    const clothMat = this._artMat('cloth', 0xf2c96b, {
      flat: false,
      rough: 0.72,
      emissive: 0x3a2600,
      emissiveIntensity: 0.04
    });
    clothMat.side = THREE.DoubleSide;
    const trimMat = this._mat(0x7a4a24, { flat: false, rough: 0.82 });
    const cordMat = this._mat(0xe9ddad, { flat: false, rough: 0.7 });

    const canopyGeo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      -1.85, 0.00, 0.00,
      -1.15, 0.42, 0.05,
       0.00, 0.58, 0.10,
       1.15, 0.42, 0.05,
       1.85, 0.00, 0.00,
      -1.55,-0.34,-0.06,
      -0.55,-0.18, 0.00,
       0.55,-0.18, 0.00,
       1.55,-0.34,-0.06
    ]);
    canopyGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    canopyGeo.setIndex([
      0, 5, 1, 1, 5, 6, 1, 6, 2, 2, 6, 7,
      2, 7, 3, 3, 7, 8, 3, 8, 4
    ]);
    canopyGeo.computeVertexNormals();
    const canopy = new THREE.Mesh(canopyGeo, clothMat);
    canopy.position.set(0, 2.35, -0.48);
    canopy.rotation.x = -0.25;
    canopy.castShadow = true;
    g.add(canopy);

    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 3.65, 8), trimMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 2.1, -0.43);
    g.add(bar);

    for (const x of [-1.35, -0.45, 0.45, 1.35]) {
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.55, 6), cordMat);
      cord.position.set(x * 0.45, 1.42, -0.18);
      cord.rotation.x = x < 0 ? -0.16 : 0.16;
      cord.rotation.z = x * 0.12;
      g.add(cord);
    }

    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.08), trimMat);
    handle.position.set(0, 0.98, 0.08);
    g.add(handle);

    g.userData.parts = { canopy };
    g.visible = false;
    return g;
  },

  // ---------- 树（精致版 + 树皮贴图） ----------
  createTree() {
    const g = new THREE.Group();
    const trunkH = 1.6 + Math.random() * 0.6;
    const trunkMat = this._artMat('bark-rich', 0xffffff, { flat: false, rough: 0.95 });
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.26, trunkH, 8),
      trunkMat
    );
    trunk.position.y = trunkH / 2;
    trunk.castShadow = true;
    g.add(trunk);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.random() * 0.35;
      const root = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.09, 0.75, 5), trunkMat);
      root.position.set(Math.cos(a) * 0.27, 0.11, Math.sin(a) * 0.27);
      root.rotation.z = Math.cos(a) * 1.25;
      root.rotation.x = -Math.sin(a) * 1.25;
      this._streamLodDetail(root);
      g.add(root);
    }
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + Math.random() * 0.4;
      const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.075, 0.8, 5), trunkMat);
      branch.position.set(Math.cos(a) * 0.28, trunkH * (0.55 + i * 0.11), Math.sin(a) * 0.28);
      branch.rotation.z = Math.cos(a) * 0.75;
      branch.rotation.x = -Math.sin(a) * 0.75;
      this._streamLodDetail(branch);
      g.add(branch);
    }
    const leafMaps = [
      this._artMat('leaf-cluster', 0xffffff, { flat: false, rough: 0.9 }),
      this._artMat('leaf-cluster', 0xa8cf82, { flat: false, rough: 0.92 }),
      this._artMat('leaf-cluster', 0x6fa65a, { flat: false, rough: 0.92 })
    ];
    const canopyCenters = [
      [0, trunkH + 1.05, 0, 1.15],
      [-0.55, trunkH + 0.72, 0.12, 0.82],
      [0.58, trunkH + 0.78, -0.18, 0.86],
      [0.1, trunkH + 1.55, 0.05, 0.72],
      [-0.18, trunkH + 0.42, -0.58, 0.7],
      [0.34, trunkH + 0.36, 0.56, 0.66]
    ];
    canopyCenters.forEach((c, i) => {
      const clump = new THREE.Mesh(
        new THREE.IcosahedronGeometry(c[3], 1),
        leafMaps[i % leafMaps.length]
      );
      clump.position.set(c[0] + (Math.random() - 0.5) * 0.22, c[1] + (Math.random() - 0.5) * 0.16, c[2] + (Math.random() - 0.5) * 0.22);
      clump.scale.set(1.12 + Math.random() * 0.22, 0.72 + Math.random() * 0.2, 0.98 + Math.random() * 0.2);
      clump.rotation.set(Math.random() * 0.4, Math.random() * Math.PI, Math.random() * 0.35);
      clump.castShadow = true;
      clump.receiveShadow = true;
      if (i >= 3) this._streamLodDetail(clump);
      g.add(clump);
    });
    for (let i = 0; i < 5; i++) {
      const a = Math.random() * Math.PI * 2;
      const leafPatch = new THREE.Mesh(
        new THREE.CircleGeometry(0.34 + Math.random() * 0.18, 7),
        this._artMat('leaf-cluster', i % 2 ? 0x739d52 : 0xb4ce78, { flat: false, rough: 0.95 })
      );
      leafPatch.position.set(Math.cos(a) * (0.55 + Math.random() * 0.35), trunkH + 0.82 + Math.random() * 0.85, Math.sin(a) * (0.55 + Math.random() * 0.35));
      leafPatch.rotation.set(Math.random() * 0.7, a, Math.random() * 0.55);
      this._streamLodDetail(leafPatch);
      g.add(leafPatch);
    }
    g.userData.collisionRadius = 0.9;
    g.userData.kind = 'tree';
    return g;
  },

  // ---------- 松树（高瘦） ----------
  createPine() {
    const g = new THREE.Group();
    const trunkMat = this._artMat('bark-rich', 0x7a4a24, { flat: false, rough: 0.95 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 1.2, 5), trunkMat);
    trunk.position.y = 0.6; g.add(trunk);
    const needleMat = this._artMat('pine-needles', 0xffffff, { flat: false, rough: 0.92 });
    for (let i = 0; i < 4; i++) {
      const c = new THREE.Mesh(new THREE.ConeGeometry(1.0 - i * 0.2, 0.9, 6), needleMat || this._mat(0x2a6a3a));
      c.position.y = 1.0 + i * 0.55; g.add(c);
      if (i >= 2) this._streamLodDetail(c);
    }
    g.userData.collisionRadius = 0.8;
    g.userData.kind = 'tree';
    return g;
  },

  // ---------- 石头（用岩石贴图） ----------
  createRock(scale = 1) {
    const g = new THREE.Group();
    const geo = new THREE.DodecahedronGeometry(0.6 * scale, 0);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setXYZ(i,
        pos.getX(i) * (0.85 + Math.random() * 0.3),
        pos.getY(i) * (0.85 + Math.random() * 0.3),
        pos.getZ(i) * (0.85 + Math.random() * 0.3)
      );
    }
    geo.computeVertexNormals();
    const rockMat = this._artMat('mossy-stone', 0xffffff, { flat: false, rough: 0.92 });
    const rock = new THREE.Mesh(geo, rockMat);
    rock.position.y = 0.4 * scale;
    rock.castShadow = true;
    g.add(rock);
    const moss = new THREE.Mesh(new THREE.BoxGeometry(0.45 * scale, 0.035 * scale, 0.35 * scale), this._artMat('leaf-cluster', 0x7aa45a, { flat: false, rough: 0.95 }));
    moss.position.set(-0.12 * scale, 0.78 * scale, 0.05 * scale);
    moss.rotation.set(0.2, Math.random() * Math.PI, 0.1);
    this._streamLodDetail(moss);
    g.add(moss);
    if (Math.random() > 0.5) {
      const small = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2 * scale, 0),
        this._artMat('mossy-stone', 0xc8c6b8, { flat: false, rough: 0.92 }));
      small.position.set(0.7 * scale, 0.15 * scale, 0.3 * scale);
      this._streamLodDetail(small);
      g.add(small);
    }
    g.userData.collisionRadius = 0.65 * scale;
    g.userData.kind = 'rock';
    return g;
  },

  // ---------- 灌木 ----------
  createBush() {
    const g = new THREE.Group();
    const greens = [0x2a6a2a, 0x3a7a3a];
    const bushMat = this._artMat('bush-leaves', 0xffffff, { flat: false, rough: 0.93 });
    for (let i = 0; i < 3; i++) {
      const bush = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.4 + Math.random() * 0.15, 1),
        bushMat || this._mat(greens[i % greens.length])
      );
      bush.position.set((Math.random() - 0.5) * 0.4, 0.3 + Math.random() * 0.2, (Math.random() - 0.5) * 0.4);
      bush.scale.y = 0.7;
      if (i >= 2) this._streamLodDetail(bush);
      g.add(bush);
    }
    if (Math.random() > 0.4) {
      for (let i = 0; i < 3; i++) {
        const berry = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), this._mat(0xcc2222));
        berry.position.set((Math.random() - 0.5) * 0.6, 0.4 + Math.random() * 0.3, (Math.random() - 0.5) * 0.6);
        this._streamLodDetail(berry);
        g.add(berry);
      }
    }
    g.userData.kind = 'bush';
    return g;
  },

  // ---------- 花（装饰，无碰撞） ----------
  createFlower() {
    const g = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4), this._mat(0x3a7a2a));
    stem.position.y = 0.15; g.add(stem);
    const colors = [0xff5a7a, 0xffd54f, 0xff8a3a, 0xe85aff, 0xffffff];
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 0), this._mat(colors[Math.floor(Math.random()*colors.length)]));
    head.position.y = 0.32; g.add(head);
    return g;
  },

  // ---------- 草丛 ----------
  createGrassTuft() {
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const blade = new THREE.Mesh(
        new THREE.ConeGeometry(0.05, 0.35 + Math.random() * 0.2, 3),
        this._mat(Math.random() > 0.5 ? 0x4a8a3a : 0x5a9a4a)
      );
      blade.position.set((Math.random() - 0.5) * 0.3, 0.15, (Math.random() - 0.5) * 0.3);
      blade.rotation.z = (Math.random() - 0.5) * 0.3;
      if (i >= 2) this._streamLodDetail(blade);
      g.add(blade);
    }
    return g;
  },

  // ---------- 宝箱（精致版） ----------
  createChest() {
    const g = new THREE.Group();
    const goldTex = Textures.metal('#f6bd38');
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: goldTex,
      roughness: 0.32,
      metalness: 0.58,
      flatShading: false,
      emissive: 0x5a3600,
      emissiveIntensity: 0.22
    });
    const metalTex = Textures.metal('#ffe07a');
    // 箱体
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 0.7), woodMat);
    base.position.y = 0.3; g.add(base);
    // 金属包边
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: metalTex, roughness: 0.2, metalness: 0.86, flatShading: false, emissive: 0x8a5400, emissiveIntensity: 0.26 });
    const trimFront = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.08, 0.02), trimMat);
    trimFront.position.set(0, 0.3, 0.36); g.add(trimFront);
    const trimBack = trimFront.clone(); trimBack.position.z = -0.36; g.add(trimBack);
    // 盖子
    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.25, 0.7), woodMat);
    lid.position.y = 0.72; g.add(lid); lid.name = 'lid';
    const lidTrim = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.05, 0.02), trimMat);
    lidTrim.position.set(0, 0.72, 0.36); g.add(lidTrim);
    // 金锁
    const lockMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: Textures.metal('#ffd54f'), roughness: 0.2, metalness: 0.85, flatShading: false, emissive: 0xffc33a, emissiveIntensity: 0.35 });
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.05), lockMat);
    lock.position.set(0, 0.5, 0.36); g.add(lock);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffd86a, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide });
    const glow = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 1.08, 0.04, 18, 1, true), glowMat);
    glow.position.y = 0.04;
    glow.name = 'chestGlow';
    g.add(glow);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.1, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.y = 0.78;
    beam.name = 'chestBeam';
    g.add(beam);
    g.userData.kind = 'chest';
    g.userData.collisionRadius = 0.7;
    g.userData.parts = Object.assign(g.userData.parts || {}, { glow, beam, lid });
    return g;
  },

  // ---------- 光柱（拾取物标记，旋转发光） ----------
  createPickupBeam(color = 0xffd54f) {
    const g = new THREE.Group();
    // 主光柱（半透明）
    const beam = new THREE.Mesh(
      new THREE.ConeGeometry(0.45, 2.4, 6, 1, true),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false })
    );
    beam.position.y = 1.2;
    g.add(beam);
    // 内层亮光柱
    const innerBeam = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 2.0, 5, 1, true),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false })
    );
    innerBeam.position.y = 1.0;
    g.add(innerBeam);
    // 底部光圈
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.06, 6, 20),
      new THREE.MeshBasicMaterial({ color })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.05;
    g.add(ring);
    // 点光源（让附近发亮）
    const light = new THREE.PointLight(color, 0.8, 3);
    light.position.y = 1.0;
    g.add(light);
    g.userData.kind = 'pickup';
    g.userData.spin = true;
    return g;
  },

  // ---------- 怪物：波克布林（精致版） ----------
  createBokoblin(color = 0xcc4444, big = false, role = 'melee') {
    const g = new THREE.Group();
    const s = big ? 1.4 : 1.0;
    const mat = this._artMat('bokoblin-skin', color, { flat: false });
    const darkMat = this._artMat('bokoblin-skin', color * 0.7 | 0, { flat: false });
    const isBlue = color === 0x4477cc;
    const isBlack = color === 0x2a2a2a;
    const isSilver = color === 0xddddcc;

    // 身体（梨形）
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.5 * s, 7, 6), mat);
    body.scale.set(role === 'shield' ? 1.22 : 1, role === 'archer' ? 1.05 : 1.15, role === 'shield' ? 1.05 : 0.95);
    body.position.y = 0.85 * s;
    g.add(body);
    // 肚子（浅色）
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.35 * s, 6, 5), this._artMat('hero-skin', 0xddaa88, { flat: false }));
    belly.scale.set(1, 1.1, 0.5);
    belly.position.set(0, 0.8 * s, 0.35 * s);
    g.add(belly);
    // 头
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38 * s, 7, 6), mat);
    head.position.y = 1.45 * s;
    g.add(head);
    // 标志性长鼻
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.16 * s, 0.55 * s, 5), mat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 1.42 * s, 0.48 * s);
    g.add(nose);
    // 鼻头（深色）
    const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.08 * s, 5, 4), darkMat);
    noseTip.position.set(0, 1.42 * s, 0.75 * s);
    g.add(noseTip);
    // 角（2 个，向后弯）
    const hornMat = this._mat(0xf0e0c0);
    const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.07 * s, 0.4 * s, 4), hornMat);
    hornL.position.set(-0.18 * s, 1.78 * s, -0.05 * s);
    hornL.rotation.set(0.4, 0, 0.35);
    g.add(hornL);
    const hornR = hornL.clone(); hornR.position.x = 0.18 * s; hornR.rotation.z = -0.35;
    g.add(hornR);
    // 尖耳朵
    const earGeo = new THREE.ConeGeometry(0.11 * s, 0.32 * s, 4);
    const earL = new THREE.Mesh(earGeo, mat); earL.position.set(-0.4 * s, 1.55 * s, 0); earL.rotation.z = 0.7; g.add(earL);
    const earR = new THREE.Mesh(earGeo, mat); earR.position.set(0.4 * s, 1.55 * s, 0); earR.rotation.z = -0.7; g.add(earR);
    // 眼睛（黄色发光）
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffee44 });
    [-0.13, 0.13].forEach(x => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07 * s, 6, 5), eyeMat);
      eye.position.set(x * s, 1.5 * s, 0.32 * s);
      g.add(eye);
      // 瞳孔
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.03 * s, 5, 4), new THREE.MeshBasicMaterial({ color: 0x000000 }));
      pupil.position.set(x * s, 1.5 * s, 0.37 * s);
      g.add(pupil);
    });
    // 腿
    const legGeo = new THREE.CylinderGeometry(0.13 * s, 0.16 * s, 0.5 * s, 5);
    const legL = new THREE.Mesh(legGeo, mat); legL.position.set(-0.2 * s, 0.25 * s, 0); g.add(legL); legL.name = 'legL';
    const legR = new THREE.Mesh(legGeo, mat); legR.position.set(0.2 * s, 0.25 * s, 0); g.add(legR); legR.name = 'legR';
    // 手臂
    const armGeo = new THREE.CylinderGeometry(0.1 * s, 0.12 * s, 0.55 * s, 5);
    const armL = new THREE.Mesh(armGeo, mat); armL.position.set(-0.55 * s, 0.85 * s, 0); g.add(armL); armL.name = 'armL';
    const armR = new THREE.Mesh(armGeo, mat); armR.position.set(0.55 * s, 0.85 * s, 0); g.add(armR); armR.name = 'armR';
    const furMat = this._artMat('monster-fur', 0x6a3f22, { flat: false, rough: 0.9 });
    const leather = this._artMat('leather-straps', 0x7a4a24, { flat: false, rough: 0.9 });
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.42 * s, 0.045 * s, 5, 12), leather);
    belt.position.y = 0.72 * s;
    belt.rotation.x = Math.PI / 2;
    g.add(belt);
    const loin = new THREE.Mesh(new THREE.ConeGeometry(0.28 * s, 0.42 * s, 4), furMat);
    loin.position.set(0, 0.55 * s, 0.28 * s);
    loin.rotation.set(Math.PI, 0, Math.PI / 4);
    loin.scale.z = 0.35;
    g.add(loin);
    [-1, 1].forEach(side => {
      const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.115 * s, 0.026 * s, 5, 8), leather);
      cuff.position.set(side * 0.55 * s, 0.58 * s, 0);
      cuff.rotation.x = Math.PI / 2;
      g.add(cuff);
      const anklet = new THREE.Mesh(new THREE.TorusGeometry(0.135 * s, 0.025 * s, 5, 8), leather);
      anklet.position.set(side * 0.2 * s, 0.08 * s, 0);
      anklet.rotation.x = Math.PI / 2;
      g.add(anklet);
    });
    const crest = new THREE.Mesh(new THREE.ConeGeometry((role === 'elite' ? 0.16 : 0.11) * s, (role === 'elite' ? 0.48 : 0.34) * s, 4), darkMat);
    crest.position.set(0, 1.88 * s, -0.02 * s);
    crest.rotation.x = -0.25;
    g.add(crest);
    const rankMat = isSilver ? this._shiny(0xd8d0bc)
      : isBlack ? this._mat(0x3a3230, { flat: false, metal: 0.25 })
      : isBlue ? this._mat(0x2f4e88, { flat: false, metal: 0.12 })
      : null;
    if (rankMat) {
      const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.42 * s, 0.26 * s, 0.08 * s), rankMat);
      chestPlate.position.set(0, 0.95 * s, 0.48 * s);
      chestPlate.rotation.x = -0.16;
      g.add(chestPlate);
      [-1, 1].forEach(side => {
        const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.18 * s, 0.12 * s, 0.24 * s), rankMat);
        shoulder.position.set(side * 0.42 * s, 1.08 * s, 0.05 * s);
        shoulder.rotation.z = side * 0.28;
        g.add(shoulder);
      });
    }
    if (isBlack || isSilver) {
      const banner = new THREE.Mesh(new THREE.BoxGeometry(0.08 * s, 0.58 * s, 0.04 * s), isSilver ? this._mat(0xf0e8d0) : this._mat(0x7a1d1d));
      banner.position.set(0.28 * s, 1.25 * s, -0.45 * s);
      banner.rotation.x = 0.28;
      g.add(banner);
      const boneCrest = new THREE.Mesh(new THREE.ConeGeometry(0.08 * s, 0.38 * s, 4), hornMat);
      boneCrest.position.set(0, 2.03 * s, 0.02 * s);
      boneCrest.rotation.x = -0.18;
      g.add(boneCrest);
    }
    if (role === 'archer') {
      const bow = this.createBowMesh('travelerBow');
      bow.scale.setScalar(0.78 * s);
      bow.position.set(0.03 * s, -0.35 * s, 0.1 * s);
      bow.rotation.set(0.25, 0.1, 0.2);
      armR.add(bow);
      const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * s, 0.1 * s, 0.55 * s, 7), leather);
      quiver.rotation.z = Math.PI / 2;
      quiver.position.set(-0.28 * s, 1.04 * s, -0.42 * s);
      g.add(quiver);
      for (let i = 0; i < 3; i++) {
        const arrow = new THREE.Mesh(new THREE.CylinderGeometry(0.012 * s, 0.012 * s, 0.42 * s, 4), this._mat(0xe8d8a8));
        arrow.rotation.z = Math.PI / 2;
        arrow.position.set((-0.33 + i * 0.035) * s, 1.12 * s, -0.42 * s);
        g.add(arrow);
      }
    } else {
      // ★ 右手持武器：木棒（波克布林的标志性武器）
      const club = new THREE.Mesh(
        new THREE.BoxGeometry((isBlack || isSilver || role === 'elite' ? 0.16 : 0.12) * s, (isBlack || isSilver || role === 'elite' ? 0.9 : 0.7) * s, (isBlack || isSilver || role === 'elite' ? 0.16 : 0.12) * s),
        this._mat(0x6a4a2a)
      );
      club.position.set(0, -0.4 * s, 0);  // 挂在手臂下方
      club.castShadow = true;
      armR.add(club);
      if (isSilver || role === 'elite') {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.045 * s, 0.18 * s, 4), this._shiny(0xd8d0bc));
        spike.position.set(0, -0.86 * s, 0);
        spike.rotation.x = Math.PI;
        armR.add(spike);
      }
    }
    if (role === 'shield') {
      const shield = this.createShieldMesh('soldierShield');
      shield.scale.setScalar(0.58 * s);
      shield.position.set(-0.08 * s, -0.18 * s, 0.08 * s);
      shield.rotation.set(0.05, 0.12, 0.2);
      armL.add(shield);
      const mask = new THREE.Mesh(new THREE.BoxGeometry(0.42 * s, 0.22 * s, 0.06 * s), rankMat || this._mat(0x5a4a3a, { flat: false, metal: 0.18 }));
      mask.position.set(0, 1.49 * s, 0.42 * s);
      g.add(mask);
    }
    g.userData.parts = { legL, legR, armL, armR, head, body };
    g.userData.enemyRole = role;
    return g;
  },

  // ---------- 八爪章鱼怪 ----------
  createOctorok() {
    const g = new THREE.Group();
    const mat = this._mat(0x8a3a6a);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 7), mat);
    body.position.y = 0.55; body.scale.y = 0.75;
    g.add(body);
    // 触手
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const t = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 5), this._mat(0x6a2a5a));
      t.position.set(Math.cos(a) * 0.42, 0.2, Math.sin(a) * 0.42);
      t.rotation.x = Math.PI;
      g.add(t);
    }
    // 眼睛
    [-0.15, 0.15].forEach(x => {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffff66 }));
      e.position.set(x, 0.75, 0.4); g.add(e);
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.04, 5, 4), new THREE.MeshBasicMaterial({ color: 0x000000 }));
      p.position.set(x, 0.75, 0.47); g.add(p);
    });
    g.userData.parts = { body };
    return g;
  },

  // ---------- 莫力布林 ----------
  createMoblin() {
    const g = new THREE.Group();
    const s = 1.8;
    const mat = this._artMat('moblin-hide', 0x553388, { flat: false });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.7 * s, 8, 7), mat);
    body.scale.set(1, 1.2, 1); body.position.y = 1.3 * s;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.5 * s, 7, 6), mat);
    head.position.y = 2.4 * s; g.add(head);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.22 * s, 0.8 * s, 5), mat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 2.3 * s, 0.6 * s);
    g.add(nose);
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.12 * s, 0.6 * s, 4), this._mat(0xf0e0c0));
    horn.position.set(0, 3.0 * s, 0); g.add(horn);
    // 獠牙
    const tuskL = new THREE.Mesh(new THREE.ConeGeometry(0.06 * s, 0.25 * s, 4), this._mat(0xfff8e0));
    tuskL.position.set(-0.15 * s, 2.2 * s, 0.35 * s); tuskL.rotation.x = Math.PI;
    g.add(tuskL);
    const tuskR = tuskL.clone(); tuskR.position.x = 0.15 * s; g.add(tuskR);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff4444 });
    [-0.18, 0.18].forEach(x => {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.08 * s, 6, 5), eyeMat);
      e.position.set(x * s, 2.5 * s, 0.4 * s); g.add(e);
    });
    const legGeo = new THREE.CylinderGeometry(0.2 * s, 0.28 * s, 0.8 * s, 5);
    const legL = new THREE.Mesh(legGeo, mat); legL.position.set(-0.3 * s, 0.4 * s, 0); g.add(legL); legL.name = 'legL';
    const legR = new THREE.Mesh(legGeo, mat); legR.position.set(0.3 * s, 0.4 * s, 0); g.add(legR); legR.name = 'legR';
    const armGeo = new THREE.CylinderGeometry(0.15 * s, 0.18 * s, 0.9 * s, 5);
    const armL = new THREE.Mesh(armGeo, mat); armL.position.set(-0.8 * s, 1.3 * s, 0); g.add(armL); armL.name = 'armL';
    const armR = new THREE.Mesh(armGeo, mat); armR.position.set(0.8 * s, 1.3 * s, 0); g.add(armR); armR.name = 'armR';
    const leather = this._artMat('leather-straps', 0x6a4a2a, { flat: false, rough: 0.9 });
    const fur = this._artMat('monster-fur', 0x402818, { flat: false, rough: 0.92 });
    const chestGuard = new THREE.Mesh(new THREE.BoxGeometry(0.75 * s, 0.48 * s, 0.12 * s), leather);
    chestGuard.position.set(0, 1.72 * s, 0.64 * s);
    chestGuard.rotation.x = -0.12;
    g.add(chestGuard);
    const maneMat = this._artMat('monster-fur', 0x2f1a16, { flat: false, rough: 0.95 });
    for (let i = 0; i < 5; i++) {
      const mane = new THREE.Mesh(new THREE.ConeGeometry(0.09 * s, 0.32 * s, 4), maneMat);
      mane.position.set(0, (2.55 - i * 0.26) * s, (-0.36 - i * 0.05) * s);
      mane.rotation.x = -0.8;
      g.add(mane);
    }
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.52 * s, 0.055 * s, 5, 14), leather);
    belt.position.y = 0.9 * s;
    belt.rotation.x = Math.PI / 2;
    g.add(belt);
    const loin = new THREE.Mesh(new THREE.ConeGeometry(0.34 * s, 0.62 * s, 4), fur);
    loin.position.set(0, 0.68 * s, 0.36 * s);
    loin.rotation.set(Math.PI, 0, Math.PI / 4);
    loin.scale.z = 0.32;
    g.add(loin);
    [-1, 1].forEach(side => {
      const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.34 * s, 0.16 * s, 0.42 * s), leather);
      shoulder.position.set(side * 0.66 * s, 1.75 * s, 0.08 * s);
      shoulder.rotation.z = side * 0.28;
      g.add(shoulder);
      const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.18 * s, 0.028 * s, 5, 9), leather);
      cuff.position.set(side * 0.8 * s, 0.93 * s, 0);
      cuff.rotation.x = Math.PI / 2;
      g.add(cuff);
      const wristGuard = new THREE.Mesh(new THREE.BoxGeometry(0.28 * s, 0.16 * s, 0.28 * s), leather);
      wristGuard.position.set(side * 0.8 * s, 0.98 * s, 0.03 * s);
      wristGuard.rotation.z = side * 0.12;
      g.add(wristGuard);
      const footClaw = new THREE.Mesh(new THREE.ConeGeometry(0.07 * s, 0.22 * s, 4), this._mat(0xe8dec6));
      footClaw.position.set(side * 0.3 * s, 0.03 * s, 0.28 * s);
      footClaw.rotation.x = Math.PI / 2;
      g.add(footClaw);
    });
    const spearShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045 * s, 0.055 * s, 1.9 * s, 6), leather);
    spearShaft.position.set(0, -0.15 * s, 0.08 * s);
    spearShaft.rotation.x = 0.22;
    const spearHead = new THREE.Mesh(new THREE.ConeGeometry(0.13 * s, 0.38 * s, 5), this._artMat('aged-bone', 0xe8dec6, { flat: false }));
    spearHead.position.set(0, -1.16 * s, 0.28 * s);
    spearHead.rotation.x = Math.PI;
    armR.add(spearShaft, spearHead);
    const spearFlag = new THREE.Mesh(new THREE.BoxGeometry(0.18 * s, 0.26 * s, 0.035 * s), fur);
    spearFlag.position.set(0.12 * s, -0.76 * s, 0.2 * s);
    spearFlag.rotation.z = 0.2;
    armR.add(spearFlag);
    g.userData.parts = { legL, legR, armL, armR, head, body };
    return g;
  },

  // ---------- 骷髅兵 ----------
  createStal() {
    const g = new THREE.Group();
    const bone = this._artMat('aged-bone', 0xeae0c8, { flat: false });
    const darkBone = this._artMat('aged-bone', 0xb8a890, { flat: false });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.85, 0.28), bone);
    body.position.y = 1.0; g.add(body);
    const rag = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.42, 4), this._artMat('monster-fur', 0x3a3330, { flat: false, rough: 0.95 }));
    rag.position.set(0, 0.72, 0.18);
    rag.rotation.set(Math.PI, 0, Math.PI / 4);
    rag.scale.z = 0.32;
    g.add(rag);
    // 肋骨条纹
    for (let i = 0; i < 3; i++) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.06, 0.04), darkBone);
      rib.position.set(0, 0.8 + i * 0.2, 0.16); g.add(rib);
    }
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.45), bone);
    head.position.y = 1.7; g.add(head);
    // 眼洞（蓝色发光）
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x44ddff });
    [-0.12, 0.12].forEach(x => {
      const e = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.05), eyeMat);
      e.position.set(x, 1.75, 0.23); g.add(e);
    });
    // 牙齿
    for (let i = 0; i < 4; i++) {
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.03), darkBone);
      tooth.position.set(-0.12 + i * 0.08, 1.55, 0.23); g.add(tooth);
    }
    const armGeo = new THREE.BoxGeometry(0.1, 0.7, 0.1);
    const armL = new THREE.Mesh(armGeo, bone); armL.position.set(-0.3, 1.0, 0); g.add(armL); armL.name = 'armL';
    const armR = new THREE.Mesh(armGeo, bone); armR.position.set(0.3, 1.0, 0); g.add(armR); armR.name = 'armR';
    const legGeo = new THREE.BoxGeometry(0.13, 0.7, 0.13);
    const legL = new THREE.Mesh(legGeo, bone); legL.position.set(-0.13, 0.35, 0); g.add(legL); legL.name = 'legL';
    const legR = new THREE.Mesh(legGeo, bone); legR.position.set(0.13, 0.35, 0); g.add(legR); legR.name = 'legR';
    const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.032, 1.15, 5), darkBone);
    spear.position.set(0, -0.25, 0.06);
    spear.rotation.x = 0.28;
    const spearTip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 4), bone);
    spearTip.position.set(0, -0.9, 0.2);
    spearTip.rotation.x = Math.PI;
    armR.add(spear, spearTip);
    g.userData.parts = { armL, armR, legL, legR, head };
    return g;
  },

  // ---------- 守护者 ----------
  createGuardian() {
    const g = new THREE.Group();
    const metal = this._artMat('guardian-plates', 0x3a5a7a, { flat: false, rough: 0.4, metal: 0.6 });
    const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.9, 0), metal);
    body.scale.set(1.2, 0.7, 1.2); body.position.y = 1.2;
    g.add(body);
    // 头部装甲条
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.06, 4, 8), this._mat(0x5a7a9a, { metal: 0.7 }));
    stripe.rotation.x = Math.PI / 2; stripe.position.y = 1.2; stripe.scale.set(1.2, 1, 1.2);
    g.add(stripe);
    // 单眼（蓝色发光）
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0x66ddff }));
    eye.position.set(0, 1.2, 0.85); g.add(eye);
    const eyeLight = new THREE.PointLight(0x66ddff, 1.0, 4);
    eyeLight.position.copy(eye.position); g.add(eyeLight);
    // 6 条机械腿
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 1.3, 4), metal);
      leg.position.set(Math.cos(a) * 0.75, 0.65, Math.sin(a) * 0.75);
      leg.rotation.z = -Math.cos(a) * 0.7;
      leg.rotation.x = Math.sin(a) * 0.7;
      g.add(leg);
      // 脚
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.15), metal);
      foot.position.set(Math.cos(a) * 1.2, 0.04, Math.sin(a) * 1.2);
      g.add(foot);
    }
    g.userData.parts = { body, eye };
    return g;
  },

  // ---------- Boss：岩石巨像 ----------
  createStoneTalus() {
    const g = new THREE.Group();
    const rockMat = this._mat(0x7a6a5a);
    const rockMatDark = this._mat(0x5a4a3a);
    // 身体（多块岩石堆叠）
    const body = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2, 0), rockMat);
    body.position.y = 2.5; g.add(body);
    const body2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 0), rockMatDark);
    body2.position.set(0.5, 3.5, 0.3); g.add(body2);
    // 头
    const head = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1, 0), rockMat);
    head.position.y = 4.8; g.add(head);
    // 弱点（橙色发光矿石）
    const weak = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0),
      new THREE.MeshBasicMaterial({ color: 0xff8800 }));
    weak.position.set(0, 5.3, 0.95);
    g.add(weak);
    const weakLight = new THREE.PointLight(0xff8800, 2.0, 8);
    weakLight.position.copy(weak.position); g.add(weakLight);
    g.userData.weakSpot = weak;
    // 手臂（两个大岩石）
    [-1, 1].forEach(s => {
      const arm = new THREE.Mesh(new THREE.DodecahedronGeometry(1.0, 0), rockMat);
      arm.position.set(s * 2.2, 2.2, 0); g.add(arm);
    });
    g.userData.parts = { body, head, weak };
    return g;
  },

  // ---------- NPC：老爷爷 ----------
  createOldMan() {
    const g = new THREE.Group();
    const robe = this._artMat('desert-fabric', 0x7a5d42, { flat: false, rough: 0.9 });
    const cloakMat = this._artMat('leather-straps', 0x4b3025, { flat: false, rough: 0.92 });
    const skin = this._artMat('hero-skin', 0xe0c0a0, { flat: false });
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.25, 6), robe);
    body.position.y = 0.75; g.add(body);
    const chestWrap = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.45, 0.08), cloakMat);
    chestWrap.position.set(0, 1.15, 0.27); g.add(chestWrap);
    const sash = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.05, 0.075), this._artMat('carved-wood', 0xb88745, { flat: false, rough: 0.86 }));
    sash.position.set(-0.18, 1.05, 0.34);
    sash.rotation.z = 0.32;
    g.add(sash);
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.1, 0.12), this._artMat('leather-straps', 0x6a4228, { flat: false, rough: 0.9 }));
    belt.position.set(0, 0.82, 0.2);
    g.add(belt);
    const cloak = new THREE.Mesh(new THREE.BoxGeometry(0.96, 1.35, 0.12), cloakMat);
    cloak.position.set(0, 0.95, -0.3); g.add(cloak);
    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.55, 6), cloakMat);
    hood.position.set(0, 2.05, -0.05); g.add(hood);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.45), skin);
    head.position.y = 1.8; g.add(head);
    const beard = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.11), this._mat(0xeaeaea, { flat: false }));
    beard.position.set(0, 1.55, 0.25); g.add(beard);
    const beard2 = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.38, 5), this._mat(0xdadada, { flat: false }));
    beard2.position.set(0, 1.4, 0.24); g.add(beard2);
    [-0.12, 0.12].forEach(x => {
      const e = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), new THREE.MeshBasicMaterial({ color: 0x222222 }));
      e.position.set(x, 1.85, 0.23); g.add(e);
    });
    const staff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.045, 1.75, 6),
      new THREE.MeshStandardMaterial({ color: 0xffffff, map: Textures.wood('#7a4a24'), roughness: 0.9, flatShading: false })
    );
    staff.position.set(0.58, 0.85, 0.1);
    staff.rotation.z = -0.15;
    g.add(staff);
    const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.12), this._shiny(0xffd56a, 0xffaa33));
    lantern.position.set(0.5, 0.28, 0.12);
    g.add(lantern);
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.16), cloakMat);
    pack.position.set(-0.38, 0.75, -0.25);
    g.add(pack);
    [-1, 1].forEach(side => {
      const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.52, 0.16), robe);
      sleeve.position.set(side * 0.48, 1.02, 0.08);
      sleeve.rotation.z = side * 0.18;
      g.add(sleeve);
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), skin);
      hand.position.set(side * 0.5, 0.72, 0.12);
      g.add(hand);
    });
    g.userData.npc = true;
    return g;
  },

  // ---------- 武器模型（精致版，每种武器外观不同） ----------
  createWeaponMesh(type) {
    const g = new THREE.Group();
    const metalTex = Textures.metal('#c8d0d8');
    const woodTex = Textures.wood('#5a3a1a');
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: metalTex, roughness: 0.25, metalness: 0.8, flatShading: false });
    const bladeMatBright = new THREE.MeshStandardMaterial({ color: 0xffffff, map: metalTex, roughness: 0.2, metalness: 0.85, flatShading: false });
    const hiltMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: woodTex, roughness: 0.8, flatShading: false });
    const goldMat = this._shiny(0xc8a050);
    switch (type) {
      case 'travelerSword': {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.95, 0.04), bladeMat);
        blade.position.y = 0.48;
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.15, 4), bladeMat);
        tip.position.y = 1.0;
        g.add(blade, tip);
        const guard = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.07, 0.1), this._mat(0x8a6a3a));
        g.add(guard);
        const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 6), hiltMat);
        hilt.position.y = -0.18;
        const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 4, 8), this._mat(0x3a2510));
        wrap.rotation.x = Math.PI / 2; wrap.position.y = -0.1;
        g.add(hilt, wrap);
        break;
      }
      case 'soldierSword': {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.05), bladeMatBright);
        blade.position.y = 0.55;
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 4), bladeMatBright);
        tip.position.y = 1.15;
        g.add(blade, tip);
        const guard = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.09, 0.12), goldMat);
        g.add(guard);
        const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.32, 6), hiltMat);
        hilt.position.y = -0.2;
        const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), goldMat);
        pommel.position.y = -0.38;
        g.add(hilt, pommel);
        break;
      }
      case 'knightSword': {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.13, 1.3, 0.05), this._shiny(0xe0e8f0));
        blade.position.y = 0.65;
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.2, 4), this._shiny(0xe0e8f0));
        tip.position.y = 1.35;
        // 血槽
        const groove = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.0, 0.06), this._mat(0x8a8a92));
        groove.position.y = 0.6;
        g.add(blade, tip, groove);
        const guard = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.14), this._shiny(0xc8a050));
        g.add(guard);
        const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.36, 6), this._mat(0x2a1a08));
        hilt.position.y = -0.22;
        const pommel = new THREE.Mesh(new THREE.OctahedronGeometry(0.09), this._shiny(0xc8a050));
        pommel.position.y = -0.42;
        g.add(hilt, pommel);
        break;
      }
      case 'masterSword': {
        // 大师之剑：发光蓝紫色剑身
        const bladeMat = new THREE.MeshStandardMaterial({
          color: 0xfff4b0, flatShading: true, roughness: 0.2, metalness: 0.6,
          emissive: 0x886600, emissiveIntensity: 0.4
        });
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.4, 0.05), bladeMat);
        blade.position.y = 0.7;
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.25, 4), bladeMat);
        tip.position.y = 1.45;
        // 三角力量纹饰
        const triforce = new THREE.Mesh(new THREE.TetrahedronGeometry(0.08), this._shiny(0xffd700, 0x886600));
        triforce.position.set(0, 0.9, 0.05);
        g.add(blade, tip, triforce);
        // 翼形护手
        const guardL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.12), this._shiny(0x4a8aff));
        guardL.position.set(-0.18, 0, 0); guardL.rotation.z = 0.3;
        const guardR = guardL.clone(); guardR.position.x = 0.18; guardR.rotation.z = -0.3;
        g.add(guardL, guardR);
        const guardCenter = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), this._shiny(0x4a8aff));
        g.add(guardCenter);
        const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.4, 6), this._mat(0x2a4a8a));
        hilt.position.y = -0.24;
        g.add(hilt);
        break;
      }
      case 'bokoBoneSpear': {
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.7, 5), this._mat(0xc0b090));
        shaft.position.y = 0.25;
        // 缠绳
        for (let i = 0; i < 3; i++) {
          const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 4, 6), this._mat(0x6a4a25));
          wrap.rotation.x = Math.PI / 2; wrap.position.y = 0.5 + i * 0.2;
          g.add(wrap);
        }
        g.add(shaft);
        // 骨质枪头
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.45, 5), this._mat(0xeae0c8));
        tip.position.y = 1.25;
        g.add(tip);
        // 倒刺
        [-1, 1].forEach(s => {
          const barb = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.15, 3), this._mat(0xeae0c8));
          barb.position.set(s * 0.1, 1.15, 0); barb.rotation.z = s * 1.5;
          g.add(barb);
        });
        break;
      }
      default: {
        const def = (typeof ITEMS !== 'undefined') ? ITEMS[type] : null;
        const element = def && def.element;
        const isAncient = type && type.startsWith('ancient');
        const isRoyal = type && type.toLowerCase().includes('royal');
        const glowColor = element === 'fire' ? 0xff4422
                        : element === 'ice' ? 0x66ddff
                        : element === 'shock' ? 0xffee44
                        : isAncient ? 0x66ddcc
                        : isRoyal ? 0xffd56a : 0x000000;
        const mat = glowColor
          ? new THREE.MeshStandardMaterial({
              color: isAncient ? 0xd8fff8 : element === 'fire' ? 0xffd0a0 : element === 'ice' ? 0xd8f6ff : element === 'shock' ? 0xfff2a0 : 0xf6e6c0,
              roughness: 0.22, metalness: 0.75, flatShading: true,
              emissive: glowColor, emissiveIntensity: 0.35
            })
          : bladeMat;
        if (def && def.subtype === 'spear') {
          const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 1.65, 6), hiltMat);
          shaft.position.y = 0.25;
          const tip = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.42, 5), mat);
          tip.position.y = 1.25;
          const guard = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.08), goldMat);
          guard.position.y = 0.95;
          g.add(shaft, tip, guard);
        } else if (type === 'bokoClub') {
          const club = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 1.1, 6), this._artMat('leather-straps', 0x6a4a2a, { flat: false }));
          club.position.y = 0.4;
          const knob = new THREE.Mesh(new THREE.SphereGeometry(0.22, 7, 6), this._artMat('leather-straps', 0x7a4a24, { flat: false }));
          knob.position.y = 1.0;
          g.add(club, knob);
        } else {
          const blade = new THREE.Mesh(new THREE.BoxGeometry(isRoyal ? 0.15 : 0.12, 1.18, 0.05), mat);
          blade.position.y = 0.58;
          const tip = new THREE.Mesh(new THREE.ConeGeometry(isRoyal ? 0.075 : 0.06, 0.22, 4), mat);
          tip.position.y = 1.28;
          const guard = new THREE.Mesh(new THREE.BoxGeometry(isRoyal ? 0.55 : 0.42, 0.09, 0.12), isRoyal ? goldMat : hiltMat);
          const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.35, 6), hiltMat);
          hilt.position.y = -0.22;
          g.add(blade, tip, guard, hilt);
        }
        break;
      }
    }
    this._decorateEquipmentMesh(g, type, 'weapon');
    return g;
  },

  // ---------- 盾牌 ----------
  createShieldMesh(type) {
    const g = new THREE.Group();
    let mat;
    if (type === 'hylianShield') {
      const metalTex = Textures.metal('#4a6aff');
      mat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: metalTex, roughness: 0.3, metalness: 0.6, flatShading: false });
    } else if (type === 'soldierShield') {
      const metalTex = Textures.metal('#8a8a9a');
      mat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: metalTex, roughness: 0.4, metalness: 0.5, flatShading: false });
    } else {
      const woodTex = Textures.wood('#7a5a3a');
      mat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: woodTex, roughness: 0.85, flatShading: false });
    }
    // 圆形/八边形盾面
    const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 8), mat);
    shield.rotation.x = Math.PI / 2;
    g.add(shield);
    // 边框
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 5, 12),
      type === 'hylianShield' ? this._shiny(0xffd54f) : this._mat(0x5a3a1a));
    rim.position.z = 0.04;
    g.add(rim);
    // 中心纹饰
    let trimColor = type === 'hylianShield' ? 0xffd54f : (type === 'soldierShield' ? 0xc41a3a : 0x3a2510);
    const trim = new THREE.Mesh(new THREE.SphereGeometry(0.13, 6, 5), this._shiny(trimColor));
    trim.position.z = 0.06;
    g.add(trim);
    // 红十字（海利亚盾标志）
    if (type === 'hylianShield') {
      const cross1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.04), new THREE.MeshBasicMaterial({ color: 0xeaeaea }));
      cross1.position.z = 0.07;
      const cross2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.04), new THREE.MeshBasicMaterial({ color: 0xeaeaea }));
      cross2.position.z = 0.07;
      g.add(cross1, cross2);
    }
    this._decorateEquipmentMesh(g, type, 'shield');
    return g;
  },

  // ---------- 弓 ----------
  createBowMesh(type = 'travelerBow') {
    const g = new THREE.Group();
    const isAncient = type === 'ancientBow';
    const element = type === 'fireBow' ? 'fire' : type === 'iceBow' ? 'ice' : type === 'shockBow' ? 'shock' : null;
    const mat = isAncient
      ? this._artMat('ancient-armor', 0x3a6f88, { rough: 0.35, metal: 0.35, flat: false, emissive: 0x00aaff, emissiveIntensity: 0.2 })
      : new THREE.MeshStandardMaterial({ color: element === 'fire' ? 0xff7040 : element === 'ice' ? 0x88ddff : element === 'shock' ? 0xffe05a : 0xffffff, map: Textures.wood('#7a5a3a'), roughness: 0.8, flatShading: false, emissive: element === 'fire' ? 0xff2200 : element === 'ice' ? 0x33aaff : element === 'shock' ? 0xffcc00 : 0x000000, emissiveIntensity: element ? 0.25 : 0 });
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.05, 5, 12, Math.PI), mat);
    arc.rotation.y = Math.PI / 2;
    g.add(arc);
    // 弓弦
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 1.2, 3), new THREE.MeshBasicMaterial({ color: 0xeaeaea }));
    string.position.x = 0; g.add(string);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), this._mat(0x4a2a1a));
    g.add(grip);
    this._decorateEquipmentMesh(g, type, 'bow');
    return g;
  },

  // ---------- 箭 ----------
  createArrow() {
    const g = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.85, 5), this._mat(0xc0a060));
    shaft.rotation.x = Math.PI / 2;
    g.add(shaft);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 4), this._shiny(0xd0d8e0));
    tip.position.z = 0.52; tip.rotation.x = Math.PI / 2;
    g.add(tip);
    // 羽毛
    [-1, 1].forEach(s => {
      const fletch = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.15), this._mat(0xcc4444));
      fletch.position.set(s * 0.04, 0, -0.4);
      g.add(fletch);
    });
    return g;
  },

  _decorateEquipmentMesh(g, type, kind) {
    if (!g) return g;
    const def = (typeof ITEMS !== 'undefined') ? ITEMS[type] : null;
    const element = def && def.element;
    const isAncient = type && type.startsWith('ancient');
    const isRoyal = type && type.toLowerCase().includes('royal');
    const isLegend = type === 'masterSword' || type === 'hylianShield';
    const accentColor = element === 'fire' ? 0xff5522
                      : element === 'ice' ? 0x76ddff
                      : element === 'shock' ? 0xffe25a
                      : isAncient ? 0x66ddcc
                      : isRoyal || isLegend ? 0xffd56a
                      : 0xc9b27a;
    const accentMat = new THREE.MeshStandardMaterial({
      color: accentColor,
      roughness: isAncient || element ? 0.26 : 0.42,
      metalness: isAncient || isRoyal || isLegend ? 0.65 : 0.28,
      emissive: (isAncient || element || isLegend) ? accentColor : 0x000000,
      emissiveIntensity: (isAncient || element || isLegend) ? 0.22 : 0
    });
    const darkLeather = this._artMat('leather-straps', 0x4a2d18, { flat: false, rough: 0.9 });

    if (kind === 'weapon') {
      const isSpear = def && def.subtype === 'spear';
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(isSpear ? 0.055 : 0.07), accentMat);
      gem.position.set(0, isSpear ? 0.88 : 0.07, 0.065);
      g.add(gem);
      const bandCount = isSpear ? 4 : 3;
      for (let i = 0; i < bandCount; i++) {
        const band = new THREE.Mesh(new THREE.TorusGeometry(isSpear ? 0.055 : 0.07, 0.01, 5, 10), accentMat);
        band.rotation.x = Math.PI / 2;
        band.position.y = isSpear ? (-0.32 + i * 0.38) : (-0.26 + i * 0.12);
        g.add(band);
      }
      if (!isSpear && type !== 'bokoClub') {
        const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.022, isLegend ? 1.05 : 0.78, 0.064), accentMat);
        ridge.position.set(0, isLegend ? 0.74 : 0.55, 0.033);
        g.add(ridge);
      }
      if (element || isAncient || isLegend) {
        const glow = new THREE.Mesh(
          new THREE.CylinderGeometry(0.018, 0.018, isSpear ? 1.4 : 1.0, 8),
          new THREE.MeshBasicMaterial({ color: accentColor, transparent: true, opacity: 0.45 })
        );
        glow.position.y = isSpear ? 0.62 : 0.68;
        glow.position.z = 0.08;
        g.add(glow);
      }
    }

    if (kind === 'shield') {
      const rivetMat = isLegend ? this._shiny(0xffd56a) : accentMat;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), rivetMat);
        rivet.position.set(Math.cos(a) * 0.43, Math.sin(a) * 0.43, 0.09);
        g.add(rivet);
      }
      const strap1 = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.055), darkLeather);
      strap1.position.z = -0.08;
      strap1.rotation.z = 0.42;
      const strap2 = strap1.clone();
      strap2.rotation.z = -0.42;
      g.add(strap1, strap2);
      if (type === 'ancientShield') {
        const core = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.25, 16), new THREE.MeshBasicMaterial({ color: 0x66ddcc, transparent: true, opacity: 0.72, side: THREE.DoubleSide }));
        core.position.z = 0.105;
        g.add(core);
      }
    }

    if (kind === 'bow') {
      for (const y of [-0.42, 0, 0.42]) {
        const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.011, 5, 9), darkLeather);
        wrap.rotation.x = Math.PI / 2;
        wrap.position.y = y;
        g.add(wrap);
      }
      const upperNock = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 4), accentMat);
      upperNock.position.set(0, 0.6, 0);
      const lowerNock = upperNock.clone();
      lowerNock.position.y = -0.6;
      const rest = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.035, 0.04), accentMat);
      rest.position.set(0.06, 0.02, 0.04);
      g.add(upperNock, lowerNock, rest);
      if (element || isAncient || isRoyal) {
        const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.075), accentMat);
        core.position.set(0, 0, 0.07);
        g.add(core);
      }
    }

    g.userData.equipmentType = kind;
    g.userData.equipmentId = type;
    g.traverse(c => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
    return g;
  },

  // ---------- 苹果 ----------
  createApple() {
    const g = new THREE.Group();
    const apple = new THREE.Mesh(new THREE.SphereGeometry(0.2, 7, 6), this._mat(0xcc2222));
    apple.position.y = 0.2; apple.scale.y = 0.95;
    g.add(apple);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08, 4), this._mat(0x5a3010));
    stem.position.y = 0.4; g.add(stem);
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 4), this._mat(0x4a8a3a));
    leaf.position.set(0.06, 0.4, 0); leaf.rotation.z = 0.7;
    g.add(leaf);
    return g;
  },

  // ---------- 卢比（精致宝石） ----------
  createRupee(size = 1) {
    const g = new THREE.Group();
    const geo = new THREE.OctahedronGeometry(0.28 * size, 0);
    geo.scale(0.55, 1.35, 0.55);
    const rupee = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color: 0x44ff66, flatShading: true, transparent: true, opacity: 0.9,
      roughness: 0.1, metalness: 0.3, emissive: 0x118833, emissiveIntensity: 0.4
    }));
    rupee.position.y = 0.45;
    g.add(rupee);
    return g;
  },

  // ---------- 营火 ----------
  createCampfire() {
    const g = new THREE.Group();
    // 石圈
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15, 0), this._mat(0x7a7a7a));
      stone.position.set(Math.cos(a) * 0.6, 0.08, Math.sin(a) * 0.6);
      g.add(stone);
    }
    // 木柴
    for (let i = 0; i < 4; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.85, 4), this._mat(0x4a2a1a));
      log.rotation.z = Math.PI / 2;
      log.rotation.y = (i / 4) * Math.PI;
      log.position.y = 0.15;
      g.add(log);
    }
    // 火焰（多层）
    const fireOuter = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 6),
      new THREE.MeshBasicMaterial({ color: 0xff6622, transparent: true, opacity: 0.7 }));
    fireOuter.position.y = 0.6;
    const fireInner = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 5),
      new THREE.MeshBasicMaterial({ color: 0xffdd44 }));
    fireInner.position.y = 0.5;
    g.add(fireOuter, fireInner);
    const fireLight = new THREE.PointLight(0xff8844, 1.5, 8);
    fireLight.position.y = 0.7;
    g.add(fireLight);
    g.userData.parts = { fire: fireOuter, fireInner, fireLight };
    return g;
  },

  // ---------- 房子 ----------
  createHouse() {
    const g = new THREE.Group();
    const wallMat = this._artMat('shrine-stone', 0xf0e4d0, { flat: false, rough: 0.9 });
    const wall = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2, 2.6), wallMat);
    wall.position.y = 1; g.add(wall);
    // 屋顶（4 面坡）
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.5, 4), this._artMat('slate-roof', 0xd69a7a, { flat: false, rough: 0.88 }));
    roof.position.y = 2.8; roof.rotation.y = Math.PI / 4; g.add(roof);
    const eaveMat = this._artMat('carved-wood', 0x7a4a24, { flat: false, rough: 0.9 });
    [[0, 1.34], [0, -1.34], [1.64, 0], [-1.64, 0]].forEach(([x, z], idx) => {
      const eave = new THREE.Mesh(new THREE.BoxGeometry(idx < 2 ? 3.5 : 0.14, 0.12, idx < 2 ? 0.14 : 2.8), eaveMat);
      eave.position.set(x, 2.08, z);
      g.add(eave);
    });
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 2.8), eaveMat);
    ridge.position.set(0, 3.42, 0);
    ridge.rotation.y = Math.PI / 4;
    g.add(ridge);
    [-1, 1].forEach(side => {
      const brace = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.35, 0.12), eaveMat);
      brace.position.set(side * 1.55, 1.18, 0.98);
      brace.rotation.z = side * 0.08;
      g.add(brace);
    });
    // 门（木质）
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.3, 0.1), eaveMat);
    door.position.set(0, 0.65, 1.31); g.add(door);
    for (let i = -1; i <= 1; i++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(0.035, 1.18, 0.03), this._mat(0x3c2314, { flat: false }));
      plank.position.set(i * 0.18, 0.66, 1.37);
      g.add(plank);
    }
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), this._shiny(0xffd54f));
    knob.position.set(0.2, 0.65, 1.36); g.add(knob);
    // 窗
    [-0.9, 0.9].forEach(x => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.05), this._mat(0x4a8aff, { emissive: 0x224488, emissiveIntensity: 0.3 }));
      win.position.set(x, 1.2, 1.31); g.add(win);
      const frameH = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.07), eaveMat);
      frameH.position.set(x, 1.48, 1.35); g.add(frameH);
      const frameB = frameH.clone();
      frameB.position.y = 0.92; g.add(frameB);
      const frameV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.07), eaveMat);
      frameV.position.set(x - 0.28, 1.2, 1.35); g.add(frameV);
      const frameV2 = frameV.clone();
      frameV2.position.x = x + 0.28; g.add(frameV2);
    });
    [-1, 1].forEach(side => {
      const sideWindow = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.42, 0.42), this._mat(0x8fc8ff, { emissive: 0x224488, emissiveIntensity: 0.22 }));
      sideWindow.position.set(side * 1.61, 1.24, -0.35);
      g.add(sideWindow);
    });
    // 烟囱
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.4), wallMat);
    chimney.position.set(0.8, 2.8, 0); g.add(chimney);
    const chimneyCap = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.12, 0.56), eaveMat);
    chimneyCap.position.set(0.8, 3.24, 0); g.add(chimneyCap);
    g.userData.collisionRadius = 2.2;
    g.userData.kind = 'house';
    return g;
  },

  // ---------- 地牢入口 ----------
  createDungeonGate() {
    const g = new THREE.Group();
    const frameMat = this._artMat('shrine-stone', 0xffffff, { flat: false, rough: 0.9 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4.5, 0.8), frameMat);
    frame.position.y = 2.25; g.add(frame);
    // 拱顶石头（装饰）
    for (let i = -1; i <= 1; i++) {
      const stone = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.9), frameMat);
      stone.position.set(i * 1.2, 4.2, 0); g.add(stone);
    }
    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.3, 6, 12, Math.PI),
      this._mat(0x6a5a3a, { metal: 0.5 }));
    arch.position.set(0, 1.5, 0.5); g.add(arch);
    // 发光入口
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(2, 2.8),
      new THREE.MeshBasicMaterial({ color: 0x3a5a8a, transparent: true, opacity: 0.6 }));
    glow.position.set(0, 1.4, 0.45); g.add(glow);
    const glowLight = new THREE.PointLight(0x3a5a8a, 1.5, 6);
    glowLight.position.set(0, 1.4, 0.8); g.add(glowLight);
    g.userData.kind = 'dungeonGate';
    g.userData.collisionRadius = 2.0;
    return g;
  },

  // ---------- 丘丘（史莱姆） ----------
  createChuchu(color = 0x44aaff, element = null) {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color, flatShading: true, transparent: true, opacity: 0.8,
      roughness: 0.3, emissive: color, emissiveIntensity: 0.15
    });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), mat);
    body.position.y = 0.45; body.scale.y = 0.75;
    g.add(body); body.name = 'body';
    // 眼睛
    [-0.18, 0.18].forEach(x => {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      e.position.set(x, 0.6, 0.42); g.add(e);
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.04, 5, 4), new THREE.MeshBasicMaterial({ color: 0x000000 }));
      p.position.set(x, 0.6, 0.5); g.add(p);
    });
    // 元素光晕 + ★ 元素视觉特效
    if (element) {
      const lightColor = element === 'fire' ? 0xff4422 : element === 'ice' ? 0x66ddff : 0xffee44;
      const light = new THREE.PointLight(lightColor, 0.8, 3);
      light.position.y = 0.5; g.add(light);
      // ★ 火丘丘：身上冒火焰尖刺
      if (element === 'fire') {
        for (let i = 0; i < 5; i++) {
          const flame = new THREE.Mesh(
            new THREE.ConeGeometry(0.08, 0.3, 4),
            new THREE.MeshBasicMaterial({ color: 0xff5522 })
          );
          const a = (i / 5) * Math.PI * 2;
          flame.position.set(Math.cos(a) * 0.4, 0.9, Math.sin(a) * 0.4);
          g.add(flame);
        }
      }
      // ★ 冰丘丘：身上长冰晶
      else if (element === 'ice') {
        for (let i = 0; i < 4; i++) {
          const crystal = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.12),
            new THREE.MeshBasicMaterial({ color: 0x88eeff, transparent: true, opacity: 0.85 })
          );
          const a = (i / 4) * Math.PI * 2;
          crystal.position.set(Math.cos(a) * 0.45, 0.8 + Math.random() * 0.2, Math.sin(a) * 0.45);
          crystal.rotation.set(Math.random(), Math.random(), Math.random());
          g.add(crystal);
        }
      }
      // ★ 雷丘丘：身上电弧环
      else if (element === 'shock') {
        const arc = new THREE.Mesh(
          new THREE.TorusGeometry(0.5, 0.04, 4, 12),
          new THREE.MeshBasicMaterial({ color: 0xffee44 })
        );
        arc.position.y = 0.5;
        g.add(arc);
      }
    }
    g.userData.parts = { body };
    return g;
  },

  // ---------- 蜥蜴战士 ----------
  createLizalfos(color = 0x3388cc) {
    const g = new THREE.Group();
    const mat = this._artMat('lizalfos-scales', color, { flat: false });
    const darkMat = this._artMat('lizalfos-scales', (color & 0xfefefe) >> 1, { flat: false });
    // 身体（流线型）
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 7, 6), mat);
    body.scale.set(1, 1.1, 1.4); body.position.y = 0.8;
    g.add(body);
    // 头
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 6, 5), mat);
    head.scale.set(1, 0.9, 1.3); head.position.set(0, 1.1, 0.35);
    g.add(head);
    // 嘴
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.4, 4), mat);
    snout.rotation.x = Math.PI / 2; snout.position.set(0, 1.0, 0.65);
    g.add(snout);
    // 角
    const hornMat = this._mat(0xeae0c8);
    [-0.15, 0.15].forEach(x => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 4), hornMat);
      horn.position.set(x, 1.35, 0.25); g.add(horn);
    });
    // 眼睛
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffff44 });
    [-0.15, 0.15].forEach(x => {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 4), eyeMat);
      e.position.set(x, 1.15, 0.35); g.add(e);
    });
    // 长尾巴
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.9, 5), mat);
    tail.rotation.x = -Math.PI / 2; tail.position.set(0, 0.7, -0.7); g.add(tail);
    // 四肢
    const legGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.5, 5);
    const armL = new THREE.Mesh(legGeo, mat); armL.position.set(-0.4, 0.6, 0.1); g.add(armL); armL.name = 'armL';
    const armR = new THREE.Mesh(legGeo, mat); armR.position.set(0.4, 0.6, 0.1); g.add(armR); armR.name = 'armR';
    const legL = new THREE.Mesh(legGeo, mat); legL.position.set(-0.2, 0.25, -0.1); g.add(legL); legL.name = 'legL';
    const legR = new THREE.Mesh(legGeo, mat); legR.position.set(0.2, 0.25, -0.1); g.add(legR); legR.name = 'legR';
    const strapMat = this._artMat('leather-straps', 0x4a2d18, { flat: false, rough: 0.9 });
    const crestMat = this._artMat('lizalfos-scales', 0xe6d66a, { flat: false, rough: 0.86 });
    for (let i = 0; i < 5; i++) {
      const crest = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.22, 4), crestMat);
      crest.position.set(0, 1.32 - i * 0.16, 0.18 - i * 0.2);
      crest.rotation.x = -0.55;
      g.add(crest);
    }
    const harness = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.06), strapMat);
    harness.position.set(0.12, 0.82, 0.47);
    harness.rotation.z = -0.35;
    g.add(harness);
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.035, 5, 12), strapMat);
    belt.position.y = 0.58;
    belt.rotation.x = Math.PI / 2;
    g.add(belt);
    const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 1.4, 5), strapMat);
    spear.position.set(0.0, -0.2, 0.1);
    spear.rotation.x = 0.35;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 4), this._shiny(0xc8d0d8));
    tip.position.set(0, -0.88, 0.35);
    tip.rotation.x = Math.PI;
    armR.add(spear, tip);
    g.userData.parts = { armL, armR, legL, legR, body };
    return g;
  },

  // ---------- 莱尼尔（半人马，最强小怪） ----------
  createLynel() {
    const g = new THREE.Group();
    const mat = this._artMat('monster-fur', 0x6a3a1a, { flat: false });  // 棕色马身
    const humanMat = this._artMat('hero-skin', 0xc88a4a, { flat: false }); // 古铜色人躯
    const maneMat = this._artMat('monster-fur', 0xcc2222, { flat: false });
    // 马身（下半）
    const horseBody = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 1.6), mat);
    horseBody.position.set(0, 1.1, -0.2); g.add(horseBody);
    // 马腿（4 条）
    const legGeo = new THREE.CylinderGeometry(0.13, 0.1, 1.1, 5);
    [[-0.35,0.5],[0.35,0.5],[-0.35,-0.7],[0.35,-0.7]].forEach((p, i) => {
      const leg = new THREE.Mesh(legGeo, mat);
      leg.position.set(p[0], 0.55, p[1]);
      g.add(leg);
      if (i < 2) leg.name = 'legL'; else leg.name = 'legR';
    });
    // 马尾
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.8, 5), mat);
    tail.rotation.x = -Math.PI / 2.3; tail.position.set(0, 1.0, -1.1); g.add(tail);
    // 人躯（上半）
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.5), humanMat);
    torso.position.set(0, 1.9, 0.4); g.add(torso);
    // 头
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.5), humanMat);
    head.position.set(0, 2.6, 0.5); g.add(head);
    // 鬃毛（红色）
    const mane = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.7, 0.3), maneMat);
    mane.position.set(0, 2.4, 0.15); g.add(mane);
    // 狮子脸
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.3), humanMat);
    snout.position.set(0, 2.5, 0.78); g.add(snout);
    // 獠牙
    const tuskMat = this._mat(0xfff8e0);
    [-0.1, 0.1].forEach(x => {
      const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 4), tuskMat);
      tusk.position.set(x, 2.35, 0.78); tusk.rotation.x = Math.PI; g.add(tusk);
    });
    // 眼睛（红）
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3333 });
    [-0.13, 0.13].forEach(x => {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 5, 4), eyeMat);
      e.position.set(x, 2.7, 0.72); g.add(e);
    });
    // 手臂持武器
    const armGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.9, 5);
    const armL = new THREE.Mesh(armGeo, humanMat); armL.position.set(-0.45, 1.9, 0.5); g.add(armL); armL.name = 'armL';
    const armR = new THREE.Mesh(armGeo, humanMat); armR.position.set(0.45, 1.9, 0.5); g.add(armR); armR.name = 'armR';
    g.userData.parts = { armL, armR, head, body: torso };
    g.scale.set(1.05, 1.05, 1.05);
    return g;
  },

  // ---------- 魔吉拉德（沙漠巨虫 Boss） ----------
  createMolduga() {
    const g = new THREE.Group();
    const mat = this._artMat('monster-fur', 0xb89858, { flat: false });
    const body = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 7), mat);
    body.scale.set(1.5, 0.7, 1); body.position.y = 1.2;
    g.add(body);
    // 嘴（大圆口）
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.25, 5, 10), this._mat(0x4a2a1a));
    mouth.position.set(0, 1.2, 2.0); g.add(mouth);
    // 牙
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 4), this._mat(0xeae0c8));
      tooth.position.set(Math.cos(a) * 0.9, 1.2, 2.0 + Math.sin(a) * 0.9);
      tooth.rotation.x = Math.PI / 2;
      g.add(tooth);
    }
    // 眼睛（红）
    [-1, 1].forEach(s => {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 5), new THREE.MeshBasicMaterial({ color: 0xff2222 }));
      e.position.set(s * 1.8, 1.8, 1.5); g.add(e);
    });
    // 背鳍
    for (let i = 0; i < 5; i++) {
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.2, 4), this._mat(0x8a6838));
      fin.position.set(0, 2.0, 1.5 - i * 0.8); g.add(fin);
    }
    g.userData.parts = { body };
    return g;
  },

  // ---------- 四咒盖侬（神兽 Boss） ----------
  createBlightGanon(color = 0x66ddff, weapon = 'spear') {
    const g = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.45,
      metalness: 0.25,
      flatShading: true,
      emissive: color,
      emissiveIntensity: 0.22
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x25182e,
      roughness: 0.55,
      metalness: 0.2,
      flatShading: true,
      emissive: 0x441166,
      emissiveIntensity: 0.2
    });
    const glowMat = new THREE.MeshBasicMaterial({ color });

    const torso = new THREE.Mesh(new THREE.ConeGeometry(0.85, 2.0, 6), darkMat);
    torso.position.y = 2.0;
    torso.rotation.y = Math.PI / 6;
    g.add(torso);

    const core = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), glowMat);
    core.position.set(0, 2.2, 0.45);
    g.add(core);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 7, 6), darkMat);
    head.position.y = 3.25;
    g.add(head);
    [-0.16, 0.16].forEach(x => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 5, 4), glowMat);
      eye.position.set(x, 3.32, 0.48);
      g.add(eye);
    });

    const armGeo = new THREE.CylinderGeometry(0.12, 0.16, 1.65, 5);
    const armL = new THREE.Mesh(armGeo, darkMat);
    armL.position.set(-0.85, 2.35, 0);
    armL.rotation.z = -0.5;
    g.add(armL);
    const armR = new THREE.Mesh(armGeo, darkMat);
    armR.position.set(0.85, 2.35, 0);
    armR.rotation.z = 0.5;
    g.add(armR);

    const legGeo = new THREE.CylinderGeometry(0.14, 0.18, 1.45, 5);
    const legL = new THREE.Mesh(legGeo, darkMat);
    legL.position.set(-0.35, 0.8, 0);
    g.add(legL);
    const legR = new THREE.Mesh(legGeo, darkMat);
    legR.position.set(0.35, 0.8, 0);
    g.add(legR);

    let weaponMesh;
    if (weapon === 'blade') {
      weaponMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.4, 0.18), bodyMat);
      weaponMesh.position.set(1.28, 2.1, 0.35);
      weaponMesh.rotation.z = -0.5;
    } else if (weapon === 'axe') {
      weaponMesh = new THREE.Group();
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.3, 5), bodyMat);
      shaft.rotation.z = -0.45;
      weaponMesh.add(shaft);
      const headBlade = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.35, 0.16), bodyMat);
      headBlade.position.set(0.55, 0.85, 0);
      weaponMesh.add(headBlade);
      weaponMesh.position.set(1.2, 2.0, 0.3);
    } else {
      weaponMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.6, 5), bodyMat);
      weaponMesh.position.set(1.15, 2.0, 0.35);
      weaponMesh.rotation.z = -0.85;
    }
    g.add(weaponMesh);

    const aura = new THREE.Mesh(
      new THREE.TorusGeometry(1.45, 0.05, 5, 18),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.42 })
    );
    aura.rotation.x = Math.PI / 2;
    aura.position.y = 0.25;
    g.add(aura);
    const light = new THREE.PointLight(color, 1.5, 12);
    light.position.set(0, 2.4, 0);
    g.add(light);
    g.userData.parts = { armL, armR, legL, legR, body: torso, head, aura };
    return g;
  },

  // ---------- 灾厄盖侬（最终 Boss） ----------
  createCalamityGanon() {
    const g = new THREE.Group();
    const mat = this._artMat('malice', 0x3a1a4a, { rough: 0.4, emissive: 0x9922cc, emissiveIntensity: 0.3 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff33cc });
    // 身体（巨大）
    const body = new THREE.Mesh(new THREE.SphereGeometry(1.8, 8, 7), mat);
    body.scale.set(1, 1.3, 0.9); body.position.y = 2.5;
    g.add(body);
    // 头
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.9, 7, 6), mat);
    head.position.y = 4.3; g.add(head);
    // 角（向后弯曲的大角）
    [-0.4, 0.4].forEach(s => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.5, 5), mat);
      horn.position.set(s, 5.3, -0.3); horn.rotation.set(-0.4, 0, s > 0 ? -0.3 : 0.3);
      g.add(horn);
    });
    // 眼睛（橙红发光）
    [-0.25, 0.25].forEach(x => {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 5), glowMat);
      e.position.set(x, 4.4, 0.78); g.add(e);
    });
    const eyeLight = new THREE.PointLight(0xff33cc, 2.0, 10);
    eyeLight.position.set(0, 4.4, 1); g.add(eyeLight);
    // 嘴（獠牙）
    const tuskMat = this._mat(0xfff8e0);
    [-0.25, -0.08, 0.08, 0.25].forEach(x => {
      const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.35, 4), tuskMat);
      tusk.position.set(x, 4.0, 0.82); tusk.rotation.x = Math.PI; g.add(tusk);
    });
    // 四条粗腿
    const legGeo = new THREE.CylinderGeometry(0.3, 0.4, 1.8, 6);
    [[-0.8,0.6],[0.8,0.6],[-0.8,-0.6],[0.8,-0.6]].forEach((p, i) => {
      const leg = new THREE.Mesh(legGeo, mat);
      leg.position.set(p[0], 0.9, p[1]); g.add(leg);
      if (i < 2) leg.name = 'legL'; else leg.name = 'legR';
    });
    // 手臂（持武器）
    const armGeo = new THREE.CylinderGeometry(0.25, 0.3, 1.8, 6);
    const armL = new THREE.Mesh(armGeo, mat); armL.position.set(-1.5, 2.5, 0.3); g.add(armL); armL.name = 'armL';
    const armR = new THREE.Mesh(armGeo, mat); armR.position.set(1.5, 2.5, 0.3); g.add(armR); armR.name = 'armR';
    // 周身紫雾光环
    const aura = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.15, 5, 16),
      new THREE.MeshBasicMaterial({ color: 0x9922cc, transparent: true, opacity: 0.4 }));
    aura.rotation.x = Math.PI / 2; aura.position.y = 0.3; g.add(aura);
    g.userData.parts = { armL, armR, head, body, aura };
    return g;
  },

  _armorPalette(itemId, slot) {
    const palettes = {
      oldShirt: ['hero-tunic', 0xffffff, 0x2f8078, 0xd8bd76],
      hylianTunic: ['hero-tunic', 0x9ed8c4, 0x2d7770, 0xe4c47d],
      warmDoublet: ['warm-quilt', 0xb6a3b8, 0x6c6078, 0xf0e2b8],
      flamebreakerArmor: ['flamebreaker-armor', 0x9c7861, 0x5d4b3e, 0xffb05a],
      desertVoeHeadband: ['desert-fabric', 0x83b7c6, 0x4c8896, 0xffd37a],
      ancientArmor: ['ancient-armor', 0xd8fff8, 0x3a6f88, 0x66ddff],
      wellWornTrousers: ['hero-trousers', 0xffffff, 0x4d3b28, 0xd0aa62],
      hylianTrousers: ['hero-trousers', 0xb79a67, 0x5b442b, 0xd8bd76],
      snowQuillTrousers: ['warm-quilt', 0xc7c4dc, 0x756f8e, 0xf0e2b8],
      flamebreakerBoots: ['flamebreaker-armor', 0x8f765f, 0x564638, 0xffa45a],
      desertVoeTrousers: ['desert-fabric', 0x83b7c6, 0x4c8896, 0xffd37a],
      ancientGreaves: ['ancient-armor', 0xd8fff8, 0x3a6f88, 0x66ddff]
    };
    return palettes[itemId] || (slot === 'upper'
      ? ['hero-tunic', 0xffffff, 0x2f8078, 0xd8bd76]
      : ['hero-trousers', 0xffffff, 0x4d3b28, 0xd0aa62]);
  },

  createHeroOutfitOverlay(upperId, lowerId) {
    const g = new THREE.Group();
    upperId = upperId || 'oldShirt';
    lowerId = lowerId || 'wellWornTrousers';
    const [upperTex, upperTint, upperDark, trim] = this._armorPalette(upperId, 'upper');
    const [lowerTex, lowerTint, lowerDark, lowerTrim] = this._armorPalette(lowerId, 'lower');
    const upper = this._artMat(upperTex, upperTint, { flat: false, rough: 0.82 });
    const upperShade = this._artMat(upperTex, upperDark, { flat: false, rough: 0.88 });
    const lower = this._artMat(lowerTex, lowerTint, { flat: false, rough: 0.86 });
    const leather = this._artMat('leather-straps', 0xffffff, { flat: false, rough: 0.9 });
    const trimMat = this._mat(trim, { flat: false, rough: 0.8, metal: upperId.startsWith('ancient') ? 0.35 : 0.05, emissive: upperId.startsWith('ancient') ? trim : 0x000000, emissiveIntensity: upperId.startsWith('ancient') ? 0.25 : 0 });
    const lowerTrimMat = this._mat(lowerTrim, { flat: false, rough: 0.85, metal: lowerId.startsWith('ancient') ? 0.35 : 0.05, emissive: lowerId.startsWith('ancient') ? lowerTrim : 0x000000, emissiveIntensity: lowerId.startsWith('ancient') ? 0.22 : 0 });

    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.72, 0.055), upper);
    chest.position.set(0, 1.31, 0.255);
    g.add(chest);
    const back = chest.clone();
    back.position.z = -0.255;
    g.add(back);
    const waistFront = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.44, 4), upperShade);
    waistFront.position.set(0, 0.82, 0.27);
    waistFront.rotation.set(Math.PI, 0, Math.PI / 4);
    waistFront.scale.set(1.1, 0.7, 0.25);
    g.add(waistFront);
    [-1, 1].forEach(side => {
      const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.32), upperShade);
      shoulder.position.set(side * 0.46, 1.56, 0.02);
      shoulder.rotation.z = side * 0.22;
      g.add(shoulder);
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.84, 0.055), leather);
      strap.position.set(side * 0.2, 1.29, 0.285);
      strap.rotation.z = side * 0.28;
      g.add(strap);
      const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.58, 0.045), lowerTrimMat);
      thigh.position.set(side * 0.18, 0.45, 0.155);
      g.add(thigh);
      const knee = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.1, 0.27), lower);
      knee.position.set(side * 0.17, 0.2, 0.01);
      g.add(knee);
    });
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.08, 0.07), trimMat);
    collar.position.set(0, 1.62, 0.29);
    g.add(collar);
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.14, 0.53), leather);
    belt.position.y = 0.94;
    g.add(belt);
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.06), trimMat);
    buckle.position.set(0, 0.95, 0.3);
    g.add(buckle);
    const backPouch = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.12), leather);
    backPouch.position.set(-0.24, 1.0, -0.33);
    backPouch.rotation.z = -0.12;
    g.add(backPouch);
    const sidePouch = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.11), leather);
    sidePouch.position.set(0.43, 0.86, 0.03);
    sidePouch.rotation.z = 0.18;
    g.add(sidePouch);
    const tunicTab = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.045), upperShade);
    tunicTab.position.set(0, 0.74, 0.31);
    tunicTab.rotation.x = -0.12;
    g.add(tunicTab);
    if (upperId === 'warmDoublet') {
      const fur = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 5, 16), this._mat(0xf2e8d0, { flat: false }));
      fur.position.set(0, 1.64, 0.2);
      fur.rotation.x = Math.PI / 2;
      g.add(fur);
      [-1, 1].forEach(side => {
        const cuff = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.26), this._mat(0xf2e8d0, { flat: false }));
        cuff.position.set(side * 0.5, 1.05, 0.08);
        cuff.rotation.z = side * 0.18;
        g.add(cuff);
      });
    }
    if (upperId === 'hylianTunic' || upperId === 'oldShirt') {
      const scarfTail = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 0.05), trimMat);
      scarfTail.position.set(-0.12, 1.35, -0.31);
      scarfTail.rotation.x = 0.35;
      g.add(scarfTail);
    }
    if (upperId === 'flamebreakerArmor') {
      [-1, 1].forEach(side => {
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.34), trimMat);
        plate.position.set(side * 0.48, 1.52, 0.03);
        plate.rotation.z = side * 0.18;
        g.add(plate);
      });
      const chestCore = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.07), trimMat);
      chestCore.position.set(0, 1.32, 0.32);
      g.add(chestCore);
    }
    if (upperId === 'desertVoeHeadband') {
      const sash = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.85, 0.055), trimMat);
      sash.position.set(-0.18, 1.22, 0.315);
      sash.rotation.z = 0.42;
      g.add(sash);
      const clothTail = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.5, 0.045), upper);
      clothTail.position.set(0.2, 1.02, -0.31);
      clothTail.rotation.x = 0.32;
      g.add(clothTail);
    }
    if (upperId === 'ancientArmor' || lowerId === 'ancientGreaves') {
      [0.22, -0.22].forEach(x => {
        const glow = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.42, 0.065), new THREE.MeshBasicMaterial({ color: 0x66ddff }));
        glow.position.set(x, 1.28, 0.315);
        g.add(glow);
      });
      const backCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.13), new THREE.MeshBasicMaterial({ color: 0x66ddff }));
      backCore.position.set(0, 1.32, -0.33);
      g.add(backCore);
    }
    if (lowerId === 'flamebreakerBoots' || lowerId === 'ancientGreaves') {
      [-1, 1].forEach(side => {
        const shin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.4, 0.08), lowerTrimMat);
        shin.position.set(side * 0.17, 0.43, 0.17);
        g.add(shin);
      });
    }
    if (lowerId === 'snowQuillTrousers') {
      [-1, 1].forEach(side => {
        const bootFur = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.3), this._mat(0xf2e8d0, { flat: false }));
        bootFur.position.set(side * 0.17, 0.25, 0.02);
        g.add(bootFur);
      });
    }
    g.name = 'heroOutfitOverlay';
    return g;
  },

  // ---------- 防具模型 ----------
  createArmorMesh(type, itemId = null) {
    const g = new THREE.Group();
    const [tex, tint, dark, trim] = this._armorPalette(itemId, type === 'armor_upper' ? 'upper' : 'lower');
    const mat = this._artMat(tex, tint, { rough: 0.75, flat: false });
    const darkMat = this._artMat(tex, dark, { rough: 0.85, flat: false });
    const trimMat = this._mat(trim, { rough: 0.75, flat: false, metal: itemId && itemId.startsWith('ancient') ? 0.4 : 0.05, emissive: itemId && itemId.startsWith('ancient') ? trim : 0x000000, emissiveIntensity: itemId && itemId.startsWith('ancient') ? 0.3 : 0 });
    if (type === 'armor_upper') {
      const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.45), mat);
      shirt.position.y = 0.4; g.add(shirt);
      const collar = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.1), trimMat);
      collar.position.set(0, 0.85, 0); g.add(collar);
      [-1, 1].forEach(side => {
        const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.32, 0.24), darkMat);
        sleeve.position.set(side * 0.43, 0.48, 0);
        g.add(sleeve);
      });
    } else {
      const pants = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.4), mat);
      pants.position.y = 0.35; g.add(pants);
      const split = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.62, 0.42), darkMat);
      split.position.y = 0.32; g.add(split);
      [-1, 1].forEach(side => {
        const seam = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.55, 0.05), trimMat);
        seam.position.set(side * 0.17, 0.32, 0.23);
        g.add(seam);
      });
    }
    return g;
  },

  // ---------- 远古塔（传送解锁点） ----------
  createSheikahTower() {
    const g = new THREE.Group();
    const mat = this._artMat('ancient-armor', 0xffffff, { metal: 0.55, rough: 0.38, flat: false, emissive: 0x113355, emissiveIntensity: 0.18 });
    // 主体（细长锥塔）
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 1.2, 12, 6), mat);
    tower.position.y = 6; g.add(tower);
    const baseMat = this._artMat('shrine-stone', 0xd8e6df, { metal: 0.25, rough: 0.72, flat: false });
    for (let i = 0; i < 3; i++) {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.42 - i * 0.18, 1.72 - i * 0.18, 0.28, 6), baseMat);
      base.position.y = 0.14 + i * 0.24;
      base.rotation.y = i * 0.24;
      g.add(base);
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.06, 10, 0.08), new THREE.MeshBasicMaterial({ color: 0x66ddff, transparent: true, opacity: 0.55 }));
      rib.position.set(Math.cos(a) * 0.55, 6, Math.sin(a) * 0.55);
      rib.rotation.y = a;
      g.add(rib);
      const glyph = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.035), new THREE.MeshBasicMaterial({ color: 0x8ff4ff, transparent: true, opacity: 0.72 }));
      glyph.position.set(Math.cos(a) * 0.78, 4.1 + (i % 3) * 1.4, Math.sin(a) * 0.78);
      glyph.rotation.y = a;
      g.add(glyph);
    }
    // 顶部发光球
    const top = new THREE.Mesh(new THREE.OctahedronGeometry(1.2),
      new THREE.MeshBasicMaterial({ color: 0x66ddff }));
    top.position.y = 12.5; g.add(top);
    const topLight = new THREE.PointLight(0x66ddff, 2.0, 20);
    topLight.position.y = 12.5; g.add(topLight);
    // 中部环带
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8 - i*0.15, 0.05, 4, 8),
        new THREE.MeshBasicMaterial({ color: 0x66ddff }));
      ring.rotation.x = Math.PI / 2; ring.position.y = 3 + i * 3; g.add(ring);
      if (!g.userData.parts) g.userData.parts = { rings: [], glyphs: [] };
      g.userData.parts.rings.push(ring);
    }
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.85, 0.24, 8), mat);
    platform.position.y = 11.48;
    g.add(platform);
    g.userData.parts = g.userData.parts || { rings: [], glyphs: [] };
    g.userData.parts.top = top;
    g.userData.parts.topLight = topLight;
    g.children.forEach(child => {
      if (child.isMesh && child.geometry && child.geometry.type === 'BoxGeometry' && child.material && child.material.transparent) {
        g.userData.parts.glyphs.push(child);
      }
    });
    g.userData.kind = 'sheikahTower';
    g.userData.collisionRadius = 1.5;
    return g;
  },

  // ---------- 烹饪锅 ----------
  createCookingPot() {
    const g = new THREE.Group();
    // 三脚架
    const legMat = this._artMat('cooking-pot-metal', 0xffffff, { metal: 0.55, rough: 0.55, flat: false });
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 4), legMat);
      leg.position.set(Math.cos(a) * 0.5, 0.6, Math.sin(a) * 0.5);
      leg.rotation.z = -Math.cos(a) * 0.3;
      leg.rotation.x = Math.sin(a) * 0.3;
      g.add(leg);
    }
    // 锅
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.5, 0.4, 12), legMat);
    pot.position.y = 0.5; g.add(pot);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.045, 6, 16), legMat);
    rim.position.y = 0.72;
    rim.rotation.x = Math.PI / 2;
    g.add(rim);
    // 锅水（发光蓝）
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.45, 0.08, 8),
      new THREE.MeshBasicMaterial({ color: 0x66ddff, transparent: true, opacity: 0.7 }));
    liquid.position.y = 0.65; g.add(liquid);
    const light = new THREE.PointLight(0xff8844, 1.0, 4);
    light.position.y = 0.8; g.add(light);
    g.userData.parts = { liquid, light };
    g.userData.kind = 'cookingPot';
    g.userData.collisionRadius = 0.8;
    return g;
  },

  // ---------- 女神像（海利亚祝福·兑换心/精力容器） ----------
  createGoddessStatue() {
    const g = new THREE.Group();
    const stoneMat = this._artMat('shrine-stone', 0xf4ecd8, { flat: false, rough: 0.86 });
    // 基座（两层圆形台阶）
    const base1 = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.4, 10), stoneMat);
    base1.position.y = 0.2; g.add(base1);
    const base2 = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.3, 10), stoneMat);
    base2.position.y = 0.55; g.add(base2);
    // 神像本体（穿着长袍的人形剪影，简化的圆柱+球头）
    const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 1.8, 8), stoneMat);
    robe.position.y = 1.6; g.add(robe);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), stoneMat);
    head.position.y = 2.7; g.add(head);
    // 双手合十的简化（两个小斜柱）
    for (const sx of [-0.28, 0.28]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 5), stoneMat);
      arm.position.set(sx, 1.7, 0.18);
      arm.rotation.x = -0.6;
      g.add(arm);
    }
    // 拱形光环（白色发光，复用神庙拱门风格但改金色）
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.05, 6, 16, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0xffe88a })
    );
    halo.position.set(0, 2.9, 0);
    g.add(halo);
    // 顶部柔和光柱（无 PointLight，用自发光材质避免性能问题）
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.5, 3, 8, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xfff4c0, transparent: true, opacity: 0.18, side: THREE.DoubleSide })
    );
    beam.position.y = 2.2;
    g.add(beam);
    g.userData.collisionRadius = 1.5;
    g.userData.kind = 'goddessStatue';
    return g;
  },

  // ---------- 仙人掌（沙漠） ----------
  createCactus() {
    const g = new THREE.Group();
    const mat = this._mat(0x4a7a3a);
    const main = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2.0, 6), mat);
    main.position.y = 1.0; g.add(main);
    // 侧臂
    if (Math.random() > 0.4) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.8, 5), mat);
      arm.position.set(0.4, 1.2, 0); arm.rotation.z = -0.6; g.add(arm);
      const armTop = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.6, 5), mat);
      armTop.position.set(0.7, 1.6, 0); g.add(armTop);
    }
    // 刺
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 3), this._mat(0xeae0c8));
      spike.position.set(Math.cos(a) * 0.35, 0.5 + Math.random() * 1.2, Math.sin(a) * 0.35);
      spike.rotation.set(0, a, Math.PI / 2);
      g.add(spike);
    }
    g.userData.collisionRadius = 0.5;
    g.userData.kind = 'cactus';
    return g;
  },

  // ---------- 雪松（雪山） ----------
  createSnowTree() {
    const g = new THREE.Group();
    const barkTex = Textures.bark('#5a3a1a');
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 1.0, 5),
      new THREE.MeshStandardMaterial({ color: 0xffffff, map: barkTex, roughness: 0.95, flatShading: false }));
    trunk.position.y = 0.5; g.add(trunk);
    // 雪松叶（白绿色）
    for (let i = 0; i < 4; i++) {
      const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.1 - i * 0.2, 0.9, 6),
        this._mat(i % 2 ? 0x3a6a4a : 0xeaeaf0));
      leaves.position.y = 0.9 + i * 0.55; g.add(leaves);
    }
    g.userData.collisionRadius = 0.4;
    g.userData.kind = 'tree';
    return g;
  },

  // ---------- 熔岩石（火山） ----------
  // ⚠️ 不再用 PointLight：火山撒30个熔岩石，每个带光源会导致33个点光，
  //    叠加 physicallyCorrectLights 直接卡死手机。改用 emissive 自发光。
  createLavaRock() {
    const g = new THREE.Group();
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 0),
      this._mat(0x4a2a1a));
    rock.position.y = 0.5; g.add(rock);
    // 熔岩裂纹（自发光，不产生真实光照计算）
    const crack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.5),
      new THREE.MeshStandardMaterial({
        color: 0xff4422, emissive: 0xff4422, emissiveIntensity: 1.5
      }));
    crack.position.y = 0.85; g.add(crack);
    g.userData.collisionRadius = 0.7;
    g.userData.kind = 'lavaRock';
    return g;
  },

  // ---------- 海拉鲁城堡 ----------
  createCastle() {
    const g = new THREE.Group();
    const stoneBrickTex = Textures.stoneBrick();
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: stoneBrickTex, roughness: 0.9, flatShading: false });
    // 主体
    const main = new THREE.Mesh(new THREE.BoxGeometry(8, 7, 6), stoneMat);
    main.position.y = 3.5; g.add(main);
    // 中央高塔
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2, 10, 8), stoneMat);
    tower.position.set(0, 5, 0); g.add(tower);
    // 塔顶尖
    const spire = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3, 8), this._mat(0x4a4a52));
    spire.position.set(0, 11.5, 0); g.add(spire);
    // 四角塔
    [[-3.5,-2.5],[3.5,-2.5],[-3.5,2.5],[3.5,2.5]].forEach(p => {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.2, 6, 6), stoneMat);
      t.position.set(p[0], 3, p[1]); g.add(t);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2, 6), this._mat(0x8a3a3a));
      cap.position.set(p[0], 7, p[1]); g.add(cap);
    });
    // 城门
    const gate = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 0.3), this._mat(0x3a2a1a));
    gate.position.set(0, 1.5, 3.1); g.add(gate);
    // 紫色魔气光晕（盖侬封印）
    const evilLight = new THREE.PointLight(0x9922cc, 1.5, 25);
    evilLight.position.set(0, 8, 0); g.add(evilLight);
    g.userData.collisionRadius = 5.0;
    g.userData.kind = 'castle';
    return g;
  },

  // ---------- 山体（大型岩石山，可阻挡） ----------
  createMountain(scale = 1) {
    const g = new THREE.Group();
    const rockTex = Textures.rock('#7a7a6a');
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, map: rockTex, flatShading: true, roughness: 0.95
    });
    const grassMat = this._mat(0x5a8a3a);
    // 山体（3 层叠加，越往上越小）
    const layers = [
      { r: 5 * scale, h: 3 * scale, y: 1.5 * scale, mat: grassMat },
      { r: 3.5 * scale, h: 2.5 * scale, y: 4 * scale, mat: rockMat },
      { r: 2 * scale, h: 2 * scale, y: 6 * scale, mat: rockMat }
    ];
    layers.forEach(L => {
      const geo = new THREE.ConeGeometry(L.r, L.h, 6 + Math.floor(Math.random()*3));
      // 随机变形
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        pos.setX(i, pos.getX(i) * (0.9 + Math.random()*0.2));
        pos.setZ(i, pos.getZ(i) * (0.9 + Math.random()*0.2));
      }
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, L.mat);
      m.position.y = L.y;
      m.castShadow = true; m.receiveShadow = true;
      g.add(m);
    });
    g.userData.collisionRadius = 5 * scale;
    g.userData.kind = 'mountain';
    return g;
  },

  // ---------- 可攀爬缓坡（不阻挡，配合 BaseScene slopeZones） ----------
  createSlopeHill(radius = 5, height = 1.4, color = 0x6f9650) {
    const g = new THREE.Group();
    const hill = new THREE.Mesh(
      new THREE.ConeGeometry(radius, height, 14),
      this._artMat('mossy-stone', color, { flat: false, rough: 0.94 })
    );
    hill.position.y = height / 2;
    hill.scale.y = 0.65;
    hill.castShadow = true;
    hill.receiveShadow = true;
    g.add(hill);
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.28, radius * 0.42, 0.12, 12),
      this._mat(color)
    );
    cap.position.y = height * 0.68;
    g.add(cap);
    g.userData.kind = 'slope';
    return g;
  },

  // ---------- 河流（带流动动画的蓝色水面） ----------
  createRiver(width = 8, length = 80) {
    const g = new THREE.Group();
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x4a90c2, transparent: true, opacity: 0.75,
      roughness: 0.15, metalness: 0.4,
      emissive: 0x114466, emissiveIntensity: 0.1
    });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(width, length, 4, 16), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.1;
    g.add(water);
    // 河岸石头
    for (let i = 0; i < 8; i++) {
      const stone = this.createRock(0.5 + Math.random()*0.5);
      const side = Math.random() > 0.5 ? 1 : -1;
      stone.position.set(side * (width/2 + 0.3), 0, (Math.random()-0.5) * length);
      g.add(stone);
    }
    g.userData.parts = { water };
    g.userData.kind = 'river';
    return g;
  },

  // ---------- 瀑布 ----------
  createWaterfall(height = 8) {
    const g = new THREE.Group();
    const fallMat = new THREE.MeshBasicMaterial({
      color: 0xaae0ff, transparent: true, opacity: 0.6, side: THREE.DoubleSide
    });
    const fall = new THREE.Mesh(new THREE.PlaneGeometry(3, height), fallMat);
    fall.position.y = height / 2;
    g.add(fall);
    // 水雾
    const mist = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 1.5),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })
    );
    mist.position.y = 0.3;
    g.add(mist);
    // 水池
    const pool = new THREE.Mesh(
      new THREE.CircleGeometry(3, 12),
      new THREE.MeshStandardMaterial({ color: 0x4a90c2, transparent: true, opacity: 0.7 })
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = 0.1;
    g.add(pool);
    g.userData.parts = { fall, mist };
    g.userData.kind = 'waterfall';
    return g;
  },

  // ---------- 悬崖/峭壁 ----------
  createCliff(scale = 1) {
    const g = new THREE.Group();
    const rockTex = Textures.rock('#8d806d');
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: rockTex,
      roughness: 0.96,
      metalness: 0,
      flatShading: false
    });
    const grassMat = this._artMat('leaf-cluster', 0x6f9c4f, { flat: false, rough: 0.92 });
    const ledges = [
      { w: 6.0, h: 1.55, d: 3.1, y: 0.78, x: 0, z: 0 },
      { w: 5.25, h: 1.35, d: 2.75, y: 2.18, x: -0.18, z: 0.08 },
      { w: 4.45, h: 1.25, d: 2.35, y: 3.48, x: 0.15, z: -0.04 },
      { w: 3.7, h: 0.95, d: 2.0, y: 4.58, x: -0.05, z: 0.03 }
    ];
    for (const ledge of ledges) {
      const rock = new THREE.Mesh(
        new THREE.BoxGeometry(ledge.w * scale, ledge.h * scale, ledge.d * scale, 2, 1, 2),
        mat
      );
      rock.position.set(ledge.x * scale, ledge.y * scale, ledge.z * scale);
      rock.castShadow = true;
      rock.receiveShadow = true;
      g.add(rock);
    }
    // 顶部草地与边缘薄层，弱化大块垂直墙面
    const top = new THREE.Mesh(new THREE.BoxGeometry(4.05*scale, 0.34*scale, 2.28*scale), grassMat);
    top.position.set(-0.05*scale, 5.15*scale, 0.03*scale);
    top.castShadow = true;
    top.receiveShadow = true;
    g.add(top);
    for (let i = 0; i < 7; i++) {
      const chip = new THREE.Mesh(
        new THREE.IcosahedronGeometry((0.18 + Math.random() * 0.16) * scale, 0),
        mat
      );
      chip.position.set(
        (-2.6 + Math.random() * 5.2) * scale,
        (0.35 + Math.random() * 3.7) * scale,
        (Math.random() > 0.5 ? 1.45 : -1.45) * scale
      );
      chip.rotation.set(Math.random(), Math.random(), Math.random());
      chip.scale.y = 0.6 + Math.random() * 0.8;
      chip.castShadow = true;
      g.add(chip);
    }
    g.userData.collisionRadius = 3.5*scale;
    g.userData.kind = 'cliff';
    return g;
  },

  // ---------- 木桥（跨河用） ----------
  createBridge(length = 8) {
    const g = new THREE.Group();
    const plankMat = new THREE.MeshStandardMaterial({
      color: 0x7a5a3a, roughness: 0.9, flatShading: true,
      map: Textures.wood('#6a4a2a')
    });
    // 桥面
    const deck = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.2, length), plankMat);
    deck.position.y = 0.6;
    deck.receiveShadow = true;
    g.add(deck);
    // 栏杆
    [-1.2, 1.2].forEach(x => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, length), plankMat);
      rail.position.set(x, 1.1, 0);
      g.add(rail);
      // 栏杆柱
      for (let i = 0; i < 5; i++) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1, 0.12), plankMat);
        post.position.set(x, 1.0, -length/2 + i * length/4);
        g.add(post);
      }
    });
    g.userData.collisionRadius = 0;  // 桥不阻挡
    g.userData.kind = 'bridge';
    return g;
  },

  // ---------- 大树（更粗更高，森林感） ----------
  createBigTree() {
    const g = new THREE.Group();
    const barkTex = Textures.bark('#5a3a1a');
    const trunkH = 2.5 + Math.random();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.4, trunkH, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, map: barkTex, roughness: 0.95 })
    );
    trunk.position.y = trunkH / 2;
    trunk.castShadow = true;
    g.add(trunk);
    const trunkMat = trunk.material;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.random() * 0.18;
      const root = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.16, 1.25, 6), trunkMat);
      root.position.set(Math.cos(a) * 0.42, 0.16, Math.sin(a) * 0.42);
      root.rotation.z = Math.cos(a) * 1.34;
      root.rotation.x = -Math.sin(a) * 1.34;
      this._streamLodDetail(root);
      g.add(root);
    }
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.35;
      const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.13, 1.35, 6), trunkMat);
      branch.position.set(Math.cos(a) * 0.45, trunkH * (0.55 + i * 0.06), Math.sin(a) * 0.45);
      branch.rotation.z = Math.cos(a) * 0.78;
      branch.rotation.x = -Math.sin(a) * 0.78;
      branch.castShadow = true;
      this._streamLodDetail(branch);
      g.add(branch);
    }
    const leafMats = [
      this._artMat('leaf-cluster', 0x5f8a42, { flat: false, rough: 0.92 }),
      this._artMat('leaf-cluster', 0x3f6a35, { flat: false, rough: 0.94 }),
      this._artMat('leaf-cluster', 0x7a9b55, { flat: false, rough: 0.92 }),
      this._artMat('leaf-cluster', 0x2f552b, { flat: false, rough: 0.95 })
    ];
    const clumps = 12;
    for (let i = 0; i < clumps; i++) {
      const a = (i / clumps) * Math.PI * 2 + Math.random() * 0.35;
      const ring = i < 7 ? 1.05 + Math.random() * 0.85 : 0.35 + Math.random() * 0.55;
      const y = trunkH + 0.65 + (i % 5) * 0.36 + Math.random() * 0.22;
      const r = i < 4 ? 1.25 : 0.82 + Math.random() * 0.38;
      const leaves = new THREE.Mesh(
        new THREE.IcosahedronGeometry(r, 1),
        leafMats[i % leafMats.length]
      );
      leaves.position.set(Math.cos(a) * ring, y, Math.sin(a) * ring);
      leaves.scale.set(1.25 + Math.random() * 0.28, 0.72 + Math.random() * 0.18, 1.0 + Math.random() * 0.28);
      leaves.rotation.set(Math.random() * 0.4, Math.random() * Math.PI, Math.random() * 0.4);
      leaves.castShadow = true;
      leaves.receiveShadow = true;
      if (i >= 5) this._streamLodDetail(leaves);
      g.add(leaves);
    }
    g.userData.collisionRadius = 1.4;
    g.userData.kind = 'tree';
    return g;
  },

  // ---------- 商人 NPC ----------
  createMerchant(skinColor = 0xe0c0a0) {
    const g = new THREE.Group();
    const skin = this._mat(skinColor);
    const robe = this._mat(0x6a3a8a);  // 紫色长袍（商人标志色）
    // 身体（长袍）
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.4, 6), robe);
    body.position.y = 0.7; g.add(body);
    // 头
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.45), skin);
    head.position.y = 1.65; g.add(head);
    // 帽子
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.5, 6), this._mat(0x4a2a6a));
    hat.position.y = 2.1; g.add(hat);
    // 眼睛
    [-0.12, 0.12].forEach(x => {
      const e = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), new THREE.MeshBasicMaterial({ color: 0x222222 }));
      e.position.set(x, 1.7, 0.23); g.add(e);
    });
    // 笑容（弧线）
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 4, 8, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0x882244 }));
    smile.position.set(0, 1.55, 0.23); smile.rotation.x = Math.PI; g.add(smile);
    // 背包/货箱
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.3), this._mat(0x8a5a2a));
    pack.position.set(0, 0.9, -0.4); g.add(pack);
    // 金币装饰（腰带）
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.05, 4, 10), this._shiny(0xffd54f));
    belt.rotation.x = Math.PI / 2; belt.position.y = 0.4; g.add(belt);
    g.userData.npc = true;
    g.userData.collisionRadius = 0.6;
    return g;
  },

  // ---------- 商店摊位（买卖场景物件） ----------
  createShopStall(shopDef = {}, shopId = '') {
    const g = new THREE.Group();
    const isAncient = shopId === 'ancientShop';
    const isSnow = shopId === 'ritoShop';
    const isFire = shopId === 'goronShop';
    const isDesert = shopId === 'gerudoShop';
    const clothColor = isAncient ? 0x265f78 : isSnow ? 0xdee8f4 : isFire ? 0xb45a32 : isDesert ? 0xd9a86c : 0x7b4aa0;
    const accentColor = isAncient ? 0x66ddcc : isSnow ? 0x88d8ff : isFire ? 0xff9a4a : isDesert ? 0xffd58a : 0xffd56a;
    const wood = this._artMat('carved-wood', 0x7a4a24, { flat: false, rough: 0.88 });
    const cloth = this._artMat('desert-fabric', clothColor, { flat: false, rough: 0.86, emissive: isAncient ? 0x113344 : 0x000000, emissiveIntensity: isAncient ? 0.14 : 0 });
    const accent = new THREE.MeshStandardMaterial({
      color: accentColor,
      roughness: isAncient ? 0.32 : 0.52,
      metalness: isAncient ? 0.45 : 0.18,
      emissive: isAncient ? accentColor : 0x000000,
      emissiveIntensity: isAncient ? 0.22 : 0
    });

    const table = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 1.0), wood);
    table.position.set(0, 0.72, 0);
    g.add(table);
    for (const x of [-1.0, 1.0]) {
      for (const z of [-0.36, 0.36]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.72, 0.12), wood);
        leg.position.set(x, 0.34, z);
        g.add(leg);
      }
    }

    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.14, 1.25), cloth);
    roof.position.set(0, 2.08, -0.05);
    roof.rotation.x = -0.08;
    g.add(roof);
    for (const x of [-1.18, 1.18]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 1.45, 6), wood);
      pole.position.set(x, 1.36, -0.4);
      g.add(pole);
    }
    for (let i = 0; i < 5; i++) {
      const flap = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.08), cloth);
      flap.position.set(-0.88 + i * 0.44, 1.92, 0.58);
      flap.rotation.x = 0.22;
      g.add(flap);
    }

    const signCanvas = document.createElement('canvas');
    signCanvas.width = 128;
    signCanvas.height = 64;
    const ctx = signCanvas.getContext('2d');
    ctx.fillStyle = isAncient ? '#173244' : '#4a2d18';
    ctx.fillRect(0, 0, 128, 64);
    ctx.strokeStyle = isAncient ? '#66ddcc' : '#ffd56a';
    ctx.lineWidth = 5;
    ctx.strokeRect(5, 5, 118, 54);
    ctx.fillStyle = isAncient ? '#aefcff' : '#ffe6a0';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isAncient ? '古' : '商', 64, 34);
    const signTex = new THREE.CanvasTexture(signCanvas);
    signTex.encoding = THREE.sRGBEncoding;
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.42, 0.05), new THREE.MeshBasicMaterial({ map: signTex }));
    sign.position.set(0, 1.52, 0.62);
    g.add(sign);

    const sell = shopDef.sell || [];
    const displayItems = sell.slice(0, 4);
    displayItems.forEach((row, i) => {
      const itemDef = (typeof ITEMS !== 'undefined') ? ITEMS[row.id] : null;
      let itemMesh;
      if (itemDef && itemDef.type === 'weapon') itemMesh = this.createWeaponMesh(row.id);
      else if (itemDef && itemDef.type === 'shield') itemMesh = this.createShieldMesh(row.id);
      else if (itemDef && itemDef.type === 'bow') itemMesh = this.createBowMesh(row.id);
      else {
        itemMesh = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.13, 0),
          new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.5, metalness: 0.18, emissive: isAncient ? accentColor : 0x000000, emissiveIntensity: isAncient ? 0.16 : 0 })
        );
      }
      itemMesh.scale.setScalar(itemDef && itemDef.type === 'weapon' ? 0.34 : itemDef && itemDef.type === 'bow' ? 0.42 : 0.46);
      itemMesh.position.set(-0.84 + i * 0.56, 0.93, 0.1);
      itemMesh.rotation.set(0.65, 0.4 + i * 0.2, -0.18);
      g.add(itemMesh);
    });

    const rupee = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), accent);
    rupee.position.set(1.08, 1.05, 0.35);
    g.add(rupee);
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.32), wood);
    chest.position.set(-1.08, 0.91, -0.22);
    g.add(chest);

    g.userData.kind = 'shop-stall';
    g.userData.collisionRadius = 1.45;
    g.traverse(c => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
    return g;
  },

  // ---------- 依盖队刺客（高速近战） ----------
  createYigaFootsoldier() {
    const g = this.createBokoblin(0x8a1f2d, false);
    g.scale.set(0.92, 1.05, 0.92);
    const mask = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.22, 0.06),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    mask.position.set(0, 1.5, 0.43);
    g.add(mask);
    const eye = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.04, 0.03),
      new THREE.MeshBasicMaterial({ color: 0xff2222 })
    );
    eye.position.set(0, 1.51, 0.48);
    g.add(eye);
    const scarf = new THREE.Mesh(
      new THREE.TorusGeometry(0.36, 0.035, 5, 12),
      this._mat(0x2a1620)
    );
    scarf.position.y = 1.23;
    scarf.rotation.x = Math.PI / 2;
    g.add(scarf);
    return g;
  },

  // ---------- 法师（远程元素怪） ----------
  createWizzrobe(color = 0xff5522, element = 'fire') {
    const g = new THREE.Group();
    const robe = this._mat(color, { emissive: color, emissiveIntensity: 0.12 });
    const dark = this._mat(0x1b2030, { emissive: color, emissiveIntensity: 0.08 });
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.45, 7), robe);
    body.position.y = 0.75;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 7, 6), dark);
    head.position.y = 1.58;
    g.add(head);
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.44, 0.82, 7), robe);
    hat.position.y = 2.06;
    hat.rotation.x = -0.18;
    g.add(hat);
    const brim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 6, 16), robe);
    brim.position.y = 1.82;
    brim.rotation.x = Math.PI / 2;
    g.add(brim);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), new THREE.MeshBasicMaterial({ color }));
    glow.position.set(0, 1.6, 0.32);
    g.add(glow);
    const staff = new THREE.Group();
    staff.position.set(0.46, 1.0, 0.05);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.25, 5), this._mat(0x6a4a2a));
    shaft.position.y = 0;
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 6, 5), new THREE.MeshBasicMaterial({ color }));
    orb.position.y = 0.68;
    staff.add(shaft, orb);
    g.add(staff);
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.55, 5), robe);
    armL.position.set(-0.42, 0.9, 0);
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.55, 5), robe);
    armR.position.set(0.42, 0.9, 0);
    g.add(armL, armR);
    armL.name = 'armL';
    armR.name = 'armR';
    g.userData.parts = { body, head, armL, armR };
    g.userData.element = element;
    return g;
  },

  // ---------- 岩石小怪（可混入石头堆） ----------
  createStonePebblit(color = 0x7a6a5a) {
    const g = new THREE.Group();
    const mat = this._mat(color);
    const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.52, 0), mat);
    body.position.y = 0.52;
    g.add(body);
    const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 0), mat);
    head.position.set(0, 0.98, 0.06);
    g.add(head);
    [-1, 1].forEach(s => {
      const arm = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), mat);
      arm.position.set(s * 0.5, 0.55, 0);
      g.add(arm);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.28), mat);
      foot.position.set(s * 0.2, 0.08, 0.1);
      g.add(foot);
      if (s < 0) foot.name = 'legL';
      else foot.name = 'legR';
    });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffb84d });
    [-0.1, 0.1].forEach(x => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 5, 4), eyeMat);
      eye.position.set(x, 1.02, 0.31);
      g.add(eye);
    });
    g.userData.parts = { body, head };
    return g;
  },

  // ---------- 白银莫力布林（更强精英） ----------
  createSilverMoblin() {
    const g = this.createMoblin();
    g.scale.multiplyScalar(1.12);
    g.traverse(c => {
      if (c.isMesh && c.material && c.material.color) {
        c.material.color.lerp(new THREE.Color(0xd8d0bc), 0.35);
      }
    });
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.48, 5), this._shiny(0xd8d0bc));
    crown.position.set(0, 5.55, 0.04);
    g.add(crown);
    return g;
  },

  // ---------- 神兽（巨大机械兽，剧情用） ----------
  createDivineBeast(color = 0x88aacc) {
    const g = new THREE.Group();
    const mat = this._mat(color, { metal: 0.6, rough: 0.4, emissive: color, emissiveIntensity: 0.15 });
    // 主体（球形舱）
    const body = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 7), mat);
    body.scale.set(1.3, 1, 1); body.position.y = 4;
    g.add(body);
    // 长鼻子/炮管
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 3, 6), mat);
    trunk.rotation.z = Math.PI / 2.5; trunk.position.set(2.5, 4.5, 0);
    g.add(trunk);
    // 4 条腿
    [[-2,1.5],[2,1.5],[-2,-1.5],[2,-1.5]].forEach(p => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 4, 5), mat);
      leg.position.set(p[0], 2, p[1]); g.add(leg);
    });
    // 发光眼/核心
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffdd44 }));
    core.position.set(1.5, 4.5, 0); g.add(core);
    const coreLight = new THREE.PointLight(0xffdd44, 2, 15);
    coreLight.position.copy(core.position); g.add(coreLight);
    g.userData.parts = { body, core };
    return g;
  }
};
