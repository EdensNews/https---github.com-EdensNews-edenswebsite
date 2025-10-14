// Netlify Function to generate dynamic sitemap
export const handler = async (event) => {
  try {
    const API_URL = 'https://api.edensnews.com/api';
    
    // Fetch all published articles
    const response = await fetch(`${API_URL}/articles?limit=1000&status=published`);
    const articles = await response.json();
    
    // Generate sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  
  <!-- Homepage -->
  <url>
    <loc>https://edensnews.com/</loc>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>
  
  <!-- Category Pages -->
  <url>
    <loc>https://edensnews.com/category/Politics</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://edensnews.com/category/Sports</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://edensnews.com/category/Business</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://edensnews.com/category/Entertainment</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://edensnews.com/category/Technology</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://edensnews.com/category/Karnataka</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://edensnews.com/category/World</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- Article Pages -->
${articles.map(article => {
  const articleUrl = `https://edensnews.com/articledetail?id=${article.id}`;
  const lastmod = article.updated_at || article.created_at || new Date().toISOString();
  const title = (article.title_en || article.title_kn || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const imageUrl = article.image_url || '';
  
  return `  <url>
    <loc>${articleUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    <news:news>
      <news:publication>
        <news:name>Edens News</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${article.published_at || article.created_at}</news:publication_date>
      <news:title>${title}</news:title>
    </news:news>
    ${imageUrl ? `<image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:title>${title}</image:title>
    </image:image>` : ''}
  </url>`;
}).join('\n')}
  
</urlset>`;
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
      body: sitemap,
    };
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return {
      statusCode: 500,
      body: 'Error generating sitemap',
    };
  }
};
