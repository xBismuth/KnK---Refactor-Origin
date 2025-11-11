// ==================== EMAIL SERVICE ====================
// Using Brevo API (formerly Sendinblue) for Railway deployment
// Brevo offers 300 free emails/day with HTTPS API (no SMTP ports needed)
// Works on all Railway plans including Free/Hobby

// Load .env file only if it exists (for local development)
// On Railway, environment variables are injected directly, so dotenv is not needed
try {
  require('dotenv').config();
} catch (err) {
  // dotenv not available or .env doesn't exist - this is fine for Railway deployment
}

const fetch = require('node-fetch');

// Brevo API Configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'qjredao@tip.edu.ph';
const FROM_NAME = process.env.FROM_NAME || 'Kusina Ni Katya';
const DOMAIN = process.env.DOMAIN || 'kusinanikatya.up.railway.app';

// Brevo API endpoint
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// Debug logging for Railway
if (!BREVO_API_KEY) {
  console.log('🔍 Environment Variable Check:');
  console.log(`   BREVO_API_KEY: ${BREVO_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   FROM_EMAIL: ${FROM_EMAIL ? '✅ Set' : '❌ Missing'}`);
  console.log(`   FROM_NAME: ${FROM_NAME ? '✅ Set' : '❌ Missing'}`);
  console.log('');
  console.error('❌ Brevo API key not configured!');
  console.error('💡 Brevo Setup:');
  console.error('   1. Sign up: https://app.brevo.com/account/register');
  console.error('   2. Go to: Settings → SMTP & API → API Keys');
  console.error('   3. Generate a new API key');
  console.error('   4. Add BREVO_API_KEY to Railway Variables tab or .env file');
} else {
  // Log API key format for debugging (first 10 chars only)
  const keyPrefix = BREVO_API_KEY.substring(0, 10);
  console.log('✅ Brevo email service configured');
  console.log(`📧 From: ${FROM_NAME} <${FROM_EMAIL}>`);
  console.log(`🌐 Domain: ${DOMAIN}`);
  console.log(`🔑 API Key: ${keyPrefix}... (${BREVO_API_KEY.length} chars)`);
  
  // Warn if using SMTP key (xsmtpsib-) - REST API requires xkeysib- key
  if (BREVO_API_KEY.startsWith('xsmtpsib-')) {
    console.error('❌ ERROR: You are using an SMTP API key (xsmtpsib-), but the REST API requires an API v3 key (xkeysib-)');
    console.error('💡 Solution:');
    console.error('   1. Go to Brevo dashboard: https://app.brevo.com/');
    console.error('   2. Navigate to: Settings → SMTP & API → API Keys');
    console.error('   3. Generate a NEW "API v3" key (NOT SMTP key)');
    console.error('   4. The key should start with "xkeysib-" not "xsmtpsib-"');
    console.error('   5. Update BREVO_API_KEY in Railway Variables with the new key');
  } else if (!BREVO_API_KEY.startsWith('xkeysib-')) {
    console.warn('⚠️  API key format unexpected. Should start with "xkeysib-" for REST API.');
  }
}

/**
 * Send email using Brevo API
 * @param {string} toEmail - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML email content
 * @param {string} text - Plain text content (optional)
 * @returns {Promise<{success: boolean, messageId: string}>}
 */
async function sendEmail(toEmail, subject, html, text = null) {
  if (!BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY is not configured. Add it to Railway Variables or .env file');
  }

  const timestamp = new Date().toISOString();

  try {
    // Trim API key to remove any whitespace
    const apiKey = BREVO_API_KEY.trim();
    
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: FROM_NAME,
          email: FROM_EMAIL
        },
        to: [{ email: toEmail }],
        subject: subject,
        htmlContent: html,
        textContent: text || html.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
      })
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `HTTP ${response.status} ${response.statusText}` };
      }
      
      const errorMessage = errorData.message || errorData.error || errorData.code || `HTTP ${response.status}`;
      
      // Provide helpful error messages
      if (response.status === 401 || errorMessage.includes('Key not found') || errorMessage.includes('Unauthorized')) {
        throw new Error(`Brevo API authentication failed. Check your API key: ${errorMessage}`);
      } else if (response.status === 400) {
        throw new Error(`Brevo API request error: ${errorMessage}`);
      } else if (response.status === 403) {
        throw new Error(`Brevo API access denied: ${errorMessage}`);
      } else {
        throw new Error(`Brevo API error (${response.status}): ${errorMessage}`);
      }
    }

    const result = await response.json();
    const messageId = result.messageId || `brevo-${Date.now()}`;

    console.log(`[${timestamp}] ✅ Email sent via Brevo to ${toEmail} (ID: ${messageId})`);

    return {
      success: true,
      messageId: messageId,
      attempts: 1,
      deliveryInfo: {
        messageId: messageId,
        toEmail,
        subject,
        sentAt: timestamp,
        status: 'sent',
        service: 'brevo'
      }
    };
  } catch (error) {
    const errorTimestamp = new Date().toISOString();
    console.error(`[${errorTimestamp}] ❌ Brevo email send failed:`, error.message);
    throw error;
  }
}

// Export email service components
module.exports = {
  sendEmail,
  FROM_EMAIL,
  FROM_NAME,
  DOMAIN,
  BREVO_API_KEY: BREVO_API_KEY ? '***SET***' : null // Don't expose actual key
};
