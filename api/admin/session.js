'use strict';

const { json } = require('../_lib');
const { loadAdminConfig, sessionFrom } = require('../_auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return json(res, 405, { error: 'Method not allowed' });
  }
  const config = await loadAdminConfig();
  const session = sessionFrom(req, config);
  json(res, 200, {
    authenticated: session.authenticated,
    email: session.authenticated ? session.email : '',
    configured: config.ready,
    source: config.ready ? config.source : '',
    missing: config.ready ? [] : config.missing,
  });
};
