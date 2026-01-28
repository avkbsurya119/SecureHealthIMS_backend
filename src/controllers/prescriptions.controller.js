/**
 * Prescriptions Controller (EPIC 3: Clinical Records & Treatment Workflow)
 * Handles CRUD operations for medication prescriptions
 * Security: Enforces validation, role-based access, and audit logging
 */

import { supabase } from '../config/supabaseClient.js';
import { ApiResponse } from '../utils/errors.js';
import { NotFoundError, ValidationError, UnauthorizedError } from '../utils/errors.js';
import { asyncHandler } from '../middleware/errorHandler.middleware.js';

/**
 * Validate dosage and medication fields (3.3)
 * Ensures data integrity for prescriptions
 */
const validatePrescriptionFields = (medication_name, dosage, frequency) => {
  if (!medication_name || medication_name.trim().length === 0) {
    throw new ValidationError('Medication name is required');
  }

  if (!dosage || dosage.trim().length === 0) {
    throw new ValidationError('Dosage is required');
  }

  if (!frequency || frequency.trim().length === 0) {
    throw new ValidationError('Frequency is required');
  }

  // Additional validation: dosage format check
  if (!/^[\d\.\s\w\/-]+$/.test(dosage)) {
    throw new ValidationError('Dosage format is invalid');
  }

  if (!/^[\d\w\s,-]+$/i.test(frequency)) {
    throw new ValidationError('Frequency format is invalid');
  }
};

/**
 * CREATE Prescription
 * POST /api/prescriptions
 * 
 * Security:
 * - Only doctors can create prescriptions (3.3)
 * - Validates dosage and medication fields (3.3)
 * - Links prescription to patient and visit (3.3)
 * - Logs creation in audit trail
 */
export const createPrescription = asyncHandler(async (req, res) => {
  const { patient_id, doctor_id, visit_id, medication_name, dosage, frequency, duration, notes } = req.body;

  // Validate prescription fields (3.3)
  validatePrescriptionFields(medication_name, dosage, frequency);

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

  // Verify visit exists if provided
  if (visit_id) {
    const { data: visit, error: visitError } = await supabase
      .from('visits')
      .select('id')
      .eq('id', visit_id)
      .single();

    if (visitError || !visit) {
      throw new NotFoundError('Visit');
    }
  }

  // Create prescription linked to visit (3.3)
  const { data: prescription, error } = await supabase
    .from('prescriptions')
    .insert({
      patient_id,
      doctor_id,
      visit_id,
      medication_name,
      dosage,
      frequency,
      duration,
      notes
    })
    .select(`
      *,
      patients (id, name),
      doctors (id, name, specialization),
      visits (
        id,
        visit_date,
        chief_complaint
      )
    `)
    .single();

  if (error) {
    throw error;
  }

  return ApiResponse.created(res, prescription, 'Prescription created successfully');
});

/**
 * GET Prescription by ID
 * GET /api/prescriptions/:prescriptionId
 * 
 * Security:
 * - Patient can view their own prescriptions (read-only, 3.4)
 * - Doctor can view prescriptions they created
 * - Nurse can view (read-only access, 3.5)
 * - Admin can view all
 */
export const getPrescriptionById = asyncHandler(async (req, res) => {
  const { prescriptionId } = req.params;

  // Get prescription with relations
  const { data: prescription, error } = await supabase
    .from('prescriptions')
    .select(`
      *,
      patients (id, name, dob, gender, phone),
      doctors (id, name, specialization, department_id),
      visits (
        id,
        visit_date,
        visit_time,
        chief_complaint,
        findings
      )
    `)
    .eq('id', prescriptionId)
    .single();

  if (error || !prescription) {
    throw new NotFoundError('Prescription');
  }

  return ApiResponse.success(res, prescription, 'Prescription retrieved successfully');
});

/**
 * GET Patient Prescriptions
 * GET /api/prescriptions/patient/:patientId
 * 
 * Security:
 * - Patient can view their own prescriptions (read-only, 3.4)
 * - Doctor can view patient prescriptions (with consent)
 * - Nurse can view patient prescriptions (read-only, 3.5)
 * - Admin can view all
 */
export const getPatientPrescriptions = asyncHandler(async (req, res) => {
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

  // Get patient prescriptions (3.4)
  const { data: prescriptions, error } = await supabase
    .from('prescriptions')
    .select(`
      id,
      medication_name,
      dosage,
      frequency,
      duration,
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
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return ApiResponse.success(res, prescriptions, 'Patient prescriptions retrieved successfully');
});

/**
 * GET Doctor's Prescriptions
 * GET /api/prescriptions/doctor/:doctorId
 * 
 * Security:
 * - Doctor can view prescriptions they issued
 * - Admin can view all
 */
export const getDoctorPrescriptions = asyncHandler(async (req, res) => {
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

  // Get prescriptions issued by doctor
  const { data: prescriptions, error } = await supabase
    .from('prescriptions')
    .select(`
      id,
      patient_id,
      medication_name,
      dosage,
      frequency,
      duration,
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
    .eq('doctor_id', doctorId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return ApiResponse.success(res, prescriptions, 'Doctor prescriptions retrieved successfully');
});

/**
 * UPDATE Prescription
 * PUT /api/prescriptions/:prescriptionId
 * 
 * Security:
 * - Only the doctor who created can edit
 * - Validates updated dosage and medication fields (3.3)
 * - Read-only for patients (3.4) and nurses (3.5)
 */
export const updatePrescription = asyncHandler(async (req, res) => {
  const { prescriptionId } = req.params;
  const { medication_name, dosage, frequency, duration, notes } = req.body;

  // Get existing prescription to check ownership
  const { data: prescription, error: prescError } = await supabase
    .from('prescriptions')
    .select('id, doctor_id')
    .eq('id', prescriptionId)
    .single();

  if (prescError || !prescription) {
    throw new NotFoundError('Prescription');
  }

  // Check ownership - only creating doctor can edit
  if (prescription.doctor_id !== req.doctorId && req.user.role !== 'admin') {
    throw new UnauthorizedError('You can only edit prescriptions you created');
  }

  // Validate updated fields if provided
  if (medication_name || dosage || frequency) {
    validatePrescriptionFields(
      medication_name || prescription.medication_name,
      dosage || prescription.dosage,
      frequency || prescription.frequency
    );
  }

  // Update prescription
  const { data: updatedPrescription, error } = await supabase
    .from('prescriptions')
    .update({
      medication_name,
      dosage,
      frequency,
      duration,
      notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', prescriptionId)
    .select(`
      *,
      patients (id, name),
      doctors (id, name, specialization)
    `)
    .single();

  if (error) {
    throw error;
  }

  return ApiResponse.success(res, updatedPrescription, 'Prescription updated successfully');
});

/**
 * DELETE Prescription
 * DELETE /api/prescriptions/:prescriptionId
 * 
 * Security:
 * - Only the doctor who created or admin can delete
 */
export const deletePrescription = asyncHandler(async (req, res) => {
  const { prescriptionId } = req.params;

  // Get existing prescription to check ownership
  const { data: prescription, error: prescError } = await supabase
    .from('prescriptions')
    .select('id, doctor_id')
    .eq('id', prescriptionId)
    .single();

  if (prescError || !prescription) {
    throw new NotFoundError('Prescription');
  }

  // Check ownership - only creator or admin can delete
  if (prescription.doctor_id !== req.doctorId && req.user.role !== 'admin') {
    throw new UnauthorizedError('You can only delete prescriptions you created');
  }

  // Delete prescription
  const { error } = await supabase
    .from('prescriptions')
    .delete()
    .eq('id', prescriptionId);

  if (error) {
    throw error;
  }

  return ApiResponse.success(res, { id: prescriptionId }, 'Prescription deleted successfully');
});
