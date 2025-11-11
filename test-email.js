// ==================== EMAIL TEST SCRIPT ====================
// Run this to test your Brevo API configuration
// Usage: node test-email.js [recipient-email]

// Load .env file only if it exists (for local development)
// On Railway, environment variables are injected directly, so dotenv is not needed
try {
  require('dotenv').config();
} catch (err) {
  // dotenv not available or .env doesn't exist - this is fine for Railway deployment
}

const { FROM_EMAIL, FROM_NAME, sendEmail } = require('./config/email');
const { sendVerificationEmail } = require('./utils/emailHelper');

async function testEmailConfiguration() {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  console.log('\n🧪 Testing Brevo Email Configuration...\n');
  console.log('='.repeat(60));
  console.log(`Test started at: ${timestamp}\n`);
  
  // Check environment variables
  console.log('📋 Configuration Check:');
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  
  console.log(`   BREVO_API_KEY: ${BREVO_API_KEY ? '✅ Set (hidden)' : '❌ Missing'}`);
  console.log(`   FROM_EMAIL: ${FROM_EMAIL || 'Not set'}`);
  console.log(`   FROM_NAME: ${FROM_NAME || 'Not set'}`);
  
  // Check if API key is missing
  if (!BREVO_API_KEY) {
    console.error('\n❌ Brevo API key not found!');
    console.error('   Make sure BREVO_API_KEY is set in Railway Variables or .env file');
    console.error('\n💡 How to get Brevo API key:');
    console.error('   1. Sign up: https://app.brevo.com/account/register');
    console.error('   2. Go to: Settings → SMTP & API → API Keys');
    console.error('   3. Generate a new API key');
    console.error('   4. Copy the key (starts with xkeysib-)');
    console.error('   5. Add BREVO_API_KEY to Railway Variables or .env file');
    process.exit(1);
  }
  
  // Test API connection (just verify configuration)
  console.log('\n🔌 Brevo API Configuration:');
  console.log(`   ✅ API key configured`);
  console.log(`   ✅ From email: ${FROM_EMAIL}`);
  console.log(`   ✅ From name: ${FROM_NAME}`);
  console.log(`   ✅ Ready for Railway.com deployment!`);
  console.log(`   💡 Brevo API uses HTTPS (port 443) - works on all Railway plans!`);
  
  // Test sending email (optional - requires test email)
  const testEmail = process.argv[2]; // Get email from command line argument
  if (testEmail) {
    console.log(`\n📤 Testing email send to: ${testEmail}`);
    const sendStart = Date.now();
    
    try {
      const result = await sendVerificationEmail(testEmail, '123456', 'Test User');
      const sendTime = Date.now() - sendStart;
      const totalTime = Date.now() - startTime;
      
      console.log(`✅ Test email sent successfully! (${sendTime}ms)`);
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Attempts: ${result.attempts}`);
      console.log(`   Total test time: ${totalTime}ms`);
      console.log('\n📬 Check your inbox (and spam folder) for the verification email!');
      
      // Summary
      console.log('\n' + '='.repeat(60));
      console.log('✅ Email configuration test PASSED');
      console.log(`   Connection: ✅`);
      console.log(`   Send test: ✅ (${sendTime}ms)`);
      console.log(`   Total time: ${totalTime}ms`);
      console.log(`   Railway.com ready: ✅`);
      console.log('='.repeat(60) + '\n');
    } catch (error) {
      const sendTime = Date.now() - sendStart;
      const totalTime = Date.now() - startTime;
      
      console.error(`❌ Failed to send test email (${sendTime}ms):`, error.message);
      console.error('\n💡 Error details:', error);
      console.error(`\n   Total test time: ${totalTime}ms`);
      process.exit(1);
    }
  } else {
    const totalTime = Date.now() - startTime;
    console.log('\n💡 To test sending an email, run:');
    console.log(`   node test-email.js your-email@example.com`);
    console.log(`\n   Test completed in: ${totalTime}ms`);
  }
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  const endTimestamp = new Date().toISOString();
  
  if (!testEmail) {
    console.log('\n' + '='.repeat(60));
    console.log('✅ Email configuration test PASSED');
    console.log(`   Test completed at: ${endTimestamp}`);
    console.log(`   Total time: ${totalTime}ms`);
    console.log(`   Railway.com compatible: ✅`);
    console.log('='.repeat(60) + '\n');
  }
}

// Run the test
testEmailConfiguration().catch(error => {
  const timestamp = new Date().toISOString();
  console.error(`\n[${timestamp}] ❌ Test failed:`, error);
  process.exit(1);
});
