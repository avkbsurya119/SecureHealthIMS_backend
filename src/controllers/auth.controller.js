import { supabase } from '../config/supabaseClient.js';
import { ValidationError, UnauthenticatedError, ConflictError } from '../utils/errors.js';
import { generateToken, verifyToken } from '../utils/jwt.utils.js';

/**
 * Initiate registration (Step 1: Send OTP)
 * POST /api/auth/register/initiate
 */
export const initiateRegister = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user already exists in users table (Single Table Inheritance)
    const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).single();
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Step 1: Sign up in Supabase Auth (This sends the OTP/Confirmation email)
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already created')) {
        throw new ConflictError('User with this email already exists');
      }
      throw new Error(authError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP and complete registration (Step 2)
 * POST /api/auth/register/verify
 */
export const verifyAndRegister = async (req, res, next) => {
  try {
    const {
      email, token, role, name, phone, address,
      specialization, department_id, date_of_birth, gender
    } = req.body;

    // Step 1: Verify the OTP with Supabase
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup'
    });

    if (verifyError || !verifyData.user) {
      throw new ValidationError('Invalid or expired verification code');
    }

    const userId = verifyData.user.id;

    // Step 2: Create user record in users table
    const userData = {
      id: userId,
      role: role,
      is_active: true,
      email: email,
      full_name: name,
      phone: phone,
      address: address,
      date_of_birth: date_of_birth,
      gender: gender,
      specialization: specialization,
      department: department_id,
      approval_status: role === 'doctor' ? 'pending' : 'approved',
      profile_completed: false
    };

    const { error: userError } = await supabase
      .from('users')
      .insert(userData);

    if (userError) {
      // Re-cleanup might be tricky if they already verified, but usually we'd want to rollback.
      // Since it's verified, we could try to delete the auth user if the DB insert fails.
      await supabase.auth.admin.deleteUser(userId);
      throw new Error(`Failed to create user record: ${userError.message}`);
    }

    // Role-specific legacy setup (if needed for FKs)
    if (role === 'patient') {
      const { data: pData } = await supabase
        .from('patients')
        .insert({
          user_id: userId,
          name: name,
          email: email
        })
        .select('id')
        .single();

      if (pData) {
        // Create default consents
        const consentTypes = ['medical_records', 'data_sharing', 'treatment', 'research'];
        const consents = consentTypes.map(type => ({
          patient_id: pData.id,
          consent_type: type,
          status: 'denied',
          denied_at: new Date().toISOString()
        }));
        await supabase.from('patient_consents').insert(consents);
      }
    }

    // Success response
    res.status(201).json({
      success: true,
      message: role === 'doctor'
        ? 'Registration successful! Your account is pending admin approval.'
        : 'Registration successful! You can now login.',
      data: {
        user: {
          id: userId,
          email,
          role,
          name,
          verified: role === 'doctor' ? false : true
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Legacy single-step registration (Optional, keeping for compatibility if needed)
 */
export const register = async (req, res, next) => {
  // We can just redirect to initiateRegister or keep it as is.
  // Given the request, it's better to guide them to the new flow.
  res.status(410).json({
    success: false,
    message: 'Single-step registration is deprecated. Please use /register/initiate'
  });
};

/**
 * Login user
 * POST /api/auth/login
 */
// Login user
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
      console.error('Login error:', error);
      throw new UnauthenticatedError('Invalid email or password');
    }

    // Get user details from users table (Unified)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError || !userData) {
      throw new UnauthenticatedError('User account not found');
    }

    if (!userData.is_active) {
      throw new UnauthenticatedError('Account is deactivated');
    }

    // Check verification status (using new approval_status or is_verified)
    // The previous schema used 'verified' boolean in patients/doctors tables.
    // The new schema uses 'approval_status' in users table.

    // For backward compatibility or if using new schema:
    if (userData.role === 'doctor' && userData.approval_status !== 'approved') {
      throw new UnauthenticatedError('Account pending approval');
    }

    // LEGACY DATA SYNC: If users table is empty (e.g. full_name is null), try to fetch from legacy tables
    // and backfill the users table.
    let legacyData = {};
    if (!userData.full_name && !userData.name) {
      try {
        const userEmail = data.user.email || userData.email;

        if (userData.role === 'patient') {
          const { data: pData } = await supabase
            .from('patients')
            .select('name, phone, address, dob, gender, blood_group, allergies, medical_history')
            .eq('email', userEmail) // Search by email
            .single();

          if (pData) {
            legacyData = {
              full_name: pData.name,
              phone: pData.phone,
              address: pData.address,
              date_of_birth: pData.dob,
              gender: pData.gender,
              blood_group: pData.blood_group,
              allergies: pData.allergies,
              medical_history: pData.medical_history
            };
          }
        } else if (userData.role === 'doctor') {
          const { data: dData } = await supabase
            .from('doctors')
            .select('name, phone, specialization, department_id')
            .eq('email', userEmail) // Search by email
            .single();

          if (dData) {
            legacyData = {
              full_name: dData.name,
              phone: dData.phone,
              specialization: dData.specialization,
              department: dData.department_id
            };
          }
        }

        // If we found legacy data, update the users table asynchronously
        if (Object.keys(legacyData).length > 0) {
          // Merge for response
          Object.assign(userData, legacyData);

          // Fire and forget update
          supabase.from('users').update(legacyData).eq('id', data.user.id).then(({ error }) => {
            if (error) console.error('Failed to backfill legacy user data:', error);
            else console.log('Backfilled legacy user data for:', data.user.id);
          });
        }
      } catch (err) {
        console.warn('Legacy sync failed:', err);
      }
    }

    // Map for frontend compatibility
    const responseUser = {
      ...userData,
      name: userData.full_name || userData.name,
      dob: userData.date_of_birth,
      email: data.user.email // Ensure email is from auth or users
    };

    // Return Supabase Session Data
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: responseUser,
        token: data.session.access_token,
        refresh_token: data.session.refresh_token
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

    // For custom JWTs, we can't really "invalidate" them without a blacklist/store.
    // But we can check if there's a Supabase session to sign out of.
    // Since we are moving to custom JWT, the client just discards the token.
    // However, if we still have a Supabase session (via refresh token), we should sign that out.

    if (token) {
      // If we provided the Supabase refresh token in logout, we could use it.
      // But typically logout is just client-side token removal.
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
// Get current user profile from users table
export const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*') // Select all columns from users table
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      throw new UnauthenticatedError('User not found');
    }

    // LEGACY DATA SYNC: Similar logic for /me endpoint to ensure updates happen even if already logged in
    if (!userData.full_name && !userData.name) {
      try {
        let legacyData = {};
        // Retrieve email from user object or token
        const userEmail = req.user.email || userData.email;

        // Try syncing for Patient
        if (userData.role === 'patient') {
          // Search by user_id OR email (as requested)
          // Using email is robust for legacy data
          const { data: pData } = await supabase
            .from('patients')
            .select('name, phone, address, dob, gender, blood_group, allergies, medical_history')
            //.eq('user_id', userId) // Old way
            .eq('email', userEmail)  // New way as per request
            .single();

          if (pData) {
            legacyData = {
              full_name: pData.name,
              phone: pData.phone,
              address: pData.address,
              date_of_birth: pData.dob,
              gender: pData.gender,
              blood_group: pData.blood_group,
              allergies: pData.allergies,
              medical_history: pData.medical_history
            };
          }
        }
        // Try syncing for Doctor
        else if (userData.role === 'doctor') {
          const { data: dData } = await supabase
            .from('doctors')
            .select('name, phone, specialization, department_id')
            .eq('email', userEmail) // Search by email
            .single();

          if (dData) {
            legacyData = {
              full_name: dData.name,
              phone: dData.phone,
              specialization: dData.specialization,
              department: dData.department_id
            };
          }
        }

        if (Object.keys(legacyData).length > 0) {
          Object.assign(userData, legacyData);
          await supabase.from('users').update(legacyData).eq('id', userId);
        }
      } catch (err) {
        console.warn('Legacy sync /me failed:', err);
      }
    }

    // Map DB column names back to frontend expected names if needed
    // Frontend expects: name, dob, etc.
    // DB has: full_name, date_of_birth

    // We can return the raw user object and let frontend adapt, OR map it here.
    // Mapping here preserves frontend compatibility.

    const responseData = {
      ...userData,
      name: userData.full_name || userData.name, // Fallback if old column exists
      dob: userData.date_of_birth,
      email: req.user.email || userData.email, // Force email from token if missing in DB
      // Map other fields if necessary or usage in frontend matches DB
    };

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
// Update user profile in users table
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      // Basic
      name, phone, address, dob, gender,
      // Patient
      blood_group, allergies, medical_history, emergency_contact, emergency_phone,
      // Doctor
      specialization, license_number, education, experience_years, hospital_affiliation, department_id
    } = req.body;

    const updates = {};

    // Map frontend fields to DB columns (snake_case)
    if (name) updates.full_name = name; // Note: DB column is full_name
    if (phone) updates.phone = phone;
    if (address) updates.address = address;
    if (dob) updates.date_of_birth = dob;
    if (gender) updates.gender = gender;

    // Patient specific
    if (blood_group) updates.blood_group = blood_group;
    if (allergies) updates.allergies = allergies;
    if (medical_history) updates.medical_history = medical_history;
    if (emergency_contact) updates.emergency_contact = emergency_contact;
    if (emergency_phone) updates.emergency_phone = emergency_phone;

    // Doctor specific
    if (specialization) updates.specialization = specialization;
    if (license_number) updates.license_number = license_number;
    if (education) updates.education = education;
    if (experience_years) updates.experience_years = experience_years;
    if (hospital_affiliation) updates.hospital_affiliation = hospital_affiliation;
    if (department_id) updates.department = department_id; // Using department column for ID or Name? Schema said department TEXT.

    // Mark profile as completed if enough fields are present
    if (name && phone && dob && gender && address) {
      updates.profile_completed = true;
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: userId,
        email: req.user.email,
        role: updatedUser.role,
        name: updatedUser.full_name,
        phone: updatedUser.phone,
        address: updatedUser.address,
        dob: updatedUser.date_of_birth,
        gender: updatedUser.gender,
        // Include other fields as needed
        ...updatedUser
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

    // Use Supabase to refresh the session
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
        token: data.session.access_token, // Use Supabase Access Token
        refresh_token: data.session.refresh_token
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
