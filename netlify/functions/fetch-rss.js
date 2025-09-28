const https = require('https');
const http = require('http');
const { parseString } = require('xml2js');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { url } = event.queryStringParameters || {};
    
    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'URL parameter is required' })
      };
    }

    // Fetch RSS feed
    const rssData = await fetchRSSFeed(url);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ data: { articles: rssData } })
    };
  } catch (error) {
    console.error('RSS fetch error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch RSS feed',
        details: error.message 
      })
    };
  }
};

function fetchRSSFeed(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          parseString(data, (err, result) => {
            if (err) {
              reject(new Error('Failed to parse XML: ' + err.message));
              return;
            }
            
            const items = result.rss?.channel?.[0]?.item || [];
            const articles = items.map(item => {
              const getText = (path) => {
                const element = item[path];
                return element ? element[0] : '';
              };
              
              const getGuid = () => {
                const guid = getText('guid');
                return guid || getText('link') || '';
              };
              
              const getImageUrl = () => {
                const enclosure = getText('enclosure');
                const mediaContent = getText('media:content');
                const mediaThumbnail = getText('media:thumbnail');
                
                if (enclosure && enclosure[0] && enclosure[0].$) {
                  return enclosure[0].$.url || '';
                }
                if (mediaContent && mediaContent[0] && mediaContent[0].$) {
                  return mediaContent[0].$.url || '';
                }
                if (mediaThumbnail && mediaThumbnail[0] && mediaThumbnail[0].$) {
                  return mediaThumbnail[0].$.url || '';
                }
                return '';
              };
              
              // Generate content hash for deduplication
              const title = getText('title');
              const description = getText('description');
              const contentHash = require('crypto')
                .createHash('sha256')
                .update(`${title}|${description}`)
                .digest('hex');
              
              return {
                id: getGuid(),
                guid: getGuid(),
                title: title,
                link: getText('link'),
                pubDate: getText('pubDate'),
                description: description,
                image_url: getImageUrl(),
                contentHash: contentHash
              };
            });
            
            resolve(articles);
          });
        } catch (parseError) {
          reject(new Error('Failed to parse RSS: ' + parseError.message));
        }
      });
    }).on('error', (error) => {
      reject(new Error('Network error: ' + error.message));
    });
  });
}
