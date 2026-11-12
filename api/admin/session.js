'use strict';

const { json } = require('../_lib');
const { sessionFrom, adminConfig } = require('../_auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return json(res, 405, { error: 'Method not allowed' });
  }
  const config = adminConfig();
  const session = sessionFrom(req);
  json(res, 200, {
    authenticated: session.authenticated,
    email: session.authenticated ? session.email : '',
    configured: config.ready,
    missing: config.ready ? [] : config.missing,
  });
};
