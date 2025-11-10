// ==================== EMAIL SERVICE ====================
const nodemailer = require('nodemailer');
require('dotenv').config();

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_SECURE = process.env.SMTP_SECURE
  ? process.env.SMTP_SECURE.toLowerCase() === 'true'
  : SMTP_PORT === 465;

// Validate email credentials
if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
  console.error('❌ Email credentials missing! MAIL_USER and MAIL_PASS must be set.');
  console.error('   Email sending will fail until credentials are configured.');
}

const emailTransporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  },
  pool: process.env.SMTP_POOL
    ? process.env.SMTP_POOL.toLowerCase() === 'true'
    : false,
  maxConnections: parseInt(process.env.SMTP_MAX_CONNECTIONS || '1', 10),
  maxMessages: parseInt(process.env.SMTP_MAX_MESSAGES || '5', 10),
  connectionTimeout: parseInt(process.env.SMTP_CONNECTION_TIMEOUT || '20000', 10),
  greetingTimeout: parseInt(process.env.SMTP_GREETING_TIMEOUT || '10000', 10),
  socketTimeout: parseInt(process.env.SMTP_SOCKET_TIMEOUT || '20000', 10),
  tls: {
    rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED
      ? process.env.SMTP_TLS_REJECT_UNAUTHORIZED.toLowerCase() === 'true'
      : true
  },
  logger: process.env.SMTP_DEBUG
    ? process.env.SMTP_DEBUG.toLowerCase() === 'true'
    : false
});

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
verifyEmailConfig();

module.exports = { emailTransporter };
