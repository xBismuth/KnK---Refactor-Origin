// ==================== EMAIL HELPER FUNCTIONS ====================
// Using Resend API for fast and reliable email delivery
const { resend, FROM_EMAIL, FROM_NAME } = require('../config/email');

// Email delivery tracking (in-memory store - consider using Redis for production)
const emailDeliveryStatus = new Map();

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second base delay
  backoffMultiplier: 2 // Exponential backoff
};

/**
 * Sleep helper for retry delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Enhanced email sending with retry logic and delivery tracking
 * @param {string} toEmail - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML email content
 * @param {number} retryCount - Current retry attempt (internal use)
 * @returns {Promise<{success: boolean, messageId: string, attempts: number}>}
 */
async function sendEmailWithResend(toEmail, subject, html, retryCount = 0) {
  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    const error = new Error('Resend API key not configured (RESEND_API_KEY missing)');
    console.error(`❌ ${error.message}`);
    throw error;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [toEmail],
      subject: subject,
      html: html
    });

    if (error) {
      // Check for domain verification errors (don't retry these)
      if (error.message && error.message.includes('domain is not verified')) {
        console.error('❌ Domain verification error:', error.message);
        console.error('💡 Solution: Use onboarding@resend.dev for testing, or verify your domain at https://resend.com/domains');
        throw new Error('Email domain not verified. Use onboarding@resend.dev for testing or verify your domain.');
      }
      
      // Check if we should retry
      const isRetryable = error.statusCode >= 500 || error.statusCode === 429; // Server errors or rate limit
      
      if (isRetryable && retryCount < RETRY_CONFIG.maxRetries) {
        const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount);
        console.warn(`⚠️ Email send failed (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries}), retrying in ${delay}ms...`, error.message);
        
        await sleep(delay);
        return await sendEmailWithResend(toEmail, subject, html, retryCount + 1);
      }
      
      console.error('❌ Resend API error:', error);
      throw new Error(error.message || 'Failed to send email via Resend');
    }

    // Track successful delivery
    const deliveryInfo = {
      messageId: data?.id,
      toEmail,
      subject,
      sentAt: new Date().toISOString(),
      attempts: retryCount + 1,
      status: 'sent'
    };
    
    emailDeliveryStatus.set(data?.id, deliveryInfo);
    
    console.log(`✅ Email sent via Resend to ${toEmail} (ID: ${data?.id}, attempts: ${retryCount + 1})`);
    
    return { 
      success: true, 
      messageId: data?.id,
      attempts: retryCount + 1,
      deliveryInfo
    };
  } catch (error) {
    // Network errors or other exceptions - retry if possible
    if (retryCount < RETRY_CONFIG.maxRetries && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT')) {
      const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount);
      console.warn(`⚠️ Network error (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries}), retrying in ${delay}ms...`, error.message);
      
      await sleep(delay);
      return await sendEmailWithResend(toEmail, subject, html, retryCount + 1);
    }
    
    console.error(`❌ Error sending email to ${toEmail} after ${retryCount + 1} attempts:`, error.message);
    throw error;
  }
}

/**
 * Get email delivery status by message ID
 * @param {string} messageId - Resend message ID
 * @returns {object|null} Delivery status information
 */
function getEmailDeliveryStatus(messageId) {
  return emailDeliveryStatus.get(messageId) || null;
}

/**
 * Get all email delivery statuses (for debugging/monitoring)
 * @returns {Array} Array of delivery status objects
 */
function getAllEmailDeliveryStatuses() {
  return Array.from(emailDeliveryStatus.values());
}

// Send verification email
async function sendVerificationEmail(toEmail, code, userName = 'Valued Customer') {
  const html = `
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
  `;

  return await sendEmailWithResend(toEmail, 'Your Verification Code - Kusina ni Katya', html);
}

// Send login verification email
async function sendLoginVerificationEmail(toEmail, code, userName = 'Valued Customer') {
  const html = `
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
  `;

  return await sendEmailWithResend(toEmail, 'Login Verification Code - Kusina ni Katya', html);
}

// Send password reset email
async function sendPasswordResetEmail(toEmail, code, userName = 'Valued Customer') {
  const html = `
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
  `;

  return await sendEmailWithResend(toEmail, 'Password Reset Code - Kusina ni Katya', html);
}

// Send contact form notification to admin
async function sendContactNotification(data) {
  const { name, email, phone, subject, message } = data;

  const html = `
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
  `;

  // Send to admin email (use RESEND_FROM_EMAIL or MAIL_USER)
  const adminEmail = process.env.RESEND_FROM_EMAIL || process.env.MAIL_USER || FROM_EMAIL;
  return await sendEmailWithResend(adminEmail, `New Contact Form: ${subject}`, html);
}

module.exports = {
  sendVerificationEmail,
  sendLoginVerificationEmail,
  sendPasswordResetEmail,
  sendContactNotification,
  getEmailDeliveryStatus,
  getAllEmailDeliveryStatuses
};
