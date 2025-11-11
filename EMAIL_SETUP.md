# 📧 Email Setup Guide - Gmail SMTP (FREE, No Domain Verification!)

Your website now uses **Nodemailer with Gmail SMTP** for sending verification emails. This is **completely FREE** and requires **NO domain verification**!

## ✅ Benefits

- ✅ **100% FREE** - No paid services needed
- ✅ **No Domain Verification** - Works immediately
- ✅ **Fast Delivery** - Emails arrive in seconds
- ✅ **500 emails/day limit** - Perfect for small websites
- ✅ **Works with any Gmail account**

## 🚀 Quick Setup (5 minutes)

### Step 1: Enable 2-Step Verification

1. Go to your Google Account: https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not already enabled)
3. This is required to generate an App Password

### Step 2: Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Select **"Mail"** as the app
3. Select **"Other (Custom name)"** as the device
4. Enter name: **"Kusina ni Katya Website"**
5. Click **"Generate"**
6. **Copy the 16-character password** (you'll need this!)

### Step 3: Add to .env File

Add these lines to your `.env` file:

```env
# Gmail SMTP Configuration (FREE - No domain verification needed!)
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-16-character-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Kusina ni Katya

# Optional: Use Resend instead (requires domain verification)
# EMAIL_SERVICE=resend
# RESEND_API_KEY=your-resend-api-key
```

**Important:**
- Use your **Gmail address** for `GMAIL_USER` and `FROM_EMAIL`
- Use the **16-character App Password** (not your regular Gmail password)
- The App Password looks like: `abcd efgh ijkl mnop` (remove spaces when adding to .env)

### Step 4: Restart Your Server

Restart your Node.js server to load the new configuration.

## 🧪 Test It

1. Try signing up with a new email address
2. Check your email inbox (and spam folder)
3. You should receive the verification code within seconds!

## 📊 Limits

- **500 emails per day** (Gmail free limit)
- This is usually enough for small to medium websites
- If you need more, consider upgrading to a paid service later

## 🔄 Switching Back to Resend

If you want to use Resend instead (after verifying your domain), just add to `.env`:

```env
EMAIL_SERVICE=resend
RESEND_API_KEY=your-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

## ❓ Troubleshooting

### "Gmail SMTP connection failed"
- Make sure 2-Step Verification is enabled
- Verify you're using the App Password (not regular password)
- Check that `GMAIL_USER` and `GMAIL_PASS` are set correctly in `.env`

### "Authentication failed"
- Regenerate your App Password
- Make sure there are no extra spaces in the password
- Verify your Gmail account is active

### Emails going to spam
- This is normal for new email senders
- Gmail will learn over time that your emails are legitimate
- Make sure your email content is professional

## 🎉 You're All Set!

Your website can now send verification emails quickly and for free, without any domain verification!

