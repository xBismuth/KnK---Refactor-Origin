// Quick endpoint test script
// Run with: node test-endpoints.js

const http = require('http');

const testEndpoint = (path, method = 'GET', body = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

async function runTests() {
  console.log('🧪 Testing Endpoints...\n');

  // Test 1: Health check
  try {
    const health = await testEndpoint('/api/health');
    console.log('✅ Health Check:', health.status, health.data.status);
  } catch (e) {
    console.error('❌ Server not running:', e.message);
    console.log('\n💡 Start server with: node server.js');
    return;
  }

  // Test 2: Forgot password (should return 400 for missing email or 200 for valid)
  try {
    const forgot1 = await testEndpoint('/auth/forgot-password', 'POST', {});
    console.log('📧 Forgot Password (no email):', forgot1.status, forgot1.data.message || forgot1.data);
    
    const forgot2 = await testEndpoint('/auth/forgot-password', 'POST', { email: 'test@example.com' });
    console.log('📧 Forgot Password (with email):', forgot2.status, forgot2.data.message || forgot2.data);
    
    if (forgot1.status === 404 || forgot2.status === 404) {
      console.error('\n❌ ERROR: Endpoint returns 404 - Route not registered!');
      console.log('💡 Check: routes/authRoutes.js has forgotPassword route');
      console.log('💡 Check: server.js has app.use("/auth", authRoutes)');
      console.log('💡 Restart server after adding routes');
    } else {
      console.log('✅ Forgot password endpoint is registered');
    }
  } catch (e) {
    console.error('❌ Forgot password test failed:', e.message);
  }

  // Test 3: Reset password
  try {
    const reset = await testEndpoint('/auth/reset-password', 'POST', {});
    console.log('🔐 Reset Password:', reset.status, reset.data.message || reset.data);
    
    if (reset.status === 404) {
      console.error('❌ Reset password endpoint returns 404');
    } else {
      console.log('✅ Reset password endpoint is registered');
    }
  } catch (e) {
    console.error('❌ Reset password test failed:', e.message);
  }

  console.log('\n✅ Testing complete!');
}

runTests();

