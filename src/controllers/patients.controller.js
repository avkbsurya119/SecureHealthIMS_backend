import { supabase } from '../config/supabaseClient.js';
import { ApiResponse, NotFoundError } from '../utils/errors.js';
import { asyncHandler } from '../middleware/errorHandler.middleware.js';

/**
 * Search Patients
 * GET /api/patients/search?q=query
 * 
 * Searches for patients by name, email, or phone.
 * Restricted to: admin, doctor, nurse
 */
export const searchPatients = asyncHandler(async (req, res) => {
    const { q } = req.query;

    // Type validation: ensure q is a string (prevents array injection)
    if (!q || typeof q !== 'string' || q.length < 2) {
        return ApiResponse.success(res, []);
    }

    // Search in users table where role is patient
    // Using ilike for case-insensitive partial match
    // Note: spaces in query are handled by ilike matching the literal string
    const searchPattern = `%${q}%`;
    const { data: patients, error } = await supabase
        .from('users')
        .select('id, full_name, email, phone, date_of_birth, gender, blood_group')
        .eq('role', 'patient')
        .or(`full_name.ilike.${searchPattern},email.ilike.${searchPattern},phone.ilike.${searchPattern}`)
        .limit(20);

    if (error) {
        console.error("Search failed:", error);
        throw error;
    }

    // Map for frontend consistency if needed
    const mappedPatients = patients.map(p => ({
        ...p,
        name: p.full_name // Frontend expects 'name'
    }));

    return ApiResponse.success(res, mappedPatients);
});

/**
 * Get Patient by ID
 * GET /api/patients/:id
 */
export const getPatientById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const { data: patient, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'patient')
        .eq('id', id)
        .single();

    if (error || !patient) {
        throw new NotFoundError('Patient');
    }

    const mappedPatient = {
        ...patient,
        name: patient.full_name
    };

    return ApiResponse.success(res, mappedPatient);
});

/**
 * Get My Patient Data
 * GET /api/patients/me
 * 
 * Returns the current patient's data from the patients table
 */
export const getMyPatientData = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const { data: patient, error } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching patient data:', error);
        throw error;
    }

    if (!patient) {
        return ApiResponse.success(res, null);
    }

    // Map dob to date_of_birth for consistency
    const mappedPatient = {
        ...patient,
        date_of_birth: patient.dob
    };

    return ApiResponse.success(res, mappedPatient);
});


/**
 * Register Patient as User
 * POST /api/patients/register-user
 * 
 * Allows a patient to register themselves in the users table
 * This makes them searchable by doctors and enables full platform access
 */
export const registerPatientAsUser = asyncHandler(async (req, res) => {
    const patientId = req.user.id; // Get authenticated user's ID

    // Extract data from request body
    const {
        full_name,
        phone,
        date_of_birth,
        gender,
        blood_group,
        address,
        allergies,
        medical_history,
        emergency_contact,
        emergency_phone
    } = req.body;

    // Validate required fields
    if (!full_name || !phone || !date_of_birth || !gender) {
        return ApiResponse.error(res, 'Missing required fields: full_name, phone, date_of_birth, gender', 400);
    }

    // Validate gender
    const validGenders = ['male', 'female', 'other'];
    if (!validGenders.includes(gender.toLowerCase())) {
        return ApiResponse.error(res, 'Invalid gender. Must be one of: male, female, other', 400);
    }

    // Validate date of birth (not in future)
    const dob = new Date(date_of_birth);
    if (dob > new Date()) {
        return ApiResponse.error(res, 'Date of birth cannot be in the future', 400);
    }

    console.log(`Patient ${patientId} attempting to register as user`);

    // Check if patient already exists in users table
    const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, full_name, role')
        .eq('id', patientId)
        .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking existing user:', checkError);
        throw checkError;
    }

    if (existingUser) {
        console.log(`Patient ${patientId} already registered as user`);
        return ApiResponse.success(res, {
            message: 'You are already registered in the system',
            user: existingUser,
            alreadyRegistered: true
        });
    }

    // Create user record
    const userData = {
        id: patientId,
        email: req.user.email, // Get from authenticated user
        full_name: full_name.trim(),
        phone: phone.trim(),
        date_of_birth,
        gender: gender.toLowerCase(),
        blood_group: blood_group?.trim() || null,
        address: address?.trim() || null,
        allergies: allergies?.trim() || null,
        medical_history: medical_history?.trim() || null,
        emergency_contact: emergency_contact?.trim() || null,
        emergency_phone: emergency_phone?.trim() || null,
        role: 'patient',
        is_active: true,
        profile_completed: true,
        approval_status: 'approved'
    };

    const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

    if (insertError) {
        console.error('CRITICAL: Error creating user record in users table:');
        console.error('User Data attempted:', JSON.stringify(userData, null, 2));
        console.error('Supabase Error:', {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint
        });
        throw insertError;
    }

    console.log(`Successfully registered patient ${patientId} as user`);

    return ApiResponse.success(res, {
        message: 'Successfully registered! You can now be found by doctors in the system.',
        user: newUser,
        alreadyRegistered: false
    });
});

