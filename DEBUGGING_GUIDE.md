# 🔍 Complete Debugging Guide - Step-by-Step Checklist

## 🎯 Quick Reference
- **Server URL**: `http://localhost:3000`
- **Auth Routes**: `/auth/*` (mounted at `/auth`)
- **API Routes**: `/api/*` (mounted at `/api`)
- **Google Client ID**: `185778585245-6o939pgomkeqnse9rsa3th61b2biacsu.apps.googleusercontent.com`

---

## ✅ STEP 1: Verify Server is Running

### **Check 1.1: Server Status**
```bash
# In terminal, check if server is running
curl http://localhost:3000/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-XX...",
  "database": "connected",
  ...
}
```

**If it fails:**
- Start your server: `node server.js` or `npm start`
- Check if port 3000 is already in use
- Verify `.env` file exists

### **Check 1.2: Browser Console Test**
Open browser console (F12) and run:
```javascript
// Test server health
fetch('http://localhost:3000/api/health')
  .then(r => r.json())
  .then(data => console.log('✅ Server OK:', data))
  .catch(err => console.error('❌ Server Error:', err));
```

**What to check:**
- ✅ Status: `ok`
- ✅ Database: `connected`
- ❌ If you see "Failed to fetch" → Server not running or CORS issue

---

## ✅ STEP 2: Verify Backend Routes Exist

### **Check 2.1: List All Available Auth Routes**

**In Browser Console:**
```javascript
// Test all auth endpoints
const authEndpoints = [
  '/auth/signup',
  '/auth/send-login-code',
  '/auth/verify-login-code',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/google',
  '/auth/me'
];

async function testEndpoints() {
  for (const endpoint of authEndpoints) {
    try {
      const res = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      console.log(`${res.status} ${endpoint}:`, data.message || data);
    } catch (err) {
      console.error(`❌ ${endpoint}:`, err.message);
    }
  }
}

testEndpoints();
```

**Expected Results:**
- ✅ `POST /auth/forgot-password` → Should return 400 (email required) NOT 404
- ✅ `POST /auth/reset-password` → Should return 400 (missing fields) NOT 404
- ❌ If you see 404 → Route is not registered

### **Check 2.2: Manual API Testing Function**

**Add this to browser console for easy testing:**
```javascript
// Utility function for testing APIs
window.testAPI = async function(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  console.log(`\n🧪 Testing: ${method} ${endpoint}`);
  console.log('📤 Request:', body || 'No body');
  
  try {
    const startTime = Date.now();
    const res = await fetch(`http://localhost:3000${endpoint}`, options);
    const duration = Date.now() - startTime;
    
    let data;
    try {
      data = await res.json();
    } catch (e) {
      data = await res.text();
    }
    
    console.log(`⏱️ Duration: ${duration}ms`);
    console.log(`📊 Status: ${res.status} ${res.statusText}`);
    console.log(`📥 Response:`, data);
    console.log(`📋 Headers:`, Object.fromEntries(res.headers.entries()));
    
    return { status: res.status, data, headers: res.headers };
  } catch (err) {
    console.error('❌ Request Failed:', err);
    return { error: err.message };
  }
};

// Usage examples:
// testAPI('/auth/forgot-password', 'POST', { email: 'test@example.com' });
// testAPI('/auth/reset-password', 'POST', { email: 'test@example.com', code: '123456', newPassword: 'newpass123' });
// testAPI('/api/health');
```

### **Check 2.3: Verify Route Registration in Server**

**In Terminal (check server.js):**
```bash
# Check if routes are mounted correctly
grep -n "app.use.*auth" server.js
```

**Should show:**
```
81:app.use('/auth', authRoutes);
```

**If missing or wrong:**
- Routes are mounted at `/auth`, so endpoints should be:
  - `/auth/forgot-password` ✅
  - NOT `/api/auth/forgot-password` ❌

---

## ✅ STEP 3: Inspect Failed Requests in Browser

### **Check 3.1: Network Tab Inspection**

**Steps:**
1. Open DevTools (F12)
2. Go to **Network** tab
3. Check **"Preserve log"** checkbox
4. Try the forgot password function
5. Look for failed requests (red status)

**What to check for each failed request:**
- **Status Code**: 
  - `404` = Endpoint not found
  - `400` = Bad request (expected for missing fields)
  - `401` = Unauthorized
  - `403` = Forbidden (CORS or permissions)
  - `500` = Server error
- **Request URL**: Is it correct? (`/auth/forgot-password` not `/api/auth/forgot-password`)
- **Request Method**: POST, GET, etc.
- **Request Headers**: Content-Type, Origin
- **Response**: Click on request → Response tab → See error message

### **Check 3.2: Console Error Inspection**

**In Browser Console, add this:**
```javascript
// Monitor all fetch requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];
  const options = args[1] || {};
  
  console.group(`🌐 Fetch: ${options.method || 'GET'} ${url}`);
  console.log('Options:', options);
  
  return originalFetch.apply(this, args)
    .then(response => {
      console.log(`✅ Status: ${response.status} ${response.statusText}`);
      response.clone().json().then(data => {
        console.log('Response:', data);
      }).catch(() => {
        response.clone().text().then(text => {
          console.log('Response (text):', text);
        });
      });
      console.groupEnd();
      return response;
    })
    .catch(error => {
      console.error(`❌ Error:`, error);
      console.groupEnd();
      throw error;
    });
};
```

### **Check 3.3: Check for CORS Issues**

**In Browser Console:**
```javascript
// Test CORS
fetch('http://localhost:3000/api/health', {
  method: 'OPTIONS',
  headers: {
    'Origin': window.location.origin,
    'Access-Control-Request-Method': 'POST'
  }
})
  .then(r => {
    console.log('CORS Headers:', r.headers.get('Access-Control-Allow-Origin'));
    console.log('CORS Status:', r.status);
  })
  .catch(err => console.error('CORS Error:', err));
```

**What to check:**
- Response should include `Access-Control-Allow-Origin` header
- If missing → CORS middleware not working

---

## ✅ STEP 4: Test Forgot Password Endpoint Specifically

### **Check 4.1: Test with Browser Console**

```javascript
// Test forgot password endpoint
async function testForgotPassword() {
  console.log('🧪 Testing /auth/forgot-password');
  
  // Test 1: Missing email (should return 400)
  const test1 = await fetch('http://localhost:3000/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  const result1 = await test1.json();
  console.log('Test 1 (no email):', test1.status, result1);
  
  // Test 2: With email (should return 200 or error about user not found)
  const test2 = await fetch('http://localhost:3000/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com' })
  });
  const result2 = await test2.json();
  console.log('Test 2 (with email):', test2.status, result2);
  
  return { test1: { status: test1.status, data: result1 }, test2: { status: test2.status, data: result2 } };
}

testForgotPassword();
```

**Expected Results:**
- ✅ `POST /auth/forgot-password` (no email) → Status 400, message: "Email is required"
- ✅ `POST /auth/forgot-password` (with email) → Status 200, success: true
- ❌ If Status 404 → Route not registered

### **Check 4.2: Verify Controller Function Exists**

**In Terminal:**
```bash
# Check if forgotPassword function exists in controller
grep -n "exports.forgotPassword\|forgotPassword" controllers/authController.js
```

**Should show:**
```
617:exports.forgotPassword = async (req, res) => {
```

### **Check 4.3: Check Route Registration**

**In Terminal:**
```bash
# Verify route is registered
grep -n "forgot-password" routes/authRoutes.js
```

**Should show:**
```
27:router.post('/forgot-password', authLimiter, authController.forgotPassword);
```

---

## ✅ STEP 5: Debug Google Sign-In Configuration

### **Check 5.1: Verify Google Script Loads**

**In Browser Console:**
```javascript
// Check if Google Sign-In library loaded
setTimeout(() => {
  if (typeof google !== 'undefined' && google.accounts) {
    console.log('✅ Google Sign-In library loaded');
    console.log('Available methods:', Object.keys(google.accounts));
  } else {
    console.error('❌ Google Sign-In library NOT loaded');
    console.log('This usually means:');
    console.log('1. Network issue blocking https://accounts.google.com/gsi/client');
    console.log('2. Origin not authorized in Google Cloud Console');
    console.log('3. Client ID not valid');
  }
}, 3000);
```

### **Check 5.2: Verify Client ID Configuration**

**In Browser Console:**
```javascript
// Check current client ID
const gsiDiv = document.querySelector('#g_id_onload');
if (gsiDiv) {
  const clientId = gsiDiv.getAttribute('data-client_id');
  console.log('🔑 Current Client ID:', clientId);
  console.log('🔗 Expected Client ID:', '185778585245-6o939pgomkeqnse9rsa3th61b2biacsu.apps.googleusercontent.com');
  
  if (clientId !== '185778585245-6o939pgomkeqnse9rsa3th61b2biacsu.apps.googleusercontent.com') {
    console.warn('⚠️ Client ID mismatch!');
  }
} else {
  console.error('❌ Google Sign-In div not found');
}
```

### **Check 5.3: Test Current Origin**

**In Browser Console:**
```javascript
// Check current origin
console.log('📍 Current Origin:', window.location.origin);
console.log('📍 Current Host:', window.location.host);
console.log('📍 Current Protocol:', window.location.protocol);

// Expected for localhost:
// Origin: http://localhost:3000
// Host: localhost:3000
// Protocol: http:
```

### **Check 5.4: Google Cloud Console Configuration Checklist**

**You need to verify in Google Cloud Console:**

1. **Go to**: https://console.cloud.google.com/
2. **Navigate to**: APIs & Services → Credentials
3. **Find OAuth 2.0 Client ID**: `185778585245-6o939pgomkeqnse9rsa3th61b2biacsu`
4. **Click Edit**
5. **Check Authorized JavaScript origins**:
   ```
   ✅ http://localhost:3000
   ✅ http://127.0.0.1:3000  (if needed)
   ```
6. **Check Authorized redirect URIs** (if using redirect flow):
   ```
   ✅ http://localhost:3000
   ✅ http://localhost:3000/auth/google
   ```
7. **Save changes**

**After saving, wait 1-2 minutes for changes to propagate, then test again.**

### **Check 5.5: Test Google Sign-In Programmatically**

**In Browser Console (after Google library loads):**
```javascript
// Wait for Google library
setTimeout(() => {
  if (typeof google !== 'undefined' && google.accounts) {
    try {
      google.accounts.id.initialize({
        client_id: '185778585245-6o939pgomkeqnse9rsa3th61b2biacsu.apps.googleusercontent.com',
        callback: (response) => {
          console.log('✅ Google Sign-In callback received:', response.credential ? 'Success' : 'Failed');
        }
      });
      console.log('✅ Google Sign-In initialized successfully');
    } catch (err) {
      console.error('❌ Google Sign-In initialization failed:', err);
      console.log('This usually means the origin is not authorized');
    }
  } else {
    console.error('❌ Google accounts library not available');
  }
}, 3000);
```

---

## ✅ STEP 6: Check Network Request Details

### **Check 6.1: Comprehensive Request Logger**

**Add to browser console:**
```javascript
// Enhanced request logger
(function() {
  const logRequest = (url, options, response, error) => {
    const log = {
      timestamp: new Date().toISOString(),
      url,
      method: options?.method || 'GET',
      headers: options?.headers || {},
      body: options?.body || null,
      status: response?.status,
      statusText: response?.statusText,
      response: null,
      error: error?.message || null,
      duration: null
    };
    
    console.group(`🌐 ${log.method} ${url}`);
    console.table(log);
    console.groupEnd();
    
    return log;
  };
  
  // Override fetch
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = args[0];
    const options = args[1] || {};
    const startTime = Date.now();
    
    try {
      const response = await originalFetch.apply(this, args);
      const duration = Date.now() - startTime;
      
      // Clone response to read body
      const clonedResponse = response.clone();
      let responseData;
      try {
        responseData = await clonedResponse.json();
      } catch {
        responseData = await clonedResponse.text();
      }
      
      const log = logRequest(url, options, response);
      log.duration = `${duration}ms`;
      log.response = responseData;
      
      if (response.status >= 400) {
        console.error('❌ Request failed:', log);
      } else {
        console.log('✅ Request succeeded:', log);
      }
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      const log = logRequest(url, options, null, error);
      log.duration = `${duration}ms`;
      console.error('❌ Request error:', log);
      throw error;
    }
  };
  
  console.log('✅ Request logger installed');
})();
```

### **Check 6.2: Check for Aborted Requests**

**In Browser Console:**
```javascript
// Monitor aborted requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
  
  const options = args[1] || {};
  options.signal = controller.signal;
  
  return originalFetch.apply(this, [args[0], options])
    .then(response => {
      clearTimeout(timeoutId);
      return response;
    })
    .catch(error => {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error('❌ Request aborted:', args[0]);
        console.error('Possible causes:');
        console.error('1. Network timeout');
        console.error('2. Server not responding');
        console.error('3. CORS preflight failed');
        console.error('4. Request cancelled by browser');
      }
      throw error;
    });
};
```

---

## ✅ STEP 7: Verify Backend Route Registration

### **Check 7.1: List All Registered Routes**

**Create a test endpoint in server.js (temporary):**
```javascript
// Add this BEFORE the 404 handler in server.js (around line 93)
app.get('/api/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        method: Object.keys(middleware.route.methods)[0].toUpperCase()
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: middleware.regexp.source.replace(/\\|\^|\$|\?|\(|\)/g, '') + handler.route.path,
            method: Object.keys(handler.route.methods)[0].toUpperCase()
          });
        }
      });
    }
  });
  res.json({ routes });
});
```

**Then test in browser console:**
```javascript
fetch('http://localhost:3000/api/routes')
  .then(r => r.json())
  .then(data => {
    console.log('📋 All registered routes:');
    const authRoutes = data.routes.filter(r => r.path.includes('auth'));
    console.table(authRoutes);
  });
```

### **Check 7.2: Server-Side Route Debugging**

**Add to server.js (temporary debug):**
```javascript
// Add this after mounting routes (around line 87)
app.use((req, res, next) => {
  if (req.url.includes('forgot-password') || req.url.includes('reset-password')) {
    console.log('🔍 Route Debug:', {
      method: req.method,
      url: req.url,
      originalUrl: req.originalUrl,
      path: req.path,
      baseUrl: req.baseUrl
    });
  }
  next();
});
```

**Watch server terminal for these logs when testing.**

---

## ✅ STEP 8: Fix Common Issues

### **Issue 8.1: 404 on /auth/forgot-password**

**Check:**
1. ✅ Route exists in `routes/authRoutes.js`: `router.post('/forgot-password', ...)`
2. ✅ Controller exists: `exports.forgotPassword` in `controllers/authController.js`
3. ✅ Route mounted: `app.use('/auth', authRoutes)` in `server.js`
4. ✅ Server restarted after adding routes

**Fix:**
```bash
# Restart server
# Press Ctrl+C to stop, then:
node server.js
```

### **Issue 8.2: Google Sign-In 403 Error**

**Fix Steps:**
1. Go to Google Cloud Console
2. Add `http://localhost:3000` to authorized origins
3. Wait 1-2 minutes
4. Clear browser cache
5. Reload page

**Temporary workaround (already implemented):**
- Error handling hides Google Sign-In if it fails
- Users can use email sign-in instead

### **Issue 8.3: CORS Errors**

**Check server.js:**
```javascript
app.use(cors()); // Should be at line 51
```

**If CORS still fails, add specific config:**
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
```

### **Issue 8.4: Request Aborted**

**Common causes:**
1. **Server not running** → Check Step 1
2. **Network timeout** → Check server response time
3. **CORS preflight failed** → Check Step 6.2
4. **Rate limiting** → Check if too many requests

**Test:**
```javascript
// Test with longer timeout
fetch('http://localhost:3000/auth/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com' }),
  signal: AbortSignal.timeout(10000) // 10 second timeout
})
  .then(r => r.json())
  .then(console.log)
  .catch(err => {
    if (err.name === 'AbortError') {
      console.error('❌ Request timed out');
    } else {
      console.error('❌ Other error:', err);
    }
  });
```

---

## 📋 FINAL CHECKLIST (Execute in Order)

### **Phase 1: Server Health (5 minutes)**
- [ ] **1.1** Server running? → `curl http://localhost:3000/api/health`
- [ ] **1.2** Browser can reach server? → Run browser console test
- [ ] **1.3** Server logs show requests? → Check terminal

### **Phase 2: Route Verification (10 minutes)**
- [ ] **2.1** Test all auth endpoints → Run `testEndpoints()` function
- [ ] **2.2** Verify `/auth/forgot-password` returns 400 (not 404)
- [ ] **2.3** Check route registration in `routes/authRoutes.js`
- [ ] **2.4** Check controller function exists in `controllers/authController.js`

### **Phase 3: Network Debugging (15 minutes)**
- [ ] **3.1** Open Network tab → Check failed requests
- [ ] **3.2** Install request logger → Copy code from Step 3.2
- [ ] **3.3** Test forgot password → Check request/response details
- [ ] **3.4** Check for CORS issues → Run Step 6.1 test

### **Phase 4: Google Sign-In (10 minutes)**
- [ ] **5.1** Check if Google library loads → Run Step 5.1
- [ ] **5.2** Verify client ID → Run Step 5.2
- [ ] **5.3** Check current origin → Run Step 5.3
- [ ] **5.4** Update Google Cloud Console → Add localhost:3000
- [ ] **5.5** Test after 2 minutes → Clear cache and reload

### **Phase 5: Fix Issues (Variable time)**
- [ ] **8.1** Fix 404 errors → Restart server
- [ ] **8.2** Fix Google 403 → Update Cloud Console
- [ ] **8.3** Fix CORS → Update server.js
- [ ] **8.4** Fix aborted requests → Check timeout and server

---

## 🛠️ Quick Diagnostic Command

**Copy this entire block into browser console for full diagnostic:**

```javascript
(async function fullDiagnostic() {
  console.log('🔍 STARTING FULL DIAGNOSTIC...\n');
  
  // 1. Server Health
  console.log('1️⃣ Testing Server Health...');
  try {
    const health = await fetch('http://localhost:3000/api/health').then(r => r.json());
    console.log('✅ Server:', health.status);
  } catch (e) {
    console.error('❌ Server not reachable:', e.message);
    return;
  }
  
  // 2. Test Forgot Password
  console.log('\n2️⃣ Testing Forgot Password Endpoint...');
  try {
    const res = await fetch('http://localhost:3000/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' })
    });
    const data = await res.json();
    if (res.status === 404) {
      console.error('❌ Endpoint not found (404) - Route not registered');
    } else {
      console.log(`✅ Endpoint exists - Status: ${res.status}`);
      console.log('Response:', data);
    }
  } catch (e) {
    console.error('❌ Request failed:', e.message);
  }
  
  // 3. Check Google Sign-In
  console.log('\n3️⃣ Checking Google Sign-In...');
  setTimeout(() => {
    if (typeof google !== 'undefined' && google.accounts) {
      console.log('✅ Google Sign-In library loaded');
    } else {
      console.error('❌ Google Sign-In library NOT loaded');
      console.log('📍 Current origin:', window.location.origin);
      console.log('💡 Add this to Google Cloud Console authorized origins');
    }
  }, 2000);
  
  // 4. Check Origin
  console.log('\n4️⃣ Current Configuration:');
  console.log('📍 Origin:', window.location.origin);
  console.log('📍 Host:', window.location.host);
  console.log('📍 Protocol:', window.location.protocol);
  
  console.log('\n✅ DIAGNOSTIC COMPLETE');
  console.log('📋 Check the results above and follow the fix steps for any ❌ errors');
})();
```

---

## 📝 Notes

- **Always restart server** after changing routes or controllers
- **Wait 1-2 minutes** after changing Google Cloud Console settings
- **Clear browser cache** if issues persist
- **Check server terminal** for error logs
- **Use Network tab** to see actual request/response details

---

## 🆘 Still Having Issues?

If errors persist after following all steps:

1. **Check server terminal** for error messages
2. **Check browser console** for JavaScript errors
3. **Verify .env file** has all required variables
4. **Check database connection** (if using DB)
5. **Verify Node.js version** compatibility

