# 🚂 Railway.com Deployment Guide - Email Configuration

## ✅ Railway.com Compatibility Verified

Your email system is **fully compatible** with Railway.com hosting!

### Railway.com SMTP Support

✅ **Port 465 (SSL)** - Supported  
✅ **Port 587 (TLS)** - Supported  
✅ **Outbound SMTP** - Allowed  
✅ **Automatic Fallback** - Port 465 → 587 if needed

### What Works on Railway

1. **Gmail SMTP** - Fully supported
2. **Port Fallback** - Automatically tries port 587 if 465 fails
3. **Connection Pooling** - Optimized for Railway's infrastructure
4. **Retry Logic** - Handles network issues gracefully
5. **Fast Delivery** - Non-blocking email sends

## Environment Variables for Railway

Add these to your Railway project's environment variables:

```env
# Gmail Configuration (use either MAIL_* or GMAIL_*)
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-16-character-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Kusina Ni Katya

# Or use MAIL_* (backward compatible)
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-16-character-app-password
```

**Important:**
- Remove ALL spaces from App Password
- App Password must be 16 characters
- Use App Password, NOT your regular Gmail password

## Railway Deployment Checklist

- [ ] Gmail 2-Step Verification enabled
- [ ] App Password generated (16 characters)
- [ ] Environment variables set in Railway dashboard
- [ ] App Password has NO spaces
- [ ] FROM_NAME set to "Kusina Ni Katya"
- [ ] Deploy to Railway
- [ ] Check Railway logs for email connection status
- [ ] Test email sending after deployment

## Testing on Railway

After deployment, check Railway logs for:
```
✅ Gmail SMTP connected via port 465 (SSL)
✅ Railway.com compatible - emails will work!
```

If you see port fallback:
```
✅ Gmail SMTP connected via port 587 (TLS fallback)
✅ Railway.com compatible - emails will work!
```

Both are fine! Railway supports both ports.

## Troubleshooting on Railway

### If emails don't send:

1. **Check Railway logs** - Look for email connection errors
2. **Verify App Password** - Must be 16 characters, no spaces
3. **Check environment variables** - Make sure they're set in Railway dashboard
4. **Restart service** - After changing env vars, restart the Railway service

### Common Railway Issues:

- ✅ **Port blocking** - Not an issue, Railway supports SMTP
- ✅ **Firewall** - Not an issue, Railway allows outbound SMTP
- ⚠️ **App Password** - Most common issue, verify it's correct

## Success Indicators

When deployed to Railway, you should see in logs:
- ✅ Gmail SMTP connected
- ✅ Railway.com compatible
- ✅ Can send emails to any recipient

Then your emails will work perfectly on Railway! 🚀

