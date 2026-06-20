/* ========================================================
   Dungeon.js — 地下水牢
   封闭式地下城：骷髅、守护者、最终 Boss 岩石巨像
   击败 Boss 获得矿石奖励；大师之剑改为迷失森林台座获取
   ======================================================== */

class Dungeon extends BaseScene {
  constructor() {
    super('dungeon');
    this.bounds = { minX: -30, maxX: 30, minZ: -30, maxZ: 30 };
    this.spawnPoint = { x: 0, z: 25, a: Math.PI };
    this.bossSpawned = false;
    this.bossDefeated = false;
  }

  build() {
    // 地下城地面（深色石板）
    this._setupGround(0x4a4a52, 'dungeonFloor');

    // 雾气（地下氛围）
    this.scene.fog = new THREE.Fog(0x1a1a25, 10, 35);

    // 周围石墙（4 面）
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x5a5a62, flatShading: true, roughness: 1 });
    const wallH = 6;
    const makeWall = (w, x, z, rotY) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, 1.5), wallMat);
      wall.position.set(x, wallH / 2, z);
      wall.rotation.y = rotY;
      wall.userData.collisionRadius = 1.5;
      this.scene.add(wall);
      this.colliders.push(wall);
    };
    makeWall(60, 0, -30, 0);
    makeWall(60, 0, 30, 0);
    makeWall(60, -30, 0, Math.PI / 2);
    makeWall(60, 30, 0, Math.PI / 2);

    // 立柱装饰（也是障碍物）
    for (const [x, z] of [[-15, -15], [15, -15], [-15, 15], [15, 15]]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 5, 1.5), wallMat);
      pillar.position.set(x, 2.5, z);
      pillar.userData.collisionRadius = 1.2;
      this.scene.add(pillar);
      this.colliders.push(pillar);
    }

    // 火炬（提供光照 + 氛围）
    this.torches = [];
    this.torchLights = [];
    for (const [x, z] of [[-12, 0], [12, 0], [0, -12], [0, 12]]) {
      const torch = AssetFactory.createCampfire();
      torch.position.set(x, 0, z);
      torch.scale.set(0.6, 0.6, 0.6);
      this.scene.add(torch);
      this.torches.push(torch);
      const light = new THREE.PointLight(0xff8844, 1.2, 12);
      light.position.set(x, 2, z);
      this.scene.add(light);
      this.torchLights.push(light);
    }

    // 普通敌人：骷髅 + 守护者
    const enemySpots = [
      [-10, 10, 'stal'],
      [10, 10, 'stal'],
      [-10, -5, 'stal'],
      [10, -5, 'stal'],
      [-18, 0, 'guardian'],
      [18, 0, 'guardian'],
      [-20, 14, 'stonePebblit'],
      [20, 14, 'stonePebblit'],
      [-20, -14, 'stonePebblit'],
      [20, -14, 'stonePebblit'],
      [0, -8, 'iceWizzrobe'],
      [-8, -18, 'archerBokoblin'],
      [8, -18, 'archerBokoblin']
    ];
    for (const [x, z, type] of enemySpots) {
      this.enemies.push(new Enemy(type, x, z));
    }
    for (const e of this.enemies) this.scene.add(e.mesh);

    // Boss：岩石巨像（北方深处）
    const boss = new Enemy('stoneTalus', 0, -20);
    boss.boss = true;
    boss._bossActive = false;
    this.boss = boss;
    // Boss 初始隐藏，玩家进入区域才激活
    boss.mesh.visible = false;
    this.scene.add(boss.mesh);
    this.enemies.push(boss);

    // 散落补给
    const pickups = [
      ['heartyApple', 2, -15, 20],
      ['heartyApple', 2, 15, 20],
      ['arrow', 15, 0, 18],
      ['rupee', 30, -20, -20],
      ['roastedMeat', 1, 20, -20]
    ];
    for (const [item, n, x, z] of pickups) {
      const d = new DropItem(item, n, x, z);
      this.drops.push(d); this.scene.add(d.mesh);
    }

    // 出口（回森林）
    const gateBack = AssetFactory.createDungeonGate();
    gateBack.position.set(0, 0, 28);
    gateBack.userData.target = 'forest';
    gateBack.userData.targetName = '迷失森林';
    gateBack.userData.triggered = false;
    this.scene.add(gateBack);
    this.gates.push(gateBack);

    setTimeout(() => {
      if (window.game && window.game.currentWorld === this) {
        HUD.setQuest('深入水牢，击败岩石巨像');
      }
    }, 800);
  }

  update(dt, game) {
    super.update(dt, game);
    // 火炬跳动
    if (this.torchLights) {
      const t = performance.now() * 0.005;
      this.torchLights.forEach((l, i) => {
        l.intensity = 1.0 + Math.sin(t + i) * 0.3;
      });
    }
    // Boss 激活：玩家靠近时苏醒
    if (this.boss && !this.boss._bossActive && !this.bossDefeated) {
      const d = game.player.position.distanceTo(this.boss.mesh.position);
      if (d < 14) {
        this.boss._bossActive = true;
        this.boss.mesh.visible = true;
        Dialogue.show('【岩石巨像】轰隆隆…巨大的岩石怪物苏醒了！');
        HUD.setQuest('击败岩石巨像！攻击它头上的橙色矿石！', 0xff4444);
      }
    }
    // Boss 死亡
    if (this.boss && this.boss.dead && !this.bossDefeated) {
      this.bossDefeated = true;
      Dialogue.show('【胜利】岩石巨像被击败了！珍贵矿石散落一地。真正的驱魔之剑仍在迷失森林等待考验。');
      HUD.setQuest('你拯救了海拉鲁！前往任意传送门继续探索', 0xffd54f);
    }
  }
}
