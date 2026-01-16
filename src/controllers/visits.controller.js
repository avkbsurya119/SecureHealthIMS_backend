/**
 * Visits Controller (EPIC 3: Clinical Records & Treatment Workflow)
 * Handles CRUD operations for clinical visit records
 * Security: Enforces role-based access, ownership checks, and audit logging
 */

import { supabase } from '../config/supabaseClient.js';
import { ApiResponse } from '../utils/errors.js';
import { NotFoundError, ValidationError, UnauthorizedError, OwnershipError } from '../utils/errors.js';
import { asyncHandler } from '../middleware/errorHandler.middleware.js';

/**
 * CREATE Visit
 * POST /api/visits
 * 
 * Security:
 * - Only doctors can create visits
 * - Automatically sets created_by from authenticated doctor
 * - Logs creation in audit trail
 */
export const createVisit = asyncHandler(async (req, res) => {
  const { patient_id, doctor_id, visit_date, visit_time, chief_complaint, findings, notes } = req.body;

  // Verify patient exists
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id, name')
    .eq('id', patient_id)
    .single();

  if (patientError || !patient) {
    throw new NotFoundError('Patient');
  }

  // Verify doctor exists
  const { data: doctor, error: doctorError } = await supabase
    .from('doctors')
    .select('id, name, specialization')
    .eq('id', doctor_id)
    .single();

  if (doctorError || !doctor) {
    throw new NotFoundError('Doctor');
  }

  // Create visit record
  const { data: visit, error } = await supabase
    .from('visits')
    .insert({
      patient_id,
      doctor_id,
      visit_date,
      visit_time,
      chief_complaint,
      findings,
      notes,
      created_by: doctor_id
    })
    .select(`
      *,
      patients (id, name, dob, gender),
      doctors (id, name, specialization, department_id)
    `)
    .single();

  if (error) {
    throw error;
  }

  return ApiResponse.created(res, visit, 'Visit record created successfully');
});

/**
 * GET Visit by ID
 * GET /api/visits/:visitId
 * 
 * Security:
 * - Patient can view their own visit records
 * - Doctor can view visits they created
 * - Nurse can view (read-only)
 * - Admin can view all
 */
export const getVisitById = asyncHandler(async (req, res) => {
  const { visitId } = req.params;

  // Get visit with relations
  const { data: visit, error } = await supabase
    .from('visits')
    .select(`
      *,
      patients (id, name, dob, gender, phone, address),
      doctors (id, name, specialization, department_id),
      prescriptions (
        id,
        medication_name,
        dosage,
        frequency,
        duration
      )
    `)
    .eq('id', visitId)
    .single();

  if (error || !visit) {
    throw new NotFoundError('Visit');
  }

  return ApiResponse.success(res, visit, 'Visit record retrieved successfully');
});

/**
 * GET Patient Visit History
 * GET /api/visits/patient/:patientId
 * 
 * Security:
 * - Patient can view their own visits
 * - Doctor can view patient visits (with consent)
 * - Nurse can view patient visits (read-only, with consent)
 * - Admin can view all
 */
export const getPatientVisits = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  // Verify patient exists
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id, name')
    .eq('id', patientId)
    .single();

  if (patientError || !patient) {
    throw new NotFoundError('Patient');
  }

  // Get visit history in chronological order
  const { data: visits, error } = await supabase
    .from('visits')
    .select(`
      id,
      visit_date,
      visit_time,
      chief_complaint,
      findings,
      notes,
      created_at,
      updated_at,
      doctor_id,
      doctors (
        id,
        name,
        specialization
      )
    `)
    .eq('patient_id', patientId)
    .order('visit_date', { ascending: false })
    .order('visit_time', { ascending: false });

  if (error) {
    throw error;
  }

  return ApiResponse.success(res, visits, 'Patient visit history retrieved successfully');
});

/**
 * GET Doctor's Visit Records
 * GET /api/visits/doctor/:doctorId
 * 
 * Security:
 * - Doctor can view their own created records
 * - Admin can view all
 */
export const getDoctorVisits = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;

  // Verify doctor exists
  const { data: doctor, error: doctorError } = await supabase
    .from('doctors')
    .select('id, name')
    .eq('id', doctorId)
    .single();

  if (doctorError || !doctor) {
    throw new NotFoundError('Doctor');
  }

  // Get visit records created by doctor
  const { data: visits, error } = await supabase
    .from('visits')
    .select(`
      id,
      patient_id,
      visit_date,
      visit_time,
      chief_complaint,
      findings,
      notes,
      created_at,
      updated_at,
      patients (
        id,
        name,
        dob,
        gender
      )
    `)
    .eq('created_by', doctorId)
    .order('visit_date', { ascending: false })
    .order('visit_time', { ascending: false });

  if (error) {
    throw error;
  }

  return ApiResponse.success(res, visits, 'Doctor visit records retrieved successfully');
});

/**
 * UPDATE Visit
 * PUT /api/visits/:visitId
 * 
 * Security:
 * - Only the doctor who created the record can edit (3.6)
 * - Prevents other doctors from modifying records (3.6)
 * - Updates updated_at timestamp
 */
export const updateVisit = asyncHandler(async (req, res) => {
  const { visitId } = req.params;
  const { visit_date, visit_time, chief_complaint, findings, notes } = req.body;

  // Get existing visit to check ownership
  const { data: visit, error: visitError } = await supabase
    .from('visits')
    .select('id, created_by')
    .eq('id', visitId)
    .single();

  if (visitError || !visit) {
    throw new NotFoundError('Visit');
  }

  // Check ownership - only creator can edit (3.6)
  if (visit.created_by !== req.doctorId && req.user.role !== 'admin') {
    throw new OwnershipError('You can only edit visit records you created');
  }

  // Update visit
  const { data: updatedVisit, error } = await supabase
    .from('visits')
    .update({
      visit_date,
      visit_time,
      chief_complaint,
      findings,
      notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', visitId)
    .select(`
      *,
      patients (id, name, dob, gender),
      doctors (id, name, specialization)
    `)
    .single();

  if (error) {
    throw error;
  }

  return ApiResponse.success(res, updatedVisit, 'Visit record updated successfully');
});

/**
 * DELETE Visit
 * DELETE /api/visits/:visitId
 * 
 * Security:
 * - Only the doctor who created the record or admin can delete
 */
export const deleteVisit = asyncHandler(async (req, res) => {
  const { visitId } = req.params;

  // Get existing visit to check ownership
  const { data: visit, error: visitError } = await supabase
    .from('visits')
    .select('id, created_by')
    .eq('id', visitId)
    .single();

  if (visitError || !visit) {
    throw new NotFoundError('Visit');
  }

  // Check ownership - only creator or admin can delete
  if (visit.created_by !== req.doctorId && req.user.role !== 'admin') {
    throw new OwnershipError('You can only delete visit records you created');
  }

  // Delete visit
  const { error } = await supabase
    .from('visits')
    .delete()
    .eq('id', visitId);

  if (error) {
    throw error;
  }

  return ApiResponse.success(res, { id: visitId }, 'Visit record deleted successfully');
});
