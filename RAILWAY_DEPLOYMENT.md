# 🚂 Railway.com Deployment Guide - Email Configuration

## ✅ Railway.com Compatibility Verified

Your email system uses **Brevo API** which is **fully compatible** with Railway.com hosting!

### Railway.com Email Support

✅ **Brevo API (HTTPS)** - Works on ALL Railway plans (Free/Hobby/Pro)  
✅ **No SMTP ports needed** - Uses HTTPS API (port 443)  
✅ **Better deliverability** - Professional email service  
✅ **300 free emails/day** - 9,000 emails/month  

### What Works on Railway

1. **Brevo API** - Fully supported on all plans
2. **HTTPS API** - No port blocking issues
3. **Reliable delivery** - Better than SMTP
4. **Retry Logic** - Handles network issues gracefully
5. **Fast Delivery** - Non-blocking email sends

## Environment Variables for Railway

Add these to your Railway project's environment variables:

```env
# Brevo API Configuration
BREVO_API_KEY=xkeysib-your-api-key-here
FROM_EMAIL=qjredao@tip.edu.ph
FROM_NAME=Kusina Ni Katya
```

**Important:**
- Get API key from: https://app.brevo.com/account/register
- Go to: Settings → SMTP & API → API Keys
- Generate a new API key (starts with `xkeysib-`)
- No spaces in API key

## Railway Deployment Checklist

- [ ] Brevo account created
- [ ] API key generated
- [ ] Environment variables set in Railway dashboard
- [ ] `BREVO_API_KEY` added to Railway Variables
- [ ] `FROM_EMAIL` set to your email
- [ ] `FROM_NAME` set to "Kusina Ni Katya"
- [ ] Deploy to Railway
- [ ] Check Railway logs for email connection status
- [ ] Test email sending after deployment

## Testing on Railway

After deployment, check Railway logs for:
```
✅ Brevo email service configured
📧 From: Kusina Ni Katya <qjredao@tip.edu.ph>
```

When sending emails:
```
✅ Email sent via Brevo to user@example.com (ID: brevo-1234567890)
```

## Troubleshooting on Railway

### If emails don't send:

1. **Check Railway logs** - Look for email connection errors
2. **Verify API key** - Must start with `xkeysib-`
3. **Check environment variables** - Make sure they're set in Railway dashboard
4. **Restart service** - After changing env vars, restart the Railway service

### Common Railway Issues:

- ✅ **Port blocking** - Not an issue, Brevo uses HTTPS
- ✅ **Firewall** - Not an issue, Brevo uses HTTPS
- ⚠️ **API Key** - Most common issue, verify it's correct

## Success Indicators

When deployed to Railway, you should see in logs:
- ✅ Brevo email service configured
- ✅ From email configured
- ✅ Ready to send emails

Then your emails will work perfectly on Railway! 🚀

## Migration from Gmail SMTP

If you were previously using Gmail SMTP, see `BREVO_MIGRATION.md` for migration details.
