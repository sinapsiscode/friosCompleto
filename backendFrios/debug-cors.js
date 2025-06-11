// Debug script to test CORS and static file serving
const { exec } = require('child_process');
const path = require('path');

console.log('🔍 CORS and Static File Serving Debug\n');

// Test 1: Check if server is running
console.log('1. Testing server health...');
exec('curl -s http://localhost:2001/health', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ Server not running or not accessible');
    console.log('Error:', error.message);
    return;
  }
  console.log('✅ Server is running');
  console.log('Response:', stdout);
  
  // Test 2: Check static file serving with CORS headers
  console.log('\n2. Testing static file with CORS headers...');
  const imageUrl = 'http://localhost:2001/uploads/clientes/avatars/2025/06/avatar-1-1749679250505-167846444.png';
  
  exec(`curl -I -H "Origin: http://localhost:2000" "${imageUrl}"`, (error, stdout, stderr) => {
    if (error) {
      console.log('❌ Error testing static file:', error.message);
      return;
    }
    
    console.log('✅ Static file headers:');
    console.log(stdout);
    
    // Analyze CORS headers
    const headers = stdout.toLowerCase();
    if (headers.includes('access-control-allow-origin')) {
      console.log('✅ CORS headers are present');
    } else {
      console.log('❌ CORS headers are missing');
    }
    
    // Test 3: Check preflight request
    console.log('\n3. Testing preflight request...');
    exec(`curl -I -X OPTIONS -H "Origin: http://localhost:2000" -H "Access-Control-Request-Method: GET" "${imageUrl}"`, (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Error testing preflight:', error.message);
        return;
      }
      
      console.log('✅ Preflight response:');
      console.log(stdout);
    });
  });
});