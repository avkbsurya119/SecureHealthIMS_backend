import { supabase } from '../config/supabaseClient.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

/**
 * Get all pending doctor registration requests
 * GET /api/admin/requests
 */
export const getPendingDoctors = async (req, res, next) => {
    try {
        const { data: doctors, error } = await supabase
            .from('doctors')
            .select('id, name, email, specialization, phone, department_id, created_at, verified')
            .eq('verified', false)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(error.message);
        }

        res.json({
            success: true,
            count: doctors.length,
            data: doctors
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all users (doctors and patients)
 * GET /api/admin/users
 */
export const getAllUsers = async (req, res, next) => {
    try {
        // Fetch patients
        const { data: patients, error: patientsError } = await supabase
            .from('patients')
            .select('id, name, email, phone, gender, created_at, verified, user_id')
            .order('created_at', { ascending: false });

        if (patientsError) throw new Error(patientsError.message);

        // Fetch doctors
        const { data: doctors, error: doctorsError } = await supabase
            .from('doctors')
            .select('id, name, email, specialization, phone, department_id, created_at, verified, user_id')
            .order('created_at', { ascending: false });

        if (doctorsError) throw new Error(doctorsError.message);

        // Combine and format
        const allUsers = [
            ...patients.map(p => ({ ...p, role: 'patient' })),
            ...doctors.map(d => ({ ...d, role: 'doctor' }))
        ];

        res.json({
            success: true,
            count: allUsers.length,
            data: allUsers
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get specific doctor details
 * GET /api/admin/doctors/:id
 */
export const getDoctorDetails = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: doctor, error } = await supabase
            .from('doctors')
            .select('*, departments(name)')
            .eq('id', id)
            .single();

        if (error || !doctor) {
            throw new NotFoundError('Doctor not found');
        }

        res.json({
            success: true,
            data: doctor
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Approve a doctor account
 * POST /api/admin/approve/:id
 */
export const approveDoctor = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Verify doctor exists first
        const { data: doctor, error: fetchError } = await supabase
            .from('doctors')
            .select('id, name, email')
            .eq('id', id)
            .single();

        if (fetchError || !doctor) {
            throw new NotFoundError('Doctor not found');
        }

        // Update verified status
        const { error: updateError } = await supabase
            .from('doctors')
            .update({ verified: true })
            .eq('id', id);

        if (updateError) {
            throw new Error(updateError.message);
        }

        res.json({
            success: true,
            message: `Doctor ${doctor.name} has been approved`
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Ban a user account
 * POST /api/admin/ban/:id
 */
export const banUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body; // Expecting role to know which table to query? Or we search both?

        // Ideally, ID should be unique across tables IF they were using same UUIDs as auth.users, 
        // but patients and doctors have their own IDs, and also a user_id foreign key.
        // The prompt says "ban whichever account he wants". 
        // The :id parameter here could be the PATIENT_ID or DOCTOR_ID, or USER_ID.
        // Given the lists return patient/doctor IDs, let's assume it's the profile ID.

        if (!role || !['doctor', 'patient'].includes(role)) {
            throw new ValidationError('Role (doctor/patient) is required in body to identify user type');
        }

        const table = role === 'doctors' || role === 'doctor' ? 'doctors' : 'patients';

        // Verify user exists
        const { data: user, error: fetchError } = await supabase
            .from(table)
            .select('id, name, user_id')
            .eq('id', id)
            .single();

        if (fetchError || !user) {
            throw new NotFoundError(`${role} not found`);
        }

        // Update verified status to false (BAN)
        const { error: updateError } = await supabase
            .from(table)
            .update({ verified: false })
            .eq('id', id);

        if (updateError) {
            throw new Error(updateError.message);
        }

        // Optional: Also deactivate the auth user in 'users' table or Supabase auth?
        // The requirement says "admin basically changes the verification = 'false'".
        // So setting verified = false is sufficient to block login as per our new auth logic.

        res.json({
            success: true,
            message: `User ${user.name} has been banned (verification revoked)`
        });
    } catch (error) {
        next(error);
    }
};
