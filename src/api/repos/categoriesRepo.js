import { supabase } from '@/api/supabaseClient'

const TABLE = 'categories'

export const categoriesRepo = {
  async list() {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, name, slug')
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[categoriesRepo] list error:', error)
      throw error
    }
  },

  async getBySlug(slug) {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('slug', slug)
        .maybeSingle()
      if (error) throw error
      return data
    } catch (error) {
      console.error('[categoriesRepo] getBySlug error:', error)
      throw error
    }
  },

  async create(category) {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .insert(category)
        .select()
        .maybeSingle()
      if (error) throw error
      return data
    } catch (error) {
      console.error('[categoriesRepo] create error:', error)
      throw error
    }
  },

  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle()
      if (error) throw error
      return data
    } catch (error) {
      console.error('[categoriesRepo] update error:', error)
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
      console.error('[categoriesRepo] remove error:', error)
      throw error
    }
  }
}