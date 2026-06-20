/* ========================================================
   CloudAccountSystem.js — 轻量账号与 JSON 云存档
   - 不连接数据库，全部保存在 localStorage 的 JSON 文档里
   - 设计成“云端 API 外形”：以后可把 _loadDb/_saveDb 换成网络请求
   - 登录后自动把最新云档同步到本机，手动可创建/加载云存档
   ======================================================== */

const CloudAccountSystem = {
  DB_KEY: 'wildbreath_cloud_accounts_v1',
  SESSION_KEY: 'wildbreath_cloud_session_v1',
  MAX_ARCHIVES: 8,
  currentUser: null,
  lastMessage: '',
  _syncTimer: null,
  _suspendAutoSync: false,

  init() {
    this.currentUser = localStorage.getItem(this.SESSION_KEY) || null;
    if (this.currentUser && !this._account(this.currentUser)) {
      this.logout(false);
      return;
    }
    if (this.currentUser) {
      setTimeout(() => this.syncLatestToLocal(true), 120);
    }
  },

  isLoggedIn() {
    return !!this.currentUser && !!this._account(this.currentUser);
  },

  register(username, password) {
    username = this._cleanName(username);
    if (!username || username.length < 2) return this._fail('账号至少 2 个字符');
    if (!password || password.length < 4) return this._fail('密码至少 4 个字符');
    const db = this._loadDb();
    if (db.accounts[username]) return this._fail('这个账号已经存在');
    db.accounts[username] = {
      username,
      pass: this._hash(password),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      autoArchive: null,
      archives: []
    };
    this._saveDb(db);
    this.currentUser = username;
    localStorage.setItem(this.SESSION_KEY, username);
    this.createArchive('注册后的初始云存档', true);
    return this._ok('注册成功，已创建初始云存档');
  },

  login(username, password) {
    username = this._cleanName(username);
    const acc = this._account(username);
    if (!acc || acc.pass !== this._hash(password || '')) return this._fail('账号或密码不正确');
    this.currentUser = username;
    localStorage.setItem(this.SESSION_KEY, username);
    const synced = this.syncLatestToLocal(true);
    const pending = typeof SaveSystem !== 'undefined' && SaveSystem.hasPendingCloudCurrent && SaveSystem.hasPendingCloudCurrent();
    return this._ok(synced
      ? (pending ? '登录成功，云进度已同步，开始游戏时自动加载' : '登录成功，已自动同步最新云进度')
      : '登录成功，暂无云进度可同步');
  },

  logout(showMsg = true) {
    this.currentUser = null;
    localStorage.removeItem(this.SESSION_KEY);
    if (showMsg) this._ok('已退出账号');
  },

  scheduleAutoSync(reason = 'auto') {
    if (this._suspendAutoSync || !this.isLoggedIn()) return;
    clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(() => {
      this.createArchive('自动同步：' + reason, true);
      if (typeof MapMenu !== 'undefined' && MapMenu.isOpen && MapMenu.mode === 'cloud') MapMenu.render();
    }, 900);
  },

  createArchive(label = '手动云存档', isAuto = false) {
    if (!this.isLoggedIn()) return false;
    const archive = SaveSystem.exportCloudState(label);
    archive.id = (isAuto ? 'auto-' : 'manual-') + Date.now();
    archive.kind = isAuto ? 'auto' : 'manual';
    archive.user = this.currentUser;

    const db = this._loadDb();
    const acc = db.accounts[this.currentUser];
    if (!acc) return false;
    if (isAuto) {
      acc.autoArchive = archive;
    } else {
      acc.archives = [archive].concat(acc.archives || []).slice(0, this.MAX_ARCHIVES);
    }
    acc.updatedAt = Date.now();
    this._saveDb(db);
    this.lastMessage = isAuto ? '已自动同步到云端 JSON' : '已创建手动云存档';
    return archive;
  },

  syncLatestToLocal(silent = false) {
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

  loadArchive(id) {
    const archive = this.getArchive(id);
    if (!archive) return this._fail('找不到这个云存档');
    this._suspendAutoSync = true;
    const ok = SaveSystem.importCloudState(archive, true);
    this._suspendAutoSync = false;
    if (!ok) return this._fail('云存档加载失败');
    const pending = SaveSystem.hasPendingCloudCurrent && SaveSystem.hasPendingCloudCurrent();
    return this._ok((pending ? '已同步云存档，开始游戏时自动加载：' : '已加载云存档：') + (archive.label || '未命名'));
  },

  deleteArchive(id) {
    if (!this.isLoggedIn()) return false;
    const db = this._loadDb();
    const acc = db.accounts[this.currentUser];
    acc.archives = (acc.archives || []).filter(a => a.id !== id);
    acc.updatedAt = Date.now();
    this._saveDb(db);
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
    const acc = this._account(this.currentUser);
    if (!acc) return null;
    const all = [];
    if (acc.autoArchive) all.push(acc.autoArchive);
    for (const a of (acc.archives || [])) all.push(a);
    return all.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0] || null;
  },

  getArchive(id) {
    const acc = this._account(this.currentUser);
    if (!acc) return null;
    if (acc.autoArchive && acc.autoArchive.id === id) return acc.autoArchive;
    return (acc.archives || []).find(a => a.id === id) || null;
  },

  getArchiveRows() {
    const acc = this._account(this.currentUser);
    if (!acc) return [];
    const rows = [];
    if (acc.autoArchive) rows.push(acc.autoArchive);
    for (const a of (acc.archives || [])) rows.push(a);
    return rows.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  },

  getStatusText() {
    if (!this.isLoggedIn()) return '未登录：本功能使用本机 JSON 模拟云端账号，不需要数据库。';
    const latest = this.getLatestArchive();
    if (!latest) return `已登录 ${this.currentUser}，暂无云存档`;
    return `已登录 ${this.currentUser}，最新云档：${this._time(latest.timestamp)}`;
  },

  _loadDb() {
    try {
      const db = JSON.parse(localStorage.getItem(this.DB_KEY) || '{}');
      if (!db.accounts) db.accounts = {};
      return db;
    } catch (e) {
      return { accounts: {} };
    }
  },

  _saveDb(db) {
    localStorage.setItem(this.DB_KEY, JSON.stringify(db));
  },

  _account(username) {
    if (!username) return null;
    return this._loadDb().accounts[username] || null;
  },

  _cleanName(name) {
    return String(name || '').trim().replace(/\s+/g, '_').slice(0, 24);
  },

  _hash(text) {
    let h = 2166136261;
    const s = String(text);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
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
