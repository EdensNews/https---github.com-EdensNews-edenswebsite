#!/usr/bin/env node
/*
  One-time migration script: Base44 -> Supabase
  Usage:
    1) Create tools/.env.migrate with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
    2) Prepare a JSON export at tools/data/export.json with arrays:
       {
         "categories": [...],
         "articles": [...],
         "media_items": [...],
         "rss_feeds": [...],
         "stream_settings": [...],
         "bookmarks": [...]
       }
    3) Run: node tools/migrate-to-supabase.js

  Notes:
    - This script intentionally uses the Supabase SERVICE ROLE key to bypass RLS for bulk inserts.
    - DO NOT commit tools/.env.migrate to version control.
*/

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import url from 'node:url'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Resolve __dirname in ESM
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load migration env from tools/.env.migrate or project root .env.migrate
const toolsEnvPath = path.join(__dirname, '.env.migrate')
const rootEnvPath = path.join(__dirname, '..', '.env.migrate')
if (fs.existsSync(toolsEnvPath)) {
  dotenv.config({ path: toolsEnvPath })
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath })
} else {
  console.warn(`[migrate] Missing tools/.env.migrate (or root .env.migrate). Create one with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY`)
}

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[migrate] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Aborting.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

const DATA_PATH = path.join(__dirname, 'data', 'export.json')

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw)
}

function chunk(arr, size = 500) {
  const res = []
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size))
  return res
}

function cleanRow(row, { dropIdIfFalsy = true } = {}) {
  const out = {}
  for (const [k, v] of Object.entries(row)) {
    if (v === undefined) continue // omit undefined so DB defaults apply
    if (dropIdIfFalsy && k === 'id' && !v) continue // omit falsy id
    out[k] = v
  }
  return out
}

async function upsert(table, rows, { onConflict } = {}) {
  if (!rows || rows.length === 0) return { count: 0 }
  let total = 0
  for (const part of chunk(rows, 500)) {
    // Ensure rows don't include undefined or falsy ids
    const payload = part.map((r) => cleanRow(r))
    const { error, count } = await supabase
      .from(table)
      .upsert(payload, { onConflict, ignoreDuplicates: false, count: 'exact' })
    if (error) throw error
    total += count || 0
  }
  return { count: total }
}

async function run() {
  console.log('[migrate] Starting migration...')
  const data = readJson(DATA_PATH)
  if (!data) {
    console.error(`[migrate] Missing data file at ${DATA_PATH}. Place your export at this path.`)
    process.exit(1)
  }

  // 1) Categories
  if (Array.isArray(data.categories)) {
    const categories = data.categories.map((c) => cleanRow({
      id: c.id,
      name: c.name,
      slug: (c.slug || (c.name || '')).toLowerCase().replace(/\s+/g, '-'),
      created_at: c.created_at,
    }))
    const { count } = await upsert('categories', categories, { onConflict: 'slug' })
    console.log(`[migrate] categories upserted: ${count}`)
  }

  // 2) Articles
  if (Array.isArray(data.articles)) {
    const articles = data.articles.map((a) => cleanRow({
      id: a.id,
      created_at: a.created_at,
      updated_at: a.updated_at,
      author_id: a.author_id ?? null,
      title_kn: a.title_kn,
      title_en: a.title_en ?? null,
      content_kn: a.content_kn,
      content_en: a.content_en ?? null,
      reporter: a.reporter ?? null,
      image_url: a.image_url ?? null,
      is_breaking: !!a.is_breaking,
      breaking_expires_at: a.breaking_expires_at ?? null,
      status: a.status || 'published',
      published_at: a.published_at ?? null,
    }))
    const { count } = await upsert('articles', articles)
    console.log(`[migrate] articles upserted: ${count}`)

    // Article categories backfill (robust): match articles by title/published_at, categories by slug
    if (data.articles && data.articles.length) {
      const slugsNeeded = new Set()
      for (const a of data.articles) {
        for (const s of (a.category_slugs || [])) slugsNeeded.add(String(s).toLowerCase())
      }
      const { data: cats, error: catsErr } = await supabase
        .from('categories')
        .select('id, slug')
        .in('slug', Array.from(slugsNeeded))
      if (catsErr) throw catsErr
      const catSlugToId = new Map(cats.map(c => [c.slug, c.id]))

      const joins = []
      for (const a of data.articles) {
        const slugs = a.category_slugs || []
        if (!slugs.length) continue
        // Find inserted article id by matching on title and published_at
        const title = a.title_en || a.title_kn
        if (!title) continue
        let selector = supabase.from('articles').select('id').eq('status', a.status || 'published').limit(1)
        if (a.published_at) selector = selector.eq('published_at', a.published_at)
        // Prefer matching by English title if present, else Kannada
        if (a.title_en) selector = selector.eq('title_en', a.title_en)
        else selector = selector.eq('title_kn', a.title_kn)

        const { data: found, error: findErr } = await selector
        if (findErr) throw findErr
        const aid = found && found.length ? found[0].id : null
        if (!aid) continue

        for (const s of slugs) {
          const cid = catSlugToId.get(String(s).toLowerCase())
          if (cid) joins.push({ article_id: aid, category_id: cid })
        }
      }

      if (joins.length) {
        const { count: jcount } = await upsert('article_categories', joins, { onConflict: 'article_id,category_id' })
        console.log(`[migrate] article_categories upserted: ${jcount}`)
      } else {
        console.log('[migrate] article_categories upserted: 0')
      }
    }
  }

  // 3) Media Items
  if (Array.isArray(data.media_items)) {
    const media = data.media_items.map((m) => cleanRow({
      id: m.id,
      created_at: m.created_at,
      uploaded_by: m.uploaded_by ?? null,
      name: m.name ?? null,
      file_url: m.file_url,
      file_type: m.file_type || 'image',
    }))
    const { count } = await upsert('media_items', media)
    console.log(`[migrate] media_items upserted: ${count}`)
  }

  // 4) RSS Feeds
  if (Array.isArray(data.rss_feeds)) {
    const feeds = data.rss_feeds.map((r) => cleanRow({
      id: r.id,
      created_at: r.created_at,
      source_name: r.source_name,
      url: r.url,
      is_active: r.is_active !== false,
    }))
    const { count } = await upsert('rss_feeds', feeds)
    console.log(`[migrate] rss_feeds upserted: ${count}`)
  }

  // 5) Stream Settings
  if (Array.isArray(data.stream_settings)) {
    const streams = data.stream_settings.map((s) => cleanRow({
      id: s.id,
      created_at: s.created_at,
      updated_at: s.updated_at,
      stream_url: s.stream_url ?? null,
      is_live: !!s.is_live,
      subtitle: s.subtitle ?? null,
    }))
    const { count } = await upsert('stream_settings', streams)
    console.log(`[migrate] stream_settings upserted: ${count}`)
  }

  // 6) Bookmarks
  if (Array.isArray(data.bookmarks)) {
    const bookmarks = data.bookmarks.map((b) => cleanRow({
      id: b.id,
      created_at: b.created_at,
      user_id: b.user_id,
      article_id: b.article_id,
    }))
    const { count } = await upsert('bookmarks', bookmarks)
    console.log(`[migrate] bookmarks upserted: ${count}`)
  }

  console.log('[migrate] Done.')
}

run().catch((err) => {
  console.error('[migrate] Error:', err)
  process.exit(1)
})
