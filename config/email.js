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
  // Timeout settings for Railway/cloud environments
  connectionTimeout: 10000, // 10 seconds to establish connection
  greetingTimeout: 5000, // 5 seconds to receive greeting
  socketTimeout: 10000, // 10 seconds for socket inactivity
  // Retry settings
  pool: true,
  maxConnections: 1,
  maxMessages: 3,
  // Additional options for better reliability
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates if needed
  }
});

// Verify email configuration
emailTransporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error.message);
  } else {
    console.log('✅ Email service ready');
  }
});

module.exports = { emailTransporter };