// ==================== EMAIL TEST SCRIPT ====================
// Run this to test your Gmail SMTP configuration
// Usage: node test-email.js [recipient-email]

require('dotenv').config();
const { transporter, FROM_EMAIL, FROM_NAME, currentPort } = require('./config/email');
const { sendVerificationEmail } = require('./utils/emailHelper');

async function testEmailConfiguration() {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  console.log('\n🧪 Testing Email Configuration...\n');
  console.log('='.repeat(60));
  console.log(`Test started at: ${timestamp}\n`);
  
  // Check environment variables
  console.log('📋 Configuration Check:');
  console.log(`   GMAIL_USER: ${process.env.GMAIL_USER ? '✅ Set' : '❌ Missing'}`);
  console.log(`   GMAIL_PASS: ${process.env.GMAIL_PASS ? '✅ Set (hidden)' : '❌ Missing'}`);
  console.log(`   FROM_EMAIL: ${FROM_EMAIL || 'Not set'}`);
  console.log(`   FROM_NAME: ${FROM_NAME || 'Not set'}`);
  
  // Check App Password format
  if (process.env.GMAIL_PASS) {
    const passLength = process.env.GMAIL_PASS.length;
    const isAppPassword = process.env.GMAIL_PASS.startsWith('G') || passLength === 16;
    if (!isAppPassword) {
      console.warn(`   ⚠️  GMAIL_PASS format warning: Should be 16-character App Password`);
    } else {
      console.log(`   ✅ App Password format looks correct (${passLength} characters)`);
    }
  }
  
  // Check transporter
  console.log('\n📧 Transporter Status:');
  if (!transporter) {
    console.error('❌ Transporter not initialized!');
    console.error('   Make sure GMAIL_USER and GMAIL_PASS are set in .env');
    process.exit(1);
  }
  console.log('✅ Transporter initialized');
  console.log(`   Current port: ${currentPort || 'Not determined yet'}`);
  
  // Test connection
  console.log('\n🔌 Testing SMTP Connection...');
  const connectionStart = Date.now();
  
  try {
    await new Promise((resolve, reject) => {
      transporter.verify(function (error, success) {
        const connectionTime = Date.now() - connectionStart;
        
        if (error) {
          console.error(`❌ Connection failed (${connectionTime}ms):`, error.message);
          console.error('\n💡 Common issues:');
          console.error('   1. 2-Step Verification not enabled');
          console.error('   2. App Password not generated or incorrect');
          console.error('   3. GMAIL_USER or GMAIL_PASS missing/wrong in .env');
          console.error('   4. Network/firewall blocking SMTP ports 465/587');
          console.error('   5. Less secure app access blocked (use App Password instead)');
          reject(error);
        } else {
          console.log(`✅ SMTP connection successful! (${connectionTime}ms)`);
          console.log(`   Port: ${currentPort || 'Unknown'}`);
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
    console.log('='.repeat(60) + '\n');
  }
}

// Run the test
testEmailConfiguration().catch(error => {
  const timestamp = new Date().toISOString();
  console.error(`\n[${timestamp}] ❌ Test failed:`, error);
  process.exit(1);
});

