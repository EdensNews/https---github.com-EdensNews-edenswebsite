import { supabase } from '@/api/supabaseClient'

const TABLE = 'stream_settings'

export const streamSettingsRepo = {
  async getLatest() {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) throw error
    return data && data.length ? data[0] : null
  },

  async upsert(settings) {
    const { data, error } = await supabase
      .from(TABLE)
      .upsert(settings)
      .select()
    if (error) throw error
    return data
  }
}
