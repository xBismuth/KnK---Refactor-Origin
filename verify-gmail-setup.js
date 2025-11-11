// ==================== GMAIL SETUP VERIFICATION SCRIPT ====================
// Run this to verify your Gmail App Password and network settings
// Usage: node verify-gmail-setup.js

require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('\n🔍 Gmail Setup Verification\n');
console.log('='.repeat(60));

// Step 1: Check Environment Variables
console.log('\n📋 Step 1: Environment Variables Check');
console.log('-'.repeat(60));

const GMAIL_USER = process.env.GMAIL_USER || process.env.EMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS || process.env.EMAIL_PASS;

let allGood = true;

if (!GMAIL_USER) {
  console.error('❌ GMAIL_USER is missing!');
  console.error('   Add to .env: GMAIL_USER=your-email@gmail.com');
  allGood = false;
} else {
  console.log(`✅ GMAIL_USER: ${GMAIL_USER}`);
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(GMAIL_USER)) {
    console.warn('⚠️  GMAIL_USER format looks invalid (should be email@domain.com)');
    allGood = false;
  } else {
    console.log('   ✅ Email format is valid');
  }
}

if (!GMAIL_PASS) {
  console.error('❌ GMAIL_PASS is missing!');
  console.error('   Add to .env: GMAIL_PASS=your-16-character-app-password');
  allGood = false;
} else {
  const passLength = GMAIL_PASS.length;
  const passPreview = GMAIL_PASS.substring(0, 4) + '...' + GMAIL_PASS.substring(passLength - 4);
  console.log(`✅ GMAIL_PASS: ${passPreview} (${passLength} characters)`);
  
  // Check App Password format
  if (passLength !== 16) {
    console.warn('⚠️  App Password should be 16 characters long');
    console.warn('   If it\'s not 16 characters, you might be using your regular password');
    console.warn('   Regular passwords won\'t work - you need an App Password!');
    allGood = false;
  } else {
    console.log('   ✅ Length is correct (16 characters)');
  }
  
  // Check if it looks like an App Password (starts with letter, no spaces)
  if (GMAIL_PASS.includes(' ')) {
    console.warn('⚠️  App Password contains spaces - remove them!');
    console.warn('   App Passwords look like: abcd efgh ijkl mnop');
    console.warn('   But in .env, remove spaces: abcd efgh ijkl mnop → abcdefghijklmnop');
    allGood = false;
  } else {
    console.log('   ✅ No spaces found (correct format)');
  }
}

if (!allGood) {
  console.log('\n❌ Environment variables check failed!');
  console.log('   Fix the issues above before continuing.\n');
  process.exit(1);
}

// Step 2: Test Gmail Account Setup
console.log('\n📧 Step 2: Gmail Account Setup Verification');
console.log('-'.repeat(60));

console.log('\n💡 To verify your Gmail account setup:');
console.log('   1. Go to: https://myaccount.google.com/security');
console.log('   2. Check if "2-Step Verification" is ON');
console.log('   3. If OFF, enable it first');
console.log('   4. Then go to: https://myaccount.google.com/apppasswords');
console.log('   5. Generate a new App Password for "Mail"');
console.log('   6. Copy the 16-character password (remove spaces)');
console.log('   7. Add it to .env as GMAIL_PASS\n');

// Step 3: Test SMTP Connection (Port 465)
console.log('🔌 Step 3: Testing SMTP Connection (Port 465 - SSL)');
console.log('-'.repeat(60));

const testConfig465 = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS
  },
  connectionTimeout: 10000,
  socketTimeout: 10000,
  greetingTimeout: 10000
};

const transporter465 = nodemailer.createTransport(testConfig465);

console.log('   Attempting connection to smtp.gmail.com:465...');

transporter465.verify(function (error, success) {
  if (error) {
    console.error(`   ❌ Port 465 (SSL) connection failed: ${error.code || 'UNKNOWN'}`);
    console.error(`   Error: ${error.message}`);
    
    // Provide specific guidance based on error
    if (error.code === 'EAUTH') {
      console.error('\n   🔴 AUTHENTICATION ERROR - Most Common Issues:');
      console.error('      1. App Password is incorrect');
      console.error('      2. Using regular password instead of App Password');
      console.error('      3. 2-Step Verification not enabled');
      console.error('      4. App Password was revoked/deleted');
      console.error('\n   💡 Solution:');
      console.error('      - Go to: https://myaccount.google.com/apppasswords');
      console.error('      - Generate a NEW App Password');
      console.error('      - Copy it EXACTLY (16 characters, no spaces)');
      console.error('      - Update GMAIL_PASS in .env file');
      console.error('      - Restart your server\n');
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error('\n   🔴 CONNECTION ERROR - Network/Firewall Issue:');
      console.error('      Port 465 might be blocked by firewall');
      console.error('\n   💡 Solution:');
      console.error('      - Check if your network/firewall allows outbound port 465');
      console.error('      - If on Railway/Render/Vercel, check their firewall settings');
      console.error('      - Try port 587 (TLS) as fallback\n');
    } else if (error.code === 'ENOTFOUND' || error.code === 'EDNS') {
      console.error('\n   🔴 DNS ERROR - Network Issue:');
      console.error('      Cannot resolve smtp.gmail.com');
      console.error('\n   💡 Solution:');
      console.error('      - Check your internet connection');
      console.error('      - Check DNS settings');
      console.error('      - Try again in a few moments\n');
    }
    
    // Try port 587 as fallback
    console.log('   🔄 Attempting fallback to Port 587 (TLS)...');
    
    const testConfig587 = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS
      },
      connectionTimeout: 10000,
      socketTimeout: 10000,
      greetingTimeout: 10000,
      requireTLS: true
    };
    
    const transporter587 = nodemailer.createTransport(testConfig587);
    
    transporter587.verify(function (error587, success587) {
      if (error587) {
        console.error(`   ❌ Port 587 (TLS) also failed: ${error587.code || 'UNKNOWN'}`);
        console.error(`   Error: ${error587.message}`);
        console.error('\n   ❌ Both ports failed. Check your setup.\n');
        process.exit(1);
      } else {
        console.log('   ✅ Port 587 (TLS) connection successful!');
        console.log('   ✅ Your Gmail App Password is CORRECT!');
        console.log('   ✅ Network settings are OK!');
        console.log('   ⚠️  Using port 587 as fallback (port 465 blocked)\n');
        process.exit(0);
      }
    });
  } else {
    console.log('   ✅ Port 465 (SSL) connection successful!');
    console.log('   ✅ Your Gmail App Password is CORRECT!');
    console.log('   ✅ Network settings are OK!');
    console.log('   ✅ Everything is configured properly!\n');
    process.exit(0);
  }
});

