'use strict';

const { json, sb, baseUrl, publicKeyIssue } = require('./_lib');
const { assistantConfig, findAssistantId } = require('./_assistant');

async function status(res) {
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
  if (!assistantId) assistantId = await findAssistantId();

  let vapiStatus = 0;
  const privateKey = process.env.VAPI_PRIVATE_KEY || '';
  if (privateKey) {
    try {
      const probe = await fetch('https://api.vapi.ai/assistant?limit=1', {
        headers: { Authorization: `Bearer ${privateKey}` },
        signal: AbortSignal.timeout(8000),
      });
      vapiStatus = probe.status;
    } catch {
      vapiStatus = 0;
    }
  }

  json(res, 200, {
    vapiPublicKey: Boolean(publicKey),
    publicKeyIssue: publicKeyIssue(publicKey),
    publicKeyLooksMasked: /^[\u2022\u00b7.\s]+$/.test(publicKey),
    publicKeyLength: publicKey.length,
    vapiPrivateKey: Boolean(privateKey),
    vapiServerSecret: Boolean(process.env.VAPI_SERVER_SECRET || ''),
    assistantId,
    vapiStatus,
    vapiOk: vapiStatus >= 200 && vapiStatus < 300,
    supabaseUrl: Boolean(process.env.SUPABASE_URL || ''),
    supabaseServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || ''),
  });
}

module.exports = async function handler(req, res) {
  const expected = process.env.SETUP_TOKEN || '';
  const supplied = req.headers['x-setup-token'] || '';
  if (!expected || supplied !== expected) {
    return json(res, 401, { error: 'Invalid setup token' });
  }

  if (req.method === 'GET') {
    return status(res);
  }
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
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
  let warning = '';
  if (!assistantId) {
    try {
      const rows = await sb('settings?key=eq.vapi_assistant_id&select=value');
      assistantId = (rows && rows[0] && rows[0].value) || '';
    } catch (error) {
      warning = `Supabase could not be read: ${error.message}`;
    }
  }

  if (!assistantId) {
    assistantId = await findAssistantId();
  }

  const created = !assistantId;
  const endpoint = assistantId
    ? `https://api.vapi.ai/assistant/${assistantId}`
    : 'https://api.vapi.ai/assistant';

  const response = await fetch(endpoint, {
    method: created ? 'POST' : 'PATCH',
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
    warning = warning || `Assistant is live in Vapi but the id was not saved to Supabase: ${error.message}`;
  }

  json(res, 200, {
    assistantId: id,
    created,
    serverUrl,
    ...(warning ? { warning } : {}),
  });
};
