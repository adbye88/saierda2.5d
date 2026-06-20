import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { join, resolve, extname, normalize, sep } from 'node:path';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';

const ROOT = resolve('.');
const DATA_DIR = join(ROOT, 'data');
const DB_FILE = join(DATA_DIR, 'cloud-db.json');
const PORT = Number(process.env.PORT || 8080);
const MAX_BODY = 2 * 1024 * 1024;
const MAX_ARCHIVES = 8;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

async function ensureDb() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    const db = JSON.parse(await readFile(DB_FILE, 'utf8'));
    if (!db.accounts) db.accounts = {};
    return db;
  } catch (e) {
    const db = { version: 1, createdAt: Date.now(), accounts: {} };
    await saveDb(db);
    return db;
  }
}

async function saveDb(db) {
  await mkdir(DATA_DIR, { recursive: true });
  db.updatedAt = Date.now();
  await writeFile(DB_FILE, JSON.stringify(db, null, 2));
}

function cleanName(name) {
  return String(name || '').trim().replace(/\s+/g, '_').slice(0, 24);
}

function hashPassword(password, salt) {
  return createHash('sha256').update(String(salt) + ':' + String(password)).digest('hex');
}

function safeCompare(a, b) {
  const aa = Buffer.from(String(a || ''), 'hex');
  const bb = Buffer.from(String(b || ''), 'hex');
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}

function publicArchives(acc) {
  const rows = [];
  if (acc.autoArchive) rows.push(acc.autoArchive);
  for (const a of (acc.archives || [])) rows.push(a);
  return rows.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

function sendJson(res, code, data) {
  const body = JSON.stringify(data);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    let size = 0;
    let body = '';
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error('请求体过大'));
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on('end', () => {
      try { resolveBody(body ? JSON.parse(body) : {}); }
      catch (e) { reject(new Error('JSON 格式错误')); }
    });
    req.on('error', reject);
  });
}

function authAccount(db, req) {
  const username = cleanName(req.headers['x-wildbreath-user']);
  const token = String(req.headers['x-wildbreath-token'] || '');
  const acc = username && db.accounts[username];
  if (!acc || !token || !(acc.sessions || []).some(s => s.token === token)) return null;
  acc.sessions = (acc.sessions || []).map(s => s.token === token ? { ...s, lastSeen: Date.now() } : s);
  return acc;
}

async function handleApi(req, res) {
  const path = new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname;
  if (req.method === 'GET' && path === '/api/cloud/status') {
    await ensureDb();
    return sendJson(res, 200, { ok: true, mode: 'json-file', db: 'data/cloud-db.json' });
  }
  if (req.method !== 'POST') return sendJson(res, 405, { ok: false, message: 'Method Not Allowed' });
  let body;
  try { body = await readBody(req); }
  catch (e) { return sendJson(res, 400, { ok: false, message: e.message }); }

  const db = await ensureDb();
  if (path === '/api/cloud/register') {
    const username = cleanName(body.username);
    const password = String(body.password || '');
    if (username.length < 2) return sendJson(res, 400, { ok: false, message: '账号至少 2 个字符' });
    if (password.length < 4) return sendJson(res, 400, { ok: false, message: '密码至少 4 个字符' });
    if (db.accounts[username]) return sendJson(res, 409, { ok: false, message: '这个账号已经存在' });
    const salt = randomBytes(12).toString('hex');
    const token = randomBytes(24).toString('hex');
    db.accounts[username] = {
      username,
      salt,
      passHash: hashPassword(password, salt),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sessions: [{ token, createdAt: Date.now(), lastSeen: Date.now() }],
      autoArchive: null,
      archives: []
    };
    await saveDb(db);
    return sendJson(res, 200, { ok: true, username, token });
  }

  if (path === '/api/cloud/login') {
    const username = cleanName(body.username);
    const password = String(body.password || '');
    const acc = db.accounts[username];
    if (!acc || !safeCompare(hashPassword(password, acc.salt), acc.passHash)) {
      return sendJson(res, 401, { ok: false, message: '账号或密码不正确' });
    }
    const token = randomBytes(24).toString('hex');
    acc.sessions = [{ token, createdAt: Date.now(), lastSeen: Date.now() }].concat(acc.sessions || []).slice(0, 5);
    acc.updatedAt = Date.now();
    await saveDb(db);
    return sendJson(res, 200, { ok: true, username, token, archives: publicArchives(acc) });
  }

  const acc = authAccount(db, req);
  if (!acc) return sendJson(res, 401, { ok: false, message: '登录已失效，请重新登录' });

  if (path === '/api/cloud/archives') {
    await saveDb(db);
    return sendJson(res, 200, { ok: true, archives: publicArchives(acc) });
  }

  if (path === '/api/cloud/archive') {
    const archive = body.archive;
    if (!archive || typeof archive !== 'object') return sendJson(res, 400, { ok: false, message: '云存档格式错误' });
    archive.user = acc.username;
    archive.timestamp = archive.timestamp || Date.now();
    archive.kind = body.isAuto ? 'auto' : 'manual';
    archive.id = archive.id || ((body.isAuto ? 'auto-' : 'manual-') + Date.now());
    if (body.isAuto) {
      acc.autoArchive = archive;
    } else {
      acc.archives = [archive].concat(acc.archives || []).slice(0, MAX_ARCHIVES);
    }
    acc.updatedAt = Date.now();
    await saveDb(db);
    return sendJson(res, 200, { ok: true, archives: publicArchives(acc) });
  }

  if (path === '/api/cloud/archive/delete') {
    const id = String(body.id || '');
    acc.archives = (acc.archives || []).filter(a => a.id !== id);
    acc.updatedAt = Date.now();
    await saveDb(db);
    return sendJson(res, 200, { ok: true, archives: publicArchives(acc) });
  }

  return sendJson(res, 404, { ok: false, message: '未知云存档接口' });
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';
  const file = resolve(ROOT, '.' + normalize(pathname));
  if (file !== ROOT && !file.startsWith(ROOT + sep)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error('not file');
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': pathname === '/index.html' ? 'no-store' : 'public, max-age=3600'
    });
    createReadStream(file).pipe(res);
  } catch (e) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  }
}

createServer((req, res) => {
  const pathname = new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname;
  if (pathname.startsWith('/api/cloud/')) {
    handleApi(req, res).catch(e => sendJson(res, 500, { ok: false, message: e.message || String(e) }));
  } else {
    serveStatic(req, res).catch(e => {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(e.message || String(e));
    });
  }
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Wild Breath cloud server running: http://localhost:${PORT}`);
  console.log(`Cloud JSON database: ${DB_FILE}`);
});
