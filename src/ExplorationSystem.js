/* ========================================================
   ExplorationSystem.js — 旷野式探索玩法增强
   - 隐藏宝箱 / 克洛格式小谜题 / 高处奖励
   - 简化攀爬点、环境危险、营地潜入与武器生态提示
   ======================================================== */

const ExplorationSystem = {
  _clueAt: 0,

  init() {
    const p = SaveSystem.getProgress ? SaveSystem.getProgress() : {};
    if (!p.discoveryRewards) p.discoveryRewards = [];
    if (!p.koroks) p.koroks = [];
    if (!p.clearedCamps) p.clearedCamps = [];
    if (!p.harvestedNodes) p.harvestedNodes = [];
    if (!p.discoveredRecipes) p.discoveredRecipes = [];
    if (!p.scannedCompendium) p.scannedCompendium = [];
    if (!p.rumorsHeard) p.rumorsHeard = [];
    if (!p.bounties) p.bounties = { claimed: [] };
    if (!Array.isArray(p.bounties.claimed)) p.bounties.claimed = [];
    SaveSystem.setProgress && SaveSystem.setProgress(p);
  },

  isClaimed(id) {
    const p = SaveSystem.getProgress ? SaveSystem.getProgress() : {};
    return (p.discoveryRewards || []).includes(id) || (p.koroks || []).includes(id) || (p.chests || []).includes(id);
  },

  markClaimed(id, kind = 'reward') {
    const p = SaveSystem.getProgress ? SaveSystem.getProgress() : {};
    const key = kind === 'korok' ? 'koroks' : 'discoveryRewards';
    if (!p[key]) p[key] = [];
    if (!p[key].includes(id)) p[key].push(id);
    SaveSystem.setProgress && SaveSystem.setProgress(p);
  },

  _progressList(key) {
    const p = SaveSystem.getProgress ? SaveSystem.getProgress() : {};
    if (!Array.isArray(p[key])) p[key] = [];
    return { p, list: p[key] };
  },

  _hasProgress(key, id) {
    const p = SaveSystem.getProgress ? SaveSystem.getProgress() : {};
    return Array.isArray(p[key]) && p[key].includes(id);
  },

  _markProgress(key, id) {
    if (!id) return false;
    const { p, list } = this._progressList(key);
    if (list.includes(id)) return false;
    list.push(id);
    SaveSystem.setProgress && SaveSystem.setProgress(p);
    return true;
  },

  materialProps() {
    return {
      metal: ['soldierSword','knightSword','royalSword','masterSword','flameblade','frostblade','thunderblade','ancientShortSword','soldierSpear','knightHalberd','royalHalberd','ancientSpear','travelerClaymore','soldierClaymore','knightClaymore','royalClaymore','royalGuardClaymore','soldierShield','knightShield','hylianShield','ancientShield','gerudoShield','radiantShield','royalGuardShield'],
      wood: ['travelerSword','bokoClub','woodenShield','bokoShield','travelerBow','soldierBow','knightBow','royalBow','forestDwellerBow','fireBow','iceBow','shockBow','falconBow','duplexBow']
    };
  },

  isMetal(itemId) { return this.materialProps().metal.includes(itemId); },
  isWood(itemId) { return this.materialProps().wood.includes(itemId); },

  addDiscoveryReward(world, def) {
    if (!world || !def || !def.id || this.isClaimed(def.id)) return null;
    if (!world.discoveryRewards) world.discoveryRewards = [];
    const pos = new THREE.Vector3(def.x || 0, def.y || 0, def.z || 0);
    const marker = this._createRewardMarker(def);
    marker.position.copy(pos);
    marker.userData.discoveryReward = def;
    world.scene.add(marker);
    world.discoveryRewards.push(Object.assign({}, def, { pos, marker, revealed: false }));
    return marker;
  },

  addKorokPuzzle(world, def) {
    if (!world || !def || !def.id || this.isClaimed(def.id)) return null;
    if (!world.korokPuzzles) world.korokPuzzles = [];
    const pos = new THREE.Vector3(def.x || 0, def.y || 0, def.z || 0);
    const marker = this._createKorokMarker(def);
    marker.position.copy(pos);
    marker.userData.korokPuzzle = def;
    world.scene.add(marker);
    world.korokPuzzles.push(Object.assign({}, def, { pos, marker, solved: false }));
    return marker;
  },

  addClimbSpot(world, def) {
    if (!world || !def) return null;
    if (!world.climbSpots) world.climbSpots = [];
    const spot = { x: def.x || 0, z: def.z || 0, radius: def.radius || 5, height: def.height || 5, label: def.label || '可攀爬地点', rewardId: def.rewardId };
    world.climbSpots.push(spot);
    const marker = this._createClimbMarker(spot);
    marker.position.set(spot.x, 0, spot.z);
    world.scene.add(marker);
    spot.marker = marker;
    return marker;
  },

  addHazardZone(world, def) {
    if (!world || !def) return;
    if (!world.hazardZones) world.hazardZones = [];
    world.hazardZones.push(Object.assign({ radius: 12, damage: 0.5, interval: 1.1, _tick: 0 }, def));
  },

  addCamp(world, def) {
    if (!world || !def) return null;
    if (!world.camps) world.camps = [];
    const camp = Object.assign({ radius: 16, alarmRadius: 9, alerted: false, hornTimer: 0 }, def);
    camp.id = camp.id || `${world.name || 'world'}_camp_${Math.round(camp.x || 0)}_${Math.round(camp.z || 0)}`;
    world.camps.push(camp);
    const flag = this._createCampFlag(camp);
    flag.position.set(camp.x || 0, 0, camp.z || 0);
    world.scene.add(flag);
    camp.marker = flag;
    this._createCampExplosive(world, camp);
    return camp;
  },

  addHarvestNode(world, def) {
    if (!world || !def || !def.id || this._hasProgress('harvestedNodes', def.id)) return null;
    if (!world.harvestNodes) world.harvestNodes = [];
    const node = Object.assign({
      radius: 2.2,
      clueRadius: 7,
      label: '采集点',
      items: [['apple', 1]],
      kind: 'herb'
    }, def);
    node.pos = new THREE.Vector3(node.x || 0, node.y || 0, node.z || 0);
    node.marker = this._createHarvestMarker(node);
    node.marker.position.copy(node.pos);
    node.marker.userData.harvestNode = node;
    world.scene.add(node.marker);
    world.harvestNodes.push(node);
    return node.marker;
  },

  addRumor(world, def) {
    if (!world || !def || !def.id) return null;
    if (!world.rumors) world.rumors = [];
    const rumor = Object.assign({ radius: 2.5, clueRadius: 8, label: '传闻线索' }, def);
    rumor.pos = new THREE.Vector3(rumor.x || 0, rumor.y || 0, rumor.z || 0);
    rumor.marker = this._createRumorMarker(rumor);
    rumor.marker.position.copy(rumor.pos);
    rumor.marker.userData.rumor = rumor;
    world.scene.add(rumor.marker);
    world.rumors.push(rumor);
    return rumor.marker;
  },

  updateWorld(world, game, dt) {
    if (!world || !game || !game.player) return;
    this._updateTemporaryZones(world, dt);
    this._updateRewards(world, game);
    this._updateKoroks(world, game);
    this._updateClimbSpots(world, game, dt);
    this._updateHazards(world, game, dt);
    this._updateCamps(world, game, dt);
    this._updateHarvestNodes(world, game, dt);
    this._updateRumors(world, game, dt);
  },

  applyElementToWorld(world, pos, element, source) {
    if (!world || !pos || !element) return;
    if (element === 'fire') {
      this.addHazardZone(world, { type: 'fire', x: pos.x, z: pos.z, radius: 4.2, damage: 0.25, interval: 0.65, duration: 5.5, color: 0xff5522, message: '草地被点燃了，火势会短暂蔓延！', safeMessage: '耐火效果抵住了燃烧。' });
      this._showClue('火焰点燃了草地：可以逼退敌人，也会烧伤木盾。');
      if (typeof Effects !== 'undefined') Effects.hitBurst(pos.clone().setY(0.4), 0xff5522, 12);
    } else if (element === 'ice') {
      const terrain = world.getTerrainAt ? world.getTerrainAt(pos.x, pos.z) : null;
      if (terrain && terrain.inWater) {
        world.bridgeZones.push({ x: pos.x, z: pos.z, width: 6, length: 6, rotation: 0, temporary: true, life: 10 });
        const ice = new THREE.Mesh(new THREE.BoxGeometry(6, 0.18, 6), new THREE.MeshStandardMaterial({ color: 0xbfeeff, transparent: true, opacity: 0.72, roughness: 0.35 }));
        ice.position.set(pos.x, 0.06, pos.z);
        ice.userData.temporaryElement = true;
        world.scene.add(ice);
        if (!world.temporaryElementObjects) world.temporaryElementObjects = [];
        world.temporaryElementObjects.push({ mesh: ice, life: 10 });
        this._showClue('冰冻水面形成了临时落脚点，可以当作冰桥通过。');
      }
      if (typeof Effects !== 'undefined') Effects.hitBurst(pos.clone().setY(0.4), 0x66ddff, 10);
    } else if (element === 'shock') {
      let shocked = 0;
      for (const e of (world.enemies || [])) {
        if (e.dead || !e.mesh) continue;
        if (e.mesh.position.distanceTo(pos) < 5.5) {
          e._stunTimer = Math.max(e._stunTimer || 0, 1.1);
          e.hurtTimer = Math.max(e.hurtTimer || 0, 0.45);
          shocked++;
        }
      }
      if (shocked > 0) this._showClue('雷电沿地面传导，麻痹了附近敌人。金属装备会让雷更危险。');
      if (typeof Effects !== 'undefined') Effects.elementalAura(pos.clone().setY(0.8), 0xffee44);
    }
  },

  _updateTemporaryZones(world, dt) {
    if (world.bridgeZones) {
      for (const z of world.bridgeZones) if (z.temporary) z.life -= dt;
      world.bridgeZones = world.bridgeZones.filter(z => !z.temporary || z.life > 0);
    }
    if (world.hazardZones) {
      for (const z of world.hazardZones) if (z.duration !== undefined) z.duration -= dt;
      world.hazardZones = world.hazardZones.filter(z => z.duration === undefined || z.duration > 0);
    }
    if (world.temporaryElementObjects) {
      for (const obj of world.temporaryElementObjects) obj.life -= dt;
      world.temporaryElementObjects = world.temporaryElementObjects.filter(obj => {
        if (obj.life > 0) return true;
        if (obj.mesh && obj.mesh.parent) obj.mesh.parent.remove(obj.mesh);
        return false;
      });
    }
  },

  _updateRewards(world, game) {
    for (const r of (world.discoveryRewards || [])) {
      if (r.revealed || this.isClaimed(r.id)) continue;
      const dist = game.player.position.distanceTo(r.pos);
      const highEnough = game.player.position.y >= (r.requireHeight || 0);
      if (dist < (r.radius || 2.5) && highEnough) {
        r.revealed = true;
        this.markClaimed(r.id, 'reward');
        this._grantReward(game, r.items || [['rupee', 20]]);
        if (r.marker && r.marker.parent) r.marker.parent.remove(r.marker);
        Dialogue.show(r.message || ('发现隐藏奖励：' + (r.label || '古老宝箱') + '！'), 2600);
        HUD.setQuest(r.quest || ('探索发现：' + (r.label || '隐藏奖励')), 0xffd66a);
        if (typeof Effects !== 'undefined') {
          Effects.pickupFlash(r.pos.clone());
          Effects.shrineRunePulse(r.pos.clone());
        }
      } else if (dist < (r.clueRadius || 9)) {
        this._showClue(r.clue || ('附近似乎藏着' + (r.label || '什么东西') + '…'));
      }
    }
  },

  _updateKoroks(world, game) {
    for (const k of (world.korokPuzzles || [])) {
      if (k.solved || this.isClaimed(k.id)) continue;
      const dist = game.player.position.distanceTo(k.pos);
      const wantsInspect = Input.justInteract || Input.state.interact || Input._interactBuffer > 0;
      if (dist < (k.radius || 2.1) && wantsInspect) {
        k.solved = true;
        this.markClaimed(k.id, 'korok');
        this._grantReward(game, k.items || [['stamellaShroom', 2], ['rupee', 10]]);
        if (k.marker && k.marker.parent) k.marker.parent.remove(k.marker);
        Dialogue.show(k.message || '呀哈哈！你找到我了！收下这份小礼物吧。', 2800);
        if (typeof Effects !== 'undefined') Effects.elementalAura(k.pos.clone().setY(1.2), 0x9fffb4);
      } else if (dist < (k.clueRadius || 8)) {
        this._showClue(k.clue || '石阵、树洞或落叶堆看起来有点不自然。按 E / 对话调查。');
      }
    }
  },

  _updateHarvestNodes(world, game, dt) {
    const player = game.player;
    const wantsInspect = Input.justInteract || Input.state.interact || Input._interactBuffer > 0;
    for (const node of (world.harvestNodes || [])) {
      if (!node || node.done || this._hasProgress('harvestedNodes', node.id)) continue;
      const dist = player.position.distanceTo(node.pos);
      if (node.marker) {
        node.marker.rotation.y += dt * 0.65;
        const glow = node.marker.getObjectByName && node.marker.getObjectByName('harvestGlow');
        if (glow) glow.scale.setScalar(0.9 + Math.sin(performance.now() * 0.004) * 0.08);
      }
      if (dist < (node.radius || 2.2) && wantsInspect) {
        node.done = true;
        this._markProgress('harvestedNodes', node.id);
        this._grantReward(game, node.items || [['apple', 1]]);
        if (node.marker && node.marker.parent) node.marker.parent.remove(node.marker);
        Dialogue.show(`采集：${node.label}，获得了 ${this._itemsText(node.items)}`);
        if (typeof Effects !== 'undefined') Effects.pickupFlash(node.pos.clone().setY(0.8));
      } else if (dist < (node.clueRadius || 7)) {
        this._showClue(node.clue || `附近有${node.label}，按 E / 对话采集。`);
      }
    }
  },

  _updateRumors(world, game, dt) {
    const player = game.player;
    const wantsInspect = Input.justInteract || Input.state.interact || Input._interactBuffer > 0;
    for (const rumor of (world.rumors || [])) {
      if (!rumor) continue;
      const dist = player.position.distanceTo(rumor.pos);
      if (rumor.marker) rumor.marker.rotation.y += dt * 0.35;
      if (dist < (rumor.radius || 2.5) && wantsInspect) {
        const first = this._markProgress('rumorsHeard', rumor.id);
        Dialogue.show(rumor.text || rumor.clue || '听到了一条新的冒险传闻。', 4200);
        HUD.setQuest(`传闻：${rumor.label || '新的线索'}`, 0x9fd3ff);
        if (first && rumor.items) this._grantReward(game, rumor.items);
        if (typeof CompendiumUI !== 'undefined' && CompendiumUI.isOpen) CompendiumUI.refresh();
      } else if (dist < (rumor.clueRadius || 8)) {
        this._showClue(rumor.clue || `调查${rumor.label || '路牌'}可获得线索。`);
      }
    }
  },

  _updateClimbSpots(world, game, dt) {
    const player = game.player;
    let near = null;
    for (const s of (world.climbSpots || [])) {
      const d = Math.hypot(player.position.x - s.x, player.position.z - s.z);
      if (d < s.radius) { near = s; break; }
    }
    player._nearClimbSpot = near;
    if (near) {
      this._showClue('按住跳跃可攀爬：' + near.label + '。高处能滑翔到隐藏点。');
      if (near.marker) near.marker.rotation.y += dt * 0.9;
    }
  },

  _updateHazards(world, game, dt) {
    const player = game.player;
    const inv = player.inventory;
    const resist = inv && inv.getResist ? inv.getResist() : {};
    for (const z of (world.hazardZones || [])) {
      const d = Math.hypot(player.position.x - (z.x || 0), player.position.z - (z.z || 0));
      if (d > z.radius) continue;
      let protectedBy = false;
      if (z.type === 'cold') protectedBy = (resist.cold > 0) || (inv.hasBuff && inv.hasBuff('coldRes'));
      if (z.type === 'heat') protectedBy = (resist.heat > 0) || (inv.hasBuff && inv.hasBuff('heatRes'));
      if (z.type === 'fire') protectedBy = (resist.fire > 0) || (inv.hasBuff && inv.hasBuff('fireRes'));
      if (protectedBy) {
        this._showClue(z.safeMessage || '装备/料理抵御了环境伤害。');
        continue;
      }
      z._tick += dt;
      if (z._tick >= (z.interval || 1.1)) {
        z._tick = 0;
        if (player.takeDamage) player.takeDamage(z.damage || 0.5, new THREE.Vector3(), z.type === 'fire' ? 'fire' : null);
        else player.hp -= z.damage || 0.5;
        Dialogue.show(z.message || '环境太危险了，需要对应料理或防具。', 1100);
        if (typeof Effects !== 'undefined') Effects.hitBurst(player.position.clone().setY(1.1), z.color || 0xff8844, 5);
      }
    }
  },

  _updateCamps(world, game, dt) {
    const player = game.player;
    for (const c of (world.camps || [])) {
      if (!c._rolesAssigned) this._assignCampRoles(world, c);
      const center = new THREE.Vector3(c.x || 0, 0, c.z || 0);
      const d = player.position.distanceTo(center);
      this._updateCampEnemies(world, c, player, dt);
      this._checkCampClear(world, game, c);
      if (d > c.radius) {
        c.hornTimer = Math.max(0, (c.hornTimer || 0) - dt * 0.65);
        continue;
      }
      const highApproach = player.position.y > 1.2 || player.isGliding;
      const sneaky = !c.alerted && (highApproach || (player._terrainNow && player._terrainNow.slope));
      if (sneaky) {
        player._campStealthBonus = 1.35;
        this._showClue('潜入营地：' + (c.name || '怪物营地') + '。高处/背后攻击会提高突袭伤害。');
      }
      if (!c.alerted && d < c.alarmRadius && !sneaky) {
        c.hornTimer = (c.hornTimer || 0) + dt;
        const lookout = (c.enemies || []).find(e => e && !e.dead && e.campRole === 'lookout');
        if (lookout && !lookout.disarmed) {
          this._showClue('号角手正在吸气！从高处射击或雷击可打断警戒。');
        }
        if (c.hornTimer > (lookout && !lookout.disarmed ? 1.15 : 1.8)) {
          this.alertCamp(c, '号角声响起！');
        }
      }
      if (c.marker) c.marker.rotation.y += dt * (c.alerted ? 2.5 : 0.7);
    }
  },

  _checkCampClear(world, game, camp) {
    if (!camp || camp.cleared || this._hasProgress('clearedCamps', camp.id)) {
      if (camp) camp.cleared = true;
      return false;
    }
    const enemies = (camp.enemies || []).filter(Boolean);
    if (!enemies.length || enemies.some(e => !e.dead)) return false;
    camp.cleared = true;
    this._markProgress('clearedCamps', camp.id);
    const reward = camp.reward || [['rupee', 35], ['arrow', 8]];
    this._grantReward(game, reward);
    if (camp.marker && camp.marker.parent) {
      const flag = camp.marker;
      flag.scale.setScalar(0.85);
    }
    Dialogue.show(`✓ 清剿完成：${camp.name || '怪物营地'}！获得 ${this._itemsText(reward)}`);
    HUD.setQuest(`营地清剿：${camp.name || '怪物营地'} 已安全`, 0xffd86a);
    if (typeof Effects !== 'undefined') Effects.shrineRunePulse(new THREE.Vector3(camp.x || 0, 0.8, camp.z || 0));
    return true;
  },

  scanNearby(world, game = window.game) {
    if (!world || !game || !game.player) return null;
    const origin = game.player.position;
    const candidates = [];
    for (const e of (world.enemies || [])) {
      if (e && !e.dead && e.mesh) candidates.push({ id: `${world.name}_enemy_${e.typeId}`, label: e.def ? e.def.name : e.typeId, pos: e.mesh.position, type: '怪物' });
    }
    for (const n of (world.harvestNodes || [])) {
      if (n && !n.done) candidates.push({ id: `${world.name}_harvest_${n.kind || n.id}`, label: n.label, pos: n.pos, type: '采集点' });
    }
    for (const r of (world.rumors || [])) {
      if (r) candidates.push({ id: `${world.name}_rumor_${r.id}`, label: r.label, pos: r.pos, type: '传闻' });
    }
    for (const c of (world.camps || [])) {
      if (c) candidates.push({ id: `${world.name}_camp_${c.id}`, label: c.name || '怪物营地', pos: new THREE.Vector3(c.x || 0, 0, c.z || 0), type: '营地' });
    }
    let best = null, bestD = Infinity;
    for (const row of candidates) {
      const d = origin.distanceTo(row.pos);
      if (d < 9 && d < bestD) { best = row; bestD = d; }
    }
    if (!best) {
      Dialogue.show('附近没有可扫描的图鉴目标。');
      return null;
    }
    this._markProgress('scannedCompendium', best.id);
    Dialogue.show(`图鉴扫描：${best.type} · ${best.label}`);
    if (typeof Effects !== 'undefined') Effects.shrineRunePulse(best.pos.clone().setY(1.1));
    if (typeof CompendiumUI !== 'undefined' && CompendiumUI.isOpen) CompendiumUI.refresh();
    return best;
  },

  applyWeaponEcologyOnHit(attacker, target, element) {
    if (!attacker || !attacker.inventory || !target) return;
    const weapon = attacker.inventory.equipped && attacker.inventory.equipped.weapon;
    if (element === 'shock' && weapon && this.isMetal(weapon.itemId)) {
      Dialogue.showFloat('金属武器导电，雷击更危险！', attacker.position.clone().setY(2.2), '#ffee66');
      if (typeof Effects !== 'undefined') Effects.elementalAura(attacker.position.clone().setY(1.1), 0xffee44);
    }
    if (target && target.heldWeaponId) {
      const heavy = weapon && weapon.def && ['claymore', 'club'].includes(weapon.def.subtype);
      if (element === 'shock' && this.isMetal(target.heldWeaponId)) {
        this.disarmEnemy(target, '雷电击落了敌人的金属武器！');
      } else if (element === 'fire' && this.isWood(target.heldWeaponId)) {
        this.disarmEnemy(target, '敌人的木制武器被点燃，掉在地上！');
      } else if (heavy && !target.boss && Math.random() < 0.28) {
        this.disarmEnemy(target, '重击震飞了敌人的武器！');
      }
    }
  },

  modifyPlayerHit(player, enemy, damage, weapon, element) {
    let out = damage;
    const subtype = weapon && weapon.def && weapon.def.subtype;
    const heavy = subtype === 'claymore' || subtype === 'club';
    if (enemy && enemy.heldShieldId && !enemy.boss) {
      if (heavy) {
        this.breakEnemyShield(enemy, '重武器破盾！');
        out = Math.round(out * 1.25);
      } else if (enemy.state !== 'sleep' && enemy.state !== 'hurt') {
        out = Math.round(out * 0.85);
        Dialogue.showFloat('被盾牌卸力', enemy.mesh.position.clone().setY(2.1), '#c8f6ff');
      }
    }
    if (heavy && enemy && (enemy.typeId === 'stonePebblit' || enemy.typeId === 'frostPebblit' || enemy.typeId === 'firePebblit')) {
      out = Math.round(out * 1.8);
      Dialogue.showFloat('破岩重击！', enemy.mesh.position.clone().setY(1.8), '#ffd27a');
    }
    if (heavy && enemy && ['stoneTalus','ignoTalus','frostTalus'].includes(enemy.typeId)) {
      out = Math.round(out * (player.position.y > 1.2 ? 2.0 : 1.35));
      Dialogue.showFloat(player.position.y > 1.2 ? '命中矿石弱点！' : '重武器破岩！', enemy.mesh.position.clone().setY(3.1), '#ffd27a');
    }
    if (enemy && (enemy.typeId === 'hinox' || enemy.typeId === 'blackHinox' || enemy.typeId === 'stalnox') && player.position.y > 1.0) {
      out = Math.round(out * 1.45);
      Dialogue.showFloat('高处打眼！', enemy.mesh.position.clone().setY(3.0), '#ffe16a');
    }
    return out;
  },

  disarmEnemy(enemy, message) {
    if (!enemy || enemy.dead || enemy.disarmed || !enemy.heldWeaponId) return false;
    const itemId = enemy.heldWeaponId;
    enemy.disarmed = true;
    enemy.heldWeaponId = null;
    enemy.atk = Math.max(1, Math.round((enemy.atk || 1) * 0.62));
    if (window.game && window.game.currentWorld && typeof DropItem !== 'undefined') {
      const drop = new DropItem(itemId, 1, enemy.position.x + (Math.random() - 0.5) * 1.2, enemy.position.z + (Math.random() - 0.5) * 1.2);
      window.game.currentWorld.drops.push(drop);
      window.game.currentWorld.scene.add(drop.mesh);
    }
    if (message) Dialogue.showFloat(message, enemy.mesh.position.clone().setY(2.25), '#ffe16a');
    if (typeof Effects !== 'undefined') Effects.hitBurst(enemy.mesh.position.clone().setY(1.2), 0xffee66, 8);
    return true;
  },

  breakEnemyShield(enemy, message) {
    if (!enemy || enemy.dead || !enemy.heldShieldId) return false;
    const itemId = enemy.heldShieldId;
    enemy.heldShieldId = null;
    enemy.hurtTimer = Math.max(enemy.hurtTimer || 0, 0.55);
    if (window.game && window.game.currentWorld && typeof DropItem !== 'undefined') {
      const drop = new DropItem(itemId, 1, enemy.position.x + (Math.random() - 0.5) * 1.2, enemy.position.z + (Math.random() - 0.5) * 1.2);
      window.game.currentWorld.drops.push(drop);
      window.game.currentWorld.scene.add(drop.mesh);
    }
    if (message) Dialogue.showFloat(message, enemy.mesh.position.clone().setY(2.25), '#ffd27a');
    if (typeof Effects !== 'undefined') Effects.hitBurst(enemy.mesh.position.clone().setY(1.25), 0xffd27a, 10);
    return true;
  },

  alertCamp(camp, prefix = '') {
    if (!camp || camp.alerted) return;
    camp.alerted = true;
    for (const e of (camp.enemies || [])) {
      if (!e || e.dead) continue;
      e.sleeping = false;
      e.sight = Math.max(e.sight || 0, (e.baseSight || e.sight || 10) + 8);
      if (e.state === 'sleep') e.state = 'patrol';
    }
    Dialogue.show((prefix ? prefix : '警戒！') + (camp.name || '怪物营地') + '进入警戒。');
    HUD.setQuest('怪物营地警戒：可以撤离、绕后、击破号角手，或引爆营地爆桶', 0xff8844);
  },

  enemyWeaponFor(enemy) {
    if (!enemy || !enemy.typeId) return null;
    const id = enemy.typeId;
    if (id.includes('archer')) return 'travelerBow';
    if (id.includes('goldBokoblin') || id.includes('silverBokoblin')) return 'royalSword';
    if (id.includes('blackBokoblin')) return 'knightSword';
    if (id.includes('blueBokoblin')) return 'soldierSword';
    if (id.includes('Bokoblin')) return 'bokoClub';
    if (id.includes('silverMoblin')) return 'royalHalberd';
    if (id.includes('blueMoblin')) return 'knightClaymore';
    if (id.includes('moblin')) return 'soldierSpear';
    if (id.includes('Lizalfos')) return enemy.element === 'shock' ? 'thunderblade' : enemy.element === 'ice' ? 'frostblade' : 'soldierSpear';
    if (id === 'stal') return 'bokoBoneSpear';
    if (id.includes('yiga')) return 'eightfoldBlade';
    if (id.includes('lynel')) return 'royalSword';
    return null;
  },

  enemyShieldFor(enemy) {
    if (!enemy || !enemy.typeId) return null;
    const id = enemy.typeId;
    if (id.includes('silverBokoblin') || id.includes('goldBokoblin')) return 'soldierShield';
    if (id.includes('blackBokoblin')) return 'bokoShield';
    if (id.includes('blueBokoblin')) return 'woodenShield';
    if (id.includes('Moblin') || id.includes('moblin')) return Math.random() < 0.35 ? 'soldierShield' : null;
    return null;
  },

  _assignCampRoles(world, camp) {
    const center = new THREE.Vector3(camp.x || 0, 0, camp.z || 0);
    const nearby = (world.enemies || [])
      .filter(e => e && !e.boss && !e.dead && e.mesh && e.mesh.position.distanceTo(center) < camp.radius + 5)
      .sort((a, b) => a.mesh.position.distanceTo(center) - b.mesh.position.distanceTo(center));
    camp.enemies = nearby;
    nearby.forEach((e, i) => {
      e.camp = camp;
      e.baseSight = e.baseSight || e.sight;
      e.heldWeaponId = e.heldWeaponId || this.enemyWeaponFor(e);
      e.heldShieldId = e.heldShieldId || this.enemyShieldFor(e);
      e.campRole = i === 0 ? 'lookout' : (i % 4 === 0 ? 'sleeper' : 'patrol');
      if (e.campRole === 'sleeper') e.sleeping = true;
      if (e.campRole === 'lookout') e.sight = Math.max(e.sight, e.baseSight + 4);
    });
    camp._rolesAssigned = true;
  },

  _updateCampEnemies(world, camp, player, dt) {
    const center = new THREE.Vector3(camp.x || 0, 0, camp.z || 0);
    for (const e of (camp.enemies || [])) {
      if (!e || e.dead) continue;
      const dPlayer = e.mesh.position.distanceTo(player.position);
      if (!camp.alerted && e.sleeping && dPlayer < 3.2) {
        e.sleeping = false;
        this.alertCamp(camp, '被睡觉的怪物发现了！');
      }
      if (!camp.alerted && e.campRole === 'patrol' && e.patrolDir && e.mesh.position.distanceTo(center) > camp.radius * 0.85) {
        e.patrolDir.copy(center.clone().sub(e.mesh.position).setY(0).normalize());
      }
      if (camp.alerted && dPlayer < (e.sight || 14)) {
        e.state = dPlayer < e.radius + 2 ? 'attack' : 'chase';
      }
    }
  },

  _createCampExplosive(world, camp) {
    if (!world || !world.breakables) return;
    const angle = camp.barrelAngle || Math.PI * 0.35;
    const dist = Math.min(5.5, Math.max(3.2, (camp.radius || 16) * 0.32));
    const x = (camp.x || 0) + Math.cos(angle) * dist;
    const z = (camp.z || 0) + Math.sin(angle) * dist;
    const barrel = this._createExplosiveBarrel();
    barrel.position.set(x, 0, z);
    world.scene.add(barrel);
    world.breakables.push({
      mesh: barrel,
      broken: false,
      break_open: (game) => {
        if (this.broken) return;
        const obj = world.breakables.find(b => b.mesh === barrel);
        if (obj) obj.broken = true;
        if (barrel.parent) barrel.parent.remove(barrel);
        const pos = barrel.position.clone();
        if (typeof Effects !== 'undefined') {
          Effects.hitBurst(pos.clone().setY(0.7), 0xff5522, 24);
          Effects.elementalAura(pos.clone().setY(1.0), 0xff8844);
        }
        for (const e of (world.enemies || [])) {
          if (e.dead || !e.mesh) continue;
          const d = e.mesh.position.distanceTo(pos);
          if (d < 7) e.takeDamage(45 * (1 - d / 8), new THREE.Vector3().subVectors(e.mesh.position, pos).setY(0).normalize(), 'fire');
        }
        if (game && game.player && game.player.position.distanceTo(pos) < 5.2) {
          game.player.takeDamage(5, new THREE.Vector3().subVectors(game.player.position, pos).setY(0).normalize(), 'fire');
        }
        this.alertCamp(camp, '爆桶炸响！');
      }
    });
  },

  _createExplosiveBarrel() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.48, 0.95, 10),
      new THREE.MeshStandardMaterial({ color: 0x8b2f1f, roughness: 0.72, metalness: 0.05, flatShading: true })
    );
    body.position.y = 0.48;
    g.add(body);
    const bandMat = new THREE.MeshStandardMaterial({ color: 0x2d1d18, roughness: 0.6, metalness: 0.2 });
    for (const y of [0.18, 0.78]) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.035, 5, 12), bandMat);
      band.position.y = y;
      band.rotation.x = Math.PI / 2;
      g.add(band);
    }
    const mark = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffcc44 }));
    mark.position.set(0, 0.98, 0);
    g.add(mark);
    g.userData.collisionRadius = 0.55;
    g.userData.kind = 'explosiveBarrel';
    return g;
  },

  bossTip(enemy) {
    const id = enemy && enemy.typeId || '';
    const name = enemy && enemy.def && enemy.def.name || '强敌';
    if (id.includes('Talus')) return name + ' 的矿石弱点会发光：爬到高处或绕到背后，集中攻击弱点比硬砍身体有效。';
    if (id === 'molduga') return '魔吉拉德会追声音和震动：保持移动，用弓箭/炸响诱它出沙后再近战输出。';
    if (id.includes('guardian')) return name + ' 正在锁定激光：举盾抓准闪光瞬间盾反，可把激光弹回去。';
    if (id.includes('Gleeok')) return name + ' 有多个头：优先用对应克制元素或弓箭打断蓄力，再贴近输出。';
    if (id.includes('hinox') || id.includes('stalnox')) return name + ' 的眼睛是弱点：弓箭射眼可打断，倒地后攻击腿部和腹部。';
    if (id.includes('Lynel') || id === 'lynel' || id === 'silverLynel') return name + ' 会读近身贪刀：完美闪避触发突袭反击，盾反可打断冲锋。';
    if (id.includes('blightGanon')) return name + ' 不是纯数值战：观察蓄力前摇，用盾反/元素克制/英杰能力制造输出窗口。';
    return name + ' 有明显前摇：别硬拼数值，利用盾反、闪避和地形高低差创造窗口。';
  },

  _grantReward(game, items) {
    if (!game || !game.player || !game.player.inventory) return;
    for (const row of items) game.player.inventory.add(row[0], row[1] || 1, row[2] || {});
  },

  _itemsText(items) {
    return (items || []).map(([id, count = 1]) => {
      const d = typeof ITEMS !== 'undefined' ? ITEMS[id] : null;
      return `${d ? (d.icon || '') + d.name : id}${count > 1 ? '×' + count : ''}`;
    }).join('、') || '补给';
  },

  _showClue(text) {
    const now = performance.now();
    if (now - this._clueAt < 2200) return;
    this._clueAt = now;
    if (typeof Dialogue !== 'undefined') Dialogue.show(text, 1700);
  },

  _createRewardMarker(def) {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0xb88742, roughness: 0.55, metalness: 0.18, flatShading: true });
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.75, 0.9), mat);
    box.position.y = 0.42;
    g.add(box);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.18, 1.0), new THREE.MeshStandardMaterial({ color: 0x6b3f1f, roughness: 0.7 }));
    lid.position.y = 0.88;
    g.add(lid);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), new THREE.MeshBasicMaterial({ color: def.color || 0xffd66a, transparent: true, opacity: 0.55 }));
    glow.position.y = 1.35;
    g.add(glow);
    return g;
  },

  _createHarvestMarker(def) {
    const g = new THREE.Group();
    const color = def.kind === 'ore' ? 0x8fd7ff
      : def.kind === 'fish' ? 0x6ed8ff
      : def.kind === 'honey' ? 0xffd86a
      : def.kind === 'nest' ? 0xf0d0a0
      : 0x9fffb4;
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: def.kind === 'ore' ? 0.18 : 0.02, flatShading: true });
    const base = def.kind === 'ore'
      ? new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 0), mat)
      : new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.75, 6), mat);
    base.position.y = 0.38;
    g.add(base);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 8, 6),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.24, depthWrite: false })
    );
    glow.name = 'harvestGlow';
    glow.position.y = 0.9;
    g.add(glow);
    g.userData.kind = 'harvestNode';
    g.userData.perfCull = true;
    return g;
  },

  _createRumorMarker(def) {
    const g = new THREE.Group();
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 1.0, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x5a3b22, roughness: 0.8, flatShading: true })
    );
    post.position.y = 0.5;
    g.add(post);
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.42, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xb0844c, roughness: 0.72, flatShading: true })
    );
    board.position.y = 1.05;
    g.add(board);
    const mark = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0x9fd3ff, transparent: true, opacity: 0.78 })
    );
    mark.position.set(0, 1.36, 0);
    g.add(mark);
    g.userData.kind = 'rumorSign';
    g.userData.perfCull = true;
    return g;
  },

  _createKorokMarker() {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x7aa84f, roughness: 0.9, flatShading: true });
    for (let i = 0; i < 5; i++) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.7, 5), mat);
      leaf.position.set(Math.cos(i * 1.25) * 0.35, 0.45, Math.sin(i * 1.25) * 0.35);
      leaf.rotation.z = 0.6;
      g.add(leaf);
    }
    const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.45, 0.16, 7), new THREE.MeshStandardMaterial({ color: 0x8c8c7a, roughness: 0.9 }));
    stone.position.y = 0.08;
    g.add(stone);
    return g;
  },

  _createClimbMarker(spot) {
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0x9ee8ff, transparent: true, opacity: 0.55 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(Math.max(0.8, spot.radius * 0.18), 0.035, 6, 20), mat);
    ring.position.y = 0.08;
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    return g;
  },

  _createCampFlag() {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.2, 6), new THREE.MeshStandardMaterial({ color: 0x5a3522, roughness: 0.8 }));
    pole.position.y = 1.1;
    g.add(pole);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55), new THREE.MeshBasicMaterial({ color: 0xcc3322, side: THREE.DoubleSide }));
    flag.position.set(0.45, 1.75, 0);
    g.add(flag);
    return g;
  }
};
