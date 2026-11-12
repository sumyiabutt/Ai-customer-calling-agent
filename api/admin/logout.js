'use strict';

const { json } = require('../_lib');
const { clearSessionCookie, sameOrigin } = require('../_auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }
  if (!sameOrigin(req)) {
    return json(res, 403, { error: 'Request origin is not allowed.' });
  }
  clearSessionCookie(req, res);
  json(res, 200, { authenticated: false });
};
