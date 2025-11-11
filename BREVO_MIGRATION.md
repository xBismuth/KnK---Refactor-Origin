# 📧 Brevo Email Migration Guide

## ✅ Migration Complete!

Your email service has been successfully migrated from Gmail SMTP to Brevo API.

## What Changed

- ✅ Replaced `nodemailer` with `node-fetch` for Brevo API
- ✅ Removed Gmail SMTP dependencies
- ✅ Updated all email functions to use Brevo
- ✅ Updated environment variable checks
- ✅ Railway-compatible (uses HTTPS, no SMTP ports needed)

## Required Environment Variables

### For Railway Deployment

Add these in your Railway Variables tab:

```env
BREVO_API_KEY=xkeysib-your-api-key-here
FROM_EMAIL=qjredao@tip.edu.ph
FROM_NAME=Kusina Ni Katya
```

### For Local Development (.env file)

```env
BREVO_API_KEY=xkeysib-your-api-key-here
FROM_EMAIL=qjredao@tip.edu.ph
FROM_NAME=Kusina Ni Katya
```

## How to Get Brevo API Key

1. **Sign up**: https://app.brevo.com/account/register
2. **Go to**: Settings → SMTP & API → API Keys
3. **Click**: "Generate a new API key"
4. **Name it**: "Kusina Ni Katya Production"
5. **Copy the key**: It starts with `xkeysib-`
6. **Add to Railway**: Variables tab → Add `BREVO_API_KEY`

## Benefits of Brevo

- ✅ **300 free emails/day** (9,000/month)
- ✅ **Works on all Railway plans** (Free/Hobby/Pro)
- ✅ **No SMTP ports needed** (uses HTTPS API)
- ✅ **Better deliverability** than Gmail SMTP
- ✅ **No domain verification** required
- ✅ **More reliable** than SMTP connections

## Testing

After setting up your Brevo API key:

```bash
# Test email configuration
npm run test-email

# Test sending an email
node test-email.js your-email@example.com
```

## Files Updated

- ✅ `config/email.js` - Brevo API implementation
- ✅ `utils/emailHelper.js` - Updated to use Brevo
- ✅ `controllers/authController.js` - Updated email checks
- ✅ `test-email.js` - Updated for Brevo testing
- ✅ `package.json` - Added node-fetch, removed nodemailer

## Deployment Steps

1. **Get Brevo API key** (see above)
2. **Add to Railway Variables**:
   - `BREVO_API_KEY` = your-api-key
   - `FROM_EMAIL` = qjredao@tip.edu.ph
   - `FROM_NAME` = Kusina Ni Katya
3. **Remove old Gmail variables** (optional, to avoid confusion):
   - `GMAIL_USER`
   - `GMAIL_PASS`
4. **Deploy to Railway** (auto-deploys on push)
5. **Check Railway logs** for:
   ```
   ✅ Brevo email service configured
   📧 From: Kusina Ni Katya <qjredao@tip.edu.ph>
   ```

## Expected Log Output

After successful deployment, you should see:

```
✅ Brevo email service configured
📧 From: Kusina Ni Katya <qjredao@tip.edu.ph>
🌐 Domain: kusinanikatya.up.railway.app
```

When sending emails:

```
✅ Email sent via Brevo to user@example.com (ID: brevo-1234567890)
```

## Troubleshooting

### ❌ "BREVO_API_KEY is not configured"

**Solution**: Add `BREVO_API_KEY` to Railway Variables tab

### ❌ "Brevo API error: Invalid API key"

**Solution**: 
- Verify API key is correct (starts with `xkeysib-`)
- Check for extra spaces in Railway Variables
- Regenerate API key in Brevo dashboard

### ❌ "Brevo API error: Unauthorized"

**Solution**:
- Verify API key is active in Brevo dashboard
- Check account is verified
- Ensure API key has email sending permissions

### ❌ Emails not sending

**Solution**:
1. Check Railway logs for specific error
2. Verify `FROM_EMAIL` is verified in Brevo (if required)
3. Test API key with curl:
   ```bash
   curl -X POST https://api.brevo.com/v3/smtp/email \
     -H "api-key: YOUR_BREVO_KEY" \
     -H "content-type: application/json" \
     -d '{"sender":{"email":"qjredao@tip.edu.ph"},"to":[{"email":"test@test.com"}],"subject":"Test","htmlContent":"Test"}'
   ```

## Success Criteria

- ✅ No more SMTP connection timeout errors
- ✅ Emails successfully sent to users
- ✅ Railway logs show "Email sent via Brevo"
- ✅ All email functions working (OTP, password reset, etc.)
- ✅ No nodemailer dependencies

## Support

- Brevo Documentation: https://developers.brevo.com/
- Brevo Dashboard: https://app.brevo.com/
- Railway Support: https://railway.app/help

