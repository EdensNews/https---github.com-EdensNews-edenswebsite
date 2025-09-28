import { supabase } from '@/api/supabaseClient'
import { articleCategoriesRepo } from '@/api/repos/articleCategoriesRepo'

const TABLE = 'articles'

export const articlesRepo = {
  async _enrichWithCategory(rows) {
    if (!rows || rows.length === 0) return []
    const ids = rows.map(r => r.id).filter(Boolean)
    if (ids.length === 0) return rows
    const joins = await articleCategoriesRepo.listForArticles(ids)
    const map = new Map()
    for (const j of joins) {
      const aId = j.article_id
      const cat = j.categories
      if (!map.has(aId) && cat) {
        // Prefer slug, fallback to name
        map.set(aId, cat.slug || cat.name || null)
      }
    }
    return rows.map(r => ({ ...r, category: map.get(r.id) || r.category || null }))
  },
  async list({ limit = 20, offset = 0, status = 'published' } = {}) {
    const query = supabase
      .from(TABLE)
      .select('*')
      .eq('status', status)
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)
    const { data, error } = await query
    if (error) throw error
    return await this._enrichWithCategory(data || [])
  },

  async listByCategory(slug, { limit = 20, offset = 0 } = {}) {
    // Join via article_categories and categories
    const { data, error } = await supabase
      .from('articles')
      .select('*, article_categories!inner(category_id), categories:article_categories(category_id, categories!inner(slug))')
      .eq('status', 'published')
      .eq('categories.slug', slug)
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)
    if (error) throw error
    return await this._enrichWithCategory(data || [])
  },

  async search(q, { limit = 20, offset = 0 } = {}) {
    // Search English/Kannada titles and content
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .or(
        `title_en.ilike.%${q}%,title_kn.ilike.%${q}%,content_en.ilike.%${q}%,content_kn.ilike.%${q}%`
      )
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)
    if (error) throw error
    return data || []
  },

  async searchByCategory(q, slug, { limit = 20, offset = 0 } = {}) {
    const { data, error } = await supabase
      .from('articles')
      .select('*, article_categories!inner(category_id), categories:article_categories(category_id, categories!inner(slug))')
      .or(
        `title_en.ilike.%${q}%,title_kn.ilike.%${q}%,content_en.ilike.%${q}%,content_kn.ilike.%${q}%`
      )
      .eq('status', 'published')
      .eq('categories.slug', slug)
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)
    if (error) throw error
    return data || []
  },

  async get(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    if (!data) return data
    const enriched = await this._enrichWithCategory([data])
    return enriched && enriched.length ? enriched[0] : data
  },

  async create(article) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert(article)
      .select()
      .maybeSingle()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle()
    if (error) throw error
    return data
  }
  ,
  async delete(id) {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id)
    if (error) throw error
    return true
  }
}