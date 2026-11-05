'use strict';

const { json, sb } = require('./_lib');

const SELECT =
  'id,vapi_call_id,started_at,ended_at,duration_seconds,caller_phone,customer_name,' +
  'transcript,turns,summary,outcome,ended_reason,handoff,created_at';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const id = (req.query && req.query.id) || '';
  try {
    if (id) {
      if (!UUID.test(id)) {
        return json(res, 400, { error: 'Invalid call id' });
      }
      const rows = await sb(`live_calls?id=eq.${id}&select=${SELECT}`);
      if (!rows || !rows.length) {
        return json(res, 404, { error: 'Call not found' });
      }
      return json(res, 200, { call: rows[0] });
    }

    const rows = await sb(
      `live_calls?select=${SELECT}&order=created_at.desc&limit=100`
    );
    json(res, 200, { calls: rows || [] });
  } catch (error) {
    json(res, 502, { error: error.message });
  }
};
