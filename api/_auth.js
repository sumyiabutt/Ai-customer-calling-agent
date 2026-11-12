'use strict';

const crypto = require('crypto');
const { json, sb } = require('./_lib');

const COOKIE = 'shopeasy_admin';
const MAX_AGE_SECONDS = 8 * 60 * 60;
const STORED_CACHE_MS = 30 * 1000;

function envAdminConfig() {
  const single = String(process.env.ADMIN_LOGIN || '');
  let email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  let password = String(process.env.ADMIN_PASSWORD || '');
  const split = single.indexOf(':');
  if (split > 0 && (!email || !password)) {
    email = email || single.slice(0, split).trim().toLowerCase();
    password = password || single.slice(split + 1);
  }
  let secret = String(process.env.ADMIN_SESSION_SECRET || '');
  if (!secret && email && password.length >= 8) {
    secret = digest(`shopeasy-admin-session|${email}|${password}`).toString('hex');
  }
  const missing = [];
  if (!email || !password) {
    missing.push('ADMIN_LOGIN (email:password) or ADMIN_EMAIL + ADMIN_PASSWORD');
  } else if (password.length < 8) missing.push('ADMIN_PASSWORD (at least 8 characters)');
  if (!secret) missing.push('ADMIN_SESSION_SECRET');
  return { email, password, secret, missing, ready: missing.length === 0, source: 'environment' };
}

let storedCache = { at: 0, value: null };

async function storedAdmin() {
  if (Date.now() - storedCache.at < STORED_CACHE_MS) return storedCache.value;
  let value = null;
  try {
    const rows = await sb(
      'settings?key=in.(admin_email,admin_password_hash,admin_session_secret)&select=key,value'
    );
    const map = {};
    for (const row of rows || []) map[row.key] = row.value;
    if (map.admin_email && map.admin_password_hash && map.admin_session_secret) {
      value = {
        email: String(map.admin_email).trim().toLowerCase(),
        passwordHash: map.admin_password_hash,
        secret: map.admin_session_secret,
      };
    }
  } catch {
    value = null;
  }
  storedCache = { at: Date.now(), value };
  return value;
}

function clearStoredCache() {
  storedCache = { at: 0, value: null };
}

async function loadAdminConfig() {
  const env = envAdminConfig();
  if (env.ready) return env;
  const stored = await storedAdmin();
  if (!stored) return { ...env, ready: false, missing: env.missing };
  return {
    email: stored.email,
    password: '',
    passwordHash: stored.passwordHash,
    secret: stored.secret,
    missing: [],
    ready: true,
    source: 'database',
  };
}

function digest(value) {
  return crypto.createHash('sha256').update(String(value), 'utf8').digest();
}

function sameText(left, right) {
  return crypto.timingSafeEqual(digest(left), digest(right));
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 32).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const actual = crypto.scryptSync(String(password), parts[1], 32);
  const expected = Buffer.from(parts[2], 'hex');
  return expected.length === actual.length && crypto.timingSafeEqual(actual, expected);
}

function passwordMatches(config, password) {
  if (config.passwordHash) return verifyPassword(password, config.passwordHash);
  return sameText(password, config.password);
}

function newSessionSecret() {
  return crypto.randomBytes(32).toString('hex');
}

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function issueToken(email, secret) {
  const payload = Buffer.from(
    JSON.stringify({ sub: email, exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS }),
    'utf8'
  ).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

function verifyToken(token, secret) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const expected = sign(payload, secret);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data || typeof data.exp !== 'number' || data.exp * 1000 < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

function readCookie(req, name) {
  const header = (req.headers && req.headers.cookie) || '';
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) {
      return decodeURIComponent(part.slice(index + 1).trim());
    }
  }
  return '';
}

function sessionFrom(req, config = envAdminConfig()) {
  if (!config.ready) return { authenticated: false, email: '', configured: false };
  const data = verifyToken(readCookie(req, COOKIE), config.secret);
  if (!data) return { authenticated: false, email: '', configured: true };
  return { authenticated: true, email: String(data.sub || ''), configured: true };
}

function isSecure(req) {
  const proto = String((req.headers && req.headers['x-forwarded-proto']) || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  if (proto) return proto === 'https';
  return Boolean(req.socket && req.socket.encrypted);
}

function cookieBase(req) {
  return `Path=/; HttpOnly; SameSite=Strict; ${isSecure(req) ? 'Secure; ' : ''}`;
}

function setSessionCookie(req, res, token) {
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; ${cookieBase(req)}Max-Age=${MAX_AGE_SECONDS}`);
}

function clearSessionCookie(req, res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; ${cookieBase(req)}Max-Age=0`);
}

async function requireAdmin(req, res) {
  const config = await loadAdminConfig();
  if (!config.ready) {
    json(res, 503, {
      error: 'Admin login is not configured on this deployment.',
      missing: config.missing,
    });
    return null;
  }
  const session = sessionFrom(req, config);
  if (!session.authenticated) {
    json(res, 401, { error: 'Sign in to the admin area to read call data.' });
    return null;
  }
  return session;
}

function sameOrigin(req) {
  const origin = req.headers && req.headers.origin;
  if (!origin) return true;
  const host = (req.headers && (req.headers['x-forwarded-host'] || req.headers.host)) || '';
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

module.exports = {
  envAdminConfig,
  loadAdminConfig,
  clearStoredCache,
  sameText,
  hashPassword,
  verifyPassword,
  passwordMatches,
  newSessionSecret,
  issueToken,
  verifyToken,
  sessionFrom,
  setSessionCookie,
  clearSessionCookie,
  requireAdmin,
  sameOrigin,
  COOKIE,
  MAX_AGE_SECONDS,
};
