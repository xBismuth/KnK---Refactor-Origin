# 🏠 Hostinger Hosting Guide for Node.js App

## ⚠️ **IMPORTANT: Hostinger Shared Hosting WON'T WORK**

**Hostinger's shared hosting plans (Web Hosting, WordPress Hosting, Cloud Hosting) do NOT support Node.js applications.**

They are designed for:
- PHP applications
- WordPress sites
- Static websites
- LAMP stack (Linux, Apache, MySQL, PHP)

**Your app requires:**
- ✅ Node.js runtime
- ✅ Socket.IO (WebSocket support)
- ✅ Express.js server
- ✅ Custom server process

---

## ✅ **YES, You CAN Use Hostinger VPS**

Hostinger's **VPS (Virtual Private Server)** hosting **DOES support Node.js**, but it requires manual setup.

### **Hostinger VPS Plans:**
- **VPS 1**: $4.99/month (1 vCPU, 1GB RAM) - Too small for your app
- **VPS 2**: $8.99/month (2 vCPU, 2GB RAM) - Minimum recommended
- **VPS 3**: $12.99/month (2 vCPU, 4GB RAM) - Better for production
- **VPS 4+**: Higher tiers available

**VPS Features:**
- ✅ Full root access (SSH)
- ✅ Node.js support (manual installation)
- ✅ MySQL/MariaDB database
- ✅ WebSocket support (with proper config)
- ✅ Custom server configuration
- ✅ Full control over environment

---

## 🔧 **Deployment Steps for Hostinger VPS**

### **Step 1: Purchase VPS Plan**
1. Go to [hostinger.com](https://hostinger.com)
2. Select VPS 2 or higher (minimum 2GB RAM)
3. Choose Ubuntu 22.04 with Node.js template (if available)
4. Complete purchase

### **Step 2: Initial Server Setup**

**SSH into your server:**
```bash
ssh root@your-server-ip
```

**Install Node.js (if not pre-installed):**
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify installation
node --version
npm --version
```

**Install MySQL:**
```bash
apt install -y mysql-server
mysql_secure_installation
```

**Install PM2 (Process Manager):**
```bash
npm install -g pm2
```

### **Step 3: Upload Your Application**

**Option A: Using Git (Recommended)**
```bash
# Install Git
apt install -y git

# Clone your repository
cd /var/www
git clone https://github.com/your-username/your-repo.git
cd your-repo

# Install dependencies
npm install
```

**Option B: Using FTP/SFTP**
1. Use FileZilla or WinSCP
2. Upload all files to `/var/www/your-app`
3. SSH and run `npm install`

### **Step 4: Configure Environment Variables**

**Create `.env` file:**
```bash
cd /var/www/your-app
nano .env
```

**Add your environment variables:**
```
PORT=3000
JWT_SECRET=your-secret-key
DB_HOST=localhost
DB_USER=root
DB_PASS=your-mysql-password
DB_NAME=kusina_db
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
PAYMONGO_SECRET_KEY=your-key
GOOGLE_CLIENT_ID=your-client-id
NODE_ENV=production
```

**Create MySQL database:**
```bash
mysql -u root -p
```
```sql
CREATE DATABASE kusina_db;
CREATE USER 'kusina_user'@'localhost' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON kusina_db.* TO 'kusina_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### **Step 5: Install and Configure Nginx (Reverse Proxy)**

**Install Nginx:**
```bash
apt install -y nginx
```

**Create Nginx configuration:**
```bash
nano /etc/nginx/sites-available/kusina-app
```

**Add this configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable the site:**
```bash
ln -s /etc/nginx/sites-available/kusina-app /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### **Step 6: Install SSL Certificate (Let's Encrypt)**

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com -d www.your-domain.com
```

### **Step 7: Start Your Application with PM2**

```bash
cd /var/www/your-app
pm2 start server.js --name kusina-app
pm2 save
pm2 startup
```

**PM2 Commands:**
```bash
pm2 list              # View running apps
pm2 logs kusina-app    # View logs
pm2 restart kusina-app # Restart app
pm2 stop kusina-app    # Stop app
```

### **Step 8: Configure Firewall**

```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

---

## ⚖️ **Hostinger VPS vs. Railway/Render**

| Feature | Hostinger VPS | Railway | Render |
|---------|---------------|---------|--------|
| **Setup Time** | 2-3 hours | 15 minutes | 20 minutes |
| **Technical Skill** | Advanced | Beginner | Beginner |
| **Node.js Support** | ✅ Manual | ✅ Automatic | ✅ Automatic |
| **MySQL Included** | ✅ Manual | ✅ Automatic | ✅ Automatic |
| **SSL Certificate** | ✅ Manual (Let's Encrypt) | ✅ Automatic | ✅ Automatic |
| **WebSocket Support** | ✅ Manual config | ✅ Automatic | ✅ Automatic |
| **Auto-Deploy** | ❌ Manual | ✅ Git | ✅ Git |
| **Process Manager** | Manual (PM2) | ✅ Automatic | ✅ Automatic |
| **Cost** | $8.99-$12.99/mo | $5/mo | Free/$7/mo |
| **Support** | Limited | Good | Good |

---

## 🎯 **Recommendation**

### **Use Hostinger VPS if:**
- ✅ You already have a Hostinger account
- ✅ You want more server control
- ✅ You're comfortable with Linux/SSH
- ✅ You need a specific server location
- ✅ You want to learn server management

### **Use Railway/Render if:**
- ✅ You want easy deployment (recommended)
- ✅ You're not comfortable with Linux
- ✅ You want automatic updates
- ✅ You want Git-based deployment
- ✅ You want better support

---

## 🚨 **Common Issues with Hostinger VPS**

### **Issue: Socket.IO not working**
**Solution:** Ensure Nginx is configured for WebSocket:
```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
```

### **Issue: App crashes on server restart**
**Solution:** Use PM2 startup:
```bash
pm2 startup
pm2 save
```

### **Issue: Port 3000 not accessible**
**Solution:** Use Nginx reverse proxy (don't expose port 3000 directly)

### **Issue: Database connection fails**
**Solution:** 
- Check MySQL is running: `systemctl status mysql`
- Verify database credentials in `.env`
- Check firewall rules

---

## 📝 **Quick Setup Script for Hostinger VPS**

Save this as `setup.sh` and run it on your VPS:

```bash
#!/bin/bash

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install MySQL
apt install -y mysql-server

# Install PM2
npm install -g pm2

# Install Nginx
apt install -y nginx

# Install Certbot
apt install -y certbot python3-certbot-nginx

echo "✅ Basic setup complete!"
echo "Next steps:"
echo "1. Configure MySQL database"
echo "2. Upload your application"
echo "3. Configure Nginx"
echo "4. Install SSL certificate"
echo "5. Start app with PM2"
```

---

## 💡 **Alternative: Use Hostinger Domain + Railway/Render**

**Best of both worlds:**
1. Buy domain from Hostinger ($0.99-$10/year)
2. Deploy app on Railway ($5/month)
3. Point Hostinger domain to Railway

**Benefits:**
- ✅ Cheap domain
- ✅ Easy deployment (Railway)
- ✅ No server management
- ✅ Professional setup

**Steps:**
1. Deploy on Railway
2. Get Railway URL: `https://your-app.railway.app`
3. In Hostinger DNS settings, add CNAME:
   - Type: CNAME
   - Name: @ or www
   - Value: `your-app.railway.app`
4. Wait for DNS propagation (5-30 minutes)

---

## ✅ **Summary**

**Can you use Hostinger?**
- ❌ **Shared hosting:** NO ❌
- ✅ **VPS hosting:** YES ✅ (but requires manual setup)

**My recommendation:**
- **Easy route:** Railway.app + Hostinger domain ($5.99/month total)
- **Learning route:** Hostinger VPS ($8.99/month, more setup)

For most users, **Railway + Hostinger domain** is the best combination:
- Easy deployment
- Professional setup
- No server management
- Affordable

---

**Questions?** Check Railway deployment guide in `DEPLOYMENT_GUIDE.md`

