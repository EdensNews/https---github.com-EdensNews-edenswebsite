-- Enhanced SQL Script to add admin users for Edens News
-- This script handles both existing and non-existing users
-- Run this in your Supabase SQL Editor

-- Step 1: Check which emails exist in auth.users
SELECT
    au.email as existing_email,
    au.id as user_id
FROM auth.users au
WHERE au.email IN (
    'p.s.veeresh@gmail.com',
    'c.sushmachandhru@gmail.com',
    'srilathayadav6@gmail.com',
    'reachsharath26@gmail.com'
);

-- Step 2: Add admin role for existing users
INSERT INTO public.user_profiles (user_id, role, full_name, email, preferred_language)
SELECT
    au.id as user_id,
    'admin' as role,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as full_name,
    au.email as email,
    'en' as preferred_language
FROM auth.users au
WHERE au.email IN (
    'p.s.veeresh@gmail.com',
    'c.sushmachandhru@gmail.com',
    'srilathayadav6@gmail.com',
    'reachsharath26@gmail.com'
)
AND NOT EXISTS (
    SELECT 1 FROM public.user_profiles up WHERE up.user_id = au.id
)
ON CONFLICT (user_id) DO UPDATE SET
    role = 'admin',
    updated_at = NOW();

-- Step 3: Show results
SELECT
    'Existing Users Made Admin' as status,
    up.email,
    up.role,
    up.full_name,
    up.created_at
FROM public.user_profiles up
WHERE up.email IN (
    'p.s.veeresh@gmail.com',
    'c.sushmachandhru@gmail.com',
    'srilathayadav6@gmail.com',
    'reachsharath26@gmail.com'
)

UNION ALL

SELECT
    'Users Need to Sign Up First' as status,
    email as email,
    'pending' as role,
    'N/A' as full_name,
    NULL as created_at
FROM (VALUES
    ('p.s.veeresh@gmail.com'),
    ('c.sushmachandhru@gmail.com'),
    ('srilathayadav6@gmail.com'),
    ('reachsharath26@gmail.com')
) AS pending_users(email)
WHERE email NOT IN (
    SELECT au.email FROM auth.users au
    WHERE au.email IN (
        'p.s.veeresh@gmail.com',
        'c.sushmachandhru@gmail.com',
        'srilathayadav6@gmail.com',
        'reachsharath26@gmail.com'
    )
)

ORDER BY email;
