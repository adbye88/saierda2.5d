# 🗡️ 旷野之息 · 迷你版 — 开发 Codex

> 本文档是游戏的完整开发参考手册，涵盖玩法设计、系统架构、开发注意事项，以及贴图新增指南。

---

## 一、游戏概述

**旷野之息 · 迷你版 (Wild Breath Mini)** 是一款致敬《塞尔达传说：旷野之息》的手机横屏 3D 网页游戏。

- **引擎**：Three.js r128 + WebGL
- **风格**：低多边形 (Low-Poly)，全部模型由代码生成，零美术资源依赖
- **平台**：手机横屏（虚拟摇杆+按钮）+ 桌面（键盘+鼠标）双支持
- **部署**：纯静态文件，Docker / nginx 一键部署，30MB 镜像
- **无后端**：存档用 localStorage

---

## 二、操作方式

| 操作 | 手机 | 桌面 |
|---|---|---|
| 移动 | 左下虚拟摇杆 | WASD / 方向键 |
| 攻击 | ⚔️ 按钮 | 鼠标左键 / J |
| 跳跃 | 🦘 按钮 | 空格 |
| 锁定敌人 | 🎯 按钮 | Q |
| 防御格挡 | 🛡️ 按钮（按住） | Shift |
| 背包 | 🎒 按钮 | Tab |
| 地图 | 🗺️ 按钮 | M |
| 对话/拾取/烹饪 | 💬 按钮（靠近时出现） | E |
| 全屏 | ⛶ 按钮 | — |

### 输入系统说明

- **Input.js** 是统一输入管理器，对外暴露 `Input.state`（move/attack/jump/shield/lock/interact/inventory）
- 边沿触发信号（`justAttack`、`justJump`、`justShield`、`justInteract`、`justLock`）每帧末尾由 `Input.endFrame()` 清除
- **手机端**：虚拟摇杆通过 `Input.setJoystick(x, y)` 设置，按钮通过 `Input.pressAttack()` 等函数设置
- **桌面端**：键盘 WASD/方向键映射到移动，空格=跳跃，J/鼠标左=攻击，Shift=盾，Q=锁定，E=交互，Tab=背包，M=地图
- **备份输入源**：`window.__btnState` 在 HTML 中最早定义，作为按钮事件的实时状态缓存，`Player._handleAttack()` 中会同时读取 `Input.state` 和 `window.__btnState` 确保不丢失输入

---

## 三、游戏世界与地图

### 3.1 地图总览（7 张地图）

| 地图ID | 中文名 | 特色 | 地形贴图 | 边界 |
|---|---|---|---|---|
| `grassland` | 起始台地·草原 | 教学区，老爷爷NPC，4座神庙 | `grass` | ±100 |
| `forest` | 迷失森林 | 密林，强力怪物 | `grass` | ±80 |
| `dungeon` | 地下水牢 | 骷髅/守护者，Boss岩石巨像 | `stoneBrick` | ±60 |
| `snowland` | 雪山·利特村 | 冰天雪地，防寒需求 | `snow` | ±100 |
| `volcano` | 死火山·戈隆村 | 熔岩地带，防火需求 | `lava` | ±100 |
| `desert` | 格鲁德沙漠 | 沙漠荒原，防热需求 | `sand` | ±100 |
| `castle` | 海拉鲁城堡 | 最终决战，灾厄盖侬 | `stoneBrick` | ±120 |

### 3.2 地图架构

所有地图继承自 `BaseScene`（`src/World/BaseScene.js`），子类只需：

```javascript
class MyMap extends BaseScene {
  constructor() {
    super('mapId');
    this.bounds = { minX: -100, maxX: 100, minZ: -100, maxZ: 100 };
    this.spawnPoint = { x: 0, z: 20, a: 0 };
  }
  build() {
    this._setupGround(0x6a9a4a, 'grass');  // 地形
    // 敌人、NPC、宝箱、传送门等
  }
}
```

`BaseScene` 自动处理：
- 光照（半球光 + 太阳方向光 + 补光，太阳跟随玩家）
- 天空盒（渐变Shader + 白色云朵）
- 地面（带起伏的低多边形 + 程序化贴图）
- 每帧更新：敌人、掉落物、抛射物、触发器、传送门

### 3.3 地图切换（传送门）

在 `build()` 中设置传送门：
```javascript
const gate = AssetFactory.createDungeonGate();
gate.position.set(x, 0, z);
gate.userData.target = '目标地图ID';     // Game.loadWorld 的参数
gate.userData.targetName = '显示名称';   // 传送时 Dialogue.show 的文字
this.addProp(gate);
this.gates.push(gate);
```

玩家靠近传送门（距离 < 2.5）自动触发，播放传送光环特效后 700ms 执行 `game.loadWorld(target)`。

### 3.4 地图对象管理

- `colliders[]` — 有碰撞的物体（树/石/房子），圆形碰撞检测
- `breakables[]` — 可击碎物体（罐子/箱子），挥剑可打碎
- `enemies[]` — 当前地图的敌人实例
- `drops[]` — 地面掉落物，靠近 1.4 自动拾取
- `projectiles[]` — 飞行中的箭矢/弹幕
- `npcs[]` — NPC 列表（`{mesh}` 包装）
- `gates[]` — 传送门
- `cookingPots[]` — 烹饪锅
- `shrines[]` — 神庙实例
- `scatter(factory, count, margin)` — 随机撒道具，自动避开出生点

### 3.5 环境伤害系统

特殊地图有环境伤害，通过 `BaseScene.update()` 中的计时器实现：
- **雪山**：每 4 秒掉血 1 点，装备防寒套装（`warmDoublet` + `snowQuillTrousers`）可免疫
- **火山**：每 3 秒掉血 1.5 点 + 灼烧效果，装备防火套装（`flamebreakerArmor` + `flamebreakerBoots`）可免疫
- **沙漠**：每 3.5 秒掉血 1 点，装备防热套装（`desertVoeTrousers`）可免疫
- 抗性通过 `Inventory.getResist()` 检查装备的 `resist` 属性

---

## 四、玩家系统

### 4.1 基本属性

| 属性 | 初始值 | 说明 |
|---|---|---|
| `maxHp` | 9颗心 (=36血) | 每颗心=4格血量 |
| `hp` | 36 | 当前血量 |
| `maxStamina` | 100 | 体力上限 |
| `stamina` | 100 | 当前体力（暂未实现冲刺消耗） |
| `speed` | 6.0 | 移动速度 |
| `gravity` | -28 | 重力加速度 |
| 跳跃初速 | 11 | 按跳跃时的 vy |

### 4.2 移动与碰撞

- **移动方向**：摇杆方向直接映射到世界坐标（不依赖相机方向）
  - 摇杆右(mx>0) → 世界 +X
  - 摇杆下(my>0) → 世界 +Z（朝镜头方向）
  - 摇杆上(my<0) → 世界 -Z（向场景深处）
- **碰撞**：圆形碰撞（玩家半径 0.5），与 `world.colliders` 中的物体做推开处理
- **边界**：玩家位置被夹紧到 `world.bounds` 范围内
- **击退**：`player.knockback` 向量，每帧衰减 0.85

### 4.3 攻击系统

**近战攻击流程：**
1. 触发：`Input.justAttack` → 开始挥剑
2. 动画：0.35 秒，右臂做弧线劈砍（rotation.z 从抬起到落下）
3. 伤害判定：挥到中段（30%~70%）时判定一次，快照出招瞬间的朝向
4. 射程：普通武器 2.8，长枪 3.4，空手 2.0
5. 贴脸保护：距离 < 0.8 时无视朝向直接命中

**远程攻击（弓箭）：**
1. 当装备弓且无近战武器时，攻击=射箭
2. 箭种由弓的类型或当前手持武器元素决定（火/冰/雷/古代/穿透）
3. 抛物线物理（重力 -9 dt），速度 28（古代弓 38）
4. 锁定敌人时箭矢自动追踪目标方向
5. 元素箭带有发光球体尾迹

**武器耐久：**
- 每次攻击消耗 1 点耐久
- 大师之剑和海利亚盾耐久=999（永不损坏）
- 耐久耗尽武器消失，Dialogue 提示

### 4.4 防御系统

| 类型 | 触发条件 | 效果 |
|---|---|---|
| **完美格挡** | 按下盾牌 0.25 秒内被攻击 + 面向攻击者 | 完全免伤 + 金色火花特效 + 敌人硬直 0.8s |
| **普通格挡** | 持续按住盾牌 + 面向攻击者 | 伤害 = max(0, 原伤害 - 盾防御力)，消耗盾耐久 |
| **完美闪避（林克时间）** | 移动中 + 闪避窗口期内被命中 | 1 秒无敌 + 蓝色残影特效 |

格挡方向判定：玩家面朝方向与攻击方向的反向点积 > 0.1（完美）或 > 0.3（普通）

### 4.5 元素状态效果

| 效果 | 持续时间 | 表现 |
|---|---|---|
| 灼烧 (`_burnTimer`) | 3 秒 | 每 0.5 秒掉 0.25 血 + 身体发红光 |
| 冰冻减速 (`_slowTimer`) | 2.5 秒 | 移动速度减半 |
| 雷击麻痹 (`_stunTimer`) | 1 秒 | 无法移动/攻击 |

### 4.6 受击无敌

被击中后 `invuln = 0.8` 秒无敌，期间模型闪烁（每 12 帧切换显隐）。死亡时 `hp=0`，触发 Game Over。

### 4.7 相机系统

- 第三人称俯视斜角，FOV 58°
- 默认距离 11（可通过双指缩放调整，范围 6~22）
- 锁定敌人时：相机移到玩家与敌人连线的中后方
- 使用 `lerp(0.12)` 平滑跟随

---

## 五、敌人系统

### 5.1 敌人一览

**普通小怪：**

| ID | 名称 | HP | ATK | 速度 | AI类型 | 特点 |
|---|---|---|---|---|---|---|
| `redBokoblin` | 红色波克布林 | 8 | 3 | 2.5 | melee | 最基础敌人 |
| `blueBokoblin` | 蓝色波克布林 | 16 | 5 | 3.0 | melee | 掉士兵之剑 |
| `blackBokoblin` | 黑色波克布林 | 30 | 8 | 3.5 | melee | 持武器，更强 |
| `silverBokoblin` | 白银波克布林 | 60 | 14 | 4.0 | melee | 稀有精英怪 |
| `octorok` | 八爪章鱼怪 | 6 | 3 | 1.5 | ranged | 远程吐弹 |
| `chuchu` | 丘丘 | 10 | 2 | 1.8 | melee | 弹跳攻击 |
| `fireChuchu` | 火丘丘 | 14 | 5 | 2.0 | melee | 附带灼烧 |
| `iceChuchu` | 冰丘丘 | 14 | 5 | 2.0 | melee | 附带冰冻 |
| `shockChuchu` | 雷丘丘 | 14 | 6 | 2.2 | melee | 附带麻痹 |
| `redLizalfos` | 红色蜥蜴战士 | 40 | 10 | 4.0 | melee | 元素吐息（火） |
| `blueLizalfos` | 蓝色蜥蜴战士 | 60 | 14 | 4.2 | melee | 元素吐息（冰） |
| `yellowLizalfos` | 黄色蜥蜴战士 | 80 | 18 | 4.5 | melee | 元素吐息（雷） |
| `moblin` | 莫力布林 | 80 | 12 | 2.2 | melee | 大型，长枪突刺 |
| `stal` | 骷髅兵 | 20 | 6 | 2.8 | melee | 骨质外观 |
| `guardian` | 守护者 | 150 | 18 | 1.8 | ranged | 蓄力激光（有预警线） |
| `lynel` | 莱尼尔 | 300 | 30 | 4.0 | melee | 半人马，冲撞大击退 |

**Boss：**

| ID | 名称 | HP | ATK | 元素 | 掉落 |
|---|---|---|---|---|---|
| `stoneTalus` | 岩石巨像 | 200 | 18 | — | 大师之剑！ |
| `ignoTalus` | 熔岩巨像 | 300 | 25 | 火 | 耐火上衣/火焰之剑 |
| `frostTalus` | 冰霜巨像 | 280 | 22 | 冰 | 防寒上衣/冰雪之剑 |
| `molduga` | 魔吉拉德 | 350 | 28 | — | 格鲁德防热裤/王族之剑 |
| `calamityGanon` | 灾厄盖侬 | 600 | 35 | — | 星星碎片×3/古代核心×5 |

### 5.2 敌人 AI 状态机

```
patrol（巡逻）→ 发现玩家进入 sight → chase（追击）
                                            ↓ 距离够近
                                         attack（攻击）
                                            ↓ 攻击结束 / 失去视野
                                         patrol（巡逻）
```

**攻击前摇系统（三阶段）：**
1. **windup（蓄力）**：举武器/后仰，蓄力期间站在原地不动
   - 蓄力时长因敌人而异：守护者 0.9s，莱尼尔 0.8s，莫力布林 0.7s，普通 0.55s
   - 守护者蓄力时显示红色预警激光线（从眼到玩家，闪烁）
2. **strike（出招）**：瞬间释放伤害
3. **recover（收招）**：0.4 秒站在原地（有破绽窗口，玩家可反击）

### 5.3 元素克制

- 火 → 冰：伤害 ×2
- 冰 → 火：伤害 ×2
- 雷 → 任意：伤害 ×1.5
- 元素武器攻击元素怪物时，还会给怪物附加元素状态效果

### 5.4 敌人掉落

每个敌人有 `drops()` 函数，返回 `[[itemId, count], ...]` 数组。使用 `weightedDrop` 按概率掉落。击败敌人后掉落物在敌人位置附近随机散落，带光柱标记。

---

## 六、物品系统

### 6.1 物品分类

| 类型 | 背包页签 | 堆叠 | 装备 | 说明 |
|---|---|---|---|---|
| weapon | ⚔️ 武器 | ✗ | 武器槽 | 单手剑/长枪，有耐久 |
| shield | 🛡️ 盾 | ✗ | 盾槽 | 有耐久和防御力 |
| bow | 🏹 弓 | ✗ | 弓槽 | 有耐久和攻击力 |
| armor_upper | 👕 上衣 | ✗ | 上衣槽 | 提供 defense + 元素抗性 |
| armor_lower | 👖 裤子 | ✗ | 裤子槽 | 提供 defense + 元素抗性 |
| food | 🍎 食物 | ✓ (max 99) | — | 回血 + buff |
| material | ✨ 材料 | ✓ (max 99) | — | 卢比/箭矢/怪物素材/矿石 |
| key | 🔑 重要 | 部分 | — | 任务道具 |

### 6.2 武器数值体系（贴合原作）

**单手剑：** 旅人(5) → 士兵(14) → 骑士(26) → 王族(36) → 大师(60, 永不坏)
**元素剑：** 火焰/冰雪/雷电(28/28/32)，附带对应元素效果
**古代剑：** 40 ATK，对守护者伤害加成
**长枪：** 波克骨枪(8) → 士兵(12) → 骑士斧枪(22) → 王族斧枪(30)
**弓：** 旅人(4) → 士兵(10) → 骑士(15) → 王族(25) → 古代(30)
**元素弓：** 火焰/冰雪/雷电弓，箭矢自带元素
**盾：** 木(2def) → 士兵(5def) → 骑士(8def) → 海利亚(20def, 永不坏)

### 6.3 食物与料理

**食材：** 苹果/蘑菇/生肉/鸟蛋/鲈鱼/暖暖草果/向阳蘑菇/酥麻水果 等
**特殊标签食材：**
- `hearty` 标签（生命苹果）→ 料理回满血
- `stamina` 标签（毅力蘑菇/蜂巢）→ 料理回满体力
- 元素标签（暖暖草果=cold, 向阳蘑菇=heat, 酥麻水果=shock）→ 对应抗性料理

**料理配方判定优先级：**
1. hearty（生命系）→ 生命串烧（回满血）
2. stamina（毅力系）→ 毅力串烧（回体力）
3. cold 元素 → 暖暖肉串（防寒 5 分钟）
4. heat 元素 → 沁凉肉串（防热 5 分钟）
5. fire 元素 → 防火料理（耐火 5 分钟）
6. shock 元素 → 攻击药（攻击力↑ 3 分钟）
7. 怪物材料 → 防御药（防御力↑ 3 分钟）
8. 主材料类型：肉→肉串 / 鱼→海鲜 / 菇→蘑菇串 / 果→烤苹果

**Buff 系统：** 食用后 `Inventory.buffs[type] = time`，每帧倒计时，归零自动移除。

---

## 七、NPC 与交互系统

### 7.1 NPC 类型

| NPC | 创建函数 | 交互 | 出现地图 |
|---|---|---|---|
| 海拉鲁国王（老爷爷） | `AssetFactory.createOldMan()` | 多段剧情对话 | 草原 |
| 商人 | `AssetFactory.createMerchant()` | 打开商店UI | 各区域村庄 |
| 远古塔 | `AssetFactory.createSheikahTower()` | 激活解锁传送 | 各地图 |
| 女神像 | `AssetFactory.createGoddessStatue()` | 克服之玉换心/精力容器 | 各区域 |
| 烹饪锅 | `AssetFactory.createCookingPot()` | 打开烹饪UI | 各地图 |

### 7.2 NPC 交互注册

在 `build()` 中设置 NPC：
```javascript
const npc = AssetFactory.createOldMan();
npc.position.set(x, 0, z);
npc.userData.npc = true;
npc.userData.name = 'NPC名称';
npc.userData.onTalk = (game) => {
  Dialogue.show('对话内容');
  // 可触发任务、开店等
};
this.scene.add(npc);
this.npcs.push({ mesh: npc });
```

靠近 NPC（< 2.5 距离）显示交互提示，按 E/💬 触发 `onTalk`。

---

## 八、商店系统

### 8.1 商店定义（`SHOP_DEFS`）

每个商店定义包含：名称、NPC肤色、位置、出售物品列表（`{id, price}`）。
注册：`ShopSystem.spawnInWorld(world, 'shopDefId')` 在地图中创建商人 NPC。
购买：`ShopUI.open(def)` 打开商店界面，卢比扣减后物品加入背包。

### 8.2 现有商店

- `grasslandShop` — 海利亚商人（基础装备/食材）
- `kakarikoShop` — 卡卡利科商人（中级装备）
- `ritoShop` — 利特村商人（雪地装备/冰弓）
- `goronShop` — 戈隆村商人（防火装备/火焰弓）
- `gerudoShop` — 格鲁德商人（防热装备/雷电弓）
- `ancientShop` — 古代商人（古代兵装全套，最贵）

---

## 九、神庙系统

### 9.1 神庙试炼

- 每座神庙 = 一场答题挑战（`QuizData.js` 中的塞尔达知识题库）
- 通过 `ShrineUI.open(shrine, game)` 进入，显示题目和选项
- 答对所有题目通关，获得 **克服之玉**
- 通关后拱门变蓝（视觉标志）
- 进度存入 `SaveSystem`

### 9.2 现有神庙

| ID | 名称 | 区域 | 波次（敌人） |
|---|---|---|---|
| `shrineJaBaij` | 加·巴伊夫神庙 | 草原 | 2×红波克布林 |
| `shrineOwaDaim` | 欧瓦·达伊姆神庙 | 草原 | 2×红波克 + 2×丘丘 |
| `shrineKehNamut` | 科赫·纳姆特神庙 | 草原 | 3×丘丘 |
| `shrineOmanAu` | 欧曼·奥神庙 | 草原 | 3×红波克 + 1×章鱼 |
| `shrineSnow` | 利·塔扎尼神庙 | 雪山 | 3×冰丘丘 + 1×蓝蜥蜴 |
| `shrineVolcano` | 达·卡索神庙 | 火山 | 3×火丘丘 + 2×红蜥蜴 |
| `shrineDesert` | 克·欧希尼奥神庙 | 沙漠 | 2×黄蜥蜴 + 1×莫力布林 |

---

## 十、主线任务流程

完全复刻旷野之息主线，共 7 个阶段：

```
第0章: 在初始台地苏醒    → 与老爷爷对话
第1章: 远古塔的觉醒      → 激活草原远古塔
第1章: 挑战四座神庙      → 完成4座草原神庙
第1章: 获得滑翔伞        → 完成4神庙后老爷爷赠送
第2章: 前往卡卡利科村    → 与英帕对话了解神兽
第2章: 解放四大神兽      → 水火风雷四区域攻略
第3章: 最终决战          → 海拉鲁城堡击败灾厄盖侬
```

任务系统由 `QuestSystem.js` 管理，每个任务有 `complete(g)` 判定函数，自动推进。

---

## 十一、存档系统

- **存储方式**：`localStorage`
- **槽位**：3 个存档位 + 1 个全局进度
- **存档内容**：时间戳、世界名、玩家位置/朝向/血量/体力、背包序列化
- **全局进度**：已解锁塔列表、已击败Boss列表、任务进度（ talkedOldMan/shrinesCleared/gotGlider/metImpa/divineBeasts/champions）
- **自动存档时机**：切换地图、击败Boss
- **序列化**：`Inventory.serialize()` / `Inventory.deserialize()` 处理背包和装备

---

## 十二、特效系统（Effects.js）

所有特效由 Three.js 几何体 + 透明材质实现，零外部资源：

| 特效 | 函数 | 用途 |
|---|---|---|
| 挥砍弧光 | `slashArc(pos, facing, color)` | 近战攻击弧线 |
| 命中爆裂 | `hitBurst(pos, color, count)` | 攻击命中粒子 |
| 死亡消散 | `deathPuff(pos, color)` | 敌人死亡粒子 |
| 拾取闪光 | `pickupFlash(pos)` | 拾取物品光环 |
| 传送光环 | `portalEffect(pos)` | 地图切换特效 |
| 完美格挡 | `parrySpark(pos)` | 金色火花 + 碎片飞溅 |
| 完美闪避 | `dodgeAfterimage(pos)` | 蓝色光环 + 粒子上飘 |
| 元素光环 | `elementalAura(pos, color)` | 着火/冰冻/麻痹状态 |
| 蓄力预警 | `enemyWindup(pos, element)` | 敌人蓄力地面圈 |

武器类型影响特效颜色：
- 大师之剑：金色弧光 + 白色二次弧光 + 金色爆发粒子
- 火焰武器：橙红色
- 冰雪武器：冰蓝色
- 雷电武器：黄色
- 古代武器：青绿色

---

## 十三、HUD 系统

### 13.1 HUD 元素

- **左上**：心心（红色，每颗=4格血）+ 体力条
- **右上**：卢比💎数量 + 当前武器名 + 小地图
- **顶部**：任务提示（章节+名称）
- **Boss**：血条（名称+红色血条），仅 Boss 出现时显示
- **Buff 栏**：活跃 buff 指示器
- **受击反馈**：红色屏晕 + 屏幕震动

### 13.2 UI 组件

| 文件 | 功能 |
|---|---|
| `HUD.js` | 主 HUD：心心/体力/卢比/武器/小地图/Boss血条/任务提示 |
| `Joystick.js` | 左下虚拟摇杆（固定位置，touch-only） |
| `ActionButtons.js` | 右下动作按键组（攻击/跳跃/盾/锁定） |
| `InventoryUI.js` | 背包界面（分页/装备/使用/丢弃） |
| `Dialogue.js` | 对话气泡 + 浮动文字（伤害数字、状态提示） |
| `CookingUI.js` | 烹饪界面（选食材→烹饪→结果） |
| `ShopUI.js` | 商店界面（商品列表/购买/卖出） |
| `ShrineUI.js` | 神庙答题界面 |
| `StatueUI.js` | 女神像界面（克服之玉→心/精力容器） |
| `MapMenu.js` | 地图菜单（世界地图/传送/存档/读档） |

---

## 十四、项目文件结构

```
├── index.html              # HTML入口 + 动态脚本加载器 + 按钮/菜单UI
├── Dockerfile              # Docker镜像定义
├── docker-compose.yml      # Docker Compose
├── nginx.conf              # Nginx配置
├── css/style.css           # 全部样式（HUD/摇杆/按钮/背包/菜单）
├── libs/three.min.js       # Three.js r128引擎
├── src/
│   ├── main.js             # 入口：boot()初始化 + 菜单按钮绑定
│   ├── Item.js             # 物品数据定义（ITEMS字典 + 料理配方）
│   ├── Player.js           # 玩家：移动/跳跃/攻击/防御/受伤/相机
│   ├── Enemy.js            # 敌人系统：ENEMY_DEFS + Enemy类 + DropItem
│   ├── Inventory.js        # 背包数据：分页/装备/buff/耐久/序列化
│   ├── Effects.js          # 战斗特效系统
│   ├── Textures.js         # ★ 程序化贴图生成器（Canvas绘制）
│   ├── CookingSystem.js    # 料理系统
│   ├── ShopSystem.js       # 商店系统
│   ├── QuestSystem.js      # 主线任务系统
│   ├── QuizData.js         # 神庙答题题库
│   ├── Shrine.js           # 神庙定义与管理
│   ├── SaveSystem.js       # 存档/读档
│   ├── Debug.js            # 调试工具
│   ├── TouchControls.js    # 触屏控制
│   ├── TouchRouter.js      # 触屏事件路由
│   ├── core/
│   │   ├── Game.js         # 游戏主引擎（渲染器/主循环/状态机）
│   │   ├── Input.js        # 统一输入管理
│   │   └── AssetFactory.js # ★ 模型工厂（全部Low-Poly模型）
│   ├── World/
│   │   ├── BaseScene.js    # 地图基类
│   │   ├── Grassland.js    # 草原
│   │   ├── Forest.js       # 森林
│   │   ├── Dungeon.js      # 地牢
│   │   ├── Snowland.js     # 雪山
│   │   ├── Volcano.js      # 火山
│   │   ├── Desert.js       # 沙漠
│   │   └── HyruleCastle.js # 海拉鲁城堡
│   └── ui/
│       ├── Joystick.js     # 虚拟摇杆
│       ├── ActionButtons.js # 动作按钮
│       ├── HUD.js          # HUD
│       ├── InventoryUI.js  # 背包UI
│       ├── Dialogue.js     # 对话系统
│       ├── CookingUI.js    # 烹饪UI
│       ├── ShopUI.js       # 商店UI
│       ├── ShrineUI.js     # 神庙UI
│       ├── StatueUI.js     # 女神像UI
│       └── MapMenu.js      # 地图菜单
```

---

## 十五、开发注意事项

### 15.1 性能要点

1. **PointLight 限制**：每个 PointLight 开启 `physicallyCorrectLights` 后开销巨大。火山地图大量熔岩石不用 PointLight，改用 `emissive` 自发光材质
2. **像素比**：`renderer.setPixelRatio(Math.min(devicePixelRatio, 2))` 限制高 DPI 屏
3. **帧间隔**：`Math.min(dt, 0.05)` 防卡顿大跳
4. **阴影**：太阳跟随玩家，2048×2048 阴影贴图覆盖 ±35 范围，保持精度
5. **贴图缓存**：`Textures.cache` 对象避免重复生成 Canvas 贴图
6. **几何体段数**：地面分段自适应地图大小（每格约 2.5 单位），上限 96

### 15.2 错误隔离

- `Game._updateInner()` 用 try/catch 包裹，子系统独立 try/catch 隔离
- 错误显示在屏幕左下角（`runtime-error` div），带来源标注
- 任何逻辑错误不会让游戏完全卡死

### 15.3 脚本加载

- `index.html` 中的 `__startLoading()` 按依赖顺序链式加载所有脚本
- 加载失败自动重试 3 次
- 全部完成后启用开始按钮，有超时兜底（2s + 10s）
- `main.js` boot 完成后调用 `window.__bindMenuButtons()` 绑定按钮事件

### 15.4 添加新内容的通用流程

**新增敌人：**
1. 在 `ENEMY_DEFS`（Enemy.js）中添加定义
2. 在 `AssetFactory` 中添加模型创建函数
3. 在地图的 `build()` 中实例化

**新增武器/物品：**
1. 在 `ITEMS`（Item.js）中添加物品定义
2. 在 `AssetFactory.createWeaponMesh()` 的 switch 中添加模型
3. 可选：在 `ShopSystem.SHOP_DEFS` 中添加出售

**新增地图：**
1. 创建 `src/World/NewMap.js`，继承 BaseScene
2. 在 `main.js` 的 `boot()` 中 `registerWorld` 和 `loadWorld`
3. 在 `index.html` 的 `scripts` 数组中添加加载顺序

**新增 NPC：**
1. 在 `AssetFactory` 中创建模型（可选复用 createOldMan/createMerchant）
2. 在地图 `build()` 中设置位置和 `onTalk` 回调
3. push 到 `this.npcs`

---

## 十六、贴图系统与新增贴图指南

### 16.1 当前贴图系统架构

游戏使用 **程序化贴图**（Procedural Textures），全部由 Canvas 2D 动态绘制，零外部图片依赖。核心代码在 `src/Textures.js`。

**工作原理：**
1. `_canvas(size)` — 创建指定尺寸的 Canvas 元素
2. 用 Canvas 2D API（`ctx.fillRect`、`ctx.arc`、`ctx.strokeStyle` 等）绘制纹理图案
3. `toTexture(canvas, repeat)` — 将 Canvas 转为 Three.js `CanvasTexture`，设置 RepeatWrapping
4. 通过 `cache` 对象缓存结果，避免重复绘制

**现有贴图类型：**

| 函数 | 用途 | 特点 |
|---|---|---|
| `Textures.grass()` | 草原地面 | 渐变底色 + 绿色噪点 + 细长草叶 + 小花 |
| `Textures.snow()` | 雪地地面 | 白色渐变 + 雪粒噪点 + 冰晶 |
| `Textures.sand()` | 沙漠地面 | 黄色渐变 + 沙粒 + 波纹线条 |
| `Textures.rock(color)` | 岩石/火山地面 | 自定义底色 + 岩石斑点 + 裂纹线 |
| `Textures.bark(color)` | 树干 | 竖纹 + 横向裂纹 |
| `Textures.metal(color)` | 武器/金属 | 拉丝金属光泽 |
| `Textures.wood(color)` | 木盾/弓 | 木纹曲线 |
| `Textures.cloth(color)` | 防具布料 | 编织纹路 |
| `Textures.stoneBrick()` | 地牢/城堡地面 | 砖块 + 苔藓 |

### 16.2 如何新增程序化贴图

在 `src/Textures.js` 中添加新方法，遵循以下模式：

```javascript
// 步骤1：定义贴图函数
Textures.myNewTexture = function(customParam = '默认值', size = 256) {
  // 步骤2：缓存检查（避免重复绘制）
  const key = 'myNewTex_' + customParam;
  if (this.cache[key]) return this.cache[key];

  // 步骤3：创建 Canvas
  const { c, ctx } = this._canvas(size);

  // 步骤4：绘制底色
  ctx.fillStyle = '#基色';
  ctx.fillRect(0, 0, size, size);

  // 步骤5：绘制纹理细节
  // 示例：随机噪点
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // 步骤6：线条/图案（可选）
  ctx.strokeStyle = 'rgba(r, g, b, 透明度)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  // 绘制路径...
  ctx.stroke();

  // 步骤7：缓存并返回
  this.cache[key] = this.toTexture(c, 重复次数);
  return this.cache[key];
};
```

**关键注意事项：**
- **务必做缓存**：程序化绘制耗性能，同一参数的贴图只应生成一次
- **缓存 key 要唯一**：如果贴图接受参数（如颜色），key 必须包含参数值
- **`toTexture` 的 repeat 参数**：控制贴图在地面上的重复次数，大地图需要更多重复（如 12~20），小物体用 1~4
- **Canvas 尺寸**：通常 256×256，金属/木材等小纹理可用 128×128
- **颜色格式**：使用 `rgb(r,g,b)` 或 `rgba(r,g,b,a)` 或 `#hex` 格式

### 16.3 如何将贴图应用到模型

**方式一：地面贴图（在 BaseScene._setupGround 中使用）**

```javascript
// 在 BaseScene 子类的 build() 中调用
this._setupGround(底色, '贴图类型');
// '贴图类型' 对应：'grass'/'snow'/'sand'/'rock'/'stoneBrick'/'lava'
```

**方式二：给已有模型添加贴图材质（在 AssetFactory 中使用）**

```javascript
// 获取程序化贴图
const myTex = Textures.myNewTexture('#颜色');

// 创建使用贴图的材质
const mat = new THREE.MeshStandardMaterial({
  color: 0xffffff,      // 白色底色，让贴图颜色显示
  map: myTex,           // ★ 贴图
  roughness: 0.9,
  metalness: 0,
  flatShading: true     // 低多边形风格
});

// 将材质应用到网格
const mesh = new THREE.Mesh(geometry, mat);
```

**方式三：修改已有模型的贴图**

当前项目已有范例：
- **树干**（AssetFactory.createTree）：`Textures.bark('#6b4a25')` 应用到 CylinderGeometry
- **石头**（AssetFactory.createRock）：`Textures.rock('#8a8a92')` 应用到 DodecahedronGeometry
- **武器**（AssetFactory.createWeaponMesh）：`Textures.metal('#c8d0d8')` + `Textures.wood('#5a3a1a')` 应用到剑刃/剑柄

### 16.4 如何使用外部图片贴图

如果想要用实际图片（PNG/JPG）替代程序化贴图，步骤如下：

**步骤1：准备图片文件**

将图片放入 `assets/` 目录（需新建）：
```
assets/
  textures/
    grass.png          # 草地贴图 256×256 或 512×512
    stone.png         # 石头贴图
    metal.png         # 金属贴图
    ...
```

**步骤2：在 Textures.js 中添加加载方法**

```javascript
Textures.loadImage = function(url) {
  if (this.cache[url]) return this.cache[url];
  const tex = new THREE.TextureLoader().load(url);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  this.cache[url] = tex;
  return tex;
};
```

**步骤3：使用外部贴图**

```javascript
const grassTex = Textures.loadImage('assets/textures/grass.png');
grassTex.repeat.set(12, 12);  // 设置重复次数

const mat = new THREE.MeshStandardMaterial({
  map: grassTex,
  roughness: 0.9,
  flatShading: true
});
```

**⚠️ 外部贴图注意事项：**
- 图片必须通过 HTTP 服务器加载（不能直接双击 HTML）
- 建议使用 2 的幂次尺寸（256、512、1024）
- PNG 格式支持透明通道
- 大量不同贴图会增加 GPU 内存占用
- Docker 部署时确保 `nginx.conf` 正确提供静态文件

### 16.5 贴图美化建议

为了让画面更精美，可以重点优化以下贴图：

**1. 草地贴图（Textures.grass）升级建议：**
- 增加更多草叶密度（当前 300 根 → 500+）
- 添加深浅色交替的草丛块
- 加入小石子/泥土斑驳
- 使用多层 Canvas 叠加（先画泥土底层，再画草叶顶层）

**2. 角色贴图（给林克/敌人添加贴图）：**
- 在 `AssetFactory.createLink()` 中给皮肤/衣服使用 cloth/金属贴图
- 给波克布林皮肤添加斑点纹理
- 给骷髅兵添加裂纹贴图

**3. 武器贴图升级：**
- 大师之剑：添加发光贴图（emissive map）
- 金属武器：增强拉丝效果和反光

**4. 建筑贴图：**
- 房子墙壁使用砖纹贴图
- 屋顶使用瓦片纹理
- 地牢使用更精细的石砖贴图（含裂缝和苔藓）

**5. 环境贴图：**
- 水面贴图（半透明蓝色 + 波纹图案）
- 岩浆贴图（红黑色 + 流动裂纹，emissive 发光）
- 城堡墙壁（精细石砖 + 藤蔓）

### 16.6 新增贴图的完整实战示例

以"新增一个泥土地贴图"为例：

```javascript
// ===== 在 src/Textures.js 中添加 =====

Textures.mud(size = 256) {
  if (this.cache.mud) return this.cache.mud;
  const { c, ctx } = this._canvas(size);

  // 底色：深棕
  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size * 0.7);
  g.addColorStop(0, '#6a5a3a');
  g.addColorStop(1, '#5a4a2a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // 泥土颗粒
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * size, y = Math.random() * size;
    const v = (Math.random() - 0.5) * 40;
    const r = Math.max(0, Math.min(255, 90 + v));
    const g2 = Math.max(0, Math.min(255, 70 + v));
    ctx.fillStyle = `rgb(${r|0},${g2|0},${40 + (Math.random()-0.5)*20 | 0})`;
    ctx.fillRect(x, y, 1.5 + Math.random() * 2, 1.5 + Math.random() * 2);
  }

  // 小石子
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * size, y = Math.random() * size;
    ctx.fillStyle = `rgba(120,110,100,${0.3 + Math.random() * 0.4})`;
    ctx.beginPath();
    ctx.arc(x, y, 1 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 水洼（随机椭圆暗区）
  for (let i = 0; i < 3; i++) {
    const x = Math.random() * size, y = Math.random() * size;
    ctx.fillStyle = 'rgba(60,55,40,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y, 8 + Math.random() * 12, 4 + Math.random() * 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  this.cache.mud = this.toTexture(c, 12);
  return this.cache.mud;
}
```

然后在地图中使用：
```javascript
// 在 BaseScene._setupGround 或自定义地面中
const mudTex = Textures.mud();
const mat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  map: mudTex,
  roughness: 0.95,
  flatShading: true
});
```

或者添加到 BaseScene 的自动地面类型识别中：
```javascript
// 在 BaseScene._setupGround() 中添加
else if (textureType === 'mud') texture = Textures.mud();
```

---

## 十七、脚本加载顺序

`index.html` 中定义了严格的加载顺序（不可乱序）：

```
1. libs/three.min.js          ← 必须最先（所有代码依赖）
2. src/Debug.js               ← 第二（能捕获后续脚本的日志）
3. src/Item.js                ← 物品定义（被多个系统引用）
4. src/SaveSystem.js
5. src/CookingSystem.js
6. src/ShopSystem.js
7. src/QuestSystem.js
8. src/QuizData.js
9. src/Shrine.js
10. src/Textures.js           ← 贴图（被 AssetFactory 引用）
11. src/core/AssetFactory.js   ← 模型工厂（被 Player/Enemy 引用）
12. src/core/Input.js          ← 输入（被 Player/UI 引用）
13. src/TouchRouter.js
14. src/TouchControls.js
15. src/Effects.js
16. src/Player.js
17. src/Enemy.js
18. src/Inventory.js
19. src/World/BaseScene.js
20. src/World/Grassland.js ~ HyruleCastle.js  ← 7张地图
21. src/ui/*.js               ← 10个UI组件
22. src/core/Game.js          ← 游戏引擎（被 main.js 引用）
23. src/main.js               ← 入口（最后加载）
```

**新增文件时必须插入正确的加载位置。**

---

*文档版本：2026-06-15 · 基于当前代码库生成*
