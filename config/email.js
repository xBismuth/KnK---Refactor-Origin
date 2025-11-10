// ==================== EMAIL SERVICE ====================
// Using Resend API for reliable email delivery in cloud environments
const { Resend } = require('resend');
require('dotenv').config();

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Validate Resend API key
if (!process.env.RESEND_API_KEY) {
  console.error('❌ Resend API key missing! RESEND_API_KEY must be set.');
  console.error('   Get your API key from: https://resend.com/api-keys');
  console.error('   Email sending will fail until RESEND_API_KEY is configured.');
} else {
  console.log('✅ Resend email service initialized');
}

// Get the from email address (use RESEND_FROM_EMAIL or fallback to MAIL_USER)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || process.env.MAIL_USER || 'onboarding@resend.dev';
const FROM_NAME = process.env.RESEND_FROM_NAME || 'Kusina ni Katya';

// Export Resend client and helper functions
module.exports = { 
  resend,
  FROM_EMAIL,
  FROM_NAME
};
