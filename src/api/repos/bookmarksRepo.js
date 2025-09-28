import { supabase } from '@/api/supabaseClient'

const TABLE = 'bookmarks'

export const bookmarksRepo = {
  async isBookmarked(userId, articleId) {
    if (!userId || !articleId) return false
    const { data, error } = await supabase
      .from(TABLE)
      .select('id')
      .eq('user_id', userId)
      .eq('article_id', articleId)
      .maybeSingle()
    if (error && error.code !== 'PGRST116') throw error
    return !!data
  },

  async add(userId, articleId) {
    const { error } = await supabase.from(TABLE).insert({ user_id: userId, article_id: articleId })
    if (error) throw error
    return true
  },

  async remove(userId, articleId) {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('user_id', userId)
      .eq('article_id', articleId)
    if (error) throw error
    return true
  }
}
