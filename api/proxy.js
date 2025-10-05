// Vercel Serverless Function - API Proxy
// This proxies requests to your VPS with HTTPS

export default async function handler(req, res) {
  const { path } = req.query;
  const apiUrl = `http://143.244.143.239/api/${path || ''}`;
  
  try {
    const response = await fetch(apiUrl + (req.url.includes('?') ? '?' + req.url.split('?')[1] : ''), {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
