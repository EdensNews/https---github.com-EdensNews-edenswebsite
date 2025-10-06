import { supabase } from '@/api/supabaseClient'

const TABLE = 'article_categories'

export const articleCategoriesRepo = {
  async listForArticles(articleIds = []) {
    if (!articleIds || articleIds.length === 0) return []
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('article_id, category_id, categories:category_id ( id, name, slug )')
        .in('article_id', articleIds)
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[articleCategoriesRepo] listForArticles error:', error)
      throw error
    }
  },

  async link(article_id, category_id) {
    try {
      // Use API endpoint instead of Supabase
      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.edensnews.com/api';
      const response = await fetch(`${apiUrl}/article-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id, category_id })
      });
      
      if (!response.ok) {
        throw new Error('Failed to link category');
      }
      
      return true;
    } catch (error) {
      console.error('[articleCategoriesRepo] link error:', error)
      throw error
    }
  }
}