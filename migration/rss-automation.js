// RSS Automation Script for Edens News
// This script runs on the VPS via cron to automatically fetch and publish RSS articles

import fetch from 'node-fetch';
import pg from 'pg';
import dotenv from 'dotenv';
import { parseString } from 'xml2js';
import https from 'https';
import http from 'http';
import crypto from 'crypto';

dotenv.config({ path: './server.env' });

const { Pool } = pg;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'edensnews_user',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// LLM API configuration
const LLM_API_KEY = process.env.VITE_GEMINI_API_KEY;
const LLM_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Fetch RSS feed
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
                const enclosure = item.enclosure;
                if (enclosure && enclosure[0] && enclosure[0].$) {
                  return enclosure[0].$.url || '';
                }
                return '';
              };
              
              const title = getText('title');
              const description = getText('description');
              const contentHash = crypto
                .createHash('sha256')
                .update(`${title}|${description}`)
                .digest('hex');
              
              return {
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

// Translate content using Gemini
async function translateContent(text, targetLang) {
  const langNames = {
    kn: 'Kannada',
    en: 'English'
  };
  
  const prompt = `Translate the following text to ${langNames[targetLang]}. Maintain the same tone and style. Return only the translated text without any additional commentary:\n\n${text}`;
  
  try {
    const response = await fetch(`${LLM_API_URL}?key=${LLM_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });
    
    const data = await response.json();
    const translated = data.candidates?.[0]?.content?.parts?.[0]?.text || text;
    return translated.trim();
  } catch (error) {
    console.error(`Translation failed for ${targetLang}:`, error);
    return text; // Fallback to original
  }
}

// Check if article already exists
async function isArticleProcessed(feedId, guid, contentHash) {
  const result = await pool.query(
    'SELECT id FROM rss_processed_articles WHERE feed_id = $1 AND (guid = $2 OR content_hash = $3)',
    [feedId, guid, contentHash]
  );
  return result.rows.length > 0;
}

// Mark article as processed
async function markArticleProcessed(feedId, guid, contentHash, articleId) {
  await pool.query(
    'INSERT INTO rss_processed_articles (feed_id, guid, content_hash, article_id) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
    [feedId, guid, contentHash, articleId]
  );
}

// Get default category for feed
async function getFeedCategory(feedId) {
  const result = await pool.query(
    'SELECT default_category_id FROM rss_feeds WHERE id = $1',
    [feedId]
  );
  return result.rows[0]?.default_category_id || null;
}

// Process a single RSS article
async function processArticle(feedId, article, categoryId) {
  try {
    // Check if already processed
    const alreadyProcessed = await isArticleProcessed(feedId, article.guid, article.contentHash);
    if (alreadyProcessed) {
      console.log(`Skipping duplicate: ${article.title.substring(0, 50)}...`);
      return null;
    }
    
    console.log(`Processing: ${article.title.substring(0, 50)}...`);
    
    // Detect source language (assume English if not Kannada)
    const isKannada = /[\u0C80-\u0CFF]/.test(article.title);
    
    // Translate title and content
    let titleKn, titleEn, contentKn, contentEn;
    
    if (isKannada) {
      titleKn = article.title;
      titleEn = await translateContent(article.title, 'en');
      contentKn = article.description;
      contentEn = await translateContent(article.description, 'en');
    } else {
      titleEn = article.title;
      titleKn = await translateContent(article.title, 'kn');
      contentEn = article.description;
      contentKn = await translateContent(article.description, 'kn');
    }
    
    // Create article in database
    const articleResult = await pool.query(
      `INSERT INTO articles (
        title_en, title_kn, content_en, content_kn,
        image_url, reporter, status, published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id`,
      [
        titleEn,
        titleKn,
        contentEn,
        contentKn,
        article.image_url || '',
        'RSS Feed',
        'published'
      ]
    );
    
    const articleId = articleResult.rows[0].id;
    
    // Assign category if available
    if (categoryId) {
      await pool.query(
        'INSERT INTO article_categories (article_id, category_id) VALUES ($1, $2)',
        [articleId, categoryId]
      );
    }
    
    // Mark as processed
    await markArticleProcessed(feedId, article.guid, article.contentHash, articleId);
    
    console.log(`✓ Published: ${titleEn.substring(0, 50)}... (ID: ${articleId})`);
    return articleId;
  } catch (error) {
    console.error(`Error processing article:`, error);
    return null;
  }
}

// Main automation function
async function runRSSAutomation() {
  console.log('\n=== RSS Automation Started ===');
  console.log(`Time: ${new Date().toISOString()}\n`);
  
  try {
    // Get all active RSS feeds (using source_name as that's what exists in the actual DB)
    const feedsResult = await pool.query(
      'SELECT id, source_name, url, category_id FROM rss_feeds WHERE is_active = true'
    );
    
    const feeds = feedsResult.rows;
    console.log(`Found ${feeds.length} active RSS feeds\n`);
    
    let totalProcessed = 0;
    let totalPublished = 0;
    
    for (const feed of feeds) {
      console.log(`\n--- Processing feed: ${feed.source_name || 'Unknown'} ---`);
      
      try {
        // Fetch RSS articles
        const articles = await fetchRSSFeed(feed.url);
        console.log(`Fetched ${articles.length} articles from RSS`);
        
        // Process each article
        for (const article of articles) {
          totalProcessed++;
          const articleId = await processArticle(feed.id, article, feed.category_id);
          if (articleId) {
            totalPublished++;
          }
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Update feed's last_fetched_at
        await pool.query(
          'UPDATE rss_feeds SET last_fetched_at = NOW() WHERE id = $1',
          [feed.id]
        );
        
      } catch (error) {
        console.error(`Error processing feed ${feed.source_name || 'Unknown'}:`, error.message);
      }
    }
    
    console.log(`\n=== RSS Automation Completed ===`);
    console.log(`Total articles processed: ${totalProcessed}`);
    console.log(`New articles published: ${totalPublished}`);
    console.log(`Duplicates skipped: ${totalProcessed - totalPublished}`);
    console.log(`Time: ${new Date().toISOString()}\n`);
    
  } catch (error) {
    console.error('RSS Automation Error:', error);
  } finally {
    await pool.end();
  }
}

// Run the automation
runRSSAutomation().catch(console.error);
