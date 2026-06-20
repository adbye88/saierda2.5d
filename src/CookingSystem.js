/* ========================================================
   CookingSystem.js — 料理系统
   锅 = 烹饪点，玩家靠近按对话键打开烹饪界面
   配方规则（仿旷野之息）：
     - 主材料类型决定名字（肉/鱼/菇/果）
     - 特殊标签/元素决定 buff（生命/毅力/防寒/防热/防火/加速/攻防）
     - 多材料时效果叠加
   ======================================================== */

const CookingSystem = {
  pots: [],   // 当前地图的所有锅

  // 判断一组食材能否烹饪，返回结果 itemId 或 null
  cook(ingredientIds) {
    if (!ingredientIds || ingredientIds.length === 0) return null;
    const defs = ingredientIds.map(id => ITEMS[id]).filter(Boolean);
    if (defs.length === 0) return null;

    // 统计特性
    let hasMeat = false, hasFish = false, hasMushroom = false, hasFruit = false;
    let hasHearty = false, hasStamina = false;
    let coldEl = 0, heatEl = 0, fireEl = 0, shockEl = 0;
    let monsterPart = false;  // 怪物材料 → 药剂

    for (const d of defs) {
      if (d.subtype === 'raw') {
        if (d.name.includes('肉') || d.icon === '🥩') hasMeat = true;
        if (d.name.includes('鱼') || d.icon === '🐟') hasFish = true;
        if (d.name.includes('菇') || d.name.includes('蘑菇') || d.icon === '🍄') hasMushroom = true;
        if (d.name.includes('苹果') || d.name.includes('果') || d.icon === '🍎') hasFruit = true;
      }
      if (d.tag === 'hearty') hasHearty = true;
      if (d.tag === 'stamina') hasStamina = true;
      if (d.element === 'cold') coldEl++;
      if (d.element === 'heat') heatEl++;
      if (d.element === 'fire') fireEl++;
      if (d.element === 'shock') shockEl++;
      if (d.type === 'material' && (d.name.includes('内脏') || d.name.includes('角') || d.name.includes('牙') || d.name.includes('尾') || d.name.includes('眼球'))) monsterPart = true;
    }

    // 规则优先级：料理特性 > 元素 > 主材料
    if (hasHearty) return 'heartySkewer';
    if (hasStamina && monsterPart) return 'staminaElixir';
    if (hasStamina) return 'staminaSkewer';
    if (coldEl > 0) return 'spicyMeatSkewer';   // 防寒
    if (heatEl > 0) return 'chillMeatSkewer';   // 防热
    if (fireEl > 0) return 'flameproofDish';    // 防火
    if (shockEl > 0) return 'mightyElixir';     // 雷系→攻击药
    if (monsterPart) return 'toughElixir';      // 怪物材料→防御药
    if (hasMeat) return 'meatSkewer';
    if (hasFish) return 'seafoodSkewer';
    if (hasMushroom) return 'mushroomSkewer';
    if (hasFruit) return 'roastedApple';
    return 'mushroomSkewer';  // 兜底
  },

  describeResult(itemId) {
    const d = ITEMS[itemId];
    if (!d) return '';
    const region = {
      coldRes: '雪原/高山严寒',
      heatRes: '格鲁德沙漠酷热',
      fireRes: '死亡之山火山灼烧',
      staminaRegen: '攀爬与长距离滑翔',
      speed: '赶路、潜入、撤离',
      attack: '强敌与营地突袭',
      defense: 'Boss 战与守护者战斗'
    };
    const buffType = d.buff || (d.tag === 'stamina' ? 'staminaRegen' : null);
    const parts = [];
    if (d.heal) parts.push('回复 ' + d.heal + ' 点生命');
    if (d.tag === 'hearty') parts.push('生命系：额外回满生命');
    if (buffType) {
      const dur = d.buffDur || (d.tag === 'stamina' ? (d.subtype === 'cooked' ? 45 : 24) : 120);
      parts.push('效果：' + this.buffName(buffType) + '，约 ' + Math.round(dur / 60 * 10) / 10 + ' 分钟');
      if (region[buffType]) parts.push('用途：适合' + region[buffType]);
      parts.push('规则：同类料理会刷新持续时间，不同类效果可并存');
    }
    if (!parts.length) parts.push('普通料理：主要用于补给生命');
    return parts.join('；');
  },

  buffName(type) {
    return {
      coldRes: '防寒',
      heatRes: '防暑',
      fireRes: '耐火',
      staminaRegen: '体力持续恢复',
      speed: '移动加速',
      attack: '攻击提升',
      defense: '防御提升'
    }[type] || type;
  },

  // 检查玩家是否在某口锅附近
  getNearbyPot(player) {
    if (!window.game || !window.game.currentWorld) return null;
    for (const pot of (window.game.currentWorld.cookingPots || [])) {
      if (player.position.distanceTo(pot.position) < 2.5) return pot;
    }
    return null;
  }
};
