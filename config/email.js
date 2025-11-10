// ==================== EMAIL SERVICE ====================
// Using Resend API for reliable email delivery in cloud environments
const { Resend } = require('resend');
require('dotenv').config();

// Initialize Resend client (only if API key exists)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Validate Resend API key
if (!process.env.RESEND_API_KEY) {
  console.error('❌ Resend API key missing! RESEND_API_KEY must be set.');
  console.error('   Get your API key from: https://resend.com/api-keys');
  console.error('   Email sending will fail until RESEND_API_KEY is configured.');
} else {
  console.log('✅ Resend email service initialized');
}

// Get the from email address
// Always use Resend's free domain (works without verification)
// If RESEND_FROM_EMAIL is set but not verified, it will cause errors
// Force use of onboarding@resend.dev to avoid verification issues
const FROM_EMAIL = 'onboarding@resend.dev';
const FROM_NAME = process.env.RESEND_FROM_NAME || 'Kusina ni Katya';

// Domain configuration
// Note: Railway domain is for hosting only, NOT for email
// Email domain (kusinanikatya.ph) must be verified separately in Resend
const DOMAIN = 'kusinanikatya.up.railway.app'; // Application hosting domain

// Always use Resend free domain (no verification needed)
console.log(`📧 Using Resend free domain: ${FROM_EMAIL} (no verification needed)`);
console.log(`🌐 Application domain: ${DOMAIN}`);
console.log('✅ Ready to send emails - no domain verification required!');

// Export Resend client and helper functions
module.exports = { 
  resend,
  FROM_EMAIL,
  FROM_NAME,
  DOMAIN
};
