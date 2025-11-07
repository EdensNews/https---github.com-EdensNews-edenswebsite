exports.handler = async (event) => {
  try {
    // CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'content-type'
        }
      };
    }

    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, headers: { 'Access-Control-Allow-Origin': '*' }, body: 'Method Not Allowed' };
    }

    const GOOGLE_TTS_API_KEY = process.env.GOOGLE_TTS_API_KEY || process.env.VITE_GOOGLE_TTS_API_KEY;
    if (!GOOGLE_TTS_API_KEY) {
      return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: 'Missing GOOGLE_TTS_API_KEY' };
    }

    const { requestBody } = JSON.parse(event.body || '{}');
    if (!requestBody || !requestBody.input || !requestBody.voice || !requestBody.audioConfig) {
      return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: 'Invalid request body' };
    }

    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(GOOGLE_TTS_API_KEY)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const text = await res.text();
    return {
      statusCode: res.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: text
    };
  } catch (e) {
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: e?.message || String(e) }) };
  }
};
