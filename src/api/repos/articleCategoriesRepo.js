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
      const { error } = await supabase
        .from(TABLE)
        .upsert({ article_id, category_id }, { onConflict: 'article_id,category_id' })
      if (error) throw error
      return true
    } catch (error) {
      console.error('[articleCategoriesRepo] link error:', error)
      throw error
    }
  }
}