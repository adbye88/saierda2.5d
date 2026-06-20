/* ========================================================
   Shrine.js — 神庙系统
   - 草原 4 座神庙（试炼之祠）+ 各区域神庙
   - 进入神庙 = 战斗试炼：击败一波波敌人
   - 通关获得 克服之玉（可换心之容器/精力容器）
   ======================================================== */

// 神庙定义：wave 数组，每波 {敌人类型, 数量}
const SHRINE_DEFS = {
  // 初始台地 4 座神庙（教学难度）
  shrineJaBaij:   { name: '加·巴伊夫神庙', region: 'grassland', waves: [{type:'redBokoblin', n:2}], reward: 'spiritOrb', pos:[15,-15] },
  shrineOwaDaim:  { name: '欧瓦·达伊姆神庙', region: 'grassland', waves: [{type:'redBokoblin', n:2},{type:'chuchu', n:2}], reward: 'spiritOrb', pos:[-20,-10] },
  shrineKehNamut: { name: '科赫·纳姆特神庙', region: 'grassland', waves: [{type:'chuchu', n:3}], reward: 'spiritOrb', pos:[20,-25] },
  shrineOmanAu:   { name: '欧曼·奥神庙', region: 'grassland', waves: [{type:'redBokoblin', n:3},{type:'octorok', n:1}], reward: 'spiritOrb', pos:[-25,-25] },
  shrineRotaOoh:   { name: '罗塔·奥神庙', region: 'grassland', waves: [{type:'blueBokoblin', n:2},{type:'archerBokoblin', n:1}], reward: 'spiritOrb', pos:[105,35] },
  shrineDahKasoPlateau:{ name: '达·卡索台地神庙', region: 'grassland', waves: [{type:'stonePebblit', n:3},{type:'blackBokoblin', n:1}], reward: 'spiritOrb', pos:[-108,82] },
  shrineRiverBend:{ name: '河湾神庙', region: 'grassland', waves: [{type:'octorok', n:2},{type:'blueBokoblin', n:2}], reward: 'spiritOrb', pos:[-92,-78] },
  shrineNorthRidge:{ name: '北岭神庙', region: 'grassland', waves: [{type:'stonePebblit', n:2},{type:'blueMoblin', n:1}], reward: 'spiritOrb', pos:[118,112] },
  shrineColiseumEdge:{ name: '竞技场外缘神庙', region: 'grassland', waves: [{type:'silverLynel', n:1}], reward: 'spiritOrb', pos:[-158,148] },
  shrineHyruleField:{ name: '海拉鲁平原神庙', region: 'grassland', waves: [{type:'guardianStalker', n:1},{type:'guardianSkywatcher', n:1}], reward: 'spiritOrb', pos:[156,-146] },
  // 各区域神庙（中难度）
  shrineForestKorok:{ name: '克洛格林神庙', region: 'forest', waves: [{type:'blueBokoblin', n:2},{type:'yigaFootsoldier', n:1}], reward: 'spiritOrb', pos:[-62,72] },
  shrineForestMist:{ name: '雾隐试炼神庙', region: 'forest', waves: [{type:'stal', n:3},{type:'iceWizzrobe', n:1}], reward: 'spiritOrb', pos:[72,-18] },
  shrineAncientGrove:{ name: '古树海神庙', region: 'forest', waves: [{type:'blueMoblin', n:1},{type:'maliceWizzrobe', n:1}], reward: 'spiritOrb', pos:[-112,-108] },
  shrineLostWoodsDeep:{ name: '迷失森林深处神庙', region: 'forest', waves: [{type:'stalnox', n:1}], reward: 'spiritOrb', pos:[146,132] },
  shrineSatoriGrove:{ name: '萨托利林地神庙', region: 'forest', waves: [{type:'hinox', n:1},{type:'yigaFootsoldier', n:2}], reward: 'spiritOrb', pos:[-146,36] },
  shrineHighlandRiver:{ name: '双河神庙', region: 'highland', waves: [{type:'blueLizalfos', n:2},{type:'archerBokoblin', n:2}], reward: 'spiritOrb', pos:[-112,18] },
  shrineHighlandPeak:{ name: '高崖神庙', region: 'highland', waves: [{type:'blackBokoblin', n:2},{type:'silverMoblin', n:1}], reward: 'spiritOrb', pos:[108,92] },
  shrineHighlandRuins:{ name: '断壁神庙', region: 'highland', waves: [{type:'stonePebblit', n:4},{type:'guardian', n:1}], reward: 'spiritOrb', pos:[92,-108] },
  shrineThunderPlateau:{ name: '雷鸣高地神庙', region: 'highland', waves: [{type:'electricOctorok', n:2},{type:'guardianStalker', n:1}], reward: 'spiritOrb', pos:[-128,104] },
  shrineFaronFalls:{ name: '费罗尼瀑布神庙', region: 'highland', waves: [{type:'thunderGleeok', n:1}], reward: 'spiritOrb', pos:[148,-142] },
  shrineLakeHylia:{ name: '海利亚湖畔神庙', region: 'highland', waves: [{type:'blackHinox', n:1},{type:'electricOctorok', n:2}], reward: 'spiritOrb', pos:[-152,-118] },
  shrineSnow:     { name: '利·塔扎尼神庙', region: 'snowland', waves: [{type:'iceChuchu', n:3},{type:'blueLizalfos', n:1}], reward: 'spiritOrb', pos:[10,-30] },
  shrineSnowPeak: { name: '雪峰神庙', region: 'snowland', waves: [{type:'iceChuchu', n:4},{type:'frostTalus', n:1}], reward: 'spiritOrb', pos:[-105,-92] },
  shrineSnowCave: { name: '冰洞神庙', region: 'snowland', waves: [{type:'stal', n:3},{type:'iceWizzrobe', n:2}], reward: 'spiritOrb', pos:[92,64] },
  shrineFrozenLake:{ name: '冻湖神庙', region: 'snowland', waves: [{type:'frostPebblit', n:4},{type:'silverLynel', n:1}], reward: 'spiritOrb', pos:[112,-118] },
  shrineHebraLabyrinth:{ name: '赫布拉迷宫神庙', region: 'snowland', waves: [{type:'frostGleeok', n:1}], reward: 'spiritOrb', pos:[-148,142] },
  shrineTabanthaCliff:{ name: '塔邦挞断崖神庙', region: 'snowland', waves: [{type:'guardianSkywatcher', n:1},{type:'silverLynel', n:1}], reward: 'spiritOrb', pos:[150,-30] },
  shrineVolcano:  { name: '达·卡索神庙', region: 'volcano', waves: [{type:'fireChuchu', n:3},{type:'redLizalfos', n:2}], reward: 'spiritOrb', pos:[10,-30] },
  shrineVolcanoCrater:{ name: '熔岩口神庙', region: 'volcano', waves: [{type:'fireChuchu', n:4},{type:'ignoTalus', n:1}], reward: 'spiritOrb', pos:[-104,-88] },
  shrineVolcanoMine:{ name: '废矿神庙', region: 'volcano', waves: [{type:'redLizalfos', n:3},{type:'guardian', n:1}], reward: 'spiritOrb', pos:[104,58] },
  shrineMagmaVault:{ name: '熔库神庙', region: 'volcano', waves: [{type:'firePebblit', n:4},{type:'guardianStalker', n:1}], reward: 'spiritOrb', pos:[112,-116] },
  shrineEldinBridge:{ name: '奥尔汀桥神庙', region: 'volcano', waves: [{type:'flameGleeok', n:1}], reward: 'spiritOrb', pos:[-148,128] },
  shrineGoronCliff:{ name: '鼓隆峭壁神庙', region: 'volcano', waves: [{type:'blackHinox', n:1},{type:'firePebblit', n:3}], reward: 'spiritOrb', pos:[150,-34] },
  shrineDesert:   { name: '克·欧希尼奥神庙', region: 'desert', waves: [{type:'yellowLizalfos', n:2},{type:'moblin', n:1}], reward: 'spiritOrb', pos:[10,-35] },
  shrineDesertOasis:{ name: '绿洲神庙', region: 'desert', waves: [{type:'yellowLizalfos', n:3},{type:'shockWizzrobe', n:1}], reward: 'spiritOrb', pos:[-108,42] },
  shrineDesertStorm:{ name: '沙暴神庙', region: 'desert', waves: [{type:'moblin', n:2},{type:'molduga', n:1}], reward: 'spiritOrb', pos:[96,-98] },
  shrineSunkenDunes:{ name: '沉沙神庙', region: 'desert', waves: [{type:'electricOctorok', n:3},{type:'goldBokoblin', n:2}], reward: 'spiritOrb', pos:[-124,-104] },
  shrineGerudoMaze:{ name: '格鲁德迷宫神庙', region: 'desert', waves: [{type:'thunderGleeok', n:1}], reward: 'spiritOrb', pos:[148,132] },
  shrineSouthOasis:{ name: '南绿洲神庙', region: 'desert', waves: [{type:'molduga', n:1},{type:'electricOctorok', n:2}], reward: 'spiritOrb', pos:[-152,106] },
  shrineDragonExile:{ name: '龙骨流放地神庙', region: 'desert', waves: [{type:'blackHinox', n:1},{type:'maliceWizzrobe', n:1}], reward: 'spiritOrb', pos:[28,-154] },
  shrineCastleWatch:{ name: '王城瞭望神庙', region: 'castle', waves: [{type:'guardian', n:2},{type:'silverBokoblin', n:2}], reward: 'spiritOrb', pos:[-72,52] },
  shrineRoyalGuard:{ name: '近卫试炼神庙', region: 'castle', waves: [{type:'maliceWizzrobe', n:2},{type:'silverLynel', n:1}], reward: 'spiritOrb', pos:[78,-92] },
  shrineCastleDocks:{ name: '王城船坞神庙', region: 'castle', waves: [{type:'guardianStalker', n:2},{type:'stalnox', n:1}], reward: 'spiritOrb', pos:[-96,-106] },
  shrineCentralSquare:{ name: '中央广场神庙', region: 'castle', waves: [{type:'guardianSkywatcher', n:2},{type:'thunderGleeok', n:1}], reward: 'spiritOrb', pos:[100,94] }
};

class Shrine {
  constructor(defId, def) {
    this.defId = defId;
    this.def = def;
    this.cleared = SaveSystem.isShrineCleared(defId);
    this.mesh = this._createMesh();
    this.mesh.position.set(def.pos[0], 0, def.pos[1]);
    this.mesh.userData.shrine = this;
    this.mesh.userData.kind = 'shrine';
    this.mesh.userData.collisionRadius = 1.5;
    this._syncVisual();
  }

  _createMesh() {
    const g = new THREE.Group();
    const stoneMat = (typeof AssetFactory !== 'undefined' && AssetFactory._artMat)
      ? AssetFactory._artMat('shrine-stone', 0xf4e6cf, { flat: false, rough: 0.86 })
      : new THREE.MeshStandardMaterial({ color: 0xf4e6cf, roughness: 0.86 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xffb35a, emissive: 0xff8800, emissiveIntensity: 0.28, roughness: 0.42, metalness: 0.2 });
    // 基座（发光的橙色平台）
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.8, 0.3, 12),
      stoneMat
    );
    base.position.y = 0.15; g.add(base);
    const baseGlow = new THREE.Mesh(
      new THREE.CylinderGeometry(1.58, 1.88, 0.06, 12),
      new THREE.MeshBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0.36 })
    );
    baseGlow.position.y = 0.34; g.add(baseGlow);
    // 拱形入口（橙色发光）
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(1.2, 0.16, 6, 18, Math.PI),
      trimMat
    );
    arch.position.set(0, 0.3, 0);
    g.add(arch);
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.28, 0.34), stoneMat);
    lintel.position.set(0, 1.36, 0);
    g.add(lintel);
    [-1, 1].forEach(side => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.25, 0.36), stoneMat);
      pillar.position.set(side * 1.03, 0.72, 0);
      g.add(pillar);
      const glyph = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.46, 0.04), trimMat);
      glyph.position.set(side * 1.03, 0.78, 0.2);
      g.add(glyph);
    });
    // 顶部光环
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.06, 4, 16),
      new THREE.MeshBasicMaterial({ color: 0xffcc66, transparent: true, opacity: 0.7 }));
    halo.rotation.x = Math.PI / 2; halo.position.y = 2.5;
    g.add(halo);
    const runeRing = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.025, 4, 24),
      new THREE.MeshBasicMaterial({ color: 0xffcc66, transparent: true, opacity: 0.56 }));
    runeRing.rotation.x = Math.PI / 2;
    runeRing.position.y = 0.42;
    g.add(runeRing);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const rune = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.035), trimMat);
      rune.position.set(Math.cos(a) * 1.16, 0.45, Math.sin(a) * 1.16);
      rune.rotation.y = -a;
      g.add(rune);
    }
    // 中心光柱
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 3, 8, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffcc66, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
    );
    beam.position.y = 1.5;
    g.add(beam);
    const light = new THREE.PointLight(0xffaa44, 1.5, 8);
    light.position.y = 1.5;
    g.add(light);
    g.userData.parts = { baseGlow, arch, halo, runeRing, beam, light };
    return g;
  }

  // 进入神庙（开始战斗试炼）
  enter(game) {
    if (this.cleared) {
      Dialogue.show('这座神庙已经通关了');
      return;
    }
    ShrineUI.open(this, game);
  }

  // 完成试炼
  complete(game) {
    if (this.cleared) {
      Dialogue.show('这座神庙已经通关了');
      return;
    }
    this.cleared = true;
    SaveSystem.clearShrine(this.defId);
    this._syncVisual();
    // 奖励
    game.player.inventory.add(this.def.reward, 1);
    Dialogue.show(`◆ 通关 ${this.def.name}！获得 ⭕ 克服之玉`);
    Effects.pickupFlash(this.mesh.position);
    // 推进任务进度
    const p = QuestSystem.progress;
    QuestSystem.set('shrinesCleared', (p.shrinesCleared || 0) + 1);
    QuestSystem.check();
  }

  _syncVisual() {
    if (!this.mesh) return;
    const p = this.mesh.userData.parts || {};
    const main = this.cleared ? 0x66ddff : 0xffaa44;
    const soft = this.cleared ? 0x88f4ff : 0xffcc66;
    for (const part of [p.arch, p.halo, p.runeRing]) {
      if (part && part.material && part.material.color) part.material.color.setHex(part === p.arch ? main : soft);
      if (part && part.material && part.material.emissive) part.material.emissive.setHex(main);
    }
    if (p.baseGlow && p.baseGlow.material) p.baseGlow.material.color.setHex(main);
    if (p.beam && p.beam.material) p.beam.material.color.setHex(soft);
    if (p.light) {
      p.light.color.setHex(main);
      p.light.intensity = this.cleared ? 1.15 : 1.65;
    }
  }
}
