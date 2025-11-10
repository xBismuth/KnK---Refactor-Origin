// ==================== EMAIL SERVICE ====================
const nodemailer = require('nodemailer');
const axios = require('axios');
require('dotenv').config();

// Email provider: 'resend' (API) or 'smtp' (nodemailer)
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'smtp'; // 'resend' or 'smtp'
const RESEND_API_KEY = process.env.RESEND_API_KEY;

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
// Use port 587 (STARTTLS) by default - more reliable in cloud environments than 465 (SSL)
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_SECURE = process.env.SMTP_SECURE
  ? process.env.SMTP_SECURE.toLowerCase() === 'true'
  : SMTP_PORT === 465; // Only secure for port 465

// Create base transport config
const createTransportConfig = () => ({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE, // false for 587 (STARTTLS), true for 465 (SSL)
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  },
  // Disable pooling to avoid connection timeout issues
  // Each email gets a fresh connection
  pool: process.env.SMTP_POOL
    ? process.env.SMTP_POOL.toLowerCase() === 'true'
    : false, // Default to false to avoid connection timeout issues
  maxConnections: parseInt(process.env.SMTP_MAX_CONNECTIONS || '1', 10),
  maxMessages: parseInt(process.env.SMTP_MAX_MESSAGES || '1', 10),
  // Increased timeouts for cloud environments
  connectionTimeout: parseInt(process.env.SMTP_CONNECTION_TIMEOUT || '30000', 10), // 30s for cloud
  greetingTimeout: parseInt(process.env.SMTP_GREETING_TIMEOUT || '15000', 10), // 15s
  socketTimeout: parseInt(process.env.SMTP_SOCKET_TIMEOUT || '30000', 10), // 30s
  // Require TLS for port 587
  requireTLS: SMTP_PORT === 587,
  tls: {
    rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED
      ? process.env.SMTP_TLS_REJECT_UNAUTHORIZED.toLowerCase() === 'true'
      : true
  },
  logger: process.env.SMTP_DEBUG
    ? process.env.SMTP_DEBUG.toLowerCase() === 'true'
    : false,
  debug: process.env.SMTP_DEBUG
    ? process.env.SMTP_DEBUG.toLowerCase() === 'true'
    : false
});

// Create main transporter
const emailTransporter = nodemailer.createTransport(createTransportConfig());

// Function to create a fresh transporter (for retries)
const createFreshTransport = () => {
  return nodemailer.createTransport(createTransportConfig());
};

// Verify email configuration (non-blocking, async)
// This runs in the background and won't block server startup
const verifyEmailConfig = async () => {
  try {
    // Add timeout to verification
    const verifyPromise = emailTransporter.verify();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email verification timeout')), 15000)
    );
    
    await Promise.race([verifyPromise, timeoutPromise]);
    console.log('✅ Email service ready');
  } catch (error) {
    // Don't block server startup - email will be attempted on send
    console.warn('⚠️ Email verification failed (will retry on send):', error.message);
    console.warn('   This is normal in cloud environments. Email sending will still work.');
  }
};

// Run verification asynchronously (non-blocking)
if (EMAIL_PROVIDER === 'smtp') {
  verifyEmailConfig();
}

// ==================== RESEND API EMAIL SERVICE ====================
// Resend is a modern email API service - more reliable than SMTP in cloud environments
// Free tier: 3,000 emails/month
// Sign up at: https://resend.com
const sendEmailViaResend = async (to, subject, html, fromName = 'Kusina ni Katya') => {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.MAIL_USER;
  if (!fromEmail) {
    throw new Error('RESEND_FROM_EMAIL or MAIL_USER is not configured');
  }

  try {
    const response = await axios.post(
      'https://api.resend.com/emails',
      {
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject: subject,
        html: html
      },
      {
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    console.log(`✅ Email sent via Resend to ${to}:`, response.data.id);
    return { success: true, messageId: response.data.id };
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
    console.error(`❌ Resend API error for ${to}:`, errorMsg);
    throw new Error(`Resend API error: ${errorMsg}`);
  }
};

// ==================== UNIFIED EMAIL SENDER ====================
// This function automatically uses Resend API if configured, otherwise falls back to SMTP
const sendEmail = async (to, subject, html, fromName = 'Kusina ni Katya') => {
  if (EMAIL_PROVIDER === 'resend' && RESEND_API_KEY) {
    return await sendEmailViaResend(to, subject, html, fromName);
  } else {
    // Fallback to SMTP
    const mailOptions = {
      from: {
        name: fromName,
        address: process.env.MAIL_USER
      },
      to: to,
      subject: subject,
      html: html
    };

    try {
      const info = await emailTransporter.sendMail(mailOptions);
      console.log(`✅ Email sent via SMTP to ${to}:`, info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`❌ SMTP error for ${to}:`, error.message);
      throw error;
    }
  }
};

module.exports = { 
  emailTransporter, 
  createFreshTransport,
  sendEmail,
  EMAIL_PROVIDER,
  RESEND_API_KEY
};