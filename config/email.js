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
// Default to Resend's test domain (works without verification)
// For production with custom domain, set RESEND_FROM_EMAIL in .env
// Example: RESEND_FROM_EMAIL=noreply@kusinanikatya.ph
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME = process.env.RESEND_FROM_NAME || 'Kusina ni Katya';

// Domain configuration
// Note: Railway domain is for hosting only, NOT for email
// Email domain (kusinanikatya.ph) must be verified separately in Resend
const DOMAIN = 'kusinanikatya.up.railway.app'; // Application hosting domain

// Domain verification status
if (process.env.RESEND_FROM_EMAIL && !process.env.RESEND_FROM_EMAIL.includes('resend.dev')) {
  const emailDomain = process.env.RESEND_FROM_EMAIL.split('@')[1];
  console.log(`✅ Using verified domain: ${emailDomain}`);
  console.log(`📧 Emails will be sent from: ${process.env.RESEND_FROM_EMAIL}`);
  console.log(`🌐 Application domain: ${DOMAIN}`);
} else {
  console.log(`📧 Email domain: ${DOMAIN} (using onboarding@resend.dev for testing)`);
  console.log('💡 To use custom domain, verify it at https://resend.com/domains and set RESEND_FROM_EMAIL');
}

// Export Resend client and helper functions
module.exports = { 
  resend,
  FROM_EMAIL,
  FROM_NAME,
  DOMAIN
};
