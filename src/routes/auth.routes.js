import express from 'express';
import {
  initiateRegister,
  verifyAndRegister,
  register,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  refreshToken,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { validate, validators } from '../middleware/validation.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register/initiate
 * @desc    Initiate registration (Step 1: Send OTP)
 * @access  Public
 */
router.post(
  '/register/initiate',
  validate(validators.initiateRegister),
  initiateRegister
);

/**
 * @route   POST /api/auth/register/verify
 * @desc    Verify OTP and complete registration (Step 2)
 * @access  Public
 */
router.post(
  '/register/verify',
  validate(validators.verifyOTP),
  verifyAndRegister
);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (Deprecated in favor of /register/initiate)
 * @access  Public
 */
router.post(
  '/register',
  register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get JWT token
 * @access  Public
 */
router.post(
  '/login',
  validate(validators.login),
  login
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (invalidate session)
 * @access  Private (optional)
 */
router.post(
  '/logout',
  optionalAuth,
  logout
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  getCurrentUser
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put(
  '/profile',
  authenticate,
  updateProfile
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  refreshToken
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post(
  '/forgot-password',
  forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/reset-password',
  resetPassword
);

export default router;
