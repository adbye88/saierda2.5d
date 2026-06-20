/* ========================================================
   CloudAccountSystem.js — JSON 文件云账号与云存档客户端
   - 账号/云档不再写浏览器 localStorage 数据库
   - 通过 cloud-server.mjs 的 /api/cloud/* 写入 data/cloud-db.json
   - 浏览器只保留当前登录会话 token，用于下次自动同步
   ======================================================== */

const CloudAccountSystem = {
  SESSION_KEY: 'wildbreath_cloud_session_v2',
  MAX_ARCHIVES: 8,
  currentUser: null,
  token: null,
  archives: [],
  lastMessage: '',
  apiAvailable: false,
  _syncTimer: null,
  _suspendAutoSync: false,

  init() {
    const session = this._loadSession();
    if (session && session.username && session.token) {
      this.currentUser = session.username;
      this.token = session.token;
    }
    this.checkApi().then(() => {
      if (this.isLoggedIn()) {
        this.refreshArchives()
          .then(() => this.syncLatestToLocal(true))
          .then(() => { if (typeof MapMenu !== 'undefined' && MapMenu.isOpen && MapMenu.mode === 'cloud') MapMenu.render(); })
          .catch(() => this.logout(false));
      }
    });
  },

  isLoggedIn() {
    return !!this.currentUser && !!this.token;
  },

  async checkApi() {
    try {
      const res = await fetch('/api/cloud/status', { cache: 'no-store' });
      this.apiAvailable = !!res.ok;
      return this.apiAvailable;
    } catch (e) {
      this.apiAvailable = false;
      return false;
    }
  },

  async register(username, password) {
    username = this._cleanName(username);
    if (!username || username.length < 2) return this._fail('账号至少 2 个字符');
    if (!password || password.length < 4) return this._fail('密码至少 4 个字符');
    const result = await this._request('/api/cloud/register', { username, password });
    if (!result.ok) return this._fail(result.message || '注册失败');
    this._setSession(result.username, result.token);
    await this.createArchive('注册后的初始云存档', true);
    await this.refreshArchives();
    return this._ok('注册成功，已写入云端 JSON 并创建初始云存档');
  },

  async login(username, password) {
    username = this._cleanName(username);
    const result = await this._request('/api/cloud/login', { username, password });
    if (!result.ok) return this._fail(result.message || '账号或密码不正确');
    this._setSession(result.username, result.token);
    await this.refreshArchives();
    const synced = await this.syncLatestToLocal(true);
    const pending = typeof SaveSystem !== 'undefined' && SaveSystem.hasPendingCloudCurrent && SaveSystem.hasPendingCloudCurrent();
    return this._ok(synced
      ? (pending ? '登录成功，云进度已同步，开始游戏时自动加载' : '登录成功，已自动同步最新云进度')
      : '登录成功，暂无云进度可同步');
  },

  logout(showMsg = true) {
    this.currentUser = null;
    this.token = null;
    this.archives = [];
    localStorage.removeItem(this.SESSION_KEY);
    if (showMsg) this._ok('已退出账号');
  },

  scheduleAutoSync(reason = 'auto') {
    if (this._suspendAutoSync || !this.isLoggedIn()) return;
    clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(() => {
      this.createArchive('自动同步：' + reason, true)
        .then(() => {
          if (typeof MapMenu !== 'undefined' && MapMenu.isOpen && MapMenu.mode === 'cloud') MapMenu.render();
        })
        .catch(e => { this.lastMessage = '自动云同步失败：' + (e.message || e); });
    }, 900);
  },

  async createArchive(label = '手动云存档', isAuto = false) {
    if (!this.isLoggedIn()) return false;
    const archive = SaveSystem.exportCloudState(label);
    archive.id = (isAuto ? 'auto-' : 'manual-') + Date.now();
    archive.kind = isAuto ? 'auto' : 'manual';
    archive.user = this.currentUser;
    const result = await this._request('/api/cloud/archive', { archive, isAuto });
    if (!result.ok) {
      this.lastMessage = result.message || '云存档上传失败';
      return false;
    }
    this.archives = result.archives || [];
    this.lastMessage = isAuto ? '已自动同步到云端 JSON' : '已创建手动云存档';
    return archive;
  },

  async refreshArchives() {
    if (!this.isLoggedIn()) return [];
    const result = await this._request('/api/cloud/archives', {});
    if (!result.ok) throw new Error(result.message || '读取云存档失败');
    this.archives = result.archives || [];
    return this.archives;
  },

  async syncLatestToLocal(silent = false) {
    if (this.isLoggedIn() && this.archives.length === 0) {
      await this.refreshArchives().catch(() => []);
    }
    const latest = this.getLatestArchive();
    if (!latest) return false;
    this._suspendAutoSync = true;
    const ok = SaveSystem.importCloudState(latest, true);
    this._suspendAutoSync = false;
    if (ok && !silent) {
      const pending = SaveSystem.hasPendingCloudCurrent && SaveSystem.hasPendingCloudCurrent();
      this._ok(pending ? '已同步最新云存档，开始游戏时自动加载' : '已加载最新云存档');
    }
    return ok;
  },

  async loadArchive(id) {
    await this.refreshArchives().catch(() => []);
    const archive = this.getArchive(id);
    if (!archive) return this._fail('找不到这个云存档');
    this._suspendAutoSync = true;
    const ok = SaveSystem.importCloudState(archive, true);
    this._suspendAutoSync = false;
    if (!ok) return this._fail('云存档加载失败');
    const pending = SaveSystem.hasPendingCloudCurrent && SaveSystem.hasPendingCloudCurrent();
    return this._ok((pending ? '已同步云存档，开始游戏时自动加载：' : '已加载云存档：') + (archive.label || '未命名'));
  },

  async deleteArchive(id) {
    if (!this.isLoggedIn()) return false;
    const result = await this._request('/api/cloud/archive/delete', { id });
    if (!result.ok) return this._fail(result.message || '删除云存档失败');
    this.archives = result.archives || [];
    return this._ok('已删除手动云存档');
  },

  downloadArchive(id) {
    const archive = this.getArchive(id) || this.getLatestArchive();
    if (!archive) return this._fail('没有可导出的云存档');
    const blob = new Blob([JSON.stringify(archive, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `wildbreath-${this.currentUser}-${archive.kind}-${archive.timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 300);
    return this._ok('已导出 JSON 云存档文件');
  },

  getLatestArchive() {
    return (this.archives || []).slice().sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0] || null;
  },

  getArchive(id) {
    return (this.archives || []).find(a => a.id === id) || null;
  },

  getArchiveRows() {
    return (this.archives || []).slice().sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  },

  getStatusText() {
    if (!this.apiAvailable) return '云存档 API 未连接：请用 node cloud-server.mjs 启动游戏，不要用 python 静态服务器。';
    if (!this.isLoggedIn()) return '未登录：账号和云存档将保存到服务器 JSON 文件 data/cloud-db.json。';
    const latest = this.getLatestArchive();
    if (!latest) return `已登录 ${this.currentUser}，暂无云存档`;
    return `已登录 ${this.currentUser}，最新云档：${this._time(latest.timestamp)}`;
  },

  async _request(path, body) {
    if (!this.apiAvailable && path !== '/api/cloud/status') {
      await this.checkApi();
    }
    if (!this.apiAvailable) {
      return { ok: false, message: '云存档 API 未启动。请运行：node cloud-server.mjs' };
    }
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WildBreath-User': this.currentUser || '',
          'X-WildBreath-Token': this.token || ''
        },
        body: JSON.stringify(body || {})
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, message: json.message || ('请求失败：' + res.status) };
      return json;
    } catch (e) {
      this.apiAvailable = false;
      return { ok: false, message: '云存档 API 连接失败：' + (e.message || e) };
    }
  },

  _setSession(username, token) {
    this.currentUser = username;
    this.token = token;
    localStorage.setItem(this.SESSION_KEY, JSON.stringify({ username, token }));
  },

  _loadSession() {
    try { return JSON.parse(localStorage.getItem(this.SESSION_KEY) || 'null'); }
    catch (e) { return null; }
  },

  _cleanName(name) {
    return String(name || '').trim().replace(/\s+/g, '_').slice(0, 24);
  },

  _time(ts) {
    if (!ts) return '未知时间';
    return new Date(ts).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  },

  _ok(msg) {
    this.lastMessage = msg;
    if (typeof Dialogue !== 'undefined') Dialogue.show('☁️ ' + msg);
    return true;
  },

  _fail(msg) {
    this.lastMessage = msg;
    if (typeof Dialogue !== 'undefined') Dialogue.show('☁️ ' + msg);
    return false;
  }
};

if (typeof window !== 'undefined') window.CloudAccountSystem = CloudAccountSystem;
