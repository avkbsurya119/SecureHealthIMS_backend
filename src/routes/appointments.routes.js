/**
 * Appointments Routes
 * Secure endpoints for appointment management
 */

import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAnyRole, requireAppointmentAccess } from '../middleware/rbac.middleware.js';
import { auditLog } from '../middleware/audit.middleware.js';
import { validate, validateUUID, schemas } from '../middleware/validation.middleware.js';
import {
  createAppointment,
  getMyAppointments,
  getAppointment,
  updateAppointmentStatus,
  getPatientAppointments
} from '../controllers/appointments.controller.js';

const router = express.Router();

/**
 * POST /api/appointments
 * Create a new appointment
 * 
 * Security:
 * - Requires doctor, nurse, or admin role
 * - Validates input
 * - Logs creation
 */
router.post(
  '/',
  authenticate,
  requireAnyRole(['admin', 'doctor', 'nurse']),
  validate(schemas.appointment.create),
  auditLog('appointments'),
  createAppointment
);

/**
 * GET /api/appointments/me
 * Get my appointments (patient or doctor view)
 * 
 * Security:
 * - Patient sees their own appointments
 * - Doctor sees appointments assigned to them
 * - Admin sees all
 */
router.get(
  '/me',
  authenticate,
  auditLog('appointments'),
  getMyAppointments
);

/**
 * GET /api/appointments/patient/:patientId
 * Get all appointments for a specific patient
 * 
 * Security:
 * - Admin can access
 * - Doctor/Nurse with proper permissions
 */
router.get(
  '/patient/:patientId',
  authenticate,
  validateUUID('patientId'),
  requireAnyRole(['admin', 'doctor', 'nurse']),
  auditLog('appointments'),
  getPatientAppointments
);

/**
 * GET /api/appointments/:appointmentId
 * Get a specific appointment
 * 
 * Security:
 * - Requires appointment access (patient owns it or doctor assigned)
 */
router.get(
  '/:appointmentId',
  authenticate,
  validateUUID('appointmentId'),
  requireAppointmentAccess,
  auditLog('appointments'),
  getAppointment
);

/**
 * PATCH /api/appointments/:appointmentId/status
 * Update appointment status
 * 
 * Security:
 * - Validates status transitions
 * - Requires appointment access
 * - Logs status changes
 */
router.patch(
  '/:appointmentId/status',
  authenticate,
  validateUUID('appointmentId'),
  requireAppointmentAccess,
  validate(schemas.appointment.updateStatus),
  auditLog('appointments'),
  updateAppointmentStatus
);

export default router;
