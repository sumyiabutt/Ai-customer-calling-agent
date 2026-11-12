'use strict';

const crypto = require('crypto');
const { json } = require('./_lib');

const COOKIE = 'shopeasy_admin';
const MAX_AGE_SECONDS = 8 * 60 * 60;

function adminConfig() {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || '');
  const secret = String(process.env.ADMIN_SESSION_SECRET || '');
  const missing = [];
  if (!email) missing.push('ADMIN_EMAIL');
  if (!password) missing.push('ADMIN_PASSWORD');
  if (!secret) missing.push('ADMIN_SESSION_SECRET');
  else if (secret.length < 16) missing.push('ADMIN_SESSION_SECRET (must be at least 16 characters)');
  return { email, password, secret, missing, ready: missing.length === 0 };
}

function digest(value) {
  return crypto.createHash('sha256').update(String(value), 'utf8').digest();
}

function sameText(left, right) {
  return crypto.timingSafeEqual(digest(left), digest(right));
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

function sessionFrom(req) {
  const config = adminConfig();
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

function requireAdmin(req, res) {
  const config = adminConfig();
  if (!config.ready) {
    json(res, 503, {
      error: 'Admin login is not configured on this deployment.',
      missing: config.missing,
    });
    return null;
  }
  const session = sessionFrom(req);
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
  adminConfig,
  sameText,
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
