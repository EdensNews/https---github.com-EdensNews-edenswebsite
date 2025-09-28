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
  }
}