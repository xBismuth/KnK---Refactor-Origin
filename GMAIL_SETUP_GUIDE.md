# 📧 Gmail SMTP Setup Verification Guide

## Quick Verification

Run this command to verify your Gmail setup:
```bash
npm run verify-gmail
```

Or directly:
```bash
node verify-gmail-setup.js
```

## Step-by-Step Verification

### 1. Check Your .env File

Make sure you have these in your `.env` file:
```env
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-16-character-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Kusina Ni Katya
```

**Important:**
- `GMAIL_USER` should be your full Gmail address
- `GMAIL_PASS` should be a 16-character App Password (NOT your regular password)
- Remove ALL spaces from the App Password

### 2. Verify Gmail Account Setup

#### Enable 2-Step Verification
1. Go to: https://myaccount.google.com/security
2. Find "2-Step Verification"
3. If it's OFF, click "Get Started" and enable it
4. Follow the setup process

#### Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" as the app
3. Select "Other (Custom name)" as the device
4. Enter name: "Kusina Ni Katya Website"
5. Click "Generate"
6. **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)
7. **Remove spaces** when adding to .env: `abcdefghijklmnop`

### 3. Common Issues & Solutions

#### ❌ Error: "EAUTH" (Authentication Failed)

**Problem:** App Password is incorrect or not set up properly.

**Solutions:**
- ✅ Make sure 2-Step Verification is enabled
- ✅ Generate a NEW App Password (old ones might be revoked)
- ✅ Copy the password EXACTLY (16 characters, no spaces)
- ✅ Don't use your regular Gmail password
- ✅ Update `.env` file and restart server

#### ❌ Error: "ECONNREFUSED" or "ETIMEDOUT"

**Problem:** Port 465 or 587 is blocked by firewall.

**Solutions:**
- ✅ Check if your network allows outbound SMTP (ports 465/587)
- ✅ If on Railway/Render/Vercel, check their firewall settings
- ✅ The system will automatically try port 587 if 465 fails
- ✅ Contact your hosting provider if ports are blocked

#### ❌ Error: "ENOTFOUND" or "EDNS"

**Problem:** DNS resolution failed.

**Solutions:**
- ✅ Check your internet connection
- ✅ Check DNS settings
- ✅ Try again in a few moments

#### ⚠️ App Password Format Issues

**Problem:** Password doesn't look like an App Password.

**Signs:**
- Password is not 16 characters
- Password contains spaces (should be removed)
- Password looks like your regular password

**Solution:**
- Generate a new App Password at: https://myaccount.google.com/apppasswords
- Copy it exactly (16 characters)
- Remove spaces when adding to .env

### 4. Test Email Sending

After verification passes, test sending an email:
```bash
npm run test-email your-email@example.com
```

This will:
- ✅ Test SMTP connection
- ✅ Send a test verification email
- ✅ Show timing information
- ✅ Confirm everything works

### 5. Verify in Your Code

Your email system uses:
- **Library:** Nodemailer v7.0.9
- **SMTP:** smtp.gmail.com
- **Ports:** 465 (SSL) with fallback to 587 (TLS)
- **Authentication:** Gmail App Password

### 6. Quick Checklist

- [ ] 2-Step Verification enabled
- [ ] App Password generated (16 characters)
- [ ] GMAIL_USER set in .env
- [ ] GMAIL_PASS set in .env (no spaces)
- [ ] FROM_EMAIL set in .env
- [ ] FROM_NAME set in .env
- [ ] Server restarted after .env changes
- [ ] Verification script passes
- [ ] Test email sends successfully

## Still Having Issues?

1. **Run verification script:**
   ```bash
   npm run verify-gmail
   ```

2. **Check the error message** - it will tell you exactly what's wrong

3. **Common fixes:**
   - Regenerate App Password
   - Remove spaces from App Password
   - Restart server after .env changes
   - Check firewall/network settings

4. **Test connection:**
   ```bash
   npm run test-email your-email@example.com
   ```

## Success Indicators

When everything is correct, you'll see:
- ✅ Port 465 (SSL) connection successful!
- ✅ Your Gmail App Password is CORRECT!
- ✅ Network settings are OK!
- ✅ Everything is configured properly!

Then your emails will send quickly and reliably! 🚀

