// ==================== EMAIL SERVICE ====================
// Using Nodemailer with Gmail SMTP for free, fast email delivery (no domain verification needed)
const nodemailer = require('nodemailer');
require('dotenv').config();

// Email service configuration
// Priority: Gmail SMTP (free, no domain verification) > Resend (if configured)
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'gmail'; // 'gmail' or 'resend'

// Gmail SMTP Configuration (FREE - No domain verification needed!)
// Limits: 500 emails/day (usually enough for small websites)
const GMAIL_USER = process.env.GMAIL_USER || process.env.EMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS || process.env.EMAIL_PASS; // App Password, not regular password

// Resend Configuration (optional - requires domain verification)
const { Resend } = require('resend');
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Get the from email address
const FROM_EMAIL = process.env.FROM_EMAIL || GMAIL_USER || 'onboarding@resend.dev';
const FROM_NAME = process.env.FROM_NAME || process.env.RESEND_FROM_NAME || 'Kusina ni Katya';

// Domain configuration
const DOMAIN = process.env.DOMAIN || 'kusinanikatya.up.railway.app';

// Initialize Nodemailer transporter (Gmail SMTP)
let transporter = null;

if (EMAIL_SERVICE === 'gmail' && GMAIL_USER && GMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS // Use App Password, not regular password
    }
  });

  // Verify connection
  transporter.verify(function (error, success) {
    if (error) {
      console.error('❌ Gmail SMTP connection failed:', error.message);
      console.error('💡 Make sure you:');
      console.error('   1. Enabled 2-Step Verification on your Gmail account');
      console.error('   2. Generated an App Password at: https://myaccount.google.com/apppasswords');
      console.error('   3. Set GMAIL_USER and GMAIL_PASS in your .env file');
    } else {
      console.log('✅ Gmail SMTP email service initialized');
      console.log(`📧 Using Gmail: ${GMAIL_USER}`);
      console.log(`✅ Can send emails to any recipient (500/day limit)`);
    }
  });
} else if (EMAIL_SERVICE === 'resend' && process.env.RESEND_API_KEY) {
  console.log('✅ Resend email service initialized');
  if (process.env.RESEND_FROM_EMAIL) {
    console.log(`📧 Using verified domain: ${process.env.RESEND_FROM_EMAIL}`);
    console.log(`✅ Can send emails to any recipient!`);
  } else {
    console.log(`⚠️ Using Resend free domain: onboarding@resend.dev`);
    console.log(`⚠️ WARNING: Can only send to account owner's email`);
  }
} else {
  console.error('❌ Email service not configured!');
  console.error('💡 Gmail Setup (Recommended - Free, No Domain Verification):');
  console.error('   1. Enable 2-Step Verification: https://myaccount.google.com/security');
  console.error('   2. Generate App Password: https://myaccount.google.com/apppasswords');
  console.error('   3. Add to .env:');
  console.error('      GMAIL_USER=your-email@gmail.com');
  console.error('      GMAIL_PASS=your-app-password');
  console.error('      FROM_EMAIL=your-email@gmail.com');
}

console.log(`🌐 Application domain: ${DOMAIN}`);

// Export email service components
module.exports = { 
  transporter, // Nodemailer transporter (Gmail)
  resend,      // Resend client (optional)
  FROM_EMAIL,
  FROM_NAME,
  DOMAIN,
  EMAIL_SERVICE
};
