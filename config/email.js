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

// Get the from email address
// Default to Resend's test domain (works without verification)
// For production, set RESEND_FROM_EMAIL to a verified domain
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME = process.env.RESEND_FROM_NAME || 'Kusina ni Katya';

// Warn if using unverified domain (common mistake)
if (process.env.RESEND_FROM_EMAIL && !process.env.RESEND_FROM_EMAIL.includes('resend.dev')) {
  console.warn('⚠️  Using custom domain email. Make sure it\'s verified at https://resend.com/domains');
  console.warn('   For testing, you can use: onboarding@resend.dev (no verification needed)');
}

// Export Resend client and helper functions
module.exports = { 
  resend,
  FROM_EMAIL,
  FROM_NAME
};
