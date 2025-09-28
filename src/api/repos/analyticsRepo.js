import { supabase } from '@/api/supabaseClient'

const TABLE = 'article_views'

export const analyticsRepo = {
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
      const { data, error } = await supabase
        .from(TABLE)
        .select('article_id')
        .in('article_id', articleIds)
      
      if (error) throw error
      
      // Count views per article
      const counts = {}
      data.forEach(view => {
        counts[view.article_id] = (counts[view.article_id] || 0) + 1
      })
      
      return counts
    } catch (error) {
      console.error('Failed to get view counts:', error)
      return {}
    }
  }
}
