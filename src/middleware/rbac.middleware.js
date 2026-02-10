/**
 * Role-Based Access Control (RBAC) Middleware
 * Enforces role-based permissions for healthcare system
 * Security: Deny-by-default approach - explicit permission required
 */

import { supabase } from '../config/supabaseClient.js';
import { UnauthorizedError, OwnershipError } from '../utils/errors.js';
import { asyncHandler } from './errorHandler.middleware.js';

/**
 * Require specific role
 * Usage: requireRole('admin')
 */
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (req.user.role !== role) {
      throw new UnauthorizedError(`This action requires ${role} role`);
    }

    next();
  };
};

/**
 * Require any of the specified roles
 * Usage: requireAnyRole(['admin', 'doctor', 'nurse'])
 */
export const requireAnyRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new UnauthorizedError(
        `This action requires one of these roles: ${roles.join(', ')}`
      );
    }

    next();
  };
};

/**
 * Require patient role OR admin override
 * Patients can only access their own data
 */
export const requirePatientOrAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  // Admin can access anything
  if (req.user.role === 'admin') {
    req.isAdmin = true;
    return next();
  }

  // Must be patient role
  if (req.user.role !== 'patient') {
    throw new UnauthorizedError('This action is only available to patients');
  }

  // Get patient record linked to this user
  const { data: patient, error } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', req.user.id)
    .single();

  if (error || !patient) {
    throw new UnauthorizedError('No patient record linked to this account');
  }

  req.patientId = patient.id;
  next();
});

/**
 * Require doctor role and verify doctor record exists
 */
export const requireDoctor = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
    throw new UnauthorizedError('This action requires doctor role');
  }

  // Get doctor record linked to this user
  const { data: doctor, error } = await supabase
    .from('doctors')
    .select('id, name, specialization, department_id')
    .eq('user_id', req.user.id)
    .single();

  if (error || !doctor) {
    throw new UnauthorizedError('No doctor record linked to this account');
  }

  req.doctorId = doctor.id;
  req.doctor = doctor;
  next();
});

/**
 * Verify medical record ownership
 * Only the doctor who created the record can modify it
 */
export const requireRecordOwnership = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const recordId = req.params.recordId || req.params.id;

  if (!recordId) {
    throw new UnauthorizedError('Record ID required');
  }

  // Get the medical record
  const { data: record, error } = await supabase
    .from('medical_records')
    .select('id, created_by, doctor_id, patient_id')
    .eq('id', recordId)
    .single();

  if (error || !record) {
    throw new OwnershipError('Medical record not found');
  }

  // Admin can modify any record
  if (req.user.role === 'admin') {
    req.record = record;
    return next();
  }

  // Must be the doctor who created it
  if (record.created_by !== req.user.id) {
    throw new OwnershipError('You can only modify records you created');
  }

  req.record = record;
  next();
});

/**
 * Verify appointment ownership
 * Patient can only access their own appointments
 * Doctor can access appointments where they are the assigned doctor
 */
export const requireAppointmentAccess = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const appointmentId = req.params.appointmentId || req.params.id;

  if (!appointmentId) {
    throw new UnauthorizedError('Appointment ID required');
  }

  // Get the appointment
  const { data: appointment, error } = await supabase
    .from('appointments')
    .select('id, patient_id, doctor_id, status, created_by')
    .eq('id', appointmentId)
    .single();

  if (error || !appointment) {
    throw new OwnershipError('Appointment not found');
  }

  // Admin can access any appointment
  if (req.user.role === 'admin') {
    req.appointment = appointment;
    return next();
  }

  // Patient must own the appointment
  if (req.user.role === 'patient') {
    const { data: patient } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!patient || patient.id !== appointment.patient_id) {
      throw new OwnershipError('You can only access your own appointments');
    }

    req.appointment = appointment;
    req.patientId = patient.id;
    return next();
  }

  // Doctor must be assigned to the appointment
  if (req.user.role === 'doctor') {
    const { data: doctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!doctor || doctor.id !== appointment.doctor_id) {
      throw new OwnershipError('You can only access appointments assigned to you');
    }

    req.appointment = appointment;
    req.doctorId = doctor.id;
    return next();
  }

  throw new UnauthorizedError('Insufficient permissions');
});
