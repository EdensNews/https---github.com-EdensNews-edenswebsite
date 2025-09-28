// Simple Dependency Test
console.log('🧪 Testing Dependencies...');

// Check if xml2js is in package.json
const fs = require('fs');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

if (packageJson.dependencies.xml2js) {
    console.log('✅ xml2js is listed in package.json');
    console.log('📦 Version:', packageJson.dependencies.xml2js);
} else {
    console.log('❌ xml2js is NOT in package.json');
}

console.log('🎉 Dependencies check complete!');
console.log('📝 Next steps:');
console.log('   1. Commit and push your changes');
console.log('   2. Deploy to Netlify');
console.log('   3. The xml2js error should be resolved');
