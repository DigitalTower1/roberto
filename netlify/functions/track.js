'use strict';

const json = (status, payload) => ({
  statusCode: status,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  },
  body: JSON.stringify(payload),
});

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'POST') return json(405, { message: 'Metodo non consentito' });

  try {
    const payload = JSON.parse(event.body || '{}');
    // Log su console (visibile nei log Netlify)
    console.log('TRACK:', {
      ...payload,
      ip: event.headers['x-nf-client-connection-ip'] || 'unknown',
      ua: event.headers['user-agent'] || 'unknown',
      ts: new Date().toISOString(),
    });
    // 204 No Content per beacon
    return { statusCode: 204 };
  } catch {
    return json(400, { message: 'Payload non valido' });
  }
};
