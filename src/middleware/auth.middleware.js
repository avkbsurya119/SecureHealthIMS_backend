/**
 * Authentication Middleware
 * Verifies JWT tokens from Supabase Auth and extracts user information
 * Security: Rejects unauthenticated requests and inactive users
 */

import { supabase } from '../config/supabaseClient.js';
import { UnauthenticatedError } from '../utils/errors.js';
import { asyncHandler } from './errorHandler.middleware.js';

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

  // Verify token with Supabase
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new UnauthenticatedError('Invalid or expired token');
  }

  // Get user details from users table (includes role and is_active)
  const { data: userDetails, error: userError } = await supabase
    .from('users')
    .select('id, role, is_active, created_at')
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
    email: user.email,
    role: userDetails.role,
    is_active: userDetails.is_active
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
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (!error && user) {
      const { data: userDetails } = await supabase
        .from('users')
        .select('id, role, is_active')
        .eq('id', user.id)
        .single();

      if (userDetails && userDetails.is_active) {
        req.user = {
          id: userDetails.id,
          email: user.email,
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
