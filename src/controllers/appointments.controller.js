/**
 * Appointments Controller
 * Handles appointment scheduling and management
 * Security: Enforces role-based access and status transitions
 */

import { supabase } from '../config/supabaseClient.js';
import { ApiResponse } from '../utils/errors.js';
import { NotFoundError, ValidationError, UnauthorizedError } from '../utils/errors.js';
import { asyncHandler } from '../middleware/errorHandler.middleware.js';

/**
 * Valid status transitions
 * Security: Prevents invalid state changes
 */
const VALID_TRANSITIONS = {
  'scheduled': ['completed', 'cancelled'],
  'completed': [], // Cannot change completed status
  'cancelled': [] // Cannot change cancelled status
};

/**
 * CREATE Appointment
 * POST /api/appointments
 * 
 * Security:
 * - Requires doctor, nurse, or admin role
 * - Automatically sets created_by
 */
export const createAppointment = asyncHandler(async (req, res) => {
  const { patient_id, doctor_id, appointment_date, appointment_time } = req.body;

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
    .select('id, name')
    .eq('id', doctor_id)
    .single();

  if (doctorError || !doctor) {
    throw new NotFoundError('Doctor');
  }

  // Create appointment
  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      patient_id,
      doctor_id,
      appointment_date,
      appointment_time,
      status: 'scheduled',
      created_by: req.user.id,
      updated_by: req.user.id
    })
    .select(`
      *,
      patients (id, name),
      doctors (id, name, specialization)
    `)
    .single();

  if (error) {
    // Handle unique constraint violation (double booking)
    if (error.code === '23505') {
      throw new ValidationError(
        'This time slot is already booked for the selected doctor'
      );
    }
    throw error;
  }

  return ApiResponse.created(res, appointment, 'Appointment created successfully');
});

/**
 * GET My Appointments
 * GET /api/appointments/me
 * 
 * Security:
 * - Patient sees their own appointments
 * - Doctor sees appointments assigned to them
 */
export const getMyAppointments = asyncHandler(async (req, res) => {
  const { status, from_date, to_date } = req.query;

  let query = supabase
    .from('appointments')
    .select(`
      *,
      patients (id, name),
      doctors (id, name, specialization)
    `)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true });

  // Filter by user role
  if (req.user.role === 'patient') {
    // Get patient's own appointments
    const { data: patient } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!patient) {
      throw new UnauthorizedError('No patient record linked to this account');
    }

    query = query.eq('patient_id', patient.id);
  } else if (req.user.role === 'doctor') {
    // Get doctor's appointments
    const { data: doctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!doctor) {
      throw new UnauthorizedError('No doctor record linked to this account');
    }

    query = query.eq('doctor_id', doctor.id);
  }
  // Admin sees all appointments (no additional filter)

  // Optional filters
  if (status) {
    query = query.eq('status', status);
  }

  if (from_date) {
    query = query.gte('appointment_date', from_date);
  }

  if (to_date) {
    query = query.lte('appointment_date', to_date);
  }

  const { data: appointments, error } = await query;

  if (error) {
    throw error;
  }

  return ApiResponse.success(res, {
    appointments: appointments || [],
    total: appointments?.length || 0
  });
});

/**
 * GET Single Appointment
 * GET /api/appointments/:appointmentId
 * 
 * Security:
 * - Enforced by requireAppointmentAccess middleware
 */
export const getAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;

  const { data: appointment, error } = await supabase
    .from('appointments')
    .select(`
      *,
      patients (id, name, dob, phone),
      doctors (id, name, specialization)
    `)
    .eq('id', appointmentId)
    .single();

  if (error || !appointment) {
    throw new NotFoundError('Appointment');
  }

  return ApiResponse.success(res, appointment);
});

/**
 * UPDATE Appointment Status
 * PATCH /api/appointments/:appointmentId/status
 * 
 * Security:
 * - Validates status transitions
 * - Requires cancellation reason for cancelled status
 */
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { status, cancellation_reason } = req.body;

  // Get current appointment
  const appointment = req.appointment; // Set by requireAppointmentAccess middleware
  const currentStatus = appointment.status;

  // Validate status transition
  if (!VALID_TRANSITIONS[currentStatus]?.includes(status)) {
    throw new ValidationError(
      `Cannot change status from '${currentStatus}' to '${status}'. ` +
      `Valid transitions: ${VALID_TRANSITIONS[currentStatus]?.join(', ') || 'none'}`
    );
  }

  // Build update object
  const updates = {
    status,
    updated_by: req.user.id,
    updated_at: new Date().toISOString()
  };

  // Handle cancellation
  if (status === 'cancelled') {
    if (!cancellation_reason) {
      throw new ValidationError('Cancellation reason is required when cancelling an appointment');
    }

    updates.cancelled_at = new Date().toISOString();
    updates.cancelled_by = req.user.id;
    updates.cancellation_reason = cancellation_reason;
  }

  // Update appointment
  const { data: updatedAppointment, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', appointmentId)
    .select(`
      *,
      patients (id, name),
      doctors (id, name, specialization)
    `)
    .single();

  if (error) {
    throw error;
  }

  return ApiResponse.success(
    res,
    updatedAppointment,
    `Appointment ${status} successfully`
  );
});

/**
 * GET Appointments for a Patient
 * GET /api/appointments/patient/:patientId
 * 
 * Security:
 * - Admin can view all
 * - Doctor/Nurse can view with proper access
 */
export const getPatientAppointments = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { status } = req.query;

  // Verify patient exists
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id, name')
    .eq('id', patientId)
    .single();

  if (patientError || !patient) {
    throw new NotFoundError('Patient');
  }

  let query = supabase
    .from('appointments')
    .select(`
      *,
      doctors (id, name, specialization)
    `)
    .eq('patient_id', patientId)
    .order('appointment_date', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data: appointments, error } = await query;

  if (error) {
    throw error;
  }

  return ApiResponse.success(res, {
    patient: {
      id: patient.id,
      name: patient.name
    },
    appointments: appointments || [],
    total: appointments?.length || 0
  });
});
