// ==================== EMAIL HELPER FUNCTIONS ====================
// Using Brevo API for Railway deployment (HTTPS, no SMTP ports needed)
// Brevo offers 300 free emails/day with better deliverability than Gmail SMTP
const { sendEmail: brevoSendEmail, FROM_EMAIL, FROM_NAME } = require('../config/email');

// Email delivery tracking (in-memory store - consider using Redis for production)
const emailDeliveryStatus = new Map();

// Retry configuration (improved for reliability)
const RETRY_CONFIG = {
  maxRetries: 3, // Brevo API is more reliable, fewer retries needed
  retryDelay: 1000, // 1 second base delay
  backoffMultiplier: 2, // Exponential backoff
  maxDelay: 5000 // Maximum 5 seconds between retries
};

/**
 * Sleep helper for retry delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable
 */
function isRetryableError(error) {
  // Network errors
  if (error.message?.includes('ECONNRESET') || 
      error.message?.includes('ETIMEDOUT') || 
      error.message?.includes('ENOTFOUND') ||
      error.message?.includes('network')) {
    return true;
  }
  
  // Rate limiting (429)
  if (error.message?.includes('429') || error.message?.includes('rate limit')) {
    return true;
  }
  
  // Temporary server errors (5xx)
  if (error.message?.includes('500') || 
      error.message?.includes('502') || 
      error.message?.includes('503') ||
      error.message?.includes('504')) {
    return true;
  }
  
  return false;
}

/**
 * Send email using Brevo API with retry logic
 * @param {string} toEmail - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML email content
 * @param {number} retryCount - Current retry attempt (internal use)
 * @returns {Promise<{success: boolean, messageId: string, attempts: number}>}
 */
async function sendEmail(toEmail, subject, html, retryCount = 0) {
  const timestamp = new Date().toISOString();
  
  if (!process.env.BREVO_API_KEY) {
    const error = new Error('Brevo API key not configured. Set BREVO_API_KEY in Railway Variables or .env file');
    console.error(`[${timestamp}] ❌ ${error.message}`);
    throw error;
  }

  try {
    const result = await brevoSendEmail(toEmail, subject, html);
    
    // Track successful delivery
    emailDeliveryStatus.set(result.messageId, result.deliveryInfo);
    
    return result;
  } catch (error) {
    const errorTimestamp = new Date().toISOString();
    const errorCode = error.message || 'UNKNOWN';
    
    console.error(`[${errorTimestamp}] ❌ Email send attempt ${retryCount + 1} failed:`, {
      code: errorCode,
      message: error.message,
      to: toEmail
    });
    
    // Check if we should retry
    const isRetryable = isRetryableError(error);
    
    if (isRetryable && retryCount < RETRY_CONFIG.maxRetries) {
      const delay = Math.min(
        RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount),
        RETRY_CONFIG.maxDelay
      );
      
      console.warn(`[${errorTimestamp}] ⚠️ Retrying email send (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries}) in ${delay}ms...`);
      
      await sleep(delay);
      return await sendEmail(toEmail, subject, html, retryCount + 1);
    }
    
    // Final failure
    console.error(`[${errorTimestamp}] ❌ Email send failed after ${retryCount + 1} attempts`);
    console.error(`[${errorTimestamp}]    Final error: ${errorCode}`);
    
    throw new Error(`Email sending failed after ${retryCount + 1} attempts: ${error.message}`);
  }
}

/**
 * Get email delivery status by message ID
 * @param {string} messageId - Message ID
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
          <h1>Kusina Ni Katya</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Authentic Filipino Cuisine</p>
        </div>
        
        <div class="content">
          <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Hello ${userName}! 👋</p>
          <p style="font-size: 16px; color: #666; margin-bottom: 30px;">
            Thank you for signing up with Kusina Ni Katya. To complete your registration, 
            please use the verification code below:
          </p>
          
          <div class="code-box">
            <p style="margin: 0; font-size: 14px; color: #666;">Your Verification Code</p>
            <div class="code">${code}</div>
            <p style="color: #999; font-size: 14px; margin-top: 15px;">This code will expire in 10 minutes</p>
          </div>
          
          <div class="warning">
            <strong style="color: #856404;">🔒 Security Notice:</strong><br>
            Never share this code with anyone. Kusina Ni Katya staff will never ask for this code.
            If you didn't request this code, please ignore this email.
          </div>
        </div>
        
        <div class="footer">
          <p style="margin: 0 0 10px 0;">© 2025 Kusina Ni Katya. All Rights Reserved.</p>
          <p style="margin: 0;">Aurora Blvd, Quezon City, Manila, Philippines</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(toEmail, 'Your Verification Code - Kusina Ni Katya', html);
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
          <h1>Kusina Ni Katya</h1>
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
          <p style="margin: 0 0 10px 0;">© 2025 Kusina Ni Katya. All Rights Reserved.</p>
          <p style="margin: 0;">Aurora Blvd, Quezon City, Manila, Philippines</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(toEmail, 'Login Verification Code - Kusina Ni Katya', html);
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
          <h1>Kusina Ni Katya</h1>
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
            Never share this code with anyone. Kusina Ni Katya staff will never ask for this code.
          </div>
        </div>
        
        <div class="footer">
          <p style="margin: 0 0 10px 0;">© 2025 Kusina Ni Katya. All Rights Reserved.</p>
          <p style="margin: 0;">Aurora Blvd, Quezon City, Manila, Philippines</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(toEmail, 'Password Reset Code - Kusina Ni Katya', html);
}

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendLoginVerificationEmail,
  sendPasswordResetEmail,
  getEmailDeliveryStatus,
  getAllEmailDeliveryStatuses
};
