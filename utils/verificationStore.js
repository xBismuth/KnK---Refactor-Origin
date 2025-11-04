// ==================== VERIFICATION CODE STORAGE ====================
const verificationCodes = new Map();
const loginVerificationCodes = new Map();
const passwordResetCodes = new Map();

// Cleanup expired codes every 5 minutes
setInterval(() => {
  const now = Date.now();
  
  for (const [email, data] of verificationCodes.entries()) {
    if (now > data.expiresAt) {
      verificationCodes.delete(email);
      console.log(`🗑️ Cleaned up expired signup code for: ${email}`);
    }
  }
  
  for (const [email, data] of loginVerificationCodes.entries()) {
    if (now > data.expiresAt) {
      loginVerificationCodes.delete(email);
      console.log(`🗑️ Cleaned up expired login code for: ${email}`);
    }
  }
  
  for (const [email, data] of passwordResetCodes.entries()) {
    if (now > data.expiresAt) {
      passwordResetCodes.delete(email);
      console.log(`🗑️ Cleaned up expired password reset code for: ${email}`);
    }
  }
}, 5 * 60 * 1000);

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = {
  verificationCodes,
  loginVerificationCodes,
  passwordResetCodes,
  generateVerificationCode
};