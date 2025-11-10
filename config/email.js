// ==================== EMAIL SERVICE ====================
const nodemailer = require('nodemailer');
require('dotenv').config();

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
verifyEmailConfig();

module.exports = { emailTransporter, createFreshTransport };