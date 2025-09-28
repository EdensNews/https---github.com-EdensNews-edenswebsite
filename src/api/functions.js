// RSS fetcher with server-side fallback and CORS proxy fallbacks
// Returns: { data: { articles: Array }, error?: string }
export const fetchRss = async ({ url }) => {
  try {
    if (!url) throw new Error('RSS url is required');
    
    // Helper function to fetch with timeout
    const fetchWithTimeout = async (url, timeout = 15000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    };
    
    // Try server-side function first (if deployed)
    try {
      const serverUrl = '/.netlify/functions/fetch-rss?url=' + encodeURIComponent(url);
      const response = await fetchWithTimeout(serverUrl, 10000);
      
      if (response.ok) {
        const result = await response.json();
        if (result.data && result.data.articles) {
          return result;
        }
      }
    } catch (serverError) {
      console.warn('Server-side RSS fetch failed, trying proxies:', serverError.message);
    }
    
    // Fallback to CORS proxies
    const proxies = [
      'https://api.allorigins.win/raw?url=',
      'https://cors-anywhere.herokuapp.com/',
      'https://api.codetabs.com/v1/proxy?quest=',
      'https://corsproxy.io/?'
    ];
    
    let response = null;
    let error = null;
    
    // Try each proxy until one works
    for (const proxy of proxies) {
      try {
        const proxiedUrl = proxy + encodeURIComponent(url);
        response = await fetchWithTimeout(proxiedUrl, 8000);
        if (response.ok) {
          break;
        }
      } catch (err) {
        error = err;
        continue;
      }
    }
    
    // If all proxies failed, try direct fetch (might work in some cases)
    if (!response || !response.ok) {
      try {
        response = await fetchWithTimeout(url, 5000);
      } catch (err) {
        throw error || err || new Error('All RSS fetch methods failed');
      }
    }
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'application/xml');
    
    // Check if the response is valid XML
    if (xml.querySelector('parsererror')) {
      throw new Error('Failed to parse RSS feed - invalid XML');
    }
    
    const items = Array.from(xml.querySelectorAll('item'));
    const articles = items.map((item) => {
      const get = (sel) => item.querySelector(sel)?.textContent || '';
      const title = get('title');
      const link = get('link');
      const pubDate = get('pubDate');
      // description may contain HTML
      const description = get('description');
      
      // Enhanced image extraction from multiple sources
      let image_url = '';
      
      // 1. Try media:content tags
      const mediaContent = item.querySelector('media\\:content, content')?.getAttribute('url') || '';
      if (mediaContent) image_url = mediaContent;
      
      // 2. Try enclosure tags
      const enclosureUrl = item.querySelector('enclosure')?.getAttribute('url') || '';
      if (enclosureUrl && !image_url) image_url = enclosureUrl;
      
      // 3. Try media:thumbnail tags
      const mediaThumbnail = item.querySelector('media\\:thumbnail')?.getAttribute('url') || '';
      if (mediaThumbnail && !image_url) image_url = mediaThumbnail;
      
      // 4. Extract from description HTML if no other image found
      if (!image_url && description) {
        const imgMatch = description.match(/<img[^>]+src="([^"]+)"/i);
        if (imgMatch && imgMatch[1]) {
          image_url = imgMatch[1];
        }
      }
      
      // 5. Try to find any img tag in the item
      if (!image_url) {
        const imgElement = item.querySelector('img');
        if (imgElement) {
          image_url = imgElement.getAttribute('src') || imgElement.getAttribute('data-src') || '';
        }
      }
      
      return { title, link, pubDate, description, image_url };
    });
    return { data: { articles } };
  } catch (err) {
    console.error('[fetchRss] failed', err);
    return { data: { articles: [] }, error: err?.message || 'Failed to fetch RSS' };
  }
}