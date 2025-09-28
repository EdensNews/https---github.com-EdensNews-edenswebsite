// Test Netlify Function Dependencies
// This script tests if the required dependencies are available

console.log('🧪 Testing Netlify Function Dependencies...');

try {
    // Test xml2js
    const xml2js = await import('xml2js');
    console.log('✅ xml2js dependency is available');
    
    // Test crypto (built-in Node.js module)
    const crypto = await import('crypto');
    console.log('✅ crypto module is available');
    
    // Test http/https (built-in Node.js modules)
    const http = await import('http');
    const https = await import('https');
    console.log('✅ http/https modules are available');
    
    console.log('🎉 All dependencies are working correctly!');
    console.log('📝 Your Netlify function should work now.');
    
} catch (error) {
    console.error('❌ Dependency test failed:', error.message);
    console.log('💡 Make sure to run: npm install');
}
