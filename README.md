# 🗡️ 旷野之息 · 迷你版 (Wild Breath Mini)

一个致敬《塞尔达传说：旷野之息》的手机横屏 3D 网页游戏。低多边形（Low-Poly）风格，全部模型由代码生成，零美术资源依赖，可一键 Docker 部署。

## ✨ 特性

- 🌍 **三张地图**：起始台地草原 / 迷失森林 / 地下水牢
- ⚔️ **旷野之息原版武器**：旅人之剑、士兵之剑、骑士之剑、波克布林之骨枪、**大师之剑**
- 🛡️ **盾牌系统**：木之盾、士兵之盾、**海利亚盾**（可格挡伤害）
- 🏹 **弓箭远程**：旅人之弓、士兵之弓，抛物线物理
- 👹 **6 种原版怪物**：红/蓝/黑波克布林、八爪章鱼怪、莫力布林、骷髅兵、守护者
- 🗿 **Boss 战**：岩石巨像（攻击头顶橙色矿石弱点）
- 🎒 **完整背包系统**：武器耐久、食物回血、材料堆叠、装备槽
- 💎 **拾取系统**：地图光柱掉落、宝箱开启
- ☁️ **账号与 JSON 云存档**：注册/登录、自动同步、手动云档，数据写入 `data/cloud-db.json`
- 📱 **手机横屏 + 虚拟摇杆** + 桌面键盘鼠标双支持
- 🐳 **Docker 一键部署**

## 🎮 操作

| 操作 | 手机 | 桌面 |
|---|---|---|
| 移动 | 左下虚拟摇杆 | WASD / 方向键 |
| 攻击 | ⚔️ 按钮 | 鼠标左键 / J |
| 跳跃 | 🦘 按钮 | 空格 |
| 锁定敌人 | 🎯 按钮 | Q |
| 防御格挡 | 🛡️ 按钮（按住） | Shift |
| 背包 | 🎒 按钮 | Tab |
| 对话/拾取 | 靠近自动 | E |

## 🚀 部署

### 方式一：Docker Compose（推荐）

```bash
docker compose up -d
```

浏览器访问 `http://localhost:8080`，手机访问 `http://你的电脑IP:8080`（需同一局域网）。

### 方式二：直接 Docker

```bash
docker build -t wild-breath-mini .
docker run -d -p 8080:8080 -v "$PWD/data:/app/data" --name wild-breath wild-breath-mini
```

### 方式三：本地 Node 启动

```bash
node cloud-server.mjs
```

然后浏览器访问 `http://localhost:8080`。

> ⚠️ 不要用 `python3 -m http.server 8080` 作为正式入口：它只能打开静态页面，不能注册账号、登录或写入云存档。云存档必须通过 `node cloud-server.mjs` 或 Docker 启动。

## ☁️ 账号与云存档

- 账号、密码哈希、登录会话、自动云档、手动云档都保存在服务器 JSON 文件：`data/cloud-db.json`。
- 浏览器只保留当前登录 token，用于下次打开时自动同步；账号数据库和云档不再写浏览器 `localStorage`。
- 游戏内“存档 / 读档 / 云存档”入口已经切到云端。登录后会自动拉取最新云档，手动云档最多保留 8 个，自动同步档保留最新一份。
- `data/cloud-db.json` 已加入 `.gitignore`，不会被提交到 GitHub；Docker Compose 会把本机 `./data` 挂到容器里，重启后存档仍在。

## 🗺️ 游戏流程

1. **起始台地**：与老爷爷对话获取初始武器 → 击败波克布林熟悉操作 → 找宝箱拿士兵之剑和旅人之弓
2. **迷失森林**（北方传送门）：击败更强的黑波克布林和莫力布林 → 拿到骑士之剑
3. **地下水牢**（森林深处）：击败骷髅和守护者 → 挑战 **岩石巨像** → 获得传说中的 **大师之剑**！

## 🛠️ 技术栈

- **引擎**：Three.js r128
- **渲染**：WebGL + 卡通低多边形着色
- **云存档服务**：Node.js 内置 http + JSON 文件数据库
- **部署**：Node Docker 镜像 / 本地 Node

## 📁 项目结构

```
├── index.html          # 入口
├── cloud-server.mjs    # 静态文件 + JSON 云存档 API
├── data/               # 运行期云存档目录（cloud-db.json 不提交）
├── Dockerfile          # Docker 镜像定义
├── docker-compose.yml  # 一键启动
├── nginx.conf          # 旧静态部署配置（云存档模式不使用）
├── css/style.css       # 全部样式
├── libs/three.min.js   # Three.js 引擎
└── src/
    ├── main.js         # 入口逻辑
    ├── Item.js         # 物品定义
    ├── Player.js       # 玩家系统
    ├── Enemy.js        # 敌人系统（5种+Boss）
    ├── Inventory.js    # 背包数据
    ├── core/           # 引擎核心
    ├── World/          # 三张地图
    └── ui/             # HUD/摇杆/按钮/背包/对话
```

## 📜 许可

仅供学习交流。塞尔达传说的所有相关名称、形象版权归任天堂所有。
