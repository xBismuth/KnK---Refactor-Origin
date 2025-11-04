# 🔐 Google OAuth Setup Guide

## Your Current Configuration

**Client ID**: `185778585245-6o939pgomkeqnse9rsa3th61b2biacsu.apps.googleusercontent.com`  
**Project**: `kusina-ni-katya`  
**Console URL**: https://console.cloud.google.com/auth/clients/185778585245-6o939pgomkeqnse9rsa3th61b2biacsu.apps.googleusercontent.com?project=kusina-ni-katya

---

## ✅ Step-by-Step Configuration

### **Step 1: Access Google Cloud Console**

1. Go to: https://console.cloud.google.com/
2. Sign in with your Google account
3. Select project: **kusina-ni-katya**
4. Navigate to: **APIs & Services** → **Credentials**
5. Find your OAuth 2.0 Client ID: `185778585245-6o939pgomkeqnse9rsa3th61b2biacsu`
6. Click **Edit** (pencil icon)

### **Step 2: Configure Authorized JavaScript Origins**

In the **Authorized JavaScript origins** section, add:

```
http://localhost:3000
http://127.0.0.1:3000
```

**Important Notes:**
- ✅ Must include `http://` (not `https://`)
- ✅ No trailing slash (`/`)
- ✅ Must match exactly what appears in browser address bar

### **Step 3: Configure Authorized Redirect URIs**

In the **Authorized redirect URIs** section, add:

```
http://localhost:3000
http://localhost:3000/login.html
http://localhost:3000/signup.html
http://127.0.0.1:3000
```

**Why these URLs?**
- `http://localhost:3000` - Main app redirect
- `http://localhost:3000/login.html` - Login page redirect
- `http://localhost:3000/signup.html` - Signup page redirect

### **Step 4: Save and Wait**

1. Click **Save**
2. **Wait 1-2 minutes** for changes to propagate
3. Clear browser cache (Ctrl+Shift+Delete)
4. Reload your application

---

## 🧪 Verify Configuration

### **Test in Browser Console:**

```javascript
// Check if Google Sign-In loads
setTimeout(() => {
  if (typeof google !== 'undefined' && google.accounts) {
    console.log('✅ Google Sign-In loaded');
    
    // Test initialization
    try {
      google.accounts.id.initialize({
        client_id: '185778585245-6o939pgomkeqnse9rsa3th61b2biacsu.apps.googleusercontent.com',
        callback: (response) => {
          console.log('✅ Google Sign-In callback works');
        }
      });
    } catch (err) {
      console.error('❌ Initialization failed:', err);
    }
  } else {
    console.error('❌ Google Sign-In library not loaded');
  }
}, 3000);
```

### **Check Current Origin:**

```javascript
console.log('Current Origin:', window.location.origin);
// Should output: http://localhost:3000
// Make sure this EXACTLY matches what you added in Google Cloud Console
```

---

## 🔍 Troubleshooting

### **Error: "The given origin is not allowed"**

**Cause**: Origin not in authorized list  
**Fix**: 
1. Double-check spelling: `http://localhost:3000` (no trailing slash)
2. Make sure you saved in Google Cloud Console
3. Wait 2 minutes and clear cache

### **Error: "403 Forbidden"**

**Cause**: Client ID not authorized for this origin  
**Fix**: Follow Step 2 above

### **Error: "Failed to load resource"**

**Cause**: Network issue or origin mismatch  
**Fix**: 
1. Check browser console for exact error
2. Verify origin matches exactly
3. Try incognito mode

---

## 📝 Quick Checklist

- [ ] Added `http://localhost:3000` to **Authorized JavaScript origins**
- [ ] Added `http://localhost:3000` to **Authorized redirect URIs**
- [ ] Added `http://localhost:3000/login.html` to **Authorized redirect URIs**
- [ ] Added `http://localhost:3000/signup.html` to **Authorized redirect URIs**
- [ ] Clicked **Save** in Google Cloud Console
- [ ] Waited 1-2 minutes
- [ ] Cleared browser cache
- [ ] Reloaded page
- [ ] Tested with `window.runDiagnostic()` in console

---

## 🚀 Production Setup (When Ready)

For production, add:
- `https://yourdomain.com` (with https)
- `https://yourdomain.com/login.html`
- `https://yourdomain.com/signup.html`

**Important**: Production MUST use `https://` (not `http://`)

