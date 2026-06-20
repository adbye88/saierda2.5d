/* ========================================================
   ArtAssets.js — generated bitmap art bridge
   Centralized paths + Three.js texture helpers for generated art.
   ======================================================== */

const ArtAssets = {
  itemBase: 'assets/icons/items/',
  materialBase: 'assets/art/materials/',
  effectBase: 'assets/art/effects/',
  billboardBase: 'assets/art/billboards/',
  cache: {},
  materialAliases: {
    'bark-rich': 'ai-polish-bark-rich',
    'mossy-stone': 'ai-polish-mossy-stone',
    'shrine-stone': 'ai-polish-shrine-stone',
    'guardian-plates': 'ai-polish-guardian-plates',
    'ancient-armor': 'ai-polish-ancient-armor',
    'cooking-pot-metal': 'ai-polish-cooking-pot-metal',
    'leaf-cluster': 'ai-polish-leaf-cluster',
    'bush-leaves': 'ai-polish-bush-leaves',
    'pine-needles': 'ai-polish-pine-needles',
    'carved-wood': 'ai-polish-carved-wood',
    'desert-fabric': 'ai-polish-desert-fabric',
    'warm-quilt': 'ai-polish-warm-quilt'
  },
  effectAliases: {
    'ancient-ring': 'ai-polish-ancient-ring',
    'dust-puff': 'ai-polish-dust-puff',
    'fire-burst': 'ai-polish-fire-burst',
    'heal-glow': 'ai-polish-heal-glow',
    'ice-burst': 'ai-polish-ice-burst',
    'lava-embers': 'ai-polish-lava-embers',
    'leaf-swirl': 'ai-polish-leaf-swirl',
    'malice-aura': 'ai-polish-malice-aura',
    'parry-flash': 'ai-polish-parry-flash',
    'pickup-beam': 'ai-polish-pickup-beam',
    'shock-burst': 'ai-polish-shock-burst',
    'slash-gold': 'ai-polish-slash-gold',
    'slash-white': 'ai-polish-slash-white',
    'star-sparkle': 'ai-polish-star-sparkle',
    'water-splash': 'ai-polish-water-splash',
    'wind-swirl': 'ai-polish-wind-swirl'
  },

  itemIconPath(itemId) {
    const version = (typeof window !== 'undefined' && window.__assetPass) ? ('?v=' + encodeURIComponent(window.__assetPass)) : '';
    return this.itemBase + itemId + '.png' + version;
  },

  itemIconHtml(itemId, className = 'item-icon') {
    const def = (typeof ITEMS !== 'undefined') ? ITEMS[itemId] : null;
    const icon = def && def.icon ? def.icon : '□';
    return `<span class="${className} icon-wrap"><img src="${this.itemIconPath(itemId)}" alt="" onerror="this.style.display='none';this.parentNode.textContent='${icon}'"></span>`;
  },

  materialTexture(name, repeat = 1, tint = null) {
    const resolvedName = this.materialAliases[name] || name;
    const key = 'mat_' + resolvedName + '_' + repeat + '_' + (tint || '');
    if (this.cache[key]) return this.cache[key];
    if (typeof THREE === 'undefined' || typeof Image === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (tint) {
      ctx.fillStyle = tint;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat, repeat);
    tex.encoding = THREE.sRGBEncoding;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      if (tint) {
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = tint;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
      }
      tex.needsUpdate = true;
    };
    img.src = this.materialBase + resolvedName + '.png';

    this.cache[key] = tex;
    return tex;
  },

  materialNormalTexture(name, repeat = 1) {
    const resolvedName = this.materialAliases[name] || name;
    if (!resolvedName.startsWith('ai-polish-')) return null;
    const key = 'normal_' + resolvedName + '_' + repeat;
    if (this.cache[key]) return this.cache[key];
    if (typeof THREE === 'undefined') return null;

    const tex = new THREE.TextureLoader().load(this.materialBase + resolvedName + '-normal.png');
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat, repeat);
    this.cache[key] = tex;
    return tex;
  },

  effectTexture(name) {
    const resolvedName = this.effectAliases[name] || name;
    const key = 'fx_' + resolvedName;
    if (this.cache[key]) return this.cache[key];
    if (typeof THREE === 'undefined') return null;
    const tex = new THREE.TextureLoader().load(this.effectBase + resolvedName + '.png');
    tex.encoding = THREE.sRGBEncoding;
    this.cache[key] = tex;
    return tex;
  },

  billboardTexture(name) {
    const key = 'billboard_' + name;
    if (this.cache[key]) return this.cache[key];
    if (typeof THREE === 'undefined') return null;
    const tex = new THREE.TextureLoader().load(this.billboardBase + name + '.png');
    tex.encoding = THREE.sRGBEncoding;
    this.cache[key] = tex;
    return tex;
  }
};
