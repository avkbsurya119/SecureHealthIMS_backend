/**
 * Appointments Controller
 * Handles appointment scheduling and management
 * Security: Enforces role-based access and status transitions
 */

import { supabase } from '../config/supabaseClient.js';
import { ApiResponse, NotFoundError, ValidationError } from '../utils/errors.js';
import { asyncHandler } from '../middleware/errorHandler.middleware.js';

/**
 * Valid status transitions
 * Security: Prevents invalid state changes
 */
/**
 * Valid status transitions
 * Security: Prevents invalid state changes
 */
const VALID_TRANSITIONS = {
  'Pending': ['Confirmed', 'Cancelled'],
  'Confirmed': ['Completed', 'Cancelled', 'No-Show'],
  'Completed': [], // Cannot change completed status
  'Cancelled': [], // Cannot change cancelled status
  'No-Show': [] // Cannot change no-show status
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
  const { doctor_id, date, time } = req.body;
  let { patient_id } = req.body;

  // Patient can only book for themselves
  if (req.user.role === 'patient') {
    patient_id = req.user.id;
  }

  // Ensure patient_id is provided (either from body or token)
  if (!patient_id) {
    throw new ValidationError('patient_id is required');
  }

  // Verify patient exists
  const { data: patient, error: patientError } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('id', patient_id)
    .single();

  if (patientError || !patient) {
    throw new NotFoundError('Patient');
  }

  // Verify doctor exists
  const { data: doctor, error: doctorError } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('id', doctor_id)
    .eq('role', 'doctor')
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
      date,
      time,
      status: 'Pending',
      patient_name: patient.full_name,
      doctor_name: doctor.full_name
    })
    .select('*')
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

  // Construct response matching the frontend expectation
  const enrichedAppointment = {
    ...appointment,
    users: { id: patient.id, full_name: patient.full_name, name: patient.full_name },
    doctor_details: { id: doctor.id, full_name: doctor.full_name, name: doctor.full_name }
  };

  return ApiResponse.created(res, enrichedAppointment, 'Appointment created successfully');
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
    .select('*')
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  // Filter by user role
  if (req.user.role === 'patient') {
    // Get patient's own appointments
    query = query.eq('patient_id', req.user.id);
  } else if (req.user.role === 'doctor') {
    // Get doctor's appointments
    query = query.eq('doctor_id', req.user.id);
  }
  // Admin sees all appointments (no additional filter)

  // Optional filters
  if (status) {
    query = query.eq('status', status);
  }

  if (from_date) {
    query = query.gte('date', from_date);
  }

  if (to_date) {
    query = query.lte('date', to_date);
  }

  const { data: appointmentsRaw, error } = await query;

  if (error) {
    throw error;
  }

  // Optimize: Collect IDs and fetch once to avoid N+1 problem
  const userIds = new Set();
  (appointmentsRaw || []).forEach(a => {
    if (a.patient_id) userIds.add(a.patient_id);
    if (a.doctor_id) userIds.add(a.doctor_id);
  });

  let usersMap = {};
  if (userIds.size > 0) {
    const { data: users } = await supabase.from('users').select('id, full_name, specialization').in('id', Array.from(userIds));
    if (users) {
      users.forEach(u => usersMap[u.id] = u);
    }
  }

  const finalAppointments = (appointmentsRaw || []).map(apt => {
    const patientUser = usersMap[apt.patient_id] || { full_name: 'Unknown' };
    const doctorUser = usersMap[apt.doctor_id] || { full_name: 'Unknown', specialization: '' };

    return {
      ...apt,
      users: { ...patientUser, name: patientUser.full_name },
      doctor_details: { ...doctorUser, name: doctorUser.full_name }
    };
  });

  return ApiResponse.success(res, {
    appointments: finalAppointments,
    total: finalAppointments.length
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
    .select('*')
    .eq('id', appointmentId)
    .single();

  if (error || !appointment) {
    throw new NotFoundError('Appointment');
  }

  // Manually fetch user details to avoid join issues after dropping constraints
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, specialization, dob, phone')
    .in('id', [appointment.patient_id, appointment.doctor_id]);

  const usersMap = {};
  if (users) {
    users.forEach(u => usersMap[u.id] = u);
  }

  const patient = usersMap[appointment.patient_id] || { full_name: 'Unknown' };
  const doctor = usersMap[appointment.doctor_id] || { full_name: 'Unknown', specialization: '' };

  const enrichedAppointment = {
    ...appointment,
    users: { ...patient, name: patient.full_name },
    doctor_details: { ...doctor, name: doctor.full_name }
  };

  return ApiResponse.success(res, enrichedAppointment);
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
  const { status, cancellation_reason, decline_reason } = req.body;

  // Get current appointment
  const appointment = req.appointment; // Set by requireAppointmentAccess middleware
  const currentStatus = appointment.status;

  // Role-based transition restrictions
  if (req.user.role === 'patient') {
    // Patients can only cancel their own pending appointments
    if (status !== 'Cancelled') {
      throw new ValidationError('Patients can only cancel appointments');
    }
  }

  if (req.user.role === 'doctor') {
    // Doctors can accept (Confirmed), decline (Cancelled), mark visited (Completed), or no-show
    const doctorAllowed = ['Confirmed', 'Cancelled', 'Completed', 'No-Show'];
    if (!doctorAllowed.includes(status)) {
      throw new ValidationError('Invalid status transition for doctor role');
    }
  }

  // Validate status transition
  if (!VALID_TRANSITIONS[currentStatus]?.includes(status)) {
    throw new ValidationError(
      `Cannot change status from '${currentStatus}' to '${status}'. ` +
      `Valid transitions: ${VALID_TRANSITIONS[currentStatus]?.join(', ') || 'none'}`
    );
  }

  // Build update object
  const updates = { status };

  // Handle cancellation/decline reason (store in notes column if available)
  if (status === 'Cancelled') {
    const reason = cancellation_reason || decline_reason;
    if (!reason) {
      throw new ValidationError('A reason is required when cancelling an appointment');
    }
  }

  // Update appointment
  const { data: updatedAppointment, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', appointmentId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  // Manually fetch user details to avoid join issues
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, specialization')
    .in('id', [updatedAppointment.patient_id, updatedAppointment.doctor_id]);

  const usersMap = {};
  if (users) {
    users.forEach(u => usersMap[u.id] = u);
  }

  const patient = usersMap[updatedAppointment.patient_id] || { full_name: updatedAppointment.patient_name || 'Unknown' };
  const doctor = usersMap[updatedAppointment.doctor_id] || { full_name: updatedAppointment.doctor_name || 'Unknown', specialization: '' };

  const enrichedAppointment = {
    ...updatedAppointment,
    users: { ...patient, name: patient.full_name },
    doctor_details: { ...doctor, name: doctor.full_name }
  };

  return ApiResponse.success(
    res,
    enrichedAppointment,
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
    .from('users')
    .select('id, full_name')
    .eq('id', patientId)
    .single();

  if (patientError || !patient) {
    throw new NotFoundError('Patient');
  }

  let query = supabase
    .from('appointments')
    .select('*')
    .eq('patient_id', patientId)
    .order('date', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data: appointments, error } = await query;

  if (error) {
    throw error;
  }

  // Manually fetch doctor details
  const doctorIds = [...new Set((appointments || []).map(a => a.doctor_id))];
  let doctorsMap = {};

  if (doctorIds.length > 0) {
    const { data: doctors } = await supabase
      .from('users')
      .select('id, full_name, specialization')
      .in('id', doctorIds);

    if (doctors) {
      doctors.forEach(d => doctorsMap[d.id] = d);
    }
  }

  const enrichedAppointments = (appointments || []).map(apt => {
    const doctor = doctorsMap[apt.doctor_id] || { full_name: apt.doctor_name || 'Unknown', specialization: '' };
    return {
      ...apt,
      doctor_details: { ...doctor, name: doctor.full_name }
    };
  });

  return ApiResponse.success(res, {
    patient: {
      id: patient.id,
      name: patient.full_name
    },
    appointments: enrichedAppointments,
    total: enrichedAppointments.length
  });
});
