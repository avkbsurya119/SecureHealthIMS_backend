import { supabase } from '../config/supabaseClient.js';
import { ValidationError, UnauthenticatedError, ConflictError } from '../utils/errors.js';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, role, name, phone, address, specialization, department_id, date_of_birth, gender } = req.body;

    // Validate required fields
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    if (!role || !['patient', 'doctor'].includes(role)) {
      throw new ValidationError('Role must be either "patient" or "doctor"');
    }

    // Role-specific validation
    if (role === 'patient') {
      if (!name || !date_of_birth || !gender) {
        throw new ValidationError('Patient registration requires: name, date_of_birth, gender');
      }
      if (!['male', 'female', 'other'].includes(gender)) {
        throw new ValidationError('Gender must be male, female, or other');
      }
    }

    if (role === 'doctor') {
      if (!name || !specialization) {
        throw new ValidationError('Doctor registration requires: name, specialization');
      }
    }

    // Step 1: Create auth user in Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: role
        }
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        throw new ConflictError('User with this email already exists');
      }
      throw new Error(authError.message);
    }

    const userId = authData.user.id;

    // Step 2: Create user record in users table
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        role: role,
        is_active: true
      });

    if (userError) {
      // Cleanup: delete auth user if users table insert fails
      await supabase.auth.admin.deleteUser(userId);
      throw new Error(`Failed to create user record: ${userError.message}`);
    }

    // Step 3: Create role-specific record (patient or doctor)
    if (role === 'patient') {
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .insert({
          user_id: userId,
          name,
          date_of_birth,
          gender,
          phone: phone || null,
          email,
          address: address || null
        })
        .select()
        .single();

      if (patientError) {
        throw new Error(`Failed to create patient record: ${patientError.message}`);
      }

      // Step 4: Create default DENIED consents for patient
      const consentTypes = ['medical_records', 'data_sharing', 'treatment', 'research'];
      const consents = consentTypes.map(type => ({
        patient_id: patientData.id,
        consent_type: type,
        status: 'denied',
        denied_at: new Date().toISOString()
      }));

      const { error: consentError } = await supabase
        .from('patient_consents')
        .insert(consents);

      if (consentError) {
        console.error('Failed to create default consents:', consentError);
        // Non-critical - don't fail registration
      }
    }

    if (role === 'doctor') {
      const { error: doctorError } = await supabase
        .from('doctors')
        .insert({
          user_id: userId,
          name,
          specialization,
          phone: phone || null,
          email,
          department_id: department_id || null
        });

      if (doctorError) {
        throw new Error(`Failed to create doctor record: ${doctorError.message}`);
      }
    }

    // Step 5: Return success with access token
    res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully`,
      data: {
        user: {
          id: userId,
          email: authData.user.email,
          role: role
        },
        session: {
          access_token: authData.session?.access_token,
          refresh_token: authData.session?.refresh_token,
          expires_at: authData.session?.expires_at
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new UnauthenticatedError('Invalid email or password');
    }

    // Get user role from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('id', data.user.id)
      .single();

    if (userError || !userData) {
      throw new UnauthenticatedError('User account not found');
    }

    if (!userData.is_active) {
      throw new UnauthenticatedError('Account is deactivated');
    }

    // Get additional user details based on role
    let userDetails = null;
    if (userData.role === 'patient') {
      const { data: patient } = await supabase
        .from('patients')
        .select('id, name, date_of_birth, gender, phone, address')
        .eq('user_id', data.user.id)
        .single();
      userDetails = patient;
    } else if (userData.role === 'doctor') {
      const { data: doctor } = await supabase
        .from('doctors')
        .select('id, name, specialization, phone, department_id')
        .eq('user_id', data.user.id)
        .single();
      userDetails = doctor;
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          role: userData.role,
          ...userDetails
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          expires_in: data.session.expires_in
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    // User is already authenticated via middleware
    const userId = req.user.id;
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      throw new UnauthenticatedError('User not found');
    }

    // Get role-specific details
    let profile = null;
    if (userData.role === 'patient') {
      const { data: patient } = await supabase
        .from('patients')
        .select('id, name, date_of_birth, gender, phone, email, address')
        .eq('user_id', userId)
        .single();
      profile = patient;
    } else if (userData.role === 'doctor') {
      const { data: doctor } = await supabase
        .from('doctors')
        .select('id, name, specialization, phone, email, department_id')
        .eq('user_id', userId)
        .single();
      profile = doctor;
    }

    res.json({
      success: true,
      data: {
        id: userId,
        email: req.user.email,
        role: userData.role,
        is_active: userData.is_active,
        ...profile
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      throw new ValidationError('Refresh token is required');
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (error) {
      throw new UnauthenticatedError('Invalid or expired refresh token');
    }

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          expires_in: data.session.expires_in
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ValidationError('Email is required');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`
    });

    if (error) {
      throw new Error(error.message);
    }

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      throw new ValidationError('Token and new password are required');
    }

    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    // Verify token and update password
    const { data, error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      throw new UnauthenticatedError('Invalid or expired reset token');
    }

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    next(error);
  }
};
