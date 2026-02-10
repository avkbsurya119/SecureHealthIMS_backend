/**
 * Authentication Middleware
 * Verifies JWT tokens from Supabase Auth and extracts user information
 * Security: Rejects unauthenticated requests and inactive users
 */

import { supabase } from '../config/supabaseClient.js';
import { UnauthenticatedError } from '../utils/errors.js';
import { asyncHandler } from './errorHandler.middleware.js';
import { verifyToken } from '../utils/jwt.utils.js';

/**
 * Verify JWT token and attach user to request
 * CRITICAL: This middleware must run on ALL protected routes
 * 
 * Adds to req object:
 * - req.user: { id, email, role, is_active }
 * - req.token: Original JWT token
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthenticatedError('Access token required');
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Verify SUPABASE JWT
  // improved: use supabase.auth.getUser(token) to validation token & get user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    throw new UnauthenticatedError('Invalid or expired token');
  }

  // Get user details from users table (includes role and is_active)
  // We can trust the payload for ID, but let's check DB for is_active and role to ensure they are up to date
  const { data: userDetails, error: userError } = await supabase
    .from('users')
    .select('id, email, role, is_active, created_at')
    .eq('id', user.id)
    .single();

  if (userError || !userDetails) {
    throw new UnauthenticatedError('User not found in system');
  }

  // SECURITY: Reject inactive users
  if (!userDetails.is_active) {
    throw new UnauthenticatedError('Account is inactive. Please contact administrator');
  }

  // Attach user info to request for use in subsequent middleware/controllers
  req.user = {
    id: userDetails.id,
    email: userDetails.email, // Use email from DB record
    role: userDetails.role,
    is_active: userDetails.is_active
  };

  req.token = token;

  next();
});

/**
 * Authenticate using only Supabase Auth (no users table check)
 * Use this for endpoints that need to work BEFORE the user is in the users table
 * (e.g., patient self-registration)
 * 
 * Adds to req object:
 * - req.user: { id, email } (from Supabase Auth only)
 * - req.token: Original JWT token
 */
export const authenticateSupabaseOnly = asyncHandler(async (req, res, next) => {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthenticatedError('Access token required');
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Verify SUPABASE JWT only - don't check users table
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    throw new UnauthenticatedError('Invalid or expired token');
  }

  // Attach minimal user info from Supabase Auth
  req.user = {
    id: user.id,
    email: user.email
  };

  req.token = token;

  next();
});

/**
 * Optional authentication - doesn't fail if no token
 * Useful for endpoints that behave differently for authenticated users
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided - continue without user
    return next();
  }

  try {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (payload) {
      const { data: userDetails } = await supabase
        .from('users')
        .select('id, role, is_active')
        .eq('id', payload.id)
        .single();

      if (userDetails && userDetails.is_active) {
        req.user = {
          id: userDetails.id,
          email: payload.email,
          role: userDetails.role,
          is_active: userDetails.is_active
        };
      }
    }
  } catch (error) {
    // Ignore authentication errors for optional auth
    console.warn('Optional auth failed:', error.message);
  }

  next();
});

/**
 * Restrict access to specific roles
 * @param {string|string[]} roles - Allowed role(s)
 */
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new UnauthenticatedError('User not authenticated');
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(req.user.role)) {
      throw new UnauthenticatedError(`Role '${req.user.role}' is not authorized to access this resource`);
    }

    next();
  };
};
