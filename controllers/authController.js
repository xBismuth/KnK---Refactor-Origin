// ==================== AUTHENTICATION CONTROLLER ====================
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const db = require('../config/db');
const { JWT_SECRET } = require('../middlewares/authMiddleware');
const { 
  verificationCodes, 
  loginVerificationCodes,
  passwordResetCodes,
  passwordChangeCodes,
  generateVerificationCode 
} = require('../utils/verificationStore');
const {
  sendVerificationEmail,
  sendLoginVerificationEmail,
  sendPasswordResetEmail
} = require('../utils/emailHelper');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Step 1: Signup - Send verification code
exports.signup = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and password are required' 
      });
    }

    const [existingUsers] = await db.query(
      'SELECT id, email FROM users WHERE email = ?', 
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is already registered. Please sign in instead.' 
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const verificationCode = generateVerificationCode();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    verificationCodes.set(email, {
      code: verificationCode,
      expiresAt,
      userData: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword
      }
    });

    // Check if email service is configured
    const emailConfigured = process.env.MAIL_USER && process.env.MAIL_PASS;
    if (!emailConfigured) {
      console.error('❌ Email service not configured! Gmail credentials missing.');
      return res.status(500).json({ 
        success: false, 
        message: 'Email service not configured. Please contact support.' 
      });
    }

    // Send email in background (non-blocking) for fast response
    // This allows the API to respond immediately while email is being sent
    sendVerificationEmail(email, verificationCode, name)
      .then(() => {
        console.log(`✅ Verification code sent to ${email}`);
      })
      .catch((emailError) => {
        console.error('📧 Email sending failed after retries:', emailError.message);
        // Email failed but code is still stored, user can resend
        // Don't block the response - user can try resending if needed
      });

    // Respond immediately - email is being sent in background
    res.json({ 
      success: true,
      message: 'Verification code sent to your email',
      email: email,
      devCode: (process.env.NODE_ENV === 'development' || process.env.EMAIL_DEV_MODE === 'true') ? verificationCode : undefined
    });

  } catch (error) {
    console.error('❌ Signup error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during signup. Please try again.' 
    });
  }
};

// Step 2: Verify code and create account
exports.verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    console.log('🔍 Verifying code for:', email);

    if (!email || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and verification code are required' 
      });
    }

    const verificationData = verificationCodes.get(email);

    if (!verificationData) {
      return res.status(400).json({ 
        success: false, 
        message: 'No verification code found. Please request a new one.' 
      });
    }

    if (Date.now() > verificationData.expiresAt) {
      verificationCodes.delete(email);
      return res.status(400).json({ 
        success: false, 
        message: 'Verification code expired. Please request a new one.' 
      });
    }

    if (verificationData.code !== code.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid verification code. Please try again.' 
      });
    }

    const { name, phone, password } = verificationData.userData;

    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ?', 
      [email]
    );

    if (existingUsers.length > 0) {
      verificationCodes.delete(email);
      return res.status(400).json({ 
        success: false, 
        message: 'Account already exists. Please sign in.' 
      });
    }

    const [result] = await db.query(
      `INSERT INTO users (name, email, phone, password_hash, auth_type, role, created_at, last_login) 
       VALUES (?, ?, ?, ?, 'email', 'customer', NOW(), NOW())`,
      [name, email, phone, password]
    );

    verificationCodes.delete(email);

    // ✅ Use consistent userId field
    const token = jwt.sign(
      { 
        userId: result.insertId,
        email,
        name,
        role: 'customer'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: result.insertId,
        name,
        email,
        phone,
        role: 'customer',
        authType: 'email',
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Verification error:', error.message);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered. Please sign in.' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error during verification. Please try again.' 
    });
  }
};

// Resend verification code
exports.resendCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const verificationData = verificationCodes.get(email);

    if (!verificationData) {
      return res.status(400).json({ 
        success: false, 
        message: 'No pending verification found for this email. Please start signup again.' 
      });
    }

    const newCode = generateVerificationCode();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    verificationCodes.set(email, { ...verificationData, code: newCode, expiresAt });

    // Check if email service is configured
    const emailConfigured = process.env.MAIL_USER && process.env.MAIL_PASS;
    if (!emailConfigured) {
      console.error('❌ Email service not configured! Gmail credentials missing.');
      return res.status(500).json({ 
        success: false, 
        message: 'Email service not configured. Please contact support.' 
      });
    }

    // Send email in background (non-blocking) for fast response
    sendVerificationEmail(email, newCode, verificationData.userData.name)
      .then(() => {
        console.log(`✅ Resend verification code sent to ${email}`);
      })
      .catch((emailError) => {
        console.error('📧 Resend email failed:', emailError.message);
        // Email failed but new code is stored, user can try again
      });

    // Respond immediately - email is being sent in background
    return res.json({ 
      success: true, 
      message: 'New verification code sent to your email',
      devCode: (process.env.NODE_ENV === 'development' || process.env.EMAIL_DEV_MODE === 'true') ? newCode : undefined
    });

  } catch (error) {
    console.error('❌ Resend code error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to resend verification code' });
  }
};

// Send login verification code
exports.sendLoginCode = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required' });

    const [users] = await db.query(
      'SELECT id, email, name, password_hash, role FROM users WHERE email = ? AND auth_type = ?',
      [email, 'email']
    );

    if (users.length === 0)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    // ✅ Admin direct login with consistent token field
    if (user.role === 'admin') {
      await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

      const token = jwt.sign(
        { 
          userId: user.id,
          email,
          name: user.name,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        skipVerification: true,
        message: 'Admin login successful',
        token,
        user: {
          id: user.id,
          email,
          name: user.name,
          role: user.role,
          authType: 'email'
        }
      });
    }

    // Regular users
    const verificationCode = generateVerificationCode();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    loginVerificationCodes.set(email, {
      code: verificationCode,
      expiresAt,
      userId: user.id,
      userName: user.name,
      userRole: user.role
    });

    // Send email in background (non-blocking) for fast response
    sendLoginVerificationEmail(email, verificationCode, user.name)
      .then(() => {
        console.log(`✅ Login verification code sent to ${email}`);
      })
      .catch((emailError) => {
        console.error('📧 Login verification email sending failed:', emailError.message);
        // Email failed but code is still stored, user can request again
      });

    res.json({
      success: true,
      skipVerification: false,
      message: 'Verification code sent to your email',
      email,
      devCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
    });

  } catch (error) {
    console.error('❌ Send login code error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Verify login code
exports.verifyLoginCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code)
      return res.status(400).json({ success: false, message: 'Email and code are required' });

    const loginData = loginVerificationCodes.get(email);
    if (!loginData)
      return res.status(400).json({ success: false, message: 'No verification code found.' });

    if (Date.now() > loginData.expiresAt) {
      loginVerificationCodes.delete(email);
      return res.status(400).json({ success: false, message: 'Verification code expired.' });
    }

    if (loginData.code !== code)
      return res.status(400).json({ success: false, message: 'Invalid verification code' });

    await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [loginData.userId]);

    // ✅ Consistent userId in token
    const token = jwt.sign(
      { 
        userId: loginData.userId,
        email,
        name: loginData.userName,
        role: loginData.userRole
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    loginVerificationCodes.delete(email);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: loginData.userId,
        email,
        name: loginData.userName,
        role: loginData.userRole,
        authType: 'email'
      }
    });

  } catch (error) {
    console.error('❌ Verify login code error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during verification' });
  }
};

// Google OAuth
exports.googleAuth = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token)
      return res.status(400).json({ success: false, message: 'No token provided' });

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const userId = payload.sub;
    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;

    const [existingUser] = await db.query(
      'SELECT * FROM users WHERE google_id = ? OR email = ?',
      [userId, email]
    );

    let user;
    if (existingUser.length > 0) {
      user = existingUser[0];
      if (!user.google_id) {
        await db.query(
          'UPDATE users SET google_id = ?, auth_type = ?, picture = ?, last_login = NOW() WHERE email = ?', 
          [userId, 'google', picture || null, email]
        );
      } else {
        await db.query('UPDATE users SET last_login = NOW() WHERE google_id = ?', [userId]);
      }
    } else {
      const [result] = await db.query(
        `INSERT INTO users (google_id, email, name, picture, auth_type, role, created_at, last_login)
         VALUES (?, ?, ?, ?, 'google', 'customer', NOW(), NOW())`,
        [userId, email, name, picture || null]
      );
      user = { id: result.insertId, google_id: userId, email, name, picture, role: 'customer' };
    }

    // ✅ Consistent userId in token
    const appToken = jwt.sign(
      { 
        userId: user.id,
        email,
        name,
        role: user.role,
        googleId: userId
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Google authentication successful',
      token: appToken,
      user: {
        id: user.id,
        email,
        name,
        picture,
        role: user.role,
        authType: 'google'
      }
    });

  } catch (error) {
    console.error('Google auth error:', error.message);
    res.status(400).json({ success: false, message: 'Google authentication failed', error: error.message });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, email, name, picture, phone, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: users[0] });
  } catch (error) {
    console.error('Get user error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch user', error: error.message });
  }
};

// ==================== UPDATE PROFILE FUNCTION ====================
// Add this function to your existing authController.js

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, currentPassword, newPassword } = req.body;
    const userId = req.user.userId; // From JWT middleware

    // Validation
    if (!name || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and email are required' 
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }

    // Check if email is already used by another user
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, userId]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is already used by another account' 
      });
    }

    // Get current user data
    const [users] = await db.query(
      'SELECT id, email, name, phone, password_hash, auth_type FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const user = users[0];

    // Password update logic (only for email auth users)
    let updateQuery = 'UPDATE users SET name = ?, email = ?, phone = ?';
    let updateParams = [name, email, phone || null];

    if (newPassword) {
      // Password change is only allowed for email auth users
      if (user.auth_type !== 'email') {
        return res.status(400).json({ 
          success: false, 
          message: 'Password changes are only available for email-authenticated accounts' 
        });
      }

      // Validate current password
      if (!currentPassword) {
        return res.status(400).json({ 
          success: false, 
          message: 'Current password is required to set a new password' 
        });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false, 
          message: 'Current password is incorrect' 
        });
      }

      // Validate new password strength
      if (newPassword.length < 6) {
        return res.status(400).json({ 
          success: false, 
          message: 'New password must be at least 6 characters long' 
        });
      }

      // Hash new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      updateQuery += ', password_hash = ?';
      updateParams.push(hashedPassword);
    }

    // Complete the query
    updateQuery += ' WHERE id = ?';
    updateParams.push(userId);

    // Execute update
    await db.query(updateQuery, updateParams);

    // Fetch updated user data
    const [updatedUsers] = await db.query(
      'SELECT id, email, name, phone, picture, created_at, auth_type FROM users WHERE id = ?',
      [userId]
    );

    const updatedUser = updatedUsers[0];

    // Log the profile update
    console.log(`✅ Profile updated for user ${userId} (${email})`);

    res.json({
      success: true,
      message: newPassword ? 'Profile and password updated successfully' : 'Profile updated successfully',
      passwordChanged: !!newPassword,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        picture: updatedUser.picture,
        authType: updatedUser.auth_type,
        createdAt: updatedUser.created_at
      }
    });

  } catch (error) {
    console.error('❌ Update profile error:', error.message);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is already in use' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error during profile update. Please try again.' 
    });
  }
};

// Forgot Password - Send reset code
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Check if user exists
    const [users] = await db.query(
      'SELECT id, email, name, auth_type FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      // Don't reveal if email exists for security
      return res.json({ 
        success: true, 
        message: 'If an account exists with this email, a password reset code has been sent.' 
      });
    }

    const user = users[0];
    
    // Only allow password reset for email-authenticated users
    if (user.auth_type !== 'email') {
      return res.status(400).json({ 
        success: false, 
        message: 'Password reset is only available for email-authenticated accounts. Please use Google sign-in.' 
      });
    }

    // Generate reset code
    const resetCode = generateVerificationCode();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    passwordResetCodes.set(email, {
      code: resetCode,
      expiresAt,
      userId: user.id,
      userName: user.name
    });

    // Send email in background (non-blocking) for fast response
    sendPasswordResetEmail(email, resetCode, user.name)
      .then(() => {
        console.log(`✅ Password reset code sent to ${email}`);
      })
      .catch((emailError) => {
        console.error('📧 Password reset email sending failed:', emailError.message);
        // Email failed but code is still stored, user can request again
        passwordResetCodes.delete(email);
      });

    res.json({
      success: true,
      message: 'Password reset code sent to your email',
      email: email,
      devCode: process.env.NODE_ENV === 'development' ? resetCode : undefined
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again.' 
    });
  }
};

// Reset Password - Verify code and set new password
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    
    if (!email || !code || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, code, and new password are required' 
      });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check reset code
    const resetData = passwordResetCodes.get(email);
    if (!resetData) {
      return res.status(400).json({ 
        success: false, 
        message: 'No password reset request found. Please request a new code.' 
      });
    }

    if (Date.now() > resetData.expiresAt) {
      passwordResetCodes.delete(email);
      return res.status(400).json({ 
        success: false, 
        message: 'Password reset code has expired. Please request a new code.' 
      });
    }

    if (resetData.code !== code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid reset code. Please try again.' 
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    await db.query(
      'UPDATE users SET password_hash = ? WHERE id = ? AND email = ? AND auth_type = ?',
      [hashedPassword, resetData.userId, email, 'email']
    );

    // Delete used reset code
    passwordResetCodes.delete(email);

    console.log(`✅ Password reset successful for user ${resetData.userId} (${email})`);

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now sign in with your new password.'
    });

  } catch (error) {
    console.error('❌ Reset password error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again.' 
    });
  }
};

// Request Password Change Code (for logged-in users)
exports.requestPasswordChangeCode = async (req, res) => {
  try {
    // Get user from token (must be authenticated)
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // Get user info
    const [users] = await db.query(
      'SELECT id, email, name, auth_type FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const user = users[0];

    // Only allow password change for email-authenticated users
    if (user.auth_type !== 'email') {
      return res.status(400).json({ 
        success: false, 
        message: 'Password change is only available for email-authenticated accounts' 
      });
    }

    // Generate change code
    const changeCode = generateVerificationCode();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    passwordChangeCodes.set(user.email, {
      code: changeCode,
      expiresAt,
      userId: user.id,
      userName: user.name
    });

    // Send email in background (non-blocking) for fast response
    sendPasswordResetEmail(user.email, changeCode, user.name)
      .then(() => {
        console.log(`✅ Password change code sent to ${user.email}`);
      })
      .catch((emailError) => {
        console.error('📧 Password change email sending failed:', emailError.message);
        // Email failed but code is still stored, user can request again
        passwordChangeCodes.delete(user.email);
      });

    res.json({
      success: true,
      message: 'Verification code sent to your email',
      email: user.email,
      devCode: process.env.NODE_ENV === 'development' ? changeCode : undefined
    });

  } catch (error) {
    console.error('❌ Request password change code error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again.' 
    });
  }
};

// Verify Password Change Code
exports.verifyPasswordChangeCode = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Verification code is required' 
      });
    }

    // Get user email
    const [users] = await db.query(
      'SELECT email FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const email = users[0].email;

    // Check change code
    const changeData = passwordChangeCodes.get(email);
    if (!changeData) {
      return res.status(400).json({ 
        success: false, 
        message: 'No password change request found. Please request a new code.' 
      });
    }

    if (Date.now() > changeData.expiresAt) {
      passwordChangeCodes.delete(email);
      return res.status(400).json({ 
        success: false, 
        message: 'Verification code has expired. Please request a new code.' 
      });
    }

    if (changeData.code !== code.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid verification code. Please try again.' 
      });
    }

    // Code is valid - mark as verified (don't delete yet, need it for password change)
    res.json({
      success: true,
      message: 'Verification code verified successfully'
    });

  } catch (error) {
    console.error('❌ Verify password change code error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again.' 
    });
  }
};

// Change Password With Code (for logged-in users)
exports.changePasswordWithCode = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const { code, newPassword } = req.body;
    
    if (!code || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Verification code and new password are required' 
      });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Get user info
    const [users] = await db.query(
      'SELECT id, email, auth_type FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const user = users[0];

    // Only allow password change for email-authenticated users
    if (user.auth_type !== 'email') {
      return res.status(400).json({ 
        success: false, 
        message: 'Password change is only available for email-authenticated accounts' 
      });
    }

    // Check change code
    const changeData = passwordChangeCodes.get(user.email);
    if (!changeData) {
      return res.status(400).json({ 
        success: false, 
        message: 'No password change request found. Please request a new code.' 
      });
    }

    if (Date.now() > changeData.expiresAt) {
      passwordChangeCodes.delete(user.email);
      return res.status(400).json({ 
        success: false, 
        message: 'Verification code has expired. Please request a new code.' 
      });
    }

    if (changeData.code !== code.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid verification code. Please try again.' 
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    await db.query(
      'UPDATE users SET password_hash = ? WHERE id = ? AND email = ? AND auth_type = ?',
      [hashedPassword, userId, user.email, 'email']
    );

    // Delete used change code
    passwordChangeCodes.delete(user.email);

    console.log(`✅ Password change successful for user ${userId} (${user.email})`);

    res.json({
      success: true,
      message: 'Password has been changed successfully'
    });

  } catch (error) {
    console.error('❌ Change password with code error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again.' 
    });
  }
};