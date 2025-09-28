import { supabase } from '@/api/supabaseClient'

const TABLE = 'media_items'

export const mediaRepo = {
  async list({ limit = 100, offset = 0 } = {}) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    if (error) throw error
    return data || []
  },

  async create(item) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert(item)
      .select()
    if (error) throw error
    return data
  },

  async remove(id) {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id)
    if (error) throw error
    return true
  }
}
