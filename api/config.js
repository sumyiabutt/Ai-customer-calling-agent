'use strict';

const { json, sb, publicKeyIssue } = require('./_lib');
const { findAssistantId } = require('./_assistant');

let cached = { id: '', at: 0 };

async function resolveAssistantId() {
  if (cached.id && Date.now() - cached.at < 60000) return cached.id;
  const id = await findAssistantId();
  if (id) cached = { id, at: Date.now() };
  return id;
}

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

  if (!assistantId) {
    assistantId = await resolveAssistantId();
  }

  const keyIssue = publicKeyIssue(publicKey);

  json(res, 200, {
    configured: Boolean(assistantId) && !keyIssue,
    publicKey,
    assistantId,
    keyIssue,
  });
};
