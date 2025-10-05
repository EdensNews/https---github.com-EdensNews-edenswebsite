// Convert CSV to JSON
import fs from 'fs';
import csv from 'csv-parser';

const results = [];

fs.createReadStream('data/articles.csv')
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    fs.writeFileSync('data/articles.json', JSON.stringify(results, null, 2));
    console.log(`✓ Converted ${results.length} articles from CSV to JSON`);
    console.log('✓ Saved to data/articles.json');
  });
