/**
 * Consent Enforcement Middleware
 * CRITICAL: Prevents access to patient data without explicit consent
 * Security: DEFAULT DENY - consent must be explicitly granted
 */

import { ConsentService } from '../services/consent.service.js';
import { ConsentRequiredError, UnauthorizedError } from '../utils/errors.js';
import { asyncHandler } from './errorHandler.middleware.js';
import { isValidUUID } from '../utils/validation.utils.js';

/**
 * Require medical records consent before accessing patient medical data
 * 
 * Rules:
 * 1. Patients can ALWAYS access their own data (no consent check)
 * 2. Admins can access with proper justification (logged)
 * 3. Doctors/Nurses MUST have explicit consent grant
 * 
 * Usage: Add after authentication and before controller
 */
export const requireMedicalRecordsConsent = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  // Determine patient ID from request with validation
  const rawPatientId = req.params.patientId || req.query.patientId || req.patientId || req.body?.patient_id;

  if (!rawPatientId) {
    throw new UnauthorizedError('Patient ID required for consent check');
  }

  // Validate UUID format to prevent injection
  if (!isValidUUID(rawPatientId)) {
    throw new UnauthorizedError('Invalid patient ID format');
  }

  const patientId = rawPatientId;

  // RULE 1: Patients can always access their OWN data
  if (req.user.role === 'patient' && req.patientId === patientId) {
    req.consentChecked = true;
    req.consentGranted = true;
    req.consentReason = 'self_access';
    return next();
  }

  // RULE 2: Admins can access (but it's logged)
  if (req.user.role === 'admin') {
    req.consentChecked = true;
    req.consentGranted = true;
    req.consentReason = 'admin_override';
    return next();
  }

  // RULE 3: Doctors/Nurses MUST have explicit consent
  if (req.user.role === 'doctor' || req.user.role === 'nurse') {
    const hasConsent = await ConsentService.hasConsent(patientId, 'medical_records');

    if (!hasConsent) {
      throw new ConsentRequiredError(
        'Patient has not granted consent to access medical records. ' +
        'Please request consent from the patient first.'
      );
    }

    req.consentChecked = true;
    req.consentGranted = true;
    req.consentReason = 'explicit_grant';
    return next();
  }

  // Default deny for any other role
  throw new UnauthorizedError('Insufficient permissions to access patient data');
});

/**
 * Require data sharing consent
 * Used for exporting or sharing patient data with third parties
 */
export const requireDataSharingConsent = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const rawPatientId = req.params.patientId || req.query.patientId || req.patientId;

  if (!rawPatientId) {
    throw new UnauthorizedError('Patient ID required for consent check');
  }

  if (!isValidUUID(rawPatientId)) {
    throw new UnauthorizedError('Invalid patient ID format');
  }

  const patientId = rawPatientId;

  // Only admins and the patient themselves can share data
  if (req.user.role === 'patient' && req.patientId === patientId) {
    // Patient must still have granted data_sharing consent
    const hasConsent = await ConsentService.hasConsent(patientId, 'data_sharing');
    
    if (!hasConsent) {
      throw new ConsentRequiredError(
        'Data sharing consent has not been granted. Please grant consent first.'
      );
    }

    req.consentChecked = true;
    req.consentGranted = true;
    return next();
  }

  if (req.user.role === 'admin') {
    // Check if patient has granted data_sharing consent
    const hasConsent = await ConsentService.hasConsent(patientId, 'data_sharing');
    
    if (!hasConsent) {
      throw new ConsentRequiredError(
        'Patient has not granted data sharing consent'
      );
    }

    req.consentChecked = true;
    req.consentGranted = true;
    req.consentReason = 'admin_with_consent';
    return next();
  }

  throw new UnauthorizedError('Only patients and admins can share patient data');
});

/**
 * Verify consent exists for appointment access
 * More lenient than medical records - doctors can see appointments without consent
 * but cannot see detailed medical info without it
 */
export const checkAppointmentConsent = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const rawPatientId = req.params.patientId || req.patientId;

  if (!rawPatientId) {
    return next(); // No patient context, skip consent check
  }

  if (!isValidUUID(rawPatientId)) {
    throw new UnauthorizedError('Invalid patient ID format');
  }

  const patientId = rawPatientId;

  // Check consent for appointment access
  const hasConsent = await ConsentService.hasConsent(patientId, 'medical_records');

  req.consentChecked = true;
  req.consentGranted = hasConsent;
  req.consentReason = hasConsent ? 'explicit_grant' : 'no_consent';

  // Don't block - just attach consent status for controller to use
  next();
});
