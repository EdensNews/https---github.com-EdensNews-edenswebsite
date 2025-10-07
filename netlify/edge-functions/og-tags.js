export default async (request, context) => {
  const url = new URL(request.url);
  
  // Only handle article detail pages
  if (!url.pathname.includes('/articledetail')) {
    return context.next();
  }
  
  // Get article ID from query params
  const articleId = url.searchParams.get('id');
  if (!articleId) {
    return context.next();
  }
  
  try {
    // Fetch article data from API
    const apiUrl = 'https://api.edensnews.com/api';
    const response = await fetch(`${apiUrl}/articles/${articleId}`);
    
    if (!response.ok) {
      return context.next();
    }
    
    const article = await response.json();
    
    // Get the original HTML
    const originalResponse = await context.next();
    const html = await originalResponse.text();
    
    // Prepare meta tags
    const title = article.title_en || article.title_kn || 'Edens News';
    const description = (article.content_en || article.content_kn || '').replace(/<[^>]+>/g, '').slice(0, 160);
    const imageUrl = article.image_url || 'https://edensnews.com/default-article-image.jpg';
    const articleUrl = `https://edensnews.com/articledetail?id=${articleId}`;
    
    // Inject meta tags into HTML
    const metaTags = `
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
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <title>${title} | Edens News</title>
    `;
    
    // Replace default meta tags with article-specific ones
    const modifiedHtml = html.replace('</head>', `${metaTags}</head>`);
    
    return new Response(modifiedHtml, {
      headers: {
        'content-type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error in OG tags edge function:', error);
    return context.next();
  }
};

export const config = {
  path: '/articledetail',
};
