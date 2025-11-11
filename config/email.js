// ==================== EMAIL SERVICE ====================
// Using Nodemailer with Gmail SMTP for free, fast email delivery (no domain verification needed)
const nodemailer = require('nodemailer');
require('dotenv').config();

// Gmail SMTP Configuration (FREE - No domain verification needed!)
// Limits: 500 emails/day (usually enough for small websites)
// Supports both MAIL_USER/MAIL_PASS and GMAIL_USER/GMAIL_PASS for compatibility
const GMAIL_USER = process.env.GMAIL_USER || process.env.MAIL_USER || process.env.EMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS || process.env.MAIL_PASS || process.env.EMAIL_PASS; // App Password, not regular password

// Get the from email address
const FROM_EMAIL = process.env.FROM_EMAIL || GMAIL_USER;
const FROM_NAME = process.env.FROM_NAME || 'Kusina Ni Katya';

// Domain configuration
const DOMAIN = process.env.DOMAIN || 'kusinanikatya.up.railway.app';

// SMTP Configuration Options
// Railway.com supports outbound SMTP on ports 465 and 587
const SMTP_CONFIG_465 = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for port 465 (SSL)
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS
  },
  connectionTimeout: 10000, // 10 seconds - Railway compatible
  socketTimeout: 10000, // 10 seconds - prevent hanging connections
  greetingTimeout: 10000, // 10 seconds
  // Connection pooling for better performance on Railway
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  // Rate limiting (Gmail allows ~20 emails/second)
  rateDelta: 1000,
  rateLimit: 18, // Safe limit below Gmail's 20/sec
  // TLS settings
  tls: {
    rejectUnauthorized: false
  },
  requireTLS: true
};

const SMTP_CONFIG_587 = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // false for port 587 (TLS)
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS
  },
  connectionTimeout: 10000,
  socketTimeout: 10000,
  greetingTimeout: 10000,
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 18,
  requireTLS: true,
  tls: {
    rejectUnauthorized: false
  }
};

// Initialize Nodemailer transporter (Gmail SMTP)
let transporter = null;
let currentPort = null;

/**
 * Create transporter with fallback logic
 * Railway.com supports both ports 465 and 587 for outbound SMTP
 */
function createTransporter() {
  if (!GMAIL_USER || !GMAIL_PASS) {
    return null;
  }

  // Try port 465 first (SSL) - Railway supports this
  try {
    const transporter465 = nodemailer.createTransport(SMTP_CONFIG_465);
    
    // Test connection
    transporter465.verify(function (error, success) {
      if (error) {
        console.warn(`⚠️ Port 465 (SSL) connection failed: ${error.message}`);
        console.log('🔄 Attempting fallback to port 587 (TLS)...');
        
        // Fallback to port 587 (Railway also supports this)
        try {
          const transporter587 = nodemailer.createTransport(SMTP_CONFIG_587);
          transporter587.verify(function (error587, success587) {
            if (error587) {
              console.error('❌ Port 587 (TLS) also failed:', error587.message);
              console.error('💡 Check your Gmail App Password and network settings');
              console.error('💡 Railway.com supports SMTP - verify your App Password is correct');
            } else {
              console.log('✅ Gmail SMTP connected via port 587 (TLS fallback)');
              console.log(`📧 Using Gmail: ${GMAIL_USER}`);
              console.log(`✅ Railway.com compatible - emails will work!`);
              transporter = transporter587;
              currentPort = 587;
            }
          });
        } catch (err587) {
          console.error('❌ Failed to create transporter on port 587:', err587.message);
        }
      } else {
        console.log('✅ Gmail SMTP connected via port 465 (SSL)');
        console.log(`📧 Using Gmail: ${GMAIL_USER}`);
        console.log(`✅ Railway.com compatible - emails will work!`);
        console.log(`✅ Can send emails to any recipient (500/day limit)`);
        transporter = transporter465;
        currentPort = 465;
      }
    });
    
    return transporter465; // Return initial transporter, will be updated if fallback needed
  } catch (error) {
    console.error('❌ Failed to create transporter:', error.message);
    return null;
  }
}

if (GMAIL_USER && GMAIL_PASS) {
  // Verify Gmail account setup
  if (!GMAIL_PASS.startsWith('G') && GMAIL_PASS.length !== 16) {
    console.warn('⚠️ WARNING: GMAIL_PASS/MAIL_PASS should be a 16-character App Password');
    console.warn('💡 Make sure you:');
    console.warn('   1. Enabled 2-Step Verification: https://myaccount.google.com/security');
    console.warn('   2. Generated an App Password: https://myaccount.google.com/apppasswords');
    console.warn('   3. Using the App Password (not your regular Gmail password)');
  }
  
  transporter = createTransporter();
} else {
  console.error('❌ Email service not configured!');
  console.error('💡 Gmail Setup (Free, No Domain Verification):');
  console.error('   1. Enable 2-Step Verification: https://myaccount.google.com/security');
  console.error('   2. Generate App Password: https://myaccount.google.com/apppasswords');
  console.error('   3. Add to .env (use either MAIL_* or GMAIL_*):');
  console.error('      GMAIL_USER=your-email@gmail.com');
  console.error('      GMAIL_PASS=your-16-character-app-password');
  console.error('      FROM_EMAIL=your-email@gmail.com');
  console.error('      FROM_NAME=Kusina Ni Katya');
}

console.log(`🌐 Application domain: ${DOMAIN}`);

// Export email service components
// Also export as emailTransporter for backward compatibility
module.exports = { 
  transporter,
  emailTransporter: transporter, // Backward compatibility
  FROM_EMAIL,
  FROM_NAME,
  DOMAIN,
  currentPort,
  createTransporter // Export for retry logic
};
