import { supabase } from '@/api/supabaseClient'

async function getAuthUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data?.user || null
}

async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

async function upsertUserProfile(userId, updates) {
  const payload = { user_id: userId, ...updates }
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(payload)
    .select()
    .maybeSingle()
  if (error) throw error
  return data
}

export const User = {
  async me() {
    const user = await getAuthUser()
    if (!user) return null
    // Merge auth and profile
    let profile = null
    try {
      profile = await getUserProfile(user.id)
    } catch (_) {
      // ignore if profile missing
    }
    return {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name || user.user_metadata?.full_name || '',
      role: profile?.role || 'user',
      preferred_language: profile?.preferred_language || null,
      preferred_theme: profile?.preferred_theme || null,
    }
  },

  async updateMyUserData(updates) {
    const user = await getAuthUser()
    if (!user) throw new Error('Not authenticated')
    const allowed = {}
    if (updates.preferred_language) allowed.preferred_language = updates.preferred_language
    if (updates.preferred_theme) allowed.preferred_theme = updates.preferred_theme
    if (updates.full_name) allowed.full_name = updates.full_name
    if (updates.email) allowed.email = updates.email
    return await upsertUserProfile(user.id, allowed)
  },

  async loginWithOAuth(provider = 'google', redirectTo = window.location.href) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo }
    })
    if (error) throw error
    return data
  },

  async loginWithOtp(email, redirectTo = window.location.href) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo }
    })
    if (error) throw error
    return data
  },

  async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return true
  }
}
