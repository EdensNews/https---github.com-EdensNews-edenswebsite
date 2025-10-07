// Netlify Function: share-og
// Returns server-rendered HTML with Open Graph/Twitter meta for an article,
// then auto-redirects users to the SPA route.
/* eslint-env node */

export const handler = async (event) => {
  try {
    const id = event.queryStringParameters?.id || '';
    if (!id) {
      return htmlResponse(400, '<h1>Missing id</h1>');
    }

    // Fetch the article from PostgreSQL API
    const apiUrl = `https://api.edensnews.com/api/articles/${encodeURIComponent(id)}`;
    const res = await fetch(apiUrl);

    if (!res.ok) {
      return htmlResponse(404, '<h1>Article not found</h1>');
    }

    const article = await res.json();
    if (!article || !article.id) {
      return htmlResponse(404, '<h1>Article not found</h1>');
    }

    // Build fields
    const title = article.title_en || article.title_kn || 'Edens News';
    const description = stripHtml(article.content_en || article.content_kn || '').slice(0, 160) || 'Edens News';

    // Ensure absolute image URL - prioritize direct image access for better Facebook compatibility
    const siteOrigin = 'https://edensnews.com';
    let imageAbsolute = null;

    if (article.image_url) {
      if (/^https?:/i.test(article.image_url)) {
        // Already absolute URL - use directly for better Facebook compatibility
        imageAbsolute = article.image_url;
      } else {
        // Relative URL, make it absolute
        imageAbsolute = `${siteOrigin}${article.image_url.startsWith('/') ? '' : '/'}${article.image_url}`;
      }
    } else {
      // Fallback to a default image if article has no image
      imageAbsolute = `https://base44.com/logo_v2.svg`;
    }

    const canonical = `${siteOrigin}/articledetail?id=${encodeURIComponent(id)}`;
    
    // Add a note for development
    const isDevelopment = siteOrigin.includes('localhost') || siteOrigin.includes('127.0.0.1');

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
  ${imageAbsolute ? `<meta property="og:image:width" content="1200" />` : ''}
  ${imageAbsolute ? `<meta property="og:image:height" content="630" />` : ''}
  ${imageAbsolute ? `<meta property="og:image:alt" content="${escapeHtml(title)}" />` : ''}

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  ${imageAbsolute ? `<meta name="twitter:image" content="${escapeAttr(imageAbsolute)}" />` : ''}
  ${imageAbsolute ? `<meta name="twitter:image:alt" content="${escapeHtml(title)}" />` : ''}

  <meta http-equiv="refresh" content="0; url=${canonical}" />
  <script>window.location.replace(${JSON.stringify(canonical)});</script>
</head>
<body>
  <noscript>
    <a href="${canonical}">Continue to article</a>
  </noscript>
  ${isDevelopment ? `<div style="position: fixed; top: 10px; right: 10px; background: #ff6b6b; color: white; padding: 10px; border-radius: 5px; font-family: Arial; font-size: 12px; z-index: 9999;">Development Mode - OG Preview<br>Image: ${imageAbsolute || 'None'}<br>Title: ${title}</div>` : ''}
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
