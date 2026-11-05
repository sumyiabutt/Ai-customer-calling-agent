'use strict';

const { json, sb } = require('./_lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const publicKey = process.env.VAPI_PUBLIC_KEY || '';
  let assistantId = process.env.VAPI_ASSISTANT_ID || '';

  if (!assistantId) {
    try {
      const rows = await sb('settings?key=eq.vapi_assistant_id&select=value');
      assistantId = (rows && rows[0] && rows[0].value) || '';
    } catch {
      assistantId = '';
    }
  }

  json(res, 200, {
    configured: Boolean(publicKey && assistantId),
    publicKey,
    assistantId,
  });
};
