'use strict';

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function body(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

async function sb(path, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Supabase environment variables are missing');
  }
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${text.slice(0, 300)}`);
  }
  return text ? JSON.parse(text) : null;
}

function maskSensitive(text) {
  return String(text || '')
    .replace(/\b\d{5}-\d{7}-\d\b/g, 'XXXXX-XXXXXXX-X')
    .replace(/\b(?:\d[ -]?){13,19}\b/g, (match) =>
      match.replace(/\d/g, 'X'));
}

function baseUrl(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `https://${host}`;
}

function publicKeyIssue(value) {
  const key = String(value || '').trim();
  if (!key) return 'empty';
  if (/^[\u2022\u00b7.\s]+$/.test(key)) return 'masked';
  if (!/^[A-Za-z0-9_-]{16,}$/.test(key)) return 'placeholder';
  return '';
}

module.exports = { json, body, sb, maskSensitive, baseUrl, publicKeyIssue };
