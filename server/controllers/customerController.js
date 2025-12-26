import Customer from '../models/Customer.js';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';
import { validateEmail, isDisposableEmail } from '../utils/emailValidator.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

export const loginCustomer = async (req, res) => {
  const { username, password } = req.body; // username may be a username or an email

  try {
    // Allow login by username OR email (users may paste email into the username field)
    const customer = await Customer.findOne({
      where: { [Op.or]: [{ username }, { email: username }] },
    });
    if (!customer) {
      console.log('Login attempt failed - no user found for identifier:', username);
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // Check if account uses OAuth (Google)
    if (customer.provider !== 'local') {
      return res.status(400).json({ msg: 'Please login using Google' });
    }

    const isMatch = await customer.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // Check if email is verified
    if (!customer.isVerified) {
      return res.status(403).json({
        msg: 'Please verify your email before logging in. Check your inbox for the verification link.',
        email: customer.email,
        requiresVerification: true,
      });
    }

    const payload = {
      customer: {
        id: customer.id,
        position: customer.position,
      },
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });

    res.cookie('token', token, { httpOnly: true });
    res.status(200).json({
      msg: 'Login successful',
      token,
      user: {
        id: customer.id,
        username: customer.username,
        email: customer.email,
        position: customer.position,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const registerCustomer = async (req, res) => {
  // Only accept the fields we expect and don't trust client-set roles
  const { email, username, password, fullName } = req.body;

  // Basic server-side validation
  if (!email || !username || !password) {
    return res.status(400).json({ msg: 'Email, username and password are required' });
  }

  // Comprehensive email validation (format + domain existence)
  const emailValidation = await validateEmail(email);
  if (!emailValidation.valid) {
    return res.status(400).json({ msg: emailValidation.reason });
  }

  // Check for disposable email
  if (isDisposableEmail(email)) {
    return res.status(400).json({ msg: 'Temporary/disposable email addresses are not allowed' });
  }

  // Full name validation
  if (fullName && fullName.trim().length < 2) {
    return res.status(400).json({ msg: 'Full name must be at least 2 characters' });
  }

  // Password complexity validation
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ msg: 'Password must be at least 6 characters' });
  }

  // Enhanced password validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      msg: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
    });
  }

  try {
    // Check both email and username for existing users
    const existing = await Customer.findOne({
      where: {
        [Op.or]: [{ email }, { username }],
      },
    });

    if (existing) {
      // determine which field conflicts
      if (existing.email === email) return res.status(400).json({ msg: 'Email already exists' });
      if (existing.username === username)
        return res.status(400).json({ msg: 'Username already exists' });
      return res.status(400).json({ msg: 'Customer already exists' });
    }

    // Generate verification token
    const verificationToken = jwt.sign({ email, username }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    // Force position to 'customer' to prevent client from creating admin accounts
    const created = await Customer.create({
      email,
      username,
      password,
      fullName: fullName || null,
      position: 'customer',
      isVerified: false,
      verificationToken,
      provider: 'local',
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, username, verificationToken);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue registration even if email fails
    }

    res.status(201).json({
      msg: 'Registration successful! Please check your email to verify your account.',
      customer: {
        id: created.id,
        email: created.email,
        username: created.username,
        position: created.position,
      },
    });
  } catch (err) {
    console.error(err);
    // Handle unique constraint errors from Sequelize more gracefully
    if (
      err.name === 'SequelizeUniqueConstraintError' &&
      Array.isArray(err.errors) &&
      err.errors.length > 0
    ) {
      const field = err.errors[0].path || 'field';
      return res.status(400).json({ msg: `${field} already exists` });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

export const logoutCustomer = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ msg: 'Logged out successfully' });
};

export const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.findAll({ attributes: { exclude: ['password'] } });
    res.status(200).json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Verify email with token
 */
export const verifyEmail = async (req, res) => {
  // Accept token query param but be resilient to noise (some mail clients or trackers append ":1" or similar).
  let { token } = req.query;
  if (!token) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      return res.redirect(
        `${clientUrl}/bus-booking/verify-email?status=error&msg=${encodeURIComponent('Verification token is required')}`
      );
    }
    return res.status(400).json({ msg: 'Verification token is required' });
  }

  // Extract a JWT-like substring if extra chars were appended (e.g. "...:1")
  try {
    const jwtMatch = String(token).match(/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
    if (jwtMatch) token = jwtMatch[0];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find customer with this token
    const customer = await Customer.findOne({
      where: {
        email: decoded.email,
        verificationToken: token,
      },
    });

    // If not found by token, maybe the account was already verified by a previous request.
    if (!customer) {
      const existing = await Customer.findOne({ where: { email: decoded.email } });
      if (existing && existing.isVerified) {
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        if (req.headers.accept && req.headers.accept.includes('text/html')) {
          return res.redirect(
            `${clientUrl}/bus-booking/verify-email?status=success&msg=${encodeURIComponent('Email already verified')}`
          );
        }
        return res.status(200).json({ msg: 'Email already verified' });
      }

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
        return res.redirect(
          `${clientUrl}/bus-booking/verify-email?status=error&msg=${encodeURIComponent('Invalid or expired verification token')}`
        );
      }
      return res.status(400).json({ msg: 'Invalid or expired verification token' });
    }

    if (customer.isVerified) {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
        return res.redirect(
          `${clientUrl}/bus-booking/verify-email?status=success&msg=${encodeURIComponent('Email already verified')}`
        );
      }
      return res.status(200).json({ msg: 'Email already verified' });
    }

    // Update customer
    customer.isVerified = true;
    customer.verificationToken = null;
    await customer.save();

    // Successful verification: redirect browser to client success page, otherwise return JSON
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      return res.redirect(
        `${clientUrl}/bus-booking/verify-email?status=success&msg=${encodeURIComponent('Email verified successfully! You can now login.')}`
      );
    }

    res.status(200).json({ msg: 'Email verified successfully! You can now login.' });
  } catch (err) {
    console.error('Email verification error:', err);
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
        return res.redirect(
          `${clientUrl}/bus-booking/verify-email?status=error&msg=${encodeURIComponent('Invalid or expired verification token')}`
        );
      }
      return res.status(400).json({ msg: 'Invalid or expired verification token' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Request password reset
 */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ msg: 'Email is required' });
  }

  try {
    const customer = await Customer.findOne({ where: { email } });

    if (!customer) {
      // Don't reveal if email exists or not
      return res
        .status(200)
        .json({ msg: 'If that email exists, a password reset link has been sent.' });
    }

    // Check if account uses OAuth
    if (customer.provider !== 'local') {
      return res
        .status(400)
        .json({ msg: 'This account uses Google login. Password reset is not available.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    console.log('[Forgot Password] Email:', email);
    console.log('[Forgot Password] Reset token (plain):', resetToken.substring(0, 10) + '...');
    console.log('[Forgot Password] Reset token (hashed):', hashedToken.substring(0, 10) + '...');

    // Save hashed token and expiry
    customer.resetPasswordToken = hashedToken;
    customer.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await customer.save();

    console.log('[Forgot Password] Token saved to database');
    console.log('[Forgot Password] Token expires:', customer.resetPasswordExpires);

    // Send email
    try {
      await sendPasswordResetEmail(email, customer.username, resetToken);
      console.log('[Forgot Password] Email sent successfully to:', email);
    } catch (emailError) {
      console.error('[Forgot Password] Email send failed:', emailError);
    }

    res.status(200).json({ msg: 'If that email exists, a password reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ msg: 'Token and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ msg: 'Password must be at least 6 characters' });
  }

  try {
    // Hash the token to compare
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    console.log('[Reset Password] Looking for token:', hashedToken.substring(0, 10) + '...');

    // Find customer with valid token
    const customer = await Customer.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { [Op.gt]: new Date() },
      },
    });

    if (!customer) {
      console.log('[Reset Password] No customer found with valid token');
      return res.status(400).json({ msg: 'Invalid or expired reset token' });
    }

    console.log('[Reset Password] Customer found:', customer.email);
    console.log('[Reset Password] Token expires:', customer.resetPasswordExpires);
    console.log('[Reset Password] Current time:', new Date());

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    console.log('[Reset Password] New password hashed:', hashedPassword.substring(0, 20) + '...');

    // Update password and clear reset fields
    customer.password = hashedPassword;
    customer.resetPasswordToken = null;
    customer.resetPasswordExpires = null;

    console.log('[Reset Password] Saving customer...');
    await customer.save();
    console.log('[Reset Password] Customer saved successfully!');

    res
      .status(200)
      .json({ msg: 'Password reset successful! You can now login with your new password.' });
  } catch (err) {
    console.error('[Reset Password] Error:', err);
    console.error('[Reset Password] Error stack:', err.stack);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
};

/**
 * Get current user profile (authenticated user)
 */
export const getProfile = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.user.id, {
      attributes: {
        exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires', 'verificationToken'],
      },
    });

    if (!customer) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.status(200).json(customer);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Update user profile (authenticated user)
 */
export const updateProfile = async (req, res) => {
  try {
    const { username, email, phoneNumber, preferences } = req.body;
    const customer = await Customer.findByPk(req.user.id);

    if (!customer) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if new username/email is already taken by another user
    if (username && username !== customer.username) {
      const existingUsername = await Customer.findOne({ where: { username } });
      if (existingUsername && existingUsername.id !== customer.id) {
        return res.status(400).json({ msg: 'Username already exists' });
      }
      customer.username = username;
    }

    if (email && email !== customer.email) {
      const existingEmail = await Customer.findOne({ where: { email } });
      if (existingEmail && existingEmail.id !== customer.id) {
        return res.status(400).json({ msg: 'Email already exists' });
      }
      customer.email = email;
    }

    if (phoneNumber !== undefined) {
      customer.phoneNumber = phoneNumber;
    }

    // Update preferences if provided
    if (preferences !== undefined) {
      customer.preferences = preferences;
    }

    await customer.save();

    // Return updated profile without sensitive data
    const updatedProfile = await Customer.findByPk(customer.id, {
      attributes: {
        exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires', 'verificationToken'],
      },
    });

    res.status(200).json({
      msg: 'Profile updated successfully',
      customer: updatedProfile,
    });
  } catch (err) {
    console.error('Update profile error:', err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ msg: 'Username or email already exists' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Change password (authenticated user)
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ msg: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ msg: 'New password must be at least 6 characters' });
    }

    const customer = await Customer.findByPk(req.user.id);

    if (!customer) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if account uses OAuth
    if (customer.provider !== 'local') {
      return res.status(400).json({ msg: 'Cannot change password for OAuth accounts' });
    }

    // Verify current password
    const isMatch = await customer.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect' });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    customer.password = await bcrypt.hash(newPassword, salt);
    await customer.save();

    res.status(200).json({ msg: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Multer configuration for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/avatars/';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpeg, jpg, png, webp, gif) are allowed'));
  },
});

/**
 * Upload user avatar (authenticated user)
 */
export const uploadAvatar = [
  upload.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ msg: 'No file uploaded' });
      }

      const customer = await Customer.findByPk(req.user.id);
      if (!customer) {
        // Delete uploaded file if user not found
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ msg: 'User not found' });
      }

      // Delete old avatar if exists
      if (customer.avatar) {
        const oldAvatarPath = customer.avatar;
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }

      // Save new avatar path
      customer.avatar = req.file.path;
      await customer.save();

      res.status(200).json({
        msg: 'Avatar uploaded successfully',
        avatar: customer.avatar,
      });
    } catch (err) {
      console.error('Upload avatar error:', err);
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ msg: 'Server error' });
    }
  },
];

/**
 * Delete user avatar (authenticated user)
 */
export const deleteAvatar = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.user.id);
    if (!customer) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (!customer.avatar) {
      return res.status(400).json({ msg: 'No avatar to delete' });
    }

    // Delete avatar file
    if (fs.existsSync(customer.avatar)) {
      fs.unlinkSync(customer.avatar);
    }

    // Clear avatar field
    customer.avatar = null;
    await customer.save();

    res.status(200).json({ msg: 'Avatar deleted successfully' });
  } catch (err) {
    console.error('Delete avatar error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Check email availability (for real-time validation)
 */
export const checkEmailAvailability = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        available: false,
        msg: 'Email is required',
        error: 'required',
      });
    }

    // Comprehensive email validation (format + domain existence)
    const validation = await validateEmail(email);

    if (!validation.valid) {
      return res.status(400).json({
        available: false,
        msg: validation.reason,
        error: validation.checkType === 'format' ? 'invalid_format' : 'invalid_domain',
        checkType: validation.checkType,
      });
    }

    // Check for disposable email domains (optional - can be disabled)
    if (isDisposableEmail(email)) {
      return res.status(400).json({
        available: false,
        msg: 'Temporary/disposable email addresses are not allowed',
        error: 'disposable_email',
      });
    }

    // Check if email already exists in database
    const existingCustomer = await Customer.findOne({ where: { email } });

    if (existingCustomer) {
      return res.status(200).json({
        available: false,
        msg: 'Email already exists',
        error: 'exists',
      });
    }

    res.status(200).json({
      available: true,
      msg: 'Email is available',
      mxRecords: validation.mxRecords,
    });
  } catch (err) {
    console.error('Check email availability error:', err);
    res.status(500).json({
      available: false,
      msg: 'Server error',
      error: 'server_error',
    });
  }
};
