-- Check current admin users in Edens News
-- Run this in your Supabase SQL Editor

SELECT
    up.email,
    up.role,
    up.full_name,
    up.preferred_language,
    up.created_at,
    up.updated_at
FROM public.user_profiles up
WHERE up.role = 'admin'
ORDER BY up.email;

-- Count total admin users
SELECT COUNT(*) as total_admins FROM public.user_profiles WHERE role = 'admin';
