/* ========================================================
   ModelPolishSystem.js — 模型与材质细腻度润色
   职责：统一材质质感、贴图采样、投影接触感
   ======================================================== */

const ModelPolishSystem = {
  _game: null,
  _worldName: '',
  _shadowTexture: null,
  _shadowMaterial: null,
  _outlineMaterial: null,
  _raycaster: new THREE.Raycaster(),
  _occluders: new Set(),
  _occlusionTimer: 0,
  _ownerTimer: 0,
  _landmarkTimer: 0,
  _tmpBox: new THREE.Box3(),
  _tmpSize: new THREE.Vector3(),

  init(game) {
    this._game = game;
    this.polishWorld(game && game.currentWorld);
  },

  polishWorld(world) {
    if (!world || !world.scene) return;
    this._worldName = world.name || '';
    world.scene.traverse(obj => {
      if (obj.isMesh) this._polishMesh(obj);
    });
    this._cacheLandmarks(world);
    world._modelPolished = true;
  },

  update(dt, game) {
    if (!this._game && game) this._game = game;
    const world = game && game.currentWorld;
    if (!world || !world.scene) return;
    if (world.name !== this._worldName || !world._modelPolished) {
      this.polishWorld(world);
    }
    const quality = this._quality();
    const lowCost = quality === 'low';
    this._ownerTimer -= dt;
    const updateOwners = this._ownerTimer <= 0;
    if (updateOwners) this._ownerTimer = lowCost ? 0.18 : 0.08;
    if (game.player && game.player.mesh) {
      this._polishOwnerOnce(game.player);
      if (updateOwners) this._updateContactShadow(game.player, world.scene, 0.82, lowCost ? 0.22 : 0.32);
      if (!lowCost) {
        this._ensureOwnerOutline(game.player, 0x101612, 0.18);
        this._setOwnerOutlineVisible(game.player, this._outlineEnabled());
      }
    }
    if (Array.isArray(world.enemies)) {
      for (const enemy of world.enemies) {
        if (!enemy || !enemy.mesh) continue;
        if (enemy._streamTier === 'dormant' || enemy.mesh.visible === false) {
          this._removeContactShadow(enemy);
          this._setOwnerOutlineVisible(enemy, false);
          continue;
        }
        if (enemy.dead || enemy.hp <= 0) {
          this._removeContactShadow(enemy);
          continue;
        }
        this._polishOwnerOnce(enemy);
        const fullVisual = enemy._streamTier === 'active' || enemy.boss || enemy.miniBoss || enemy.hurtTimer > 0;
        if (updateOwners && fullVisual) this._updateContactShadow(enemy, world.scene, enemy.boss ? 2.2 : 1.0, lowCost ? 0.18 : (enemy.boss ? 0.36 : 0.24));
        else if (!fullVisual) this._removeContactShadow(enemy);
        if (!lowCost && fullVisual) {
          this._ensureOwnerOutline(enemy, enemy.boss ? 0x2b1020 : 0x11140f, enemy.boss ? 0.2 : 0.14);
          this._setOwnerOutlineVisible(enemy, this._outlineEnabled());
        } else {
          this._setOwnerOutlineVisible(enemy, false);
        }
      }
    }
    this._landmarkTimer -= dt;
    if (this._landmarkTimer <= 0) {
      this._landmarkTimer = lowCost ? 0.12 : 0.04;
      this._updateLandmarks(dt, world);
    }
    this._occlusionTimer -= dt;
    if (!lowCost && this._occlusionTimer <= 0) {
      this._occlusionTimer = quality === 'medium' ? 0.3 : 0.16;
      this._updateCameraOcclusion(game, world);
    } else if (lowCost && this._occluders.size) {
      for (const obj of this._occluders) this._restoreOccluder(obj);
      this._occluders.clear();
    }
  },

  _polishOwnerOnce(owner) {
    if (!owner || !owner.mesh || owner._modelPolishMeshesReady) return;
    owner.mesh.traverse(obj => { if (obj.isMesh) this._polishMesh(obj); });
    owner._modelPolishMeshesReady = true;
  },

  _polishMesh(mesh) {
    if (!mesh || mesh.name === 'model-outline') return;
    mesh.castShadow = mesh.castShadow !== false;
    mesh.receiveShadow = mesh.receiveShadow !== false;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of materials) this._polishMaterial(mat, mesh);
  },

  _polishMaterial(mat, mesh) {
    if (!mat || mat.userData.modelPolished) return;
    mat.userData.modelPolished = true;
    const renderer = this._game && this._game.renderer;
    const maxAniso = renderer && renderer.capabilities && renderer.capabilities.getMaxAnisotropy
      ? renderer.capabilities.getMaxAnisotropy()
      : 4;

    if (mat.map) {
      mat.map.anisotropy = Math.min(8, maxAniso || 4);
      mat.map.needsUpdate = true;
    }
    if (mat.normalMap) mat.normalScale.set(0.45, 0.45);
    if ('envMapIntensity' in mat) {
      const metal = mat.metalness || 0;
      mat.envMapIntensity = metal > 0.45 ? 0.7 : 0.22;
    }

    const key = ((mesh.name || '') + ' ' + (mesh.parent && mesh.parent.name || '')).toLowerCase();
    if (mat.transparent || mat.opacity < 0.95) {
      mat.depthWrite = mat.opacity >= 0.55;
    }
    if (key.includes('water') || mat.opacity < 0.8) {
      mat.roughness = Math.min(mat.roughness ?? 0.4, 0.38);
      mat.metalness = Math.max(mat.metalness ?? 0, 0.08);
    } else if ((mat.metalness || 0) > 0.35) {
      mat.roughness = Math.min(mat.roughness ?? 0.35, 0.34);
    } else if (mat.map) {
      mat.roughness = Math.max(0.62, Math.min(mat.roughness ?? 0.82, 0.9));
    }
    mat.needsUpdate = true;
  },

  _updateContactShadow(owner, scene, radius, opacity) {
    const mesh = owner.mesh;
    if (!mesh || !scene) return;
    let shadow = owner._contactShadow;
    if (!shadow) {
      shadow = new THREE.Mesh(
        new THREE.CircleGeometry(1, 40),
        this._getShadowMaterial(opacity)
      );
      shadow.name = 'contact-shadow';
      shadow.rotation.x = -Math.PI / 2;
      shadow.renderOrder = 1;
      shadow.frustumCulled = false;
      owner._contactShadow = shadow;
    }
    if (shadow.parent !== scene) {
      if (shadow.parent) shadow.parent.remove(shadow);
      scene.add(shadow);
    }

    if (!owner._contactShadowScale) {
      this._tmpBox.setFromObject(mesh);
      this._tmpBox.getSize(this._tmpSize);
      owner._contactShadowScale = {
        x: Math.max(radius, Math.min(3.2, this._tmpSize.x * 0.68 || radius)),
        z: Math.max(radius * 0.58, Math.min(2.4, this._tmpSize.z * 0.58 || radius * 0.58))
      };
    }
    const sx = owner._contactShadowScale.x;
    const sz = owner._contactShadowScale.z;
    shadow.scale.set(sx, sz, 1);
    shadow.position.set(mesh.position.x, 0.045, mesh.position.z);
    shadow.material.opacity = opacity;
    shadow.visible = mesh.visible !== false;
  },

  _removeContactShadow(owner) {
    if (!owner || !owner._contactShadow) return;
    if (owner._contactShadow.parent) owner._contactShadow.parent.remove(owner._contactShadow);
    owner._contactShadow = null;
  },

  _getShadowMaterial(opacity) {
    if (!this._shadowMaterial) {
      this._shadowMaterial = new THREE.MeshBasicMaterial({
        map: this._getShadowTexture(),
        color: 0x000000,
        transparent: true,
        opacity,
        depthWrite: false
      });
    }
    return this._shadowMaterial.clone();
  },

  _getShadowTexture() {
    if (this._shadowTexture) return this._shadowTexture;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
    grad.addColorStop(0, 'rgba(0,0,0,.62)');
    grad.addColorStop(0.48, 'rgba(0,0,0,.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    this._shadowTexture = new THREE.CanvasTexture(canvas);
    this._shadowTexture.needsUpdate = true;
    return this._shadowTexture;
  },

  _ensureOwnerOutline(owner, color, opacity) {
    if (!owner || !owner.mesh || owner._outlineReady || !this._outlineEnabled()) return;
    const baseMat = this._getOutlineMaterial(color, opacity);
    owner.mesh.traverse(obj => {
      if (!obj || !obj.isMesh || obj.name === 'model-outline' || !obj.geometry) return;
      if (obj.material && obj.material.transparent && obj.material.opacity < 0.75) return;
      obj.geometry.computeBoundingSphere && obj.geometry.computeBoundingSphere();
      const r = obj.geometry.boundingSphere ? obj.geometry.boundingSphere.radius : 0.2;
      if (r < 0.055) return;
      if (obj.userData.outlineMesh) return;
      const outline = new THREE.Mesh(obj.geometry, baseMat.clone());
      outline.name = 'model-outline';
      outline.scale.setScalar(1.055);
      outline.renderOrder = -1;
      outline.frustumCulled = false;
      outline.castShadow = false;
      outline.receiveShadow = false;
      obj.add(outline);
      obj.userData.outlineMesh = outline;
    });
    owner._outlineReady = true;
  },

  _outlineEnabled() {
    const quality = (typeof VisualQualitySystem !== 'undefined' && VisualQualitySystem.level) || 'high';
    return quality === 'high' || quality === 'ultra';
  },

  _setOwnerOutlineVisible(owner, visible) {
    if (!owner || !owner.mesh || !owner._outlineReady) return;
    owner.mesh.traverse(obj => {
      if (obj && obj.userData && obj.userData.outlineMesh) {
        obj.userData.outlineMesh.visible = visible;
      }
    });
  },

  _getOutlineMaterial(color, opacity) {
    if (!this._outlineMaterial) {
      this._outlineMaterial = new THREE.MeshBasicMaterial({
        color,
        side: THREE.BackSide,
        transparent: true,
        opacity,
        depthWrite: false
      });
    }
    this._outlineMaterial.color.setHex(color);
    this._outlineMaterial.opacity = opacity;
    return this._outlineMaterial;
  },

  _updateLandmarks(dt, world) {
    if (!world || !world.scene) return;
    const list = world._modelPolishLandmarks || [];
    const stepDt = Math.max(dt, this._landmarkTimer || 0.016);
    for (const obj of list) {
      if (!obj || !obj.userData) continue;
      if (obj.userData.kind === 'shrine') {
        const p = obj.userData.parts || {};
        const t = performance.now() * 0.001;
        if (p.halo) p.halo.rotation.z += stepDt * 0.7;
        if (p.runeRing) p.runeRing.rotation.z -= stepDt * 0.35;
        if (p.beam && p.beam.material) p.beam.material.opacity = 0.18 + Math.sin(t * 2.2 + obj.position.x) * 0.045;
        if (p.baseGlow && p.baseGlow.material) p.baseGlow.material.opacity = 0.26 + Math.sin(t * 2.7 + obj.position.z) * 0.07;
        if (p.light) p.light.intensity += (1.45 + Math.sin(t * 2.4) * 0.18 - p.light.intensity) * 0.08;
      }
      if (obj.userData.kind === 'sheikahTower') {
        const p = obj.userData.parts || {};
        const t = performance.now() * 0.001;
        if (p.top) p.top.rotation.y += stepDt * 0.8;
        if (Array.isArray(p.rings)) {
          p.rings.forEach((ring, i) => { ring.rotation.z += stepDt * (0.35 + i * 0.08); });
        }
        if (Array.isArray(p.glyphs)) {
          p.glyphs.forEach((glyph, i) => {
            if (glyph.material) glyph.material.opacity = 0.48 + Math.sin(t * 2.5 + i) * 0.18;
          });
        }
        if (p.topLight) p.topLight.intensity = 1.75 + Math.sin(t * 2) * 0.35;
      }
    }
  },

  _cacheLandmarks(world) {
    if (!world || !world.scene) return;
    const list = [];
    world.scene.traverse(obj => {
      if (!obj || !obj.userData) return;
      if (obj.userData.kind === 'shrine' || obj.userData.kind === 'sheikahTower') list.push(obj);
    });
    world._modelPolishLandmarks = list;
  },

  _updateCameraOcclusion(game, world) {
    if (!game || !game.camera || !game.player || !game.player.mesh || !world || !world.scene) return;
    const target = game.player.position.clone().setY(1.15);
    const from = game.camera.position.clone();
    const dir = target.clone().sub(from);
    const dist = dir.length();
    if (dist < 2) return;
    dir.normalize();
    this._raycaster.set(from, dir);
    this._raycaster.near = 0.2;
    this._raycaster.far = Math.max(0.5, dist - 0.65);

    const targets = Array.isArray(world.colliders) && world.colliders.length ? world.colliders : world.scene.children;
    const hits = this._raycaster.intersectObjects(targets, true);
    const next = new Set();
    for (const hit of hits) {
      const obj = hit.object;
      if (!this._canFadeOccluder(obj, game, world)) continue;
      next.add(obj);
      if (next.size >= 8) break;
    }

    for (const obj of this._occluders) {
      if (!next.has(obj)) this._restoreOccluder(obj);
    }
    for (const obj of next) {
      this._fadeOccluder(obj);
    }
    this._occluders = next;
  },

  _canFadeOccluder(obj, game, world) {
    if (!obj || !obj.isMesh || obj.name === 'contact-shadow') return false;
    if (this._isDescendantOf(obj, game.player && game.player.mesh)) return false;
    if (Array.isArray(world.enemies)) {
      for (const enemy of world.enemies) {
        if (enemy && enemy.mesh && this._isDescendantOf(obj, enemy.mesh)) return false;
      }
    }
    if (Array.isArray(world.drops)) {
      for (const drop of world.drops) {
        if (drop && drop.mesh && this._isDescendantOf(obj, drop.mesh)) return false;
      }
    }
    this._tmpBox.setFromObject(obj);
    this._tmpBox.getSize(this._tmpSize);
    if (this._tmpSize.x > 18 && this._tmpSize.z > 18 && this._tmpSize.y < 2) return false;
    if (obj.position.y < -0.05) return false;
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    return materials.some(mat => mat && (!mat.transparent || mat.opacity > 0.5));
  },

  _fadeOccluder(obj) {
    if (!obj || !obj.material) return;
    if (!obj.userData.occlusionMaterials) {
      const originals = Array.isArray(obj.material) ? obj.material : [obj.material];
      const clones = originals.map(mat => {
        const clone = mat.clone();
        clone.userData.occlusionBase = {
          opacity: mat.opacity,
          transparent: mat.transparent,
          depthWrite: mat.depthWrite
        };
        return clone;
      });
      obj.userData.occlusionMaterials = clones;
      obj.material = Array.isArray(obj.material) ? clones : clones[0];
    }
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of materials) {
      mat.transparent = true;
      mat.opacity = Math.min(mat.opacity, 0.24);
      mat.depthWrite = false;
      mat.needsUpdate = true;
    }
  },

  _restoreOccluder(obj) {
    if (!obj || !obj.userData.occlusionMaterials) return;
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of materials) {
      const base = mat.userData.occlusionBase || {};
      mat.opacity = base.opacity ?? 1;
      mat.transparent = !!base.transparent;
      mat.depthWrite = base.depthWrite !== false;
      mat.needsUpdate = true;
    }
  },

  _isDescendantOf(obj, root) {
    if (!obj || !root) return false;
    let cur = obj;
    while (cur) {
      if (cur === root) return true;
      cur = cur.parent;
    }
    return false;
  },

  _quality() {
    return (typeof VisualQualitySystem !== 'undefined' && VisualQualitySystem.level) || 'high';
  }
};

if (typeof window !== 'undefined') window.ModelPolishSystem = ModelPolishSystem;
