-- Supabase schema for initial integration
-- Run this in the Supabase SQL editor for your project.

-- Enable required extensions
create extension if not exists pgcrypto;

-- 1) site_settings table
create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  site_name_en text,
  site_name_kn text,
  description_en text,
  description_kn text,
  contact_email text,
  contact_phone text,
  contact_address_en text,
  contact_address_kn text,
  social_facebook text,
  social_twitter text,
  social_youtube text,
  social_instagram text,
  ai_app_url text
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_site_settings_updated_at on public.site_settings;
create trigger trg_site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

-- RLS: allow public read, admin-only write (you can adjust)
alter table public.site_settings enable row level security;

-- Example role-based policy using a user_profiles table (optional).
-- If you don't have user_profiles yet, temporarily allow authenticated writes.
-- Read policy (public):
drop policy if exists site_settings_read_public on public.site_settings;
create policy site_settings_read_public on public.site_settings
for select using (true);

-- Write policy (admins only):
-- This assumes you create a user_profiles table with role column later.
-- Uncomment and adapt when ready.
-- create policy site_settings_write_admin on public.site_settings
-- for all using (
--   auth.uid() is not null and exists (
--     select 1 from public.user_profiles up
--     where up.user_id = auth.uid() and up.role = 'admin'
--   )
-- ) with check (
--   auth.uid() is not null and exists (
--     select 1 from public.user_profiles up
--     where up.user_id = auth.uid() and up.role = 'admin'
--   )
-- );

-- Temporary: allow authenticated users to write (remove once admin policy in place)
drop policy if exists site_settings_write_auth on public.site_settings;
create policy site_settings_write_auth on public.site_settings
for insert with check (auth.role() = 'authenticated');

drop policy if exists site_settings_update_auth on public.site_settings;
create policy site_settings_update_auth on public.site_settings
for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 2) user_profiles table for roles and preferences
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  role text not null default 'user' check (role in ('user','admin')),
  preferred_language text check (preferred_language in ('kn','en')),
  preferred_theme text check (preferred_theme in ('light','dark')),
  full_name text,
  email text
);

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

alter table public.user_profiles enable row level security;

-- Only the user can view and manage their own profile
drop policy if exists user_profiles_select_own on public.user_profiles;
create policy user_profiles_select_own on public.user_profiles
for select using (auth.uid() = user_id);

drop policy if exists user_profiles_insert_self on public.user_profiles;
create policy user_profiles_insert_self on public.user_profiles
for insert with check (auth.uid() = user_id);

drop policy if exists user_profiles_update_own on public.user_profiles;
create policy user_profiles_update_own on public.user_profiles
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Tighten site_settings write access to admin role based on user_profiles
drop policy if exists site_settings_write_auth on public.site_settings;
drop policy if exists site_settings_update_auth on public.site_settings;

drop policy if exists site_settings_write_admin on public.site_settings;
create policy site_settings_write_admin on public.site_settings
for all using (
  auth.uid() is not null and exists (
    select 1 from public.user_profiles up
    where up.user_id = auth.uid() and up.role = 'admin'
  )
) with check (
  auth.uid() is not null and exists (
    select 1 from public.user_profiles up
    where up.user_id = auth.uid() and up.role = 'admin'
  )
);
