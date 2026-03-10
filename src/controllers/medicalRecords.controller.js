/**
 * Medical Records Controller
 * Handles CRUD operations for medical records
 * Security: Enforces role, ownership, and consent checks
 */

import { supabase } from '../config/supabaseClient.js';
import { ApiResponse, NotFoundError } from '../utils/errors.js';
import { asyncHandler } from '../middleware/errorHandler.middleware.js';
import { AuditService } from '../services/audit.service.js';

/**
 * CREATE Medical Record
 * POST /api/medical-records
 * 
 * Security:
 * - Requires doctor role
 * - Automatically sets created_by and updated_by
 * - Logs creation in audit trail
 */
export const createMedicalRecord = asyncHandler(async (req, res) => {
  const { patient_id, diagnosis, prescription, notes } = req.body;

  // Verify patient exists
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id')
    .eq('id', patient_id)
    .single();

  if (patientError || !patient) {
    throw new NotFoundError('Patient');
  }

  // Create medical record
  const { data: record, error } = await supabase
    .from('medical_records')
    .insert({
      patient_id,
      doctor_id: req.doctorId, // Set from requireDoctor middleware
      diagnosis,
      prescription,
      notes,
      created_by: req.user.id,
      updated_by: req.user.id
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return ApiResponse.created(res, record, 'Medical record created successfully');
});

/**
 * GET Medical Records for a Patient
 * GET /api/medical-records/patient/:patientId
 * 
 * Security:
 * - Patient can access own records
 * - Doctor/Nurse require consent
 * - Admin can access all
 */
export const getPatientMedicalRecords = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  // Verify patient exists
  const { data: patient, error: patientError } = await supabase
    .from('patients') // Or users if role is patient
    .select('id, name')
    .eq('id', patientId)
    .single();

  if (patientError || !patient) {
    throw new NotFoundError('Patient');
  }

  // Get medical records
  const { data: recordsRaw, error } = await supabase
    .from('medical_records')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  // Manual Join: Fetch doctors
  const doctorIds = [...new Set((recordsRaw || []).map(r => r.doctor_id))];
  let doctorsMap = {};
  if (doctorIds.length > 0) {
    const { data: doctors } = await supabase.from('users').select('id, name, full_name, specialization').in('id', doctorIds);
    doctors?.forEach(d => doctorsMap[d.id] = {
      id: d.id,
      name: d.full_name || d.name,
      specialization: d.specialization
    });
  }

  const records = (recordsRaw || []).map(r => ({
    ...r,
    doctors: doctorsMap[r.doctor_id] || { name: 'Unknown' }
  }));

  // Audit Log: Record that a doctor or nurse viewed this patient's medical records list
  if (req.user && req.user.role !== 'patient') {
    await AuditService.logRead(
      req.user.id,
      patientId,
      'medical_records_list',
      patientId,
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        details: { role: req.user.role, action: 'viewed_medical_records_list' }
      }
    );
  }

  return ApiResponse.success(res, {
    patient: {
      id: patient.id,
      name: patient.name
    },
    records: records || [],
    total: records?.length || 0,
    consent_status: {
      checked: req.consentChecked,
      granted: req.consentGranted,
      reason: req.consentReason
    }
  });
});

/**
 * GET Single Medical Record
 * GET /api/medical-records/:recordId
 * 
 * Security:
 * - Requires consent check
 * - Enforces ownership rules
 */
export const getMedicalRecord = asyncHandler(async (req, res) => {
  const { recordId } = req.params;

  const { data: recordRaw, error } = await supabase
    .from('medical_records')
    .select('*')
    .eq('id', recordId)
    .single();

  if (error || !recordRaw) {
    throw new NotFoundError('Medical record');
  }

  // Manual Join: Fetch doctor and patient
  const { data: users } = await supabase
    .from('users')
    .select('id, name, full_name, specialization')
    .in('id', [recordRaw.doctor_id, recordRaw.patient_id]);

  const uMap = {};
  users?.forEach(u => uMap[u.id] = u);

  const record = {
    ...recordRaw,
    doctors: {
      id: recordRaw.doctor_id,
      name: uMap[recordRaw.doctor_id]?.full_name || uMap[recordRaw.doctor_id]?.name || 'Doctor',
      specialization: uMap[recordRaw.doctor_id]?.specialization
    },
    patients: {
      id: recordRaw.patient_id,
      name: uMap[recordRaw.patient_id]?.full_name || uMap[recordRaw.patient_id]?.name || 'Patient'
    }
  };

  // Audit Log: Record that a doctor or nurse viewed this specific medical record
  if (req.user && req.user.role !== 'patient') {
    await AuditService.logRead(
      req.user.id,
      record.patient_id,
      'medical_record_detail',
      record.id,
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        details: { role: req.user.role, action: 'viewed_medical_record' }
      }
    );
  }

  return ApiResponse.success(res, record);
});

/**
 * UPDATE Medical Record
 * PUT /api/medical-records/:recordId
 * 
 * Security:
 * - Only doctor who created can update
 * - Enforced by requireRecordOwnership middleware
 */
export const updateMedicalRecord = asyncHandler(async (req, res) => {
  const { recordId } = req.params;
  const { diagnosis, prescription, notes } = req.body;

  // Build update object (only include provided fields)
  const updates = {
    updated_by: req.user.id,
    updated_at: new Date().toISOString()
  };

  if (diagnosis !== undefined) updates.diagnosis = diagnosis;
  if (prescription !== undefined) updates.prescription = prescription;
  if (notes !== undefined) updates.notes = notes;

  // Update record
  const { data: record, error } = await supabase
    .from('medical_records')
    .update(updates)
    .eq('id', recordId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return ApiResponse.success(res, record, 'Medical record updated successfully');
});

/**
 * GET My Medical Records (Patient View)
 * GET /api/medical-records/me
 * 
 * Security:
 * - Patient can only see their own records
 */
export const getMyMedicalRecords = asyncHandler(async (req, res) => {
  // patientId is set by requirePatientOrAdmin middleware
  const patientId = req.patientId;

  const { data: recordsRaw, error } = await supabase
    .from('medical_records')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  // Manual Join: Fetch doctors
  const doctorIds = [...new Set((recordsRaw || []).map(r => r.doctor_id))];
  let doctorsMap = {};
  if (doctorIds.length > 0) {
    const { data: doctors } = await supabase.from('users').select('id, name, full_name, specialization').in('id', doctorIds);
    doctors?.forEach(d => doctorsMap[d.id] = {
      id: d.id,
      name: d.full_name || d.name,
      specialization: d.specialization
    });
  }

  const records = (recordsRaw || []).map(r => ({
    ...r,
    doctors: doctorsMap[r.doctor_id] || { name: 'Unknown' }
  }));

  return ApiResponse.success(res, {
    records: records || [],
    total: records?.length || 0
  });
});
