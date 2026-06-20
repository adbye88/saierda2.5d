/* ========================================================
   Forest.js — 迷失森林
   更密集的树木、迷雾、更强的敌人（蓝/黑波克布林、莫力布林）
   有宝箱掉落强力装备；森林深处可挑战风咒盖侬
   ======================================================== */

class Forest extends BaseScene {
  constructor() {
    super('forest');
    this.bounds = { minX: -170, maxX: 170, minZ: -170, maxZ: 170 };
    this.spawnPoint = { x: 0, z: 112, a: Math.PI };
  }

  build() {
    this._setupGround(0x2a5a2a, 'forestFloor'); // 森林落叶地面

    // 雾气
    this.scene.fog = new THREE.FogExp2(0x9ab89a, 0.025);

    // 大量树
    this.scatter(() => AssetFactory.createTree(), 160);
    this.scatter(() => AssetFactory.createBigTree(), 54);
    this.scatter(() => AssetFactory.createBush(), 78);
    this.scatter(() => AssetFactory.createRock(0.8), 52);
    for (const [x, z, r, h] of [[-42, 34, 6, 1.6], [38, -34, 7, 1.9], [22, 38, 5, 1.4], [-102, 72, 8, 2.0], [104, -76, 8, 2.1], [86, 104, 7, 1.8]]) {
      const slope = AssetFactory.createSlopeHill(r, h, 0x365f35);
      slope.position.set(x, 0, z);
      this.scene.add(slope);
      this.addSlopeZone(x, z, r, h);
    }
    this.addRuinCluster(-148, 34, { color: 0x5c6554, count: 6, rotation: 0.2 });
    this.addRuinCluster(146, 132, { color: 0x4f5b4b, count: 7, rotation: -0.45 });

    // 敌人（比草原强）
    const enemySpots = [
      [-12, 10, 'blueBokoblin'],
      [12, 5, 'blueBokoblin'],
      [-20, -5, 'blackBokoblin'],
      [20, -10, 'blackBokoblin'],
      [0, -15, 'moblin'],
      [-25, 20, 'octorok'],
      [25, 15, 'octorok'],
      [-8, -25, 'stal'],
      [8, -30, 'stal'],
      [-42, 12, 'archerBokoblin'],
      [42, 10, 'archerBokoblin'],
      [-38, -42, 'yigaFootsoldier'],
      [38, -44, 'yigaFootsoldier'],
      [-55, 42, 'stonePebblit'],
      [55, 38, 'stonePebblit'],
      [0, -48, 'fireWizzrobe'],
      [-28, -58, 'shockWizzrobe'],
      [28, -56, 'iceWizzrobe'],
      [58, -18, 'blackBokoblin'],
      [-58, -22, 'blackBokoblin'],
      [-102, 84, 'silverMoblin'],
      [108, -90, 'blackBokoblin'],
      [94, 104, 'shockWizzrobe'],
      [-112, -68, 'guardian'],
      [112, 72, 'blueMoblin'],
      [-94, -104, 'maliceWizzrobe'],
      [86, -112, 'goldBokoblin']
    ];
    for (const [x, z, type] of enemySpots) {
      this.enemies.push(new Enemy(type, x, z));
    }
    for (const e of this.enemies) this.scene.add(e.mesh);
    this.addFieldBoss('lynel', -112, 108, '迷雾林地莱尼尔');
    this.addFieldBoss('stoneTalus', 114, -112, '古树根岩石巨像');
    this.addFieldBoss('hinox', -148, 34, '萨托利林地独眼巨人');
    this.addFieldBoss('stalnox', 146, 132, '迷失森林深处骷髅独眼巨人');
    this.addFieldBoss('guardianStalker', 132, -138, '森林遗迹行走守护者');

    // 神兽 Boss：风咒盖侬（森林深处）
    const boss = new Enemy('windblightGanon', 0, -70);
    boss.boss = true;
    boss._bossActive = false;
    boss.mesh.visible = false;
    this.boss = boss;
    if (!ChampionSystem.isLiberated('wind')) {
      this.scene.add(boss.mesh);
      this.enemies.push(boss);
    } else {
      this.bossDefeated = true;
      boss.dead = true;
    }
    this.divineBeast = ChampionSystem.addDivineBeast(this, 'wind', 58, -58, 0x99e8ff);
    if (typeof DivineBeastChallengeSystem !== 'undefined') {
      DivineBeastChallengeSystem.attachTerminal(this, 'wind', 50, -48);
    }

    // 大师之剑台座：不再从怪物身上掉落，必须拥有 13 颗心才能拔出。
    const swordX = 0, swordZ = 42;
    for (let i = this.colliders.length - 1; i >= 0; i--) {
      const obj = this.colliders[i];
      if (Math.hypot(obj.position.x - swordX, obj.position.z - swordZ) < 8) {
        if (obj.parent) obj.parent.remove(obj);
        this.colliders.splice(i, 1);
      }
    }
    const pedestal = new THREE.Group();
    const stoneMat = (typeof AssetFactory !== 'undefined' && AssetFactory._artMat)
      ? AssetFactory._artMat('shrine-stone', 0xf1e6c9, { flat: false, rough: 0.84 })
      : new THREE.MeshStandardMaterial({ color: 0xf1e6c9, roughness: 0.84 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 0.55, 10), stoneMat);
    base.position.y = 0.28;
    pedestal.add(base);
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.95, 0.7, 8), stoneMat);
    plinth.position.y = 0.9;
    pedestal.add(plinth);
    const sword = AssetFactory.createWeaponMesh('masterSword');
    sword.position.set(0, 1.65, 0);
    sword.rotation.set(Math.PI, 0, 0);
    const progress = SaveSystem.getProgress ? SaveSystem.getProgress() : {};
    sword.visible = !progress.masterSwordClaimed;
    pedestal.add(sword);
    pedestal.position.set(swordX, 0, swordZ);
    pedestal.userData.npc = true;
    pedestal.userData.name = '大师之剑';
    pedestal.userData.actionLabel = '拔剑';
    pedestal.userData.onTalk = (game) => {
      const p = game && game.player;
      if (!p || !p.inventory) return;
      if (p.inventory.countOf('masterSword') > 0 || SaveSystem.getProgress().masterSwordClaimed) {
        Dialogue.show('【大师之剑】剑台仍在微微发光，驱魔之剑已经认可了你。');
        return;
      }
      const hearts = p.maxHp || 0;
      if (hearts < 13) {
        Dialogue.show(`【大师之剑】生命力还不足。需要 13 颗心才能拔出，现在是 ${hearts} 颗心。`);
        if (typeof Effects !== 'undefined') Effects.shrineRunePulse(pedestal.position.clone());
        return;
      }
      p.inventory.add('masterSword', 1);
      const nextProgress = SaveSystem.getProgress();
      nextProgress.masterSwordClaimed = true;
      SaveSystem.setProgress(nextProgress);
      sword.visible = false;
      Dialogue.show('【大师之剑】驱魔之剑认可了你。常态攻击30，面对守护者、神兽与灾厄时觉醒为60！', 4200);
      if (typeof Effects !== 'undefined') {
        Effects.pickupFlash(pedestal.position.clone().setY(1.2));
        Effects.shrineRunePulse(pedestal.position.clone());
      }
      if (typeof AudioSystem !== 'undefined') AudioSystem.play('power');
    };
    this.scene.add(pedestal);
    this.npcs.push({ mesh: pedestal });

    // 中央祭坛（莫力布林守着宝箱）
    const altar = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 5, 0.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x6a5a4a, flatShading: true })
    );
    altar.position.set(0, 0.25, -15);
    this.scene.add(altar);

    const chest = AssetFactory.createChest();
    chest.position.set(0, 0.5, -15);
    this.scene.add(chest);
    this.breakables.push({
      mesh: chest, broken: false,
      break_open: (game) => {
        const b = this.breakables.find(x => x.mesh === chest);
        if (b.broken) return; b.broken = true;
        const lid = chest.getObjectByName('lid');
        if (lid) { lid.position.y += 0.05; lid.rotation.x = -1.1; }
        const drop = new DropItem('knightSword', 1, chest.position.x, chest.position.z + 1.5);
        this.drops.push(drop); this.scene.add(drop.mesh);
        const d2 = new DropItem('soldierShield', 1, chest.position.x + 1.5, chest.position.z);
        this.drops.push(d2); this.scene.add(d2.mesh);
        Dialogue.show('宝箱：获得了 ⚔️ 骑士之剑 和 🛡️ 士兵之盾！');
      }
    });

    // 英帕：推进卡卡利科村主线，并给出四神兽方向
    const impa = AssetFactory.createMerchant(0xd8b08c);
    impa.position.set(-8, 0, 58);
    impa.userData.npc = true;
    impa.userData.name = '英帕';
    impa.userData.onTalk = () => {
      const firstTalk = !QuestSystem.progress.metImpa;
      QuestSystem.set('metImpa', true);
      if (typeof StorySystem !== 'undefined') StorySystem.markEvent('metImpa');
      Dialogue.show(firstTalk
        ? '【英帕】勇者，你失去的不是力量，而是记忆。先寻找石板影像中的回忆点，再解放水、火、风、雷四神兽。'
        : '【英帕】回忆会告诉你为何战斗，神兽会给予你战斗的力量。两件事都很重要。',
        4200);
      QuestSystem.check();
      QuestSystem.refreshHint();
    };
    this.scene.add(impa);
    this.npcs.push({ mesh: impa });
    ShopSystem.spawnInWorld(this, 'kakarikoShop');

    if (typeof StorySystem !== 'undefined') {
      StorySystem.addMemoryMarker(this, 'impaCharge', -14, 54, { color: 0x66ddcc });
      StorySystem.addMemoryMarker(this, 'windChampion', 48, -52, { color: 0x99e8ff });
    }
    this.addShrines(['shrineForestKorok', 'shrineForestMist', 'shrineAncientGrove', 'shrineLostWoodsDeep', 'shrineSatoriGrove']);

    // 散落补给
    const pickups = [
      ['apple', 2, -15, 0],
      ['mushroom', 2, 15, 5],
      ['rupee', 10, -10, -20],
      ['arrow', 10, 10, -20],
      ['heartyApple', 1, 20, 25]
    ];
    for (const [item, n, x, z] of pickups) {
      const d = new DropItem(item, n, x, z);
      this.drops.push(d); this.scene.add(d.mesh);
    }

    // 通往地下城的传送门（南方）
    const gate = AssetFactory.createDungeonGate();
    gate.position.set(0, 0, 78);
    gate.userData.target = 'dungeon';
    gate.userData.targetName = '地下水牢';
    gate.userData.triggered = false;
    this.scene.add(gate);
    this.gates.push(gate);

    // 回草原的门（北方）
    const gateBack = AssetFactory.createDungeonGate();
    gateBack.position.set(0, 0, -118);
    gateBack.userData.target = 'grassland';
    gateBack.userData.targetName = '起始台地';
    gateBack.userData.triggered = false;
    this.scene.add(gateBack);
    this.gates.push(gateBack);

    // 森林远古塔
    this.addTower(104, 104, '迷失森林鸟望塔');
    this.addTower(-116, -96, '古树海鸟望塔');
    this.addTower(150, 132, '迷雾深林鸟望塔');
    this.addTower(-150, 38, '萨托利林地鸟望塔');

    setTimeout(() => {
      if (window.game && window.game.currentWorld === this) {
        HUD.setQuest('击败森林深处的风咒盖侬，解放神兽瓦·梅德');
      }
    }, 800);
  }

  update(dt, game) {
    super.update(dt, game);
    if (this.towers) {
      for (const t of this.towers) {
        if (t.userData.activated) continue;
        if (game.player.position.distanceTo(t.position) < 3) {
          t.userData.activated = true;
          t.children[1].material.color.setHex(0xffd54f);
          SaveSystem.unlockTower(t.userData.worldName);
          Dialogue.show(`◆ 解锁了 ${t.userData.towerName}！现在可随时传送至此`);
          Effects.portalEffect(t.position);
          QuestSystem.check();
        }
      }
    }
    if (this.boss && !this.boss._bossActive) {
      const d = game.player.position.distanceTo(this.boss.mesh.position);
      if (d < 14) {
        if (typeof DivineBeastChallengeSystem !== 'undefined' && !DivineBeastChallengeSystem.canFight('wind')) return;
        this.boss._bossActive = true;
        this.boss.mesh.visible = true;
        Dialogue.show('【风咒盖侬】瓦·梅德的风影锁定了你！');
        HUD.setQuest('击败风咒盖侬，解放神兽瓦·梅德！', 0x99e8ff);
      }
    }
    if (this.boss && this.boss.dead && !this.bossDefeated) {
      this.bossDefeated = true;
      ChampionSystem.unlock('wind');
      Dialogue.show('【胜利】风咒盖侬被击败！空中按跳跃可发动力巴尔之猛。');
    }
  }
}
