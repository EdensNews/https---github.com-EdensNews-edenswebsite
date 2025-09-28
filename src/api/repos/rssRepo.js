import { supabase } from '@/api/supabaseClient'

const TABLE = 'rss_feeds'

export const rssRepo = {
  async list({ limit = 100, offset = 0 } = {}) {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[rssRepo] list error:', error)
      throw error
    }
  },

  async create(feed) {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .insert({ source_name: feed.name, url: feed.url, is_active: true })
        .select()
        .maybeSingle()
      if (error) throw error
      return data
    } catch (error) {
      console.error('[rssRepo] create error:', error)
      throw error
    }
  },

  async update(id, updates) {
    try {
      // Ensure we're only updating allowed fields
      const allowedUpdates = {};
      const allowedFields = ['source_name', 'url', 'is_active', 'last_fetched_at', 'updated_at'];
      
      for (const key in updates) {
        if (allowedFields.includes(key)) {
          allowedUpdates[key] = updates[key];
        }
      }
      
      // Add updated_at timestamp
      allowedUpdates.updated_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from(TABLE)
        .update(allowedUpdates)
        .eq('id', id)
        .select()
        .maybeSingle()
      if (error) throw error
      return data
    } catch (error) {
      console.error('[rssRepo] update error:', error)
      throw error
    }
  },

  async remove(id) {
    try {
      const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq('id', id)
      if (error) throw error
      return true
    } catch (error) {
      console.error('[rssRepo] remove error:', error)
      throw error
    }
  },

  // RSS deduplication methods - comprehensive check
  async checkArticleProcessed(feedId, articleId, guid = null, link = null) {
    try {
      // First check the processed articles table
      const { data: processedData, error: processedError } = await supabase
        .from('rss_processed_articles')
        .select('id')
        .eq('rss_feed_id', feedId)
        .or(`rss_article_id.eq.${articleId},rss_guid.eq.${guid || ''},rss_link.eq.${link || ''}`)
        .limit(1)
      
      if (processedData && processedData.length > 0) {
        return true // Article already processed
      }
      
      // Then check if article exists in the articles table with RSS tracking
      const { data: articleData, error: articleError } = await supabase
        .from('articles')
        .select('id')
        .eq('is_rss_import', true)
        .or(`rss_article_id.eq.${articleId},rss_guid.eq.${guid || ''},rss_link.eq.${link || ''}`)
        .limit(1)
      
      if (articleData && articleData.length > 0) {
        return true // Article already exists in database
      }
      
      return false // Article is new
    } catch (error) {
      console.error('[rssRepo] checkArticleProcessed error:', error)
      // Fallback: allow article if check fails
      return false
    }
  },

  // Check articles against existing database content to prevent duplicates
  async checkMultipleArticlesProcessed(feedId, articles) {
    try {
      if (!articles || articles.length === 0) return []
      
      console.log(`RSS Feed ${feedId}: Checking ${articles.length} articles against database`)
      
      // Get all existing article titles and content from database
      const { data: existingArticles, error } = await supabase
        .from('articles')
        .select('title_kn, title_en, content_kn, content_en')
        .eq('status', 'published')
      
      if (error) {
        console.warn('Could not fetch existing articles, showing all RSS articles:', error)
        return articles
      }
      
      // Create sets of existing titles and content for fast lookup
      const existingTitles = new Set()
      const existingContent = new Set()
      
      if (existingArticles) {
        existingArticles.forEach(article => {
          // Add all possible title variations
          if (article.title_kn) existingTitles.add(article.title_kn.toLowerCase().trim())
          if (article.title_en) existingTitles.add(article.title_en.toLowerCase().trim())
          
          // Add content snippets for comparison (first 100 chars)
          if (article.content_kn) {
            const contentSnippet = article.content_kn.replace(/<[^>]*>/g, '').substring(0, 100).toLowerCase().trim()
            if (contentSnippet) existingContent.add(contentSnippet)
          }
          if (article.content_en) {
            const contentSnippet = article.content_en.replace(/<[^>]*>/g, '').substring(0, 100).toLowerCase().trim()
            if (contentSnippet) existingContent.add(contentSnippet)
          }
        })
      }
      
      // Filter out articles that match existing content
      const newArticles = articles.filter(rssArticle => {
        const rssTitle = (rssArticle.title || '').toLowerCase().trim()
        const rssContent = (rssArticle.description || '').replace(/<[^>]*>/g, '').substring(0, 100).toLowerCase().trim()
        
        // Check if title matches any existing article
        if (existingTitles.has(rssTitle)) {
          console.log(`Duplicate title found: "${rssArticle.title}"`)
          return false
        }
        
        // Check if content snippet matches any existing article
        if (rssContent && existingContent.has(rssContent)) {
          console.log(`Duplicate content found in: "${rssArticle.title}"`)
          return false
        }
        
        return true // This is a new article
      })
      
      console.log(`Found ${newArticles.length} new articles out of ${articles.length} total (filtered ${articles.length - newArticles.length} duplicates)`)
      return newArticles
      
    } catch (error) {
      console.error('[rssRepo] checkMultipleArticlesProcessed error:', error)
      return articles // Return all articles if check fails
    }
  },

  async getNewArticles(feedId, limit = 50) {
    try {
      const { data, error } = await supabase
        .rpc('get_new_rss_articles', {
          p_rss_feed_id: feedId,
          p_limit: limit
        })
      
      if (error && error.code === '42883') {
        // Function doesn't exist, return empty array
        console.warn('RSS getNewArticles function not found')
        return []
      }
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[rssRepo] getNewArticles error:', error)
      return []
    }
  },

  async markArticleAsProcessed(feedId, articleData, articleId = null) {
    try {
      const processedData = {
        rss_feed_id: feedId,
        rss_source_url: articleData.link || '',
        rss_article_id: articleData.id || articleData.guid || articleData.link,
        rss_guid: articleData.guid || null,
        rss_link: articleData.link || '',
        rss_title: articleData.title || '',
        rss_pub_date: articleData.pubDate ? new Date(articleData.pubDate).toISOString() : null,
        is_processed: true,
        processed_at: new Date().toISOString(),
        article_id: articleId,
        content_hash: articleData.contentHash || null
      }

      const { data, error } = await supabase
        .from('rss_processed_articles')
        .upsert(processedData, { 
          onConflict: 'rss_feed_id,rss_article_id',
          ignoreDuplicates: false 
        })
        .select()
        .maybeSingle()

      if (error && error.code === '42P01') {
        // Table doesn't exist, skip tracking
        console.warn('RSS processed articles table not found, skipping tracking')
        return null
      }
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('[rssRepo] markArticleAsProcessed error:', error)
      // Don't throw error, just log it
      return null
    }
  },

  // Simplified pre-population - skip for now to avoid issues
  async prePopulateProcessedArticles(feedId, articles) {
    try {
      if (!articles || articles.length === 0) return
      
      console.log(`RSS Feed ${feedId}: Skipping pre-population to avoid deduplication issues`)
      
      // Skip pre-population for now to ensure all articles are shown
      return
      
    } catch (error) {
      console.error('[rssRepo] prePopulateProcessedArticles error:', error)
      // Don't throw error, just log it
    }
  },

  async getProcessedArticles(feedId, limit = 100) {
    try {
      const { data, error } = await supabase
        .from('rss_processed_articles')
        .select('*')
        .eq('rss_feed_id', feedId)
        .eq('is_processed', true)
        .order('processed_at', { ascending: false })
        .limit(limit)
      
      if (error && error.code === '42P01') {
        // Table doesn't exist, return empty array
        console.warn('RSS processed articles table not found')
        return []
      }
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[rssRepo] getProcessedArticles error:', error)
      return []
    }
  }
}