export default async (request, context) => {
  const url = new URL(request.url);
  
  // Get article ID from query params
  const articleId = url.searchParams.get('id');
  
  // Only process if we have an article ID
  if (!articleId) {
    return context.next();
  }
  
  // Check if this is a bot/crawler (Facebook, WhatsApp, Twitter, etc.)
  const userAgent = request.headers.get('user-agent') || '';
  const isCrawler = /bot|crawler|spider|facebook|facebookexternalhit|whatsapp|twitter|telegram|slack|linkedinbot|pinterest/i.test(userAgent);
  
  console.log('User-Agent:', userAgent, 'Is Crawler:', isCrawler);
  
  // Always inject meta tags for article pages (removed crawler check to fix Facebook issue)
  // The Edge Function will run for all requests with article IDs
  
  try {
    // Fetch article data from API
    const apiUrl = 'https://api.edensnews.com/api';
    const response = await fetch(`${apiUrl}/articles/${articleId}`);
    
    if (!response.ok) {
      return context.next();
    }
    
    const article = await response.json();
    
    // Log for debugging
    console.log('Article data:', { id: articleId, image_url: article.image_url, title: article.title_en || article.title_kn });
    
    // Get the original HTML from the built index.html directly
    // Don't use context.next() as it may cause redirect issues
    const indexResponse = await fetch(`${url.origin}/index.html`);
    const html = await indexResponse.text();
    
    // Prepare meta tags
    const title = article.title_en || article.title_kn || 'Edens News';
    const description = (article.content_en || article.content_kn || '').replace(/<[^>]+>/g, '').slice(0, 160);
    
    // Ensure image URL is absolute and valid
    let imageUrl = article.image_url;
    if (!imageUrl || imageUrl === '') {
      imageUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ad7ff9cf8628b96fa8c1c8/703b84b08_GeneratedImageAugust282025-9_11PM.png';
    } else if (!imageUrl.startsWith('http')) {
      // If relative URL, make it absolute
      imageUrl = `https://edensnews.com${imageUrl}`;
    }
    
    console.log('Using image URL:', imageUrl);
    
    const articleUrl = `https://edensnews.com/articledetail?id=${articleId}`;
    
    // Remove existing OG tags from index.html to avoid conflicts
    let modifiedHtml = html
      .replace(/<meta property="og:type"[^>]*>/gi, '')
      .replace(/<meta property="og:url"[^>]*>/gi, '')
      .replace(/<meta property="og:title"[^>]*>/gi, '')
      .replace(/<meta property="og:description"[^>]*>/gi, '')
      .replace(/<meta property="og:image"[^>]*>/gi, '')
      .replace(/<meta property="og:site_name"[^>]*>/gi, '')
      .replace(/<meta property="og:locale"[^>]*>/gi, '')
      .replace(/<meta name="twitter:card"[^>]*>/gi, '')
      .replace(/<meta name="twitter:title"[^>]*>/gi, '')
      .replace(/<meta name="twitter:description"[^>]*>/gi, '')
      .replace(/<meta name="twitter:image"[^>]*>/gi, '')
      .replace(/<title>[^<]*<\/title>/gi, '');
    
    // Inject article-specific meta tags
    const metaTags = `
    <title>${title} | Edens News</title>
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${articleUrl}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:secure_url" content="${imageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:site_name" content="Edens News" />
    <meta property="og:locale" content="en_IN" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
    `;
    
    // Insert new meta tags before </head>
    modifiedHtml = modifiedHtml.replace('</head>', `${metaTags}</head>`);
    
    return new Response(modifiedHtml, {
      headers: {
        'content-type': 'text/html',
        'cache-control': 'public, max-age=0, must-revalidate',
      },
      status: 200,
    });
  } catch (error) {
    console.error('Error in OG tags edge function:', error);
    return context.next();
  }
};

export const config = {
  path: '/*',
};
