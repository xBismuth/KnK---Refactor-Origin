# 🔧 Fix: "Key not found" Error

## Problem

You're getting this error:
```
Brevo API error: Key not found
```

## Root Cause

You're using an **SMTP API key** (`xsmtpsib-...`) but the REST API requires an **API v3 key** (`xkeysib-...`).

## Solution

### Step 1: Get the Correct API Key Type

1. Go to Brevo dashboard: https://app.brevo.com/
2. Navigate to: **Settings → SMTP & API → API Keys**
3. **IMPORTANT**: Make sure you select **"API v3"** (NOT "SMTP")
4. Click **"Generate a new API key"**
5. Name it: "Kusina Ni Katya Production"
6. **Copy the ENTIRE key** - it should start with `xkeysib-`

### Step 2: Update Railway Variables

1. Go to your Railway project dashboard
2. Navigate to your service → **Variables** tab
3. Find `BREVO_API_KEY`
4. **Replace** the value with your new API v3 key (starts with `xkeysib-`)
5. Click **Save**

### Step 3: Verify

After Railway redeploys, check the logs. You should see:
```
✅ Brevo email service configured
📧 From: Kusina Ni Katya <qjredao@tip.edu.ph>
🔑 API Key: xkeysib-... (XX chars)
```

## Key Differences

| Key Type | Prefix | Use Case |
|----------|--------|----------|
| **API v3** | `xkeysib-` | ✅ REST API (what we need) |
| **SMTP** | `xsmtpsib-` | ❌ SMTP only (won't work) |

## Quick Test

After updating, test with:
```bash
node test-email.js your-email@example.com
```

You should see:
```
✅ Email sent via Brevo to your-email@example.com (ID: brevo-...)
```

## Still Having Issues?

1. **Verify key format**: Must start with `xkeysib-` (not `xsmtpsib-`)
2. **Check for spaces**: No spaces before/after the key in Railway Variables
3. **Verify account**: Make sure your Brevo account is verified
4. **Check permissions**: API key should have email sending permissions

