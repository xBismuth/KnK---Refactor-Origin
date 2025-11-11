// ==================== EMAIL HELPER FUNCTIONS ====================
// Using Nodemailer with Gmail SMTP (FREE - No domain verification needed!)
// Supports both MAIL_USER/MAIL_PASS and GMAIL_USER/GMAIL_PASS for compatibility
// Railway.com compatible - supports outbound SMTP on ports 465 and 587
const { transporter, emailTransporter, FROM_EMAIL, FROM_NAME, createTransporter, currentPort } = require('../config/email');

// Use transporter or emailTransporter (backward compatibility)
const activeTransporter = transporter || emailTransporter;

// Email delivery tracking (in-memory store - consider using Redis for production)
const emailDeliveryStatus = new Map();

// Retry configuration (improved for reliability)
const RETRY_CONFIG = {
  maxRetries: 5, // Increased to 5 attempts
  retryDelay: 500, // 500ms base delay
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
  if (error.code === 'ECONNRESET' || 
      error.code === 'ETIMEDOUT' || 
      error.code === 'ESOCKETTIMEDOUT' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'EHOSTUNREACH' ||
      error.code === 'ENOTFOUND') {
    return true;
  }
  
  // DNS errors
  if (error.code === 'EDNS' || error.message?.includes('DNS')) {
    return true;
  }
  
  // Auth errors (retry once)
  if (error.code === 'EAUTH') {
    return true;
  }
  
  // Rate limiting
  if (error.responseCode === 421 || error.responseCode === 450 || error.responseCode === 452) {
    return true;
  }
  
  // Temporary server errors
  if (error.responseCode >= 500 && error.responseCode < 600) {
    return true;
  }
  
  return false;
}

/**
 * Check if error suggests port/firewall issue
 */
function isPortBlockedError(error) {
  const blockedMessages = [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'EHOSTUNREACH',
    'port',
    'connection refused',
    'timeout',
    'firewall'
  ];
  
  const errorStr = JSON.stringify(error).toLowerCase();
  return blockedMessages.some(msg => errorStr.includes(msg.toLowerCase()));
}

/**
 * Send email using Gmail SMTP with improved retry and error handling
 * Railway.com compatible - automatically handles port fallback
 * @param {string} toEmail - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML email content
 * @param {number} retryCount - Current retry attempt (internal use)
 * @param {boolean} useFallbackPort - Whether to try fallback port (internal use)
 * @returns {Promise<{success: boolean, messageId: string, attempts: number}>}
 */
async function sendEmail(toEmail, subject, html, retryCount = 0, useFallbackPort = false) {
  const timestamp = new Date().toISOString();
  
  if (!activeTransporter) {
    const error = new Error('Gmail SMTP not configured. Set MAIL_USER/MAIL_PASS or GMAIL_USER/GMAIL_PASS in .env');
    console.error(`[${timestamp}] ❌ ${error.message}`);
    throw error;
  }

  try {
    // Use sendMail with optimized options for faster delivery
    const info = await activeTransporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: toEmail,
      subject: subject,
      html: html,
      // Optimize for speed
      priority: 'high', // High priority for verification codes
      headers: {
        'X-Priority': '1', // High priority
        'X-MSMail-Priority': 'High'
      }
    });

    // Track successful delivery
    const messageId = info.messageId || `gmail-${Date.now()}`;
    const deliveryInfo = {
      messageId: messageId,
      toEmail,
      subject,
      sentAt: timestamp,
      attempts: retryCount + 1,
      status: 'sent',
      service: 'gmail',
      port: currentPort || 'unknown'
    };
    
    emailDeliveryStatus.set(messageId, deliveryInfo);
    
    console.log(`[${timestamp}] ✅ Email sent via Gmail to ${toEmail} (ID: ${messageId}, attempts: ${retryCount + 1}, port: ${currentPort || 'unknown'})`);
    
    return { 
      success: true, 
      messageId: messageId,
      attempts: retryCount + 1,
      deliveryInfo
    };
  } catch (error) {
    const errorTimestamp = new Date().toISOString();
    const errorCode = error.code || error.responseCode || 'UNKNOWN';
    const errorMessage = error.message || 'Unknown error';
    
    console.error(`[${errorTimestamp}] ❌ Email send attempt ${retryCount + 1} failed:`, {
      code: errorCode,
      message: errorMessage,
      to: toEmail
    });
    
    // Check if port might be blocked (firewall issue)
    // Railway.com supports both ports, but fallback helps with network issues
    if (isPortBlockedError(error) && !useFallbackPort && retryCount === 0) {
      console.warn(`[${errorTimestamp}] ⚠️ Possible port/firewall issue detected. Attempting port fallback...`);
      // Try recreating transporter with fallback port
      const newTransporter = createTransporter();
      if (newTransporter) {
        // Wait a bit before retry
        await sleep(500);
        return await sendEmail(toEmail, subject, html, retryCount, true);
      }
    }
    
    // Check if we should retry
    const isRetryable = isRetryableError(error);
    
    if (isRetryable && retryCount < RETRY_CONFIG.maxRetries) {
      const delay = Math.min(
        RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount),
        RETRY_CONFIG.maxDelay
      );
      
      console.warn(`[${errorTimestamp}] ⚠️ Retrying email send (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries}) in ${delay}ms...`);
      console.warn(`[${errorTimestamp}]    Error: ${errorCode} - ${errorMessage}`);
      
      await sleep(delay);
      return await sendEmail(toEmail, subject, html, retryCount + 1, useFallbackPort);
    }
    
    // Final failure
    console.error(`[${errorTimestamp}] ❌ Email send failed after ${retryCount + 1} attempts`);
    console.error(`[${errorTimestamp}]    Final error: ${errorCode} - ${errorMessage}`);
    
    // Provide helpful error message
    if (isPortBlockedError(error)) {
      throw new Error(`Email sending failed: Port may be blocked by firewall. Railway.com supports SMTP - check your App Password. Original error: ${errorMessage}`);
    } else if (error.code === 'EAUTH') {
      throw new Error(`Email authentication failed: Check your Gmail App Password. Original error: ${errorMessage}`);
    } else if (error.code === 'ENOTFOUND' || error.code === 'EDNS') {
      throw new Error(`DNS resolution failed: Check your network connection. Original error: ${errorMessage}`);
    } else {
      throw new Error(`Email sending failed after ${retryCount + 1} attempts: ${errorMessage}`);
    }
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
