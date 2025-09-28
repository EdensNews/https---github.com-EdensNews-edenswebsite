// Netlify Function: share-og
// Returns server-rendered HTML with Open Graph/Twitter meta for an article,
// then auto-redirects users to the SPA route.

export const handler = async (event) => {
  try {
    const id = event.queryStringParameters?.id || '';
    if (!id) {
      return htmlResponse(400, '<h1>Missing id</h1>');
    }

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return htmlResponse(500, '<h1>Server not configured</h1>');
    }

    // Fetch the article via PostgREST
    const apiUrl = `${SUPABASE_URL}/rest/v1/articles?id=eq.${encodeURIComponent(id)}&select=*`;
    const res = await fetch(apiUrl, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!res.ok) {
      return htmlResponse(404, '<h1>Article not found</h1>');
    }

    const rows = await res.json();
    const article = Array.isArray(rows) && rows.length ? rows[0] : null;
    if (!article) {
      return htmlResponse(404, '<h1>Article not found</h1>');
    }

    // Build fields
    const title = article.title_en || article.title_kn || 'Edens News';
    const description = stripHtml(article.content_en || article.content_kn || '').slice(0, 160) || 'Edens News';

    // Ensure absolute image URL
    const siteOrigin = process.env.PUBLIC_SITE_ORIGIN || 'https://edensnews.netlify.app';
    const imageAbsolute = (article.image_url && /^https?:/i.test(article.image_url))
      ? article.image_url
      : `${siteOrigin}${article.image_url || ''}`;

    const canonical = `${siteOrigin}/articledetail?id=${encodeURIComponent(id)}`;

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} | Edens News</title>
  <link rel="canonical" href="${canonical}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Edens News" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  ${imageAbsolute ? `<meta property="og:image" content="${escapeAttr(imageAbsolute)}" />` : ''}
  ${imageAbsolute ? `<meta property="og:image:secure_url" content="${escapeAttr(imageAbsolute)}" />` : ''}

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  ${imageAbsolute ? `<meta name="twitter:image" content="${escapeAttr(imageAbsolute)}" />` : ''}

  <meta http-equiv="refresh" content="0; url=${canonical}" />
  <script>window.location.replace(${JSON.stringify(canonical)});</script>
</head>
<body>
  <noscript>
    <a href="${canonical}">Continue to article</a>
  </noscript>
</body>
</html>`;

    return htmlResponse(200, html, { 'Cache-Control': 'public, max-age=300' });
  } catch (err) {
    return htmlResponse(500, `<h1>Error</h1><pre>${escapeHtml(String(err?.message || err))}</pre>`);
  }
};

function htmlResponse(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      ...extraHeaders,
    },
    body,
  };
}

function stripHtml(html) {
  return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s) {
  return escapeHtml(s);
}
