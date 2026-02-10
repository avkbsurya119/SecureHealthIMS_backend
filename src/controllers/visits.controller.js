import { supabase } from '../config/supabaseClient.js';
import { ApiResponse } from '../utils/errors.js';
import { NotFoundError, UnauthorizedError } from '../utils/errors.js';
import { asyncHandler } from '../middleware/errorHandler.middleware.js';

/**
 * GET My Visits
 * GET /api/visits/me
 * 
 * Security:
 * - Patients can only see their own visits (enforced by req.user.id)
 */
export const getMyVisits = asyncHandler(async (req, res) => {
  const { from_date, to_date, limit = 10, offset = 0 } = req.query;

  // Verify patient exists linked to user
  // (In unified schema, user IS the patient, but let's be safe)

  let query = supabase
    .from('visits')
    .select(`
      *,
      prescriptions (*)
    `)
    .eq('patient_id', req.user.id)
    .order('visit_date', { ascending: false });

  if (from_date) {
    query = query.gte('visit_date', from_date);
  }

  if (to_date) {
    query = query.lte('visit_date', to_date);
  }

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data: visitsRaw, error } = await query;

  if (error) {
    throw error;
  }

  // Manual Join for Doctor Details
  const doctorIds = new Set();
  visitsRaw.forEach(v => {
    if (v.doctor_id) doctorIds.add(v.doctor_id);
  });

  let usersMap = {};
  if (doctorIds.size > 0) {
    const { data: doctors } = await supabase.from('users').select('id, name, specialization').in('id', Array.from(doctorIds));
    if (doctors) {
      doctors.forEach(d => usersMap[d.id] = d);
    }
  }

  const visits = visitsRaw.map(v => ({
    ...v,
    doctor: usersMap[v.doctor_id] || { name: 'Unknown', specialization: '' }
  }));

  return ApiResponse.success(res, {
    visits: visits || [],
    count: visits?.length || 0
  });
});

/**
 * GET Single Visit
 * GET /api/visits/:visitId
 * 
 * Security:
 * - Patients can only see their own visits
 */
export const getVisitById = asyncHandler(async (req, res) => {
  const { visitId } = req.params;

  const { data: visit, error } = await supabase
    .from('visits')
    .select(`
      *,
      prescriptions (*)
    `)
    .eq('id', visitId)
    .single();

  if (error || !visit) {
    throw new NotFoundError('Visit');
  }

  // Security Check:
  // 1. If Patient: visit.patient_id must be me.
  // 2. If Doctor: visit.doctor_id must be me OR (maybe future: I am treating this patient).
  if (req.user.role === 'patient' && visit.patient_id !== req.user.id) {
    throw new UnauthorizedError('You are not authorized to view this visit record');
  }

  if (req.user.role === 'doctor' && visit.doctor_id !== req.user.id) {
    throw new UnauthorizedError('You are not authorized to view this visit record');
  }

  return ApiResponse.success(res, visit);
});

/**
 * CREATE Visit
 * POST /api/visits
 * 
 * Security:
 * - Doctors only
 */
export const createVisit = asyncHandler(async (req, res) => {
  const { patient_id, visit_date, diagnosis, notes, prescription_id } = req.body;

  if (!patient_id || !visit_date) {
    throw new Error('Patient ID and Visit Date are required');
  }

  const visitData = {
    patient_id,
    doctor_id: req.user.id, // Enforce doctor ownership
    visit_date,
    diagnosis,
    notes
    // prescription_id is optional link
  };

  const { data: newVisit, error } = await supabase
    .from('visits')
    .insert(visitData)
    .select()
    .single();

  if (error) {
    console.error('CRITICAL: Error creating visit record:');
    console.error('Visit Data attempted:', JSON.stringify(visitData, null, 2));
    console.error('Supabase Error:', error);
    throw error;
  }

  return ApiResponse.created(res, newVisit);
});

/**
 * UPDATE Visit
 * PUT /api/visits/:visitId
 * 
 * Security:
 * - Doctors can only update their OWN visits
 */
export const updateVisit = asyncHandler(async (req, res) => {
  const { visitId } = req.params;
  const updates = req.body;

  // 1. Fetch existing visit to check ownership
  const { data: existingVisit, error: fetchError } = await supabase
    .from('visits')
    .select('doctor_id')
    .eq('id', visitId)
    .single();

  if (fetchError || !existingVisit) {
    throw new NotFoundError('Visit');
  }

  // 2. Check ownership
  if (existingVisit.doctor_id !== req.user.id) {
    throw new UnauthorizedError('You are not authorized to update this visit record');
  }

  // 3. Remove sensitive/immutable fields from updates
  delete updates.id;
  delete updates.doctor_id; // Cannot change doctor
  delete updates.patient_id; // Usually shouldn't change patient, but maybe? Let's disallow for now safety.

  // 4. Update
  const { data: updatedVisit, error: updateError } = await supabase
    .from('visits')
    .update(updates)
    .eq('id', visitId)
    .select()
    .single();

  if (updateError) {
    throw updateError;
  }

  return ApiResponse.success(res, updatedVisit);
});

/**
 * GET Doctor Visits
 * GET /api/visits/doctor/me
 */
export const getDoctorVisits = asyncHandler(async (req, res) => {
  const { data: visitsRaw, error } = await supabase
    .from('visits')
    .select('*')
    .eq('doctor_id', req.user.id)
    .order('visit_date', { ascending: false });

  if (error) {
    throw error;
  }

  // Manual Join for Patient Details
  const patientIds = new Set();
  visitsRaw.forEach(v => {
    if (v.patient_id) patientIds.add(v.patient_id);
  });

  let usersMap = {};
  if (patientIds.size > 0) {
    const { data: patients } = await supabase.from('users').select('id, full_name, email').in('id', Array.from(patientIds));
    if (patients) {
      patients.forEach(p => usersMap[p.id] = p);
    }
  }

  const visits = visitsRaw.map(v => ({
    ...v,
    users: usersMap[v.patient_id] || { full_name: 'Unknown', email: '' } // Mocking 'users' object
  }));

  return ApiResponse.success(res, visits);
});
