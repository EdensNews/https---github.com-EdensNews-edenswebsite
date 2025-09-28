// Lightweight client-side RSS fetcher with multiple CORS proxy fallbacks.
// Returns: { data: { articles: Array }, error?: string }
export const fetchRss = async ({ url }) => {
  try {
    if (!url) throw new Error('RSS url is required');
    
    // List of CORS proxies to try
    const proxies = [
      'https://api.allorigins.win/raw?url=',
      'https://corsproxy.io/?',
      'https://thingproxy.freeboard.io/fetch/'
    ];
    
    // Helper function to fetch with timeout
    const fetchWithTimeout = async (url, timeout = 10000) => {
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
    
    let response = null;
    let error = null;
    
    // Try each proxy until one works
    for (const proxy of proxies) {
      try {
        const proxiedUrl = proxy + encodeURIComponent(url);
        response = await fetchWithTimeout(proxiedUrl);
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
        response = await fetchWithTimeout(url);
      } catch (err) {
        throw error || err || new Error('All CORS proxies failed');
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
      // Try common media tags
      const mediaContent = item.querySelector('media\\:content, content')?.getAttribute('url') || '';
      const enclosureUrl = item.querySelector('enclosure')?.getAttribute('url') || '';
      const image_url = mediaContent || enclosureUrl;
      return { title, link, pubDate, description, image_url };
    });
    return { data: { articles } };
  } catch (err) {
    console.error('[fetchRss] failed', err);
    return { data: { articles: [] }, error: err?.message || 'Failed to fetch RSS' };
  }
}