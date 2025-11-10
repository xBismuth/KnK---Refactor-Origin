# Resend Email API Setup Guide

## 🔑 Setting Up Your Resend API Key

### Step 1: Create `.env` File

Create a `.env` file in the root directory of your project with the following content:

```env
# ==================== RESEND EMAIL API ====================
RESEND_API_KEY=re_your_api_key_here
# RESEND_FROM_EMAIL is optional - defaults to onboarding@resend.dev (works without verification)
# Only set this if you have a verified domain in Resend
# RESEND_FROM_EMAIL=onboarding@resend.dev
RESEND_FROM_NAME=Kusina ni Katya

# ==================== DATABASE CONFIGURATION ====================
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=kusina_db
DB_PORT=3306

# ==================== JWT SECRET ====================
JWT_SECRET=your-super-secret-key-change-this

# ==================== SERVER CONFIGURATION ====================
PORT=3000
NODE_ENV=development
```

### Step 2: Email Domain Setup

**For Testing (Recommended):**
- ✅ **No setup needed!** The system defaults to `onboarding@resend.dev`
- ✅ This works immediately without any domain verification
- ✅ Just set your `RESEND_API_KEY` and you're ready to go

**For Production:**
1. Go to [Resend Dashboard](https://resend.com/domains)
2. Add and verify your domain
3. Set `RESEND_FROM_EMAIL` in `.env` to use your verified domain email
   ```env
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

**Note:** If you don't set `RESEND_FROM_EMAIL`, it will automatically use `onboarding@resend.dev` which works perfectly for testing and development.

### Step 3: Test Email Sending

After setting up your `.env` file, restart your server:

```bash
npm start
```

The server will automatically:
- ✅ Initialize Resend with your API key
- ✅ Send verification codes when users sign up
- ✅ Send login verification codes
- ✅ Send password reset codes

## 📧 Email Features

### Automatic Email Sending

The system automatically sends emails for:
- **Signup Verification** - When a new user registers
- **Login Verification** - When a user logs in
- **Password Reset** - When a user requests password reset
- **Contact Form** - When someone submits the contact form

### Retry Logic

The email system includes automatic retry:
- **3 retry attempts** for failed sends
- **Exponential backoff** (1s, 2s, 4s delays)
- **Automatic retry** on server errors (500+) and rate limits (429)
- **Network error handling** with automatic retries

### Delivery Tracking

Track email delivery status:
- View delivery status: `GET /api/admin/email-status?key=YOUR_ADMIN_KEY`
- Each email gets a unique message ID from Resend
- Track attempts, timestamps, and delivery status

## 🔒 Security Notes

⚠️ **IMPORTANT:**
- Never commit your `.env` file to Git (it's already in `.gitignore`)
- Never share your API key publicly
- Rotate your API key if it's ever exposed
- Use environment variables in production (Railway, Heroku, etc.)

## 📊 Monitoring Email Status

### Check Email Delivery Status

```bash
# In development mode
curl http://localhost:3000/api/admin/email-status

# In production (requires ADMIN_API_KEY)
curl http://your-domain.com/api/admin/email-status?key=YOUR_ADMIN_KEY
```

Response:
```json
{
  "success": true,
  "total": 5,
  "emails": [
    {
      "messageId": "abc123",
      "toEmail": "user@example.com",
      "subject": "Your Verification Code",
      "sentAt": "2025-01-10T12:00:00.000Z",
      "attempts": 1,
      "status": "sent"
    }
  ]
}
```

## 🎨 Email Templates

All emails use beautiful HTML templates with:
- Branded design (Kusina ni Katya colors)
- Large, readable verification codes
- Security warnings
- 10-minute expiration notices
- Mobile-responsive design

## 🚀 Production Deployment

For production (Railway, Heroku, etc.):

1. Add environment variables in your hosting platform
2. Set `RESEND_API_KEY` to your production API key
3. Set `RESEND_FROM_EMAIL` to your verified domain email
4. Set `NODE_ENV=production`

The system will automatically use these environment variables.

## 📝 Troubleshooting

### Email Not Sending?

1. **Check API Key**: Verify `RESEND_API_KEY` is set in `.env`
2. **Check Domain**: Ensure `RESEND_FROM_EMAIL` uses a verified domain
3. **Check Logs**: Look for error messages in server console
4. **Test Connection**: Visit `/api/health` to verify email service status

### Common Errors

- `Resend API key not configured` → Add `RESEND_API_KEY` to `.env`
- `Invalid from address` → Use a verified domain email
- `Rate limit exceeded` → System will auto-retry with backoff

## 📚 Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend API Keys](https://resend.com/api-keys)
- [Resend Domains](https://resend.com/domains)

