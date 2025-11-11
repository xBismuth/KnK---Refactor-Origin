// ==================== EMAIL TEST SCRIPT ====================
// Run this to test your Gmail SMTP configuration
// Usage: node test-email.js [recipient-email]

// Load .env file only if it exists (for local development)
// On Railway, environment variables are injected directly, so dotenv is not needed
try {
  require('dotenv').config();
} catch (err) {
  // dotenv not available or .env doesn't exist - this is fine for Railway deployment
}
const { transporter, emailTransporter, FROM_EMAIL, FROM_NAME, currentPort, createTransporter } = require('./config/email');
const { sendVerificationEmail } = require('./utils/emailHelper');

async function testEmailConfiguration() {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  console.log('\n🧪 Testing Email Configuration...\n');
  console.log('='.repeat(60));
  console.log(`Test started at: ${timestamp}\n`);
  
  // Check environment variables (supports both MAIL_* and GMAIL_*)
  console.log('📋 Configuration Check:');
  const MAIL_USER = process.env.MAIL_USER || process.env.GMAIL_USER || process.env.EMAIL_USER;
  const MAIL_PASS = process.env.MAIL_PASS || process.env.GMAIL_PASS || process.env.EMAIL_PASS;
  
  console.log(`   MAIL_USER/GMAIL_USER: ${MAIL_USER ? '✅ Set' : '❌ Missing'}`);
  console.log(`   MAIL_PASS/GMAIL_PASS: ${MAIL_PASS ? '✅ Set (hidden)' : '❌ Missing'}`);
  console.log(`   FROM_EMAIL: ${FROM_EMAIL || 'Not set'}`);
  console.log(`   FROM_NAME: ${FROM_NAME || 'Not set'}`);
  
  // Check if credentials are missing
  if (!MAIL_USER || !MAIL_PASS) {
    console.error('\n❌ Email credentials not found!');
    console.error('   Make sure MAIL_USER/MAIL_PASS or GMAIL_USER/GMAIL_PASS are set in .env');
    process.exit(1);
  }
  
  // Check App Password format
  if (MAIL_PASS) {
    const passLength = MAIL_PASS.length;
    const isAppPassword = MAIL_PASS.startsWith('G') || passLength === 16;
    if (!isAppPassword) {
      console.warn(`   ⚠️  MAIL_PASS/GMAIL_PASS format warning: Should be 16-character App Password`);
    } else {
      console.log(`   ✅ App Password format looks correct (${passLength} characters)`);
    }
  }
  
  // Wait for transporter to initialize or create it if needed
  console.log('\n📧 Transporter Status:');
  let activeTransporter = transporter || emailTransporter;
  
  // If transporter is not initialized, create it directly
  if (!activeTransporter) {
    console.log('   ⏳ Creating transporter...');
    activeTransporter = await createTransporter();
  }
  
  if (!activeTransporter) {
    console.error('❌ Transporter not initialized!');
    console.error('   Make sure MAIL_USER/MAIL_PASS or GMAIL_USER/GMAIL_PASS are set in .env');
    console.error('   Check that your App Password is correct (16 characters, no spaces)');
    process.exit(1);
  }
  
  console.log('✅ Transporter initialized');
  console.log(`   Current port: ${currentPort || 'Not determined yet'}`);
  console.log(`   Railway.com compatible: ✅ (supports ports 465 & 587)`);
  
  // Test connection
  console.log('\n🔌 Testing SMTP Connection...');
  const connectionStart = Date.now();
  
  try {
    await new Promise((resolve, reject) => {
      activeTransporter.verify(function (error, success) {
        const connectionTime = Date.now() - connectionStart;
        
        if (error) {
          console.error(`❌ Connection failed (${connectionTime}ms):`, error.message);
          console.error('\n💡 Common issues:');
          console.error('   1. 2-Step Verification not enabled');
          console.error('   2. App Password not generated or incorrect');
          console.error('   3. MAIL_USER/MAIL_PASS or GMAIL_USER/GMAIL_PASS missing/wrong in .env');
          console.error('   4. Network/firewall blocking SMTP ports 465/587');
          console.error('   5. Less secure app access blocked (use App Password instead)');
          console.error('\n💡 Railway.com: Ports 465 and 587 are supported - check your App Password');
          reject(error);
        } else {
          console.log(`✅ SMTP connection successful! (${connectionTime}ms)`);
          console.log(`   Port: ${currentPort || 'Unknown'}`);
          console.log(`   ✅ Ready for Railway.com deployment!`);
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
