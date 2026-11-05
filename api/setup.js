'use strict';

const { json, sb, baseUrl } = require('./_lib');
const { assistantConfig } = require('./_assistant');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const expected = process.env.SETUP_TOKEN || '';
  const supplied = req.headers['x-setup-token'] || '';
  if (!expected || supplied !== expected) {
    return json(res, 401, { error: 'Invalid setup token' });
  }

  const privateKey = process.env.VAPI_PRIVATE_KEY || '';
  const secret = process.env.VAPI_SERVER_SECRET || '';
  if (!privateKey || !secret) {
    return json(res, 500, {
      error: 'VAPI_PRIVATE_KEY and VAPI_SERVER_SECRET must be set in the environment',
    });
  }

  const serverUrl = `${baseUrl(req)}/api/vapi`;
  const config = assistantConfig(serverUrl, secret);

  let assistantId = process.env.VAPI_ASSISTANT_ID || '';
  if (!assistantId) {
    try {
      const rows = await sb('settings?key=eq.vapi_assistant_id&select=value');
      assistantId = (rows && rows[0] && rows[0].value) || '';
    } catch (error) {
      return json(res, 502, { error: `Supabase: ${error.message}` });
    }
  }

  const endpoint = assistantId
    ? `https://api.vapi.ai/assistant/${assistantId}`
    : 'https://api.vapi.ai/assistant';

  const response = await fetch(endpoint, {
    method: assistantId ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${privateKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return json(res, 502, {
      error: `Vapi ${response.status}`,
      detail: data.message || data.error || 'Assistant request failed',
    });
  }

  const id = data.id || assistantId;
  if (!id) {
    return json(res, 502, { error: 'Vapi did not return an assistant id' });
  }

  try {
    await sb('settings?on_conflict=key', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: { key: 'vapi_assistant_id', value: id },
    });
  } catch (error) {
    return json(res, 502, {
      assistantId: id,
      error: `Assistant saved in Vapi but not in Supabase: ${error.message}`,
    });
  }

  json(res, 200, { assistantId: id, updated: Boolean(assistantId), serverUrl });
};
