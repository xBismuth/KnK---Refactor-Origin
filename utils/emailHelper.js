// ==================== EMAIL HELPER FUNCTIONS ====================
const { emailTransporter, createFreshTransport } = require('../config/email');

// Send verification email
async function sendVerificationEmail(toEmail, code, userName = 'Valued Customer') {
  const mailOptions = {
    from: {
      name: 'Kusina ni Katya',
      address: process.env.MAIL_USER
    },
    to: toEmail,
    subject: 'Your Verification Code - Kusina ni Katya',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #cda45e 0%, #b8924e 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 10px 0 0 0; font-size: 28px; }
          .content { padding: 40px 30px; text-align: center; }
          .code-box { background: #f8f9fa; border: 2px dashed #cda45e; border-radius: 10px; padding: 25px; margin: 30px 0; }
          .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #cda45e; font-family: 'Courier New', monospace; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; text-align: left; border-radius: 5px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Kusina ni Katya</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Authentic Filipino Cuisine</p>
          </div>
          
          <div class="content">
            <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Hello ${userName}! 👋</p>
            <p style="font-size: 16px; color: #666; margin-bottom: 30px;">
              Thank you for signing up with Kusina ni Katya. To complete your registration, 
              please use the verification code below:
            </p>
            
            <div class="code-box">
              <p style="margin: 0; font-size: 14px; color: #666;">Your Verification Code</p>
              <div class="code">${code}</div>
              <p style="color: #999; font-size: 14px; margin-top: 15px;">This code will expire in 10 minutes</p>
            </div>
            
            <div class="warning">
              <strong style="color: #856404;">🔒 Security Notice:</strong><br>
              Never share this code with anyone. Kusina ni Katya staff will never ask for this code.
              If you didn't request this code, please ignore this email.
            </div>
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 10px 0;">© 2025 Kusina ni Katya. All Rights Reserved.</p>
            <p style="margin: 0;">Aurora Blvd, Quezon City, Manila, Philippines</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  const sendWithRetry = async (attempts = 3) => {
    // Check credentials first
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      const error = new Error('Email credentials not configured (MAIL_USER or MAIL_PASS missing)');
      console.error(`❌ ${error.message}`);
      throw error;
    }

    let lastErr;
    for (let i = 1; i <= attempts; i++) {
      // Use fresh transport for each attempt to avoid stale connections
      const transporter = i === 1 ? emailTransporter : createFreshTransport();
      
      try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Verification email sent to ${toEmail}:`, info.messageId);
        
        // Close fresh transport if we created one
        if (i > 1) {
          transporter.close();
        }
        
        return { success: true, messageId: info.messageId };
      } catch (error) {
        lastErr = error;
        const errorMsg = error.message || error.code || 'Unknown error';
        console.warn(`📧 Send attempt ${i}/${attempts} failed for ${toEmail}: ${errorMsg}`);
        
        // Log more details for debugging
        if (error.code) {
          console.warn(`   Error code: ${error.code}`);
        }
        if (error.response) {
          console.warn(`   SMTP response: ${error.response}`);
        }
        if (error.responseCode) {
          console.warn(`   SMTP response code: ${error.responseCode}`);
        }
        if (error.command) {
          console.warn(`   SMTP command: ${error.command}`);
        }
        
        // Close transport on error
        if (i > 1) {
          try {
            transporter.close();
          } catch (e) {
            // Ignore close errors
          }
        }
        
        // Faster retry logic for quicker email delivery
        if (i < attempts) {
          const isTimeout = errorMsg.includes('timeout') || error.code === 'ETIMEDOUT' || error.command === 'CONN';
          // Shorter delays for faster retries - like normal websites
          const delay = isTimeout 
            ? 1000 * i // Shorter delay for timeouts: 1s, 2s, 3s
            : 500 * i; // Very fast retry: 500ms, 1000ms, 1500ms
          console.log(`   Retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }
    console.error(`❌ Error sending email to ${toEmail} after ${attempts} retries:`, lastErr?.message);
    console.error(`   Full error details:`, {
      message: lastErr?.message,
      code: lastErr?.code,
      response: lastErr?.response,
      responseCode: lastErr?.responseCode,
      command: lastErr?.command
    });
    throw lastErr;
  };
  return sendWithRetry();
}

// Send login verification email
async function sendLoginVerificationEmail(toEmail, code, userName = 'Valued Customer') {
  const mailOptions = {
    from: {
      name: 'Kusina ni Katya',
      address: process.env.MAIL_USER
    },
    to: toEmail,
    subject: 'Login Verification Code - Kusina ni Katya',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #cda45e 0%, #b8924e 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; text-align: center; }
          .code-box { background: #f8f9fa; border: 2px dashed #cda45e; border-radius: 10px; padding: 25px; margin: 30px 0; }
          .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #cda45e; font-family: 'Courier New', monospace; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; text-align: left; border-radius: 5px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Kusina ni Katya</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Authentic Filipino Cuisine</p>
          </div>
          
          <div class="content">
            <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Hello ${userName}! 👋</p>
            <p style="font-size: 16px; color: #666; margin-bottom: 30px;">
              Someone is trying to sign in to your account. Please use the code below to verify your login:
            </p>
            
            <div class="code-box">
              <p style="margin: 0; font-size: 14px; color: #666;">Your Login Verification Code</p>
              <div class="code">${code}</div>
              <p style="color: #999; font-size: 14px; margin-top: 15px;">This code will expire in 10 minutes</p>
            </div>
            
            <div class="warning">
              <strong style="color: #856404;">⚠️ Security Notice:</strong><br>
              If you didn't attempt to sign in, please ignore this email and consider changing your password immediately.
              Never share this code with anyone.
            </div>
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 10px 0;">© 2025 Kusina ni Katya. All Rights Reserved.</p>
            <p style="margin: 0;">Aurora Blvd, Quezon City, Manila, Philippines</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  const sendWithRetry = async (attempts = 3) => {
    let lastErr;
    for (let i = 1; i <= attempts; i++) {
      try {
        const info = await emailTransporter.sendMail(mailOptions);
        console.log(`✅ Login verification email sent to ${toEmail}:`, info.messageId);
        return { success: true, messageId: info.messageId };
      } catch (error) {
        lastErr = error;
        console.warn(`📧 Login email attempt ${i} failed for ${toEmail}: ${error.message}`);
        await new Promise(r => setTimeout(r, 500 * Math.pow(2, i - 1)));
      }
    }
    console.error(`❌ Error sending login email to ${toEmail} after retries:`, lastErr?.message);
    throw lastErr;
  };
  return sendWithRetry();
}

// Send password reset email
async function sendPasswordResetEmail(toEmail, code, userName = 'Valued Customer') {
  const mailOptions = {
    from: {
      name: 'Kusina ni Katya',
      address: process.env.MAIL_USER
    },
    to: toEmail,
    subject: 'Password Reset Code - Kusina ni Katya',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #cda45e 0%, #b8924e 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; text-align: center; }
          .code-box { background: #f8f9fa; border: 2px dashed #cda45e; border-radius: 10px; padding: 25px; margin: 30px 0; }
          .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #cda45e; font-family: 'Courier New', monospace; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; text-align: left; border-radius: 5px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Kusina ni Katya</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Authentic Filipino Cuisine</p>
          </div>
          
          <div class="content">
            <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Hello ${userName}! 👋</p>
            <p style="font-size: 16px; color: #666; margin-bottom: 30px;">
              We received a request to reset your password. Use the code below to reset your password:
            </p>
            
            <div class="code-box">
              <p style="margin: 0; font-size: 14px; color: #666;">Your Password Reset Code</p>
              <div class="code">${code}</div>
              <p style="color: #999; font-size: 14px; margin-top: 15px;">This code will expire in 10 minutes</p>
            </div>
            
            <div class="warning">
              <strong style="color: #856404;">🔒 Security Notice:</strong><br>
              If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
              Never share this code with anyone. Kusina ni Katya staff will never ask for this code.
            </div>
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 10px 0;">© 2025 Kusina ni Katya. All Rights Reserved.</p>
            <p style="margin: 0;">Aurora Blvd, Quezon City, Manila, Philippines</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  const sendWithRetry = async (attempts = 3) => {
    let lastErr;
    for (let i = 1; i <= attempts; i++) {
      try {
        const info = await emailTransporter.sendMail(mailOptions);
        console.log(`✅ Password reset email sent to ${toEmail}:`, info.messageId);
        return { success: true, messageId: info.messageId };
      } catch (error) {
        lastErr = error;
        console.warn(`📧 Reset email attempt ${i} failed for ${toEmail}: ${error.message}`);
        await new Promise(r => setTimeout(r, 500 * Math.pow(2, i - 1)));
      }
    }
    console.error(`❌ Error sending password reset email to ${toEmail} after retries:`, lastErr?.message);
    throw lastErr;
  };
  return sendWithRetry();
}

// Send contact form notification to admin
async function sendContactNotification(data) {
  const { name, email, phone, subject, message } = data;

  const mailOptions = {
    from: {
      name: 'Kusina ni Katya Contact Form',
      address: process.env.MAIL_USER
    },
    to: process.env.MAIL_USER, // Send to yourself (admin)
    replyTo: email,
    subject: `New Contact Form: ${subject}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #cda45e 0%, #b8924e 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .field { margin: 15px 0; padding: 15px; background: #f8f9fa; border-left: 4px solid #cda45e; border-radius: 5px; }
          .label { font-weight: bold; color: #cda45e; display: block; margin-bottom: 5px; }
          .value { color: #333; }
          .message-field { white-space: pre-wrap; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 New Contact Form Submission</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Kusina ni Katya</p>
          </div>
          <div class="content">
            <div class="field">
              <span class="label">From:</span>
              <span class="value">${name}</span>
            </div>
            <div class="field">
              <span class="label">Email:</span>
              <span class="value"><a href="mailto:${email}">${email}</a></span>
            </div>
            ${phone ? `
            <div class="field">
              <span class="label">Phone:</span>
              <span class="value"><a href="tel:${phone}">${phone}</a></span>
            </div>
            ` : ''}
            <div class="field">
              <span class="label">Subject:</span>
              <span class="value">${subject}</span>
            </div>
            <div class="field">
              <span class="label">Message:</span>
              <div class="value message-field">${message}</div>
            </div>
          </div>
          <div class="footer">
            <p style="margin: 0 0 10px 0;">© 2025 Kusina ni Katya. All Rights Reserved.</p>
            <p style="margin: 0;">Aurora Blvd, Quezon City, Manila, Philippines</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  const sendWithRetry = async (attempts = 3) => {
    let lastErr;
    for (let i = 1; i <= attempts; i++) {
      try {
        const info = await emailTransporter.sendMail(mailOptions);
        console.log('✅ Contact notification sent:', info.messageId);
        return { success: true, messageId: info.messageId };
      } catch (error) {
        lastErr = error;
        console.warn(`📧 Contact notification attempt ${i} failed: ${error.message}`);
        // Exponential backoff: 500ms, 1000ms, 2000ms
        if (i < attempts) {
          await new Promise(r => setTimeout(r, 500 * Math.pow(2, i - 1)));
        }
      }
    }
    console.error('❌ Error sending contact notification after retries:', lastErr?.message);
    throw lastErr;
  };
  return sendWithRetry();
}

module.exports = {
  sendVerificationEmail,
  sendLoginVerificationEmail,
  sendPasswordResetEmail,
  sendContactNotification
};