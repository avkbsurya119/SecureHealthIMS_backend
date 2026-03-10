import { supabase } from '../config/supabaseClient.js';
import { ApiResponse } from '../utils/errors.js';
import { NotFoundError, UnauthorizedError, ValidationError } from '../utils/errors.js';
import { asyncHandler } from '../middleware/errorHandler.middleware.js';

/**
 * GET My Prescriptions
 * GET /api/prescriptions/me
 * 
 * Security:
 * - Patients can only see their own prescriptions (enforced by req.user.id)
 */
export const getMyPrescriptions = asyncHandler(async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;

  let query = supabase
    .from('prescriptions')
    .select(`
      *,
      visits (visit_date)
    `)
    .eq('patient_id', req.user.id)
    .order('created_at', { ascending: false });

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data: prescriptionsRaw, error } = await query;

  if (error) {
    throw error;
  }

  // Manual Join for Doctor Details
  const doctorIds = new Set();
  prescriptionsRaw.forEach(p => {
    if (p.doctor_id) doctorIds.add(p.doctor_id);
  });

  let usersMap = {};
  if (doctorIds.size > 0) {
    const { data: doctors } = await supabase.from('users').select('id, name, specialization').in('id', Array.from(doctorIds));
    if (doctors) {
      doctors.forEach(d => usersMap[d.id] = d);
    }
  }

  const prescriptions = prescriptionsRaw.map(p => ({
    ...p,
    users: usersMap[p.doctor_id] || { name: 'Unknown', specialization: '' } // Mocking 'users' object for doctor details
  }));

  return ApiResponse.success(res, {
    prescriptions: prescriptions || [],
    count: prescriptions?.length || 0
  });
});

/**
 * GET Prescriptions for a specific patient
 * GET /api/prescriptions/patient/:patientId
 * 
 * Security:
 * - Doctors and Nurses can view
 */
export const getPrescriptionsByPatient = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  const { data: prescriptionsRaw, error } = await supabase
    .from('prescriptions')
    .select(`
      *,
      visits (visit_date)
    `)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  // Manual Join for Doctor Details
  const doctorIds = new Set();
  prescriptionsRaw.forEach(p => {
    if (p.doctor_id) doctorIds.add(p.doctor_id);
  });

  let usersMap = {};
  if (doctorIds.size > 0) {
    const { data: doctors } = await supabase.from('users').select('id, full_name, name, specialization').in('id', Array.from(doctorIds));
    if (doctors) {
      doctors.forEach(d => usersMap[d.id] = {
        name: d.full_name || d.name || 'Unknown',
        specialization: d.specialization || ''
      });
    }
  }

  const prescriptions = prescriptionsRaw.map(p => ({
    ...p,
    users: usersMap[p.doctor_id] || { name: 'Unknown', specialization: '' }
  }));

  return ApiResponse.success(res, prescriptions);
});

/**
 * GET Single Prescription
 * GET /api/prescriptions/:prescriptionId
 * 
 * Security:
 * - Patients can only see their own prescriptions
 */
export const getPrescriptionById = asyncHandler(async (req, res) => {
  const { prescriptionId } = req.params;

  const { data: prescription, error } = await supabase
    .from('prescriptions')
    .select(`
      *,
      visits (visit_date, findings)
    `)
    .eq('id', prescriptionId)
    .single();

  if (error || !prescription) {
    throw new NotFoundError('Prescription');
  }

  // Security Check: Ensure belongs to user (Patient) or Creator (Doctor)
  if (req.user.role === 'patient' && prescription.patient_id !== req.user.id) {
    throw new UnauthorizedError('You are not authorized to view this prescription');
  }

  if (req.user.role === 'doctor' && prescription.doctor_id !== req.user.id) {
    throw new UnauthorizedError('You are not authorized to view this prescription');
  }

  return ApiResponse.success(res, prescription);
});

/**
 * CREATE Prescription
 * POST /api/prescriptions
 * 
 * Security:
 * - Doctors only
 */
export const createPrescription = asyncHandler(async (req, res) => {
  const { patient_id, medication_name, dosage, frequency, duration, instructions, notes, visit_id } = req.body;

  if (!patient_id || !medication_name || !dosage) {
    throw new ValidationError('Patient ID, Medication Name, and Dosage are required');
  }

  // Basic dosage format validation (optional, can be strict regex if needed)
  if (typeof dosage !== 'string' || dosage.trim().length === 0) {
    throw new ValidationError('Dosage must be a valid string');
  }

  const prescriptionData = {
    patient_id,
    doctor_id: req.user.id,
    medication_name,
    dosage,
    frequency,
    duration,
    instructions,
    notes,
    visit_id // Optional link to a visit
  };

  const { data: newPrescription, error } = await supabase
    .from('prescriptions')
    .insert(prescriptionData)
    .select()
    .single();

  if (error) {
    console.error('CRITICAL: Error creating prescription record:');
    console.error('Prescription Data attempted:', JSON.stringify(prescriptionData, null, 2));
    console.error('Supabase Error:', error);
    throw error;
  }

  return ApiResponse.created(res, newPrescription);
});

/**
 * UPDATE Prescription
 * PUT /api/prescriptions/:prescriptionId
 * 
 * Security:
 * - Doctors can only update their OWN prescriptions
 */
export const updatePrescription = asyncHandler(async (req, res) => {
  const { prescriptionId } = req.params;
  const updates = req.body;

  // 1. Check ownership
  const { data: existing, error: fetchError } = await supabase
    .from('prescriptions')
    .select('doctor_id')
    .eq('id', prescriptionId)
    .single();

  if (fetchError || !existing) {
    throw new NotFoundError('Prescription');
  }

  if (existing.doctor_id !== req.user.id) {
    throw new UnauthorizedError('You are not authorized to update this prescription');
  }

  // 2. Filter updates
  delete updates.id;
  delete updates.doctor_id;
  delete updates.patient_id;

  // 3. Update
  const { data: updated, error: updateError } = await supabase
    .from('prescriptions')
    .update(updates)
    .eq('id', prescriptionId)
    .select()
    .single();

  if (updateError) {
    throw updateError;
  }

  return ApiResponse.success(res, updated);
});

/**
 * GET Doctor Prescriptions
 * GET /api/prescriptions/doctor/me
 */
export const getDoctorPrescriptions = asyncHandler(async (req, res) => {
  const { data: prescriptionsRaw, error } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('doctor_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  // Manual Join for Patient Details
  const patientIds = new Set();
  prescriptionsRaw.forEach(p => {
    if (p.patient_id) patientIds.add(p.patient_id);
  });

  let usersMap = {};
  if (patientIds.size > 0) {
    const { data: patients } = await supabase.from('users').select('id, full_name, email').in('id', Array.from(patientIds));
    if (patients) {
      patients.forEach(p => usersMap[p.id] = p);
    }
  }

  const prescriptions = prescriptionsRaw.map(p => ({
    ...p,
    users: usersMap[p.patient_id] || { full_name: 'Unknown', email: '' } // Mocking 'users' object
  }));

  return ApiResponse.success(res, prescriptions);
});
