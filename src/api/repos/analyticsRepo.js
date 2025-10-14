import { supabase } from '@/api/supabaseClient'

const TABLE = 'article_views'

export const analyticsRepo = {
  async countAll() {
    try {
      const { count, error } = await supabase
        .from(TABLE)
        .select('*', { count: 'exact', head: true })
      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Failed to count views:', error)
      return 0
    }
  },

  async listRecent(limit = 10) {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('viewed_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to list recent views:', error)
      return []
    }
  },

  async countDistinctUsers() {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('user_id')
        .not('user_id', 'is', null)
      if (error) throw error
      const unique = new Set((data || []).map(r => r.user_id))
      return unique.size
    } catch (error) {
      console.error('Failed to count distinct users:', error)
      return 0
    }
  },
  async trackView(articleId, userId = null) {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .insert({
          article_id: articleId,
          user_id: userId,
          viewed_at: new Date().toISOString(),
          ip_address: null, // We'll get this from the client if needed
          user_agent: navigator.userAgent
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to track view:', error)
      return null
    }
  },

  async getViewCount(articleId) {
    try {
      const { count, error } = await supabase
        .from(TABLE)
        .select('*', { count: 'exact', head: true })
        .eq('article_id', articleId)
      
      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Failed to get view count:', error)
      return 0
    }
  },

  async getViewCounts(articleIds) {
    try {
      // Use PostgreSQL API to get view counts
      const API_URL = 'https://api.edensnews.com/api';
      const response = await fetch(`${API_URL}/analytics/view-counts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ article_ids: articleIds })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch view counts');
      }
      
      const counts = await response.json();
      return counts || {};
    } catch (error) {
      console.error('Failed to get view counts:', error)
      return {}
    }
  }
}
