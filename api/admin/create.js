'use strict';

const { json, body, sb } = require('../_lib');
const {
  loadAdminConfig,
  hashPassword,
  newSessionSecret,
  clearStoredCache,
  sameOrigin,
} = require('../_auth');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }
  if (!sameOrigin(req)) {
    return json(res, 403, { error: 'Request origin is not allowed.' });
  }

  const expected = (process.env.SETUP_TOKEN || '').trim();
  if (!expected) {
    return json(res, 503, {
      error:
        'SETUP_TOKEN is not set on this deployment yet. Save it in the hosting environment variables, then redeploy.',
    });
  }
  const supplied = String(req.headers['x-setup-token'] || '').trim();
  if (supplied !== expected) {
    return json(res, 401, {
      error:
        'That setup token does not match SETUP_TOKEN on this deployment. Check the saved value (no extra spaces) and redeploy after changing it.',
    });
  }

  const config = await loadAdminConfig();
  if (config.ready && config.source === 'environment') {
    return json(res, 409, {
      error: 'The admin account comes from the hosting environment variables. Change it there.',
    });
  }

  const payload = body(req);
  const email = String(payload.email || '').trim().toLowerCase();
  const password = String(payload.password || '');

  if (!EMAIL.test(email)) {
    return json(res, 400, { error: 'Enter a valid admin email address.' });
  }
  if (password.length < 8) {
    return json(res, 400, { error: 'Use a password with at least 8 characters.' });
  }

  try {
    await sb('settings?on_conflict=key', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: [
        { key: 'admin_email', value: email },
        { key: 'admin_password_hash', value: hashPassword(password) },
        { key: 'admin_session_secret', value: newSessionSecret() },
      ],
    });
  } catch (error) {
    console.error('admin/create:', error.message);
    return json(res, 502, {
      error: 'The admin login could not be saved to the call database right now.',
    });
  }

  clearStoredCache();
  json(res, 200, { created: true, email });
};
