// Edens News - Import Data to PostgreSQL
// Run this on your VPS after uploading the exported data

import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

// Database configuration
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'edensnews',
  user: 'edensnews_user',
  password: 'CHANGE_THIS_PASSWORD', // Use the password you set
});

async function importTable(tableName) {
  console.log(`\nImporting ${tableName}...`);
  
  const filename = path.join('data', `${tableName}.json`);
  
  if (!fs.existsSync(filename)) {
    console.log(`  ⚠ File not found: ${filename}, skipping...`);
    return 0;
  }

  const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
  
  if (!data || data.length === 0) {
    console.log(`  ⚠ No data in ${tableName}, skipping...`);
    return 0;
  }

  let imported = 0;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const row of data) {
      const columns = Object.keys(row);
      const values = Object.values(row);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      
      const query = `
        INSERT INTO ${tableName} (${columns.join(', ')})
        VALUES (${placeholders})
        ON CONFLICT DO NOTHING
      `;

      try {
        await client.query(query, values);
        imported++;
        
        if (imported % 100 === 0) {
          console.log(`  Imported ${imported}/${data.length} rows...`);
        }
      } catch (error) {
        console.error(`  Error importing row:`, error.message);
      }
    }

    await client.query('COMMIT');
    console.log(`✓ Imported ${imported}/${data.length} rows to ${tableName}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`  Failed to import ${tableName}:`, error.message);
  } finally {
    client.release();
  }

  return imported;
}

async function importAllData() {
  console.log('========================================');
  console.log('Edens News - PostgreSQL Data Import');
  console.log('========================================');

  // Import in correct order (respecting foreign keys)
  const tables = [
    'categories',
    'users',
    'articles',
    'article_categories',
    'bookmarks',
    'analytics_views',
    'site_settings',
    'stream_settings',
    'schedule',
    'rss_feeds'
  ];

  const summary = {};

  for (const table of tables) {
    try {
      summary[table] = await importTable(table);
    } catch (error) {
      console.error(`Failed to import ${table}:`, error.message);
      summary[table] = 0;
    }
  }

  console.log('\n========================================');
  console.log('Import Summary:');
  console.log('========================================');
  Object.entries(summary).forEach(([table, count]) => {
    console.log(`  ${table}: ${count} rows`);
  });

  await pool.end();
  console.log('\n✓ Import complete!');
}

importAllData().catch(console.error);
