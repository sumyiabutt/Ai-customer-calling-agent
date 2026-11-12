'use strict';

const { json, body } = require('../_lib');
const {
  adminConfig,
  sameText,
  issueToken,
  setSessionCookie,
  sameOrigin,
} = require('../_auth');

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map();

function clientIp(req) {
  const forwarded = (req.headers && req.headers['x-forwarded-for']) || '';
  return String(forwarded.split(',')[0] || (req.socket && req.socket.remoteAddress) || 'unknown').trim();
}

function throttled(ip) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now - entry.start > WINDOW_MS) {
    attempts.set(ip, { start: now, count: 1 });
    return false;
  }
  entry.count += 1;
  if (attempts.size > 500) {
    for (const [key, value] of attempts) {
      if (now - value.start > WINDOW_MS) attempts.delete(key);
    }
  }
  return entry.count > MAX_ATTEMPTS;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }
  if (!sameOrigin(req)) {
    return json(res, 403, { error: 'Request origin is not allowed.' });
  }

  const config = adminConfig();
  if (!config.ready) {
    return json(res, 503, {
      error: 'Admin login is not configured on this deployment yet.',
      missing: config.missing,
    });
  }

  const ip = clientIp(req);
  if (throttled(ip)) {
    return json(res, 429, { error: 'Too many sign-in attempts. Try again in a few minutes.' });
  }

  const payload = body(req);
  const email = String(payload.email || '').trim().toLowerCase();
  const password = String(payload.password || '');

  if (!email || !password) {
    return json(res, 400, { error: 'Enter the admin email and password.' });
  }

  if (!sameText(email, config.email) || !sameText(password, config.password)) {
    return json(res, 401, { error: 'Email or password is incorrect.' });
  }

  attempts.delete(ip);
  setSessionCookie(req, res, issueToken(config.email, config.secret));
  json(res, 200, { authenticated: true, email: config.email });
};
