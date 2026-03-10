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
  const { patient_id, doctor_id, date, time } = req.body;

  // Verify patient exists
  const { data: patient, error: patientError } = await supabase
    .from('users')
    .select('id, full_name, name')
    .eq('id', patient_id)
    .single();

  if (patientError || !patient) {
    throw new NotFoundError('Patient');
  }

  // Verify doctor exists
  const { data: doctor, error: doctorError } = await supabase
    .from('users')
    .select('id, full_name, name')
    .eq('id', doctor_id)
    .eq('role', 'doctor')
    .single();

  if (doctorError || !doctor) {
    throw new NotFoundError('Doctor');
  }

  // Create appointment
  const { data: appointmentRaw, error } = await supabase
    .from('appointments')
    .insert({
      patient_id,
      doctor_id,
      date,
      time,
      status: 'scheduled',
      created_by: req.user.id,
      updated_by: req.user.id
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

  // Manual Join: Fetch user details
  const { data: participants } = await supabase
    .from('users')
    .select('id, name, full_name, specialization')
    .in('id', [patient_id, doctor_id]);

  const pMap = {};
  participants?.forEach(u => pMap[u.id] = u);

  const appointment = {
    ...appointmentRaw,
    users: {
      id: patient_id,
      name: pMap[patient_id]?.full_name || pMap[patient_id]?.name || 'Patient'
    },
    doctor_details: {
      id: doctor_id,
      name: pMap[doctor_id]?.full_name || pMap[doctor_id]?.name || 'Doctor',
      specialization: pMap[doctor_id]?.specialization || ''
    }
  };

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
    const { data: users } = await supabase
      .from('users')
      .select('id, name, full_name, specialization')
      .in('id', Array.from(userIds));
    
    if (users) {
      users.forEach(u => usersMap[u.id] = {
        ...u,
        display_name: u.full_name || u.name || 'Doctor', // Preferred display name
        name: u.full_name || u.name || 'Doctor' // Backwards compatibility for existing code
      });
    }
  }

  const finalAppointments = (appointmentsRaw || []).map(apt => {
    const patientUser = usersMap[apt.patient_id];
    const doctorUser = usersMap[apt.doctor_id];
    
    // Mapping for doctor info
    const docInfo = { 
      id: apt.doctor_id, 
      name: doctorUser?.display_name || 'Doctor', 
      specialization: doctorUser?.specialization || '' 
    };

    return {
      ...apt,
      appointment_date: apt.date, // Alias for frontend compatibility
      users: patientUser ? { id: patientUser.id, name: patientUser.display_name } : { name: 'Patient' },
      doctor: docInfo,
      doctors: docInfo, // Plural alias for PatientDashboard
      doctor_details: docInfo
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

  const { data: appointmentRaw, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', appointmentId)
    .single();

  if (error || !appointmentRaw) {
    throw new NotFoundError('Appointment');
  }

  // Manual Join
  const { data: participants } = await supabase
    .from('users')
    .select('id, name, full_name, specialization, date_of_birth, phone')
    .in('id', [appointmentRaw.patient_id, appointmentRaw.doctor_id]);

  const pMap = {};
  participants?.forEach(u => pMap[u.id] = u);

  const appointment = {
    ...appointmentRaw,
    users: {
      id: appointmentRaw.patient_id,
      name: pMap[appointmentRaw.patient_id]?.full_name || pMap[appointmentRaw.patient_id]?.name || 'Patient',
      dob: pMap[appointmentRaw.patient_id]?.date_of_birth,
      phone: pMap[appointmentRaw.patient_id]?.phone
    },
    doctor_details: {
      id: appointmentRaw.doctor_id,
      name: pMap[appointmentRaw.doctor_id]?.full_name || pMap[appointmentRaw.doctor_id]?.name || 'Doctor',
      specialization: pMap[appointmentRaw.doctor_id]?.specialization || ''
    }
  };

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
  const { data: updatedRaw, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', appointmentId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  // Manual Join
  const { data: participants } = await supabase
    .from('users')
    .select('id, name, full_name, specialization')
    .in('id', [updatedRaw.patient_id, updatedRaw.doctor_id]);

  const pMap = {};
  participants?.forEach(u => pMap[u.id] = u);

  const updatedAppointment = {
    ...updatedRaw,
    users: {
      id: updatedRaw.patient_id,
      name: pMap[updatedRaw.patient_id]?.full_name || pMap[updatedRaw.patient_id]?.name || 'Patient'
    },
    doctor_details: {
      id: updatedRaw.doctor_id,
      name: pMap[updatedRaw.doctor_id]?.full_name || pMap[updatedRaw.doctor_id]?.name || 'Doctor',
      specialization: pMap[updatedRaw.doctor_id]?.specialization || ''
    }
  };

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
    .from('users')
    .select('id, full_name')
    .eq('id', patientId)
    .single();

  if (patientError || !patient) {
    throw new NotFoundError('Patient');
  }

  let aQuery = supabase
    .from('appointments')
    .select('*')
    .eq('patient_id', patientId)
    .order('date', { ascending: false });

  if (status) {
    aQuery = aQuery.eq('status', status);
  }

  const { data: appointmentsRaw, error } = await aQuery;

  if (error) {
    throw error;
  }

  // Manual Join for Doctors
  const doctorIds = [...new Set((appointmentsRaw || []).map(a => a.doctor_id))];
  let doctorsMap = {};
  
  if (doctorIds.length > 0) {
    const { data: doctors } = await supabase
      .from('users')
      .select('id, name, full_name, specialization')
      .in('id', doctorIds);
    
    doctors?.forEach(d => doctorsMap[d.id] = d);
  }

  const appointments = (appointmentsRaw || []).map(apt => {
    const d = doctorsMap[apt.doctor_id];
    const docInfo = {
      id: apt.doctor_id,
      name: d?.full_name || d?.name || 'Doctor',
      specialization: d?.specialization || ''
    };
    
    return {
      ...apt,
      appointment_date: apt.date, // Alias for frontend
      doctor: docInfo,
      doctors: docInfo, // Alias for PatientDashboard
      doctor_details: docInfo
    };
  });

  return ApiResponse.success(res, appointments);
});
