// ==================== EMAIL TEST SCRIPT ====================
// Run this to test your Gmail SMTP configuration
// Usage: node test-email.js

require('dotenv').config();
const { transporter, FROM_EMAIL, FROM_NAME, EMAIL_SERVICE } = require('./config/email');
const { sendVerificationEmail } = require('./utils/emailHelper');

async function testEmailConfiguration() {
  console.log('\n🧪 Testing Email Configuration...\n');
  console.log('='.repeat(50));
  
  // Check environment variables
  console.log('\n📋 Configuration Check:');
  console.log(`   EMAIL_SERVICE: ${EMAIL_SERVICE || 'not set (defaults to gmail)'}`);
  console.log(`   GMAIL_USER: ${process.env.GMAIL_USER ? '✅ Set' : '❌ Missing'}`);
  console.log(`   GMAIL_PASS: ${process.env.GMAIL_PASS ? '✅ Set (hidden)' : '❌ Missing'}`);
  console.log(`   FROM_EMAIL: ${FROM_EMAIL}`);
  console.log(`   FROM_NAME: ${FROM_NAME}`);
  
  // Check transporter
  console.log('\n📧 Transporter Status:');
  if (!transporter) {
    console.error('❌ Transporter not initialized!');
    console.error('   Make sure GMAIL_USER and GMAIL_PASS are set in .env');
    process.exit(1);
  }
  console.log('✅ Transporter initialized');
  
  // Test connection
  console.log('\n🔌 Testing SMTP Connection...');
  try {
    await new Promise((resolve, reject) => {
      transporter.verify(function (error, success) {
        if (error) {
          console.error('❌ Connection failed:', error.message);
          console.error('\n💡 Common issues:');
          console.error('   1. 2-Step Verification not enabled');
          console.error('   2. App Password not generated or incorrect');
          console.error('   3. GMAIL_USER or GMAIL_PASS missing/wrong in .env');
          console.error('   4. Less secure app access blocked (use App Password instead)');
          reject(error);
        } else {
          console.log('✅ SMTP connection successful!');
          resolve(success);
        }
      });
    });
  } catch (error) {
    console.error('\n❌ Email configuration test failed!');
    process.exit(1);
  }
  
  // Test sending email (optional - requires test email)
  const testEmail = process.argv[2]; // Get email from command line argument
  if (testEmail) {
    console.log(`\n📤 Testing email send to: ${testEmail}`);
    try {
      const result = await sendVerificationEmail(testEmail, '123456', 'Test User');
      console.log('✅ Test email sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Attempts: ${result.attempts}`);
      console.log('\n📬 Check your inbox (and spam folder) for the verification email!');
    } catch (error) {
      console.error('❌ Failed to send test email:', error.message);
      console.error('\n💡 Error details:', error);
      process.exit(1);
    }
  } else {
    console.log('\n💡 To test sending an email, run:');
    console.log(`   node test-email.js your-email@example.com`);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Email configuration is working correctly!');
  console.log('='.repeat(50) + '\n');
}

// Run the test
testEmailConfiguration().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});

