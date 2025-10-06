// Edens News - Express API Server for PostgreSQL
// This replaces Supabase's auto-generated API

import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 3001;

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'postgres',  // Using postgres database
  user: process.env.DB_USER || 'edensnews_user',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' })); // Increase payload limit for large articles with multiple images
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 60000; // 1 minute

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCache(key, data, ttl = CACHE_TTL) {
  cache.set(key, {
    data,
    expiry: Date.now() + ttl
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== ARTICLES API ====================

// Get articles with pagination
app.get('/api/articles', async (req, res) => {
  try {
    const { 
      limit = 20, 
      offset = 0, 
      status = 'published',
      category
    } = req.query;

    const cacheKey = `articles:${status}:${category || 'all'}:${limit}:${offset}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    let query;
    let params;

    if (category) {
      // Filter by category using article_categories join
      query = `
        SELECT DISTINCT a.id, a.title_en, a.title_kn, a.title_ta, a.title_te, a.title_hi, a.title_ml,
               a.reporter, a.image_url, a.status, a.created_at, a.published_at, a.is_breaking,
               c.name_en as category, c.name_kn as category_kn
        FROM articles a
        INNER JOIN article_categories ac ON a.id = ac.article_id
        INNER JOIN categories c ON ac.category_id = c.id
        WHERE a.status = $1 AND c.slug = $2
        ORDER BY a.published_at DESC 
        LIMIT $3 OFFSET $4
      `;
      params = [status, category, limit, offset];
    } else {
      // No category filter - use LEFT JOIN to get category if exists
      query = `
        SELECT a.id, a.title_en, a.title_kn, a.title_ta, a.title_te, a.title_hi, a.title_ml,
               a.reporter, a.image_url, a.status, a.created_at, a.published_at, a.is_breaking,
               c.name_en as category, c.name_kn as category_kn
        FROM articles a
        LEFT JOIN article_categories ac ON a.id = ac.article_id
        LEFT JOIN categories c ON ac.category_id = c.id
        WHERE a.status = $1
        ORDER BY a.published_at DESC 
        LIMIT $2 OFFSET $3
      `;
      params = [status, limit, offset];
    }

    const result = await pool.query(query, params);
    setCache(cacheKey, result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single article by ID
app.get('/api/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM articles WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create article
app.post('/api/articles', async (req, res) => {
  try {
    const article = req.body;
    const columns = Object.keys(article);
    const values = Object.values(article);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO articles (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update article
app.put('/api/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const setClause = Object.keys(updates)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ');
    
    const query = `
      UPDATE articles
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const values = [id, ...Object.values(updates)];
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete article
app.delete('/api/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete related records first (if they exist)
    await pool.query('DELETE FROM article_categories WHERE article_id = $1', [id]);
    await pool.query('DELETE FROM bookmarks WHERE article_id = $1', [id]);
    await pool.query('DELETE FROM article_views WHERE article_id = $1', [id]);
    
    // Delete the article
    const result = await pool.query('DELETE FROM articles WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search articles
app.get('/api/articles/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 20 } = req.query;
    
    const searchQuery = `
      SELECT a.id, a.title_en, a.title_kn, a.reporter, a.image_url, a.created_at,
             c.name_en as category, c.name_kn as category_kn
      FROM articles a
      LEFT JOIN article_categories ac ON a.id = ac.article_id
      LEFT JOIN categories c ON ac.category_id = c.id
      WHERE a.status = 'published'
        AND (
          a.title_en ILIKE $1 OR 
          a.title_kn ILIKE $1 OR
          a.content_en ILIKE $1 OR
          a.content_kn ILIKE $1
        )
      ORDER BY a.published_at DESC
      LIMIT $2
    `;
    
    const result = await pool.query(searchQuery, [`%${query}%`, limit]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching articles:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== CATEGORIES API ====================

app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name_en');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get article categories
app.get('/api/article-categories/:articleId', async (req, res) => {
  try {
    const { articleId } = req.params;
    const result = await pool.query(
      'SELECT * FROM article_categories WHERE article_id = $1',
      [articleId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Link article to category
app.post('/api/article-categories', async (req, res) => {
  try {
    const { article_id, category_id } = req.body;
    const result = await pool.query(
      'INSERT INTO article_categories (article_id, category_id) VALUES ($1, $2) ON CONFLICT (article_id, category_id) DO NOTHING RETURNING *',
      [article_id, category_id]
    );
    res.status(201).json(result.rows[0] || { article_id, category_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== BOOKMARKS API ====================

app.get('/api/bookmarks/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(`
      SELECT b.*, a.title_en, a.title_kn, a.image_url
      FROM bookmarks b
      JOIN articles a ON b.article_id = a.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `, [userId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bookmarks', async (req, res) => {
  try {
    const { user_id, article_id } = req.body;
    const result = await pool.query(
      'INSERT INTO bookmarks (user_id, article_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *',
      [user_id, article_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/bookmarks/:userId/:articleId', async (req, res) => {
  try {
    const { userId, articleId } = req.params;
    await pool.query('DELETE FROM bookmarks WHERE user_id = $1 AND article_id = $2', [userId, articleId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ANALYTICS API ====================

app.post('/api/analytics/view', async (req, res) => {
  try {
    const { article_id, user_id, ip_address, user_agent } = req.body;
    
    await pool.query(
      'INSERT INTO article_views (article_id, user_id, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
      [article_id, user_id, ip_address, user_agent]
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SETTINGS API ====================

app.get('/api/settings/site', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM site_settings ORDER BY created_at DESC LIMIT 1');
    res.json(result.rows[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/settings/stream', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stream_settings ORDER BY created_at DESC LIMIT 1');
    res.json(result.rows[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RSS FEEDS API ====================

app.get('/api/rss-feeds', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rss_feeds ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/rss-feeds', async (req, res) => {
  try {
    const { source_name, url, category_id, is_active } = req.body;
    const result = await pool.query(
      'INSERT INTO rss_feeds (source_name, url, category_id, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
      [source_name, url, category_id || null, is_active !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/rss-feeds/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { source_name, url, category_id, is_active } = req.body;
    const result = await pool.query(
      'UPDATE rss_feeds SET source_name = $1, url = $2, category_id = $3, is_active = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
      [source_name, url, category_id, is_active, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/rss-feeds/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM rss_feeds WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ANALYTICS VIEW COUNTS ====================

app.post('/api/analytics/view-counts', async (req, res) => {
  try {
    const { article_ids } = req.body;
    if (!article_ids || article_ids.length === 0) {
      return res.json({});
    }
    
    const result = await pool.query(
      'SELECT article_id, COUNT(*) as count FROM article_views WHERE article_id = ANY($1) GROUP BY article_id',
      [article_ids]
    );
    
    const counts = {};
    result.rows.forEach(row => {
      counts[row.article_id] = parseInt(row.count);
    });
    
    res.json(counts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== REACTIONS API ====================

app.get('/api/reactions/:articleId', async (req, res) => {
  try {
    const { articleId } = req.params;
    const result = await pool.query(
      'SELECT reaction_type, COUNT(*) as count FROM article_reactions WHERE article_id = $1 GROUP BY reaction_type',
      [articleId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reactions', async (req, res) => {
  try {
    const { article_id, user_id, reaction_type } = req.body;
    const result = await pool.query(
      'INSERT INTO article_reactions (article_id, user_id, reaction_type) VALUES ($1, $2, $3) ON CONFLICT (article_id, user_id) DO UPDATE SET reaction_type = $3 RETURNING *',
      [article_id, user_id, reaction_type]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SCHEDULE API ====================

app.get('/api/schedule', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM broadcast_schedule ORDER BY day_of_week, start_time');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/schedule', async (req, res) => {
  try {
    const schedule = req.body;
    const columns = Object.keys(schedule);
    const values = Object.values(schedule);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const result = await pool.query(
      `INSERT INTO broadcast_schedule (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/schedule/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const setClause = Object.keys(updates).map((key, i) => `${key} = $${i + 2}`).join(', ');
    
    const result = await pool.query(
      `UPDATE broadcast_schedule SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...Object.values(updates)]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/schedule/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM broadcast_schedule WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Edens News API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await pool.end();
  process.exit(0);
});
