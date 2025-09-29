exports.handler = async (event) => {
	try {
		if (event.httpMethod !== 'POST') {
			return { statusCode: 405, body: 'Method Not Allowed' };
		}
		const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
		if (!GEMINI_API_KEY) {
			return { statusCode: 500, body: 'Missing GEMINI_API_KEY' };
		}
		const { model, apiVersion = 'v1', body } = JSON.parse(event.body || '{}');
		if (!model || !body) {
			return { statusCode: 400, body: 'Missing model or body' };
		}
		const url = `https://generativelanguage.googleapis.com/${encodeURIComponent(apiVersion)}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		const text = await res.text();
		return {
			statusCode: res.status,
			headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
			body: text
		};
	} catch (e) {
		return { statusCode: 500, body: JSON.stringify({ error: e?.message || String(e) }) };
	}
};
