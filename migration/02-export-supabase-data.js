// Edens News - Export Data from Supabase
// Run this locally to export all your data

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';


const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportTable(tableName, batchSize = 100) {
  console.log(`\nExporting ${tableName}...`);
  let allData = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error(`Error exporting ${tableName}:`, error);
      break;
    }

    if (data && data.length > 0) {
      allData = allData.concat(data);
      console.log(`  Exported ${allData.length} rows...`);
      offset += batchSize;
      hasMore = data.length === batchSize;
    } else {
      hasMore = false;
    }
  }

  // Save to file
  const filename = path.join('data', `${tableName}.json`);
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, JSON.stringify(allData, null, 2));
  console.log(`✓ Saved ${allData.length} rows to ${filename}`);

  return allData.length;
}

async function exportAllData() {
  console.log('========================================');
  console.log('Edens News - Supabase Data Export');
  console.log('========================================');

  const tables = [
    'articles',
    'categories',
    'article_categories',
    'user_profiles', // Changed from 'users'
    'bookmarks',
    'article_views', // Changed from 'analytics_views'
    'site_settings',
    'stream_settings',
    'broadcast_schedule', // Changed from 'schedule'
    'rss_feeds'
  ];

  const summary = {};

  for (const table of tables) {
    try {
      summary[table] = await exportTable(table);
    } catch (error) {
      console.error(`Failed to export ${table}:`, error.message);
      summary[table] = 0;
    }
  }

  console.log('\n========================================');
  console.log('Export Summary:');
  console.log('========================================');
  Object.entries(summary).forEach(([table, count]) => {
    console.log(`  ${table}: ${count} rows`);
  });

  console.log('\n✓ Export complete! Data saved to migration/data/');
  console.log('Next step: Run 03-import-to-postgres.js on your VPS');
}

exportAllData().catch(console.error);
