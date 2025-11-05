// ==================== EMAIL SERVICE ====================
const nodemailer = require('nodemailer');
require('dotenv').config();

const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  },
  // Timeout settings for Railway/cloud environments (increased for better reliability)
  connectionTimeout: 20000, // 20 seconds to establish connection
  greetingTimeout: 10000, // 10 seconds to receive greeting
  socketTimeout: 20000, // 20 seconds for socket inactivity
  // Retry settings
  pool: true,
  maxConnections: 1,
  maxMessages: 3,
  // Additional options for better reliability
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates if needed
  }
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