import { supabase } from '@/api/supabaseClient'

const TABLE = 'site_settings'

// Expected columns:
// id uuid (PK), created_at timestamptz default now(),
// site_name_en text, site_name_kn text,
// description_en text, description_kn text,
// contact_email text, contact_phone text,
// contact_address_en text, contact_address_kn text,
// social_facebook text, social_twitter text, social_youtube text, social_instagram text,
// ai_app_url text

export const siteSettingsRepo = {
  async getLatest() {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) throw error
    return data && data.length ? data[0] : null
  },

  async listLatest(limit = 5) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  },

  async upsert(settings) {
    // Requires RLS policy allowing admin role
    const { data, error } = await supabase
      .from(TABLE)
      .upsert(settings)
      .select()
    if (error) throw error
    return data
  }
}
