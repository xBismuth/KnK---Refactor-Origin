# 🚀 Deployment Guide - Kusina ni Katya

## 📋 Application Requirements

Your application needs:
- **Node.js** runtime (v18+ recommended)
- **MySQL** database
- **WebSocket/Socket.IO** support (for real-time order updates)
- **Environment variables** (.env file support)
- **SSL/HTTPS** (required for Google OAuth and secure payments)
- **Static file serving** (Public folder)
- **Persistent connections** (for Socket.IO)

---

## 🏆 **TOP RECOMMENDED HOSTING OPTIONS**

### **1. Railway.app** ⭐ **BEST FOR EASE OF USE**
**Why it's perfect:**
- ✅ One-click Node.js deployment
- ✅ Built-in MySQL database
- ✅ Automatic HTTPS/SSL
- ✅ Environment variable management (GUI)
- ✅ WebSocket support (Socket.IO works out of the box)
- ✅ Free tier available ($5/month after)
- ✅ Automatic deployments from Git
- ✅ No server configuration needed

**Pricing:** $5/month (includes database)
**Setup Time:** ~15 minutes

**Deployment Steps:**
1. Sign up at [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Connect your repository
4. Add MySQL database (Railway provides)
5. Set environment variables in Railway dashboard
6. Deploy!

**Environment Variables to Set:**
```
PORT=3000
JWT_SECRET=your-secret-key
DB_HOST=your-railway-mysql-host
DB_USER=root
DB_PASS=your-password
DB_NAME=kusina_db
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
PAYMONGO_SECRET_KEY=your-key
GOOGLE_CLIENT_ID=your-client-id
```

---

### **2. Render.com** ⭐ **BEST FREE TIER**
**Why it's great:**
- ✅ Free tier available (with limitations)
- ✅ Automatic HTTPS
- ✅ WebSocket support
- ✅ MySQL database (free tier available)
- ✅ Environment variables
- ✅ Auto-deploy from Git

**Pricing:** Free tier (with limitations) or $7/month
**Setup Time:** ~20 minutes

**Limitations on Free Tier:**
- Spins down after 15 minutes of inactivity
- May have slower cold starts

**Deployment Steps:**
1. Sign up at [render.com](https://render.com)
2. Create "New Web Service"
3. Connect GitHub repository
4. Set build command: `npm install`
5. Set start command: `node server.js`
6. Add MySQL database (separate service)
7. Configure environment variables

---

### **3. DigitalOcean App Platform** ⭐ **BEST FOR SCALABILITY**
**Why it's excellent:**
- ✅ Professional-grade platform
- ✅ Excellent MySQL support
- ✅ WebSocket support
- ✅ Auto-scaling
- ✅ Great documentation
- ✅ Managed databases

**Pricing:** $5/month (app) + $15/month (database) = $20/month
**Setup Time:** ~25 minutes

**Deployment Steps:**
1. Sign up at [digitalocean.com](https://digitalocean.com)
2. Go to "App Platform"
3. Create new app from GitHub
4. Add managed MySQL database
5. Configure environment variables
6. Deploy

---

### **4. Fly.io** ⭐ **BEST FOR PERFORMANCE**
**Why it's great:**
- ✅ Global edge deployment
- ✅ Fast cold starts
- ✅ WebSocket support
- ✅ MySQL via external service
- ✅ Generous free tier

**Pricing:** Free tier available, $5-10/month for production
**Setup Time:** ~30 minutes

---

### **5. Heroku** ⚠️ **NOT RECOMMENDED**
**Why avoid:**
- ❌ Removed free tier
- ❌ Expensive ($7/month + database)
- ❌ WebSocket support requires add-ons

**If you must use:** $7/month + $5/month database = $12/month

---

## 🔧 **CRITICAL DEPLOYMENT CHECKLIST**

### **Before Deployment:**

1. **Fix package.json merge conflict:**
   ```json
   {
     "dependencies": {
       "axios": "^1.12.2",
       "bcrypt": "^6.0.0",
       "cors": "^2.8.5",
       "dotenv": "^17.2.3",
       "express": "^5.1.0",
       "express-rate-limit": "^8.1.0",
       "google-auth-library": "^10.4.1",
       "jsonwebtoken": "^9.0.2",
       "multer": "^2.0.2",
       "mysql2": "^3.15.2",
       "nodemailer": "^7.0.9",
       "socket.io": "^4.8.1"
     }
   }
   ```

2. **Create `.env.example` file** (for reference):
   ```
   PORT=3000
   JWT_SECRET=your-secret-key-here
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=your-password
   DB_NAME=kusina_db
   MAIL_USER=your-email@gmail.com
   MAIL_PASS=your-app-password
   PAYMONGO_SECRET_KEY=pk_test_xxx
   GOOGLE_CLIENT_ID=your-client-id
   NODE_ENV=production
   ```

3. **Update Google OAuth Settings:**
   - Add your production domain to Authorized JavaScript origins
   - Add production redirect URIs
   - Example: `https://your-app.railway.app`

4. **Update CORS settings in server.js:**
   ```javascript
   // Change from:
   cors: {
     origin: "*",
     methods: ["GET", "POST"]
   }
   
   // To:
   cors: {
     origin: ["https://your-domain.com", "https://your-app.railway.app"],
     methods: ["GET", "POST"],
     credentials: true
   }
   ```

5. **Add `start` script to package.json:**
   ```json
   {
     "scripts": {
       "start": "node server.js"
     }
   }
   ```

---

## 📝 **STEP-BY-STEP: Railway Deployment** (Recommended)

### **Step 1: Prepare Your Code**
1. Fix package.json merge conflict
2. Commit all changes to Git
3. Push to GitHub

### **Step 2: Set Up Railway**
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository

### **Step 3: Add MySQL Database**
1. In Railway project, click "New"
2. Select "Database" → "MySQL"
3. Railway will provide connection details
4. Copy the connection variables

### **Step 4: Configure Environment Variables**
In Railway dashboard, go to your service → Variables tab, add:

```
PORT=3000
JWT_SECRET=generate-a-random-secret-here
DB_HOST=your-mysql-host.railway.app
DB_USER=root
DB_PASS=railway-provided-password
DB_NAME=railway
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-gmail-app-password
PAYMONGO_SECRET_KEY=your-paymongo-key
GOOGLE_CLIENT_ID=your-google-client-id
NODE_ENV=production
```

### **Step 5: Deploy**
1. Railway will automatically detect Node.js
2. It will run `npm install` and `npm start`
3. Your app will be live at `https://your-app.railway.app`

### **Step 6: Update Google OAuth**
1. Go to Google Cloud Console
2. Add `https://your-app.railway.app` to Authorized JavaScript origins
3. Add redirect URIs:
   - `https://your-app.railway.app`
   - `https://your-app.railway.app/login.html`
   - `https://your-app.railway.app/signup.html`

### **Step 7: Test**
1. Visit `https://your-app.railway.app/api/health`
2. Should return: `{"status":"ok","database":"connected",...}`
3. Test login, signup, and order features

---

## 🔒 **SECURITY CHECKLIST**

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Use strong database passwords
- [ ] Enable HTTPS (automatic on Railway/Render)
- [ ] Update CORS to allow only your domain
- [ ] Don't commit `.env` file to Git
- [ ] Use production PayMongo keys (not test keys)
- [ ] Update Google OAuth to production URLs

---

## 🐛 **COMMON ISSUES & FIXES**

### **Issue: Socket.IO not working**
**Solution:** Ensure your hosting supports WebSockets (Railway, Render, and DigitalOcean do)

### **Issue: Database connection fails**
**Solution:** 
- Check database host is correct
- Verify database is accessible from your app
- Check firewall rules

### **Issue: Google OAuth errors**
**Solution:**
- Add production domain to Google Cloud Console
- Wait 1-2 minutes after changes
- Clear browser cache

### **Issue: Static files not loading**
**Solution:**
- Ensure `express.static('Public')` is in server.js (it is)
- Check file paths are relative

### **Issue: Environment variables not loading**
**Solution:**
- Verify all variables are set in hosting dashboard
- Check variable names match exactly
- Restart the service after adding variables

---

## 📊 **COMPARISON TABLE**

| Feature | Railway | Render | DigitalOcean | Fly.io |
|---------|---------|--------|--------------|--------|
| **Ease of Setup** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Free Tier** | ❌ ($5/mo) | ✅ | ❌ | ✅ |
| **MySQL Included** | ✅ | ✅ | ✅ (separate) | ❌ |
| **WebSocket** | ✅ | ✅ | ✅ | ✅ |
| **Auto HTTPS** | ✅ | ✅ | ✅ | ✅ |
| **Git Deploy** | ✅ | ✅ | ✅ | ✅ |
| **Best For** | Quick setup | Free tier | Production | Performance |

---

## 🎯 **MY RECOMMENDATION**

**For your first deployment:** Use **Railway.app**
- Easiest setup (15 minutes)
- Everything works out of the box
- Great documentation
- $5/month is reasonable

**For production/scale:** Use **DigitalOcean App Platform**
- More control
- Better for scaling
- Professional support

---

## 📞 **NEED HELP?**

1. Check Railway/Render documentation
2. Test your app locally first: `node server.js`
3. Check server logs in hosting dashboard
4. Verify all environment variables are set

---

## ✅ **POST-DEPLOYMENT CHECKLIST**

- [ ] App loads at production URL
- [ ] `/api/health` returns OK
- [ ] Database connection works
- [ ] User can sign up
- [ ] User can log in
- [ ] Google OAuth works
- [ ] Orders can be placed
- [ ] Socket.IO real-time updates work
- [ ] Email notifications work
- [ ] Payment processing works (if enabled)

---

**Good luck with your deployment! 🚀**

