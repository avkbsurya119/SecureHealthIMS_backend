
import { supabase } from '../config/supabaseClient.js';
import { ApiResponse } from '../utils/errors.js';
import { asyncHandler } from '../middleware/errorHandler.middleware.js';

/**
 * GET /api/doctors/specializations
 * Get list of all unique specializations
 */
export const getSpecializations = asyncHandler(async (req, res) => {
    // Fetch distinct specializations from users table where role is doctor
    // distinct() is not directly supported in simple select string in supabase-js v2 the same way as SQL
    // But we can do .select('specialization') and process in JS or use .rpc if needed.
    // Actually, standard way:
    const { data, error } = await supabase
        .from('users')
        .select('specialization')
        .eq('role', 'doctor')
        .eq('approval_status', 'approved')
        .not('specialization', 'is', null);

    if (error) throw error;

    // Extract unique values
    const specializations = [...new Set(data.map(item => item.specialization))].sort();

    return ApiResponse.success(res, specializations);
});

/**
 * GET /api/doctors
 * Get list of approved doctors, optionally filtered by specialization
 * Query params: specialization (optional)
 */
export const getDoctors = asyncHandler(async (req, res) => {
    const { specialization } = req.query;

    let query = supabase
        .from('users')
        .select('id, full_name, email, phone, specialization, department, hospital_affiliation, experience_years')
        .eq('role', 'doctor')
        .eq('approval_status', 'approved');

    if (specialization) {
        query = query.eq('specialization', specialization);
    }

    const { data: doctors, error } = await query;

    if (error) throw error;

    // Map to frontend friendly format if needed, mainly name
    const formattedDoctors = doctors.map(doc => ({
        ...doc,
        name: doc.full_name // Frontend often expects 'name'
    }));

    return ApiResponse.success(res, formattedDoctors);
});
